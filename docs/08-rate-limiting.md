# Rate limiting

Cartura rate-limits requests at two independent application boundaries:

```text
browser
  -> Next.js BFF limiter
  -> Express coarse limiter
  -> Express route-policy limiter
  -> controller and business logic
```

The counters are not shared between the BFF and Express. A request that passes through both layers consumes counters in both systems. This defense-in-depth design lets Next.js reject abusive web traffic before forwarding it, while Express remains protected independently from bugs, alternate trusted consumers, or multiple frontend entry points.

Authentication is an exception. Better Auth owns a separate database-backed limiter for `/api/v1/auth/*`; those routes run before the general Express coarse limiter.

## Terms used in this document

- A **policy** is a named limit and time window, such as `checkout = 5 requests per 10 minutes`.
- An **identifier** is the caller identity charged by a policy, such as a client IP, session token, or authenticated user ID.
- A **coarse limit** is the broad IP limit applied in addition to a more specific policy.
- **Fail open** means a request continues when the counter store is unavailable.
- **Fail closed** means a sensitive request is rejected with `503` when the counter store cannot be checked.

## Frontend BFF rate limiting

The BFF limiter lives in `frontend/src/shared/rate-limit.ts`; its policy values live in `frontend/src/shared/rate-limit.config.ts`. It is server-only code and is called explicitly by protected Server Actions and Next.js Route Handlers. It is not global Next.js middleware, so ordinary page requests, static assets, and Server Component reads do not automatically consume a BFF counter.

Current coverage includes:

- `read`: browser-facing category and notification Route Handlers;
- `mutation`: account, address, cart, catalog, and notification mutations;
- `media`: product-image and category-banner upload/delete operations;
- `checkout`: cart checkout and buy-now actions;
- `privileged`: role, user-status, order-status, refund, destructive catalog, and webhook-reprocessing actions.

Server Component reads that call Express directly are still protected by the Express policies described below.

### What happens for one protected BFF operation

`enforceBffRateLimit(policyName)` performs these steps:

1. If `BFF_RATE_LIMIT_ENABLED=false`, it returns without reading or changing any counter.
2. It reads the trusted client IP from request headers. On Vercel it accepts the first IP in `x-vercel-forwarded-for`. Elsewhere it checks `x-forwarded-for` and then `x-real-ip`. Values must be valid IPv4 or IPv6 addresses; otherwise the identifier becomes `unknown`.
3. It reads the Cartura session token from the HTTP-only session cookie.
4. It hashes `ip:<client-ip>` with SHA-256 and consumes the BFF `coarse` policy.
5. It chooses the requested policy identifier:
   - authenticated request: SHA-256 of `session:<session-token>`;
   - unauthenticated request: the same hashed IP identifier used by `coarse`.
6. It consumes the requested `read`, `mutation`, `media`, `checkout`, or `privileged` policy.
7. It runs the protected operation only if both counter checks allow it.

The raw IP and session token are not stored as rate-limit keys. The Base64URL-encoded SHA-256 hashes are used instead. A BFF policy is per session, not per user account, so two active sessions for the same user have separate BFF policy counters. Their coarse counters are still shared when they originate from the same IP.

The checks are sequential. If `coarse` rejects the request, the specific policy is not consumed. If the specific policy rejects it, the earlier `coarse` hit remains consumed.

### BFF policies

| Policy | Limit | Window | Store failure | Typical purpose |
| --- | ---: | ---: | --- | --- |
| `coarse` | 300 | 5 minutes | Fail open | Broad protection per client IP |
| `read` | 120 | 1 minute | Fail open | Browser JSON reads and polling |
| `mutation` | 30 | 1 minute | Fail open | Normal creates, updates, and deletes |
| `media` | 20 | 10 minutes | Fail closed | Uploading or deleting media |
| `checkout` | 5 | 10 minutes | Fail closed | Checkout and buy-now |
| `privileged` | 10 | 10 minutes | Fail closed | High-impact customer or management operations |

Every protected operation consumes `coarse` plus one other row. The effective allowance is whichever applicable counter is exhausted first.

### BFF stores and window algorithms

In production, the BFF uses Upstash Redis over its REST API. Each policy gets an Upstash limiter with a prefix shaped like:

```text
<BFF_RATE_LIMIT_NAMESPACE>:<policy>
```

It uses Upstash's `slidingWindow` algorithm. That algorithm weights requests in the previous time bucket according to how far the current bucket has progressed, then combines that value with the current bucket. This reduces the burst allowed at a fixed-window boundary. Calls have a two-second timeout.

In development and tests, the BFF does not use Upstash even if Upstash credentials are present. It uses a module-level `Map` with a fixed window that begins on the first hit. These counters are local to one Next.js process, disappear on restart, and are not shared across instances. They are suitable for local feedback, not distributed production enforcement.

### BFF rejection and failure behavior

A local BFF limit rejection becomes HTTP `429` for Route Handlers with:

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Try again in 42 seconds."
  }
}
```

The response includes `Retry-After` and a draft-style `RateLimit` value containing the limit, remaining count, and reset time. Server Actions receive `BffRateLimitError`; Cartura's action-result helpers preserve its shared code and `retryAfterSeconds` so UI code can show a useful retry message.

When Upstash times out or throws:

- `coarse`, `read`, and `mutation` log the failure and allow the request;
- `media`, `checkout`, and `privileged` stop the operation with `503 RATE_LIMIT_UNAVAILABLE`.

Fail-open policies prioritize availability for ordinary traffic. Fail-closed policies prevent expensive, financial, destructive, or privileged operations from running without abuse protection.

## Backend Express and Redis rate limiting

The backend policies live in `backend/src/config/rate-limit.ts`. `backend/src/shared/middleware/rate-limit.ts` creates the Express middleware, and `backend/src/infrastructure/rate-limit-redis.client.ts` owns the dedicated Redis connection.

### Middleware order and request cost

For non-authentication API routes, the important order is:

```text
request context
  -> trusted BFF authentication and client-IP adoption
  -> coarse API limiter
  -> JSON/form parser
  -> account restriction check
  -> route authentication when required
  -> route-policy limiter
  -> permissions
  -> controller
```

This order has concrete effects:

- requests that fail BFF-to-Express authentication do not consume rate-limit counters;
- the coarse limiter runs before general body parsing and protects all non-auth `/api/v1/*` routes;
- a normal API request consumes the IP-based `coarse` counter and then its route-policy counter;
- authenticated route policies normally use the user ID because authentication middleware has populated the principal before the limiter runs;
- public catalog reads fall back to IP because there is no authenticated principal;
- the Paymob webhook uses IP for both `coarse` and `webhook` policies;
- `/health` and `/docs` are outside `/api/v1` and are not handled by these policies;
- `/api/v1/auth/*` is mounted before `coarse` and is handled by Better Auth's limiter instead.

As in the BFF, checks are sequential. A coarse rejection prevents the route policy from being consumed; a route-policy rejection occurs after the coarse hit was already recorded.

### Backend identifiers and keys

The `coarse` and `webhook` policies always identify the caller by IP. The other route policies prefer the authenticated user ID and fall back to IP when no user principal exists.

The source value is normalized as `user:<user-id>` or `ip:<normalized-ip>`, hashed with SHA-256, and encoded as Base64URL. In production, a Redis key is effectively shaped like:

```text
<RATE_LIMIT_REDIS_PREFIX>:<policy>:<sha256-identifier>
```

IPv6 addresses are normalized by `express-rate-limit` using a `/56` subnet before hashing, which prevents a caller from trivially rotating through addresses in one IPv6 allocation.

For normal BFF traffic, Next.js sends the validated client IP in `x-cartura-client-ip` together with authenticated internal-service headers. Express accepts that custom IP only after the BFF identity succeeds, then stores it in the request context used by the limiter. This prevents arbitrary public clients from claiming another IP through that header.

For traffic that does not receive a trusted BFF client IP, including the public Paymob webhook, Express uses `req.ip`. `TRUST_PROXY` therefore must describe the real reverse-proxy topology correctly. An overly broad value can let a client spoof forwarded IPs; an unset value behind a proxy can group all traffic under the proxy's address.

### Backend policies

| Policy | Limit | Window | Store failure | Typical routes |
| --- | ---: | ---: | --- | --- |
| `coarse` | 600 | 5 minutes | Fail open | Every non-auth `/api/v1/*` request |
| `read` | 240 | 1 minute | Fail open | Catalog, account, management, and notification reads |
| `mutation` | 60 | 1 minute | Fail open | Cart, address, notification, and catalog changes |
| `media` | 40 | 10 minutes | Fail closed | Media upload and deletion |
| `checkout` | 10 | 10 minutes | Fail closed | Checkout and buy-now |
| `privileged` | 20 | 10 minutes | Fail closed | Roles, user status, order status, refunds, destructive changes |
| `webhook` | 300 | 1 minute | Fail closed | Incoming Paymob webhook |

The BFF limits are intentionally lower than the equivalent Express route limits. For ordinary traffic passing through one correctly configured BFF, Next.js should reject first. Express still has its own larger budget as the authoritative API safety net.

### Redis lifecycle and fixed windows

Production creates a dedicated `ioredis` client only when `RATE_LIMIT_ENABLED=true`. Startup connects lazily and sends `PING` before the HTTP server begins listening. If Redis cannot be reached at startup, backend startup fails instead of serving production traffic with unexpectedly local counters.

The Redis client disables the offline queue and permits one retry per request. Each increment is performed atomically by `rate-limit-redis` using a Lua script:

1. the first hit sets the counter to `1` with a TTL equal to the policy window;
2. later hits atomically increment the same key without extending its TTL;
3. the key expires at the reset time, and the next request starts a new window.

This is a fixed window anchored to the first hit for that key. Because Redis is shared, all Express instances see the same counters.

In development and tests, the Redis client is deliberately `null`; `express-rate-limit` uses its in-memory store. Local counters are per process and reset on restart. `REDIS_URL` can still be used by background workers, but it does not make development API rate counters distributed.

At graceful shutdown, the backend stops the HTTP server and workers, closes the rate-limit Redis client, and disconnects PostgreSQL.

### Backend rejection and failure behavior

The Express limiter uses standard draft-8 rate-limit headers and disables legacy `X-RateLimit-*` generation. Successful limited responses expose the current `RateLimit` and `RateLimit-Policy` metadata. A rejection returns HTTP `429`, includes `Retry-After`, and flows through the shared error handler as:

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Try again in 42 seconds.",
    "requestId": "...",
    "details": {
      "retryAfterSeconds": 42,
      "policy": "checkout"
    }
  }
}
```

If Redis fails while the server is running:

- `coarse`, `read`, and `mutation` pass the request after logging the store error;
- `media`, `checkout`, `privileged`, and `webhook` return `503 RATE_LIMIT_UNAVAILABLE`.

The frontend server API adapter preserves `Retry-After`, `RateLimit`, `RateLimit-Policy`, legacy rate-limit headers if an upstream emits them, and `X-Request-Id`. It turns a backend rejection into `ApiError` with `code` and `retryAfterSeconds`. Server Action result helpers expose those fields to the UI, while genuine BFF Route Handlers forward the supported headers back to the browser.

## End-to-end checkout example

For an authenticated `checkoutCartAction`, one successful attempt normally does all of the following:

1. validates the action input;
2. consumes BFF `coarse`: 1 of 300 per 5 minutes for the client IP;
3. consumes BFF `checkout`: 1 of 5 per 10 minutes for that session token;
4. sends the request to Express with trusted BFF authentication and the client IP;
5. consumes backend `coarse`: 1 of 600 per 5 minutes for the client IP;
6. authenticates the Cartura user;
7. consumes backend `checkout`: 1 of 10 per 10 minutes for the user ID;
8. runs the checkout controller and service.

On the sixth BFF checkout attempt inside the applicable sliding window, Next.js normally rejects before calling Express. If the BFF limiter is disabled or unavailable in a fail-open policy, the backend remains independently capable of rejecting its own exhausted counter.

## Better Auth's separate limiter

`/api/v1/auth/*` does not use the Express Redis policies above. Better Auth is configured with `storage: "database"`, backed by the Prisma `AuthRateLimit` model and the `auth_rate_limits` PostgreSQL table.

With the current Better Auth version and Cartura configuration:

- the limiter is enabled by Better Auth in production and disabled by default in development/tests;
- the general default is 100 requests per 10 seconds per IP and auth path;
- sign-in, sign-up, password-change, and email-change paths use 3 requests per 10 seconds;
- password-recovery, verification-email, and email-OTP delivery paths use 3 requests per 60 seconds;
- Better Auth returns `429` with `X-Retry-After` when its quota is exceeded.

This limiter is not controlled by `RATE_LIMIT_ENABLED` or `BFF_RATE_LIMIT_ENABLED`. Its IP lookup is also separate from Cartura's Express request-context lookup. The auth BFF currently forwards Cartura's trusted IP through `x-cartura-client-ip`, while Better Auth defaults to reading `x-forwarded-for`. If no trusted header reaches Better Auth in production, it logs a warning and uses one shared per-path fallback bucket. Deployment changes around authentication proxies must account for this explicitly.

## Environment variables

### Frontend BFF

These variables belong in `frontend/.env` for local work and in the Next.js deployment environment for production. None should use a `NEXT_PUBLIC_*` prefix.

| Variable | Local value | Purpose |
| --- | --- | --- |
| `BFF_RATE_LIMIT_ENABLED` | `true` | Enables the explicit BFF checks. Only the exact string `false` disables them. |
| `BFF_RATE_LIMIT_NAMESPACE` | `cartura:rl:bff` | Prefix separating Cartura's BFF counters from other applications and environments. Use a distinct value per deployed environment if Redis is shared. |
| `UPSTASH_REDIS_REST_URL` | empty | Upstash REST endpoint used only by the production BFF limiter. Required in production when the BFF limiter is enabled. |
| `UPSTASH_REDIS_REST_TOKEN` | empty | Secret token authenticating Upstash REST requests. Required with the URL; keep it server-only. |

Empty Upstash values are correct for local development because `NODE_ENV` selects the in-memory provider. A production build with BFF rate limiting enabled throws during configuration loading if either Upstash value is missing.

### Backend Express

These variables belong in `backend/.env` for local work and in the Express deployment environment for production.

| Variable | Local value | Purpose |
| --- | --- | --- |
| `RATE_LIMIT_ENABLED` | `true` | Enables Express coarse and route-policy limiters. The exact string `false` skips them and prevents creation of the production rate-limit Redis client. It does not disable Better Auth's limiter. |
| `RATE_LIMIT_REDIS_PREFIX` | `cartura:rl:api` | Base prefix for backend Redis counter keys. Each policy adds its own suffix. Use a distinct value per environment when sharing Redis. |
| `REDIS_URL` | `redis://localhost:6379` | Redis connection used by the production Express limiter and other Redis-backed backend infrastructure. It must use `redis://` or TLS-enabled `rediss://`. Production startup validation requires it when rate limiting is enabled. |
| `TRUST_PROXY` | empty | Configures Express's `trust proxy` setting for deriving `req.ip` from the real proxy chain. Empty or `false` disables trust; `true` trusts the nearest forwarded chain; digits become hop counts; other strings are passed to Express as proxy/subnet configuration. |

Policy limits themselves are code constants, not environment variables. Change them in the two rate-limit config modules and review BFF/backend headroom together; changing only one layer can make the other layer the unexpected effective limit.

## Deployment checklist

- Keep the BFF and Express base URLs, Redis credentials, and Upstash token server-only.
- Set unique BFF and backend prefixes for development, preview, staging, and production when they share a Redis database.
- Configure Upstash credentials on every production Next.js instance.
- Configure a valid `redis://` or `rediss://` URL on every production Express instance.
- Set `TRUST_PROXY` to the exact Express proxy topology; do not set `true` without understanding the network path.
- Ensure the platform-provided client-IP header used by the BFF cannot be spoofed at the public edge.
- Keep BFF-to-Express authentication enabled in production so `x-cartura-client-ip` is trusted only from the BFF.
- Exercise a `429` and a store-outage `503` in staging for both a fail-open and a fail-closed policy.
- Monitor `RATE_LIMIT_EXCEEDED`, `RATE_LIMIT_UNAVAILABLE`, Redis connection errors, and BFF store timeout logs.

Previous: [Testing and quality](07-testing-and-quality.md). Next: [Hosting and deployment](09-hosting-and-deployment.md).

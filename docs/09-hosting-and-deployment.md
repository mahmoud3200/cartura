# Hosting and deployment

Cartura is not a single stateless web process. A production deployment has a
Next.js frontend and BFF, a persistent Express API, PostgreSQL, Redis-backed
rate limits and BullMQ work, and several external providers. Host each part on
the runtime that matches its lifecycle instead of forcing the whole monorepo
onto one serverless platform.

## Recommended production topology

The recommended managed setup is:

```text
browser
  -> Vercel: Next.js frontend and BFF (https://shop.example.com)
       -> Upstash Redis REST: BFF rate limits
       -> HTTPS + Vercel OIDC
          -> Railway: Express API and BullMQ workers (https://api.example.com)
               -> Railway private network: PostgreSQL
               -> Railway private network: Redis
               -> Cloudinary, SMTP, Google OAuth, and Paymob
```

Use these providers for the following responsibilities:

| Component | Recommended host | Reason |
| --- | --- | --- |
| Next.js frontend and BFF | Vercel | Native Next.js runtime, CDN, preview deployments, and the OIDC token flow already implemented in Cartura. |
| Express API and BullMQ workers | Railway | A persistent Node.js process can listen for HTTP traffic and keep Redis-backed workers running. |
| PostgreSQL | Railway Postgres | It can remain on the same private network and in the same deployment region as Express. |
| Backend Redis | Railway Redis | BullMQ and `ioredis` need a normal Redis connection close to the persistent backend. |
| BFF rate-limit Redis | Upstash Redis | The Next.js BFF already uses the Upstash REST client, which fits serverless functions. |
| Transactional email | Resend SMTP on Railway Pro, or an HTTPS provider adapter | Cartura needs reliable delivery for authentication codes and commerce notifications. |
| Product media | Cloudinary | Cartura stores media metadata in PostgreSQL but delegates image storage and transformation. |

This split follows the current application boundaries. Vercel Functions have a
finite invocation lifetime, while `backend/src/server.ts` starts scheduled
BullMQ work and keeps it alive for the life of the API process. Do not deploy
the current Express server as a Vercel Function unless background work is first
extracted into a different durable worker architecture.

Railway is the recommended starting point, not a permanent scaling ceiling. A
larger installation can later move Express, PostgreSQL, and Redis to AWS, GCP,
Azure, or Kubernetes without changing the frontend/BFF boundary.

## Public and private network boundaries

Use an apex or storefront domain for Next.js and a dedicated API subdomain:

```text
https://example.com       -> Vercel
https://api.example.com   -> Railway Express service
```

The API needs a public HTTPS origin because Vercel calls it over the internet
and Paymob must reach its webhook. Public reachability does not mean that all
API routes are public:

- `/api/v1/*` requires a trusted BFF credential;
- the configured Paymob webhook is the deliberate public exception;
- `/health` and `/docs` are public operational endpoints;
- PostgreSQL and backend Redis must stay private and must not receive public
  TCP endpoints unless an explicit maintenance task requires temporary access.

Vercel OIDC is preferred over a shared secret. It gives the frontend
short-lived signed credentials and lets Express restrict tokens to one Vercel
team, project, and environment. Cartura already obtains the token through
`@vercel/oidc` and validates its issuer, audience, subject, and signature in
Express.

## Deployment order

Provision production in this order:

1. Create the Railway project, PostgreSQL service, Redis service, and backend
   service.
2. Configure the backend build, migration, start, health-check, domain, and
   environment settings.
3. Apply migrations and deploy the backend. Confirm that `/health` returns
   `200` over HTTPS.
4. Create the Upstash Redis database for the BFF rate limiter.
5. Import the frontend into Vercel, configure OIDC and environment variables,
   and deploy it.
6. Attach the final frontend and API domains, then update any temporary URLs in
   both deployments.
7. Configure Google and Paymob callback URLs only after the final HTTPS domains
   work.
8. Run the production smoke tests and enable monitoring and backups.

Deploy the backend before the frontend. Some Next.js production-build paths can
read catalog data from Express, so the configured `CARTURA_API_URL` should be
reachable during the Vercel build as well as at runtime.

## Deploy the backend on Railway

### Service layout

Create one Railway project and add:

- a service sourced from this Git repository, named `backend`;
- a PostgreSQL database service;
- a Redis database service.

Cartura is a shared pnpm monorepo. Leave the backend service root at the
repository root so the build can read the root lockfile and
`packages/contracts`. Do not set its root to `/backend`.

Use these backend service commands:

| Setting | Command or value |
| --- | --- |
| Build command | `pnpm --filter @cartura/contracts build && pnpm --filter @cartura/backend build` |
| Pre-deploy command | `pnpm --filter @cartura/backend prisma:deploy` |
| Start command | `pnpm --filter @cartura/backend start` |
| Health-check path | `/health` |
| Restart policy | `Always` for a paid production service |

Railway should install the workspace with the pnpm version pinned in the root
`package.json`. If an explicit install command is needed, use:

```bash
pnpm install --frozen-lockfile
```

The pre-deploy command uses `prisma migrate deploy`, which applies committed
migrations without creating new ones or seeding development data. Never use
`prisma migrate dev`, `prisma db push`, or `pnpm dev:setup` as a production
release command.

An empty production database also needs Cartura's authorization roles and its
first super-admin. For the first deployment only, set a strong bootstrap email
and password, enable `SUPER_ADMIN_BOOTSTRAP_ENABLED`, and temporarily use:

```bash
pnpm --filter @cartura/backend prisma:deploy && pnpm --filter @cartura/backend exec prisma db seed
```

With `NODE_ENV=production`, this seeds the authorization model and configured
super-admin without creating development users. After it succeeds, restore the
normal migration-only pre-deploy command, set bootstrap to `false`, and remove
the bootstrap password. Do not attach `prisma db seed` to every release.

The server reads Railway's injected `PORT`; do not hard-code it. Start with one
backend replica. Add replicas only after checking PostgreSQL connection limits,
Redis capacity, BullMQ concurrency, and provider quotas. The current process
runs both the API and workers, so they scale together. Extract a dedicated
worker service later if their scaling or release needs diverge.

Place the backend, PostgreSQL, and Redis in the same Railway environment and
deployment region. Select the region based on measured latency to the primary
customers and external providers, then keep the data services beside the API.

### Backend environment variables

Set Railway reference variables rather than copying database credentials. The
service names in the expressions must match the names in the Railway project:

```dotenv
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
```

Configure the core production values:

| Variable | Production guidance |
| --- | --- |
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Reference the private Railway PostgreSQL URL. |
| `REDIS_URL` | Reference the private Railway Redis URL. Use `redis://` or `rediss://`. |
| `FRONTEND_URL` | Final Vercel HTTPS origin, with no path. |
| `CORS_ORIGINS` | Empty when there is one frontend; otherwise comma-separated exact HTTPS origins. Never use `*` with credentials. |
| `BETTER_AUTH_SECRET` | A generated secret of at least 32 characters, stored only in Railway. |
| `INTERNAL_API_AUTH_MODE` | `vercel-oidc` for the recommended topology. |
| `VERCEL_OIDC_ISSUER` | Team issuer, normally `https://oidc.vercel.com/<team-slug>`. |
| `VERCEL_OIDC_AUDIENCE` | `https://vercel.com/<team-slug>`. |
| `VERCEL_OIDC_SUBJECT` | `owner:<team-slug>:project:<project-name>:environment:production`. |
| `BACKGROUND_WORKERS_ENABLED` | `true`. |
| `BULLMQ_PREFIX` | A unique environment value such as `cartura:production`. |
| `RATE_LIMIT_ENABLED` | `true`. |
| `RATE_LIMIT_REDIS_PREFIX` | A unique value such as `cartura:production:rl:api`. |
| `TRUST_PROXY` | Configure the exact proxy topology. Start with a single trusted Railway edge hop and verify the derived client IP in staging; account for any extra CDN or proxy. |
| `SUPER_ADMIN_BOOTSTRAP_ENABLED` | Make an explicit first-deploy decision. Keep it `false` after bootstrap is complete. |

Do not set `PORT` unless Railway health checks cannot discover the injected
port. Keep environment-specific Redis and BullMQ prefixes even when databases
are already separate; the prefix is cheap protection against accidental
cross-environment queue or rate-limit collisions.

Add provider variables only for enabled features:

- SMTP: `MAIL_FROM`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, and
  `SMTP_PASS`;
- Google OAuth: `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`;
- Cloudinary: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`,
  `CLOUDINARY_API_SECRET`, and `CLOUDINARY_UPLOAD_FOLDER`;
- Paymob: the API, secret, public, HMAC, and integration credentials plus the
  callback URLs.

For the domain example above, Paymob should normally use:

```dotenv
PAYMOB_WEBHOOK_URL=https://api.example.com/api/v1/payments/paymob/webhook
PAYMOB_REDIRECTION_URL=https://example.com/checkout/return
```

Register `https://example.com/api/v1/auth/callback/google` with Google when
Google sign-in is enabled. Provider dashboards require exact callback URLs;
confirm them against the deployed route before enabling the integration.

## Production email

### What Cartura sends

Cartura sends transactional email, not marketing campaigns. The current email
paths include:

- email-verification, password-reset, email-change, and email two-factor codes;
- order placed and order-status notifications;
- payment success and failure notifications;
- return and refund lifecycle notifications.

Authentication email is sent while the authentication request is in progress,
so an unavailable provider can prevent verification, reset, or two-factor
completion. Order, payment, and refund email is created through the
transactional outbox and notification worker, which can retry temporary send
failures without holding the original request open.

The current implementation in `backend/src/infrastructure/mail` uses Nodemailer
and SMTP only. It requires both `SMTP_USER` and `SMTP_PASS`; missing credentials
cause a send to fail. Any provider with authenticated SMTP can therefore be
used without changing application code. An HTTPS email API requires a new mail
infrastructure adapter but should preserve the existing `MailService` boundary.

### Railway's SMTP restriction

Railway permits outbound SMTP only on Pro plans and above. Free, Trial, and
Hobby services must call a transactional email provider through HTTPS instead.
This creates two valid production paths:

1. Use Railway Pro and configure Cartura's existing SMTP transport.
2. Stay on a lower Railway plan and add a Resend, Postmark, SES, SendGrid, or
   Mailgun HTTPS API adapter before expecting production email to work.

Changing SMTP hosts does not bypass a platform-level SMTP block. If the backend
will stay on Railway Hobby, budget the API-adapter work as part of deployment.

### Provider options

| Option | Works with the current code? | Best fit | Important tradeoff |
| --- | --- | --- | --- |
| Resend SMTP | Yes, on a host that permits SMTP | Smallest setup and the default recommendation for Cartura today | Railway Pro is required; Resend notes that detailed SMTP server logs are not exposed. |
| Postmark SMTP | Yes, on a host that permits SMTP | Transactional-only workloads that prioritize message streams, delivery visibility, and bounce tooling | Use its transactional SMTP endpoint and STARTTLS; the HTTP API exposes richer immediate errors than SMTP. |
| Amazon SES SMTP | Yes, on a host that permits SMTP | Higher volume or teams already operating in AWS | Requires regional SMTP credentials, verified identities, DNS work, and moving the account out of the SES sandbox. |
| SendGrid, Mailgun, or Brevo SMTP | Yes, on a host that permits SMTP | Existing vendor relationships or feature preferences | Limits, suppression behavior, logging, and domain setup vary by provider. |
| Gmail or Google Workspace SMTP | Technically | Local development or a temporary very-low-volume store | Account quotas and credential policy make it a poor default for security codes and commerce notifications. |
| Provider HTTPS API | No; add an adapter | Railway Free/Hobby, structured provider errors, idempotency, and richer metadata | Requires code and tests, but avoids SMTP network restrictions and is the preferred long-term integration. |

Do not use a personal mailbox as the production sending system. Authentication
codes and order updates are operational dependencies; use a transactional
provider with delivery logs, bounce and complaint visibility, credential
rotation, and verified-domain sending.

The `smtp.gmail.com` value in `backend/.env.example` is a local configuration
default, not the production recommendation.

### Recommended no-code-change setup: Resend SMTP

For the current repository on Railway Pro, start with Resend SMTP. Create a
Resend API key, verify a sending domain or subdomain, and set:

```dotenv
MAIL_FROM=Cartura <no-reply@updates.example.com>
SMTP_HOST=smtp.resend.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=resend
SMTP_PASS=<resend-api-key>
```

Port `465` uses implicit TLS, which matches `SMTP_SECURE=true`. Resend also
supports STARTTLS on port `587`; for that combination use
`SMTP_SECURE=false`. Do not commit the API key or give it a `NEXT_PUBLIC_`
name.

Use a sending subdomain such as `updates.example.com` to isolate transactional
sending reputation from employee mail. `MAIL_FROM` must use the domain verified
with the provider. If replies should reach customer support, use a monitored
address; Cartura does not currently expose a global `REPLY_TO` environment
variable.

### Postmark SMTP configuration

Postmark is a strong alternative for a store focused on transactional delivery
and provider-side diagnostics. Enable SMTP for a transactional message stream,
create an SMTP token, and use its access and secret keys:

```dotenv
MAIL_FROM=Cartura <no-reply@updates.example.com>
SMTP_HOST=smtp.postmarkapp.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=<postmark-smtp-access-key>
SMTP_PASS=<postmark-smtp-secret-key>
```

Postmark advertises STARTTLS on ports `25`, `2525`, and `587`; prefer `587`.
Keep Cartura email on a transactional stream. Marketing or broadcast mail
should use a separate provider stream and application workflow, with consent
and unsubscribe handling that the current Cartura mailer does not implement.

### Amazon SES and other SMTP providers

For SES, create SES-specific SMTP credentials in the same AWS region as the
chosen SES endpoint; ordinary AWS access keys are not interchangeable with SES
SMTP credentials. Verify the sending identity and request production access
before sending to arbitrary customer addresses. Copy the endpoint, supported
TLS port, username, and password from the SES console into Cartura's generic
SMTP variables.

SendGrid, Mailgun, Brevo, and other authenticated SMTP relays use the same
mapping. Choose one supported TLS mode as a complete pair:

```text
implicit TLS: SMTP_PORT=465 and SMTP_SECURE=true
STARTTLS:     SMTP_PORT=587 (or provider-specific port) and SMTP_SECURE=false
```

Use the exact host, ports, and credential type documented by the provider.
Never assume that an account API key, SMTP password, and cloud access key are
the same credential.

### Domain authentication and reputation

Before enabling customer email:

1. Verify the sending domain with the provider.
2. Publish the exact SPF and DKIM records supplied by that provider. Do not
   create multiple competing SPF TXT records for the same hostname.
3. Add DMARC in monitoring mode, inspect reports, and move gradually to
   `quarantine` or `reject` only after every legitimate sender passes.
4. Keep the visible `From` domain aligned with the verified domain.
5. Separate production and staging credentials. Use provider sandbox mode or a
   controlled recipient list so staging cannot email real customers.
6. Separate transactional traffic from newsletters and promotions to protect
   the reputation of verification and order email.

DNS authentication authorizes the provider to send for the domain; it does not
create an inbox. Create or route the address separately if customers are
expected to reply.

### Delivery, bounces, and operational checks

An SMTP success means the provider accepted the message, not that the recipient
received it. Cartura stores the returned provider message ID and marks a
background delivery as sent after SMTP acceptance. It does not currently ingest
provider delivery, bounce, or complaint webhooks, so later failures do not
automatically update Cartura or suppress an invalid address.

Until feedback webhooks are implemented:

- monitor the provider dashboard for bounces, complaints, blocks, and
  suppressions;
- alert on `Mail send failed`, repeated notification-delivery failures, and a
  sudden drop in accepted messages;
- test at least verification, password reset, two-factor, order, payment, and
  refund email after configuration changes;
- verify delivery to representative Gmail, Outlook, and business-domain
  recipients and inspect headers for SPF, DKIM, and DMARC results;
- rotate SMTP/API credentials and redeploy immediately if a secret is exposed;
- remember that `/health` does not verify the SMTP connection or delivery.

For local development, use a provider sandbox/test mode or an SMTP-capture
service configured with authentication. Cartura currently refuses to send when
the SMTP username or password is empty, even if a local capture server would
otherwise allow anonymous SMTP.

## Configure Vercel OIDC

In the Vercel frontend project, open **Settings -> Security -> Secure backend
access with OIDC federation** and enable the team issuer mode. Use the exact
issuer, audience, and subject claims for the Railway variables above.

The production subject has this shape:

```text
owner:<team-slug>:project:<vercel-project-name>:environment:production
```

Names are claim values, not display labels; copy them from Vercel instead of
guessing. Do not manually create `VERCEL_OIDC_TOKEN`. Vercel supplies it during
builds and makes a token available to functions, while Cartura's
`getVercelOidcToken()` helper reads it.

The backend configuration currently accepts exactly one OIDC subject. A Vercel
preview token has an `environment:preview` subject and must not be pointed at
the production backend. Give previews a separate staging Railway environment
whose backend accepts the preview subject, or do not enable previews that call
live API data. Never solve this by weakening the production subject check.

If the frontend is hosted somewhere other than Vercel, use shared-secret mode
instead:

```dotenv
# frontend
CARTURA_INTERNAL_AUTH_MODE=shared-secret
CARTURA_INTERNAL_SHARED_SECRET=<same-random-value-of-at-least-32-characters>

# backend
INTERNAL_API_AUTH_MODE=shared-secret
INTERNAL_API_SHARED_SECRET=<same-random-value-of-at-least-32-characters>
```

Store the value only in each platform's secret manager and rotate both sides
together.

## Deploy the frontend on Vercel

Import the same repository as one Vercel project and set:

| Setting | Value |
| --- | --- |
| Framework preset | Next.js |
| Root directory | `frontend` |
| Include files outside the root | Enabled, so the workspace contracts are available |
| Install command | `pnpm install --frozen-lockfile` |
| Build command | `pnpm --filter @cartura/contracts build && pnpm --filter frontend build` |
| Output directory | The detected Next.js default (`.next`) |

Set the production frontend variables:

| Variable | Production value |
| --- | --- |
| `CARTURA_API_URL` | Final Railway API HTTPS origin. Keep it server-only. |
| `FRONTEND_URL` | Final Vercel frontend HTTPS origin. |
| `CARTURA_INTERNAL_AUTH_MODE` | `vercel-oidc`. |
| `BFF_RATE_LIMIT_ENABLED` | `true`. |
| `BFF_RATE_LIMIT_NAMESPACE` | A unique value such as `cartura:production:rl:bff`. |
| `UPSTASH_REDIS_REST_URL` | Upstash REST endpoint. |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash REST token; keep it server-only. |

Do not prefix private Cartura, Upstash, or OIDC configuration with
`NEXT_PUBLIC_`. An Upstash/Vercel integration may create credentials with
different names; map them to the exact `UPSTASH_REDIS_REST_URL` and
`UPSTASH_REDIS_REST_TOKEN` names consumed by this repository.

Place the Upstash database near the Vercel function region. Keep the BFF
namespace distinct from the backend Redis prefix because the two layers apply
different policies and algorithms.

## Releases and migrations

Use the following release sequence:

```text
merge to the production branch
  -> Railway builds backend and shared contracts
  -> Railway pre-deploy applies committed Prisma migrations
  -> Railway starts the new backend and checks /health
  -> Vercel builds shared contracts and Next.js
  -> smoke test the production storefront and API boundary
```

Database changes should be backward-compatible with the previous backend
version during a rolling deployment. Use expand-and-contract migrations for
renames, required columns, and destructive schema changes. A failed migration
must stop the deployment; it must not be hidden by starting the application
anyway.

Seed the authorization roles and first super-admin only during the initial
bootstrap described above. Do not seed production automatically on every
release.

## Production readiness checklist

Before opening the store to customers:

- Verify `https://api.example.com/health` returns `200` and the frontend can
  complete an OIDC-authenticated API read.
- Confirm a direct unauthenticated request to a protected `/api/v1/*` endpoint
  returns `401`, while the Paymob webhook route remains reachable.
- Exercise registration, email verification, login, password reset, Google
  OAuth when enabled, and logout on the final domain.
- Create a product image, cart, checkout, Paymob callback, notification, and
  refund test in a non-production environment first.
- Confirm cookies are `Secure`, HTTP-only where expected, and scoped to the
  frontend domain.
- Verify BFF and backend rate-limit `429` behavior and fail-closed `503`
  behavior as described in [Rate limiting](08-rate-limiting.md).
- Enable PostgreSQL backups, record retention, and perform a test restore. Redis
  queues are operational state; PostgreSQL and provider records remain the
  business source of truth.
- Add continuous uptime checks for the frontend and API. Railway's deployment
  health check gates a release but is not continuous monitoring.
- Alert on backend restarts, migration failures, PostgreSQL saturation, Redis
  errors, failed BullMQ jobs, SMTP errors, Cloudinary failures, Paymob webhook
  failures, and elevated `429`/`503` responses.
- Keep production and staging in separate Vercel/Railway environments with
  separate databases, Redis instances or prefixes, OIDC subjects, provider
  credentials, and webhook URLs.
- Run `pnpm typecheck`, `pnpm test`, and the production build checks before
  release.

`/health` is intentionally shallow. Startup connects to PostgreSQL and the
required Redis clients before the server begins listening, so it is useful for
deployment readiness. It does not continuously prove that every downstream
provider remains healthy; logs, metrics, synthetic transactions, and provider
alerts cover that gap.

## Alternatives

### Put both applications on Railway

This is a reasonable choice when one vendor and private service-to-service
networking matter more than Vercel's Next.js integration. Run `next start` as a
persistent frontend service and use shared-secret internal authentication.
Keep Upstash for the production BFF limiter unless the implementation is
changed to support another store.

### Use a single VPS

A VPS can be cheaper at steady low traffic, but the operator becomes
responsible for TLS, reverse proxying, process supervision, image builds,
firewalls, PostgreSQL and Redis upgrades, backups, restores, monitoring, and
incident response. The repository currently includes only a local Redis
Compose service, not a complete production Docker stack, so this is not the
lowest-risk first deployment.

### Move to a major cloud

Use container services plus managed PostgreSQL and Redis when Cartura needs
private networking controls, compliance features, multiple regions, or a
larger operations team. Preserve the same logical boundaries: serverless or
edge-friendly Next.js, persistent API and workers, private data services, and
authenticated BFF-to-API traffic.

## Official platform references

- [Next.js on Vercel](https://vercel.com/docs/frameworks/full-stack/nextjs)
- [Vercel monorepos](https://vercel.com/docs/monorepos)
- [Vercel OIDC federation](https://vercel.com/docs/oidc)
- [Vercel OIDC claim reference](https://vercel.com/docs/oidc/reference)
- [Vercel Function limits](https://vercel.com/docs/functions/limitations)
- [Railway shared monorepos](https://docs.railway.com/deployments/monorepo)
- [Railway pre-deploy commands](https://docs.railway.com/deployments/pre-deploy-command)
- [Railway health checks](https://docs.railway.com/deployments/healthchecks)
- [Railway PostgreSQL](https://docs.railway.com/databases/postgresql)
- [Railway outbound networking and SMTP restrictions](https://docs.railway.com/networking/outbound-networking)
- [Upstash's Vercel integration](https://upstash.com/docs/redis/howto/vercelintegration)
- [Resend SMTP](https://resend.com/docs/send-with-smtp)
- [Resend domain authentication](https://resend.com/docs/dashboard/domains/introduction)
- [Postmark SMTP](https://postmarkapp.com/developer/user-guide/send-email-with-smtp)
- [Amazon SES SMTP credentials](https://docs.aws.amazon.com/ses/latest/dg/smtp-credentials.html)
- [Amazon SES production access](https://docs.aws.amazon.com/ses/latest/dg/request-production-access.html)

Previous: [Rate limiting](08-rate-limiting.md). Next: [Contributor guide](../CONTRIBUTING.md).

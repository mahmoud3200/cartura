# Why the frontend uses a backend for frontend

Cartura uses Next.js as a backend for frontend (BFF) between browser code and the Express API. The browser communicates with Next.js. Server-only Next.js code communicates with Express.

This does not mean every request receives an extra proxy hop. Next.js code that is already running on the server calls Express directly.

## Why this boundary exists

The BFF keeps implementation and security details out of browser JavaScript:

- the private Express base URL stays server-only;
- bearer tokens remain in HTTP-only cookies and server code;
- provider credentials and privileged headers never enter the client bundle;
- Next.js can redirect, revalidate, and shape UI-friendly action results;
- Express remains the authority for validation, authorization, and business rules;
- shared Zod contracts validate both sides of the network boundary.

The BFF is not a second business backend. It coordinates the web interface and delegates domain behavior to Express.

## Choose the path by consumer

### Page rendering or navigation

```text
Browser navigation
  -> Next.js Server Component
  -> server-only feature API module
  -> Express API
```

Use this path for reads needed to render a page. Server Components call the server-only API module directly. They do not use Server Actions for reads and do not call their own Route Handlers.

### A mutation from the React interface

```text
Client Component or form
  -> feature Server Action
  -> server-only feature API module
  -> Express API
```

Use this path for create, update, delete, submit, logout, review, and other UI mutations. The Server Action validates UI input, calls Express, and returns a serializable result or performs a redirect or revalidation.

Server Action files use a singular intent and the `.action.ts` suffix, such as `request-return.action.ts`.

### A real HTTP endpoint

```text
Browser or external provider
  -> Next.js Route Handler or auth rewrite
  -> server-only API module or Express API
```

Use a Route Handler only when the consumer needs an actual URL with HTTP semantics. Existing examples include browser file uploads, notification polling, client-side category loading, and the Google OAuth callback.

Do not add a Route Handler only to hide Express from a Server Component or Server Action. Those already execute on the server.

## Authentication forwarding

`frontend/src/shared/api/` owns the common server-only transport boundary. `server-api.ts` is its small public facade: it coordinates the request, reads the Cartura token from the HTTP-only cookie, and forwards credentials to Express. Focused sibling modules resolve the request origin, decode API responses, normalize failures as `ApiError`, and copy supported response cookies into the Next.js cookie store.

Feature API modules own domain paths and response parsing. Components should receive validated data, not raw network payloads.

## Rules contributors must preserve

- Never expose `CARTURA_API_URL` through a `NEXT_PUBLIC_*` variable.
- Never import a server-only API module into a Client Component.
- Keep browser API functions on genuine same-origin `/api/...` endpoints.
- Call Express directly from Server Components and Server Actions.
- Validate UI mutation input before sending it.
- Parse Express responses with the shared response contract.
- Enforce authentication and authorization again in Express.

## Example: refunds

The customer return form calls `requestReturnAction`. That action validates the shared request schema and calls the server-only refunds API. Management review, item receipt, and refund execution use the same pattern. Express authenticates the request, checks permissions, validates the payload, runs the refund service, and maps the shared response.

Refund operations do not need a Next.js Route Handler because they begin inside the React interface and can use Server Actions.

## Main implementation files

- `frontend/src/shared/api/server-api.ts` — public server transport facade
- `frontend/src/shared/api/server-api-error.ts` — typed API failures and message normalization
- `frontend/src/shared/api/server-api-response.ts` — JSON and text response decoding
- `frontend/src/shared/api/server-request-origin.ts` — request-origin resolution
- `frontend/src/shared/api/server-response-cookies.ts` — response-cookie parsing and forwarding
- `frontend/src/shared/api/auth-token.ts` — Cartura token cookie access
- `frontend/src/features/*/api/`
- `frontend/src/features/*/actions/`
- `frontend/src/app/api/`
- `frontend/next.config.ts`

Next: [Shared API contracts](03-shared-contracts.md).

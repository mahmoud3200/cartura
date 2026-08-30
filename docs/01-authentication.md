# Authentication architecture

Cartura uses Better Auth in the Express backend as the authentication authority. The Next.js application owns the browser-facing experience and keeps backend credentials and service locations on the server.

## Responsibilities

The backend owns:

- Better Auth configuration and PostgreSQL persistence
- Email and password authentication with verified email addresses
- Optional Google OAuth when both Google credentials are configured
- Email OTP delivery for verification and password reset
- Email OTP as the supported second factor; TOTP is currently disabled
- Session creation, expiration, revocation, and account-status enforcement
- Bearer-token validation for calls from the Next.js server
- Role and permission checks for management endpoints

The frontend owns:

- Login, registration, verification, reset, and second-factor forms
- Server Actions that validate form input and call the backend
- An HTTP-only `cartura_session_token` cookie used only by server-side code
- Redirects after authentication and account-restriction routing
- The Google callback Route Handler that relays the provider callback and stores the returned token

## Request flow

```text
Browser form
  -> Next.js Server Action
  -> server-only auth API module
  -> Express /api/v1/auth endpoint
  -> Better Auth
  -> PostgreSQL
```

On successful login, the backend returns a short-lived bearer token. The Server Action stores it in an HTTP-only, same-site cookie. Subsequent server-side API calls add it as an `Authorization: Bearer` header. When no bearer token is available, the server API helper can forward Better Auth cookies for flows that need them, such as second-factor verification.

The token cookie is marked `Secure` in production. Browser components cannot read it, and the private `CARTURA_API_URL` is not exposed through a `NEXT_PUBLIC_*` variable.

## Google OAuth

The public auth path is `/api/v1/auth`. Next.js rewrites ordinary auth requests to Express so Better Auth can use the frontend origin as its public base URL. Google redirects to the Next.js callback Route Handler at `/api/v1/auth/callback/google`. That handler forwards the query and relevant cookies to Express, preserves redirects and response cookies, and stores the backend `set-auth-token` value in the HTTP-only frontend cookie.

This callback is a genuine HTTP boundary because an external identity provider must navigate to a URL. It is not a general-purpose proxy for application data.

## Account restrictions and authorization

Express checks restricted account status before API routes. Authenticated routes then use `requireAuthentication`, which resolves the Better Auth session and attaches the authenticated principal to the request.

Management routes add permission middleware after authentication. Permission checks are performed on the backend even when the frontend also hides inaccessible navigation or actions. Frontend checks improve the experience; backend checks remain authoritative.

The Next.js request proxy also asks the backend for the current session when a token exists. Suspended or disabled users are redirected to `/account-restricted`. This early redirect does not replace backend enforcement.

## Required configuration

Required for normal local authentication:

- `DATABASE_URL`
- `FRONTEND_URL`
- `BETTER_AUTH_SECRET`

Configure these features as a complete pair or set:

- Google OAuth: `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- SMTP: `SMTP_USER` and `SMTP_PASS`, plus sender and transport settings as needed
- Production bootstrap: explicitly decide `SUPER_ADMIN_BOOTSTRAP_ENABLED` and provide a strong `SUPER_ADMIN_PASSWORD` when enabled

Production frontend and CORS origins must use HTTPS. Production must never use the development Better Auth secret.

## Security invariants

- Never import the server-only auth API or token helper into a Client Component.
- Never expose `CARTURA_API_URL`, Better Auth secrets, provider secrets, or bearer tokens to browser JavaScript.
- Validate auth form input with the shared contracts before calling Express.
- Treat route visibility as presentation only; authorize every protected operation in Express.
- Keep authentication cookies HTTP-only, same-site, secure in production, and scoped to `/`.
- Preserve safe internal redirects to prevent open-redirect vulnerabilities.
- Keep account restriction checks in both the early frontend redirect path and the backend request boundary.

## Main implementation files

- `backend/src/modules/auth/better-auth.ts`
- `backend/src/modules/auth/auth.middleware.ts`
- `backend/src/modules/authorization/authorization.middleware.ts`
- `frontend/src/features/auth/actions/`
- `frontend/src/features/auth/api/auth-api.ts`
- `frontend/src/shared/api/` (token access, transport, origin, response, and cookie helpers)
- `frontend/src/app/api/v1/auth/callback/google/route.ts`
- `frontend/src/proxy.ts`

Next: [Why the frontend uses a BFF](02-backend-for-frontend.md).

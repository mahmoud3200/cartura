# Frontend feature architecture

The frontend is a Next.js application organized by feature. Pages stay thin, server-only modules own backend communication, and interactive behavior is isolated from server rendering.

## Feature directory

```text
features/<feature>/
  api/          server-only Express clients and genuine browser endpoint clients
  actions/      singular feature Server Actions
  components/   feature composition and orchestration
  hooks/        reusable stateful client behavior
  lib/          pure helpers, transformations, and local schemas
  ui/           focused feature-specific rendering
  types.ts      local types that are not shared API contracts
```

Create a folder only when that responsibility exists. Keep feature-specific code inside the feature until another feature has a concrete need for it.

## Pages

A route page should read route and search parameters, check access, load page data, select the major state, and compose feature components.

Do not put detailed forms, tables, request construction, or large render trees in page files.

## Server Components

Use Server Components for rendering and navigation reads. Call a server-only feature API module directly, then pass the smallest serializable data required by Client Components.

Do not use Server Actions for reads. Do not call a same-origin Route Handler from a Server Component.

## Server Actions

Use Server Actions for mutations initiated by the React interface. Each action should:

1. validate UI input;
2. call the server-only feature API module;
3. normalize expected failures;
4. return a serializable result, redirect, or revalidate;
5. invalidate only the affected page or cache scope.

Name action files for one intent, such as `update-product.action.ts` or `execute-refund.action.ts`.

## Route Handlers

Use Route Handlers for real HTTP consumers: browser JSON polling, live search, multipart uploads, file downloads, webhooks, callbacks, feeds, or external integrations.

A Route Handler is not the default path from Next.js to Express. Server Components and Server Actions already run on the server and should call Express directly.

## Components, UI, hooks, and helpers

- `components/` composes a feature and connects hooks to UI.
- `ui/` renders focused fields, rows, cards, states, and confirmation surfaces.
- `hooks/` owns non-trivial client state, async orchestration, effects, and reusable interaction behavior.
- `lib/` owns pure validation, normalization, formatting, state derivation, and constants.

Group parent-owned component families in a named folder. Keep private children private. Move a component to global shared UI only when it is genuinely useful across features.

## Client boundaries

Add `"use client"` only where browser interaction requires it. Keep data loading and static composition on the server. Never import a module containing `server-only` into a Client Component.

Client features must handle loading, empty, error, success, and destructive states. Forms show field errors near the field and disable duplicate submission while work is pending.

## Data and contract rules

- Browser code knows only genuine same-origin `/api/...` endpoints.
- Server-only API modules know `CARTURA_API_URL`.
- Shared transport types come from `@cartura/contracts`.
- Express responses are parsed in the API module before rendering.
- Feature-local schemas describe UI state, not copies of API payloads.
- Shared code never imports from a feature folder.

## Adding a frontend feature

1. Identify the page and its rendering, mutation, and HTTP consumers.
2. Add or reuse the shared contract.
3. Add a server-only API function for Express communication.
4. Load render data in the Server Component.
5. Add one Server Action per mutation intent.
6. Isolate client behavior in hooks and Client Components.
7. Compose focused UI states.
8. Add tests for pure rules and important interaction outcomes.
9. Run lint, typecheck, tests, and a production build when the backend is available.

Next: [Background work and integrations](06-background-work-and-integrations.md).


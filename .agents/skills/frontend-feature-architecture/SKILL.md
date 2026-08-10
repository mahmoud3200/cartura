---
name: frontend-feature-architecture
description: Structure or refactor React and Next.js frontend features into clear page, component, UI, hook, API, action, lib, type, and shared boundaries. Use when building a frontend feature, cleaning large components, separating rendering from behavior, adding data access or UI mutations, deciding between Server Components, Server Actions, and Route Handlers, or reviewing feature-folder responsibilities.
---

# Frontend Feature Architecture

Build feature code so every file has one recognizable reason to change. Preserve existing project conventions unless they conflict with the boundaries below.

## Start with an audit

Before editing:

1. Locate page routes, feature folders, shared UI, the query provider, internal API routes, server actions, and contracts.
2. Trace data from the page to a browser API function or server action, then to the server-only backend client.
3. List mixed responsibilities, duplicated UI, direct backend exposure, oversized render trees, and business logic embedded in JSX.
4. Reuse existing primitives and query-key conventions.

Do not create a parallel architecture when the repository already has the correct layer.

## Directory contract

Use this feature shape when the project supports it:

```text
features/<feature>/
  api/          typed Express API access and genuine browser endpoint clients
  actions/      feature-local server actions named *.action.ts
  components/   feature composition and orchestration
  hooks/        reusable stateful behavior and query/mutation hooks
  lib/          pure helpers, schemas, transformations, constants
  types.ts      feature types when contracts do not own them
  ui/           focused feature-specific visual pieces
```

Not every feature needs every folder. Create only layers that carry a real responsibility.

## Pages

Keep route files thin. A page should:

- read route parameters;
- call page-level permission or loading hooks when necessary;
- select loading, error, permission, or success states;
- compose feature components;
- provide route metadata when applicable.

Move repeated links, permission messages, headers, and feature-specific states into the feature's `ui/` folder. Do not place detailed forms, cards, tables, upload markup, schemas, or request construction in a page.

## Components

Use `components/` for feature-level composition. Components may contain basic semantic HTML and compose items from the feature's `ui/` folder, the application's shared UI folder, and other focused feature components.

A component may wire hooks to UI props. It should not contain a large field implementation, media lifecycle, debounce or infinite-scroll logic, API parsing, or repeated page UI.

Split a component when its JSX represents multiple named surfaces such as details, media, parent selection, destructive actions, results, or loading states. The goal is not the fewest lines. The goal is a component whose responsibility can be described in one short sentence.

### Component family folders

When a parent component owns multiple related components, group that family in a folder named after the parent instead of scattering sibling files across `components/`.

```text
shared/components/header/
  header.tsx
  header-links.tsx
  header-actions.tsx
  header-mobile-menu.tsx
```

Use a component family folder when:

- two or more subordinate components exist primarily to compose one parent surface;
- the files share parent-specific types, hooks, helpers, or rendering concerns;
- naming the folder makes ownership clearer than a flat list of prefixed files.

Keep the parent component, its private subcomponents, parent-specific types, and local helpers together. Move effect-heavy behavior into a colocated hook when it exists. Keep reusable cross-component UI in the appropriate shared or feature `ui/` folder, and keep feature-specific families inside their feature. A standalone component should remain a flat file until it has a genuine component family.

Prefer direct imports from the owning file. Add a folder `index.ts` only when the family intentionally exposes a small public API; do not use barrels to expose private children.

## Feature UI

Use `features/<feature>/ui/` for focused, feature-specific rendering:

- form sections and fields;
- cards and table rows;
- image inputs and previews;
- action bars and confirmation surfaces;
- empty, error, loading, and result states;
- feature-specific navigation elements.

UI components receive values, status flags, and callbacks through props. They may use trivial local interaction state, such as opening a confirmation surface. Move behavior to a hook when it includes async work, effects, timers, observers, coordinated state, transformations, or reusable interaction rules.

Do not move feature-specific UI into the global shared folder merely to shorten an import path.

## Hooks

Use hooks for non-trivial client behavior:

- TanStack Query `useQuery` and `useInfiniteQuery` reads;
- `useMutation` writes;
- form state and submission orchestration;
- upload, replacement, removal, and pending-asset cleanup;
- debounced search and intersection observers;
- coordinated loading and error states.

Keep pure validation, slug generation, normalization, and mapping in `lib/`, not inside a hook.

Separate hooks by behavior. For example:

```text
use-category-form.ts             form state, validation flow, submit orchestration
use-category-banner-manager.ts   upload and pending-media lifecycle
use-parent-category-picker.ts    debounce, infinite loading, option normalization
use-categories.ts                query and mutation hooks
```

Avoid one hook that becomes a hidden version of the entire feature.

## API and server boundary

Never expose the actual backend base URL, private service URL, credentials, or privileged headers to browser code.

Classify every operation by its consumer before choosing a boundary. Use this decision tree:

```text
Renders or navigates
  -> Server Component
  -> server-only feature API client
  -> Express API
```

```text
Submits a UI mutation
  -> feature action in actions/<intent>.action.ts
  -> server-only feature API client
  -> Express API
```

```text
Needs an actual JSON, file, webhook, callback, or other HTTP endpoint
  -> Route Handler
  -> server-only feature API client
  -> Express API
```

Do not add a Next.js HTTP hop when execution is already on the server. A Server Component or Server Action must call the server-only Express API client directly, never its own Route Handler.

### Server Components

- Load render and navigation data in Server Components.
- Call the Express API through a server-only feature API client.
- Pass the smallest serializable result needed by Client Components.
- Do not use Server Actions for reads.
- Do not call same-origin Route Handlers from Server Components.

### Server Actions

- Use Server Actions for create, update, delete, submit, logout, and other mutations initiated by this React UI.
- Place each action in its owning feature's `actions/` folder.
- Name action files with a singular intent and the `.action.ts` suffix, for example `signin.action.ts`, `create-category.action.ts`, or `delete-product.action.ts`.
- Keep related validation and result typing focused, but split unrelated intents into separate action files instead of using plural `*.actions.ts` files.
- Authenticate, authorize, validate input, call the server-only Express API client directly, and return a serializable result or redirect or revalidate as appropriate.
- A mutation hook may invoke a Server Action when client orchestration, toasts, or TanStack Query cache invalidation are still useful.
- Do not call a Route Handler from a Server Action.

### Route Handlers

- Add a Route Handler only when a real HTTP endpoint is part of the requirement.
- Valid cases include browser-consumed JSON for client-only polling, live search, or infinite loading; file upload or download; webhooks; callbacks; feeds; and external consumers.
- Preserve HTTP semantics when they matter: methods, status codes, headers, content type, streaming, and caching.
- Do not create a Route Handler only to hide the Express API from code that already runs on the server.

Rules:

- Make browser API functions call only genuine same-origin endpoints.
- Keep backend clients and environment variables in server-only modules.
- Forward authentication on the server.
- Validate internal responses with shared contract schemas.
- Centralize error normalization.
- Put query keys in a consistent query-key factory.
- Invalidate the narrowest stable query-key prefix after mutations.
- Never import a server-only module into a client component or browser API file.
- Never use a `NEXT_PUBLIC_*` variable for a private backend URL.

## Shared code

Use the global `shared/` area only for genuinely cross-feature code:

- design-system primitives such as Button, Input, Card, and Label;
- generic pagination and request helpers;
- shared layout or permission primitives;
- cross-feature formatting and query infrastructure.

Keep a helper or UI element inside its feature until another feature has a concrete need for the same abstraction. Shared code must not import from a feature folder.

## Forms and media

For complex forms:

- keep schemas and pure transformations in `lib/`;
- keep form coordination in a hook;
- render each named section through focused UI components;
- expose field errors beside their fields;
- disable submission during required uploads or mutations;
- represent loading, error, empty, success, and destructive states.

For pending media uploads:

1. Preview immediately when a file is selected.
2. Upload through a mutation to an internal endpoint.
3. Store the returned pending asset identifier.
4. Delete replaced or explicitly removed pending assets.
5. Attach the final asset during entity creation or update.
6. Revoke local object URLs.
7. Prevent duplicate submit or replacement races while required work is pending.

## Responsibility test

Before finishing, verify:

- Can each file's responsibility be stated in one sentence?
- Does the page mostly compose feature components?
- Does each component compose UI instead of implementing every surface inline?
- Are parent-owned component families grouped in a named folder instead of scattered across `components/`?
- Do component-family folders keep private children private while shared UI remains outside the family?
- Is async or effect-heavy behavior in a hook?
- Are pure helpers outside hooks and components?
- Does browser code know only internal endpoints?
- Do render and navigation reads go from Server Components directly to Express?
- Do UI mutations use feature-local singular `*.action.ts` files and call Express directly?
- Does every Route Handler provide a genuine JSON, file, webhook, callback, or external HTTP boundary?
- Are same-origin server-to-server hops absent?
- Is feature-specific code still inside the feature?
- Are loading, error, empty, success, and destructive states handled?
- Are duplicated route-level elements extracted?
- Do imports flow from pages to features to shared code, never from shared code back into a feature?

## Verification

Run the narrowest relevant lint and type checks first, then project-level checks. Report unrelated pre-existing failures separately. Search for direct backend URLs, stale imports, duplicated feature UI, and abandoned files after moving code.

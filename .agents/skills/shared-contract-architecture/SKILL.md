---
name: shared-contract-architecture
description: Define, reuse, and validate shared Zod API contracts across the Cartura frontend, backend, and Express boundaries. Use when adding or changing request schemas, response schemas, transport entities, pagination envelopes, Server Component reads, Server Action mutations, Route Handlers, or when local frontend/backend schemas may duplicate packages/contracts.
---

# Shared Contract Architecture

Use `packages/contracts` as the source of truth for every shape that crosses a process or network boundary.

## Contract-first workflow

1. Inspect `packages/contracts/src/<domain>/index.ts` before defining a schema or transport type elsewhere.
2. Reuse an existing contract when it describes the payload accurately.
3. If a transport shape is missing, add it to the domain contract first.
4. Export the schema and its inferred type from the domain barrel and, when needed, the package root.
5. Consume that same schema at every untrusted boundary that receives the payload.
6. Remove duplicate local transport schemas and manually maintained transport types.

## Ownership rules

- Put domain requests, responses, entities, and stable endpoint envelopes in `packages/contracts/src/<domain>`.
- Put cross-domain primitives such as pagination metadata and reusable response builders in `packages/contracts/src/common`.
- Derive transport types with `z.infer<typeof schema>`; never maintain a parallel interface by hand.
- Compose domain contracts instead of copying their fields into another contract.
- Keep schema names explicit: `orderSchema`, `auditLogListResponseSchema`, `updateUserRequestSchema`.

Feature-local schemas are allowed only when the shape intentionally belongs to the UI or orchestration layer, including:

- form state and client-side validation that differs from the API request;
- view models produced from multiple contracts;
- URL/search state;
- Server Action input envelopes containing coordination-only fields.

Name these schemas for their local purpose. Do not use a generic local name that disguises a duplicated API response.

## Boundary validation

- Express validates incoming params, queries, and bodies with shared request contracts.
- Express response mappers should return values compatible with shared response types.
- Frontend server-only API modules parse Express responses with shared response contracts.
- Server Actions parse UI input, call the server-only API module, and return a serializable action result.
- Route Handlers use contracts only when they provide a real HTTP endpoint; they do not redefine an Express payload.

Do not repeatedly parse trusted values inside rendering components. Parse once at the boundary, then pass typed data inward.

## Frontend architecture pairing

Apply this skill with `frontend-feature-architecture`:

- renders or navigates: Server Component -> feature API -> Express API;
- submits a UI mutation: feature Server Action -> feature API -> Express API;
- needs an actual JSON, file, webhook, or callback endpoint: Route Handler -> feature API or Express API.

The transport path does not change contract ownership. Shared payloads still belong in `packages/contracts`.

## Audit procedure

Search for likely duplicated transport declarations:

```text
rg "z\\.object|z\\.array|interface .*Response|type .*Response" frontend/src backend/src
```

For each result, ask:

1. Does this shape cross the frontend/Express boundary?
2. Is an equivalent schema already exported by `@cartura/contracts`?
3. If not, which domain owns it?
4. Can another contract import and compose it instead of copying its fields?

After migrating, verify that feature API files import shared schemas, local duplicate schemas are gone, and unused files or empty folders are removed.

## Verification

Run the narrowest relevant checks, then the full frontend checks when the migration spans features:

```text
npm run lint
npm run typecheck
npm test
npm run build
```

Also search again for duplicate response schemas. Treat a passing typecheck as necessary but not sufficient: runtime parsing must use the shared schema at the network boundary.


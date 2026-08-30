# Shared API contracts

Cartura keeps every stable shape that crosses between Next.js and Express in `packages/contracts`. The package uses Zod schemas as the source of truth and derives TypeScript types from those schemas.

This prevents the frontend and backend from maintaining two similar but independent descriptions of the same API.

## What belongs in the contract package

Put these in `packages/contracts/src/<domain>/index.ts`:

- route params and query strings;
- create and update request bodies;
- transport entities returned by the API;
- data and pagination response envelopes;
- stable enums shared across processes;
- inferred request and response types.

Cross-domain primitives, including pagination and API error envelopes, belong in `packages/contracts/src/common`.

Do not put database-only models, React form state, internal service inputs, Prisma payloads, or provider SDK responses in the shared contracts.

## One schema, multiple boundaries

```text
UI input
  -> Server Action parses shared request schema
  -> Express controller parses the same request schema
  -> service and repository perform the use case
  -> mapper returns the shared response type
  -> frontend API parses the shared response schema
  -> component receives trusted typed data
```

Parsing twice on input is intentional. The Server Action gives the user fast, useful validation. Express still treats every network request as untrusted and protects the public API independently.

## Contract-first workflow

When adding or changing an endpoint:

1. Open the owning domain under `packages/contracts/src`.
2. Reuse an existing schema if it already describes the payload.
3. Add or change the request and response schemas before editing consumers.
4. Derive types with `z.infer<typeof schema>`.
5. Export the domain from its barrel and package export map when it is new.
6. Re-export request schemas from the backend feature's `*.schemas.ts` file.
7. Parse params, query, and body in the Express controller.
8. Type the backend mapper against the response contract.
9. Parse the Express response in the frontend server-only API module.
10. Remove local transport interfaces or schemas that duplicate the contract.

## Naming conventions

Use names that identify both the resource and the direction of travel:

- `createRefundRequestSchema`
- `reviewRefundRequestSchema`
- `refundIdParamsSchema`
- `managementRefundSchema`
- `paginatedManagementRefundListResponseSchema`

Avoid names such as `dataSchema`, `payloadType`, or `ApiResponse` when a domain-specific name is available.

## Local schemas that are allowed

A frontend feature may define a local schema when the shape belongs only to the interface, for example:

- multi-step form state that differs from the final API request;
- URL search state;
- a view model composed from multiple API responses;
- a Server Action coordination envelope.

A backend feature may define a local type for a persistence payload, provider adapter input, or internal use-case value. Name it for that internal purpose so it cannot be mistaken for a transport contract.

## Compatibility rules

- Treat response field removal or meaning changes as breaking changes.
- Prefer additive optional fields when older consumers may still exist.
- Keep request objects strict so unknown fields are rejected.
- Compose existing schemas instead of copying their fields.
- Convert dates to ISO strings and decimal money values to numbers in mappers.
- Do not spread Prisma records into API responses.
- Keep management-only data out of customer contracts.

The refund contracts demonstrate the final rule: management responses can include provider and failure evidence, while customer responses deliberately omit those internal fields.

## Verification

```bash
pnpm --filter @cartura/contracts typecheck
pnpm --filter @cartura/backend typecheck
pnpm --filter frontend typecheck
```

Also search for duplicated transport declarations:

```bash
rg "z\.object|z\.array|interface .*Response|type .*Response" frontend/src backend/src
```

Next: [Backend feature architecture](04-backend-architecture.md).


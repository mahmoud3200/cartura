---
name: backend-feature-architecture
description: Structure, refactor, and review Cartura Express and TypeScript backend modules with strict route, controller, schema, service, repository, mapper, policy, utility, type, and error boundaries. Use when adding a backend feature or endpoint, extracting Prisma access from services, removing inline response mapping, splitting oversized modules, reviewing single-responsibility compliance, or pairing backend code with shared API contracts.
---

# Backend Feature Architecture

Build backend modules so every file has one recognizable reason to change. Preserve existing behavior and project conventions unless they conflict with the boundaries below.

## Start with an audit

Before editing:

1. Locate the route, controller, schemas, service, repository, mapper, policies, utilities, types, errors, tests, shared contracts, and infrastructure dependencies.
2. Trace each operation from HTTP input through validation, business rules, persistence, mapping, and HTTP output.
3. Search controllers and services for Prisma access, inline transport mapping, duplicated contract types, query construction, and unrelated helpers.
4. Compare the module with nearby compliant modules before creating a new abstraction.
5. Record pre-existing responsibility violations that are outside the requested scope instead of silently expanding the refactor.

Do not create a parallel architecture when the repository already has the correct layer.

## Directory contract

Use this module shape when those responsibilities exist:

```text
modules/<feature>/
  <feature>.routes.ts       route registration and middleware order
  <feature>.controller.ts   HTTP request and response boundary
  <feature>.schemas.ts      shared contract schema re-exports
  <feature>.service.ts      business rules and use-case orchestration
  <feature>.repository.ts   Prisma queries and transactions
  <feature>.mapper.ts       persistence/domain to transport mapping
  <feature>.policy.ts       pure domain authorization or eligibility rules
  <feature>.utils.ts        cohesive pure feature helpers
  <feature>.types.ts        internal feature types only
  <feature>.errors.ts       named feature error factories
  <feature>.test.ts         focused behavior tests
  index.ts                  intentionally small public API
```

Not every module needs every file. Create a layer only when it carries a real responsibility. File count is not the goal; clear ownership is.

## Dependency direction

Keep the normal request path one-way:

```text
routes -> controller -> service -> repository -> Prisma
                  |          |
                  |          -> policy / pure utils / feature errors
                  -> mapper -> shared response contract
```

Rules:

- Routes may import controllers and request middleware.
- Controllers may import schemas, services, mappers, and HTTP request helpers.
- Services may import repositories, policies, utilities, domain errors, and other services when cross-feature orchestration is genuine.
- Repositories may import Prisma, database infrastructure, pagination persistence helpers, and transaction-aware repositories needed for atomic writes.
- Mappers may import shared response types, persistence/domain types, and pure formatting helpers.
- Shared code must not import a feature module.
- Never import a controller or route from a service, repository, mapper, policy, or utility.

## Routes

Keep route files declarative. They should only:

- define paths and HTTP methods;
- order authentication, authorization, upload, and validation middleware;
- select the controller handler.

Do not put parsing, Prisma calls, mapping, business rules, or response construction in routes.

## Controllers

Treat controllers as the HTTP boundary. A controller should:

1. read path, query, body, principal, and request context;
2. validate untrusted input with shared schemas through `parseInput`;
3. call one service use case;
4. map returned data with a named mapper;
5. send the status, headers, and response envelope;
6. forward errors to Express.

Do not query Prisma, enforce domain policy, construct audit metadata, perform money/date transformations, or manually enumerate response fields inside a handler.

Small request-only helpers such as path extraction may stay private in the controller. Extract them only when reused or when they represent a cohesive feature rule.

## Schemas and shared contracts

Apply `shared-contract-architecture` whenever a shape crosses the frontend/Express boundary.

- Define transport schemas and inferred request/response types in `packages/contracts/src/<domain>`.
- Make backend `*.schemas.ts` re-export the relevant contract schemas.
- Parse request params, queries, and bodies at the Express boundary.
- Do not maintain local interfaces that duplicate contract request or response types.
- Keep a local schema only for an internal, non-transport shape and name it for that purpose.

## Services

Services own use cases and business decisions. They may:

- coordinate repository calls;
- enforce invariants and state transitions;
- call policies or other domain services;
- choose domain errors;
- construct audit meaning such as action names and previous/next metadata;
- coordinate external infrastructure through an explicit service or adapter.

Services must not import `prisma`, `Prisma`, generated persistence models for querying, or database infrastructure. They must not build Prisma `where`, `include`, `select`, or transaction objects. They must not shape HTTP response DTOs.

Inject repositories through constructors with the project default instance so services remain testable:

```ts
constructor(private readonly repository: FeatureRepository = featureRepository) {}
```

Keep trivial pass-through service methods when they preserve the controller-to-repository boundary and form part of the feature use-case API.

## Repositories

Repositories own all relational persistence behavior:

- Prisma reads and writes;
- `where`, `select`, `include`, grouping, ordering, and pagination queries;
- database transactions and atomic multi-write operations;
- persistence-specific query builders;
- stable relation shapes required by services and mappers.

Keep reusable include/select objects typed with `satisfies Prisma.<Model>Include` or `Select`. Export the derived payload type when a mapper or service needs that exact loaded shape.

Return consistent shapes for list, get, create, and update operations when they feed the same mapper. If a response requires relations, load those relations after a mutation instead of returning a partial record that only happens to typecheck elsewhere.

Repositories must not create HTTP errors, map API responses, enforce route permissions, or decide user-facing business policy. An atomic feature write may call a repository that accepts the current `Prisma.TransactionClient`, such as audit logging.

## Transactions

Place transaction boundaries in repositories because transactions are persistence concerns.

- Let the service describe the intended operation and audit meaning.
- Let the repository execute all required writes atomically.
- Pass a transaction client only between persistence-layer functions.
- Do not leak transaction clients into controllers, mappers, or route code.
- Do not split writes that must succeed together across separate service-level repository calls.

## Mappers

Mappers explicitly convert persistence or domain values into shared transport responses.

- Return a shared contract response type or use a `satisfies` assertion.
- Convert `Date` values to ISO strings and decimals to numbers here.
- Map nested relations deliberately.
- Select fields explicitly; do not spread Prisma records into responses.
- Omit internal payloads, credentials, metadata, and newly added database columns by default.
- Keep database querying, validation, and business decisions out of mappers.

Controllers should invoke named mappers rather than inline identity callbacks or object literals for entities. Primitive acknowledgements, `204` responses, and already-domain-level scalar lists do not need ceremonial mappers.

## Policies, utilities, types, and errors

Use `*.policy.ts` for pure business predicates such as whether an entity can transition, attach, or be modified. A policy must not perform I/O.

Use `*.utils.ts` only for cohesive, pure feature helpers. Do not turn it into a miscellaneous dumping ground. Keep a helper private when only one file uses it and extraction would not clarify ownership.

Use `*.types.ts` for internal coordination, loaded persistence shapes, adapter inputs, and domain-only types. Import transport types from `@cartura/contracts`; never copy them locally.

Use `*.errors.ts` for reusable named feature error factories. Keep generic HTTP error construction in shared error infrastructure.

## Middleware, jobs, and infrastructure

Middleware owns request-lifecycle concerns such as authentication, permission gates, upload parsing, and request context. It should delegate permission decisions to services or pure policies.

Background jobs, webhook processors, and provider adapters may need dedicated files outside the standard request chain. Keep the same boundary rule: provider/network code belongs in infrastructure or an adapter; database access belongs in a repository; orchestration belongs in a service or worker.

Do not force bootstrap scripts and seed files through HTTP layers. Still extract reusable persistence operations when application code and bootstrap code share them.

## Refactoring workflow

When cleaning a mixed module:

1. Preserve its routes, status codes, errors, transaction semantics, ordering, filters, and response shape.
2. Move Prisma operations and query constants into a repository.
3. Derive and export exact repository payload types where needed.
4. Move response shaping into a mapper typed against the shared contract.
5. Move cohesive pure calculations into a policy or utility.
6. Reduce the service to business rules and orchestration.
7. Reduce the controller to HTTP concerns and named mapper calls.
8. Remove stale imports, duplicate helpers, dead files, and partial return shapes.
9. Add focused tests for extracted policies, utilities, mapping, and critical service decisions.

Refactor incrementally when a legacy module is large. Do not combine an architecture migration with unrelated behavioral changes.

## Responsibility test

Before finishing, verify:

- Can each file's responsibility be stated in one sentence?
- Does any controller or service import Prisma or database infrastructure?
- Does every Prisma query and transaction live in a repository?
- Does the controller validate untrusted input with shared contracts?
- Does the mapper explicitly produce the shared response shape?
- Do mutation methods return the relation shape their mapper requires?
- Are business rules in services or pure policies rather than repositories?
- Are audit semantics chosen by the service and persisted atomically by the repository?
- Are utilities cohesive, pure, and justified?
- Are local types free of duplicated transport contracts?
- Does dependency flow point toward repositories and shared infrastructure without cycles?
- Are files split by reason to change instead of by arbitrary line count?

## Verification

Run the narrowest checks first, then the backend suite:

```text
npm run typecheck
npm test
npm run build
```

Also search for boundary violations and stale code:

```text
rg "from .*prisma|\bprisma\." backend/src/modules -g "*.service.ts" -g "*.controller.ts"
rg "z\.object|interface .*Response|type .*Response" backend/src
rg "mapPaginatedResult\([^,]+, \([^)]*\) =>" backend/src/modules
```

Report pre-existing failures and out-of-scope legacy modules separately. A passing typecheck is necessary but does not prove correct runtime mapping, transaction ownership, or contract validation.

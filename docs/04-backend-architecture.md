# Backend feature architecture

The backend is an Express application organized by business feature. Each layer has one reason to change, and dependencies move from the HTTP boundary toward persistence and infrastructure.

## Request path

```text
route
  -> authentication and permission middleware
  -> controller
  -> service
  -> repository
  -> Prisma and PostgreSQL

controller -> mapper -> shared response contract
service -> policy, feature errors, and infrastructure adapters
```

## Feature directory

A feature may contain:

```text
modules/<feature>/
  <feature>.routes.ts
  <feature>.controller.ts
  <feature>.schemas.ts
  <feature>.service.ts
  <feature>.repository.ts
  <feature>.mapper.ts
  <feature>.policy.ts
  <feature>.utils.ts
  <feature>.types.ts
  <feature>.errors.ts
  <feature>.test.ts
  index.ts
```

Create only the files that carry a real responsibility. A small feature does not need every layer, but it must not mix unrelated responsibilities to reduce file count.

## Routes

Routes declare paths, methods, middleware order, and the controller handler. They do not parse payloads, query Prisma, map responses, or decide business rules.

Authentication runs before permission middleware. The backend permission check is authoritative even when the frontend hides the same action.

## Controllers

Controllers own HTTP concerns:

1. read params, query, body, principal, and request context;
2. validate untrusted input with `parseInput` and shared schemas;
3. call one service use case;
4. map returned data with a named mapper;
5. send the status and response envelope;
6. forward errors to Express.

Controllers do not import Prisma, build database queries, or contain domain transition rules.

## Services

Services own use cases and business decisions. They coordinate repositories, policies, feature errors, provider adapters, audit meaning, and cross-feature behavior.

A service must not import Prisma or construct `where`, `include`, `select`, or transaction objects. Inject repositories and adapters through constructors when the dependency needs to be replaced in tests.

## Repositories and transactions

Repositories own:

- Prisma reads and writes;
- query construction and relation selection;
- pagination persistence;
- transactions and atomic multi-write operations;
- optimistic or serializable concurrency checks;
- stable loaded shapes required by services and mappers.

Transactions stay in the persistence layer. If a state change, audit record, inventory update, and outbox event must succeed together, the repository writes all of them in one transaction.

Repositories raise persistence-specific conflicts. Services translate those conflicts into stable feature or HTTP errors.

## Mappers

Mappers convert persistence values into shared transport responses. They explicitly select fields, convert dates and decimals, map relations, and omit internal data.

Do not spread a database record into a response. A newly added database column must not become public accidentally.

## Policies, utilities, types, and errors

- `*.policy.ts` contains pure business predicates and state-transition rules.
- `*.utils.ts` contains cohesive pure helpers.
- `*.types.ts` contains internal coordination and persistence types only.
- `*.errors.ts` provides named feature errors and persistence-error translation.
- middleware owns authentication, permission gates, uploads, and request lifecycle concerns.

## Database changes

The Prisma schema is at `backend/prisma/schema.prisma`. Commit a migration whenever a persisted schema change is required.

For local development:

```bash
pnpm --filter @cartura/backend prisma:migrate
pnpm --filter @cartura/backend prisma:format
pnpm --filter @cartura/backend prisma:generate
```

Do not edit an existing migration after it has been shared. Add a new migration that moves the database from the previous state to the next state.

## Adding an endpoint

1. Change the shared contract first.
2. Re-export request schemas from the feature schema file.
3. Add a declarative route with authentication and permissions.
4. Parse the request in the controller.
5. Add the service use case and pure policy rules.
6. Put all Prisma work and transactions in the repository.
7. Map the response explicitly.
8. Add focused policy, mapper, service, and concurrency tests.
9. Update OpenAPI when the public API changes.

## Boundary checks

```bash
rg "from .*prisma|\bprisma\." backend/src/modules -g "*.service.ts" -g "*.controller.ts"
rg "mapPaginatedResult\([^,]+, \([^)]*\) =>" backend/src/modules
```

Next: [Frontend feature architecture](05-frontend-architecture.md).


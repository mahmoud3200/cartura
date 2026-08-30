# Testing and quality

Cartura uses Node's test runner for the Express backend and Vitest for the Next.js frontend. TypeScript and ESLint provide static checks, but passing static checks does not replace behavior tests.

## Run the narrowest check first

During development, run the test file closest to the change:

```bash
cd backend
corepack pnpm exec tsx --test "src/modules/refunds/*.test.ts"
```

```bash
cd frontend
corepack pnpm exec vitest run src/features/account/lib/order-return.test.ts
```

Then run the package and workspace checks.

## Workspace verification

```bash
pnpm typecheck
pnpm test
pnpm build
```

Frontend lint:

```bash
pnpm --filter frontend lint
```

Package-specific checks:

```bash
pnpm --filter @cartura/contracts typecheck
pnpm --filter @cartura/backend typecheck
pnpm --filter @cartura/backend test
pnpm --filter frontend typecheck
pnpm --filter frontend test
pnpm --filter frontend lint
```

## What to test

Backend changes should cover the important business decision, not only the happy controller response:

- validation boundaries;
- permission and ownership rules;
- state transitions and rejected transitions;
- money, date, and inventory calculations;
- transaction conflicts and idempotency;
- provider success, failure, timeout, and callback duplication;
- mapper omission of internal fields;
- safe error responses.

Frontend changes should cover:

- pure state derivation and formatting;
- action validation and error normalization;
- loading, empty, error, success, and destructive states;
- permission-dependent actions;
- retry and manual-review messaging;
- accessibility of forms and dialogs.

## Production build note

Some Next.js pages load Express data while collecting or prerendering page output. Run the backend with its required database configuration before expecting the frontend production build to complete.

Build failures caused by a missing local API should be reported separately from TypeScript, lint, or test failures.

## Before submitting a change

- Review the diff for unrelated files and generated output.
- Run `git diff --check`.
- Confirm no secret or private service URL entered tracked code.
- Confirm new transport shapes live in `packages/contracts`.
- Confirm services and controllers do not query Prisma.
- Confirm Client Components do not import server-only modules.
- Add or update documentation when a boundary or contributor workflow changes.

Next: [Rate limiting](08-rate-limiting.md).

# Contributing to Cartura

Thank you for helping Cartura. Every useful contribution matters, regardless of size or whether it includes code. Fixing a typo, clarifying a confusing sentence, reporting a reproducible bug, improving accessibility, adding a missing test, reviewing an idea, or sharing thoughtful feedback can make the project better for everyone.

## Ways to contribute

You can contribute by:

- fixing spelling, grammar, broken links, or unclear documentation;
- reporting bugs with clear reproduction steps and relevant environment details;
- suggesting focused improvements and explaining the problem they solve;
- identifying accessibility, usability, performance, or security issues;
- improving tests, examples, error messages, or developer tooling;
- reviewing changes and asking questions that make an implementation safer;
- contributing design, research, translations, or community support;
- implementing bug fixes and features.

Small contributions are welcome. You do not need to build a feature or write code for your support to be valuable.

## Choose the right path

For documentation and typo fixes, make the correction directly and check that nearby wording, links, and examples still make sense.

For bug reports, include what you expected, what happened, steps to reproduce it, and any relevant logs with secrets removed. A minimal reproduction is helpful when practical, but it is not required before a report can be useful.

For ideas, design feedback, or larger changes, describe the user or developer problem first. Explain the intended outcome and important tradeoffs before investing in a large implementation.

For code changes, follow the repository boundaries and validation guidance below.

## Before a code change

Complete the [README quick start](readme.md#quick-start), then read the documentation relevant to the area you are changing:

1. [Authentication architecture](docs/01-authentication.md)
2. [Why the frontend uses a BFF](docs/02-backend-for-frontend.md)
3. [Shared API contracts](docs/03-shared-contracts.md)
4. [Backend feature architecture](docs/04-backend-architecture.md)
5. [Frontend feature architecture](docs/05-frontend-architecture.md)
6. [Background work and integrations](docs/06-background-work-and-integrations.md)
7. [Testing and quality](docs/07-testing-and-quality.md)
7. [Rate limitng](docs/08-rate-limiting.md)

You do not need to memorize every document. Understand which layer owns the part you plan to change:

- A network request or response shape starts in `packages/contracts`.
- An Express use case belongs in `backend/src/modules/<feature>`.
- A provider or database connection belongs in backend infrastructure.
- A page and its interaction belong in `frontend/src/features/<feature>`.
- A genuine browser-facing JSON, file, webhook, or callback endpoint may need a Next.js Route Handler.
- A React UI mutation normally needs a feature Server Action, not a Route Handler.

Follow an existing feature pattern before creating a new abstraction or shared folder.

## Development workflow

1. Inspect the current worktree and preserve unrelated changes.
2. Trace the existing behavior through only the layers relevant to the change.
3. Change the shared contract first when a network shape changes.
4. Make the smallest cohesive change that solves the problem.
5. Add focused tests when behavior or a failure path changes.
6. Run checks proportional to the contribution.
7. Review the final diff for accidental changes, generated files, and secrets.
8. Update documentation when behavior, architecture, or workflow changes.

## Run relevant checks

Validation should match the contribution. A documentation or typo correction does not require a running database, Redis, Prisma generation, or a full production build.

- Documentation, spelling, and link fixes: review the rendered Markdown, verify changed links or commands, and run `git diff --check`.
- Frontend code: run the focused tests, frontend typecheck, and frontend lint relevant to the change.
- Backend code: run the focused tests and backend typecheck; include required services when the behavior depends on them.
- Shared contracts or cross-workspace behavior: run affected package checks, followed by workspace typecheck and tests when practical.
- Build or configuration changes: run the affected production build and the startup path you changed.

Common workspace checks are:

```bash
pnpm typecheck
pnpm test
pnpm --filter frontend lint
pnpm build
git diff --check
```

If an environment dependency prevents a relevant check, report the exact command, failure, and missing service. Do not describe an unrun or blocked check as passing.

## Database changes

Edit `backend/prisma/schema.prisma`, create a new migration, and commit both. Do not rewrite a migration that may already have been applied by another contributor.

```bash
pnpm --filter @cartura/backend prisma:migrate
pnpm --filter @cartura/backend prisma:format
pnpm --filter @cartura/backend prisma:generate
```

Include a migration test or focused repository test when the change affects constraints, concurrency, inventory, payment state, authorization, or data lifecycle.

## Code-change checklist

- The change has one clear purpose.
- Shared payloads use `@cartura/contracts`.
- Express validates untrusted params, query, and body.
- Backend business rules live in services or pure policies.
- Prisma queries and transactions live in repositories.
- API responses use named mappers and omit internal fields.
- Server Components perform rendering reads.
- Server Actions perform React UI mutations.
- Route Handlers exist only for genuine HTTP consumers.
- Browser code contains no private backend URL or credentials.
- Important success and failure paths are tested.
- User-visible states are accessible and understandable.
- Documentation reflects changed architecture or workflow.

Keep contributions focused when practical so they are easier to understand, review, and reverse. If a small improvement is naturally part of the same fix, use judgment rather than treating process as a barrier to helping.

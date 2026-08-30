# Cartura

Cartura is an open-source e-commerce application built as a pnpm monorepo. It combines a Next.js storefront and management interface, an Express API, shared Zod contracts, PostgreSQL persistence, Better Auth, Redis-backed background work, Cloudinary media, and Paymob payments.

## Who is Cartura built for?

Cartura is built for developers, merchants, agencies, and teams who want a working e-commerce foundation they can run and edit instead of building authentication, catalog, cart, orders, payments, refunds, and management tools from scratch.

Use Cartura as a starting point: keep the parts that fit, replace the parts that do not, and extend the shared contracts and feature modules for the needs of your store or client.

## Requirements

- Node.js 22 LTS recommended
- Corepack with pnpm 11.9.0
- PostgreSQL with a local database named `cartura`, or another database reflected in `DATABASE_URL`
- Docker with Docker Compose for the bundled Redis development service
- Optional provider credentials for Google OAuth, SMTP email, Cloudinary media, and Paymob card payments and refunds

## Quick start

1. Install dependencies from the repository root:

   ```bash
   corepack enable
   corepack prepare pnpm@11.9.0 --activate
   pnpm install
   ```

2. Create the backend environment file:

   ```bash
   cp backend/.env.example backend/.env
   ```

   On PowerShell, use:

   ```powershell
   Copy-Item backend/.env.example backend/.env
   ```

3. Update `backend/.env`. At minimum, confirm `DATABASE_URL`, set a private `BETTER_AUTH_SECRET` of at least 32 characters, and decide whether development seed users or a bootstrapped super-admin should be enabled.

4. Generate Prisma Client, apply the committed database migrations, and seed the development database:

   ```bash
   pnpm dev:setup
   ```

   Run this setup command after first installing the project and whenever you intentionally need to apply new migrations or reseed development data. Normal development startup does not reseed the database.

5. In the first terminal, start Redis, the shared contracts watcher, and the Express API:

   ```bash
   pnpm run dev:backend
   ```

   Wait for `Cartura API running at http://localhost:4000` before continuing. If the backend does not reach this message, inspect the first terminal and resolve the reported startup error.

6. In a second terminal, start Next.js:

   ```bash
   pnpm run dev:frontend
   ```

   The frontend also verifies the API health check before starting. The default timeout is 180 seconds. Override it with `CARTURA_DEV_STARTUP_TIMEOUT_MS`, or use `pnpm run dev:frontend:immediate` when you intentionally want to start Next.js without waiting for the API.

7. Open the application at [http://localhost:3000](http://localhost:3000). The API runs at [http://localhost:4000](http://localhost:4000), with OpenAPI documentation at [http://localhost:4000/docs](http://localhost:4000/docs).

The frontend defaults to `http://localhost:4000` for the API; set the server-only `CARTURA_API_URL` environment variable when the backend uses another origin.

## Workspace

```text
backend/             Express API, domain services, Prisma, workers, and providers
frontend/            Next.js storefront, account area, and management interface
packages/contracts/  Shared Zod request and response contracts
docs/                Architecture and operating documentation
docker/              Local service images used by development tooling
```

## Documentation

Read these in order if you are new to the project:

1. [Authentication architecture](docs/01-authentication.md)
2. [Why the frontend uses a BFF](docs/02-backend-for-frontend.md)
3. [Shared API contracts](docs/03-shared-contracts.md)
4. [Backend feature architecture](docs/04-backend-architecture.md)
5. [Frontend feature architecture](docs/05-frontend-architecture.md)
6. [Background work and integrations](docs/06-background-work-and-integrations.md)
7. [Testing and quality](docs/07-testing-and-quality.md)
8. [Rate limiting](docs/08-rate-limiting.md)
9. [Hosting and deployment](docs/09-hosting-and-deployment.md)

## Common commands

```bash
pnpm dev:setup
pnpm typecheck
pnpm test
pnpm build
pnpm redis:logs
pnpm redis:down
```

## Contributing

[Read the contributor guide](CONTRIBUTING.md).

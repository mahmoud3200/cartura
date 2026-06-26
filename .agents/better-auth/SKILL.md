---
name: better-auth
description: Use this skill when handling authentication workflows, writing database schemas for auth, or implementing Better Auth routes and helpers.
---

# Better Auth Integration Rules

## Core Constraints

- Always use `better-auth` library ecosystem patterns.
- Do not invent custom JWT verification scripts if native handlers exist.
- Ensure `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL` are referenced from environment variables.

## Implementation Workflow

1. **Schema Def**: Ensure the User, Session, and Account models map precisely to Better Auth's expected database fields.
2. **Client/Server Init**: Initialize the auth client using `auth.ts` or `auth.js`.
3. **Route Handling**: Catch all API requests under the `/api/auth/*` catch-all route handler.
4. **Migration**: Remind the developer to run `npx @better-auth/cli@latest migrate` when schema updates occur.

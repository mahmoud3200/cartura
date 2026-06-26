-- Unify Better Auth with the main ecommerce users table.
-- Existing Better Auth rows used auth_users.id as TEXT. The main users table uses UUID.
-- We map auth rows to users by email, then rewrite Better Auth foreign keys to users.id.

ALTER TABLE "auth_sessions" DROP CONSTRAINT IF EXISTS "auth_sessions_userId_fkey";
ALTER TABLE "auth_accounts_better" DROP CONSTRAINT IF EXISTS "auth_accounts_better_userId_fkey";
ALTER TABLE "auth_two_factors" DROP CONSTRAINT IF EXISTS "auth_two_factors_userId_fkey";

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "name" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email_verified" BOOLEAN;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "image" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "two_factor_enabled" BOOLEAN;

UPDATE "users" AS u
SET
  "name" = COALESCE(au."name", u."username", split_part(u."email", '@', 1)),
  "email_verified" = COALESCE(au."emailVerified", u."email_verified_at" IS NOT NULL, false),
  "image" = au."image",
  "two_factor_enabled" = COALESCE(au."twoFactorEnabled", false)
FROM "auth_users" AS au
WHERE lower(au."email") = lower(u."email");

UPDATE "users"
SET
  "name" = COALESCE("name", "username", split_part("email", '@', 1)),
  "email_verified" = COALESCE("email_verified", "email_verified_at" IS NOT NULL, false),
  "two_factor_enabled" = COALESCE("two_factor_enabled", false);

DELETE FROM "auth_sessions" AS s
WHERE NOT EXISTS (
  SELECT 1
  FROM "auth_users" AS au
  JOIN "users" AS u ON lower(u."email") = lower(au."email")
  WHERE s."userId" = au."id"
);

DELETE FROM "auth_accounts_better" AS a
WHERE NOT EXISTS (
  SELECT 1
  FROM "auth_users" AS au
  JOIN "users" AS u ON lower(u."email") = lower(au."email")
  WHERE a."userId" = au."id"
);

DELETE FROM "auth_two_factors" AS t
WHERE NOT EXISTS (
  SELECT 1
  FROM "auth_users" AS au
  JOIN "users" AS u ON lower(u."email") = lower(au."email")
  WHERE t."userId" = au."id"
);

UPDATE "auth_sessions" AS s
SET "userId" = u."id"::text
FROM "auth_users" AS au
JOIN "users" AS u ON lower(u."email") = lower(au."email")
WHERE s."userId" = au."id";

UPDATE "auth_accounts_better" AS a
SET "userId" = u."id"::text
FROM "auth_users" AS au
JOIN "users" AS u ON lower(u."email") = lower(au."email")
WHERE a."userId" = au."id";

UPDATE "auth_two_factors" AS t
SET "userId" = u."id"::text
FROM "auth_users" AS au
JOIN "users" AS u ON lower(u."email") = lower(au."email")
WHERE t."userId" = au."id";

ALTER TABLE "auth_sessions" ALTER COLUMN "userId" TYPE UUID USING "userId"::uuid;
ALTER TABLE "auth_accounts_better" ALTER COLUMN "userId" TYPE UUID USING "userId"::uuid;
ALTER TABLE "auth_two_factors" ALTER COLUMN "userId" TYPE UUID USING "userId"::uuid;

ALTER TABLE "users" ALTER COLUMN "name" SET NOT NULL;
ALTER TABLE "users" ALTER COLUMN "email_verified" SET DEFAULT false;
ALTER TABLE "users" ALTER COLUMN "email_verified" SET NOT NULL;
ALTER TABLE "users" ALTER COLUMN "two_factor_enabled" SET DEFAULT false;
ALTER TABLE "users" ALTER COLUMN "two_factor_enabled" SET NOT NULL;

ALTER TABLE "users" DROP COLUMN IF EXISTS "username";
ALTER TABLE "users" DROP COLUMN IF EXISTS "email_verified_at";

DROP TABLE IF EXISTS "local_credentials" CASCADE;
DROP TABLE IF EXISTS "auth_accounts" CASCADE;
DROP TABLE IF EXISTS "refresh_sessions" CASCADE;
DROP TABLE IF EXISTS "email_verification_tokens" CASCADE;
DROP TABLE IF EXISTS "password_reset_tokens" CASCADE;
DROP TABLE IF EXISTS "auth_users" CASCADE;

CREATE INDEX IF NOT EXISTS "user_roles_role_id_idx" ON "user_roles"("role_id");
CREATE INDEX IF NOT EXISTS "role_permissions_permission_id_idx" ON "role_permissions"("permission_id");

ALTER TABLE "auth_sessions"
  ADD CONSTRAINT "auth_sessions_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "auth_accounts_better"
  ADD CONSTRAINT "auth_accounts_better_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "auth_two_factors"
  ADD CONSTRAINT "auth_two_factors_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

ALTER TABLE "auth_sessions"
  ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;

ALTER TABLE "auth_accounts_better"
  ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;

ALTER TABLE "auth_verifications"
  ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;

ALTER TABLE "auth_two_factors"
  ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;

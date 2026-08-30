-- Prevent role-name races from creating names that differ only by case.
CREATE UNIQUE INDEX "roles_name_case_insensitive_key"
  ON "roles" (LOWER("name"));

-- Better Auth's production rate limiter uses this shared database table.
CREATE TABLE "auth_rate_limits" (
  "id" UUID NOT NULL,
  "key" TEXT NOT NULL,
  "count" INTEGER NOT NULL,
  "last_request" BIGINT NOT NULL,

  CONSTRAINT "auth_rate_limits_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "auth_rate_limits_key_key"
  ON "auth_rate_limits" ("key");

CREATE INDEX "auth_rate_limits_last_request_idx"
  ON "auth_rate_limits" ("last_request");

-- Preserve the actor's display identity even if the user is later changed or deleted.
ALTER TABLE "audit_logs"
  ADD COLUMN "actor_id_snapshot" UUID,
  ADD COLUMN "actor_name_snapshot" TEXT,
  ADD COLUMN "actor_first_name_snapshot" TEXT,
  ADD COLUMN "actor_last_name_snapshot" TEXT,
  ADD COLUMN "actor_email_snapshot" TEXT;

UPDATE "audit_logs" AS audit_log
SET
  "actor_id_snapshot" = actor."id",
  "actor_name_snapshot" = actor."name",
  "actor_first_name_snapshot" = actor."first_name",
  "actor_last_name_snapshot" = actor."last_name",
  "actor_email_snapshot" = actor."email"
FROM "users" AS actor
WHERE audit_log."actor_user_id" = actor."id";

-- Migrations run before Prisma's application seed command.  This role is a
-- database invariant for the backfill and trigger below, so establish it here
-- rather than requiring pre-existing seed data.
INSERT INTO "roles" (
  "id",
  "name",
  "description",
  "is_system_role",
  "updated_at"
)
SELECT
  gen_random_uuid(),
  'customer',
  'Default role assigned to registered customers',
  true,
  CURRENT_TIMESTAMP
WHERE NOT EXISTS (
  SELECT 1
  FROM "roles"
  WHERE LOWER("name") = 'customer'
);

-- Retain an already-seeded role if present, but normalize its system metadata.
UPDATE "roles"
SET
  "name" = 'customer',
  "description" = 'Default role assigned to registered customers',
  "is_system_role" = true,
  "updated_at" = CURRENT_TIMESTAMP
WHERE LOWER("name") = 'customer';

DO $$
DECLARE
  customer_role_id UUID;
BEGIN
  SELECT "id"
  INTO customer_role_id
  FROM "roles"
  WHERE LOWER("name") = 'customer';

  IF customer_role_id IS NULL THEN
    RAISE EXCEPTION 'The system role "customer" has not been seeded';
  END IF;

  INSERT INTO "user_roles" ("user_id", "role_id")
  SELECT "users"."id", customer_role_id
  FROM "users"
  WHERE NOT EXISTS (
    SELECT 1
    FROM "user_roles"
    WHERE "user_roles"."user_id" = "users"."id"
  )
  ON CONFLICT ("user_id") DO NOTHING;
END;
$$;

-- Assigning the customer role in an AFTER INSERT trigger keeps user creation and
-- the required default authorization row in the same database transaction.
CREATE OR REPLACE FUNCTION assign_default_customer_role()
RETURNS trigger AS $$
DECLARE
  customer_role_id UUID;
BEGIN
  SELECT "id"
  INTO customer_role_id
  FROM "roles"
  WHERE LOWER("name") = 'customer';

  IF customer_role_id IS NULL THEN
    RAISE EXCEPTION 'The system role "customer" has not been seeded';
  END IF;

  INSERT INTO "user_roles" ("user_id", "role_id")
  VALUES (NEW."id", customer_role_id)
  ON CONFLICT ("user_id") DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS "users_assign_default_customer_role_after_insert"
  ON "users";

CREATE TRIGGER "users_assign_default_customer_role_after_insert"
AFTER INSERT ON "users"
FOR EACH ROW
EXECUTE FUNCTION assign_default_customer_role();

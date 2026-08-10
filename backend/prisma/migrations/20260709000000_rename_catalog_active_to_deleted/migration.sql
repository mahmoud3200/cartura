DROP INDEX IF EXISTS "categories_is_active_parent_category_id_idx";
DROP INDEX IF EXISTS "products_is_active_created_at_idx";

ALTER TABLE "categories" RENAME COLUMN "is_active" TO "is_deleted";
ALTER TABLE "products" RENAME COLUMN "is_active" TO "is_deleted";

UPDATE "categories" SET "is_deleted" = NOT "is_deleted";
UPDATE "products" SET "is_deleted" = NOT "is_deleted";

ALTER TABLE "categories" ALTER COLUMN "is_deleted" SET DEFAULT false;
ALTER TABLE "products" ALTER COLUMN "is_deleted" SET DEFAULT false;

CREATE INDEX IF NOT EXISTS "categories_is_deleted_parent_category_id_idx" ON "categories"("is_deleted", "parent_category_id");
CREATE INDEX IF NOT EXISTS "products_is_deleted_created_at_idx" ON "products"("is_deleted", "created_at");

DROP INDEX "products_slug_key";

CREATE UNIQUE INDEX "products_active_slug_key"
ON "products"("slug")
WHERE "is_deleted" = false;

CREATE INDEX "products_slug_is_deleted_idx"
ON "products"("slug", "is_deleted");

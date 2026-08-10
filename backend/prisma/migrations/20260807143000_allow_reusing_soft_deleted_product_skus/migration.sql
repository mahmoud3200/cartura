DROP INDEX "products_sku_key";

CREATE UNIQUE INDEX "products_active_sku_key"
ON "products"("sku")
WHERE "is_deleted" = false;

CREATE INDEX "products_sku_is_deleted_idx"
ON "products"("sku", "is_deleted");

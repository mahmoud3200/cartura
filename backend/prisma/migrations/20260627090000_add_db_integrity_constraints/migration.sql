-- Indexes Prisma can also represent in schema.prisma
CREATE INDEX IF NOT EXISTS "categories_parent_category_id_idx" ON "categories"("parent_category_id");
CREATE INDEX IF NOT EXISTS "categories_created_by_idx" ON "categories"("created_by");
CREATE INDEX IF NOT EXISTS "categories_is_active_parent_category_id_idx" ON "categories"("is_active", "parent_category_id");
CREATE INDEX IF NOT EXISTS "products_created_by_idx" ON "products"("created_by");
CREATE INDEX IF NOT EXISTS "products_is_active_created_at_idx" ON "products"("is_active", "created_at");
CREATE INDEX IF NOT EXISTS "product_categories_category_id_idx" ON "product_categories"("category_id");
CREATE INDEX IF NOT EXISTS "product_images_product_id_display_order_idx" ON "product_images"("product_id", "display_order");
CREATE INDEX IF NOT EXISTS "cart_items_product_id_idx" ON "cart_items"("product_id");
CREATE INDEX IF NOT EXISTS "orders_status_created_at_idx" ON "orders"("status", "created_at");
CREATE INDEX IF NOT EXISTS "payments_status_idx" ON "payments"("status");
CREATE INDEX IF NOT EXISTS "refunds_status_idx" ON "refunds"("status");
CREATE INDEX IF NOT EXISTS "notification_deliveries_status_scheduled_at_idx" ON "notification_deliveries"("status", "scheduled_at");

-- PostgreSQL-only constraints Prisma cannot currently express in schema.prisma.
ALTER TABLE "users"
  ADD CONSTRAINT "users_account_status_check"
  CHECK ("account_status" IN ('active', 'suspended', 'disabled'));

CREATE UNIQUE INDEX "addresses_one_default_per_user_idx"
  ON "addresses"("user_id")
  WHERE "is_default" = true;

ALTER TABLE "products"
  ADD CONSTRAINT "products_price_non_negative_check" CHECK ("price" >= 0),
  ADD CONSTRAINT "products_stock_quantity_non_negative_check" CHECK ("stock_quantity" >= 0);

ALTER TABLE "product_images"
  ADD CONSTRAINT "product_images_display_order_non_negative_check" CHECK ("display_order" >= 0);

ALTER TABLE "cart_items"
  ADD CONSTRAINT "cart_items_quantity_positive_check" CHECK ("quantity" > 0);

ALTER TABLE "orders"
  ADD CONSTRAINT "orders_status_check"
    CHECK ("status" IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
  ADD CONSTRAINT "orders_subtotal_non_negative_check" CHECK ("subtotal" >= 0),
  ADD CONSTRAINT "orders_shipping_cost_non_negative_check" CHECK ("shipping_cost" >= 0),
  ADD CONSTRAINT "orders_discount_amount_non_negative_check" CHECK ("discount_amount" >= 0),
  ADD CONSTRAINT "orders_total_amount_non_negative_check" CHECK ("total_amount" >= 0),
  ADD CONSTRAINT "orders_currency_format_check" CHECK ("currency" ~ '^[A-Z]{3}$');

ALTER TABLE "order_items"
  ADD CONSTRAINT "order_items_quantity_positive_check" CHECK ("quantity" > 0),
  ADD CONSTRAINT "order_items_unit_price_non_negative_check" CHECK ("unit_price" >= 0),
  ADD CONSTRAINT "order_items_total_price_non_negative_check" CHECK ("total_price" >= 0);

ALTER TABLE "order_status_history"
  ADD CONSTRAINT "order_status_history_actor_type_check"
    CHECK ("actor_type" IN ('customer', 'staff', 'system')),
  ADD CONSTRAINT "order_status_history_previous_status_check"
    CHECK ("previous_status" IS NULL OR "previous_status" IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
  ADD CONSTRAINT "order_status_history_new_status_check"
    CHECK ("new_status" IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'));

ALTER TABLE "payments"
  ADD CONSTRAINT "payments_status_check"
    CHECK ("status" IN ('pending', 'requires_action', 'authorized', 'paid', 'failed', 'cancelled', 'refunded', 'partially_refunded')),
  ADD CONSTRAINT "payments_amount_non_negative_check" CHECK ("amount" >= 0),
  ADD CONSTRAINT "payments_currency_format_check" CHECK ("currency" ~ '^[A-Z]{3}$');

ALTER TABLE "payment_webhook_events"
  ADD CONSTRAINT "payment_webhook_events_status_check"
    CHECK ("status" IN ('pending', 'processing', 'processed', 'failed', 'ignored')),
  ADD CONSTRAINT "payment_webhook_events_attempts_non_negative_check" CHECK ("attempts" >= 0);

ALTER TABLE "refunds"
  ADD CONSTRAINT "refunds_status_check"
    CHECK ("status" IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  ADD CONSTRAINT "refunds_amount_positive_check" CHECK ("amount" > 0),
  ADD CONSTRAINT "refunds_currency_format_check" CHECK ("currency" ~ '^[A-Z]{3}$');

ALTER TABLE "notification_deliveries"
  ADD CONSTRAINT "notification_deliveries_status_check"
    CHECK ("status" IN ('pending', 'sent', 'failed', 'cancelled')),
  ADD CONSTRAINT "notification_deliveries_attempts_non_negative_check" CHECK ("attempts" >= 0);

ALTER TABLE "outbox_events"
  ADD CONSTRAINT "outbox_events_status_check"
    CHECK ("status" IN ('pending', 'processing', 'processed', 'failed', 'cancelled')),
  ADD CONSTRAINT "outbox_events_attempts_non_negative_check" CHECK ("attempts" >= 0);

CREATE OR REPLACE FUNCTION prevent_category_cycle()
RETURNS trigger AS $$
DECLARE
  cycle_found boolean := false;
BEGIN
  IF NEW."parent_category_id" IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW."parent_category_id" = NEW."id" THEN
    RAISE EXCEPTION 'A category cannot be its own parent';
  END IF;

  WITH RECURSIVE ancestors AS (
    SELECT "id", "parent_category_id"
    FROM "categories"
    WHERE "id" = NEW."parent_category_id"

    UNION ALL

    SELECT c."id", c."parent_category_id"
    FROM "categories" c
    INNER JOIN ancestors a ON c."id" = a."parent_category_id"
  )
  SELECT EXISTS (
    SELECT 1
    FROM ancestors
    WHERE "id" = NEW."id"
  ) INTO cycle_found;

  IF cycle_found THEN
    RAISE EXCEPTION 'Category parent relationship would create a cycle';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS "categories_prevent_cycle_before_insert_update" ON "categories";
CREATE TRIGGER "categories_prevent_cycle_before_insert_update"
BEFORE INSERT OR UPDATE OF "parent_category_id" ON "categories"
FOR EACH ROW
EXECUTE FUNCTION prevent_category_cycle();

ALTER TABLE "refunds"
  ADD COLUMN "reviewed_by" UUID,
  ADD COLUMN "reason_code" TEXT,
  ADD COLUMN "review_note" TEXT,
  ADD COLUMN "resolution" TEXT,
  ADD COLUMN "refund_method" TEXT,
  ADD COLUMN "pickup_scheduled_at" TIMESTAMP(3),
  ADD COLUMN "item_received_at" TIMESTAMP(3),
  ADD COLUMN "reviewed_at" TIMESTAMP(3);

ALTER TABLE "refunds"
  ADD CONSTRAINT "refunds_reviewed_by_fkey"
    FOREIGN KEY ("reviewed_by") REFERENCES "users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "refunds_reviewed_by_idx" ON "refunds"("reviewed_by");

UPDATE "refunds" AS "refund"
SET "refund_method" = CASE
  WHEN "payment"."payment_method" = 'cash_on_delivery' THEN 'cash'
  ELSE 'card'
END
FROM "payments" AS "payment"
WHERE "payment"."id" = "refund"."payment_id";

ALTER TABLE "refunds"
  ALTER COLUMN "refund_method" SET NOT NULL;

ALTER TABLE "orders"
  DROP CONSTRAINT IF EXISTS "orders_status_check";
ALTER TABLE "orders"
  ADD CONSTRAINT "orders_status_check"
  CHECK ("status" IN (
    'pending', 'confirmed', 'paid', 'payment_failed', 'processing', 'shipped',
    'completed', 'cancelled', 'partially_refunded', 'refunded'
  ));

ALTER TABLE "order_status_history"
  DROP CONSTRAINT IF EXISTS "order_status_history_actor_type_check",
  DROP CONSTRAINT IF EXISTS "order_status_history_previous_status_check",
  DROP CONSTRAINT IF EXISTS "order_status_history_new_status_check";
ALTER TABLE "order_status_history"
  ADD CONSTRAINT "order_status_history_actor_type_check"
    CHECK ("actor_type" IN ('customer', 'staff', 'system', 'provider')),
  ADD CONSTRAINT "order_status_history_previous_status_check"
    CHECK ("previous_status" IS NULL OR "previous_status" IN (
      'pending', 'confirmed', 'paid', 'payment_failed', 'processing', 'shipped',
      'completed', 'cancelled', 'partially_refunded', 'refunded'
    )),
  ADD CONSTRAINT "order_status_history_new_status_check"
    CHECK ("new_status" IN (
      'pending', 'confirmed', 'paid', 'payment_failed', 'processing', 'shipped',
      'completed', 'cancelled', 'partially_refunded', 'refunded'
    ));

ALTER TABLE "payment_webhook_events"
  DROP CONSTRAINT IF EXISTS "payment_webhook_events_status_check";
ALTER TABLE "payment_webhook_events"
  ADD CONSTRAINT "payment_webhook_events_status_check"
  CHECK ("status" IN ('received', 'processed', 'failed', 'manual_review'));

ALTER TABLE "refunds"
  DROP CONSTRAINT IF EXISTS "refunds_status_check";
ALTER TABLE "refunds"
  ADD CONSTRAINT "refunds_status_check"
    CHECK ("status" IN (
      'requested', 'approved', 'rejected', 'pickup_scheduled', 'item_received',
      'processing', 'completed', 'failed'
    )),
  ADD CONSTRAINT "refunds_reason_code_check"
    CHECK ("reason_code" IS NULL OR "reason_code" IN (
      'damaged', 'defective', 'wrong_item', 'not_as_described', 'changed_mind', 'other'
    )),
  ADD CONSTRAINT "refunds_resolution_check"
    CHECK ("resolution" IS NULL OR "resolution" IN ('pickup', 'keep_item')),
  ADD CONSTRAINT "refunds_method_check"
    CHECK ("refund_method" IS NULL OR "refund_method" IN ('card', 'cash'));

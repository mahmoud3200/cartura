ALTER TABLE "payment_webhook_events"
  ADD COLUMN "claim_token" UUID,
  ADD COLUMN "claimed_at" TIMESTAMP(3);

ALTER TABLE "notification_deliveries"
  ADD COLUMN "claim_token" UUID,
  ADD COLUMN "claimed_at" TIMESTAMP(3);

ALTER TABLE "outbox_events"
  ADD COLUMN "claim_token" UUID,
  ADD COLUMN "claimed_at" TIMESTAMP(3);

ALTER TABLE "orders"
  ALTER COLUMN "currency" SET DEFAULT 'EGP';

ALTER TABLE "payment_webhook_events"
  DROP CONSTRAINT IF EXISTS "payment_webhook_events_status_check";

ALTER TABLE "payment_webhook_events"
  ADD CONSTRAINT "payment_webhook_events_status_check"
  CHECK (
    "status" IN ('received', 'processing', 'processed', 'failed', 'manual_review')
  );

ALTER TABLE "notification_deliveries"
  DROP CONSTRAINT IF EXISTS "notification_deliveries_status_check";

ALTER TABLE "notification_deliveries"
  ADD CONSTRAINT "notification_deliveries_status_check"
  CHECK (
    "status" IN ('pending', 'processing', 'sent', 'failed', 'cancelled')
  );

-- A pre-migration worker cannot own a lease token, so make any interrupted
-- delivery or outbox work eligible for a clean retry before enforcing lease
-- consistency. Deploy this migration while the old workers are stopped.
UPDATE "notification_deliveries"
SET
  "status" = 'pending',
  "scheduled_at" = COALESCE("scheduled_at", NOW())
WHERE "status" = 'processing';

UPDATE "outbox_events"
SET
  "status" = 'pending',
  "available_at" = NOW()
WHERE "status" = 'processing';

ALTER TABLE "payment_webhook_events"
  ADD CONSTRAINT "payment_webhook_events_claim_consistency_check"
  CHECK (
    (
      "status" = 'processing'
      AND "claim_token" IS NOT NULL
      AND "claimed_at" IS NOT NULL
    )
    OR (
      "status" <> 'processing'
      AND "claim_token" IS NULL
      AND "claimed_at" IS NULL
    )
  );

ALTER TABLE "notification_deliveries"
  ADD CONSTRAINT "notification_deliveries_claim_consistency_check"
  CHECK (
    (
      "status" = 'processing'
      AND "claim_token" IS NOT NULL
      AND "claimed_at" IS NOT NULL
    )
    OR (
      "status" <> 'processing'
      AND "claim_token" IS NULL
      AND "claimed_at" IS NULL
    )
  );

ALTER TABLE "outbox_events"
  ADD CONSTRAINT "outbox_events_claim_consistency_check"
  CHECK (
    (
      "status" = 'processing'
      AND "claim_token" IS NOT NULL
      AND "claimed_at" IS NOT NULL
    )
    OR (
      "status" <> 'processing'
      AND "claim_token" IS NULL
      AND "claimed_at" IS NULL
    )
  );

CREATE INDEX "payment_webhook_events_status_claimed_at_idx"
  ON "payment_webhook_events"("status", "claimed_at");

CREATE INDEX "notification_deliveries_status_claimed_at_idx"
  ON "notification_deliveries"("status", "claimed_at");

CREATE INDEX "outbox_events_status_claimed_at_idx"
  ON "outbox_events"("status", "claimed_at");

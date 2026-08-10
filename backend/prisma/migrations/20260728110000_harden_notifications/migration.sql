ALTER TABLE "notifications"
ADD COLUMN "source_event_id" UUID;

CREATE UNIQUE INDEX "notifications_source_event_id_key"
ON "notifications"("source_event_id");

CREATE INDEX "notifications_user_id_created_at_idx"
ON "notifications"("user_id", "created_at");

CREATE INDEX "notifications_user_id_read_at_created_at_idx"
ON "notifications"("user_id", "read_at", "created_at");

ALTER TABLE "outbox_events"
ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

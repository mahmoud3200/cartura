CREATE INDEX IF NOT EXISTS "users_created_at_idx" ON "users"("created_at");
CREATE INDEX IF NOT EXISTS "orders_created_at_idx" ON "orders"("created_at");
CREATE INDEX IF NOT EXISTS "payments_status_paid_at_idx" ON "payments"("status", "paid_at");
CREATE INDEX IF NOT EXISTS "payment_webhook_events_received_at_idx" ON "payment_webhook_events"("received_at");
CREATE INDEX IF NOT EXISTS "payment_webhook_events_status_received_at_idx" ON "payment_webhook_events"("status", "received_at");
CREATE INDEX IF NOT EXISTS "refunds_created_at_idx" ON "refunds"("created_at");
CREATE INDEX IF NOT EXISTS "refunds_status_completed_at_idx" ON "refunds"("status", "completed_at");

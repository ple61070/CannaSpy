-- Note: 008_delivery_services.sql exists on feat/session-6-cc-redesign
-- with different content. On merge, one of these two 008 migrations
-- needs to be renumbered to 009 to preserve apply order.

-- Webhook event deduplication for Stripe retries.
-- Stripe retries on any non-2xx response; without this table, the same
-- event_id can be processed multiple times, causing double-effects
-- (duplicate cancelBlock calls, duplicate audit_log rows, etc.).
--
-- Scoped to webhook idempotency only. Not used for general request dedup.

CREATE TABLE IF NOT EXISTS webhook_events (
  event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_processed_at
  ON webhook_events (processed_at DESC);

-- Comment for retention strategy: rows can be safely purged after 30 days
-- since Stripe stops retrying after 3 days. A periodic cleanup job is not
-- needed for correctness, only for table size hygiene.

-- down:
-- DROP INDEX IF EXISTS idx_webhook_events_processed_at;
-- DROP TABLE IF EXISTS webhook_events;

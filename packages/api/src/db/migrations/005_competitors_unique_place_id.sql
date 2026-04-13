-- ============================================================
-- Migration 005 — Unique constraint on competitors.google_place_id
-- Version: 1.0 | March 2026
-- ============================================================
-- Required for places_client.py upsert ON CONFLICT (google_place_id)
-- up

-- Remove any duplicate google_place_id rows before adding constraint
-- (keep the most recently created row per google_place_id)
DELETE FROM competitors
WHERE id NOT IN (
  SELECT DISTINCT ON (google_place_id) id
  FROM competitors
  WHERE google_place_id IS NOT NULL
  ORDER BY google_place_id, created_at DESC
)
AND google_place_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_competitors_google_place_id_unique
  ON competitors(google_place_id)
  WHERE google_place_id IS NOT NULL;

-- down
-- DROP INDEX IF EXISTS idx_competitors_google_place_id_unique;

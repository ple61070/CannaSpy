-- ============================================================
-- Migration 003 — Add slug column to competitors table
-- Version: 1.0 | March 2026
-- ============================================================
-- up

ALTER TABLE competitors
  ADD COLUMN IF NOT EXISTS slug TEXT;

COMMENT ON COLUMN competitors.slug IS
  'Platform listing slug used by the primary pipeline to call the menu API. '
  'Obtained via Google Places slug discovery flow. '
  'Example: ''off-the-charts'', ''catalyst-cannabis-company''.';

CREATE INDEX IF NOT EXISTS idx_competitors_slug
  ON competitors(slug) WHERE slug IS NOT NULL;

-- down
-- DROP INDEX IF EXISTS idx_competitors_slug;
-- ALTER TABLE competitors DROP COLUMN IF EXISTS slug;

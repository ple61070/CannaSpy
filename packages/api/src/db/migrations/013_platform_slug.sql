-- 013_platform_slug.sql
-- Allows platform-sourced delivery operators (no DCC license in registry)
-- to be stored in the dispensaries table alongside DCC records.
-- up

-- Delivery operators on the primary platform often have no DCC license number
-- in the platform's data — they are tracked solely by slug.
ALTER TABLE dispensaries ALTER COLUMN dcc_license DROP NOT NULL;

-- Slug uniquely identifies a listing on the primary data platform.
-- NULL for DCC-only records; set when platform data is ingested.
ALTER TABLE dispensaries ADD COLUMN IF NOT EXISTS platform_slug TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS dispensaries_platform_slug_idx
  ON dispensaries(platform_slug)
  WHERE platform_slug IS NOT NULL;

-- down
-- DROP INDEX IF EXISTS dispensaries_platform_slug_idx;
-- ALTER TABLE dispensaries DROP COLUMN IF EXISTS platform_slug;
-- ALTER TABLE dispensaries ALTER COLUMN dcc_license SET NOT NULL;

-- 012: add legal_name column to dispensaries for dual-name search
ALTER TABLE dispensaries ADD COLUMN IF NOT EXISTS legal_name TEXT;
CREATE INDEX IF NOT EXISTS dispensaries_legal_name_idx ON dispensaries USING gin(to_tsvector('english', coalesce(legal_name, '')));

-- down: ALTER TABLE dispensaries DROP COLUMN IF EXISTS legal_name;

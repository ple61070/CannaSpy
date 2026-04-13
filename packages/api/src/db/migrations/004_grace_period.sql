-- up
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS grace_period_ends_at TIMESTAMPTZ;

-- down
-- ALTER TABLE organizations DROP COLUMN IF EXISTS grace_period_ends_at;

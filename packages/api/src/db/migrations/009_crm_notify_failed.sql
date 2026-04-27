-- Adds crm_notify_failed flag to block_list, set TRUE when the CRM
-- alert worker exhausts all retries. Operators can query this via
-- the new admin endpoint to manually re-trigger or investigate.

ALTER TABLE block_list
  ADD COLUMN IF NOT EXISTS crm_notify_failed BOOLEAN NOT NULL DEFAULT FALSE;

-- Partial index keeps it small — vast majority of rows will be FALSE.
CREATE INDEX IF NOT EXISTS idx_block_list_crm_notify_failed
  ON block_list (crm_notify_failed)
  WHERE crm_notify_failed = TRUE;

-- down:
-- DROP INDEX IF EXISTS idx_block_list_crm_notify_failed;
-- ALTER TABLE block_list DROP COLUMN IF EXISTS crm_notify_failed;

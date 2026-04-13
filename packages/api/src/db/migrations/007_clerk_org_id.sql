-- ============================================================
-- Migration 007 — Clerk org ID mapping + contact_email
-- ============================================================
-- Problem: organizations.id (UUID) was being used with Clerk org IDs
-- (strings like "org_2abc..."), causing runtime failures on every DB write.
-- Fix: add clerk_org_id TEXT column; routes now map Clerk IDs → DB UUIDs.
-- Also adds contact_email for dunning emails.
-- ============================================================

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS clerk_org_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS contact_email TEXT;

-- ============================================================
-- Update RLS policies: Clerk JWT org_id claim is a TEXT string.
-- Organizations table: match directly on clerk_org_id.
-- All other tables: subquery through organizations to get the UUID.
-- ============================================================

-- ORGANIZATIONS
DROP POLICY IF EXISTS "org_isolation" ON organizations;
CREATE POLICY "org_isolation" ON organizations
  FOR ALL
  USING (clerk_org_id = (auth.jwt() ->> 'org_id'))
  WITH CHECK (clerk_org_id = (auth.jwt() ->> 'org_id'));

-- LOCATIONS
DROP POLICY IF EXISTS "org_isolation" ON locations;
CREATE POLICY "org_isolation" ON locations
  FOR ALL
  USING (org_id IN (SELECT id FROM organizations WHERE clerk_org_id = (auth.jwt() ->> 'org_id')))
  WITH CHECK (org_id IN (SELECT id FROM organizations WHERE clerk_org_id = (auth.jwt() ->> 'org_id')));

-- TRACKED COMPETITORS (scoped via locations)
DROP POLICY IF EXISTS "org_isolation" ON tracked_competitors;
CREATE POLICY "org_isolation" ON tracked_competitors
  FOR ALL
  USING (
    location_id IN (
      SELECT l.id FROM locations l
      JOIN organizations o ON o.id = l.org_id
      WHERE o.clerk_org_id = (auth.jwt() ->> 'org_id')
    )
  )
  WITH CHECK (
    location_id IN (
      SELECT l.id FROM locations l
      JOIN organizations o ON o.id = l.org_id
      WHERE o.clerk_org_id = (auth.jwt() ->> 'org_id')
    )
  );

-- BLOCK LIST
DROP POLICY IF EXISTS "org_isolation" ON block_list;
CREATE POLICY "org_isolation" ON block_list
  FOR ALL
  USING (org_id IN (SELECT id FROM organizations WHERE clerk_org_id = (auth.jwt() ->> 'org_id')))
  WITH CHECK (org_id IN (SELECT id FROM organizations WHERE clerk_org_id = (auth.jwt() ->> 'org_id')));

-- ALERTS
DROP POLICY IF EXISTS "org_isolation" ON alerts;
CREATE POLICY "org_isolation" ON alerts
  FOR ALL
  USING (org_id IN (SELECT id FROM organizations WHERE clerk_org_id = (auth.jwt() ->> 'org_id')))
  WITH CHECK (org_id IN (SELECT id FROM organizations WHERE clerk_org_id = (auth.jwt() ->> 'org_id')));

-- NOTIFICATION PREFERENCES
DROP POLICY IF EXISTS "org_isolation" ON notification_preferences;
CREATE POLICY "org_isolation" ON notification_preferences
  FOR ALL
  USING (org_id IN (SELECT id FROM organizations WHERE clerk_org_id = (auth.jwt() ->> 'org_id')))
  WITH CHECK (org_id IN (SELECT id FROM organizations WHERE clerk_org_id = (auth.jwt() ->> 'org_id')));

-- ANNOTATIONS
DROP POLICY IF EXISTS "org_isolation" ON annotations;
CREATE POLICY "org_isolation" ON annotations
  FOR ALL
  USING (org_id IN (SELECT id FROM organizations WHERE clerk_org_id = (auth.jwt() ->> 'org_id')))
  WITH CHECK (org_id IN (SELECT id FROM organizations WHERE clerk_org_id = (auth.jwt() ->> 'org_id')));

-- AUDIT LOG
DROP POLICY IF EXISTS "org_isolation" ON audit_log;
CREATE POLICY "org_isolation" ON audit_log
  FOR ALL
  USING (org_id IN (SELECT id FROM organizations WHERE clerk_org_id = (auth.jwt() ->> 'org_id')))
  WITH CHECK (org_id IN (SELECT id FROM organizations WHERE clerk_org_id = (auth.jwt() ->> 'org_id')));

-- ============================================================
-- DOWN MIGRATION
-- ALTER TABLE organizations DROP COLUMN IF EXISTS clerk_org_id;
-- ALTER TABLE organizations DROP COLUMN IF EXISTS contact_email;
-- (Then re-run 006_rls_policies.sql to restore UUID-cast policies)
-- ============================================================

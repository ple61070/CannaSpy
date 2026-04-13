-- ============================================================
-- Migration 006 — Row Level Security Policies
-- Applied: defines org_isolation policy on all RLS-enabled tables
-- All policies scope queries to the Clerk org_id claim in the JWT
-- ============================================================
-- Prerequisites:
--   - Clerk JWT template must include org_id claim equal to organizations.id (UUID)
--   - Use getDb(clerkToken) from db/client.ts to get an RLS-scoped Supabase client
--   - Direct pg pool queries (query()) bypass RLS — app-level auth is the first line

-- ============================================================
-- ORGANIZATIONS
-- ============================================================
DROP POLICY IF EXISTS "org_isolation" ON organizations;
CREATE POLICY "org_isolation" ON organizations
  FOR ALL
  USING (id = (auth.jwt() ->> 'org_id')::uuid)
  WITH CHECK (id = (auth.jwt() ->> 'org_id')::uuid);

-- ============================================================
-- LOCATIONS
-- ============================================================
DROP POLICY IF EXISTS "org_isolation" ON locations;
CREATE POLICY "org_isolation" ON locations
  FOR ALL
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid)
  WITH CHECK (org_id = (auth.jwt() ->> 'org_id')::uuid);

-- ============================================================
-- TRACKED COMPETITORS
-- (no direct org_id column — scoped via locations)
-- ============================================================
DROP POLICY IF EXISTS "org_isolation" ON tracked_competitors;
CREATE POLICY "org_isolation" ON tracked_competitors
  FOR ALL
  USING (
    location_id IN (
      SELECT id FROM locations WHERE org_id = (auth.jwt() ->> 'org_id')::uuid
    )
  )
  WITH CHECK (
    location_id IN (
      SELECT id FROM locations WHERE org_id = (auth.jwt() ->> 'org_id')::uuid
    )
  );

-- ============================================================
-- BLOCK LIST
-- ============================================================
DROP POLICY IF EXISTS "org_isolation" ON block_list;
CREATE POLICY "org_isolation" ON block_list
  FOR ALL
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid)
  WITH CHECK (org_id = (auth.jwt() ->> 'org_id')::uuid);

-- ============================================================
-- ALERTS
-- ============================================================
DROP POLICY IF EXISTS "org_isolation" ON alerts;
CREATE POLICY "org_isolation" ON alerts
  FOR ALL
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid)
  WITH CHECK (org_id = (auth.jwt() ->> 'org_id')::uuid);

-- ============================================================
-- NOTIFICATION PREFERENCES
-- ============================================================
DROP POLICY IF EXISTS "org_isolation" ON notification_preferences;
CREATE POLICY "org_isolation" ON notification_preferences
  FOR ALL
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid)
  WITH CHECK (org_id = (auth.jwt() ->> 'org_id')::uuid);

-- ============================================================
-- ANNOTATIONS
-- ============================================================
DROP POLICY IF EXISTS "org_isolation" ON annotations;
CREATE POLICY "org_isolation" ON annotations
  FOR ALL
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid)
  WITH CHECK (org_id = (auth.jwt() ->> 'org_id')::uuid);

-- ============================================================
-- AUDIT LOG
-- ============================================================
DROP POLICY IF EXISTS "org_isolation" ON audit_log;
CREATE POLICY "org_isolation" ON audit_log
  FOR ALL
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid)
  WITH CHECK (org_id = (auth.jwt() ->> 'org_id')::uuid);

-- ============================================================
-- DOWN MIGRATION
-- DROP POLICY IF EXISTS "org_isolation" ON organizations;
-- DROP POLICY IF EXISTS "org_isolation" ON locations;
-- DROP POLICY IF EXISTS "org_isolation" ON tracked_competitors;
-- DROP POLICY IF EXISTS "org_isolation" ON block_list;
-- DROP POLICY IF EXISTS "org_isolation" ON alerts;
-- DROP POLICY IF EXISTS "org_isolation" ON notification_preferences;
-- DROP POLICY IF EXISTS "org_isolation" ON annotations;
-- DROP POLICY IF EXISTS "org_isolation" ON audit_log;
-- ============================================================

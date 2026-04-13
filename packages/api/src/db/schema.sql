-- ============================================================
-- CannaSpy Database Schema
-- Version: 1.0 | March 2026
-- ============================================================

-- ============================================================
-- ORGANIZATIONS
-- ============================================================
CREATE TABLE organizations (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                   TEXT NOT NULL,
  slug                   TEXT UNIQUE NOT NULL,
  stripe_id              TEXT,
  stripe_subscription_id TEXT,
  plan_type              TEXT DEFAULT 'ala_carte',
  created_at             TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- LOCATIONS
-- ============================================================
CREATE TABLE locations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  address     TEXT NOT NULL,
  lat         DECIMAL(10,7),
  lng         DECIMAL(10,7),
  dcc_license TEXT,
  active      BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- COMPETITORS
-- ============================================================
CREATE TABLE competitors (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL,
  address           TEXT NOT NULL,
  lat               DECIMAL(10,7),
  lng               DECIMAL(10,7),
  website_url       TEXT,
  platform          TEXT,
  google_place_id   TEXT,
  dcc_license       TEXT,
  robots_ok         BOOLEAN,
  robots_checked_at TIMESTAMPTZ,
  last_scraped      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TRACKED COMPETITORS
-- ============================================================
CREATE TABLE tracked_competitors (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id    UUID REFERENCES locations(id) ON DELETE CASCADE,
  competitor_id  UUID REFERENCES competitors(id),
  slot_type      TEXT DEFAULT 'track',
  market_tier    TEXT DEFAULT 'standard',
  price_per_slot DECIMAL(8,2) DEFAULT 100.00,
  active         BOOLEAN DEFAULT TRUE,
  blocked_at     TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(location_id, competitor_id)
);

-- ============================================================
-- BLOCK LIST
-- ============================================================
CREATE TABLE block_list (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id            UUID REFERENCES organizations(id) ON DELETE CASCADE,
  competitor_id     UUID REFERENCES competitors(id),
  blocked_by        TEXT,
  blocked_at        TIMESTAMPTZ DEFAULT NOW(),
  unblocked_at      TIMESTAMPTZ,
  notify_on_unblock BOOLEAN DEFAULT TRUE,
  crm_notified_at   TIMESTAMPTZ,
  active            BOOLEAN DEFAULT TRUE
);

-- ============================================================
-- PRODUCTS
-- ============================================================
CREATE TABLE products (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_name TEXT NOT NULL,
  brand          TEXT,
  category       TEXT,
  subcategory    TEXT,
  package_size   TEXT,
  unit           TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PRICE OBSERVATIONS
-- ============================================================
CREATE TABLE price_observations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_id UUID REFERENCES competitors(id),
  product_id    UUID REFERENCES products(id),
  raw_name      TEXT,
  price         DECIMAL(8,2),
  in_stock      BOOLEAN DEFAULT TRUE,
  on_promo      BOOLEAN DEFAULT FALSE,
  promo_text    TEXT,
  source_url    TEXT,
  detected_at   TIMESTAMPTZ DEFAULT NOW(),
  confidence    TEXT DEFAULT 'high'
);

-- ============================================================
-- PROMOTIONS
-- ============================================================
CREATE TABLE promotions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_id UUID REFERENCES competitors(id),
  promo_text    TEXT NOT NULL,
  promo_type    TEXT,
  category      TEXT,
  detected_at   TIMESTAMPTZ DEFAULT NOW(),
  expired_at    TIMESTAMPTZ,
  source_url    TEXT,
  active        BOOLEAN DEFAULT TRUE
);

-- ============================================================
-- ALERTS
-- ============================================================
CREATE TABLE alerts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID REFERENCES organizations(id) ON DELETE CASCADE,
  location_id   UUID REFERENCES locations(id),
  competitor_id UUID REFERENCES competitors(id),
  alert_type    TEXT,
  entity_id     UUID,
  old_value     TEXT,
  new_value     TEXT,
  confidence    TEXT DEFAULT 'high',
  reviewed      BOOLEAN DEFAULT FALSE,
  reviewed_by   TEXT,
  reviewed_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ANNOTATIONS
-- ============================================================
CREATE TABLE annotations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID REFERENCES organizations(id) ON DELETE CASCADE,
  author_id   TEXT,
  entity_type TEXT,
  entity_id   UUID,
  body        TEXT NOT NULL,
  assignee_id TEXT,
  resolved    BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- AUDIT LOG
-- ============================================================
CREATE TABLE audit_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID REFERENCES organizations(id),
  user_id     TEXT,
  action      TEXT NOT NULL,
  entity_type TEXT,
  entity_id   UUID,
  metadata    JSONB,
  ip_address  INET,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- NOTIFICATION PREFERENCES
-- ============================================================
CREATE TABLE notification_preferences (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id              UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id             TEXT,
  location_id         UUID REFERENCES locations(id),
  digest_frequency    TEXT DEFAULT 'realtime',
  quiet_hours_start   TIME,
  quiet_hours_end     TIME,
  price_threshold_pct DECIMAL(5,2) DEFAULT 5.0,
  alert_types         TEXT[] DEFAULT ARRAY[
    'price_drop','price_increase','new_promo','promo_ended',
    'new_sku','sku_removed','new_competitor'
  ],
  email_enabled       BOOLEAN DEFAULT TRUE,
  push_enabled        BOOLEAN DEFAULT TRUE,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, user_id, location_id)
);

-- ============================================================
-- SCRAPE JOBS
-- ============================================================
CREATE TABLE scrape_jobs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_id   UUID REFERENCES competitors(id),
  bullmq_job_id   TEXT,
  status          TEXT DEFAULT 'queued',
  trigger         TEXT DEFAULT 'scheduled',
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  error_message   TEXT,
  records_written INT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_price_obs_competitor  ON price_observations(competitor_id, detected_at DESC);
CREATE INDEX idx_price_obs_product     ON price_observations(product_id, detected_at DESC);
CREATE INDEX idx_alerts_org            ON alerts(org_id, created_at DESC);
CREATE INDEX idx_alerts_unreviewed     ON alerts(org_id, reviewed) WHERE reviewed = FALSE;
CREATE INDEX idx_tracked_active        ON tracked_competitors(location_id, active) WHERE active = TRUE;
CREATE INDEX idx_block_list_active     ON block_list(active) WHERE active = TRUE;
CREATE INDEX idx_scrape_jobs_competitor ON scrape_jobs(competitor_id, created_at DESC);
CREATE INDEX idx_scrape_jobs_status    ON scrape_jobs(status) WHERE status IN ('queued','running');
CREATE INDEX idx_notif_prefs_org       ON notification_preferences(org_id);
CREATE INDEX idx_block_list_org        ON block_list(org_id, active) WHERE active = TRUE;
CREATE INDEX idx_alerts_location       ON alerts(location_id, created_at DESC);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracked_competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE block_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

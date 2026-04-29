-- 010_dispensaries.sql
-- up

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS dispensaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dcc_license TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  zip TEXT,
  county TEXT,
  license_type TEXT CHECK (license_type IN ('retail','delivery','microbusiness')) DEFAULT 'retail',
  dcc_status TEXT DEFAULT 'active',
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  geocoded_at TIMESTAMPTZ,
  -- enrichment flags (from our scraper pipeline)
  enriched BOOLEAN DEFAULT FALSE,
  last_scraped_at TIMESTAMPTZ,
  threat_score NUMERIC(3,2),
  market_tier TEXT CHECK (market_tier IN ('elite','hot','competitive','standard')),
  price_observations_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS dispensaries_lat_lng ON dispensaries(lat, lng)
  WHERE lat IS NOT NULL AND lng IS NOT NULL;
CREATE INDEX IF NOT EXISTS dispensaries_city ON dispensaries(city);
CREATE INDEX IF NOT EXISTS dispensaries_tier ON dispensaries(market_tier);
CREATE INDEX IF NOT EXISTS dispensaries_enriched ON dispensaries(enriched);
CREATE INDEX IF NOT EXISTS dispensaries_license_type ON dispensaries(license_type);

CREATE TABLE IF NOT EXISTS org_dispensary_state (
  org_id TEXT NOT NULL,
  dispensary_id UUID NOT NULL REFERENCES dispensaries(id) ON DELETE CASCADE,
  track_state TEXT NOT NULL DEFAULT 'untracked' CHECK (track_state IN ('untracked','tracked','blocked')),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (org_id, dispensary_id)
);

CREATE INDEX IF NOT EXISTS org_dispensary_state_org ON org_dispensary_state(org_id);
CREATE INDEX IF NOT EXISTS org_dispensary_state_track ON org_dispensary_state(org_id, track_state);

-- down
-- DROP TABLE IF EXISTS org_dispensary_state;
-- DROP TABLE IF EXISTS dispensaries;

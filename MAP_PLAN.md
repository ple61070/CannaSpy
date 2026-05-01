# CannaSpy Map System — Full Build Plan
**Created: 2026-04-28**

## Goal
Weedmaps-parity map across all CannaSpy pages: 6,000+ real CA dispensary pins, native Mapbox clustering, search/filter/sort, three-state pin system, delivery overlay ready.

---

## Phase 1 — Data Foundation (DCC + Geocoding)

### 1a. Download DCC License CSV
California Dept of Cannabis Control publishes active retail licenses at:
`https://cannabis.ca.gov/resources/license-lookup/`
Direct CSV download — ~6,000+ active retail + delivery + microbusiness licenses.
Fields: License Number, Business Name, Address, City, Zip, County, License Type, Status

### 1b. DB Migration — `dispensaries` table (migration 010)
```sql
CREATE TABLE dispensaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dcc_license TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  zip TEXT,
  county TEXT,
  license_type TEXT CHECK (license_type IN ('retail','delivery','microbusiness')),
  status TEXT DEFAULT 'active',
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  geocoded_at TIMESTAMPTZ,
  -- enrichment (from our scraper)
  enriched BOOLEAN DEFAULT FALSE,
  last_scraped_at TIMESTAMPTZ,
  threat_score NUMERIC(3,2),
  market_tier TEXT CHECK (market_tier IN ('elite','hot','competitive','standard')),
  price_observations_count INTEGER DEFAULT 0,
  -- created
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX dispensaries_geo ON dispensaries USING GIST (
  ST_SetSRID(ST_MakePoint(lng, lat), 4326)
);
CREATE INDEX dispensaries_city ON dispensaries(city);
CREATE INDEX dispensaries_tier ON dispensaries(market_tier);
CREATE INDEX dispensaries_enriched ON dispensaries(enriched);
```

### 1c. Per-org tracking state — `org_dispensary_state` table
```sql
CREATE TABLE org_dispensary_state (
  org_id UUID REFERENCES organizations(id),
  dispensary_id UUID REFERENCES dispensaries(id),
  track_state TEXT DEFAULT 'untracked' CHECK (track_state IN ('untracked','tracked','blocked')),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (org_id, dispensary_id)
);
```

### 1d. Python ingestion script — `packages/scraper/dcc_ingest.py`
- Download DCC CSV
- Parse and upsert into `dispensaries` table
- Batch geocode addresses via Google Maps Geocoding API (already have key)
- Rate-limit: 50 req/sec, ~2 hours for full 6k dataset
- Run once, then monthly on schedule

---

## Phase 2 — API Endpoint

### New route: `GET /api/v1/map/dispensaries`
```
Query params:
  bbox     = west,south,east,north  (required — viewport bounds)
  tier     = elite|hot|competitive|standard (optional)
  type     = retail|delivery|microbusiness (optional)
  enriched = true|false (optional)
  q        = search string (optional, name search)
  limit    = max pins (default 2000, max 5000)

Response: GeoJSON FeatureCollection
{
  type: "FeatureCollection",
  features: [{
    type: "Feature",
    geometry: { type: "Point", coordinates: [lng, lat] },
    properties: {
      id, dcc_license, name, city, license_type,
      market_tier, enriched, threat_score,
      track_state,  // "untracked"|"tracked"|"blocked" — per org from JWT
      price_observations_count, last_scraped_at
    }
  }]
}
```

Performance: PostGIS bbox query on spatial index → sub-100ms for full CA viewport.

---

## Phase 3 — Unified Map Component

### Refactor `CannaSpyMap.tsx` — single component for all pages

**Props interface:**
```ts
interface CannaSpyMapProps {
  mode: 'market' | 'discovery' | 'competitor' | 'location'
  
  // Data
  dispensaries?: FeatureCollection        // live from API
  initialViewport?: MapViewport
  
  // Filters (controlled from parent)
  filters?: {
    tier?: string[]
    type?: string[]
    enrichedOnly?: boolean
    trackState?: string[]
    searchQuery?: string
  }
  
  // Events
  onPinClick?: (dispensary: DispensaryProps) => void
  onBoundsChange?: (bbox: BBox) => void   // parent fetches new data
  
  // UI toggles
  showClusters?: boolean
  showHeatOverlay?: boolean
  showDeliveryZones?: boolean
  showSearch?: boolean
  showFilters?: boolean
}
```

### Three-state pin visual system (Mapbox `match` expression)
```js
// Circle color by track_state + enriched
['case',
  ['==', ['get', 'track_state'], 'blocked'],   '#d4900a',  // amber
  ['==', ['get', 'enriched'], true],
    ['match', ['get', 'market_tier'],
      'elite',       '#e05a6a',
      'hot',         '#d4900a',
      'competitive', '#09A1A1',
      'standard',    '#5484A4',
      '#5484A4'
    ],
  'rgba(255,255,255,0.2)'  // grey — no data yet
]

// Circle opacity by enriched
['case', ['==', ['get', 'enriched'], true], 0.85, 0.35]
```

### Pin click → detail panel
**Enriched pin:**
- Name, address, tier badge, threat score
- Last 7-day price changes count
- CTAs: Track / Block

**Prospect pin (not enriched):**
- Name, address, DCC license
- "Intel not yet available for this location"
- CTA: "Request coverage" → POST /api/v1/dispensaries/:id/request-coverage

**Blocked pin:**
- Name, blocked badge, days blocked
- CTA: "View block details" → /blocks/:blockId

---

## Phase 4 — Search, Filter, Sort Bar

Mounted inside CannaSpyMap, positioned absolute top-left:
- **Search input**: debounced 300ms, filters by name client-side first, then re-fetches if < 5 results
- **Filter pills**: Tier (multi-select), Type (Retail/Delivery), Status (Tracked/Blocked/Prospect)
- **Sort**: Threat Score ↓, Distance ↑, Price Activity ↓, Name A→Z
- URL-synced via `useSearchParams`

---

## Phase 5 — Page Integration

| Page | Map mode | Data source | Special layers |
|---|---|---|---|
| `/market/heat-map` | `market` | bbox API, all dispensaries | Tier heat overlay |
| `/setup/competitors` | `discovery` | bbox API, 5mi radius | Radius ring |
| `/competitors/:rivalId` | `competitor` | single pin | None |
| Future delivery | `delivery` | bbox API + polygons | Delivery zone polygons |

---

## Phase 6 — Delivery Zone Foundation (future-proof now)

Add to `dispensaries`: `delivery_radius_miles` (for delivery operators)
Add `delivery_zones` table: `dispensary_id`, `coverage_polygon` (PostGIS GEOGRAPHY)
Toggle in CannaSpyMap: show/hide delivery coverage

---

## Execution Order

1. **Today**: Write `dcc_ingest.py`, download DCC CSV, run geocoding, populate `dispensaries` table
2. **Today**: Migration 010 (dispensaries + org_dispensary_state tables)
3. **Today**: Build `/api/v1/map/dispensaries` bbox endpoint
4. **Today**: Refactor CannaSpyMap with three-state pin system
5. **Today**: Wire MarketHeatMap to live API
6. **Today**: Wire CompetitorDiscovery to same data source
7. **This week**: Search/filter bar, sort controls
8. **This week**: Pin click detail panel (enriched vs prospect vs blocked)
9. **Later**: Delivery zone polygons

---

## Open Questions
- Google geocoding API quota: 6,000 addresses = ~$30 one-time cost at $5/1000. Acceptable.
- DCC CSV refresh: monthly cron, diff against existing to only re-geocode new licenses
- Tileset vs GeoJSON: at 6,000 points GeoJSON is fine. At 50,000+ (national), switch to Mapbox tileset upload.

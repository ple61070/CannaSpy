# CannaSpy — Technical Specification
**Version 2.0 | March 2026**

This document defines all technical decisions for the CannaSpy build.
Claude Code should treat this as the source of truth for stack, structure,
and architecture. Do not introduce new dependencies or architectural patterns
without flagging them explicitly.

---

## Tech Stack — Final

| Layer | Technology | Rationale |
|---|---|---|
| Scraper / pipeline | Python 3.11+ | Existing codebase, Playwright + BS4 |
| Job queue / scheduler | BullMQ (Redis-backed) | Node-native, battle-tested, good UI |
| API layer | Node.js + Fastify | Fast, low overhead, TypeScript-friendly |
| Frontend | React 18 + Vite | Existing dashboard.jsx as base |
| Styling | Tailwind CSS + CSS variables | Dark theme, utility-first |
| Database | PostgreSQL 15 | Pricing history, accounts, blocks |
| Cache / queue backend | Redis 7 | BullMQ, session cache, rate limiting |
| Auth | Clerk | Multi-tenant MSO orgs, role-based access |
| Billing | Stripe | Metered per-slot billing, volume discounts |
| Infrastructure | Railway (MVP) → AWS ECS (scale) | Railway for speed, AWS for scale |
| AI / normalization | Anthropic Claude API (claude-sonnet-4-6) | Product name normalization |
| Email / alerts | Resend | Transactional email, weekly digest |
| File storage | AWS S3 | Menu screenshots for evidence view |
| Monitoring | Sentry + Uptime Robot | Error tracking, scrape job health |

---

## Project Structure

```
cannaspy/
├── CLAUDE.md                    ← Master context (this project)
├── ARCHITECTURE.md              ← Screen specs
├── TECHNICAL_SPEC.md            ← This file
├── BRAND.md                     ← Voice and visual guidelines
│
├── packages/
│   ├── scraper/                 ← Python data pipeline
│   │   ├── dispensary_scraper.py    ← REBRAND from CannaIntel
│   │   ├── parsers/
│   │   │   ├── dutchie_parser.py    ← Dutchie GraphQL handler
│   │   │   ├── html_parser.py       ← Generic HTML fallback
│   │   │   └── normalizer.py        ← Claude API normalization
│   │   ├── discovery/
│   │   │   └── places_client.py     ← Google Places API
│   │   ├── compliance/
│   │   │   └── robots_checker.py    ← robots.txt validation
│   │   ├── requirements.txt
│   │   └── README.md
│   │
│   ├── api/                     ← Node.js / Fastify API
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   │   ├── competitors.ts
│   │   │   │   ├── blocks.ts
│   │   │   │   ├── pricing.ts
│   │   │   │   ├── alerts.ts
│   │   │   │   ├── locations.ts
│   │   │   │   ├── organizations.ts
│   │   │   │   └── billing.ts
│   │   │   ├── workers/         ← BullMQ job processors
│   │   │   │   ├── scrape.worker.ts
│   │   │   │   ├── normalize.worker.ts
│   │   │   │   ├── diff.worker.ts
│   │   │   │   └── alert.worker.ts
│   │   │   ├── db/
│   │   │   │   ├── schema.sql
│   │   │   │   └── migrations/
│   │   │   ├── services/
│   │   │   │   ├── blocking.service.ts
│   │   │   │   ├── pricing.service.ts
│   │   │   │   └── alert.service.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── README.md
│   │
│   └── web/                     ← React frontend
│       ├── src/
│       │   ├── components/
│       │   │   ├── dashboard/
│       │   │   ├── blocking/
│       │   │   ├── intelligence/
│       │   │   └── shared/
│       │   ├── pages/           ← One file per screen
│       │   ├── hooks/
│       │   ├── store/           ← Zustand state
│       │   └── App.tsx
│       ├── dashboard.jsx        ← REBRAND + extend from CannaIntel
│       ├── package.json
│       └── README.md
│
├── cli/                         ← Internal CannaSpy team CLI tools
│   ├── scraper-ctl.py           ← Trigger/inspect scrape jobs
│   ├── block-ctl.py             ← Block list management
│   ├── market-heat.py           ← Market classification tool
│   └── data-qa.py               ← Normalization quality inspection
│
├── docker-compose.yml           ← Local dev: postgres + redis
├── .env.example
└── package.json                 ← Root workspace config
```

---

## Database Schema

### Core Tables

```sql
-- Organizations (MSO accounts)
CREATE TABLE organizations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  slug          TEXT UNIQUE NOT NULL,
  stripe_id     TEXT,
  plan_type     TEXT DEFAULT 'ala_carte', -- ala_carte | tier
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Locations (each dispensary location within an MSO)
CREATE TABLE locations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID REFERENCES organizations(id),
  name          TEXT NOT NULL,
  address       TEXT NOT NULL,
  lat           DECIMAL(10,7),
  lng           DECIMAL(10,7),
  dcc_license   TEXT,
  active        BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Competitors (dispensaries being monitored)
CREATE TABLE competitors (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  address       TEXT NOT NULL,
  lat           DECIMAL(10,7),
  lng           DECIMAL(10,7),
  website_url   TEXT,
  platform      TEXT, -- dutchie | custom | unknown
  google_place_id TEXT,
  dcc_license   TEXT,
  robots_ok     BOOLEAN,
  last_scraped  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Tracked relationships (location → competitor)
CREATE TABLE tracked_competitors (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id   UUID REFERENCES locations(id),
  competitor_id UUID REFERENCES competitors(id),
  slot_type     TEXT DEFAULT 'track', -- track | block
  market_tier   TEXT DEFAULT 'standard', -- standard | competitive | hot | elite
  price_per_slot DECIMAL(8,2) DEFAULT 100.00,
  active        BOOLEAN DEFAULT TRUE,
  blocked_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(location_id, competitor_id)
);

-- Block list (the CRM-side block — separate from tracked_competitors)
-- This is the prospect suppression list
CREATE TABLE block_list (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID REFERENCES organizations(id),
  competitor_id UUID REFERENCES competitors(id),
  blocked_by    UUID, -- user id
  blocked_at    TIMESTAMPTZ DEFAULT NOW(),
  unblocked_at  TIMESTAMPTZ,
  notify_on_unblock BOOLEAN DEFAULT TRUE,
  active        BOOLEAN DEFAULT TRUE
);

-- Products (normalized SKUs)
CREATE TABLE products (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_name TEXT NOT NULL,
  brand         TEXT,
  category      TEXT, -- flower | edible | concentrate | vape | preroll | topical
  subcategory   TEXT,
  package_size  TEXT,
  unit          TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Price observations (time-series — append only)
CREATE TABLE price_observations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_id UUID REFERENCES competitors(id),
  product_id    UUID REFERENCES products(id),
  raw_name      TEXT,         -- original name from menu
  price         DECIMAL(8,2),
  in_stock      BOOLEAN DEFAULT TRUE,
  on_promo      BOOLEAN DEFAULT FALSE,
  promo_text    TEXT,
  source_url    TEXT,
  detected_at   TIMESTAMPTZ DEFAULT NOW(),
  confidence    TEXT DEFAULT 'high' -- high | medium | low
);

-- Promotions
CREATE TABLE promotions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_id UUID REFERENCES competitors(id),
  promo_text    TEXT NOT NULL,
  promo_type    TEXT, -- bogo | pct_off | bundle | daily_special | first_time
  category      TEXT,
  detected_at   TIMESTAMPTZ DEFAULT NOW(),
  expired_at    TIMESTAMPTZ,
  source_url    TEXT,
  active        BOOLEAN DEFAULT TRUE
);

-- Alerts
CREATE TABLE alerts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID REFERENCES organizations(id),
  location_id   UUID REFERENCES locations(id),
  competitor_id UUID REFERENCES competitors(id),
  alert_type    TEXT, -- price_drop | price_increase | new_promo | promo_ended |
                      -- new_sku | sku_removed | new_competitor
  entity_id     UUID, -- references price_observation or promotion
  old_value     TEXT,
  new_value     TEXT,
  confidence    TEXT DEFAULT 'high',
  reviewed      BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Annotations (collaboration layer)
CREATE TABLE annotations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID REFERENCES organizations(id),
  author_id     UUID,
  entity_type   TEXT, -- competitor | product | alert | location
  entity_id     UUID,
  body          TEXT NOT NULL,
  assignee_id   UUID,
  resolved      BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Audit log
CREATE TABLE audit_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID REFERENCES organizations(id),
  user_id       UUID,
  action        TEXT NOT NULL,
  entity_type   TEXT,
  entity_id     UUID,
  metadata      JSONB,
  ip_address    INET,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
```

### Indexes (performance-critical)
```sql
CREATE INDEX idx_price_obs_competitor ON price_observations(competitor_id, detected_at DESC);
CREATE INDEX idx_price_obs_product    ON price_observations(product_id, detected_at DESC);
CREATE INDEX idx_alerts_org           ON alerts(org_id, created_at DESC);
CREATE INDEX idx_alerts_unreviewed    ON alerts(org_id, reviewed) WHERE reviewed = FALSE;
CREATE INDEX idx_tracked_active       ON tracked_competitors(location_id, active) WHERE active = TRUE;
CREATE INDEX idx_block_list_active    ON block_list(active) WHERE active = TRUE;
```

---

## Data Pipeline Architecture

### Scrape Job Flow

```
Scheduler (cron)
    ↓
BullMQ: scrape-queue
    ↓
ScrapeWorker (Node.js) → dispatches to Python scraper
    ↓
dispensary_scraper.py
    ├── robots_checker.py → skip if disallowed
    ├── dutchie_parser.py (if Dutchie platform detected)
    └── html_parser.py (fallback)
    ↓
Raw price data → PostgreSQL (price_observations)
    ↓
BullMQ: normalize-queue
    ↓
NormalizeWorker → normalizer.py → Claude API
    ↓
Canonical products updated
    ↓
BullMQ: diff-queue
    ↓
DiffWorker → compare new vs. previous observation
    ↓
Alerts generated → alerts table
    ↓
BullMQ: alert-queue
    ↓
AlertWorker → filter by org signal tuning settings
    ↓
Push notification + email dispatch (Resend)
```

### Scrape Schedule
- Active tracked competitors: every 4 hours
- Blocked competitors: every 24 hours (need less frequent data, still need
  detection for unblock notification)
- New competitor discovery (Google Places scan): weekly per location
- Robots.txt re-check: weekly per domain

### Normalization Strategy (Claude API)

```python
# normalizer.py — conceptual structure

NORMALIZATION_PROMPT = """
You are normalizing cannabis product names across dispensary menus.

Given these raw product names from different dispensaries, identify which
refer to the same product and return a canonical name + confidence score.

Rules:
- Same brand + strain + package size = same product (high confidence)
- Same brand + strain, different size = different products
- Abbreviations like "BD" for "Blue Dream" are acceptable matches
- If you cannot determine equivalency with >70% confidence, flag as ambiguous

Return JSON only. Schema:
{
  "canonical_name": string,
  "brand": string | null,
  "category": string,  // flower|edible|concentrate|vape|preroll|topical
  "package_size": string | null,
  "confidence": "high" | "medium" | "low",
  "ambiguous": boolean
}
"""

def normalize_product(raw_names: list[str]) -> dict:
    # Batch similar names together to minimize API calls
    # Cache results keyed on normalized raw name
    # Flag low-confidence matches for human review queue
    pass
```

---

## API Design Principles

1. **REST-first.** No GraphQL unless a specific screen requires it.
2. **Org-scoped everything.** Every request authenticated via Clerk, all data
   filtered by org_id. No cross-org data leakage possible.
3. **Pagination on all list endpoints.** Default limit: 50. Max: 200.
4. **Timestamps in UTC ISO 8601** everywhere.
5. **Explicit versioning:** `/api/v1/...` from day one.
6. **Error responses** always include: `{ error: string, code: string, details?: object }`

### Key API Endpoints (MVP)

```
GET    /api/v1/locations
POST   /api/v1/locations
GET    /api/v1/locations/:id/competitors
POST   /api/v1/locations/:id/competitors

GET    /api/v1/competitors/:id
GET    /api/v1/competitors/:id/prices
GET    /api/v1/competitors/:id/promotions

GET    /api/v1/blocks
POST   /api/v1/blocks
DELETE /api/v1/blocks/:id

GET    /api/v1/alerts
PATCH  /api/v1/alerts/:id/reviewed

GET    /api/v1/prices/matrix?location_id=&category=
GET    /api/v1/prices/history?competitor_id=&days=30

GET    /api/v1/billing/usage
POST   /api/v1/billing/checkout (Stripe session)
```

---

## Billing Architecture (Stripe)

Slot-based billing is non-trivial. Here is the implementation approach:

1. **Stripe Subscription** with a single metered line item per org
2. Each active slot in `tracked_competitors` where `active=TRUE` = 1 billable unit
3. Usage reported to Stripe at end of each billing period via cron job
4. Volume discounts applied as Stripe tiered pricing:
   - 1–9 slots: $100/unit
   - 10–19 slots: $95/unit (5% off)
   - 20–49 slots: $90/unit (10% off)
   - 50+ slots: $85/unit (15% off)
5. Market-heat premium applied as a slot multiplier:
   - Standard: 1.0×
   - Competitive: 1.5×
   - Hot: 2.0×
   - Elite: 2.5–3.0×
6. On block cancellation: slot removed from Stripe usage immediately,
   block_list.unblocked_at set, alert triggered to sales CRM

**Critical:** The block cancellation webhook must trigger the sales CRM
notification within seconds, not hours. This is the core product promise.

---

## CLI Tools (Internal)

### scraper-ctl.py
```bash
# Trigger immediate scrape for a competitor
python cli/scraper-ctl.py scrape --competitor-id <uuid>

# Check scrape job queue status
python cli/scraper-ctl.py status

# Inspect last scrape result for a competitor
python cli/scraper-ctl.py inspect --competitor-id <uuid>

# Force re-scrape of all competitors for a location
python cli/scraper-ctl.py rescrape --location-id <uuid>
```

### block-ctl.py
```bash
# List all active blocks
python cli/block-ctl.py list

# Manually add a block (admin use)
python cli/block-ctl.py add --org-id <uuid> --competitor-id <uuid>

# Remove a block and trigger sales notification
python cli/block-ctl.py remove --block-id <uuid>

# Audit: blocks expiring in next 7 days
python cli/block-ctl.py expiring --days 7
```

### market-heat.py
```bash
# Classify a market by dispensary density
python cli/market-heat.py classify --lat 34.09 --lng -118.36 --radius 5

# Update all market tiers based on current dispensary count data
python cli/market-heat.py update-all

# Show current tier distribution
python cli/market-heat.py report
```

### data-qa.py
```bash
# Show normalization failures in last 24h
python cli/data-qa.py failures --hours 24

# Show low-confidence normalizations pending review
python cli/data-qa.py review-queue

# Test normalization on a specific raw product name
python cli/data-qa.py normalize --name "Blue Dream 1g flower"
```

---

## Rebranding Checklist (CannaIntel → CannaSpy)

Before extending either existing file, complete this checklist:

- [ ] `dispensary_scraper.py` — find/replace all "CannaIntel" string references
- [ ] `dashboard.jsx` — find/replace all "CannaIntel" string references
- [ ] Update any hardcoded API endpoint references
- [ ] Update any hardcoded color values to match CannaSpy palette
- [ ] Rename files if they contain "cannaIntel" in the filename
- [ ] Update README files

---

## Environment Variables Required

```bash
# Database
DATABASE_URL=postgresql://...
REDIS_URL=redis://...

# Auth
CLERK_SECRET_KEY=
CLERK_PUBLISHABLE_KEY=

# Billing
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# AI
ANTHROPIC_API_KEY=

# Data collection
GOOGLE_PLACES_API_KEY=

# Email
RESEND_API_KEY=

# Storage
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=

# App
NODE_ENV=development
API_PORT=3001
WEB_PORT=3000
```

---

## Performance Targets

| Metric | Target |
|---|---|
| API response time (p95) | < 200ms |
| Price matrix load | < 500ms |
| Alert feed load | < 300ms |
| Scrape job completion (single competitor) | < 60s |
| Alert dispatch after scrape | < 5 minutes |
| Block cancellation → CRM notification | < 60 seconds |

---

## Security Requirements

1. All API routes require Clerk authentication except public sales tools
   (Screens 34, 35)
2. Row-level security: every database query scoped to org_id
3. Block list operations logged to audit_log unconditionally
4. Stripe webhooks validated via signature before processing
5. robots.txt compliance checked on every scrape — not cached for more than 7 days
6. Rate limiting on all API endpoints (100 req/min per org)
7. No competitor PII stored beyond name, address, website URL, license number

---

*Technical specification developed through strategy sessions with the founder.*

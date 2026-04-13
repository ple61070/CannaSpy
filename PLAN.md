# CannaSpy — MVP Build Plan

Generated: 2026-03-25 | Context: All 4 spec files ingested

---
## Context

CannaSpy is a B2B competitive intelligence SaaS for California cannabis MSOs.
The codebase is currently 4 markdown spec files only. Two legacy Python/React
files (dispensary_scraper.py, dashboard.jsx) exist under the old "CannaIntel"
brand and will be added by the founder. This plan covers the complete monorepo
scaffold, tech stack decisions, database schema, phased build sequence, and
full automation pipeline architecture.

---
## 1. REBRANDING AUDIT

Ready to execute the moment dispensary_scraper.py and dashboard.jsx arrive.
Based on CLAUDE.md descriptions of what those files contain:

### Exact find/replace list

| Pattern to find | Replace with | Applies to |
|---|---|---|
| CannaIntel | CannaSpy | String literals, comments, class names |
| cannaIntel | cannaSpy | camelCase variable/function names |
| canna_intel | canna_spy | snake_case variable/function names |
| CANNAINTEL | CANNASPY | All-caps constants |
| cannaintel | cannaspy | Lowercase slugs, URL paths |
| CannaIntel Dashboard | CannaSpy Intelligence | UI display strings |
| cannaIntelAPI | cannaSpyAPI | API client variable names |
| cannaIntelConfig | cannaSpyConfig | Config object names |

### Color audit (dashboard.jsx only)

Replace any hardcoded colors not in the CannaSpy palette:
- Any #22c55e / #16a34a (generic green) → #1d9e75 (accent-intel teal)
- Any #f59e0b / #d97706 (generic amber) → #ba7517 (accent-block amber)
- Any #ef4444 / #dc2626 (generic red) → #d4537e (accent-alert coral)
- Any #1e293b / #0f172a (generic dark bg) → #0d0f11 (bg-base)

### Font audit (dashboard.jsx only)

- Remove any Inter, system-ui, Roboto references
- Add DM Sans for body, Space Mono for numbers/timestamps/labels

### Post-rebrand checklist

- All CannaIntel string references replaced
- Color tokens updated to CannaSpy palette
- Typography updated to DM Sans + Space Mono
- Any hardcoded API endpoints updated
- Any hardcoded market/company names verified

---
## 2. PROJECT STRUCTURE

```
CannaSpy/
├── CLAUDE.md                          [EXISTS]
├── ARCHITECTURE.md                    [EXISTS]
├── TECHNICAL_SPEC.md                  [EXISTS]
├── BRAND.md                           [EXISTS]
├── PLAN.md                            [THIS FILE]
├── docker-compose.yml                 [CREATE — local dev: redis only; pg = Supabase]
├── .env.example                       [CREATE]
├── .gitignore                         [CREATE]
├── package.json                       [CREATE — pnpm workspace root]
│
├── packages/
│   ├── scraper/                       [CREATE dir]
│   │   ├── dispensary_scraper.py      [PENDING — founder will add, rebrand on arrival]
│   │   ├── parsers/
│   │   │   ├── dutchie_parser.py      [CREATE — extract from scraper on arrival]
│   │   │   ├── html_parser.py         [CREATE — extract from scraper on arrival]
│   │   │   └── normalizer.py          [CREATE — Claude API normalization]
│   │   ├── discovery/
│   │   │   └── places_client.py       [CREATE — Google Places radius scan]
│   │   ├── compliance/
│   │   │   └── robots_checker.py      [CREATE — robots.txt validation]
│   │   ├── requirements.txt           [CREATE]
│   │   └── README.md                  [CREATE]
│   │
│   ├── api/                           [CREATE dir]
│   │   ├── src/
│   │   │   ├── index.ts               [CREATE — Fastify entry point]
│   │   │   ├── routes/
│   │   │   │   ├── competitors.ts     [CREATE]
│   │   │   │   ├── blocks.ts          [CREATE]
│   │   │   │   ├── pricing.ts         [CREATE]
│   │   │   │   ├── alerts.ts          [CREATE]
│   │   │   │   ├── locations.ts       [CREATE]
│   │   │   │   ├── organizations.ts   [CREATE]
│   │   │   │   └── billing.ts         [CREATE]
│   │   │   ├── workers/
│   │   │   │   ├── scrape.worker.ts   [CREATE]
│   │   │   │   ├── normalize.worker.ts [CREATE]
│   │   │   │   ├── diff.worker.ts     [CREATE]
│   │   │   │   └── alert.worker.ts    [CREATE]
│   │   │   ├── db/
│   │   │   │   ├── schema.sql         [CREATE — full schema, see Section 4]
│   │   │   │   └── migrations/
│   │   │   │       └── 001_init.sql   [CREATE]
│   │   │   ├── services/
│   │   │   │   ├── blocking.service.ts [CREATE]
│   │   │   │   ├── pricing.service.ts  [CREATE]
│   │   │   │   └── alert.service.ts    [CREATE]
│   │   │   └── scheduler.ts           [CREATE — BullMQ repeatable jobs]
│   │   ├── package.json               [CREATE]
│   │   ├── tsconfig.json              [CREATE]
│   │   └── README.md                  [CREATE]
│   │
│   └── web/                           [CREATE dir]
│       ├── src/
│       │   ├── App.tsx                [CREATE]
│       │   ├── main.tsx               [CREATE]
│       │   ├── components/
│       │   │   ├── shared/
│       │   │   │   ├── Layout.tsx     [CREATE — sidebar + topbar shell]
│       │   │   │   ├── AlertCard.tsx  [CREATE]
│       │   │   │   ├── SlotCounter.tsx [CREATE — running cost display]
│       │   │   │   └── EmptyState.tsx [CREATE — war-room empty states]
│       │   │   ├── blocking/
│       │   │   │   ├── BlockCard.tsx  [CREATE]
│       │   │   │   └── CancelWarning.tsx [CREATE — Screen 18 modal]
│       │   │   └── intelligence/
│       │   │       ├── PriceCell.tsx  [CREATE — delta indicator]
│       │   │       └── CompetitorRow.tsx [CREATE]
│       │   ├── pages/
│       │   │   ├── SignUp.tsx         [CREATE — Screen 01]
│       │   │   ├── LocationWizard.tsx [CREATE — Screen 02]
│       │   │   ├── CompetitorDiscovery.tsx [CREATE — Screen 03]
│       │   │   ├── CommandCenter.tsx  [CREATE — Screen 04]
│       │   │   ├── LocationDashboard.tsx [CREATE — Screen 05]
│       │   │   ├── PriceIntelligence.tsx [CREATE — Screen 07]
│       │   │   ├── PromotionsTracker.tsx [CREATE — Screen 08]
│       │   │   ├── AlertFeed.tsx      [CREATE — Screen 12]
│       │   │   ├── BlockManagement.tsx [CREATE — Screen 16]
│       │   │   ├── BlockConfirm.tsx   [CREATE — Screen 17]
│       │   │   ├── CancelBlockWarning.tsx [CREATE — Screen 18]
│       │   │   ├── BillingUsage.tsx   [CREATE — Screen 28]
│       │   │   ├── NotificationSettings.tsx [CREATE — Screen 30]
│       │   │   ├── LocationManagement.tsx [CREATE — Screen 31]
│       │   │   └── CancellationFlow.tsx [CREATE — Screen 33]
│       │   ├── hooks/
│       │   │   ├── useAlerts.ts       [CREATE]
│       │   │   ├── useBlocks.ts       [CREATE]
│       │   │   └── usePriceMatrix.ts  [CREATE]
│       │   ├── store/
│       │   │   └── index.ts           [CREATE — Zustand]
│       │   └── styles/
│       │       └── globals.css        [CREATE — CSS variables, dark theme]
│       ├── dashboard.jsx              [PENDING — founder will add, rebrand + extend]
│       ├── index.html                 [CREATE]
│       ├── vite.config.ts             [CREATE]
│       ├── tailwind.config.ts         [CREATE]
│       ├── package.json               [CREATE]
│       └── tsconfig.json              [CREATE]
│
├── cli/
│   ├── scraper-ctl.py                 [CREATE]
│   ├── block-ctl.py                   [CREATE]
│   ├── market-heat.py                 [CREATE]
│   └── data-qa.py                     [CREATE]
│
└── railway.toml                       [CREATE — Railway deployment config]
```

---
## 3. TECH STACK CONFIRMATION

### BullMQ for job queue — CONFIRMED with dispatch pattern clarification

BullMQ handles queue, retry, backoff, and concurrency in Node.js natively.
The Python scraper is dispatched via child_process.spawn() from the ScrapeWorker.
Python writes results as JSON to stdout; the worker parses and persists to PostgreSQL.
This is clean and requires no Python-side queue client. The alternative (Celery) would
require a separate Python broker and adds operational complexity we don't need.

Dispatch pattern:
```typescript
// scrape.worker.ts
const job = await scrapeQueue.process(async (job) => {
  const result = await new Promise((resolve, reject) => {
    const proc = spawn('python', [
      '/app/packages/scraper/dispensary_scraper.py',
      '--competitor-id', job.data.competitorId,
      '--output', 'json'
    ]);
    let stdout = '';
    proc.stdout.on('data', d => stdout += d);
    proc.on('close', code => code === 0
      ? resolve(JSON.parse(stdout))
      : reject(new Error(`Scraper exited ${code}`))
    );
  });
  await persistScrapeResult(result);
});
```

### Railway for MVP — CONFIRMED

Railway deploys the Fastify API and Python scraper as separate services from the same repo.
Redis runs as a Railway plugin. PostgreSQL is Supabase (see below). No IAM, no VPC, no task
definitions. Single railway.toml. Migration path to AWS ECS is preserved — everything is
containerized.

### Clerk for multi-tenant MSO auth — CONFIRMED

Clerk Organizations maps directly to MSO orgs. Org membership roles (Admin/Manager/Viewer)
cover MVP needs. Location-level access restrictions (Screen 29, v2) will use Clerk's
publicMetadata on membership objects. Clerk's currentUser() and getAuth() integrate cleanly
with Fastify via @clerk/fastify. No custom auth code needed.

### Stripe metered billing — CONFIRMED with MVP simplification

Stripe metered subscriptions with tiered pricing handle per-slot billing and volume discounts
natively. One subscription per org, one metered price item, usage reported at billing cycle
end via cron.

MVP simplification: Market-heat multipliers (Competitive/Hot/Elite) are v2. MVP bills all
slots at $100 standard rate. This is one price configuration instead of four and unblocks
the build without limiting sales — pilot MSOs are unlikely to be in Elite markets.

On block cancellation: Slot removed from Stripe usage + block_list.unblocked_at set + CRM
webhook fired — all within one database transaction and a BullMQ immediate job. Target:
< 60 seconds from cancel to CRM notification.

### Supabase instead of raw PostgreSQL — DECIDED: YES

Decision: Use Supabase for PostgreSQL.

Rationale:
1. Row-level security at the database level — exactly what org-scoped data requires. Every
   query is scoped to org_id by policy, not just by application code. Removes an entire
   class of cross-org data leak bugs.
2. Realtime subscriptions — the Alert Feed (Screen 12) and Command Center (Screen 04) need
   live updates. Supabase Realtime provides WebSocket subscriptions on alerts table inserts
   without us building a WebSocket server.
3. Supabase MCP is available in this session — schema migrations can be applied and verified
   directly.
4. TypeScript type generation (supabase gen types) produces typed DB clients for free.
5. Dashboard for data QA — the data-qa.py CLI use case can also be served by the Supabase
   dashboard during development.

Supabase is PostgreSQL. The schema in TECHNICAL_SPEC.md applies unchanged.
Redis still runs on Railway (BullMQ + rate limiting + session cache).

---
## 4. DATABASE SCHEMA

Two tables are missing from TECHNICAL_SPEC.md for MVP screen coverage:

1. notification_preferences — required for Screen 30
2. scrape_jobs — required for Screen 31 health display and BRAND.md error messages
   ("Last successful scrape: 6 hours ago")

Complete corrected schema follows. All tables from TECHNICAL_SPEC.md are preserved
unchanged; additions are marked `-- ADDED`.

```sql
-- ============================================================
-- ORGANIZATIONS
-- ============================================================
CREATE TABLE organizations (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                 TEXT NOT NULL,
  slug                 TEXT UNIQUE NOT NULL,
  stripe_id            TEXT,
  stripe_subscription_id TEXT,                          -- ADDED: needed for billing ops
  plan_type            TEXT DEFAULT 'ala_carte',        -- ala_carte | tier
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- LOCATIONS
-- ============================================================
CREATE TABLE locations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  address       TEXT NOT NULL,
  lat           DECIMAL(10,7),
  lng           DECIMAL(10,7),
  dcc_license   TEXT,
  active        BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- COMPETITORS
-- ============================================================
CREATE TABLE competitors (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  address         TEXT NOT NULL,
  lat             DECIMAL(10,7),
  lng             DECIMAL(10,7),
  website_url     TEXT,
  platform        TEXT,                -- dutchie | custom | unknown
  google_place_id TEXT,
  dcc_license     TEXT,
  robots_ok       BOOLEAN,
  robots_checked_at TIMESTAMPTZ,      -- ADDED: for weekly re-check logic
  last_scraped    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TRACKED COMPETITORS (operator-facing slot)
-- ============================================================
CREATE TABLE tracked_competitors (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id     UUID REFERENCES locations(id) ON DELETE CASCADE,
  competitor_id   UUID REFERENCES competitors(id),
  slot_type       TEXT DEFAULT 'track',     -- track | block
  market_tier     TEXT DEFAULT 'standard',  -- standard | competitive | hot | elite
  price_per_slot  DECIMAL(8,2) DEFAULT 100.00,
  active          BOOLEAN DEFAULT TRUE,
  blocked_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(location_id, competitor_id)
);

-- ============================================================
-- BLOCK LIST (CRM-facing suppression — separate from slot)
-- ============================================================
CREATE TABLE block_list (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id              UUID REFERENCES organizations(id) ON DELETE CASCADE,
  competitor_id       UUID REFERENCES competitors(id),
  blocked_by          TEXT,                -- Clerk user ID
  blocked_at          TIMESTAMPTZ DEFAULT NOW(),
  unblocked_at        TIMESTAMPTZ,
  notify_on_unblock   BOOLEAN DEFAULT TRUE,
  crm_notified_at     TIMESTAMPTZ,         -- ADDED: tracks when CRM was notified
  active              BOOLEAN DEFAULT TRUE
);

-- ============================================================
-- PRODUCTS (normalized SKUs)
-- ============================================================
CREATE TABLE products (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_name  TEXT NOT NULL,
  brand           TEXT,
  category        TEXT,    -- flower | edible | concentrate | vape | preroll | topical
  subcategory     TEXT,
  package_size    TEXT,
  unit            TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PRICE OBSERVATIONS (append-only time series)
-- ============================================================
CREATE TABLE price_observations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_id   UUID REFERENCES competitors(id),
  product_id      UUID REFERENCES products(id),
  raw_name        TEXT,
  price           DECIMAL(8,2),
  in_stock        BOOLEAN DEFAULT TRUE,
  on_promo        BOOLEAN DEFAULT FALSE,
  promo_text      TEXT,
  source_url      TEXT,
  detected_at     TIMESTAMPTZ DEFAULT NOW(),
  confidence      TEXT DEFAULT 'high'      -- high | medium | low
);

-- ============================================================
-- PROMOTIONS
-- ============================================================
CREATE TABLE promotions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_id   UUID REFERENCES competitors(id),
  promo_text      TEXT NOT NULL,
  promo_type      TEXT,    -- bogo | pct_off | bundle | daily_special | first_time
  category        TEXT,
  detected_at     TIMESTAMPTZ DEFAULT NOW(),
  expired_at      TIMESTAMPTZ,
  source_url      TEXT,
  active          BOOLEAN DEFAULT TRUE
);

-- ============================================================
-- ALERTS
-- ============================================================
CREATE TABLE alerts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID REFERENCES organizations(id) ON DELETE CASCADE,
  location_id     UUID REFERENCES locations(id),
  competitor_id   UUID REFERENCES competitors(id),
  alert_type      TEXT,    -- price_drop | price_increase | new_promo | promo_ended
                           -- | new_sku | sku_removed | new_competitor
  entity_id       UUID,
  old_value       TEXT,
  new_value       TEXT,
  confidence      TEXT DEFAULT 'high',
  reviewed        BOOLEAN DEFAULT FALSE,
  reviewed_by     TEXT,                    -- ADDED: Clerk user ID
  reviewed_at     TIMESTAMPTZ,             -- ADDED
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ANNOTATIONS (collaboration — v2 screens, schema now)
-- ============================================================
CREATE TABLE annotations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID REFERENCES organizations(id) ON DELETE CASCADE,
  author_id       TEXT,                    -- Clerk user ID
  entity_type     TEXT,   -- competitor | product | alert | location
  entity_id       UUID,
  body            TEXT NOT NULL,
  assignee_id     TEXT,                    -- Clerk user ID
  resolved        BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- AUDIT LOG
-- ============================================================
CREATE TABLE audit_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID REFERENCES organizations(id),
  user_id         TEXT,                    -- Clerk user ID
  action          TEXT NOT NULL,
  entity_type     TEXT,
  entity_id       UUID,
  metadata        JSONB,
  ip_address      INET,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- NOTIFICATION PREFERENCES — ADDED (Screen 30)
-- ============================================================
CREATE TABLE notification_preferences (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id              UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id             TEXT,                -- Clerk user ID (NULL = org default)
  location_id         UUID REFERENCES locations(id),  -- NULL = applies to all
  digest_frequency    TEXT DEFAULT 'realtime',  -- realtime | daily | weekly
  quiet_hours_start   TIME,               -- local time
  quiet_hours_end     TIME,
  price_threshold_pct DECIMAL(5,2) DEFAULT 5.0,  -- only alert if change > X%
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
-- SCRAPE JOBS — ADDED (Screen 31 health, error messages)
-- ============================================================
CREATE TABLE scrape_jobs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_id   UUID REFERENCES competitors(id),
  bullmq_job_id   TEXT,
  status          TEXT DEFAULT 'queued',  -- queued | running | completed | failed
  trigger         TEXT DEFAULT 'scheduled', -- scheduled | manual | discovery
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  error_message   TEXT,
  records_written INT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
-- From TECHNICAL_SPEC.md (unchanged)
CREATE INDEX idx_price_obs_competitor ON price_observations(competitor_id, detected_at DESC);
CREATE INDEX idx_price_obs_product    ON price_observations(product_id, detected_at DESC);
CREATE INDEX idx_alerts_org           ON alerts(org_id, created_at DESC);
CREATE INDEX idx_alerts_unreviewed    ON alerts(org_id, reviewed) WHERE reviewed = FALSE;
CREATE INDEX idx_tracked_active       ON tracked_competitors(location_id, active) WHERE active = TRUE;
CREATE INDEX idx_block_list_active    ON block_list(active) WHERE active = TRUE;

-- Added indexes
CREATE INDEX idx_scrape_jobs_competitor ON scrape_jobs(competitor_id, created_at DESC);
CREATE INDEX idx_scrape_jobs_status     ON scrape_jobs(status) WHERE status IN ('queued','running');
CREATE INDEX idx_notif_prefs_org        ON notification_preferences(org_id);
CREATE INDEX idx_block_list_org         ON block_list(org_id, active) WHERE active = TRUE;
CREATE INDEX idx_alerts_location        ON alerts(location_id, created_at DESC);
```

### Supabase Row-Level Security policies (applied after schema)

```sql
-- All data scoped to authenticated org via Clerk org_id in JWT claims
-- Applied to: organizations, locations, tracked_competitors, block_list,
--             alerts, notification_preferences

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
-- (Policies set per table — org_id must match JWT claim)
```

---
## 5. MVP BUILD PHASES

### Phase 1 — Foundation (Week 1–2)

**Deliverable:** Authenticated user can create an org, add locations, and see the
signed-in dashboard shell. No scraping yet.

Files to create, in order:

1. package.json — pnpm workspace root
2. .env.example — all env vars from TECHNICAL_SPEC.md
3. .gitignore
4. docker-compose.yml — Redis only (PostgreSQL = Supabase)
5. packages/api/package.json — Fastify, Clerk, BullMQ, pg deps
6. packages/api/tsconfig.json
7. packages/api/src/index.ts — Fastify server, Clerk plugin, route loader
8. packages/api/src/db/schema.sql — full schema (Section 4)
9. packages/api/src/db/migrations/001_init.sql
10. packages/api/src/routes/organizations.ts — GET/POST org
11. packages/api/src/routes/locations.ts — GET/POST/PATCH locations
12. packages/web/package.json — React 18, Vite, Tailwind, Clerk React
13. packages/web/vite.config.ts
14. packages/web/tailwind.config.ts
15. packages/web/src/styles/globals.css — CSS variables (full palette)
16. packages/web/src/App.tsx — router, Clerk provider, protected routes
17. packages/web/src/components/shared/Layout.tsx — sidebar + topbar
18. packages/web/src/components/shared/EmptyState.tsx
19. packages/web/src/pages/SignUp.tsx — Screen 01
20. packages/web/src/pages/LocationWizard.tsx — Screen 02

**Test:** Sign up → create org → add 2 locations → see them listed. Clerk auth gates
all routes. API returns 401 without valid session.

---
### Phase 2 — Core Intelligence Loop (Week 3–4)

**Deliverable:** Live competitor prices appear in the dashboard. The full scrape →
normalize → diff → alert pipeline runs end-to-end for at least one real California
dispensary.

**Prerequisite:** dispensary_scraper.py added and rebranded.

Files to create, in order:

1. packages/scraper/requirements.txt
2. packages/scraper/compliance/robots_checker.py
3. packages/scraper/discovery/places_client.py
4. packages/scraper/parsers/dutchie_parser.py
5. packages/scraper/parsers/html_parser.py
6. packages/scraper/parsers/normalizer.py — Claude API integration
7. packages/api/src/scheduler.ts — BullMQ repeatable jobs (cron)
8. packages/api/src/workers/scrape.worker.ts — spawns Python
9. packages/api/src/workers/normalize.worker.ts
10. packages/api/src/workers/diff.worker.ts
11. packages/api/src/workers/alert.worker.ts
12. packages/api/src/services/pricing.service.ts
13. packages/api/src/services/alert.service.ts
14. packages/api/src/routes/competitors.ts
15. packages/api/src/routes/pricing.ts — /api/v1/prices/matrix
16. packages/api/src/routes/alerts.ts
17. packages/web/src/hooks/useAlerts.ts
18. packages/web/src/hooks/usePriceMatrix.ts
19. packages/web/src/components/intelligence/PriceCell.tsx
20. packages/web/src/components/intelligence/CompetitorRow.tsx
21. packages/web/src/components/shared/AlertCard.tsx
22. packages/web/src/pages/CompetitorDiscovery.tsx — Screen 03
23. packages/web/src/pages/CommandCenter.tsx — Screen 04
24. packages/web/src/pages/LocationDashboard.tsx — Screen 05
25. packages/web/src/pages/PriceIntelligence.tsx — Screen 07
26. packages/web/src/pages/PromotionsTracker.tsx — Screen 08
27. packages/web/src/pages/AlertFeed.tsx — Screen 12

**Test:** Add a real CA dispensary via competitor discovery → trigger manual scrape via
scraper-ctl.py → confirm price_observations rows → confirm alert generated → confirm alert
appears in GET /api/v1/alerts within 5 minutes.

---
### Phase 3 — Blocking Mechanic + Billing (Week 5–6)

**Deliverable:** A pilot MSO account can block a rival, manage blocks, and pay via Stripe.
The churn-lock consequence is disclosed in the UI. This is the state required to close a
first paying customer.

Files to create, in order:

1. packages/api/src/services/blocking.service.ts — block/unblock + CRM webhook
2. packages/api/src/routes/blocks.ts — GET/POST/DELETE /api/v1/blocks
3. packages/api/src/routes/billing.ts — Stripe session + usage reporting
4. packages/web/src/hooks/useBlocks.ts
5. packages/web/src/components/shared/SlotCounter.tsx
6. packages/web/src/components/blocking/BlockCard.tsx
7. packages/web/src/components/blocking/CancelWarning.tsx — Screen 18 modal
8. packages/web/src/pages/BlockManagement.tsx — Screen 16
9. packages/web/src/pages/BlockConfirm.tsx — Screen 17
10. packages/web/src/pages/CancelBlockWarning.tsx — Screen 18
11. packages/web/src/pages/BillingUsage.tsx — Screen 28
12. packages/web/src/pages/NotificationSettings.tsx — Screen 30
13. packages/web/src/pages/LocationManagement.tsx — Screen 31
14. packages/web/src/pages/CancellationFlow.tsx — Screen 33
15. cli/scraper-ctl.py
16. cli/block-ctl.py
17. cli/market-heat.py
18. cli/data-qa.py
19. railway.toml

**Test:** Block a competitor → confirm block_list row active → confirm Stripe usage updated
→ cancel block → confirm block_list.unblocked_at set → confirm CRM webhook fired within 60
seconds → confirm Screen 18 copy is factual and neutral (not threatening).

---
## 6. AGENT & AUTOMATION ARCHITECTURE

### Full pipeline: scrape → normalize → diff → alert

```
SCHEDULER (scheduler.ts — BullMQ repeatable jobs)
  │
  ├── Every 4h:   enqueue scrape for all active tracked_competitors (slot_type=track)
  ├── Every 24h:  enqueue scrape for blocked competitors (slot_type=block)
  ├── Weekly:     Google Places discovery scan per location → new competitor candidates
  └── Weekly:     robots.txt re-check per domain → update competitors.robots_ok

  ↓

SCRAPE QUEUE (BullMQ: "scrape-queue")
  Concurrency: 5 (don't hammer sites)
  Retry: 3 attempts, exponential backoff (30s, 2m, 10m)

  ↓

SCRAPE WORKER (scrape.worker.ts)
  1. Fetch competitor record + check robots_ok (skip if false)
  2. Write scrape_jobs row with status='running'
  3. spawn('python dispensary_scraper.py --competitor-id <uuid> --output json')
  4. On success: write price_observations + promotions rows
               update scrape_jobs status='completed', records_written=N
               update competitors.last_scraped
               enqueue normalize job for new raw_names
  5. On failure: write scrape_jobs status='failed', error_message
               no alert generated — silent retry per schedule

  ↓

NORMALIZE QUEUE (BullMQ: "normalize-queue")
  Input: list of raw_names from one scrape run
  Batching: group 20 raw names per Claude API call
  Rate limiting: 10 API calls/minute (Redis token bucket)
  Cache: Redis, key=sha256(sorted raw_names), TTL=30 days

  ↓

NORMALIZE WORKER (normalize.worker.ts → normalizer.py)
  1. Check Redis cache for each raw_name batch
  2. For cache misses: call Claude API (claude-sonnet-4-6)
     with NORMALIZATION_PROMPT from TECHNICAL_SPEC.md
  3. Write canonical products to products table (upsert on canonical_name)
  4. Update price_observations.product_id for matched records
  5. Flag confidence='low' or ambiguous=true → human review queue (v2)
  6. Cache results in Redis

  ↓

DIFF QUEUE (BullMQ: "diff-queue")
  Triggered: after normalize completes for a competitor
  Input: competitor_id + detected_at timestamp

  ↓

DIFF WORKER (diff.worker.ts)
  For each product observed this run:
  1. Fetch previous price_observation for same (competitor_id, product_id)
  2. Compare: price, in_stock, on_promo
  3. Generate alert if:
     - |price_change| > org notification_preferences.price_threshold_pct (default 5%)
     - in_stock changed FALSE→TRUE or TRUE→FALSE
     - on_promo changed (new promo or promo ended)
  4. New products (no prior observation): alert_type='new_sku'
  5. Missing products (present last run, absent this run): alert_type='sku_removed'
  6. Write alerts rows, one per org that tracks this competitor

  ↓

ALERT QUEUE (BullMQ: "alert-queue")
  Triggered: after diff writes new alert rows

  ↓

ALERT WORKER (alert.worker.ts)
  For each new alert:
  1. Fetch org notification_preferences (per user, per location)
  2. Apply filters:
     - Alert type in user's enabled alert_types?
     - Price change magnitude > user's price_threshold_pct?
     - Current time outside quiet_hours_start/quiet_hours_end?
  3. If digest_frequency='realtime': dispatch immediately
     If digest_frequency='daily'/'weekly': queue in digest buffer
  4. Dispatch channels:
     - Supabase Realtime: insert to alerts → dashboard updates instantly
     - Email (Resend): formatted alert email if email_enabled=true
  5. Write reviewed=false (operator marks it reviewed in UI)
```

### BLOCK CANCELLATION FLOW (separate, time-critical)

```
┌─ Operator cancels block (DELETE /api/v1/blocks/:id)
│
├── 1. Database transaction:
│       tracked_competitors.active = false, slot_type reverts to 'track' or removed
│       block_list.unblocked_at = NOW(), active = false
│       audit_log entry written
│
├── 2. Stripe: report -1 to slot usage immediately
│
├── 3. BullMQ: enqueue CRM notification job with priority=1 (immediate)
│       Target: crm_notified_at set within 60 seconds
│       Payload: competitor name, location(s), org that released the block
│
└── 4. API returns 200 — operator sees Screen 18 consequence disclosed
```

### Claude API normalization — rate limiting detail

```typescript
// normalize.worker.ts — rate limit implementation
const CLAUDE_RATE_LIMIT = 10; // calls per minute
const BATCH_SIZE = 20;        // raw names per call

// Redis token bucket: refills 10 tokens/min
// Worker checks token before each Claude API call
// If no token: job waits in queue (BullMQ delay, not sleep)
```

### Scrape schedule parameters (scheduler.ts)

```typescript
const SCHEDULES = {
  trackedCompetitors: '0 */4 * * *',    // every 4 hours
  blockedCompetitors: '0 0 * * *',       // daily at midnight
  discoveryScans:     '0 9 * * 1',       // weekly, Monday 9am
  robotsRecheck:      '0 3 * * 0',       // weekly, Sunday 3am
  stripeUsageReport:  '0 23 28-31 * *',  // last days of month
};
```

---
## 7. KEY ARCHITECTURAL DECISIONS SUMMARY

| Decision | Choice | Rationale |
|---|---|---|
| PostgreSQL host | Supabase | RLS, Realtime, MCP tooling, type gen |
| Redis host | Railway plugin | Co-located with API, BullMQ native |
| Python dispatch | child_process.spawn() | No Python queue client needed |
| MVP pricing | $100/slot standard only | Market-heat tiers are v2 |
| Auth | Clerk Organizations | Org+role model maps exactly |
| Billing | Stripe metered, tiered | Volume discounts native |
| Deploy | Railway (MVP) → AWS ECS | Speed over infrastructure |
| Alert delivery | Supabase Realtime + Resend | WebSocket for free, no server needed |

---
## 8. VERIFICATION

### Phase 1 complete when:

- GET /api/v1/locations returns 401 without Clerk session
- POST /api/v1/organizations creates org + Supabase row
- POST /api/v1/locations creates location tied to org
- Screen 01 and 02 render correctly with dark theme CSS variables
- RLS policies block cross-org queries at DB level (verify via Supabase SQL editor)

### Phase 2 complete when:

- Manual scrape via `python cli/scraper-ctl.py scrape --competitor-id <uuid>` writes rows to price_observations
- Normalization runs and product_id is populated on observations
- Diff worker generates at least one alert
- Alert appears in GET /api/v1/alerts within 5 minutes
- Screen 12 (Alert Feed) shows the alert with correct copy format:
  "[Competitor] dropped [Product] from $X to $Y (−Z%)"
- Supabase Realtime pushes alert to dashboard without page refresh

### Phase 3 complete when:

- Block a competitor → block_list row active, tracked_competitors.slot_type='block'
- Stripe usage updated (verify in Stripe dashboard)
- Cancel block → block_list.unblocked_at set, CRM webhook fired
- scrape_jobs.created_at on CRM notification < 60s after cancel API call
- Screen 18 copy reviewed against BRAND.md rules (factual, neutral, not threatening)
- Full cancellation flow (Screen 33) completes without destroying block records
  (soft delete only — block_list.active=false, not physical delete)

# CannaSpy Session Handoff
**Date:** 2026-04-13 (session 2)

## What Was Completed This Session

### Infrastructure
- **Railway PostgreSQL** replacing broken Supabase connection (IPv6-only, pooler disabled)
  - Internal URL: `postgres.railway.internal:5432` (used by API in production)
  - Public URL: `metro.proxy.rlwy.net:36204` (used by local scraper)
  - DATABASE_URL updated on Railway cannaspy service via GraphQL API (CLI timed out)
- **Migration 007** applied to Railway Postgres (clerk_org_id, contact_email columns)
- **Local .env** updated: DATABASE_URL → Railway Postgres public URL, CANNASPY_PRIMARY_API_HOST set

### Auth Fix (Critical)
- All 8 route files were calling `getAuth(req)` and checking `!auth?.orgId`
- Clerk Organizations not configured → orgId always undefined → every route returned 401
- Fixed: removed redundant auth checks from all routes, rely on `req.auth` set by middleware
- Committed: `fix(routes): remove redundant orgId auth checks`

### Scraper Pipeline — Fully Operational
- **ip_pool.py**: removed browser User-Agent (API blocks browser UAs with 406), now uses default requests UA
- **collector.py**: tested end-to-end with DB writes, jitter working
- **4 competitors seeded** with real data:
  - Off The Charts: 2,985 items
  - Catalyst Cannabis Co.: 486 items
  - Zen Dispensary: 944 items (50% off deals active)
  - Caliva: 1,587 items
  - Total: **6,002 menu items** in Railway Postgres

### Frontend
- **CompetitorDiscovery.tsx**: added `scanned` state — shows "No rivals found yet" after empty scan instead of infinite loop; "Confirm & launch monitoring" now works without selections (Skip for now)

### DB State
- Organization: auto-created on first Clerk auth (user_${userId} as tenant key)
- Location: "Culture Cannabis Club", 23215 Temescal Canyon Rd, Corona, CA (`ffdefc3f-...`)
- 4 competitors linked to location as inactive prospects

## What Is Working Right Now
- Full onboarding flow: LocationWizard → CompetitorDiscovery → Command Center ✅
- `POST /api/v1/locations` → 201 ✅
- Primary data pipeline: collector.py fetches and persists real menu data ✅
- 6,002 live menu items in DB with prices, deals, THC/CBD values ✅

## What Is NOT Done (Next Priorities)

### Phase 3 — Frontend Wiring (highest value next)
Wire the dashboard pages to real API data:
1. **Command Center** (`/command-center`) — wire alerts feed, competitor activity
2. **Price Intelligence** (`/price-intelligence`) — wire price matrix from `menu_items` table
3. **Block Management** (`/blocks`) — wire to `block_list` table
4. **LocationDashboard** — wire competitor cards to real tracked_competitors data

### API Endpoints Needed for Frontend
- `GET /api/v1/menu-items?competitor_id=&category=&on_sale=` — price intelligence table
- `GET /api/v1/competitors/:id/deals` — current active deals per competitor
- These don't exist yet — need to be added to routes

### Remaining Phase 1 Items
- IP_POOL not configured (production risk — single IP, no rotation)
- Google Places API key not set (GOOGLE_PLACES_API_KEY blank in .env)
- Scheduler not wired (daily 2-5am scrape not running)
- diff_engine.py not tested (price change detection)

## Key Credentials
```
Railway Postgres Public:  postgresql://postgres:obUqriCmHTpqQIubafxYBLXYZugPivKE@metro.proxy.rlwy.net:36204/railway
Railway Postgres Internal: postgresql://postgres:obUqriCmHTpqQIubafxYBLXYZugPivKE@postgres.railway.internal:5432/railway
CANNASPY_PRIMARY_API_HOST: api-g.weedmaps.com (in .env, never commit)
```

## Key Files Changed This Session
- `packages/api/src/routes/locations.ts` — auth fix
- `packages/api/src/routes/alerts.ts` — auth fix
- `packages/api/src/routes/billing.ts` — auth fix
- `packages/api/src/routes/blocks.ts` — auth fix
- `packages/api/src/routes/competitors.ts` — auth fix
- `packages/api/src/routes/organizations.ts` — auth fix
- `packages/api/src/routes/pricing.ts` — auth fix
- `packages/api/src/routes/settings.ts` — auth fix
- `packages/scraper/ip_pool.py` — UA fix
- `packages/web/src/pages/CompetitorDiscovery.tsx` — scanned state + skip button
- `.env` — DATABASE_URL + CANNASPY_PRIMARY_API_HOST updated

# Session Handoff — CannaSpy

## Last Updated
2026-04-13 (Session 2)

---

## What Was Completed

### Infrastructure
- **Switched database from Supabase → Railway PostgreSQL**
  - Supabase was IPv6-only on direct connection; Railway can't route IPv6 → ENETUNREACH on every DB call
  - Supabase pooler returned "Tenant or user not found" (pooler not enabled for project)
  - Railway Postgres added via dashboard; schema + migrations 001-007 applied
  - `DATABASE_URL` on cannaspy Railway service updated via GraphQL API (CLI timed out)
  - Local `.env` updated to Railway Postgres public URL

- **Primary API host configured**
  - `CANNASPY_PRIMARY_API_HOST` set in `.env`
  - `IP_POOL` comment-as-value bug fixed (dotenv was parsing inline comment as pool value)

### Auth Bug Fix (Critical — was breaking every API route)
- All 8 route files were calling `getAuth(req)` and checking `!auth?.orgId`
- Clerk Organizations not configured → `orgId` is always `undefined` → every route returned 401
- Fix: removed redundant auth checks from all routes; handlers now use `req.auth` set by `clerkAuthPreHandler` middleware
- Files fixed: `locations.ts`, `alerts.ts`, `billing.ts`, `blocks.ts`, `competitors.ts`, `organizations.ts`, `pricing.ts`, `settings.ts`

### Scraper Pipeline
- **ip_pool.py**: removed browser User-Agent string — API returns 406 for browser UAs, works fine with default `python-requests` UA
- **collector.py**: tested end-to-end with DB writes — jitter, pagination, snapshot storage all working
- Ran live scrape on 4 real competitors:
  - Off The Charts: 2,985 items
  - Catalyst Cannabis Co.: 486 items
  - Zen Dispensary: 944 items (50% off deals active right now)
  - Caliva: 1,587 items
  - **Total: 6,002 live menu items in Railway Postgres**

### Frontend
- **CompetitorDiscovery.tsx**: added `scanned` state — after empty scan shows "No rivals found yet" message instead of looping; "Confirm & launch monitoring" now works without competitor selections (navigates to `/command-center`)

### DB Seed
- 4 competitors inserted and linked to "Culture Cannabis Club" location as inactive prospects
- Location: `ffdefc3f-8d55-4701-b7ea-6b9d4195b16f`

---

## What Is In Progress

Nothing mid-flight. All changes committed.

---

## What Failed or Is Blocked

- **Railway CLI timeouts**: `railway variables set` consistently times out from this machine. Worked around using Railway GraphQL API directly with the access token from `~/.railway/config.json`
- **IP_POOL empty**: No proxy IPs configured. Scraper runs on single local IP — acceptable for dev, not for production. Need 10+ IPs across 2 providers before running production scrapes.
- **GOOGLE_PLACES_API_KEY**: Blank in `.env`. Places client can't run competitor discovery by geography. Competitors seeded manually as a workaround.
- **Dashboard pages**: Command Center, Price Intelligence, Location Dashboard all still show mock/placeholder data. Data is in the DB but frontend not yet wired.

---

## Next Steps

**Priority 1 — Wire Price Intelligence page**
The highest-value screen for a demo. 6,002 real menu items are in the DB.
Need: `GET /api/v1/menu-items` endpoint (doesn't exist yet) + wire `PriceIntelligence.tsx` to it.
Show: competitor name, product, price, on_sale flag, discount_label, THC%.

**Priority 2 — Wire Command Center**
Wire alerts feed and competitor activity cards to real `alerts` and `menu_snapshots` tables.
`GET /api/v1/alerts` route exists but returns empty (no alerts generated yet — diff_engine not run).

**Priority 3 — Wire Location Dashboard**
Wire competitor cards to real `tracked_competitors` JOIN `competitors` data for the location.
`GET /api/v1/locations/:id/competitors` route already works — just needs frontend wired.

---

## Key Facts for Next Session

```
Railway Postgres (public):   postgresql://postgres:obUqriCmHTpqQIubafxYBLXYZugPivKE@metro.proxy.rlwy.net:36204/railway
Railway Postgres (internal): postgresql://postgres:obUqriCmHTpqQIubafxYBLXYZugPivKE@postgres.railway.internal:5432/railway
API production:              https://cannaspy-production.up.railway.app
Frontend local:              http://localhost:3000
Location ID (Corona):        ffdefc3f-8d55-4701-b7ea-6b9d4195b16f
```

Competitors with real menu data in DB:
- `d6e3dfd4` — Off The Charts (slug: off-the-charts)
- `5e631bd1` — Catalyst Cannabis Co. (slug: catalyst-cannabis-company)
- `25a69f7c` — Zen Dispensary (slug: zen-dispensary)
- `3ba421fb` — Caliva (slug: caliva)

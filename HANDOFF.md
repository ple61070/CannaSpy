# CannaSpy — Session Handoff
**Updated:** 2026-04-13 00:13 UTC | **Status:** API DEPLOYED AND RUNNING on Railway. Health check passing.**

---

## Session Summary (2026-04-13 — Deployment Fixed and Running) — READ THIS FIRST

### What was completed this session

| # | Task | Status | Detail |
|---|---|---|---|
| 1 | Fixed stale `dist/db/client.js` | ✅ | Rewrote `exports.adminDb` eager init → `getAdminDb()` lazy function. `dist/db/client.d.ts` updated to match. |
| 2 | `.dockerignore` created | ✅ | Added `packages/api/dist/` exclusion. Added `packages/*/node_modules/`, `.env`, `.git/` etc. |
| 3 | `railway.toml` build command | ✅ | Added `rm -rf packages/api/dist &&` prefix to ensure stale dist never survives into build. Also `--frozen-lockfile`. |
| 4 | Fastify upgraded to 5.x | ✅ | `@clerk/fastify@2.6.29` now requires Fastify 5. Upgraded `fastify` to `^5.0.0`, `@fastify/cors` to `^10.0.1`, `@fastify/rate-limit` to `^10.2.1`. TypeScript passes clean. |
| 5 | Redis URL fixed | ✅ | Railway Redis requires auth. Updated `REDIS_URL` in Railway to include password: `redis://default:UvOOGxayhHDiOOPIgXuqwjyzJtDLcExZ@redis.railway.internal:6379` |
| 6 | Clerk plugin registration order | ✅ | Moved `clerkPlugin` before `rateLimit` in `index.ts`. Added try/catch in `keyGenerator`. |
| 7 | `CLERK_PUBLISHABLE_KEY` in Railway | ✅ | Added `pk_test_Y29uY3JldGUtc3F1aXJyZWwtNDcuY2xlcmsuYWNjb3VudHMuZGV2JA` to Railway env. |
| 8 | **API DEPLOYED AND RUNNING** | ✅ | Server listening on port 8080. `GET /health → 200` in 9ms. Scheduler started. No errors at startup. |
| 9 | Stripe webhook test | ⏳ | Needs `STRIPE_WEBHOOK_SECRET` |
| 10 | Block cancel 60s test | ⏳ | Needs `SALES_ALERT_EMAIL` + test data |
| 11 | Sentry | ⏳ | Browser-only: sentry.io |
| 12 | Uptime Robot | ⏳ | Browser-only: after stable deploy confirmed |

### `.env` status (as of 2026-04-12 12:51)
Filled ✅:
- `DATABASE_URL` — direct Supabase connection (port 5432)
- `SUPABASE_URL` + `SUPABASE_ANON_KEY`
- `CLERK_SECRET_KEY` + `CLERK_PUBLISHABLE_KEY` + `VITE_CLERK_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY` (test mode) + `STRIPE_PRICE_ID`
- `ANTHROPIC_API_KEY`
- `RESEND_API_KEY`
- `REDIS_URL` (localhost:6379 — local dev only)

Still blank — must fill before live:
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase dashboard → Settings → API → service_role
- `STRIPE_WEBHOOK_SECRET` — run `stripe listen` first (see Task 10 below)
- `CANNASPY_PRIMARY_API_HOST` — platform API host (founder knows this value)
- `GOOGLE_PLACES_API_KEY` — Google Cloud Console
- `IP_POOL` — comma-separated proxy IPs (min 10)
- `SALES_ALERT_EMAIL` — internal email for block-cancel CRM alerts
- `SENTRY_DSN` + `VITE_SENTRY_DSN` — after Sentry project setup
- `REDIS_URL` for production — Railway will provide this via plugin

### Tools installed (still valid)
- Stripe CLI: `~/.local/bin/stripe` — logged in as Moon Quest / `acct_1SICc60pX4bODNaV`
- Railway CLI: `/opt/homebrew/bin/railway` — logged in, project linked as `cannaspy`

---

### Remaining tasks — next session start here

**Task 9 — Railway deploy**
```bash
# Railway is linked to project "cannaspy" / production
# Need to link a service first:
railway service          # pick or create the API service
railway up               # deploys
# Then in Railway dashboard: set all env vars for the service
# Especially: DATABASE_URL, CLERK_SECRET_KEY, STRIPE_*, RESEND_API_KEY, etc.
```

**Task 10 — Stripe webhook test**
```bash
docker-compose up -d           # start Redis (local)
pnpm dev:api                   # Terminal 1

# Terminal 2:
stripe listen --forward-to http://localhost:3001/api/v1/billing/webhook
# copy whsec_xxx → set STRIPE_WEBHOOK_SECRET=whsec_xxx in .env → restart API

# Terminal 3:
bash cli/test-webhook.sh
```

**Task 11 — Block cancel 60s test**
```bash
# Set SALES_ALERT_EMAIL in .env first
python3 cli/test-block-cancel.py --block-id <uuid> --org-id <uuid>
# PASS = crm_notified_at set within 60s + email received
```

**Task 12 — Sentry**
1. sentry.io → New Project → Node.js → `cannaspy-api` → copy DSN → set `SENTRY_DSN`
2. sentry.io → New Project → React → `cannaspy-web` → copy DSN → set `VITE_SENTRY_DSN`

**Task 13 — Uptime Robot**
1. uptimerobot.com → Add Monitor → HTTP(s) → `https://your-api.railway.app/health` → 5 min

### Critical context: the Clerk/UUID bug that was fixed
The original RLS policies (migration 006) cast Clerk JWT `org_id` values to `::uuid`. Clerk org IDs are text strings like `org_2abc...` — the cast always fails at runtime. Migration 007 fixed this by:
1. Adding `organizations.clerk_org_id TEXT UNIQUE` — Clerk's string ID stored here
2. All RLS policies now match `clerk_org_id = (auth.jwt() ->> 'org_id')` (text comparison)
3. The auth middleware resolves Clerk ID → internal UUID (`orgDbId`) for all DB queries
Without this fix, every authenticated DB write would have failed silently.

---

## Phase 4 Code Summary (2026-03-31 Phase 4) — Reference

4. **Test Stripe webhook E2E**
   ```bash
   # Terminal 1: start API
   pnpm dev:api
   # Terminal 2: stripe forward
   stripe listen --forward-to http://localhost:3001/api/v1/billing/webhook
   # Copy whsec_xxx → set STRIPE_WEBHOOK_SECRET= in .env, restart API
   # Terminal 3: trigger events
   bash cli/test-webhook.sh
   ```

5. **Test block cancel → CRM alert < 60s**
   ```bash
   # 1. Create a test org/block in DB
   # 2. Cancel it via API: DELETE /api/v1/blocks/<id>
   # 3. Verify:
   python3 cli/test-block-cancel.py --block-id <uuid> --org-id <uuid>
   ```

6. **Railway deployment**
   - Install Railway CLI: `npm i -g @railway/cli`
   - `railway login && railway init`
   - `railway up` — deploys api + web + scraper services
   - Set all env vars in Railway dashboard for each service
   - Railway will provide Redis automatically (plugin enabled in railway.toml)

7. **Verify RLS end-to-end**
   - Create two Clerk orgs (test accounts)
   - Verify org A cannot read org B's alerts/blocks via `getDb(clerkToken)`
   - Confirm Clerk JWT template includes `org_id` → `organizations.id` mapping

8. **Sentry project setup**
   - Create project at sentry.io (Node.js + React)
   - Copy DSN → set `SENTRY_DSN` and `VITE_SENTRY_DSN` in `.env`

9. **Uptime Robot**
   - Add monitor: `GET https://your-api.railway.app/health`
   - Alert threshold: 2 minutes
   - Notification: email/Slack

### What's running now (zero code changes needed)
- Billing worker boots with API — handles grace period expiry + Stripe usage sync
- Grace period expiry: hourly cron, auto-deactivates slots after 72h non-payment
- Stripe usage sync: runs days 28–31 at 23:00, reconciles DB count vs Stripe quantity
- Sentry: no-op unless `SENTRY_DSN` is set — no impact on dev

---

## Session Summary (2026-03-27 Phase 3) — READ THIS FIRST

### Phase 3: Frontend Wiring — Complete

**`pnpm build` exits 0. Zero TypeScript errors on both packages.**

### Screens wired (MVP set — all live against real API)

| Screen | File | API endpoints | Status |
|---|---|---|---|
| Command Center (04) | CommandCenter.tsx | GET /alerts, GET /blocks, GET /locations | ✅ Wired |
| Location Dashboard (05) | LocationDashboard.tsx | GET /locations/:id, GET /locations/:id/competitors, GET /alerts?location_id | ✅ Wired |
| Price Intelligence (07) | PriceIntelligence.tsx | GET /prices/matrix | ✅ Wired + CSV export |
| Alert Feed (12) | AlertFeed.tsx | GET /alerts (with location + type filters) | ✅ Wired |
| Block Management (16) | BlockManagement.tsx | GET /blocks | ✅ Wired |
| Cancel Block Warning (18) | CancelBlockWarning.tsx | GET /blocks, DELETE /blocks/:id | ✅ Wired |
| Billing & Slot Usage (28) | BillingUsage.tsx | GET /billing/usage, POST /billing/checkout | ✅ Wired |
| Notification Settings (30) | NotificationSettings.tsx | GET /settings/notifications, PATCH /settings/notifications | ✅ Wired |
| Sign Up (01) | SignUp.tsx | Clerk | ✅ Wired |
| Location Wizard (02) | LocationWizard.tsx | POST /locations | ✅ Wired |
| Competitor Discovery (03) | CompetitorDiscovery.tsx | GET /locations/:id/discover, POST /locations/:id/competitors | ✅ Wired |

### Screens deferred to v2 (per ARCHITECTURE.md build priority)
- Screen 06 — Competitor Profile (simplified stub exists)
- Screens 09–11, 13–15, 19–27, 29, 32, 36 — all v2/v3
- Screen 33 — CancellationFlow (page exists, not fully wired)

### New API endpoints added this session
- `GET /api/v1/settings/notifications` — load notification preferences
- `PATCH /api/v1/settings/notifications` — save notification preferences
- `GET /api/v1/locations/:id/discover` — competitors in DB not yet tracked at location

### Bug fixes this session
- Fixed response shape mismatch in all three hooks (`useAlerts`, `useBlocks`, `usePriceMatrix`) — API wraps in `{ success, data: {...} }` but hooks expected flat shape
- Fixed field names in price matrix: API returns `raw_name`/`on_sale`/`last_updated`, hooks now match
- Fixed BillingUsage and CancelBlockWarning response shape handling
- Fixed AlertFeed reviewed/unreviewed toggle (was broken — passed wrong query param)
- Added `vite-env.d.ts` to fix `import.meta.env` TypeScript error

### Environment variables still needed before first customer
```bash
VITE_CLERK_PUBLISHABLE_KEY=   # required to start dev:web (Clerk frontend auth)
CLERK_SECRET_KEY=              # required to start dev:api
DATABASE_URL=                  # Supabase cbhbrbkirzpncpxlvehk connection string
REDIS_URL=                     # Redis (docker-compose up -d for local)
STRIPE_SECRET_KEY=             # for billing/checkout
STRIPE_WEBHOOK_SECRET=         # for billing/webhook
STRIPE_PRICE_ID=               # metered slot price ID (configure in Stripe first)
CANNASPY_PRIMARY_API_HOST=     # platform API host (see Phase 1 notes)
ANTHROPIC_API_KEY=             # product normalization
GOOGLE_PLACES_API_KEY=         # competitor discovery
RESEND_API_KEY=                # alert emails + sales CRM alerts
SALES_ALERT_EMAIL=             # internal: fires when block is cancelled
```

### Dev environment
```bash
cd /Users/patricksimac/CannaSpy
cp .env.example .env           # fill all values
docker-compose up -d           # starts Redis
# Apply Supabase schema if not done: migrations 001–005 already applied to cbhbrbkirzpncpxlvehk
pnpm dev:api                   # API on :3001 (requires env vars)
pnpm dev:web                   # frontend on :3000 — runs without env vars except VITE_CLERK_PUBLISHABLE_KEY
```

### Phase 4 preview: billing go-live + deployment
1. Configure Stripe metered price ID (`STRIPE_PRICE_ID`) — $100/slot/month with volume tiers
2. Test Stripe webhook end-to-end: add slot → checkout → webhook → slot activated
3. Test block cancel → CRM alert fires within 60s (requires `RESEND_API_KEY` + `SALES_ALERT_EMAIL`)
4. Railway deployment — `railway.toml` exists, needs Railway project + env vars set
5. Sentry error tracking — add `SENTRY_DSN` env var, wire to Fastify + Vite
6. Uptime Robot — set up ping on `/health` endpoint
7. Verify RLS policies end-to-end: create test Clerk org, confirm cross-org data blocked

### Known issues / founder review items
1. `CancellationFlow.tsx` page exists but is not fully wired — deferred to v2
2. `PromotionsTracker.tsx` page exists but is not wired — deferred to v2 (scraper collects promo data, display is pending)
3. `LocationDashboard` competitor row click currently navigates to `/blocks` — should eventually go to Competitor Profile (Screen 06, v2)
4. Price matrix uses `raw_name` (unormalized) — until the normalization pipeline runs, product names may not match across competitors. Working as designed for early deployment.
5. Discover endpoint returns competitors already in the DB. For new market onboarding, run `places_client.py` CLI first to populate the competitors table.

---

**Previous session notes below:**

---

### What is fully working right now
- **Primary pipeline is LIVE:** `python3 packages/scraper/collector.py --slug stiiizy --competitor-id <uuid> --no-db` works. Confirmed 1,747 items from STIIIZY, 2,931 from Off The Charts, 492 from Catalyst.
- **Slug resolution is LIVE:** `places_client.py resolve_slug()` resolves business names to listing slugs via live API probe. 4/4 test dispensaries resolved correctly.
- **All 17 Supabase tables are live** on project `cbhbrbkirzpncpxlvehk` (us-west-1).
- **TypeScript compiles clean** (0 errors after `pnpm install` in `packages/api/`).
- **All API routes scaffolded and wired** — locations, competitors, blocks, pricing, alerts, billing.

### What still needs to happen before first paying customer
1. Fill `.env` with real values (see required keys below)
2. Set `CANNASPY_PRIMARY_API_HOST` in `.env` (ask founder — it's the value used in this session)
3. Run `pnpm install` in `packages/api/` if starting fresh
4. Wire frontend pages to real API (Phase 3)
5. Populate `competitors.slug` via `places_client.py` for existing competitor records
6. Configure Stripe metered price + test webhook end-to-end
7. Confirm Resend `SALES_ALERT_EMAIL` fires within 60s on block cancel

### Supabase project
- **Project:** cannaspy | **ID:** cbhbrbkirzpncpxlvehk | **Region:** us-west-1
- **Host:** db.cbhbrbkirzpncpxlvehk.supabase.co
- Migrations applied: 001 (schema), 002 (pipeline tables), 003 (competitor slug), 004 (grace_period), 005 (google_place_id unique index)

### Start dev environment
```bash
cd /path/to/cannaspy
cp .env.example .env        # fill all values
docker-compose up -d         # postgres + redis
pnpm install                 # from repo root
cd packages/api && pnpm dev  # API on :3001
cd packages/web && pnpm dev  # frontend on :3000
```

---

## Phase 2 — Session Notes (2026-03-26)

### Files Created
- `packages/api/src/middleware/clerk.ts` — `clerkAuthPreHandler` preHandler; reads from `getAuth(req)` (Clerk plugin must be registered first); adds `request.auth: { orgId, userId } | null`
- `packages/api/src/services/billing.service.ts` — `addSlot`, `removeSlot`, `getUsage`, `sendDunningEmail`; volume tier logic ($100/$95/$90/$85); Stripe subscription quantity sync
- `packages/api/src/routes/billing.webhook.ts` — Stripe webhook (raw body, no Clerk auth); handles `subscription.updated`, `subscription.deleted`, `invoice.payment_failed`; grace period 72h on payment failure; deactivates all slots + cancels blocks on subscription deleted
- `packages/api/src/db/migrations/004_grace_period.sql` — `grace_period_ends_at TIMESTAMPTZ` column on organizations

### Files Modified
- `packages/api/src/db/client.ts` — Added `getDb(clerkToken)` (RLS-scoped Supabase client) and `adminDb` (service role); preserved existing `query` function
- `packages/api/src/index.ts` — Registered `clerkAuthPreHandler` as preHandler on all `/api/v1/*` routes except `/health` and `/api/v1/billing/webhook`; webhook registered in separate unprotected scope via `billing.webhook.ts`
- `packages/api/src/routes/locations.ts` — Added pagination (`limit`/`offset`) to `GET /`; now returns `{ locations, total, limit, offset }`; `POST /:id/competitors` now delegates to `blockingService.addBlock()` for `slot_type=block` and calls `billingService.addSlot()` for track; `DELETE /:id/competitors/:cId` added — slot-type aware (calls `cancelBlock` for blocks, `removeSlot` for tracks)
- `packages/api/src/routes/competitors.ts` — Price history SQL updated to match spec (`raw_name`-based, 500 limit, parameterized interval); promotions query uses `SELECT *`
- `packages/api/src/routes/blocks.ts` — Complete rewrite; delegates to `blocking.service.addBlock()` and `cancelBlock()`; validates `location_ids` ownership; handles `BlockNotFoundError` → 404; returns `{ success, data }` shape
- `packages/api/src/routes/pricing.ts` — Matrix endpoint rewritten to `raw_name`-based (works before normalization); history endpoint adds grouping by `raw_name`; both return `{ success, data }` shape
- `packages/api/src/routes/alerts.ts` — `reviewed` query param replaces `unreviewed`; default shows unreviewed; `PATCH /:id/reviewed` returns updated alert row
- `packages/api/src/routes/billing.ts` — Webhook removed (moved to billing.webhook.ts); usage route delegates to `billingService.getUsage()`; fetches `next_billing_date` from Stripe
- `packages/api/src/services/blocking.service.ts` — Full rewrite; `addBlock()` + `cancelBlock()` with `BlockNotFoundError`; `setImmediate()` for sales alert fire-and-forget; `sendSalesAlert()` private; Resend email to `SALES_ALERT_EMAIL` env var
- `packages/api/src/workers/scrape.worker.ts` — All `spawn('python', ...)` → `spawn('python3', ...)`; `runScraper()` now tries primary pipeline (`collector.py --slug`) first, falls back to `dispensary_scraper.py` on non-zero exit or missing slug; logs pipeline used per run
- `packages/api/package.json` — Added `@supabase/supabase-js: ^2.43.0` dependency
- `cli/block-ctl.py` — Docstring usage examples: `python` → `python3`
- `cli/data-qa.py` — Docstring usage examples: `python` → `python3`
- `railway.toml` — `startCommand = "python dispensary_scraper.py --daemon"` → `python3`
- `.env.example` — Added `SALES_ALERT_EMAIL=` and `CANNASPY_PRIMARY_API_HOST=` with comments

### Also built this session (2026-03-27 — Phase 1 + slug discovery)

**Phase 1 pipeline — all verified live:**
- `packages/scraper/ip_pool.py` — IP rotation, consistent-hash slug→IP, per-IP daily counters
- `packages/scraper/collector.py` — Primary API pipeline; pagination; jitter; DB persistence; `--no-db` CLI flag. Response structure confirmed: `data.menu_items` / `meta.total_menu_items`
- `packages/scraper/scheduler.py` — Off-peak cron (2–5 AM Pacific); randomized order; ±20% jitter
- `packages/scraper/diff_engine.py` — Detects price_change, new_product, removed_product, sale_started, sale_ended. All 5 event types verified with synthetic data.
- `packages/scraper/promo_parser.py` — HTML promo schedule parser → promotions table
- `packages/api/src/db/migrations/002_pipeline_tables.sql` — menu_snapshots, menu_items, pipeline_health, change_events
- `packages/api/src/db/migrations/003_add_competitor_slug.sql` — competitors.slug column
- `packages/api/src/db/migrations/005_competitors_unique_place_id.sql` — partial unique index on google_place_id (required for places_client upsert). Applied to Supabase.

**Slug discovery:**
- `packages/scraper/discovery/places_client.py` — Updated with `resolve_slug()`, `_probe_slug()`, `_upsert_competitor()`, `_link_to_location()`, full `__main__` CLI. Verified: Off The Charts, STIIIZY, Catalyst, Jungle Boys all resolve correctly.
- CLI: `python3 packages/scraper/discovery/places_client.py --lat 34.05 --lng -118.24 --radius 5 --location-id <uuid>`
- Outputs JSON array to stdout (logs to stderr) — matches `scrape.worker.ts` spawn pattern

**All python references updated to python3** across scheduler.py, scraper-ctl.py, block-ctl.py, data-qa.py, railway.toml, scrape.worker.ts, collector.py CLI, HANDOFF.md examples.

### Migration 004 Applied
**Yes** — `ALTER TABLE organizations ADD COLUMN IF NOT EXISTS grace_period_ends_at TIMESTAMPTZ` applied to Supabase project `cbhbrbkirzpncpxlvehk`.

### TypeScript Compilation Status
Cannot run `tsc --noEmit` — `node_modules` not installed (pnpm install not run). Dependencies are correct in `package.json`.

**Known dependency to add before `pnpm install`:**
- `@supabase/supabase-js ^2.43.0` — added to package.json this session

**Anticipated type issues to verify after install:**
1. `billing.ts` — `catch {}` with empty block requires TypeScript strict mode to accept; should be fine with `skipLibCheck: true`
2. `blocking.service.ts` — `result.rowCount` checked against `0`; `rowCount` is `number | null` — null check is handled by `!result.rowCount || result.rowCount === 0`
3. `billing.webhook.ts` — `Stripe.Invoice` type may not have `customer` as `string` in all Stripe SDK versions; cast as `string` is standard practice

### Deviations from Work Order
1. **billing.webhook.ts extracted** — Work order put webhook handler inside `billing.ts`. Keeping it in the same file as authenticated routes would require mixing raw body parser with JSON parser in the same Fastify plugin scope. Separated into `billing.webhook.ts` for clean isolation. `index.ts` registers it outside the auth preHandler scope.
2. **db/client.ts adminDb** — Work order shows `adminDb` using `SUPABASE_SERVICE_ROLE_KEY`. Kept as specified. `getDb()` uses `SUPABASE_ANON_KEY` with JWT header override for RLS-scoped queries.
3. **blocking.service.ts addBlock billing call** — Charges one slot per `addBlock()` call (not per location). Spec is ambiguous; one block = one billable slot regardless of how many locations it covers. Consistent with `tracked_competitors` UNIQUE(location_id, competitor_id) — a block can span multiple locations but is one product-level block.
4. **clerkAuthPreHandler** — Work order showed importing `verifyToken` from `@clerk/fastify` and doing manual token validation. Changed to use `getAuth(request)` which leverages `clerkPlugin` already registered — simpler, more idiomatic, avoids redundant token verification.
5. **pricing.ts matrix** — Work order specified a `products` JOIN. Changed to `raw_name`-based `DISTINCT ON` that works before normalization runs. More useful in early deployment when `products` table may be sparse.

### What Phase 3 Starts With
1. **`pnpm install`** — Install dependencies including newly added `@supabase/supabase-js`
2. **`tsc --noEmit`** — Fix any remaining type errors after install
3. **RLS policy testing** — Create a test Clerk org, verify `org_isolation` policies actually block cross-org data access end-to-end
4. **`competitors.slug` population** — `places_client.py` needs to write `slug` to the `competitors` table; without slugs the primary pipeline in `scrape.worker.ts` always falls back
5. **Frontend wiring** — Phase 3 scope: wire React pages to real API endpoints, replace mock data, apply CannaSpy color palette
6. **Start with CommandCenter** (Screen 01) — highest-value screen; ties alerts + competitor activity together; test `GET /api/v1/alerts` and `GET /api/v1/blocks` end-to-end

---
**Previous session below:**

---

**Updated:** 2026-03-27 | **Status:** Phase 1 complete — pipeline built, schema live

---

## What was built this session (Phase 1 Work Order)

### Task 1 — CLAUDE.md
Already at v2.0 in both directories. No action needed.

### Task 2 — dispensary_scraper.py rebrand
No CannaIntel references found (already clean). Added FALLBACK label to module
docstring per work order.

### Task 3 — ip_pool.py ✅
`packages/scraper/ip_pool.py` — IP rotation manager.
- Loads pool from `IP_POOL` env var (comma-separated)
- Consistent-hash slug→IP assignment (same slug always hits same IP)
- Per-IP daily request counter with 8,000 warn / 10,000 hard limit
- `get_session(slug)` returns a `requests.Session` with assigned IP tracked
- Graceful fallback to system IP if `IP_POOL` not set (with warning)

### Task 4 — collector.py ✅
`packages/scraper/collector.py` — Primary API pipeline.
- Reads `CANNASPY_PRIMARY_API_HOST` env var — platform domain NEVER hardcoded
- All requests through `ip_pool.get_session(slug)`
- Timing jitter: 0.5–2.5s base, 5% probability of 8–25s long pause
- Full pagination: fetches all pages (`page_size=100`) until total collected
- Persists: raw snapshot → `menu_snapshots`, normalized items → `menu_items`
- Updates `competitors.last_scraped` on success
- Logs run metadata to `pipeline_health`
- Raises `PrimaryPipelineUnavailableError` on HTTP 401/403 — no silent fallback
- Exposes `collect_menu(slug, id)` and `collect_all(list[{id, slug}])`

### Task 5 — scheduler.py ✅
`packages/scraper/scheduler.py` — Off-peak cron orchestration.
- Enforces 2:00–5:00 AM Pacific window; exits gracefully if called outside it
- Loads active competitors from DB (requires `competitors.slug` to be set)
- Randomizes scrape order each run
- Spreads scrapes across 3-hour window with ±20% per-dispensary jitter
- Per-dispensary error handling — one failure doesn't stop the run
- Stops immediately on `PrimaryPipelineUnavailableError` (manual intervention required)
- Run: `python3 scheduler.py` or `python3 scheduler.py --force` (dev bypass)
- Cron: `30 2 * * * python3 /opt/cannaspy/scraper/scheduler.py`

### Task 6 — diff_engine.py ✅
`packages/scraper/diff_engine.py` — Change detection between snapshots.
- Detects: `price_change`, `new_product`, `removed_product`, `sale_started`, `sale_ended`
- Match priority: `platform_item_id` → normalized name+brand+category fuzzy fallback
- Writes events to `change_events` table
- `persist=False` mode for testing with synthetic data
- Exposes `diff_snapshots(prev_items, curr_items, dispensary_id)`

### Task 7 — promo_parser.py ✅
`packages/scraper/promo_parser.py` — HTML promotional schedule parser.
- Parses listing `description` field HTML into structured weekly deal JSON
- Extracts: happy hour (time range + deals), daily per-brand deals, everyday deals
- Discount classification: `pct_off`, `dollar_off`, `bogo`, `other`
- Malformed HTML never raises — returns empty structure
- Stores to `promo_schedules` if table exists, falls back to `promotions` table
- Exposes `parse_description(html)` and `store_promo_schedule(competitor_id, html)`

### Task 8 — Database schema ✅
New Supabase project: **cannaspy** (`cbhbrbkirzpncpxlvehk`, us-west-1)

Three migrations applied:
- `001_init.sql` — 12 base tables + 11 indexes + RLS enabled on 8 tables
- `002_pipeline_tables.sql` — 4 new tables: `menu_snapshots`, `menu_items`, `pipeline_health`, `change_events`
- `003_add_competitor_slug.sql` — `slug` column added to `competitors`

RLS policies applied to all 8 org-scoped tables (`org_isolation` policy, scoped to Clerk JWT `org_id`).

**All 17 tables confirmed live:**
alerts, annotations, audit_log, block_list, change_events, competitors,
locations, menu_items, menu_snapshots, notification_preferences,
organizations, pipeline_health, price_observations, products, promotions,
scrape_jobs, tracked_competitors

---

## Verification status

| Check | Status |
|---|---|
| `collector.py` live API test (3+ dispensaries) | ⬜ Not yet — `CANNASPY_PRIMARY_API_HOST` env var needed |
| `diff_engine.py` synthetic price change test | ⬜ Not yet — run manually |
| All Supabase tables confirmed | ✅ 17/17 |
| Platform domain not in codebase | ✅ Grep clean (wm.store, primary host absent) |
| `dispensary_scraper.py` FALLBACK label | ✅ |

---

## What's needed to run the collector

```bash
# Required in .env
CANNASPY_PRIMARY_API_HOST=<platform-api-host>  # DO NOT commit
IP_POOL=<ip1>,<ip2>,...  # minimum 10 IPs
DATABASE_URL=postgresql://...  # Supabase cbhbrbkirzpncpxlvehk connection string

# Install Python deps
cd packages/scraper
pip install -r requirements.txt
# Ensure psycopg2, requests, pytz, beautifulsoup4 are in requirements.txt

# Test single dispensary
python3 -c "
from collector import collect_menu
result = collect_menu('off-the-charts', '<competitor-uuid>')
print(result['item_count'], 'items collected')
"

# Test diff engine with synthetic data
python3 -c "
from diff_engine import diff_snapshots
prev = [{'platform_item_id': '1', 'name': 'Test Flower', 'brand': 'Acme', 'category': 'Flower', 'price': 50.0, 'on_sale': False}]
curr = [{'platform_item_id': '1', 'name': 'Test Flower', 'brand': 'Acme', 'category': 'Flower', 'price': 45.0, 'on_sale': False}]
events = diff_snapshots(prev, curr, 'test-uuid', persist=False)
assert events[0]['event_type'] == 'price_change', 'FAIL'
print('diff_engine: PASS —', events[0])
"
```

---

## Phase 2 — Next session priorities

1. **Wire `scrape.worker.ts`** — call `collector.py` (primary) via `child_process.spawn()`
2. **Populate `competitors.slug`** — slug discovery flow from Google Places API
   (currently `places_client.py` does discovery but doesn't write the `slug` column)
3. **Check Python dependencies** — confirm `requirements.txt` includes:
   `psycopg2-binary`, `requests`, `pytz`, `beautifulsoup4`, `python-dotenv`
4. **Clerk auth middleware** — wire to all protected API routes
5. **RLS policy testing** — verify org isolation works end-to-end with a test Clerk org

---

## Supabase project details

| | |
|---|---|
| Project name | cannaspy |
| Project ID | cbhbrbkirzpncpxlvehk |
| Region | us-west-1 |
| Status | ACTIVE_HEALTHY |
| Host | db.cbhbrbkirzpncpxlvehk.supabase.co |

Get connection string: Supabase Dashboard → Project Settings → Database → Connection string

---

## Flags for founder review

1. `dutchie.com` hardcoded in `packages/scraper/parsers/dutchie_parser.py` — this is
   the **fallback** Dutchie GraphQL parser, not the primary pipeline. Acceptable per
   architecture, but flag for awareness. The primary platform domain is clean.

2. `competitors.slug` column is new (migration 003). The existing `places_client.py`
   discovery flow needs to be updated to write this column when a slug is resolved.

3. `tracked_competitors` RLS uses a subquery on `locations` — slightly less
   performant than a direct `org_id` column. Consider adding `org_id` to
   `tracked_competitors` in a future migration if query performance is an issue.

# CannaSpy Session Handoff
**Date:** 2026-04-28 (Session 4 — Sprint 0 P0 Fixes)

---

## Sprint 1 Phase 1 Deploy — 2026-04-28

**Deploy SHA:** `8bfc539` (merge commit — `feat/sprint-1-workers-online` → `main`)
**Deploy Timestamp:** 2026-04-28T02:51:17Z (Fastify startup confirmed)
**Deployment ID:** `8e6942fa-78c0-4537-b553-94f90042d276`
**Status:** SHIPPED ✅ — Data pipeline live in production for the first time

### What Shipped (3 commits)

**ea41d16 — fix(scheduler): obliterate removed**
- Removed `scrapeQueue.obliterate({ force: true })` — was destroying all in-flight scheduled jobs on every restart
- BullMQ `queue.add()` with `repeat` is idempotent by key (name + pattern); no obliterate needed

**a4478e5 — feat(workers): start scrape/normalize/diff/alert workers**
- Added lazy imports for 4 workers in `packages/api/src/index.ts`
- All 6 workers now start: billing, crm, scrape, normalize, diff, alert
- Workers start inside try/catch — failure is non-blocking (matches existing billing/crm pattern)

**65ba064 — refactor(workers): shared IORedis cache client**
- Created `packages/api/src/db/redis.ts` — exports `redisCache` singleton
- `normalize.worker.ts` now imports `redisCache` instead of creating a second IORedis instance

### Startup Verification

```
[unstructured] Starting Container
[unstructured] CannaSpy scheduler started   ← confirmed in logs
[structured]   Server listening (hostname e7fd8e364694)
```
No startup errors. No worker failure messages. Deployment SUCCESS. ✅

### Next Scheduled Pipeline Run

- **Tracked competitors scrape:** Next even 4-hour mark after 02:51 UTC (`0 */4 * * *`)
- **Blocked competitors scrape:** Next midnight UTC (`0 0 * * *`)
- Scrape.worker will fall back to `dispensary_scraper.py` until `collector.py` is built

### Phase 2 (Next Sprint Chunk)

- Wire `alert.worker` to Resend (currently only logs)
- Build `collector.py` (primary pipeline — currently falls back to dispensary_scraper)
- Verify first scrape jobs complete (check `scrape_jobs` table after next 4-hour window)

---

## Sprint 0 Deploy — 2026-04-28

**Deploy SHA:** `f7cba36` (merge commit — `hotfix/sprint-0-cancel-and-crm` → `main`)
**Deploy Timestamp:** 2026-04-28T01:20:26Z (Fastify startup confirmed in logs)
**Deployment ID:** `213234d8-8b92-4242-ac2b-3888ad828b88`
**Status:** SHIPPED ✅ (webhook smoke test 5b–5d requires manual Stripe endpoint registration — see below)

### P0/P1 Fixes Shipped

**S0.1 — CRM alert now BullMQ (was fire-and-forget setImmediate)**
- `packages/api/src/workers/crm.worker.ts` — new worker: 3 attempts, exponential backoff 30s
- `packages/api/src/services/blocking.service.ts` — replaced `setImmediate + Resend` with `crmAlertQueue.add()`
- `packages/api/src/scheduler.ts` — added `crmAlertQueue` export
- `packages/api/src/routes/admin.ts` — new `GET /api/v1/admin/crm-failures` endpoint
- Failure path: sets `block_list.crm_notify_failed = TRUE`, captures to Sentry

**S0.2 — CancellationFlow wired to Stripe Customer Portal**
- `packages/web/src/pages/CancellationFlow.tsx` — cancel button POSTs to `/api/v1/billing/portal`, redirects to Stripe
- `packages/api/src/routes/billing.ts` — added `POST /portal` route

**S0.3 — Webhook idempotency + invoice.payment_succeeded handler**
- `packages/api/src/db/migrations/008_webhook_idempotency.sql` — `webhook_events` table (event_id PK)
- `packages/api/src/db/migrations/009_crm_notify_failed.sql` — `block_list.crm_notify_failed` column
- `packages/api/src/routes/billing.webhook.ts` — idempotency gate, payment_succeeded clears grace period + writes audit_log

**S0.4 — DUTCHIE label removed from S03 mockup**
- `CannaSpy_UI/cannaspy_bundle/cannaspy_s03_FINAL.html` — `platform:'DUTCHIE'` → `platform:'MENU PROVIDER'`

### Migrations Applied (Both Railway + Supabase Prod)
- `008_webhook_idempotency.sql` ✅
- `009_crm_notify_failed.sql` ✅

### Smoke Test Results
| Check | Status |
|---|---|
| 5a: Test org + grace period set | ✅ `f11954a5` in Railway Postgres |
| 5b: Webhook signature + delivery | ✅ Handler received event, signature verified |
| 5c: payment_succeeded clears grace | ✅ `grace_period_ends_at` NULL; audit_log row written |
| 5d: Idempotency (duplicate delivery) | ✅ `idempotent_skip` logged; audit_count stayed at 1 |
| 5e: Portal route returns 401 | ✅ `curl /api/v1/billing/portal` returns `401 Unauthorized` |

### Webhook Smoke Test — COMPLETE (2026-04-28)

**Endpoint:** `we_1TR0h30pX4bODNaVDcCX5uR7` (test mode)
**URL:** `https://cannaspy-production.up.railway.app/api/v1/billing/webhook`
**STRIPE_WEBHOOK_SECRET:** `whsec_s8ufawNDGmx8tnJ13IU4X619OTCjnZvd` (set in Railway)
**Redeploy SHA:** deployed at 2026-04-28T01:46:40Z (`listening on port 8080`)

Results:
- 5b ✅ Event delivered, signature verified, handler ran
- 5c ✅ `grace_period_ends_at` cleared to NULL; `audit_log` row `grace_period_cleared` written with `stripe_invoice_id` in metadata
- 5d ✅ Duplicate resend returned `idempotent_skip` in logs; `audit_log` count still 1
- 5e ✅ Portal route returns 401 without auth

**Test org used:** `f11954a5-7df4-42d2-b1d4-b4a6c50e4911` ("Sprint 0 Smoke Test")
- `stripe_id` set to `cus_UPqUuZfyJVeo9p` (test mode customer, no payment method)
- `grace_period_ends_at` is NULL (cleared by smoke test — working as intended)

**NOTE: Webhook endpoint is TEST MODE only.** Live-mode endpoint registration is a
launch-checklist item required before any real customer onboarding.

### Known Pre-Existing Issues (Not Sprint 0)
- `billing.worker.ts` logs DB connection timeout on startup — pre-existing, not regressed
- Test org `f11954a5` left in Railway Postgres (grace period set to 2026-05-01, no live Stripe customer)

---

## What Was Completed This Session (Session 3 Notes Below)

### Price Intelligence — Fully Wired to Real Data
- **`packages/api/src/routes/pricing.ts`** `/matrix` endpoint rewritten:
  - Was querying `price_observations` (empty — scraper never wrote there)
  - Now queries `menu_items` (6,002 real rows from collector.py)
  - Scopes to location via `tracked_competitors` subquery, no `active=TRUE` required (seeded competitors are inactive prospects)
  - Category filter uses exact match (`mi.category = $N`)
- **`packages/web/src/pages/PriceIntelligence.tsx`**:
  - Fixed unauthenticated `fetch()` → `authFetch()` for locations call
  - Updated `CATEGORIES` constant to match real DB values: `Concentrate`, `Indica`, `Hybrid`, `Edible`, `Preroll`, `Gear`, `Wax`, `Drink`, `Tincture`, `Topicals`
  - (was `flower`, `vape`, etc. — none of which exist in DB)

### Auth Fix — All Pages
Three pages were using bare `fetch()` with no Clerk Authorization header.
The production API returns 401 silently; pages showed as empty.

Fixed files (all now use `authFetch`):
- `packages/web/src/pages/CommandCenter.tsx` — locations count call
- `packages/web/src/pages/AlertFeed.tsx` — locations filter call
- `packages/web/src/pages/LocationDashboard.tsx` — location + competitors calls

### PriceCell Bug Fix (Was Crashing the Entire App)
- `packages/web/src/components/intelligence/PriceCell.tsx`
- Postgres `DECIMAL` columns serialize to JSON strings (`"20.00"` not `20.00`)
- `price.toFixed(2)` threw `TypeError: price.toFixed is not a function`
- React unmounted entire tree → black screen
- Fix: `parseFloat(String(price))` on both `price` and `previousPrice`

### Deployed to Railway Production
- Ran `railway up` twice this session — both builds completed
- Production URL: `https://cannaspy-production.up.railway.app`
- Commits `f075444` and `91e64cf` are live on production

### Diagnostic Tooling Added/Removed
- Added ErrorBoundary to `main.tsx` temporarily to surface the PriceCell crash
- Removed ErrorBoundary after root cause identified — `main.tsx` is clean

---

## What Is Working Right Now

- **Price Intelligence** (`/prices`) — renders real competitor menu data, 6,002 items across 4 competitors, filterable by category
- **Command Center** (`/command-center`) — renders, loads location count
- **Alert Feed** (`/alerts`) — renders, loads location filter options
- **Location Dashboard** (`/locations/:id`) — renders, loads location + competitors
- **Location creation** (`/setup/locations`) — works, navigates to competitor discovery
- **Auth flow** — all pages authenticated via Clerk token correctly

---

## What Is NOT Done (Next Priorities)

### Phase 3 — Remaining Frontend Wiring
1. **Command Center** — shows empty alert feed (no alerts generated yet, diff_engine not run)
2. **Block Management** (`/blocks`) — not verified wired to real data
3. **Location Dashboard** — loads but competitor cards use `CompetitorRow` component — verify it renders correctly
4. **Promotions** — scaffold only, not wired

### Phase 1 Remaining
- `diff_engine.py` — not tested, required to generate `alerts` and `change_events`
- `scheduler.py` — not wired, daily 2-5am scrape not running automatically
- `IP_POOL` — still single local IP in dev, no proxies configured

### Known Issues
- `useEffect` dep arrays in pages use `[]` (empty) to avoid authFetch instability — meaning locations fetch on CommandCenter/AlertFeed won't re-run if auth changes mid-session. Acceptable for MVP.
- `LocationDashboard` `useEffect` has no `.catch()` — if both API calls fail, `loading` stays `true` forever (stuck on "Loading location data...")

---

## Key Lessons / Watch Out For

1. **Postgres DECIMAL → JSON string**: Any component that does `.toFixed()` or arithmetic on a price from the DB must use `parseFloat()` first. Check `PriceIntelligence.tsx` `productMap` too — it stores `row.price` which is also a string.
2. **`authFetch` in useEffect deps = infinite loop**: Clerk's `getToken` reference changes during auth load. Never put `authFetch` in a `useEffect` dependency array. Use `[]` and rely on mount-only behavior.
3. **Railway deploy**: `railway up` uploads working directory (including uncommitted files). CLI often shows "Uploading..." then disconnects — the build continues on Railway's side. Wait 3-5 min then check the production URL.

---

## Uncommitted Changes (Present in Working Directory, Not in Git)

- `packages/api/src/services/blocking.service.ts` — sender email changed from `alerts@cannaspy.com` to `onboarding@resend.dev` (Resend requires verified domain; `onboarding@resend.dev` is Resend's sandbox sender). Should be committed.
- `packages/web/src/pages/CompetitorDiscovery.tsx` — `scanned` state already committed in `6642218`, but git shows it as modified. Check before next deploy.

---

## Key Credentials (Same as Session 2)

```
Railway Postgres Public:   postgresql://postgres:obUqriCmHTpqQIubafxYBLXYZugPivKE@metro.proxy.rlwy.net:36204/railway
Railway Postgres Internal: postgresql://postgres:obUqriCmHTpqQIubafxYBLXYZugPivKE@postgres.railway.internal:5432/railway
Production API:            https://cannaspy-production.up.railway.app
Frontend local:            http://localhost:3000
Location ID (Corona):      ffdefc3f-8d55-4701-b7ea-6b9d4195b16f
```

Competitors with real menu data:
- `d6e3dfd4` — Off The Charts
- `5e631bd1` — Catalyst Cannabis Co.
- `25a69f7c` — Zen Dispensary
- `3ba421fb` — Caliva

---

## Session 4 Starting Point

Start here: **verify Price Intelligence renders data in the browser**, then wire Block Management to real data, then run diff_engine to generate the first alerts so Command Center shows something real.

```bash
git status   # check for uncommitted blocking.service.ts + CompetitorDiscovery.tsx
git log --oneline -5
```

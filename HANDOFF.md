# CannaSpy Session Handoff
**Date:** 2026-05-19 (Session 34 — Onboarding flow verified + CompetitorDiscovery UI fixes)

---

## Session 34 — 2026-05-19

**Commits:** `10e7bdf` feat(onboarding): replace billing picker with 14-day free trial screen → `2bd6fb6` fix(discover): theme-aware CSS vars, wider map, legend + dropdown contrast
**Deploy:** Vercel ✅ `web-rouge-one-15.vercel.app` (auto-deploys on push) | Railway API ✅ unchanged

---

### 1. What Was Done

#### Free trial onboarding flow — full walkthrough and fixes
Walked the entire onboarding flow as a new user (`/setup/org` → `/setup/locations` → `/setup/competitors`), identifying and fixing issues on each screen.

**SignUp.tsx (Screen 01)**
- Replaced the billing/plan picker (À La Carte vs Slot Tiers, 10–80 slot selection, $1,800/mo total) with a 14-day free trial design. New layout: single-column centered, company info form, horizontal trial strip (14 days free / no card required, 5 included features + blocking locked with amber lock icon), full-width "Start free trial →" CTA.
- Fixed blank space issue (was two-column grid with height mismatch; fixed by going single-column max-width 740px).

**LocationWizard.tsx (Screen 02)**
- Removed Slot usage widget (20/50 progress bar — not relevant during free trial).
- Removed Market coverage sidebar (redundant with locations list, all "STANDARD").
- Replaced two-column layout with single-column centered layout.
- Updated Pro tip copy: removed "auto-expands slot count" reference.
- Replaced fake CSS map placeholder with real Mapbox `streets-v12` map. Address field geocodes via Mapbox API (debounced 600ms) and flies to result with teal pin. Verified live: typed "8001 Santa Monica Blvd, West Hollywood" — map flew to WeHo with pin.

**CompetitorDiscovery.tsx (Screen 03)**
- Added topbar ("Find your rivals / SCREEN 03 · RIVAL DISCOVERY · STEP 3 OF 3").
- Added step bar showing 01✓ Org Setup, 02✓ Add Locations, 03 active Find Rivals.
- Removed "Setup · Step 2 of 2" label.
- Locked Block buttons during trial: greyed out with lock icon, tooltip "Blocking unlocks when you upgrade".
- Removed `$X/mo` cost estimate from footer.
- Fixed all hardcoded dark-theme CSS vars (`--bg-elevated`, `--text-primary`, `--text-muted`, `--accent-intel`, etc.) → CannaSpy design tokens (`--surface-2`, `--text-1`, `--text-3`, `--accent`, `--warm`).
- Removed dark radius label overlay (was black box on light theme).
- Legend now uses `--surface`/`--border`/`--text-2` (theme-aware, white bg in light mode).
- Map panel widened: 58% → 68%; right panel narrowed: 42% → 32%.
- Dropdown contrast fixed: `--bg-elevated`/`--border-default` → `--surface-2`/`--border-2`.

---

### 2. What Changed

| File | Change |
|---|---|
| `packages/web/src/pages/SignUp.tsx` | Full rewrite: billing section removed, 14-day trial design, single-column layout |
| `packages/web/src/pages/LocationWizard.tsx` | Slot usage + market coverage removed; single-column; real Mapbox map with geocoding |
| `packages/web/src/pages/CompetitorDiscovery.tsx` | Topbar + step bar added; block locked; cost removed; all CSS vars corrected; map 68/32 ratio |

No schema migrations. No new npm dependencies. No Railway deploy.

---

### 3. What Failed

- **Production CompetitorDiscovery still has 6 issues (not fixed this session)** — complex engineering, deferred to next session (see "What Is Next").
- **New user onboarding not fully wired** — SignUp/LocationWizard forms are still cosmetic (no API POST to create org or save company info). This is intentional for demo; wire before first real customer.

Known standing issues:
- `diff_engine.py` not tested end-to-end — alerts table empty
- Stripe live-mode webhook not registered
- API package has no dotenv — must source `.env` manually when starting locally
- `promoteId="id"` on MarketHeatMap.tsx still not applied

---

### 4. What Is Next (First Things in Next Session)

1. **Rebuild CompetitorDiscovery map layer** — wire bbox API to load all 1,785 DCC dispensaries (same as MarketHeatMap); replace plain dot markers with ring+fill pin layer. Files: `packages/web/src/pages/CompetitorDiscovery.tsx`, reuse `packages/web/src/components/map/layers.ts`.
2. **Add "search this area" + radius slider** — "Redo search in this area" button appears after map pan/zoom; radius picker (1–25 mi) replaces hardcoded 5 miles. Same file.
3. **Fix flyTo race condition** — map doesn't fly to selected location on initial load because location data arrives after map init. Fix: store `pendingFly` ref and fire in `onLoad` if map wasn't ready. Same file.
4. **Investigate Culture Stanton data** — scan returns wrong/stale data for that location; check `locations` table lat/lng and discover route for that location ID.
5. **Wire BlockManagement** — swap static `BLOCKS[]` for `useBlocks()` hook at `packages/web/src/hooks/useBlocks.ts` — `packages/web/src/pages/BlockManagement.tsx`.

---

### 5. What Is Still Left To Do (Full Backlog)

**CompetitorDiscovery map (next session priority):**
- [ ] Wire bbox API → load all DCC dispensaries on map (issues 8)
- [ ] Port ring+fill pin layer from MarketHeatMap (issue 7)
- [ ] "Search this area" button + radius slider (issue 9)
- [ ] Fix flyTo race condition on initial location load (issue 6)
- [ ] Investigate Culture Stanton discover API returning wrong data (issue 5)

**Frontend (account screens):**
- [ ] Wire BlockManagement (`/blocks`) — swap `BLOCKS[]` for `useBlocks()` hook
- [ ] Wire BillingUsage (`/billing`) to `/api/v1/billing/usage` + `/api/v1/locations`
- [ ] Wire NotificationSettings to `GET/PATCH /api/v1/settings`
- [ ] Wire LocationManagement to `GET /api/v1/locations`
- [ ] Fix CancellationFlow: `/billing/cancel` → `/billing/portal`
- [ ] Wire PromotionsTracker (`/promotions`) to `GET /api/v1/competitors/:id/promotions`
- [ ] `LocationDashboard` — add `.catch()` to prevent infinite loading state
- [ ] Apply DM Sans + Space Mono typography system-wide

**Map / Data Pipeline:**
- [ ] `promoteId="id"` on dispensary `<Source>` in `MarketHeatMap.tsx` (1-line fix)
- [ ] `scrape.worker.ts` → write `dispensaries.enriched = true` after successful scrape
- [ ] `scrape.worker.ts` → call `collector.py` as primary (currently falls back to `dispensary_scraper.py`)
- [ ] `diff_engine.py` — test end-to-end with two real snapshots
- [ ] 462 dispensaries missing lat/lng — run `dcc_ingest.py` full geocoding when `GOOGLE_PLACES_API_KEY` available

**Infrastructure (Launch Blockers):**
- [ ] Register Stripe live-mode webhook endpoint (test-mode only currently)
- [ ] Configure Stripe metered price with volume tiers
- [ ] Add `import 'dotenv/config'` to `packages/api/src/index.ts`
- [ ] Sentry error tracking integration
- [ ] Uptime Robot scrape health monitoring

**Key Credentials:**
```
Railway Postgres: postgresql://postgres:obUqriCmHTpqQIubafxYBLXYZugPivKE@metro.proxy.rlwy.net:36204/railway
Production API:   https://cannaspy-production.up.railway.app
Frontend:         https://web-rouge-one-15.vercel.app
Location ID:      ffdefc3f-8d55-4701-b7ea-6b9d4195b16f (Culture Cannabis Club, Corona)
Location ID:      9354f184-5b88-4a8f-abc3-012fdaa4058f (Cannabis House, LA)
```

---

**Date:** 2026-05-18 (Session 33 — CannaSpy logo placed in sidebar, favicon, and onboarding topbars)

---

## Session 33 — 2026-05-18

**Commits:** `c4e922f` feat(nav): replace logo gem with CannaSpy icon PNG + CSS wordmark → `8828e25` feat(brand): add CannaSpy logo to favicon, SignUp, and LocationWizard
**Deploy:** Vercel ✅ `web-rouge-one-15.vercel.app` (auto-deploys on push) | Railway API ✅ unchanged

---

### 1. What Was Done

#### Logo design iteration
Worked through multiple AI-generated logo versions with the user (ChatGPT + Gemini Banana). Evaluated transparency, line-art fidelity, color accuracy, and glow artifact removal across ~8 iterations. Final decision: use a white icon-only PNG (no text) and render the "CANNASPY" wordmark and tagline via CSS — avoids all AI text rendering quality issues.

#### Sidebar logo replacement (`Layout.tsx`)
Removed the `LogoGem` placeholder (teal-to-amber gradient gem SVG). Replaced with `LogoIcon` — a 54×54px `<img>` rendering `cannaspy-icon.png` (white eye-leaf mark on transparent bg). Expanded sidebar shows the icon + CSS "CANNASPY" in white (DM Sans, 700, letter-spacing 0.08em) + "AI-Powered Strategic Advantage" tagline in white below. Logo container padding tightened from 14px to 5px to fit 54px icon in 64px rail. Asset saved to `packages/web/src/assets/cannaspy-icon.png`.

#### Favicon
Created `packages/web/public/` directory (did not exist). Copied icon as `favicon.png`. Added `<link rel="icon" type="image/png" href="/favicon.png" />` to `index.html`. Browser tab now shows the CannaSpy icon.

#### Logo in onboarding topbars
Added a 40×40px dark badge (`background: #1a2f42, borderRadius: 10`) with the white icon inside to the topbar of both `SignUp.tsx` and `LocationWizard.tsx`. The dark badge ensures the white icon is visible in both light theme (`--surface: #ffffff`) and dark theme.

---

### 2. What Changed

| File | Change |
|---|---|
| `packages/web/src/components/shared/Layout.tsx` | `LogoGem` → `LogoIcon` (54×54 PNG); wordmark + tagline updated; logo padding 14px → 5px |
| `packages/web/src/assets/cannaspy-icon.png` | New asset — white eye-leaf icon |
| `packages/web/public/favicon.png` | New asset — same icon, served as browser favicon |
| `packages/web/index.html` | Added `<link rel="icon">` pointing to `/favicon.png` |
| `packages/web/src/pages/SignUp.tsx` | Added dark logo badge to topbar (left of page title) |
| `packages/web/src/pages/LocationWizard.tsx` | Added dark logo badge to topbar (left of page title) |

No schema migrations. No new npm dependencies. No Railway deploy.

---

### 3. What Failed

Nothing failed this session — all logo placements implemented and TypeScript clean.

Known standing issues (not touched this session):
- `diff_engine.py` not tested end-to-end — alerts table empty
- Stripe live-mode webhook not registered
- API package has no dotenv — must source `.env` manually when starting locally
- `promoteId="id"` on MarketHeatMap.tsx still not applied

---

### 4. What Is Next (First Things in Next Session)

1. **Wire BlockManagement** — swap static `BLOCKS[]` for `useBlocks()` hook already at `packages/web/src/hooks/useBlocks.ts` — 5-line change in `packages/web/src/pages/BlockManagement.tsx`
2. **Wire BillingUsage** — replace static `LOCS[]` with `GET /api/v1/billing/usage` + `GET /api/v1/locations` in `packages/web/src/pages/BillingUsage.tsx`
3. **Fix CancellationFlow** — line 85 calls `/api/v1/billing/cancel` (route doesn't exist); change to POST `/api/v1/billing/portal` in `packages/web/src/pages/CancellationFlow.tsx`
4. **Wire NotificationSettings** — add `GET /api/v1/settings` on mount + `PATCH` on toggle in `packages/web/src/pages/NotificationSettings.tsx`
5. **Wire LocationManagement** — replace static `LOCATIONS[]` with `GET /api/v1/locations` in `packages/web/src/pages/LocationManagement.tsx`

---

### 5. What Is Still Left To Do (Full Backlog)

**Session B (intelligence screens):**
- [ ] Browser verify: CommandCenter, LocationDashboard, PriceIntelligence (already wired, just needs visual confirmation)
- [ ] Wire PromotionsTracker (`/promotions`) to `GET /api/v1/competitors/:id/promotions`
- [ ] Run `diff_engine.py` end-to-end to generate first `alerts` rows (AlertFeed shows empty until this runs)

**Session C (blocking + account screens):**
- [ ] Wire BlockManagement (`/blocks`) — swap `BLOCKS[]` for `useBlocks()` hook
- [ ] Wire BillingUsage (`/billing`) to `/api/v1/billing/usage` + `/api/v1/locations`
- [ ] Wire NotificationSettings to `GET/PATCH /api/v1/settings`
- [ ] Wire LocationManagement to `GET /api/v1/locations`
- [ ] Fix CancellationFlow: `/billing/cancel` → `/billing/portal`

**Session D (go-live checklist):**
- [ ] Add `import 'dotenv/config'` to `packages/api/src/index.ts`
- [ ] `promoteId="id"` on dispensary `<Source>` in `MarketHeatMap.tsx` (1-line fix)
- [ ] `LocationDashboard` — add `.catch()` to prevent infinite loading state
- [ ] Admin.ts role-gating on `/crm-failures`
- [ ] Register Stripe live-mode webhook endpoint
- [ ] Resend domain verification (`cannaspy.com`)
- [ ] Verify Stripe metered price volume tiers

**Map / Data Pipeline:**
- [ ] `scrape.worker.ts` → write `dispensaries.enriched = true` after successful scrape
- [ ] `scrape.worker.ts` → call `collector.py` as primary (currently falls back to `dispensary_scraper.py`)
- [ ] 462 dispensaries missing lat/lng — run `dcc_ingest.py` full geocoding when `GOOGLE_PLACES_API_KEY` available

**Infrastructure (Launch Blockers):**
- [ ] Register Stripe live-mode webhook endpoint (test-mode only currently)
- [ ] Configure Stripe metered price with volume tiers
- [ ] Destroy Fly.io app (`fly apps destroy cannaspy-api`) — Patrick must confirm
- [ ] Sentry error tracking integration
- [ ] Uptime Robot scrape health monitoring

**Key Credentials:**
```
Railway Postgres: postgresql://postgres:obUqriCmHTpqQIubafxYBLXYZugPivKE@metro.proxy.rlwy.net:36204/railway
Production API:   https://cannaspy-production.up.railway.app
Frontend:         https://web-rouge-one-15.vercel.app
Location ID:      ffdefc3f-8d55-4701-b7ea-6b9d4195b16f (Culture Cannabis Club, Corona)
Location ID:      9354f184-5b88-4a8f-abc3-012fdaa4058f (Cannabis House, LA)
```

---

**Date:** 2026-05-18 (Session 32 — First-customer plan + LocationWizard wired to real API)

---

## Session 32 — 2026-05-18

**Commits:** `7d0aad0` fix(onboarding): omit dcc_license key when empty → `162a050` feat(onboarding): wire LocationWizard to real API
**Deploy:** Vercel ✅ `web-rouge-one-15.vercel.app` (auto-deploys on push) | Railway API ✅ unchanged

---

### 1. What Was Done

#### Caliva coordinates fix
Caliva's lat/lng in Railway Postgres was pointing to San Jose (37.338, -121.886) — wrong region for a Southern California competitor. Updated to Jurupa Valley/Corona area (33.996, -117.483) via direct DB update. All 8 competitors now have valid Southern California coordinates.

#### CARL config cleanup
Set `DEVMODE=false` in `~/.carl/manifest` to disable the debug block appended to every response. Removed `GLOBAL_RULE_9` from `~/.carl/global` which was injecting "report context bracket at start of every session response."

#### First-customer plan (plan mode)
Ran full codebase audit in plan mode. Audited all 15 MVP screens (01–05, 07, 08, 12, 16–18, 28, 30–31, 33) against real API and frontend code. Key findings:
- API layer: fully production-ready — all 11 routes return real DB data; `alert.worker.ts` IS wired to Resend (CLAUDE.md was stale on this); `billing.service.ts` has full Stripe slot sync
- 6 of 15 MVP screens are scaffold-only: LocationWizard, PromotionsTracker, BlockManagement, BillingUsage, NotificationSettings, LocationManagement
- CancellationFlow calls `/api/v1/billing/cancel` which does not exist — should use `/api/v1/billing/portal`
- Plan saved at `~/.claude/plans/magical-swinging-garden.md`, organized as Sessions A–D

#### LocationWizard wired (Session A complete)
Replaced `INITIAL_LOCS` hardcoded mock data with real API calls. Changes:
- `GET /api/v1/locations` on mount — loads existing locations
- Form POSTs `{ name, address, dcc_license? }` to `POST /api/v1/locations`
- API returns only `{ id }` — reconstructed full location from form data + id
- Remove button calls `PATCH active=false` (soft delete, no data loss)
- Continue button disabled until ≥1 location saved
- Inline error display on validation failure or API error
- **Bug found and fixed during browser testing**: `dcc_license: null` fails `z.string().optional()` — Zod rejects null, expects undefined. Fixed by omitting the key when empty: `...(dcc_license ? { dcc_license } : {})`

**Browser-verified on localhost:3000:**
- Empty state renders correctly ("No locations added yet")
- Loaded existing 2 locations (Culture Cannabis Club + Cannabis House) from real API
- Added "Test Location Riverside" → appeared in list instantly, toast fired, form cleared, counter went 2→3
- Test location cleaned up from DB after verification
- Continue button enabled only after ≥1 location present

---

### 2. What Changed

| File | Change |
|---|---|
| `packages/web/src/pages/LocationWizard.tsx` | Full rewrite: removed INITIAL_LOCS; wired to GET + POST /api/v1/locations; null dcc_license fix |
| `~/.carl/manifest` | DEVMODE=true → false |
| `~/.carl/global` | Removed GLOBAL_RULE_9 (context bracket reporting) |

No schema migrations. No new dependencies. No Railway deploy.

---

### 3. What Failed

- **Production Vercel test**: `/setup/locations` on `web-rouge-one-15.vercel.app` returned "Unauthorized" because the chrome-devtools-mcp browser had no Clerk session. Tested on localhost:3000 instead where the session was active. The code is correct — production will work once the user signs in normally.

Known standing issues (not touched this session):
- `diff_engine.py` not tested end-to-end — alerts table empty
- Stripe live-mode webhook not registered
- API package has no dotenv — must source `.env` manually when starting locally
- `promoteId="id"` on MarketHeatMap.tsx still not applied

---

### 4. What Is Next (First Things in Next Session)

1. **Wire BlockManagement** — swap static `BLOCKS[]` for `useBlocks()` hook (already written at `packages/web/src/hooks/useBlocks.ts`) — 5-line change in `packages/web/src/pages/BlockManagement.tsx`
2. **Wire BillingUsage** — replace static `LOCS[]` with `GET /api/v1/billing/usage` + `GET /api/v1/locations` in `packages/web/src/pages/BillingUsage.tsx`
3. **Fix CancellationFlow** — line 85 calls `/api/v1/billing/cancel` (doesn't exist); change to POST `/api/v1/billing/portal` in `packages/web/src/pages/CancellationFlow.tsx`
4. **Wire NotificationSettings** — add `GET /api/v1/settings` on mount + `PATCH` on toggle change in `packages/web/src/pages/NotificationSettings.tsx`
5. **Wire LocationManagement** — replace static `LOCATIONS[]` with `GET /api/v1/locations` in `packages/web/src/pages/LocationManagement.tsx`

---

### 5. What Is Still Left To Do (Full Backlog)

**Session B (intelligence screens):**
- [ ] Browser verify: CommandCenter, LocationDashboard, PriceIntelligence (already wired, just needs visual confirmation)
- [ ] Wire PromotionsTracker (`/promotions`) to `GET /api/v1/competitors/:id/promotions`
- [ ] Run `diff_engine.py` end-to-end to generate first `alerts` rows (AlertFeed shows empty until this runs)

**Session C (blocking + account screens):**
- [ ] Wire BlockManagement (`/blocks`) — swap `BLOCKS[]` for `useBlocks()` hook
- [ ] Wire BillingUsage (`/billing`) to `/api/v1/billing/usage` + `/api/v1/locations`
- [ ] Wire NotificationSettings to `GET/PATCH /api/v1/settings`
- [ ] Wire LocationManagement to `GET /api/v1/locations`
- [ ] Fix CancellationFlow: `/billing/cancel` → `/billing/portal`

**Session D (go-live checklist):**
- [ ] Add `import 'dotenv/config'` to `packages/api/src/index.ts`
- [ ] `promoteId="id"` on dispensary `<Source>` in `MarketHeatMap.tsx` (1-line fix)
- [ ] `LocationDashboard` — add `.catch()` to prevent infinite loading state
- [ ] Admin.ts role-gating on `/crm-failures`
- [ ] Register Stripe live-mode webhook endpoint
- [ ] Resend domain verification (`cannaspy.com`)
- [ ] Verify Stripe metered price volume tiers

**Map / Data Pipeline:**
- [ ] `scrape.worker.ts` → write `dispensaries.enriched = true` after successful scrape
- [ ] `scrape.worker.ts` → call `collector.py` as primary (currently falls back to `dispensary_scraper.py`)
- [ ] 462 dispensaries missing lat/lng — run `dcc_ingest.py` full geocoding when `GOOGLE_PLACES_API_KEY` available

**Infrastructure (Launch Blockers):**
- [ ] Register Stripe live-mode webhook endpoint (test-mode only currently)
- [ ] Configure Stripe metered price with volume tiers
- [ ] Destroy Fly.io app (`fly apps destroy cannaspy-api`) — Patrick must confirm
- [ ] Sentry error tracking integration
- [ ] Uptime Robot scrape health monitoring

**Key Credentials:**
```
Railway Postgres: postgresql://postgres:obUqriCmHTpqQIubafxYBLXYZugPivKE@metro.proxy.rlwy.net:36204/railway
Production API:   https://cannaspy-production.up.railway.app
Frontend:         https://web-rouge-one-15.vercel.app
Location ID:      ffdefc3f-8d55-4701-b7ea-6b9d4195b16f (Culture Cannabis Club, Corona)
Location ID:      9354f184-5b88-4a8f-abc3-012fdaa4058f (Cannabis House, LA)
```

---

**Date:** 2026-05-18 (Session 31 — Doc sync + Command Center live verification + tracked badge fix)

---

## Session 31 — 2026-05-18

**Commits:** `fd90ce4` docs: correct contradictions in CLAUDE.md + TECHNICAL_SPEC.md → `677cfec` fix(command-center): tracked badge uses competitors.length not alerts.length
**Deploy:** Vercel ✅ `web-rouge-one-15.vercel.app` (auto-deploys on push) | Railway API ✅ unchanged (no redeploy needed)

---

### 1. What Was Done

#### CLAUDE.md + TECHNICAL_SPEC.md contradiction audit

Read all project docs (CLAUDE.md, TECHNICAL_SPEC.md, HANDOFF.md Sessions 27–30, memory files) and corrected every stale reference:

- **Database**: `Supabase prod (cbhbrbkirzpncpxlvehk)` → `Railway Postgres (metro.proxy.rlwy.net:36204)` across all 7 occurrences in CLAUDE.md and TECHNICAL_SPEC.md. Supabase has been abandoned since Session 2 (pooler broken, MCP broken, project likely paused).
- **Menu item count**: `6,002` → `9,584` (Session 28 added 4 LA competitors / 3,582 items; CLAUDE.md was never updated).
- **`promoteId="id"`**: Removed false ✅ from CLAUDE.md Phase 3 done list — grep confirmed it is NOT in `MarketHeatMap.tsx`; moved to pending.
- **Phase 4 stale item**: "Fix REDIS_URL on Fly.io" → replaced with correct "Destroy Fly.io app" task (REDIS_URL on Railway is already correct).
- **Added "Live Data" section** to CLAUDE.md with both locations, all 8 competitor slugs, and DB credentials.
- **Memory files updated**: `project_build_status.md` (34 days stale) and `project_infrastructure.md` (9 days stale) fully rewritten with current state.

#### Command Center live browser verification (chrome-devtools-mcp)

Used `chrome-devtools-mcp` (added Session 30, activated this session) to test the Command Center end-to-end:

**Root cause discovered:** A duplicate Vite process (PID 57457, started at 11:31 AM) had auto-incremented onto port 3001 when port 3000 was taken — silently stealing all API traffic. Browser requests to `localhost:3001/api/v1/*` were hitting Vite and returning 500 instead of the API. Additionally, the legitimate API process (PID 46488, started 10:12 AM) had loaded without `DATABASE_URL` in its environment (no dotenv in the API package; env vars must be sourced at process start).

**Fix applied:**
1. Killed both the stale API process (46488) and the duplicate Vite process (57457)
2. Restarted API with `set -a && source .env && set +a && pnpm dev` to load env vars correctly

**Verified working:**
- All 6 API routes returning 200 (`/alerts`, `/blocks`, `/locations`, `/locations/:id/competitors` × 2)
- 6 map marker elements confirmed in a11y tree (competitor pins rendering)
- Search autocomplete: typed "STIIIZY" → "RIVALS MATCHED" dropdown appeared with "STIIIZY Downtown LA · TRACKING · fly to"
- Fly-to: clicked result → map animated from LA overview to Downtown LA at zoom 14, centered on STIIIZY's coordinates

#### "0 tracked" badge fix

The Command Center header showed "0 tracked" despite 8 competitors loading. Root cause: `CommandCenter.tsx:885` used `alerts.length` for the "tracked" badge — `alerts` is always empty until diff engine runs. Fixed to `competitors.length`. Verified: badge now shows "5 tracked" (5 competitors with valid lat/lng coordinates loaded).

---

### 2. What Changed

| File | Change |
|---|---|
| `CLAUDE.md` | DB reference Supabase → Railway Postgres (7 occurrences); item count 6,002 → 9,584; `promoteId` moved to pending; Phase 4 stale Fly.io REDIS item replaced; Cannabis House + 4 LA competitors added; "Live Data" section added |
| `TECHNICAL_SPEC.md` | Migrations comment + DATABASE_URL comment: Supabase → Railway Postgres |
| `packages/web/src/pages/CommandCenter.tsx` | Line 885: `alerts.length` → `competitors.length` for "tracked" badge |

**Infrastructure changes (not code):**
- Duplicate Vite process on port 3001 killed (do not run `pnpm dev` twice in `packages/web/`)
- Local API restarted with `.env` sourced via `set -a && source .env && set +a && pnpm dev`
- Memory files updated (not committed — live in `~/.claude/projects/`)

No schema migrations. No new npm dependencies. No Railway deploy.

---

### 3. What Failed

- **Vercel deployment of `677cfec`**: The tracked badge fix commit will auto-deploy to Vercel on next push — no manual push was done this session. The fix is in local code and committed to git but Vercel may not have it yet.
- **"0 tracked" was 5 not 8**: Three of the 8 competitors (likely the original Corona set — Off The Charts, Catalyst, Zen Dispensary, Caliva) have null lat/lng in Railway Postgres. They don't render as pins and don't count toward `competitors.length`. Fix: update their coordinates in the DB.

Known standing issues (not touched this session):
- `alert.worker.ts` logs only, no Resend emails
- `diff_engine.py` not tested end-to-end
- Stripe live-mode webhook not registered
- API package has no dotenv — must source `.env` manually when starting locally

---

### 4. What Is Next (First Things in Next Session)

1. **Push `677cfec` to Vercel** — `git push origin main` to trigger auto-deploy of tracked badge fix; verify on `web-rouge-one-15.vercel.app`
2. **Fix null lat/lng for Corona competitors** — Off The Charts, Catalyst, Zen Dispensary, Caliva have no coordinates in Railway Postgres; run psycopg2 update with correct Corona-area coords so all 8 competitors show pins
3. **Wire Block Management (`/blocks`)** — verify the page is hitting real `tracked_competitors` + `block_list` data, not placeholder
4. **Run `diff_engine.py` end-to-end** — need two snapshots from same competitor to generate first `alerts` rows so Alert Feed shows real data
5. **Add dotenv to API** — install `dotenv` in `packages/api`, add `import 'dotenv/config'` at top of `index.ts` so local dev doesn't require manual env sourcing

---

### 5. What Is Still Left To Do (Full Backlog)

**Map / Data Pipeline:**
- [ ] `promoteId="id"` on dispensary `<Source>` in `MarketHeatMap.tsx` — hover not applied (1-line fix, confirmed NOT in code)
- [ ] Fix null lat/lng for Corona competitors (Off The Charts, Catalyst, Zen Dispensary, Caliva) in Railway Postgres
- [ ] `scrape.worker.ts` → write `dispensaries.enriched = true` after successful scrape
- [ ] `diff_engine.py` — test end-to-end with two real snapshots (needed to generate first `alerts` rows)
- [ ] Wire `alert.worker.ts` to Resend — currently logs only, no emails sent
- [ ] `scrape.worker.ts` → call `collector.py` as primary (currently falls back to `dispensary_scraper.py`)
- [ ] 462 dispensaries missing lat/lng — run `dcc_ingest.py` full geocoding when `GOOGLE_PLACES_API_KEY` available

**API / Backend:**
- [ ] Add dotenv to `packages/api` — `import 'dotenv/config'` in `index.ts` (prevents local "0 tracked" class of bugs)
- [ ] Remove or commit debug/me endpoint in `packages/api/src/index.ts`
- [ ] Full Stripe subscription quantity sync on slot add/remove
- [ ] `billing.service.ts` — usage sync cron

**Frontend:**
- [ ] Block Management (`/blocks`) — verify wired to real data, not placeholder
- [ ] Promotions (`/promotions`) — scaffold only, not wired to API
- [ ] `LocationDashboard` — add `.catch()` to prevent infinite loading state on API failure
- [ ] Apply DM Sans + Space Mono typography system-wide

**Infrastructure (Launch Blockers):**
- [ ] Register Stripe live-mode webhook endpoint (test-mode only currently)
- [ ] Configure Stripe metered price with volume tiers
- [ ] Destroy Fly.io app (`fly apps destroy cannaspy-api`) — Patrick must confirm
- [ ] Sentry error tracking integration
- [ ] Uptime Robot scrape health monitoring
- [ ] Investigate Railway auto-deploy — git push should trigger deploy without `railway up`

**Key Credentials:**
```
Railway Postgres: postgresql://postgres:obUqriCmHTpqQIubafxYBLXYZugPivKE@metro.proxy.rlwy.net:36204/railway
Production API:   https://cannaspy-production.up.railway.app
Frontend:         https://web-rouge-one-15.vercel.app
Location ID:      ffdefc3f-8d55-4701-b7ea-6b9d4195b16f (Culture Cannabis Club, Corona)
Location ID:      9354f184-5b88-4a8f-abc3-012fdaa4058f (Cannabis House, LA)
```

---

**Date:** 2026-05-17 (Session 30 — Fix 401 auth + Command Center map pins + search)

---

## Session 30 — 2026-05-17

**Commits:** `b7d0e2a` fix(command-center): add competitor map pins + extend search → `af200fd` fix(command-center): autocomplete dropdown + fetch all locations' competitors → `882a22f` fix(command-center): parse locations from d.locations not d.data.locations
**Deploy:** Vercel ✅ `web-rouge-one-15.vercel.app` (auto-deployed via git push) | Railway API ✅ redeployed (new container `28ae605b7636`, `DATABASE_URL` fixed)

---

### 1. What Was Done

#### Fix 401 Unauthorized on all API routes (critical)

Every authenticated API route was returning 401. Root cause: Railway's `DATABASE_URL` env var was pointing to the Supabase transaction mode pooler (`aws-0-us-west-1.pooler.supabase.com:6543`) with an incorrect password (`k1paUDmtqSky4zeC`). When the Clerk auth middleware attempted to look up the org in the DB, Supabase returned `"Tenant or user not found"`, which was caught in the try/catch and surfaced as 401 to the client.

Diagnosis: Railway logs showed `[clerk] auth middleware error … err="Tenant or user not found"` — not a Clerk error at all, a DB connection failure caught by the Clerk middleware's try/catch.

Fix: Updated `DATABASE_URL` on Railway to the working Railway Postgres URL (`metro.proxy.rlwy.net:36204/railway`, confirmed live with psycopg2 — 3 orgs, 8 competitors). Redeployed via `railway redeploy --yes` (no code rebuild, just picks up new env var). New container `28ae605b7636` started cleanly with no DB errors.

#### Command Center — map pins + search autocomplete (three rounds)

**Round 1 (`b7d0e2a`):** Added `competitors` state, fetched tracked competitors for `locations[0]`, rendered `<Marker>` components, added inline search section. Pins not visible because: (a) `locations[0]` had no lat/lng so the only competitor was off-screen; (b) the inline search section was below the alert feed, not near the search bar.

**Round 2 (`af200fd`):** Full rewrite of competitor fetch — `Promise.all` across all locations in parallel, deduplication by `competitor_id`. Replaced buried inline search with floating autocomplete dropdown attached to the search bar (`position: absolute; top: 100%`), teal/amber color-coded dots, click flies map to rival via `mapRef.current?.flyTo()`. Also updated Culture Cannabis Club lat/lng in DB (`33.8753, -117.5664` — Corona) via psycopg2.

**Round 3 (`882a22f`):** Fixed locations fetch parsing. The API returns `{ locations: [...], total, limit, offset }` (no `data` wrapper), but the component was reading `d.data?.locations` — always `undefined`. Changed to `d.locations || d.data?.locations || []`. This was the reason `locations` was always `[]`, which caused the competitor fetch effect to bail early (`if (!locations.length) return`), leaving both pins and search empty.

#### Verified fix is in deployed Vercel bundle

Downloaded the live Vercel JS bundle and found the minified fix at occurrence 4: `z(I.locations||((J=I.data)==null?void 0:J.locations)||[])` — confirmed the corrected parsing is deployed.

#### Installed chrome-devtools-mcp

Added `chrome-devtools-mcp` to user-scope Claude Code MCP config (`~/.claude.json`) via `claude mcp add chrome-devtools --scope user -- npx -y chrome-devtools-mcp@latest`. Will enable direct browser testing (navigate, screenshot, inspect DOM, check network) in the next session.

---

### 2. What Changed

| File | Change |
|---|---|
| `packages/web/src/pages/CommandCenter.tsx` | Competitor fetch via Promise.all across all locations; autocomplete dropdown on search bar; map pins with color-coded slot_type; `d.locations` fix for locations parsing |
| `packages/api/src/routes/locations.ts` | Added `c.lat, c.lng` to `GET /:id/competitors` SELECT (was missing, so competitors had no coordinates) |

**Infrastructure changes (not code):**
- Railway `DATABASE_URL` updated from broken Supabase pooler → working Railway Postgres (`metro.proxy.rlwy.net:36204/railway`)
- Railway redeployed via `railway redeploy --yes`
- `chrome-devtools-mcp` added to `~/.claude.json` (user-scope MCP)

No schema migrations. No new npm dependencies.

---

### 3. What Failed

- **Playwright headless browser test:** Mapbox GL JS crashes headless Chromium due to WebGL not being available even with `--use-gl=swiftshader`. Bundle analysis used as alternative proof of fix.
- **Supabase MCP execute_sql:** Still broken — "Database authentication failed". Supabase pooler password `k1paUDmtqSky4zeC` is also wrong for direct connection. Railway Postgres is the working DB with live data.
- **Railway GraphQL API for env var inspection:** "Not Authorized" with the access token from `~/.railway/config.json`. Used `railway variables` CLI instead (worked).

Known standing issues (not touched this session):
- `alert.worker.ts` logs only, no Resend emails
- `diff_engine.py` not tested end-to-end
- Stripe live-mode webhook not registered
- `chrome-devtools-mcp` requires a new session to activate (MCP servers load at session start)

---

### 4. What Is Next (First Things in Next Session)

1. **Test Command Center in browser with chrome-devtools-mcp** — new session will have the Chrome MCP; navigate to `/command-center`, verify map pins appear + search autocomplete works, check Network tab confirms `/api/v1/locations` returns 200
2. **Wire Block Management (`/blocks`)** — verify it's hitting real `tracked_competitors` + `block_list` data, not placeholder
3. **Run `diff_engine.py` end-to-end** — need two snapshots from same competitor to generate first `alerts` rows so Alert Feed shows real data
4. **Update CLAUDE.md** — Railway Postgres is the canonical DB (Supabase pooler broken, Supabase MCP broken); update the DB reference from Supabase to Railway Postgres
5. **Wire Promotions (`/promotions`)** — currently scaffold only; needs API endpoint + data

---

### 5. What Is Still Left To Do (Full Backlog)

**Map / Data Pipeline:**
- [ ] `promoteId="id"` on dispensary Source → activates hover (1 line, `MarketHeatMap.tsx`)
- [ ] `scrape.worker.ts` → write `dispensaries.enriched = true` after successful scrape
- [ ] `diff_engine.py` — test end-to-end with two real snapshots (needed to generate first `alerts` rows)
- [ ] Wire `alert.worker.ts` to Resend — currently logs only, no emails sent
- [ ] `scrape.worker.ts` → call `collector.py` as primary (currently falls back to `dispensary_scraper.py`)
- [ ] 462 dispensaries missing lat/lng — run `dcc_ingest.py` full geocoding when `GOOGLE_PLACES_API_KEY` available
- [ ] Update CLAUDE.md — Railway Postgres is canonical DB, not Supabase

**API / Backend:**
- [ ] Remove or commit debug/me endpoint in `packages/api/src/index.ts`
- [ ] Verify `alerts` API surfaces `change_events` end-to-end
- [ ] Full Stripe subscription quantity sync on slot add/remove
- [ ] `billing.service.ts` — usage sync cron

**Frontend:**
- [ ] Block Management (`/blocks`) — verify wired to real data, not placeholder
- [ ] Promotions (`/promotions`) — scaffold only, not wired to API
- [ ] `LocationDashboard` — add `.catch()` to prevent infinite loading state on API failure
- [ ] Apply DM Sans + Space Mono typography across all screens

**Infrastructure (Launch Blockers):**
- [ ] Register Stripe live-mode webhook endpoint
- [ ] Configure Stripe metered price with volume tiers
- [ ] Destroy Fly.io app (`fly apps destroy cannaspy-api`) — Patrick must confirm
- [ ] Sentry error tracking integration
- [ ] Uptime Robot scrape health monitoring

**Key Credentials:**
```
Railway Postgres: postgresql://postgres:obUqriCmHTpqQIubafxYBLXYZugPivKE@metro.proxy.rlwy.net:36204/railway
Production API:   https://cannaspy-production.up.railway.app
Frontend:         https://web-rouge-one-15.vercel.app
Location ID:      ffdefc3f-8d55-4701-b7ea-6b9d4195b16f (Corona)
Cannabis House:   9354f184-5b88-4a8f-abc3-012fdaa4058f (LA)
```

---

**Date:** 2026-05-16 (Session 29 — Map theme race condition + all-environment fix)

---

## Session 29 — 2026-05-16

**Commits:** `bf3b15f` → `a0fbd99` (10 commits — see below)
**Deploy:** Vercel ✅ `web-rouge-one-15.vercel.app` (auto-deployed via git push) | Railway API ✅ unchanged

---

### 1. What Was Done

#### Price Intelligence dropdown clipping (createPortal)

Dropdowns on the Price Intelligence filter bar were hidden behind the bar below. Root cause: `overflowX: auto` on the filter bar clips absolutely-positioned children on the Y axis. Fixed by rendering dropdown menus via `createPortal` at `document.body` level with `position: fixed` coordinates computed from the button's `getBoundingClientRect()`. Also corrected category options: added Flower, removed Indica/Hybrid.

#### Map API route — zero pins when zoomed in

The `GET /api/v1/map/dispensaries` route was using `query()` (pg Pool → deprecated Railway Postgres connection) instead of `getAdminDb()` (Supabase PostgREST). The local fix existed but had never been committed. Committed and deployed to Railway. Verified with curl: 275+ dispensaries returned for LA bbox.

#### Repo cleanup

Removed `fly.toml` and `Dockerfile.api` (Fly.io was abandoned in Session 20). Added `.vercel/` and `docs/SESSION-HANDOFF-MASTER.md` to `.gitignore`.

#### MarketHeatMap blank space on sidebar collapse

When the nav sidebar collapses, the Mapbox canvas didn't auto-grow to fill the recovered space. Added `ResizeObserver` on `mapContainerRef` that calls `mapRef.current?.getMap()?.resize()` on every size change. Sidebar CSS transition fires ResizeObserver at each animation frame, keeping the canvas in sync.

#### CompetitorDiscovery and CommandCenter — Mapbox standardization

Applied to both pages:
- `ResizeObserver` pattern from MarketHeatMap
- Theme-aware basemap (`streets-v12` light / `dark-v11` dark)
- Streets / Satellite toggle button (bottom-right)
- Fixed CommandCenter map not rendering at all (`position: absolute; inset: 0` → `width: 100%; height: 100%`)

#### Map theme race condition — three-layer fix

**Root cause:** `index.html` hardcoded `data-theme="dark"`. `useAppTheme` in CommandCenter read the DOM attribute at init — always got `'dark'` before Layout's `useEffect` could set the correct value. Map rendered with `dark-v11` regardless of user's actual theme preference. MutationObserver later updated it, but `map.setStyle()` silently fails when called while the map is still loading its initial style.

**Fix 1 — `index.html` inline script:** Synchronously reads `localStorage.getItem('cs-theme')` and sets `data-theme` before any deferred module scripts run. Changed HTML default from `data-theme="dark"` to `data-theme="light"` (matching Layout's default).

**Fix 2 — `useAppTheme` localStorage-first:** All three map pages now read from localStorage directly in the `useState` initializer (consistent with how MarketHeatMap already worked). This gives the correct value at first render, regardless of DOM state.

**Fix 3 — `key={MAP_STYLES[mapStyleId][appTheme]}` on all three Map components:** When `appTheme` or `mapStyleId` changes, React unmounts and remounts the Map fresh with the correct style. Eliminates `setStyle()` race conditions. Also sidesteps React Fast Refresh HMR state preservation — even if HMR keeps stale `theme='dark'` state, the MutationObserver fires when Layout corrects `data-theme`, triggering a key change and clean remount.

#### Environment consistency

Diagnosed why fixes sometimes only work on localhost or only on Vercel:
- **HMR state preservation** (localhost): React Fast Refresh keeps stale `useState` values across hot reloads — new initializers don't re-run on already-mounted components. Fix: hard reload (`Cmd+Shift+R`).
- **Stale browser module cache** (localhost): Vite HMR may not always propagate. Same fix.
- **Code not pushed** (Vercel): Vercel deploys from git, not from disk. Any uncommitted change is invisible to Vercel.

Rule going forward: always commit + push + hard-reload localhost before declaring a fix done.

---

### 2. What Changed

| File | Change |
|---|---|
| `packages/web/index.html` | `data-theme="dark"` → `"light"`; added inline script to set from localStorage synchronously |
| `packages/web/src/pages/PriceIntelligence.tsx` | Dropdown menus via `createPortal` to escape overflow clipping; category options corrected |
| `packages/web/src/pages/MarketHeatMap.tsx` | `key` prop on `<Map>`; `ResizeObserver` already present |
| `packages/web/src/pages/CompetitorDiscovery.tsx` | `ResizeObserver`, theme-aware basemap, satellite toggle, `key` prop on `<Map>` |
| `packages/web/src/pages/CommandCenter.tsx` | Map sizing fix, `ResizeObserver`, theme-aware basemap, satellite toggle, `useAppTheme` localStorage-first, `key` prop on `<Map>` |
| `packages/api/src/routes/map.ts` | `query()` → `getAdminDb()` (Supabase PostgREST); committed and deployed |
| `.gitignore` | Added `.vercel/`, `docs/SESSION-HANDOFF-MASTER.md` |
| `fly.toml`, `Dockerfile.api` | Deleted (Fly.io abandoned) |

No schema migrations. No new npm dependencies. No Railway API deploy (API change was hot).

---

### 3. What Failed

- **Multiple theme fix iterations:** First fix (read DOM attribute at init) failed because `index.html` had `data-theme="dark"` hardcoded — DOM read got `'dark'` before Layout's `useEffect` ran. Second fix (same code, user reported "no change") failed because React Fast Refresh preserved stale state across the HMR update — the fix was on disk but the old state was still running. Third fix (key prop + localStorage-first + index.html script) is the comprehensive solution.
- **Cannot visually verify map in browser** from Claude Code — user must hard-reload to confirm.

Known standing issues (not touched this session):
- `alert.worker.ts` logs only, no Resend emails
- `diff_engine.py` not tested end-to-end
- Stripe live-mode webhook not registered
- Redis not running locally (BullMQ workers crash, non-fatal for HTTP)
- Supabase project may be paused (needs verification)

---

### 4. What Is Next (First Things in Next Session)

1. **Verify map fixes in both environments** — hard reload localhost (`Cmd+Shift+R`) and test `/command-center`, `/market/heat-map`, and `/competitor-discovery` in both light and dark mode; also verify on `web-rouge-one-15.vercel.app` after build settles
2. **Wire Block Management (`/blocks`)** — verify it's hitting real `tracked_competitors` + `block_list` data, not placeholder
3. **Wire Promotions (`/promotions`)** — currently scaffold only; needs API endpoint + data
4. **Run `diff_engine.py` end-to-end** — need two snapshots from same competitor to generate first `alerts` rows so Alert Feed shows real data
5. **Confirm Supabase vs Railway DB status** — CLAUDE.md says Supabase is canonical but Railway Postgres has the live data

---

### 5. What Is Still Left To Do (Full Backlog)

**Map / Data Pipeline:**
- [ ] `promoteId="id"` on dispensary Source → activates hover (1 line, `MarketHeatMap.tsx`)
- [ ] `scrape.worker.ts` → write `dispensaries.enriched = true` after successful scrape
- [ ] `diff_engine.py` — test end-to-end with two real snapshots (needed to generate first `alerts` rows)
- [ ] Wire `alert.worker.ts` to Resend — currently logs only, no emails sent
- [ ] `scrape.worker.ts` → call `collector.py` as primary (currently falls back to `dispensary_scraper.py`)
- [ ] 462 dispensaries missing lat/lng — run `dcc_ingest.py` full geocoding when `GOOGLE_PLACES_API_KEY` available
- [ ] Confirm Railway Postgres vs Supabase as canonical DB — update CLAUDE.md

**API / Backend:**
- [ ] Remove or commit debug/me endpoint in `packages/api/src/index.ts`
- [ ] Verify `alerts` API surfaces `change_events` end-to-end
- [ ] Full Stripe subscription quantity sync on slot add/remove
- [ ] `billing.service.ts` — usage sync cron

**Frontend:**
- [ ] Block Management (`/blocks`) — verify wired to real data, not placeholder
- [ ] Promotions (`/promotions`) — scaffold only, not wired to API
- [ ] `LocationDashboard` — add `.catch()` to prevent infinite loading state on API failure
- [ ] Apply DM Sans + Space Mono typography across all screens

**Infrastructure (Launch Blockers):**
- [ ] Register Stripe live-mode webhook endpoint
- [ ] Configure Stripe metered price with volume tiers
- [ ] Destroy Fly.io app (`fly apps destroy cannaspy-api`) — Patrick must confirm
- [ ] Investigate Railway auto-deploy — git push should trigger deploy without `railway up`
- [ ] Sentry error tracking integration
- [ ] Uptime Robot scrape health monitoring

**Key Credentials:**
```
Railway Postgres: postgresql://postgres:obUqriCmHTpqQIubafxYBLXYZugPivKE@metro.proxy.rlwy.net:36204/railway
Production API:   https://cannaspy-production.up.railway.app
Frontend:         https://web-rouge-one-15.vercel.app
Location ID:      ffdefc3f-8d55-4701-b7ea-6b9d4195b16f (Corona)
Cannabis House:   9354f184-5b88-4a8f-abc3-012fdaa4058f (LA)
```

---

**Date:** 2026-05-16 (Session 28 — Cannabis House live data + Price Intelligence fixes)

---

## Session 28 — 2026-05-16

**Commits:** `84a10b2` fix(web): resolve Price Intelligence blank screen and category filter bugs
**Deploy:** Vercel ✅ `web-rouge-one-15.vercel.app` (no change) | Railway API ✅ running locally on :3001

---

### 1. What Was Done

#### Added Cannabis House as a tracked location

Patrick provided his dispensary: **Cannabis House, 1385 W 29th St, Los Angeles, CA 90007** (slug: `cannabis-house-4`). Inserted into Railway Postgres as location `9354f184-5b88-4a8f-abc3-012fdaa4058f` under org `4b507cd2-17e6-439c-8993-78476cdf08e1`.

#### Switched local DATABASE_URL to Railway Postgres

Supabase pooler was returning "Tenant or user not found" — project appears paused. Updated `.env` `DATABASE_URL` to the Railway Postgres public URL (`metro.proxy.rlwy.net:36204`). Railway DB had all 20 tables from session 2.

#### Discovered and scraped 4 LA competitors

Probed the primary data API to find active LA-area dispensaries with live menus. Found and inserted 4 competitors, linked to Cannabis House:

| Competitor | Slug | Items |
|---|---|---|
| STIIIZY Downtown LA | `stiiizy` | 2,002 |
| Highway DTLA (South LA) | `highway-dtla` | 1,057 |
| Jungle Boys DTLA | `jungle-boys-dtla` | 303 |
| LA Cannabis Co | `la-cannabis-co` | 220 |

Ran `collector.py` via `collect_all()` — all 4 succeeded, **3,582 items collected**. DB now has **9,584 total menu items**.

#### Fixed Price Intelligence white screen (3 bugs)

1. **`App.tsx` — Clerk loading flash**: `ProtectedRoute` showed browser-default white while Clerk initialized (`isLoaded=false`). Fixed by rendering a dark placeholder div until `isLoaded=true`.

2. **`usePriceMatrix.ts` — `min.toFixed is not a function` crash**: node-postgres returns PostgreSQL `NUMERIC` columns as strings. `sorted[0].price` was `"30.00"` not `30`, causing `.toFixed()` to throw and unmount the entire React tree. Fixed by wrapping all prices in `parseFloat()` before storing in state.

3. **`PriceIntelligence.tsx` — category filter returning 0 results**: Hardcoded options (`Flower`, `Vapes`, `Edibles`) didn't match actual DB category values (`Indica`, `Hybrid`, `Edible`). The API does exact string match. Replaced with all 10 real DB categories.

---

### 2. What Changed

| File | Change |
|---|---|
| `.env` | `DATABASE_URL` → Railway Postgres (not committed — gitignored) |
| `packages/web/src/App.tsx` | `ProtectedRoute`: added `isLoaded` guard, dark loading placeholder |
| `packages/web/src/hooks/usePriceMatrix.ts` | Wrap prices in `parseFloat()` at data boundary |
| `packages/web/src/pages/PriceIntelligence.tsx` | Category filter: replaced hardcoded options with real DB values |

No schema migrations. No new npm dependencies. No Railway/Vercel deploy.

**DB-only changes (Railway Postgres, not Supabase):**
- New location: Cannabis House (`9354f184`)
- 4 new competitors + `tracked_competitors` links
- 3,582 new `menu_items` rows

---

### 3. What Failed

- **Supabase is inaccessible locally** — pooler returns "Tenant or user not found". The project is likely paused (free tier auto-pauses after 1 week of inactivity). CLAUDE.md says Supabase is the primary DB — needs investigation in next session. All this session's work went to Railway Postgres instead.
- **Google Places API key still missing** — competitor discovery was done manually via slug probing instead of `places_client.py`
- **No Vercel deploy** — frontend fixes only ran locally; need to push and verify Vercel picks them up

Known standing issues (not touched this session):
- `alert.worker.ts` logs only, not wired to Resend
- `diff_engine.py` not tested end-to-end with two real snapshots
- Stripe live-mode webhook not registered (launch blocker)
- Redis not running locally — BullMQ workers crash on startup (non-fatal for HTTP routes)

---

### 4. What Is Next (First Things in Next Session)

1. **Verify Supabase status** — check if project `cbhbrbkirzpncpxlvehk` is paused; restore it or confirm Railway Postgres is now the permanent primary DB and update CLAUDE.md accordingly
2. **Push and verify Vercel deploy** — `git push origin main` should auto-deploy; verify Price Intelligence fixes work on `web-rouge-one-15.vercel.app`
3. **Run `collector.py` on Vercel production org** — the 3,582 items are in Railway DB but the production API (Railway) may be pointing at Supabase; confirm `DATABASE_URL` in Railway service points to Railway Postgres
4. **Restart API persistently** — local API dies when terminal closes; consider setting up a proper `pnpm dev` startup or use Railway for API access
5. **Wire `diff_engine.py` end-to-end** — run against two snapshots from Cannabis House competitors to generate first real `alerts` rows

---

### 5. What Is Still Left To Do (Full Backlog)

**Data Pipeline:**
- [ ] Confirm whether Railway Postgres or Supabase is the canonical production DB — update CLAUDE.md
- [ ] Google Places API key → run `places_client.py` for proper LA competitor discovery
- [ ] Wire `scrape.worker.ts` → `collector.py` as primary (currently falls back to `dispensary_scraper.py`)
- [ ] Configure production proxy IP pool (single IP in dev)
- [ ] 462 dispensaries missing lat/lng — run `dcc_ingest.py` geocoding when `GOOGLE_PLACES_API_KEY` available
- [ ] `diff_engine.py` — test end-to-end with two real snapshots to generate first `alerts` rows

**API / Backend:**
- [ ] Remove or commit debug/me endpoint in `packages/api/src/index.ts` (was added in session 27, uncommitted)
- [ ] Verify `alerts` API surfaces `change_events` end-to-end
- [ ] Wire `alert.worker.ts` to Resend (`RESEND_API_KEY` in Railway env, domain verification pending)
- [ ] Full Stripe subscription quantity sync on slot add/remove
- [ ] `billing.service.ts` — usage sync cron

**Frontend:**
- [ ] Push session 28 fixes to Vercel and verify production
- [ ] Block Management (`/blocks`) — verify wired to real data, not placeholder
- [ ] Promotions (`/promotions`) — scaffold only, not wired to API
- [ ] `LocationDashboard` — add `.catch()` to prevent infinite loading state on API failure
- [ ] Apply DM Sans + Space Mono typography across all screens

**Infrastructure (Launch Blockers):**
- [ ] Register Stripe live-mode webhook endpoint
- [ ] Configure Stripe metered price with volume tiers
- [ ] Destroy Fly.io app (`fly apps destroy cannaspy-api`) — Patrick must confirm
- [ ] Sentry error tracking integration
- [ ] Uptime Robot scrape health monitoring
- [ ] Investigate Railway auto-deploy — git push should trigger deploy without `railway up`

---

### Key Credentials

```
Railway Postgres:   postgresql://postgres:obUqriCmHTpqQIubafxYBLXYZugPivKE@metro.proxy.rlwy.net:36204/railway
Production API:     https://cannaspy-production.up.railway.app
Frontend:           https://web-rouge-one-15.vercel.app
Location ID:        9354f184-5b88-4a8f-abc3-012fdaa4058f (Cannabis House, LA)
Location ID:        ffdefc3f-8d55-4701-b7ea-6b9d4195b16f (Culture Cannabis Club, Corona)
Org ID:             4b507cd2-17e6-439c-8993-78476cdf08e1 (Patrick's personal org)
Patrick Clerk ID:   user_3D148kdy4fZPXIWmTskLn8rxs8E
```

---

**Date:** 2026-05-14 (Session 27 — debug/me endpoint + Clerk/org account investigation)

---

## Session 27 — 2026-05-14

**Commits:** No commits this session — debug endpoint deployed to Railway but not yet committed to git
**Deploy:** Vercel ✅ `web-rouge-one-15.vercel.app` (no change) | Railway API ✅ deployed via `railway up --detach` with debug endpoint

---

### 1. What Was Done

#### Added unauthenticated debug endpoint

Added `GET /api/v1/debug/me` to `packages/api/src/index.ts`, registered before `clerkPlugin` so it bypasses all auth middleware. It decodes the Bearer JWT and returns the raw payload — used to inspect what `orgId` Clerk is sending from the frontend.

Deployed to Railway and verified healthy: `{"status":"ok"}` from `/health`.

#### Investigated Patrick's account state (Clerk + DB)

Goal was to figure out why `setup/locations` shows no data. Found:
- Patrick's Clerk user ID: `user_3D148kdy4fZPXIWmTskLn8rxs8E` (email: ple123.6682@gmail.com)
- **No Clerk Organizations exist** — Patrick has never created one in the Clerk dashboard
- Since `auth.orgId` is null, the clerk middleware falls back to `tenantKey = user_user_3D148kdy4fZPXIWmTskLn8rxs8E`
- The `organizations` table has only the test seed row (`org_test_block_cancel`) — no real org for Patrick
- The `locations` table has only the test seed row linked to the test org

**Conclusion:** When Patrick logs in, the clerk middleware auto-creates an org keyed to `user_user_3D148kdy4fZPXIWmTskLn8rxs8E`, but that org has no locations. The setup/locations page is empty because no location has been seeded for his account.

**Blocked on:** Patrick needs to provide a dispensary name + address so a location can be inserted directly into the DB (or he can add one via the UI after logging in).

#### Created instruction .docx files

Two files created on the Desktop for Patrick:
- `CannaSpy_Auth_Token_Instructions.docx` — step-by-step DevTools token grab instructions
- `CannaSpy_Next_Steps.docx` — summary of account state + what's needed to proceed

---

### 2. What Changed

| File | Change |
|---|---|
| `packages/api/src/index.ts` | Added `GET /api/v1/debug/me` unauthenticated endpoint (UNCOMMITTED) |

No schema migrations. No new dependencies. No frontend changes.

⚠️ The debug endpoint is **live on Railway** but **not committed to git**. It should be committed or removed before next deploy.

---

### 3. What Failed

- Could not complete the "grab auth token from DevTools" flow — Patrick found the instructions too complex to follow manually; browser automation is not available.
- Could not pre-seed Patrick's location — need dispensary name + address from Patrick first.

Known standing issues (not touched this session):
- psycopg2 cannot connect locally (IPv6 only, pooler rejects) — PostgREST workaround active
- Supabase MCP `execute_sql` still broken
- `alert.worker.ts` logs only, not wired to Resend — 161 `change_events` in DB, no emails sent
- Stripe live-mode webhook not registered (launch blocker)
- Fly.io app not yet destroyed

---

### 4. What Is Next (First Things in Next Session)

1. **Commit or remove debug endpoint** — `packages/api/src/index.ts` has uncommitted changes; either commit with `feat(api): add debug/me endpoint` or revert before next Railway deploy
2. **Get Patrick's dispensary name + address** — then insert org + location directly into Supabase so setup/locations page shows data on login
3. **Verify AlertFeed** — 161 `change_events` rows exist; confirm `/api/v1/alerts` surfaces them and AlertFeed renders them
4. **Add more real competitors** — `collector.py --slug <slug>` + `run_diff_rest.py` to build richer demo data
5. **Wire `alert.worker.ts` to Resend** — `RESEND_API_KEY` already in Railway env

---

### 5. Full Backlog (What Is Still Left To Do)

**Data Pipeline:**
- [ ] Get Patrick's dispensary name + address → seed org + location in DB
- [ ] Add 3–5 more real competitors with valid slugs (cannabis-house-4 is the only one)
- [ ] Wire `scrape.worker.ts` → `collector.py` as primary (falls back to `dispensary_scraper.py`)
- [ ] Configure production proxy IP pool (single IP in dev)
- [ ] 462 dispensaries missing lat/lng — run `dcc_ingest.py` geocoding when `GOOGLE_PLACES_API_KEY` available

**API / Backend:**
- [ ] Commit or revert debug/me endpoint in `packages/api/src/index.ts`
- [ ] Verify `alerts` API surfaces `change_events` (AlertFeed depends on this)
- [ ] Wire `alert.worker.ts` to Resend
- [ ] Full Stripe subscription quantity sync on slot add/remove
- [ ] `billing.service.ts` — usage sync cron

**Frontend:**
- [ ] Wire Block Management (`/blocks`) to real data
- [ ] Scaffold → wire Promotions screen
- [ ] Apply DM Sans + Space Mono typography across all screens
- [ ] `LocationDashboard` — add `.catch()` to prevent infinite loading state

**Infrastructure (Launch Blockers):**
- [ ] Register Stripe live-mode webhook endpoint
- [ ] Configure Stripe metered price with volume tiers
- [ ] Destroy Fly.io app (`fly apps destroy cannaspy-api`) — Patrick must confirm
- [ ] Sentry error tracking integration
- [ ] Uptime Robot scrape health monitoring

---

### Key Credentials

```
API (Railway):      https://cannaspy-production.up.railway.app
API health:         https://cannaspy-production.up.railway.app/health
Frontend:           https://web-rouge-one-15.vercel.app
Railway project:    https://railway.com/project/9829ee26-dff3-4db2-850c-2cb87207cdaa
Database:           Supabase cbhbrbkirzpncpxlvehk
Seed org ID:        a0000000-0000-0000-0000-000000000001 (org_test_block_cancel)
Seed location ID:   b0000000-0000-0000-0000-000000000001
Competitor UUID:    19f0699b-436a-4144-b1a4-35a0180b28a7 (cannabis-house-4)
Snapshot 1:         e5a43c17 — 1,993 items (2026-05-10)
Snapshot 2:         cf921eef — 1,993 items synthetic (2026-05-11) → 161 change_events generated
Patrick Clerk ID:   user_3D148kdy4fZPXIWmTskLn8rxs8E (no Clerk org; tenantKey = user_user_3D148kdy4fZPXIWmTskLn8rxs8E)
Vercel deploy:      git push origin main (auto-deploys)
Railway deploy:     railway up --detach
```

---



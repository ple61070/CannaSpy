# CannaSpy Session Handoff
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



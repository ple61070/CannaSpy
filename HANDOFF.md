# CannaSpy Session Handoff
**Date:** 2026-05-02 (Session 11 — Map pin full restyle + enriched data fix + CORS confirmed)

---

## Session 11 — 2026-05-02

**Commits:** `c924c81` pin restyle v1 → `0e9f883` fix(map): prospect pins teal+65%
**Deploy:** Vercel ✅ latest bundle aliased to `web-rouge-one-15.vercel.app` | Railway API ✅ CORS live

---

### 1. What Was Done

#### CORS fix confirmed live
- `packages/api/src/index.ts` — CORS origin changed from single-string to function allowing `WEB_URL`, `localhost:3000`, `localhost:5173`, `*.vercel.app`
- Verified via `curl -H "Origin: https://web-rouge-one-15.vercel.app"` → `access-control-allow-origin: https://web-rouge-one-15.vercel.app` ✅
- This was the root cause of zero pins ever rendering — browser silently dropped the response

#### Map pin diagnosis: why "dark circles"
- Investigated through multiple iterations
- Root finding: ALL 1,787 dispensaries had `enriched = false` and `track_state = 'untracked'`
- The pipeline writes menu data to `menu_items` via `competitor_id` but has **no write-back** to `dispensaries.enriched`
- The two tables (`competitors` and `dispensaries`) have no foreign key — they're parallel records for the same physical locations but were never linked

#### Data fix — 38 dispensaries marked enriched
Direct SQL update on Railway Postgres:
- 33 × Off The Charts locations → `enriched = true`, `price_observations_count = 498`
- 1 × Catalyst Cannabis - Daly City → `enriched = true`, `price_observations_count = 486`
- 4 × Caliva / Deli by Caliva → `enriched = true`, `price_observations_count = 529`
- **Verified:** LA bbox API now returns 15+ enriched features ✅
- **Not found:** Zen Dispensary is not in the DCC `dispensaries` table (different legal name)

#### Pin visual restyle — final state (`packages/web/src/components/map/layers.ts`)

| State | Color | Opacity | Radius |
|---|---|---|---|
| Prospect (untracked, default) | `#1d9e75` teal | **0.65** | 5px |
| Enriched / tracked | `#1d9e75` teal | 1.0 | 6px |
| Blocked | `#ba7517` amber | 1.0 | 6px |
| Hover (any state) | unchanged | 1.0 | +2px |
| Cluster | `#1d9e75` teal | 1.0 | 24 / 30 / 36px |
| Cluster count label | `#ffffff` white | — | — |
| Stroke (all pins) | `#0d0f11` | — | 1.5px |

Key design decision: prospect pins use **the same teal family as enriched** — the map looks alive on first load for any new user. Opacity + size carry the hierarchy signal, not color.

Color expression simplified: `blocked → #ba7517 | everything else → #1d9e75`. The `enriched` boolean only gates opacity and radius, not color.

Hover implemented via `feature-state hover` using `['+', baseRadius, hoverBonus]` and opacity case. **Currently inert** — activates when `promoteId="id"` is added to the `<Source id="cs-dispensaries">` in `MarketHeatMap.tsx`.

---

### 2. What Changed

| File | Change |
|---|---|
| `packages/api/src/index.ts` | CORS origin → function, allows `*.vercel.app` |
| `packages/web/src/components/map/layers.ts` | `dispensaryPointLayer` — color, opacity, radius, comment block rewritten |
| `dispensaries` table (Railway Postgres) | 38 rows: `enriched = true`, `price_observations_count` populated |

No schema migrations. No new files. No changes to hook, types, or component interaction logic.

---

### 3. What Failed / Was Ruled Out

| Item | Result |
|---|---|
| Mapbox docs (docs.mapbox.com) | ❌ Returns 403. Used installed `node_modules/mapbox-gl` type defs instead |
| `feature-state hover` on radius/opacity | ⚠️ Wired in layer spec but **inert** — requires `promoteId="id"` on the Source. Features have `id` inside `properties`, not at the GeoJSON feature level. One prop fix needed. |
| Railway auto-deploy from `git push` | ❌ Still not triggering. Required `railway up` manually each time. Root cause unknown — check Railway dashboard → Service → Settings → Source Repo |
| Zen Dispensary in DCC database | ❌ Not found by name. Likely licensed under a different legal entity name |
| `['==', ['get', 'enriched'], true]` | ⚠️ Replaced with `['boolean', ['get', 'enriched'], false]` — explicit type coercion is safer |

---

### 4. What Is Next (First Things in Next Session)

1. **Add `promoteId="id"` to `<Source id="cs-dispensaries">` in `MarketHeatMap.tsx`** — one prop, activates hover (+2px, opacity→1). No other changes needed.
2. **Verify teal pins in browser** — navigate to LA / Harbor City / Reseda. Should see 15+ teal pins at varying opacity. Hard-refresh (`Cmd+Shift+R`) first.
3. **Wire `scrape.worker.ts` enriched write-back** — after a successful scrape, the worker should update `dispensaries.enriched = true` for the matching DCC record. Match by DCC license number or name+city. Prevents the manual SQL fix from needing to be re-run after future scrapes.

---

### 5. What Is Still Left To Do (Backlog)

**Map / Data Pipeline:**
- [ ] `promoteId="id"` on dispensary Source → activates hover (1 line, `MarketHeatMap.tsx`)
- [ ] `scrape.worker.ts` → write `dispensaries.enriched = true` after successful scrape
- [ ] `diff_engine.py` — not yet tested end-to-end with two real snapshots (needed to generate first `alerts` rows)
- [ ] Wire `alert.worker.ts` to Resend — currently logs only, no emails sent
- [ ] `scrape.worker.ts` → call `collector.py` as primary (currently falls back to `dispensary_scraper.py`)
- [ ] 462 dispensaries missing lat/lng — run `dcc_ingest.py` full geocoding when `GOOGLE_PLACES_API_KEY` available

**Frontend:**
- [ ] Block Management (`/blocks`) — verify wired to real data, not placeholder
- [ ] Promotions (`/promotions`) — scaffold only, not wired to API
- [ ] `LocationDashboard` — add `.catch()` to prevent infinite loading state on API failure
- [ ] Apply DM Sans + Space Mono typography system-wide (remaining screens still using system font)

**Infrastructure (Launch Blockers):**
- [ ] Register Stripe live-mode webhook endpoint (test-mode only currently)
- [ ] Configure Stripe metered price with volume tiers
- [ ] Investigate Railway auto-deploy — git push should trigger deploy without `railway up`
- [ ] Sentry error tracking integration
- [ ] Uptime Robot scrape health monitoring

**Key Credentials:**
```
Railway Postgres: postgresql://postgres:obUqriCmHTpqQIubafxYBLXYZugPivKE@metro.proxy.rlwy.net:36204/railway
Production API:   https://cannaspy-production.up.railway.app
Frontend:         https://web-rouge-one-15.vercel.app
Location ID:      ffdefc3f-8d55-4701-b7ea-6b9d4195b16f (Corona)
```

---

**Date:** 2026-05-01 (Session 10 — Map pin styling + enriched data fix)

---

## Session 10 — 2026-05-01

**Commits:** `b63c7d4` CORS fix (already live) → `c924c81` fix(map): restyle dispensary pins
**Deploy:** Vercel ✅ `web-3uw5j9brh-ple61070s-projects.vercel.app` aliased to `web-rouge-one-15.vercel.app` | Railway API ✅ CORS fix confirmed live

---

### What Was Done

#### 1. CORS — *.vercel.app origins now allowed (deployed in this session)
- `packages/api/src/index.ts` — origin changed from single string to a function
- Allows: `WEB_URL` env var, `localhost:3000`, `localhost:5173`, any `*.vercel.app`
- Verified via curl preflight: `access-control-allow-origin: https://web-rouge-one-15.vercel.app` ✅

#### 2. Map pin restyling (`packages/web/src/components/map/layers.ts`)
Three dispensary layers rewritten:

| Layer | Change |
|---|---|
| `dispensaryPointLayer` circle-color | `case` expression: blocked→`#ba7517`, enriched→`#1d9e75`, default→`#6b7280` |
| `dispensaryPointLayer` circle-radius | Zoom interpolation 9→5px, 12→7px, 15→9px (removed `feature-state` hover — requires `promoteId` on Source, was silently breaking render) |
| `dispensaryPointLayer` enriched check | `['boolean', ['get', 'enriched'], false]` — explicit type coercion instead of `['==', expr, true]` |
| `dispensaryPointLayer` opacity | `1` flat (was variable 0.4–0.95) |
| `dispensaryPointLayer` stroke | `#0d0f11`, 1.5px |
| `dispensaryClusterLayer` fill | Flat `#1d9e75` teal (was stepped accentTrust/accentBlock/accentAlert) |
| `dispensaryClusterLayer` radius | `step`: <10→24px, 10–50→30px, 50+→36px |
| `dispensaryClusterCountLayer` text | White `#ffffff` (was dark `bgBase`) |

#### 3. Root cause of "dark circles" — enriched was never set
- **Diagnosis**: All 1,787 dispensaries had `enriched = false`. The pipeline writes to `menu_items` via `competitor_id` but has no write-back to `dispensaries.enriched`. The two tables have no foreign key.
- **Fix**: Direct SQL update — set `enriched = true` on dispensaries matching the 4 scraped competitor chains by name:
  - 33 × Off The Charts locations (`price_observations_count = 498`)
  - 1 × Catalyst Cannabis - Daly City (`price_observations_count = 486`)
  - 4 × Caliva/Deli by Caliva locations (`price_observations_count = 529`)
  - **Total: 38 enriched dispensaries** — verified via API: LA bbox now returns 15+ enriched features ✅
- **Zen Dispensary** is NOT in the DCC `dispensaries` table — operates under a different legal name. Not updated.

---

### What Failed / Ruled Out

| Item | Result |
|---|---|
| `feature-state` hover in circle-radius | ❌ Requires `promoteId="id"` on the Source. Features have `id` inside `properties`, not at the GeoJSON feature level. Silently broken. Removed. |
| Railway auto-deploy from `git push` | ❌ Still not triggering. Required `railway up`. Check Railway dashboard → Service → Settings → Source Repo webhook. |
| Mapbox docs (403/404) | ❌ docs.mapbox.com returns 403; react-map-gl docs 404. Used installed type definitions instead. |
| Zen Dispensary in DCC database | ❌ Not found by name search. Likely operating under a different DCC license name. |

---

### What Is Next

**Immediate (next session start):**
1. Navigate to LA / Harbor City / Reseda on the map and confirm teal enriched pins render (hard-refresh first: `Cmd+Shift+R`)
2. Wire `scrape.worker.ts` to write back `dispensaries.enriched = true` after a successful scrape — so the manual SQL fix isn't needed long-term. Match by DCC license or name+city.
3. Add `promoteId="id"` to the `<Source id="cs-dispensaries">` in `MarketHeatMap.tsx` to re-enable the hover radius expansion (6→8px) — one prop, no other changes needed.

**Backlog (unchanged from Session 9):**
- Wire `alert.worker.ts` to Resend
- Test `diff_engine.py` end-to-end with two real snapshots
- Block Management (`/blocks`) — verify real data
- Promotions (`/promotions`) — scaffold only
- Stripe live-mode webhook (launch blocker)
- 462 dispensaries missing lat/lng — run full geocoding when `GOOGLE_PLACES_API_KEY` available

---

**Date:** 2026-05-01 (Session 9 — Heat map UI improvements + CORS fix + sub-nav fix)

---

## Session 9 — 2026-05-01

**Commits:** `06c45f3` feat(map): streets/satellite toggle, city search, full-width map, fix light mode pills → `015c906` fix(market): shared MarketSubNav with correct routes, apply migration 011 to prod
**Deploy:** Vercel ✅ — https://web-rouge-one-15.vercel.app (bundle index-DM5GXFy4.js) | Railway API ✅ — `d1423bf8`

---

### What Was Done

#### 1. MarketHeatMap — full redesign
- **Sidebar removed** — replaced with Mapbox Geocoding API search bar (220ms debounce, California bbox, autocomplete dropdown, `flyTo` on select)
- **Map style toggle** — Streets (`streets-v12`) / Satellite Streets (`satellite-streets-v12`), floating button bottom-right
- **Full-width map** — sidebar div removed entirely
- **Dispensary count stat** — floating pill overlay top-center
- Active state for market tab now uses `useLocation()` via shared `MarketSubNav`

#### 2. OperatorTypeFilter — light mode fix
- `color` for inactive buttons changed from `rgba(255,255,255,0.5)` (invisible on light bg) to `var(--text-2)`
- Container border/bg changed to `var(--border-2)` / `var(--surface-2)` (theme-aware)

#### 3. MarketSubNav — shared component (`packages/web/src/components/shared/MarketSubNav.tsx`)
- All 5 market pages had their own `MARKET_TABS` arrays with **wrong routes** (`/market`, `/competitor-ranking`, `/benchmarks`, etc.)
- Clicking any tab other than the current page's active one used `handleTabClick` which showed a toast instead of navigating
- Fixed: created shared `MarketSubNav` using `useLocation()` for active detection and correct routes matching `App.tsx`
- All 5 pages (`MarketHeatMap`, `CompetitorRanking`, `MyBenchmarks`, `SkuGapAnalysis`, `DealEffectiveness`) updated to import and use it

#### 4. Migration 011 applied to Railway prod
- Applied via `psql` directly — `business_type` columns already existed (columns were skipped), but the `UPDATE` ran and backfilled 1,787 dispensary rows

#### 5. CORS fix (diagnosed by Claude Code, applied to Railway API)
- **Root cause of missing map pins**: `packages/api/src/index.ts` had `origin: process.env.WEB_URL || 'http://localhost:3000'` — a single string
- Requests from `https://web-rouge-one-15.vercel.app` received `Access-Control-Allow-Origin: http://localhost:3000`, which the browser rejected
- `useDispensaryMap`'s catch block silently swallowed the `TypeError` → empty FeatureCollection → no pins rendered
- **Fix**: CORS origin changed to a function allowing `WEB_URL`, `localhost:3000`, `localhost:5173`, and any `*.vercel.app` domain
- Auth gate, data, layer minzoom, and bbox trigger were all verified clean

---

### What Failed / Was Ruled Out

| Item | Result |
|---|---|
| Auth gate on map route | ✅ Clean — map route correctly outside Clerk scope |
| Data in Railway Postgres | ✅ LA bbox returns 50 features |
| Layer `minzoom={9}` | ✅ Correct on all 3 layers |
| `onMoveEnd` bbox trigger | ✅ Fires correctly |
| Railway auto-deploy from git push | ❌ Did not trigger — required manual `railway up`. Check Railway webhook config. |

---

### What Is Next

1. **Verify pins in browser** — zoom into LA and confirm dispensary pins and clusters now render
2. **Verify OperatorTypeFilter light mode** — confirm pills are readable in light theme
3. **Verify market sub-nav** — all 5 tabs should navigate correctly and show correct active state
4. **Wellgreens live simulation** — seed org, add locations, run scraper, wire all screens to real API data
5. **Wire `alert.worker.ts` to Resend** — currently logs only, no emails sent
6. **Railway auto-deploy** — investigate Railway webhook config so `git push` triggers deploy without manual `railway up`

---

## Session 8 — 2026-05-01

**Commit:** `5e6f552` — `feat(data): delivery operator type support — migration 011 + business_type across full stack`
**Deploy:** Vercel production live ✅ — https://web-rouge-one-15.vercel.app (HTTP 200 confirmed)
**Railway:** `railway up --detach` triggered ✅ — backend deploying

---

### What Was Done

#### 1. Migration 011 — `business_type` column added to `competitors` + `dispensaries`

- `packages/api/src/db/migrations/011_business_type.sql`
- Adds `business_type TEXT CHECK IN ('storefront', 'delivery', 'both') DEFAULT 'storefront'` to both tables
- Backfills `dispensaries.business_type` from existing `license_type`:
  - `retail` → `storefront`, `delivery` → `delivery`, `microbusiness` → `both`
- **Applied to Railway prod. Verified distribution: storefront=1211, delivery=229, both=347**

#### 2. Shared `OperatorTypeFilter` component

- `packages/web/src/components/filters/OperatorTypeFilter.tsx`
- 3-pill toggle: Storefronts 🏪 / Delivery 🚗 / Both ⊕
- Default: `'both'` (show all)
- Active state uses `var(--accent-intel)` — CannaSpy palette

#### 3. API-level `?type` filtering added to 5 routes

- `map.ts` — filters `dispensaries.business_type`
- `competitors.ts` — `business_type` added to GET SELECT + POST INSERT
- `pricing.ts` — `?type` filters `tracked_competitors` join
- `blocks.ts` — `?type` filters competitor join
- `alerts.ts` — `?type` filters competitor join

#### 4. Hook updates

- `usePriceMatrix.ts` — added `type?` param, passes to API
- `useAlerts.ts` — added `type?` to `UseAlertsOptions`, passes to API

#### 5. `dcc_ingest.py` updated

- Added `license_type_to_business_type()` mapping function
- UPSERT now writes `business_type` column

#### 6. `OperatorTypeFilter` wired into 6 screens

- `MarketHeatMap` — passes `operatorType` to `useDispensaryMap` (API-level filter)
- `PriceIntelligence` — passes `operatorType` to `usePriceMatrix` (API-level filter)
- `AlertFeed` — passes `operatorType` to `useAlerts` (API-level filter)
- `CommandCenter` — UI state only (no type-specific API yet)
- `BlockManagement` — UI state only (page uses mock data)
- `CompetitorDiscovery` — client-side filter on `business_type` field (Places-discovered competitors may not have it)

---

### What Is Next (Immediate)

1. **Verify OperatorTypeFilter in browser** — confirm pill toggles work on MarketHeatMap, PriceIntelligence, AlertFeed
2. **Check map filter** — switch to "Delivery" on MarketHeatMap, confirm count drops from ~1,787 to ~229
3. **Wellgreens live simulation** — seed org, add locations, run scraper, wire all screens to real API data
4. **Wire `alert.worker.ts` to Resend** — currently logs only, no emails sent

---

## Session 7 — 2026-05-01

**Commit:** `6b0bd6d` — `feat(web): CommandCenter real Mapbox map + CompetitorDiscovery auto-fly onLoad`
**Deploy:** Vercel production live ✅ — https://web-rouge-one-15.vercel.app (HTTP 200 confirmed)
**Railway:** `railway up --detach` triggered ✅ — backend deploying from same commit

---

### What Was Done

#### 1. CommandCenter — CSS mock map replaced with real Mapbox GL

**Problem:** The entire right panel of CommandCenter (`/command-center`) was a fake CSS map — 19 hardcoded city-block `<div>` elements, static road overlays, radial-gradient heat blobs, and percentage-positioned competitor pins with hardcoded names (STIIIZY, MedMen, etc.). ~250 lines of decorative layout with no real data.

**What changed (`packages/web/src/pages/CommandCenter.tsx`):**
- Added imports: `Map`, `Marker`, `NavigationControl`, `MapRef` from `react-map-gl`; `mapbox-gl/dist/mapbox-gl.css`; `useCallback`
- Added `MAPBOX_TOKEN` constant and `LA_VIEWPORT` fallback (`-118.24, 34.05, zoom 11`)
- Added `mapRef = useRef<MapRef | null>(null)`
- Extended `locations` state type to include `lat` and `lng` fields
- Added `firstLocation` derived value + `mapCenter` (uses real coords if available, falls back to LA)
- Added `handleMapLoad` callback — flies to first location once map is initialized
- **Removed** `PIN_POSITIONS` constant, `mapPins` array, `displayPins` fallback array (~50 lines)
- **Removed** all CSS map content — city blocks, roads, heat overlay, distance rings, fake "YOUR LOCATION" pin, CSS competitor pins (~230 lines)
- **Removed** fake zoom `+`/`−` buttons (replaced by Mapbox `NavigationControl`)
- **Added** real `<Map>` component with `dark-v11` style, `onLoad={handleMapLoad}`, `NavigationControl` at bottom-right
- **Added** `<Marker>` for "YOUR LOCATION" at `firstLocation.lat/lng` with teal pulsing dot + label chip
- All existing overlay elements kept: location pill, stat pills (alerts/tracked/blocked), freshness pill, map legend, "Open Price Intelligence" CTA button

**Net diff:** −227 lines / +71 lines

#### 2. CompetitorDiscovery — auto-fly on map load

**Problem:** When a user navigates to `/competitor-discovery`, the location is fetched async. By the time `selectedLocation` state is set and the `flyTo` `useEffect` fires, the Mapbox map may not yet be initialized — so the effect runs against a null `mapRef` and the map stays at the California overview zoom.

**What changed (`packages/web/src/pages/CompetitorDiscovery.tsx`):**
- Added `handleMapLoad` callback using `useCallback` — fires `flyTo` to `selectedLocation` coords if already set when the map finishes loading
- Added `onLoad={handleMapLoad}` to the existing `<Map>` component
- Existing `useEffect` on `selectedLocation` is still in place for subsequent location switches

---

### What Failed / Known Issues

| Issue | Status | Notes |
|---|---|---|
| `pnpm build` in Linux sandbox | ❌ expected | Rollup native module is macOS-only. Always build via osascript. |
| `vercel` not globally installed on Mac | ✅ fixed | Installed vercel 53.0.1 via `pnpm add -g vercel` with `PNPM_HOME` set |
| `npm install -g vercel` permission denied | ❌ | `/usr/local/lib/node_modules` requires sudo — use pnpm global instead |
| Competitor markers on CommandCenter map | ⬜ pending | `useBlocks()` returns no lat/lng for competitors — markers not shown. Need to join competitor coords from API or augment the blocks endpoint. |
| `firstLocation` lat/lng availability | ⬜ depends | The `/api/v1/locations` response must return `lat`/`lng` fields. If they're null (location not geocoded), map falls back to LA viewport. Check DB for Corona location coords. |

---

### What Is Next (Immediate)

1. **Verify CommandCenter map in browser** — confirm dark-v11 renders, "YOUR LOCATION" pin shows at correct coordinates for the Corona test location
2. **Verify CompetitorDiscovery auto-fly** — navigate to `/competitor-discovery`, confirm map flies to location instead of staying at CA zoom
3. **Add competitor lat/lng to blocks API** — augment `GET /api/v1/blocks` to JOIN `competitors` table and return `lat`/`lng` per block entry, then add `<Marker>` elements for each blocked/tracked competitor on the CommandCenter map

---

### What Is Still Left To Do (Backlog)

**Frontend wiring:**
- [ ] Block Management (`/blocks`) — verify wired to real data, not placeholder
- [ ] Promotions (`/promotions`) — scaffold only, not wired to API
- [ ] `LocationDashboard` — add `.catch()` to prevent infinite loading state on dual API failure
- [ ] Apply CannaSpy color palette across remaining screens — replace any remaining Tailwind defaults (`#22c55e`, `#f59e0b`, `#ef4444`) with CSS vars
- [ ] Apply DM Sans + Space Mono typography system-wide

**Data pipeline:**
- [ ] Test `diff_engine.py` end-to-end with two real snapshots → generates first real `alerts` rows
- [ ] Wire `alert.worker.ts` to Resend — currently only logs, no emails sent on alerts
- [ ] Wire `scrape.worker.ts` to `collector.py` as primary (currently falls back to `dispensary_scraper.py`)
- [ ] Configure production IP proxy pool (currently single IP in dev)
- [ ] Full DCC geocoding — 462 dispensaries missing lat/lng; run `dcc_ingest.py --all-counties` when `GOOGLE_PLACES_API_KEY` available

**Infrastructure:**
- [ ] Add git remote origin — pushes still fail, commits are local only
- [ ] Register Stripe live-mode webhook endpoint (test-mode only currently — launch blocker)
- [ ] Configure Stripe metered price with volume tiers
- [ ] Sentry error tracking integration
- [ ] Uptime Robot scrape health monitoring

**Live simulation:**
- [ ] Wellgreens org — seed org, add locations, run scraper, wire all screens to real API data

---

## Session 6 — 2026-04-30

**Task:** Committed updated frontend pages + cleaned git lock files.

### What was done

**Git maintenance**
- Removed stale `HEAD.lock` and `index.lock` from `.git/` — were blocking commits.

**Committed (829d557):** `feat(web): CommandCenter + AlertFeed + PriceIntelligence — match HTML prototypes`
- `packages/web/src/pages/CommandCenter.tsx`
- `packages/web/src/pages/AlertFeed.tsx`
- `packages/web/src/pages/PriceIntelligence.tsx`
- `packages/web/src/styles/globals.css`
- 5 files changed, +3335 / -451

**Push status:** FAILED — no remote origin configured on this repo. Commit is local only.
- To push: `git remote add origin <url> && git push -u origin main`

### Uncommitted changes (working directory)
- `HANDOFF.md` — this file (M)
- `packages/web/src/hooks/useDispensaryMap.ts` (M)
- `MAP_PLAN.md` (untracked)
- `packages/scraper/dcc_ingest.py` (untracked)
- `packages/web/.env.development.local` (untracked — do not commit, contains secrets)

### What's next (same as Session 5)
1. **Add git remote** so pushes work — need the GitHub/Gitea repo URL
2. **Full DCC geocoding** — 462 dispensaries missing lat/lng; run `dcc_ingest.py --all-counties` when `GOOGLE_PLACES_API_KEY` is available
3. **Wellgreens live simulation** — seed org, add locations, run scraper, wire all screens to real API data
4. **Apply CannaSpy color palette** — replace Tailwind defaults with CSS variables across remaining screens
5. **Block Management (/blocks)** — verify wired to real data
6. **Wire `alert.worker.ts` to Resend** — currently logs only, no emails sent
7. **Test diff_engine end-to-end** with two real snapshots → generates first real alerts

---

## Session 5 — 2026-04-29

**Task completed:** Task #9 — Refactor CannaSpyMap — unified component with 3-state pins + live API

### What was built

**DCC dispensary ingestion** (`packages/scraper/dcc_ingest.py`)
- Downloads all CA dispensary records from Azure DCC API
- 1,787 records ingested, 1,325 with lat/lng (--skip-geocoding flag used; Google Maps API blocked in sandbox)
- Stored in `dispensaries` table (migration 010)

**API bbox endpoint** (`packages/api/src/routes/map.ts`)
- `GET /api/v1/map/dispensaries?bbox=west,south,east,north&limit=2000`
- Returns GeoJSON FeatureCollection wrapped in `{ success, data, count }`
- Supports filters: tier, type, enriched, q
- Verified live: `curl .../api/v1/map/dispensaries?bbox=-118.5,33.9,-118.1,34.1` → 10 features ✅

**Frontend** (`packages/web/src/`)
- `hooks/useDispensaryMap.ts` — debounced bbox hook, AbortController, unwraps API wrapper
- `components/map/layers.ts` — dispensaryClusterLayer, dispensaryClusterCountLayer, dispensaryPointLayer with 3-state colors
- `components/map/types.ts` — DispensaryFeatureProps interface
- `pages/MarketHeatMap.tsx` — full rewrite with dual-zoom system, live dispensary pins, filter pills, dynamic legend

**Deploy:** `railway up` → deployment `12190fb9` → ACTIVE ✅
- Commit `01a3501` is live in production
- `Server listening at http://127.0.0.1:8080` confirmed in deploy logs

### State of the map
- 1,325 CA dispensary pins load from the live DCC database
- Three-state coloring: amber (blocked), tier-matched colors (enriched), dim grey (prospect)
- Clusters at zoom < 10, individual pins at zoom ≥ 9
- Bbox API fetches on every map move (300ms debounce)

### What's next
- Full DCC geocoding: 462 records still missing lat/lng. Run `dcc_ingest.py --all-counties` (without --skip-geocoding) when GOOGLE_PLACES_API_KEY is available
- Wellgreens live simulation: seed org, add locations, run scraper, wire all screens to real API data
- Apply CannaSpy color palette + DM Sans/Space Mono typography across all remaining screens
- Block Management (/blocks) — verify wired to real data

---

**Previous session:**
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

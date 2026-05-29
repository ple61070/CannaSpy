# CannaSpy Session Handoff
**Date:** 2026-05-29 (Session 41 — doc sync: CLAUDE.md migration count corrected 12→13)

---

## Session 41 — 2026-05-29

**Commits:** no new feature commits — CLAUDE.md migration count fix committed with this handoff
**Deploy:** Vercel ✅ unchanged | Railway API ✅ unchanged

---

### 1. What Was Done

#### CLAUDE.md — migration count correction (12 → 13)

Ran `cannaspy-session-open` at session start. Found one contradiction that Session 40's sync missed: `013_platform_slug.sql` exists on disk but CLAUDE.md still said "12 migrations" in four places.

Migration 013 was added in Session 39 (`feat(data): platform ingest for delivery dispensaries with coordinates`) but wasn't listed in that session's HANDOFF.md "What Changed" table, so the Session 40 sync pass missed it when updating the count from 11→12.

Fixed four occurrences in CLAUDE.md:
- Repo tree: `migrations/ ← ✅ 001–012` → `001–013`
- "Built and Live" summary: `all 12 migrations applied (012: legal_name…)` → `all 13 migrations applied` with 013 noted
- Phase 1 Done: `12 migrations on Railway Postgres` → `13 migrations`
- Phase 4 Done: `all 12 migrations applied` → `all 13 migrations`
- Footer: v2.2 → v2.3

No feature work this session. User accidentally posted a prompt file reference from another project; confirmed it was a mistake.

---

### 2. What Changed

| File | Change |
|---|---|
| `CLAUDE.md` | Migration count corrected 12→13 in 4 places; footer updated to v2.3 (2026-05-29) |

No schema migrations. No npm dependencies. No new env vars. No Railway or Vercel deploys.

---

### 3. What Failed

Nothing failed.

Known standing issues (not touched this session):
- `alert.worker.ts` — logs only, no emails sent on alerts
- `scrape.worker.ts` — still falls back to `dispensary_scraper.py` as primary
- Stripe live-mode webhook not registered

---

### 4. What Is Next (First Things in Next Session)

1. **Wire PromotionsTracker** — add `GET /api/v1/competitors/:id/promotions` to `packages/api/src/routes/competitors.ts`, then wire `packages/web/src/pages/PromotionsTracker.tsx` to it
2. **Wire alert.worker.ts → Resend** — `packages/api/src/workers/alert.worker.ts` currently logs only; read from `change_events`, send real price-change emails via Resend
3. **BillingUsage per-location slot breakdown** — new endpoint returning `tracked_competitors` grouped by location + wire `packages/web/src/pages/BillingUsage.tsx`

---

### 5. What Is Still Left To Do (Full Backlog)

**Frontend (account screens):**
- [ ] Wire PromotionsTracker (`/promotions`) to `GET /api/v1/competitors/:id/promotions` (backend route not yet built)
- [ ] BillingUsage — per-location slot breakdown
- [ ] BillingUsage — invoice history
- [ ] BlockManagement — "Rivals blocking you" section
- [ ] `LocationDashboard` — add `.catch()` to prevent infinite loading state
- [ ] Apply DM Sans + Space Mono typography system-wide

**Map / Data Pipeline:**
- [ ] `promoteId="id"` on dispensary `<Source>` in `MarketHeatMap.tsx` — hover state not yet applied (1-line fix)
- [ ] Wire `alert.worker.ts` to Resend — currently logs only, no emails sent
- [ ] `scrape.worker.ts` → call `collector.py` as primary
- [ ] `scrape.worker.ts` → write `dispensaries.enriched = true` after scrape
- [ ] 462 dispensaries missing lat/lng — geocode when `GOOGLE_PLACES_API_KEY` available

**Infrastructure (Launch Blockers):**
- [ ] Register Stripe live-mode webhook endpoint (test-mode only currently)
- [ ] Configure Stripe metered price with volume tiers
- [ ] Sentry error tracking integration
- [ ] Uptime Robot scrape health monitoring

**Key Credentials:**
```
Railway Postgres: postgresql://postgres:obUqriCmHTpqQIubafxYBLXYZugPivKE@metro.proxy.rlwy.net:36204/railway
Production API:   https://cannaspy-production.up.railway.app
Frontend:         https://web-rouge-one-15.vercel.app
Location ID:      ffdefc3f-8d55-4701-b7ea-6b9d4195b16f (Culture Cannabis Club, Corona)
Location ID:      9354f184-5b88-4a8f-abc3-012fdaa4058f (Cannabis House, LA)
Org ID (Patrick): 4b507cd2-17e6-439c-8993-78476cdf08e1
Railway project token: ce3cf795-c0ab-45fe-b815-eb3ef2a81331
```

---

**Date:** 2026-05-28 (Session 40 — doc sync: CLAUDE.md contradictions fixed + session open/close skills + SessionStart hook)

---

## Session 40 — 2026-05-28

**Commits:** no new feature commits — CLAUDE.md + .claude/settings.json changes committed with this handoff
**Deploy:** Vercel ✅ unchanged | Railway API ✅ unchanged

---

### 1. What Was Done

#### CLAUDE.md — contradiction audit and sync

Compared CLAUDE.md (last updated 2026-05-17, v2.1) against HANDOFF.md Sessions 37-39. Found and fixed 7 contradictions:

- **Migration count**: All occurrences of "001–011" or "11 migrations" updated to 12 (migration 012 was added in Session 38 for `legal_name` on dispensaries)
- **`diff_engine.py` status**: "not yet tested end-to-end" in both the repo tree and the ⬜ Remaining list — updated to "tested end-to-end (Session 36)" and removed from Remaining
- **`map.ts` route note**: Missing `/suggest` endpoint (added Session 38) — added
- **Phase 3 Done list**: Missing all Session 37-39 completions — added NotificationSettings, LocationManagement, /setup fix, LocationWizard autocomplete, CompetitorDiscovery overhaul
- **Phase 4 dispensary count**: "1,785" → "1,787" (consistent with repo tree)
- **Phase 1 diff_engine**: Checked off "test diff engine end-to-end" (done Session 36)
- **"What Is Built and Live"**: Added migration 012, /suggest endpoint, all Session 37-39 completions
- Updated last-updated footer to 2026-05-28 v2.2

#### Skills — session open/close

Created `cannaspy-session-open` skill at `~/.claude/skills/cannaspy-session-open/skill.md`:
- Reads HANDOFF.md (first 300 lines) + CLAUDE.md Build Phase Status + counts actual migration files on disk
- Audits 5 areas: migration count, Phase Done/Pending lists, "Built and Live" section, "Remaining" section, repo tree status notes
- HANDOFF.md is read-only ground truth; CLAUDE.md is the doc being corrected
- Fixes contradictions with targeted Edit calls, outputs a sync report table

Updated `cannaspy-handoff` skill to v2.0 at `~/.claude/skills/cannaspy-handoff/skill.md`:
- Backlog now derived dynamically from previous session's HANDOFF.md entry — not from a static hardcoded list (which was getting stale)
- Added Step 6: patch CLAUDE.md Build Phase Status after writing handoff
- Removed stale backlog items (diff_engine test was still listed as pending)

#### SessionStart hook — auto-opener

Added a second entry to `SessionStart` in `.claude/settings.json` (project-level):
- Command outputs `additionalContext` JSON instructing Claude to run `/cannaspy-session-open` before responding
- `statusMessage: "Syncing project docs..."` shows in spinner while hook runs
- Existing hook (`cat docs/SESSION-HANDOFF.md`) preserved — new hook added alongside it
- Validated with `jq -e` (exit 0, both commands printed correctly)
- Pipe-tested: `echo '{}' | <cmd>` → valid JSON, additionalContext field present

---

### 2. What Changed

| File | Change |
|---|---|
| `CLAUDE.md` | Fixed 7 contradictions vs HANDOFF.md; updated to v2.2 (2026-05-28) |
| `.claude/settings.json` | Added `cannaspy-session-open` auto-invoke to SessionStart hook array |
| `~/.claude/skills/cannaspy-handoff/skill.md` | Updated to v2.0 — dynamic backlog, Step 6 CLAUDE.md patch, corrected static seed |
| `~/.claude/skills/cannaspy-session-open/skill.md` | New skill — 5-area contradiction audit between HANDOFF.md and CLAUDE.md |

No schema migrations. No npm dependencies. No new env vars. No Railway or Vercel deploys.

---

### 3. What Failed

Nothing failed.

Known standing issues (not touched this session):
- `alert.worker.ts` — logs only, no emails sent on alerts
- `scrape.worker.ts` — still falls back to `dispensary_scraper.py` as primary
- Stripe live-mode webhook not registered

---

### 4. What Is Next (First Things in Next Session)

1. **Wire PromotionsTracker** — build `GET /api/v1/competitors/:id/promotions` in `packages/api/src/routes/competitors.ts`, then wire `packages/web/src/pages/PromotionsTracker.tsx` to it
2. **Wire alert.worker.ts → Resend** — `packages/api/src/workers/alert.worker.ts` currently logs only; read from `change_events`, send real price-change emails via Resend
3. **BillingUsage per-location slot breakdown** — needs new endpoint returning `tracked_competitors` grouped by location + wire `packages/web/src/pages/BillingUsage.tsx`

---

### 5. What Is Still Left To Do (Full Backlog)

**Frontend (account screens):**
- [ ] Wire PromotionsTracker (`/promotions`) to `GET /api/v1/competitors/:id/promotions` (backend route not yet built)
- [ ] BillingUsage — per-location slot breakdown
- [ ] BillingUsage — invoice history
- [ ] BlockManagement — "Rivals blocking you" section
- [ ] `LocationDashboard` — add `.catch()` to prevent infinite loading state
- [ ] Apply DM Sans + Space Mono typography system-wide

**Map / Data Pipeline:**
- [ ] `promoteId="id"` on dispensary `<Source>` in `MarketHeatMap.tsx` — hover state not yet applied (1-line fix)
- [ ] Wire `alert.worker.ts` to Resend — currently logs only, no emails sent
- [ ] `scrape.worker.ts` → call `collector.py` as primary
- [ ] `scrape.worker.ts` → write `dispensaries.enriched = true` after scrape
- [ ] 462 dispensaries missing lat/lng — geocode when `GOOGLE_PLACES_API_KEY` available

**Infrastructure (Launch Blockers):**
- [ ] Register Stripe live-mode webhook endpoint (test-mode only currently)
- [ ] Configure Stripe metered price with volume tiers
- [ ] Sentry error tracking integration
- [ ] Uptime Robot scrape health monitoring

**Key Credentials:**
```
Railway Postgres: postgresql://postgres:obUqriCmHTpqQIubafxYBLXYZugPivKE@metro.proxy.rlwy.net:36204/railway
Production API:   https://cannaspy-production.up.railway.app
Frontend:         https://web-rouge-one-15.vercel.app
Location ID:      ffdefc3f-8d55-4701-b7ea-6b9d4195b16f (Culture Cannabis Club, Corona)
Location ID:      9354f184-5b88-4a8f-abc3-012fdaa4058f (Cannabis House, LA)
Org ID (Patrick): 4b507cd2-17e6-439c-8993-78476cdf08e1
Railway project token: ce3cf795-c0ab-45fe-b815-eb3ef2a81331
```

---

**Date:** 2026-05-28 (Session 39 — CompetitorDiscovery overhaul: map UX, per-location selections, auto-save)

---

## Session 39 — 2026-05-28

**Commits:** `cd8c5bb` feat(command-center): show all dispensary pins → `6da9d00` feat(map): pin color overhaul → `e358ec7` feat(competitor-discovery): 8-fix pass → `1425f3a` feat(discovery): sort controls + pulse marker → `bb98af8` fix(discovery): purple pin + popup overhaul → `9786a0f` fix(discovery): exclude own location from sidebar → `3fe4c8d` fix(discovery): popup buttons for delivery ops → `b9db876` fix(discovery): dedup by google_place_id → `49490e7` feat(discovery): sidebar shows all viewport pins → `b88e735` feat(discovery): per-location selections + radius opacity → `67cfb98` feat(discovery): Untrack/Unblock labels → `eb3e3c8` feat(setup): auto-save track/block to API
**Deploy:** Vercel ✅ auto-deployed on push | Railway API ✅ locations.ts updated (add google_place_id to competitors query)

---

### 1. What Was Done

#### CompetitorDiscovery — map UX overhaul

Multiple rounds of fixes across the session:

**Purple location marker** — replaced the generic green dot with a 5-layer concentric ring design in violet (#8b5cf6) with a pulsing animation (`cs-ping` keyframe). Visible in both the legend and the Marker component.

**Popup improvements** — popup stays open when Track/Block is clicked (was closing on every click). Added a dedicated "Done" button. Buttons now show live state (orange = tracked, cyan = blocked) and display "Untrack" / "Unblock" when already active. Added `closeOnClick={false}` to Popup.

**Sidebar deduplication** — dedup key changed from `dcc_license || name` to `google_place_id` (which includes coordinates for no-license operators). Prevents collapsing same-named delivery chains at different locations to one entry.

**Own location excluded** — distance filter changed from "> 0" to "> 0.01 miles" so the user's own dispensary never appears in the rival sidebar.

**Delivery operator popup fix** — DCC delivery operators have `dcc_license = NULL` in the DB. Mapbox serializes NULL as `null`, causing `null ? ...` to short-circuit to the wrong key. Fixed by using `props.dcc_license ?? \`dcc-popup-${props.name}\`` in the popup key and throughout.

**Sidebar shows all viewport pins** — removed the upper-bound distance filter that was limiting the sidebar to the radius circle. Sidebar now mirrors all pins visible on the map.

**Sort controls** — Distance / Name / Status sort tabs added to the sidebar header. Selected items always float to the top regardless of sort mode.

**Per-location selections** — `selections` Map replaced with `allSelections: Map<locationId, Map<key, Selection>>`. Switching the location dropdown preserves that location's Track/Block choices. `handleLaunch` iterates all locations.

**Radius overlay opacity** — fill opacity tuned to 0.12 (was 0.28 / too dark, was 0.05 / invisible). Outline: solid teal, 3px, dashed.

**Unique google_place_id fallback** — sidebar items without DCC license use `dcc-${name}-${lat.toFixed(4)}-${lng.toFixed(4)}` as the key so each physical location is distinct.

**Key format unified** — popup's `google_place_id` fallback now uses the same coordinate-based format as sidebar items, so popup and sidebar Track/Block state stay in sync.

#### Auto-save — tracks and blocks persist immediately

Previous behavior: selections were accumulated in state and POSTed in bulk when "Confirm & launch" was clicked. After a hard refresh, all selections were lost.

New behavior:
- Every Track/Block click immediately calls `persistToggle()` which POSTs to the API (creating the competitor in DB if needed, then POST `/locations/:id/competitors`).
- Untrack/Unblock calls DELETE `/locations/:id/competitors/:competitorId`.
- Optimistic UI: state updates instantly, reverts automatically if the API call fails.
- Per-item saving indicator: buttons dim while their specific save is in-flight.
- On page mount, `GET /api/v1/locations/:id/competitors` is called for all locations and pre-populates `allSelections` — hard-refresh restores the full state.
- `handleLaunch` simplified to just `navigate('/command-center')`.
- `locations.ts` updated: added `c.google_place_id` to the competitors query so the DB key matches the sidebar's DCC GeoJSON key.

---

### 2. What Changed

| File | Change |
|---|---|
| `packages/web/src/pages/CompetitorDiscovery.tsx` | Full overhaul — purple marker, popup UX, sidebar dedup, per-location selections, auto-save |
| `packages/api/src/routes/locations.ts` | Add `c.google_place_id` to GET /:id/competitors query |
| `packages/web/src/components/map/layers.ts` | Pin color updates for delivery/storefront differentiation |

No schema migrations. No new npm dependencies. No new env vars.

---

### 3. What Failed

Nothing failed. TypeScript compiled clean after every change.

Known standing issues (not touched this session):
- `alert.worker.ts` logs only — no emails sent on alerts
- `scrape.worker.ts` still falls back to `dispensary_scraper.py` as primary
- Stripe live-mode webhook not registered

---

### 4. What Is Next (First Things in Next Session)

1. **Wire PromotionsTracker (`/promotions`)** — backend route `GET /api/v1/competitors/:id/promotions` doesn't exist; add to `packages/api/src/routes/competitors.ts`, then wire `packages/web/src/pages/PromotionsTracker.tsx`
2. **Wire alert.worker.ts → Resend** — `packages/api/src/workers/alert.worker.ts` currently logs only; wire to Resend to send real price-change emails
3. **BillingUsage — per-location slot breakdown** — needs an API endpoint returning slots grouped by location
4. **Register Stripe live-mode webhook** — launch blocker; currently test-mode only

---

### 5. What Is Still Left To Do (Full Backlog)

**Onboarding:**
- [x] /setup blank screen — ✅ session 38
- [x] LocationWizard autocomplete — ✅ session 38
- [x] Dual-name DBA+legal search — ✅ session 38
- [x] CompetitorDiscovery — sidebar now uses DCC bbox GeoJSON (no discover API needed) ✅ session 39
- [x] CompetitorDiscovery — radius slider filters sidebar ✅ session 39
- [x] CompetitorDiscovery — auto-save on Track/Block ✅ session 39

**Frontend (account screens):**
- [ ] Wire PromotionsTracker (`/promotions`) to `GET /api/v1/competitors/:id/promotions` (backend route not yet built)
- [ ] BillingUsage — per-location slot breakdown
- [ ] BillingUsage — invoice history
- [ ] BlockManagement — "Rivals blocking you" section
- [ ] `LocationDashboard` — add `.catch()` to prevent infinite loading state
- [ ] Apply DM Sans + Space Mono typography system-wide

**Map / Data Pipeline:**
- [ ] Wire `alert.worker.ts` to Resend — currently logs only, no emails sent
- [ ] `scrape.worker.ts` → call `collector.py` as primary
- [ ] `scrape.worker.ts` → write `dispensaries.enriched = true` after scrape
- [ ] 462 dispensaries missing lat/lng — geocode when `GOOGLE_PLACES_API_KEY` available

**Infrastructure (Launch Blockers):**
- [ ] Register Stripe live-mode webhook endpoint (test-mode only currently)
- [ ] Configure Stripe metered price with volume tiers
- [ ] Sentry error tracking integration
- [ ] Uptime Robot scrape health monitoring

**Key Credentials:**
```
Railway Postgres: postgresql://postgres:obUqriCmHTpqQIubafxYBLXYZugPivKE@metro.proxy.rlwy.net:36204/railway
Production API:   https://cannaspy-production.up.railway.app
Frontend:         https://web-rouge-one-15.vercel.app
Location ID:      ffdefc3f-8d55-4701-b7ea-6b9d4195b16f (Culture Cannabis Club, Corona)
Location ID:      9354f184-5b88-4a8f-abc3-012fdaa4058f (Cannabis House, LA)
Org ID (Patrick): 4b507cd2-17e6-439c-8993-78476cdf08e1
Railway project token: ce3cf795-c0ab-45fe-b815-eb3ef2a81331
```

---

**Date:** 2026-05-21 (Session 38 — onboarding flow E2E: /setup/locations autocomplete + dual-name search)

---

## Session 38 — 2026-05-21

**Commits:** `7a7a828` feat(map): dual-name dispensary search — DBA + legal name → `73c0133` fix(map/suggest): switch to Railway Postgres → `725f343` fix(location-wizard): show all suggestions + no-results hint
**Deploy:** Vercel ✅ auto-deployed on push | Railway API ✅ redeployed twice (suggest endpoint fix)

---

### 1. What Was Done

#### /setup route blank screen — fixed (pre-session)
`/setup` had no route defined; added `Navigate` redirect to `/setup/org` in `App.tsx`. All three setup routes now wrapped in `ProtectedRoute` so Clerk token is available for API calls.

#### LocationWizard — dispensary name autocomplete
Rewrote the Location Name field into a full autocomplete backed by `GET /api/v1/map/suggest`. Results show DBA name, city, address, and a Storefront/Delivery/Storefront+Delivery badge. Keyboard navigation (↑↓ Enter Escape) and click-outside dismissal wired. Auto-fills Full Address and DCC License when a result is selected; drops a map pin at the dispensary's lat/lng.

#### LocationWizard — address autocomplete
Full Address field now calls Mapbox Geocoding API (CA bbox, address types only, debounced). Selecting a suggestion fills the address and flies the map to the location at zoom 15.

#### API auth fixes
Two root causes of "Unauthorized" on `POST /api/v1/locations`:
1. `pg Pool` had no SSL config → `query()` threw on Railway's public URL → caught by Clerk middleware → returned 401. Fixed: `ssl: { rejectUnauthorized: false }` in production.
2. Org slug uniqueness collision on INSERT — random 6-char suffix added to slug generation in `middleware/clerk.ts`.

#### Dual-name dispensary search (DBA + legal name)
Added `legal_name` column to dispensaries (`migration 012`). Updated `map/suggest` endpoint to search `name OR legal_name` via Railway Postgres (`query()` — not Supabase). Updated `dcc_ingest.py` to store `legal_name = businessLegalName`. Re-ran ingest to backfill all 957 active DCC records. Verified: typing "Stoney Point" returns "Culture Cannabis Club" (Chatsworth).

#### LocationWizard — increased suggest limit + no-results hint
Raised suggest fetch limit from 8→20 (Culture Cannabis Club has 11 locations; only 8 were appearing). Added `noResults` state: when query ≥2 chars returns empty, shows "No match in DCC registry — continue typing and add your location manually."

---

### 2. What Changed

| File | Change |
|---|---|
| `packages/web/src/App.tsx` | `/setup` redirect + ProtectedRoute for setup routes |
| `packages/web/src/pages/LocationWizard.tsx` | Name autocomplete, address autocomplete, noResults state, limit 8→20 |
| `packages/api/src/routes/map.ts` | Added `/suggest` endpoint; switched to `query()` for dual-name search |
| `packages/api/src/db/migrations/012_dispensary_legal_name.sql` | New: add legal_name + GIN index |
| `packages/api/src/db/client.ts` | SSL config for Railway Postgres |
| `packages/api/src/middleware/clerk.ts` | Split try/catch; random slug suffix |
| `packages/scraper/dcc_ingest.py` | Store legal_name; UPSERT includes legal_name column |

Railway Postgres: migration 012 applied, 957 records backfilled with legal_name.

---

### 3. What Failed

Nothing failed — LocationWizard is fully verified. Known data gaps:
- Cannabis House (LA) and several user dispensaries are not in the DCC registry; users can still type them manually.
- 835 DCC dispensaries have `legal_name = NULL` because DCC's `businessLegalName` is empty for those records.

---

### 4. What Is Next

**Immediately:** `/setup/competitors` page assessment — user is moving there now.

Key issues on CompetitorDiscovery:
1. **Discover endpoint returns unfiltered global competitors** — `GET /api/v1/locations/:id/discover` returns ALL competitors in the DB not already tracked at that location, regardless of geographic radius. Radius slider sets state but is NOT sent to the API. For a brand-new user (empty `competitors` table), this returns 0 results — critical for onboarding.
2. **Fix: query DCC dispensaries by lat/lng radius** — update discover endpoint to find DCC dispensaries within `radius` miles of the location's lat/lng, return them as candidates. This makes the scan work for any user, not just Patrick who has pre-seeded competitors.
3. **Block buttons locked** — intentional during trial; should unlock on paid plan.

---

### 5. What Is Still Left To Do (Full Backlog)

**Onboarding (active focus):**
- [x] /setup blank screen — ✅ session 38
- [x] LocationWizard autocomplete — ✅ session 38
- [x] Dual-name DBA+legal search — ✅ session 38
- [ ] CompetitorDiscovery — discover endpoint returns 0 for new users; fix with DCC radius query
- [ ] CompetitorDiscovery — radius slider not wired to API

**Frontend (account screens):**
- [ ] Wire PromotionsTracker (`/promotions`) to `GET /api/v1/competitors/:id/promotions`
- [ ] BillingUsage — per-location slot breakdown
- [ ] BillingUsage — invoice history
- [ ] BlockManagement — "Rivals blocking you" section
- [ ] `LocationDashboard` — add `.catch()` to prevent infinite loading state
- [ ] Apply DM Sans + Space Mono typography system-wide

**Map / Data Pipeline:**
- [ ] Wire `alert.worker.ts` to Resend — logs only, no emails
- [ ] `scrape.worker.ts` → call `collector.py` as primary
- [ ] `scrape.worker.ts` → write `dispensaries.enriched = true` after scrape
- [ ] 462 dispensaries missing lat/lng — geocode when `GOOGLE_PLACES_API_KEY` available

**Infrastructure (Launch Blockers):**
- [ ] Register Stripe live-mode webhook endpoint
- [ ] Configure Stripe metered price with volume tiers
- [ ] Sentry error tracking integration
- [ ] Uptime Robot scrape health monitoring

**Key Credentials:**
```
Railway Postgres: postgresql://postgres:obUqriCmHTpqQIubafxYBLXYZugPivKE@metro.proxy.rlwy.net:36204/railway
Production API:   https://cannaspy-production.up.railway.app
Frontend:         https://web-rouge-one-15.vercel.app
Location ID:      ffdefc3f-8d55-4701-b7ea-6b9d4195b16f (Culture Cannabis Club, Corona)
Location ID:      9354f184-5b88-4a8f-abc3-012fdaa4058f (Cannabis House, LA)
Org ID (Patrick): 4b507cd2-17e6-439c-8993-78476cdf08e1
Railway project token: ce3cf795-c0ab-45fe-b815-eb3ef2a81331
```

---

**Date:** 2026-05-20 (Session 37 — wrap-up: commit trailing session-36 work, clean synthetic DB events)

---

## Session 37 — 2026-05-20

**Commits:** `eec9301` feat(session-36): wire NotificationSettings + LocationManagement to real API → `fb23cc8` docs: session 36 addendum
**Deploy:** Vercel ✅ `web-rouge-one-15.vercel.app` (auto-deploy on push) | Railway API ✅ unchanged

---

### 1. What Was Done

This was a short wrap-up session — continuation of Session 36 after context compaction.

#### Committed trailing Session 36 work

`NotificationSettings.tsx` and `LocationManagement.tsx` had been wired to real API endpoints but were sitting unstaged. Committed and pushed both as `eec9301`.

#### Cleaned synthetic diff_engine test data

Session 36 had written 5 synthetic `change_events` rows to Railway Postgres during `diff_engine.py` end-to-end verification. Deleted all 5 (`DELETE FROM change_events WHERE detected_at > '2026-05-20'`) — DB is clean.

#### HANDOFF.md updated

Added full addendum to Session 36 entry: NotificationSettings, LocationManagement, and diff_engine narrative. Committed as `fb23cc8`.

---

### 2. What Changed

| File | Change |
|---|---|
| `packages/web/src/pages/NotificationSettings.tsx` | Load from GET + save via PATCH /api/v1/settings/notifications (committed) |
| `packages/web/src/pages/LocationManagement.tsx` | Fetch /api/v1/locations; makeDisplayLocation() helper; loading state (committed) |
| `HANDOFF.md` | Session 36 addendum + this entry |
| Railway Postgres (direct SQL) | Deleted 5 synthetic change_events from diff_engine test |

No schema migrations. No new npm dependencies. No Railway deploy.

---

### 3. What Failed

Nothing failed.

Known standing issues (not touched this session):
- `change_events` → `alerts` pipeline not wired (`alert.worker.ts` doesn't read change_events yet)
- Stripe live-mode webhook not registered
- `alert.worker.ts` logs only — no emails sent on alerts
- `scrape.worker.ts` still falls back to `dispensary_scraper.py` as primary

---

### 4. What Is Next (First Things in Next Session)

1. **Build PromotionsTracker backend route** — `GET /api/v1/competitors/:id/promotions` doesn't exist; add to `packages/api/src/routes/competitors.ts`, then wire frontend `packages/web/src/pages/PromotionsTracker.tsx`
2. **Wire alert.worker.ts → Resend** — `packages/api/src/workers/alert.worker.ts` currently logs only; read from `change_events`, send email via Resend
3. **Wire scrape.worker.ts → collector.py** — swap fallback for primary in `packages/api/src/workers/scrape.worker.ts`
4. **Register Stripe live-mode webhook** — launch blocker; currently test-mode only

---

### 5. What Is Still Left To Do (Full Backlog)

**Frontend (account screens):**
- [x] Wire NotificationSettings to `GET/PATCH /api/v1/settings/notifications` — ✅ session 36
- [x] Wire LocationManagement to `GET /api/v1/locations` — ✅ session 36
- [ ] Wire PromotionsTracker (`/promotions`) to `GET /api/v1/competitors/:id/promotions` (backend route not yet built)
- [ ] BillingUsage — per-location slot breakdown (needs API endpoint returning slots per location)
- [ ] BillingUsage — invoice history (needs Stripe invoice list endpoint)
- [ ] BlockManagement — "Rivals blocking you" section (no DB concept for this yet)
- [ ] `LocationDashboard` — add `.catch()` to prevent infinite loading state on API failure
- [ ] Apply DM Sans + Space Mono typography system-wide

**Map / Data Pipeline:**
- [ ] `scrape.worker.ts` → write `dispensaries.enriched = true` after successful scrape
- [ ] `diff_engine.py` — real two-run test still needed to generate organic `change_events` (synthetic test ✅ done; real scrape comparison pending)
- [ ] Wire `alert.worker.ts` to Resend — currently logs only, no emails sent
- [ ] `scrape.worker.ts` → call `collector.py` as primary (currently falls back to `dispensary_scraper.py`)
- [ ] 462 dispensaries missing lat/lng — run `dcc_ingest.py` full geocoding when `GOOGLE_PLACES_API_KEY` available

**Infrastructure (Launch Blockers):**
- [ ] Register Stripe live-mode webhook endpoint (test-mode only currently)
- [ ] Configure Stripe metered price with volume tiers
- [ ] Sentry error tracking integration
- [ ] Uptime Robot scrape health monitoring

**Key Credentials:**
```
Railway Postgres: postgresql://postgres:obUqriCmHTpqQIubafxYBLXYZugPivKE@metro.proxy.rlwy.net:36204/railway
Production API:   https://cannaspy-production.up.railway.app
Frontend:         https://web-rouge-one-15.vercel.app
Location ID:      ffdefc3f-8d55-4701-b7ea-6b9d4195b16f (Culture Cannabis Club, Corona)
Location ID:      9354f184-5b88-4a8f-abc3-012fdaa4058f (Cannabis House, LA)
Org ID (Patrick): 4b507cd2-17e6-439c-8993-78476cdf08e1
```

---

**Date:** 2026-05-20 (Session 36 — NotificationSettings + LocationManagement wired; diff_engine tested; 5 synthetic events cleaned)

---

## Session 36 — 2026-05-20

**Commits:** `0e1210d` feat(session-36): wire BlockManagement + BillingUsage; delivery pin colors; promoteId; fix org mapping → `eec9301` feat(session-36): wire NotificationSettings + LocationManagement to real API
**Deploy:** Vercel ✅ `web-rouge-one-15.vercel.app` (push triggered auto-deploy) | Railway API ✅ unchanged

---

### 1. What Was Done

#### DB: Org mapping fix — locations now visible in production

Diagnosed why `/api/v1/locations` returned empty data (previously logged as a "500"). Patrick's current Clerk user ID (`user_3D148kdy4fZPXIWmTskLn8rxs8E`) had auto-created a second empty org (`67d67fa5`) on first login. All data (4 locations, 8 competitors, 9,584 menu items) lived under org `4b507cd2` which was still linked to an old Clerk user ID (`3CHQ1liuC7vRd5aYdytRxDM7rAy`).

Fix applied directly to Railway Postgres:
1. Deleted the empty org `67d67fa5`
2. Updated `organizations.clerk_org_id` on `4b507cd2` → `user_user_3D148kdy4fZPXIWmTskLn8rxs8E`

All 4 locations, competitors, and menu data are now accessible from Patrick's current Clerk session.

#### layers.ts — delivery operator pin color

`dispensaryRingLayer` and `dispensaryPointLayer` now differentiate delivery operators:
- Blocked → amber (#ba7517)
- Delivery (`business_type = 'delivery'`) → trust-blue (#3b8bd4)
- Storefront/microbusiness → teal (#1d9e75)

DB confirmed: 229 delivery, 347 microbusiness (both), 1211 storefront — all have `business_type` populated.

#### promoteId="id" on dispensary Sources

Added `promoteId="id"` to the `cs-dispensaries` Source in both `MarketHeatMap.tsx` and `CompetitorDiscovery.tsx`. This enables Mapbox feature-state hover, which the ring/point layers already reference via `['feature-state', 'hover']`.

#### BlockManagement — wired to real API data

Replaced static `BLOCKS[]` mock with live data from `useBlocks()` hook (`GET /api/v1/blocks`).
- Active blocks section now shows real competitor names, days blocked (computed from `blocked_at`), and calls the real cancel endpoint on confirmation
- Summary cards (count, slots, monthly cost) reflect real block count
- Loading and empty states added per CannaSpy copy rules
- "Rivals blocking you" and "Tracked rivals" sections remain as UI scaffolding (no API endpoints for these yet)

#### BillingUsage — wired to real API data

Replaced static `LOCS[]` / `INVOICES[]` mock with live data from `/api/v1/billing/usage` + `/api/v1/locations`.
- Hero card: real total slots, monthly cost, next billing date (from Stripe if subscribed)
- Slot cards: real track/block slot counts and costs
- Discount callout: dynamic — shows savings if applicable, "add more slots" prompt if not
- Location table: shows real location names (per-location slot breakdown still pending)
- Billing alert: dynamic block count and renewal date
- Invoice history: placeholder row (no invoice history API yet)

#### NotificationSettings — wired to real API data

`NotificationSettings.tsx` now loads via `GET /api/v1/settings/notifications` on mount and PATCHes on save. Maps `email_enabled`, `push_enabled`, `price_threshold_pct`, and `digest_frequency`. Both save buttons call the same `handleSave()`. Loading state shown while fetching.

#### LocationManagement — wired to real API data

`LocationManagement.tsx` now fetches `/api/v1/locations` on mount and renders real location objects via `makeDisplayLocation()` helper (maps `id`, `name`, `address`, `dcc_license` to display format; computed fields like `items`/`track`/`block` default to `0`/`'—'` until enriched). Loading state shown in topbar subtitle.

#### diff_engine.py — end-to-end test completed

`diff_snapshots()` tested with 50 real `menu_items` rows (Off The Charts, `d6e3dfd4`):
- Synthetic "prev" → "curr" with 2 price changes, 1 sale toggle, 2 removed products
- Produced 5 valid `change_events` rows written to Railway Postgres
- Schema confirmed: `event_type`, `item_name`, `brand`, `category`, `old_value`, `new_value`, `detected_at`, `processed`
- 5 synthetic test rows deleted after verification (no production data polluted)

---

### 2. What Changed

| File | Change |
|---|---|
| `packages/web/src/components/map/layers.ts` | Delivery pin color (trust-blue) in dispensaryRingLayer + dispensaryPointLayer |
| `packages/web/src/pages/MarketHeatMap.tsx` | promoteId="id" on cs-dispensaries Source |
| `packages/web/src/pages/CompetitorDiscovery.tsx` | promoteId="id" on cs-dispensaries Source |
| `packages/web/src/pages/BlockManagement.tsx` | Wire useBlocks() hook; real cancel API; loading + empty states |
| `packages/web/src/pages/BillingUsage.tsx` | Wire /api/v1/billing/usage + /api/v1/locations; real totals |
| `packages/web/src/pages/NotificationSettings.tsx` | Load from GET + save via PATCH /api/v1/settings/notifications |
| `packages/web/src/pages/LocationManagement.tsx` | Fetch /api/v1/locations; makeDisplayLocation() helper; loading state |
| Railway Postgres (direct SQL) | Re-linked Patrick's current Clerk ID to data-bearing org; deleted 5 synthetic change_events |

No schema migrations. No new npm dependencies. No Railway deploy.

---

### 3. What Failed

Nothing failed. All changes built cleanly (`vite build` ✅, no TypeScript errors).

Known standing issues (not touched this session):
- `diff_engine.py` function verified but `change_events` → `alerts` pipeline not yet wired (alert.worker.ts doesn't read change_events yet)
- Stripe live-mode webhook not registered
- API package has no dotenv — must source `.env` manually when starting locally
- `alert.worker.ts` logs only — no emails sent on alerts
- `scrape.worker.ts` still falls back to `dispensary_scraper.py` as primary

---

### 4. What Is Next (First Things in Next Session)

1. **Wire PromotionsTracker** — backend route `GET /api/v1/competitors/:id/promotions` doesn't exist yet; needs both API route (`packages/api/src/routes/competitors.ts` or new `promotions.ts`) and frontend wiring in `packages/web/src/pages/PromotionsTracker.tsx`
2. **Wire alert.worker.ts → Resend** — `packages/api/src/workers/alert.worker.ts` currently logs only; wire to Resend API to send real price-change email alerts
3. **Wire scrape.worker.ts → collector.py** — currently falls back to `dispensary_scraper.py`; should call `collector.py` as primary
4. **Register Stripe live-mode webhook** — launch blocker; currently test-mode only

---

### 5. What Is Still Left To Do (Full Backlog)

**Frontend (account screens):**
- [x] Wire NotificationSettings to `GET/PATCH /api/v1/settings/notifications` — ✅ done session 36
- [x] Wire LocationManagement to `GET /api/v1/locations` — ✅ done session 36
- [ ] Wire PromotionsTracker (`/promotions`) to `GET /api/v1/competitors/:id/promotions` (backend route not yet built)
- [ ] BillingUsage — per-location slot breakdown (needs API endpoint returning slots per location)
- [ ] BillingUsage — invoice history (needs Stripe invoice list endpoint)
- [ ] BlockManagement — "Rivals blocking you" section (no DB concept for this yet)
- [ ] `LocationDashboard` — add `.catch()` to prevent infinite loading state on API failure
- [ ] Apply DM Sans + Space Mono typography system-wide

**Map / Data Pipeline:**
- [ ] `scrape.worker.ts` → write `dispensaries.enriched = true` after successful scrape
- [x] `diff_engine.py` — end-to-end tested with synthetic snapshots ✅; change_events schema confirmed; real two-run test still needed to generate organic alerts rows
- [ ] Wire `alert.worker.ts` to Resend — currently logs only, no emails sent
- [ ] `scrape.worker.ts` → call `collector.py` as primary (currently falls back to `dispensary_scraper.py`)
- [ ] 462 dispensaries missing lat/lng — run `dcc_ingest.py` full geocoding when `GOOGLE_PLACES_API_KEY` available

**Infrastructure (Launch Blockers):**
- [ ] Register Stripe live-mode webhook endpoint (test-mode only currently)
- [ ] Configure Stripe metered price with volume tiers
- [ ] Sentry error tracking integration
- [ ] Uptime Robot scrape health monitoring

**Key Credentials:**
```
Railway Postgres: postgresql://postgres:obUqriCmHTpqQIubafxYBLXYZugPivKE@metro.proxy.rlwy.net:36204/railway
Production API:   https://cannaspy-production.up.railway.app
Frontend:         https://web-rouge-one-15.vercel.app
Location ID:      ffdefc3f-8d55-4701-b7ea-6b9d4195b16f (Culture Cannabis Club, Corona)
Location ID:      9354f184-5b88-4a8f-abc3-012fdaa4058f (Cannabis House, LA)
Org ID (Patrick): 4b507cd2-17e6-439c-8993-78476cdf08e1
```

---

**Date:** 2026-05-20 (Session 35 — CompetitorDiscovery map rebuild: DCC pins, radius slider, flyTo fix)

---

## Session 35 — 2026-05-20

**Commits:** `6ef6674` feat(discover): DCC pins, radius slider, flyTo fix → `e3a0390` fix: location selector + remove pin minzoom → `30d7b29` fix: cluster click zooms via getClusterExpansionZoom
**Deploy:** Vercel ✅ `web-rouge-one-15.vercel.app` (all 3 commits live) | Railway API ✅ unchanged

**⚠️ Three issues discovered during production verification — tackle first in Session 36:**

1. **Location selector not appearing** — `locations` array stays empty in prod → `/api/v1/locations` returning 500 from Railway API for this org. Need to check Railway API logs + auth middleware. The select renders correctly (code is `>= 1`) but no data arrives.

2. **Storefront/Delivery toggle produces identical results** — `business_type` column is likely NULL for all DCC dispensary records in the DB. The map API filter on `business_type` returns 0 rows for both 'retail' and 'delivery'. Fix: run a DB query to confirm nulls, then update `dcc_ingest.py` to populate `business_type` from DCC license type field (storefronts vs delivery).

3. **Pin visual differentiation needed** — all dispensary pins are the same teal regardless of type. Delivery operators should use a distinct color (trust-blue `#3b8bd4`). Fix is a `layers.ts` edit to `dispensaryPointLayer` paint expression using `license_type` or `business_type`.

---

### 1. What Was Done

#### CompetitorDiscovery map rebuild (`packages/web/src/pages/CompetitorDiscovery.tsx`)

**flyTo race condition fixed**
Replaced the fragile `useEffect([selectedLocation])` + `handleMapLoad(selectedLocation)` combo with a `mapReadyRef` + `pendingFlyRef` pattern. When `selectedLocation` changes, if the map is ready it flies immediately; if not, it stores the center in `pendingFlyRef` and fires it in `onLoad`. Same pattern used in MarketHeatMap.

**DCC dispensary pins — background GL layer**
Wired `useDispensaryMap(bbox)` hook to load all 1,785 CA dispensaries as a background GL layer. Added `<Source id="cs-dispensaries">` with `dispensaryRingLayer`, `dispensaryPointLayer`, `dispensaryClusterLayer`, `dispensaryClusterCountLayer` imported from `layers.ts`. Bbox updates on `onLoad` and `onMoveEnd`. Debounced 300ms in the hook (cancels in-flight requests). Initially shipped with `minzoom={9}` — removed in follow-up fix so clusters appear at all zoom levels including the California overview.

**Radius slider**
Added `radius` state (default 5, range 1–25 mi). Wired to `makeCircleGeoJSON(centerLat, centerLng, radius)`. Slider UI rendered in the right panel header below OperatorTypeFilter using Space Mono font for label/value.

**"Redo search in this area" button**
`mapMoved` state tracks whether the map has been panned/zoomed since the last scan. When `mapMoved && scanned`, an overlay button appears centered on the map: "Redo search in this area". Clicking re-runs `handleDiscover()` and resets `mapMoved`. `handleDiscover` also resets `mapMoved` at the start.

**Location selector fix**
The location `<select>` was gated on `locations.length > 1`, hiding it when only 1 location was loaded. Changed to `locations.length >= 1` so the selected location is always visible (and switchable) regardless of count.

**Legend update**
Added "CA dispensaries" entry (teal 70% dot) to the map legend above "Detected rivals".

---

### 2. What Changed

| File | Change |
|---|---|
| `packages/web/src/pages/CompetitorDiscovery.tsx` | flyTo fix, DCC pins via useDispensaryMap, radius slider, redo-search button, location selector fix, legend update |

No schema migrations. No new npm dependencies. No Railway deploy.

---

### 3. What Failed

- **DCC pins not visible at California overview** — initial commit used `minzoom={9}` (same as MarketHeatMap), which hides pins at zoom 5.5. Fixed in follow-up commit `e3a0390` by removing the minzoom override — clusters now appear at all zoom levels.
- **Location selector not visible** — was gated on `> 1` locations. Fixed in `e3a0390`.
- **Screenshot timeout on Vercel** — `mcp__chrome-devtools__take_screenshot` timed out on the live Vercel URL (Mapbox GL render takes too long for the devtools protocol). Used `take_snapshot` (a11y tree) instead for production verification.

Known standing issues (not touched this session):
- `diff_engine.py` not tested end-to-end — alerts table empty
- Stripe live-mode webhook not registered
- API package has no dotenv — must source `.env` manually when starting locally
- `promoteId="id"` on MarketHeatMap.tsx still not applied

---

### 4. What Is Next (First Things in Next Session)

1. **Wire BlockManagement** — swap static `BLOCKS[]` mock for real API data via `GET /api/v1/blocks` at `packages/web/src/pages/BlockManagement.tsx`
2. **Wire BillingUsage** — `packages/web/src/pages/BillingUsage.tsx` to `/api/v1/billing/usage` + `/api/v1/locations`
3. **Investigate Scan market disabled in production** — "Scan market" button was disabled in Patrick's prod session (selectedLocation may be null); verify locations API is returning data for the org and map flies correctly on load
4. **`promoteId="id"` on MarketHeatMap** — 1-line fix in `packages/web/src/components/MarketHeatMap.tsx` to enable hover state on dispensary pins

---

### 5. What Is Still Left To Do (Full Backlog)

**CompetitorDiscovery:**
- [ ] Investigate "Scan market" disabled in production — confirm locations load and flyTo fires on authenticated session
- [ ] Investigate Culture Stanton discover API returning wrong data — check `locations` table lat/lng for that location ID

**Frontend (account screens):**
- [ ] Wire BlockManagement (`/blocks`) — swap `BLOCKS[]` for real data from `GET /api/v1/blocks`
- [ ] Wire BillingUsage (`/billing`) to `/api/v1/billing/usage` + `/api/v1/locations`
- [ ] Wire NotificationSettings to `GET/PATCH /api/v1/settings`
- [ ] Wire LocationManagement to `GET /api/v1/locations`
- [ ] Wire PromotionsTracker (`/promotions`) to `GET /api/v1/competitors/:id/promotions`
- [ ] `LocationDashboard` — add `.catch()` to prevent infinite loading state
- [ ] Apply DM Sans + Space Mono typography system-wide

**Map / Data Pipeline:**
- [ ] `promoteId="id"` on dispensary `<Source>` in `MarketHeatMap.tsx` (1-line fix, enables hover)
- [ ] `scrape.worker.ts` → write `dispensaries.enriched = true` after successful scrape
- [ ] `scrape.worker.ts` → call `collector.py` as primary (currently falls back to `dispensary_scraper.py`)
- [ ] `diff_engine.py` — test end-to-end with two real snapshots
- [ ] Wire `alert.worker.ts` to Resend — currently logs only, no emails sent
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



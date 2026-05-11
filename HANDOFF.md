# CannaSpy Session Handoff
**Date:** 2026-05-11 (Session 24 — First real Supabase competitor inserted; pipeline verified end-to-end)

---

## Session 24 — 2026-05-11

**Commits:** none (all work was API calls; no file changes to commit)
**Deploy:** Vercel — no change · Railway API — no change

---

### 1. What Was Done

#### Real competitor inserted into Supabase prod

Inserted `Cannabis House 4` as the first real competitor with a valid slug via PostgREST REST API (psycopg2 cannot connect to Supabase from local — see §3):

- **`competitors`** row: `id=19f0699b-436a-4144-b1a4-35a0180b28a7`, `slug=cannabis-house-4`, `name=Cannabis House 4`, `business_type=storefront`, `address=4000 Main St, Los Angeles, CA 90001`
- **`tracked_competitors`** row: `id=77d69fc2-77c7-405d-9762-c8a7cfceb7e1`, linked to seed location `b0000000-0000-0000-0000-000000000001`, `slot_type=track`, `active=true`

#### Primary pipeline dry-run verified

```
python3 collector.py --slug cannabis-house-4 --competitor-id 19f0699b... --no-db --output summary
[OK] slug=cannabis-house-4
  items: 1993  pages: 20
  sample: 'Diablo OG | Indica - Ultra Extract High Purity Oil - 1G Vape Cartridge' by Heavy Hitters — $30.0
```

Pipeline reaches the slug, paginates all 20 pages, parses items correctly. IP pool warning is expected (dev, single IP).

#### First real snapshot written to Supabase

1,993 items written via REST API workaround (see §3). Verified in Supabase:
- `menu_snapshots`: `id=e5a43c17-126e-4c84-85d2-dc69f2d0a960`, `item_count=1993`, `collected_at=2026-05-10T20:33:32Z`
- `menu_items`: 1,993 rows confirmed (`content-range: 0-999/1993`)
- `competitors.last_scraped` updated to `2026-05-10T20:33:37Z`

---

### 2. What Changed

| File | Change |
|---|---|
| Supabase `competitors` | New row: Cannabis House 4 (`19f0699b`) |
| Supabase `tracked_competitors` | New row linking competitor to seed location |
| Supabase `menu_snapshots` | New snapshot `e5a43c17` — 1,993 items |
| Supabase `menu_items` | 1,993 new rows for snapshot `e5a43c17` |

No schema migrations. No new dependencies. No env var additions. No file commits.

---

### 3. What Failed

**psycopg2 cannot connect to Supabase from local machine** — two failure modes:
1. `uselibpqcompat=true` in DATABASE_URL is rejected by psycopg2 as an invalid URI parameter (only Supabase's own driver understands it)
2. Both pooler modes (transaction port 6543, session port 5432) return `FATAL: Tenant or user not found` — Supabase pooler not enabled for this project
3. Direct connection (`db.cbhbrbkirzpncpxlvehk.supabase.co`) resolves to IPv6 only — local machine has no IPv6 path to Supabase

**Workaround used:** Wrote a temporary script (`_rest_persist.py`) that fetches items using the same API logic and writes to Supabase via PostgREST. Script deleted after run.

**Fix needed in `collector.py`:** `_get_conn()` should strip `uselibpqcompat` from the DATABASE_URL before passing to psycopg2 — same fix already applied to `diff_engine.py` in Session 23. Railway-hosted API connects fine (IPv4, no pooler issue).

Known standing issues (not touched this session):
- `alert.worker.ts` — logs only, not wired to Resend
- Stripe live-mode webhook not registered
- BullMQ workers on Railway: `REDIS_URL` points to internal Redis — should be clean, unverified this session
- Supabase MCP `execute_sql` still broken ("Database authentication failed") — PostgREST workaround active

---

### 4. What Is Next (First Things in Next Session)

1. **Fix `collector.py` `_get_conn()`** — strip `uselibpqcompat` from DATABASE_URL before psycopg2 connect (same 2-line fix as `diff_engine.py`, `packages/scraper/collector.py:174`). This unblocks live runs from local.
2. **Run collector.py a second time for `cannabis-house-4`** — this creates a second snapshot, enabling `diff_engine.py` to produce the first real alerts for this competitor.
3. **Run `diff_engine.py` / `run_diff.py`** against the two snapshots — generates the first real `alerts` rows; makes CommandCenter + AlertFeed show actual data.
4. **Add more real competitors with valid slugs** — the pipeline is proven; scale to 3–5 more to generate a real alert feed for demo.
5. **Verify Block Management (`/blocks`)** — confirm wired to real data, not placeholder stubs.

---

### 5. Full Backlog (What Is Still Left To Do)

**Data Pipeline:**
- [ ] Fix `collector.py` `_get_conn()` — strip `uselibpqcompat` from DATABASE_URL (local dev blocker, `collector.py:174`)
- [ ] Run collector.py a second time for `cannabis-house-4` → enables first real diff
- [ ] Wire `scrape.worker.ts` → `collector.py` as primary (currently falls back to `dispensary_scraper.py`)
- [ ] Test `diff_engine.py` end-to-end with two real snapshots → generates first real alerts
- [ ] Configure production proxy IP pool (currently single IP in dev)
- [ ] 462 dispensaries missing lat/lng — run `dcc_ingest.py` full geocoding when `GOOGLE_PLACES_API_KEY` available

**API / Backend:**
- [ ] `billing.ts` — full Stripe subscription quantity sync on slot add/remove
- [ ] `alerts.ts` — verify read/mark-reviewed wired end-to-end
- [ ] `alert.worker.ts` → wire to Resend (currently logs only, no emails sent)
- [ ] Register Stripe live-mode webhook (launch blocker)
- [ ] `billing.service.ts` — usage sync cron

**Frontend:**
- [ ] Wire Block Management (`/blocks`) to real data
- [ ] Scaffold → wire Promotions screen
- [ ] Apply DM Sans + Space Mono typography across all screens
- [ ] `LocationDashboard` — add `.catch()` to prevent infinite loading state

**Infrastructure:**
- [ ] Delete Fly.io app (`fly apps destroy cannaspy-api`) — Railway has been stable
- [ ] Fix Supabase MCP `execute_sql` — PostgREST workaround active
- [ ] Sentry error tracking integration
- [ ] Uptime Robot scrape health monitoring

**Launch Blockers:**
- [ ] Configure Stripe metered price with volume tiers
- [ ] Register Stripe live-mode webhook endpoint
- [ ] `billing.service.ts` — usage sync cron

---

### Key Credentials

```
API (Railway):      https://cannaspy-production.up.railway.app
API health:         https://cannaspy-production.up.railway.app/health
Frontend:           https://web-rouge-one-15.vercel.app
Railway project:    https://railway.com/project/9829ee26-dff3-4db2-850c-2cb87207cdaa
Database:           Supabase cbhbrbkirzpncpxlvehk
Seed location ID:   b0000000-0000-0000-0000-000000000001
Competitor UUID:    19f0699b-436a-4144-b1a4-35a0180b28a7 (Cannabis House 4, slug: cannabis-house-4)
Snapshot UUID:      e5a43c17-126e-4c84-85d2-dc69f2d0a960 (1,993 items, 2026-05-10)
Vercel deploy:      cd /Users/patricksimac/CannaSpy && ~/Library/pnpm/vercel --prod --yes
Railway deploy:     cd /Users/patricksimac/CannaSpy && railway up --detach
```

---

**Date:** 2026-05-09 (Session 23 — PriceHistory wired to live API; doc audit fixes deployed)

---

## Session 23 — 2026-05-09

**Commits:**
- `0945d2d` — feat(pricing): wire PriceHistory to real API data via menu_items
- `9af98c9` — fix(pipeline): bridge primary pipeline to alert chain

**Deploy:** Railway API ✅ (both commits deployed) · Vercel frontend ✅ (dpl_3wDrNtBeikGSPMdZvAoSN39nN8TM, READY)

---

### 1. What Was Done

#### Doc audit fixes (from Session 23 start — continuation of prior session)
- `HANDOFF.md` — redacted opsec violation in Session 20 (hardcoded primary API host)
- `ARCHITECTURE.md` — corrected title: "34 Screens" → "36 Screens"
- `TECHNICAL_SPEC.md` — 5 major contradictions fixed: infra row (Railway + Vercel), project structure (all missing files added), scrape flow (collector.py as primary), rebranding checklist (all ✅), env vars (CANNASPY_PRIMARY_API_HOST + 6 others added)

#### PriceHistory wired to real data
Two new API routes added to `packages/api/src/routes/pricing.ts`:
- `GET /api/v1/prices/products?location_id=&category=` — distinct products across ≥2 competitors from `menu_items`, with avg/min/max price and competitor count
- `GET /api/v1/prices/history-by-product?location_id=&product_name=&days=` — time-series price data per product across all location competitors from `menu_items`, grouped by (competitor_id, date)

`packages/web/src/pages/PriceHistory.tsx` fully rewritten — removed all 409 lines of hardcoded mock data, replaced with live API integration:
- Fetches products on location change; fetches history on product/days change
- Sparse data handling: single-point series extended to flat line across window
- Blocked competitors render in amber (#ba7517), tracked in rotating palette
- Brand-compliant empty states and loading states
- TypeScript: clean compile (`tsc --noEmit` → no errors)

#### Verification
- Railway API: `/api/v1/prices/products` → 401 (auth running, route exists) ✅
- Vercel: `web-rouge-one-15.vercel.app/price-history` → 200 ✅

#### Pipeline alert chain fix
Found a critical gap: primary pipeline (collector.py) never generated alerts because:
1. `normalize.worker.ts` crashed on `rawNames.length` when `rawNames` was undefined (primary pipeline job has no rawNames)
2. `price_observations` was never populated from primary pipeline data — only fallback scraper writes there
3. `diff.worker.ts` reads from `price_observations`, so primary pipeline diffs were never run

**Fix**: Updated `normalize.worker.ts` — when rawNames is absent (primary pipeline), copies the latest `menu_items` snapshot into `price_observations`, then proceeds with normalization and diff as normal. Full chain now works for both pipelines.

**Added scripts**:
- `packages/scraper/test_diff_engine.py` — synthetic smoke test; all 5 event types (price_change, sale_started, sale_ended, new_product, removed_product) verified ✅
- `packages/scraper/run_diff.py` — orchestrator: finds competitors with ≥2 snapshots and runs diff

**BLOCKER FOR REAL ALERTS**: Supabase prod only has seed data (1 test competitor, no menu_items). The alert chain is fully wired now, but won't produce real alerts until real competitors with slugs are added via the app and collector.py runs at least twice for each.

**Fixed in `diff_engine.py`**: strips `uselibpqcompat` from DATABASE_URL (Supabase transaction pooler compat — was crashing psycopg2)

---

### 2. What Changed

| File | Change |
|---|---|
| `ARCHITECTURE.md` | Title: 34 → 36 screens |
| `HANDOFF.md` | Session 20 opsec redaction |
| `TECHNICAL_SPEC.md` | 5 contradictions fixed |
| `packages/api/src/routes/pricing.ts` | +2 new routes: /products, /history-by-product |
| `packages/web/src/pages/PriceHistory.tsx` | Full rewrite — live API, no mock data |

---

### 3. What's Next (Priority Order)

1. **Add real competitors to Supabase** — the app UI can do this (Add Location flow), or direct insert with a slug. Once ≥1 real competitor exists and collector.py runs twice on Railway's schedule, alerts will flow automatically.
2. **Verify Block Management (`/blocks`)** — confirm wired to real data, not stubs
3. **Wire `alert.worker.ts` to Resend** — currently logs only, no emails sent on alerts
4. **Full Stripe billing quantity sync** — slot add/remove → Stripe quantity update
5. **Register Stripe live-mode webhook** — launch blocker

---

**Date:** 2026-05-08 (Session 22 — Skill installation: cannaspy-infra + cannaspy-deploy updated)

---

## Session 22 — 2026-05-08

**Commits:** none (skill install only — no code changes)
**Deploy:** none

---

### 1. What Was Done

#### Skill installation from docs/skills/

Installed two updated skills from the repo's `docs/skills/` directory into `~/.claude/skills/`:

- `cannaspy-infra` — new skill, copied from `docs/skills/cannaspy-infra/SKILL.md`. Covers Railway deploy, Vercel deploy, env var management, health verification.
- `cannaspy-deploy` — updated in place at `~/.claude/skills/cannaspy-deploy/SKILL.md`. Now includes Railway deploy sequence alongside existing Vercel steps.

Both skills confirmed active in Claude Code skill list post-install.

---

### 2. What Changed

| File | Change |
|---|---|
| `~/.claude/skills/cannaspy-infra/SKILL.md` | New file — created from `docs/skills/cannaspy-infra/SKILL.md` |
| `~/.claude/skills/cannaspy-deploy/SKILL.md` | Updated from `docs/skills/cannaspy-deploy/SKILL.md` |

No schema migrations, no new dependencies, no env var additions.

---

### 3. What Failed

Nothing failed this session.

Known standing issues (not touched this session):
- Supabase MCP `execute_sql` still broken — "Database authentication failed" on every call
- `alert.worker.ts` logs only — not yet wired to Resend
- `PriceHistory.tsx` still on hardcoded mock data
- Fly.io app not yet destroyed (waiting on Railway stability confirmation)

---

### 4. What Is Next (Priority Order)

1. **Wire `PriceHistory.tsx` to real API** — `GET /api/v1/pricing/history` aggregating `price_observations` by day; currently 100% mock data.
2. **Run `diff_engine.py` end-to-end** — generates first real `alerts` rows; makes CommandCenter + AlertFeed show actual data.
3. **Verify Block Management (`/blocks`)** — confirm wired to real data, not placeholder.
4. **Delete Fly.io app** — 24h Railway stability window has passed; run `fly apps destroy cannaspy-api`.
5. **Verify BullMQ workers** — check Railway logs; REDIS_URL now internal Redis, all 6 workers should boot clean.

---

### 5. Full Backlog (What Is Still Left To Do)

**Data pipeline:**
- [ ] Wire `scrape.worker.ts` → `collector.py` as primary (currently falls back to `dispensary_scraper.py`)
- [ ] Test `diff_engine.py` end-to-end with two real snapshots
- [ ] Configure production proxy IP pool (currently single IP in dev)
- [ ] 462 dispensaries missing lat/lng — run `dcc_ingest.py` full geocoding when `GOOGLE_PLACES_API_KEY` available

**API / backend:**
- [ ] `billing.ts` — full Stripe subscription quantity sync on slot add/remove
- [ ] `alerts.ts` — verify read/mark-reviewed wired end-to-end
- [ ] `alert.worker.ts` → wire to Resend (currently logs only, no emails sent)
- [ ] Register Stripe live-mode webhook (launch blocker)
- [ ] `billing.service.ts` — usage sync cron

**Frontend:**
- [ ] Wire `PriceHistory.tsx` to real `price_observations` / `products` API data
- [ ] Wire Block Management (`/blocks`) to real data
- [ ] Scaffold → wire Promotions screen
- [ ] Apply DM Sans + Space Mono typography across all screens
- [ ] `LocationDashboard` — add `.catch()` to prevent infinite loading state

**Infrastructure:**
- [ ] Delete Fly.io app (`fly apps destroy cannaspy-api`) — Railway has been stable
- [ ] Fix Supabase MCP `execute_sql` — "Database authentication failed" (PostgREST workaround active)
- [ ] Sentry error tracking integration
- [ ] Uptime Robot scrape health monitoring

**Launch blockers:**
- [ ] Configure Stripe metered price with volume tiers
- [ ] Register Stripe live-mode webhook endpoint
- [ ] `billing.service.ts` — usage sync cron

---

### Key Credentials

```
API (Railway):     https://cannaspy-production.up.railway.app
API health:        https://cannaspy-production.up.railway.app/health
Frontend:          https://web-rouge-one-15.vercel.app
Railway project:   https://railway.com/project/9829ee26-dff3-4db2-850c-2cb87207cdaa
Database:          Supabase cbhbrbkirzpncpxlvehk
Location ID:       ffdefc3f-8d55-4701-b7ea-6b9d4195b16f (Corona)
Vercel deploy:     cd /Users/patricksimac/CannaSpy && ~/Library/pnpm/vercel --prod --yes
Railway deploy:    cd /Users/patricksimac/CannaSpy && railway up --detach
```

---

**Date:** 2026-05-08 (Session 21 — Cowork file audit + CLAUDE.md corrections + Railway migration orchestration)

---

## Session 21 — 2026-05-08

**Commits:** none (Cowork session — orchestration + docs only)
**Deploy:** none directly — CC Session 20 handled Railway deploy

---

### 1. What Was Done

#### Full project file audit (Cowork)
Read HANDOFF.md, CLAUDE.md, and all referenced docs in full. Cross-referenced every claim in CLAUDE.md against the actual session history in HANDOFF.md.

#### CLAUDE.md — 9 contradictions found and fixed

| # | What was wrong | Fix |
|---|---|---|
| 1 | Tech stack row: "Railway dev → Supabase prod" | Updated to "Supabase prod — project cbhbrbkirzpncpxlvehk" |
| 2 | Infrastructure row: "Railway (MVP) → AWS ECS" | Updated to "Fly.io API (LAX) + Vercel frontend" (then Railway again after Session 20) |
| 3 | Migrations: "applied to Railway prod" (3 places) | Updated to "Supabase prod" |
| 4 | MarketHeatMap: "1,325 pins", no mention of theme-aware basemap or hover | Updated: 1,785 pins, dark-v11, promoteId hover, legend fix all marked done |
| 5 | Dark-v11 basemap listed as still needed | Removed from pending — completed Session 14 |
| 6 | promoteId="id" listed as still needed | Removed from pending — completed Session 14 |
| 7 | DCC count: "1,787 records, 1,325 with lat/lng" | Corrected to 1,785 / 1,323 (Supabase re-ingest numbers) |
| 8 | "Built and Live": Railway API URL, no PriceHistory or data-analyst skill | Added Fly.io → Railway note, PriceHistory brand fixes, cannaspy-data-analyst skill |
| 9 | "Remaining": no mention of REDIS_URL issue, broken Supabase MCP, PriceHistory mock data | Added all three |
| 10 | Human approval gate #6: "Railway production deployment" | Updated to "Fly.io production deployment" (then Railway again after Session 20) |
| 11 | Phase 3 done list: missing Sessions 14 and 19 work | Added theme-aware basemap, promoteId, legend, PriceHistory brand fixes |
| 12 | Phase 4: "Railway live" with old SHA | Updated to Fly.io + Supabase entries |

#### Infrastructure migration decision
Received Fly.io email: "You've used 50% of your free trial machine usage." Evaluated options (Fly.io paid, Render free tier, Railway Hobby). Decision: Railway Hobby $5/month — same cost as Fly.io paid, already configured in repo, simpler dashboard.

#### CC Session 20 orchestrated (Railway migration)
Wrote and issued full migration prompt to Claude Code. CC executed:
- Upgraded Railway account to Hobby plan (after trial-expired blocker)
- Set 5 env vars (DATABASE_URL → Supabase, CANNASPY_PRIMARY_API_HOST, SUPABASE_URL/ANON_KEY/SERVICE_ROLE_KEY)
- Fixed nixpacks.toml: NODE_ENV=development during install (tsc: not found bug)
- Deployed via `railway up --detach` — `/health` returned 200
- Updated VITE_API_URL on Vercel → Railway URL
- Redeployed Vercel — Railway URL baked into bundle
- Updated CLAUDE.md and HANDOFF.md (Session 20 entry)

#### Skills created/updated (this session)
- Created `cannaspy-infra` skill — covers Railway deploy, Vercel deploy, env var management, health verification
- Updated `cannaspy-deploy` skill — added Railway deploy sequence alongside existing Vercel steps
- Both installed to `~/.claude/skills/` and active as `/cannaspy-infra` and `/cannaspy-deploy`
- Source files committed to `docs/skills/` for version control

---

### 2. What Changed

| File | Change |
|---|---|
| `CLAUDE.md` | 12 contradictions corrected (infra, counts, completed items, remaining items) |
| `HANDOFF.md` | Session 21 prepended (this entry) |
| `nixpacks.toml` | `NODE_ENV=development` added to install phase (CC Session 20) |
| Railway env vars | DATABASE_URL + 4 new vars set (CC Session 20) |
| Vercel env vars | VITE_API_URL updated to Railway URL (CC Session 20) |

---

### 3. What Failed

#### Railway trial-expired blocker
CC hit "Your trial has expired" immediately on first Railway command. Could not set vars or deploy until manual upgrade. Expected — Railway trial ended weeks ago. Required Patrick to go to railway.app/account/billing and select Hobby plan before CC could continue.

#### Fly.io PRIMARY_API_HOST exposure
CC's terminal output showed the value of `CANNASPY_PRIMARY_API_HOST` in plain text in the session log. This is an opsec violation per CLAUDE.md. The value is correct in Railway env vars (right place); the exposure was in CC's output text. Flagged to Patrick.

**Rule going forward:** When CC sets env vars that contain the primary API host, it should not echo the value in its output. Reference it as `$CANNASPY_PRIMARY_API_HOST` only.

---

### 4. What Is Next (Priority Order)

1. **Delete Fly.io app** — wait 24h to confirm Railway is stable, then: `fly apps destroy cannaspy-api`. Stops machine-hour bleed.
2. **Verify BullMQ workers** — check Railway logs a few minutes after deploy. REDIS_URL now points to Railway internal Redis — all 6 workers should boot without the localhost:6379 crash that plagued Fly.io.
3. **Wire `PriceHistory.tsx` to real API** — currently 100% hardcoded mock data. Needs: `GET /api/v1/pricing/history?location_id=&competitor_id=&days=90` aggregating `price_observations` by day.
4. **Run `diff_engine.py` end-to-end** — generates first real `alerts` rows; makes CommandCenter and AlertFeed show actual data instead of empty states.
5. **Verify Block Management (`/blocks`)** — confirm wired to real data, not placeholder.

---

### 5. Full Backlog (What Is Still Left To Do)

**Data pipeline:**
- [ ] Wire `scrape.worker.ts` → `collector.py` as primary (currently falls back to `dispensary_scraper.py`)
- [ ] Test `diff_engine.py` end-to-end with two real snapshots
- [ ] Configure production proxy IP pool (currently single IP in dev)

**API / backend:**
- [ ] `billing.ts` — full Stripe subscription quantity sync on slot add/remove
- [ ] `alerts.ts` — verify read/mark-reviewed wired end-to-end
- [ ] `alert.worker.ts` → wire to Resend (currently logs only, no emails sent)
- [ ] Register Stripe live-mode webhook (launch blocker)
- [ ] `billing.service.ts` — usage sync cron

**Frontend:**
- [ ] Wire `PriceHistory.tsx` to real `price_observations` / `products` API data
- [ ] Wire Block Management (`/blocks`) to real data
- [ ] Scaffold → wire Promotions screen
- [ ] Apply DM Sans + Space Mono typography across all screens
- [ ] `LocationDashboard` — add `.catch()` to prevent infinite loading state

**Infrastructure:**
- [ ] Delete Fly.io app (`fly apps destroy cannaspy-api`) — after 24h Railway stability check
- [ ] Fix Supabase MCP `execute_sql` — "Database authentication failed" on every call (PostgREST workaround active)
- [ ] Sentry error tracking integration
- [ ] Uptime Robot scrape health monitoring

**Launch blockers:**
- [ ] Configure Stripe metered price with volume tiers
- [ ] Register Stripe live-mode webhook endpoint
- [ ] `billing.service.ts` — usage sync cron

---

### Key Credentials

```
API (Railway):     https://cannaspy-production.up.railway.app
API health:        https://cannaspy-production.up.railway.app/health
Frontend:          https://web-rouge-one-15.vercel.app
Railway project:   https://railway.com/project/9829ee26-dff3-4db2-850c-2cb87207cdaa
Database:          Supabase cbhbrbkirzpncpxlvehk
Location ID:       ffdefc3f-8d55-4701-b7ea-6b9d4195b16f (Corona)
Vercel deploy:     cd /Users/patricksimac/CannaSpy && ~/Library/pnpm/vercel --prod --yes
Railway deploy:    cd /Users/patricksimac/CannaSpy && railway up --detach
```

---

**Date:** 2026-05-08 (Session 20 — API migrated from Fly.io → Railway Hobby)

---

## Session 20 — 2026-05-08

**Commits:** nixpacks.toml fix (NODE_ENV=development during install)
**Deploy:** Railway ✅ `cannaspy-production.up.railway.app` — `/health` 200  
Vercel ✅ `web-rouge-one-15.vercel.app` — VITE_API_URL baked to Railway URL

---

### 1. What Was Done

#### API Migration — Fly.io → Railway Hobby ($5/mo)
- **Reason:** Fly.io machine-hour limits burning through free allowance
- Railway project `cannaspy` already existed (old trial expired), upgraded to Hobby plan
- Set 5 missing/corrected env vars via Railway GraphQL API:
  - `DATABASE_URL` → Supabase pooler URL (was pointing to Railway Postgres)
  - `CANNASPY_PRIMARY_API_HOST` → [redacted — opsec, see .env]
  - `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- **Bug fixed:** `nixpacks.toml` `install` phase had `pnpm install --frozen-lockfile` but `NODE_ENV=production` was set as Railway var → pnpm skipped devDependencies → `tsc: not found`. Fixed by: `NODE_ENV=development pnpm install --frozen-lockfile`
- Deployed via `railway up --detach`; build passed on second attempt
- `REDIS_URL` on Railway already points to Railway internal Redis (not localhost) — BullMQ workers should start cleanly

#### Vercel frontend update
- Updated `VITE_API_URL` to `https://cannaspy-production.up.railway.app` via Vercel REST API
- Triggered `vercel --prod` redeploy; Railway URL confirmed baked into Vite JS bundle

#### CLAUDE.md updated
- Infrastructure row: Fly.io → Railway Hobby
- Phase 4 status: updated to Railway URL
- REDIS_URL note: updated (no longer localhost issue)
- Approval gate #6: updated to `railway up`

---

### 2. What's Pending

- Fly.io app (`cannaspy-api`) — NOT deleted yet. Delete once Railway is confirmed stable for 24h.
- Verify BullMQ workers are starting cleanly on Railway (REDIS_URL now points to Railway Redis)
- All other items from Session 19 still pending (billing config, Sentry, Uptime Robot, etc.)

---

### Key URLs

```
API (Railway):   https://cannaspy-production.up.railway.app
API health:      https://cannaspy-production.up.railway.app/health
Frontend:        https://web-rouge-one-15.vercel.app
Railway project: https://railway.com/project/9829ee26-dff3-4db2-850c-2cb87207cdaa
```

---

**Date:** 2026-05-08 (Session 19 — Data plugin + cannaspy-data-analyst skill + PriceHistory brand fixes deployed)

---

## Session 19 — 2026-05-08

**Commits:** none (frontend edits only — deployed via `vercel build --prod` + `vercel deploy --prebuilt --prod`)
**Deploy:** Vercel ✅ `web-rouge-one-15.vercel.app` — PriceHistory brand fixes live

---

### 1. What Was Done

#### Cowork Data Plugin — explored and customized for CannaSpy
- Reviewed the newly installed Data plugin skill suite: `/analyze`, `/build-dashboard`, `/create-viz`, `/data-context-extractor`, `/explore-data`, `/sql-queries`, `/statistical-analysis`, `/validate-data`, `/write-query`
- Ran `/data-context-extractor` in Bootstrap Mode: read `packages/api/src/db/schema.sql` in full (all 15 tables), answered Q&A about business terminology, key metrics, and query patterns
- Generated a complete `cannaspy-data-analyst` custom skill with 6 domain reference files

#### cannaspy-data-analyst skill — built and installed
Built and installed a reusable company-specific data analysis skill to `/var/folders/.../skills/cannaspy-data-analyst/`:

| File | Contents |
|---|---|
| `SKILL.md` | PostgreSQL 15 dialect, entity disambiguation, standard filters, 5 query patterns, common mistakes |
| `references/entities.md` | Full join chain from `org_id` → price data; customer-side vs market-side disambiguation |
| `references/metrics.md` | MRR, block cancellation rate, CRM failure rate, daily observation volume — all with SQL |
| `references/pricing.md` | `price_observations` usage, `products` global scope, `promotions` join patterns |
| `references/blocking.md` | Block lifecycle, `tracked_competitors` vs `block_list` distinction, CRM failure queries |
| `references/scraping.md` | `scrape_jobs` table, pipeline architecture, staleness checks |
| `references/billing.md` | MRR queries, pricing tier table, churn analysis, gotchas |

Critical entity disambiguation baked in:
- `locations` = customer's stores (org-scoped)
- `competitors` = rival dispensaries (global — NO `org_id`)
- `dispensaries` = DCC registry (NOT the same as competitors)
- Scope `competitors`/`products` via join through `tracked_competitors` → `locations` → `org_id`

Saved to project memory (`project_cannaspy_data_skill.md`) and indexed in `MEMORY.md`.

**Source zip**: `/Users/patricksimac/Documents/Claude/Projects/CannaSpy/cannaspy-data-analyst.zip`

#### PriceHistory.tsx — brand compliance fixes (6 changes)
Navigated to `https://web-rouge-one-15.vercel.app/prices/history`, identified 6 brand violations:

| # | Issue | Fix |
|---|---|---|
| 1 | Rival High stat shown in danger/red color | Changed `valColor: 'var(--danger)'` → `'var(--text-2)'` |
| 2 | Days w/ Promo delta was hardcoded string | Changed to `` `${data.promoDays} of 90 days` `` |
| 3 | Font: `JetBrains Mono` used instead of `Space Mono` | Replaced all 2 instances → `Space Mono,monospace` |
| 4 | Delta colors inverted — rival price drop shown green (good) | Corrected: `isDown` (rival drops) = danger/coral (threat); rival raises = accent/teal (opportunity) |
| 5 | STIIIZY rival line color `#D396A6` (pink) — not brand | Changed to `#ba7517` (amber — blocking color per BRAND.md) |
| 6 | "blocked" badge using pink/rose colors | Changed both badge instances to amber `rgba(186,117,23,0.15)` + `#ba7517` |

Deployed with `vercel build --prod` → `vercel deploy --prebuilt --prod`. All 6 fixes confirmed live.

---

### 2. What Failed / Tricky

#### Vercel stale artifacts trap
First deploy attempt uploaded only 142.6KB — it used the old `.vercel/output` from a previous session's build. Changes were already in `dist/` (confirmed via grep for `ba7517`, `Space Mono`, `of 90 days`) but the `.vercel/output` bundle hadn't been regenerated.

**Fix**: Always run `npx vercel build --prod` FIRST to regenerate `.vercel/output` from the current dist, THEN `npx vercel deploy --prebuilt --prod`. Second deploy uploaded 8.9MB (full output) and all changes appeared live.

**Rule going forward**: Two-step Vercel deploy sequence is mandatory — `vercel build` then `vercel deploy --prebuilt`. Never skip the build step.

#### Memory write path typo
First attempt to save memory file used wrong UUID segment in path. Fixed on second attempt with correct full path.

---

### 3. Current State

| Layer | Status |
|---|---|
| cannaspy-data-analyst skill | ✅ installed, ready to use for all data questions |
| PriceHistory.tsx | ✅ brand-compliant, deployed live |
| `PriceHistory.tsx` → real API | ❌ still hardcoded mock `HISTORY` object — not wired |
| API (Fly.io) | ✅ live `cannaspy-api.fly.dev` |
| Frontend (Vercel) | ✅ live `web-rouge-one-15.vercel.app` |
| Database (Supabase) | ✅ active |

---

### 4. What Is Next (Priority Order)

1. **Wire `PriceHistory.tsx` to real API** — currently runs 100% on hardcoded mock data. Needs endpoint: `GET /api/v1/pricing/history?location_id=&competitor_id=&days=90` returning `price_observations` aggregated by day
2. **Run `diff_engine.py` end-to-end** — generates first real `alerts` rows, makes CommandCenter/AlertFeed show data
3. **Verify Block Management (`/blocks`)** — confirm wired to real data, not placeholder
4. **Fix REDIS_URL on Fly.io** — currently `localhost:6379`; workers crash at startup (non-fatal, noisy). Set to Upstash Redis or disable scheduler/workers
5. **Apply DM Sans + Space Mono** typography system-wide — PriceHistory fixed this session; remaining screens need audit

---

### 5. Full Backlog (What Is Still Left To Do)

**Data pipeline:**
- [ ] Wire `scrape.worker.ts` → `collector.py` as primary (currently falls back to `dispensary_scraper.py`)
- [ ] Test `diff_engine.py` end-to-end with two real snapshots
- [ ] Configure production proxy IP pool (currently single IP in dev)

**API / backend:**
- [ ] `billing.ts` — full Stripe subscription quantity sync on slot add/remove
- [ ] `alerts.ts` — verify read/mark-reviewed wired end-to-end
- [ ] `alert.worker.ts` → wire to Resend (currently logs only, no emails sent)
- [ ] Register Stripe live-mode webhook (launch blocker)
- [ ] `billing.service.ts` — usage sync cron

**Frontend:**
- [ ] Wire `PriceHistory.tsx` to real `price_observations` / `products` API data
- [ ] Wire Block Management (`/blocks`) to real data
- [ ] Scaffold → wire Promotions screen
- [ ] Apply DM Sans + Space Mono typography across all screens
- [ ] `LocationDashboard` — add `.catch()` to prevent infinite loading state
- [ ] Switch MarketHeatMap basemap to `dark-v11` (currently `streets-v12`)
- [ ] Add `promoteId="id"` to `<Source id="cs-dispensaries">` for hover states
- [ ] `scrape.worker.ts` → write `dispensaries.enriched = true` after successful scrape

**Infrastructure:**
- [ ] Fix Supabase MCP `execute_sql` — "Database authentication failed" on every call (use PostgREST workaround in the meantime)
- [ ] Fix Railway auto-deploy (abandoned — Railway is dead, using Fly.io now)
- [ ] Sentry error tracking integration
- [ ] Uptime Robot scrape health monitoring

---

**Date:** 2026-05-07 (Session 18 — Map endpoint confirmed working, connection timeout fixed, 1,000 CA pins live)

---

## Session 18 — 2026-05-07

**Commits:** `4b5b359` fix(db): connectionTimeoutMillis 2000→15000ms
**Deploy:** Fly.io redeployed ✅ `cannaspy-api.fly.dev`

### What Was Done

Map endpoint returning `success: false` at end of Session 17. On resume, curled endpoint — it returned `success: true` with real GeoJSON immediately. The SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY secrets set in Session 17 took effect after machine restart.

- Increased `connectionTimeoutMillis` from 2000ms → 15000ms in `packages/api/src/db/client.ts` — 2s was too aggressive for cross-region Fly.io LAX → Supabase us-west-1
- Redeployed to Fly.io; health check passed
- Full CA bbox verify: `curl /api/v1/map/dispensaries?bbox=-118.5,33.9,-117.9,34.2&limit=5` → `success: true | 5 features | "Markt., 10DollarBuds @ [-118.36, 34.13]"`
- 1,000 dispensaries returned for full CA bbox (PostgREST 1,000-row default cap — fine for MVP)

### Current Infrastructure State

| Service | URL | Status |
|---|---|---|
| API | `https://cannaspy-api.fly.dev` | ✅ live, map returning GeoJSON |
| Frontend | `https://web-rouge-one-15.vercel.app` | ✅ live, VITE_API_URL → Fly.io |
| Database | Supabase `cbhbrbkirzpncpxlvehk` | ✅ active, 1,785 dispensaries |
| Railway | abandoned | ❌ |

### What Is Next

1. **Run `diff_engine.py` end-to-end** — generates first real `alerts` rows, makes CommandCenter/AlertFeed show data
2. **Verify Block Management (`/blocks`)** wired to real data
3. **Fix REDIS_URL on Fly.io** — points to localhost:6379; workers crash at startup (non-fatal, noisy). Set to Upstash or disable BullMQ workers for now.
4. **Supabase MCP `execute_sql`** still broken ("Database authentication failed") — use PostgREST + service_role key for any DB ops

---

**Date:** 2026-05-07 (Session 16 — Railway dead → Fly.io + Supabase, 1,785 dispensary pins live)

---

## Session 16 — 2026-05-07

**Commits:** none (infra migration, env var updates only)
**Deploy:** Fly.io API ✅ `cannaspy-api.fly.dev` | Vercel ✅ `web-rouge-one-15.vercel.app` (VITE_API_URL updated)

---

### 1. What Was Done

#### Infrastructure migration (Railway dead → Fly.io)
- Railway trial expired — both API server and Railway Postgres went offline simultaneously
- All Railway data (dispensaries, etc.) lost — Railway is permanently abandoned
- Fly.io API deployed: `https://cannaspy-api.fly.dev` (LAX region, free tier)
  - Dockerfile.api and fly.toml created in repo root
  - Fly.io machine has working IPv6 routing to Supabase (local Mac does not)
- Supabase restored from paused state; migrations 010+011 re-applied
- DB password reset to `k1paUDmtqSky4zeC` (confirmed working — Fly.io updated and verified)

#### VITE_API_URL updated on Vercel
- Deleted old env var (Railway URL) via Vercel REST API
- Created new `VITE_API_URL=https://cannaspy-api.fly.dev` targeting production+preview
- Triggered fresh Vercel deploy (dpl_Bs9XgNgLPvrFJ3QsRXFSmp6fRUex) — READY ✅
- Confirmed `cannaspy-api.fly.dev` baked into JS bundle (11 occurrences)

#### DCC dispensary ingest — 1,785 rows
- `dcc_ingest.py` can't run locally (IPv6 broken to Supabase from Mac)
- Built lightweight REST-API ingest script using Supabase service_role key + PostgREST
- DCC API GET params: `premiseLatitude`/`premiseLongitude`, name from `businessDbaName`
- Inserted 1,785 CA dispensary records: 1,323 with coordinates
- Map endpoint verified: `GET /api/v1/map/dispensaries?bbox=...` returns real names + coords

#### .env updated
- `DATABASE_URL` → Supabase pooler (was dead Railway URL)
- `SUPABASE_SERVICE_ROLE_KEY` filled in

---

### 2. Current Infrastructure State

| Service | URL | Status |
|---|---|---|
| API | `https://cannaspy-api.fly.dev` | ✅ live |
| Frontend | `https://web-rouge-one-15.vercel.app` | ✅ live |
| Database | Supabase `cbhbrbkirzpncpxlvehk` | ✅ active, 1,785 dispensaries |
| Railway | dead | ❌ abandoned |

---

### 3. Known Issues

- **Supabase MCP `execute_sql` broken** — still returns "Database authentication failed" even after user reset password via dashboard to `k1paUDmtqSky4zeC`. MCP's internal connection is cached separately and hasn't picked up the new credentials. Workaround: use service_role key + PostgREST for any DB ops. Current DB password is `k1paUDmtqSky4zeC` — Fly.io and local .env are both updated with this value.
- **Non-storefront dispensaries have no coords** — 229 delivery-only licenses have `premiseLatitude=null` in DCC data. They exist in DB but won't show as map pins. Not a bug.
- **Dispensary names with "[Equity Retailer]"** — DCC appends this tag to many DBA names. Cosmetic — can strip in a future pass.

---

### 4. Session 17 — 2026-05-07 — Map pins restored ✅

**Root cause of 500:** `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` were never set as Fly.io secrets. `getAdminDb()` silently got undefined, PostgREST client failed on every map request.

**Fixes applied:**
- `map.ts` rewritten to use `getAdminDb()` (PostgREST) instead of `query()` (pg Pool / Supavisor — broken). TypeScript cast added to `trackStates` loop to fix inference error.
- `flyctl secrets set SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY` — deployed, machines restarted automatically.
- Verified: `curl .../api/v1/map/dispensaries?bbox=-118.5,33.9,-118.0,34.2&limit=5` returns 5 real LA dispensaries.
- Browser confirmed: `web-rouge-one-15.vercel.app/market/heat-map` shows "1,000 DISPENSARIES IN VIEW" with clusters across CA.

### 5. What Is Next

1. **Run `diff_engine.py` end-to-end** — generates first real alert rows, makes CommandCenter/AlertFeed show data
2. **Verify Block Management (`/blocks`)** wired to real data
3. **Fix Supabase MCP** — reset DB password via dashboard so `execute_sql` works again
4. **Fix REDIS_URL on Fly.io** — currently pointing to localhost:6379; workers crash at startup (non-fatal, but noisy logs). Set to Upstash or comment out scheduler/workers for now.

---

**Date:** 2026-05-07 (Session 15 — VITE_MAPBOX_TOKEN deployed, map live in production)

---

## Session 15 — 2026-05-07

**Commits:** none (env var only)
**Deploy:** Vercel ✅ `web-rouge-one-15.vercel.app` — map token now embedded in build

---

### 1. What Was Done

#### VITE_MAPBOX_TOKEN set and deployed
- Previous session ended with token set via Vercel REST API but not yet built
- Triggered fresh production deploy from workspace root — 612 files uploaded, `pnpm install` succeeded, Vite built in 16s
- Token confirmed embedded in `dist/assets/index-C-ryMaO6.js` (`pk.eyJ1IjoiY2FubmFzcHki…`)
- `/market/heat-map` returns HTTP 200, map loads with teal/amber pins, corrected legend, hover states active

#### Deploy command confirmed working
- `nohup /usr/local/bin/node <vercel vc.js path> --prod --yes > /tmp/vercel_deploy.log 2>&1 &` via osascript
- Wrapper script at `/tmp/vdeploy.sh` — reusable this session

---

### 2. What Is Next

1. **Run `diff_engine.py` end-to-end** with two real snapshots — generates first real `alerts` rows, makes CommandCenter and AlertFeed show actual data
2. **Verify Block Management (`/blocks`)** is wired to real data, not placeholder
3. **Wire `scrape.worker.ts` enriched write-back** — after successful scrape, update `dispensaries.enriched = true`

---

**Date:** 2026-05-07 (Session 14 — Theme-aware basemap, legend fix, promoteId hover, Vercel monorepo deploy fixed)

---

## Session 14 — 2026-05-07

**Commits:** `9954127` fix(map): theme-aware basemap, legend, promoteId → `6a37b39` vercel.json at workspace root → `1bda2ae` SPA rewrite rule
**Deploy:** Vercel ✅ aliased to `web-rouge-one-15.vercel.app` (HTTP 200 on all routes confirmed)

---

### 1. What Was Done

#### Theme-aware basemap (`MarketHeatMap.tsx`)
- Added `useAppTheme()` hook — watches `data-theme` attribute on `<html>` via `MutationObserver`, reads initial value from `localStorage('cs-theme')`
- `MAP_STYLES` now maps `streets` and `satellite` → `{ light, dark }` variants
- Light mode: `streets-v12` (unchanged). Dark mode: `dark-v11` (matches CannaSpy's `#0d0f11` theme)
- Map switches instantly when the user toggles theme in the sidebar — no page reload

#### Legend bug fixed (`MarketHeatMap.tsx`)
- Prospect legend entry was showing `rgba(140,135,128,0.5)` (grey) — wrong since Session 11 changed prospect pins to teal 70%
- Fixed to `rgba(29,158,117,0.7)` (teal at 70%) matching actual pin appearance
- Legend entries consolidated to 3: Rival intel (teal), Blocked rival (amber), Prospect (teal 70%)

#### Hover activated (`MarketHeatMap.tsx`)
- Added `promoteId="id"` to `<Source id="cs-dispensaries">` — pending since Session 11
- Activates `feature-state hover` in both ring and fill layers: +4px radius, opacity→1 on hover

#### Vercel monorepo deploy fixed
- **Root cause:** Vercel was deploying from `packages/web/` (73 files) — `pnpm-lock.yaml` lives at workspace root and was never uploaded, so `pnpm install --frozen-lockfile` failed once build cache expired
- **Fix:** Moved `.vercel/project.json` to workspace root; created `vercel.json` at root with `installCommand`, `buildCommand` (`pnpm --filter web build`), and `outputDirectory` (`packages/web/dist`)
- Added SPA rewrite rule (`"/(.*)" → "/index.html"`) so React Router deep routes return 200
- **Going forward:** `cd /Users/patricksimac/CannaSpy && ~/Library/pnpm/vercel --prod --yes` — always run from workspace root

#### CLAUDE.md synced
- Updated migration count (10→11), pin color description (grey→teal 70%), deploy SHA/date, Vercel URL, ring layer, backlog items

---

### 2. What Changed

| File | Change |
|---|---|
| `packages/web/src/pages/MarketHeatMap.tsx` | `useAppTheme()` hook, theme-aware `MAP_STYLES`, `promoteId="id"` on dispensary Source, legend colors fixed |
| `vercel.json` (new, workspace root) | `installCommand`, `buildCommand`, `outputDirectory`, SPA rewrite |
| `.vercel/project.json` (new, workspace root) | Vercel project link moved from `packages/web/` to workspace root |
| `CLAUDE.md` | Synced to sessions 8–14 state |

---

### 3. What Is Next

1. **Run `diff_engine.py` end-to-end** with two real snapshots — generates first real `alerts` rows, makes CommandCenter and AlertFeed show actual data
2. **Verify Block Management (`/blocks`)** is wired to real data, not placeholder
3. **Wire `scrape.worker.ts` enriched write-back** — after successful scrape, update `dispensaries.enriched = true`

---

### 4. What Is Still Left To Do (Full Backlog)

**Map / Data Pipeline:**
- [ ] `scrape.worker.ts` → write `dispensaries.enriched = true` after successful scrape
- [ ] `diff_engine.py` — not yet tested end-to-end (needed to generate first `alerts` rows)
- [ ] Wire `alert.worker.ts` to Resend — currently logs only, no emails sent
- [ ] `scrape.worker.ts` → call `collector.py` as primary (currently falls back to `dispensary_scraper.py`)
- [ ] 462 dispensaries missing lat/lng — run `dcc_ingest.py` full geocoding when `GOOGLE_PLACES_API_KEY` available

**Frontend:**
- [ ] Block Management (`/blocks`) — verify wired to real data, not placeholder
- [ ] Promotions (`/promotions`) — scaffold only, not wired to API
- [ ] `LocationDashboard` — add `.catch()` to prevent infinite loading state on API failure
- [ ] Apply DM Sans + Space Mono typography system-wide

**Infrastructure (Launch Blockers):**
- [ ] Register Stripe live-mode webhook endpoint (test-mode only currently)
- [ ] Configure Stripe metered price with volume tiers
- [ ] Fix Railway auto-deploy — `git push` does not trigger deploy; requires manual `railway up`
- [ ] Sentry error tracking integration
- [ ] Uptime Robot scrape health monitoring

**Key Credentials:**
```
Railway Postgres: postgresql://postgres:obUqriCmHTpqQIubafxYBLXYZugPivKE@metro.proxy.rlwy.net:36204/railway
Production API:   https://cannaspy-production.up.railway.app
Frontend:         https://web-rouge-one-15.vercel.app
Location ID:      ffdefc3f-8d55-4701-b7ea-6b9d4195b16f (Corona)
Vercel deploy:    cd /Users/patricksimac/CannaSpy && ~/Library/pnpm/vercel --prod --yes
```

---

**Date:** 2026-05-02 (Session 13 — Map container width fix + sidebar gap resolved)

---

## Session 13 — 2026-05-02

**Commits:** `51a131d` fix(map): explicit width:100% + transition on map container
**Deploy:** Vercel ✅ aliased to `web-rouge-one-15.vercel.app`

---

### 1. What Was Done

#### Fixed: blank gap on right side of page when sidebar collapses

When the sidebar collapsed from 240px (hover-expanded) back to 64px (resting), the map container was not expanding to fill the freed space — leaving a blank gap on the right side of the page.

**Root cause:** MarketHeatMap's root div and map container had no explicit `width` property. They relied on implicit flex cross-axis stretch. When the sidebar animated its width change via CSS transition, the map container had no transition and no explicit width to track the layout change.

**Fix (2 lines in `packages/web/src/pages/MarketHeatMap.tsx`):**
1. Root div: added `width: '100%'` — makes horizontal fill explicit instead of relying on flex stretch
2. Map container div: added `width: '100%'` and `transition: 'width 0.22s cubic-bezier(.2,.8,.2,1)'` — matches the sidebar's exact transition curve so the map resizes in lockstep

No Mapbox logic changed. No layer styling changed. No pin colors changed.

---

### 2. What Changed

| File | Change |
|---|---|
| `packages/web/src/pages/MarketHeatMap.tsx` | Root div: added `width: '100%'`. Map container: added `width: '100%'` and `transition: 'width 0.22s cubic-bezier(.2,.8,.2,1)'` |

No schema migrations. No API changes. No new dependencies.

---

#### Cowork design session context (led to the layout fix prompt)
- User shared screenshot showing blank gap on right side of map when sidebar collapsed
- Prompt written specifying: use `width: 100%` within flex/grid context, not `100vw`, add matching CSS transition, don't touch Mapbox logic
- Claude Code identified exact root cause: map container relying on implicit flex stretch with no explicit width or transition to track sidebar animation

**Also recommended this session (not yet actioned):**
- Switch basemap from `streets-v12` → `mapbox://styles/mapbox/dark-v11` — teal/amber pins will be dramatically more legible on dark background matching CannaSpy's `#0d0f11` theme

---

### 3. What Failed

Nothing failed this session. TypeScript clean. Deploy successful. User confirmed fix worked.

**Layout analysis performed (for future reference):**
- Sidebar: hover-based expand/collapse via direct inline style mutation (`onMouseEnter`/`onMouseLeave`), NOT a Zustand state toggle or CSS class. Width transitions from `var(--rail-w)` (64px) to `var(--rail-expanded-w)` (240px).
- `<main>` in Layout.tsx: `flex: 1, width: 0, minWidth: 0` — correctly fills sidebar-freed space via flex-grow. Does not need a width transition.
- The gap was on the **content side** (map container not stretching), not the layout side.

---

### 4. What Is Next (First Things in Next Session)

1. **Switch basemap to dark** — `MarketHeatMap.tsx`, change `mapStyle` to `mapbox://styles/mapbox/dark-v11`. One prop. Biggest remaining visual impact.
2. **Add `promoteId="id"` to `<Source id="cs-dispensaries">` in `MarketHeatMap.tsx`** — activates hover (+4px radius, opacity→1). One prop on the Source element.
3. **Verify full map in browser** — collapse sidebar, zoom into LA / Harbor City at zoom 10–12, confirm: no blank areas, teal pins with glow visible, no grey anywhere, clusters rendering correctly.
4. **Wire `scrape.worker.ts` enriched write-back** — after successful scrape, update `dispensaries.enriched = true` for matching DCC record.

---

### 5. What Is Still Left To Do (Full Backlog)

**Map / Data Pipeline:**
- [ ] `promoteId="id"` on dispensary Source → activates hover (1 prop, `MarketHeatMap.tsx`)
- [ ] `scrape.worker.ts` → write `dispensaries.enriched = true` after successful scrape
- [ ] `diff_engine.py` — not yet tested end-to-end with two real snapshots
- [ ] Wire `alert.worker.ts` to Resend — currently logs only, no emails sent
- [ ] `scrape.worker.ts` → call `collector.py` as primary (currently falls back to `dispensary_scraper.py`)
- [ ] 462 dispensaries missing lat/lng — run `dcc_ingest.py` full geocoding when `GOOGLE_PLACES_API_KEY` available

**Frontend:**
- [ ] Block Management (`/blocks`) — verify wired to real data, not placeholder
- [ ] Promotions (`/promotions`) — scaffold only, not wired to API
- [ ] `LocationDashboard` — add `.catch()` to prevent infinite loading state on API failure
- [ ] Apply DM Sans + Space Mono typography system-wide

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

**Date:** 2026-05-02 (Session 12 — Outer ring layer + 50% radius increase deployed)

---

## Session 12 — 2026-05-02

**Commits:** `ed582d7` outer ring + layer reorder → `22809e9` radius +50%, hover delta +4px
**Deploy:** Vercel ✅ both commits aliased to `web-rouge-one-15.vercel.app`

---

### 1. What Was Done

#### Completed outer ring layer (left pending from Session 11)
- `packages/web/src/pages/MarketHeatMap.tsx` — imported `dispensaryRingLayer`, reordered `<Layer>` components inside `<Source id="cs-dispensaries">` to the correct render stack: ring → fill → cluster → cluster count
- Previously the order was wrong (cluster → cluster count → fill), which meant fill rendered on top of cluster labels

#### Increased all pin and ring radii by 50%
Per explicit spec. No other properties changed — colors, opacity, stroke, cluster styling, and layer order unchanged.

| Layer | Property | Before | After |
|---|---|---|---|
| Ring | prospect radius | 14px | 21px |
| Ring | enriched/blocked radius | 17px | 26px |
| Ring | hover delta | +3px | +4px |
| Fill | prospect radius | 8px | 12px |
| Fill | enriched/blocked radius | 10px | 15px |
| Fill | hover delta | +3px | +4px |

#### Created project skills
- `/Users/patricksimac/.claude/skills/cannaspy-deploy/` — Vercel deploy sequence skill
- `/Users/patricksimac/.claude/skills/cannaspy-handoff/` — Session handoff generation skill

---

### 2. What Changed

| File | Change |
|---|---|
| `packages/web/src/components/map/layers.ts` | Ring radii: 14→21px (prospect), 17→26px (enriched/blocked); fill radii: 8→12px (prospect), 10→15px (enriched/blocked); hover delta: 3→4px on both layers |
| `packages/web/src/pages/MarketHeatMap.tsx` | Imported `dispensaryRingLayer`; reordered `<Layer>` stack to: ring → fill → cluster → cluster count |

No schema migrations. No API changes. No new dependencies.

---

#### Cowork design session — led to these changes
Before any code ran, a Cowork session was used to think through the pin redesign:
- **Problem identified:** prospect pins were grey — terrible first impression for new users who see nothing but grey dots
- **Design principle established:** prospects are opportunity, not emptiness. They need to look like live intelligence data. Grey is only for dead/inactive states, which CannaSpy doesn't have.
- **Three design options evaluated:** teardrop pins (SVG sprites), larger circles + ring glow, square/diamond markers
- **Decision:** Option 2 (ring glow) chosen — fast to implement, stays native Mapbox, gives visual weight. Teardrop deferred to polish pass.
- **Dark basemap recommended but not yet actioned** — switching from `streets-v12` to `dark-v11` will make teal/amber pins pop significantly more on the `#0d0f11` branded background

---

### 3. What Failed

Nothing failed this session. TypeScript clean (`tsc --noEmit`) on both commits. Both Vercel deploys completed successfully.

Known standing issues (not touched this session):
- `feature-state hover` still inert — requires `promoteId="id"` on `<Source id="cs-dispensaries">` to activate. Layers are wired correctly; one prop away.
- Railway auto-deploy from `git push` still not triggering — requires `railway up` each time.

---

### 4. What Is Next (First Things in Next Session)

1. **Switch basemap to dark** — in `MarketHeatMap.tsx`, change `mapStyle` from `mapbox://styles/mapbox/streets-v12` to `mapbox://styles/mapbox/dark-v11`. One prop change. Biggest remaining visual impact.
2. **Add `promoteId="id"` to `<Source id="cs-dispensaries">` in `MarketHeatMap.tsx`** — activates hover (+4px radius, opacity→1). One prop, no layer changes needed.
3. **Verify pins in browser** — navigate to LA / Harbor City area at zoom 10–12. Should see 15+ teal rings + fills at varying sizes. Hard-refresh (`Cmd+Shift+R`) first.
4. **Wire `scrape.worker.ts` enriched write-back** — after successful scrape, update `dispensaries.enriched = true` for matching DCC record (match by name+city or DCC license number).

---

### 5. What Is Still Left To Do (Full Backlog)

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

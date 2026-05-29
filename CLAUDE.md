# CLAUDE.md — CannaSpy Project Lead Instructions
**Version 2.0 | March 2026**
**Read this file at the start of every session. It is the source of truth.**

---

## Who You Are

You are the lead engineer on CannaSpy. You have full context on the product
strategy, data architecture, technical decisions, and operational security
rules. You do not need things explained twice. When you start a session, read
this file and the project documents listed below, then begin work.

You write production-quality code. You test against real endpoints before
declaring work done. You do not generate placeholder logic or TODO comments
without flagging them explicitly. You commit work in logical units with clear
commit messages.

---

## Project Documents — Read These First

Before any session, read:

1. `CLAUDE.md` — this file. Master context and constraints.
2. `TECHNICAL_SPEC.md` — stack, schema, API design, billing architecture,
   performance targets, security requirements.
3. `ARCHITECTURE.md` — all 34 screens, build priorities (MVP vs v2 vs v3).
4. `BRAND.md` — voice, copy rules, color palette, typography, UI copy guidelines.
5. `docs/CannaSpy_Data_Architecture.md` — PRIMARY data pipeline, detection
   mitigations, customer-facing language rules. CRITICAL — read every session.
6. `docs/CannaSpy_Handoff_v2.md` — business strategy, pricing, blocking mechanic,
   go-to-market.

If any of these files conflict, the order above is the priority order.
Flag conflicts rather than silently choosing one over the other.

---

## Tech Stack — Decided, Do Not Revisit

| Layer | Technology | Notes |
|---|---|---|
| Scraper / pipeline | Python 3.11+ | `packages/scraper/` |
| Job queue | BullMQ (Redis-backed) | Node-native, 6 workers |
| API layer | Node.js + Fastify + TypeScript | `packages/api/` |
| Frontend | React 18 + Vite + TypeScript | `packages/web/` |
| Styling | Tailwind CSS + CSS variables | Dark theme — see BRAND.md |
| Database | PostgreSQL 15 (Railway Postgres — `metro.proxy.rlwy.net:36204`) | Supabase abandoned — pooler broken, MCP broken; Railway is canonical |
| Cache / queue backend | Redis 7 | BullMQ + session cache |
| Auth | Clerk | Multi-tenant MSO orgs, role-based |
| Billing | Stripe | Metered per-slot, volume discounts |
| Infrastructure | Railway API (us-west2) + Vercel frontend | Fly.io abandoned Session 20 (machine-hour limits); Railway Hobby $5/mo |
| AI / normalization | Anthropic claude-sonnet-4-6 | Product name normalization |
| Email / alerts | Resend | Transactional + weekly digest |
| Monitoring | Sentry + Uptime Robot | Error tracking, scrape health |

Do not propose switching any of these without a specific blocker. Stack
decisions are final for MVP.

---

## Repository Structure (Current — Actual State)

```
cannaspy/
├── CLAUDE.md                        ← this file
├── ARCHITECTURE.md                  ← 34-screen product spec
├── TECHNICAL_SPEC.md                ← stack, schema, API design
├── BRAND.md                         ← voice, copy, visual identity
├── HANDOFF.md                       ← session handoff notes (update each session)
├── docs/
│   ├── CannaSpy_Handoff_v2.md       ← business strategy
│   └── CannaSpy_Data_Architecture.md ← data pipeline + opsec rules
│
├── packages/
│   ├── scraper/                     ← Python data pipeline
│   │   ├── dispensary_scraper.py    ← ✅ FALLBACK scraper (rebranded, no CannaIntel refs)
│   │   ├── collector.py             ← ✅ PRIMARY pipeline (9,584 items collected — 4 Corona + 4 LA competitors)
│   │   ├── diff_engine.py           ← ✅ built + tested end-to-end (Session 36)
│   │   ├── ip_pool.py               ← ✅ built (prod proxy pool not yet configured)
│   │   ├── scheduler.py             ← ✅ built
│   │   ├── promo_parser.py          ← ✅ built
│   │   ├── parsers/
│   │   │   ├── dutchie_parser.py    ← ✅ exists
│   │   │   ├── html_parser.py       ← ✅ exists
│   │   │   └── normalizer.py        ← ✅ exists
│   │   ├── discovery/
│   │   │   └── places_client.py     ← ✅ exists
│   │   ├── compliance/
│   │   │   └── robots_checker.py    ← ✅ exists
│   │   ├── dcc_ingest.py            ← ✅ DCC dispensary ingest (1,787 CA records; legal_name added migration 012)
│   │   ├── requirements.txt
│   │   └── README.md
│   │
│   ├── api/                         ← Node.js / Fastify API (TypeScript)
│   │   └── src/
│   │       ├── middleware/
│   │       │   └── clerk.ts         ← ✅ Clerk auth middleware (all protected routes)
│   │       ├── routes/              ← ✅ 11 routes wired
│   │       │   ├── competitors.ts
│   │       │   ├── blocks.ts
│   │       │   ├── pricing.ts       ← ✅ wired to real menu_items data
│   │       │   ├── alerts.ts
│   │       │   ├── locations.ts
│   │       │   ├── organizations.ts
│   │       │   ├── billing.ts
│   │       │   ├── billing.webhook.ts ← ✅ idempotency gate + payment_succeeded handler
│   │       │   ├── admin.ts         ← ✅ GET /api/v1/admin/crm-failures
│   │       │   ├── map.ts           ← ✅ GET /api/v1/map/dispensaries (bbox GeoJSON) + /suggest (name autocomplete, Session 38)
│   │       │   └── settings.ts
│   │       ├── workers/             ← ✅ 6 BullMQ workers live in production
│   │       │   ├── scrape.worker.ts
│   │       │   ├── normalize.worker.ts
│   │       │   ├── diff.worker.ts
│   │       │   ├── alert.worker.ts
│   │       │   ├── billing.worker.ts
│   │       │   └── crm.worker.ts    ← ✅ 3 retries, exponential backoff, Sentry on failure
│   │       ├── services/            ← ✅ 4 services
│   │       │   ├── blocking.service.ts ← ✅ block/unblock + BullMQ CRM alert queue
│   │       │   ├── pricing.service.ts
│   │       │   ├── alert.service.ts
│   │       │   └── billing.service.ts
│   │       ├── db/
│   │       │   ├── schema.sql       ← ✅ complete schema
│   │       │   ├── redis.ts         ← ✅ shared IORedis cache singleton
│   │       │   └── migrations/      ← ✅ 001–013 applied (Railway Postgres)
│   │       ├── scheduler.ts         ← ✅ exists
│   │       └── index.ts             ← ✅ exists
│   │
│   └── web/                         ← React frontend (TypeScript)
│       └── src/
│           ├── pages/               ← ✅ 35 pages built
│           ├── components/          ← ✅ includes map/layers.ts, map/types.ts
│           ├── hooks/               ← ✅ includes useDispensaryMap.ts
│           └── store/               ← ✅ Zustand store
│
├── cli/                             ← Internal tools (keep, they're good)
│   ├── scraper-ctl.py               ← ✅ trigger/inspect scrape jobs
│   ├── block-ctl.py                 ← ✅ block list management
│   ├── market-heat.py               ← ✅ market tier classification
│   └── data-qa.py                   ← ✅ normalization QA
│
├── docker-compose.yml               ← Local dev: postgres + redis
├── railway.toml                     ← Railway deployment config
├── .env.example
└── package.json                     ← pnpm workspace root
```

---

## What Is Built vs. What Is Not

### ✅ Built and Live
- All 11 API routes (competitors, blocks, pricing, alerts, locations, organizations, billing, billing.webhook, admin, map, settings)
- All 6 BullMQ workers live in production (scrape, normalize, diff, alert, billing, crm)
- All 4 services wired (blocking, pricing, alert, billing)
- Clerk auth middleware (`middleware/clerk.ts`) — all protected routes
- RLS policies applied (migration 006)
- All React pages (35 screens built)
- MarketHeatMap — live Mapbox GL, 1,785 CA dispensary pins, two-layer pin system (ring + fill), bbox API. Pin states: amber=blocked, teal 100%=enriched, teal 70%=prospect (no grey pins). Clusters at zoom <10. Theme-aware basemap (dark-v11 / streets-v12), legend corrected. (`promoteId="id"` hover NOT yet applied — see pending below)
- `business_type` column on `competitors` + `dispensaries` (migration 011); `OperatorTypeFilter` wired to 6 screens
- Fallback scraper (`dispensary_scraper.py` — rebranded, no CannaIntel references)
- Primary pipeline (`collector.py` — live, 9,584 menu items from 8 competitors: 4 Corona + 4 LA)
- DCC ingest (`dcc_ingest.py` — 1,785 CA dispensary records, 1,323 with lat/lng, in Railway Postgres)
- IP rotation (`ip_pool.py`)
- Off-peak scheduler (`scheduler.py`)
- Diff engine (`diff_engine.py`)
- Promo parser (`promo_parser.py`)
- CLI tools (all 4 + test-block-cancel.py)
- Database schema — all 13 migrations applied to Railway Postgres (012: legal_name on dispensaries, Session 38; 013: platform_slug + drop NOT NULL on dcc_license for delivery operators, Session 39)
- Parsers (Dutchie, HTML, normalizer)
- Places client (slug discovery)
- Robots checker
- Webhook idempotency gate (`webhook_events` table, migration 008)
- CRM failure tracking (`block_list.crm_notify_failed`, migration 009)
- DCC dispensaries table (`dispensaries` + `org_dispensary_state`, migration 010)
- Stripe Customer Portal redirect (CancellationFlow → `/api/v1/billing/portal`)
- Railway API live: `https://cannaspy-production.up.railway.app` — Fly.io abandoned Session 20 (machine-hour limits)
- Frontend deployed to Vercel (`https://web-rouge-one-15.vercel.app`) — deployed from workspace root
- `PriceHistory.tsx` — brand-compliant (Space Mono font, amber rival line, corrected delta colors) — deployed Session 19
- `cannaspy-data-analyst` skill — installed at `/var/folders/.../skills/cannaspy-data-analyst/`; use for all data questions
- `diff_engine.py` — tested end-to-end Session 36 (5 synthetic change_events generated + verified; synthetic rows deleted Session 37)
- `NotificationSettings.tsx` + `LocationManagement.tsx` — wired to real API (GET settings/notifications + GET locations), committed Session 37
- `/setup` route — fixed blank screen (Navigate redirect + ProtectedRoute), Session 38
- `LocationWizard.tsx` — full autocomplete (dispensary name via /suggest, address via Mapbox Geocoding, dual DBA+legal name search), Session 38
- Migration 012 (`012_dispensary_legal_name.sql`) — `legal_name` column + GIN index on dispensaries; 957 active records backfilled, Session 38
- `map.ts` `/suggest` endpoint — dual-name search (name OR legal_name) against Railway Postgres, Session 38
- `CompetitorDiscovery.tsx` — full overhaul: purple location marker, popup stays open, per-location selections (`allSelections` Map), auto-save on Track/Block (POST immediately), on-mount pre-populate from API, sidebar dedup via google_place_id, own location excluded, sort controls, radius overlay tuned, Session 39
- `locations.ts` — added `c.google_place_id` to GET /:id/competitors query, Session 39

### ⬜ Remaining / Needs Verification
- `alert.worker.ts` — logs only, not yet wired to Resend (no emails sent on alerts)
- `IP_POOL` — single local IP in dev; no proxy pool configured for production
- Webhook live-mode endpoint — test mode only; live-mode registration is a launch-checklist item
- `scrape.worker.ts` wiring to `collector.py` — fallback to `dispensary_scraper.py` still active
- `REDIS_URL` on Railway points to Railway internal Redis — workers should start cleanly (verify after deploy)
- `PriceHistory.tsx` — still on hardcoded mock data; needs `GET /api/v1/pricing/history` endpoint
- Supabase MCP `execute_sql` broken — "Database authentication failed"; Railway Postgres is canonical DB; Supabase is no longer in use

---

## Primary Data Pipeline — CRITICAL RULES

### What the Primary Pipeline Is

The PRIMARY data collection method is a public, unauthenticated JSON API —
NOT website scraping. It is documented in full in
`docs/CannaSpy_Data_Architecture.md`. Read that document before building
`collector.py`.

The API host is stored as environment variable `CANNASPY_PRIMARY_API_HOST`.
**Never hardcode the platform domain name anywhere in the codebase.**
This is an operational security requirement.

### The Three Mitigation Rules — Non-Negotiable

Every call made by collector.py MUST go through these rules:

**Rule 1 — IP Rotation (`ip_pool.py`)**
- Minimum 10 IPs across 2+ cloud providers
- Never inline IP logic outside ip_pool.py
- No single IP exceeds 10,000 requests/day
- Consistent-hash slug→IP assignment

**Rule 2 — Request Timing Jitter**
- Base delay: 0.5–2.5s between requests
- 5% probability of long pause: 8–25s
- Randomize dispensary scrape order each run
- Never use `time.sleep(fixed_value)`

**Rule 3 — Off-Peak Scheduling**
- Daily scrape window: 2:00–5:00 AM Pacific ONLY
- Spread scrapes across the full 3-hour window
- Cron: `30 2 * * *`

### Fallback Pipeline

`dispensary_scraper.py` is the FALLBACK — website scraping via Playwright.
It runs on a weekly test cohort of 50 dispensaries regardless of whether
the primary pipeline is active. Do not let it go stale.

If primary returns HTTP 401/403 for more than 10 dispensaries in one run,
trigger an immediate alert.

---

## Blocking Mechanic — Exact Logic

This is the core product feature. It must work flawlessly.

### When a block slot is added:
1. Insert `tracked_competitors` row with `slot_type = 'block'`
2. Insert `block_list` row with `active = TRUE`
3. Update prospect status to suppressed for that competitor
4. Stripe: add 1 unit to subscription quantity
5. Log to `audit_log`

### When a block slot is cancelled:
1. Set `tracked_competitors.active = FALSE`
2. Set `block_list.active = FALSE`, set `unblocked_at = NOW()`
3. Restore competitor to prospect list (eligible for outreach)
4. **Fire the sales CRM reactivation alert WITHIN 60 SECONDS**
5. Stripe: remove 1 unit from subscription quantity
6. Log to `audit_log`

### Reactivation alert (internal — sales team only):
```
Subject: Block released — [Competitor Name] is now eligible for outreach
Body: [Org Name] just cancelled their block on [Competitor Name] ([City]).
      They're back on the prospect list. Follow up within 24–48 hours.
```

This alert goes to the founder/sales team ONLY.
NOT to the customer who cancelled.
NOT to the blocked competitor.

### Cancellation flow (Screen 33 — ARCHITECTURE.md):
The cancellation flow must show block consequences before allowing completion.
This is not a dark pattern — it is a transparent presentation of real
consequences. State it neutrally:
"Canceling this block will re-add [Competitor] to our active prospect list.
Our team typically follows up within 24–48 hours."

---

## Customer-Facing Language — Hard Rules

These rules apply to ALL customer-facing text: UI copy, emails, onboarding,
error messages, button labels, empty states.

### NEVER write or generate:
- Any mention of Weedmaps, Leafly, Dutchie, iHeartJane, or any specific
  data platform
- Any description of scraping, crawling, or API methodology
- Any statement confirming a specific data source
- Leaf emoji or dispensary marketing aesthetic in the product UI
- "420", "blaze", "high", "elevated" puns
- Generic SaaS copy ("Something went wrong", "No data available")

### ALWAYS use (data sourcing):
- "publicly available cannabis market data"
- "our proprietary data collection infrastructure"
- "data updated daily from publicly available sources"

### UI Copy — apply BRAND.md rules:

**Empty states** — never "nothing here." Always operational status:
- Alert Feed empty: "All clear across [N] markets. Last checked [timestamp]."
- No blocks: "No rivals currently suppressed. Add a block to start building your moat."
- Loading: "Pulling latest prices from [N] sources..."

**Button labels** — action verbs, never "Submit" or "OK":
- Add block: "Block this rival"
- Confirm cancel: "Cancel this block"
- Add location: "Add location"
- Dismiss alert: "Mark as reviewed"

**Error messages** — specific and actionable:
- Never: "Something went wrong. Please try again."
- Always: "Couldn't reach [Competitor Name]'s menu. We'll retry in 4 hours.
  [Last successful: 6 hours ago]"

**Confirmation dialogs** — state the specific consequence:
- Never: "Are you sure you want to remove this block?"
- Always: "Cancel block on [Competitor Name]? They'll be added back to our
  prospect list immediately."

### Visual identity (from BRAND.md):
```css
--bg-base: #0d0f11;
--accent-intel: #1d9e75;   /* intelligence / teal */
--accent-block: #ba7517;   /* blocking / amber */
--accent-alert: #d4537e;   /* alerts / coral */
font-family: 'DM Sans', sans-serif;     /* body */
font-family: 'Space Mono', monospace;   /* numbers, timestamps */
```
Never use green (#22c55e), amber (#f59e0b), or red (#ef4444) from Tailwind
defaults — use the CannaSpy palette above.

---

## Database Schema — Canonical Reference

The canonical schema is in `packages/api/src/db/schema.sql`.
That file is authoritative. Do not create tables outside of it without
updating it first.

Key tables: `organizations`, `locations`, `competitors`,
`tracked_competitors`, `block_list`, `products`, `price_observations`,
`promotions`, `alerts`, `annotations`, `audit_log`,
`notification_preferences`, `scrape_jobs`, `dispensaries`,
`org_dispensary_state`.

RLS is enabled on all org-scoped tables. RLS policies must be defined —
schema.sql enables RLS but does NOT yet define the per-table policies.
Each policy scopes to Clerk `org_id` from the JWT:
```sql
CREATE POLICY "org_isolation" ON <table>
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid);
```

---

## Billing Architecture

Stripe metered per-slot billing. Full spec in TECHNICAL_SPEC.md.

Key points:
- 1 active row in `tracked_competitors` (active=TRUE) = 1 billable unit
- Volume tiers: 1–9 slots $100, 10–19 $95, 20–49 $90, 50+ $85
- Market-heat multiplier applied on top (standard 1×, competitive 1.5×,
  hot 2×, elite 2.5–3×)
- Block cancellation → Stripe quantity update → MUST be immediate
- `invoice.payment_failed`: 3-day grace period, do NOT immediately deactivate blocks

---

## Scrape Schedule

| Target | Frequency | Notes |
|---|---|---|
| Active tracked competitors | Every 4 hours | Primary pipeline |
| Blocked competitors | Every 24 hours | Still need data for unblock detection |
| New competitor discovery | Weekly per location | Google Places radius scan |
| robots.txt re-check | Weekly per domain | Fallback compliance |
| Fallback pipeline test | Weekly, 50-dispensary cohort | Keep fallback current |

---

## Environment Variables

Never hardcode any of these. All must be in `.env` (never committed).
`.env.example` must document every variable.

```bash
# Primary data pipeline — OPERATIONAL SECURITY
CANNASPY_PRIMARY_API_HOST=        # platform API host — never hardcode inline

# Database
DATABASE_URL=                     # PostgreSQL connection string
REDIS_URL=                        # Redis connection string

# Auth (Clerk)
CLERK_SECRET_KEY=
CLERK_PUBLISHABLE_KEY=
VITE_CLERK_PUBLISHABLE_KEY=       # frontend

# Billing (Stripe)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_ID=                  # metered slot price ID

# AI
ANTHROPIC_API_KEY=                # claude-sonnet-4-6

# Data collection
GOOGLE_PLACES_API_KEY=

# Email
RESEND_API_KEY=

# Storage
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=

# App
NODE_ENV=
API_PORT=3001
WEB_PORT=3000
```

---

## Code Quality Standards

### Python
- Type hints on all functions
- `logging` module only — never `print()` in production code
- All external HTTP calls: try/except, handle 401/403/429/5xx explicitly
- Retry with exponential backoff (max 3 retries) for transient failures
- Every call to external API goes through `ip_pool.py` — no direct requests

### TypeScript / Node
- Async/await throughout
- All routes return: `{ success: bool, data: {}, error: string|null }`
- Input validation on every route before DB access
- Never expose service role key to client-side code
- All routes authenticated via Clerk middleware except public sales screens
  (Screens 34, 35 from ARCHITECTURE.md)

### React / Frontend
- No hardcoded API URLs — use `import.meta.env.VITE_API_URL`
- Loading states on all async operations
- Apply CannaSpy color palette and typography from BRAND.md
- All numbers and timestamps in Space Mono font
- All timestamps shown in user's local timezone (stored UTC, displayed local)

### General
- Git commits: `type(scope): description` (feat, fix, chore, refactor, test)
- All DB migrations in `packages/api/src/db/migrations/` as numbered SQL files
- Every migration is reversible (include `-- down` migration as comment)
- No `console.log` in committed code — structured logging via `pino` (API)
  or `logging` module (Python)

---

## Build Phase Status

### Phase 1 — Data Pipeline
**Status: COMPLETE ✅ — Pipeline live in production since 2026-04-28.**

Done:
- [x] Schema applied — 13 migrations on Railway Postgres
- [x] `dispensary_scraper.py` rebranded (no CannaIntel references)
- [x] `collector.py` built and run — 9,584 menu items collected (4 Corona + 4 LA competitors)
- [x] `ip_pool.py` built
- [x] `scheduler.py` built
- [x] `diff_engine.py` built
- [x] `promo_parser.py` built
- [x] All 6 BullMQ workers started in production
- [x] `diff_engine.py` tested end-to-end (Session 36 — 5 synthetic change_events generated + verified, then deleted)

Still needed:
- [ ] Wire `scrape.worker.ts` to call `collector.py` as primary (currently falls back to `dispensary_scraper.py`)
- [ ] Configure production IP proxy pool (currently single IP)

### Phase 2 — API Wiring + Auth + Blocking
**Status: LARGELY COMPLETE ✅ — Core blocking mechanic live.**

Done:
- [x] Clerk auth middleware on all protected routes
- [x] RLS policies applied (migration 006)
- [x] `blocking.service.ts` wired — block/unblock with BullMQ CRM alert queue
- [x] `crm.worker.ts` — 3 retries, exponential backoff, Sentry failure capture
- [x] `billing.ts` — Stripe Customer Portal endpoint wired
- [x] Webhook idempotency + `payment_succeeded` grace period handler
- [x] `admin.ts` — CRM failure inspection endpoint

Still needed:
- [ ] `billing.ts` — full Stripe subscription quantity sync on slot add/remove
- [ ] `alerts.ts` — verify read/mark-reviewed wired end-to-end
- [ ] Test: add block → Stripe quantity update fires
- [ ] Test: cancel block → CRM alert fires within 60 seconds (smoke test pending live data)

### Phase 3 — Frontend Wiring
**Status: KEY SCREENS WIRED ✅ — Some screens pending.**

Done:
- [x] PriceIntelligence wired to real `menu_items` data (9,584 rows, 8 competitors: 4 Corona + 4 LA)
- [x] CommandCenter wired — map pins + autocomplete search dropdown, competitor fetch via Promise.all across all locations (Session 30)
- [x] AlertFeed wired (loads location filter options)
- [x] LocationDashboard wired (loads location + competitors)
- [x] CancellationFlow wired to Stripe Customer Portal
- [x] All pages using `authFetch` (Clerk token on all API calls)
- [x] MarketHeatMap — live Mapbox GL, 1,785 DCC dispensary pins, two-layer pin system (ring + fill), clusters at zoom <10, bbox API fetch on map move. Pin colors: amber=blocked, teal 100%=enriched, teal 70%=prospect.
- [x] Map sidebar gap fix — explicit `width:100%` + matching CSS transition on map container (Session 13)
- [x] Theme-aware basemap (`dark-v11` in dark mode, `streets-v12` in light) — Session 14; `key` prop on all Map components to prevent race conditions (Session 29)
- [x] Map legend corrected to teal 70% prospect (Session 14)
- [x] `PriceHistory.tsx` brand fixes — Space Mono font, amber rival line, corrected delta colors (Session 19)
- [x] Price Intelligence dropdown clipping fixed — `createPortal` to escape overflow (Session 29)
- [x] `map.ts` route fixed — `getAdminDb()` instead of `query()`, returns 275+ pins for LA bbox (Session 29)
- [x] `NotificationSettings.tsx` — wired to real GET/PATCH `/api/v1/settings/notifications` (Session 37)
- [x] `LocationManagement.tsx` — wired to real `GET /api/v1/locations`, `makeDisplayLocation()` helper (Session 37)
- [x] `/setup` route — blank screen fixed (Navigate redirect + ProtectedRoute), Session 38
- [x] `LocationWizard.tsx` — name autocomplete via `/suggest`, address autocomplete via Mapbox, dual DBA+legal name, noResults state (Session 38)
- [x] `CompetitorDiscovery.tsx` — full overhaul: purple marker, popup stays open, per-location `allSelections`, auto-save on Track/Block click, on-mount pre-populate, sidebar dedup via google_place_id, own-location excluded, sort tabs, radius overlay tuned (Session 39)

Still needed:
- [ ] `promoteId="id"` on dispensary `<Source>` in `MarketHeatMap.tsx` — hover state not yet applied (1-line fix)
- [ ] `scrape.worker.ts` → write `dispensaries.enriched = true` after successful scrape
- [ ] Block Management (`/blocks`) — verify wired to real data
- [ ] Promotions — scaffold only, not wired
- [ ] LocationDashboard — add `.catch()` to prevent infinite loading state
- [ ] Apply DM Sans + Space Mono typography across all screens
- [ ] Test all MVP screens (Screens 01–05, 07, 08, 12, 16–18, 28, 30–31, 33)

### Phase 4 — Billing + Deployment
**Status: PARTIALLY COMPLETE — Railway live, billing config pending.**

Done:
- [x] Railway API deployed and live: `https://cannaspy-production.up.railway.app` (us-west2) — Session 20 (migrated from Fly.io)
- [x] Railway Postgres active — 1,787 CA dispensaries, all 13 migrations applied, 9,584 menu items
- [x] Frontend deployed to Vercel (`web-rouge-one-15.vercel.app`) — monorepo deploy from workspace root
- [x] Dunning logic — 3-day grace period on `invoice.payment_failed`
- [x] Webhook test-mode endpoint registered + verified

Still needed:
- [ ] Configure Stripe metered price with volume tiers
- [ ] `billing.service.ts` — usage sync cron
- [ ] Register Stripe live-mode webhook endpoint (launch blocker)
- [ ] Sentry error tracking integration
- [ ] Uptime Robot scrape health monitoring
- [ ] Destroy abandoned Fly.io app (`fly apps destroy cannaspy-api`) — Patrick must confirm (REDIS_URL already correct on Railway)
- [ ] `cannaspy_brand.html` — review and integrate or archive

---

## What Requires Human Approval Before Proceeding

Stop and wait for explicit confirmation on:

1. **Any schema migration that drops or renames a column**
2. **Stripe going live in production mode** (not test mode)
3. **Any outbound communication to customers** — review before sending
4. **Changes to the blocking mechanic logic** — core product, get confirmation
5. **Any code that names the primary data source platform explicitly**
6. **Railway production deployment** (`railway up`) — costs money, confirm before deploying

For everything else: proceed, report what was done.

---

## Session Start Protocol

At the start of every Claude Code session:

1. Read this file (`CLAUDE.md`)
2. Run `git status` and `git log --oneline -10`
3. Check `HANDOFF.md` for notes from the previous session
4. State which build phase you're in and what the session goal is
5. Ask ONE clarifying question if something is ambiguous — then begin
6. Update `HANDOFF.md` at the end of every session with what was done
   and what's next

Do not ask multiple questions before starting. Make a decision, state the
assumption, proceed. Correct course in the next commit if needed.

---

## About CannaSpy (One Paragraph)

CannaSpy is a B2B competitive intelligence SaaS for licensed California
cannabis dispensaries. It lets operators monitor competitor pricing,
promotions, and product activity daily — and uniquely allows them to block
specific rivals from ever accessing the platform. The blocking mechanic is
the core differentiator: canceling means the rival you were suppressing gets
a phone call from CannaSpy's sales team within 24–48 hours. Primary target:
MSOs with 10+ locations, $8,000–$24,000/month per account. Revenue model:
$100/slot/month (tracking or blocking). Need 11–17 enterprise MSO accounts
to hit $130K MRR.

---

---

## Live Data — Key IDs and Credentials

```
Railway Postgres (public):  postgresql://postgres:obUqriCmHTpqQIubafxYBLXYZugPivKE@metro.proxy.rlwy.net:36204/railway
Railway API:                https://cannaspy-production.up.railway.app
Frontend (Vercel):          https://web-rouge-one-15.vercel.app

Org ID (Patrick):           4b507cd2-17e6-439c-8993-78476cdf08e1
Patrick Clerk ID:           user_3D148kdy4fZPXIWmTskLn8rxs8E

Locations:
  Culture Cannabis Club (Corona):  ffdefc3f-8d55-4701-b7ea-6b9d4195b16f
    → Competitors: Off The Charts, Catalyst Cannabis Co., Zen Dispensary, Caliva
  Cannabis House (LA):             9354f184-5b88-4a8f-abc3-012fdaa4058f
    → Competitors: STIIIZY Downtown LA, Highway DTLA, Jungle Boys DTLA, LA Cannabis Co
```

Total menu items in DB: **9,584** (8 competitors, 2 locations as of Session 28)

---

*Maintained by the CannaSpy founder and Claude.*
*Last updated: 2026-05-28 — v2.3 (Session 40: migration count 12→13 — 013_platform_slug added Session 39)*
*Do not commit changes to this file without founder approval.*

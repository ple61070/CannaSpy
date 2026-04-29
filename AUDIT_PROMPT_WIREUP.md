# CannaSpy Front-End ↔ Back-End Wire-Up Audit
**For Claude Code in `/plan` mode. Paste this prompt verbatim after entering `/plan`.**

---

## Context

The visual/UX audit is complete. The plan file at `~/.claude/plans/composed-kindling-finch.md` documents ~80 visual/copy/accessibility defects across the 35 HTML mockups in `~/CannaSpy/CannaSpy_UI/cannaspy_bundle/`. Those are NOT in scope for this audit — they will be fixed in a separate batched implementation sprint.

This audit answers a different question: **for each of the 35 mockups, is there a working path from the React app to the API to the database, with auth, RLS, state management, error handling, and the cross-cutting flows (blocking, cancellation, billing, CRM alerts) wired correctly?** And where there isn't, what specifically is missing?

CLAUDE.md describes the React layer as having "15 pages scaffolded" and the API as having "7 routes scaffolded." Verify the actual state — those numbers may be stale.

## Scope — STRICTLY front-end / back-end wire-up

**DO audit, exhaustively:**

- React page existence and route mapping for each of the 35 mockups
- API route existence, shape, and conformance to `{ success, data, error }` envelope (CLAUDE.md TypeScript standard)
- Data shape contracts: does the JSON the API returns match what the React page expects to render?
- Clerk auth middleware coverage on every protected route
- RLS policies on every org-scoped table (schema enables RLS but CLAUDE.md flags policies as not yet defined)
- Org-id propagation: Clerk JWT → API middleware → SQL `auth.jwt() ->> 'org_id'` → row filter
- Mock vs. real data: where mockups embed JS arrays (`const RIVALS = [...]`, `const ALERTS = [...]`), are React equivalents pulling from the API or still mocked?
- State management: Zustand store coverage, what's local vs. shared, what's URL-state vs. component-state
- Loading / error / empty states: are these wired to actual fetch states (loading, error, data.length === 0) or only static markup?
- Mutation flows: optimistic updates, rollback on error, refetch on success
- Real-time/polling needs: alert feed, action queue, block analytics — implemented?
- BullMQ worker pipeline: scrape → normalize → diff → alert; are workers consuming the right queues with the right job shapes?
- The four cross-cutting flows (see "Critical Flows" section below)
- Environment variable plumbing: does every required var in CLAUDE.md exist in `.env.example`, are subprocesses receiving them, are React-side vars prefixed `VITE_`?

**DO NOT audit:**

- Visual / UX / copy / accessibility (done)
- Data pipeline internals (collector.py, ip_pool.py, scheduler.py — those are the Phase 1 scraper, audited separately)
- Database query performance / indexing strategy
- Backend business-logic correctness in isolation (e.g., is the diff algorithm correct)
- Deployment / Railway / AWS infrastructure
- The Python CLI tools (`cli/scraper-ctl.py` etc.) — those are internal admin

---

## Source-of-truth docs — read in this order

1. `~/CannaSpy/CLAUDE.md` — project rules, tech stack, build phase status, customer-facing language, blocking mechanic exact logic
2. `~/CannaSpy/TECHNICAL_SPEC.md` — stack, schema, API design, billing architecture
3. `~/CannaSpy/ARCHITECTURE.md` — all 34/35 screens, MVP vs v2 vs v3, what each screen is supposed to do
4. `~/CannaSpy/CannaSpy_UI/CANNASPY_DESIGN_SYSTEM.md` — token system + customer-facing language locks (§7)
5. `~/CannaSpy/packages/api/src/db/schema.sql` — canonical schema (CLAUDE.md says it's authoritative)
6. `~/CannaSpy/packages/api/src/db/migrations/001_init.sql` through `004_grace_period.sql` — migration history
7. `~/.claude/plans/composed-kindling-finch.md` — UI audit findings, especially the JS-data mocks per screen (those tell you what shape each page currently expects)

---

## Method — required steps, in order

### Step 1 — Inventory the actual state

Before any analysis, produce a ground-truth snapshot:

1. List every file in `packages/web/src/pages/`. Map each to its corresponding mockup (e.g., `SignUp.tsx → s01_FINAL.html`). Flag mockups with no React page.
2. List every file in `packages/web/src/components/`. Categorize by domain (shared, blocking, intelligence, billing, etc.).
3. List every route in `packages/api/src/routes/`. For each, document: HTTP methods exposed, auth wrapper present (yes/no), input validation present (yes/no), response envelope conformance (yes/no).
4. List every worker in `packages/api/src/workers/`. For each, document: queue name consumed, job shape expected, downstream side-effects.
5. List every service in `packages/api/src/services/`. Document what each is responsible for.
6. Read `packages/web/src/store/index.ts`. Document what state the Zustand store currently holds.
7. Read `packages/web/src/App.tsx`. Document the route table (which paths render which pages, what's wrapped in auth).
8. Apply state of `packages/api/src/db/schema.sql`: has it been applied to the dev database? (`list_migrations` via Supabase MCP if available; otherwise document as unverified.)

Produce a single inventory table at the top of the audit:

```
| Mockup | React page | API routes called | Auth | Mock vs real | Status |
|--------|-----------|-------------------|------|--------------|--------|
| s01    | SignUp.tsx | (signup is Clerk) | N/A  | n/a          | partial |
| s02    | (none)     | POST /locations   | ⬜    | mock         | not built |
| ...
```

### Step 2 — Per-screen wire-up audit

For each of the 35 mockups, document:

**Route layer:**
- Does a React page exist? Path: `packages/web/src/pages/...`
- Does the route appear in `App.tsx`? Path it's mounted at?
- Is it wrapped in Clerk's `<SignedIn>` or `RouteGuard` or equivalent? (S34 and S35 are public per `ARCHITECTURE.md` — flag if they're erroneously gated.)

**Data layer:**
- What API endpoints does this screen logically need? (Derive from the mockup's JS data structures — read the mock arrays/objects and reverse-engineer the request shape.)
- Do those endpoints exist in `packages/api/src/routes/`?
- Method, path, query/body shape, response shape — match between page and route?
- Any endpoints the page needs that don't exist yet?

**Mock data:**
- The mockup likely has hardcoded JS data (`const RIVALS = [...]`, `const ALERTS = [...]`, `const KPI = {...}`). Is the React equivalent:
  - Still using the same hardcoded data (mock — must replace)
  - Calling the API but the response shape doesn't match the component (mismatch — flag)
  - Calling the API correctly (wired — confirm)

**State management:**
- Where does this page's state live? Zustand store? React Query? Component state? URL params?
- Is it consistent with how similar screens manage their state?
- For multi-screen flows (S02→S03 onboarding, S16↔S17 add-block, S18 cancel-block), is shared state passed correctly?

**Mutations:**
- For action-driven screens (block, track, snooze, dismiss, cancel), what mutations does the page need?
- Where does the optimistic update happen? Where does the rollback?
- Does the mutation refetch the relevant queries on success?

**Loading / error / empty states:**
- Cross-reference with UI audit findings on empty states. Beyond presence of markup, are these wired to actual fetch states?
- Specifically: is loading skeleton shown while initial data is fetching? Is error UI shown on fetch failure? Is empty-state UI shown when `data.length === 0` (not when fetch is still pending)?

**Real-time / refresh:**
- Does the screen need to update without a page reload?
- S04 (Command Center): alerts arriving, freshness timestamp updating
- S12 (Alert Feed): new alerts arriving
- S35 (Action Queue): tasks appearing/completing
- S04 + S05 maps: location/competitor pin updates
- Is polling, websocket, or server-sent events implemented? If not, flag as a gap.

**Output format per screen:**

```
## sNN — [Screen name]

**React page:** packages/web/src/pages/Foo.tsx (✅ exists / ⬜ missing)
**Mounted in App.tsx at:** /path (or "not mounted")
**Auth wrapper:** Clerk SignedIn / RouteGuard / public / missing
**API endpoints needed:**
  - GET /api/competitors?location_id=X — ✅ exists / ⬜ missing
  - POST /api/blocks — ✅ exists / ⬜ missing
**Data shape:** match / mismatch (specify field-level deltas)
**Mock data status:** still mocked / partially wired / fully wired
**State management:** Zustand store slice / React Query / local state / URL params
**Mutations:** [list] — wired / not wired
**Loading state:** wired / static / missing
**Error state:** wired / static / missing
**Empty state:** wired / static / missing
**Real-time / refresh:** [if applicable] — implemented / gap

### Findings
- [P0/P1/P2/P3] [issue with file:line reference]
```

### Step 3 — Critical Flows (cross-cutting)

These flows span multiple files and must work end-to-end. Audit each as a flow, not as individual files.

#### Flow 1 — Block creation (Add Block)

Per CLAUDE.md "Blocking Mechanic — Exact Logic":

1. User clicks "Block this rival" on S04/S05/S16
2. Confirmation modal (S17) shows billing impact
3. On confirm:
   - INSERT `tracked_competitors` row with `slot_type = 'block'`
   - INSERT `block_list` row with `active = TRUE`
   - UPDATE prospect status to suppressed for that competitor
   - Stripe API: add 1 unit to subscription quantity
   - INSERT `audit_log` row
4. Toast confirms "Block activated — [Rival] can no longer access CannaSpy"

For each numbered step, document: which file is responsible, is it wired, what could fail silently, is the operation transactional (all-or-nothing)?

#### Flow 2 — Block cancellation (the load-bearing one)

Per CLAUDE.md, this fires the sales CRM alert within 60 seconds. THE CORE PRODUCT MECHANIC.

1. User clicks "Cancel this block" on S18 or S33
2. On confirm:
   - UPDATE `tracked_competitors.active = FALSE`
   - UPDATE `block_list.active = FALSE`, `unblocked_at = NOW()`
   - Restore competitor to prospect list
   - **Fire sales CRM reactivation alert WITHIN 60 SECONDS** (Resend → founder@cannaspy email + any CRM webhook)
   - Stripe API: remove 1 unit from subscription quantity
   - INSERT `audit_log` row

Audit specifically:
- What guarantees the 60-second SLA on the CRM alert? Is it a synchronous email send? A queued job? A cron? If queued, what's the queue check interval?
- What happens if Stripe call fails mid-flow? Is the cancel rolled back? Or does the cancel proceed and Stripe sync is retried later?
- Is the prospect-list restoration a DB UPDATE or an event that triggers downstream re-eligibility?
- Is there a test (`packages/api/src/**/*.test.ts`) that exercises this flow?

This flow is the product's existential mechanic. If it fails silently, the company can't sell. Treat any gap as P0.

#### Flow 3 — Billing sync (Stripe metered)

Per CLAUDE.md and TECHNICAL_SPEC.md:
- 1 active row in `tracked_competitors` (active=TRUE) = 1 billable unit
- Volume tiers applied: 1–9 slots $100, 10–19 $95, 20–49 $90, 50+ $85
- Market-heat multiplier on top: standard 1×, competitive 1.5×, hot 2×, elite 2.5–3×
- `invoice.payment_failed` → 3-day grace period, do NOT deactivate blocks (per migration `004_grace_period.sql`)

Audit:
- Does `packages/api/src/routes/billing.ts` expose subscription state to the React layer? What endpoint?
- Does S28 (Billing & Slot Usage) and S19 (Upcoming Billing Preview) consume that endpoint, or do they use mock data?
- Where is the volume-tier × market-heat-multiplier math implemented? Server-side (correct) or client-side (must move)?
- `billing.webhook.ts` — does it handle `invoice.payment_failed`? Does it set the grace-period flag? Does it skip deactivation during the 3-day window?
- Is there an admin/internal way to see the grace-period state? (Important for support.)

#### Flow 4 — Auth & RLS

Per CLAUDE.md: "RLS is enabled on all org-scoped tables. RLS policies must be defined — schema.sql enables RLS but does NOT yet define the per-table policies."

Audit:
- For every org-scoped table in `schema.sql`, is there a corresponding `CREATE POLICY` statement somewhere? (`grep -r "CREATE POLICY" packages/api/src/db/`) Tables to check: `organizations`, `locations`, `competitors`, `tracked_competitors`, `block_list`, `products`, `price_observations`, `promotions`, `alerts`, `annotations`, `audit_log`, `notification_preferences`, `scrape_jobs`.
- For every API route in `routes/`, is the Clerk middleware attached? (Look for `fastify.addHook('preHandler', clerkAuth)` or per-route equivalent.)
- Is the `org_id` extracted from the Clerk JWT and forwarded to SQL queries? Or do queries trust client-supplied `org_id` (security hole — flag P0)?
- Public routes (S34, S35 from `ARCHITECTURE.md`): are these explicitly excluded from auth? Do they leak any org-scoped data?

### Step 4 — Worker pipeline

Per CLAUDE.md, the queue chain is:
```
scrape.worker → (raw_observations) → normalize.worker → (normalized_products) → diff.worker → (change_events) → alert.worker → (alerts table + Resend email)
```

Audit:
- Open each worker file. Document: queue name, job shape consumed, queue name produced, side-effects.
- Are the queue names consistent across files? (One worker producing to `normalize-queue` and another consuming from `normalize_queue` is a wire-up gap.)
- Does the scrape worker call `collector.py` (primary) or `dispensary_scraper.py` (fallback)? Per CLAUDE.md Phase 1 status, `collector.py` is not built — verify the worker handles this gracefully (fallback or error) rather than crashing.
- Does `alert.worker.ts` write to the `alerts` table AND send email via Resend? Or only one? Per S12 the alerts table is the source of truth for the Alert Feed UI; per S30 email digest is a delivery channel.

### Step 5 — Environment variable audit

Per CLAUDE.md, every variable in the `.env` block must exist in `.env.example`.

1. Read `~/CannaSpy/.env.example`. List every variable.
2. Cross-reference against the CLAUDE.md "Environment Variables" section. Flag any documented variable missing from `.env.example`.
3. For each variable, grep the codebase for usage. Flag variables that are documented but never used.
4. Frontend variables: must be prefixed `VITE_` to be exposed to the browser. Verify `VITE_API_URL` and `VITE_CLERK_PUBLISHABLE_KEY` exist and are referenced from React code only via `import.meta.env.VITE_*`.
5. Backend variables: must NOT have the `VITE_` prefix. Verify the service-role key and Stripe secret never appear in any file under `packages/web/`.
6. CLAUDE.md global rule: never hardcode the primary API host. Grep the codebase for any hardcoded data-platform domain string. Flag P0 if found.

### Step 6 — Type-safety contracts

If a shared types package exists (`packages/shared/`, `packages/types/`, etc.), audit:
- Are the response shapes for each route exported as TypeScript types?
- Does the React side import those types when consuming the API?
- If not — identify where the contract is implicit (frontend assumes a shape; backend returns a different shape; both compile because TypeScript can't see the gap).

If no shared types package exists: that's the primary wire-up gap. Recommend its creation as part of any wire-up sprint.

### Step 7 — End-to-end smoke verification (optional, only if dev DB is reachable)

If the dev database is reachable and the API can be started locally:
1. Run `pnpm dev` in `packages/api`.
2. Hit each route with `curl` using a Clerk test JWT. Document which routes return `{ success: true, data: ... }`, which return `{ success: false, error: ... }`, which 500.
3. Run `pnpm dev` in `packages/web`. Hit each page in the browser. Document which pages render, which crash, which show mock data, which show empty states.

If the dev DB or API can't be started in this session, skip Step 7 and call it out — it's a manual verification for the implementation phase.

---

## Deliverable format

Save the audit to a new plan file: `~/.claude/plans/wireup-audit-<timestamp>.md`. Do NOT amend the UI audit plan — they're separate artifacts.

Top-level structure:

```
# CannaSpy Wire-Up Audit
## Date / Scope / Severity scale

## Inventory (Step 1)
[the table from Step 1]

## Critical Flows
### Flow 1 — Block creation
### Flow 2 — Block cancellation (P0 if broken)
### Flow 3 — Billing sync
### Flow 4 — Auth & RLS

## Worker Pipeline (Step 4)

## Environment Variables (Step 5)

## Type-Safety Contracts (Step 6)

## Per-Screen Findings (Step 2)
### s01 — Sign Up
...
### s35 — Action Queue

## End-to-End Smoke (Step 7) — if executed

## Recurring gaps across the bundle
[patterns appearing on 5+ screens]

## Top 10 highest-impact wire-up gaps
[ranked by blast radius, not by count]

## Recommended sequencing for the wire-up sprint
[Phase A: foundation (auth, RLS, type contracts), Phase B: read paths,
 Phase C: write paths + mutations, Phase D: real-time. Do NOT order by mockup
 number — order by dependency.]
```

---

## Severity calibration

- **P0** — production blocker. Examples: cancel-block flow does not fire CRM alert; RLS missing on org-scoped table allowing cross-tenant data leakage; billing webhook silently swallows `payment_failed`; primary API host hardcoded in committed code.
- **P1** — ship blocker. Examples: half the MVP screens have no React page; Clerk middleware missing on protected routes; Stripe quantity sync not wired.
- **P2** — significant gap. Examples: page exists but uses mock data; data shape mismatch between API and component; loading state not wired (always shows empty state).
- **P3** — should fix during wire-up sprint. Examples: minor field naming inconsistency; route returns shape doesn't match `{ success, data, error }` envelope but works.
- **P4** — nit. Examples: consolidate two near-identical types; rename a function for clarity.

Mark subjective findings explicitly with `(subjective)`.

---

## Constraints

- **Plan mode only.** Do NOT modify any source files. Audit produces a markdown plan file as its only output.
- **Exception:** if Step 7 is executed (smoke test), starting dev servers and hitting endpoints is fine; do not COMMIT changes from those runs.
- **Do not duplicate UI-audit findings.** This audit produces wire-up findings only. If a wire-up issue happens to surface a UI defect already in the UI plan, reference it by ID and move on.
- **Do not invent endpoints that don't exist** in `packages/api/src/routes/`. The audit is fact-finding, not design.
- Every finding must reference: a file path, a function or route name, and where applicable, a line number or specific symbol.

---

## Begin

Start by:
1. Confirming the seven reference docs you'll read.
2. Listing the inventory directories you'll walk first (`packages/web/src/pages/`, `packages/api/src/routes/`, `packages/api/src/workers/`, `packages/api/src/services/`, `packages/api/src/db/migrations/`, `packages/web/src/store/`, `packages/web/src/App.tsx`).
3. Stating the assumed dev-DB reachability (will Step 7 run, or is it deferred?).

Then proceed through Steps 1–7 in order. Stay in plan mode. Do not edit source files.

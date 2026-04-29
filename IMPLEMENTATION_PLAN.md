# CannaSpy Implementation Plan
**Version 1.0 | 2026-04-27**

**Source audits:**
- UI/UX: `~/.claude/plans/composed-kindling-finch.md` (~80 visual/copy/a11y defects, 21 visual rendering findings, 13 WCAG axe categories)
- Wire-up: `~/.claude/plans/wireup-audit-2026-04-27.md` (~60 front-end ↔ back-end gaps across 35 mockups, 15 React pages, 9 API routes, 5 workers, 4 services)

---

## Why this document exists

The two audits together surface ~140 distinct defects. Working through them by mockup number or by audit order means re-touching the same files three or four times — once for the wire-up rewrite, once for color-semantic fixes, once for ARIA, once for mobile. This plan orders the work by **dependency** so each file gets touched once per sprint, and so production-affecting bugs ship before cosmetic cleanup.

The plan is organized into seven sprints. Sprint 0 is production hot fixes — ships in isolation, on its own branch, before anything else. Sprints 1–2 are infrastructure (webhooks, workers, API contracts). Sprint 3 (mockup polish) can run in parallel with Sprint 2 because mockups aren't deployed. Sprints 4–6 build on the foundation laid by 1–3.

Every work item references the audit finding it resolves so traceability is preserved. Do not work from this document without the two source audits open alongside it.

---

## Severity recap

- **P0 — production blockers in deployed/about-to-deploy code** (3 findings)
- **P1 — ship blockers** (~12 findings)
- **P2 — significant gaps** (~30 findings)
- **P3/P4 — should-fix-but-not-blocking** (~95 findings)

The plan ships P0s in Sprint 0, P1s across Sprints 1–5, P2s in their natural dependency layer, and batches P3/P4 within whichever sprint touches the same file.

---

## Sprint sequence at a glance

| Sprint | Focus | Duration | Blocks |
|---|---|---|---|
| 0 | Production hot fixes | 2–3 days | Nothing — ship immediately |
| 1 | Webhook + worker correctness | 3–4 days | Sprints 5, 6 |
| 2 | API contracts + schema | 3–5 days | Sprints 5, 6 |
| 3 | Mockup polish (parallel with Sprint 2) | 3–5 days | Sprint 5 conversion |
| 4 | Bundle-wide accessibility | 3–5 days | After Sprint 3 |
| 5 | Missing React pages | 5–10 days | After Sprints 1, 2, 3 |
| 6 | Real-time, polish, public sales pages | 3–5 days | After Sprint 5 |

Total: ~22–37 days of focused work for a single engineer; less with parallelization.

---

## Sprint 0 — Production hot fixes

**Goal:** Stop the bleeding. These are P0/critical-P1 bugs in code that's deployed (or about to be). They ship as their own PR, on a hot-fix branch, independent of any other work.

**Pre-conditions:** None. These are urgent.

### S0.1 — Fix `sendSalesAlert` silent failure on block cancellation

**Audit ref:** Wire-up Top-10 #2 (P0). Block-cancel flow is the load-bearing product mechanic per CLAUDE.md.

**Files:**
- `packages/api/src/services/blocking.service.ts` lines 94–151

**What's wrong:** `cancelBlock` calls `setImmediate(() => sendSalesAlert(...).catch(err => console.error(...)))`. If Resend has a transient failure, the 60-second CRM alert SLA is silently missed with no retry, no dead-letter, no Sentry. The sales team is never notified that a block was released.

**Fix:**
1. Replace the `setImmediate` fire-and-forget with a BullMQ job. Add a `crm-alert-queue` (or reuse `alert-queue` with a discriminator field).
2. The queue producer is `cancelBlock`; the consumer is a new worker `crm.worker.ts` that calls `sendSalesAlert` with at-least-once delivery.
3. BullMQ retry policy: 3 attempts, exponential backoff starting at 30s. If all 3 fail, flag `block_list.crm_notify_failed = TRUE` (new column) and fire a Sentry alert.
4. `crm_notified_at` is set on first successful delivery, not on enqueue.
5. Add an internal admin route `GET /api/v1/admin/crm-failures` that lists `block_list` rows with `crm_notify_failed = TRUE`.

**Migration needed:** Add `crm_notify_failed BOOLEAN DEFAULT FALSE` to `block_list`. Migration `005_crm_notify_failed.sql`.

**Success criteria:**
- Force a Resend failure (invalid API key in test env) → cancel a block → verify 3 retries occur → verify `crm_notify_failed = TRUE` after 3rd failure → verify Sentry event raised.
- Restore valid API key → manually re-enqueue the failed job → verify alert delivers and `crm_notified_at` is set.

### S0.2 — Wire `CancellationFlow` Step 2 to actually cancel

**Audit ref:** Wire-up Top-10 #1 (P0). Subscription cancellation UI does nothing.

**Files:**
- `packages/web/src/pages/CancellationFlow.tsx` lines 113–118
- `packages/api/src/routes/billing.ts` (new endpoint)

**What's wrong:** The "Cancel subscription" button has `// TODO: Call cancellation API` and just calls `navigate('/command-center')`. No API call. No Stripe interaction. No confirmation.

**Fix path A (recommended for hot fix):** Redirect to Stripe Customer Portal so cancellation goes through Stripe's hosted cancellation UI. Stripe fires `customer.subscription.deleted` on completion → `billing.webhook.ts` already cascades to `cancelBlock()` for every active block. Minimum surface area to fix.

1. Add `POST /api/v1/billing/portal` route that creates a Stripe billing portal session and returns the URL.
2. Replace the TODO in `CancellationFlow.tsx` with a fetch to that route, then `window.location = portalUrl`.
3. Remove the "Pause for 30 days", "Reduce slot count", "Pause one location" cards from the UI for now (they have no handlers — see audit P2). Add them back in Sprint 6 when they're real.

**Fix path B (longer, defer to Sprint 5):** Build native cancellation UI inside the app, calling `stripe.subscriptions.update({cancel_at_period_end: true})` directly. More work, more edge cases. Don't do this in Sprint 0.

**Success criteria:**
- Click "Cancel subscription" → redirected to Stripe portal → cancel from portal → verify `customer.subscription.deleted` fires → verify all active blocks `cancelBlock`'d → verify CRM alerts queue (per S0.1).

### S0.3 — Handle `invoice.payment_succeeded` to clear grace period

**Audit ref:** Wire-up Top-10 #3 (P1, but functionally P0 because of customer-trust impact). Documented in detail in earlier discussion: a customer who pays after a card decline still has their blocks auto-deactivated 72h later, which fires sales alerts to all their blocked competitors.

**Files:**
- `packages/api/src/routes/billing.webhook.ts`

**Fix:**
1. Add `case 'invoice.payment_succeeded':` to the webhook switch.
2. On payment success, set `organizations.grace_period_ends_at = NULL` for the matching `stripe_customer_id`.
3. Insert audit_log row: `{ event: 'grace_period_cleared', organization_id, stripe_invoice_id }`.
4. Verify webhook idempotency: if the same `invoice.payment_succeeded` event fires twice (Stripe will retry on non-2xx), the second call must be a no-op. Use Stripe's `event.id` as an idempotency key — store processed event IDs in a `webhook_events` table or use Stripe's idempotent request handling.

**Migration needed:** `webhook_events` idempotency table (`event_id TEXT PRIMARY KEY, processed_at TIMESTAMP DEFAULT NOW()`). Migration `006_webhook_idempotency.sql`.

**Success criteria:**
- Trigger Stripe test webhook for `invoice.payment_failed` on a test org → verify `grace_period_ends_at` set to `NOW() + 72h`.
- Trigger Stripe test webhook for `invoice.payment_succeeded` on same org → verify `grace_period_ends_at` cleared to `NULL`.
- Trigger same `invoice.payment_succeeded` event ID a second time → verify webhook returns 200 with no DB changes.

### S0.4 — Remove `DUTCHIE` strings from S03 mockup data

**Audit ref:** UI Pass 1 P0. Customer-facing platform name leakage per CLAUDE.md.

**Files:**
- `cannaspy_s03_FINAL.html` lines 699, 701, 703, 704, 705 (`platform: 'DUTCHIE'`)

**Fix:** Replace all four `'DUTCHIE'` with `'MENU PROVIDER'` (matches the existing STIIIZY treatment). Or delete the `platform` field entirely — it's customer-visible metadata that arguably shouldn't be exposed at all.

**Note:** This fixes the mockup. The `platform: 'dutchie'` enum value in `competitors.ts` schema (line 11) is internal classification and stays — that's a database value, not customer-visible. Verify no React page renders that enum value to the user without translation.

**Success criteria:**
- `grep -ri "dutchie" CannaSpy_UI/cannaspy_bundle/` returns zero matches.
- `grep -ri "dutchie" packages/web/src/` returns zero matches.

### Sprint 0 deliverable

A single hot-fix branch `hotfix/cancel-flow-and-crm-alerts` with the four changes above. Independent CI pass. Ship to production immediately. Do not bundle with other sprints.

---

## Sprint 1 — Webhook + worker correctness

**Goal:** Bring the data pipeline online and make webhooks idempotent and complete. Without this sprint, no data flows through the system in production.

**Pre-conditions:** Sprint 0 merged.

### S1.1 — Start the scrape/normalize/diff/alert workers

**Audit ref:** Wire-up Top-10 #5 (P1). `index.ts` only imports `billing.worker`.

**Files:**
- `packages/api/src/index.ts` (or new `packages/api/src/worker-process.ts`)
- `package.json` (add a `worker` script)

**Fix:** Choose an architecture:

**Option A (simpler, recommended for MVP):** Add lazy imports for all 4 workers in `index.ts` after `app.listen()`, mirroring the billing.worker pattern. All workers run in the same process as the API.

```ts
// packages/api/src/index.ts, after app.listen():
await import('./workers/scrape.worker');
await import('./workers/normalize.worker');
await import('./workers/diff.worker');
await import('./workers/alert.worker');
await import('./workers/billing.worker');
await import('./workers/crm.worker'); // from S0.1
```

**Option B (production-grade, defer to scale phase):** Create `worker-process.ts` as a separate entry point. Run via `pnpm worker` script. Deploy as a separate Railway service. Shared codebase, separate runtime.

For MVP: Option A. Document Option B as the next step when CPU/memory pressure on the API container shows up.

### S1.2 — Wire `alert.worker` to actually call Resend

**Audit ref:** Wire-up Top-10 #4 (P1). Customer alert pipeline ends in `console.log`.

**Files:**
- `packages/api/src/workers/alert.worker.ts` lines 89–93
- `packages/api/src/db/schema.sql` (organizations table)

**Fix:**
1. Add `contact_email TEXT` column to `organizations` if not already present (verify against schema.sql). Migration `007_org_contact_email.sql`.
2. In `alert.worker.ts`, replace the `console.log` with a `resend.emails.send()` call.
3. Email goes to `organizations.contact_email`, not to a per-user email (we don't have that data yet).
4. Subject line and body templated based on `alert_type` (price-drop, new-promotion, new-rival, etc.).
5. Respect `notification_preferences.alert_types` and `quiet_hours_start/end` — don't dispatch outside the user's quiet window; queue for next available delivery slot.
6. On Resend failure: 3 retries (BullMQ), then mark `alerts.delivery_failed = TRUE` and Sentry alert.

**Migration:** Add `delivery_failed BOOLEAN DEFAULT FALSE` and `delivered_at TIMESTAMP` to `alerts`. Migration `008_alert_delivery_status.sql`.

**Success criteria:**
- Trigger a test alert insert → verify `alert.worker` picks it up → verify Resend sends to `contact_email` → verify `delivered_at` populated.
- Set `quiet_hours_start = 22:00, quiet_hours_end = 08:00` → trigger alert at 23:00 → verify delivery deferred to 08:00.

### S1.3 — Idempotent webhook handling (covers all cases)

**Audit ref:** Beyond audit — flagged in my response. Stripe will retry on non-2xx; without idempotency, duplicate events cause double-processing.

**Files:**
- `packages/api/src/routes/billing.webhook.ts`

**Fix:** Use the `webhook_events` table from S0.3. Wrap every `case` branch in:
```ts
const existing = await query('SELECT 1 FROM webhook_events WHERE event_id = $1', [event.id]);
if (existing.rowCount > 0) return reply.send({ received: true });
// ... handle event ...
await query('INSERT INTO webhook_events (event_id) VALUES ($1)', [event.id]);
```

Apply to: `invoice.payment_failed`, `invoice.payment_succeeded`, `customer.subscription.updated`, `customer.subscription.deleted`.

**Success criteria:**
- Send the same Stripe event ID twice → verify second call short-circuits with no side effects.
- Send 100 unique events in parallel → verify all 100 process correctly with no race conditions.

### S1.4 — Fix `scrapeQueue.obliterate({ force: true })` on every restart

**Audit ref:** Wire-up Step 7 structural concern #3.

**Files:**
- `packages/api/src/scheduler.ts` (`startScheduler` function)

**Fix:** `obliterate({ force: true })` destroys all in-flight jobs on every server restart. Replace with idempotent reschedule:

```ts
const existing = await scrapeQueue.getRepeatableJobs();
const expectedKey = 'daily-2am-pacific';
if (!existing.find(j => j.id === expectedKey)) {
  await scrapeQueue.add('scheduled-scrape', {}, {
    repeat: { cron: '30 2 * * *' /* 2:30 AM Pacific */, key: expectedKey }
  });
}
```

**Success criteria:** Restart the server 3 times → verify the daily scheduled job exists exactly once each time → verify in-flight job count is unchanged across restarts.

### S1.5 — Fix duplicate IORedis connection in `normalize.worker`

**Audit ref:** Wire-up Step 7 structural concern #4.

**Files:**
- `packages/api/src/workers/normalize.worker.ts` line 17

**Fix:** Reuse the BullMQ connection's underlying client instead of creating a second IORedis instance. Or extract a single `redis-client.ts` module that both BullMQ and cache-layer code import.

**Success criteria:** `lsof -i | grep <redis-port>` shows one connection from the worker process, not two.

### Sprint 1 deliverable

Branch `feat/worker-pipeline-online`. Workers running. Webhooks idempotent. Alert emails actually sending. Verify all of this against a staging Supabase instance before promoting.

---

## Sprint 2 — API contracts + schema

**Goal:** Lock the data contracts so Sprint 5 (React pages) can build against stable shapes. Without this, Sprint 5 work has to be reworked when API shapes shift.

**Pre-conditions:** Sprint 0 merged. Sprint 1 in progress (no hard dependency, but webhook idempotency tables should exist before contract work).

### S2.1 — Apply the canonical schema to dev Supabase

**Audit ref:** CLAUDE.md Phase 1 status: "schema.sql ... has not been applied."

**Files:**
- `packages/api/src/db/schema.sql`
- `packages/api/src/db/migrations/001_init.sql` through `004_grace_period.sql`
- New: `005_crm_notify_failed.sql` (from S0.1), `006_webhook_idempotency.sql` (from S0.3), `007_org_contact_email.sql` (from S1.2), `008_alert_delivery_status.sql` (from S1.2)

**Fix:** Use Supabase MCP `apply_migration` for each file in order. Verify against `list_migrations` after each.

**Note from CLAUDE.md:** "Any schema migration that drops or renames a column" requires explicit approval. None of the migrations above do that — they only add columns and tables. No approval needed beyond review.

### S2.2 — Standardize API response envelopes

**Audit ref:** Wire-up Recurring Gap 2. `competitors.ts`, `locations.ts`, `organizations.ts` return raw objects; others wrap in `{ success, data, error }`.

**Files:**
- `packages/api/src/routes/competitors.ts` — GET /:id, GET /:id/prices, GET /:id/promotions, POST /
- `packages/api/src/routes/locations.ts` — GET /, GET /:id, POST /, PATCH /:id, etc.
- `packages/api/src/routes/organizations.ts` — GET /me, POST /
- All consuming hooks/pages

**Fix:** All routes return `{ success: boolean, data: T, error: string | null }`. Update every consumer:
- `useAlerts.ts`, `useBlocks.ts`, `usePriceMatrix.ts`, every page
- Replace defensive `data.alerts || data.data?.alerts` with `data.data.alerts`

**Migration risk:** Frontend deploy must lag backend deploy by zero seconds, or both must ship behind a single feature flag, or use API versioning (`/api/v2/`). Recommended: ship as `/api/v2/` so v1 stays valid until web cutover; remove v1 in Sprint 6.

### S2.3 — Create shared types package

**Audit ref:** Wire-up Step 6. No `packages/shared/` exists; type contracts are duplicated and drift.

**Files:**
- New: `packages/shared/types/api.ts` exporting all API response types
- New: `packages/shared/types/db.ts` exporting all DB row types
- `packages/shared/package.json`
- Consumers: `packages/web/`, `packages/api/`

**Fix:** Define contracts:
```ts
// packages/shared/types/api.ts
export interface ApiResponse<T> { success: boolean; data: T; error: string | null; }

export interface Block { id: string; competitor_id: string; competitor_name: string; competitor_address: string; blocked_at: string; unblocked_at: string | null; notify_on_unblock: boolean; crm_notified_at: string | null; crm_notify_failed: boolean; }
export interface Alert { id: string; alert_type: string; competitor_id: string; competitor_name: string; location_id: string | null; location_name: string | null; old_value: string | null; new_value: string | null; confidence: number; reviewed: boolean; reviewed_by: string | null; reviewed_at: string | null; created_at: string; }
export interface UsageResult { total_slots: number; tracking_slots: number; blocking_slots: number; monthly_cost: number; discount_tier: string; next_billing_date: string; next_tier_at: number | null; }
// ... etc for all entities
```

API services import these and use them as return types. React hooks import them as the shape of `data.data`.

**Success criteria:** `tsc --noEmit` across the monorepo passes. `grep -r "interface Alert" packages/web/src/` returns zero results (only the shared one is imported).

### S2.4 — Fix data-shape mismatches identified in audit

**Audit ref:** Multiple wire-up findings.

**Files and fixes:**
- `packages/api/src/services/billing.service.ts` `getUsage()` — compute and return `next_tier_at` (next slot count threshold above current). Wire-up #9 (P2).
- `packages/api/src/routes/pricing.ts` — return `is_online_orderable` from `menu_items` so frontend can show actual stock state instead of `inStock: true` hardcode. Wire-up S07 P2.
- `packages/api/src/services/billing.service.ts` `getUsage()` — apply the market-heat multiplier from `tracked_competitors.market_tier` (currently ignored). Wire-up Flow 3.
- DELETE `packages/api/src/services/pricing.service.ts` — dead code, divergent from `routes/pricing.ts`. Audit confirmed it's unused. Wire-up S07 P2.

### S2.5 — Add aggregate promotions endpoint

**Audit ref:** Wire-up Top-10 #6, Recurring Gap 7. S08 PromotionsTracker has no API endpoint.

**Files:**
- New: `GET /api/v2/promotions?location_id=&competitor_id=&active=true` in `routes/promotions.ts` (or extend `competitors.ts`)

**Fix:** Returns active promos across the org, scoped via the locations join. Response shape defined in `packages/shared/types/api.ts`.

**Note:** Wire to React in Sprint 5, not now. Just ship the endpoint here.

### Sprint 2 deliverable

Branch `feat/api-contracts-v2`. Schema applied. All routes on `/api/v2/`. Shared types package. Data shape mismatches resolved. Frontend still on `/api/v1/` — cutover happens in Sprint 5.

---

## Sprint 3 — Mockup polish (parallel with Sprint 2)

**Goal:** Fix everything wrong with the 35 HTML mockups so Sprint 5 (React conversion) can copy from clean source. Mockups aren't deployed; this work is parallelizable with Sprint 2.

**Pre-conditions:** Sprint 0 merged. Can run in parallel with Sprint 1 and 2.

This sprint is structured as four passes through the bundle. Each pass is a single find/replace or per-screen edit batch.

### S3.1 — JS bug fixes (P1, breaks core interactivity)

**Audit refs:** UI Pass 1 S01, S02, S03, S04 P1 findings; Pass 2 S13-J1, S16-J2.

| File | Issue | Fix |
|---|---|---|
| `s01_FINAL.html` line 767 | `getElementById('tl')` doesn't exist | Either remove the `.textContent =` line or add `<span id="tl">` element |
| `s02_FINAL.html` | Same `'tl'` bug | Same fix |
| `s03_FINAL.html` line 860 | Same `'tl'` bug | Same fix |
| `s03_FINAL.html` lines 699, 701, 703, 704, 705 | DUTCHIE strings | Already done in Sprint 0 — verify |
| `s04_FINAL.html` | Sparse RIVALS array, stale `detail-panel` ID, stale `.list-item-title` selector | (a) Remove leading comma in array literal. (b) Change `getElementById('detail-panel')` to `'detailPanel'`. (c) Change `.list-item-title` to `.li-title` |
| `s13_FINAL.html` line 417 | `var(--warn,#d4900a)` typo | Change to `var(--warm)` then re-evaluate semantic per S3.2 |
| `s13_FINAL.html` | Modal z-index 800/801 vs toast 9000 | Bump modal to z-index 9100, toast to 9200 (per design system §4.4 spec, modal=9000, toast=9100+) |
| `s16_FINAL.html` line 806 | Block-add toast says "rival contacted within 24 hours" — factually backwards | Change to "Block activated — [Rival Name] can no longer access CannaSpy" |

### S3.2 — Color semantics fixes (P2, design system §2 violations)

**Audit ref:** UI Pass 2 B10. `--warm` (amber) reserved for "rival is blocking you." Currently misused for general warnings on 10+ screens.

**Files and fixes:**
- `s05_FINAL.html` `.sev-high` — change `var(--warm)` → `var(--warning)`
- `s10_FINAL.html` `.overlap-mid` line 192 — change `var(--warm)` → `var(--warning)`
- `s10_FINAL.html` line 337 (Exclusive SKUs star) — change `var(--warm)` → `var(--accent)`
- `s11_FINAL.html` `.pi-partial` line 175 — change `var(--warm)` → `var(--warning)`
- `s19_FINAL.html` `.expiry-banner.warning`, `.eb-label.warning`, `.cd-num.warn` — change `var(--warm)` → `var(--warning)`
- `s27_FINAL.html` `.ann-entity` for "MedMen WeHo" line 324 — change `var(--warm)` → neutral entity color (suggest `var(--slate)`)
- `s29_FINAL.html` Manager role dot line 243 — change `var(--warm)` → `var(--slate)` (permission level, not blocking)
- `s29_FINAL.html` `MARKET_COLORS.Hot = 'var(--warm)'` line 286 — keep if Hot tier means "rival is blocking you in this market"; else change to `var(--warning)` (verify intent with founder)
- `s30_FINAL.html` `.save-dot` line 238 — change `var(--warm)` → `var(--warning)`
- `s30_FINAL.html` `.mb-weho`, `.mb-dtla`, `.mb-sf` lines 227–229 — replace location-arbitrary colors with neutral tokens
- `s31_FINAL.html` `healthColor()` line 562, `.sd-warn`, `.h-warn`, `.spy-log-warn` — change `var(--warm)` → `var(--warning)`
- `s31_FINAL.html` `.v-danger` for "Blocked" status — change to `.v-rose` per design system §2 (your blocks use rose, not red)

**Audit ref:** UI Pass 2 B11. Elite tier rendered in `--danger` red.

- `s21_FINAL.html` `.tier-elite` line 164 — change `color: var(--danger)` → `color: var(--accent)` (Elite is positive)
- `s21_FINAL.html` `TIER_COLORS` line 300 — replace hardcoded hex with CSS-var lookup
- `s22_FINAL.html` Elite tier — same fix
- `s29_FINAL.html` `MARKET_COLORS.Elite` line 286 — same fix

### S3.3 — Customer-facing language and copy fixes (P3 mostly)

**Audit refs:** UI Pass 1 various; UI Pass 2 B9; cancellation disclosures.

**Cancellation timeframe consistency (24 hours → 24–48 hours):**
- `s19_FINAL.html` cancel decision text line 460 — add "within 24–48 hours"
- `s28_FINAL.html` line 447 — change "within 24 hours" to "within 24–48 hours"
- `s34_FINAL.html` line 123 — change "within 24 hours of your cancellation" to "within 24–48 hours of your cancellation"

**Prorated forfeiture disclosure (third required cancel disclosure):**
- `s19_FINAL.html` cancel decision panel — add "Prorated remainder of the current billing period is forfeited" in mono 11px `var(--text-3)` styling

**Cannabis emoji removal (CLAUDE.md prohibition on cannabis aesthetic):**
- `s10_FINAL.html` lines 364–376 (🌿 Flower, 🔥 Pre-rolls, 💨 Vapes) — replace with SVG icons
- `s23_FINAL.html` lines 253–255 — same emoji removal
- `s27_FINAL.html` line 298 (🔥 reaction) — replace with `⚡` or `★`

**MRR label fix:**
- `s04_FINAL.html` left-panel stats strip — change "MRR" label to "Monthly slot cost"
- `s05_FINAL.html` left-panel stats — same fix

**Other copy:**
- `s01_FINAL.html` required-field asterisks — change `var(--rose)` → `var(--text-3)` (rose reserved for "your blocks")
- `s06_FINAL.html` "cannot access CannaSpy" — change to "visibility suppressed" (per audit P3 finding)
- `s06_FINAL.html` `YOUR_EXCLUSIVES` — replace "Stiiizy Pods" demo data with non-rival brand
- `s32_FINAL.html` line 237 — change "Every tracked dispensary monitored between 2–5 AM Pacific, every day" to "Daily, in the early morning hours"

### S3.4 — Mobile layout fixes (P2 = hidden functionality, P3 = clipping)

**Audit ref:** UI Pass 2 V4–V21.

**P2 — primary functionality hidden on mobile:**
- `s24_FINAL.html` mobile — restructure so the "Track / Track and Block / Watch only / Dismiss" decision panel sits above the fold on first render. Hero alert can compress.
- `s27_FINAL.html` mobile — annotation feed must remain visible alongside (or above) the new-annotation form. Consider a tabbed view with feed default-active.
- `s29_FINAL.html` mobile — location access matrix must render at mobile widths. Suggested: switch to a per-member card view on mobile (one card per member, with an expandable "locations" section) instead of a horizontal matrix.
- `s30_FINAL.html` mobile — settings content must render alongside (or below) the category nav. Use accordion sections instead of nav + content split.
- `s35_FINAL.html` mobile — task list must render alongside (or above) the task detail. Suggested: collapsible task list at top, detail panel below; selecting a task scrolls/expands the detail.

**P3 — table column clipping (apply pattern):**
- `s10_FINAL.html`, `s11_FINAL.html`, `s25_FINAL.html`, `s26_FINAL.html`, `s28_FINAL.html`, `s31_FINAL.html` — wrap data tables in `overflow-x: auto` containers with a visible scroll-shadow affordance on the right edge so users know to scroll.

**P3 — overflow on individual elements:**
- `s06_FINAL.html` — hero "STIIIZY West Hollywood" wrapping 3 lines: shrink hero font on mobile or set `text-wrap: balance`.
- `s08_FINAL.html` — KPI pill row at top: use `overflow-x: auto` with horizontal scroll and visible scroll affordance.
- `s13_FINAL.html` — topbar action tabs: use a chevron-truncation pattern or move secondary actions into a `⋯` menu on mobile.
- `s17_FINAL.html` — long CTA button text: split label into action ("Confirm block") + adjacent metadata ("$67 today, then $500/mo May 1") above the button.
- `s32_FINAL.html` — KPI labels truncating: increase grid columns to 1 on mobile (full-width stat cards).

**P3 — map absent on mobile:**
- `s21_FINAL.html` — add a "Map view requires a wider screen" banner with a "View list instead" CTA so users aren't confused by a missing map.

### Sprint 3 deliverable

Branch `feat/mockup-polish`. All 35 HTML files updated. Re-run Playwright at desktop + mobile in both themes. Compare to pre-fix screenshots. Console errors should be eliminated.

---

## Sprint 4 — Bundle-wide accessibility

**Goal:** Make the bundle WCAG 2.1 AA compliant before any React conversion happens. Cheaper to fix in HTML than to retrofit in JSX.

**Pre-conditions:** Sprint 3 merged.

### S4.1 — Add `<main>` and `<h1>` to all 35 mockups

**Audit ref:** UI Pass 2 axe AX1, AX2.

**Fix:** Every mockup gets:
- A single `<main>` element wrapping the primary content area (after the nav rail, after the topbar)
- A single `<h1>` for the page title (visually shown or `sr-only` if the design hides it)

This is a bulk find-and-replace pattern. Establish the pattern on S04 first (the canonical), then apply to all 35.

### S4.2 — Make scrollable regions keyboard-focusable

**Audit ref:** UI Pass 2 axe AX3.

**Fix:** Every scrollable `<div>` (lists, tables, scrollable cards) gets `tabindex="0"`. Add the canonical CSS:

```css
[tabindex="0"]:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
```

### S4.3 — Add ARIA labels to icon-only nav links

**Audit ref:** UI Pass 1 B7, UI Pass 2 B8.

**Fix:** All 28 collapsible-rail mockups (S08–S35) get `aria-label="<screen name>"` on every `<a class="nav-link">` containing only an SVG icon.

### S4.4 — Fix color contrast failures (S07 highest priority)

**Audit ref:** UI Pass 2 axe AX4 (24 failures S07), AX6 (3 failures S04), AX10 (9 failures S12), AX13 (1 failure S16).

**Fix:** Use a contrast checker tool (axe-core or manual) against each flagged element. Adjust the relevant CSS variable or apply a per-element override.

S07 KPI stat labels are the most impactful — those are the primary data display elements of the most-visited screen.

### S4.5 — Fix nested-interactive and unlabeled-checkbox violations

**Audit ref:** UI Pass 2 axe AX7 (S04), AX8 (S12 7 unlabeled checkboxes), AX9 (S12 7 nested), AX12 (S16 unnamed icon button).

**Fix per screen:**
- `s04`: restructure the rival list-item DOM so the nested clickable price detail isn't inside the row's main click target
- `s12`: each `.bulk-checkbox` gets dynamic `aria-label="Select alert: <alert-title>"`. Restructure so the checkbox isn't inside another interactive container.
- `s16`: `.btn-icon` (block analytics icon) gets `aria-label="View block analytics"`

### S4.6 — Fix landmark-region violations

**Audit ref:** UI Pass 2 axe AX11 (S16: 55 elements outside any landmark).

**Fix:** Wrap content sections in `<section>`, `<aside>`, or `<article>` as appropriate. The S04 P1 landmarks already exist as a reference pattern. Apply the pattern to S16 and any other screen with high region-violation counts.

### S4.7 — Re-run axe across all 35 screens

**Audit gap:** Pass 2 axe was only run on 5 MVP screens. Sprint 4 should run axe on all 35 and address whatever else surfaces.

**Fix:** `npx @axe-core/cli ./cannaspy_bundle/*.html --tags wcag2a,wcag2aa --save audit_renders/axe_full.json`. Append findings to the plan and resolve before sprint close.

### Sprint 4 deliverable

Branch `feat/mockup-a11y`. All 35 mockups pass axe with zero AA violations. Re-render screenshots. Sprint output is a clean source for the React conversion.

---

## Sprint 5 — Missing React pages

**Goal:** Convert polished mockups into React pages, including the MVP-critical missing ones. This is the largest sprint.

**Pre-conditions:** Sprints 1, 2, 3, 4 merged.

### S5.1 — S01 Org Setup form

**Audit ref:** Wire-up Top-10 #8 (P1).

**Files:**
- `packages/web/src/pages/SignUp.tsx` — add post-Clerk multi-step form
- `packages/api/src/routes/organizations.ts` — verify `POST /` accepts the form payload

**Fix:** After Clerk auth, render a multi-step form collecting: company name, primary contact email, expected slot count. POST to `/api/v2/organizations`. Then redirect to Stripe Checkout for initial subscription setup. Then `/setup/locations`.

### S5.2 — S06 Competitor Profile page

**Audit ref:** Wire-up Top-10 #7 (P1).

**Files:**
- New: `packages/web/src/pages/CompetitorProfile.tsx`
- `packages/web/src/App.tsx` — add `/competitors/:id` route
- `packages/web/src/components/intelligence/CompetitorRow.tsx` — change onClick from `/blocks` to `/competitors/:id`

**Source mockup:** `s06_FINAL.html`. Consume `GET /api/v2/competitors/:id`, `GET /api/v2/competitors/:id/prices`, `GET /api/v2/competitors/:id/promotions`.

### S5.3 — S08 PromotionsTracker — wire to real endpoint

**Audit ref:** Wire-up Top-10 #6 (P1).

**Files:**
- `packages/web/src/pages/PromotionsTracker.tsx`
- Endpoint already exists from S2.5

**Fix:** Replace the empty mock with a `useEffect` calling `GET /api/v2/promotions`. Wire loading, error, empty states.

### S5.4 — BlockConfirm reachability path

**Audit ref:** Wire-up S17 P1. BlockConfirm is currently unreachable in the normal product flow.

**Files:**
- `packages/web/src/pages/BlockManagement.tsx` "Block this rival" button — navigate to `/blocks/confirm` with state instead of `/setup/competitors`
- New flow: from CompetitorProfile (S5.2), add a "Block this rival" CTA navigating to `/blocks/confirm`
- From LocationDashboard, similar wiring

### S5.5 — Frontend cutover from `/api/v1/` to `/api/v2/`

**Pre-condition:** Sprint 2 shipped `/api/v2/` with standardized envelope.

**Files:** Every `useAuthFetch` call across `packages/web/src/`.

**Fix:** Bulk-replace `/api/v1/` with `/api/v2/`. Update consumer code to use `data.data` instead of inconsistent shapes. Verify with E2E click-through.

### S5.6 — Atomic block transactions

**Audit ref:** Wire-up Top-10 #10 (P2).

**Files:**
- `packages/api/src/services/blocking.service.ts` `addBlock`, `cancelBlock`

**Fix:** Wrap DB operations in a `BEGIN`/`COMMIT` transaction. Move the Stripe call to a compensating action: if Stripe fails, log to `audit_log` and enqueue a BullMQ retry. The DB-side block is committed; Stripe sync becomes eventually consistent.

### Sprint 5 deliverable

Branch `feat/missing-pages-and-cutover`. Three new pages, frontend on `/api/v2/`, transactions atomic, BlockConfirm reachable.

---

## Sprint 6 — Real-time, polish, public sales pages

**Goal:** Round out the product. Polling, error toasts, public-facing pages, deferred fixes.

**Pre-conditions:** Sprint 5 merged.

### S6.1 — Polling on CommandCenter and AlertFeed

**Audit ref:** Wire-up Recurring Gap 1.

**Files:**
- `packages/web/src/hooks/useAlerts.ts` — add `pollInterval` option
- `packages/web/src/pages/CommandCenter.tsx` — pass `pollInterval={30_000}`
- `packages/web/src/pages/AlertFeed.tsx` — pass `pollInterval={60_000}`

### S6.2 — Global error toast pattern

**Audit ref:** Wire-up Recurring Gap 3.

**Files:**
- New: `packages/web/src/hooks/useToast.ts`
- New: `packages/web/src/components/shared/ToastContainer.tsx`
- All async operations across all pages — replace silent `catch(() => setLoading(false))` with `toast.error(...)`

### S6.3 — Public sales pages S34, S35

**Audit ref:** Wire-up Top-10 #11/12 area, S34/S35 P1.

**Files:**
- New: `packages/web/src/pages/ROIDemo.tsx` (s34)
- New: `packages/web/src/pages/MarketSnapshot.tsx` (s35)
- `packages/web/src/App.tsx` — register at `/demo` and `/market/:market` OUTSIDE the `ProtectedRoute` wrapper

### S6.4 — Address autocomplete in LocationWizard

**Audit ref:** Wire-up S02 P2.

**Files:**
- `packages/web/src/pages/LocationWizard.tsx` — integrate Google Places Autocomplete
- `.env.example` — document `VITE_GOOGLE_MAPS_API_KEY`

### S6.5 — Wire Zustand store as actual shared cache

**Audit ref:** Wire-up Recurring Gap 4. Store is dead code.

**Files:**
- `packages/web/src/components/shared/Layout.tsx` — fetch locations once, populate store
- All other pages — read locations from store instead of re-fetching

**Decision:** If the store can't be made useful in this sprint, delete it. Dead scaffolding is worse than no scaffolding.

### S6.6 — BlockManagement and BlockConfirm tier-aware pricing

**Audit ref:** Wire-up Recurring Gap 6.

**Files:**
- `packages/web/src/pages/BlockManagement.tsx` line ~X — replace `blocks.length * 100` with API-returned per-block cost from `getUsage`
- `packages/web/src/pages/BlockConfirm.tsx` — replace hardcoded $100/slot with API call to `getUsage` showing the tier-adjusted cost

### S6.7 — Remove `/api/v1/` routes

**Pre-condition:** Frontend cutover (S5.5) merged. Two-week cooling period to confirm no v1 traffic in logs.

**Files:** Delete the v1 prefix mount in `packages/api/src/index.ts`.

### Sprint 6 deliverable

Branch `feat/realtime-and-polish`. Production-ready feature parity with the original mockup intent.

---

## Cross-cutting checklist

These items don't fit a sprint cleanly but must be true at the end:

- [ ] Test coverage exists for the cancel-block flow (Sprint 5 or earlier — write at least one integration test that simulates the full cancel → CRM alert → Stripe sync chain)
- [ ] Sentry is collecting errors from API, workers, and frontend
- [ ] `.env.example` matches CLAUDE.md exactly (add `VITE_GOOGLE_MAPS_API_KEY`, remove `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`)
- [ ] Rate limiting (`@fastify/rate-limit`) applied to all mutation routes — already installed per node_modules, never used per audit
- [ ] CLAUDE.md updated to reflect what's actually built vs. aspirational ("15 pages scaffolded" → reality)
- [ ] HANDOFF.md updated with what each sprint shipped

---

## Risks and unknowns flagged for founder decision

1. **Workers in API process vs. separate process.** Sprint 1 picks Option A (same process). Re-evaluate at scale.
2. **`MARKET_COLORS.Hot = var(--warm)`** in S29 — design intent unclear. Founder confirms semantic before Sprint 3.
3. **S01 onboarding payment requirement** — should Stripe Checkout block product access, or run as a soft trial? CLAUDE.md says "before monitoring activates" — confirm exact gate before Sprint 5.
4. **CRM alert delivery target** — currently a single `SALES_ALERT_EMAIL`. Once a real CRM (HubSpot, Salesforce) is integrated, refactor `sendSalesAlert` to call its API instead of email.
5. **Test infrastructure** — zero tests exist today. Sprint 1 should at minimum add an integration test harness before Sprint 5 conversion work.

---

## Closing

Both audit plans (`composed-kindling-finch.md`, `wireup-audit-2026-04-27.md`) remain the source of truth for individual finding details. This document is the sequencing layer over them. Update both audit files with `STATUS: resolved in Sprint N` markers as work completes — that's the single canonical record of what's done vs. outstanding.

Estimated total effort: 22–37 days for one engineer; 12–20 days with parallelization between Sprints 2 and 3.

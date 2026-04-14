# CannaSpy Session Handoff
**Date:** 2026-04-13 (Session 3)

---

## What Was Completed This Session

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

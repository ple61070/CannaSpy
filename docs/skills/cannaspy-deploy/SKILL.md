# CannaSpy Deploy Skill
Reference for all deployment operations. Read before any deploy or env var change.

---

## Infrastructure

| Service | URL | Platform |
|---|---|---|
| API | `https://cannaspy-production.up.railway.app` | Railway Hobby ($5/mo, us-west2) |
| Frontend | `https://web-rouge-one-15.vercel.app` | Vercel (auto-deploy on git push) |
| Database | `https://cbhbrbkirzpncpxlvehk.supabase.co` | Supabase PostgreSQL 15 |
| Redis/Queue | Railway internal | Railway (same project as API) |

---

## Railway API Deploy

```bash
cd /Users/patricksimac/CannaSpy
railway up --detach
railway logs --tail
curl https://cannaspy-production.up.railway.app/health
```

**Costs money. Confirm with Patrick before running.**

Required response: `{"status":"ok"}`. Never declare a Railway deploy done without this.

### nixpacks.toml gotcha
The install phase MUST use `NODE_ENV=development` so devDependencies (including `tsc`) are available:
```toml
[phases.install]
cmds = ["NODE_ENV=development pnpm install --frozen-lockfile"]
```
Without this, `tsc: not found` kills the build.

---

## Vercel Frontend Deploy

**Vercel auto-deploys on every `git push origin main`.** No manual step needed.

```bash
git add <files>
git commit -m "type(scope): description"
git push origin main
# Vercel picks it up in ~60-90 seconds
```

### Verify the deploy landed:
```bash
# Check Railway URL is baked in (confirms VITE_API_URL worked):
curl -s https://web-rouge-one-15.vercel.app/assets/index-*.js | grep -c "cannaspy-production"
# Must be > 0

# Check data-theme is in HTML (confirms CSS will work):
curl -s https://web-rouge-one-15.vercel.app | grep 'data-theme'
# Must show: <html lang="en" data-theme="dark">
```

### Critical: VITE_* env vars in Vercel builds
Vercel reads `packages/web/.env.production` at build time for `VITE_*` vars.
- This file IS committed to git (`.env.production` was removed from `.gitignore` in Session 26)
- Do NOT put secrets in this file — it's in git
- `VITE_MAPBOX_TOKEN` CANNOT be committed (GitHub push protection blocks it) — it lives only as a Vercel env var
- Secrets go in Vercel env vars via dashboard or `vercel env add`

Contents of `packages/web/.env.production`:
```
VITE_API_URL=https://cannaspy-production.up.railway.app
VITE_CLERK_PUBLISHABLE_KEY=pk_test_Y29uY3JldGUtc3F1aXJyZWwtNDcuY2xlcmsuYWNjb3VudHMuZGV2JA
```

### Critical: data-theme on <html>
`packages/web/index.html` must have `data-theme="dark"` on the `<html>` element.
Without it, all CSS variables (`--bg`, `--text-1`, etc.) are undefined — the page renders as unstyled white.
`Layout.tsx` overrides this after hydration, but the initial default must be set in HTML.

---

## DB Migrations

Files in `packages/api/src/db/migrations/` as numbered SQL files (001–011 applied).
Apply via Supabase SQL editor (MCP `execute_sql` broken as of Session 24).

---

## Git Convention

```
git commit -m "type(scope): description"
```
Types: `feat`, `fix`, `chore`, `refactor`, `test`, `docs`

---

## When to Deploy What

| Change type | Deploy target |
|---|---|
| Any `packages/api/` change | Railway only |
| Any `packages/web/` change | Vercel — auto via git push |
| `VITE_*` env var change | Update `packages/web/.env.production` + git push |
| Railway env var change | Railway dashboard + `railway up --detach` |
| Schema migration | Supabase SQL editor, then Railway deploy |

---

## GitHub Push Protection

GitHub blocks pushes containing secrets (API keys, tokens). The Mapbox `pk.*` token triggers this.
Never commit `VITE_MAPBOX_TOKEN` — strip it from any `.env` file before committing.
It is already set as a Vercel env var and will be injected at build time.

---

## Post-Deploy Health Check Sequence

```bash
# 1. API alive
curl -s https://cannaspy-production.up.railway.app/health
# → {"status":"ok"}

# 2. Frontend styled (not white page)
curl -s https://web-rouge-one-15.vercel.app | grep 'data-theme="dark"'

# 3. Frontend hitting Railway (not relative /api)
curl -s https://web-rouge-one-15.vercel.app/assets/index-*.js | grep -c "cannaspy-production"
# → ≥ 1

# 4. Auth route returns 401 (confirms Clerk middleware running)
curl -s https://cannaspy-production.up.railway.app/api/v1/competitors
# → {"success":false,"error":"Unauthorized"}
```

---

## Legacy / Abandoned

- **Fly.io** — abandoned Session 20 (machine-hour limits). Pending cleanup: `fly apps destroy cannaspy-api` (Patrick must confirm).
- **Railway Postgres** — deprecated. Supabase is the canonical DB.
- Manual two-step Vercel deploy (`vercel build --prod && vercel deploy --prebuilt`) — only needed if auto-deploy is unavailable. Git push is preferred.

# Skill: CannaSpy Deploy
**Version 1.0 | Created 2026-05-08**

Use this skill whenever deploying API or frontend changes to production.

---

## Deploy API to Fly.io

```bash
cd /Users/patricksimac/CannaSpy
/opt/homebrew/bin/flyctl deploy --app cannaspy-api --remote-only 2>&1 | tail -25
```

**What remote-only means:** Build happens on Fly.io's infrastructure, not locally. Required because Rollup native modules are macOS-only and won't build in the Linux sandbox.

**Success looks like:**
```
✔ [1/2] Machine ... is now in a good state
✔ [2/2] Machine ... is now in a good state
✓ DNS configuration verified
Visit your newly deployed app at https://cannaspy-api.fly.dev/
```

**Verify after deploy:**
```bash
curl -s https://cannaspy-api.fly.dev/health
# Expected: {"status":"ok","timestamp":"..."}

curl -s 'https://cannaspy-api.fly.dev/api/v1/map/dispensaries?bbox=-118.5,33.9,-118.0,34.2&limit=3'
# Expected: {"success":true,"data":{"type":"FeatureCollection",...},"count":3}
```

---

## Deploy Frontend to Vercel

**Always deploy from workspace root — never from `packages/web/`.**

```bash
cd /Users/patricksimac/CannaSpy
~/Library/pnpm/vercel --prod --yes 2>&1 | tail -15
```

**Why workspace root matters:** `pnpm-lock.yaml` lives at the workspace root. Deploying from `packages/web/` causes `pnpm install --frozen-lockfile` to fail (lockfile not found) once the build cache expires.

**Success looks like:**
```
✓ Production: https://web-rouge-one-15.vercel.app
```

**Verify after deploy:**
```bash
curl -s -o /dev/null -w "%{http_code}" https://web-rouge-one-15.vercel.app
# Expected: 200

curl -s -o /dev/null -w "%{http_code}" https://web-rouge-one-15.vercel.app/market/heat-map
# Expected: 200 (SPA rewrite must work)
```

---

## Managing Fly.io Secrets

Setting a secret triggers an automatic rolling restart (no manual redeploy needed).

```bash
# View current secrets
/opt/homebrew/bin/flyctl secrets list -a cannaspy-api

# Set one or more secrets
/opt/homebrew/bin/flyctl secrets set -a cannaspy-api KEY1=value1 KEY2=value2

# Required secrets (as of 2026-05-08)
SUPABASE_URL                = https://cbhbrbkirzpncpxlvehk.supabase.co
SUPABASE_SERVICE_ROLE_KEY   = eyJ... (from Supabase dashboard → Settings → API)
CLERK_SECRET_KEY            = sk_live_...
CLERK_PUBLISHABLE_KEY       = pk_live_...
WEB_URL                     = https://web-rouge-one-15.vercel.app
REDIS_URL                   = ⚠️ NEEDS FIXING — currently localhost:6379
SENTRY_DSN                  = ❌ NOT SET — add before launch
```

---

## Fly.io Machine Management

Machines auto-stop when idle (`min_machines_running = 0`). If a deploy seems to hang, the machine may be stopped.

```bash
# Check machine state
/opt/homebrew/bin/flyctl machine list -a cannaspy-api

# Start a stopped machine
/opt/homebrew/bin/flyctl machine start <machine-id> -a cannaspy-api

# View recent logs (no tail = prints last N and exits)
/opt/homebrew/bin/flyctl logs -a cannaspy-api --no-tail 2>&1 | tail -40
```

---

## TypeScript Check Before Deploy

Always clean-check TypeScript before deploying to catch build errors locally first.

```bash
cd /Users/patricksimac/CannaSpy
pnpm --filter api tsc --noEmit   # API
pnpm --filter web tsc --noEmit   # Frontend (optional — Vite builds even with TS errors)
```

---

## Common Deploy Failures

| Error | Cause | Fix |
|---|---|---|
| `tsc: error TS2339: Property X does not exist on type 'never'` | TypeScript can't infer Supabase response type | Add explicit type cast: `as { col1: string; col2: string }[]` |
| `pnpm: frozen-lockfile failed` | Deploying from wrong directory | `cd /Users/patricksimac/CannaSpy` (workspace root) |
| `flyctl: command not found` | PATH issue in shell | Use full path: `/opt/homebrew/bin/flyctl` |
| `ECONNREFUSED 127.0.0.1:6379` | REDIS_URL points to localhost | Fix REDIS_URL secret on Fly.io |
| Deploy succeeds but still 500 | Missing secret | Check `flyctl secrets list` — add any missing SUPABASE_* vars |
| SPA route returns 404 | Vercel rewrite missing | Ensure `vercel.json` has `"rewrites": [{"source": "/(.*)", "destination": "/index.html"}]` |

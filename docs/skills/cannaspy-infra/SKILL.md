# CannaSpy Infrastructure Skill

Use this skill for any Railway deploy, Vercel deploy, env var management, or infrastructure health check on CannaSpy.

---

## Current Infrastructure (as of Session 21)

| Service | URL | Platform |
|---|---|---|
| API | `https://cannaspy-production.up.railway.app` | Railway Hobby ($5/mo) |
| Frontend | `https://web-rouge-one-15.vercel.app` | Vercel |
| Database | Supabase `cbhbrbkirzpncpxlvehk` | Supabase |
| Redis | Railway internal | Railway (same project) |

---

## Railway Deploy Sequence

```bash
cd /Users/patricksimac/CannaSpy

# 1. Verify clean state
git status && git log --oneline -5

# 2. Deploy
railway up --detach

# 3. Tail logs until "Server listening" appears
railway logs --tail

# 4. Health check — must return {"status":"ok"}
curl https://cannaspy-production.up.railway.app/health
```

Never declare a Railway deploy complete until `curl /health` returns 200.

### nixpacks.toml gotcha
The install phase must use `NODE_ENV=development` so devDependencies (including `tsc`) are available:
```toml
[phases.install]
cmds = ["NODE_ENV=development pnpm install --frozen-lockfile"]
```
If you see `tsc: not found` in Railway build logs, this is the fix.

---

## Vercel Deploy Sequence (TWO-STEP — mandatory)

```bash
cd /Users/patricksimac/CannaSpy

# Step 1: Regenerate .vercel/output from current source
npx vercel build --prod

# Step 2: Upload the fresh output
npx vercel deploy --prebuilt --prod
```

Never skip Step 1. Running only Step 2 uploads stale `.vercel/output` — changes will not appear. Correct deploy uploads ~8.9MB. Stale deploy uploads ~142KB.

Alternatively (full deploy from workspace root):
```bash
~/Library/pnpm/vercel --prod --yes
```

---

## Updating Env Vars

### Railway (CLI)
```bash
railway variables set KEY=value
```

### Vercel (REST API)
```bash
# Delete existing var
curl -X DELETE "https://api.vercel.com/v9/projects/prj_<ID>/env/<envId>" \
  -H "Authorization: Bearer $VERCEL_TOKEN"

# Create var
curl -X POST "https://api.vercel.com/v9/projects/prj_<ID>/env" \
  -H "Authorization: Bearer $VERCEL_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"key":"VITE_API_URL","value":"https://cannaspy-production.up.railway.app","type":"plain","target":["production","preview"]}'
```

After any Vercel env var change, trigger a new prod deploy.

---

## Post-Deploy Health Checklist

Run all three before declaring any deploy done:

```bash
# 1. API health
curl https://cannaspy-production.up.railway.app/health
# Expected: {"status":"ok"}

# 2. Map endpoint (real DB data)
curl "https://cannaspy-production.up.railway.app/api/v1/map/dispensaries?bbox=-118.5,33.9,-118.0,34.2&limit=5"
# Expected: success:true, 5 GeoJSON features with real dispensary names

# 3. Railway URL baked into Vercel bundle
curl -s https://web-rouge-one-15.vercel.app/assets/index-*.js | grep -c "cannaspy-production"
# Expected: number > 0
```

---

## BullMQ Workers

All 6 workers start on API boot. Check Railway logs after deploy:
```bash
railway logs --tail 50
```
Workers: `scrape`, `normalize`, `diff`, `alert`, `billing`, `crm`.
If workers throw Redis errors, verify `REDIS_URL` is set to Railway internal Redis (not `localhost:6379`).

---

## Database Operations (Supabase MCP broken)

Supabase MCP `execute_sql` currently returns "Database authentication failed". Use PostgREST instead:

```bash
curl "https://cbhbrbkirzpncpxlvehk.supabase.co/rest/v1/<table>?select=*&limit=5" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
```

---

## Opsec Rules

- Never echo `CANNASPY_PRIMARY_API_HOST` value in output, logs, or handoffs — reference as `$CANNASPY_PRIMARY_API_HOST` only.
- All secrets live in Railway env vars and local `.env` — never committed to git.
- `.env.example` documents all required vars without values.

---

## Install this skill
CC: copy this to `~/.claude/skills/cannaspy-infra/SKILL.md` to make it available globally.

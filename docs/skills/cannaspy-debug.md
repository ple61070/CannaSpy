# Skill: CannaSpy Debug Playbook
**Version 1.0 | Created 2026-05-08**

Use this skill when something is broken and you need to diagnose it fast. Each section covers a known failure mode with its root cause and fix.

---

## API Returns 500

**Step 1 — Check health:**
```bash
curl -s https://cannaspy-api.fly.dev/health
# If this also fails: machine is stopped. Run `flyctl machine start`.
```

**Step 2 — Get logs after triggering the 500:**
```bash
curl -s 'https://cannaspy-api.fly.dev/api/v1/map/dispensaries?bbox=-118.5,33.9,-118.0,34.2&limit=3'
/opt/homebrew/bin/flyctl logs -a cannaspy-api --no-tail 2>&1 | grep -v ECONNREFUSED | tail -20
```

**Step 3 — Check secrets:**
```bash
/opt/homebrew/bin/flyctl secrets list -a cannaspy-api
# Must have: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, CLERK_SECRET_KEY, WEB_URL
```

**Known causes:**
| Symptom | Root Cause | Fix |
|---|---|---|
| `"Internal server error"` on map endpoint | `SUPABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY` missing | `flyctl secrets set SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=...` |
| `"Tenant or user not found"` | Supavisor pooler broken for this project | Switch route to use `getAdminDb()` not `query()` |
| `"password authentication failed"` | pg Pool direct DB password wrong | Same fix — use `getAdminDb()` PostgREST |
| `ECONNREFUSED 127.0.0.1:6379` | REDIS_URL = localhost. Non-fatal for HTTP routes — only workers fail. | Set real Redis URL or add `DISABLE_WORKERS` guard |

---

## Frontend Shows No Data / Empty Screens

**Likely cause: `authFetch` returning 401 silently**

Check browser console for `TypeError: Failed to fetch` or `401 Unauthorized`. If present:
- Verify page uses `authFetch()` not bare `fetch()`
- Verify Clerk is signed in
- Test API directly with curl + token

**Likely cause: CORS block**
Check browser console for `Access to fetch blocked by CORS policy`.
- Verify `WEB_URL` secret on Fly.io is set to the exact Vercel URL
- CORS origin function in `index.ts` allows `WEB_URL`, localhost, and `*.vercel.app`

**Likely cause: Map pins not showing**
1. Open browser console — look for network errors on `/api/v1/map/dispensaries`
2. Check response: `{"success":false,"error":"Internal server error",...}` → API 500 (see above)
3. Check bbox: the map must have moved at least once to trigger the first fetch

---

## Map Pins Blank (API Working)

If the API returns 200 with real GeoJSON but no pins render:

1. **Check zoom level** — pins only render at `minzoom={9}`. Clusters show below that.
2. **Check layer order** — must be: ring → fill → cluster → cluster count. Wrong order = layers hidden.
3. **Hard refresh** — `Cmd+Shift+R` to bust Vercel CDN cache after deploy.
4. **Check `promoteId`** — `<Source id="cs-dispensaries" promoteId="id">` required for hover states.

---

## Vercel Deploy Fails

```
ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL
```
**Cause:** Deploying from `packages/web/` directory. `pnpm-lock.yaml` is at workspace root and not included.  
**Fix:** Always deploy from `/Users/patricksimac/CannaSpy` (workspace root).

```
error TS2339: Property does not exist on type 'never'
```
**Cause:** Supabase JS client returns `never[]` when it can't infer the table type.  
**Fix:** Add explicit cast on the result: `as { column: type }[]`

---

## DB Queries Failing

**Rule:** Never use `query()` from `../db/client`. It uses pg Pool → Supavisor → broken.

Always use:
```typescript
const supabase = getAdminDb()
const { data, error } = await supabase
  .from('table_name')
  .select('col1, col2')
  .eq('org_id', orgId)
```

**If `error` is non-null:** Log it with `req.log.error({ err: error.message }, '[route] context')` and return 500.

---

## Fly.io Machine Stopped

Machines auto-stop with `min_machines_running = 0`. If requests time out:

```bash
/opt/homebrew/bin/flyctl machine list -a cannaspy-api
/opt/homebrew/bin/flyctl machine start <machine-id> -a cannaspy-api
# Wait ~15s for health checks to pass
curl -s https://cannaspy-api.fly.dev/health
```

**Permanent fix:** Set `min_machines_running = 1` in `fly.toml` (costs money on paid plan).

---

## Supabase MCP `execute_sql` Broken

The Supabase MCP tool returns "Database authentication failed" regardless of password.  
**Workaround:** Use PostgREST directly via osascript or bash:

```bash
curl -s -X POST \
  "https://cbhbrbkirzpncpxlvehk.supabase.co/rest/v1/rpc/your_function" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
```

Or for SELECT queries:
```bash
curl -s \
  "https://cbhbrbkirzpncpxlvehk.supabase.co/rest/v1/dispensaries?select=count&limit=1" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
```

---

## Workers Crashing at Startup

All 6 BullMQ workers crash with `ECONNREFUSED 127.0.0.1:6379`. This is non-fatal — HTTP routes still work. It's noisy in logs.

**Permanent fix:** Set a real Redis URL:
```bash
/opt/homebrew/bin/flyctl secrets set -a cannaspy-api REDIS_URL="redis://default:password@host.upstash.io:6379"
```

**Quick silence:** Add `NODE_ENV` guard in `index.ts` before worker imports:
```typescript
if (process.env.NODE_ENV !== 'test' && process.env.REDIS_URL && !process.env.REDIS_URL.includes('localhost')) {
  // start workers
}
```

---

## TypeScript Build Errors

```bash
# Check API
cd /Users/patricksimac/CannaSpy && pnpm --filter api tsc --noEmit 2>&1

# Check Web
cd /Users/patricksimac/CannaSpy && pnpm --filter web tsc --noEmit 2>&1
```

**Common errors and fixes:**
| Error | Fix |
|---|---|
| `Property does not exist on type 'never'` | Add `as { col: type }[]` cast to Supabase query result |
| `Cannot find module '../db/client'` | Wrong import path — check relative path depth |
| `Type 'string \| undefined' not assignable to 'string'` | Add null check or `!` non-null assertion |
| `Object is possibly 'null'` | Add null guard: `if (!data) return` |

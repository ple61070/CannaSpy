# CannaSpy Deploy Skill
Reference for all deployment operations.

## Infrastructure
- API: Railway (us-west2) — https://cannaspy-production.up.railway.app — Hobby $5/mo
- Frontend: Vercel — https://web-rouge-one-15.vercel.app — auto-deploys from GitHub main
- DB: Supabase — cbhbrbkirzpncpxlvehk — PostgreSQL 15
- Cache/Queue: Railway Redis — REDIS_URL in Railway env

## API Deploy (Railway)
  cd /Users/patricksimac/CannaSpy
  /opt/homebrew/bin/railway up --detach
Costs money. Confirm with Patrick before running.

## Frontend Deploy (Vercel)
Vercel auto-deploys on git push to main via GitHub integration.
NEVER trigger Vercel redeploys via API — they redeploy the last git commit, not local changes.
Always git push first; Vercel picks it up automatically.

## DB Migrations
Files in packages/api/src/db/migrations/ as numbered SQL files.
Apply via Supabase MCP apply_migration OR manually via Supabase SQL editor.
Supabase MCP execute_sql is broken as of Session 24.

## Git Convention
  git add -A
  git commit -m "type(scope): description"
  git push origin main
Types: feat, fix, chore, refactor, test

## Fly.io
Abandoned Session 20 (machine-hour limits). Pending cleanup: fly apps destroy cannaspy-api (Patrick must confirm).

## Post-Deploy Check
  curl -s https://cannaspy-production.up.railway.app/api/v1/health

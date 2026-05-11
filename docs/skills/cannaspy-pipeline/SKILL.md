# CannaSpy Pipeline Skill
Helps Claude Code operate the CannaSpy data collection pipeline.

## Pipeline Architecture
1. collector.py — PRIMARY scraper. Reads from CANNASPY_PRIMARY_API_HOST env var (never hardcode the domain). Writes menu_snapshots + menu_items to Supabase.
2. normalize.worker.ts — BullMQ. Normalizes product names via Claude AI. Bridges menu_items to price_observations when rawNames is absent (primary pipeline case).
3. diff.worker.ts — BullMQ. Reads price_observations, compares to previous, writes change_events.
4. alert.worker.ts — BullMQ. Reads change_events, creates alerts rows. Resend not yet wired.
5. run_diff_rest.py — Manual diff orchestrator using PostgREST (use when psycopg2 cannot connect locally).

## Key Operational Facts
- psycopg2 cannot connect to Supabase from local dev (pooler rejects non-Railway IPs). Use PostgREST REST API for all local DB ops.
- Supabase MCP execute_sql is broken as of Session 24. Use PostgREST workaround.
- CANNASPY_PRIMARY_API_HOST must NEVER appear in code. Read from env only.
- All pipeline HTTP calls must go through ip_pool.py.
- Request jitter: 0.5-2.5s base delay, 5% chance of 8-25s pause.
- Scrape window: 2:00-5:00 AM Pacific only.

## PostgREST Pattern
Read .env for SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
Headers: apikey + Authorization Bearer with service role key.
Read: GET /rest/v1/{table}?{filters}
Write: POST /rest/v1/{table} with Prefer: return=representation header
Update: PATCH /rest/v1/{table}?{filters}

## Supabase Project
- ID: cbhbrbkirzpncpxlvehk
- URL: https://cbhbrbkirzpncpxlvehk.supabase.co

## Known Competitors in Prod
- cannabis-house-4: id=19f0699b-436a-4144-b1a4-35a0180b28a7

## Key Scripts
- packages/scraper/collector.py — PRIMARY collection
- packages/scraper/run_diff_rest.py — diff orchestrator (PostgREST)
- packages/scraper/make_second_snapshot.py — generates test snapshot with synthetic price changes
- packages/scraper/test_diff_engine.py — smoke test, all 5 event types pass

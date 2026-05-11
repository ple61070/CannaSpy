# Skill: CannaSpy Claude Code Prompt Writer
**Version 2.0 | Updated 2026-05-08**

Use this skill to write a Claude Code prompt for any CannaSpy task. It ensures every prompt follows project conventions so Claude Code doesn't need to be corrected mid-session.

---

## How to Use

Tell Cowork: "Write a Claude Code prompt to [task description]"

Cowork will generate a ready-to-paste prompt that includes all constraints below.

---

## Every Prompt Must Include

### 1. Read Before Acting
Always open with what to read first:
```
Read CLAUDE.md, then read [relevant file paths] in full before making any changes.
```

### 2. Session Start Protocol
For session-opening prompts only:
```
Run: git status && git log --oneline -10
Then read HANDOFF.md and state which build phase this session is in.
```

### 3. Color Palette — Non-Negotiable
Every prompt touching UI must include:
```
Do not use Tailwind default colors (#22c55e, #f59e0b, #ef4444).
Use only the CannaSpy palette:
  --accent-intel:  #1d9e75  (teal — intelligence, tracking, prospects)
  --accent-block:  #ba7517  (amber — blocked competitors)
  --accent-alert:  #d4537e  (coral — alerts, warnings)
  --bg-base:       #0d0f11  (background)
```

### 4. Typography
```
Body font: DM Sans
Numbers and timestamps: Space Mono (monospace)
```

### 5. Scope Boundaries
Always specify what NOT to touch:
```
Do not touch [interaction logic / data fetching / API routes / schema] — only change [specific thing].
```

### 6. Verification Step
Every prompt ends with:
```
Run pnpm --filter [web|api] tsc --noEmit after changes. Report [specific confirmation criteria].
```

---

## Infrastructure — Current State (2026-05-08)

**Stack:**
- API: Fly.io (`cannaspy-api.fly.dev`), Fastify + TypeScript
- Frontend: Vercel (`web-rouge-one-15.vercel.app`), React 18 + Vite
- Database: Supabase (`cbhbrbkirzpncpxlvehk`)
- **NOT Railway** — Railway is abandoned

**DB Access Rule — CRITICAL:**
```
Use getAdminDb() from '../db/client' for all DB queries in API routes.
Do NOT use query() from '../db/client' — the pg Pool is broken due to Supabase pooler issues.
getAdminDb() uses PostgREST via the service_role key and is the only working method.
```

**Deploy commands:**
```bash
# API
/opt/homebrew/bin/flyctl deploy --app cannaspy-api --remote-only

# Frontend (always from workspace root /Users/patricksimac/CannaSpy, NOT packages/web)
~/Library/pnpm/vercel --prod --yes
```

---

## Map / Mapbox Prompts — Extra Rules

When writing prompts for any Mapbox layer or map component:

- Never use grey on any pin state — grey means "no data" which is wrong for prospects
- Prospect pins = opportunity = should look alive
- Layer order must be explicit: ring → fill → cluster → cluster count label
- Always specify `circle-stroke-color: #0d0f11` to separate overlapping pins
- Never change bbox fetch logic, AbortController, or onMoveEnd handlers
- `promoteId="id"` must be on the `<Source id="cs-dispensaries">` element for hover to work

**Pin state hierarchy:**
| State | Color | Opacity | Radius |
|---|---|---|---|
| Prospect (default) | `#1d9e75` | 65% | 12px fill / 21px ring |
| Tracked/Enriched | `#1d9e75` | 100% | 15px fill / 26px ring |
| Blocked | `#ba7517` | 100% | 15px fill / 26px ring |

**Basemap:**
- Dark mode: `mapbox://styles/mapbox/dark-v11`
- Light mode: `mapbox://styles/mapbox/streets-v12`
- Theme detection via `useAppTheme()` hook (watches `data-theme` on `<html>`)

---

## API / Route Prompts — Extra Rules

- All routes must return `{ success: bool, data: {}, error: string|null }`
- Input validation before any DB access
- No `console.log` — use `pino` structured logging (req.log.error / req.log.info)
- Never expose Supabase service_role key or any credential in client code
- Never name the primary data platform inline — use `CANNASPY_PRIMARY_API_HOST` env var
- **DB queries:** use `getAdminDb()` not `query()` — pooler is broken

---

## Frontend Prompts — Extra Rules

- No hardcoded API URLs — use `import.meta.env.VITE_API_URL`
- All API calls must use `authFetch` (Clerk token) — never bare `fetch()`
- Loading states on all async operations
- All timestamps displayed in user's local timezone (stored UTC)
- Never put `authFetch` in a useEffect dependency array — causes infinite loop
- Build always from workspace root: `cd /Users/patricksimac/CannaSpy && pnpm --filter web build`

---

## Customer-Facing Copy Rules

Never generate UI copy that includes:
- Platform names: Weedmaps, Leafly, Dutchie, iHeartJane
- Technical language: scraping, crawling, API calls
- Generic SaaS copy: "Something went wrong", "No data available"
- Cannabis puns: "elevated", "high", "420", "blaze"

Always use:
- "publicly available cannabis market data"
- "our proprietary data collection infrastructure"
- Specific error messages: "Couldn't reach [Name]'s menu. We'll retry in 4 hours."

---

## Blocking Mechanic — Never Change Without Approval

If a prompt touches `blocking.service.ts`, `block_list`, or `tracked_competitors`:
- Stop and get explicit founder approval first
- The 60-second CRM alert window is a hard requirement
- Stripe quantity must update on every block add/cancel

---

## Layout / CSS Prompts — Extra Rules

- Never use `100vw` on a content container — ignores sidebar, causes overflow
- Use `width: 100%` within a flex/grid parent
- Sidebar uses `onMouseEnter`/`onMouseLeave` inline style (not Zustand): `64px` → `240px`
- Map containers need matching transition: `width 0.22s cubic-bezier(.2, .8, .2, 1)`
- `<main>` in `Layout.tsx` already uses `flex: 1, width: 0, minWidth: 0` — don't touch it

---

## Example Prompt Structure

```
Read CLAUDE.md, then read [file1], [file2] in full before making any changes.

[Clear description of what to change and why]

[Specific values, colors, sizes — no ambiguity]

DB queries: use getAdminDb() from '../db/client', not query(). The pooler is broken.

Do not:
- [Specific thing 1 to leave alone]
- [Specific thing 2 to leave alone]
- Use any Tailwind default colors (#22c55e, #f59e0b, #ef4444)
- Use query() for database access

After changes, run pnpm --filter [web|api] tsc --noEmit.
Report [specific confirmation criteria].
```

# CannaSpy Frontend Skill
Reference for working on the React frontend. Read before touching any UI, CSS, or auth code.

---

## Stack

| Layer | Technology | Notes |
|---|---|---|
| Framework | React 18 + Vite + TypeScript | `packages/web/` |
| Styling | Tailwind CSS + CSS variables | Dark design system |
| Auth | Clerk | `useAuthFetch` for all API calls |
| Routing | React Router v6 | Protected routes via `<Layout />` |
| State | Zustand | `packages/web/src/store/` |
| Maps | Mapbox GL | `MarketHeatMap.tsx` |
| Charts | Recharts | `PriceHistory.tsx` |

---

## CSS Variable System — CRITICAL

All design system colors are defined as CSS custom properties inside `[data-theme]` attribute selectors in `packages/web/src/styles/globals.css`:

```css
[data-theme="dark"]  { --bg: #081018; --text-1: #e6f0f7; ... }
[data-theme="light"] { --bg: #eef1f5; --text-1: #0d1f2e; ... }
```

**If `data-theme` is not set on `<html>`, ALL variables are undefined → white page.**

`packages/web/index.html` MUST have `data-theme="dark"` on the `<html>` element:
```html
<html lang="en" data-theme="dark">
```

`Layout.tsx` overrides this after hydration based on localStorage. Public routes (`/sign-up`, `/sign-in`, etc.) never mount `Layout`, so they rely entirely on the HTML default.

### Color palette (brand canonical — never use Tailwind defaults):
```
--accent-intel: #1d9e75   /* teal — intelligence, tracking */
--accent-block: #ba7517   /* amber — blocking mechanic */
--accent-alert: #d4537e   /* coral — alerts */
```
Never use Tailwind's `green-500`, `amber-500`, `red-500` — use the CSS vars above.

### Fonts:
```css
--sans:    'Plus Jakarta Sans', sans-serif   /* body text */
--mono:    'JetBrains Mono', monospace       /* numbers, timestamps, data */
--display: 'Instrument Serif', serif         /* hero text, KPI values */
```
These are loaded via `@import` in `globals.css`. The DM Sans / Space Mono import in `index.html` is legacy — the active design system uses Jakarta Sans / JetBrains Mono.

---

## Auth Pattern — useAuthFetch

All API calls MUST go through `useAuthFetch`. It attaches the Clerk JWT to every request.

```tsx
import { useAuthFetch } from '../lib/useAuthFetch'

function MyComponent() {
  const authFetch = useAuthFetch()

  useEffect(() => {
    authFetch('/api/v1/competitors')
      .then(r => r.json())
      .then(setData)
  }, [authFetch])
}
```

### Critical: wait for Clerk isLoaded
`useAuthFetch` returns a no-op until Clerk has initialized. Never call it unconditionally on mount — it will fire with no auth token and get 401.

```tsx
// WRONG — races Clerk init
useEffect(() => { authFetch('/api/v1/...') }, [])

// RIGHT — authFetch is stable once Clerk loads
useEffect(() => { authFetch('/api/v1/...') }, [authFetch])
```

The `authFetch` reference is stable after Clerk loads, so using it as an effect dependency is the correct pattern.

---

## Route Structure

Protected routes are wrapped in `<ProtectedRoute>` → `<Layout>` in `App.tsx`.

```
/sign-up, /sign-in, /offboarded           ← public, no Layout
/setup/locations, /setup/competitors       ← semi-public setup flow

/command-center, /prices, /alerts, ...    ← protected, inside Layout
```

`Layout.tsx` is responsible for:
- Setting `data-theme` on `document.documentElement`
- Rendering the nav rail and `<Outlet />` for child routes
- Providing theme toggle

---

## Environment Variables

`VITE_*` vars are baked into the JS bundle at build time. They come from:
1. `packages/web/.env.production` — committed to git (no secrets)
2. Vercel env vars (set via dashboard) — for secrets like `VITE_MAPBOX_TOKEN`

```
VITE_API_URL=https://cannaspy-production.up.railway.app
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_MAPBOX_TOKEN=(Vercel env var only — never commit)
```

In components, always use `import.meta.env.VITE_API_URL` — never hardcode the API URL.

---

## Tailwind Config

`packages/web/tailwind.config.ts` — content scans `./index.html` and `./src/**/*.{ts,tsx}`.

Custom colors are available as Tailwind utilities:
```tsx
<div className="bg-bg-base text-text-primary border-subtle" />
```

But for theming (light/dark), prefer CSS variables over Tailwind color classes, since the design system is entirely variable-based.

---

## Key Files

| File | Purpose |
|---|---|
| `packages/web/index.html` | Must have `data-theme="dark"` on `<html>` |
| `packages/web/src/styles/globals.css` | All CSS vars, Tailwind directives, base styles |
| `packages/web/src/lib/useAuthFetch.ts` | Auth-aware fetch hook |
| `packages/web/src/components/shared/Layout.tsx` | Nav rail, theme toggle, protected route wrapper |
| `packages/web/src/App.tsx` | Route definitions |
| `packages/web/.env.production` | VITE vars for Vercel builds (committed, no secrets) |
| `packages/web/tailwind.config.ts` | Tailwind config |
| `packages/web/vite.config.ts` | Vite config (dev proxy, sourcemaps) |

---

## Common Gotchas

| Symptom | Cause | Fix |
|---|---|---|
| White unstyled page | `data-theme` not on `<html>` | Add `data-theme="dark"` to `index.html` |
| All API calls return 401 | `useAuthFetch` firing before Clerk loads | Use `authFetch` as useEffect dependency |
| VITE_API_URL undefined in prod | `.env.production` gitignored | Commit the file (remove from `.gitignore`) |
| Mapbox token blocked by GitHub | `pk.*` token in committed file | Remove from file, keep in Vercel env vars only |
| Re-fetch loop | Stale useEffect dependency array | Include `authFetch` in dependency array |
| Font wrong | DM Sans import in index.html is legacy | Use `--sans` / `--mono` CSS vars; active fonts are Jakarta Sans / JetBrains Mono |

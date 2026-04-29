# CannaSpy Design System — Complete Reference

**Last updated:** 2026-04-26  
**Source of truth:** `cannaspy_s04_FINAL.html` (Command Center) and `cannaspy_s12_FINAL.html` (Alert Feed). All values below were extracted from these locked canonical files.

> **Honest scope note.** This document compiles the **CSS-based design system that actually exists** in the 35 FINAL HTML mockups. The Tailwind config and React component sketches at the end are **derived suggestions**, not extracted artifacts — none of those exist yet. They are reasonable mappings from the source CSS, intended as a starting point for whoever wires this to a React+Tailwind app. Treat them as a draft, not authoritative.

---

## 1. Foundation: CSS Custom Properties

The system uses CSS variables exclusively. Two themes (`[data-theme="light"]`, `[data-theme="dark"]`) override the same variable names. Theme switches at the document root via `<html data-theme="light">`.

### 1.1 Light theme tokens

```css
[data-theme="light"] {
  /* Background */
  --bg: #eef1f5;
  --bg-g1: rgba(9,161,161,0.0);
  --bg-g2: rgba(211,150,166,0.0);
  --bg-g3: rgba(246,201,146,0.0);

  /* Sidebar (frosted-glass base; rail overrides at runtime — see §2) */
  --sidebar: rgba(255,255,255,0.72);
  --sidebar-fg: #0d1f2e;
  --sidebar-fg-mute: rgba(13,31,46,0.68);
  --sidebar-fg-dim: rgba(13,31,46,0.45);

  /* Surface */
  --surface: #ffffff;
  --surface-solid: #ffffff;
  --surface-2: #f7f8fa;
  --surface-3: #eef1f5;

  /* Glass edges */
  --glass-edge-top: rgba(255,255,255,0.95);
  --glass-edge-inner: rgba(9,161,161,0.12);

  /* Border */
  --border: rgba(13,31,46,0.06);
  --border-2: rgba(13,31,46,0.12);
  --border-hot: rgba(9,161,161,0.38);

  /* Text */
  --text-1: #0d1f2e;            /* primary */
  --text-2: #3a617d;            /* secondary */
  --text-3: #6b8299;            /* tertiary / dim */

  /* Accent (teal — tracking, active, positive) */
  --accent: #0bb8b8;
  --accent-soft: rgba(11,184,184,0.10);
  --accent-hover: #078484;

  /* Warm (amber — rivals blocking YOU) */
  --warm: #d4900a;
  --warm-soft: rgba(246,201,146,0.18);

  /* Warning (orange — caution but not danger) */
  --warning: #985000;
  --warning-soft: rgba(234,150,90,0.14);

  /* Rose (blocks YOU placed on rivals — never red) */
  --rose: #a85a7a;
  --rose-strong: #a85a7a;
  --rose-soft: rgba(211,150,166,0.16);
  --rose-border: rgba(211,150,166,0.35);

  /* Slate, positive, danger */
  --slate: #5484A4;
  --positive: #077575;
  --danger: #c43b4e;

  /* Shadows */
  --card-shadow: 0 1px 2px rgba(13,31,46,0.04),
                 0 4px 16px -4px rgba(13,31,46,0.08),
                 0 24px 48px -24px rgba(13,31,46,0.10);
  --card-shadow-lg: 0 2px 4px rgba(13,31,46,0.06),
                    0 12px 32px -6px rgba(13,31,46,0.14),
                    0 32px 72px -20px rgba(13,31,46,0.18);

  /* Map-specific (used in S04, S05, S06, etc.) */
  --map-bg: #eaf2f5;
  --map-grid: rgba(9,161,161,0.08);
  --map-road: rgba(255,255,255,0.92);
  --map-road-minor: rgba(255,255,255,0.65);
  --map-block: rgba(210,224,232,0.65);
  --map-block-2: rgba(194,214,222,0.55);
  --map-park: rgba(185,218,190,0.55);

  /* CTA */
  --cta-fg-on-pos: #ffffff;
  --cta-shadow: 0 10px 30px -10px rgba(9,161,161,0.35);
  --cta-danger-shadow: 0 10px 30px -10px rgba(224,90,106,0.35);

  /* KPI / stat cards */
  --stat-bg: linear-gradient(180deg, rgba(9,161,161,0.04), #ffffff);
  --stat-border: rgba(13,31,46,0.08);

  /* Mesh animation */
  --mesh-anim-1: rgba(9,161,161,0.0);
  --mesh-anim-2: rgba(211,150,166,0.0);
}
```

### 1.2 Dark theme tokens

```css
[data-theme="dark"] {
  --bg: #081018;
  --bg-g1: rgba(11,184,184,0.14);
  --bg-g2: rgba(211,150,166,0.18);
  --bg-g3: rgba(246,201,146,0.10);

  --sidebar: rgba(14,26,38,0.72);
  --sidebar-fg: #e6f0f7;
  --sidebar-fg-mute: rgba(230,240,247,0.72);
  --sidebar-fg-dim: rgba(230,240,247,0.45);

  --surface: rgba(18,32,46,0.65);
  --surface-solid: #14202a;
  --surface-2: rgba(22,38,55,0.82);
  --surface-3: #1a2a38;

  --glass-edge-top: rgba(255,255,255,0.08);
  --glass-edge-inner: rgba(11,184,184,0.18);

  --border: rgba(11,184,184,0.16);
  --border-2: rgba(11,184,184,0.28);
  --border-hot: rgba(11,184,184,0.5);

  --text-1: #e6f0f7;
  --text-2: rgba(230,240,247,0.78);
  --text-3: rgba(230,240,247,0.58);

  --accent: #0bd5d5;
  --accent-soft: rgba(11,213,213,0.12);
  --accent-hover: #3aefef;

  --warm: #F6C992;
  --warm-soft: rgba(246,201,146,0.12);

  --warning: #ef9a4f;
  --warning-soft: rgba(234,150,90,0.16);

  --rose: #D396A6;
  --rose-strong: #e6afc0;
  --rose-soft: rgba(211,150,166,0.14);
  --rose-border: rgba(211,150,166,0.32);

  --slate: #acc0d3;
  --positive: #0bd5d5;
  --danger: #ff6b7d;

  --card-shadow: 0 2px 12px rgba(0,0,0,0.30),
                 0 24px 60px -24px rgba(0,0,0,0.55);
  --card-shadow-lg: 0 24px 60px -20px rgba(0,0,0,0.65);

  --map-bg: #0a1822;
  --map-grid: rgba(11,184,184,0.08);
  --map-road: rgba(28,46,62,0.8);
  --map-road-minor: rgba(22,38,52,0.7);
  --map-block: rgba(16,30,42,0.75);
  --map-block-2: rgba(13,26,38,0.65);
  --map-park: rgba(10,28,18,0.7);

  --cta-fg-on-pos: #061017;
  --cta-shadow: 0 10px 30px -10px rgba(11,184,184,0.45);
  --cta-danger-shadow: 0 10px 30px -10px rgba(224,90,106,0.45);

  --stat-bg: linear-gradient(180deg, rgba(11,184,184,0.08), rgba(20,35,50,0.5));
  --stat-border: rgba(11,184,184,0.2);

  --mesh-anim-1: rgba(11,184,184,0.10);
  --mesh-anim-2: rgba(211,150,166,0.12);
}
```

### 1.3 Structural tokens (theme-independent, in `:root`)

```css
:root {
  /* Typography stacks */
  --sans: 'Plus Jakarta Sans', sans-serif;
  --mono: 'JetBrains Mono', monospace;
  --display: 'Instrument Serif', 'Plus Jakarta Sans', serif;

  /* Radius scale */
  --r: 18px;
  --r-sm: 12px;
  --r-xs: 8px;

  /* Layout widths */
  --nav-w: var(--rail-w);   /* nav rail; uses rail-w override */
  --list-w: 360px;          /* list pane in list+map screens */
  --detail-w: 420px;        /* slide-out detail panel */

  /* Motion */
  --transition: all 0.32s cubic-bezier(.2,.8,.2,1);
  --ease-spring: cubic-bezier(.2,.8,.2,1);
}
```

### 1.4 Nav rail tokens (canonical S12 reference)

These tokens override `--nav-w` and define the dark navy collapsed-on-default rail used across all 35 screens.

```css
:root {
  --rail-w: 64px;                /* collapsed width */
  --rail-expanded-w: 240px;      /* expanded width on hover */
  --rail-bg: #1a2f42;            /* dark navy — NEVER use light theme value */
  --rail-bg-edge: #243d52;
  --rail-fg: rgba(230, 240, 247, 0.92);
  --rail-fg-mute: rgba(230, 240, 247, 0.62);
  --rail-fg-dim: rgba(230, 240, 247, 0.42);
  --rail-accent: #0bd5d5;        /* nav rail teal — slightly brighter than --accent */
  --rail-accent-soft: rgba(11, 213, 213, 0.16);
  --rail-divider: rgba(255, 255, 255, 0.08);
}
```

The rail is **always dark navy**, regardless of light/dark theme. Light theme = light workspace + dark rail. Dark theme = dark workspace + slightly-darker rail edges.

---

## 2. Color Semantics — locked rules

These are **product-level color rules**, not just style preferences. Violating them creates user confusion.

| Color | Token | Semantic meaning | Used for |
|---|---|---|---|
| Teal | `--accent` | Tracking, active state, positive | Track buttons, active nav, positive deltas, "tracking N rivals" |
| Warm amber | `--warm` | Rival is blocking YOU | Blocking-you alerts, blocked-by-rival pills |
| Rose | `--rose` | Blocks YOU placed on rivals | "Cancel block" buttons, your active blocks |
| Warning orange | `--warning` | Caution, soft warning | Slot quota warnings, near-limit indicators |
| Danger red | `--danger` | Urgent / price drops / hard alerts | Price-drop alerts, system errors |
| Slate | `--slate` | Neutral metadata, inactive | Disabled states, muted info |
| Rail teal | `--rail-accent` | Nav rail accent only | Active nav-link highlight, rail icon hover |

### Hard rules (from spec)
- **Cancel buttons use rose, never red.** Rose is for the user's action; red implies system error.
- **Teal never on "blocking you" rivals.** Use warm amber.
- **Rose never on "tracking" or "active" elements.** Use teal.
- **Rail accent is its own value (`#0bd5d5`)** — slightly brighter than the workspace `--accent` to compensate for the dark rail background contrast.

---

## 3. Typography

### 3.1 Font stacks
| Token | Family | Use |
|---|---|---|
| `--sans` | Plus Jakarta Sans | Body text, UI, default |
| `--mono` | JetBrains Mono | Numbers, IDs, timestamps, prices, mono-style metadata |
| `--display` | Instrument Serif | Stat hero numbers, big metric reveals (KPI cards) |

Loaded from Google Fonts via `<link>` tags in each HTML `<head>`. When wiring to React, load these via `next/font` or a similar font-loading strategy — do not rely on `<link>` tags in components.

### 3.2 Scale (extracted from canonicals)

| Size | Use |
|---|---|
| 8.5px | Mono labels, status pips, "DRAFT" / "BETA" tags |
| 10px | Tertiary metadata (timestamps, sub-labels) |
| 11px | Secondary metadata, table cell labels |
| 12px | Default body, mono labels |
| 12.5px | Buttons, tab labels |
| 13px | Nav-link text, default UI |
| 14px | Card subtitles, secondary headings |
| 15px | Logo name, primary headings within cards |
| 16px | Section headings |
| 18px | Page subtitles, card titles |
| 20-22px | H2-level page headings |
| 26px | H1-level page headings |
| 44px | Hero stat numbers (KPI dashboards) |
| 56px+ | ROI hero numbers (S20 archetype) |

### 3.3 Weight rules
- `400` (regular): default body, most labels
- `500-600`: button labels, active nav-link, table headers, emphasis
- `700`: card titles, logo, page H1s
- `800`: hero stat numbers, must-read banners

Display serif numbers use `font-style: italic` + `font-weight: 400` together — that's the locked treatment for stat cards.

### 3.4 Letter-spacing
Mono labels (`.logo-tag`, `.nav-group-label`, `.section-label`) use `letter-spacing: 0.14em` to `0.16em` and `text-transform: uppercase`. This is the canonical "small-caps" pattern across the system.

Page H1s use `letter-spacing: -0.01em` for slight tightening.

---

## 4. Spacing & Geometry

### 4.1 Border radius scale
- `--r-xs: 8px` — pills, small chips, dropdown options
- `--r-sm: 12px` — buttons, inputs, small cards, nav-links
- `--r: 18px` — main cards, modals, surface containers

### 4.2 Layout widths
- `--nav-w: 64px` (collapsed) / `240px` (expanded on hover)
- `--list-w: 360px` — list pane in list+map archetype (S04)
- `--detail-w: 420px` — slide-out detail panel
- Main column: `flex: 1` (consumes remainder)

### 4.3 Common padding
- Page outer padding: `24px` (workspace inset from rail)
- Card padding: `20px` to `24px`
- Section padding (within card): `16px`
- Pill/chip padding: `4-6px vertical, 10-12px horizontal`
- Button padding: `8-10px vertical, 14-18px horizontal`

### 4.4 Z-index layers
| Layer | z-index | Components |
|---|---|---|
| Base | `auto` / `1` | All workspace content |
| Sticky topbar | `30` | Topbar, sticky table headers |
| Nav rail | `40` | Collapsed rail |
| Nav rail hover-expanded | `50` | Rail on hover (raises above topbar) |
| Tooltip / dropdown | `60-100` | Non-modal overlays |
| Modal overlay | `9000` | Full-screen modal backdrops |
| Toast / notification | `9100+` | Top-of-stack notifications |

---

## 5. Motion

```css
--transition: all 0.32s cubic-bezier(.2,.8,.2,1);
--ease-spring: cubic-bezier(.2,.8,.2,1);
```

Standard rules:
- **Hover transitions: 0.2s** (faster than the system transition; for hover feedback that should feel snappy)
- **State transitions: 0.32s** (the system default; for layout changes, modal show/hide, panel slide-in)
- **Rail expand-on-hover: 0.22s** with `--ease-spring`
- **Opacity fades within rail: 0.2s with 0.05s delay** (so labels fade in *after* the width animation starts)

Reduce-motion considerations are not currently in the canonical CSS but should be added when wiring to React: wrap motion in `@media (prefers-reduced-motion: reduce)` to disable transforms.

---

## 6. Component Patterns (canonical CSS)

### 6.1 Nav rail (S12 reference)

```css
.nav-sidebar {
  width: var(--rail-w) !important;
  background: var(--rail-bg) !important;
  border-right: 1px solid var(--rail-divider) !important;
  color: var(--rail-fg) !important;
  height: 100vh;
  display: flex; flex-direction: column;
  flex-shrink: 0;
  transition: width 0.22s var(--ease-spring);
  overflow: hidden !important;
  position: relative;
  z-index: 40;
}
.nav-sidebar:hover {
  width: var(--rail-expanded-w) !important;
  box-shadow: 8px 0 40px -8px rgba(0,0,0,0.45);
  z-index: 50;
}
.nav-link {
  display: flex; align-items: center;
  padding: 8px 10px;
  border-radius: 8px;
  color: var(--rail-fg-mute);
  font-size: 13px;
  cursor: pointer;
  transition: var(--transition);
  white-space: nowrap;
  overflow: hidden;
}
.nav-link.active {
  background: var(--rail-accent-soft);
  color: var(--rail-fg);
  font-weight: 600;
  box-shadow: inset 0 0 0 1px rgba(11,213,213,0.30);
}
```

Full block: see lines 99-155 of `cannaspy_s12_FINAL.html`.

### 6.2 Card (universal surface)

```css
.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r);
  padding: 24px;
  box-shadow: var(--card-shadow);
}
```

### 6.3 Button (CTA)

```css
.btn {
  font-family: var(--sans);
  font-size: 12.5px;
  font-weight: 600;
  padding: 8px 14px;
  border-radius: var(--r-sm);
  border: 1px solid var(--border-2);
  background: var(--surface-2);
  color: var(--text-1);
  cursor: pointer;
  transition: 0.2s;
}
.btn.primary {
  background: var(--accent);
  color: var(--cta-fg-on-pos);
  border-color: transparent;
  box-shadow: var(--cta-shadow);
}
.btn.cancel {
  background: var(--rose);
  color: white;
  border-color: transparent;
}
```

### 6.4 Pill / chip / badge

```css
.pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 500;
  white-space: nowrap;
}
.pill.tracking { background: var(--accent-soft); color: var(--accent); }
.pill.blocking-you { background: var(--warm-soft); color: var(--warm); }
.pill.your-block { background: var(--rose-soft); color: var(--rose); }
```

### 6.5 KPI card (S20 archetype)

```css
.kpi-card {
  background: var(--stat-bg);
  border: 1px solid var(--stat-border);
  border-radius: var(--r);
  padding: 20px;
}
.kpi-value {
  font-family: var(--display);
  font-size: 44px;
  font-style: italic;
  font-weight: 400;
  color: var(--text-1);
  line-height: 1;
}
.kpi-label {
  font-family: var(--mono);
  font-size: 9px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--text-3);
  margin-top: 8px;
}
```

---

## 7. Customer-Facing Language Rules (locked)

These are **never** appropriate in user-visible text:
- `Weedmaps`, `weedmaps` (specific platform name)
- `scraping`, `scraped`, `scraper`, `scrapes`
- `suppress`, `suppressed`, `suppression`
- `api-g`, `/discovery/v1/` (internal URLs)
- `endpoint`, `slug` (technical jargon in customer UI — flag in code review)

Always use:
- "Block" / "blocked" / "blocking" instead of suppress family
- "Menu provider" / "menu listing" instead of specific platform names
- "Aggregates" / "monitors" / "updates" instead of scrape family

The cancel-block flow has three required disclosures:
1. Cancellation is **immediate**, not deferred to billing-period end
2. Rival is contacted within 24-48h
3. Prorated remainder is forfeited (mono 11px, `var(--text-3)`, fine print)

---

## 8. DERIVED: Tailwind config (suggested mapping)

> **Not extracted — this is a draft mapping.** No Tailwind config exists in the source. Verify before using.

```javascript
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Map CSS vars to Tailwind via CSS-var bridge so theme switching works
        bg: 'rgb(var(--bg-rgb) / <alpha-value>)',
        surface: 'var(--surface)',
        'surface-2': 'var(--surface-2)',
        'surface-3': 'var(--surface-3)',
        'text-1': 'var(--text-1)',
        'text-2': 'var(--text-2)',
        'text-3': 'var(--text-3)',
        accent: 'var(--accent)',
        'accent-soft': 'var(--accent-soft)',
        'accent-hover': 'var(--accent-hover)',
        warm: 'var(--warm)',
        'warm-soft': 'var(--warm-soft)',
        rose: 'var(--rose)',
        'rose-soft': 'var(--rose-soft)',
        rail: 'var(--rail-bg)',
        'rail-fg': 'var(--rail-fg)',
        'rail-accent': 'var(--rail-accent)',
        danger: 'var(--danger)',
        warning: 'var(--warning)',
        positive: 'var(--positive)',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        display: ['Instrument Serif', 'serif'],
      },
      fontSize: {
        '2xs': '8.5px',
        'xs': '10px',
        '11': '11px',
        'sm': '12px',
        'base': '13px',
        'md': '14px',
        'lg': '15px',
        'xl': '16px',
        '2xl': '18px',
        '3xl': '22px',
        '4xl': '26px',
        'hero': '44px',
        'hero-xl': '56px',
      },
      borderRadius: {
        'xs': '8px',
        'sm': '12px',
        DEFAULT: '18px',
      },
      boxShadow: {
        card: 'var(--card-shadow)',
        'card-lg': 'var(--card-shadow-lg)',
        cta: 'var(--cta-shadow)',
        'cta-danger': 'var(--cta-danger-shadow)',
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(.2,.8,.2,1)',
      },
      transitionDuration: {
        '320': '320ms',
        '220': '220ms',
      },
      width: {
        rail: '64px',
        'rail-expanded': '240px',
        list: '360px',
        detail: '420px',
      },
      zIndex: {
        topbar: '30',
        rail: '40',
        'rail-hover': '50',
        modal: '9000',
        toast: '9100',
      },
    },
  },
  plugins: [],
};
```

**Important caveat:** the CSS-var bridge approach (`'var(--accent)'` in Tailwind colors) means **Tailwind's `/<alpha-value>` modifier will not work** for those colors — you can't write `bg-accent/50`. To get alpha modifiers working, you'd need to convert tokens to space-separated RGB triplets (`--accent-rgb: 11 184 184`) and use `rgb(var(--accent-rgb) / <alpha-value>)`. That's a deeper refactor decision for whoever does the wiring.

---

## 9. DERIVED: React component scaffolds (suggested)

> **Not extracted — this is a sketch.** No React components exist. Use as a starting structure.

### 9.1 Component inventory

Based on the patterns repeated across the 35 screens, the React component library should include:

**Layout:**
- `<NavRail>` — the dark navy collapsed rail (one instance, persistent across routes)
- `<Topbar>` — page header with title, breadcrumb, actions
- `<Workspace>` — main content area, accepts list+detail or single-column layouts
- `<DetailPanel>` — slide-out right-side panel, animated width

**Surface:**
- `<Card>` — universal surface container; accepts `padding`, `shadow` props
- `<KpiCard>` — stat card with display-serif italic number
- `<BlockCard>` — rival block card (S16 archetype)

**Atoms:**
- `<Pill variant="tracking" | "blocking-you" | "your-block" | "warning" | "danger">`
- `<Chip>` — smaller pill, used in tables
- `<Button variant="primary" | "secondary" | "cancel" | "ghost">`
- `<IconButton>` — square icon-only button
- `<Sparkline>` — 14-day daily change chart (S16)

**Inputs:**
- `<Toggle>` (the pill-toggle pattern with .pill-knob)
- `<Tab>` (the tab-selector used in S20)
- `<DropdownSelect>`
- `<SearchInput>`

**Triage / list:**
- `<AlertCard>` (S12 with snooze, bulk select, empty state)
- `<LocationListItem>` (S04 with map sync)
- `<DataTable>` (S07 archetype with sortable headers, sticky first column)

### 9.2 Example: `<Pill>` component

```tsx
import { cn } from '@/lib/utils';

type PillVariant = 'tracking' | 'blocking-you' | 'your-block' | 'warning' | 'danger' | 'neutral';

interface PillProps {
  variant?: PillVariant;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<PillVariant, string> = {
  tracking:      'bg-[var(--accent-soft)] text-[var(--accent)]',
  'blocking-you':'bg-[var(--warm-soft)] text-[var(--warm)]',
  'your-block':  'bg-[var(--rose-soft)] text-[var(--rose)]',
  warning:       'bg-[var(--warning-soft)] text-[var(--warning)]',
  danger:        'bg-[rgba(196,59,78,0.10)] text-[var(--danger)]',
  neutral:       'bg-[var(--surface-3)] text-[var(--text-2)]',
};

export function Pill({ variant = 'neutral', icon, children, className }: PillProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-1 rounded-xs',
        'text-[11px] font-medium whitespace-nowrap',
        variantStyles[variant],
        className
      )}
    >
      {icon}
      {children}
    </span>
  );
}
```

### 9.3 Example: `<NavRail>` component

```tsx
'use client';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface NavLinkProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  done?: boolean;
}

export function NavRail() {
  const pathname = usePathname();
  return (
    <aside
      className={cn(
        'group',
        'w-rail hover:w-rail-expanded transition-[width] duration-220 ease-spring',
        'bg-rail border-r border-[var(--rail-divider)]',
        'h-screen flex flex-col flex-shrink-0',
        'overflow-hidden relative z-rail hover:z-rail-hover',
        'hover:shadow-[8px_0_40px_-8px_rgba(0,0,0,0.45)]'
      )}
      style={{ color: 'var(--rail-fg)' }}
    >
      <div className="p-4 flex flex-col h-full">
        <Logo />
        <NavScroll>
          <NavGroup label="Intelligence">
            <NavLink href="/" icon={<HomeIcon />} label="Command Center" />
            <NavLink href="/alerts" icon={<BellIcon />} label="Alert Feed" />
            {/* ... */}
          </NavGroup>
        </NavScroll>
        <NavFooter />
      </div>
    </aside>
  );
}
```

(NavLink, NavGroup, NavScroll, NavFooter, Logo follow the same pattern — opacity-0 on labels with `group-hover:opacity-100` to recreate the collapse-on-default behavior.)

### 9.4 Recommended file structure

```
src/
├── app/                       # Next.js App Router
│   ├── (onboarding)/
│   │   ├── signup/page.tsx        # ← s01_FINAL
│   │   ├── locations/page.tsx     # ← s02_FINAL
│   │   └── rivals/page.tsx        # ← s03_FINAL
│   ├── (app)/
│   │   ├── layout.tsx             # NavRail + Topbar wrapper
│   │   ├── page.tsx               # ← s04_FINAL Command Center
│   │   ├── locations/page.tsx     # ← s05_FINAL
│   │   ├── alerts/page.tsx        # ← s12_FINAL
│   │   ├── alerts/[id]/page.tsx   # ← s13/s14/s15
│   │   ├── analytics/
│   │   │   ├── roi/page.tsx       # ← s20_FINAL
│   │   │   ├── heatmap/page.tsx   # ← s21_FINAL
│   │   │   └── ...
│   │   ├── billing/page.tsx       # ← s28_FINAL
│   │   ├── blocks/page.tsx        # ← s16_FINAL
│   │   ├── blocks/cancel/page.tsx # ← s18_FINAL
│   │   └── ...
│   └── (utility)/
│       ├── winback/page.tsx       # ← s34_FINAL
│       └── ...
├── components/
│   ├── nav/
│   │   ├── NavRail.tsx
│   │   ├── NavLink.tsx
│   │   ├── NavGroup.tsx
│   │   └── NavFooter.tsx
│   ├── layout/
│   │   ├── Topbar.tsx
│   │   ├── Workspace.tsx
│   │   └── DetailPanel.tsx
│   ├── atoms/
│   │   ├── Pill.tsx
│   │   ├── Chip.tsx
│   │   ├── Button.tsx
│   │   ├── Toggle.tsx
│   │   └── Sparkline.tsx
│   ├── cards/
│   │   ├── Card.tsx
│   │   ├── KpiCard.tsx
│   │   ├── BlockCard.tsx
│   │   └── AlertCard.tsx
│   └── tables/
│       └── DataTable.tsx
├── styles/
│   ├── globals.css                # All :root + theme tokens go here
│   └── fonts.css                  # Font imports
└── lib/
    ├── utils.ts                   # cn() helper
    └── theme.ts                   # Theme toggle logic
```

---

## 10. What this document is and isn't

**This document IS:**
- A complete extraction of the CSS token system actually present in the FINAL screens
- A faithful catalog of color semantic rules and customer-facing language rules
- A compilation of the typography, spacing, and motion patterns the screens actually use

**This document is NOT:**
- The Tailwind config that was used to build the mockups (no such config exists; the mockups use vanilla CSS)
- A spec for React components that exist (none exist yet)
- A guarantee that every value in §8 and §9 is the right architectural choice — those sections are starting points for whoever wires this to React+Tailwind, not an authoritative spec

When in doubt, **the 35 FINAL HTML files are the source of truth.** Anything in this doc that conflicts with the FINAL files is wrong; the FINAL files win.

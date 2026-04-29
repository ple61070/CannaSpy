# CannaSpy UI Bundle — Visual / UX Audit Prompt
**For Claude Code in `/plan` mode. Paste this prompt verbatim after entering `/plan`.**

---

You are performing a complete UI/UX, visual design, and user experience audit of the 35 final HTML mockups in `~/CannaSpy/CannaSpy_UI/cannaspy_bundle/` (`cannaspy_s01_FINAL.html` through `cannaspy_s35_FINAL.html`).

## Scope — STRICTLY visual / UX. Nothing else.

**DO NOT audit:**
- Backend wiring, API calls, data shape, fetch logic
- Business-logic correctness (blocking mechanic, billing, scheduling)
- Data pipeline, scraper, opsec
- Build / bundling / performance

**DO audit, exhaustively, every one of these categories on every screen:**

### 1. Layout & Rendering Defects
- Text overflowing pills, badges, buttons, chips, status tags
- Text wrapping inside elements that should be single-line (pills, table cells with `nowrap`, button labels)
- Truncation without ellipsis, or ellipsis cutting at awkward points
- Elements visually colliding or overlapping
- Misaligned table columns, headers, row baselines
- Inconsistent padding/margin between similar elements across screens
- Buttons of the same visual rank rendered at different heights/widths
- Icon-text baseline misalignment
- Cards or sections with awkward empty space or compressed content
- Z-index / stacking issues, modal overlay bugs, dropdown clipping at viewport edges
- Scroll containers without scroll affordance when overflow exists
- Numeric values that orphan to a new line (price + unit split across lines)

### 2. Brand Conformance (cross-reference `BRAND.md`)
- Use of Tailwind default greens/ambers/reds instead of CannaSpy palette:
  - `--bg-base: #0d0f11`
  - `--accent-intel: #1d9e75` (teal — intelligence)
  - `--accent-block: #ba7517` (amber — blocking)
  - `--accent-alert: #d4537e` (coral — alerts)
- Body text not in **DM Sans**
- Numbers, prices, timestamps NOT in **Space Mono**
- Inconsistent type scale across screens (h1, h2, body, caption)
- Inconsistent border-radius language
- Inconsistent shadow / elevation language
- Color contrast failures (any text under WCAG AA on `#0d0f11`)
- Leaf emoji, "420", or any cannabis-marketing aesthetic in the product UI
- Focus rings missing, inconsistent, or invisible against the base
- Hover state missing or inconsistent for the same component across screens

### 3. Component Consistency Across the Bundle
- Same component (pill, alert row, table cell, modal, empty state) styled differently on different screens
- Inconsistent terminology for the same primitive ("Block" vs "Suppress" vs "Hide rival")
- Inconsistent empty-state pattern (some have illustrations, some don't, some have CTAs, some don't)
- Inconsistent loading-state pattern
- Inconsistent error-state pattern
- Timestamp format inconsistent (relative vs absolute; timezone shown vs not)
- Number formatting inconsistent (thousands separator, currency symbol position, decimal places)
- Status badges (Active / Blocked / Eligible / Suppressed / Tracking) styled inconsistently

### 4. Customer-Facing Copy (cross-reference `CLAUDE.md` "Customer-Facing Language" rules + `BRAND.md`)
- ANY mention of Weedmaps, Leafly, Dutchie, iHeartJane, or any specific data platform — flag as **CRITICAL**
- ANY description of "scraping," "crawling," or API methodology
- Generic SaaS copy: "Something went wrong," "No data available," "Submit," "OK," "Are you sure?"
- Empty states that don't state operational status (should read like "All clear across N markets. Last checked HH:MM")
- Button labels that aren't action verbs ("OK," "Submit," "Continue" without object)
- Error messages without specifics + retry expectation
- Confirmation dialogs that don't state the specific consequence
- Screen 33 (Cancellation Flow) — does it transparently say the rival will be re-added to the prospect list with 24–48h follow-up? Per `CLAUDE.md` this MUST be present.

### 5. Information Hierarchy
- Primary action competing visually with secondary actions
- Critical numbers (price deltas, alert counts, billable slot count, MRR) not visually dominant
- Page-level H1 weak or missing
- Breadcrumb / location-context indicator missing on deep screens
- Status (active / blocked / eligible / suppressed) not immediately legible at a glance

### 6. Interaction / Flow Clarity
- Disabled-state styling indistinguishable from enabled
- No visual distinction between primary, secondary, and tertiary buttons
- Form labels missing or not associated with inputs
- Required-field indicators inconsistent (asterisk vs "(required)" vs nothing)
- Toggle / checkbox / radio used inconsistently for similar choices
- Multi-step flows (onboarding s02–s06, cancellation s33) — step indicator presence + clarity
- Tooltips / hints missing on jargon-heavy elements (market-heat tier, slot type, normalization status)

### 7. Accessibility — WCAG 2.1 AA spot check
- Color as the sole indicator (red text alone, no icon or label)
- Tap/click targets under 44×44 px on touch-sized hit zones
- Form errors not associated with their input via `aria-describedby`
- Modal dialogs missing `role="dialog"` / `aria-labelledby`
- Icon-only buttons missing `aria-label`
- Heading hierarchy skipping levels

---

## Deliverable Format

### Per-screen section (× 35)

```
## s01 — [Screen name from ARCHITECTURE.md]

### Critical (breaks the screen, ships unusable)
- [element / location in DOM] — [issue] — [suggested fix]

### High (clearly wrong, should ship-block)
- ...

### Medium (visible polish issues)
- ...

### Nits (batch later)
- ...
```

If a screen is clean: write `No issues found.` and move on.

### After all 35 screens, two summaries:

**Recurring Issues Across the Bundle** — patterns appearing on 3+ screens (e.g. "every table uses Tailwind `gray-700` instead of `--bg-base`"). These are global fixes; calling them out separately lets us batch them.

**Top 10 Highest-Impact Fixes** — ranked by UX impact, not by occurrence count.

---

## Source-of-Truth Docs — read FIRST, before opening any HTML

Read in this order:
1. `~/CannaSpy/CLAUDE.md` — customer-facing language hard rules
2. `~/CannaSpy/BRAND.md` — palette, typography, voice
3. `~/CannaSpy/ARCHITECTURE.md` — what each numbered screen is supposed to do (so the audit knows whether the mockup actually fulfills its product role)
4. `~/CannaSpy/docs/CannaSpy_Data_Architecture.md` — operational language rules around data sourcing
5. `~/CannaSpy/CannaSpy_UI/AUDIT_S04_2026-04-17.md` — prior audit on s04, use the format and rigor as a reference baseline
6. `~/CannaSpy/CannaSpy_UI/CANNASPY_CONTEXT.md`

## Method

1. Read the six reference docs above.
2. Iterate through `cannaspy_s01_FINAL.html` → `cannaspy_s35_FINAL.html` in order.
3. For each screen: read the HTML + inline CSS carefully, mentally render it, and check every category above.
4. **Where feasible, render in a headless browser (Playwright/Puppeteer) at 1440×900 and 375×812, screenshot, and visually inspect** — overflow, clipping, and z-index bugs are often invisible from source alone.
5. Cross-reference each screen number against `ARCHITECTURE.md` to confirm the mockup fulfills its intended product role.
6. Compile per-screen findings, then the two summaries.

## Constraints

- **Do NOT modify any files.** This is a planning audit. Produce the report only.
- **Do NOT comment on backend / data / API concerns** — that audit comes next, separately.
- Be specific. Every finding must reference a DOM element, a coordinate, or a quoted string from the file.
- Severity must be honest. If everything is "Critical," nothing is.
- If a finding is subjective (taste vs. defect), mark it explicitly with `(subjective)`.

Begin by listing the 6 reference docs you'll read, confirm scope back, then produce the audit. Stay in plan mode — do not edit anything.

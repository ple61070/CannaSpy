# CannaSpy UI Bundle — Visual / UX Audit, Pass 2
**For Claude Code in `/plan` mode. Paste this prompt verbatim after entering `/plan`.**

---

## What changed since pass 1

**Pass 1 was run against an outdated `BRAND.md`.** A new authoritative design system has been published at `~/CannaSpy/CannaSpy_UI/CANNASPY_DESIGN_SYSTEM.md` (last updated 2026-04-26). It supersedes `BRAND.md` for any conflict.

**Read `CANNASPY_DESIGN_SYSTEM.md` first. It is now the source of truth for tokens, typography, spacing, motion, components, and color semantics.** When `BRAND.md` and `CANNASPY_DESIGN_SYSTEM.md` disagree, the design system wins.

### Findings from pass 1 that are now RETRACTED (do not repeat)

- **B1 (typography migration to DM Sans / Space Mono)** — RETRACTED. The canonical stacks are now `--sans: Plus Jakarta Sans`, `--mono: JetBrains Mono`, `--display: Instrument Serif`. The bundle's typography is correct.
- **B5 (Instrument Serif removal)** — RETRACTED. Instrument Serif is the canonical display font for hero stat numbers. `font-style: italic + font-weight: 400` on `.kpi-value` is the locked treatment.
- **B3 (color tokens migration)** — RETRACTED at the values level. The bundle's `#0bb8b8 / #0bd5d5` (teal), `#d4900a / #F6C992` (warm amber), `#a85a7a / #D396A6` (rose), `#c43b4e / #ff6b7d` (danger) match the new design system. **However**, audit each screen's adherence to the **semantic** rules in §2 of the design system (see below) — that part still matters.
- **S04 finding "MRR stat" (sidebar) and S05 same** — keep this only if the label literally says "MRR." The semantics-of-the-label issue stands; the token migration angle does not.
- **S01 required-field asterisk in rose** — STILL VALID, but the reason is now sharper: rose is reserved for "blocks YOU placed on rivals." Using rose for required-field asterisks introduces semantic ambiguity. Use `--text-3` or a neutral asterisk.

### Findings from pass 1 that REMAIN VALID

- **S03 P0 — `DUTCHIE` platform name leaking on rival cards.** Still ship-blocking under the design system's §7 customer-facing language rules.
- **S01/S03 P1 — `toggleTheme()` references `getElementById('tl')` which doesn't exist.** Real JS bug. Theme toggle crashes.
- **S01 P1 — undefined CSS vars (`--input-bg`, `--input-border`, `--btn-shadow-lg`, `--bg-grad-1/2/3`).** Real bug — form inputs render unstyled.
- **S02 P1 — undefined CSS vars (`--map-bg`, `--map-grid`, `--map-road`, `--map-block`, `--loc-bg`, `--loc-border`).** Real bug — map and location list render blank/unstyled.
- **S04 P1 — three JS bugs from prior s04 audit (sparse RIVALS array, stale `detail-panel` vs `detailPanel` IDs, stale `.list-item-title` vs `.li-title` selector).** Detail panel never opens; search never filters.
- **B4 — nav paradigm split.** Still valid. The collapsible 64px → 240px rail with `--rail-bg: #1a2f42` is now LOCKED canonical (design system §1.4). S01–S06 must adopt it.
- **B7 — icon-only collapsed nav lacks `aria-label`** (S08–S35). Still valid WCAG gap.
- **Compliance verifications on S16, S18, S33** — still valid.
- **S19, S28, S34 "24 hours" should be "24–48 hours"** — still valid copy issue.
- **S35 hardcoded hex values in `.ac-avatar` background colors** — still valid maintainability issue.
- **S01 missing Stripe card-on-file step** — still valid product-spec gap.
- **S03 "blocking-you" rivals have empty interaction handlers** — still valid UX defect.
- **S04 amber dual-meaning** — still valid; design system §2 explicitly reserves `--warm` for "rival blocking you," NOT for general warnings. Anywhere amber is used for general warning is a semantic violation.

---

## Goal of this pass

**Pass 1 read source code only. It missed every overflow / clipping / layout defect — which is the user's #1 stated concern.** Pass 2 must:

1. **Render every screen in a real browser**, take screenshots at two viewports, and visually inspect for layout defects.
2. **Re-audit the 12 screens previously marked "no issues found"** (S10, S11, S13, S14, S15, S20, S21, S22, S23, S24, S25, S26, S27, S29, S30, S31). 34% of the bundle was given a clean bill of health with no evidence of inspection. That's not acceptable.
3. **Apply the new design-system rules** (color semantics, language rules, three required cancel-block disclosures) that were not in the original prompt.
4. **Catalog new defects** without re-reporting any retracted finding.

## Source-of-truth docs — read in this order, no exceptions

1. `~/CannaSpy/CannaSpy_UI/CANNASPY_DESIGN_SYSTEM.md` — **NEW. AUTHORITATIVE.** Read first.
2. `~/CannaSpy/CLAUDE.md` — customer-facing language hard rules; cross-reference with DESIGN_SYSTEM §7. Where they conflict, DESIGN_SYSTEM wins.
3. `~/CannaSpy/ARCHITECTURE.md` — what each screen is supposed to do.
4. `~/CannaSpy/docs/CannaSpy_Data_Architecture.md` — operational language rules around data sourcing.
5. `~/CannaSpy/CannaSpy_UI/AUDIT_S04_2026-04-17.md` — prior s04 audit, format reference.
6. `~/.claude/plans/composed-kindling-finch.md` — pass 1 plan output. Read it so you don't re-report or contradict it.
7. `~/CannaSpy/BRAND.md` — REFERENCE ONLY. Superseded by DESIGN_SYSTEM.md. Do NOT use as authority.

After reading, post a one-line confirmation that you understand the retractions above and will not re-flag them.

---

## Method — required steps, in order

### Step 1 — Render and screenshot the bundle

Use Playwright (install with `pnpm add -D playwright && npx playwright install chromium` if missing). For each `cannaspy_s01_FINAL.html` through `cannaspy_s35_FINAL.html`:

1. Render the file at viewport `1440 × 900` (desktop)
2. Take a full-page screenshot, save as `~/CannaSpy/CannaSpy_UI/audit_renders/desktop/sNN_FINAL.png`
3. Render the same file at viewport `375 × 812` (mobile)
4. Take a full-page screenshot, save as `~/CannaSpy/CannaSpy_UI/audit_renders/mobile/sNN_FINAL.png`
5. Render once more at `1440 × 900` with `data-theme="light"` AND once with `data-theme="dark"`. Save as `..._light.png` and `..._dark.png`. (The design system supports both; the bundle defaults to light. Both must look correct.)
6. While each screen is rendered, capture browser console errors and warnings. Save to `~/CannaSpy/CannaSpy_UI/audit_renders/console/sNN.txt`. Reference in findings.

### Step 2 — Visually inspect each screenshot for layout defects

For every screen, look at all four screenshots (desktop-light, desktop-dark, mobile-light, mobile-dark) and document:

- Text overflowing pills, buttons, badges, status tags, chips
- Text wrapping inside elements that should be single-line
- Truncation without ellipsis, or ellipsis at awkward characters
- Elements colliding or overlapping
- Misaligned table columns / row baselines
- Buttons of the same visual rank rendered at different heights/widths
- Icon-text baseline misalignment
- Cards with awkward empty space or compressed content
- Modal clipping at viewport edges (test: open every modal that has a trigger)
- Dropdown / tooltip clipping
- Scroll containers without scroll affordance when overflow exists
- Numeric values orphaned across lines
- Nav rail behavior at hover (does it expand to 240px? does it overlay topbar correctly per z-index §4.4?)

**No "no issues found" without referencing the specific screenshot you inspected.** If a screen genuinely has no defects, write: `Reviewed sNN_FINAL_desktop_light.png and sNN_FINAL_mobile_dark.png. No layout defects observed.` That sentence must appear or the finding is invalid.

### Step 3 — Apply the new design-system rules

For each screen, check:

#### 3a. Color semantics (DESIGN_SYSTEM §2 — locked rules)

- Is `--accent` (teal) used anywhere it shouldn't be? Specifically: NEVER on a "blocking you" rival.
- Is `--warm` (amber) used for general warnings? It must be reserved for "rival is blocking YOU." General warnings use `--warning` (orange).
- Is `--rose` used for tracking/active elements? It must be reserved for "blocks YOU placed on rivals." Tracking and active states use `--accent`.
- Is `--danger` (red) used on cancel buttons? Cancel must use `--rose`. Red implies system error.
- Is `--rail-accent` (`#0bd5d5`) used outside the nav rail? It's reserved for nav-link active states.
- Is the nav rail dark navy (`--rail-bg: #1a2f42`) in BOTH themes? It's always dark navy regardless of `data-theme`.

#### 3b. Customer-facing language (DESIGN_SYSTEM §7)

Grep each screen's rendered text for forbidden tokens:
- `Weedmaps`, `weedmaps`, `Dutchie`, `DUTCHIE`, `dutchie`, `Leafly`, `leafly`, `iHeartJane`, `Jane`, `STIIIZY` (only as platform reference, not as a rival dispensary brand)
- `scraping`, `scraped`, `scraper`, `scrapes`
- `suppress`, `suppressed`, `suppression`
- `api-g`, `/discovery/v1/`
- `endpoint`, `slug` (in customer-visible text — flag at code-review level)

Each occurrence must be flagged with line number and exact rendered string.

#### 3c. Cancel-block flow — three required disclosures (DESIGN_SYSTEM §7 end)

For S16 (Block Management), S18 (Cancel Block), S19 (Billing Preview), S33 (Cancel Subscription), verify ALL three disclosures are present and visible:

1. Cancellation is **immediate** (not deferred to billing-period end)
2. Rival is contacted within **24–48 hours**
3. **Prorated remainder is forfeited** — must be present, in mono 11px, `var(--text-3)`, fine-print styling

Pass 1 verified #1 and #2 on S18/S33. **#3 (prorated forfeiture) was not checked.** Audit this fresh. If the disclosure is missing, mark P1.

### Step 4 — Component pattern conformance (DESIGN_SYSTEM §6)

For each screen, check that components match the canonical CSS:

- `.card` — `var(--surface)`, 1px `var(--border)`, `var(--r)` radius, 24px padding, `var(--card-shadow)`. Flag any card that uses a different border-radius, padding, or shadow.
- `.btn` — 12.5px / 600 weight / `var(--r-sm)` radius / 8px-14px padding. Flag any button that uses different sizing.
- `.btn.primary` — `var(--accent)` background, `var(--cta-fg-on-pos)` text, `var(--cta-shadow)`. Flag deviations.
- `.btn.cancel` — `var(--rose)` background, white text. Flag any cancel button NOT in rose.
- `.pill` — 4px-10px padding, 8px radius, 11px / 500 weight, `white-space: nowrap`. Flag any pill with text wrapping or different padding.
- `.pill.tracking` / `.pill.blocking-you` / `.pill.your-block` — exact token mappings. Flag wrong token use.
- `.kpi-value` — `var(--display)` (Instrument Serif), 44px italic 400. Flag any KPI hero number using different treatment.
- `.kpi-label` — `var(--mono)` 9px, 0.16em letter-spacing, uppercase, `var(--text-3)`. Flag deviations.

### Step 5 — Z-index conformance (DESIGN_SYSTEM §4.4)

Verify across the bundle:
- Sticky topbar: `z-index: 30`
- Nav rail collapsed: `z-index: 40`
- Nav rail hovered/expanded: `z-index: 50` (must rise above topbar)
- Modal overlay: `z-index: 9000`
- Toast: `z-index: 9100+`

Flag any element using ad-hoc z-index that conflicts with this scale.

### Step 6 — Empty / loading / error state coverage

For each screen that renders dynamic content, document:
- Is the empty state coded? What does it say? Does it match BRAND.md / CLAUDE.md operational-status pattern (e.g., "All clear across N markets. Last checked HH:MM")?
- Is a loading state coded?
- Is an error state coded?

Pass 1 only checked this on S09 and S12. Pass 2 must check ALL screens with dynamic content lists (S03, S04, S05, S07, S08, S10, S11, S12, S16, S20, S21, S22, S24, S25, S26, S27, S29, S31, S35).

### Step 7 — Accessibility spot check (WCAG 2.1 AA)

For S04, S07, S12, S16, S33 (the highest-traffic MVP screens):
- Run an actual axe or pa11y audit if available (`npx @axe-core/cli ./cannaspy_s04_FINAL.html`).
- If not available, manually check:
  - All icon-only buttons have `aria-label`
  - Modal dialogs have `role="dialog"` and `aria-labelledby`
  - Form errors associated via `aria-describedby`
  - Color is not the sole indicator of state (icon or label always present alongside color)
  - Focus rings visible on all interactive elements (`:focus-visible` styling)
  - Heading hierarchy not skipping levels
  - Color contrast: text on `--surface` and `--bg` meets AA in both themes

Cite specific elements + screenshots.

### Step 8 — Re-audit the 12 "clean" screens

Specifically re-examine these screens that pass 1 marked "no issues" without inspection evidence: **S10, S11, S13, S14, S15, S20, S21, S22, S23, S24, S25, S26, S27, S29, S30, S31.**

For each, write at least three lines documenting what was inspected (which screenshots, which DOM elements, which copy strings) before any "no issues" conclusion. If issues are found — likely on most of them — report them at the appropriate severity.

---

## Deliverable format

Amend the existing pass-1 plan at `~/.claude/plans/composed-kindling-finch.md` with a new section titled `## Pass 2 — Findings`.

Per-screen subsections:

```
### sNN — [Screen name]
**Screenshots reviewed:** desktop_light.png, desktop_dark.png, mobile_light.png, mobile_dark.png
**Console errors:** [list any]

#### Layout / overflow defects
- [screenshot reference + DOM element] — [issue] — [suggested fix]

#### Color semantics violations
- ...

#### Customer-facing language violations
- ...

#### Component pattern deviations
- ...

#### Empty / loading / error state gaps
- ...

#### Accessibility gaps
- ...

#### Pass-1 retractions confirmed on this screen
- [if any]
```

After all 35 screens, two summaries:

**Pass 2 — Recurring issues** — patterns appearing on 3+ screens that pass 1 missed.

**Pass 2 — Top 10 highest-impact fixes (revised)** — combine still-valid pass-1 findings with new pass-2 findings, ranked by user-experience impact. The S03 DUTCHIE leak should be #1.

---

## Constraints

- **Do NOT modify any source files.** Plan mode only. Edits to `~/CannaSpy/CannaSpy_UI/audit_renders/` are fine; that's audit output.
- **Do NOT re-report retracted findings** (B1, B3, B5, and the parts of S04/S05 about token migration).
- **Do NOT comment on backend / API / data pipeline.** That audit comes after this one.
- Every defect must reference: a screenshot filename, a DOM selector or line range, and a quoted offending string where applicable.
- Severity must be calibrated. Pass 1 had 1 P0 (justified) and several P1s (mostly justified). Pass 2 should flag P0 only for ship-blockers (compliance failures, platform-name leaks, broken JS that prevents core flow).
- Mark subjective findings explicitly with `(subjective)`.

---

## Begin

Start by:
1. Listing the 7 reference docs you'll read (in the specified order).
2. Posting a one-line confirmation: "Acknowledged: B1, B3, B5 retracted. New source-of-truth is CANNASPY_DESIGN_SYSTEM.md."
3. Confirming Playwright is installed (or installing it).
4. Then proceed through Steps 1–8 in order.

Stay in plan mode. Do not edit source HTML.

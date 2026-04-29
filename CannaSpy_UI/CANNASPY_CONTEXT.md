# CannaSpy Project Context

Every design task in this plugin is scoped to CannaSpy — a B2B competitive intelligence SaaS for licensed California cannabis dispensaries, targeting Multi-Site Operators (MSOs) with 10+ locations. Before producing critique, copy, system audits, or handoff specs, apply the rules below.

---

## Who the UI is for

- **Primary buyer**: owners and ops leaders at California cannabis MSOs with 10+ locations
- **Primary daily user**: buying managers, merchandisers, and location managers inside those MSOs
- **Secondary audience**: investors during demo, internal CannaSpy sales team
- Not a consumer product. Not a budtender tool. Enterprise operators only.

Tone should feel like **Bloomberg Terminal meets a weapons-grade competitive intel platform** — confident, data-dense, decisive. Not cute. Not playful. Not soft.

---

## File structure

All UI files live at `~/CannaSpy/CannaSpy_UI/` as standalone HTML mockups:

- Naming: `cannaspy_sNN_vN.html` where NN is the screen number (01–35) and vN is the version
- Canonical file per screen is the highest version number listed in the handoff
- Each file is self-contained: inline CSS, vanilla JS, no framework dependencies
- One shared nav sidebar is injected across every canonical file
- Light mode is default, dark mode toggle on every screen

---

## The 35 screens

| # | Area | Purpose |
|---|------|---------|
| 01 | Onboarding | Org setup |
| 02 | Onboarding | Add dispensary locations |
| 03 | Onboarding | Competitor discovery — radius scan |
| 04 | Intelligence | Command Center (main dashboard) |
| 05 | Intelligence | Per-location dashboard |
| 06 | Intelligence | Single competitor deep dive |
| 07 | Intelligence | Price Intelligence matrix |
| 08 | Intelligence | Promotions Tracker |
| 09 | Intelligence | Price History (90-day chart) |
| 10 | Intelligence | Catalog Comparison (SKU overlap) |
| 11 | Intelligence | Brand Coverage matrix |
| 12 | Alerts | Alert Feed |
| 13 | Alerts | Alert Detail |
| 14 | Alerts | Price Change Deep Dive |
| 15 | Alerts | Promo Deep Dive |
| 16 | Blocking | Block Management |
| 17 | Blocking | Block Confirm (billing terms) |
| 18 | Blocking | Cancel Block Warning |
| 19 | Blocking | Billing Preview |
| 20 | Blocking | Block Analytics (ROI) |
| 21 | Market | Market Heat Map (CA) |
| 22 | Market | Competitor Ranking |
| 23 | Market | My Benchmarks |
| 24 | Market | New Rival Alert |
| 25 | Market | SKU Gap Analysis |
| 26 | Market | Deal Effectiveness |
| 27 | Team | Annotations |
| 28 | Account | Billing & Slot Usage |
| 29 | Team | Location Access Control |
| 30 | Account | Alert Settings |
| 31 | Account | Location Management |
| 32 | Account | Data Trust & Provenance |
| 33 | Account | Cancellation Flow |
| 34 | Lifecycle | Re-engagement / Win-back |
| 35 | Action | Action Queue (tasks from alerts) |

---

## Current design tokens (open for redesign)

> These are the tokens used consistently across the current 35 HTML mockups, not a locked system. The UI/UX upgrade may change any of them — colors, type scale, semantic meanings, fonts. Treat this section as the *starting point* to critique and evolve, not a constraint.

### Colors

| Token | Hex | Semantic meaning |
|-------|-----|------------------|
| Teal | `#09A1A1` / `#0bb8b8` | Tracking, active state, positive signal |
| Warm Amber | `#d4900a` / `#F6C992` | **Rivals blocking YOU** (and only this) |
| Rose | `#D396A6` | Blocks YOU have placed on rivals |
| Danger | `#e05a6a` | Alerts, high priority, urgent |
| Slate | `#5484A4` | Neutral data, secondary text |

The amber/rose semantic distinction (incoming block vs outgoing block) is a product mechanic, not a color lock. The *meaning* must stay intact — a user has to instantly tell incoming from outgoing — but the specific hues used to signal each direction can change in the upgrade. If amber and rose get swapped for a different pair, the plugin should flag the pairing's readability, not the original hex values.

### Typography

- **Body**: Plus Jakarta Sans
- **Numbers, labels, badges, tabular data**: JetBrains Mono
- Use JetBrains Mono aggressively for any number the user compares — prices, counts, percentages, dates. Monospace = confidence.

### Consistent sample data (used across all intelligence screens)

- **Tracked rivals (5)**: STIIIZY, MedMen, Off The Charts, Catalyst, Harborside
- **User's active blocks (2)**: STIIIZY WeHo (47d, 10 locations, $2,000/mo), Off The Charts DTLA (22d, 8 locations, $1,600/mo) — both auto-renew May 1
- **Rivals blocking the user (3)**: Jungle Boys DTLA (63d), Harborside SJ (31d), Cookies SF (8d)
- **Brands**: Friendly Farms, Jeeter, Kanha, Maven, Raw Garden
- **Account scale**: 10 locations, 63 track + 18 block slots, $14,025/mo MRR
- **Market-heat pricing**: Elite $200–250/slot (WeHo, DTLA, SF), Competitive $150, Standard $100

---

## Customer-facing language rules (hard rules — non-negotiable)

### Data source — NEVER reveal the platform

CannaSpy's data pipeline reads from a specific public cannabis-retail platform API. Customer-facing UI, copy, and sales material must NEVER mention that platform by name, its API, its endpoint pattern, or its slug pattern.

- **Approved phrasing**: "CannaSpy aggregates pricing, product, and promotional data from publicly available cannabis market sources. Our data collection infrastructure is proprietary."
- **Banned**: Weedmaps, `api-g`, `/discovery/v1/listings`, slug, endpoint, Dutchie (as a data source — fallback only), the phrase "scraping" in customer UI
- This is a business-critical rule. A customer mentioning the source to their platform rep is the realistic path to platform awareness — not technical detection. The UI must give them no ammunition.
- FAQ answers on Screen 32 are pre-written and vetted. Use them verbatim for any data-sourcing question.

### Billing model language

- Slots **auto-renew on the 1st of each month** — no action needed to keep active
- Only action available is **Cancel block** (not "renew")
- One-month minimum per slot; prorated on activation, full charge on the 1st
- Cancelling before the 1st = slot stays active through end of month, no charge next month
- Never use the phrase "renew block" anywhere in the UI — the button does not exist
- Use **"Cancel block"** or **"Block analytics"** as the only actions on an active block

### Blocking mechanic language

- Use **"blocked"** and **"blocking"** consistently — not "suppressed", "hidden", or "excluded"
- A rival blocking the user is labeled in **warm amber** with a specific message pattern: "[Rival name] is blocking your tracking." Never euphemize this state — operators need to feel the pressure.
- Track and Block buttons must be **disabled** for rivals who are blocking the user, with a tooltip: "This rival has blocked you from tracking them."
- When the user cancels their own block, warn explicitly that the blocked rival is immediately contacted — this is the core churn lock mechanic and should never be softened

---

## Tone and voice defaults (for UX copy command)

- **Confident, direct, operator-to-operator** — no hedging, no apology
- **Data-forward** — lead with the number, then the context
- **Urgency where appropriate** — new rival alerts, blocking status changes, cancellation flow should create real tension, not false alarm
- **No marketing fluff** — this is a daily-use ops tool, not a landing page
- **Short CTAs**: "Block rival", "Cancel block", "Track this", "View price history" — never "Click here to get started"
- **Error messages**: state what happened and what the user can do, no apologies or excessive empathy

Core internal positioning: *"Weedmaps built a trap. CannaSpy builds a moat."* This line is used in INVESTOR and INTERNAL sales material only — it is NEVER used in customer-facing UI, because it violates the platform-naming rule above.

---

## What changes from a generic design critique

Standard design principles apply. On top of those, flag these CannaSpy-specific concerns:

1. **Block-state readability** — can a user tell outgoing blocks from incoming blocks at a glance? The *specific* colors can change in the upgrade; the clear distinction cannot.
2. **Platform-name leakage** (hard rule — does not change with redesign) — does any label, tooltip, empty state, or error message reference the source platform by name, API, slug, or "scraping"? This is a P0 bug.
3. **Billing language clarity** (hard rule — product mechanic, not visual) — does Block Management communicate auto-renew on the 1st and the one-month minimum? Is "Cancel block" the only action on active blocks? ("Renew block" doesn't exist as a mechanic.)
4. **Number typography** — when prices, counts, and percentages need to be compared at a glance, monospace helps. If the upgrade moves away from JetBrains Mono, verify the replacement preserves tabular alignment.
5. **Data freshness signaling** — intel tool: every price and inventory surface needs a "last updated" timestamp. Stale data is worse than no data in this product.
6. **Nav active state accuracy** — the current handoff maps: S13/S14/S15/S24 highlight Alert Feed; S17/S18/S19/S20 highlight Block Management; S08/S09/S10/S11 highlight Price Intelligence. If nav structure changes in the redesign, update this mapping accordingly.

### What's actually non-negotiable

Only two rules never change regardless of redesign direction:

- **The source platform is never named in customer-facing UI.** This is a business rule, not a design choice.
- **Cancelling a block arms the rival.** This mechanic must be communicated clearly and unflinchingly, wherever cancellation can happen. Softening this breaks the product's core defensibility.

Everything else — colors, typography, layout, information density, nav structure — is fair game for the redesign.

# CannaSpy — Project Handoff & Strategy Document
**Version 2.0 | March 2026**
**Confidential — Internal Use Only**

> **Changelog v1.0 → v2.0:** Section 7 (Technical Foundation) fully updated to reflect the Weedmaps discovery API as primary data source, confirmed operator coverage, and the Supabase + Vercel infrastructure decision. Section 9 (Next Steps) updated to reflect the four-phase build plan, answered open questions, and Claude Code as project lead engineer. All other sections unchanged.

---

> "We don't sell data. We sell competitive advantage — and the peace of mind that comes with it."

---

## Table of Contents
1. [Business Overview](#1-business-overview)
2. [Target Customer Strategy](#2-target-customer-strategy)
3. [Pricing Model](#3-pricing-model)
4. [The Blocking Feature](#4-the-blocking-feature--the-secret-weapon)
5. [Sales Strategy & The Flywheel](#5-sales-strategy--the-flywheel)
6. [The Weedmaps Comparison](#6-the-weedmaps-comparison)
7. [Technical Foundation](#7-technical-foundation)
8. [Brand Positioning & Messaging](#8-brand-positioning--messaging)
9. [Next Steps](#9-next-steps)

---

## 1. Business Overview

### What is CannaSpy?

CannaSpy is a B2B competitive intelligence SaaS platform built exclusively for licensed cannabis dispensaries and multi-location operators (MSOs) in California. It enables dispensaries to monitor competitor pricing, promotions, and product activity in real time — and uniquely allows them to **block specific competitors from ever accessing the platform.**

> **Note:** The business was formerly scoped under the working name "CannaIntel." The brand has been updated to CannaSpy, which better reflects the product's intelligence-forward positioning. All prior code artifacts (dispensary_scraper.py, dashboard.jsx) were built under the CannaIntel name and need rebranding.

---

### The One-Liner

> **Weedmaps built a trap. CannaSpy builds a moat.**

Weedmaps charged dispensaries to be seen by customers. CannaSpy charges dispensaries to be smarter than each other. Same psychological triggers — FOMO, scarcity, hold-it-or-lose-it — but CannaSpy delivers genuine ROI rather than fear of missing out.

---

### Market Context

- California has approximately **1,300 licensed dispensaries**
- The market is **intensely competitive** — operators watch each other's Instagram, mystery shop rivals, and react to every competing promo
- Existing tools (Hoodie Analytics, BDSA, Headset, Leafly Business) target enterprise brands and MSOs at **$300–$2,000+/month** — none effectively target the independent-to-mid-market operator with a focused competitive intelligence product
- The founder has **13+ years of direct cannabis industry experience**, providing deep market insight and credibility with target customers

---

### Goal

| Metric | Target |
|---|---|
| Target customers | 650 (50% of CA dispensaries) |
| Average revenue per customer | $200/month |
| MRR at goal | $130,000 |
| ARR at goal | $1,560,000 |

---

## 2. Target Customer Strategy

### Primary Target: MSOs with 10+ Locations

Rather than chasing hundreds of small single-location dispensaries, CannaSpy's go-to-market focuses on **Multi-Site Operators (MSOs) with 10 or more locations.** These customers have:

- Institutional investors and larger marketing budgets
- More to lose in a competitive market — revenue at stake is in the tens of millions
- Multiple locations that each need individual competitive monitoring
- Strong incentive to block rivals from gaining the same intelligence edge
- Expansion revenue built in — every new location they open increases their slot count automatically

---

### Why MSOs Beat the Volume Approach

A single 10-location MSO tracking 6 competitors and blocking 2 rivals **per location** generates 80 dispensary slots.

- At **$100/slot** → **$8,000/month** from one account
- At **$150/slot** → **$12,000/month** from one account

You only need **11–17 of these accounts** to hit the $130K MRR goal — not 650 small dispensaries with high churn and constant support demands.

---

### MSO Revenue Scale Table

| MSO Size | Track (6/loc) | Block (2/loc) | Total Slots | MRR @ $100 | MRR @ $150 |
|---|---|---|---|---|---|
| 5 locations (Entry) | 30 | 10 | 40 | $4,000 | $6,000 |
| 10 locations (Sweet spot) | 60 | 20 | 80 | $8,000 | $12,000 |
| 15 locations | 90 | 30 | 120 | $12,000 | $18,000 |
| 20 locations (Power tier) | 120 | 40 | 160 | $16,000 | $24,000 |
| **Accounts to $130K MRR** | | | | **17 accounts** | **11 accounts** |

---

### The ROI Pitch to an MSO

| Factor | Figure |
|---|---|
| Avg CA dispensary location revenue | ~$3.5M/year |
| 10-location MSO total revenue | ~$35M/year |
| Price intelligence advantage (est. 1–3% lift) | $350K–$1M/year |
| CannaSpy annual cost (10-loc base config) | ~$9,600–$14,400/year |
| **ROI multiple** | **25–100×** |

No CFO kills a 25× ROI tool.

---

### Customer Segmentation by Type

| Customer Type | Recommended Model | Typical MRR |
|---|---|---|
| Small independent (1 location) | Slot Tiers — 10-slot tier | ~$149/mo |
| Mid-size (2–5 locations) | À La Carte — 15–25 slots, consider blocking 2–3 key threats | $1,500–$3,750/mo |
| MSO (10–20+ locations) | À La Carte + aggressive blocking | $8,000–$24,000/mo |

---

## 3. Pricing Model

### Recommended Primary Model: À La Carte (Model 3)

**$100 per dispensary slot per month** — where a "slot" is either one tracked competitor or one blocked competitor.

Revenue scales with the customer naturally. Large MSOs pay large amounts. Small operators enter at a lower price point. No configuration complexity for CannaSpy's team.

---

### Volume Discounts

| Slot Count | Discount |
|---|---|
| 1–9 slots | No discount |
| 10–19 slots | 5% off |
| 20–49 slots | 10% off |
| 50+ slots | 15% off |

---

### Market-Heat Pricing Ladder

Inspired by Weedmaps' geographic premium strategy. Price blocking slots by market competitiveness — hotly contested corridors command premium rates automatically.

| Market Tier | Price per Slot | Example Markets |
|---|---|---|
| Standard (smaller cities, lower density) | $100/slot | Fresno, Bakersfield, Riverside |
| Competitive (10+ dispensaries in area) | $150/slot | Sacramento, Long Beach, Santa Ana |
| Hot (dense urban) | $200/slot | Oakland, San Diego, San Francisco |
| Elite (premium corridors) | $250–$300/slot | DTLA, West Hollywood, Beverly Hills |

> **Long game:** Start all markets at $100/slot. As CannaSpy establishes presence in a market, that market graduates to $150, $200, $300 — justified by real competitive density data, not arbitrary price hikes (unlike Weedmaps).

---

### Secondary Model: Slot Tiers (Model 2)

Use as an entry offer for smaller operators who need simplicity. Customer picks a fixed number of competitor slots. Natural upgrade path exists as they grow.

| Tier | Slots | Suggested Price |
|---|---|---|
| Starter | 5 slots | $99/mo |
| Standard | 10 slots | $149/mo |
| Growth | 20 slots | $249/mo |
| Pro | 50 slots | $399/mo |

---

### Model 1 (Radius-Based) — Not Recommended as Primary

Monitors all dispensaries within a 1-mile radius for a flat fee. Simple to explain but revenue is capped by geography, unfair in urban vs. rural markets, and has no upsell path beyond blocking. Consider as a trial/entry offer only.

---

## 4. The Blocking Feature — The Secret Weapon

### How Blocking Works

A paying CannaSpy customer can designate specific competitor dispensaries as "blocked." Once blocked:

1. CannaSpy removes the blocked dispensary from its **active prospect list entirely**
2. **No outbound sales contact** is ever made to the blocked dispensary
3. If the blocked dispensary contacts CannaSpy, they receive **no response** (ghosted) or are placed on a permanent waiting list that never resolves
4. The block remains in effect **as long as the customer pays the blocking fee**
5. The moment a block is cancelled or the customer churns, the previously blocked dispensary is **immediately added back to the active prospect list** and contacted within 24–48 hours

---

### Why Blocking is Brilliant

**For the customer:**
- Creates a competitive moat — rival can't access the same intelligence
- Converts a passive analytics tool into an active strategic weapon
- Prevents rivals from responding to market changes as fast
- Psychological peace of mind — you know they're in the dark

**For CannaSpy:**
- Doubles revenue per rivalry (track fee + block fee = 2× billing per competitor relationship)
- Creates near-zero churn — canceling means arming your rival
- Generates urgency at the point of sale — first to respond wins the territory
- Generates word-of-mouth — blocked dispensaries who can't reach CannaSpy will ask around

---

### Blocking Economics Example

Dispensary A (10 locations) tracks 6 rivals and blocks 2 rivals per location:

- Tracking: 60 slots × $100 = **$6,000/month**
- Blocking: 20 slots × $100 = **$2,000/month**
- **Total MRR from one account: $8,000/month**
- **Annual value of one account: $96,000**

---

### The Churn Lock

> **Key insight:** Cancellation is psychologically painful. The second a customer cancels their block, the rival they paid to suppress gets a phone call from CannaSpy. Customers know this. They don't cancel.

This is structurally stronger than Weedmaps' lock-in. Weedmaps customers who left just lost visibility. CannaSpy customers who leave **actively arm their enemy.** That's a completely different psychological calculus.

---

### The Ghost Effect

When a blocked dispensary tries to contact CannaSpy and gets no response, they know *something* is happening — they just don't know what. That mystery is more unsettling than a rejection. They can feel the competitive pressure but can't pinpoint the source or stop it.

---

## 5. Sales Strategy & The Flywheel

### The Competitive Flywheel (5 Steps)

**Step 1 — Dual outreach:** Identify two rival dispensaries in the same market. Reach out to both simultaneously. First to respond wins the territory.

**Step 2 — Lock in:** First responder (e.g., Dispensary D) signs up, starts tracking, and pays to block their rival (Dispensary A). Dispensary A's contact goes cold immediately — no calls, no emails, no follow-up. Ever.

**Step 3 — The rival feels the pressure:** Dispensary D starts responding to deals faster, adjusting prices smarter, launching promos that cut into Dispensary A's customer base. Dispensary A feels the pressure but has no idea what's causing it. They try to contact CannaSpy — and get nothing back.

**Step 4 — The release:** Dispensary D cancels or their block expires. The second the block drops, Dispensary A goes back on the active prospect list. Sales team is notified automatically. Outreach happens within 24–48 hours.

**Step 5 — The war restarts:** Dispensary A signs up, now battle-scarred and highly motivated. They pay to track — and to block Dispensary D right back. CannaSpy collects revenue from whichever side holds the account. The rivalry funds the MRR indefinitely.

---

### The Sales Pitch — One Sentence

> "A dispensary in your market has already reached out to us. We wanted to give you first right of response before we move forward with them."

You don't name who. You don't need to. Their paranoia does the rest. They either sign — or they hand their competitor the weapon.

---

### Three Core Sales Insights

**1. FOMO is your closer**
You never have to hard sell. Just tell them a competitor in their market already responded. Watch them move fast. The competitive situation closes the deal — not the pitch.

**2. Cancellation = vulnerability**
Every customer knows the second they cancel, their blocked rival gets the call. Churn becomes psychologically painful, not just financially inconvenient. This is structurally superior to any loyalty program.

**3. The waitlist IS marketing**
Blocked dispensaries who can't reach CannaSpy will ask around. Word spreads that CannaSpy exists and that someone in their market blocked them. Demand builds itself without a marketing budget.

---

### Go-To-Market Approach

This is a **direct outreach sales motion**, not a self-serve funnel. One skilled closer can build this business to $130K MRR.

- Identify the top 30–50 California MSOs with 10+ locations
- Reach out to rival pairs simultaneously — let competition drive urgency
- Lead with the ROI story: CannaSpy costs less than 3% of the revenue lift it delivers
- Close 11–17 enterprise accounts to hit goal — not hundreds of small operators
- **First mover pitch:** "The first dispensary in your market to sign defines who gets blocked"

---

## 6. The Weedmaps Comparison

### Background

Weedmaps (NASDAQ: MAPS) dominated the California cannabis market using scarcity, premium placement pricing, and hold-it-or-lose-it tenure mechanics. The founder observed this model firsthand over 13+ years in the industry. Key facts from research:

- 76% of Weedmaps' revenue came from featured listings, not base subscriptions
- Top placement in competitive markets reached $30,000+/month per dispensary
- They tested a self-serve bidding engine (auction model) in Colorado and Michigan
- They achieved 80–100% market penetration in California
- Despite dominance, dispensaries widely resented the platform — adversarial relationship

---

### Side-by-Side Comparison

| Dimension | Weedmaps | CannaSpy |
|---|---|---|
| What they sell | Visibility to consumers | Intelligence on competitors |
| Lock-in mechanism | Leave = lose consumer traffic | Leave = arm your rival |
| Customer relationship | Adversarial — resented | Collaborative — bragged about |
| Exclusivity | Both sides of a rivalry could pay | Only ONE side per rivalry |
| Revenue streams | Featured listings + base sub | Tracking + Blocking (2× per rivalry) |
| Price escalation | Arbitrary increases | Tied to market heat data |
| Data ownership | Weedmaps owned customer data | Intelligence belongs to the customer |
| Typical monthly spend | Up to $30K+/month | $8K–$24K/month per MSO |

---

### Weedmaps Mechanics to Borrow (and Improve)

| Mechanic | Weedmaps Version | CannaSpy Improvement |
|---|---|---|
| Scarcity by geography | 1st/2nd/3rd map icons per area | Only ONE dispensary per rival slot — personal, not just positional |
| Hold-it-or-lose-it | Cancel = icon goes back to auction | Cancel = rival gets a phone call that week. 10× more powerful. |
| Price escalation | Raised prices arbitrarily | Price tied to documented market competitiveness — justified, not extractive |
| Auction on cancellation | Slot quietly reopens | Proactively notify the rival: "A block on your account just opened." Urgency closes deals in hours. |
| Captive market | Captive through consumer network effects | Captive through competitive psychology — they can't afford NOT to be on it |

---

### Weedmaps Mistakes to Avoid

- **Arbitrary price increases** — dispensaries felt extorted. Tie every CannaSpy price increase to market heat data or new features.
- **Double-dipping** — Weedmaps took transaction cuts AND charged for listings. CannaSpy: one clean revenue model, no surprise fees.
- **Data exploitation** — Weedmaps owned customer data and used it against dispensaries' interests. CannaSpy: intelligence belongs to the customer.
- **Serving unlicensed operators** — Weedmaps got regulatory heat for this. CannaSpy: licensed dispensaries only.
- **Becoming hated** — dispensaries rooted for Weedmaps competitors. CannaSpy should be the tool customers brag about, not complain about.

---

## 7. Technical Foundation

> **v2.0 update:** This section has been fully rewritten to reflect the primary data collection method discovered and validated in March 2026, confirmed operator coverage across all major California MSOs, the finalized infrastructure stack, and the STIIIZY pricing analysis. The original scraper pipeline has been repositioned as the fallback system.

---

### Primary Data Collection — The Weedmaps Discovery API

The single most important technical discovery for CannaSpy is that every dispensary listing on the major cannabis retail platform exposes a **fully structured, unauthenticated public API** — the same API that powers their embedded store widgets, third-party integrations, and consumer products. No login, no token, no scraping required.

**Endpoint:**
```
GET https://api-g.[platform].com/discovery/v1/listings/dispensaries/{slug}/menu_items
    ?page={n}&page_size=100
```

This endpoint returns clean JSON with every field CannaSpy needs: name, price, on-sale flag, original price, discount label, brand, category, strain genetics, THC/CBD lab values, deal titles, and real-time `updated_at` timestamps. The platform domain is stored as an environment variable — it is never hardcoded in the codebase.

**Why this changes everything:**

| Dimension | Original Plan (Website Scraping) | Actual Primary Pipeline |
|---|---|---|
| Data format | Different per site — GraphQL, HTML, iFrames | Identical JSON for every dispensary |
| Auth required | robots.txt, JS rendering, session cookies | None |
| Normalization | Heavy AI work required | Platform already standardized |
| Maintenance | Every redesign breaks a parser | Single endpoint, platform-maintained |
| Coverage | Only dispensaries with own website | Every dispensary on platform (~1,300 CA) |
| STIIIZY 58 locations | Inaccessible — Weedmaps-only | All 58 locations, full menu, real-time |

---

### Confirmed Operator Coverage

Tested and confirmed live against actual dispensary data, March 2026:

| Operator | Locations | Menu Items | Notes |
|---|---|---|---|
| STIIIZY | All 58 CA locations | ~1,700/location | Full per-location menu, real-time |
| Off The Charts | Confirmed | 2,932 | |
| Catalyst Cannabis Co. | Confirmed | 481 | |
| MedMen | Confirmed (DTLA) | 953 | |
| Harborside | Confirmed (San Jose) | 953 | |
| Jungle Boys | Confirmed (DTLA) | 195 | |
| TPG420 / Patient Care First | Confirmed | 2,998 | |
| Caliva (delivery) | Confirmed | 1,452 | Delivery service confirmed |
| Zen Dispensary | Confirmed | 924 | |

Every dispensary on the platform is accessible with the correct slug. Slug discovery is handled via Google Maps/Places API — a solved engineering problem.

---

### STIIIZY Pricing Analysis — Market Differentiation Confirmed

A cross-market pricing comparison of STIIIZY own-brand products was conducted across five locations. Key finding: **STIIIZY charges $1 more per unit in San Francisco vs. Los Angeles and Inland Empire markets.** This is consistent with a deliberate high-COL market pricing strategy.

| Product | DTLA | Corona | SoMa SF | Koreatown |
|---|---|---|---|---|
| Tropic Jack 3.5g | $14 | — | **$15** | $14 |
| GELATO 41 × Animal Mintz 7g | $40 | $40 | **$41** | $40 |
| Purple Lemon Craze 7g | $40 | $40 | **$41** | $40 |
| Blue Dream 3.5g | — | — | **$15** | $14 |

This confirms that per-location tracking is genuinely valuable — not just for STIIIZY but for any MSO operating across multiple California markets with differentiated pricing strategies.

---

### What Data Is Available Per Dispensary

The pipeline delivers daily, per competitor dispensary:

**Pricing:** Full menu prices, on-sale flags, original prices, discount labels, price changes vs. prior day

**Products:** Complete catalog with brand/category/subcategory, strain name and genetics, new arrivals, discontinued products, lab-verified THC/CBD values

**Promotions:** Per-item deal titles, full weekly promotional schedule (happy hours, daily brand deals, first-time offers), parsed from the listing description field

**Operations:** Business hours, open/closed status, online ordering availability, real-time inventory timestamps

---

### Fallback Pipeline — Website Scraping

The original scraper pipeline has been repositioned as the **fallback system** — not the primary, but a continuously maintained parallel system ready to become primary overnight if needed.

The fallback covers:
- Dispensaries not on the primary platform (Dutchie-powered sites, iHeartJane, custom HTML menus)
- Any scenario where the primary API becomes unavailable (see scenarios below)

**The fallback must be run on a 50-dispensary test cohort weekly** regardless of whether the primary pipeline is active. A scraper that hasn't run in six months will fail when you need it.

**Three scenarios that trigger fallback activation:**

| Scenario | Trigger | Response |
|---|---|---|
| Authentication added | HTTP 401/403 across 10+ dispensaries | Activate within 24 hours |
| ToS update prohibiting commercial use | Legal review triggered | Planned migration over 2–4 weeks |
| Platform launches competing product | Competitive positioning assessment | Accelerate non-platform data roadmap |

Full fallback architecture and activation runbook: see `CannaSpy_Data_Architecture.md`.

---

### Detection Risk and Mitigation

CannaSpy's traffic at launch represents approximately **1.4% of the platform's baseline consumer traffic** — well below any automated anomaly detection threshold. The primary detection risk is not technical but human: a customer casually mentioning CannaSpy to their platform account rep.

Three engineering mitigations are required from day one:

1. **IP Rotation** — 10–20 IPs across AWS and GCP regions. ~$50/month. Eliminates IP concentration as a detection signal.
2. **Request Timing Jitter** — Random 0.5–2.5 second delays, occasional 8–25 second pauses. Eliminates machine-interval fingerprinting.
3. **Off-Peak Scheduling** — Daily scrape window: 2:00–5:00 AM Pacific only. Consumer traffic near-zero in this window.

Full detection analysis, traffic footprint math, and implementation code: see `CannaSpy_Data_Architecture.md`.

---

### Code Artifacts Built (Needs Rebranding)

Both artifacts were built under the prior working name "CannaIntel" and require rebranding to CannaSpy before use:

**`dispensary_scraper.py`** — Python scraper pipeline (Google Places discovery, robots.txt checking, Playwright/BeautifulSoup, Dutchie GraphQL parser, AI normalization). Now repositioned as the fallback pipeline. Needs: rebrand, primary API integration as new default path.

**`dashboard.jsx`** — React dashboard (four tabs: Overview, Price Matrix, Unique Products, Competitors; dark theme). Needs: rebrand, blocking management UI, competitor configuration UI, real data integration.

---

### Finalized Infrastructure Stack

| Layer | Technology | Decision Rationale |
|---|---|---|
| Database | Supabase (PostgreSQL) | MCP-connected, fastest path, built-in auth |
| Auth | Supabase Auth (email + password) | Included in Supabase, zero additional setup |
| Backend API | Node.js + Express | Supabase Edge Functions for simple routes |
| Frontend | React + Vite | Extends existing dashboard.jsx |
| Frontend deployment | Vercel | MCP-connected, one-click deploys |
| Data pipeline | Python 3.11+ | Cron job, 2–5 AM Pacific |
| Caching | Upstash Redis (via Supabase) | Session cache + pipeline dedup |
| Billing | Stripe | MCP-connected |
| Transactional email | Resend | Price change alerts to customers |
| Monitoring | Supabase logs + pipeline_health table | No external APM for MVP |

**Infrastructure is decided. Do not revisit for MVP.**

---

### Project Lead Engineering

CannaSpy is being built using **Claude Code** as the project lead engineer, operating with full MCP access to Supabase, Vercel, Stripe, and GitHub. The `CLAUDE.md` file in the project root contains all persistent instructions: database schema, blocking mechanic logic, customer-facing language rules, code quality standards, build phase status, and approval gates.

Claude Code reads `CLAUDE.md` + both project documents at the start of every session and proceeds autonomously within the defined constraints. Human approval is required only for: schema migrations that drop columns, going live with Stripe production mode, outbound customer communications, changes to the blocking mechanic logic, and any code that references a specific data platform by name.

Estimated time to functional MVP: **~2 weeks** with Claude Code as lead (vs. 6 weeks with a traditional development workflow).

---

## 8. Brand Positioning & Messaging

### The Three-Pillar Manifesto

This is the opening framework for every investor pitch and sales deck.

---

**THE OLD WAY**
> **Weedmaps built a trap.**
> Dispensaries paid because leaving cost them consumer traffic. The value was real — but the relationship was adversarial. They stayed out of fear, not loyalty.

---

**THE CANNASPY WAY**
> **CannaSpy builds a moat.**
> Dispensaries pay because leaving costs them competitive advantage — and hands it directly to a rival. The relationship is collaborative. They stay because they win.

---

**THE RESULT**
> **Same psychology. Better ethics.**
> FOMO, scarcity, hold-it-or-lose-it — all the same triggers. But CannaSpy delivers genuine ROI, not just fear of missing out. Customers don't resent us. They brag about us.

---

### Key Taglines

- *"We don't sell data. We sell competitive advantage — and the peace of mind that comes with it."*
- *"Weedmaps charges dispensaries to be seen by customers. CannaSpy charges dispensaries to be smarter than each other."*
- *"First to respond wins the territory."*
- *"Weedmaps built a trap. CannaSpy builds a moat."*

---

### Competitive Positioning

CannaSpy is **not** competing with Weedmaps (consumer discovery) or Leafly (product/strain research). It occupies a completely different lane:

- **Weedmaps/Leafly** → B2C consumer discovery platforms
- **CannaSpy** → B2B competitive intelligence for operators

No direct competitor currently offers dispensary-vs-dispensary blocking + intelligence at the MSO level for this price point. The closest enterprise tools (Headset, BDSA) cost $300–$2,000+/month and target brands, not operators.

---

## 9. Next Steps

> **v2.0 update:** Open questions from v1.0 have been answered. This section now reflects the four-phase build plan with Claude Code as project lead.

---

### Answered Questions (from v1.0)

| Question | Answer |
|---|---|
| Build product first or sell first? | **Build complete MVP first, then sell** |
| Infrastructure — AWS or equivalent? | **Supabase + Vercel — decided, do not revisit** |
| California-only or expand? | **California-only for MVP. Build market density before expanding.** |
| Legal entity structure? | **Pending founder decision — recommend C-Corp for future investor conversations** |
| Hire closer or founder sells? | **Founder sells first accounts. Hire closer once product is live and first 2–3 accounts validated.** |

---

### Four-Phase Build Plan

**Phase 1 — Data Pipeline** (Days 1–10)
- [ ] Rebrand all code artifacts from CannaIntel → CannaSpy
- [ ] Swap primary data source to Weedmaps discovery API
- [ ] Implement IP rotation pool (10+ IPs, 2+ cloud providers)
- [ ] Implement request timing jitter + off-peak scheduler
- [ ] Run Supabase schema migrations (full schema in CLAUDE.md)
- [ ] Build diff engine — price changes, new/removed products
- [ ] Build promotional HTML parser
- [ ] Integrate Google Places API for slug discovery

**Phase 2 — Backend API + Auth + Blocking** (Days 11–22)
- [ ] Node.js API scaffolding
- [ ] Supabase Auth — email + password login
- [ ] Competitor set management (add/remove tracked dispensaries)
- [ ] Blocking mechanic backend — full logic per CLAUDE.md specification
- [ ] Prospect list automation — block/release triggers within 1 hour
- [ ] Sales team reactivation alert — fires when block is released
- [ ] Stripe webhook handler — slot quantity management
- [ ] Email alert delivery (Resend) — price change notifications to customers

**Phase 3 — Frontend Extensions** (Days 23–29)
- [ ] CompetitorConfig.jsx — add/remove tracked dispensaries per location
- [ ] BlockingManager.jsx — block/unblock rivals, status display, expiry dates
- [ ] AlertSettings.jsx — configure which changes trigger alerts
- [ ] BillingView.jsx — slot count, plan status, payment management
- [ ] Login + Onboarding pages
- [ ] Connect all components to live API (replace mock data)

**Phase 4 — Billing + Deployment** (Days 30–36)
- [ ] Stripe product/price configuration ($100/slot/month, volume discounts)
- [ ] Subscription management — quantity sync with slot_count
- [ ] Dunning logic — 3-day grace period on payment failure
- [ ] Vercel deployment (frontend)
- [ ] Supabase production environment
- [ ] Pipeline cron deployment — 2:30 AM Pacific daily
- [ ] Health monitoring — pipeline_health table + alert triggers
- [ ] Fallback pipeline weekly test runner
- [ ] Pre-launch security review — no platform names in codebase or customer-facing copy

---

### After MVP — Near-Term Roadmap

- [ ] Market-heat pricing engine — auto-classify markets by dispensary density, enable tiered pricing
- [ ] Automated prospect notification system — "A block on your account just opened" outbound trigger
- [ ] MSO prospect list — identify and qualify top 30–50 California MSOs with 10+ locations
- [ ] Sales one-pager using the three-pillar manifesto
- [ ] ROI calculator — interactive version for sales motion
- [ ] Multi-user accounts — multiple logins per MSO customer
- [ ] Historical trend charts — 90-day price history visualization
- [ ] Mobile-responsive dashboard

---

### Project Files Reference

| File | Purpose | Status |
|---|---|---|
| `CLAUDE.md` | Claude Code project lead instructions — schema, rules, build phases | ✅ Current |
| `docs/CannaSpy_Handoff.md` | Business strategy, pricing, blocking, sales, brand | ✅ This document (v2.0) |
| `docs/CannaSpy_Data_Architecture.md` | Data pipeline architecture, mitigations, customer language | ✅ Current |

---

## Summary — The Business in Five Sentences

CannaSpy is a competitive intelligence SaaS for California cannabis dispensaries that lets operators monitor rival pricing and block competitors from ever accessing the platform. The primary customer is MSOs with 10+ locations — a single account generates $8,000–$24,000/month in recurring revenue. The blocking feature creates near-zero churn because canceling means immediately arming the rival you were suppressing. The sales model is self-funding — competition between dispensaries drives urgency, closes deals, and prevents cancellations simultaneously. You need 11–17 enterprise MSO accounts to hit $130,000 MRR.

---

*Document prepared by Claude (Anthropic) based on strategy sessions and technical research with the CannaSpy founder.*
*All strategic insights, business model decisions, and market positioning reflect the founder's original vision and 13+ years of cannabis industry expertise.*
*Technical findings in Section 7 reflect live API testing conducted March 2026.*

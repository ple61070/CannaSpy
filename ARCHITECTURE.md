# CannaSpy — Product Architecture
## 36 Screens Across 8 Sections
**Version 2.0 | March 2026**

Each screen entry includes: purpose, key data displayed, key interactions,
strategic function (why it exists beyond utility), and build priority.

---

## Section 1 — Onboarding & Setup
*3 screens. Linear sequential flow. One-time setup.*

---

### Screen 01 — Sign-up / Org Setup

**Purpose:** Create the organization, establish the MSO structure, configure
billing.

**Key data:**
- Company name, DBA name
- Number of locations
- Primary contact (name, email, phone)
- Billing contact and payment method (Stripe)
- Slot pricing tier acknowledgment

**Key interactions:**
- Multi-step form with progress indicator
- Stripe payment setup (card on file)
- Initial slot count selection
- Volume discount tier shown live as slots are selected

**Strategic function:** First impression. Must feel like onboarding into a
serious intelligence platform, not a generic SaaS signup. Copy should reinforce
the competitive framing — they're not just buying software, they're claiming
territory.

**Build priority:** MVP

---

### Screen 02 — Location Wizard

**Purpose:** Add each dispensary location to the account. Each location becomes
an independent monitoring node and billing unit.

**Key data:**
- Location name, street address
- DCC license number (California dispensary license)
- Operating hours
- Location-specific contact

**Key interactions:**
- Address autocomplete (Google Places)
- License number validation (format check at minimum)
- Ability to add multiple locations in one session
- Each location added shows running slot cost calculation

**Strategic function:** Each location added directly increases MRR potential.
The UX should make adding locations feel fast and rewarding, not tedious.
"Add another location" CTA should be prominent after each successful addition.

**Build priority:** MVP

---

### Screen 03 — Competitor Discovery

**Purpose:** For each location, identify nearby licensed competitor dispensaries
via Google Maps radius scan. User confirms which rivals to track and which to block.

**Key data:**
- Map view centered on each location
- Nearby dispensaries returned by Google Places API
- Distance from location
- Dispensary name, address
- Platform detection (Dutchie vs. other — shown as confidence indicator)

**Key interactions:**
- Adjustable radius slider (default: 5 miles)
- Checkbox to select each competitor for tracking
- Separate toggle/button to designate rivals as "blocked"
- Running slot count and cost shown as selections are made
- Confirm & launch monitoring CTA

**Strategic function:** This is the first moment the blocking mechanic becomes
real and visceral. The user sees their actual rivals on a map and makes
deliberate choices about who to watch and who to suppress. The UI should create
a sense of strategic decision-making, not a checklist. Blocking UI must be
visually distinct — not just another checkbox.

**Build priority:** MVP

---

## Section 2 — Core Intelligence: Monitoring
*9 screens. Primary daily-use surface. The reason operators log in.*

---

### Screen 04 — Command Center

**Purpose:** Top-level MSO overview. The screen operators open first every
morning. Cross-location intelligence summary with highest-urgency items surfaced.

**Key data:**
- Active alerts across all locations (count + severity)
- Most significant competitor moves in last 24 hours
- Which locations have unreviewed intelligence
- Blocked rivals count and status summary
- Cross-location price leadership summary (where you're winning vs. exposed)

**Key interactions:**
- Click alert → drill to Alert Feed (Screen 12)
- Click location → drill to Location Dashboard (Screen 05)
- Click blocked rival → drill to Block Management (Screen 16)
- Dismiss / mark-as-reviewed on alert cards

**Strategic function:** War room feel. Not a generic SaaS dashboard. Should
communicate "you have intelligence your rivals don't" from the first glance.
Empty states should never say "nothing to show" — they should say "all clear
across 10 markets as of [timestamp]." The distinction matters psychologically.

**Build priority:** MVP

---

### Screen 05 — Location Dashboard

**Purpose:** Per-location competitive intelligence summary. What's happening at
this specific location's market right now.

**Key data:**
- Location name, address, license
- Tracked competitors list with last-seen price summary
- New competitor activity since last visit (highlighted)
- Active promotions from rivals
- Price position indicator (cheapest / mid / premium vs. tracked rivals)

**Key interactions:**
- Click competitor → Competitor Profile (Screen 06)
- Click price → Price Intelligence (Screen 07)
- Click promo → Promotions Tracker (Screen 08)
- Switch between locations via sidebar or dropdown

**Strategic function:** The data shown is what the competitor doesn't want the
operator to know. This framing should be implicit in the UI — not stated
explicitly, but felt. Competitor data is presented as intelligence gathered, not
data pulled.

**Build priority:** MVP

---

### Screen 06 — Competitor Profile

**Purpose:** Full page dedicated to one rival dispensary. Everything CannaSpy
knows about them.

**Key data:**
- Competitor name, address, license, website
- Current full menu with prices
- Price history by category (30/60/90 day)
- Active promotions
- SKU additions and removals (catalog change history)
- Platform detection (Dutchie, custom, unknown)
- Last scraped timestamp + confidence indicator

**Key interactions:**
- Tab navigation: Overview / Prices / Promotions / History
- Block this competitor CTA (if not already blocked)
- Add note / annotation (Screen 25)
- View source evidence (Screen 13 — Intel Evidence View slideout)

**Strategic function:** This is where the intelligence becomes actionable.
Operators will share screenshots from this screen. The "Block this competitor"
CTA placed here is intentional — seeing all their data creates the impulse to
suppress them.

**Build priority:** MVP (simplified version), v2 (full history + evidence view)

---

### Screen 07 — Price Intelligence

**Purpose:** Live price matrix. Side-by-side price comparison across all tracked
competitors for shared product categories.

**Key data:**
- Product categories: Flower, Pre-rolls, Edibles, Concentrates, Vapes, Topicals
- Your prices vs. each tracked competitor
- Delta indicators: green (you're cheaper), red (you're more expensive), gray
  (no match found)
- Last updated timestamp per competitor
- Out-of-stock indicators

**Key interactions:**
- Filter by category
- Filter by competitor
- Click any cell → Intel Evidence View (Screen 13) slideout
- Sort by price differential
- Export to CSV

**Strategic function:** The most operationally actionable screen in the product.
This is where pricing decisions get made. The delta indicators create urgency —
operators see red and want to act immediately. This screen alone justifies the
subscription for most operators.

**Build priority:** MVP

---

### Screen 08 — Promotions Tracker

**Purpose:** All active deals and discounts across tracked competitors in one
unified feed.

**Key data:**
- Competitor name
- Promo type (BOGO, % off, bundle, daily special, first-time customer)
- Category affected
- Estimated start date
- Estimated end date (if detectable)
- Raw promo text as scraped

**Key interactions:**
- Filter by competitor
- Filter by category
- Filter by promo type
- Mark as responded / archived
- Add note (Screen 25)

**Strategic function:** Operators currently find out about competitor promotions
days late — from customers mentioning them, or from mystery shopping. This
screen eliminates that lag. Every promo a rival runs should appear here within
hours of launch.

**Build priority:** MVP (basic), v2 (structured parsing + pattern detection)

---

### Screen 09 — Product Catalog Diff

**Purpose:** Shows which products only you carry (competitive advantage) vs.
which products competitors carry that you don't (gap analysis). Flags SKU
additions and removals.

**Key data:**
- Products unique to your menu (by location)
- Products competitors carry that you don't
- New SKUs added by rivals in last 7/14/30 days
- SKUs removed by rivals
- Brand overlap analysis

**Key interactions:**
- Filter by category
- Filter by competitor
- Flag product for review / buying team
- Export gap analysis

**Strategic function:** Buying and merchandising decisions. An MSO's buying
team needs to know when a rival starts carrying a top-selling brand they don't
stock. This screen is the trigger for procurement action.

**Build priority:** v2

---

### Screen 10 — Price History & Trends

**Purpose:** Time-series graphs of competitor pricing by category over time.
Pattern detection and trend visualization.

**Key data:**
- Price history by category: 7 / 30 / 60 / 90 day views
- Per-competitor price trend lines
- Average market price vs. your price
- Notable events (price drops, promo launches, restock spikes)

**Key interactions:**
- Date range selector
- Category filter
- Competitor toggle (show/hide individual lines)
- Hover for point-in-time details

**Strategic function:** Operators who study this screen stop reacting to
competitor moves and start anticipating them. Weekly deal cycles, end-of-month
price drops, post-harvest pricing behavior — patterns emerge over time that
create genuine strategic advantage. This is the screen that turns a dashboard
user into a power user.

**Build priority:** v2

---

### Screen 11 — Market Positioning Map

**Purpose:** Visual scatter-plot mapping competitors by price tier vs. category
breadth. Whitespace identification.

**Key data:**
- X-axis: price tier (value / mid / premium)
- Y-axis: category breadth (narrow / broad selection)
- Each competitor as a dot, sized by estimated scale
- Your position highlighted

**Key interactions:**
- Hover competitor → summary card
- Click competitor → Competitor Profile (Screen 06)
- Toggle categories

**Strategic function:** Helps operators see the competitive landscape
structurally rather than reactively. "We're premium and broad — no one else
is. That's the position to defend." This visualization makes that insight
obvious in seconds.

**Build priority:** v2

---

### Screen 12 — Alert Feed

**Purpose:** Real-time chronological feed of all detected competitor changes.
The reason operators check CannaSpy daily.

**Key data:**
- Event type (price drop, price increase, new promo, promo ended, new SKU,
  SKU removed, new competitor detected)
- Competitor name + location
- What changed (old value → new value)
- Timestamp
- Confidence level

**Key interactions:**
- Filter by event type
- Filter by competitor
- Filter by location
- Mark as reviewed
- Add note (Screen 25)
- Click event → source evidence (Screen 13)

**Strategic function:** This is CannaSpy's daily hook. Like checking email —
operators want to know what happened overnight. The feed should feel like
intelligence dispatches, not system logs. Copy matters here: "MedMen West
Hollywood dropped Blue Dream 1g from $38 to $32 (−16%)" not "Price change
detected: product_id=4821."

**Build priority:** MVP

---

## Section 3 — Data Trust & Provenance
*3 screens. NEW section added after external review. Critical for enterprise
credibility. Without this section, the intelligence screens are hard to trust.*

---

### Screen 13 — Intel Evidence View

**Purpose:** Slideout panel accessible from any data point anywhere in the
product. Shows the source evidence for any piece of intelligence.

**Key data:**
- Source URL or menu snapshot (screenshot)
- Exact timestamp data was last observed
- Detection method (Dutchie GraphQL API / HTML scrape / manual)
- Confidence level (high / medium / low + reason)
- Prior value vs. current value
- Next scheduled scrape time

**Key interactions:**
- Triggered as a slideout from any price, promo, or product data point
- "View source" opens the original URL in a new tab
- Flag as suspicious / inaccurate (feeds back to normalization queue)

**Strategic function:** Enterprise buyers and their teams will ask "how do you
know this?" If there's no answer in the UI, the platform loses credibility fast.
This screen transforms CannaSpy from "a dashboard that shows things" to "a
platform with verifiable intelligence." Operators will screenshot this panel
in strategy meetings. GMs will share it with their buyers. It extends the
product's reach inside customer organizations.

**Build priority:** v2 (simplified: timestamp + source URL), v3 (full evidence
with screenshots)

---

### Screen 14 — SKU Normalization Console

**Purpose:** Cannabis menus are chaotic. The same product appears under four
different names across four competitor sites. This screen manages product
equivalencies and ensures cross-dispensary price comparisons are valid.

**Key data:**
- Proposed product equivalencies (AI-generated, pending confirmation)
- Confidence score per match
- Raw product names from each source
- Category and package size breakdown
- Conflict queue (ambiguous matches requiring human review)

**Key interactions:**
- Confirm match
- Reject match
- Manually link two products
- Split incorrectly merged products
- Set category mapping

**Strategic function:** The accuracy of every intelligence screen depends on
this layer working correctly. Shipped to operators in v2 as a transparency
feature — they can see how their intelligence is structured. Initially may be
internal-only (CannaSpy data team uses it), then operator-facing for enterprise
accounts.

**Build priority:** Internal v1 (data team only), operator-facing v2

---

### Screen 15 — Alert Signal Tuning

**Purpose:** Operators define what constitutes a meaningful signal. More
powerful than notification settings — this is threshold and filter configuration
for the intelligence engine itself.

**Key data:**
- Price change threshold (only alert if change > X%)
- Category filters (alert on flower only, or all categories)
- Competitor scope (all tracked rivals, or specific high-priority rivals only)
- Event type filters (launches only, expirations only, both)
- Location scope (all locations or specific)
- Quiet hours

**Key interactions:**
- Per-location configuration
- Per-competitor configuration
- Test alert (generate a sample alert with current settings)
- Reset to defaults

**Strategic function:** Operators who configure this screen become deeply
embedded in the product's operating rhythm. The act of customizing signal
thresholds is itself a retention behavior — it requires investment and
creates ownership. Operators who tune their alerts don't churn. They also
surface higher-quality intelligence, which improves their outcomes, which
reinforces their subscription.

**Build priority:** v2

---

## Section 4 — Blocking: The Moat
*3 screens. Highest retention value in the product. Every design decision
reinforces the psychological and commercial cost of canceling.*

---

### Screen 16 — Block Management

**Purpose:** The control panel for all active blocks. The screen that makes
the blocking mechanic tangible.

**Key data:**
- Each blocked competitor: name, location(s) affected, date blocked
- Block cost per competitor (slot price × locations)
- Block status: active / pending / expiring soon
- Total monthly blocking spend
- "This competitor cannot access CannaSpy while this block is active" — shown
  prominently per blocked rival

**Key interactions:**
- Add new block (→ Screen 17)
- Cancel block (→ Screen 18 warning flow)
- View blocked competitor's public profile (limited data only)
- Adjust which locations a block applies to

**Strategic function:** This screen should feel like a command center, not a
settings menu. The language and visual design should communicate strategic
control. Operators should feel powerful managing this screen. The running cost
display is intentional — it makes the value exchange explicit (you're paying
to keep this rival in the dark) rather than hiding it in a billing summary.

**Build priority:** MVP

---

### Screen 17 — Block Status & Confirm

**Purpose:** Confirmation screen when adding a new block. Reinforces the
significance and specificity of the action.

**Key data:**
- Competitor name and address being blocked
- Which locations this block covers
- Monthly cost of this block
- Effective date (immediate)
- Explicit statement: "This competitor will be removed from CannaSpy's prospect
  list immediately and will not be contacted while your block is active."

**Key interactions:**
- Confirm block (charges card, activates immediately)
- Modify scope (adjust which locations)
- Cancel (return to Block Management)

**Strategic function:** The confirmation moment should feel decisive — like
placing a strategic chess move, not clicking through a modal. The explicit
language about removing the rival from the prospect list is a product feature
disclosure, not a warning. It should be stated clearly and matter-of-factly.

**Build priority:** MVP

---

### Screen 18 — Cancel Block Warning

**Purpose:** Appears before any block cancellation or subscription cancellation.
The single most important churn-prevention screen in the product.

**Key data:**
- Which specific competitor will be re-activated
- Explicit statement: "Canceling this block will immediately re-add [Competitor
  Name] to our active prospect list. Our sales team will reach out to them
  within 24–48 hours."
- When that re-activation will happen (immediately on cancel)
- Cost of keeping the block active (monthly)
- Alternative options: pause instead of cancel, downgrade scope

**Key interactions:**
- Keep block active (dismisses modal — the default action)
- Pause block (temporary hold, different from cancel)
- Cancel block anyway (requires secondary confirmation)

**Strategic function:** This is a factually accurate disclosure of how the
product works, presented at the moment of maximum retention value. It is not
a dark pattern — the consequence is real and the operator agreed to it when
they activated the block. The UI must be direct and neutral in tone. It should
not feel threatening or punitive. It should feel like a straightforward
statement of consequences, leaving the decision entirely with the operator.

**CRITICAL COPY NOTE:** This language stays in the product UI. It does NOT
appear in marketing materials, cold outreach, or sales copy. In those contexts
it reads as a threat. In the product it reads as a feature.

**Build priority:** MVP

---

## Section 5 — ROI, Reporting & Insights
*6 screens. Justification engine + engagement habit loop.*

---

### Screen 19 — ROI Calculator

**Purpose:** Interactive tool estimating revenue lift from price optimization.
Used both inside the product to justify renewal and as a sales tool externally.

**Key data / inputs:**
- Number of locations
- Average transaction size
- Weekly customer visits per location
- Current price positioning (value / mid / premium)

**Output:**
- Estimated annual revenue lift from 1% price optimization
- Estimated annual revenue lift from 3% optimization
- CannaSpy annual cost
- ROI multiple

**Key interactions:**
- Live calculation as inputs change
- Share link (generates public URL → Screen 34, Live ROI Demo)
- "Book a demo" CTA on shared version

**Strategic function:** The number should always make the subscription cost
look trivial. At a 25–100× ROI multiple, no CFO kills this tool. Build it so
the math is transparently reasonable — operators trust it more when they can
see the assumptions.

**Build priority:** v2 (internal), v1.5 (public-facing demo version for sales)

---

### Screen 20 — Weekly Intel Report

**Purpose:** Structured digest of the week's most significant competitor
movements. Delivered on a schedule. Designed to be forwarded internally.

**Key data:**
- Top 5 competitor moves of the week
- Price changes by category summary
- New promotions launched
- Products added / removed by rivals
- Market heat summary

**Key interactions:**
- Configure delivery schedule
- Configure which locations and competitors to include
- Preview current report
- Share / forward link

**Strategic function:** The email operators forward to their GM or VP of
Operations. Every internal share extends CannaSpy's brand awareness inside
the customer organization — building the case for renewal from multiple
stakeholders simultaneously.

**Build priority:** v2

---

### Screen 21 — Competitive Score

**Purpose:** Proprietary index showing how the operator's pricing and promotion
strategy compares to tracked competitors.

**Key data:**
- Composite score (0–100)
- Score components: price competitiveness, promo activity, catalog breadth,
  response speed to competitor moves
- Score trend (last 30 days)
- Top factors dragging the score down
- Peer comparison (anonymized — "operators in similar markets")

**Key interactions:**
- Drill into any score component
- View recommended actions to improve score
- Historical score chart

**Strategic function:** Gamification that creates habitual daily engagement.
Operators check their score the way they check Yelp reviews. The score going
down after a competitor makes a move creates urgency to act. The score going
up after they respond creates positive reinforcement. Both outcomes drive
engagement.

**Build priority:** v2

---

### Screen 22 — Price Opportunity Finder

**Purpose:** AI-generated specific pricing recommendations grounded in
competitor data.

**Key data:**
- Specific product recommendations: "You're 18% above market average on
  1g pre-rolls. Three tracked competitors dropped prices this week."
- Category-level opportunities
- Defensive recommendations: "Your top-margin category is being undercut —
  consider a loyalty mechanic instead of matching price"
- Confidence level per recommendation

**Key interactions:**
- Accept recommendation (mark as actioned)
- Dismiss recommendation
- Snooze for X days
- View supporting evidence (→ Screen 13)

**Strategic function:** Turns raw data into decisions. Reduces the cognitive
load required to extract value from the platform. This screen only ships when
the underlying data quality is strong enough to back specific recommendations.
Shipping premature AI recommendations actively damages trust. Do not rush this.

**Build priority:** v3

---

### Screen 23 — Market Share Estimator

**Purpose:** Proxy model estimating relative market position. Directional only —
not presented as exact.

**Key data:**
- Estimated relative market position (gaining / holding / losing)
- Proxy inputs: price competitiveness, product breadth, promo frequency,
  review volume (public data)
- Trend over 30/60/90 days
- By-location breakdown

**Key interactions:**
- Drill by location
- Adjust time range

**Strategic function:** Gives operators a directional read on whether they're
gaining or losing ground. Must be labeled clearly as an estimate — not
presented as actual market share data. If operators feel misled by this screen
the trust damage spreads to the entire platform. Transparent methodology note
required on-screen.

**Build priority:** v3

---

### Screen 24 — Export & Reports

**Purpose:** Data portability. CSV exports, PDF reports, scheduled delivery.

**Key data / outputs:**
- Price matrix CSV (any date range, any competitor set)
- Promotions history CSV
- Alert history CSV
- Formatted PDF report (executive summary layout)
- Scheduled email delivery configuration

**Key interactions:**
- Select report type
- Configure date range and scope
- Download now
- Schedule recurring delivery

**Strategic function:** MSO leadership teams share this data in board meetings
and with investors. Every export is CannaSpy data presented in a room full of
decision-makers. This extends brand credibility beyond the day-to-day operator
user.

**Build priority:** v2

---

## Section 6 — Collaboration & Workflow
*3 screens. NEW section. Embeds CannaSpy into the org's operating rhythm.
Without this section, the product lives in one person's browser and dies when
they leave.*

---

### Screen 25 — Intel Notes & Annotations

**Purpose:** Any competitor, product, alert, or price point in the system can
be annotated and assigned.

**Key data:**
- Note text
- Attached entity (competitor, product, alert, location)
- Author + timestamp
- Assignee (if follow-up task)
- Status (open / resolved)

**Key interactions:**
- Add note from any screen in the product
- Assign to team member
- Mark resolved
- Filter notes by assignee, status, entity type
- Notes feed (all recent annotations across the org)

**Strategic function:** Turns competitive intelligence into organizational
memory. "They copied our BOGO again — third time this quarter." "Our buyer
flagged this brand for evaluation." "Pricing team meeting Tuesday on this."
This annotation layer makes CannaSpy part of how the org thinks and operates,
not just a dashboard someone checks. Cancellation means losing that
institutional memory — a qualitatively different kind of churn cost.

**Build priority:** v2

---

### Screen 26 — Team Activity Feed

**Purpose:** Shared log of what the team has been doing in CannaSpy. Surfaces
the human intelligence layer on top of the automated intelligence layer.

**Key data:**
- Who viewed which competitor profiles
- Who acted on which alerts
- Who added annotations
- Who ran exports
- Who modified block settings

**Key interactions:**
- Filter by team member
- Filter by action type
- Click activity → navigate to the referenced screen/entity

**Strategic function:** Allows a VP of Operations to see at a glance whether
their GMs are using the platform and responding to the right signals. Creates
accountability around competitive intelligence as an operational discipline.
Also a retention mechanic — operators can see the value their team is extracting,
which makes the subscription easier to justify at renewal.

**Build priority:** v2

---

### Screen 27 — Admin Audit Log

**Purpose:** Enterprise-grade record of all consequential actions in the
account.

**Key data:**
- Who added or removed blocks (and which competitors)
- Who changed location settings
- Who exported data
- Who modified notification or signal tuning settings
- Who accessed the cancellation flow
- Timestamps on all events
- IP address (optional, for enterprise)

**Key interactions:**
- Filter by action type
- Filter by team member
- Date range filter
- Export log as CSV

**Strategic function:** Non-negotiable for enterprise accounts with multiple
stakeholders and compliance requirements. Having this removes a procurement
objection. Not having it creates one. A single large MSO with institutional
investors will ask for this before signing.

**Build priority:** v2

---

## Section 7 — Account, Billing & Admin
*6 screens. Standard SaaS infrastructure. Must work flawlessly.*

---

### Screen 28 — Billing & Slot Usage

**Key data:** Current slot count (tracked + blocked), monthly cost breakdown,
invoice history, next billing date, volume discount tier progress.

**Strategic function:** Upgrade path always visible. Operators can see they're
3 slots away from the next discount tier. That's an upsell prompt that doesn't
require a sales call.

**Build priority:** MVP

---

### Screen 29 — Team & Permissions

**Key data:** Users, roles (Admin / Manager / Viewer), location-level access
restrictions.

**Strategic function:** Role-based access prevents a location GM from
accidentally canceling a block that the VP of Operations placed deliberately.
Also enables multi-stakeholder renewals — the VP, the GM, and the buyer all
have accounts, all extracting value, all with opinions at renewal time.

**Build priority:** v2

---

### Screen 30 — Notification Settings

**Key data:** Alert delivery preferences (real-time push, daily digest, weekly
only), quiet hours, per-location monitoring intensity.

**Build priority:** MVP (basic), v2 (granular per-location settings)

---

### Screen 31 — Location Management

**Key data:** All locations, status (active / paused / inactive), slot count
per location, last scrape timestamp.

**Key interactions:** Add location, pause location, deactivate location.

**Strategic function:** Adding a new location is the clearest natural upsell
event in the product. The UX should make it feel like an achievement, not
administration.

**Build priority:** MVP

---

### Screen 32 — Integrations

**Key data:** Available integrations: Slack (alert notifications), POS system
connectors (future), API access (enterprise), webhooks.

**Strategic function:** Embedding CannaSpy alerts in Slack means CannaSpy
data is seen by the whole team in the channels they already use. This is the
highest-leverage distribution mechanism for the platform.

**Build priority:** v2

---

### Screen 33 — Cancellation Flow

**Purpose:** Multi-step flow every cancellation must pass through before
completion.

**Steps:**
1. Show all active blocks and their specific consequences (per Screen 18)
2. Offer pause as alternative (30, 60, 90 days)
3. Offer plan downgrade (reduce slot count, not full cancel)
4. Offer location-specific suspension (pause one location, keep others)
5. Full cancellation available — but requires active confirmation after
   seeing all consequences

**Strategic function:** The cancellation flow is not a dark pattern — it is
a transparent presentation of real consequences. Every alternative offered
(pause, downgrade, partial suspension) is a genuine option that serves the
operator's interests. The goal is not to trap — it is to ensure the operator
makes an informed decision.

**Build priority:** MVP (simplified), v2 (full alternatives)

---

## Section 8 — Sales-Assist & Prospect-Facing
*3 screens. Pre-signup conversion tools. No login required.*

---

### Screen 34 — Live ROI Demo

**Purpose:** Shareable public-facing ROI calculator. Closer sends this link to
a prospect before or after an outreach call.

**Key data / inputs:** Same as Screen 19 (ROI Calculator) but public-facing,
no login required.

**CTA:** "See your market. Lock out your rival." → triggers demo request form.

**Build priority:** v1.5 (before full product launch — it's a sales tool)

---

### Screen 35 — Market Snapshot

**Purpose:** Public teaser showing anonymized competitive activity in a
specific market. Used in cold outreach emails to prove data exists before
the prospect has ever logged in.

**Key data:**
- Market name (e.g., "West Hollywood cannabis market")
- Number of active dispensaries monitored
- Average price by top category
- Number of promotions detected this week
- Last updated timestamp

**No competitor names shown.** This is a teaser, not a data dump.

**CTA:** "Want to see who's moving in your market?" → demo request.

**Build priority:** v1.5 (sales tool, pre-launch)

---

### Screen 36 — Trial / Demo Mode

**Purpose:** Constrained live-data product experience for prospects. Real
market data, no login required (or magic link).

**Shows:** Price Intelligence (Screen 07), Alert Feed (Screen 12, last 48h),
one Competitor Profile (Screen 06).

**Blocks:** All blocking functionality visible but locked. "Available on paid
plan" labels. No access to full competitor list.

**Strategic function:** The prospect sees exactly what they're missing. The
blocking UI is visible and labeled as inaccessible. This creates desire through
demonstration rather than description.

**Build priority:** v2

---

## Build Phase Summary

| Phase | Screens Included | Definition of Done |
|---|---|---|
| **MVP** | 01–05, 07, 08, 12, 16–18, 28, 30–31, 33 | Closeable to one pilot MSO account |
| **v1.5** | + 34, 35 (sales tools) | Closeable via outbound without live demo |
| **v2** | + 06, 09–11, 13–15, 19–21, 24–27, 29, 32, 36 | Retention, collaboration, trust layer |
| **v3** | + 22, 23 | AI recommendations, market share model |

---

*Screen architecture developed through strategy sessions with the founder.
All product decisions reflect the founder's original vision.*

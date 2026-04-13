# CannaSpy — Brand, Voice & UI Guidelines
**Version 2.0 | March 2026**

This document defines the voice, messaging system, visual identity, and UI
principles for CannaSpy. Claude Code should apply these when writing any
user-facing copy, empty states, error messages, button labels, or UI text.

---

## The Brand in One Sentence

CannaSpy is a professional B2B intelligence platform for cannabis operators
who take competitive advantage seriously.

---

## The Three-Pillar Manifesto
*(Opening framework for sales decks and investor pitches)*

**THE OLD WAY**
> Weedmaps built a trap.
> Dispensaries paid because leaving cost them consumer traffic. The value was
> real — but the relationship was adversarial. They stayed out of fear, not loyalty.

**THE CANNASPY WAY**
> CannaSpy builds a moat.
> Dispensaries pay because leaving costs them competitive advantage — and hands
> it directly to a rival. The relationship is collaborative. They stay because
> they win.

**THE RESULT**
> Same psychology. Better ethics.
> FOMO, scarcity, hold-it-or-lose-it — all the same triggers. But CannaSpy
> delivers genuine ROI, not just fear of missing out. Customers don't resent us.
> They brag about us.

---

## Core Taglines

| Use Case | Tagline |
|---|---|
| Primary brand statement | "We don't sell data. We sell competitive advantage — and the peace of mind that comes with it." |
| One-liner | "Weedmaps built a trap. CannaSpy builds a moat." |
| Sales outreach hook | "First to respond wins the territory." |
| Feature callout (blocking) | "Know what they know. Block what they see." |
| ROI framing | "25–100× ROI. No CFO kills this line item." |
| Investor narrative | "Same psychology. Better ethics." |
| Churn prevention | "The second you cancel, they get the call." |

---

## Voice Principles

### 1. Direct, not clever
Write exactly what you mean. CannaSpy's buyers are operators — they are busy,
skeptical, and have seen every SaaS pitch. Don't try to be clever. Say the
thing clearly.

**Wrong:** "Unlock unprecedented visibility into your competitive landscape"
**Right:** "See every price change your rivals make before you open the doors"

### 2. Confident, not arrogant
CannaSpy knows it has something valuable. It doesn't need to oversell it.

**Wrong:** "The most powerful competitive intelligence platform ever built for cannabis"
**Right:** "Real-time competitor pricing and the ability to block rivals from seeing what you see"

### 3. Factual about the blocking mechanic — never threatening
The cancel-block consequence is a product feature, not a threat. State it
neutrally and matter-of-factly. Let the operator draw their own conclusions.

**Wrong in UI:** "Cancel and we'll immediately call your rivals"
**Right in UI:** "Canceling this block will re-add [Competitor] to our active
prospect list. Our team typically follows up within 24–48 hours."

**This distinction is critical.** In the product UI, factual and neutral.
In marketing copy, don't mention it at all — lead with intelligence value.

### 4. War room, not wellness
CannaSpy is for operators who are competing hard. The tone is serious,
focused, and strategic. Not aggressive or hostile — but not warm and soft either.

**Wrong:** "You're all caught up! 🎉 No competitor changes today."
**Right:** "All clear across 10 markets as of 6:42 AM. Last check: 2 minutes ago."

### 5. No cannabis clichés
CannaSpy is a B2B intelligence platform. Avoid anything that reads like
dispensary marketing.

**Never use:**
- Leaf emoji or leaf imagery in the product UI
- "420", "blaze", "high times", "green" as a theme color
- Puns about being "high" on intelligence or "elevated" analytics
- Overly green color schemes that evoke cannabis branding

**The visual identity is dark slate + intelligence teal + amber warning.**
It should feel closer to Bloomberg Terminal than to a dispensary menu board.

---

## UI Copy Guidelines

### Empty states
Never say "Nothing here yet" or "No data available." Every empty state should
communicate operational status, not absence.

| Screen | Wrong | Right |
|---|---|---|
| Alert Feed | "No alerts today" | "All clear across [N] markets. Last checked [timestamp]." |
| Competitor list | "No competitors added" | "Add your first rival to start monitoring." |
| Block management | "No active blocks" | "No rivals currently suppressed. Add a block to start building your moat." |
| Price matrix | "Loading..." | "Pulling latest prices from [N] sources..." |

### Error messages
Specific and actionable. Never blame the user. If a scrape fails, say why.

**Wrong:** "Something went wrong. Please try again."
**Right:** "Couldn't reach [Competitor Name]'s menu. Their site may be down.
We'll retry automatically in 4 hours. [Last successful scrape: 6 hours ago]"

### Button labels
Action-oriented verbs. Never "Submit" or "OK."

| Action | Wrong | Right |
|---|---|---|
| Add block | "Submit" | "Block this rival" |
| Confirm cancel | "OK" | "Cancel this block" |
| Add location | "Save" | "Add location" |
| View evidence | "Details" | "View source" |
| Dismiss alert | "OK" | "Mark as reviewed" |

### Confirmation dialogs
State the specific consequence, not a generic "are you sure?"

**Wrong:** "Are you sure you want to remove this block?"
**Right:** "Cancel block on [Competitor Name]? They'll be added back to our
prospect list immediately."

---

## Visual Identity

### Color Palette (Dark Theme — Primary)

```css
/* Backgrounds */
--bg-base:        #0d0f11;   /* Page background */
--bg-surface:     #141618;   /* Cards, panels */
--bg-elevated:    #1a1d20;   /* Hover states, elevated cards */

/* Borders */
--border-subtle:  rgba(255, 255, 255, 0.07);
--border-default: rgba(255, 255, 255, 0.12);
--border-strong:  rgba(255, 255, 255, 0.20);

/* Text */
--text-primary:   #e8e6e0;
--text-secondary: #7a7870;
--text-muted:     #4a4845;

/* Section accents */
--accent-intel:   #1d9e75;   /* Intelligence / monitoring — teal */
--accent-block:   #ba7517;   /* Blocking — amber */
--accent-trust:   #3b8bd4;   /* Data trust — blue */
--accent-alert:   #d4537e;   /* Alerts / urgency — coral */
--accent-roi:     #8b5cf6;   /* ROI / reporting — purple */
--accent-collab:  #d4537e;   /* Collaboration — same coral */

/* Semantic */
--color-positive: #1d9e75;   /* Price advantage, up trends */
--color-negative: #d4537e;   /* Price exposure, down trends */
--color-neutral:  #7a7870;   /* No match, unchanged */
--color-warning:  #ba7517;   /* Attention needed */
```

### Typography

```css
/* Primary: DM Sans — clean, professional, readable at small sizes */
font-family: 'DM Sans', sans-serif;

/* Mono: Space Mono — labels, numbers, timestamps, screen IDs */
font-family: 'Space Mono', monospace;

/* Weights: 400 (body), 500 (emphasis), 600 (headings) */
/* Never use 700+ — too heavy against dark surfaces */
```

### Spacing & Layout
- Base unit: 4px
- Card padding: 16px
- Section gap: 32px
- Max content width: 1280px
- Sidebar width: 240px

### Component Principles
- Cards: 1px border, `var(--border-subtle)`, `border-radius: 8px`
- Section accent: 2px top border on cards, using section color
- Tables: no alternating row zebra striping — use subtle hover only
- Numbers and prices: always monospace font
- Timestamps: always monospace, always UTC converted to local
- Price deltas: green for advantage, red/coral for exposure — never the reverse

---

## Competitive Positioning (Do Not Contradict)

CannaSpy is NOT:
- A consumer discovery platform (that's Weedmaps, Leafly)
- A market research tool (that's BDSA, Headset, New Frontier)
- A POS analytics tool (that's Flowhub, Dutchie analytics)
- A brand analytics tool (that's what Headset/BDSA serve)

CannaSpy IS:
- Real-time competitive intelligence for dispensary operators
- The only platform where paying customers can block rivals from accessing the same intelligence
- Built specifically for the California MSO operator, not brands or investors

When writing competitive comparisons or positioning copy, always maintain this
distinction. Never position CannaSpy against consumer platforms — that's a
different category entirely.

---

## The Weedmaps Reference

Weedmaps is a legitimate reference point in sales conversations and investor
pitches. The comparison is: same psychological mechanics (FOMO, scarcity,
hold-it-or-lose-it), better ethics (genuine ROI, operator-aligned, no data
exploitation).

**Use the Weedmaps comparison:**
- In the three-pillar manifesto
- In investor pitch narrative
- In sales conversations when operators bring up Weedmaps
- In the "how is this different from X" section of sales materials

**Do not use the Weedmaps comparison:**
- In cold outreach subject lines or email copy
- In product UI (operators don't want to be reminded of Weedmaps while using your product)
- As a primary positioning frame with operators who have neutral/positive Weedmaps relationships

---

## What CannaSpy Customers Brag About
*(The outcomes to reference in copy and case studies)*

- "We found out about a competitor's BOGO before it launched and had our own promo live the same morning"
- "We dropped prices on 1g flower by 8% after seeing three rivals undercut us — recaptured the weekend traffic"
- "Our rival has been trying to get into CannaSpy for six months. They can't."
- "The ROI calculator told me 47×. I showed it to our CFO. We signed the same day."

These are the stories. Write product copy that makes these outcomes feel
inevitable.

---

*Brand guidelines developed through strategy sessions with the founder.*
*All positioning decisions reflect the founder's 13+ years of California
cannabis industry expertise.*

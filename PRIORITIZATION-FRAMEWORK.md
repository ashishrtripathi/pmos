# PMOS Prioritization Framework

## Overview

PMOS uses a **dollar-normalized weighted scoring model** with AI-assisted continuous re-evaluation. Every story is scored across five value dimensions, each expressed in US dollars, then divided by effort (also in dollars) to produce a **Value-to-Cost Ratio (VCR)**.

The PM sets OKRs, the AI proposes scores, and the PM approves or overrides. Scores are re-evaluated on a weekly cadence or ad-hoc at the PM's discretion.

---

## 1. OKR Structure

### Levels

OKRs exist at two levels:

| Level | File | Scope |
|-------|------|-------|
| **Product OKRs** | `~/.pmos/okrs.md` | Cross-project strategic goals |
| **Project OKRs** | `~/.pmos/projects/{slug}/okrs.md` | Project-specific goals aligned to product OKRs |

### OKR Format

```markdown
## Objective: Expand into the education market

- **Key Result 1:** 100 educator sign-ups in Q3
- **Key Result 2:** 3 university partnership deals
- **Key Result 3:** Achieve 4.5+ rating on educator review sites
```

### OKR Lifecycle

1. **Explicit OKRs** — PM defines at project start based on business strategy
2. **Journey-Discovered OKRs** — AI proposes new OKRs from customer journey analysis (e.g., "Emma needs LMS export → Objective: Win the education vertical")
3. **Live-Product OKRs** — AI proposes OKRs from analytics, support tickets, and user feedback after launch
4. **Implicit OKRs** — Evergreen goals like "keeping customers happy" that are always in scope but may not have explicit KRs until data emerges

**AI Role:** Suggests new OKRs from intelligence data. PM approves, edits, or rejects. All OKR changes are logged with provenance (where the suggestion came from).

---

## 2. Scoring Dimensions

Every story is scored across **five value dimensions** and one **effort dimension**, all expressed in US dollars.

### Value Dimensions (Numerator)

| Dimension | What It Measures | How to Calculate |
|-----------|-----------------|------------------|
| **Strategic Alignment** | Visibility into new markets, competitive positioning | Estimated market access value: (addressable market × expected penetration) |
| **New Revenue Impact** | New customers, upsells, expansion revenue | New ARR: (new customers × average contract value) |
| **Renewal Revenue Impact** | Retention, reduced churn, stickiness | Saved ARR: (at-risk customers × retention improvement % × ACV) |
| **Improve Customer Experience** | Reduced friction, lower churn, better NPS | Churn reduction value: (monthly churn rate reduction × customer LTV × user base) |
| **Lowers Cost** | Reduced operational costs, fewer manual steps, automation savings | Hours saved × average cost per hour |

### Dollar Calculation Rules

Every dollar figure must include **showing the math**:

```markdown
## Story: Auto-generate video thumbnails
### Strategic Alignment
- Calculation: $0 (not market-facing)

### New Revenue Impact
- Calculation: This feature increases click-through on video listings by ~15%
- 15% × 10,000 monthly viewers × 2% conversion × $49/mo × 12 months = **$17,640**
- Logic: More compelling thumbnails → more video plays → more conversions

### Renewal Revenue Impact
- Calculation: Reduces "output quality" complaints by ~30%
- 30% × 50 at-risk users × $588 ACV × 12 months retention = **$10,584**
```

### AI Estimation of Dollar Values

When the PM cannot determine a dollar value, the AI should:

1. **Analyze the codebase** — understand scope and complexity
2. **Cross-reference intelligence** — use tech stack, architecture, and feature data
3. **Apply industry benchmarks** — SaaS conversion rates, churn reduction ratios, cost-per-hour rates
4. **Show the logic** — always display the formula and assumptions
5. **Let the PM override** — AI provides a number with reasoning, PM adjusts

### Effort Dimension (Denominator)

| Component | Source | Formula |
|-----------|--------|---------|
| **AI Agent Team Cost** | Token consumption estimate | Estimated tokens × price per token for agent team |
| **Developer Review Cost** | PM configures per project | 1 real developer review × US hourly rate × review hours |
| **Total Effort Cost** | Sum of above | AI estimate + PM override if needed |

### Team Cost Configuration

Each project can have a `team-cost.json` override file:

```json
{
  "usHourlyRate": 150,
  "teamSize": 1,
  "reviewHoursPerStory": 4,
  "currency": "USD",
  "notes": "US-based full-stack developer average"
}
```

If not present, the AI uses defaults:
- US developer hourly rate: $150/hr
- Review hours per story: 2–8 hours (based on story points)
- AI agent cost: estimated from token usage

---

## 3. Persona-Driven Prioritization

### Persona Ranking

PMs rank personas by importance. The ranking can be adjusted based on:

| Factor | Data Source |
|--------|------------|
| **PM's strategic priority** | Manual ranking |
| **Lifetime Value (LTV)** | Revenue analytics per persona |
| **Usage analytics** | Feature usage, session time, frequency |
| **Tickets & complaints** | Support data per persona |
| **Cost of not solving** | Revenue loss from churn per persona |

### Revenue Weighting Per Persona

Each persona is assigned a **revenue weight** based on:

```
Persona Weight = (LTV × Usage Score × Complaint Density) / Total All Personas
```

Where:
- **LTV** = Lifetime value of a customer in this persona segment
- **Usage Score** = Relative usage frequency (0–1 scale)
- **Complaint Density** = Number of complaints per user in this segment

### Multi-Persona Stories

Stories are tagged to **one primary persona** — the one who benefits most and has the highest potential ROI for the update.

The primary persona is determined by:
1. Which persona's journey step the story maps to
2. Which persona generates the most revenue from this feature
3. Which persona would churn if this feature is missing

---

## 4. Score Calculation

### Per-Dimension Score

```
Dimension Score ($) = Value in that dimension
```

### Total Value Score

```
Total Value = Strategic Alignment + New Revenue + Renewal Revenue + Customer Experience + Cost Reduction
```

### Value-to-Cost Ratio (VCR)

```
VCR = Total Value ($) / Total Effort Cost ($)
```

### Weighted VCR (Optional)

If dimensions have different strategic weights:

```
Weighted VCR = (W₁ × Strategic + W₂ × New Rev + W₃ × Renewal Rev + W₄ × CX + W₅ × Cost) / Effort
```

Default weights: all equal (0.2 each). PM can adjust per project.

### Tier Assignment

| VCR Range | Tier |
|-----------|------|
| ≥ 10.0 | **Critical** — Must do |
| 5.0 – 9.9 | **High** — Should do |
| 2.0 – 4.9 | **Medium** — Could do |
| < 2.0 | **Low** — Won't do this cycle |

---

## 5. Dependencies

Stories can declare dependencies:

```yaml
dependencies:
  - STORY-001  # blocks this story
  - STORY-003  # this story blocks this one
```

### Dependency Rules

1. If Story B depends on Story A, **Story A gets a priority boost** (its VCR is multiplied by 1.2)
2. Story B is flagged as **"blocked"** until Story A reaches "Done" status
3. Dependencies are displayed visually on the Story Map and Kanban Board
4. Circular dependencies are flagged as errors by the AI

---

## 6. AI Involvement

### What the AI Does

| Phase | AI Action |
|-------|-----------|
| **Initial Scoring** | Proposes dollar values for all 5 dimensions + effort estimate |
| **OKR Discovery** | Suggests new OKRs from journey intelligence, analytics, tickets |
| **Dependency Detection** | Identifies technical dependencies from codebase analysis |
| **Re-evaluation** | Re-scores stories on weekly cadence or PM-triggered |
| **Ranking** | Generates ranked backlog by VCR tier |

### What the PM Does

| Phase | PM Action |
|-------|-----------|
| **OKR Approval** | Reviews and approves/modifies AI-suggested OKRs |
| **Score Override** | Adjusts any dollar value the AI proposes |
| **Final Ranking** | Drag-and-drop reordering within tiers |
| **Persona Weighting** | Sets persona priority based on business context |
| **Go/No-Go** | Approves or rejects the prioritized backlog |

---

## 7. Continuous Re-evaluation

### Scheduled Cadence

- **Weekly re-score**: AI re-evaluates all stories every Monday
- **PM-triggered**: PM can click "Re-prioritize" at any time

### Re-evaluation Triggers

| Trigger | What Changes |
|---------|-------------|
| New story added | New story gets scored, existing stories may shift |
| Story moved to Done | Dependencies unblocked, related stories re-scored |
| New intelligence data | Architecture changes, new features detected |
| OKR update | Strategic alignment scores shift |
| Persona analytics update | Revenue weights recalculate |

### Re-evaluation Log

Every re-evaluation is logged with:
- Timestamp
- What changed and why
- Before/after scores
- Which dimension was most affected

---

## 8. UI Views

### Scoring Table (Primary View)

A spreadsheet-like view on the Prioritization page:

| Story | Strategic | New Rev | Renewal Rev | CX | Cost | Total Value | Effort | VCR | Tier | Rank |
|-------|-----------|---------|-------------|-----|------|-------------|--------|-----|------|------|
| STORY-002 | $17,640 | $17,640 | $10,584 | $24,000 | $6,000 | $75,864 | $2,600 | 29.2 | Critical | 1 |
| STORY-004 | $5,000 | $30,000 | $45,000 | $15,000 | $0 | $95,000 | $4,200 | 22.6 | Critical | 2 |

### Where Scores Appear

- **Backlog/Stories Board**: Priority badge + VCR score on each card
- **Kanban Board**: Tier color coding on cards
- **Story Map**: Priority overlay on journey backbone
- **Dedicated Prioritization Page**: Full scoring table with edit capabilities

### Story Card Enhancement

Each story card shows:

```
┌─────────────────────────────────────────────┐
│ STORY-002: Script Generation    [Critical]  │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
│ As a content creator (Sarah), I want...     │
│                                             │
│ 💰 VCR: 29.2  |  $75,864 / $2,600          │
│ 🎯 Strategic: $17.6K | Rev: $17.6K         │
│ 🧑 Sarah (Content Creator)                  │
│ 🔗 Blocked by: STORY-001                    │
│ 📊 Points: 13  |  Status: Backlog           │
└─────────────────────────────────────────────┘
```

---

## 9. Data Files

### File Structure

```
~/.pmos/
├── okrs.md                              # Product-level OKRs
└── projects/{slug}/
    ├── okrs.md                          # Project-level OKRs
    ├── team-cost.json                   # Team cost config (optional)
    ├── prioritization/
    │   ├── scores.json                  # Cached scores for all stories
    │   ├── re-evaluation-log.md         # History of score changes
    │   └── persona-weights.json         # Current persona revenue weights
    └── stories/
        ├── backlog/                     # Stories to do
        ├── in-progress/                 # Being worked on
        ├── review/                      # In review
        └── done/                        # Completed
```

### scores.json Schema

```json
{
  "lastReEvaluation": "2026-07-22T10:00:00Z",
  "cadence": "weekly",
  "stories": {
    "STORY-002": {
      "strategicAlignment": 0,
      "newRevenueImpact": 17640,
      "renewalRevenueImpact": 10584,
      "customerExperience": 24000,
      "costReduction": 3600,
      "totalValue": 55824,
      "effortCost": 2600,
      "vcr": 21.5,
      "tier": "Critical",
      "primaryPersona": "Sarah",
      "dependencies": ["STORY-001"],
      "blocked": false,
      "lastScored": "2026-07-22T10:00:00Z",
      "rationale": {
        "strategicAlignment": "Not a market-facing feature",
        "newRevenueImpact": "Core feature driving trial→paid conversion",
        "renewalRevenueImpact": "Improves content quality reducing churn",
        "customerExperience": "Saves 45min per video creation",
        "costReduction": "Eliminates need for stock photo subscriptions ($15-50/mo)"
      }
    }
  }
}
```

---

## 10. PMOS Command

### Create Prioritized Story

```
PMOS: create a user story for [description]
```

The AI will:
1. Identify the persona from the customer journey
2. Link to the relevant journey step
3. Write the story in Mike Cohn format (As a / I want to / so that)
4. Add Gherkin acceptance criteria (Scenario / Given / When / Then)
5. Link to a business goal
6. Propose dollar scores for all 5 dimensions
7. Estimate effort cost
8. Calculate VCR
9. Assign tier

### Re-prioritize

```
PMOS: re-prioritize the backlog for [project-slug]
```

### Set OKRs

```
PMOS: set OKRs for [project-slug]
```

### View Priorities

```
PMOS: show prioritized backlog for [project-slug]
```

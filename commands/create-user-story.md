# Create User Story

## Purpose

Create a user story using the Mike Cohn format with Gherkin acceptance criteria, linked to a persona from the Customer Journey and a business goal.

## Format

Every user story must follow this exact format:

```markdown
---
id: STORY-XXX
title: "Title"
points: X
status: backlog
persona: PersonaName
persona-role: PersonaRole
journey-step: "Journey Step Name"
---

# Title

## Use Case

- **As a** [persona role] like [Persona Name] who [context]
- **I want to** [action or capability]
- **so that** [desired outcome tied to business goal]

## Business Goal

**[Bold summary of the business goal]**

[Detailed explanation of revenue impact, cost reduction, or strategic value]
Include the calculation logic:
- Metric: [what is being measured]
- Calculation: [formula with numbers]
- Dollar value: **$XX,XXX**

## Acceptance Criteria

- **Scenario:** [scenario name]
  - **Given:** [precondition]
  - **and Given:** [additional precondition] (optional, repeatable)
  - **When:** [action]
  - **Then:** [expected result]

(multiple scenarios allowed)

## Dependencies

- STORY-XXX (blocks this story / blocked by this story)

## Effort

- AI Agent team estimate: [hours] of agent work + [hours] developer review
- US Development team equivalent: ~$X,XXX ([points] pts × $XXX/pt avg)
```

## Instructions for AI Agents

When the PM says **"PMOS: create a user story for [description]"**:

### Step 1: Identify the Persona
1. Read the customer journey files at `~/.pmos/projects/{slug}/journey/persona-*.md`
2. Determine which persona benefits most from this story
3. Identify the specific journey step this story maps to
4. Set the persona and persona-role fields

### Step 2: Write the Use Case
Use Mike Cohn's format:
- **As a** — the persona role + context about who they are
- **I want to** — the specific action or capability
- **so that** — the desired outcome, linked to a business goal

### Step 3: Define the Business Goal
- Identify which business goal this supports:
  - Strategic Alignment (new market visibility)
  - New Revenue Impact (new customers, upsells)
  - Renewal Revenue Impact (retention, reduced churn)
  - Improve Customer Experience (lower friction, better NPS)
  - Lowers Cost (automation, efficiency)
- Show the dollar calculation with logic
- If uncertain, estimate with industry benchmarks and show assumptions

### Step 4: Write Acceptance Criteria in Gherkin
- Each scenario follows: Given / When / Then
- Multiple "Given" conditions are allowed with "and Given"
- Multiple scenarios per story are expected
- Write criteria that are testable and unambiguous

### Step 5: Identify Dependencies
- Read existing stories to find dependencies
- If this story depends on another, mark it
- If other stories depend on this one, mark those too

### Step 6: Estimate Effort
- AI estimates hours based on codebase intelligence
- Developer review time added on top
- US dev team equivalent cost calculated

### Step 7: Save the Story
Save to: `~/.pmos/projects/{slug}/stories/backlog/STORY-XXX-slug.md`
Where slug is a kebab-case version of the title.

## Example

```markdown
---
id: STORY-005
title: "Export Video to LMS-Compatible Format"
points: 8
status: backlog
persona: Emma
persona-role: Educator
journey-step: "Export Video"
---

# Export Video to LMS-Compatible Format

## Use Case

- **As an** educator like Emma who builds course materials
- **I want to** export my video in SCORM-compatible format
- **so that** I can upload it directly to my university LMS without manual conversion

## Business Goal

**Wins the education vertical by removing the #1 adoption barrier.**

Without LMS export, educators must manually convert MP4 → SCORM, losing interactivity and tracking. This blocks university partnerships.
- Metric: Education segment conversion rate
- Calculation: 30% × 100 educator leads × $99/mo × 12 months = **$35,640 ARR**
- Dollar value: **$35,640 new revenue impact**

## Acceptance Criteria

- **Scenario:** Export SCORM 1.2 package
  - **Given:** I have rendered a completed video
  - **When:** I click "Export" and select "SCORM Package"
  - **Then:** a ZIP file is generated containing the video, manifest.xml, and a completion-tracking HTML wrapper

- **Scenario:** Export triggers progress tracking
  - **Given:** A student watches the SCORM video in the LMS
  - **When:** they reach 80% completion
  - **Then:** the LMS records "completed" status and the student sees a quiz prompt

## Dependencies

- STORY-004 (Video Rendering must be complete first)

## Effort

- AI Agent team estimate: 6–8 hours of agent work + 2 hours developer review
- US Development team equivalent: ~$1,600 (8 pts × $200/pt avg)
```

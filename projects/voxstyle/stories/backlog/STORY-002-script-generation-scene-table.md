---
id: STORY-002
title: "Script Generation with Editable Scene Table"
points: 13
status: backlog
persona: Sarah
persona-role: Content Creator
journey-step: "Generate Script"
---

# Script Generation with Editable Scene Table

## Use Case

- **As a** content creator like Sarah who has a topic but no scriptwriting expertise
- **I want to** enter a subject and target length and have AI generate an editable scene table I can review and approve before any processing begins
- **so that** I can create professional video scripts quickly while maintaining editorial control over the content

## Business Goal

**Drives new revenue by delivering the core content creation experience.** Script generation is the primary value that differentiates VOXStyle — turning a topic into a structured video plan in seconds. This directly impacts conversion from free trial to paid subscription.

- New revenue impact: Core feature driving subscription conversions
- Estimated value: Enables content creation for all personas (Sarah, Mike, Emma)
- Improves customer experience: Reduces time-to-first-video from hours to minutes

## Acceptance Criteria

- **Scenario:** Generate a scene table from a topic
  - **Given:** I am on the subject input page with a topic and target length
  - **When:** I submit the form
  - **Then:** Claude generates a scene table with all columns (scene number, narration, visual, duration, transitions) and displays it in an editable grid

- **Scenario:** Edit a scene row
  - **Given:** I have a generated scene table
  - **When:** I edit a cell in any row
  - **Then:** the change is saved locally and reflected in the table immediately

- **Scenario:** Approve and lock the scene table
  - **Given:** I have reviewed and edited the scene table
  - **When:** I click "Approve & Continue"
  - **Then:** the pipeline proceeds to asset sourcing and the scene table enters a read-only state

- **Scenario:** Edit after approval flags row as stale
  - **Given:** I have approved the scene table
  - **When:** I unlock and edit a row
  - **Then:** that row is flagged as "stale" with a visual indicator showing it needs re-approval

- **Scenario:** Structured chart data from LLM
  - **Given:** The LLM generates a scene with chart data
  - **When:** the scene table is displayed
  - **Then:** chart data is emitted as structured JSON, not fabricated downstream

## Dependencies

- STORY-001 (Project Structure)

## Effort

- AI Agent team estimate: 8–12 hours of agent work + 3 hours developer review
- US Development team equivalent: ~$2,600 (13 pts × $200/pt avg)

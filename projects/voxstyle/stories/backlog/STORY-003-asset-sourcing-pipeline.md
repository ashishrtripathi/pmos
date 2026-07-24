---
id: STORY-003
title: "Asset Sourcing Pipeline with Fallback Chain"
points: 13
status: backlog
persona: Sarah
persona-role: Content Creator
journey-step: "Select Images"
---

# Asset Sourcing Pipeline with Fallback Chain

## Use Case

- **As a** content creator like Sarah who needs visuals for each scene but doesn't have a stock photo subscription or design skills
- **I want to** have assets automatically sourced using a fallback chain (my upload → stock photos → AI generation → placeholder) with a cost preview before processing begins
- **so that** I can get high-quality visuals for my video without manually searching for images or incurring unexpected costs

## Business Goal

**Lowers production costs and improves customer experience.** Automated asset sourcing eliminates the need for stock photo subscriptions (saving users $15–50/month) and reduces friction in the creation pipeline, lowering churn.

- Cost reduction: Users save $180–600/year on stock photo subscriptions
- Improve customer experience: Reduces the most time-consuming step (average 45 min → 2 min)
- Lowers cost: Free stock sources tried before paid AI generation

## Acceptance Criteria

- **Scenario:** Dry-run cost preview before processing
  - **Given:** I have approved my scene table with 6 scenes
  - **When:** I click "Source Assets"
  - **Then:** a dry-run summary appears showing how many stock searches, AI generations, and placeholders will be used, with estimated costs

- **Scenario:** Fallback chain follows correct order
  - **Given:** The asset sourcing pipeline runs on a scene
  - **When:** it attempts to source an image
  - **Then:** it tries user upload first, then free stock (Pixabay, Pexels, Unsplash), then AI generation (Gemini), then placeholder — in that exact order

- **Scenario:** User provides their own image
  - **Given:** I have uploaded my own image for a scene
  - **When:** the pipeline runs
  - **Then:** stock search is skipped entirely for that scene and my image is used

- **Scenario:** Asset metadata is tracked
  - **Given:** An asset has been sourced from any source
  - **When:** I view the asset details
  - **Then:** the source (stock/gemini/upload), license type, and attribution requirements are displayed

- **Scenario:** No images found for a scene
  - **Given:** The pipeline cannot find any image from stock or AI generation
  - **When:** processing continues
  - **Then:** a clearly labeled placeholder is used and flagged in the UI with a "needs attention" indicator

## Dependencies

- STORY-002 (Script Generation)

## Effort

- AI Agent team estimate: 10–14 hours of agent work + 3 hours developer review
- US Development team equivalent: ~$2,600 (13 pts × $200/pt avg)

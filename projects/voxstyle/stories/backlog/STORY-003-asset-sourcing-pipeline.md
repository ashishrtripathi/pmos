# STORY-003: Asset Sourcing Pipeline with Fallback Chain

## Status: backlog
## Priority: critical
## Points: 13
## Created: 2026-07-22
## Project: voxstyle

### User Story
As a content creator, I want assets automatically sourced using a fallback chain (user upload → stock → AI generation → placeholder) with a cost preview before processing begins.

### Acceptance Criteria
- [ ] Given approved scenes, when I click "Source Assets", then a dry-run summary appears
- [ ] Given the dry-run, when I approve, then stock images are searched first (Pixabay, Pexels, Unsplash)
- [ ] Given stock search, when nothing is found, then Gemini generates an image
- [ ] Given no Gemini result, when processing continues, then a placeholder is flagged in the UI
- [ ] Given each asset, when sourced, then `source`, `license`, and `attribution_required` are stored
- [ ] Given the source, when user provides their own asset, then stock search is skipped entirely

### Business Rules
- Fallback order is fixed: user upload → stock → Gemini → placeholder
- Free stock sources tried before paid Gemini
- Dry-run shows: stock searches, Gemini generations, estimated cost
- Every asset stores license info for credits panel

### Dependencies
- STORY-002 (Script Generation)

### Notes
- Agent team: software-engineer
- Reference: spec §4 (Step 2 — Asset Sourcing)

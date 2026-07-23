# STORY-004: Remotion Scene Animation + Voiceover Sync

## Status: backlog
## Priority: high
## Points: 21
## Created: 2026-07-22
## Project: voxstyle

### User Story
As a content creator, I want processed assets animated with spring-based motion synced to voiceover timing, with background music and proper layering.

### Acceptance Criteria
- [ ] Given processed assets, when rendered, then foreground springs first, midground follows staggered
- [ ] Given multi-subject scenes, when interaction is "facing", then subjects face each other
- [ ] Given multi-subject scenes, when interaction is "parallel", then subjects are staggered same-direction
- [ ] Given voiceover, when rendered, then scene durations match timepoints.json exactly
- [ ] Given background music, when rendered, then music is at ~12% of VO loudness with ducking
- [ ] Given the render, when complete, then output is 16:9 (native) or 9:16 (crop mode)

### Business Rules
- Hard cuts only, no crossfades
- Stagger timing derived from actual voiceover duration (not fixed constants)
- Loudness normalization to -16 LUFS
- Every asset transform in scenes.json
- Render settings in single top-level config
- Captions toggle at project start

### Dependencies
- STORY-001 (Project Structure)
- STORY-002 (Script Generation)
- STORY-003 (Asset Sourcing)

### Notes
- Agent team: software-engineer + architect
- Reference: spec §5-9 (Steps 3-8: Processing, Remotion, Animation, Voiceover, Music)
- This is the largest story — may need to be broken down during refinement

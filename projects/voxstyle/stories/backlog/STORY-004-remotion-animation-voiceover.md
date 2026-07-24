---
id: STORY-004
title: "Scene Animation with Voiceover Sync and Audio Mix"
points: 21
status: backlog
persona: Sarah
persona-role: Content Creator
journey-step: "Generate Video"
---

# Scene Animation with Voiceover Sync and Audio Mix

## Use Case

- **As a** content creator like Sarah who wants polished, professional-looking videos without learning animation software
- **I want to** have my processed assets animated with spring-based motion synced to voiceover timing, with background music and proper audio mixing
- **so that** my video looks and sounds professional enough to publish directly to YouTube, TikTok, or course platforms

## Business Goal

**Core product differentiation and renewal revenue driver.** This is the feature that makes VOXStyle worth paying for — turning static images into dynamic videos with professional animation and audio. Directly impacts customer retention and word-of-mouth referrals.

- Renewal revenue impact: Primary feature driving subscription renewals
- New revenue impact: Quality output enables word-of-mouth growth
- Improves customer experience: Eliminates the need for After Effects/Premiere skills

## Acceptance Criteria

- **Scenario:** Spring-based scene animation
  - **Given:** I have processed assets for a scene
  - **When:** Remotion renders the composition
  - **Then:** the foreground element animates with spring-based motion first, and the midground follows with a staggered delay

- **Scenario:** Multi-subject scene interaction
  - **Given:** A scene has multiple subjects
  - **When:** the interaction type is "facing"
  - **Then:** the subjects are positioned facing each other

- **Scenario:** Voiceover timing sync
  - **Given:** Voiceover audio has been generated for each scene
  - **When:** the scene is rendered
  - **Then:** the scene duration matches the voiceover timing exactly (from timepoints.json)

- **Scenario:** Background music with ducking
  - **Given:** A background music track has been selected
  - **When:** the scene renders with both voiceover and music
  - **Then:** the music is mixed at approximately 12% of the voiceover loudness with ducking applied during speech

- **Scenario:** Output format selection
  - **Given:** I have completed all scenes
  - **When:** I click "Render Video"
  - **Then:** I can choose 16:9 (landscape) or 9:16 (vertical/crop mode) and the final MP4 is generated

- **Scenario:** Loudness normalization
  - **Given:** A video has been rendered
  - **When:** I play back the output
  - **Then:** the audio is normalized to -16 LUFS with no clipping or silence gaps

## Dependencies

- STORY-001 (Project Structure)
- STORY-002 (Script Generation)
- STORY-003 (Asset Sourcing)

## Effort

- AI Agent team estimate: 15–20 hours of agent work + 5 hours developer review
- US Development team equivalent: ~$4,200 (21 pts × $200/pt avg)

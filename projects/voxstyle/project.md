# VOXStyle Video Creator

## Project Identity

| Field | Value |
|-------|-------|
| **Name** | VOXStyle Video Creator |
| **Slug** | voxstyle |
| **Type** | AI Video Creation Platform |
| **Status** | Active Development |
| **Source** | GitHub + Local |
| **Repo** | https://github.com/ashishrtripathi/vox-style-video |
| **Local Path** | `C:\Users\ashis\VoxStyle Vdieo Creator\vox-style-video` |
| **Created** | 2026-07-22 |

---

## What It Is

A local web app (deployable later) that takes a **subject** + **target length**, generates a narrated script broken into scenes, sources/generates visual assets per scene, processes them into a black-and-white newspaper-style halftone cutout look, animates them in Remotion with a shared locked background, syncs everything to a voiceover (TTS or user-uploaded), and renders a single stitched video with background music.

---

## Tech Stack (Implemented)

| Layer | Technology |
|-------|------------|
| Frontend | React 19 / Next.js |
| Video Engine | Remotion 4.0.484 |
| Script Generation | Gemini / Claude (LLM) |
| Image Generation | Gemini (Google AI) |
| Stock Images | Pexels |
| Stock Videos | Pexels |
| Image Processing | Python (rembg, onnxruntime, Pillow) |
| Voiceover | Google Cloud TTS + Edge TTS (fallback) |
| Audio Alignment | Whisper (tiny/base) |
| Background Music | Pixabay (free) |
| Server | Express.js |
| Bundler | Webpack + Babel |
| Types | TypeScript 5 |

---

## Core Pipeline (11 Steps)

```
1. Script Generation (LLM)
   ↓
2. Editable Scene Table (UI Grid — Approval Gate)
   ↓
3. Asset Sourcing (User Upload → Stock → Gemini → Placeholder)
   ↓
4. Halftone Processing (Python — newspaper style)
   ↓
5. Remotion Project Setup (compositions, scenes, components)
   ↓
6. Animation (spring-based stagger from voiceover timing)
   ↓
7. Voiceover (TTS with SSML marks + forced alignment)
   ↓
8. Timepoint Sync (Series durations from timepoints.json)
   ↓
9. Background Music (Pixabay, ducking, ~12% relative gain)
   ↓
10. Render Settings (16:9 native, 9:16 crop, captions toggle)
   ↓
11. Full Render + Review + Targeted Re-run
```

---

## Key Design Decisions

- **Approval gate** after script generation — editable UI grid before any processing
- **Asset fallback chain** — stock → Gemini → placeholder (never silent failure)
- **Cost control** — dry-run summary before generation
- **Newspaper halftone style** — configurable, cached, versioned
- **Hard cuts only** — no crossfades between scenes
- **Stagger from voiceover** — animation timing derived from actual audio duration
- **Targeted re-run** — edit one scene row, only re-process that scene
- **Loudness normalization** — consistent volume across projects
- **16:9 native** — 9:16 is a render-time crop, not a second version

---

## Current State

- ✅ Full codebase implemented and committed (10+ commits)
- ✅ GitHub repo live at https://github.com/ashishrtripathi/vox-style-video
- ✅ Remotion video engine working (20 scenes, AI history topic)
- ✅ Python pipeline for halftone processing, background removal, TTS
- ✅ Pexels API integration for stock assets
- ✅ Edge TTS fallback (free, no API key)
- ✅ Gemini AI integration for script generation
- ✅ Rendered output video at `out/video.mp4`
- ✅ Environment variable configuration (.env)
- ⬜ CI/CD pipeline
- ⬜ Automated tests
- ⬜ Web-based UI for non-technical users

---

## PMOS Role

VOXStyle is the **dogfood project** for PMOS. Every PMOS feature must answer:

> "Does this make managing VOXStyle Video Creator easier?"

---

## Attached Teams

| Agent | Status |
|-------|--------|
| Product Manager | Active |
| UX Designer | Active |
| Architect | Active |
| Software Engineer | Active |
| QA Engineer | Active |
| Documentation Agent | Active |
| Product Intelligence | Active |

---

## Stories Summary

| Status | Count |
|--------|-------|
| Backlog | 4 |
| In Progress | 0 |
| Review | 0 |
| Done | 0 |

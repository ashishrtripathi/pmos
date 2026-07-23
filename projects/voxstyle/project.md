# VOXStyle Video Creator

## Project Identity

| Field | Value |
|-------|-------|
| **Name** | VOXStyle Video Creator |
| **Slug** | voxstyle |
| **Type** | AI Video Creation Platform |
| **Status** | Spec-Only (Pre-Development) |
| **Source** | Local directory |
| **Local Path** | `C:\Users\ashis\VoxStyle Vdieo Creator` |
| **Created** | 2026-07-22 |

---

## What It Is

A local web app (deployable later) that takes a **subject** + **target length**, generates a narrated script broken into scenes, sources/generates visual assets per scene, processes them into a black-and-white newspaper-style halftone cutout look, animates them in Remotion with a shared locked background, syncs everything to a voiceover (TTS or user-uploaded), and renders a single stitched video with background music.

---

## Tech Stack (Planned)

| Layer | Technology |
|-------|------------|
| Frontend | React / Next.js |
| Video Engine | Remotion Studio |
| Script Generation | Claude / LLM (Anthropic) |
| Image Generation | Gemini (fallback) |
| Stock Images | Pexels / Unsplash / Pixabay (MCP) |
| Stock Videos | Pexels (MCP) |
| Image Processing | Python (rembg, onnxruntime, Pillow) |
| Voiceover | Google Cloud TTS (SSML marks + long-audio synthesis) |
| Audio Alignment | Whisper / aeneas (forced aligner) |
| Background Music | Pixabay (free, no attribution) |

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

- ✅ Build spec complete (217 lines)
- ❌ No source code yet
- ❌ No repo on GitHub
- ❌ No tests
- ❌ No documentation beyond spec

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

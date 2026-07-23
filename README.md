# PMOS — The AI-Native Product Operating System

## What is this?

This is the **home directory** for PMOS — the AI-Native Product Operating System.

Every AI agent in AionUi (or Claude Code, Cursor, Windsurf, etc.) can read and write to this directory to manage the entire product lifecycle.

---

## Quick Start

### Run the Full Pipeline

Tell any AI agent:

> "PMOS: run the full import pipeline on https://github.com/user/repo"

This executes 9 steps automatically:

| Step | Action | Output |
|------|--------|--------|
| 1 | GitHub Import | Clone + index codebase |
| 2 | Repository Intelligence | Architecture, domain model, tech stack |
| 3 | Run Application | Detect and launch the app |
| 4 | Customer Journey Discovery | Playwright crawls app like a user |
| 5 | Story Mapping | Screens → Activities → Tasks → Stories |
| 6 | Build Backlog | AI identifies improvements |
| 7 | Agent Kanban | 7 agents with work queues |
| 8 | Product Dashboard | Live health metrics |
| 9 | Continuous Learning | Auto-update on every commit |

### Attach a New Project

> "PMOS: attach project my-app with repo https://github.com/me/my-app"

### Check Status

> "PMOS: what's the status of all projects?"

### Create a Story

> "PMOS: create a story for adding dark mode to voxstyle"

---

## Directory Structure

```
~/.pmos/
├── registry.json                 ← All projects + settings
├── README.md                     ← This file
├── commands/
│   ├── README.md                 ← Command reference
│   └── run-pipeline.md           ← 9-step import pipeline
└── projects/
    └── [project-slug]/
        ├── project.md            ← Project identity
        ├── dashboard.md          ← Live health metrics
        ├── repo/                 ← Cloned source code
        ├── repo-index.json       ← Codebase analysis
        ├── intelligence/         ← Architecture, domain model, etc.
        ├── journey/
        │   ├── personas.md       ← User personas
        │   ├── journey.md        ← Customer journey
        │   ├── screenshots/      ← Playwright captures
        │   └── ux-notes.md       ← UX observations
        ├── stories/
        │   ├── story-map.md      ← Visual story map
        │   ├── backlog/          ← Stories to do
        │   ├── in-progress/      ← Stories being worked on
        │   ├── review/           ← Stories in review
        │   └── done/             ← Completed stories
        ├── agents/               ← 7 AI agent team definitions
        │   ├── product-manager.md
        │   ├── ux-designer.md
        │   ├── architect.md
        │   ├── software-engineer.md
        │   ├── qa-engineer.md
        │   ├── documentation-agent.md
        │   └── product-intelligence.md
        └── specs/                ← Feature specifications
```

---

## The 7 Agent Teams

| Agent | Owns |
|-------|------|
| **Product Manager** | Roadmap, stories, priorities, customer journey |
| **UX Designer** | Journey, wireframes, screens, accessibility |
| **Architect** | Architecture, patterns, tech debt, APIs |
| **Software Engineer** | Implementation, testing, PRs, commits |
| **QA Engineer** | Testing, regression, performance, accessibility |
| **Documentation** | README, architecture, release notes, API docs |
| **Product Intelligence** | Continuous monitoring, anomaly detection |

### The Product Intelligence Agent

This agent doesn't get stories. It watches the repository and asks:

- "This route changed — should the journey be updated?"
- "New component has no story. Was it planned?"
- "API endpoint has no UI. Orphaned or planned?"
- "Feature shipped but no analytics events added."
- "Journey hasn't been updated in 30 days."
- "Test coverage dropped below threshold."

---

## The Dogfood Principle

**VOXStyle Video Creator** is the first project and the reference implementation.

Every feature added to PMOS must first answer:

> "Does this make managing VOXStyle Video Creator easier?"

If not, it isn't MVP.

---

## The Promise

After importing a project, the PM never manually updates Jira again.

Every commit → updates story map → updates journey → updates architecture → updates docs → updates tasks.

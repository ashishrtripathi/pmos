# PMOS — The AI-Native Product Operating System

<p align="center">
  <strong>The AI-Native Product Operating System</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-0.1.0-blue" alt="Version">
  <img src="https://img.shields.io/badge/license-MIT-green" alt="License">
  <img src="https://img.shields.io/badge/status-active-success" alt="Status">
</p>

---

## What is this?

This is the **home directory** for PMOS — the AI-Native Product Operating System.

PMOS uses a high-performance **dual-layer data architecture**:
1. **PostBase Database Layer**: A PostgreSQL-backed, Firebase-compatible JSON document store running locally (`http://localhost:8081/api/db`) for real-time ACID persistence, full CRUD operations across all UI screens, and zero-latency reactive state.
2. **Filesystem Mirroring Layer**: All documents, stories, OKRs, customer journeys, and pipeline definitions are transparently mirrored to human-readable JSON/Markdown files in `~/.pmos/projects/{slug}/`, allowing AI coding agents (Claude Code, Cursor, Windsurf, AionUi) to inspect, edit, and commit state with native Git versioning.

**PMOS never clones your code.** It stores product metadata — analysis, journeys, user story maps, cost calculations, test-harness execution metrics, agent queues — while your source code stays wherever you want it.

---

## Quick Start

### Run the Full Pipeline

Tell any AI agent:

> "PMOS: run the full import pipeline on [project-slug]"

This executes 9 steps automatically:

| Step | Action | Output |
|------|--------|--------|
| 1 | Resolve Source | Find your code wherever it lives |
| 2 | Repository Intelligence | Architecture, domain model, tech stack |
| 3 | Run Application | Detect and launch the app |
| 4 | Customer Journey Discovery | Screens, personas, flow |
| 5 | Story Mapping | Screens → Activities → Tasks → Stories |
| 6 | Build Backlog | AI identifies improvements |
| 7 | Agent Kanban | 7 agents with work queues |
| 8 | Product Dashboard | Live health metrics |
| 9 | Continuous Learning | Auto-update on every commit |

### Attach a New Project

> "PMOS: attach project at C:\Users\ashis\path\to\project"

or

> "PMOS: attach https://github.com/user/repo"

or

> "PMOS: attach a GitHub project"

### Check Status

> "PMOS: what's the status of all projects?"

### Create a Story

> "PMOS: create a story for adding dark mode to voxstyle"

---

## 🔑 Key Design: Code Stays Where You Want It

PMOS is a **metadata layer**. Your code is NOT copied or moved.

| What | Where it lives |
|------|---------------|
| **Your source code** | Wherever you put it (local disk, GitHub, etc.) |
| **PMOS metadata** | `~/.pmos/projects/{slug}/` |

Each project has a `source-location.json` that tells PMOS where to find the code:

```json
{
  "mode": "local",
  "localPath": "C:\\Users\\ashis\\VoxStyle Vdieo Creator\\vox-style-video",
  "repoUrl": "https://github.com/ashishrtripathi/vox-style-video"
}
```

### Access Modes

| Mode | When to Use | How It Works |
|------|-------------|--------------|
| `local` | Code is on your machine | PMOS reads files directly — fast, full access |
| `github` | Code is on GitHub + local clone | PMOS reads locally, syncs with remote |
| `github-only` | No local clone | PMOS uses GitHub API to fetch files on demand |

---

## 📦 Dependencies

### Runtime prerequisites

| Dependency | Version | Purpose |
|------------|---------|---------|
| Node.js | 18.x / 20.x+ | All Node runtimes (pmos-ui, PostBase, OmniRoute) |
| npm | 9+ | Package manager |
| PostgreSQL | 14+ | Datastore for PostBase (`localhost:5432`) |
| Git | 2.x | Repo operations, GitHub sync |

### Services & ports

| Service | Port | How to run |
|---------|------|------------|
| PMOS UI (Next.js) | 3100 | `cd pmos-ui && npm run dev` |
| PostBase backend | 8081 | `cd postbase/backend && npm run start:local` |
| OmniRoute AI gateway | 20128 | `cd OmniRoute && npm run dev` |
| Hermes One Desktop (AionUi backend / aioncore) | 62340 | Launch Hermes One Desktop app |
| LM Studio (local LLM server) | 1234 | LM Studio → Developer tab → Start Server |
| PostgreSQL | 5432 | Local PostgreSQL service |

### pmos-ui package dependencies

**Dependencies:** `next ^14.2` · `react ^18.3` · `react-dom ^18.3` · `@dnd-kit/core ^6.1` · `@dnd-kit/sortable ^8.0` · `@dnd-kit/utilities ^3.2` · `@postbase/client ^0.1` · `class-variance-authority ^0.7` · `clsx ^2.1` · `gray-matter ^4.0` · `lucide-react ^0.400` · `marked ^12.0` · `playwright ^1.61` · `tailwind-merge ^2.3` · `zod ^3.23`

### PostBase backend

`@postbase/backend@0.1.1` — a lightweight, PostgreSQL-backed JSON document store providing a Firebase-compatible REST API. 

- **Local Port:** `8081` (`http://localhost:8081/api/db`)
- **Database Engine:** PostgreSQL 14+ (`localhost:5432`)
- **Collections:** `projects`, `source_location`, `pricing`, `pipeline`, `journeys`, `stories`, `okrs`, `bugs`, `standup`, `intelligence`
- **Schema Migration:** `npm run migrate:up` (uses `node-pg-migrate`)
- **Start Command:** `cd postbase/backend && npm run start:local`

---

## 🛠 Tool Setup Guide

### 1. PostBase — The Backend Database & Document Store

PostBase powers the persistent data layer for all PMOS dashboard interactions, guaranteeing ACID transactions, instant updates, and full CRUD operations.

```
┌─────────────────────────────────────────────────────────────┐
│                       PMOS Dashboard                        │
│                   Next.js App (Port 3100)                   │
└──────────────┬───────────────────────────────┬──────────────┘
               │ 19 CRUD API Routes            │ Mirroring
               ▼                               ▼
┌──────────────────────────────┐ ┌────────────────────────────┐
│      PostBase Backend        │ │     Local Filesystem       │
│  Fast Document DB (Port 8081)│ │  Human-Readable JSON / MD  │
│  Backed by PostgreSQL :5432  │ │  ~/.pmos/projects/{slug}/  │
└──────────────────────────────┘ └────────────────────────────┘
                                               ▲
                                               │ Reads / Writes
                                 ┌─────────────┴──────────────┐
                                 │     AI Coding Agents       │
                                 │ (Claude Code, Cursor, etc) │
                                 └────────────────────────────┘
```

#### Starting PostBase
```bash
# 1. Navigate to the PostBase backend directory
cd ~/.pmos/postbase/backend

# 2. Run initial database migrations
npm run migrate:up

# 3. Start the local server
npm run start:local
# Server is live at http://localhost:8081/api/db
```

#### Dual-Layer Persistence Architecture
Every UI action in PMOS (moving stories on the Kanban board, creating OKRs, logging bugs, adjusting pricing models, modifying persona journeys) performs an atomic write to PostBase and concurrently mirrors the update to local files in `~/.pmos/projects/{slug}/`:
- **PostBase collections**: Store structured JSON documents with fast indexing and atomic queries.
- **Local files**: Enable Git tracking and allow AI agents without network access to read and update project metadata directly.

---

### 2. OmniRoute — the free AI gateway

OmniRoute aggregates the **free tiers of 271+ AI providers** behind a single OpenAI-compatible endpoint, with automatic failover, model routing, and per-provider usage accounting. PMOS and the agent team use it as the default model pool.

```bash
cd <omniroute-checkout>   # e.g. %APPDATA%\AionUi\aionui\conversations\<ws>\OmniRoute
npm install
npm run dev               # dev server  → http://localhost:20128
# or: npm start           # production
```

- **Data & keys:** `%APPDATA%\omniroute\` — `server.env` (encrypted provider API keys), `storage.sqlite` (usage/accounting, provider health)
- **Client setup:** any OpenAI-compatible client can use `http://localhost:20128` as its base URL
- **Electron app:** `npm run electron:dev` for the desktop UI
- Verify: `curl http://localhost:20128` or the provider/usage dashboard in the web UI

### 3. OpenCode — AI coding agent (CLI)

OpenCode is the terminal-first coding agent used for implementation work.

```bash
npm install -g opencode    # or: curl -fsSL https://opencode.ai/install
opencode --version         # e.g. v1.17.9
cd <your-project> && opencode
```

- **Config:** `~/.config/opencode/opencode.jsonc`
- **MCP servers included:**
  - `stock-images` — `npx stock-images-mcp` · env: `PEXELS_API_KEY`, `UNSPLASH_API_KEY`, `PIXABAY_API_KEY`
  - `stock-videos` — `npx mcp-pexels` · env: `PEXELS_API_KEY`
- **Point OpenCode at OmniRoute or LM Studio** by setting a custom provider with `baseURL`:
  - OmniRoute: `http://localhost:20128` (cloud-pooled, zero cost)
  - LM Studio: `http://localhost:1234/v1` (fully local/offline)

### 4. Running locally with LM Studio (offline)

Fully local option — no cloud keys needed.

1. **Install** [LM Studio](https://lmstudio.ai) (`%APPDATA%\LM Studio`)
2. **Download a model** from the model hub (e.g. Llama 3.x, Mistral, Qwen)
3. **Load the model**, then open the **Developer** tab → **Start Server** → OpenAI-compatible endpoint at `http://localhost:1234/v1`
4. **Point tools at it:**
   - OpenCode: `baseURL: http://localhost:1234/v1`, model = loaded model id
   - OmniRoute: register LM Studio as a local provider (`http://localhost:1234/v1`)
   - Sanity check: `curl http://localhost:1234/v1/models`

---

## 🎯 Vision

PMOS is an open-source **Product Management Operating System** that acts as the orchestration layer between Product Managers, UX Designers, AI Coding Agents, GitHub, and deployment environments.

This is **not** another project management tool like Jira or Linear. Instead, PMOS becomes the operating system that manages the complete product lifecycle from customer discovery to production while keeping every artifact connected.

### How It Works

```
You → PMOS UI / AI Agent → PostBase & ~/.pmos → Coordinated Agent Execution
```

PostBase handles reactive UI persistence while human-readable files keep AI coding agents fully informed.

---

## 🧭 Core Philosophy

Vibe Coding begin with chat. Traditional Coding begins with planning and agile methodologies. Product Management begins with the customer  **PMOS tries to bridge the gap of all three.**

Every artifact must be connected through the Product Knowledge Graph:

```
Customer → Persona → Journey → Journey Step → Activity →
User Story Map → User Story → Acceptance Criteria →
Design → Implementation Plan → GitHub Branch →
Pull Request → Deployment → Analytics → Customer Feedback
```

> **Every feature in production should be traceable back to the original customer problem.**
> **Likewise every customer problem should be traceable to the implementation that solved it.**

---

## Directory Structure

```
~/.pmos/
├── registry.json                    ← All projects + settings
├── README.md                        ← This file
├── commands/
│   ├── README.md                    ← Command reference
│   ├── attach-project.md            ← Attach GitHub/local project
│   └── run-pipeline.md              ← 9-step import pipeline
├── pmos-ui/                         ← Next.js 14 Dashboard UI
│   ├── src/
│   │   ├── app/                     ← Pages (Dashboard, Journey, Story Map, Kanban)
│   │   ├── components/              ← UI components (PersonaJourney, StoryMapBoard)
│   │   └── lib/                     ← PMOS file reader (pmos.ts)
│   └── package.json
└── projects/
    └── [project-slug]/
        ├── project.md               ← Project identity
        ├── dashboard.md             ← Live health metrics
        ├── source-location.json     ← WHERE your code lives (not the code!)
        ├── repo-index.json          ← Codebase file index
        ├── intelligence/            ← Architecture, domain model, etc.
        ├── journey/
        │   └── persona-{name}.md    ← Per-persona customer journeys
        ├── stories/
        │   ├── backlog/             ← Stories to do
        │   ├── in-progress/         ← Stories being worked on
        │   ├── review/              ← Stories in review
        │   └── done/                ← Completed stories
        ├── agents/                  ← 7 AI agent team definitions
        └── specs/                   ← Feature specifications
```

---

## 🤖 The 7 Agent Teams

| Agent | Owns |
|-------|------|
| **Product Manager** | Roadmap, stories, priorities, customer journey |
| **UX Designer** | Journey, wireframes, screens, flows, accessibility |
| **Architect** | Architecture, patterns, tech debt, APIs |
| **Software Engineer** | Implementation, testing, PRs, commits |
| **QA Engineer** | Testing, regression, performance, accessibility |
| **Documentation** | README, architecture, release notes, API docs |
| **Product Intelligence** | Continuous monitoring, anomaly detection |

### The Product Intelligence Agent

The secret weapon. It continuously watches the repo and asks:

- "The upload flow changed. Should the customer journey be updated?"
- "A new route was added, but no user story references it."
- "This API has no visible UI. Is it orphaned or planned?"
- "Three new components were introduced without design approval."
- "The story map still shows an old onboarding flow."
- "This feature shipped, but there are no analytics events associated with it."

---

## 🐕 The Dogfood Principle

**PMOS itself is the primary project and reference implementation.**

PMOS is built, planned, tracked, and iterated on using PMOS. Every feature, story, bug fix, OKR, and customer journey added to PMOS is managed and executed through PMOS itself.

Every feature added to PMOS must first answer:

> "Does this make managing and evolving PMOS itself easier, faster, and more reliable?"

If not, it probably isn't MVP. Real-world validation through self-hosting and continuous dogfooding instead of designing in the abstract.

---

## 🚀 Primary Goal

Build an AI-native Product Management platform where Product Managers can:

| Capability | Description |
|------------|-------------|
| 🔍 **Discover** | Customer problems through research, interviews, and data analysis |
| 🗺️ **Generate** | Customer journeys and user story maps |
| 📊 **Prioritize** | Work using RICE, WSJF, Kano, and other frameworks |
| 📋 **Plan** | Generate implementation plans with full traceability |
| 🎨 **Review** | Designs with integrated AI design review |
| 🤖 **Assign** | Work to AI coding agents with context |
| 👁️ **Monitor** | Coding progress in real-time |
| 🎬 **Demo** | Review functional demos instead of code |
| ✅ **Approve** | Releases with full audit trail |
| 📈 **Analyze** | Product success with connected analytics |

---

## 🎨 PMOS Dashboard UI

The PMOS Dashboard (`pmos-ui/`) provides a rich, interactive visual interface for product managers:

| Page | What it does |
|------|-------------|
| **Dashboard** | Overview of all projects with health metrics, stories, and agent status |
| **Setup** | Configure source mode (`local`, `github`, `github-only`), runtime port, and custom developer/AI token rates (including $0.00 zero-cost models) |
| **Pipeline** | 9-step pipeline with progress tracking and live status detection |
| **Journey** | Per-persona customer journey boards with screenshot capture and emotional mapping |
| **Story Map** | Jeff Patton-style story map matrix with hours and token estimation |
| **Kanban** | Agent-assigned work board with direct **"Start Story Execution"** test-harness button and live cycle-time tracking |
| **OKRs** | Strategic Objectives and Key Results with live progress sliders |
| **Bugs** | Bug triage matrix with severity ratings and quick-fix dispatch |
| **Standup** | Automated daily standup report generator and snapshot archive |
| **Intelligence** | Architecture, tech stack, code quality, and gap analysis |

---

## 🛠️ Getting Started

### Prerequisites

- **Node.js 18+** / npm 9+
- **PostgreSQL 14+** (running on `localhost:5432`)
- Any AI agent (Claude Code, Cursor, Windsurf, AionUi)

### Quick Start

#### Step 1: Clone Repository
```bash
git clone https://github.com/ashishrtripathi/pmos.git ~/.pmos
```

#### Step 2: Start PostBase Database
```bash
cd ~/.pmos/postbase/backend
npm install
npm run migrate:up
npm run start:local
# PostBase runs at http://localhost:8081/api/db
```

#### Step 3: Start PMOS Dashboard
```bash
cd ~/.pmos/pmos-ui
npm install
npm run dev
# Open http://localhost:3100
```

#### Optional: Desktop One-Click Launcher (`start-pmos.bat`)
A Windows batch launcher can verify ports `8081` (PostBase) and `3100` (Next.js) and start any unstarted instances in background terminal windows:
```cmd
@echo off
echo Starting PMOS Stack...
:: Check PostBase on port 8081
netstat -ano | findstr /R /C:":8081 " >nul
if %errorlevel% neq 0 (
    start "PostBase Backend" cmd /k "cd /d C:\Users\ashis\.pmos\postbase\backend && npm run start:local"
)
:: Check PMOS UI on port 3100
netstat -ano | findstr /R /C:":3100 " >nul
if %errorlevel% neq 0 (
    start "PMOS Dashboard" cmd /k "cd /d C:\Users\ashis\.pmos\pmos-ui && npx next dev --port 3100 --hostname 0.0.0.0"
)
```

### Three Product Creation Modes

#### 1. Existing GitHub Repository Mode
**Input:** GitHub Repository URL or local path

PMOS automatically:
- Analyzes routes, components, navigation
- Runs the application locally
- Captures screenshots
- Generates customer journey, story map, backlog, architecture

#### 2. Existing Website Mode
**Input:** Website URL

PMOS automatically:
- Crawls every page and discovers navigation
- Identifies CTAs, forms, and customer flows
- Captures screenshots and builds customer journey

#### 3. Greenfield Product Mode
**Input:** Product idea, problem statement, target audience

PMOS automatically generates:
- Personas, Jobs-To-Be-Done, Customer Journey
- Story Map, Backlog, Roadmap
- Architecture, Database Schema, API Design

---

## 📖 Guiding Principles

1. **Customer Journey is the source of truth**
2. **Story Maps are generated from the journey**
3. **Stories generate implementation plans**
4. **AI Coding Agents execute the plans**
5. **PMs review behavior rather than code**
6. **Everything is traceable**
7. **Documentation is executable**
8. **No duplicate information**
9. **Everything exists only once inside the Product Graph**

---

## 📜 License

This project is licensed under the MIT License.

---

## 🙏 Acknowledgments

This project draws architectural inspiration from:

- **gstack by Garry Tan** — AI agent framework and workflow architecture for rapid full-stack software building  
  <https://github.com/garrytan/gstack>
- **AionUI** — AI conversation platform with skill architecture and shared context  
  <https://github.com/aionui/aionui>
- **OmniRoute** — Free AI gateway aggregating 271+ providers behind a single OpenAI-compatible endpoint  
  <https://github.com/omniroute/omniroute>
- **Jeff Patton's Story Mapping** — User story mapping methodology  
  <https://www.jpattonassociates.com/user-story-mapping/>
- **OKR Framework** — Objectives and Key Results for goal-setting and alignment  
  <https://github.com/google/okr>
- **PostBase** — Postgres-backed JSON document store for application state  
  <https://github.com/postbase/postbase>
- **Graphify** — Graph-based knowledge extraction from codebases  
  <https://github.com/graphify-ai/graphify>

PMOS expands these ideas into a complete AI-native product lifecycle operating system focused on Product Management first.

---

<p align="center">
  Built with ❤️ by the PMOS Community
</p>

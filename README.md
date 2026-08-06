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

Every AI agent in AionUi (or Claude Code, Cursor, Windsurf, etc.) can read and write to this directory to manage the entire product lifecycle.

**PMOS never clones your code.** It stores metadata about your projects — analysis, stories, journeys, agent definitions — while your source code stays wherever you want it.

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

**Dev dependencies:** `typescript ^5.4` · `tailwindcss ^3.4` · `eslint ^8.57` · `eslint-config-next ^14.2` · `autoprefixer ^10.4` · `postcss ^8.4` · `@types/node ^20.14` · `@types/react ^18.3` · `@types/react-dom ^18.3`

### PostBase backend

`@postbase/backend@0.1.1` — a Postgres-backed JSON document store. Schema: `npm run migrate:up` (uses `node-pg-migrate`). Serve on port 8081: `npm run start:local`.

---

## 🛠 Tool Setup Guide

### 1. OmniRoute — the free AI gateway

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

### 2. OpenCode — AI coding agent (CLI)

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

### 3. Hermes One Desktop (AionUi)

Hermes One Desktop is the desktop companion that hosts PMOS conversations, the agent team assistants, and the **PMOS Story Worker** scheduled task (runs every 10 minutes and dispatches stories to agents automatically).

- **Backend:** bundled `aioncore` server at `http://127.0.0.1:62340`
- **Auth headers** the backend expects: `x-aionui-user-id`, `x-aionui-runtime-token`, `x-aionui-conversation-id` (exported via `AIONUI_USER_ID`, `AIONUI_RUNTIME_TOKEN`, `AIONUI_CONVERSATION_ID`, `AIONUI_BASE_URL`)
- **Data:**
  - `~/.hermes/` → `kanban.db` (Hermes kanban), `skills/`, `logs/`
  - `%APPDATA%\hermes-desktop\` → Electron profile
  - `%APPDATA%\AionUi\aionui\conversations\<workspace>\` → conversation workspaces (the OmniRoute checkout lives here)
- **Cron via CLI:**
  ```powershell
  & aioncore.exe config cron current list
  & aioncore.exe config cron current update < payload.json
  ```
  Update payload shape: `{ "job_id": "...", "name": "...", "schedule": "*/10 * * * *", "schedule_description": "Every 10 minutes", "message": "<task instruction text>" }`

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
You → Tell AI Agent → Agent reads ~/.pmos → Agent acts on projects
```

No servers. No databases. No login. Just files that any AI can understand.

---

## 🧭 Core Philosophy

Traditional tools begin with tickets. **PMOS begins with the customer.**

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

**VOXStyle Video Creator** is the first project and the reference implementation.

Every feature added to PMOS must first answer:

> "Does this make managing VOXStyle Video Creator easier?"

If not, it probably isn't MVP. Real-world validation instead of designing in the abstract.

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

The PMOS Dashboard (`pmos-ui/`) provides a visual interface for product managers:

| Page | What it does |
|------|-------------|
| **Dashboard** | Overview of all projects with health, stories, agent status |
| **Setup** | Configure source location (local/GitHub modes) |
| **Pipeline** | 9-step pipeline with progress tracking |
| **Journey** | Per-persona customer journey boards (horizontal, left-to-right) |
| **Story Map** | Jeff Patton-style story map with drag-and-drop |
| **Kanban** | 7 agent columns with drag-and-drop story assignment |
| **Intelligence** | Architecture, tech stack, features, quality analysis |

```bash
cd ~/.pmos/pmos-ui
npm install
npm run dev
# Open http://localhost:3000
```

---

## 🛠️ Getting Started

### Prerequisites

- Node.js 18+
- Any AI agent (AionUi, Claude Code, Cursor, Windsurf)

### Quick Start

```bash
# Clone the repository
git clone https://github.com/ashishrtripathi/pmos.git ~/.pmos

# Install PMOS UI
cd ~/.pmos/pmos-ui
npm install

# Start the dashboard
npm run dev
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

- **Corey Haines' Marketing Skills** — AI skill architecture and shared context
- **Jeff Patton's Story Mapping** — User story mapping methodology
- **Product Manager Skills Repository** — PM skill definitions
- **PM Brain** — Product management knowledge

PMOS expands these ideas into a complete AI-native product lifecycle operating system focused on Product Management first.

---

<p align="center">
  Built with ❤️ by the PMOS Community
</p>

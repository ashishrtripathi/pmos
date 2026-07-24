# Command: `attach-project`

## Purpose

Let users select a project (GitHub repo or local directory) and attach it to PMOS for management. **PMOS never forces a clone** — it reads code from wherever it lives.

## How It Works

### Option A: GitHub Repository

Tell your AI agent:

> "PMOS: attach a GitHub project"

The agent will:

1. **List your GitHub repos**
   - Read GitHub token from environment or config
   - Call GitHub API: `GET /user/repos`
   - Display repos as a numbered list

2. **Let you select one**
   - Show repo name, description, language, stars, last updated
   - Ask "Which repo? (enter number or name)"

3. **Analyze and attach**
   - Ask: "Clone to PMOS, or analyze in-place at a local path?"
   - Clone (optional) or point to local path
   - Run Steps 2-9 of the pipeline

### Option B: Local Directory

Tell your AI agent:

> "PMOS: attach project at C:\Users\ashis\path\to\project"

The agent will:

1. **Verify the directory exists**
2. **Read the source code from that path directly** (no copying)
3. **Create PMOS metadata** in `~/.pmos/projects/{slug}/`
4. **Run the full analysis pipeline**

### Option C: GitHub URL

Tell your AI agent:

> "PMOS: attach https://github.com/user/repo"

The agent will:

1. **Parse the URL**
2. **Ask**: "Clone to a local path, or analyze from GitHub API?"
3. **Run the full pipeline**

---

## Source Resolution Modes

PMOS supports 3 ways to access project code:

| Mode | When to Use | How It Works |
|------|-------------|--------------|
| **`local`** | Code lives on your machine | PMOS reads files directly from `localPath` |
| **`github`** | Code is on GitHub, you have a local clone | PMOS reads from `localPath` + syncs metadata from GitHub API |
| **`github-only`** | No local clone, just browse | PMOS uses GitHub API to fetch file contents on demand |

### Storage Model

PMOS metadata lives at `~/.pmos/projects/{slug}/`:
```
~/.pmos/projects/{slug}/
├── project.md                 ← PMOS project definition
├── dashboard.md               ← Health metrics
├── source-location.json       ← WHERE the code lives (not the code itself)
├── repo-index.json            ← Generated file index
├── intelligence/              ← AI-generated analysis
├── journey/                   ← Customer journey
├── stories/                   ← Story map + backlog
├── agents/                    ← Agent definitions
└── specs/                     ← Feature specs
```

**Key insight**: PMOS stores *metadata about your code*, not the code itself. Your code stays where you put it.

---

## GitHub Auth Setup

### Option 1: Environment Variable (Recommended)
```bash
export PMOS_GITHUB_TOKEN=ghp_xxxxx
```

### Option 2: PMOS Config
Tell your agent:
> "PMOS: set GitHub token to ghp_xxxxx"

### Option 3: GitHub CLI
If `gh` is installed, PMOS uses it automatically:
```bash
gh auth status
gh auth login
```

---

## Agent Instructions

When a user asks to attach a project, follow these steps:

### Step 1: Determine Source

Ask or detect:
- Do they have a GitHub URL?
- Do they want to pick from their repos?
- Do they have a local directory?
- Where does the code currently live?

### Step 2: Resolve Code Location

**For local code (already on disk):**
```powershell
# Verify the path exists
Test-Path "{local-path}"

# Check for code indicators
Get-ChildItem "{local-path}" | Where-Object {
    $_.Name -match "package\.json|tsconfig\.json|Cargo\.toml|go\.mod|requirements\.txt|\.git"
} | Select-Object Name
```

**For GitHub repos:**
```bash
# Option A: User has a local clone — use it
# Just ask: "Where is this repo on your machine?"

# Option B: Clone to a user-chosen path (NOT inside PMOS)
# Ask: "Where would you like to clone this repo?"
# Default suggestion: ~/Projects/{repo-name} or ~/Code/{repo-name}

# Option C: GitHub-only (no clone)
# Store repo URL and use GitHub API for file access
```

**Write `source-location.json`:**
```json
{
  "mode": "local",
  "localPath": "C:\\Users\\ashis\\VoxStyle Vdieo Creator\\vox-style-video",
  "repoUrl": "https://github.com/ashishrtripathi/vox-style-video",
  "resolvedAt": "2026-07-22T10:00:00Z",
  "lastAnalyzed": null
}
```

### Step 3: Create PMOS Project Structure

Create the PMOS directory at `~/.pmos/projects/{slug}/`:

```
~/.pmos/projects/{slug}/
├── project.md
├── dashboard.md
├── source-location.json
├── repo-index.json          ← Populated by pipeline
├── intelligence/            ← Populated by pipeline
│   ├── architecture.md
│   ├── domain-model.md
│   ├── tech-stack.md
│   ├── features.md
│   ├── code-quality.md
│   └── improvements.md
├── journey/
│   ├── personas.md
│   └── journey.md
├── stories/
│   ├── story-map.md
│   ├── backlog/
│   ├── in-progress/
│   ├── review/
│   └── done/
├── agents/
│   ├── product-manager.md
│   ├── ux-designer.md
│   ├── architect.md
│   ├── software-engineer.md
│   ├── qa-engineer.md
│   ├── documentation-agent.md
│   └── product-intelligence.md
└── specs/
```

### Step 4: Update Registry

Add to `~/.pmos/registry.json`:
```json
{
  "slug": "{slug}",
  "name": "{repo-name}",
  "source": "local" | "github" | "github-only",
  "repoUrl": "https://github.com/..." | null,
  "localPath": "C:\\...\\project" | null,
  "path": "~/.pmos/projects/{slug}",
  "status": "attached",
  "attachedAt": "{timestamp}"
}
```

### Step 5: Run Pipeline

Execute `~/.pmos/commands/run-pipeline.md`:
- Step 2: Repository Intelligence (reads from source-location.json)
- Step 3: Run Application (if possible)
- Step 4: Customer Journey Discovery
- Step 5: Story Mapping
- Step 6: Build Backlog
- Step 7: Agent Kanban
- Step 8: Product Dashboard
- Step 9: Continuous Learning

---

## Example Interactions

### Local Directory (No Clone Needed)
```
User: PMOS: attach project at C:\Users\ashis\VoxStyle Vdieo Creator\vox-style-video

Agent: Found vox-style-video — this appears to be a full Remotion + React project.
  Source mode: local
  Path: C:\Users\ashis\VoxStyle Vdieo Creator\vox-style-video
  ✔ Created PMOS project structure at ~/.pmos/projects/voxstyle/
  ✔ Analyzing codebase from local path...
  ... (Steps 2-9)
  ✔ Done! VOXStyle is now managed by PMOS.
     Code lives at: C:\Users\ashis\VoxStyle Vdieo Creator\vox-style-video
     PMOS metadata at: ~/.pmos/projects/voxstyle/
```

### GitHub Repo (Clone to Custom Path)
```
User: PMOS: attach https://github.com/ashishrtripathi/vox-style-video

Agent: Found vox-style-video on GitHub.
  Where would you like the local clone?
  Suggested: ~/Code/vox-style-video

User: ~/Projects/vox-style-video

Agent: Cloning to C:\Users\ashis\Projects\vox-style-video...
  ✔ Cloned.
  ✔ Creating PMOS project structure...
  ... (Steps 2-9)
  ✔ Done!
```

### List and Select
```
User: PMOS: attach a GitHub project

Agent: I found 12 repositories on your GitHub:

  1. pmos (45 stars) - The AI-Native Product Operating System
  2. voxstyle-api (12 stars) - VOXStyle Video Creator API
  3. my-blog (8 stars) - Personal blog built with Next.js
  ...

  Which repo would you like to attach? (enter number or name)

User: 2

Agent: Attaching voxstyle-api...
  Where is this repo on your machine? (or press Enter to clone)
  > ~/Code/voxstyle-api

  ✔ Resolved at C:\Users\ashis\Code\voxstyle-api
  ... (Steps 2-9)
  ✔ Done!
```

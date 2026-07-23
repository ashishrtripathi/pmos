# Command: `attach-project`

## Purpose

Let users select a project (GitHub repo or local directory) and attach it to PMOS.

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

3. **Clone and analyze**
   - Clone to `~/.pmos/projects/{slug}/repo/`
   - Run Step 2-9 of the pipeline

### Option B: Local Directory

Tell your AI agent:

> "PMOS: attach project at C:\Users\ashis\path\to\project"

The agent will:

1. **Verify the directory exists**
2. **Create a symlink or reference** in `~/.pmos/projects/{slug}/`
3. **Run the analysis pipeline**

### Option C: GitHub URL

Tell your AI agent:

> "PMOS: attach https://github.com/user/repo"

The agent will:

1. **Parse the URL**
2. **Clone the repository**
3. **Run the full pipeline**

---

## GitHub Auth Setup

PMOS needs read access to list and clone your repos.

### Option 1: Environment Variable (Recommended)
```bash
# Add to your shell profile
export PMOS_GITHUB_TOKEN=ghp_xxxxx
```

### Option 2: PMOS Config
Tell your agent:
> "PMOS: set GitHub token to ghp_xxxxx"

The agent stores it in `~/.pmos/config.json` (gitignored).

### Option 3: GitHub CLI
If `gh` is installed, PMOS uses it automatically:
```bash
gh auth status  # Check if logged in
gh auth login   # If not
```

---

## Agent Instructions

When a user asks to attach a project, follow these steps:

### Step 1: Determine Source

Ask or detect:
- Do they have a GitHub URL?
- Do they want to pick from their repos?
- Do they have a local directory?

### Step 2: Get Repository

**For GitHub:**
```bash
# List repos
curl -s -H "Authorization: token {TOKEN}" \
  "https://api.github.com/user/repos?per_page=100&sort=updated" \
  | jq '.[] | {name, description, language, stargazers_count, updated_at}'

# Clone
git clone {repo-url} ~/.pmos/projects/{slug}/repo/
```

**For local:**
```bash
# Create reference (copy or symlink)
# On Windows:
mklink /D "C:\Users\{user}\.pmos\projects\{slug}\repo" "{local-path}"

# On Mac/Linux:
ln -s "{local-path}" ~/.pmos/projects/{slug}/repo
```

### Step 3: Create Project Structure

Create the standard PMOS project directory:
```
~/.pmos/projects/{slug}/
├── project.md
├── dashboard.md
├── repo/                    ← Source code (clone or symlink)
├── repo-index.json          ← Will be populated by pipeline
├── intelligence/            ← Will be populated by pipeline
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
  "source": "github" | "local",
  "repoUrl": "{url}" | null,
  "localPath": "{path}" | null,
  "path": "~/.pmos/projects/{slug}",
  "status": "attached",
  "attachedAt": "{timestamp}"
}
```

### Step 5: Run Pipeline

Execute `~/.pmos/commands/run-pipeline.md`:
- Step 2: Repository Intelligence
- Step 3: Run Application (if possible)
- Step 4: Customer Journey Discovery
- Step 5: Story Mapping
- Step 6: Build Backlog
- Step 7: Agent Kanban
- Step 8: Product Dashboard
- Step 9: Continuous Learning

---

## Example Interactions

### List and Select
```
User: PMOS: attach a GitHub project

Agent: I found 12 repositories on your GitHub:

  1. pmos (45 stars) - The AI-Native Product Operating System
  2. voxstyle-api (12 stars) - VOXStyle Video Creator API
  3. my-blog (8 stars) - Personal blog built with Next.js
  4. design-system (23 stars) - Shared component library
  ...

  Which repo would you like to attach? (enter number or name)

User: 2

Agent: Attaching voxstyle-api...
  ✓ Cloned to ~/.pmos/projects/voxstyle-api/repo/
  ✓ Created project structure
  ✓ Running analysis pipeline...
  ... (Steps 2-9)
  ✓ Done! VOXStyle API is now managed by PMOS.
```

### Direct URL
```
User: PMOS: attach https://github.com/user/my-project

Agent: Attaching my-project...
  ✓ Cloned to ~/.pmos/projects/my-project/repo/
  ✓ Created project structure
  ✓ Running analysis pipeline...
  ... (Steps 2-9)
  ✓ Done!
```

### Local Directory
```
User: PMOS: attach project at C:\Users\ashis\VoxStyle Vdieo Creator

Agent: Found vox-style-video-app-spec.md — this appears to be a build spec.
  ✓ Linked to ~/.pmos/projects/voxstyle/repo/
  ✓ Created project structure
  ✓ Running analysis pipeline...
  ... (Steps 2-9)
  ✓ Done! Note: No source code found — only a spec document.
    You may want to create the project first, then re-attach.
```

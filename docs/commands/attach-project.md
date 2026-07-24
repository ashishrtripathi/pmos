# Command: Attach Project

## Purpose

Let users select a project (GitHub repo or local directory) and attach it to PMOS.

---

## Three Ways to Attach

### 1. Pick from GitHub Repos

```
> "PMOS: attach a GitHub project"
```

Agent lists your repos, you pick one.

### 2. Paste a URL

```
> "PMOS: attach https://github.com/user/repo"
```

Agent clones and analyzes.

### 3. Local Directory

```
> "PMOS: attach project at C:\Users\ashis\my-project"
```

Agent symlinks and analyzes.

---

## GitHub Auth

PMOS needs read access to list your repos.

### Option 1: Environment Variable
```bash
export PMOS_GITHUB_TOKEN=ghp_xxxxx
```

### Option 2: PMOS Config
```
> "PMOS: set GitHub token to ghp_xxxxx"
```
Stored in `~/.pmos/config.json` (gitignored).

### Option 3: GitHub CLI
If `gh` is installed, PMOS uses it automatically.

---

## Agent Instructions

### When user says "PMOS: attach a GitHub project"

1. Read token from env or `~/.pmos/config.json`
2. Call GitHub API:
   ```bash
   curl -s -H "Authorization: token {TOKEN}" \
     "https://api.github.com/user/repos?per_page=100&sort=updated" \
     | jq '.[] | {name, description, language, stargazers_count, updated_at}'
   ```
3. Display numbered list with name, description, language, stars
4. Ask "Which repo? (enter number or name)"
5. Clone selected repo
6. Create project structure at `~/.pmos/projects/{slug}/`
7. Add to `~/.pmos/registry.json`
8. Run 9-step pipeline from `commands/run-pipeline.md`

### When user says "PMOS: attach https://github.com/user/repo"

1. Parse URL to extract owner/repo
2. Clone to `~/.pmos/projects/{slug}/repo/`
3. Create project structure
4. Add to registry
5. Run 9-step pipeline

### When user says "PMOS: attach project at {path}"

1. Verify directory exists
2. Create symlink to `~/.pmos/projects/{slug}/repo`
3. Create project structure
4. Add to registry with `source: "local"`
5. Run 9-step pipeline

---

## Project Structure Created

```
~/.pmos/projects/{slug}/
├── project.md          ← Project identity
├── dashboard.md        ← Live health metrics
├── repo/               ← Source code (clone or symlink)
├── repo-index.json     ← Codebase analysis
├── intelligence/       ← Architecture, domain model
├── journey/
│   ├── personas.md
│   └── journey.md
├── stories/
│   ├── backlog/
│   ├── in-progress/
│   ├── review/
│   └── done/
├── agents/             ← 7 agent team definitions
└── specs/
```

---

## Registry Entry

```json
{
  "slug": "{slug}",
  "name": "{repo-name}",
  "source": "github" | "local",
  "repoUrl": "{url}" | null,
  "localPath": "{path}" | null,
  "path": "~/.pmos/projects/{slug}",
  "status": "attached",
  "attachedAt": "{timestamp}",
  "teams": [...],
  "stories": { "backlog": 0, "inProgress": 0, "review": 0, "done": 0 }
}
```

---

## Example

```
User: PMOS: attach a GitHub project

Agent: Finding your GitHub repositories...

  1. pmos          (45 ⭐) The AI-Native Product Operating System
  2. voxstyle-api  (12 ⭐) VOXStyle Video Creator API
  3. my-blog        (8 ⭐) Personal blog built with Next.js
  4. design-system (23 ⭐) Shared component library
  5. pmos-docs      (5 ⭐) PMOS documentation

  Which repo? (enter number or name)

User: 2

Agent: ✓ Attaching voxstyle-api
  → Cloned to ~/.pmos/projects/voxstyle-api/repo/
  → Created project structure
  → Added to registry
  → Running 9-step pipeline...
    Step 2: Analyzing 147 files...
    Step 3: Starting application on port 3000...
    Step 4: Crawling screens with Playwright...
    Step 5: Mapping 23 screens to stories...
    Step 6: Found 47 improvement opportunities...
    Step 7: Assigning to 7 agent teams...
    Step 8: Generating dashboard...
    Step 9: Setting up continuous learning...

  ✓ Done! VOXStyle API is now managed by PMOS.
    → 12 journey steps, 23 screens, 89 stories
    → 7 agents active
    → Dashboard: ~/.pmos/projects/voxstyle-api/dashboard.md
```

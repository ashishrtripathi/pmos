# PMOS — The Complete Pipeline

## How to Execute

Tell any AI agent:

> "PMOS: run the full import pipeline on [project-slug]"

The agent reads this file and executes steps 1-9 sequentially.

**PMOS never forces a clone.** It reads code from wherever `source-location.json` points.

---

## Prerequisites

Before running, PMOS must know where the code lives. Check `~/.pmos/projects/{slug}/source-location.json`:

```json
{
  "mode": "local",
  "localPath": "C:\\Users\\ashis\\VoxStyle Vdieo Creator\\vox-style-video",
  "repoUrl": "https://github.com/ashishrtripathi/vox-style-video"
}
```

| Mode | Reads From | Notes |
|------|-----------|-------|
| `local` | `localPath` on disk | Fast, full access |
| `github` | `localPath` + GitHub API | Syncs with remote |
| `github-only` | GitHub API only | No local clone, slower |

---

## Step 1: Resolve Source

### Agent Instructions
1. Read `source-location.json` for the project
2. If `mode == "local"` or `mode == "github"`: verify `localPath` exists
3. If `mode == "github-only"`: prepare to use GitHub API
4. If `localPath` doesn't exist: ask user to provide the correct path

### Source Resolution
```powershell
# Check if local path exists
$source = Get-Content "~/.pmos/projects/{slug}/source-location.json" | ConvertFrom-Json
if (Test-Path $source.localPath) {
    Write-Host "Code found at: $($source.localPath)"
} else {
    Write-Host "Path not found. Asking user for updated path..."
    # Prompt user, update source-location.json
}
```

### Output
Update `source-location.json` with `lastResolvedAt` timestamp.
If path changed, update `localPath` and re-run all subsequent steps.

---

## Step 2: Repository Intelligence

### Agent Instructions
Read the code from the resolved path to generate intelligence.

### File Discovery
```powershell
# Using local path from source-location.json
$root = $source.localPath

# Find all relevant source files (exclude node_modules, dist, .git)
Get-ChildItem -Path $root -Recurse -File | Where-Object {
    $_.FullName -notlike "*node_modules*" -and
    $_.FullName -notlike "*dist*" -and
    $_.FullName -notlike "*.git*" -and
    $_.FullName -notlike "*__pycache__*" -and
    $_.Extension -match "\.(ts|tsx|js|jsx|json|md|yaml|yml|py|go|rs|rb|java|css|scss)$"
} | Select-Object -First 500 FullName
```

### Key Files to Read
| File | Purpose |
|------|---------|
| `README.md` | Project overview, setup instructions |
| `package.json` | Dependencies, scripts, tech stack |
| `tsconfig.json` | TypeScript configuration |
| `.env.example` | Environment variables needed |
| `docker-compose.yml` | Container setup |
| `Dockerfile` | Container build |
| `remotion.config.*` | Remotion config (if video project) |
| `next.config.*` | Framework config |
| `prisma/schema.prisma` | Database schema |
| `tailwind.config.*` | Styling |
| Route files | `app/**/page.tsx`, `pages/**/*.tsx`, `src/routes/**` |
| Component files | `components/**/*.tsx`, `src/components/**/*.tsx` |
| API files | `app/api/**/route.ts`, `pages/api/**/*.ts` |
| Pipeline files | `src/pipeline/**/*.ts`, `scripts/**/*.py` |
| Config files | `webpack.config.*`, `babel.config.*`, `vite.config.*` |
| Test files | `**/*.test.*`, `**/*.spec.*`, `__tests__/**` |

### Source Code Reading
```powershell
# Read a specific file from local path
$filePath = Join-Path $source.localPath "package.json"
Get-Content $filePath

# Read source files
$srcPath = Join-Path $source.localPath "src"
Get-ChildItem -Path $srcPath -Recurse -File -Filter "*.ts" | ForEach-Object {
    Write-Host "--- $($_.Name) ---"
    Get-Content $_.FullName | Select-Object -First 100
}
```

### Generate
1. Architecture diagram (Mermaid)
2. Domain model (entities and relationships)
3. Technology stack summary
4. Existing feature inventory
5. Missing documentation list
6. Code quality assessment

### Output
Create `~/.pmos/projects/{slug}/intelligence/`:
```
intelligence/
├── architecture.md        ← Architecture overview + diagram
├── domain-model.md        ← Entities and relationships
├── tech-stack.md          ← Complete technology inventory
├── features.md            ← Existing features mapped
├── api-docs.md            ← API documentation
├── missing-docs.md        ← Documentation gaps
├── code-quality.md        ← Quality assessment
└── improvements.md        ← Identified improvements
```

---

## Step 3: Run the Application

### Agent Instructions
Only attempt if source-location mode is `local` or `github` (has a local clone).

```powershell
$root = $source.localPath

# Detection Logic
if (Test-Path (Join-Path $root "docker-compose.yml")) {
    Push-Location $root
    docker compose up -d
    # Wait for health check
    Pop-Location
} elseif (Test-Path (Join-Path $root "package.json")) {
    Push-Location $root
    npm install
    npm run dev
    # Wait for localhost to respond
    Pop-Location
} elseif (Test-Path (Join-Path $root "Makefile")) {
    Push-Location $root
    # Read and parse Makefile
    # Run appropriate target
    Pop-Location
} elseif (Test-Path (Join-Path $root "requirements.txt")) {
    Push-Location $root
    python -m venv venv
    .\venv\Scripts\Activate.ps1
    pip install -r requirements.txt
    # Run main entry point
    Pop-Location
}
```

### Output
Update `~/.pmos/projects/{slug}/source-location.json`:
```json
{
  "runtime": {
    "status": "running|failed",
    "url": "http://localhost:3000",
    "port": 3000,
    "startedAt": "{timestamp}",
    "method": "docker|npm|make|python"
  }
}
```

---

## Step 4: Customer Journey Discovery

### Agent Instructions
Crawl the application like a customer (if running), or analyze the code structure to infer the journey.

### If App is Running
```typescript
// Launch browser and crawl
import { chromium } from 'playwright';

const visited = new Set<string>();
const screens: Screen[] = [];

async function crawl(url: string, depth = 0) {
  if (depth > 5 || visited.has(url)) return;
  visited.add(url);

  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(url);

  // Screenshot
  const screenshot = `~/.pmos/projects/{slug}/journey/screenshots/{screen-id}.png`;
  await page.screenshot({ path: screenshot, fullPage: true });

  // Extract screen info
  const screen = {
    id: generateId(url),
    url: url,
    title: await page.title(),
    description: extractDescription(page),
    primaryCta: extractPrimaryCTA(page),
    secondaryCtas: extractSecondaryCTAs(page),
    forms: extractForms(page),
    navigation: extractNavigation(page),
    screenshot: screenshot,
    uxNotes: [],
  };

  screens.push(screen);

  // Crawl linked pages
  const links = await page.$$eval('a[href]', anchors =>
    anchors.map(a => a.href).filter(h => h.startsWith('http://localhost'))
  );
  for (const link of links) {
    await crawl(link, depth + 1);
  }
  await browser.close();
}
```

### If App is NOT Running (Static Analysis)
Read route files, components, and API endpoints to infer the journey:

```powershell
$root = $source.localPath

# Find route/page files
Get-ChildItem -Path $root -Recurse -File | Where-Object {
    $_.FullName -match "(page|route|screen|view)\.(tsx?|jsx?|vue|svelte)$" -and
    $_.FullName -notlike "*node_modules*"
} | Select-Object FullName

# Find component files
Get-ChildItem -Path $root -Recurse -File | Where-Object {
    $_.FullName -match "\.(tsx|jsx|vue|svelte)$" -and
    $_.FullName -notlike "*node_modules*"
} | Select-Object FullName
```

### Output
Create `~/.pmos/projects/{slug}/journey/`:
```
journey/
├── journey.md              ← The complete customer journey
├── personas.md             ← Generated personas
├── screens.json            ← Structured screen data
├── screenshots/            ← If app was running
│   ├── landing-page.png
│   ├── dashboard.png
│   └── ...
└── ux-notes.md             ← UX observations
```

---

## Step 5: Story Mapping

### Agent Instructions
Convert the journey into a Jeff Patton style story map.

### Mapping Logic
For each screen/activity:
1. Identify the **Activity** (what the user is doing)
2. Break into **Tasks** (specific actions)
3. Break into **Stories** (deliverable units)

### Output
Create `~/.pmos/projects/{slug}/stories/`:
```
stories/
├── story-map.md            ← Visual story map
├── backlog/
│   ├── STORY-001-*.md
│   └── ...
├── in-progress/
├── review/
└── done/
```

---

## Step 6: Build Initial Backlog

### Agent Instructions
Analyze the codebase for improvements and create stories.

### Analysis Categories
- **Missing Functionality**: Incomplete flows, missing error states
- **Technical Debt**: Duplicated code, outdated deps, TODOs
- **Architecture Issues**: Tight coupling, missing abstractions
- **Potential Bugs**: Unhandled edge cases, race conditions
- **UX Improvements**: Accessibility, mobile, navigation
- **Performance**: Optimization, bundle size, caching
- **Security**: Input sanitization, secrets, CSRF

### Output
Create stories in `~/.pmos/projects/{slug}/stories/backlog/`

---

## Step 7: Build Agent Kanban

### Agent Instructions
Create 7 agent teams and assign stories.

### Agent Definitions
Create `~/.pmos/projects/{slug}/agents/`:

| File | Agent | Focus |
|------|-------|-------|
| `product-manager.md` | Product Manager | Roadmap, stories, priorities, journey |
| `ux-designer.md` | UX Designer | Journey, wireframes, screens, accessibility |
| `architect.md` | Architect | Architecture, patterns, tech debt, APIs |
| `software-engineer.md` | Software Engineer | Implementation, testing, PRs, commits |
| `qa-engineer.md` | QA Engineer | Testing, regression, performance, a11y |
| `documentation-agent.md` | Documentation Agent | README, architecture, release notes, API docs |
| `product-intelligence.md` | Product Intelligence | Continuous monitoring, anomaly detection |

---

## Step 8: Product Dashboard

### Agent Instructions
Create a live dashboard that summarizes project health.

### Output
Create `~/.pmos/projects/{slug}/dashboard.md`:

```markdown
# {Project Name} — Product Dashboard

## Health Score: {calculated}/100

| Metric | Value |
|--------|-------|
| Source Location | {localPath or "GitHub API"} |
| Source Mode | {local|github|github-only} |
| Customer Journey Steps | {count} |
| Screens Discovered | {count} |
| Total Stories | {count} |
| Open Improvements | {count} |
| AI Agents Active | {count} |
| Application Status | Running at {url} or Not Running |
| Last Analyzed | {timestamp} |

## Story Breakdown
| Status | Count |
|--------|-------|
| Backlog | {count} |
| In Progress | {count} |
| Review | {count} |
| Done | {count} |

## Agent Workload
| Agent | Active | Completed | Queued |
|-------|--------|-----------|--------|
| Product Manager | {n} | {n} | {n} |
| UX Designer | {n} | {n} | {n} |
| Architect | {n} | {n} | {n} |
| Software Engineer | {n} | {n} | {n} |
| QA Engineer | {n} | {n} | {n} |
| Documentation | {n} | {n} | {n} |
| Intelligence | {n} | {n} | {n} |
```

---

## Step 9: Continuous Learning

### Agent Instructions
Set up monitoring that triggers on repository changes.

### Git Hook: Post-Commit
```bash
#!/bin/bash
# .git/hooks/post-commit
echo "PMOS: Updating project intelligence..."
# Agent reads this and re-runs relevant pipeline steps
```

### Product Intelligence Monitoring
The Product Intelligence Agent watches for:
1. **New routes** → "Should the journey be updated?"
2. **Changed components** → "Does the UX need review?"
3. **New API endpoints** → "Is it planned?"
4. **Missing stories** → "This feature has no story."
5. **Shipped features** → "No analytics events added."
6. **Old journey** → "Journey hasn't been updated in 30 days."
7. **Dependency changes** → "Any breaking changes?"
8. **Test coverage** → "Coverage dropped below threshold."

### Output
Create `~/.pmos/projects/{slug}/intelligence/monitor.md`

---

## Execution Checklist

When a user says "PMOS: run the full import pipeline on [project]":

- [ ] Step 1: Resolve source location (read source-location.json)
- [ ] Step 2: Analyze codebase (from local path or GitHub API)
- [ ] Step 3: Run application (if local clone exists)
- [ ] Step 4: Discover customer journey
- [ ] Step 5: Create story map
- [ ] Step 6: Build backlog
- [ ] Step 7: Assign agent teams
- [ ] Step 8: Generate dashboard
- [ ] Step 9: Set up continuous learning

**Expected time**: 15-30 minutes for a medium-sized project.

**After completion**: The PM never manually updates Jira again.

# PMOS — The Complete Pipeline

## How to Execute

Tell any AI agent:

> "PMOS: run the full import pipeline on [github-url]"

The agent reads this file and executes steps 1-9 sequentially.

---

## Step 1: GitHub Import

### Agent Instructions
1. Ask user for GitHub repository URL
2. Validate the URL exists: `curl -s [repo-url] | head -5`
3. Clone to `~/.pmos/projects/{slug}/repo/`
4. Read and index all files

### Commands
```bash
# Clone the repository
git clone {repo-url} ~/.pmos/projects/{slug}/repo/

# Index the codebase
find ~/.pmos/projects/{slug}/repo/ -type f -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.json" -o -name "*.md" -o -name "*.yaml" -o -name "*.yml" -o -name "*.env*" -o -name "*.sql" -o -name "*.prisma" | head -500
```

### Files to Read
| File | Purpose |
|------|---------|
| `README.md` | Project overview, setup instructions |
| `package.json` | Dependencies, scripts, tech stack |
| `tsconfig.json` | TypeScript configuration |
| `.env.example` | Environment variables needed |
| `docker-compose.yml` | Container setup |
| `Dockerfile` | Container build |
| `next.config.*` | Framework config |
| `prisma/schema.prisma` | Database schema |
| `tailwind.config.*` | Styling |
| Route files | `app/**/page.tsx`, `pages/**/*.tsx`, `src/routes/**` |
| Component files | `components/**/*.tsx`, `src/components/**/*.tsx` |
| API files | `app/api/**/route.ts`, `pages/api/**/*.ts` |
| Test files | `**/*.test.*`, `**/*.spec.*`, `__tests__/**` |
| Prompt files | `prompts/**`, `prompts.*` |
| Agent files | `agents/**`, `agent.*` |

### Output
Create `~/.pmos/projects/{slug}/repo-index.json`:
```json
{
  "repo": "{repo-url}",
  "clonedAt": "{timestamp}",
  "techStack": {
    "framework": "next.js|remix|express|etc",
    "language": "typescript|javascript",
    "database": "postgresql|mongodb|etc",
    "styling": "tailwind|css-modules|etc"
  },
  "files": {
    "routes": [...],
    "components": [...],
    "api": [...],
    "tests": [...],
    "prompts": [...],
    "agents": [...],
    "config": [...]
  },
  "stats": {
    "totalFiles": 0,
    "totalLines": 0,
    "componentsCount": 0,
    "routeCount": 0,
    "apiCount": 0,
    "testCount": 0
  }
}
```

---

## Step 2: Repository Intelligence

### Agent Instructions
Read the repo-index.json and source files to generate intelligence.

### Analysis Tasks

**Architecture Analysis:**
1. Read all route files → map navigation structure
2. Read all component files → map component hierarchy
3. Read all API files → map API surface
4. Read database schema → map domain model
5. Read config files → understand infrastructure

**Generate:**
1. Architecture diagram (Mermaid)
2. Domain model (entities and relationships)
3. Technology stack summary
4. Existing feature inventory
5. Missing documentation list
6. Code quality assessment

### Output Files

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
1. Check for `docker-compose.yml` → if exists, run `docker compose up -d`
2. Check for `package.json` → if exists, run `npm install && npm run dev`
3. Check for `Makefile` → if exists, read and execute
4. Wait for the server to be ready (poll health endpoint or port)
5. Record the local URL

### Detection Logic
```
if file_exists("docker-compose.yml") or file_exists("docker-compose.yaml"):
    run("docker compose up -d")
    wait_for("localhost:3000" or configured port)
elif file_exists("package.json"):
    run("npm install")
    run("npm run dev")
    wait_for("localhost:3000")
elif file_exists("Makefile"):
    read_makefile()
    run("make dev" or "make run")
```

### Output
Update `~/.pmos/projects/{slug}/repo-index.json`:
```json
{
  "runtime": {
    "status": "running|failed",
    "url": "http://localhost:3000",
    "port": 3000,
    "startedAt": "{timestamp}",
    "method": "docker|npm|make"
  }
}
```

---

## Step 4: Customer Journey Discovery

### Agent Instructions
Launch Playwright and crawl the application like a customer.

### Playwright Script
```typescript
// This is conceptual — the AI agent writes and runs this
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

  // Find and crawl linked pages
  const links = await page.$$eval('a[href]', anchors =>
    anchors.map(a => a.href).filter(h => h.startsWith('http://localhost'))
  );

  for (const link of links) {
    await crawl(link, depth + 1);
  }

  await browser.close();
}
```

### Screen Analysis
For each screen, extract:
- Screenshot (full page)
- URL
- Page title
- Description (from meta or inferred)
- Primary CTA (main action button)
- Secondary CTAs (other actions)
- Forms (input fields)
- Navigation (sidebar, header links)
- UX notes (observations about usability)

### Output
Create `~/.pmos/projects/{slug}/journey/`:
```
journey/
├── journey.md              ← The complete customer journey
├── personas.md             ← Generated personas
├── screens.json            ← Structured screen data
├── screenshots/
│   ├── landing-page.png
│   ├── login.png
│   ├── dashboard.png
│   └── ...
└── ux-notes.md             ← UX observations
```

---

## Step 5: Story Mapping

### Agent Instructions
Convert the journey into a Jeff Patton style story map.

### Mapping Logic
For each screen:
1. Identify the **Activity** (what the user is doing)
2. Break into **Tasks** (specific actions)
3. Break into **Stories** (deliverable units)

### Example
```
Screen: Upload Audio
    │
    ├── Activity: Upload Content
    │   ├── Task: Choose File
    │   │   ├── Story: File picker accepts audio formats
    │   │   ├── Story: Drag and drop support
    │   │   └── Story: Show file preview before upload
    │   │
    │   ├── Task: Validate Format
    │   │   ├── Story: Show accepted formats
    │   │   ├── Story: Validate file size
    │   │   └── Story: Show validation errors
    │   │
    │   ├── Task: Show Progress
    │   │   ├── Story: Upload progress bar
    │   │   ├── Story: Upload speed indicator
    │   │   └── Story: Cancel upload option
    │   │
    │   └── Task: Process Audio
    │       ├── Story: Processing status indicator
    │       ├── Story: Processing time estimate
    │       └── Story: Error handling for failed processing
```

### Output
Create `~/.pmos/projects/{slug}/stories/`:
```
stories/
├── story-map.md            ← Visual story map
├── backlog/
│   ├── STORY-001-*.md
│   ├── STORY-002-*.md
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

**Missing Functionality:**
- Features common in similar products but missing here
- Incomplete user flows
- Missing error states
- Missing loading states

**Technical Debt:**
- Duplicated code
- Outdated dependencies
- Missing types
- TODO/FIXME comments

**Architecture Issues:**
- Tight coupling
- Missing abstractions
- Inconsistent patterns
- Missing error boundaries

**Potential Bugs:**
- Unhandled edge cases
- Race conditions
- Memory leaks
- Missing validation

**UX Improvements:**
- Missing accessibility
- Poor mobile experience
- Confusing navigation
- Missing feedback

**Performance:**
- Missing optimization
- Large bundle size
- Slow queries
- Missing caching

**Security:**
- Missing input sanitization
- Exposed secrets
- Missing rate limiting
- Missing CSRF protection

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

### Story Assignment Rules
- UI/Frontend stories → Software Engineer
- Design/UX stories → UX Designer
- Architecture stories → Architect
- Testing stories → QA Engineer
- Documentation stories → Documentation Agent
- Priority/Roadmap stories → Product Manager
- All monitors → Product Intelligence

### Output
Each agent file contains:
- Assigned stories (by status)
- Current work
- Completed work
- Context and memory
- Decision log

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
| Customer Journey Steps | {count} |
| Screens Discovered | {count} |
| Total Stories | {count} |
| Open Improvements | {count} |
| AI Agents Active | {count} |
| Application Status | Running at {url} |

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

## Last Updated: {timestamp}
```

---

## Step 9: Continuous Learning

### Agent Instructions
Set up hooks that trigger on repository changes.

### Git Hook: Post-Commit
```bash
#!/bin/bash
# .git/hooks/post-commit
# After each commit, PMOS re-analyzes the project

echo "PMOS: Updating project intelligence..."
# The AI agent reads this hook and re-runs analysis
```

### Product Intelligence Monitoring
The Product Intelligence Agent continuously watches for:

1. **New routes** → "A new route was added. Should the journey be updated?"
2. **Changed components** → "Component X was modified. Does the UX need review?"
3. **New API endpoints** → "New API endpoint has no UI. Is it planned?"
4. **Missing stories** → "This feature has no story in the backlog."
5. **Shipped features** → "Feature shipped but no analytics events added."
6. **Old journey** → "Journey hasn't been updated in 30 days."
7. **Dependency changes** → "Dependencies updated. Any breaking changes?"
8. **Test coverage** → "Test coverage dropped below threshold."

### Output
Create `~/.pmos/projects/{slug}/intelligence/monitor.md`:
```markdown
# Product Intelligence Log

## Active Monitors
- Route changes
- Component changes
- API changes
- Dependency updates
- Test coverage
- Journey freshness

## Recent Alerts
(Updated by Product Intelligence Agent)
```

---

## Execution Checklist

When a user says "PMOS: run the full import pipeline on [url]":

- [ ] Step 1: Clone repository
- [ ] Step 2: Analyze codebase
- [ ] Step 3: Run application
- [ ] Step 4: Discover customer journey
- [ ] Step 5: Create story map
- [ ] Step 6: Build backlog
- [ ] Step 7: Assign agent teams
- [ ] Step 8: Generate dashboard
- [ ] Step 9: Set up continuous learning

**Expected time**: 15-30 minutes for a medium-sized project.

**After completion**: The PM never manually updates Jira again.

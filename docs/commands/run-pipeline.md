# Command: Run Full Pipeline

## Purpose

Execute the complete 9-step import pipeline on an attached project.

## Trigger

```
> "PMOS: run the full import pipeline on [project]"
```

---

## Steps

### Step 1: GitHub Import
1. Read project from registry
2. If GitHub: verify clone exists or re-clone
3. If local: verify symlink valid
4. Index all files (routes, components, API, DB, tests, prompts, agents, config)
5. Generate `repo-index.json`

### Step 2: Repository Intelligence
1. Read all source files
2. Generate architecture diagram (Mermaid)
3. Map domain model (entities + relationships)
4. Document technology stack
5. List existing features
6. Identify missing documentation
7. Save to `intelligence/`

### Step 3: Run Application
1. Check for docker-compose.yml → `docker compose up -d`
2. Check for package.json → `npm install && npm run dev`
3. Check for Makefile → `make dev`
4. Wait for server ready
5. Record URL in repo-index.json

### Step 4: Customer Journey Discovery
1. Launch Playwright
2. Crawl like a customer (start at landing page)
3. For each screen: screenshot, URL, title, description, CTAs, forms, navigation
4. Save screenshots to `journey/screenshots/`
5. Generate `journey/journey.md`

### Step 5: Story Mapping
1. For each screen, identify activities
2. Break into tasks
3. Break into stories
4. Generate `stories/story-map.md`

### Step 6: Build Backlog
1. Analyze code for missing features
2. Find tech debt, code smells, architecture issues
3. Identify bugs, UX issues, performance issues, security gaps
4. Create stories in `stories/backlog/`

### Step 7: Agent Kanban
1. Create 7 agent team files in `agents/`
2. Assign stories by type:
   - UI/Frontend → Software Engineer
   - Design/UX → UX Designer
   - Architecture → Architect
   - Testing → QA Engineer
   - Docs → Documentation Agent
   - Priority/Roadmap → Product Manager
   - Monitoring → Product Intelligence

### Step 8: Product Dashboard
1. Count stories by status
2. Calculate health score
3. List agent workloads
4. Generate `dashboard.md`

### Step 9: Continuous Learning
1. Set up git hooks for auto-sync
2. Configure Product Intelligence monitors
3. Start monitoring cycle
4. Save to `intelligence/monitor.md`

---

## Expected Duration
- Small project (<50 files): 5-10 minutes
- Medium project (50-500 files): 10-30 minutes
- Large project (500+ files): 30-60 minutes

## Output
- `dashboard.md` — Live health metrics
- `journey/` — Complete customer journey with screenshots
- `stories/` — Full story backlog
- `agents/` — 7 agent teams with assignments
- `intelligence/` — Architecture, domain model, monitoring

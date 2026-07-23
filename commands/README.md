# PMOS Commands

These are the commands any AI agent can execute by reading these files.

## How It Works

AI agents read these markdown files to understand what operations are available.
Each command file describes: what it does, what inputs it needs, and what it outputs.

---

## Command: `attach-project`

**Purpose**: Attach a new project to PMOS

**Agent Instructions**:
1. Ask user for project name, repo URL, and description
2. Create `~/.pmos/projects/{slug}/` directory
3. Create `project.md` with project context
4. Create `journey/`, `stories/`, `agents/`, `specs/` directories
5. Add project to `registry.json`

**Files to Create**:
- `projects/{slug}/project.md`
- `projects/{slug}/journey/personas.md`
- `projects/{slug}/journey/journey.md`
- `projects/{slug}/stories/backlog/.gitkeep`
- `projects/{slug}/stories/in-progress/.gitkeep`
- `projects/{slug}/stories/review/.gitkeep`
- `projects/{slug}/stories/done/.gitkeep`
- `projects/{slug}/agents/.gitkeep`
- `projects/{slug}/specs/.gitkeep`

---

## Command: `create-story`

**Purpose**: Create a new user story for a project

**Agent Instructions**:
1. Ask which project (or infer from context)
2. Ask for story title, description, acceptance criteria
3. Create markdown file in `stories/backlog/{story-id}.md`
4. Update project story count in `registry.json`

**Story File Format**:
```markdown
# {Story ID}: {Title}

## Status: backlog
## Priority: {critical|high|medium|low}
## Points: {1|2|3|5|8|13}
## Created: {date}
## Project: {project-slug}

### User Story
As a {persona}, I want {action} so that {benefit}.

### Acceptance Criteria
- [ ] Given {precondition}, when {action}, then {result}

### Business Rules
- {rule}

### Dependencies
- {depends on story/task}

### Design
- {link to design}

### Notes
- {additional context}
```

---

## Command: `create-journey`

**Purpose**: Create or update a customer journey for a project

**Agent Instructions**:
1. Ask which project
2. Ask for journey data (or generate from codebase analysis)
3. Create/update `journey/journey.md`
4. Create/update `journey/personas.md`

**Journey File Format**:
```markdown
# Customer Journey: {Project Name}

## Persona: {name}
- **Goal**: {what they want to achieve}
- **Pain Points**: {current problems}
- **Context**: {when/where they use this}

## Journey Steps

### Step 1: {Step Name}
- **Goal**: {user goal at this step}
- **Current Experience**: {what exists today}
- **Pain Points**: {issues at this step}
- **Stories**: {links to related stories}
- **Analytics**: {relevant metrics}

### Step 2: {Step Name}
...
```

---

## Command: `assign-agent-team`

**Purpose**: Create or update an agent team for a project

**Agent Instructions**:
1. Ask which project
2. Ask for team role (frontend, backend, fullstack, design, qa)
3. Create agent team definition in `agents/{team-name}.md`

**Agent Team File Format**:
```markdown
# Agent Team: {Team Name}

## Project: {project-slug}
## Role: {frontend|backend|fullstack|design|qa}
## Status: active

## Agents
- **{Agent Name}**: {role and responsibilities}

## Current Tasks
- {story-id}: {description}

## Completed Tasks
- {story-id}: {description}

## Context
- {codebase context, conventions, patterns}

## Memory
- {learnings from previous work}
```

---

## Command: `update-story-status`

**Purpose**: Move a story between status columns

**Agent Instructions**:
1. Read story from current location
2. Update status field in the markdown
3. Move file to appropriate directory:
   - `backlog/` → `in-progress/` → `review/` → `done/`
4. Update agent team's current tasks if assigned

---

## Command: `get-project-status`

**Purpose**: Get a summary of project status

**Agent Instructions**:
1. Read `registry.json` for project list
2. For requested project, count stories in each status
3. Read agent teams for active work
4. Return summary with:
   - Total stories
   - Stories by status
   - Active agent teams
   - Current work in progress
   - Blocked items

---

## Command: `graphify-project`

**Purpose**: Analyze a project's codebase and generate journey + stories

**Agent Instructions**:
1. Ask which project
2. Read the project's repo URL from `project.md`
3. Clone or access the repository
4. Analyze: routes, components, pages, API endpoints, database
5. Generate customer journey from discovered flows
6. Generate initial story backlog for improvements
7. Save to project workspace

---

## Command: `sync-graph`

**Purpose**: Update the Product Knowledge Graph across all projects

**Agent Instructions**:
1. Read all projects from registry
2. For each project, read journeys, stories, specs
3. Update cross-project connections
4. Identify shared patterns, components, or opportunities
5. Generate graph summary

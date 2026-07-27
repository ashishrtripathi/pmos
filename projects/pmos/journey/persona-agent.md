# Customer Journey — PMOS (Agent the AI Coder)

**Persona**: Agent — AI Coding Agent (Claude, GPT, Gemini)
**Role**: Reads PMOS files to understand project context, writes files to update stories, priorities, and intelligence
**Quote**: "I don't need a GUI. Give me markdown files and I'll run the full product pipeline."

---

## Journey Steps

### Step 1: Discover Project Context
**Activity**: Read `~/.pmos/` to understand the project and its current state
**Tasks**:
- Read `registry.json` to find all projects
- Read `projects/{slug}/project.md` for identity
- Read `projects/{slug}/source-location.json` for code location
- Read `projects/{slug}/journey/persona-*.md` for customer context

**Pain Points**:
- "Where is the project data stored?"
- "What format are the files in?"
- "How do I know which project to work on?"

**Screen**: File system → `~/.pmos/` directory tree

### Step 2: Execute Pipeline Commands
**Activity**: Run PMOS commands as natural language instructions
**Tasks**:
- "PMOS: attach project at [path]"
- "PMOS: run the full import pipeline on [slug]"
- "PMOS: create a user story for [description]"
- "PMOS: re-prioritize the backlog for [slug]"

**Pain Points**:
- "What commands are available?"
- "What's the expected output format?"
- "I need to create a story in the right format with persona, use case, Gherkin AC, and business goal"

**Screen**: Commands → `commands/*.md`

### Step 3: Read Intelligence Data
**Activity**: Ingest intelligence files to understand the codebase
**Tasks**:
- Read `intelligence/architecture.md` for system design
- Read `intelligence/tech-stack.md` for dependencies
- Read `intelligence/features.md` for implemented vs. missing
- Read `intelligence/code-quality.md` for issues
- Read `intelligence/improvements.md` for suggested work

**Pain Points**:
- "I need structured data, not just prose"
- "How do I know which improvements are new vs. already tracked?"

**Screen**: Intelligence → `projects/{slug}/intelligence/*.md`

### Step 4: Create & Update Artifacts
**Activity**: Write files that PMOS-UI and other agents consume
**Tasks**:
- Write user stories to `stories/backlog/STORY-XXX-title.md`
- Update story status by moving files between `backlog/`, `in-progress/`, `review/`, `done/`
- Update intelligence files as new analysis is done
- Write persona journey files

**Pain Points**:
- "What's the exact markdown format?"
- "What frontmatter fields are required?"
- "I need to match the Mike Cohn + Gherkin format exactly"

**Screen**: File system → Story/journey/intelligence files

### Step 5: Respond to PM Queries
**Activity**: Answer PM questions using PMOS data
**Tasks**:
- "What's the status of all projects?" → Read registry, summarize
- "Show me the prioritized backlog" → Read stories, calculate VCR, sort
- "What are the top risks?" → Read intelligence/quality, identify critical issues
- "How much will the next sprint cost?" → Sum story points, calculate token costs

**Pain Points**:
- "I need to aggregate data across multiple files"
- "Dollar calculations need to be consistent"
- "I should flag when data is stale"

**Screen**: Conversational → PM reads the answers

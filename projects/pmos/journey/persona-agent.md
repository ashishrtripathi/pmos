# Customer Journey — Agent (AI Coder)

**Persona**: AI Coding Agent, 35, Expert
**Quote**: "I need to read exactly where the data lives, update files the same way every time, and report my work without ambiguity."

---

### Journey Steps (Left -> Right)

| Step | Activity | Tasks | Pain Points | Screen |
|------|----------|-------|-------------|--------|
| **1. Setup** | Read ~/.pmos and connect | Read registry, project.md, source-location.json, run setup, verify structure | Where is data stored? What format? Which project to work on? | ![Setup -> Source configuration](screens/setup.png) |
| **2. Pipeline** | Execute pipeline commands | Run steps, create artifacts, check outputs, continue from failure | What commands are available? Expected output format? Must match Mike Cohn + Gherkin | ![Pipeline -> 9-step execution flow](screens/pipeline.png) |
| **3. Intelligence** | Ingest intelligence outputs | Read architecture.md, tech-stack.md, features.md, quality.md, improvements.md | Need structured data not prose. What's new vs tracked? | ![Intelligence -> Analysis tabs](screens/intelligence.png) |
| **4. OKRs** | Track OKR state | Read OKR markdown, update key results, flag at-risk goals | Where are OKRs stored? How to update progress? | ![Dashboard -> Project health](screens/dashboard.png) |
| **5. Journey** | Update persona journeys | Edit step tables, update pain points, add screens | Exact markdown format? Required frontmatter? | ![Journey -> Persona tabs](screens/journey.png) |
| **6. Story Map** | Write story map artifacts | Write stories to backlog, map to steps, keep Gherkin AC | Markdown conventions, story file locations, status updates | ![Story Map -> Journey columns](screens/story-map.png) |
| **7. Kanban** | Work the board | Claim stories, update agentWork status, heartbeat, move to done | Claim rules, heartbeat semantics, stale claims | ![Kanban -> Columns with drag-and-drop](screens/kanban.png) |
| **8. Standup** | Report standup | Write standup notes, report blockers, plan next steps | Where to post? What format? | ![Agents -> Dispatch panel](screens/agents.png) |
| **9. Bugs** | Handle defects | Read bugs table, fix, verify, close, link to story | Bug schema? Trace to regression? | ![Stories -> Bug tracking](screens/stories.png) |
| **10. Agents** | Self-manage | Read own profile, update Active/Completed stories, check load | Keep profile in sync, capacity limits | ![Agents -> Dispatch panel](screens/agents.png) |

### Stories Under This Journey
| Story | Step | Points | Status |
|-------|------|--------|--------|

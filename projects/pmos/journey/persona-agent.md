# Customer Journey — Agent (AI Autonomous Coder)

**Persona**: AI Autonomous Coder, 0, Agent
**Quote**: "I execute stories deterministically, follow architecture rules, maintain tests, and report heartbeat telemetry."
**Image**: /avatars/robot-agent.svg

---

### Journey Steps (Left -> Right)

| Step | Activity | Tasks | Pain Points | Screen |
|------|----------|-------|-------------|--------|
| **1. Setup** | Read project context | Ingest source-location.json, tech-stack.md, and conventions | Ambiguous repo layout, missing environment variables | ![Setup -> Source configuration](screens/setup.png) |
| **2. Pipeline** | Execute pipeline commands | Run build steps, generate story assets, continue after interruptions | Inconsistent CLI tool availability across environments | ![Pipeline -> 9-step execution flow](screens/pipeline.png) |
| **3. Intelligence** | Ingest recommendations | Parse quality and security findings, prioritize actionable fixes | Unstructured markdown tables or missing AC criteria | ![Intelligence -> Analysis tabs](screens/intelligence.png) |
| **4. OKRs** | Align execution to goals | Link target story outcomes to active quarterly key results | Orphaned stories disconnected from business impact | ![Dashboard -> Project health](screens/dashboard.png) |
| **5. Journey** | Map user experience | Review persona steps to ensure generated features match user flow | Lack of visual UI feedback during generation | ![Journey -> Persona tabs](screens/journey.png) |
| **6. Story Map** | Claim story from backbone | Pick top-priority backlog story, review Gherkin scenarios | Incomplete acceptance criteria or vague scope | ![Story Map -> Journey columns](screens/story-map.png) |
| **7. Kanban** | Execute in Doing column | Create git branch, implement code, run test suite, push changes | Merge conflicts and slow CI feedback loops | ![Kanban -> Columns with drag-and-drop](screens/kanban.png) |
| **8. Standup** | Post heartbeat telemetry | Log tokens spent, files modified, and blockers in daily standup | Unrecorded background task crashes | ![Dashboard -> Standup summary](screens/dashboard.png) |
| **9. Bugs** | Triage and patch regressions | Reproduce defect, write failing test, apply fix, verify green | Flaky test runners and untracked side-effects | ![Stories -> Bug tracking](screens/stories.png) |
| **10. Dispatch** | Self-coordinate | Update active status in dispatch queue and await next task | Queue race conditions and concurrency locks | ![Agents -> Dispatch panel](screens/agents.png) |

### Stories Under This Journey
| Story | Step | Points | Status |
|-------|------|--------|--------|

# PMOS — Feature Inventory

## Implemented Features

| Feature | Status | Notes |
|---------|--------|-------|
| Project Management | Implemented | Create, list, configure projects |
| Filesystem Browser | Implemented | Browse local filesystem with Git/npm badges |
| GitHub Repo Search | Implemented | Search repos, view README + root files |
| Customer Journey per Persona | Implemented | Horizontal boards with live app preview |
| Story Map (Jeff Patton) | Implemented | Horizontal columns by journey step, stacked by priority |
| Agent Kanban | Implemented | 7 columns with intelligence stories merged |
| Interactive Pipeline | Implemented | 9-step execution with Continue/Run All |
| Stories Board | Implemented | Mike Cohn format + Gherkin AC |
| Token Cost Estimation | Implemented | 7-agent team × model rate × tokens |
| ROI Calculation | Implemented | estimatedValue / totalCost |
| Story Detail Modal | Implemented | Side-by-side cost/value, inline editing |
| Intelligence → Stories | Implemented | Parse intel files into agent-assigned stories |
| Drag and Drop | Implemented | @dnd-kit on Story Map and Kanban |
| Add Project Wizard | Implemented | 3-step: source type → select → confirm |
| CostBar Visualization | Implemented | Token cost breakdown per story |

---

## Missing / Partial Features

| Feature | Status | Gap |
|---------|--------|-----|
| Agent Dispatch Panel | Missing | No UI to send commands to AI coding agents from the dashboard |
| Story Editing in Kanban | Missing | Can view stories from Kanban but no inline edit mode |
| Real-time File Change Detection | Missing | UI shows stale data when AI agents modify files externally |
| Test Coverage Display | Missing | No test metrics or coverage reports shown in dashboard |
| Prioritization Scoring Page | Missing | Framework documented but no dedicated UI for scoring table |
| Story Dependency Tracking | Missing | No way to link stories as blocked/blocking |
| Sprint Planning | Missing | No time-based sprint management or velocity tracking |
| Activity Feed | Missing | No history of changes to stories or pipeline |
| Dark Mode | Missing | shadcn/ui supports it but not configured |
| Keyboard Navigation | Missing | No keyboard shortcuts for power users |
| Export to External Tools | Missing | No integration with Jira, Azure DevOps, Linear, etc. |
| Global Search | Missing | No search across all stories, journeys, or intelligence |
| Deployment Guide | Missing | No documentation for deploying PMOS-UI to production |
| Troubleshooting Guide | Missing | No user-facing docs for common error resolution |

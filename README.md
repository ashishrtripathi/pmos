# PMOS Operating System

## What is this?

This is the **home directory** for PMOS — the AI-Native Product Operating System.

Every AI agent in AionUi can read and write to this directory to:
- Discover what projects exist
- Read project journeys, stories, and specs
- Create and update stories
- Assign work to agent teams
- Track implementation progress

## Directory Structure

```
~/.pmos/
├── registry.json          ← Global registry of all projects
├── projects/              ← Per-project workspaces
│   └── [project-slug]/
│       ├── project.md     ← Project identity and context
│       ├── journey/       ← Customer journeys
│       ├── stories/       ← Story boards by status
│       ├── agents/        ← Agent team definitions
│       └── specs/         ← Feature specifications
└── commands/              ← Shared commands
```

## How to Use

### As an AI Agent:

1. **Read `registry.json`** to discover all projects
2. **Read `projects/[slug]/project.md`** to understand a project
3. **Read `projects/[slug]/journey/`** to understand the customer journey
4. **Read `projects/[slug]/stories/`** to see what's being worked on
5. **Write stories** by creating markdown files in `stories/backlog/`
6. **Update status** by moving files between `backlog/`, `in-progress/`, `review/`, `done/`

### As a Human:

1. Tell your AI: "PMOS: show me all projects"
2. Tell your AI: "PMOS: create a story for [feature]"
3. Tell your AI: "PMOS: assign [story] to the frontend team"
4. Tell your AI: "PMOS: what's the status of [project]?"

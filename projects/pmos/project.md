# PMOS — AI-Native Product Operating System

## Project Overview

PMOS is an open-source, file-based Product Management Operating System that acts as the orchestration layer between Product Managers, UX Designers, AI Coding Agents, and GitHub. It's not a project management tool like Jira or Linear — it's an **operating system** that manages the complete product lifecycle from customer discovery to production.

## Key Facts

- **Type**: Open-source developer tool
- **Stack**: Next.js 14, TypeScript, Tailwind CSS, @dnd-kit, gray-matter, marked
- **Architecture**: File-based OS — no databases, no servers, just markdown/JSON at `~/.pmos/`
- **Status**: Active Development (v0.1.0)
- **Repository**: https://github.com/ashishrtripathi/pmos
- **Source Location**: `C:\Users\ashis\.pmos` (self-referencing)

## Tech Stack

### Frontend (pmos-ui/)
- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS + shadcn/ui-compatible theme
- @dnd-kit (drag-and-drop)
- gray-matter (markdown frontmatter)
- marked (markdown → HTML)
- lucide-react (icons)
- zod (validation)

### Backend
- Next.js API Routes (file-system based)
- Node.js fs module for file reads
- No database — pure file system

## Team

| Agent | Role in PMOS |
|-------|-------------|
| Product Manager | Roadmap, prioritization, OKRs |
| UX Designer | Journey, story map, UI flows |
| Architect | File-based architecture, API design |
| Software Engineer | Next.js features, DnD, AI integration |
| QA Engineer | Build verification, page load testing |
| Documentation | README, command docs, framework docs |
| Intelligence | Codebase analysis, quality assessment |

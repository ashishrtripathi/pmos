# STORY-001: Build VOXStyle Core Project Structure

## Status: backlog
## Priority: critical
## Points: 13
## Created: 2026-07-22
## Project: voxstyle

### User Story
As a developer, I want the VOXStyle project scaffolded with Next.js, Remotion, and all core dependencies so that the video generation pipeline can be built.

### Acceptance Criteria
- [ ] Given the build spec, when I run `npm create`, then a Next.js project is created with TypeScript
- [ ] Given the Next.js project, when I add Remotion, then `remotion studio` runs
- [ ] Given the project, when I check dependencies, then all tools from the spec are installed
- [ ] Given the project, when I check `.env.example`, then all required API keys are listed
- [ ] Given the project, when I run startup check, then missing keys are reported loudly

### Business Rules
- Follow the suggested build order from spec §10
- Project structure must match spec §6 (Remotion project structure)
- Environment validation must fail loudly before any pipeline step

### Dependencies
- None (first story)

### Notes
- Agent team: software-engineer
- Reference: vox-style-video-app-spec.md sections 1, 2, 6, 10

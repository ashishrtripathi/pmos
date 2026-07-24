# AI Coding Agents

## Overview

The Coding Agent Manager orchestrates AI coding agents to implement features. It generates implementation plans, manages GitHub branches, coordinates multiple agents, and tracks progress.

---

## Agent Roles

| Role | Focus | Primary Skills |
|------|-------|----------------|
| Frontend Engineer | UI implementation | React, TypeScript, Tailwind |
| Backend Engineer | API implementation | tRPC, Prisma, PostgreSQL |
| Full-Stack Engineer | End-to-end features | All stack technologies |
| Test Engineer | Test automation | Jest, Playwright |

---

## Workflow

```
┌─────────────────────────────────────────────────────────────┐
│                    Implementation Flow                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  1. Story Ready                                               │
│     └── Story + Spec approved                                 │
│                                                               │
│  2. Plan Generation                                           │
│     └── AI creates implementation plan                        │
│                                                               │
│  3. Agent Assignment                                          │
│     └── Assign appropriate agent(s)                           │
│                                                               │
│  4. Branch Creation                                           │
│     └── Create feature branch                                │
│                                                               │
│  5. Implementation                                            │
│     └── Agent writes code                                     │
│                                                               │
│  6. Testing                                                   │
│     └── Agent writes tests                                    │
│                                                               │
│  7. PR Creation                                               │
│     └── Create pull request                                   │
│                                                               │
│  8. Review                                                    │
│     └── PM reviews demo                                       │
│                                                               │
│  9. Merge                                                     │
│     └── Merge to main                                         │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Plan

```typescript
interface ImplementationPlan {
  id: string;
  storyId: string;
  
  // Tasks
  tasks: PlanTask[];
  
  // Files
  files: FileChange[];
  
  // Architecture
  decisions: ArchitectureDecision[];
  
  // Testing
  testPlan: TestPlan;
  
  // Estimates
  estimatedMinutes: number;
  complexity: 'low' | 'medium' | 'high';
}

interface PlanTask {
  id: string;
  description: string;
  files: string[];
  dependencies: string[];
  estimatedMinutes: number;
  skills: string[];
}

interface FileChange {
  path: string;
  action: 'create' | 'update' | 'delete';
  description: string;
  linesAdded?: number;
  linesRemoved?: number;
}
```

---

## GitHub Integration

### Branch Management

```typescript
// Create feature branch
const branch = await trpc.implementation.createBranch.mutate({
  storyId: 'story-123',
  name: 'feature/data-export',
  base: 'main',
});

// Agent commits changes
await trpc.implementation.commit.mutate({
  implementationId: 'impl-123',
  files: [...],
  message: 'feat(export): implement CSV export',
});

// Create pull request
const pr = await trpc.implementation.createPR.mutate({
  implementationId: 'impl-123',
  title: 'feat: Add data export feature',
  description: 'Implements CSV export for project data',
});
```

### PR Template

```markdown
## Summary

Brief description of changes.

## Changes

- Implemented CSV export endpoint
- Added export UI modal
- Created export service
- Added unit and integration tests

## Related Issues

Closes #123

## Testing

- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Screenshots

[UI screenshots if applicable]
```

---

## Agent Memory

Each agent maintains persistent memory:

```typescript
interface AgentMemory {
  // Current context
  currentTask: Task | null;
  recentCommits: Commit[];
  
  // Learning
  codePatterns: Pattern[];
  conventions: Convention[];
  decisions: Decision[];
  
  // History
  completedTasks: TaskResult[];
  errors: Error[];
}
```

---

## API Endpoints

### Generate Implementation Plan

```typescript
trpc.implementation.generatePlan.mutate({
  storyId: string,
  specId: string,
})
```

### Assign Agent

```typescript
trpc.implementation.assignAgent.mutate({
  implementationId: string,
  agentRole: AgentRole,
})
```

### Execute Task

```typescript
trpc.implementation.executeTask.mutate({
  taskId: string,
  implementationId: string,
})
```

### Get Status

```typescript
trpc.implementation.getStatus.query({
  implementationId: string,
})
```

---

## Components

### ImplementationBoard

Kanban board for implementation tracking.

### PlanViewer

Visual representation of implementation plan.

### CodePreview

Live preview of code changes.

### PRStatus

Pull request status and review information.

### AgentProgress

Real-time agent progress tracking.

---

## Usage Examples

### Full Implementation Flow

```typescript
// 1. Generate plan
const plan = await trpc.implementation.generatePlan.mutate({
  storyId: 'story-123',
  specId: 'spec-123',
});

// 2. Assign agents
await trpc.implementation.assignAgent.mutate({
  implementationId: plan.implementationId,
  agentRole: 'frontend-engineer',
});

await trpc.implementation.assignAgent.mutate({
  implementationId: plan.implementationId,
  agentRole: 'backend-engineer',
});

// 3. Monitor progress
const status = await trpc.implementation.getStatus.query({
  implementationId: plan.implementationId,
});

// 4. Review when ready
if (status.prReady) {
  // PM reviews the demo
}
```

### Monitoring Agent Progress

```typescript
// Subscribe to implementation updates
trpc.implementation.onUpdate.subscribe(
  { implementationId: 'impl-123' },
  {
    onData: (update) => {
      console.log(`Agent ${update.agent}: ${update.status}`);
      console.log(`Current file: ${update.currentFile}`);
      console.log(`Progress: ${update.progress}%`);
    },
  }
);
```

---

## Best Practices

1. **Small PRs** - Keep changes focused
2. **Clear Commits** - Write meaningful commit messages
3. **Test Coverage** - Require tests for all changes
4. **Code Review** - PM reviews functionality, not code
5. **Incremental** - Build features incrementally
6. **Document Decisions** - Record architecture decisions

---

## Safety Measures

### Pre-Commit Checks

- Linting passes
- Type checking passes
- Tests pass
- No security issues

### Branch Protection

- Require PR reviews
- Require status checks
- Require up-to-date branches
- Restrict force pushes

### Rollback

```typescript
// Revert a failed implementation
await trpc.implementation.revert.mutate({
  implementationId: 'impl-123',
  reason: 'Breaking change detected',
});
```

---

## Future Enhancements

- [ ] Parallel agent execution
- [ ] Agent collaboration
- [ ] Learning from feedback
- [ ] Custom agent skills
- [ ] Performance optimization

# Kanban

## Overview

PMOS features an AI-first Kanban board designed specifically for the product lifecycle. Unlike traditional Kanban boards, PMOS cards represent implementation work executed by AI agents.

---

## Board Columns

The PMOS Kanban follows the complete product lifecycle:

```
┌──────────┬──────────┬──────────┬──────────┬──────────┬──────────┐
│  Ideas   │ Research │ Journey  │   UI     │ Planning │  Coding  │
│          │          │ Approved │  Ready   │          │          │
├──────────┼──────────┼──────────┼──────────┼──────────┼──────────┤
│          │          │          │          │          │          │
│  Card    │  Card    │  Card    │  Card    │  Card    │  Card    │
│          │          │          │          │          │          │
└──────────┴──────────┴──────────┴──────────┴──────────┴──────────┘

┌──────────┬──────────┬──────────┬──────────┬──────────┐
│ Testing  │   PM     │ Approved │  Merged  │ Released │
│          │ Review   │          │          │          │
├──────────┼──────────┼──────────┼──────────┼──────────┤
│          │          │          │          │          │
│  Card    │  Card    │  Card    │  Card    │  Card    │
│          │          │          │          │          │
└──────────┴──────────┴──────────┴──────────┴──────────┘
```

---

## Card Information

Each Kanban card displays:

| Field | Description |
|-------|-------------|
| **Title** | Story title |
| **Priority** | Color-coded priority badge |
| **Story Points** | Complexity estimate |
| **Assignee** | AI agent or team member |
| **Status** | Current status |
| **Progress** | Implementation progress |
| **Tests** | Test coverage indicator |
| **PR Link** | Link to pull request |

---

## AI Features

### Auto-Progression

Cards automatically move between columns based on status:

```typescript
interface KanbanAutomation {
  // Auto-move rules
  rules: {
    when: string;     // Trigger condition
    from: string;     // Source column
    to: string;       // Destination column
  }[];
}
```

### Smart Assignment

AI recommends card assignment based on:
- Agent skills and availability
- Story requirements
- Workload balancing
- Expertise areas

### Progress Tracking

Real-time updates as agents work:

```
Card: "Implement CSV Export"
├── Agent: Frontend Engineer
├── Status: In Progress
├── Files Changed: 3/5
├── Tests: 2/4 written
├── Current: Writing ExportModal.tsx
└── Estimated Complete: 45 min
```

---

## API Endpoints

### List Cards

```typescript
trpc.kanban.list.query({
  boardId: string,
  column?: string,
})
```

### Move Card

```typescript
trpc.kanban.moveCard.mutate({
  cardId: string,
  toColumn: string,
  position: number,
})
```

### Get Board State

```typescript
trpc.kanban.getBoard.query({
  boardId: string,
})
```

### Update Card

```typescript
trpc.kanban.updateCard.mutate({
  cardId: string,
  updates: Partial<KanbanCard>,
})
```

---

## Components

### KanbanBoard

Main board container with all columns.

### KanbanColumn

Individual column with card list.

### KanbanCard

Card component with all story information.

### KanbanCardDetail

Expanded card view with full details.

### KanbanFilters

Filter by assignee, priority, status.

---

## Views

### Default View
Standard Kanban board with all columns.

### Swimlane View
Group cards by:
- Assignee
- Priority
- Epic
- Sprint

### Timeline View
See cards on a timeline with dependencies.

### Analytics View
Board metrics and velocity charts.

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `←` `→` | Move card between columns |
| `↑` `↓` | Move card within column |
| `Enter` | Open card details |
| `Escape` | Close card details |
| `A` | Assign to me |
| `F` | Toggle filter panel |

---

## Automation Rules

### Default Automations

```typescript
const defaultAutomations = [
  {
    name: 'Auto-start coding',
    trigger: 'story.status === "ready"',
    action: 'moveTo("Coding")',
  },
  {
    name: 'Auto-create PR',
    trigger: 'implementation.status === "complete"',
    action: 'moveTo("PM Review")',
  },
  {
    name: 'Auto-release',
    trigger: 'pr.merged && deployment.successful',
    action: 'moveTo("Released")',
  },
];
```

### Custom Rules

Create custom automation rules:

```typescript
await trpc.kanban.createAutomation.mutate({
  boardId: 'board-123',
  name: 'Priority escalation',
  trigger: 'card.age > 14 && card.priority === "high"',
  action: 'notify("stakeholders")',
});
```

---

## Best Practices

1. **Limit WIP** - Set work-in-progress limits per column
2. **Review Daily** - Check board status regularly
3. **Update Cards** - Keep card information current
4. **Use Labels** - Categorize work with labels
5. **Track Metrics** - Monitor velocity and cycle time

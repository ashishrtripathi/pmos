# Story Mapping

## Overview

PMOS implements Jeff Patton-style story mapping to organize user stories along the customer journey. Story maps provide a visual representation of the user's workflow and help prioritize work.

---

## Story Map Structure

```
                    Backbone (Activities)
    ┌─────────────────────────────────────────────────────┐
    │   Account Mgmt  │  Project Setup  │  Collaboration  │
    ├─────────────────────────────────────────────────────┤
    │   Tasks                                               │
    │   ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐  │
    │   │ Sign Up │ │ Create  │ │ Invite  │ │ Assign  │  │
    │   │ Login   │ │ Project │ │ Members │ │ Tasks   │  │
    │   │ Profile │ │ Settings│ │ Roles   │ │ Comments│  │
    │   └─────────┘ └─────────┘ └─────────┘ └─────────┘  │
    ├─────────────────────────────────────────────────────┤
    │   Releases (Waves)                                   │
    │   ┌─────────────────────────────────────────────┐   │
    │   │ Release 1: Basic functionality               │   │
    │   │ - Sign up, Login                             │   │
    │   │ - Create project                             │   │
    │   │ - Basic task management                      │   │
    │   ├─────────────────────────────────────────────┤   │
    │   │ Release 2: Team features                     │   │
    │   │ - Invite members                             │   │
    │   │ - Assign tasks                               │   │
    │   │ - Comments                                   │   │
    │   ├─────────────────────────────────────────────┤   │
    │   │ Release 3: Advanced                          │   │
    │   │ - Roles & permissions                        │   │
    │   │ - Task dependencies                          │   │
    │   │ - Custom fields                              │   │
    │   └─────────────────────────────────────────────┘   │
    └─────────────────────────────────────────────────────┘
```

---

## Core Concepts

### Activity (Backbone)

High-level user activities that form the backbone of the story map.

```typescript
interface Activity {
  id: string;
  storyMapId: string;
  name: string;
  description?: string;
  order: number;
  tasks: Task[];
}
```

### Task

Specific tasks within an activity.

```typescript
interface Task {
  id: string;
  activityId: string;
  name: string;
  description?: string;
  order: number;
  stories: Story[];
}
```

### Story

Individual user stories within a task, organized by release.

```typescript
interface Story {
  id: string;
  taskId?: string;
  title: string;
  description: string;
  acceptanceCriteria: string[];
  priority: Priority;
  status: StoryStatus;
  storyPoints?: number;
  release?: string;
}
```

---

## AI Generation

### Automatic Story Map Generation

The AI can generate story maps from various sources:

1. **From Journey** - Convert journey steps to activities
2. **From Website** - Analyze and generate story map
3. **From Repository** - Map existing features

### AI-Enhanced Stories

For each story, the AI generates:

- **Acceptance Criteria** - Given/When/Then format
- **Edge Cases** - Boundary conditions
- **Business Rules** - Validation and logic
- **Dependencies** - Related stories
- **Story Points** - Complexity estimation

---

## API Endpoints

### List Story Maps

```typescript
trpc.storyMap.list.query()
```

### Create Story Map

```typescript
trpc.storyMap.create.mutate({
  name: string,
  journeyId: string,
})
```

### Add Activity

```typescript
trpc.storyMap.addActivity.mutate({
  storyMapId: string,
  name: string,
  order: number,
})
```

### Add Task

```typescript
trpc.storyMap.addTask.mutate({
  activityId: string,
  name: string,
  order: number,
})
```

### Generate from Journey

```typescript
trpc.storyMap.generateFromJourney.mutate({
  journeyId: string,
})
```

### Generate Stories for Task

```typescript
trpc.storyMap.generateStories.mutate({
  taskId: string,
  context?: string,
})
```

---

## Components

### StoryMapBoard

Main story map visualization with drag-and-drop support.

### ActivityColumn

Column representing an activity with its tasks.

### TaskColumn

Column containing stories for a specific task.

### StoryCard

Individual story card with title, points, and status.

### ReleaseSwimlane

Horizontal lane grouping stories by release.

---

## Usage Examples

### Creating a Story Map

```typescript
// 1. Create story map from journey
const storyMap = await trpc.storyMap.generateFromJourney.mutate({
  journeyId: 'journey-123',
});

// 2. Add custom activity
await trpc.storyMap.addActivity.mutate({
  storyMapId: storyMap.id,
  name: 'Data Management',
  order: 4,
});

// 3. Generate stories for a task
await trpc.storyMap.generateStories.mutate({
  taskId: 'task-123',
  context: 'Focus on export functionality',
});
```

### Prioritizing with Story Map

```typescript
// View stories by priority across the map
const prioritized = await trpc.storyMap.getPrioritized.query({
  storyMapId: 'storymap-123',
  method: 'rice',  // RICE scoring
});

// Identify the MVP scope
const mvp = await trpc.storyMap.getRelease.query({
  storyMapId: 'storymap-123',
  release: 'v1',
});
```

---

## Best Practices

1. **Start Wide, Go Deep** - Map all activities before details
2. **User-Centric** - Write from user perspective
3. **Vertical Slicing** - Each story should be deliverable
4. **Release Planning** - Use horizontal slices for releases
5. **Keep Stories Small** - Aim for 1-3 story points
6. **Connect to Journey** - Link activities to journey steps

---

## Integrations

### GitHub Issues

Stories can be synced to GitHub Issues:

```typescript
await trpc.storyMap.syncToGitHub.mutate({
  storyMapId: 'storymap-123',
  repository: 'org/repo',
  release: 'v1',
});
```

### Jira/Linear

Import from existing backends:

```typescript
await trpc.storyMap.importFromLinear.query({
  teamId: 'team-123',
});
```

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `A` | Add activity |
| `T` | Add task |
| `S` | Add story |
| `Del` | Delete selected |
| `⌘ + Z` | Undo |
| `⌘ + ⇧ + Z` | Redo |
| `⌘ + S` | Save |

---

## Future Enhancements

- [ ] Real-time collaboration
- [ ] Story dependencies visualization
- [ ] Effort vs value matrix
- [ ] Sprint planning integration
- [ ] Story map templates

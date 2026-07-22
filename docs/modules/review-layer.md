# Review Layer

## Overview

The Review Layer allows PMs to comment directly on running applications. AI converts these comments into actionable items like new stories, tasks, and GitHub issues.

---

## How It Works

### 1. Enter Review Mode

PM clicks "Review Mode" to enable commenting overlay on the application.

### 2. Add Comments

Click anywhere on the screen to add a comment:

```
┌─────────────────────────────────────────┐
│  Application                            │
│  ┌────────────────────────────────────┐ │
│  │                                    │ │
│  │   [Comment Pin]                    │ │
│  │       │                            │ │
│  │       ▼                            │ │
│  │   ┌─────────────────┐             │ │
│  │   │ This button     │             │ │
│  │   │ should be green │             │ │
│  │   │ and larger      │             │ │
│  │   └─────────────────┘             │ │
│  │                                    │ │
│  └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### 3. AI Processing

AI analyzes each comment and determines:

```typescript
interface CommentAnalysis {
  comment: string;
  category: 'bug' | 'improvement' | 'feature' | 'question';
  priority: 'high' | 'medium' | 'low';
  suggestedActions: SuggestedAction[];
}

interface SuggestedAction {
  type: 'story' | 'task' | 'github-issue' | 'design-change';
  title: string;
  description: string;
  assignee?: string;
}
```

### 4. Create Action Items

PM reviews AI suggestions and approves:

```typescript
// AI suggests creating a story
{
  type: 'story',
  title: 'Increase button size and change color to green',
  description: 'The submit button on the export modal should be green and larger for better visibility.',
  priority: 'medium',
  acceptanceCriteria: [
    'Button background is green (#22c55e)',
    'Button height is at least 48px',
    'Button has sufficient contrast ratio'
  ]
}
```

---

## Comment Types

| Type | Description | Icon |
|------|-------------|------|
| **Bug** | Something is broken | 🔴 |
| **Improvement** | Could be better | 🟡 |
| **Feature** | New functionality | 🟢 |
| **Question** | Need clarification | 🔵 |

---

## AI Conversion Rules

### Comment → Story

When the comment describes a new capability or change.

### Comment → Task

When the comment is a specific, small change.

### Comment → GitHub Issue

When the comment is a bug or technical issue.

### Comment → Design Change

When the comment relates to visual design.

---

## API Endpoints

### Start Review Session

```typescript
trpc.review.startSession.mutate({
  storyId: string,
  deploymentUrl: string,
})
```

### Add Comment

```typescript
trpc.review.addComment.mutate({
  sessionId: string,
  content: string;
  position: { x: number; y: number; selector?: string };
  screenshot?: string;
})
```

### Get AI Suggestions

```typescript
trpc.review.getSuggestions.query({
  sessionId: string,
  commentId: string,
})
```

### Approve Suggestion

```typescript
trpc.review.approveSuggestion.mutate({
  suggestionId: string,
  modifications?: Partial<ActionItem>,
})
```

### Complete Review

```typescript
trpc.review.complete.mutate({
  sessionId: string,
  decision: 'approved' | 'changes-requested',
})
```

---

## Components

### ReviewOverlay

Overlay that enables clicking to add comments.

### CommentPin

Pin marker on the screen for each comment.

### CommentPanel

Side panel showing all comments and suggestions.

### SuggestionCard

AI-generated action item suggestion.

### ReviewSummary

Summary of review session with all action items.

---

## Review Session Flow

1. **Start Session** - PM enters review mode
2. **Navigate** - Move through the application
3. **Comment** - Add comments as needed
4. **Review Suggestions** - Check AI-generated actions
5. **Approve/Modify** - Accept or modify suggestions
6. **Complete** - Finish review with decision
7. **Follow-up** - New stories/tasks are created

---

## Integration

### GitHub Issues

Comments can be directly converted to GitHub issues:

```typescript
await trpc.review.createGitHubIssue.mutate({
  commentId: 'comment-123',
  repository: 'org/repo',
  labels: ['ui-improvement', 'post-release'],
});
```

### Story Map

New stories are automatically added to the story map:

```typescript
// After approving a suggestion
await trpc.storyMap.addStory.mutate({
  storyMapId: 'storymap-123',
  storyId: newStory.id,
  taskId: 'task-improvements',
});
```

---

## Best Practices

1. **Be Specific** - Clear comments lead to better action items
2. **Include Context** - Explain why the change is needed
3. **Prioritize** - Focus on important feedback first
4. **Batch Comments** - Review multiple comments at once
5. **Follow Up** - Check that action items are created

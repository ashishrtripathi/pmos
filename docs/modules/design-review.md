# Design Review

## Overview

The Design Review module provides an integrated workflow from wireframe to high-fidelity design with PM and designer approval gates.

---

## Workflow

```
Story
  │
  ▼
┌─────────────────┐
│ Generate Wireframe│
│ (AI-powered)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ PM Review        │
│ - Check layout   │
│ - Check flow     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Generate High-Fi │
│ Design (AI)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Designer Review  │
│ - Check design   │
│ - Check a11y     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Revision         │
│ (if needed)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Approval         │
│ - PM ✓           │
│ - Designer ✓     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Frontend Dev     │
│ (blocked until   │
│  approval)       │
└─────────────────┘
```

---

## Design States

| State | Description |
|-------|-------------|
| **Draft** | Initial design in progress |
| **In Review** | Under PM/Designer review |
| **Revision** | Changes requested |
| **Approved** | Ready for implementation |

---

## API Endpoints

### Generate Wireframe

```typescript
trpc.design.generateWireframe.mutate({
  storyId: string,
  context?: string,
})
```

### Generate Mockup

```typescript
trpc.design.generateMockup.mutate({
  wireframeId: string,
  style?: string,
})
```

### Review Design

```typescript
trpc.design.review.mutate({
  designId: string;
  reviewer: string;
  decision: 'approve' | 'revise';
  comments?: string;
})
```

### Approve Design

```typescript
trpc.design.approve.mutate({
  designId: string,
})
```

---

## Components

### DesignCanvas

Main design viewing and editing canvas.

### WireframeGenerator

AI wireframe generation interface.

### MockupGenerator

AI high-fidelity design generation.

### ReviewPanel

Review interface with approval buttons.

### DesignVersions

Version history and comparison.

---

## Best Practices

1. **Wireframe First** - Get layout approval before details
2. **Design System** - Use existing components
3. **Accessibility** - Check WCAG compliance
4. **Mobile First** - Design for smallest screen first
5. **Document Decisions** - Record why design choices were made

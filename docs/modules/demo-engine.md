# Demo Engine

## Overview

The Demo Engine automatically generates functional demos when stories reach the "Demo Ready" state. PMs review functionality instead of reading code.

---

## Demo Workflow

```
Story Status: Demo Ready
        │
        ▼
┌─────────────────────┐
│   1. Launch App     │
│   Start preview env │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  2. Navigate        │
│  Go to affected     │
│  screen/feature     │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  3. Highlight       │
│  Show changes with  │
│  visual indicators  │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  4. Narrate         │
│  Explain feature    │
│  with context       │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  5. Screenshot      │
│  Capture for docs   │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  6. Comment         │
│  PM adds inline     │
│  feedback           │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  7. Follow-up       │
│  AI creates new     │
│  stories if needed  │
└─────────────────────┘
```

---

## Demo Output

Each demo generates:

```typescript
interface DemoOutput {
  // Core
  storyId: string;
  implementationId: string;
  
  // Artifacts
  screenshots: Screenshot[];
  walkthrough: Walkthrough;
  
  // Reports
  performanceReport: PerformanceReport;
  accessibilityReport: AccessibilityReport;
  testReport: TestReport;
  
  // Metadata
  previewUrl: string;
  generatedAt: Date;
  duration: number;
}

interface Screenshot {
  url: string;
  screen: string;
  annotations: Annotation[];
  timestamp: Date;
}

interface Walkthrough {
  steps: WalkthroughStep[];
  totalDuration: number;
  videoUrl?: string;
}

interface WalkthroughStep {
  action: string;
  screenshot: string;
  narration: string;
  highlight?: HighlightRegion;
}
```

---

## Reports

### Performance Report

```typescript
interface PerformanceReport {
  // Core Web Vitals
  lcp: number;         // Largest Contentful Paint
  fid: number;         // First Input Delay
  cls: number;         // Cumulative Layout Shift
  ttfb: number;        // Time to First Byte
  
  // Bundle
  bundleSize: BundleSize;
  
  // API
  apiResponseTimes: ApiResponseTime[];
}
```

### Accessibility Report

```typescript
interface AccessibilityReport {
  score: number;       // 0-100
  issues: AccessibilityIssue[];
  wcagLevel: 'A' | 'AA' | 'AAA';
}

interface AccessibilityIssue {
  severity: 'critical' | 'serious' | 'moderate' | 'minor';
  description: string;
  element: string;
  recommendation: string;
}
```

---

## API Endpoints

### Generate Demo

```typescript
trpc.demo.generate.mutate({
  storyId: string,
  implementationId: string,
})
```

### Get Demo

```typescript
trpc.demo.get.query({
  demoId: string,
})
```

### Add Comment

```typescript
trpc.demo.addComment.mutate({
  demoId: string,
  screenshot: string,
  position: { x: number; y: number };
  content: string,
})
```

### Approve Demo

```typescript
trpc.demo.approve.mutate({
  demoId: string,
  comments?: string,
})
```

---

## Components

### DemoViewer

Main demo viewing interface with navigation.

### ScreenshotCarousel

Browse and annotate screenshots.

### PerformanceChart

Visualize performance metrics.

### AccessibilityReport

View and track accessibility issues.

### CommentThread

Inline commenting on screenshots.

---

## PM Review Experience

1. **Open Demo** - Click "Review Demo" on story
2. **Watch Walkthrough** - See the feature in action
3. **Browse Screenshots** - Examine each screen
4. **Check Reports** - Review performance and accessibility
5. **Add Comments** - Click anywhere to comment
6. **Approve or Request Changes** - Decision with feedback

---

## Follow-up Stories

AI analyzes demo comments and creates follow-up stories:

```typescript
const followUps = await trpc.demo.generateFollowUpStories.mutate({
  demoId: 'demo-123',
  comments: [...],
});

// Creates new stories for:
// - UI tweaks requested
// - Performance issues found
// - Accessibility improvements
// - Additional features suggested
```

---

## Best Practices

1. **Review in Context** - Use the actual running application
2. **Check All States** - Test loading, empty, error states
3. **Test Interactions** - Verify clicks, forms, navigation
4. **Review on Mobile** - Check responsive design
5. **Document Feedback** - Be specific in comments

# Prioritization

## Overview

PMOS supports multiple prioritization frameworks to help product managers make informed decisions about what to build next. AI provides recommendations, but the PM always makes the final call.

---

## Supported Frameworks

### RICE Scoring

**R**each × **I**mpact × **C**onfidence / **E**ffort

| Factor | Description | Scale |
|--------|-------------|-------|
| Reach | Users affected per quarter | Number |
| Impact | Effect on individual user | 0.25, 0.5, 1, 2, 3 |
| Confidence | How sure are we? | 50%, 80%, 100% |
| Effort | Person-months | Number |

```typescript
interface RICEScore {
  storyId: string;
  reach: number;
  impact: 0.25 | 0.5 | 1 | 2 | 3;
  confidence: 0.5 | 0.8 | 1.0;
  effort: number;
  score: number;  // Calculated
}
```

### WSJF (Weighted Shortest Job First)

**W**eighted **S**hortest **J**ob **F**irst

```
WSJF = Cost of Delay / Job Size

Cost of Delay = User/Business Value + Time Criticality + Risk Reduction
```

| Factor | Description | Scale |
|--------|-------------|-------|
| User/Business Value | Value to users/business | 1-10 |
| Time Criticality | Urgency | 1-10 |
| Risk Reduction | Reduces uncertainty | 1-10 |
| Job Size | Effort to implement | 1-10 (Fibonacci) |

### Kano Model

Categorizes features based on user satisfaction:

| Category | Description | Examples |
|----------|-------------|----------|
| **Must-Be** | Expected, causes dissatisfaction if missing | Login, basic features |
| **One-Dimensional** | More is better | Performance, speed |
| **Attractive** | Delights users if present | AI features, integrations |
| **Indifferent** | No impact on satisfaction | Internal tools |
| **Reverse** | Causes dissatisfaction if present | Complexity, bloat |

### MoSCoW

| Priority | Description |
|----------|-------------|
| **Must Have** | Critical for launch |
| **Should Have** | Important but not critical |
| **Could Have** | Nice to have |
| **Won't Have** | Out of scope for now |

### Value vs Effort Matrix

```
High Value │ Quick Wins │ Major Projects
           │            │
───────────┼────────────┼──────────────
Low Value  │ Fill-ins   │ Thankless Tasks
           │            │
           └────────────┴──────────────
             Low Effort    High Effort
```

---

## AI Recommendations

The AI analyzes multiple factors to recommend priorities:

### Factors Considered

1. **Business Value** - Revenue impact, strategic alignment
2. **User Impact** - Number of users affected, pain severity
3. **Effort** - Technical complexity, dependencies
4. **Urgency** - Time sensitivity, market window
5. **Risk** - Technical risk, market risk
6. **Dependencies** - Blocking other work

### Recommendation Output

```typescript
interface PriorityRecommendation {
  storyId: string;
  recommendedPriority: Priority;
  scores: {
    rice?: RICEScore;
    wsjf?: WSJFscore;
    valueEffort?: ValueEffortScore;
  };
  reasoning: string;
  risks: string[];
  dependencies: string[];
  confidence: number;
}
```

---

## API Endpoints

### Calculate RICE Score

```typescript
trpc.prioritization.calculateRICE.mutate({
  storyId: string,
  reach: number,
  impact: 0.25 | 0.5 | 1 | 2 | 3,
  confidence: 0.5 | 0.8 | 1.0,
  effort: number,
})
```

### Calculate WSJF

```typescript
trpc.prioritization.calculateWSJF.mutate({
  storyId: string,
  userBusinessValue: number,
  timeCriticality: number,
  riskReduction: number,
  jobSize: number,
})
```

### Get AI Recommendations

```typescript
trpc.prioritization.getRecommendations.query({
  storyIds: string[],
  framework: 'rice' | 'wsjf' | 'kano' | 'moscow',
})
```

### Apply Priority

```typescript
trpc.prioritization.applyPriority.mutate({
  storyId: string,
  priority: Priority,
  score?: number,
  framework: string,
})
```

---

## Components

### PrioritizationBoard

Kanban-style board with prioritized columns.

### RICECalculator

Interactive calculator for RICE scoring.

### WSJFCalculator

Interactive calculator for WSJF scoring.

### PriorityMatrix

Visual value vs effort matrix.

### KanoDiagram

Visualization of Kano model categories.

---

## Usage Examples

### RICE Prioritization

```typescript
// Score a story using RICE
const score = await trpc.prioritization.calculateRICE.mutate({
  storyId: 'story-123',
  reach: 5000,        // 5000 users per quarter
  impact: 2,          // High impact
  confidence: 0.8,    // 80% confident
  effort: 2,          // 2 person-months
});

// score = (5000 × 2 × 0.8) / 2 = 4000
```

### Get Prioritized Backlog

```typescript
// Get all stories sorted by RICE score
const backlog = await trpc.prioritization.getBacklog.query({
  storyMapId: 'storymap-123',
  framework: 'rice',
  limit: 20,
});

// Returns top 20 stories sorted by RICE score
```

---

## Best Practices

1. **Use Multiple Frameworks** - Compare results
2. **Involve Stakeholders** - Get input on scoring
3. **Revisit Regularly** - Scores change over time
4. **Document Decisions** - Record why priorities were set
5. **Consider Dependencies** - Factor in blocking work
6. **Balance Portfolio** - Mix of quick wins and strategic work

---

## Integration with Story Map

Prioritization integrates with story mapping:

```typescript
// Get prioritized release plan
const releasePlan = await trpc.prioritization.getReleasePlan.query({
  storyMapId: 'storymap-123',
  framework: 'wsjf',
  releases: ['v1', 'v2', 'v3'],
});
```

---

## Future Enhancements

- [ ] Cost of Delay quantification
- [ ] Weighted scoring models
- [ ] Portfolio optimization
- [ ] Monte Carlo simulations
- [ ] Historical accuracy tracking

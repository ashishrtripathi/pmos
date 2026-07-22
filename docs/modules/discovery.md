# Discovery

## Overview

The Discovery module collects and analyzes data from multiple sources to identify customer problems, pain points, and opportunities.

---

## Data Sources

| Source | Method | Data Collected |
|--------|--------|----------------|
| Customer Interviews | Manual input / Import | Transcripts, insights |
| Support Tickets | API integration | Issues, requests |
| Slack | Integration | Conversations, complaints |
| Email | Integration | Feedback, requests |
| GitHub Issues | API | Bug reports, feature requests |
| Sales Notes | Import | Customer needs, objections |
| Research | Manual input | Findings, hypotheses |
| Analytics | Platform integration | Usage patterns, drop-offs |

---

## AI Clustering

The AI analyzes collected data and clusters insights:

### Output Types

| Cluster Type | Description |
|--------------|-------------|
| **Pain Points** | Problems users face |
| **Themes** | Common topics |
| **Feature Requests** | What users want |
| **JTBD** | Jobs to be done |
| **Personas** | User archetypes |
| **Opportunities** | Improvement areas |

### Clustering Process

```
Raw Data
    │
    ▼
┌─────────────────┐
│  NLP Processing  │
│  - Sentiment     │
│  - Topics        │
│  - Entities      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Clustering     │
│  - K-means       │
│  - Hierarchical  │
│  - Topic Models  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Insights       │
│  - Pain Points   │
│  - Opportunities │
│  - Themes        │
└─────────────────┘
```

---

## API Endpoints

### Import Data

```typescript
trpc.discovery.import.mutate({
  source: 'interview' | 'slack' | 'github' | 'email',
  data: ImportData,
})
```

### Analyze

```typescript
trpc.discovery.analyze.query({
  projectId: string;
  dateRange?: DateRange;
})
```

### Get Clusters

```typescript
trpc.discovery.getClusters.query({
  projectId: string;
  type?: ClusterType;
})
```

### Create Insight

```typescript
trpc.discovery.createInsight.mutate({
  projectId: string;
  content: string;
  source?: string;
  tags?: string[];
})
```

---

## Components

### InsightCollector

Form and import interface for collecting raw data.

### ClusterVisualization

Visual display of clustered insights.

### InsightCard

Individual insight card with details.

### PersonaGenerator

AI-powered persona creation from insights.

### OpportunityScorer

Score and prioritize opportunities.

---

## Best Practices

1. **Collect Regularly** - Make discovery an ongoing practice
2. **Multiple Sources** - triangulate insights from different sources
3. **Validate Assumptions** - Test insights with users
4. **Link to Journey** - Connect insights to journey steps
5. **Track Over Time** - Monitor how insights evolve

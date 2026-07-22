# Product Analytics

## Overview

Product Analytics connects PMOS to analytics platforms and provides story-level metrics. Every story in PMOS can display usage, conversion, retention, and revenue data.

---

## Supported Platforms

| Platform | Integration Level |
|----------|-------------------|
| **Amplitude** | Full |
| **Mixpanel** | Full |
| **PostHog** | Full |
| **Google Analytics** | Full |
| **Custom** | API-based |

---

## Data Flow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Application   │────▶│   Analytics     │────▶│   PMOS          │
│                 │     │   Platform      │     │                 │
│  - Events       │     │                 │     │  - Story Link   │
│  - User Actions │     │  - Process      │     │  - Metrics      │
│  - Properties   │     │  - Store        │     │  - Insights     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

---

## Story-Level Metrics

Each story can display:

### Usage Metrics

```typescript
interface UsageMetrics {
  totalUsers: number;
  activeUsers: number;
  sessions: number;
  pageViews: number;
  featureAdoption: number;    // Percentage
}
```

### Conversion Metrics

```typescript
interface ConversionMetrics {
  conversionRate: number;
  funnelCompletion: number;
  dropOffPoints: DropOff[];
  abTestResults?: ABTestResult[];
}
```

### Retention Metrics

```typescript
interface RetentionMetrics {
  day1: number;
  day7: number;
  day30: number;
  cohortAnalysis: Cohort[];
}
```

### Revenue Metrics

```typescript
interface RevenueMetrics {
  revenue: number;
  averageOrderValue: number;
  lifetimeValue: number;
  churnImpact: number;
}
```

---

## Event Tracking

### Tracking Implementation

```typescript
// In your application
import { track } from '@pmos/analytics';

// Track feature usage
track('feature_used', {
  feature: 'data-export',
  storyId: 'story-123',
  format: 'csv',
  recordCount: 1500,
});

// Track conversion
track('conversion', {
  event: 'export_completed',
  storyId: 'story-123',
  value: 1,
});
```

### Automatic Story Linking

Events are automatically linked to stories based on:

```typescript
interface StoryLinking {
  // By feature name
  feature?: string;
  
  // By component
  component?: string;
  
  // By URL pattern
  urlPattern?: string;
  
  // By explicit tag
  storyTag?: string;
}
```

---

## API Endpoints

### Connect Analytics Platform

```typescript
trpc.analytics.connect.mutate({
  platform: 'amplitude' | 'mixpanel' | 'posthog' | 'google-analytics',
  credentials: AnalyticsCredentials,
})
```

### Get Story Metrics

```typescript
trpc.analytics.getStoryMetrics.query({
  storyId: string,
  dateRange: { start: Date; end: Date },
})
```

### Get Feature Metrics

```typescript
trpc.analytics.getFeatureMetrics.query({
  feature: string,
  metrics: string[],
})
```

### Get Cohort Analysis

```typescript
trpc.analytics.getCohortAnalysis.query({
  cohortBy: 'signup' | 'first-use',
  period: 'daily' | 'weekly' | 'monthly',
})
```

---

## Components

### StoryMetricsCard

Metrics summary card on story detail page.

### UsageChart

Chart showing feature usage over time.

### ConversionFunnel

Visual funnel showing conversion steps.

### RetentionCurve

Line chart showing user retention.

### RevenueImpact

Revenue attribution to specific stories.

---

## Dashboard

### Feature Dashboard

```
┌─────────────────────────────────────────────────────────────┐
│  Feature: Data Export                                       │
├──────────────────┬──────────────────┬──────────────────────┤
│  Usage           │  Conversion      │  Revenue             │
│  ┌──────────┐    │  ┌──────────┐    │  ┌──────────┐        │
│  │ 12,450   │    │  │  8.2%    │    │  │ $45,200  │        │
│  │ users    │    │  │  rate    │    │  │  impact  │        │
│  └──────────┘    │  └──────────┘    │  └──────────┘        │
├──────────────────┴──────────────────┴──────────────────────┤
│  Usage Trend                                               │
│  ┌────────────────────────────────────────────────────┐   │
│  │     ╱╲                                              │   │
│  │    ╱  ╲    ╱╲                                       │   │
│  │   ╱    ╲  ╱  ╲    ╱╲                               │   │
│  │  ╱      ╲╱    ╲  ╱  ╲                              │   │
│  │ ╱              ╲╱    ╲                             │   │
│  │╱                    ╲                              │   │
│  └────────────────────────────────────────────────────┘   │
│  Jan  Feb  Mar  Apr  May  Jun  Jul                        │
└─────────────────────────────────────────────────────────────┘
```

---

## Insights

AI analyzes metrics and provides insights:

```typescript
interface AnalyticsInsight {
  type: 'trend' | 'anomaly' | 'opportunity' | 'risk';
  title: string;
  description: string;
  metric: string;
  impact: 'high' | 'medium' | 'low';
  recommendation: string;
}

// Example insight
{
  type: 'opportunity',
  title: 'Export feature underutilized',
  description: 'Only 12% of active users have used the export feature',
  metric: 'featureAdoption',
  impact: 'medium',
  recommendation: 'Consider adding export button to dashboard or adding onboarding tooltip'
}
```

---

## Integration with Product Graph

Analytics events connect to the product graph:

```
Analytics Event → Story → Journey Step → Persona → Customer
```

This enables:
- Customer-level analytics
- Journey-level metrics
- Persona-based insights

---

## Best Practices

1. **Define Events First** - Plan tracking before implementation
2. **Link to Stories** - Always include storyId in events
3. **Consistent Naming** - Use consistent event names
4. **Include Context** - Add meaningful properties
5. **Review Regularly** - Check metrics weekly
6. **Act on Insights** - Use data to drive decisions

---

## Privacy & Compliance

- GDPR compliant data collection
- User consent management
- Data anonymization options
- Right to deletion support

---

## Future Enhancements

- [ ] Real-time analytics dashboard
- [ ] Predictive analytics
- [ ] Automated A/B test analysis
- [ ] Customer journey analytics
- [ ] Revenue attribution modeling

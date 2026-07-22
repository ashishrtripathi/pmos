# Customer Journey Engine

## Overview

The Customer Journey Engine is the heart of PMOS. It provides a visual editor for creating, managing, and analyzing customer journeys.

---

## Features

### Journey Creation

- **Visual Editor** - Drag-and-drop journey builder
- **AI Generation** - Auto-generate journeys from websites or repositories
- **Templates** - Pre-built journey templates
- **Version Control** - Track journey changes over time

### Journey Steps

Each step in the journey includes:

| Field | Description |
|-------|-------------|
| **Name** | Step identifier |
| **Description** | What happens at this step |
| **Screenshot** | Visual representation |
| **Goal** | User's objective |
| **Primary CTA** | Main call-to-action |
| **Pain Points** | Identified issues |
| **Stories** | Connected user stories |
| **Analytics** | Usage metrics |
| **Future Improvements** | Planned enhancements |

### Visual Storyboard

Transform journeys into visual storyboards:

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Landing   │────▶│  Sign Up    │────▶│  Onboarding │
│   Page      │     │  Form      │     │  Flow       │
├─────────────┤     ├─────────────┤     ├─────────────┤
│ Goal:       │     │ Goal:       │     │ Goal:       │
│ Discover    │     │ Convert     │     │ Activate    │
│             │     │             │     │             │
│ Pain:       │     │ Pain:       │     │ Pain:       │
│ Confusing   │     │ Too many    │     │ Overwhelmed │
│ nav         │     │ fields      │     │ by features │
├─────────────┤     ├─────────────┤     ├─────────────┤
│ Stories:    │     │ Stories:    │     │ Stories:    │
│ - US-123    │     │ - US-124    │     │ - US-125    │
│ - US-124    │     │ - US-125    │     │ - US-126    │
└─────────────┘     └─────────────┘     └─────────────┘
```

---

## API Endpoints

### List Journeys

```typescript
trpc.journey.list.query()
```

### Create Journey

```typescript
trpc.journey.create.mutate({
  name: string,
  description?: string,
  personaId: string,
})
```

### Update Journey

```typescript
trpc.journey.update.mutate({
  id: string,
  name?: string,
  description?: string,
  status?: 'draft' | 'active' | 'archived',
})
```

### Generate from Website

```typescript
trpc.journey.generateFromWebsite.mutate({
  url: string,
})
```

### Generate from Repository

```typescript
trpc.journey.generateFromRepository.mutate({
  repositoryUrl: string,
})
```

---

## Data Model

```typescript
interface Journey {
  id: string;
  organizationId: string;
  personaId: string;
  name: string;
  description?: string;
  version: number;
  status: 'draft' | 'active' | 'archived';
  steps: JourneyStep[];
  createdAt: Date;
  updatedAt: Date;
}

interface JourneyStep {
  id: string;
  journeyId: string;
  order: number;
  name: string;
  description?: string;
  screenshotUrl?: string;
  goal: string;
  primaryCta?: string;
  painPoints: string[];
  stories: Story[];
  analytics: AnalyticsData;
  futureImprovements: string[];
  metadata: Record<string, any>;
}
```

---

## AI Generation

### Website Mode

The AI crawls a website and generates a journey:

1. **Crawl** - Discover all pages and navigation
2. **Analyze** - Identify user flows and goals
3. **Map** - Create journey steps
4. **Enhance** - Add pain points and improvements

### Repository Mode

The AI analyzes a codebase:

1. **Scan** - Analyze routes, components, pages
2. **Navigate** - Automatically explore the application
3. **Capture** - Take screenshots of each screen
4. **Map** - Create journey from discovered flows

### Greenfield Mode

The AI generates from a product idea:

1. **Research** - Analyze similar products
2. **Persona** - Generate user personas
3. **Journey** - Create customer journey
4. **Validate** - Check against best practices

---

## Components

### JourneyEditor

Main visual editor component for creating and modifying journeys.

### JourneyStepCard

Card component displaying a single journey step with all its details.

### JourneyTimeline

Horizontal timeline view of the journey flow.

### JourneyVersionSelector

Component for switching between journey versions and comparing changes.

---

## Usage Examples

### Creating a Journey Manually

```typescript
// 1. Create a new journey
const journey = await trpc.journey.create.mutate({
  name: 'User Onboarding',
  description: 'First-time user experience',
  personaId: 'new-user-persona',
});

// 2. Add steps
await trpc.journey.addStep.mutate({
  journeyId: journey.id,
  name: 'Landing Page',
  goal: 'Understand product value',
  order: 1,
});

// 3. Connect stories to steps
await trpc.journey.connectStory.mutate({
  stepId: step.id,
  storyId: story.id,
});
```

### Generating a Journey from Website

```typescript
const result = await trpc.journey.generateFromWebsite.mutate({
  url: 'https://example.com',
});

// result.journey contains the generated journey
// result.screenshots contains captured screenshots
// result.personas contains generated personas
```

---

## Best Practices

1. **Start with Personas** - Define who the journey is for
2. **One Goal Per Step** - Each step should have a clear objective
3. **Capture Pain Points** - Document issues at each step
4. **Connect Stories** - Link implementation work to journey steps
5. **Version Control** - Track changes over time
6. **Validate with Data** - Use analytics to confirm assumptions

---

## Future Enhancements

- [ ] Real-time collaboration on journeys
- [ ] Integration with analytics platforms
- [ ] A/B testing journey variations
- [ ] Journey impact scoring
- [ ] Customer journey mapping workshops

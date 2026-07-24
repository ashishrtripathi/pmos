# System Design

## 🎯 Overview

This document details the technical system design for PMOS, covering the complete architecture from data layer to user interface.

---

## 🏗️ High-Level Architecture

### Technology Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Frontend** | Next.js 14+ | React, SSR, App Router |
| **UI Components** | shadcn/ui + Tailwind | Beautiful, accessible, customizable |
| **State Management** | Zustand + React Query | Lightweight, async-ready |
| **API** | tRPC + REST fallback | Type-safe, fast iteration |
| **Database** | PostgreSQL | Relational data, ACID |
| **Graph DB** | Neo4j | Knowledge graph queries |
| **Cache** | Redis | Session, real-time features |
| **Search** | Meilisearch | Fast, typo-tolerant search |
| **Queue** | BullMQ | Background job processing |
| **AI/LLM** | OpenAI/Anthropic/Local | Flexible model support |
| **Storage** | S3-compatible | Assets, screenshots |
| **Auth** | NextAuth.js | Multiple providers |

---

## 📊 Data Layer Design

### PostgreSQL Schema

```sql
-- Core tables
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    organization_id UUID REFERENCES organizations(id),
    role VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, organization_id)
);

-- Customer & Persona tables
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    name VARCHAR(255),
    email VARCHAR(255),
    segments JSONB DEFAULT '[]',
    attributes JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE personas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    goals JSONB DEFAULT '[]',
    frustrations JSONB DEFAULT '[]',
    demographics JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Journey tables
CREATE TABLE journeys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    persona_id UUID REFERENCES personas(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    version INTEGER DEFAULT 1,
    status VARCHAR(50) DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE journey_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    journey_id UUID REFERENCES journeys(id) ON DELETE CASCADE,
    "order" INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    screenshot_url TEXT,
    goal TEXT,
    pain_points JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Story mapping tables
CREATE TABLE story_maps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    journey_id UUID REFERENCES journeys(id),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_map_id UUID REFERENCES story_maps(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    "order" INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_id UUID REFERENCES activities(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    "order" INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Story tables
CREATE TABLE stories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    task_id UUID REFERENCES tasks(id),
    journey_step_id UUID REFERENCES journey_steps(id),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    acceptance_criteria JSONB DEFAULT '[]',
    business_rules JSONB DEFAULT '[]',
    edge_cases JSONB DEFAULT '[]',
    priority VARCHAR(50) DEFAULT 'medium',
    status VARCHAR(50) DEFAULT 'backlog',
    story_points INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE story_dependencies (
    story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
    depends_on_id UUID REFERENCES stories(id) ON DELETE CASCADE,
    PRIMARY KEY (story_id, depends_on_id)
);

-- Design tables
CREATE TABLE designs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID REFERENCES stories(id),
    type VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'draft',
    assets JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE design_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    design_id UUID REFERENCES designs(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    content TEXT NOT NULL,
    position JSONB,
    resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Implementation tables
CREATE TABLE implementations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID REFERENCES stories(id),
    agent_id UUID REFERENCES ai_agents(id),
    plan JSONB DEFAULT '{}',
    branch_name VARCHAR(255),
    pull_request_url TEXT,
    status VARCHAR(50) DEFAULT 'planned',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- AI Agent tables
CREATE TABLE ai_agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    name VARCHAR(255) NOT NULL,
    role VARCHAR(100) NOT NULL,
    context JSONB DEFAULT '{}',
    memory JSONB DEFAULT '{}',
    skills JSONB DEFAULT '[]',
    status VARCHAR(50) DEFAULT 'idle',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Analytics tables
CREATE TABLE analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    story_id UUID REFERENCES stories(id),
    event_type VARCHAR(100) NOT NULL,
    properties JSONB DEFAULT '{}',
    timestamp TIMESTAMP DEFAULT NOW()
);

-- Integration tables
CREATE TABLE integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    type VARCHAR(100) NOT NULL,
    config JSONB DEFAULT '{}',
    status VARCHAR(50) = 'active',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_journeys_organization ON journeys(organization_id);
CREATE INDEX idx_journey_steps_journey ON journey_steps(journey_id);
CREATE INDEX idx_stories_organization ON stories(organization_id);
CREATE INDEX idx_stories_status ON stories(status);
CREATE INDEX idx_analytics_events_story ON analytics_events(story_id);
CREATE INDEX idx_analytics_events_timestamp ON analytics_events(timestamp);
```

### Neo4j Graph Schema

```cypher
// Node labels and relationships

// Customer nodes
CREATE CONSTRAINT FOR (c:Customer) REQUIRE c.id IS UNIQUE;

// Persona nodes
CREATE CONSTRAINT FOR (p:Persona) REQUIRE p.id IS UNIQUE;

// Journey nodes
CREATE CONSTRAINT FOR (j:Journey) REQUIRE j.id IS UNIQUE;

// JourneyStep nodes
CREATE CONSTRAINT FOR (js:JourneyStep) REQUIRE js.id IS UNIQUE;

// Story nodes
CREATE CONSTRAINT FOR (s:Story) REQUIRE s.id IS UNIQUE;

// Design nodes
CREATE CONSTRAINT FOR (d:Design) REQUIRE d.id IS UNIQUE;

// Implementation nodes
CREATE CONSTRAINT FOR (impl:Implementation) REQUIRE impl.id IS UNIQUE;

// AI Agent nodes
CREATE CONSTRAINT FOR (agent:AIAgent) REQUIRE agent.id IS UNIQUE;

// Relationships
CREATE (c:Customer)-[:HAS_PERSONA]->(p:Persona)
CREATE (p:Persona)-[:FOLLOWS]->(j:Journey)
CREATE (j:Journey)-[:CONTAINS]->(js:JourneyStep)
CREATE (js:JourneyStep)-[:INCLUDES]->(s:Story)
CREATE (s:Story)-[:HAS_DESIGN]->(d:Design)
CREATE (s:Story)-[:HAS_IMPLEMENTATION]->(impl:Implementation)
CREATE (impl:Implementation)-[:ASSIGNED_TO]->(agent:AIAgent)
CREATE (s1:Story)-[:DEPENDS_ON]->(s2:Story)
CREATE (js:JourneyStep)-[:TRACKED_BY]->(ae:AnalyticsEvent)
CREATE (s:Story)-[:MEASURED_BY]->(ae:AnalyticsEvent)
```

---

## 🔌 API Design

### tRPC Router Structure

```typescript
// server/routers/_app.ts
import { router } from '../trpc';
import { customerRouter } from './customer';
import { personaRouter } from './persona';
import { journeyRouter } from './journey';
import { storyMapRouter } from './storyMap';
import { storyRouter } from './story';
import { designRouter } from './design';
import { implementationRouter } from './implementation';
import { agentRouter } from './agent';
import { analyticsRouter } from './analytics';
import { graphRouter } from './graph';

export const appRouter = router({
  customer: customerRouter,
  persona: personaRouter,
  journey: journeyRouter,
  storyMap: storyMapRouter,
  story: storyRouter,
  design: designRouter,
  implementation: implementationRouter,
  agent: agentRouter,
  analytics: analyticsRouter,
  graph: graphRouter,
});

export type AppRouter = typeof appRouter;
```

### Example Router

```typescript
// server/routers/journey.ts
import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { db } from '../db';

export const journeyRouter = router({
  list: protectedProcedure
    .query(async ({ ctx }) => {
      return db.journey.findMany({
        where: { organizationId: ctx.organizationId },
        include: { steps: true, persona: true },
        orderBy: { updatedAt: 'desc' },
      });
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      return db.journey.findUnique({
        where: { id: input.id },
        include: { 
          steps: { include: { stories: true } },
          persona: true,
        },
      });
    }),

  create: protectedProcedure
    .input(z.object({
      name: z.string(),
      description: z.string().optional(),
      personaId: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      return db.journey.create({
        data: {
          ...input,
          organizationId: ctx.organizationId,
        },
      });
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().optional(),
      description: z.string().optional(),
      status: z.enum(['draft', 'active', 'archived']).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;
      return db.journey.update({
        where: { id },
        data,
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return db.journey.delete({
        where: { id: input.id },
      });
    }),

  generateFromWebsite: protectedProcedure
    .input(z.object({ url: z.string().url() }))
    .mutation(async ({ input, ctx }) => {
      // Call AI engine to analyze website
      const analysis = await aiEngine.analyzeWebsite(input.url);
      
      // Create journey from analysis
      return aiEngine.generateJourney(analysis, ctx.organizationId);
    }),
});
```

---

## 🧠 AI Engine Design

### LLM Provider Abstraction

```typescript
// lib/ai/providers/base.ts
export interface LLMProvider {
  name: string;
  complete(prompt: string, options?: CompletionOptions): Promise<string>;
  chat(messages: Message[], options?: ChatOptions): Promise<string>;
  embed(text: string): Promise<number[]>;
}

export interface CompletionOptions {
  temperature?: number;
  maxTokens?: number;
  stop?: string[];
  stream?: boolean;
}

// lib/ai/providers/openai.ts
export class OpenAIProvider implements LLMProvider {
  name = 'openai';
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async complete(prompt: string, options?: CompletionOptions): Promise<string> {
    const response = await this.client.completions.create({
      model: 'gpt-4',
      prompt,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 2000,
    });
    return response.choices[0].text;
  }

  async chat(messages: Message[], options?: ChatOptions): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: 'gpt-4',
      messages,
      temperature: options?.temperature ?? 0.7,
    });
    return response.choices[0].message.content;
  }

  async embed(text: string): Promise<number[]> {
    const response = await this.client.embeddings.create({
      model: 'text-embedding-ada-002',
      input: text,
    });
    return response.data[0].embedding;
  }
}
```

### Agent Framework

```typescript
// lib/ai/agents/base.ts
export abstract class BaseAgent {
  protected llm: LLMProvider;
  protected memory: AgentMemory;
  protected context: AgentContext;

  constructor(config: AgentConfig) {
    this.llm = config.llm;
    this.memory = config.memory;
    this.context = config.context;
  }

  abstract get role(): AgentRole;
  abstract get systemPrompt(): string;

  async think(input: string): Promise<string> {
    const context = await this.buildContext();
    const messages = [
      { role: 'system', content: this.systemPrompt },
      ...context,
      { role: 'user', content: input },
    ];
    
    const response = await this.llm.chat(messages);
    await this.memory.store(input, response);
    
    return response;
  }

  async execute(task: Task): Promise<TaskResult> {
    const plan = await this.plan(task);
    const results = [];
    
    for (const step of plan.steps) {
      const result = await this.executeStep(step);
      results.push(result);
    }
    
    return this.aggregateResults(results);
  }

  protected async buildContext(): Promise<Message[]> {
    const memories = await this.memory.getRecent(10);
    const productContext = await this.context.getProductContext();
    
    return [
      ...memories.map(m => ({ role: 'assistant', content: m.response })),
      { role: 'user', content: `Product context: ${JSON.stringify(productContext)}` },
    ];
  }

  protected abstract plan(task: Task): Promise<Plan>;
  protected abstract executeStep(step: PlanStep): Promise<StepResult>;
  protected abstract aggregateResults(results: StepResult[]): Promise<TaskResult>;
}
```

### Skill System

```typescript
// lib/ai/skills/base.ts
export interface Skill {
  name: string;
  description: string;
  execute(input: any, context: SkillContext): Promise<any>;
}

// lib/ai/skills/journey-analyzer.ts
export class JourneyAnalyzerSkill implements Skill {
  name = 'journey-analyzer';
  description = 'Analyzes customer journeys and suggests improvements';

  async execute(input: AnalyzeInput, context: SkillContext): Promise<AnalysisResult> {
    const { journeyId } = input;
    const journey = await context.db.journey.findUnique({
      where: { id: journeyId },
      include: { steps: { include: { stories: true } } },
    });

    const analysis = await context.llm.complete(`
      Analyze this customer journey and provide insights:
      
      Journey: ${journey.name}
      Steps: ${journey.steps.map(s => s.name).join(' → ')}
      
      Identify:
      1. Pain points
      2. Drop-off risks
      3. Missing steps
      4. Improvement opportunities
    `);

    return {
      painPoints: extractPainPoints(analysis),
      risks: extractRisks(analysis),
      missingSteps: extractMissingSteps(analysis),
      opportunities: extractOpportunities(analysis),
    };
  }
}
```

---

## 🖥️ Frontend Design

### Component Architecture

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── journeys/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   ├── stories/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   ├── designs/
│   │   ├── agents/
│   │   └── analytics/
│   └── api/
│       └── trpc/[trpc]/
│
├── components/
│   ├── ui/                    # shadcn/ui components
│   ├── journey/
│   │   ├── JourneyEditor.tsx
│   │   ├── JourneyStepCard.tsx
│   │   └── JourneyTimeline.tsx
│   ├── story-map/
│   │   ├── StoryMapBoard.tsx
│   │   ├── ActivityColumn.tsx
│   │   └── StoryCard.tsx
│   ├── stories/
│   │   ├── StoryDetail.tsx
│   │   ├── AcceptanceCriteria.tsx
│   │   └── StoryComments.tsx
│   ├── designs/
│   │   ├── DesignReview.tsx
│   │   └── DesignCanvas.tsx
│   └── shared/
│       ├── Header.tsx
│       ├── Sidebar.tsx
│       └── CommandPalette.tsx
│
├── hooks/
│   ├── useJourney.ts
│   ├── useStory.ts
│   └── useAgent.ts
│
├── lib/
│   ├── trpc.ts
│   ├── auth.ts
│   └── utils.ts
│
└── styles/
    └── globals.css
```

### Example Component

```tsx
// components/journey/JourneyEditor.tsx
'use client';

import { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { trpc } from '@/lib/trpc';
import { JourneyStepCard } from './JourneyStepCard';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface JourneyEditorProps {
  journeyId: string;
}

export function JourneyEditor({ journeyId }: JourneyEditorProps) {
  const { data: journey, isLoading } = trpc.journey.getById.useQuery({
    id: journeyId,
  });

  const utils = trpc.useContext();

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;

    const steps = Array.from(journey.steps);
    const [removed] = steps.splice(result.source.index, 1);
    steps.splice(result.destination.index, 0, removed);

    // Update order in database
    await trpc.journey.updateStepsOrder.mutate({
      journeyId,
      stepIds: steps.map(s => s.id),
    });

    utils.journey.getById.invalidate({ id: journeyId });
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{journey.name}</h2>
        <Button onClick={() => {/* Add step */}}>
          <Plus className="mr-2 h-4 w-4" />
          Add Step
        </Button>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="steps" direction="horizontal">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="flex gap-4 overflow-x-auto pb-4"
            >
              {journey.steps.map((step, index) => (
                <Draggable key={step.id} draggableId={step.id} index={index}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                    >
                      <JourneyStepCard step={step} />
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}
```

---

## 🔒 Security Design

### Authentication Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │────▶│   NextAuth  │────▶│   Provider  │
│             │◀────│             │◀────│  (OAuth)    │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │
       ▼                   ▼                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Session   │     │    JWT      │     │   User      │
│   Cookie    │     │   Token     │     │   Data      │
└─────────────┘     └─────────────┘     └─────────────┘
```

### Authorization Middleware

```typescript
// middleware/auth.ts
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function authorizationMiddleware(
  request: NextRequest,
  requiredPermission: Permission
) {
  const token = await getToken({ req: request });
  
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const userPermissions = await getUserPermissions(token.sub);
  
  if (!userPermissions.includes(requiredPermission)) {
    return NextResponse.json(
      { error: 'Insufficient permissions' },
      { status: 403 }
    );
  }

  return NextResponse.next();
}
```

---

## 📈 Performance Considerations

### Caching Strategy

```typescript
// lib/cache.ts
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export async function cached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 3600
): Promise<T> {
  const cached = await redis.get(key);
  
  if (cached) {
    return JSON.parse(cached);
  }

  const result = await fetcher();
  await redis.setex(key, ttl, JSON.stringify(result));
  
  return result;
}
```

### Database Query Optimization

```typescript
// Optimized queries with select and include
const journeyWithSteps = await db.journey.findUnique({
  where: { id: journeyId },
  select: {
    id: true,
    name: true,
    description: true,
    steps: {
      select: {
        id: true,
        name: true,
        goal: true,
        _count: {
          select: { stories: true },
        },
      },
      orderBy: { order: 'asc' },
    },
  },
});
```

---

## 🧪 Testing Strategy

### Unit Tests

```typescript
// __tests__/unit/journey.test.ts
import { JourneyAnalyzerSkill } from '@/lib/ai/skills/journey-analyzer';

describe('JourneyAnalyzerSkill', () => {
  it('should identify pain points in a journey', async () => {
    const skill = new JourneyAnalyzerSkill();
    const context = createMockContext();
    
    const result = await skill.execute(
      { journeyId: 'test-journey' },
      context
    );

    expect(result.painPoints).toBeDefined();
    expect(Array.isArray(result.painPoints)).toBe(true);
  });
});
```

### Integration Tests

```typescript
// __tests__/integration/journey-api.test.ts
import { createCaller } from '@/server/routers/_app';
import { createTestContext } from '../helpers';

describe('Journey API', () => {
  it('should create a journey', async () => {
    const ctx = await createTestContext();
    const caller = createCaller(ctx);

    const journey = await caller.journey.create({
      name: 'Test Journey',
      personaId: 'test-persona',
    });

    expect(journey).toBeDefined();
    expect(journey.name).toBe('Test Journey');
  });
});
```

---

This document provides the technical foundation for building PMOS. For implementation details, see the specific module documentation.

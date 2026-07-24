# Developer Guide

This guide provides detailed information for developers contributing to PMOS.

---

## 🏗️ Architecture Overview

PMOS is built with a modern TypeScript stack:

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│  Next.js 14 + React 18 + TypeScript + Tailwind CSS          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                          API Layer                           │
│  tRPC + Zod + Prisma                                        │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│  PostgreSQL  │      │    Redis     │      │    Neo4j     │
│  (Primary)   │      │   (Cache)    │      │  (Graph)     │
└──────────────┘      └──────────────┘      └──────────────┘
```

---

## 📁 Project Structure

```
pmos/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Auth pages
│   │   ├── (dashboard)/       # Main app pages
│   │   └── api/               # API routes
│   │
│   ├── components/            # React components
│   │   ├── ui/               # Base UI components (shadcn)
│   │   ├── journey/          # Journey-related components
│   │   ├── story-map/        # Story mapping components
│   │   ├── stories/          # Story components
│   │   ├── designs/          # Design components
│   │   └── shared/           # Shared components
│   │
│   ├── lib/                  # Utility libraries
│   │   ├── trpc/             # tRPC configuration
│   │   ├── auth/             # Authentication
│   │   ├── db/               # Database client
│   │   ├── ai/               # AI/LLM integration
│   │   └── utils/            # Utility functions
│   │
│   ├── server/               # Server-side code
│   │   ├── routers/          # tRPC routers
│   │   ├── services/         # Business logic
│   │   └── middleware/       # Middleware
│   │
│   └── types/                # TypeScript types
│
├── prisma/                   # Database schema
│   ├── schema.prisma
│   └── migrations/
│
├── public/                   # Static assets
│
└── tests/                    # Test files
    ├── unit/
    ├── integration/
    └── e2e/
```

---

## 🔧 Development Setup

### IDE Configuration

#### VS Code

Recommended extensions:

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "prisma.prisma",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next"
  ]
}
```

#### Settings

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "non-relative"
}
```

### Database Setup

#### Prisma Commands

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database (dev)
npx prisma db push

# Create migration
npx prisma migrate dev --name migration_name

# Reset database
npx prisma migrate reset

# Open Prisma Studio
npx prisma studio
```

#### Seeding Data

```bash
# Seed with sample data
npm run db:seed

# Seed specific dataset
npm run db:seed -- --dataset=demo
```

---

## 🧪 Testing

### Test Structure

```
tests/
├── unit/                   # Unit tests
│   ├── services/
│   ├── lib/
│   └── components/
│
├── integration/            # Integration tests
│   ├── api/
│   └── database/
│
└── e2e/                    # End-to-end tests
    ├── journeys/
    ├── stories/
    └── auth/
```

### Writing Tests

#### Unit Test Example

```typescript
// tests/unit/services/journey.test.ts
import { JourneyService } from '@/server/services/journey';
import { db } from '@/lib/db';

describe('JourneyService', () => {
  let service: JourneyService;

  beforeEach(() => {
    service = new JourneyService(db);
  });

  describe('create', () => {
    it('should create a journey with steps', async () => {
      const journey = await service.create({
        name: 'Test Journey',
        personaId: 'persona-1',
        organizationId: 'org-1',
      });

      expect(journey).toBeDefined();
      expect(journey.name).toBe('Test Journey');
    });
  });
});
```

#### Integration Test Example

```typescript
// tests/integration/api/journey.test.ts
import { createCaller } from '@/server/routers/_app';
import { createTestContext } from '../helpers';

describe('Journey API', () => {
  it('should list journeys', async () => {
    const ctx = await createTestContext();
    const caller = createCaller(ctx);

    const journeys = await caller.journey.list();

    expect(Array.isArray(journeys)).toBe(true);
  });
});
```

#### E2E Test Example

```typescript
// tests/e2e/journeys/create.spec.ts
import { test, expect } from '@playwright/test';

test('should create a new journey', async ({ page }) => {
  await page.goto('/journeys');
  await page.click('button:has-text("New Journey")');
  await page.fill('input[name="name"]', 'E2E Test Journey');
  await page.click('button:has-text("Create")');

  await expect(page).toHaveURL(/\/journeys\/.+/);
  await expect(page.locator('h1')).toContainText('E2E Test Journey');
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Run e2e tests
npm run test:e2e

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- journey.test.ts
```

---

## 🔄 API Development

### Creating a New Router

```typescript
// src/server/routers/example.ts
import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { ExampleService } from '../services/example';

export const exampleRouter = router({
  list: protectedProcedure
    .query(async ({ ctx }) => {
      const service = new ExampleService();
      return service.list(ctx.organizationId);
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const service = new ExampleService();
      return service.getById(input.id, ctx.organizationId);
    }),

  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      description: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const service = new ExampleService();
      return service.create(input, ctx.organizationId);
    }),
});
```

### Adding to App Router

```typescript
// src/server/routers/_app.ts
import { exampleRouter } from './example';

export const appRouter = router({
  // ... other routers
  example: exampleRouter,
});
```

---

## 🧠 AI Integration

### Creating a New AI Skill

```typescript
// src/lib/ai/skills/my-skill.ts
import { Skill, SkillContext, SkillResult } from '../types';

export class MySkill implements Skill {
  name = 'my-skill';
  description = 'Description of what this skill does';

  async execute(
    input: MySkillInput,
    context: SkillContext
  ): Promise<SkillResult<MySkillOutput>> {
    // Implementation
    const result = await context.llm.complete(`
      Process this input: ${JSON.stringify(input)}
      
      Use this context: ${JSON.stringify(context.product)}
    `);

    return {
      success: true,
      data: parseResult(result),
    };
  }
}
```

### Registering the Skill

```typescript
// src/lib/ai/skills/index.ts
import { MySkill } from './my-skill';

export const skills = {
  // ... other skills
  mySkill: new MySkill(),
};
```

---

## 🎨 Component Development

### Creating a New Component

```typescript
// src/components/my-feature/MyComponent.tsx
'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface MyComponentProps {
  title: string;
  onSelect?: (id: string) => void;
}

export function MyComponent({ title, onSelect }: MyComponentProps) {
  const [selected, setSelected] = useState<string | null>(null);

  const handleClick = (id: string) => {
    setSelected(id);
    onSelect?.(id);
  };

  return (
    <div className="rounded-lg border p-4">
      <h3 className="text-lg font-semibold">{title}</h3>
      {/* Component content */}
    </div>
  );
}
```

### Component Story

```typescript
// src/components/my-feature/MyComponent.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { MyComponent } from './MyComponent';

const meta: Meta<typeof MyComponent> = {
  title: 'MyFeature/MyComponent',
  component: MyComponent,
};

export default meta;
type Story = StoryObj<typeof MyComponent>;

export const Default: Story = {
  args: {
    title: 'Example Title',
  },
};
```

---

## 🚀 Deployment

### Environment Variables

Required for production:

```env
# Database
DATABASE_URL=postgresql://...

# Redis
REDIS_URL=redis://...

# Auth
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://app.pmos.dev

# AI
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# GitHub
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
```

### Build Commands

```bash
# Build for production
npm run build

# Start production server
npm start

# Check build size
npm run build:analyze
```

### Docker

```bash
# Build image
docker build -t pmos .

# Run container
docker run -p 3000:3000 pmos
```

---

## 📝 Coding Standards

### TypeScript

- Use strict mode
- Prefer interfaces over types
- Use descriptive names
- Add JSDoc comments for public APIs

### React

- Use functional components
- Keep components small and focused
- Use custom hooks for logic
- Avoid inline styles

### CSS/Tailwind

- Use Tailwind utility classes
- Follow naming conventions
- Use CSS variables for theming
- Keep responsive design in mind

### Git

- Use conventional commits
- Keep PRs focused
- Write descriptive PR descriptions
- Link issues

---

## 🔍 Debugging

### Common Issues

#### Database Connection

```bash
# Check PostgreSQL is running
pg_isready

# Check connection
psql $DATABASE_URL
```

#### Redis Connection

```bash
# Check Redis is running
redis-cli ping
```

#### TypeScript Errors

```bash
# Run type check
npm run type-check

# Regenerate Prisma client
npx prisma generate
```

### Debug Tools

- **React DevTools** - Component inspection
- **Prisma Studio** - Database browser
- **tRPC Panel** - API testing
- **Next.js DevTools** - Performance

---

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [tRPC Documentation](https://trpc.io/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

---

Happy coding! 🚀

# Skills Library

## Overview

PMOS skills are reusable AI capabilities that can be composed to perform complex tasks. Each skill encapsulates a specific domain expertise.

---

## Skill Categories

### Discovery Skills

| Skill | Description |
|-------|-------------|
| `website-analyzer` | Analyze website structure and user flows |
| `repository-analyzer` | Analyze codebase and generate documentation |
| `persona-generator` | Create user personas from data |
| `jtbd-extractor` | Extract Jobs-To-Be-Done from interviews |

### Journey Skills

| Skill | Description |
|-------|-------------|
| `journey-generator` | Generate customer journeys |
| `journey-analyzer` | Analyze and improve journeys |
| `pain-point-detector` | Identify pain points in journeys |
| `opportunity-finder` | Find improvement opportunities |

### Story Skills

| Skill | Description |
|-------|-------------|
| `story-generator` | Generate user stories |
| `acceptance-criteria-writer` | Write acceptance criteria |
| `story-point-estimator` | Estimate story complexity |
| `dependency-mapper` | Map story dependencies |

### Design Skills

| Skill | Description |
|-------|-------------|
| `wireframe-generator` | Generate wireframes |
| `mockup-generator` | Create high-fidelity mockups |
| `design-reviewer` | Review designs for issues |
| `accessibility-checker` | Check WCAG compliance |

### Coding Skills

| Skill | Description |
|-------|-------------|
| `component-builder` | Build React components |
| `api-builder` | Create tRPC endpoints |
| `test-writer` | Write unit and integration tests |
| `code-reviewer` | Review code for quality |

### Analytics Skills

| Skill | Description |
|-------|-------------|
| `metric-tracker` | Track and analyze metrics |
| `insight-generator` | Generate insights from data |
| `report-builder` | Build analytics reports |

---

## Skill Structure

```typescript
interface Skill {
  name: string;
  description: string;
  category: string;
  
  // Input/Output schemas
  inputSchema: ZodSchema;
  outputSchema: ZodSchema;
  
  // Execution
  execute: (input: any, context: SkillContext) => Promise<any>;
  
  // Configuration
  config?: SkillConfig;
}

interface SkillContext {
  llm: LLMProvider;
  db: Database;
  memory: AgentMemory;
  product: ProductContext;
}
```

---

## Using Skills

### In Agent Playbooks

```yaml
playbook: generate-feature
steps:
  - skill: persona-generator
    input:
      source: interviews
  - skill: journey-generator
    input:
      persona: ${previous.persona}
  - skill: story-generator
    input:
      journey: ${previous.journey}
```

### In Code

```typescript
import { skills } from '@pmos/skills';

// Generate a journey from a website
const journey = await skills.journeyGenerator.execute(
  { url: 'https://example.com' },
  { llm, db, memory, product }
);
```

---

## Creating Skills

### Skill Template

```typescript
// skills/my-skill/index.ts
import { z } from 'zod';
import { Skill, SkillContext } from '@pmos/skills';

const inputSchema = z.object({
  // Define input
});

const outputSchema = z.object({
  // Define output
});

export const mySkill: Skill = {
  name: 'my-skill',
  description: 'Description of what this skill does',
  category: 'discovery',
  
  inputSchema,
  outputSchema,
  
  async execute(input, context) {
    // Implementation
    const result = await context.llm.complete(/* ... */);
    return { /* ... */ };
  },
};
```

### Registering Skills

```typescript
// skills/index.ts
import { mySkill } from './my-skill';

export const skills = {
  mySkill,
  // ... other skills
};
```

---

## Best Practices

1. **Single Responsibility** - Each skill should do one thing well
2. **Clear Interfaces** - Define clear input/output schemas
3. **Composable** - Skills should work together
4. **Testable** - Include tests for each skill
5. **Documented** - Clear description and examples

---

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines on creating new skills.

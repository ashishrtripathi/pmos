# Prompt Library

## Overview

This directory contains reusable prompts for PMOS AI agents. Use these as starting points and customize for your needs.

---

## Discovery Prompts

### Analyze Website

```markdown
Analyze the website at {{url}} and provide:

1. **Site Structure**
   - Main navigation items
   - Key pages identified
   - User flows discovered

2. **Features Identified**
   - Authentication
   - Forms
   - CTAs
   - Interactive elements

3. **User Personas**
   - Primary persona
   - Secondary persona
   - Use cases

4. **Pain Points**
   - UX issues
   - Missing features
   - Improvement opportunities

5. **Customer Journey**
   - Steps identified
   - Goals at each step
   - Pain points at each step

Format your response as structured JSON.
```

### Extract Personas

```markdown
Based on the following data, create user personas:

**Data Source**: {{source}}
**Data Content**: {{content}}

Create 2-4 personas with:
- Name and photo description
- Demographics
- Goals and motivations
- Pain points
- Technical proficiency
- Quote that captures their essence

Format as JSON with the following structure:
{
  "personas": [
    {
      "name": "...",
      "demographics": {...},
      "goals": [...],
      "painPoints": [...],
      "quote": "..."
    }
  ]
}
```

---

## Journey Prompts

### Generate Journey from Website

```markdown
Generate a customer journey for a user visiting {{url}}.

Consider:
1. First-time visitor experience
2. Key conversion points
3. Potential drop-off points
4. Value delivery moments

For each step include:
- Step name
- User goal
- Actions taken
- Pain points
- Opportunities for improvement

Format as a journey with steps in chronological order.
```

### Analyze Journey

```markdown
Analyze this customer journey:

{{journey}}

Identify:
1. Critical pain points
2. Drop-off risks
3. Missing steps
4. Improvement opportunities
5. Quick wins

Prioritize recommendations by impact and effort.
```

---

## Story Prompts

### Generate Stories from Journey Step

```markdown
Generate user stories for this journey step:

**Step Name**: {{stepName}}
**Step Goal**: {{stepGoal}}
**User Persona**: {{persona}}

Create stories in this format:
**Title**: [Title]
**As a** [persona]
**I want to** [action]
**So that** [benefit]

**Acceptance Criteria**:
- Given [precondition]
- When [action]
- Then [result]

**Story Points**: [1-13]
**Priority**: [High/Medium/Low]

Generate 3-5 stories covering:
- Happy path
- Edge cases
- Error scenarios
```

### Write Acceptance Criteria

```markdown
Write acceptance criteria for this story:

**Story**: {{story}}

Use Given/When/Then format for:
1. Happy path scenario
2. Edge case 1
3. Edge case 2
4. Error scenario

Also include:
- Business rules (3-5)
- Performance requirements
- Accessibility requirements
```

---

## Design Prompts

### Generate Wireframe

```markdown
Generate a wireframe description for:

**Feature**: {{feature}}
**Screen**: {{screen}}
**User Goal**: {{goal}}

Describe:
1. Layout structure
2. Key components
3. Content hierarchy
4. Primary action
5. Secondary actions

Describe in enough detail for implementation.
```

### Review Design

```markdown
Review this design:

{{designDescription}}

Check for:
1. UX best practices
2. Accessibility issues
3. Consistency with design system
4. Missing states (loading, error, empty)
5. Mobile responsiveness

Provide specific, actionable feedback.
```

---

## Coding Prompts

### Generate Implementation Plan

```markdown
Create an implementation plan for:

**Story**: {{story}}
**Acceptance Criteria**: {{criteria}}

Break down into:
1. Tasks (with file changes)
2. Database changes
3. API changes
4. Frontend changes
5. Tests needed

Estimate time for each task.
Consider dependencies and risks.
```

### Write Component

```markdown
Write a React component for:

**Component Name**: {{name}}
**Purpose**: {{purpose}}
**Props**: {{props}}

Requirements:
- TypeScript
- Functional component
- Tailwind CSS
- Accessible (ARIA)
- Test file

Include:
- Component code
- Test file
- Usage example
```

---

## Customization

### Variables

Use `{{variable}}` syntax for template variables:

- `{{url}}` - Website URL
- `{{story}}` - Story description
- `{{persona}}` - User persona
- `{{journey}}` - Journey data

### Combining Prompts

Chain prompts together:

```typescript
const persona = await llm.complete(analyzeWebsitePrompt);
const journey = await llm.complete(generateJourneyPrompt, { persona });
const stories = await llm.complete(generateStoriesPrompt, { journey });
```

---

## Contributing

To add new prompts:
1. Create a new `.md` file in the appropriate category
2. Use `{{variable}}` for template variables
3. Include example usage
4. Document expected output format

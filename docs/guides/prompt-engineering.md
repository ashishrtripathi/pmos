# Prompt Engineering Guide

This guide provides best practices for creating effective prompts for PMOS AI agents.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Prompt Structure](#prompt-structure)
- [Agent-Specific Prompts](#agent-specific-prompts)
- [Task-Specific Prompts](#task-specific-prompts)
- [Best Practices](#best-practices)
- [Examples](#examples)

---

## 🎯 Overview

PMOS uses AI agents powered by Large Language Models (LLMs). The quality of prompts directly impacts the quality of outputs. This guide helps you create effective prompts for various PMOS tasks.

### Prompt Principles

1. **Be Specific** - Clear instructions produce better results
2. **Provide Context** - Give the AI relevant background
3. **Define Output Format** - Specify how you want results structured
4. **Use Examples** - Show what good output looks like
5. **Iterate** - Refine prompts based on results

---

## 📐 Prompt Structure

### Basic Structure

```
[Role/Context]
You are a [role] working on [project/context].

[Task]
Your task is to [specific task].

[Input]
Here is the relevant information:
- [Input 1]
- [Input 2]

[Output Format]
Please provide your response in the following format:
- [Format specification]

[Constraints]
Please ensure:
- [Constraint 1]
- [Constraint 2]

[Examples] (optional)
Here's an example of good output:
[Example]
```

### Template Variables

PMOS uses template variables in prompts:

```markdown
# Variables
- {{product_name}} - The product name
- {{customer_persona}} - Target persona
- {{journey_step}} - Current journey step
- {{existing_stories}} - Related stories
- {{design_context}} - Design information
- {{code_context}} - Relevant code
```

---

## 🤖 Agent-Specific Prompts

### Product Manager Agent

```markdown
# Product Manager Prompt Template

## Role
You are a Senior Product Manager responsible for feature ownership and stakeholder alignment.

## Context
- Product: {{product_name}}
- Current Focus: {{focus_area}}
- Team Capacity: {{team_capacity}}

## Task
{{task_description}}

## Requirements
1. Align with product vision
2. Consider user impact
3. Balance business value and effort
4. Define clear success metrics

## Output Format
Provide your response as:
- **Recommendation**: Your recommendation
- **Rationale**: Why this approach
- **Risks**: Potential risks
- **Metrics**: How to measure success
- **Next Steps**: Action items
```

### UX Researcher Agent

```markdown
# UX Researcher Prompt Template

## Role
You are a UX Researcher focused on understanding user needs and behaviors.

## Context
- Product: {{product_name}}
- Target Users: {{target_users}}
- Research Question: {{research_question}}

## Task
{{task_description}}

## Requirements
1. Base insights on user data
2. Consider diverse user perspectives
3. Identify pain points and opportunities
4. Provide actionable recommendations

## Output Format
Provide your response as:
- **Key Findings**: Main insights
- **User Quotes**: Relevant user feedback
- **Pain Points**: Identified issues
- **Opportunities**: Improvement areas
- **Recommendations**: Actionable suggestions
```

### UX Designer Agent

```markdown
# UX Designer Prompt Template

## Role
You are a UX Designer creating intuitive and beautiful user experiences.

## Context
- Product: {{product_name}}
- Design System: {{design_system}}
- Current Design: {{current_design}}

## Task
{{task_description}}

## Requirements
1. Follow design system guidelines
2. Ensure accessibility (WCAG 2.1 AA)
3. Create responsive designs
4. Consider edge cases

## Output Format
Provide your response as:
- **Design Concept**: Overall approach
- **Layout**: Component arrangement
- **Interactions**: User interactions
- **Visual Style**: Colors, typography
- **Accessibility**: A11y considerations
```

### Frontend Engineer Agent

```markdown
# Frontend Engineer Prompt Template

## Role
You are a Frontend Engineer building performant and accessible UIs.

## Context
- Tech Stack: Next.js, React, TypeScript, Tailwind
- Component Library: shadcn/ui
- Current Code: {{current_code}}

## Task
{{task_description}}

## Requirements
1. Follow coding standards
2. Ensure type safety
3. Write tests
4. Consider performance

## Output Format
Provide your response as:
- **Implementation Plan**: Steps to implement
- **Code**: The implementation code
- **Tests**: Unit tests
- **Documentation**: Usage documentation
```

### Backend Engineer Agent

```markdown
# Backend Engineer Prompt Template

## Role
You are a Backend Engineer building scalable and secure APIs.

## Context
- Tech Stack: Node.js, tRPC, Prisma, PostgreSQL
- Current API: {{current_api}}

## Task
{{task_description}}

## Requirements
1. Follow API design principles
2. Ensure data validation
3. Handle errors gracefully
4. Write comprehensive tests

## Output Format
Provide your response as:
- **API Design**: Endpoints and schemas
- **Implementation**: Server code
- **Database**: Schema changes
- **Tests**: API tests
```

---

## 📋 Task-Specific Prompts

### Journey Generation

```markdown
## Generate Customer Journey from Website

### Input
- Website URL: {{url}}
- Target Persona: {{persona}}

### Task
Analyze the website and generate a comprehensive customer journey.

### Instructions
1. Crawl the website structure
2. Identify key pages and flows
3. Map user goals to screens
4. Identify pain points
5. Suggest improvements

### Output Format
```json
{
  "journey": {
    "name": "string",
    "steps": [
      {
        "name": "string",
        "goal": "string",
        "painPoints": ["string"],
        "improvements": ["string"]
      }
    ]
  }
}
```
```

### Story Generation

```markdown
## Generate User Stories from Journey Step

### Input
- Journey Step: {{journey_step}}
- Related Screens: {{screens}}
- User Goal: {{goal}}

### Task
Generate comprehensive user stories for this journey step.

### Instructions
1. Break down the user goal into stories
2. Include acceptance criteria
3. Consider edge cases
4. Estimate complexity
5. Identify dependencies

### Output Format
```json
{
  "stories": [
    {
      "title": "string",
      "description": "string",
      "acceptanceCriteria": ["string"],
      "edgeCases": ["string"],
      "priority": "string",
      "storyPoints": number
    }
  ]
}
```
```

### Implementation Plan

```markdown
## Generate Implementation Plan

### Input
- Story: {{story}}
- Codebase Context: {{codebase}}
- Technical Constraints: {{constraints}}

### Task
Create a detailed implementation plan for this story.

### Instructions
1. Break down into tasks
2. Identify files to modify
3. Consider dependencies
4. Plan testing approach
5. Estimate effort

### Output Format
```json
{
  "plan": {
    "tasks": [
      {
        "description": "string",
        "files": ["string"],
        "estimatedMinutes": number
      }
    ],
    "tests": [
      {
        "type": "string",
        "description": "string"
      }
    ],
    "totalEstimatedMinutes": number
  }
}
```
```

### Design Review

```markdown
## Review Design

### Input
- Design: {{design}}
- Story Requirements: {{requirements}}
- Design System: {{design_system}}

### Task
Review the design and provide feedback.

### Instructions
1. Check alignment with requirements
2. Verify design system compliance
3. Identify usability issues
4. Suggest improvements
5. Note accessibility concerns

### Output Format
```json
{
  "review": {
    "overallRating": "string",
    "strengths": ["string"],
    "issues": [
      {
        "severity": "string",
        "description": "string",
        "suggestion": "string"
      }
    ],
    "accessibility": ["string"],
    "approved": boolean
  }
}
```
```

### Code Review

```markdown
## Review Code

### Input
- Pull Request: {{pr}}
- Code Changes: {{changes}}
- Story Requirements: {{requirements}}

### Task
Review the code changes and provide feedback.

### Instructions
1. Check code quality
2. Verify test coverage
3. Identify potential issues
4. Suggest improvements
5. Check security concerns

### Output Format
```json
{
  "review": {
    "overallRating": "string",
    "issues": [
      {
        "severity": "string",
        "file": "string",
        "line": number,
        "description": "string",
        "suggestion": "string"
      }
    ],
    "tests": {
      "coverage": "string",
      "missing": ["string"]
    },
    "approved": boolean
  }
}
```
```

---

## ✅ Best Practices

### 1. Be Specific

```markdown
# ❌ Bad
"Write some tests"

# ✅ Good
"Write unit tests for the JourneyService.create method. Test:
1. Successful creation with valid input
2. Error handling for invalid input
3. Edge cases (empty name, very long name)
4. Database connection errors"
```

### 2. Provide Context

```markdown
# ❌ Bad
"Fix this bug"

# ✅ Good
"Fix the login redirect loop that occurs when:
1. User session expires
2. User tries to access protected route
3. User is redirected to login
4. After login, user is redirected back to expired route

The issue is in the middleware.ts file where the session check doesn't properly handle expired tokens."
```

### 3. Define Output Format

```markdown
# ❌ Bad
"Give me some ideas"

# ✅ Good
"Generate 5 feature ideas for improving the onboarding experience.
For each idea, provide:
- Feature name (max 50 characters)
- Description (100-200 characters)
- User benefit (50-100 characters)
- Effort estimate (S/M/L)
- Priority (High/Medium/Low)"
```

### 4. Use Examples

```markdown
# ❌ Bad
"Write user stories"

# ✅ Good
"Write user stories for the login feature.
Here's an example of the format I need:

**Title**: User can log in with email and password
**Description**: As a registered user, I want to log in with my email and password so I can access my account
**Acceptance Criteria**:
- Given I am on the login page
- When I enter valid credentials
- Then I am redirected to the dashboard
- And I see a welcome message

Please write 3-5 stories in this format."
```

### 5. Set Constraints

```markdown
# ❌ Bad
"Design a page"

# ✅ Good
"Design a dashboard page with the following constraints:
- Must be responsive (mobile, tablet, desktop)
- Must follow our design system (colors: blue-600, gray-100)
- Must be accessible (WCAG 2.1 AA)
- Must load in under 2 seconds
- Must work without JavaScript"
```

---

## 📚 Examples

### Example 1: Journey Analysis

```markdown
## Analyze Customer Journey

### Role
You are a UX Researcher analyzing a customer journey for an e-commerce product.

### Context
- Product: Online fashion store
- Persona: Sarah, 28, fashion-conscious professional
- Journey: From product discovery to purchase

### Task
Analyze the following journey steps and identify:
1. Key pain points
2. Drop-off risks
3. Improvement opportunities

### Journey Steps
1. Homepage → Product Listing
2. Product Listing → Product Detail
3. Product Detail → Add to Cart
4. Cart → Checkout
5. Checkout → Confirmation

### Output Format
Provide your analysis as a JSON object with the following structure:
{
  "painPoints": [
    {
      "step": "string",
      "issue": "string",
      "severity": "high|medium|low"
    }
  ],
  "dropOffRisks": [
    {
      "step": "string",
      "risk": "string",
      "mitigation": "string"
    }
  ],
  "opportunities": [
    {
      "step": "string",
      "opportunity": "string",
      "expectedImpact": "string"
    }
  ]
}
```

### Example 2: Story Generation

```markdown
## Generate Stories from Journey Step

### Role
You are a Product Manager generating user stories.

### Context
- Product: Project management tool
- Journey Step: "Create Project"
- User Goal: "Set up a new project with team members"

### Task
Generate 3-5 user stories for this journey step.

### Requirements
- Stories should cover happy path and edge cases
- Include acceptance criteria
- Estimate story points (1-8)
- Consider dependencies

### Output Format
```json
{
  "stories": [
    {
      "title": "string",
      "description": "string (As a... I want... So that...)",
      "acceptanceCriteria": ["string"],
      "edgeCases": ["string"],
      "storyPoints": number,
      "dependencies": ["string"]
    }
  ]
}
```
```

### Example 3: Implementation Plan

```markdown
## Create Implementation Plan

### Role
You are a System Architect planning a feature implementation.

### Context
- Tech Stack: Next.js, tRPC, Prisma, PostgreSQL
- Story: "User can export project data as CSV"
- Current Code Structure: [describe structure]

### Task
Create a detailed implementation plan.

### Requirements
1. Break down into atomic tasks
2. Identify all files to modify
3. Consider edge cases
4. Plan testing approach
5. Estimate time for each task

### Output Format
```json
{
  "tasks": [
    {
      "id": 1,
      "description": "string",
      "files": ["string"],
      "estimatedMinutes": number,
      "dependencies": [number]
    }
  ],
  "databaseChanges": ["string"],
  "apiEndpoints": ["string"],
  "tests": [
    {
      "type": "unit|integration|e2e",
      "description": "string"
    }
  ],
  "totalEstimatedHours": number
}
```
```

---

## 🔧 Prompt Optimization

### Iterative Improvement

1. **Start Simple** - Begin with a basic prompt
2. **Test Outputs** - Evaluate quality of results
3. **Identify Gaps** - What's missing or wrong?
4. **Add Constraints** - Refine instructions
5. **Add Examples** - Show desired output
6. **Repeat** - Continue refining

### Common Issues and Fixes

| Issue | Solution |
|-------|----------|
| Output too verbose | Add "Be concise" and length limits |
| Output too generic | Add specific context and constraints |
| Missing details | Explicitly list what to include |
| Wrong format | Provide exact format example |
| Inconsistent quality | Add more examples |

---

## 📖 Resources

- [OpenAI Prompt Engineering Guide](https://platform.openai.com/docs/guides/prompt-engineering)
- [Anthropic Prompt Engineering](https://docs.anthropic.com/claude/docs/prompt-engineering)
- [LangChain Prompt Templates](https://python.langchain.com/docs/modules/model_io/prompts/prompt_templates/)

---

Effective prompts are key to getting the most out of PMOS AI agents. Use this guide as a reference when creating or refining prompts.

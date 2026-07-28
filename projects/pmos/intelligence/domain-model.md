# PMOS — Domain Model

## Core Entities

```mermaid
erDiagram
    Registry {
        string file "registry.json"
        array projects "Project[]"
    }

    Project {
        string slug "URL-friendly name"
        string name "Display name"
        string summary "Description"
        SourceLocation sourceLocation "Where code lives"
        PipelineState pipeline "Execution state"
        string health "Score 0-100"
    }

    SourceLocation {
        enum mode "local|github|github-only"
        string localPath "Local filesystem path"
        string repoUrl "GitHub repository URL"
        string lastResolvedAt "Timestamp"
        RuntimeInfo runtime "App runtime status"
    }

    RuntimeInfo {
        enum status "running|failed|stopped"
        string url "Localhost URL"
        int port "Port number"
        string startedAt "Timestamp"
        enum method "docker|npm|make|python"
    }

    PipelineState {
        int currentStep "1-9"
        boolean completed "All done?"
        StepExecution[] steps "Per-step state"
        string startedAt "Pipeline start"
        string completedAt "Pipeline end"
    }

    StepExecution {
        int step "Step number"
        enum status "pending|running|completed|failed"
        string startedAt "Step start"
        string completedAt "Step end"
        string output "Execution log"
        string error "Error message"
    }

    PersonaJourney {
        string persona "Persona name"
        string role "User role"
        JourneyStep[] steps "Ordered journey steps"
    }

    JourneyStep {
        string id "Step identifier"
        string title "Step name"
        string description "What happens"
        string[] painPoints "User frustrations"
        string[] stories "Related story IDs"
    }

    Story {
        string id "STORY-XXX"
        string title "Short description"
        string description "Full markdown"
        int points "Story points"
        enum status "backlog|in-progress|review|done"
        UseCase useCase "Mike Cohn format"
        string businessGoal "Linked business goal"
        int estimatedValue "Dollars"
        AcceptanceCriteria[] acceptanceCriteria "Gherkin scenarios"
        string persona "Persona name"
        string personaRole "Agent role"
        string journeyStep "Journey step ID"
        string filePath "File location"
        string source "pmos|intelligence|manual"
    }

    UseCase {
        string asA "Persona/role"
        string iWant "Action"
        string soThat "Desired outcome"
    }

    AcceptanceCriteria {
        string scenario "Scenario name"
        string given "Precondition"
        string when "Action"
        string then "Expected result"
    }

    CostEstimate {
        int storyPoints "Story points"
        int inputTokens "Total input tokens"
        int outputTokens "Total output tokens"
        float totalCostAI "AI agent cost in USD"
        float totalCostDev "Human dev cost in USD"
        float estimatedROI "Value / Cost ratio"
        enum verdict "strong|moderate|weak"
    }

    IntelligenceFile {
        string type "architecture|tech-stack|features|code-quality|improvements|domain-model|api-docs|missing-docs"
        string filePath "File location"
        Improvement[] improvements "Extracted improvements"
    }

    Improvement {
        string id "IMP-XXX"
        string category "Security|Architecture|Code Quality|UX"
        enum priority "critical|high|medium|low"
        int estimatedValue "Dollars"
        string businessOutcome "Business impact"
        string agentRole "Assigned role"
    }

    Agent {
        string name "Agent name"
        enum role "PM|UX|Architect|SE|QA|Docs|Intelligence"
        Story[] assignedStories "Work items"
    }

    Project ||--o{ Story : "has"
    Project ||--|| SourceLocation : "points to"
    Project ||--|| PipelineState : "executes"
    Project ||--o{ PersonaJourney : "defines"
    Project ||--o{ IntelligenceFile : "contains"
    Project ||--o{ Agent : "employs"
    Story ||--|| UseCase : "expresses as"
    Story ||--o{ AcceptanceCriteria : "validated by"
    Story ||--|| CostEstimate : "priced at"
    Story }o--|| Persona : "written for"
    IntelligenceFile ||--o{ Improvement : "identifies"
    Improvement }o--|| Agent : "assigned to"
    Agent ||--o{ Story : "works on"
    PipelineState ||--o{ StepExecution : "contains"
    PersonaJourney ||--o{ JourneyStep : "consists of"
```

## Relationships

| Relationship | Cardinality | Description |
|-------------|-------------|-------------|
| Project → Story | 1:N | A project has many stories |
| Project → PersonaJourney | 1:N | A project has journeys per persona |
| Project → IntelligenceFile | 1:N | Analysis produces multiple intel files |
| Project → Agent | 1:7 | Each project has 7 agent roles |
| Story → UseCase | 1:1 | Each story has one Mike Cohn use case |
| Story → AcceptanceCriteria | 1:N | Each story has 1+ Gherkin scenarios |
| Story → CostEstimate | 1:1 | Each story has one cost estimate |
| Persona → Story | 1:N | A persona generates many stories |
| IntelligenceFile → Improvement | 1:N | Intel files identify improvements |
| Improvement → Agent | N:1 | Each improvement assigned to one agent |
| Agent → Story | 1:N | Each agent works on many stories |
| PipelineState → StepExecution | 1:N | Pipeline has 9 step executions |
| PersonaJourney → JourneyStep | 1:N | Each persona journey has many steps |

## Enumerations

### Project Source Mode
- `local` — Code lives on local filesystem
- `github` — Local clone + GitHub remote
- `github-only` — No local clone, GitHub API only

### Story Status
- `backlog` — Not yet started
- `in-progress` — Actively being worked on
- `review` — Ready for review
- `done` — Completed and shipped

### Agent Roles
- `Product Manager` — Roadmap, stories, priorities
- `UX Designer` — Journey, wireframes, accessibility
- `Architect` — Architecture, patterns, tech debt
- `Software Engineer` — Implementation, testing, PRs
- `QA Engineer` — Testing, regression, performance
- `Documentation Agent` — README, API docs, release notes
- `Product Intelligence` — Monitoring, anomaly detection

### Pipeline Steps (1-9)
1. Resolve Source
2. Repository Intelligence
3. Run Application
4. Customer Journey Discovery
5. Story Mapping
6. Build Initial Backlog
7. Build Agent Kanban
8. Product Dashboard
9. Continuous Learning

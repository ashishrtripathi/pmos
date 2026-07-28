# PMOS — API Documentation

## Base URL
```
http://localhost:3100/api
```

---

## Projects

### GET /api/projects/list
List all projects with dashboard data.

**Response**:
```json
[
  {
    "slug": "voxstyle",
    "name": "VOXStyle Video Creator",
    "summary": "AI-powered video creation platform",
    "sourceMode": "local",
    "health": 85,
    "totalStories": 4,
    "storiesByStatus": {
      "backlog": 4,
      "in-progress": 0,
      "review": 0,
      "done": 0
    },
    "personaCount": 3,
    "agentCount": 7,
    "hasIntelligence": true,
    "pipelineStep": 6,
    "pipelineComplete": false
  }
]
```

### POST /api/projects
Create a new project.

**Request Body**:
```json
{
  "name": "My Project",
  "summary": "Project description",
  "sourceLocation": {
    "mode": "local",
    "localPath": "C:\\path\\to\\code",
    "repoUrl": "https://github.com/owner/repo"
  }
}
```

**Response**: `201 Created` with project data.

---

## Stories

### GET /api/projects/[slug]/stories
List all stories for a project, parsed from markdown files.

**Query Parameters**:
- `status` — Filter by status (backlog, in-progress, review, done)

**Response**:
```json
[
  {
    "id": "STORY-001",
    "title": "Real-time Video Preview",
    "description": "As a content creator, I want...",
    "points": 8,
    "status": "backlog",
    "useCase": {
      "asA": "Content Creator",
      "iWant": "real-time video preview",
      "soThat": "I can see changes instantly"
    },
    "businessGoal": "Increase creator productivity",
    "estimatedValue": 45000,
    "acceptanceCriteria": [
      {
        "scenario": "Preview updates on timeline change",
        "given": "I am editing the timeline",
        "when": "I make a change",
        "then": "the preview updates within 200ms"
      }
    ],
    "persona": "Sarah",
    "personaRole": "Content Creator",
    "journeyStep": "edit-video",
    "filePath": "~/.pmos/projects/voxstyle/stories/backlog/STORY-001-real-time-preview.md",
    "source": "pmos"
  }
]
```

### POST /api/projects/[slug]/stories
Create a new story.

**Request Body**:
```json
{
  "title": "Story title",
  "description": "Full description",
  "points": 5,
  "status": "backlog",
  "persona": "Sarah",
  "personaRole": "Content Creator",
  "journeyStep": "edit-video",
  "useCase": {
    "asA": "Content Creator",
    "iWant": "feature X",
    "soThat": "benefit Y"
  },
  "businessGoal": "Increase revenue",
  "estimatedValue": 30000,
  "acceptanceCriteria": [
    {
      "scenario": "Basic flow",
      "given": "precondition",
      "when": "action",
      "then": "result"
    }
  ]
}
```

**Response**: `201 Created` with created story.

### PATCH /api/projects/[slug]/stories
Update an existing story.

**Request Body**:
```json
{
  "id": "STORY-001",
  "title": "Updated title",
  "status": "in-progress"
}
```

---

## Pipeline

### GET /api/projects/[slug]/pipeline
Get pipeline execution state.

**Response**:
```json
{
  "currentStep": 3,
  "completed": false,
  "steps": [
    { "step": 1, "status": "completed", "startedAt": "...", "completedAt": "..." },
    { "step": 2, "status": "completed", "startedAt": "...", "completedAt": "..." },
    { "step": 3, "status": "running", "startedAt": "..." },
    { "step": 4, "status": "pending" }
  ],
  "startedAt": "2024-01-15T10:00:00Z"
}
```

### POST /api/projects/[slug]/pipeline
Execute a pipeline step or run all remaining steps.

**Request Body (single step)**:
```json
{
  "action": "runStep",
  "step": 3
}
```

**Request Body (run all)**:
```json
{
  "action": "runAll"
}
```

**Response**: Updated pipeline state.

### DELETE /api/projects/[slug]/pipeline
Reset pipeline to initial state.

---

## Intelligence

### GET /api/projects/[slug]/intelligence-stories
Parse intelligence markdown files into stories with agent assignments.

**Response**:
```json
[
  {
    "id": "IMP-001",
    "title": "File Path Traversal Security Fix",
    "description": "Current state + proposed fix + acceptance criteria...",
    "points": 8,
    "status": "backlog",
    "category": "Security",
    "priority": "critical",
    "estimatedValue": 18000,
    "businessOutcome": "Prevents unauthorized access...",
    "agentRole": "Architect",
    "source": "intelligence",
    "sourceFile": "intelligence/improvements.md",
    "sourceSection": "IMP-001"
  }
]
```

---

## Journeys

### GET /api/projects/[slug]/journeys
Get enriched persona journeys with stories.

**Response**:
```json
[
  {
    "persona": "Sarah",
    "role": "Content Creator",
    "steps": [
      {
        "id": "ideate-content",
        "title": "Ideate Content",
        "description": "Brainstorm and plan video content",
        "painPoints": ["No content calendar integration"],
        "stories": ["STORY-001", "STORY-002"]
      }
    ]
  }
]
```

---

## Filesystem

### GET /api/fs/browse
Browse local filesystem.

**Query Parameters**:
- `path` — Directory path to browse (default: user home)

**Response**:
```json
{
  "currentPath": "C:\\Users\\ashis\\Projects",
  "parentPath": "C:\\Users\\ashis",
  "directories": [
    {
      "name": "voxstyle",
      "path": "C:\\Users\\ashis\\Projects\\voxstyle",
      "hasGit": true,
      "hasPackageJson": true,
      "hasPython": false
    }
  ],
  "files": [
    {
      "name": "README.md",
      "path": "C:\\Users\\ashis\\Projects\\README.md",
      "size": 1024,
      "extension": ".md"
    }
  ]
}
```

---

## GitHub

### GET /api/github/repos
Search GitHub repositories or get repository details.

**Query Parameters**:
- `q` — Search query (for search mode)
- `owner` — Repository owner (for detail mode)
- `repo` — Repository name (for detail mode)

**Search Response**:
```json
{
  "total_count": 42,
  "items": [
    {
      "full_name": "owner/repo",
      "description": "Repository description",
      "language": "TypeScript",
      "stargazers_count": 1234,
      "html_url": "https://github.com/owner/repo"
    }
  ]
}
```

**Detail Response**:
```json
{
  "full_name": "owner/repo",
  "description": "Repository description",
  "language": "TypeScript",
  "readme": "# Repository Title\n...",
  "rootFiles": ["package.json", "README.md", "src/"]
}
```

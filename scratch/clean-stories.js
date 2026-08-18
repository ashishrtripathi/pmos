const fs = require("fs");
const path = require("path");
const os = require("os");

const pmosDir = path.join(os.homedir(), ".pmos");
const backlogDir = path.join(pmosDir, "projects", "pmos", "stories", "backlog");

// Defined high-quality stories with complete "I want to" use cases and acceptance criteria
const cleanStories = [
  {
    id: "INT-100",
    title: "Extract Shared CostBar Component",
    points: 2,
    category: "Code Quality",
    priority: "high",
    effort: "XS",
    assignedAgent: "software-engineer",
    estimatedValue: 10000,
    sourceFile: "intelligence/improvements.md",
    sourceSection: "From Code Analysis",
    asA: "software engineer",
    iWant: "extract and share the CostBar component across all cards, modals, and headers",
    soThat: "labor hours, token counts, and ROI metrics are calculated consistently in a single reusable component without code duplication",
    description: "Intelligence-identified improvement in Code Quality: Extract Shared CostBar Component into src/components/cost-bar.tsx.",
    businessGoal: "Prevents calculation drift and eliminates code duplication. Estimated value: $10,000 in maintainability and developer efficiency.",
    acceptanceCriteria: [
      {
        scenario: "Unified CostBar rendering",
        given: ["the Kanban board and Story Map boards are loaded"],
        when: "story cards and modals display cost breakdowns",
        then: "all views render labor cost, token usage, and ROI multiple using the shared CostBar component",
      },
    ],
    fileName: "INT-100-extract-shared-costbar-component.md",
  },
  {
    id: "INT-101",
    title: "Add Agent Dispatch Panel for AI Interaction",
    points: 8,
    category: "UX/Product",
    priority: "high",
    effort: "High",
    assignedAgent: "ux-designer",
    persona: "Priya",
    personaRole: "Product Manager",
    estimatedValue: 25000,
    sourceFile: "intelligence/improvements.md",
    sourceSection: "UX / Product Improvements",
    asA: "Product Manager",
    iWant: "interact with and monitor assigned AI agent personas through a dedicated Agent Dispatch panel",
    soThat: "I can oversee AI task execution progress, view reasoning logs, and steer agents before approving stories into Review",
    description: "UX/Product improvement for Priya (Product Manager): Add Agent Dispatch Panel for interactive execution monitoring.",
    businessGoal: "Improves PM workflow transparency and control over AI agents. Estimated $25,000 in productivity and quality assurance.",
    acceptanceCriteria: [
      {
        scenario: "Interactive Agent Dispatch Panel",
        given: ["stories are assigned to AI agent personas in Doing"],
        when: "I open the Agent Dispatch panel",
        then: "I see real-time task status, token metrics, agent thoughts, and a direct control harness to guide execution",
      },
    ],
    fileName: "INT-101-add-agent-dispatch-panel.md",
  },
  {
    id: "INT-102",
    title: "Add Keyboard Navigation for Power Users",
    points: 5,
    category: "UX/Product",
    priority: "medium",
    effort: "Medium",
    assignedAgent: "ux-designer",
    persona: "Dev",
    personaRole: "Developer",
    estimatedValue: 25000,
    sourceFile: "intelligence/improvements.md",
    sourceSection: "UX / Product Improvements",
    asA: "Developer & Power User",
    iWant: "navigate Kanban boards, trigger story executions, and open story details using keyboard shortcuts (j, k, Enter, s, ?)",
    soThat: "I can operate the board rapidly without touching the mouse",
    description: "UX/Product improvement for Dev persona (Developer): Add Keyboard Navigation across Kanban and Story Map.",
    businessGoal: "Accelerates daily developer and PM workflows. Estimated $25,000 in user satisfaction and time saved.",
    acceptanceCriteria: [
      {
        scenario: "Keyboard navigation shortcuts",
        given: ["I am viewing the Kanban board"],
        when: "I press 'j' or 'k'",
        then: "focus moves smoothly between story cards with visual highlighting, and pressing 'Enter' opens story details",
      },
    ],
    fileName: "INT-102-add-keyboard-navigation-for-power-users.md",
  },
  {
    id: "INT-103",
    title: "Add Global Search Across Boards",
    points: 5,
    category: "UX/Product",
    priority: "medium",
    effort: "Medium",
    assignedAgent: "ux-designer",
    persona: "Dev",
    personaRole: "Developer",
    estimatedValue: 25000,
    sourceFile: "intelligence/improvements.md",
    sourceSection: "UX / Product Improvements",
    asA: "Product Manager & Developer",
    iWant: "search across all stories, OKRs, customer journeys, and intelligence docs from a global search bar with keyboard shortcut '/'",
    soThat: "I can instantly find any story, requirement, or bug without clicking through multiple screens",
    description: "UX/Product improvement for Dev (Developer): Global search toolbar with instant category filtering.",
    businessGoal: "Reduces information retrieval time across large backlogs. Estimated $25,000 in productivity gains.",
    acceptanceCriteria: [
      {
        scenario: "Instant fuzzy search",
        given: ["multiple stories exist across different columns"],
        when: "I type a search query in the global search bar",
        then: "stories filter in real-time matching title, description, persona, and acceptance criteria",
      },
    ],
    fileName: "INT-103-add-global-search-across-boards.md",
  },
  {
    id: "INT-104",
    title: "Decompose Large Component Files",
    points: 5,
    category: "Technical",
    priority: "medium",
    effort: "M",
    assignedAgent: "software-engineer",
    estimatedValue: 15000,
    sourceFile: "intelligence/improvements.md",
    sourceSection: "Technical Improvements",
    asA: "software architect",
    iWant: "decompose monolithic board components into focused, modular subcomponents",
    soThat: "the codebase is easier to test, maintain, and extend without causing regressions in core board logic",
    description: "Technical improvement in Frontend Architecture: Break down large files like story-map-board.tsx into smaller dedicated components.",
    businessGoal: "Improves code maintainability and testability. Estimated $15,000 in reduced bug fix time.",
    acceptanceCriteria: [
      {
        scenario: "Component modularity",
        given: ["large board components over 500 lines exist"],
        when: "subcomponents are extracted into dedicated files",
        then: "the main boards import modular components with clean prop interfaces and no functional regression",
      },
    ],
    fileName: "INT-104-decompose-large-component-files.md",
  },
  {
    id: "INT-105",
    title: "Standardize API Response Format",
    points: 3,
    category: "Technical",
    priority: "high",
    effort: "S",
    assignedAgent: "software-engineer",
    estimatedValue: 15000,
    sourceFile: "intelligence/improvements.md",
    sourceSection: "Technical Improvements",
    asA: "software engineer",
    iWant: "standardize all Next.js API route responses to return consistent JSON envelopes with { success, data, error }",
    soThat: "client components can handle errors and payloads uniformly across all PMOS features",
    description: "Technical improvement in API Design: Standardize API Response Format across all /api/projects/... endpoints.",
    businessGoal: "Improves API reliability and eliminates error-handling bugs in UI components. Estimated $15,000 in operational efficiency.",
    acceptanceCriteria: [
      {
        scenario: "Standardized API response envelopes",
        given: ["API routes receive requests"],
        when: "the endpoint returns a response or error",
        then: "all endpoints return a standardized JSON structure with proper HTTP status codes",
      },
    ],
    fileName: "INT-105-standardize-api-response-format.md",
  },
  {
    id: "INT-106",
    title: "Add Pagination for Story Lists",
    points: 5,
    category: "Technical",
    priority: "high",
    effort: "M",
    assignedAgent: "software-engineer",
    estimatedValue: 15000,
    sourceFile: "intelligence/improvements.md",
    sourceSection: "Technical Improvements",
    asA: "software engineer",
    iWant: "paginate and virtualize large story lists in the backlog and change log",
    soThat: "the UI remains fast and responsive with 60 FPS scrolling even with hundreds of user stories",
    description: "Technical improvement in Frontend: Add Pagination and virtualization for Story Lists.",
    businessGoal: "Prevents UI lag on large backlogs. Estimated $15,000 in performance optimization.",
    acceptanceCriteria: [
      {
        scenario: "Smooth backlog pagination",
        given: ["over 50 stories exist in backlog"],
        when: "the user scrolls or navigates story lists",
        then: "pages load in chunks with zero UI stutter",
      },
    ],
    fileName: "INT-106-add-pagination-for-story-lists.md",
  },
  {
    id: "INT-200",
    title: "Implement: Test Coverage Display",
    points: 8,
    category: "Missing Feature",
    priority: "high",
    effort: "M",
    assignedAgent: "software-engineer",
    estimatedValue: 40000,
    sourceFile: "intelligence/features.md",
    sourceSection: "Missing / Partial Features",
    asA: "Product Manager & QA Engineer",
    iWant: "view automated test run results and code coverage percentages on the project health dashboard",
    soThat: "I can verify release quality and catch untested features before deploying to production",
    description: "Missing Feature: Display automated test coverage metrics and test pass/fail history in the PMOS dashboard.",
    businessGoal: "Fills a critical gap in product health visibility. Estimated $40,000 in quality assurance value.",
    acceptanceCriteria: [
      {
        scenario: "Test coverage metrics widget",
        given: ["a project has automated test suites"],
        when: "the PM opens the project dashboard",
        then: "overall test coverage percentage, unit test count, and pass rates are prominently displayed",
      },
    ],
    fileName: "INT-200-implement-test-coverage-display.md",
  },
  {
    id: "INT-201",
    title: "Implement: Activity Feed",
    points: 8,
    category: "Missing Feature",
    priority: "high",
    effort: "M",
    assignedAgent: "software-engineer",
    estimatedValue: 40000,
    sourceFile: "intelligence/features.md",
    sourceSection: "Missing / Partial Features",
    asA: "Product Manager",
    iWant: "view a chronological Activity Feed of all story status changes, OKR updates, and agent execution events",
    soThat: "the entire team has full transparency into recent product decisions and work progression",
    description: "Missing Feature: Chronological audit trail and activity feed for all project updates.",
    businessGoal: "Provides team-wide auditability and accountability. Estimated $40,000 in communication efficiency.",
    acceptanceCriteria: [
      {
        scenario: "Real-time activity audit stream",
        given: ["changes occur to stories or OKRs"],
        when: "the user views the activity feed",
        then: "events are listed with timestamps, actor/agent names, and before/after transition states",
      },
    ],
    fileName: "INT-201-implement-activity-feed.md",
  },
  {
    id: "INT-202",
    title: "Implement: Global Search",
    points: 8,
    category: "Missing Feature",
    priority: "high",
    effort: "M",
    assignedAgent: "software-engineer",
    estimatedValue: 40000,
    sourceFile: "intelligence/features.md",
    sourceSection: "Missing / Partial Features",
    asA: "Product Manager",
    iWant: "search across all stories, OKRs, customer journeys, bug reports, and intelligence documents from anywhere in PMOS",
    soThat: "I can quickly navigate to any artifact and cross-reference product information",
    description: "Missing Feature: Global search across all project entities and boards.",
    businessGoal: "Accelerates daily product management workflows. Estimated $40,000 in productivity value.",
    acceptanceCriteria: [
      {
        scenario: "Universal cross-entity search",
        given: ["various entities exist across PMOS boards"],
        when: "a user executes a search",
        then: "matching stories, OKRs, journey steps, and bugs are categorized and link directly to their respective views",
      },
    ],
    fileName: "INT-202-implement-global-search.md",
  },
  {
    id: "INT-300",
    title: "Fix: File Path Traversal Vulnerability",
    points: 5,
    category: "Critical Issue",
    priority: "critical",
    effort: "M",
    assignedAgent: "qa-engineer",
    estimatedValue: 75000,
    sourceFile: "intelligence/code-quality.md",
    sourceSection: "Critical (Production Blockers)",
    asA: "Security & QA Engineer",
    iWant: "sanitize and validate all file path parameters in filesystem browsing APIs to restrict access within user home boundaries",
    soThat: "unauthorized users or malicious requests cannot traverse outside project directories to access sensitive system files",
    description: "Critical Issue: File Path Traversal Vulnerability in src/app/api/fs/browse/route.ts. Must add strict path boundary validation.",
    businessGoal: "Eliminates a critical security vulnerability. Estimated $75,000 in prevented security breach risks.",
    acceptanceCriteria: [
      {
        scenario: "Path traversal restriction",
        given: ["an API call attempts to browse paths containing '../' or system roots"],
        when: "the request is processed by the filesystem browser API",
        then: "the API rejects unauthorized traversal and returns a 403 Forbidden response",
      },
    ],
    fileName: "INT-300-fix-file-path-traversal-vulnerability.md",
  },
  {
    id: "INT-301",
    title: "Fix: GitHub Token Exposure Risk",
    points: 3,
    category: "High Priority Issue",
    priority: "high",
    effort: "S",
    assignedAgent: "qa-engineer",
    estimatedValue: 10000,
    sourceFile: "intelligence/code-quality.md",
    sourceSection: "High Priority",
    asA: "Security & QA Engineer",
    iWant: "mask sensitive GitHub Personal Access Tokens in server responses, error traces, and client logs",
    soThat: "secret credentials are never leaked in plain text over the network or in debugging logs",
    description: "High Priority Issue: GitHub Token Exposure Risk in API routes. Must add token masking and safe logging.",
    businessGoal: "Hardens secret management and protects user credentials. Estimated $10,000 in risk mitigation.",
    acceptanceCriteria: [
      {
        scenario: "Token redaction in logs and responses",
        given: ["a GitHub API error occurs or server logs request payloads"],
        when: "the error or log message is generated",
        then: "all authorization tokens are redacted as 'ghp_****' and never shown in plain text",
      },
    ],
    fileName: "INT-301-fix-github-token-exposure-risk.md",
  },
];

// Clean out old backlog files
if (fs.existsSync(backlogDir)) {
  const existingFiles = fs.readdirSync(backlogDir);
  for (const f of existingFiles) {
    fs.unlinkSync(path.join(backlogDir, f));
  }
} else {
  fs.mkdirSync(backlogDir, { recursive: true });
}

// Write clean stories
for (const s of cleanStories) {
  const acText = s.acceptanceCriteria
    .map(
      (ac) =>
        `- **Scenario:** ${ac.scenario}\n` +
        `  - **Given:** ${ac.given.join("\n    ")}\n` +
        `  - **When:** ${ac.when}\n` +
        `  - **Then:** ${ac.then}`
    )
    .join("\n\n");

  const content = `---
id: ${s.id}
title: "${s.title}"
points: ${s.points}
status: backlog
assigned-agent: ${s.assignedAgent}
estimated-value: ${s.estimatedValue}
category: ${s.category}
priority: ${s.priority}
effort: ${s.effort}
source: intelligence
source-file: ${s.sourceFile}
source-section: "${s.sourceSection}"
${s.persona ? `persona: "${s.persona}"\n` : ""}${s.personaRole ? `persona-role: "${s.personaRole}"\n` : ""}---

# ${s.title}

## Use Case

- **As a** ${s.asA}
- **I want to** ${s.iWant}
- **so that** ${s.soThat}

## Description

${s.description}

## Business Goal

${s.businessGoal}

## Acceptance Criteria

${acText}
`;

  fs.writeFileSync(path.join(backlogDir, s.fileName), content, "utf8");
  console.log(`Wrote clean story: ${s.fileName}`);
}

console.log("Finished writing clean stories!");

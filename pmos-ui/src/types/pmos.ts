export interface RegistryProject {
  slug: string;
  name: string;
  source: "local" | "github" | "github-only";
  repoUrl: string | null;
  localPath: string | null;
  path: string;
  status: string;
  attachedAt: string;
  projectType: string;
}

export interface Registry {
  version: string;
  createdAt: string;
  projects: RegistryProject[];
}

export interface SourceLocation {
  mode: "local" | "github" | "github-only";
  localPath: string;
  repoUrl: string | null;
  resolvedAt: string;
  lastAnalyzed: string | null;
  runtime: {
    status: string;
    url: string | null;
    port: number | null;
    startedAt: string | null;
    method: string | null;
    note?: string;
  };
}

export interface Objective {
  id: string;
  title: string;
  description: string;
  quarter: string;
  owner: string;
  keyResults: KeyResult[];
  createdAt: string;
  updatedAt: string;
}

export interface KeyResult {
  id: string;
  title: string;
  description: string;
  metric: string;
  target: number;
  current: number;
  unit: string;
  owner: string;
}

export interface Story {
  id: string;
  title: string;
  description: string;
  points: number;
  status: StoryStatus;
  persona?: string;
  personaRole?: string;
  journeyStep?: string;
  useCase: {
    asA: string;
    iWant: string;
    soThat: string;
  };
  businessGoal?: string;
  estimatedValue?: number;
  acceptanceCriteria: {
    scenario: string;
    given: string[];
    when: string;
    then: string;
  }[];
  filePath: string;
  source?: "manual" | "intelligence";
  sourceFile?: string;
  sourceSection?: string;
  category?: string;
  objectiveId?: string; // links to Objective.id
  assignedAgent?: string;
}

export type StoryStatus = "backlog" | "in-progress" | "review" | "done";

export interface Agent {
  id: string;
  name: string;
  role: string;
  focus: string[];
  activeStories: string[];
  filePath: string;
}

export interface Intelligence {
  architecture: string | null;
  domainModel: string | null;
  techStack: string | null;
  features: string | null;
  codeQuality: string | null;
  improvements: string | null;
  apiDocs: string | null;
  missingDocs: string | null;
}

export interface JourneyStep {
  id: string;
  name: string;
  description: string;
  tasks: string[];
  stories: string[];
}

export interface Persona {
  id: string;
  name: string;
  role: string;
  goals: string[];
  frustrations: string[];
}

export interface DashboardData {
  healthScore: number;
  storyBreakdown: { backlog: number; inProgress: number; review: number; done: number };
  agentWorkload: { agent: string; active: number; completed: number; queued: number }[];
  applicationStatus: string;
  lastAnalyzed: string | null;
}

export interface PricingConfig {
  model: string;
  developerHourlyRate: number;
  productManagerHourlyRate: number;
  qaEngineerHourlyRate: number;
  hoursPerPoint: number;
  numDevelopers: number;
  numProductManagers: number;
  numQA: number;
  aiOverheadPercent: number;
  costPerToken: number;
  tokensPerPoint: number;
  tokenMultiplier: number;
  tokensPerK: number;
  marginMultiplier: number;
}

export interface PipelineStep {
  number: number;
  name: string;
  description: string;
  status: "pending" | "running" | "done" | "failed" | "skipped";
}

export type BugSeverity = "critical" | "major" | "minor" | "cosmetic";
export type BugStatus = "open" | "in-progress" | "review" | "fixed" | "closed";

export interface Bug {
  id: string;
  title: string;
  description: string;
  severity: BugSeverity;
  status: BugStatus;
  stepsToReproduce?: string;
  expectedBehavior?: string;
  actualBehavior?: string;
  reportedBy: string;
  createdAt: string;
  updatedAt: string;
  storyId?: string; // optional link to a Story
}

export type ChangeRequestPriority = "high" | "medium" | "low";
export type ChangeRequestCategory =
  | "new-feature"
  | "enhancement"
  | "bugfix"
  | "refactor"
  | "design";
export type ChangeRequestStatus =
  | "submitted"
  | "in-review"
  | "approved"
  | "rejected"
  | "implemented";

export interface ChangeRequest {
  id: string;
  title: string;
  description: string;
  priority: ChangeRequestPriority;
  category: ChangeRequestCategory;
  status: ChangeRequestStatus;
  requestedBy: string;
  linkedObjectiveId?: string; // optional link to Objective.id
  storyIds: string[]; // stories generated from this change request
  createdAt: string;
  updatedAt: string;
}

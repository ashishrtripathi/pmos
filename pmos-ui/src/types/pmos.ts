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

export interface Story {
  id: string;
  title: string;
  description: string;
  points: number;
  status: StoryStatus;
  acceptanceCriteria: string[];
  persona?: string;
  journeyStep?: string;
  filePath: string;
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

export interface PipelineStep {
  number: number;
  name: string;
  description: string;
  status: "pending" | "running" | "done" | "failed" | "skipped";
}

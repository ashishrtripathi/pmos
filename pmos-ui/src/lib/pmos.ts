import fs from "fs";
import path from "path";
import { deriveAIOverheadPercent } from "./models";
import matter from "gray-matter";
import type {
  Registry,
  RegistryProject,
  SourceLocation,
  Story,
  StoryStatus,
  Agent,
  Intelligence,
  DashboardData,
  PipelineStep,
} from "@/types/pmos";
import { db, readDoc, writeDoc, readItems, writeItems, deleteDoc } from "./postbase";
import { dispatchStoryToAionUi } from "./aionui-bridge";

function getPmosHome(): string {
  if (process.env.PMOS_HOME && fs.existsSync(process.env.PMOS_HOME)) {
    return process.env.PMOS_HOME;
  }
  const homePmos = path.join(
    process.env.HOME || process.env.USERPROFILE || "",
    ".pmos"
  );
  if (
    fs.existsSync(path.join(homePmos, "projects")) ||
    fs.existsSync(path.join(homePmos, "registry.json"))
  ) {
    return homePmos;
  }
  const cwd = process.cwd();
  if (
    fs.existsSync(path.join(cwd, "projects")) ||
    fs.existsSync(path.join(cwd, "registry.json"))
  ) {
    return cwd;
  }
  const parent = path.resolve(cwd, "..");
  if (
    fs.existsSync(path.join(parent, "projects")) ||
    fs.existsSync(path.join(parent, "registry.json"))
  ) {
    return parent;
  }
  return homePmos;
}

function pmosPath(...segments: string[]) {
  return path.join(getPmosHome(), ...segments);
}

function readFileSafe(filePath: string): string | null {
  try {
    return fs.readFileSync(filePath, "utf-8");
  } catch {
    return null;
  }
}

function readJson<T>(filePath: string): T | null {
  const raw = readFileSafe(filePath);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJson(filePath: string, data: unknown) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

function writeFile(filePath: string, content: string) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, content, "utf-8");
}

// ============================================================
// Registry
// ============================================================

export async function getRegistry(): Promise<Registry | null> {
  let fileRegistry = readJson<Registry>(pmosPath("registry.json"));
  if (fileRegistry) {
    fileRegistry = ensureProjectVersions(fileRegistry);
  }

  let dbRegistry: Registry | null = null;
  try {
    const doc = await readDoc<Registry>("registry", "main");
    if (doc) dbRegistry = ensureProjectVersions(doc);
  } catch {
    // PostBase offline/failed, fallback to file
  }

  if (fileRegistry && !dbRegistry) {
    try {
      await writeDoc("registry", "main", fileRegistry);
    } catch {
      // ignore
    }
    return fileRegistry;
  }

  if (!fileRegistry && dbRegistry) {
    writeJson(pmosPath("registry.json"), dbRegistry);
    return dbRegistry;
  }

  if (fileRegistry && dbRegistry) {
    // If file has fewer projects (e.g. project was removed), file is authoritative
    if (fileRegistry.projects.length !== dbRegistry.projects.length) {
      try {
        await writeDoc("registry", "main", fileRegistry);
      } catch {
        // ignore
      }
      return fileRegistry;
    }
    return fileRegistry;
  }

  return null;
}

/** Backfill `version` on any project that predates the release-version field. */
function ensureProjectVersions(registry: Registry): Registry {
  let changed = false;
  const projects = (registry.projects || []).map((p) => {
    if (!p.version || typeof p.version !== "string") {
      changed = true;
      return { ...p, version: "0.1.0" };
    }
    return p;
  });
  return changed ? { ...registry, projects } : registry;
}

export async function updateRegistry(registry: Registry): Promise<void> {
  // 1. Write to local file first
  writeJson(pmosPath("registry.json"), registry);
  // 2. Mirror to PostBase
  try {
    await writeDoc("registry", "main", registry);
  } catch {
    // ignore
  }
}

// ============================================================
// Projects
// ============================================================

export async function listProjects() {
  const registry = await getRegistry();
  const projects = registry?.projects || [];
  
  // Fetch dashboard data for each project
  const projectsWithDashboard = await Promise.all(
    projects.map(async (project) => {
      try {
        const dashboard = await getDashboard(project.slug);
        const storiesCount =
          project.stories?.backlog !== undefined
            ? (project.stories.backlog || 0) +
              (project.stories.inProgress || 0) +
              (project.stories.review || 0) +
              (project.stories.done || 0)
            : 0;
        return { ...project, dashboard, storyCount: storiesCount };
      } catch {
        return { ...project, storyCount: 0 };
      }
    })
  );
  
  return projectsWithDashboard;
}

export async function getProject(slug: string) {
  const projectDir = pmosPath("projects", slug);
  const doc = await readDoc<{ markdown: string | null }>("projects", slug).catch(() => null);
  let projectMd = doc?.markdown ?? null;
  if (projectMd === null) {
    projectMd = readFileSafe(path.join(projectDir, "project.md"));
    if (projectMd) {
      await writeDoc("projects", slug, { markdown: projectMd }).catch(() => {});
    }
  }
  return { slug, projectDir, projectMd };
}

export async function createProject(data: {
  name: string;
  slug?: string;
  source?: "local" | "github" | "github-only";
  localPath?: string;
  repoUrl?: string;
}): Promise<RegistryProject> {
  let registry = await getRegistry();
  if (!registry) {
    registry = {
      version: "0.1.0",
      createdAt: new Date().toISOString().split("T")[0],
      projects: [],
    };
  }

  const slug =
    data.slug ||
    data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

  const existing = registry.projects.find((p) => p.slug === slug);
  if (existing) {
    return existing;
  }

  const projectDir = pmosPath("projects", slug);
  if (!fs.existsSync(projectDir)) {
    fs.mkdirSync(projectDir, { recursive: true });
  }

  const newProject: RegistryProject = {
    name: data.name,
    slug,
    path: `~/.pmos/projects/${slug}`,
    source: data.source || "local",
    status: "attached",
    repoUrl: data.repoUrl || null,
    localPath: data.localPath || null,
    attachedAt: new Date().toISOString().split("T")[0],
    projectType: "full-codebase",
    version: "0.1.0",
    teams: [
      "product-manager",
      "ux-designer",
      "architect",
      "software-engineer",
      "qa-engineer",
      "documentation-agent",
      "product-intelligence",
    ],
    stories: { done: 0, review: 0, backlog: 0, inProgress: 0 },
  };

  const updatedProjects = [...registry.projects, newProject];
  await updateRegistry({ ...registry, projects: updatedProjects });

  // Initialize PostBase documents & local files
  await updateSourceLocation(slug, {
    mode: data.source || "local",
    localPath: data.localPath || "",
    repoUrl: data.repoUrl || null,
    resolvedAt: new Date().toISOString(),
    lastAnalyzed: null,
    runtime: {
      status: "not-running",
      url: null,
      port: null,
      startedAt: null,
      method: null,
    },
  });

  return newProject;
}

export async function removeProject(
  slug: string,
  options: { deleteMetadata?: boolean } = { deleteMetadata: true }
): Promise<boolean> {
  const registry = await getRegistry();
  if (!registry) return false;

  // 1. Remove from registry
  const updatedProjects = (registry.projects || []).filter((p) => p.slug !== slug);
  await updateRegistry({ ...registry, projects: updatedProjects });

  // 2. Remove PostBase documents
  const tables = [
    "projects",
    "source_location",
    "pricing",
    "dashboard",
    "journeys",
    "stories",
    "pipeline",
    "okrs",
    "bugs",
    "intelligence",
    "standup",
  ];
  for (const table of tables) {
    try {
      await deleteDoc(table, slug);
    } catch {
      // ignore
    }
  }

  // 3. Delete PMOS metadata directory ~/.pmos/projects/{slug}
  if (options.deleteMetadata) {
    const projectDir = pmosPath("projects", slug);
    try {
      if (fs.existsSync(projectDir)) {
        fs.rmSync(projectDir, { recursive: true, force: true });
      }
    } catch {
      // ignore
    }

    // Also delete any clone inside ~/.pmos/repos/{slug}
    const repoDir = pmosPath("repos", slug);
    try {
      if (fs.existsSync(repoDir)) {
        fs.rmSync(repoDir, { recursive: true, force: true });
      }
    } catch {
      // ignore
    }
  }

  return true;
}

// ============================================================
// Source Location
// ============================================================

export async function getSourceLocation(slug: string): Promise<SourceLocation | null> {
  const doc = await readDoc<SourceLocation>("source_location", slug);
  if (doc) return doc;
  const file = readJson<SourceLocation>(
    pmosPath("projects", slug, "source-location.json")
  );
  if (file) await writeDoc("source_location", slug, file);
  return file;
}

export async function updateSourceLocation(slug: string, data: SourceLocation): Promise<void> {
  await writeDoc("source_location", slug, data);
  writeJson(pmosPath("projects", slug, "source-location.json"), data); // mirror
}

// ============================================================
// Pricing Config
// ============================================================

export interface PricingConfig {
  model: string;
  developerHourlyRate: number;
  productManagerHourlyRate: number;
  qaEngineerHourlyRate: number;
  hoursPerPoint: number;
  numDevelopers: number;
  numProductManagers: number;
  numQA: number;
  // Advanced — hidden behind toggle
  aiOverheadPercent: number;
  costPerToken: number;
  tokensPerPoint: number;
  tokenMultiplier: number;
  tokensPerK: number;
  marginMultiplier: number;
}

export const DEFAULT_PRICING: PricingConfig = {
  model: "claude-sonnet-4",
  developerHourlyRate: 150,
  productManagerHourlyRate: 150,
  qaEngineerHourlyRate: 90,
  hoursPerPoint: 0.35,
  numDevelopers: 1,
  numProductManagers: 0,
  numQA: 0,
  // Derived defaults — aiOverheadPercent is auto-derived from model
  aiOverheadPercent: 3,
  costPerToken: 0.003,
  tokensPerPoint: 20000,
  tokenMultiplier: 3.5,
  tokensPerK: 1000,
  marginMultiplier: 7,
};

export async function getPricingConfig(slug: string): Promise<PricingConfig> {
  let saved = await readDoc<Partial<PricingConfig>>("pricing", slug);
  if (!saved) {
    saved = readJson<Partial<PricingConfig>>(
      pmosPath("projects", slug, "pricing.json")
    ) ?? {};
    if (Object.keys(saved).length > 0) {
      await writeDoc("pricing", slug, saved);
    }
  }
  const merged = { ...DEFAULT_PRICING, ...saved } as PricingConfig;

  // Auto-derive aiOverheadPercent from the selected model
  merged.aiOverheadPercent = deriveAIOverheadPercent(merged.model);

  return merged;
}

export async function updatePricingConfig(slug: string, data: PricingConfig): Promise<void> {
  await writeDoc("pricing", slug, data);
  writeJson(pmosPath("projects", slug, "pricing.json"), data); // mirror
}

// ============================================================
// Stories
// ============================================================

const STORY_DIRS: Record<StoryStatus, string> = {
  backlog: "stories/backlog",
  "in-progress": "stories/in-progress",
  review: "stories/review",
  done: "stories/done",
  log: "stories/log",
};

function parseStoryFile(filePath: string, status: StoryStatus): Story | null {
  const raw = readFileSafe(filePath);
  if (!raw) return null;
  const { data, content } = matter(raw);

  const id = data.id || path.basename(filePath, ".md").split("-").slice(0, 2).join("-");
  const title = data.title || data.story || path.basename(filePath, ".md");
  const points = data.points || data.estimate || 0;

  // Parse Use Case (Mike Cohn format)
  const asAMatch = content.match(/\*\*As a\*\*\s*(.+)/);
  const iWantMatch = content.match(/\*\*I want to\*\*\s*(.+)/);
  const soThatMatch = content.match(/\*\*so that\*\*\s*(.+)/);
  const useCase = {
    asA: asAMatch?.[1]?.trim() || "",
    iWant: iWantMatch?.[1]?.trim() || "",
    soThat: soThatMatch?.[1]?.trim() || "",
  };

  // Parse business goal
  const businessGoalMatch = content.match(/##\s*Business Goal\s*\n([\s\S]*?)(?=\n## |\n$)/);
  const businessGoal = businessGoalMatch?.[1]?.trim() || data["business-goal"] || "";

  // Parse Acceptance Criteria (Gherkin format)
  const acMatch = content.match(
    /##\s*Acceptance Criteria\s*\n([\s\S]*?)(?=\n## |\n$)/
  );
  const acceptanceCriteria: Story["acceptanceCriteria"] = [];
  if (acMatch) {
    const acBlock = acMatch[1];
    // Split by scenario markers
    const scenarioBlocks = acBlock.split(/(?=- \*\*Scenario:\*\*)/);
    for (const block of scenarioBlocks) {
      const scenarioMatch = block.match(/\*\*Scenario:\*\*\s*(.+)/);
      if (!scenarioMatch) continue;
      const scenario = scenarioMatch[1].trim();

      // Collect all Given lines (including "and Given")
      const givens: string[] = [];
      const givenRegex = /(?:and\s+)?\*\*Given:\*\*\s*(.+)/gi;
      let gm: RegExpExecArray | null;
      while ((gm = givenRegex.exec(block)) !== null) {
        givens.push(gm[1].trim());
      }

      const whenMatch = block.match(/\*\*When:\*\*\s*(.+)/);
      const thenMatch = block.match(/\*\*Then:\*\*\s*(.+)/);

      if (whenMatch && thenMatch) {
        acceptanceCriteria.push({
          scenario,
          given: givens,
          when: whenMatch[1].trim(),
          then: thenMatch[1].trim(),
        });
      }
    }
  }

  // Fallback: parse old-style bullet acceptance criteria
  if (acceptanceCriteria.length === 0) {
    const oldAcMatch = content.match(
      /##\s*Acceptance Criteria\s*\n([\s\S]*?)(?=\n## |\n$)/
    );
    if (oldAcMatch) {
      const bullets = oldAcMatch[1]
        .split("\n")
        .filter((l: string) => l.startsWith("- ") || l.startsWith("* "))
        .map((l: string) => l.replace(/^[-*]\s*/, "").trim());
      if (bullets.length > 0) {
        acceptanceCriteria.push({
          scenario: "Default",
          given: [],
          when: "",
          then: bullets.join("; "),
        });
      }
    }
  }

  const estimatedHours = Number(
    data["estimated-hours"] || data.estimatedHours || (points ? points * 0.35 : 1)
  );
  const estimatedTokens = Number(
    data["estimated-tokens"] || data.estimatedTokens || Math.round(estimatedHours * 15000)
  );
  const tokensUsed = data["tokens-used"]
    ? Number(data["tokens-used"])
    : data.tokensUsed
    ? Number(data.tokensUsed)
    : undefined;
  const executionDurationMs = data["execution-duration-ms"]
    ? Number(data["execution-duration-ms"])
    : data.executionDurationMs
    ? Number(data.executionDurationMs)
    : undefined;
  const cost = data.cost ? Number(data.cost) : undefined;
  const startedAt = data["started-at"] || data.startedAt || undefined;
  const completedAt = data["completed-at"] || data.completedAt || undefined;

  return {
    id,
    title,
    description: data.description || "",
    points,
    estimatedHours,
    actualHours: data["actual-hours"] || data.actualHours || undefined,
    startedAt,
    completedAt,
    executionDurationMs,
    estimatedTokens,
    tokensUsed,
    cost,
    status,
    useCase,
    businessGoal,
    acceptanceCriteria,
    persona: data.persona,
    personaRole: data["persona-role"],
    journeyStep: data["journey-step"],
    estimatedValue: data["estimated-value"] || data.estimatedValue || undefined,
    assignedAgent: data["assigned-agent"] || data.assignedAgent || undefined,
    objectiveId: data["objective-id"] || data.objectiveId || undefined,
    dimensions: data.dimensions || undefined,
    filePath,
  };
}

/** Legacy disk reader — used as a one-time bootstrap when PostBase is empty or when disk files are authoritative. */
function readStoriesFromFiles(slug: string): Story[] {
  const stories: Story[] = [];
  for (const [status, dir] of Object.entries(STORY_DIRS)) {
    const fullPath = pmosPath("projects", slug, dir);
    if (!fs.existsSync(fullPath)) continue;
    const files = fs.readdirSync(fullPath).filter((f) => f.endsWith(".md"));
    for (const file of files) {
      const story = parseStoryFile(path.join(fullPath, file), status as StoryStatus);
      if (story) stories.push(story);
    }
  }
  return stories;
}

export async function getAllStories(slug: string): Promise<Story[]> {
  const diskStories = readStoriesFromFiles(slug);
  const dbStories = await readItems<Story>("stories", slug);

  if (diskStories.length > 0) {
    const dbMap = new Map(dbStories.map((s) => [s.id, s]));
    const merged: Story[] = diskStories.map((diskStory) => {
      const dbStory = dbMap.get(diskStory.id);
      if (dbStory) {
        return {
          ...dbStory,
          ...diskStory,
          status: diskStory.status, // The actual folder on disk (backlog, in-progress, done) is authoritative!
          objectiveId: dbStory.objectiveId || diskStory.objectiveId,
          dimensions: dbStory.dimensions || diskStory.dimensions,
          agentWork:
            diskStory.status === "in-progress"
              ? dbStory.agentWork && dbStory.agentWork.status !== "waiting"
                ? dbStory.agentWork
                : {
                    status: "waiting",
                    assignedAgent: diskStory.assignedAgent || "software-engineer",
                    notes: "Placed in Doing by Product Manager. Waiting for execution trigger.",
                  }
              : {
                  status: "waiting",
                },
        };
      }
      return {
        ...diskStory,
        agentWork:
          diskStory.status === "in-progress"
            ? {
                status: "waiting",
                assignedAgent: diskStory.assignedAgent || "software-engineer",
                notes: "Placed in Doing by Product Manager. Waiting for execution trigger.",
              }
            : {
                status: "waiting",
              },
      };
    });

    // Also include any stories in DB that are not files on disk
    const diskIds = new Set(diskStories.map((s) => s.id));
    for (const dbStory of dbStories) {
      if (!diskIds.has(dbStory.id)) {
        merged.push(dbStory);
      }
    }

    // Persist synchronized state to PostBase
    await writeItems("stories", slug, merged);
    return merged;
  }

  if (dbStories.length > 0) return dbStories;
  return [];
}

export async function getStoriesByStatus(slug: string): Promise<Record<StoryStatus, Story[]>> {
  const stories = await getAllStories(slug);
  const grouped: Record<StoryStatus, Story[]> = {
    backlog: [],
    "in-progress": [],
    review: [],
    done: [],
    log: [],
  };
  for (const s of stories) {
    if (grouped[s.status]) {
      grouped[s.status].push(s);
    }
  }
  return grouped;
}

export async function createStory(
  slug: string,
  story: {
    title: string;
    description: string;
    points?: number;
    estimatedHours?: number;
    estimatedTokens?: number;
    persona?: string;
    personaRole?: string;
    journeyStep?: string;
    useCase?: { asA: string; iWant: string; soThat: string };
    businessGoal?: string;
    estimatedValue?: number;
    acceptanceCriteria?: { scenario: string; given: string[]; when: string; then: string }[];
  }
) {
  const existing = await getAllStories(slug);
  const maxNum = existing.reduce((max, s) => {
    const num = parseInt(s.id.replace("STORY-", ""));
    return isNaN(num) ? max : Math.max(max, num);
  }, 0);
  const nextId = `STORY-${String(maxNum + 1).padStart(3, "0")}`;
  const fileName = `${nextId}-${story.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "")}.md`;

  const hours = story.estimatedHours ?? (story.points ? story.points * 0.35 : 1);
  const tokens = story.estimatedTokens ?? Math.round(hours * 15000);

  const frontmatter: string[] = [
    `id: ${nextId}`,
    `title: "${story.title}"`,
    `estimated-hours: ${hours}`,
    `estimated-tokens: ${tokens}`,
    `points: ${story.points ?? Math.max(1, Math.round(hours / 0.35))}`,
    `status: backlog`,
  ];
  if (story.persona) frontmatter.push(`persona: "${story.persona}"`);
  if (story.personaRole) frontmatter.push(`persona-role: "${story.personaRole}"`);
  if (story.journeyStep) frontmatter.push(`journey-step: "${story.journeyStep}"`);
  if (story.estimatedValue) frontmatter.push(`estimated-value: ${story.estimatedValue}`);

  const uc = story.useCase || { asA: story.persona || "a user", iWant: story.description, soThat: story.businessGoal || "" };

  const acLines = (story.acceptanceCriteria || []).map((ac) => {
    const givens = ac.given.map((g) => `- **and Given:** ${g}`).join("\n");
    return [
      `- **Scenario:** ${ac.scenario}`,
      `- **Given:** ${ac.given[0] || "the user is in the correct state"}`,
      givens ? givens.replace(/^- \*\*and Given:\*\* [^\n]+\n/, "") : "",
      `- **When:** ${ac.when}`,
      `- **Then:** ${ac.then}`,
    ].filter(Boolean).join("\n");
  }).join("\n\n");

  const businessGoalSection = story.businessGoal ? `\n## Business Goal\n\n${story.businessGoal}\n` : "";

  const content = `---
${frontmatter.join("\n")}
---

## User Story

**As a** ${uc.asA || "user"}
**I want to** ${uc.iWant || story.title}
**so that** ${uc.soThat || "I achieve business value"}
${businessGoalSection}
## Acceptance Criteria

${acLines || "- **Scenario:** Default\n  - **Given:** the feature is enabled\n  - **When:** user interacts\n  - **Then:** system responds"}
`;

  const filePath = pmosPath("projects", slug, "stories", "backlog", fileName);

  existing.push({
    id: nextId,
    title: story.title,
    description: story.description,
    points: story.points ?? Math.max(1, Math.round(hours / 0.35)),
    estimatedHours: hours,
    estimatedTokens: tokens,
    status: "backlog",
    useCase: uc,
    businessGoal: story.businessGoal,
    estimatedValue: story.estimatedValue,
    acceptanceCriteria: story.acceptanceCriteria || [],
    persona: story.persona,
    personaRole: story.personaRole,
    journeyStep: story.journeyStep,
    filePath,
    source: "manual",
  });

  await writeItems("stories", slug, existing);
  writeFile(filePath, content); // mirror

  return { id: nextId, filePath };
}

/** Mirror a story move onto the legacy markdown files (best-effort). */
function mirrorMoveStoryFile(slug: string, storyId: string, from: StoryStatus, to: StoryStatus): string | null {
  const fromDir = pmosPath("projects", slug, STORY_DIRS[from]);
  const toDir = pmosPath("projects", slug, STORY_DIRS[to]);
  if (!fs.existsSync(toDir)) {
    fs.mkdirSync(toDir, { recursive: true });
  }
  if (!fs.existsSync(fromDir)) return null;

  const files = fs.readdirSync(fromDir).filter((f) => f.includes(storyId));
  if (files.length === 0) return null;

  const file = files[0];
  const src = path.join(fromDir, file);
  const dest = path.join(toDir, file);

  // Update frontmatter status
  const raw = readFileSafe(src);
  if (raw) {
    const updated = raw.replace(/status:\s*\w+/, `status: ${to}`);
    writeFile(dest, updated);
    fs.unlinkSync(src);
  }

  return dest;
}

export async function moveStory(slug: string, storyId: string, from: StoryStatus, to: StoryStatus): Promise<string | null> {
  const stories = await getAllStories(slug);
  const story = stories.find((s) => s.id === storyId && s.status === from);
  if (!story) return null;
  story.status = to;
  await writeItems("stories", slug, stories);
  return mirrorMoveStoryFile(slug, storyId, from, to);
}

export async function updateStoryStatus(slug: string, storyId: string, to: StoryStatus): Promise<string | null> {
  const stories = await getAllStories(slug);
  const story = stories.find((s) => s.id === storyId);
  if (!story || story.status === to) return null;
  const from = story.status;
  story.status = to;

  // When moving to in-progress (Doing), set to "waiting" status for the Product Manager to trigger execution
  if (to === "in-progress") {
    let agentId = story.assignedAgent;
    if (!agentId) {
      if (story.category === "UX/Product" || story.persona) agentId = "ux-designer";
      else if (story.category === "Technical" || story.category === "Code Analysis") agentId = "software-engineer";
      else if (story.category === "Critical Issue" || story.category === "High Priority Issue") agentId = "qa-engineer";
      else agentId = "software-engineer";
      story.assignedAgent = agentId;
    }
    story.agentWork = {
      status: "waiting",
      assignedAgent: agentId,
      notes: `Placed in Doing by Product Manager. Waiting for execution trigger.`,
    };
  }

  if (to === "backlog" && story.agentWork) {
    story.agentWork.status = "waiting";
  }

  if (to === "done" && !story.completedAt) {
    story.completedAt = new Date().toISOString();
    if (story.agentWork) {
      story.agentWork.status = "done";
      story.agentWork.completedAt = story.completedAt;
    }
  }

  if (to === "log") {
    if (!story.completedAt) {
      story.completedAt = new Date().toISOString();
    }
    story.loggedAt = new Date().toISOString();
    if (story.agentWork) {
      story.agentWork.status = "done";
      story.agentWork.completedAt = story.completedAt;
      story.agentWork.notes = `Logged & Shipped in PostBase at ${story.loggedAt}`;
    }
  }

  await writeItems("stories", slug, stories);
  mirrorMoveStoryFile(slug, storyId, from, to);
  return story.assignedAgent || "software-engineer";
}

export async function updateStory(
  slug: string,
  storyId: string,
  updates: Partial<Story>
): Promise<Story | null> {
  const stories = await getAllStories(slug);
  const idx = stories.findIndex((s) => s.id === storyId);
  if (idx < 0) return null;
  const prevStatus = stories[idx].status;
  stories[idx] = { ...stories[idx], ...updates };
  if (updates.status && updates.status !== prevStatus) {
    mirrorMoveStoryFile(slug, storyId, prevStatus, updates.status);
  }
  await writeItems("stories", slug, stories);
  return stories[idx];
}

/**
 * Executes pending stories in the test harness directly on user trigger.
 * Automatically dispatches stories directly into AionUi agent queue and SQLite database.
 * Only targets stories in the Doing column (in-progress) that are waiting for execution.
 */
export async function executeStoriesInHarness(
  slug: string,
  storyIds?: string[]
): Promise<{ executedCount: number; stories: Story[]; logs: string[]; dispatchCommands: string[] }> {
  const stories = await getAllStories(slug);
  const pricing = (await getPricingConfig(slug)) || DEFAULT_PRICING;
  const sourceLoc = await getSourceLocation(slug);
  const logs: string[] = [];
  const dispatchCommands: string[] = [];

  // If specific IDs provided, execute those; otherwise target ONLY stories in Doing (in-progress)
  const targets = storyIds && storyIds.length > 0
    ? stories.filter((s) => storyIds.includes(s.id))
    : stories.filter((s) => s.status === "in-progress" && (!s.agentWork || s.agentWork.status === "waiting" || s.agentWork.status === "queued"));

  if (targets.length === 0) {
    return {
      executedCount: 0,
      stories,
      logs: ["No stories waiting for execution in Doing column."],
      dispatchCommands: [],
    };
  }

  const now = new Date();

  for (const story of targets) {
    const prevStatus = story.status;
    const hours = story.estimatedHours || (story.points ? story.points * 0.35 : 1);

    // Assign best fit agent
    let agentId = story.assignedAgent;
    if (!agentId) {
      if (story.category === "UX/Product" || story.persona) agentId = "ux-designer";
      else if (story.category === "Technical" || story.category === "Code Analysis") agentId = "software-engineer";
      else if (story.category === "Critical Issue" || story.category === "High Priority Issue") agentId = "qa-engineer";
      else agentId = "software-engineer";
      story.assignedAgent = agentId;
    }

    const durationMs = Math.round((45 + Math.random() * 45) * 1000);
    const tokens = story.tokensUsed || Math.round(hours * 15000 + Math.random() * 3000);
    const costPer1K = (pricing.costPerToken ?? 0.003) * 1000;
    const laborCost = hours * (pricing.developerHourlyRate ?? 150);
    const tokenCost = (tokens / 1000) * costPer1K;
    const totalCost = laborCost + tokenCost;

    story.startedAt = story.startedAt || now.toISOString();
    story.executionDurationMs = durationMs;
    story.tokensUsed = tokens;
    story.actualHours = hours;
    story.cost = totalCost;

    // Keep active stories in Doing (in-progress) and mark as queued for AionUi agent pickup
    story.status = "in-progress";
    story.agentWork = {
      status: "queued",
      assignedAgent: agentId,
      startedAt: story.startedAt,
      durationMs,
      tokensUsed: tokens,
      notes: `Queued for ${agentId} in AionUi harness (${Math.round(durationMs / 1000)}s, ${tokens.toLocaleString()} tokens)`,
    };

    const cmd = `PMOS: implement story ${story.id} for ${slug}`;
    dispatchCommands.push(cmd);

    // Automatically send to AionUi directly
    try {
      const dispatchResult = await dispatchStoryToAionUi(slug, story, sourceLoc?.localPath);
      logs.push(`✓ Auto-dispatched ${story.id} ("${story.title}") directly to AionUi (${agentId}): ${dispatchResult.notes || "Queued"}`);
    } catch (err: any) {
      logs.push(`Dispatched ${story.id} to ${agentId} (in-progress). AionUi Command: ${cmd}`);
    }

    if (prevStatus !== story.status) {
      mirrorMoveStoryFile(slug, story.id, prevStatus, story.status);
    }
  }

  await writeItems("stories", slug, stories);

  return {
    executedCount: targets.length,
    stories,
    logs,
    dispatchCommands,
  };
}

// ============================================================
// Agents
// ============================================================

/** Legacy disk reader — used as a one-time bootstrap when PostBase is empty. */
function readAgentsFromFiles(slug: string): Agent[] {
  const agentsDir = pmosPath("projects", slug, "agents");
  if (!fs.existsSync(agentsDir)) return [];
  const files = fs.readdirSync(agentsDir).filter((f) => f.endsWith(".md"));
  return files.map((file) => {
    const raw = readFileSafe(path.join(agentsDir, file)) || "";
    const { data, content } = matter(raw);
    const focusMatch = content.match(/## Focus Areas\s*\n([\s\S]*?)(?=\n## |\n$)/);
    const focus = focusMatch
      ? focusMatch[1]
          .split("\n")
          .filter((l: string) => l.startsWith("- "))
          .map((l: string) => l.replace(/^-\s*/, "").trim())
      : [];
    const activeMatch = content.match(/## Active Stories\s*\n([\s\S]*?)(?=\n## |\n$)/);
    const activeStories = activeMatch
      ? activeMatch[1]
          .split("\n")
          .filter((l: string) => l.startsWith("- "))
          .map((l: string) => l.replace(/^-\s*/, "").trim())
      : [];

    return {
      id: file.replace(".md", ""),
      name: data.name || file.replace(".md", "").replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()),
      role: data.role || "Agent",
      focus,
      activeStories,
      filePath: path.join(agentsDir, file),
    };
  });
}

export async function getAllAgents(slug: string): Promise<Agent[]> {
  const items = await readItems<Agent>("agents", slug);
  if (items.length > 0) return items;
  const fromFiles = readAgentsFromFiles(slug);
  if (fromFiles.length > 0) await writeItems("agents", slug, fromFiles);
  return fromFiles;
}

/** Rebuild an agent's markdown mirror file from its PostBase state. */
function mirrorAgentMarkdown(agent: Agent) {
  const raw = readFileSafe(agent.filePath);
  if (!raw) return;
  const { data, content } = matter(raw);
  const activeMatch = content.match(/## Active Stories\s*\n([\s\S]*?)(?=\n## |\n$)/);
  const activeSection = `## Active Stories\n${agent.activeStories
    .map((id) => `- ${id}`)
    .join("\n")}`;

  let newContent: string;
  if (activeMatch) {
    newContent = content.replace(activeMatch[0], activeSection);
  } else {
    newContent = content.endsWith("\n")
      ? `${content}\n${activeSection}\n`
      : `${content}\n\n${activeSection}\n`;
  }

  writeFile(agent.filePath, matter.stringify(newContent, data));
}

/**
 * Pick the best-fit agent to pick up a story.
 *
 * The team decides who owns the work:
 *  1. Focus-area match — keywords in the story (title, description, persona,
 *     use case) are scored against each agent's focus areas and role.
 *  2. Load balancing — agents with fewer in-progress stories are preferred.
 *  3. Advisory agents (Product Manager, Product Intelligence) never pick up.
 *
 * On pickup the story gets `assignedAgent` and the agent's Active Stories is
 * updated (deduplicated). Returns `{ agentId, agentName }` or null.
 */
export interface StoryPickup {
  agentId: string;
  agentName: string;
}

/** Agents that pick up implementation work (advisory roles are excluded). */
const PICKUP_AGENT_IDS = new Set([
  "software-engineer",
  "ux-designer",
  "architect",
  "qa-engineer",
  "documentation-agent",
  "security-officer",
  "release-engineer",
  "debugger",
  "code-reviewer",
]);

/** Agent id → keywords that attract that agent to a story. */
const PICKUP_KEYWORDS: Record<string, string[]> = {
  "software-engineer": [
    "implement", "build", "feature", "api", "endpoint", "backend", "frontend",
    "component", "integration", "refactor", "code", "function", "logic",
    "database", "query", "ui", "interface", "button", "form", "list",
  ],
  "ux-designer": [
    "design", "ux", "user experience", "interface", "usability", "flow",
    "wireframe", "prototype", "persona", "journey", "visual", "layout",
    "accessibility", "dark mode", "responsive",
  ],
  architect: [
    "architecture", "architect", "system", "design", "scalab", "modular",
    "pattern", "domain", "service layer", "infrastructure", "schema",
  ],
  "qa-engineer": [
    "test", "testing", "qa", "coverage", "regression", "acceptance",
    "quality", "verify", "validation", "edge case", "unit test",
  ],
  "documentation-agent": [
    "document", "docs", "readme", "wiki", "guide", "tutorial", "comment",
    "changelog", "release notes", "walkthrough",
  ],
  "security-officer": [
    "security", "auth", "oauth", "password", "encryption", "vulnerab",
    "sso", "permission", "privacy", "token", "2fa", "owasp", "audit",
  ],
  "release-engineer": [
    "release", "deploy", "ship", "ci", "cd", "pipeline", "version",
    "rollout", "staging", "production", "changelog", "rollback",
  ],
  debugger: [
    "bug", "fix", "error", "crash", "exception", "fail", "broken",
    "incident", "regression", "trace", "debug", "stack trace", "issue",
  ],
  "code-reviewer": [
    "review", "code review", "lint", "quality", "maintainab", "best practice",
    "refactor", "clean code", "standards", "pr",
  ],
};

function storyPickupText(story: Story): string {
  return [
    story.title,
    story.description,
    story.persona,
    story.personaRole,
    story.journeyStep,
    story.useCase?.asA,
    story.useCase?.iWant,
    story.useCase?.soThat,
    story.businessGoal,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export async function pickUpStory(
  slug: string,
  storyId: string
): Promise<StoryPickup | null> {
  const [agents, stories] = await Promise.all([
    getAllAgents(slug),
    getAllStories(slug),
  ]);

  const story = stories.find((s) => s.id === storyId);
  if (!story) return null;

  // Already picked up by a pickup-capable agent → keep them on it.
  if (
    story.assignedAgent &&
    PICKUP_AGENT_IDS.has(story.assignedAgent) &&
    agents.some((a) => a.id === story.assignedAgent)
  ) {
    const existing = agents.find((a) => a.id === story.assignedAgent)!;
    return { agentId: existing.id, agentName: existing.name };
  }

  const candidates = agents.filter((a) => PICKUP_AGENT_IDS.has(a.id));
  if (candidates.length === 0) return null;

  const inProgressByAgent = new Map<string, number>();
  for (const a of candidates) {
    inProgressByAgent.set(
      a.id,
      a.activeStories.filter((id) => {
        const s = stories.find((x) => x.id === id);
        return s && s.status === "in-progress";
      }).length
    );
  }

  // Field-weighted keyword matching: the title and use-case dominate; long
  // prose fields (business goal) contribute less so generic words like
  // "issue"/"incident" in a goal don't hijack the assignment.
  const weightedFields = [
    { text: story.title, weight: 3 },
    { text: story.description, weight: 2 },
    {
      text: `${story.persona ?? ""} ${story.personaRole ?? ""} ${story.journeyStep ?? ""}`,
      weight: 1,
    },
    {
      text: `${story.useCase?.asA ?? ""} ${story.useCase?.iWant ?? ""} ${story.useCase?.soThat ?? ""}`,
      weight: 2,
    },
    { text: story.businessGoal, weight: 1 },
  ];

  let best: Agent | null = null;
  let bestScore = -Infinity;
  for (const a of candidates) {
    const keywords = PICKUP_KEYWORDS[a.id] ?? [];
    let focusScore = 0;
    for (const kw of keywords) {
      for (const f of weightedFields) {
        if (f.text && f.text.toLowerCase().includes(kw)) focusScore += f.weight;
      }
    }
    // Role + focus areas also count (agents may carry custom focus lists).
    const roleText = `${a.name} ${a.role} ${(a.focus ?? []).join(" ")}`.toLowerCase();
    for (const kw of keywords) {
      if (roleText.includes(kw)) focusScore += 1;
    }

    const load = inProgressByAgent.get(a.id) ?? 0;
    // Score: strong focus match dominates; load breaks ties.
    const score = focusScore * 100 - load;
    if (score > bestScore) {
      bestScore = score;
      best = a;
    }
  }
  if (!best) return null;

  // Assign: update the story + the agent's Active Stories (dedup).
  story.assignedAgent = best.id;
  story.agentWork = {
    status: "queued",
    assignedAgent: best.id,
    assignedAt: new Date().toISOString(),
  };
  await writeItems("stories", slug, stories);

  if (!best.activeStories.includes(storyId)) {
    best.activeStories.push(storyId);
    await writeItems("agents", slug, agents);
    mirrorAgentMarkdown(best); // mirror
  }

  return { agentId: best.id, agentName: best.name };
}

/**
 * Pick the best-fit agent for a bug. Bugs go to the Debugger first,
 * falling back to QA Engineer, then Software Engineer, then any pickup agent.
 */
export async function pickUpBug(
  slug: string,
  bugId: string
): Promise<StoryPickup | null> {
  const agents = await getAllAgents(slug);
  const order = ["debugger", "qa-engineer", "software-engineer"];
  const pickupable = agents.filter((a) => PICKUP_AGENT_IDS.has(a.id));
  if (pickupable.length === 0) return null;

  let best: Agent | null = null;
  let bestRank = Infinity;
  for (const a of pickupable) {
    const rank = order.indexOf(a.id);
    if (rank >= 0 && rank < bestRank) {
      bestRank = rank;
      best = a;
    }
  }
  // No dedicated debugging agent → least-loaded pickup agent.
  if (!best) {
    const stories = await getAllStories(slug);
    let leastLoad = Infinity;
    for (const a of pickupable) {
      const load = a.activeStories.filter((id) =>
        stories.some((s) => s.id === id && s.status === "in-progress")
      ).length;
      if (load < leastLoad) {
        leastLoad = load;
        best = a;
      }
    }
  }
  if (!best) return null;

  if (!best.activeStories.includes(bugId)) {
    best.activeStories.push(bugId);
    await writeItems("agents", slug, agents);
    mirrorAgentMarkdown(best); // mirror
  }

  return { agentId: best.id, agentName: best.name };
}

// ============================================================
// Intelligence
// ============================================================

export async function getIntelligence(slug: string): Promise<Intelligence> {
  const doc = await readDoc<Intelligence>("intelligence", slug);
  if (doc) return doc;

  // fall back to the legacy files (external tools write these)
  const intelDir = pmosPath("projects", slug, "intelligence");
  return {
    architecture: readFileSafe(path.join(intelDir, "architecture.md")),
    domainModel: readFileSafe(path.join(intelDir, "domain-model.md")),
    techStack: readFileSafe(path.join(intelDir, "tech-stack.md")),
    features: readFileSafe(path.join(intelDir, "features.md")),
    codeQuality: readFileSafe(path.join(intelDir, "code-quality.md")),
    improvements: readFileSafe(path.join(intelDir, "improvements.md")),
    apiDocs: readFileSafe(path.join(intelDir, "api-docs.md")),
    missingDocs: readFileSafe(path.join(intelDir, "missing-docs.md")),
  };
}

// ============================================================
// Dashboard
// ============================================================

export async function getDashboard(slug: string): Promise<DashboardData> {
  const [stories, agents] = await Promise.all([
    getAllStories(slug),
    getAllAgents(slug),
  ]);
  const storyBreakdown = {
    backlog: stories.filter((s) => s.status === "backlog").length,
    inProgress: stories.filter((s) => s.status === "in-progress").length,
    review: stories.filter((s) => s.status === "review").length,
    done: stories.filter((s) => s.status === "done").length,
  };
  const total = stories.length || 1;
  const donePct = storyBreakdown.done / total;
  const healthScore = Math.round(donePct * 100);

  return {
    healthScore,
    storyBreakdown,
    agentWorkload: agents.map((a) => ({
      agent: a.name,
      active: a.activeStories.length,
      completed: 0,
      queued: 0,
    })),
    applicationStatus: "ready",
    lastAnalyzed: null,
  };
}

// ============================================================
// Pipeline
// ============================================================

export async function getPipelineSteps(slug: string): Promise<PipelineStep[]> {
  const steps: PipelineStep[] = [
    { number: 1, name: "Resolve Source", description: "Find code wherever it lives", status: "pending" },
    { number: 2, name: "Repository Intelligence", description: "Architecture, domain model, tech stack", status: "pending" },
    { number: 3, name: "Run Application", description: "Detect and launch the app", status: "pending" },
    { number: 4, name: "Customer Journey Discovery", description: "Screens, personas, flow", status: "pending" },
    { number: 5, name: "Story Mapping", description: "Activities → Tasks → Stories", status: "pending" },
    { number: 6, name: "Build Backlog", description: "AI identifies improvements", status: "pending" },
    { number: 7, name: "Agent Kanban", description: "7 agents with work queues", status: "pending" },
    { number: 8, name: "Product Dashboard", description: "Live health metrics", status: "pending" },
    { number: 9, name: "Continuous Learning", description: "Auto-update on every commit", status: "pending" },
  ];

  const source = await getSourceLocation(slug);
  if (source) steps[0].status = "done";
  const intel = await getIntelligence(slug);
  if (intel.architecture || intel.techStack) steps[1].status = "done";

  if (
    slug === "pmos" ||
    source?.runtime?.status === "ready" ||
    source?.runtime?.status === "running" ||
    (source?.runtime?.port && source?.runtime?.port > 0)
  ) {
    steps[2].status = "done";
  }

  const journey = await getJourneyMarkdown(slug);
  if (journey) steps[3].status = "done";

  const storyMap = await getStoryMapMarkdown(slug);
  if (storyMap) steps[4].status = "done";

  const stories = await getAllStories(slug);
  if (stories.length > 0) steps[5].status = "done";

  if (await agentsExist(slug)) steps[6].status = "done";

  const dash = await getDashboardMarkdown(slug);
  if (dash) steps[7].status = "done";

  return steps;
}

async function agentsExist(slug: string): Promise<boolean> {
  const agents = await getAllAgents(slug);
  return agents.length > 0;
}

/** stories/story-map.md content — PostBase first, legacy file fallback. */
async function getStoryMapMarkdown(slug: string): Promise<string | null> {
  const doc = await readDoc<{ markdown: string }>("story_map_md", slug);
  if (doc?.markdown) return doc.markdown;
  const file = readFileSafe(pmosPath("projects", slug, "stories", "story-map.md"));
  if (file) await writeDoc("story_map_md", slug, { markdown: file });
  return file;
}

/** dashboard.md content — PostBase first, legacy file fallback. */
async function getDashboardMarkdown(slug: string): Promise<string | null> {
  const doc = await readDoc<{ markdown: string }>("dashboard_md", slug);
  if (doc?.markdown) return doc.markdown;
  const file = readFileSafe(pmosPath("projects", slug, "dashboard.md"));
  if (file) await writeDoc("dashboard_md", slug, { markdown: file });
  return file;
}

// ============================================================
// Journey / Personas
// ============================================================

export async function getJourneyMarkdown(slug: string): Promise<string | null> {
  const doc = await readDoc<{ journey: string | null; personas: string | null }>("journeys", slug);
  if (doc?.journey) return doc.journey;
  const file = readFileSafe(pmosPath("projects", slug, "journey", "journey.md"));
  if (file) await writeDoc("journeys", slug, { journey: file, personas: null });
  return file;
}

export async function getPersonasMarkdown(slug: string): Promise<string | null> {
  const doc = await readDoc<{ journey: string | null; personas: string | null }>("journeys", slug);
  if (doc?.personas) return doc.personas;
  const file = readFileSafe(pmosPath("projects", slug, "journey", "personas.md"));
  if (file) await writeDoc("journeys", slug, { journey: null, personas: file });
  return file;
}

export async function updateJourneyMarkdown(slug: string, content: string): Promise<void> {
  const doc = (await readDoc<{ journey: string | null; personas: string | null }>("journeys", slug)) ?? { journey: null, personas: null };
  doc.journey = content;
  await writeDoc("journeys", slug, doc);
  writeFile(pmosPath("projects", slug, "journey", "journey.md"), content); // mirror
}

export async function updatePersonasMarkdown(slug: string, content: string): Promise<void> {
  const doc = (await readDoc<{ journey: string | null; personas: string | null }>("journeys", slug)) ?? { journey: null, personas: null };
  doc.personas = content;
  await writeDoc("journeys", slug, doc);
  writeFile(pmosPath("projects", slug, "journey", "personas.md"), content); // mirror
}

// ============================================================
// Per-Persona Journeys
// ============================================================

export interface PersonaJourneyStep {
  stepNumber: number;
  name: string;
  activity: string;
  tasks: string[];
  painPoints: string[];
  screen: string;
  stories: { id: string; title: string; points: number; status: string }[];
  mockup?: ScreenMockup;
}

export interface PersonaDemographics {
  age?: number | string;
  location?: string;
  job?: string;
  education?: string;
}

export interface PersonaUsageMetric {
  label: string;
  score: number; // 0-100
}

export interface PersonaJourney {
  personaId: string;
  personaName: string;
  role: string;
  personaBlurb: string;
  quote: string;
  avatarUrl?: string;
  avatarId?: string;
  demographics?: PersonaDemographics;
  goals?: string[];
  habits?: string[];
  frustrations?: string[];
  metrics?: PersonaUsageMetric[];
  steps: PersonaJourneyStep[];
  rawMarkdown: string;
}

const DEFAULT_AVATARS: Record<string, string> = {
  robot: "/avatars/robot-agent.svg",
  agent: "/avatars/robot-agent.svg",
  bot: "/avatars/robot-agent.svg",
  coder: "/avatars/robot-agent.svg",
  system: "/avatars/system-service.svg",
  service: "/avatars/system-service.svg",
  cron: "/avatars/system-service.svg",
  pipeline: "/avatars/system-service.svg",
  engine: "/avatars/system-service.svg",
  priya: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&auto=format&fit=crop&q=80",
  sarah: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80",
  amara: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=600&auto=format&fit=crop&q=80",
  elena: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=600&auto=format&fit=crop&q=80",
  mei: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&auto=format&fit=crop&q=80",
  clara: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=600&auto=format&fit=crop&q=80",
  marcus: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80",
  dev: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80",
  tariq: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&auto=format&fit=crop&q=80",
  david: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&auto=format&fit=crop&q=80",
  kwame: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&auto=format&fit=crop&q=80",
  mateo: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600&auto=format&fit=crop&q=80",
  mike: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600&auto=format&fit=crop&q=80",
  liam: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=600&auto=format&fit=crop&q=80",
  emma: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=600&auto=format&fit=crop&q=80",
};

function resolvePersonaAvatar(name: string, id: string, customUrl?: string): string {
  if (customUrl && (customUrl.startsWith("http") || customUrl.startsWith("data:") || customUrl.startsWith("/"))) {
    return customUrl;
  }
  const key = id.toLowerCase() + " " + name.toLowerCase();
  for (const [k, url] of Object.entries(DEFAULT_AVATARS)) {
    if (key.includes(k)) return url;
  }
  return DEFAULT_AVATARS.priya;
}

function parsePersonaJourney(md: string): PersonaJourney {
  let data: any = {};
  let content = md;

  try {
    const parsed = matter(md);
    data = parsed.data || {};
    content = parsed.content || md;
  } catch {
    content = md;
  }

  // Extract header info
  const nameMatch = content.match(/#\s*Customer Journey\s*[—–-]\s*(.+?)\s*\((.+?)\)/);
  const personaName = data.personaName || data.name || nameMatch?.[1] || "Unknown";
  const role = data.role || nameMatch?.[2] || "Product User";
  const quoteMatch = content.match(/\*\*Quote\*\*:\s*"(.+?)"/);
  const quote = data.quote || quoteMatch?.[1] || "";
  const personaMatch = content.match(/\*\*Persona\*\*:\s*(.+)/);
  const personaBlurb = data.personaBlurb || data.blurb || personaMatch?.[1]?.trim() || "";
  const personaId =
    data.personaId ||
    data.id ||
    personaName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") ||
    "persona";

  const avatarUrl = data.avatarUrl || data.image || resolvePersonaAvatar(personaName, personaId, data.avatarId);
  const avatarId = data.avatarId;

  const demographics: PersonaDemographics = {
    age: data.demographics?.age ?? data.age ?? 30,
    location: data.demographics?.location ?? data.location ?? "Austin, TX",
    job: data.demographics?.job ?? data.job ?? role,
    education: data.demographics?.education ?? data.education,
  };

  const goals: string[] = Array.isArray(data.goals) && data.goals.length > 0
    ? data.goals
    : [
        `Achieve seamless workflow results as a ${role}`,
        `Save time and eliminate friction in product operations`,
      ];

  const habits: string[] = Array.isArray(data.habits) && data.habits.length > 0
    ? data.habits
    : [
        "Prefers fast, visual navigation with clear next steps",
        "Uses mobile-first and desktop workflows interchangeably",
      ];

  const frustrations: string[] = Array.isArray(data.frustrations) && data.frustrations.length > 0
    ? data.frustrations
    : [
        "Disconnected tools that require manual duplicate entry",
        "Lack of real-time visibility into process bottlenecks",
      ];

  const metrics: PersonaUsageMetric[] = Array.isArray(data.metrics) && data.metrics.length > 0
    ? data.metrics
    : [
        { label: "Product Usage", score: 85 },
        { label: "Messaging", score: 70 },
        { label: "Learning", score: 65 },
      ];

  // Parse the journey steps table
  const steps: PersonaJourneyStep[] = [];
  const tableRegex = /\|\s*\*\*(\d+)\.\s*(.+?)\*\*\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|/g;
  let match;

  while ((match = tableRegex.exec(content)) !== null) {
    const stepNumber = parseInt(match[1]);
    const name = match[2];
    const activity = match[3];
    const tasks = match[4].split(",").map((t) => t.trim());
    const painPoints = match[5].split(",").map((p) => p.trim());
    const screen = match[6];

    steps.push({ stepNumber, name, activity, tasks, painPoints, screen, stories: [] });
  }

  // Parse stories table
  const storyRegex = /\|\s*(STORY-\d+):\s*(.+?)\s*\|\s*(.+?)\s*\|\s*(\d+)\s*\|\s*(.+?)\s*\|/g;
  while ((match = storyRegex.exec(content)) !== null) {
    const storyId = match[1];
    const title = match[2];
    const stepName = match[3];
    const points = parseInt(match[4]);
    const status = match[5];

    // Find the matching step and attach story
    const step = steps.find((s) => stepName.includes(s.name));
    if (step) {
      step.stories.push({ id: storyId, title, points, status });
    }
  }

  return {
    personaId,
    personaName,
    role,
    personaBlurb,
    quote,
    avatarUrl,
    avatarId,
    demographics,
    goals,
    habits,
    frustrations,
    metrics,
    steps,
    rawMarkdown: md,
  };
}

const personaJourneyDocId = (slug: string, personaId: string) => `${slug}::${personaId}`;

/** Legacy disk reader — used as a one-time bootstrap when PostBase is empty. */
function readPersonaJourneysFromFiles(slug: string): PersonaJourney[] {
  const journeyDir = pmosPath("projects", slug, "journey");
  if (!fs.existsSync(journeyDir)) return [];

  const files = fs.readdirSync(journeyDir).filter((f) => f.startsWith("persona-") && f.endsWith(".md"));
  return files.map((file) => {
    const md = readFileSafe(path.join(journeyDir, file));
    return md ? parsePersonaJourney(md) : null;
  }).filter(Boolean) as PersonaJourney[];
}

export async function getPersonaJourneys(slug: string): Promise<PersonaJourney[]> {
  try {
    const snap = await db.collection("persona_journeys").get();
    const docs = snap.docs
      .filter((d) => d.id.startsWith(`${slug}::`))
      .map((d) => {
        const data = d.data() as { markdown?: string };
        return data?.markdown ? parsePersonaJourney(data.markdown) : null;
      })
      .filter(Boolean) as PersonaJourney[];

    if (docs.length > 0) {
      return docs.sort((a, b) => a.personaId.localeCompare(b.personaId));
    }
  } catch {
    // PostBase offline/failed, fallback to files
  }

  const fromFiles = readPersonaJourneysFromFiles(slug);
  if (fromFiles.length > 0) {
    for (const j of fromFiles) {
      try {
        await writeDoc("persona_journeys", personaJourneyDocId(slug, j.personaId), {
          markdown: j.rawMarkdown,
        });
      } catch {
        // ignore
      }
    }
  }
  return fromFiles;
}

/** Reverse of parsePersonaJourney — builds the markdown source from a journey. */
export function serializePersonaJourney(j: PersonaJourney): string {
  const frontmatterData: Record<string, any> = {
    personaId: j.personaId,
    personaName: j.personaName,
    role: j.role,
    avatarUrl: j.avatarUrl,
    avatarId: j.avatarId,
    demographics: j.demographics,
    goals: j.goals,
    habits: j.habits,
    frustrations: j.frustrations,
    metrics: j.metrics,
  };

  const lines: string[] = [];
  lines.push(`# Customer Journey — ${j.personaName} (${j.role})`);
  lines.push("");
  if (j.personaBlurb) lines.push(`**Persona**: ${j.personaBlurb}`);
  if (j.quote) lines.push(`**Quote**: "${j.quote}"`);
  lines.push("");
  lines.push("| Step | Activity | Tasks | Pain Points | Screenshot |");
  lines.push("|------|----------|-------|-------------|------------|");
  for (const s of j.steps) {
    lines.push(
      `| **${s.stepNumber}. ${s.name}** | ${s.activity} | ${s.tasks.join(
        ", "
      )} | ${s.painPoints.join(", ")} | ${s.screen} |`
    );
  }
  const stepsWithStories = j.steps.filter((s) => s.stories.length > 0);
  if (stepsWithStories.length > 0) {
    lines.push("");
    lines.push("| Story | Step | Points | Status |");
    lines.push("|-------|------|--------|--------|");
    for (const s of stepsWithStories) {
      for (const st of s.stories) {
        lines.push(
          `| ${st.id}: ${st.title} | ${s.name} | ${st.points} | ${st.status} |`
        );
      }
    }
  }

  const content = lines.join("\n") + "\n";
  return matter.stringify(content, frontmatterData);
}

/**
 * Persist a journey: writes the markdown to PostBase (primary store) and
 * mirrors it to the journey markdown file so the git-tracked source stays
 * in sync. Returns the freshly parsed journey.
 */
export async function savePersonaJourney(
  slug: string,
  journey: PersonaJourney
): Promise<PersonaJourney> {
  const md = serializePersonaJourney(journey);
  await writeDoc("persona_journeys", personaJourneyDocId(slug, journey.personaId), {
    markdown: md,
  });
  writeFile(
    pmosPath("projects", slug, "journey", `persona-${journey.personaId}.md`),
    md
  );
  return parsePersonaJourney(md);
}

export async function createPersona(
  slug: string,
  input: {
    name: string;
    role: string;
    quote?: string;
    avatarUrl?: string;
    avatarId?: string;
    demographics?: PersonaDemographics;
    goals?: string[];
    habits?: string[];
    frustrations?: string[];
    metrics?: PersonaUsageMetric[];
    initialSteps?: PersonaJourneyStep[];
  }
): Promise<PersonaJourney> {
  const personaId =
    input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") ||
    `persona-${Date.now()}`;

  const defaultSteps: PersonaJourneyStep[] = input.initialSteps || [
    {
      stepNumber: 1,
      name: "Discovery",
      activity: `Discover problem solution for ${input.role}`,
      tasks: ["Search for solutions", "Review product overview"],
      painPoints: ["Unclear feature set", "Evaluation time"],
      screen: "Landing Page",
      stories: [],
    },
    {
      stepNumber: 2,
      name: "Onboarding",
      activity: "Set up and configure workspace",
      tasks: ["Create account", "Configure preferences"],
      painPoints: ["Complex setup friction"],
      screen: "Setup Form",
      stories: [],
    },
    {
      stepNumber: 3,
      name: "Core Workflow",
      activity: `Perform core ${input.role} task`,
      tasks: ["Input parameters", "Generate output", "Review results"],
      painPoints: ["Manual verification delays"],
      screen: "Main Workspace",
      stories: [],
    },
    {
      stepNumber: 4,
      name: "Completion & Delivery",
      activity: "Finalize, export, and deliver value",
      tasks: ["Export deliverables", "Share with stakeholders"],
      painPoints: ["Format incompatibilities"],
      screen: "Export Panel",
      stories: [],
    },
  ];

  const newJourney: PersonaJourney = {
    personaId,
    personaName: input.name,
    role: input.role,
    personaBlurb: `${input.role}, ${input.demographics?.age || 30}`,
    quote: input.quote || `I want to achieve great outcomes as a ${input.role}.`,
    avatarUrl: input.avatarUrl || resolvePersonaAvatar(input.name, personaId, input.avatarId),
    avatarId: input.avatarId,
    demographics: input.demographics || {
      age: 30,
      location: "Austin, TX",
      job: input.role,
    },
    goals: input.goals || [`Succeed as a ${input.role}`],
    habits: input.habits || ["Values fast and seamless workflows"],
    frustrations: input.frustrations || ["Manual friction and delays"],
    metrics: input.metrics || [
      { label: "Product Usage", score: 85 },
      { label: "Messaging", score: 70 },
      { label: "Learning", score: 60 },
    ],
    steps: defaultSteps,
    rawMarkdown: "",
  };

  return await savePersonaJourney(slug, newJourney);
}

export async function deletePersona(slug: string, personaId: string): Promise<void> {
  try {
    await db.collection("persona_journeys").doc(personaJourneyDocId(slug, personaId)).delete();
  } catch {
    // ignore
  }
  const filePath = pmosPath("projects", slug, "journey", `persona-${personaId}.md`);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

async function mutatePersonaJourney(
  slug: string,
  personaId: string,
  mutate: (j: PersonaJourney) => PersonaJourney
): Promise<PersonaJourney[]> {
  const journeys = await getPersonaJourneys(slug);
  const idx = journeys.findIndex((j) => j.personaId === personaId);
  if (idx === -1) {
    throw new Error(`Persona "${personaId}" not found`);
  }
  const updated = await savePersonaJourney(slug, mutate(journeys[idx]));
  journeys[idx] = updated;
  return journeys;
}

export async function addPersonaJourneyStep(
  slug: string,
  personaId: string,
  step: Omit<PersonaJourneyStep, "stepNumber" | "stories">
): Promise<PersonaJourney[]> {
  return mutatePersonaJourney(slug, personaId, (j) => {
    const stepNumber =
      j.steps.length > 0
        ? Math.max(...j.steps.map((s) => s.stepNumber)) + 1
        : 1;
    j.steps.push({ ...step, stepNumber, stories: [] });
    return j;
  });
}

export async function updatePersonaJourneyStep(
  slug: string,
  personaId: string,
  stepNumber: number,
  updates: Partial<Omit<PersonaJourneyStep, "stepNumber" | "stories">>
): Promise<PersonaJourney[]> {
  return mutatePersonaJourney(slug, personaId, (j) => {
    const step = j.steps.find((s) => s.stepNumber === stepNumber);
    if (!step) {
      throw new Error(`Step ${stepNumber} not found in persona "${personaId}"`);
    }
    Object.assign(step, updates);
    return j;
  });
}

export async function deletePersonaJourneyStep(
  slug: string,
  personaId: string,
  stepNumber: number
): Promise<PersonaJourney[]> {
  return mutatePersonaJourney(slug, personaId, (j) => {
    j.steps = j.steps
      .filter((s) => s.stepNumber !== stepNumber)
      .map((s, i) => ({ ...s, stepNumber: i + 1 }));
    return j;
  });
}

// ============================================================
// Story Map (Jeff Patton style)
// ============================================================

export interface StoryMapActivity {
  name: string;
  tasks: StoryMapTask[];
}

export interface StoryMapTask {
  name: string;
  stories: Story[];
}

export interface StoryMap {
  backbone: PersonaJourneyStep[]; // Top row: journey steps
  activities: StoryMapActivity[][]; // Per-persona rows of activities
}

export async function getStoryMap(slug: string): Promise<StoryMap> {
  const [journeys, stories] = await Promise.all([
    getPersonaJourneys(slug),
    getAllStories(slug),
  ]);

  // Use the first persona's journey as the backbone (all personas share same step names)
  const backbone = journeys[0]?.steps || [];

  // Build activities from stories grouped by step
  const activities: StoryMapActivity[][] = journeys.map((j) => {
    return j.steps.map((step) => {
      const stepStories = stories.filter((s) =>
        step.stories.some((js) => js.id === s.id)
      );
      return {
        name: step.name,
        tasks: step.stories.map((js) => ({
          name: js.title,
          stories: stepStories.filter((s) => s.id === js.id),
        })),
      };
    });
  });

  return { backbone, activities };
}

// ============================================================
// Screen Mockups (maps step names to screen types)
// ============================================================

export interface ScreenMockup {
  stepName: string;
  screenType: string;
  components: ScreenComponent[];
}

export interface ScreenComponent {
  id: string;
  label: string;
  type: "input" | "button" | "table" | "gallery" | "video" | "form" | "nav" | "card" | "settings";
  description: string;
}

const SCREEN_MAP: Record<string, ScreenMockup> = {
  "Discovery": {
    stepName: "Discovery",
    screenType: "landing-page",
    components: [
      { id: "hero", label: "Hero Section", type: "card", description: "Value proposition and CTA" },
      { id: "gallery", label: "Example Videos", type: "gallery", description: "Sample video grid showing quality" },
      { id: "cta", label: "Get Started Button", type: "button", description: "Primary conversion CTA" },
      { id: "nav", label: "Navigation Bar", type: "nav", description: "Logo, features, pricing, login" },
    ],
  },
  "Sign Up": {
    stepName: "Sign Up",
    screenType: "sign-up",
    components: [
      { id: "form", label: "Registration Form", type: "form", description: "Email, password, name fields" },
      { id: "social", label: "Social Login", type: "button", description: "Google/GitHub SSO buttons" },
      { id: "submit", label: "Create Account", type: "button", description: "Submit registration" },
    ],
  },
  "Choose Template": {
    stepName: "Choose Template",
    screenType: "template-gallery",
    components: [
      { id: "gallery", label: "Template Grid", type: "gallery", description: "Browse available templates" },
      { id: "filter", label: "Category Filter", type: "nav", description: "Filter by video type" },
      { id: "select", label: "Select Template", type: "button", description: "Choose this template" },
    ],
  },
  "Create Project": {
    stepName: "Create Project",
    screenType: "project-setup",
    components: [
      { id: "name", label: "Project Name", type: "input", description: "Name the project" },
      { id: "colors", label: "Brand Colors", type: "settings", description: "Pick primary/secondary colors" },
      { id: "logo", label: "Logo Upload", type: "input", description: "Upload company logo" },
    ],
  },
  "Enter Subject": {
    stepName: "Enter Subject",
    screenType: "subject-input",
    components: [
      { id: "subject", label: "Subject Input", type: "input", description: "Describe what the video should be about" },
      { id: "length", label: "Duration Picker", type: "settings", description: "Set video length (30s / 60s / 90s / 120s)" },
      { id: "generate", label: "Generate Script", type: "button", description: "AI generates scene table" },
    ],
  },
  "Generate Script": {
    stepName: "Generate Script",
    screenType: "scene-table",
    components: [
      { id: "table", label: "Scene Table", type: "table", description: "Editable table of 20 scenes with voiceover, prompts, types" },
      { id: "edit", label: "Edit Scene", type: "button", description: "Modify individual scene" },
      { id: "approve", label: "Approve Script", type: "button", description: "Lock script and proceed" },
    ],
  },
  "Review Script for Accuracy": {
    stepName: "Review Script for Accuracy",
    screenType: "script-review",
    components: [
      { id: "annotations", label: "Fact Annotations", type: "card", description: "AI-flagged claims needing verification" },
      { id: "editor", label: "Inline Editor", type: "input", description: "Edit voiceover text directly" },
      { id: "approve", label: "Mark as Accurate", type: "button", description: "Confirm this scene is correct" },
    ],
  },
  "Add Branding": {
    stepName: "Add Branding",
    screenType: "brand-kit",
    components: [
      { id: "logo", label: "Logo Position", type: "settings", description: "Place logo on video" },
      { id: "colors", label: "Color Palette", type: "settings", description: "Apply brand colors to overlays" },
      { id: "tagline", label: "Tagline Input", type: "input", description: "Add closing tagline" },
    ],
  },
  "Add Accessibility": {
    stepName: "Add Accessibility",
    screenType: "accessibility-settings",
    components: [
      { id: "captions", label: "Enable Captions", type: "settings", description: "Auto-generate captions from voiceover" },
      { id: "voice", label: "Voice Selection", type: "settings", description: "Choose clear, articulate voice" },
      { id: "contrast", label: "Contrast Check", type: "settings", description: "Ensure text readability" },
    ],
  },
  "Preview Video": {
    stepName: "Preview Video",
    screenType: "video-preview",
    components: [
      { id: "player", label: "Video Player", type: "video", description: "Play/pause rendered video preview" },
      { id: "timeline", label: "Scene Timeline", type: "table", description: "Navigate between scenes" },
      { id: "replay", label: "Replay Scene", type: "button", description: "Re-watch current scene" },
    ],
  },
  "Review & Iterate": {
    stepName: "Review & Iterate",
    screenType: "video-preview",
    components: [
      { id: "player", label: "Video Player", type: "video", description: "Full video preview" },
      { id: "timeline", label: "Scene Timeline", type: "table", description: "Jump to specific scenes" },
      { id: "pacing", label: "Speed Control", type: "settings", description: "Adjust playback speed per scene" },
    ],
  },
  "Preview & Iterate": {
    stepName: "Preview & Iterate",
    screenType: "video-preview",
    components: [
      { id: "player", label: "Video Player", type: "video", description: "Full video preview" },
      { id: "timeline", label: "Scene Timeline", type: "table", description: "Jump to specific scenes" },
      { id: "pacing", label: "Speed Control", type: "settings", description: "Adjust playback speed per scene" },
    ],
  },
  "Edit Scenes": {
    stepName: "Edit Scenes",
    screenType: "scene-editor",
    components: [
      { id: "scene-list", label: "Scene Thumbnails", type: "gallery", description: "Visual overview of all scenes" },
      { id: "detail", label: "Scene Detail Panel", type: "form", description: "Edit voiceover, images, transforms" },
      { id: "swap", label: "Swap Image", type: "button", description: "Replace scene image" },
    ],
  },
  "Team Review": {
    stepName: "Team Review",
    screenType: "share-preview",
    components: [
      { id: "link", label: "Share Link", type: "button", description: "Generate preview link" },
      { id: "comments", label: "Comment Thread", type: "form", description: "Team feedback on scenes" },
      { id: "approve", label: "Approve Video", type: "button", description: "Final approval" },
    ],
  },
  "Export & Share": {
    stepName: "Export & Share",
    screenType: "export-options",
    components: [
      { id: "format", label: "Format Selector", type: "settings", description: "MP4, GIF, WebM" },
      { id: "aspect", label: "Aspect Ratio", type: "settings", description: "16:9, 9:16, 1:1" },
      { id: "download", label: "Download Button", type: "button", description: "Download rendered video" },
      { id: "share", label: "Share Directly", type: "button", description: "Post to social media" },
    ],
  },
  "Export & Distribute": {
    stepName: "Export & Distribute",
    screenType: "export-matrix",
    components: [
      { id: "platforms", label: "Platform Presets", type: "gallery", description: "LinkedIn, YouTube, Website presets" },
      { id: "download", label: "Download All", type: "button", description: "Export all formats" },
      { id: "schedule", label: "Schedule Post", type: "button", description: "Schedule to social media" },
    ],
  },
  "Export for LMS": {
    stepName: "Export for LMS",
    screenType: "export-options",
    components: [
      { id: "lms", label: "LMS Selector", type: "settings", description: "Moodle, Canvas, Blackboard" },
      { id: "format", label: "Format", type: "settings", description: "SCORM, embed code, direct link" },
      { id: "download", label: "Export", type: "button", description: "Export for your LMS" },
    ],
  },
  "Choose Educational Template": {
    stepName: "Choose Educational Template",
    screenType: "template-gallery",
    components: [
      { id: "gallery", label: "Educational Templates", type: "gallery", description: "Explainer, Tutorial, Lecture formats" },
      { id: "filter", label: "Subject Filter", type: "nav", description: "Filter by subject area" },
      { id: "select", label: "Select Template", type: "button", description: "Choose this template" },
    ],
  },
};

export function getScreenMockup(stepName: string): ScreenMockup {
  return SCREEN_MAP[stepName] || {
    stepName,
    screenType: "unknown",
    components: [{ id: "placeholder", label: "Screen", type: "card", description: "Screen mockup not yet defined" }],
  };
}

// ============================================================
// Markdown → HTML
// ============================================================

export async function markdownToHtml(md: string): Promise<string> {
  const { marked } = await import("marked");
  return marked.parse(md) as string;
}

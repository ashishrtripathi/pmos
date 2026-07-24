import fs from "fs";
import path from "path";
import matter from "gray-matter";
import type {
  Registry,
  SourceLocation,
  Story,
  StoryStatus,
  Agent,
  Intelligence,
  DashboardData,
  PipelineStep,
} from "@/types/pmos";

const PMOS_HOME = path.join(
  process.env.HOME || process.env.USERPROFILE || "",
  ".pmos"
);

function pmosPath(...segments: string[]) {
  return path.join(PMOS_HOME, ...segments);
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

// ── Registry ──────────────────────────────────────

export function getRegistry(): Registry | null {
  return readJson<Registry>(pmosPath("registry.json"));
}

export function updateRegistry(registry: Registry) {
  writeJson(pmosPath("registry.json"), registry);
}

// ── Projects ──────────────────────────────────────

export function listProjects() {
  const registry = getRegistry();
  return registry?.projects || [];
}

export function getProject(slug: string) {
  const projectDir = pmosPath("projects", slug);
  const projectMd = readFileSafe(path.join(projectDir, "project.md"));
  return { slug, projectDir, projectMd };
}

// ── Source Location ────────────────────────────────

export function getSourceLocation(slug: string): SourceLocation | null {
  return readJson<SourceLocation>(
    pmosPath("projects", slug, "source-location.json")
  );
}

export function updateSourceLocation(slug: string, data: SourceLocation) {
  writeJson(pmosPath("projects", slug, "source-location.json"), data);
}

// ── Stories ────────────────────────────────────────

const STORY_DIRS: Record<StoryStatus, string> = {
  backlog: "stories/backlog",
  "in-progress": "stories/in-progress",
  review: "stories/review",
  done: "stories/done",
};

function parseStoryFile(filePath: string, status: StoryStatus): Story | null {
  const raw = readFileSafe(filePath);
  if (!raw) return null;
  const { data, content } = matter(raw);

  const id = data.id || path.basename(filePath, ".md").split("-").slice(0, 2).join("-");
  const title = data.title || data.story || path.basename(filePath, ".md");
  const points = data.points || data.estimate || 0;
  const acceptanceCriteriaMatch = content.match(
    /## Acceptance Criteria\s*\n([\s\S]*?)(?=\n## |\n$)/
  );
  const acceptanceCriteria = acceptanceCriteriaMatch
    ? acceptanceCriteriaMatch[1]
        .split("\n")
        .filter((l: string) => l.startsWith("- ") || l.startsWith("* "))
        .map((l: string) => l.replace(/^[-*]\s*/, "").trim())
    : [];

  return {
    id,
    title,
    description: data.description || "",
    points,
    status,
    acceptanceCriteria,
    persona: data.persona,
    journeyStep: data["journey-step"],
    filePath,
  };
}

export function getAllStories(slug: string): Story[] {
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

export function getStoriesByStatus(slug: string): Record<StoryStatus, Story[]> {
  const stories = getAllStories(slug);
  const grouped: Record<StoryStatus, Story[]> = {
    backlog: [],
    "in-progress": [],
    review: [],
    done: [],
  };
  for (const s of stories) {
    grouped[s.status].push(s);
  }
  return grouped;
}

export function createStory(
  slug: string,
  story: { title: string; description: string; points: number; acceptanceCriteria: string[] }
) {
  const existing = getAllStories(slug);
  const maxNum = existing.reduce((max, s) => {
    const num = parseInt(s.id.replace("STORY-", ""));
    return isNaN(num) ? max : Math.max(max, num);
  }, 0);
  const nextId = `STORY-${String(maxNum + 1).padStart(3, "0")}`;
  const fileName = `${nextId}-${story.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "")}.md`;

  const content = `---
id: ${nextId}
title: "${story.title}"
points: ${story.points}
status: backlog
---

# ${story.title}

${story.description}

## Acceptance Criteria

${story.acceptanceCriteria.map((c) => `- ${c}`).join("\n")}
`;

  const filePath = pmosPath("projects", slug, "stories", "backlog", fileName);
  writeFile(filePath, content);
  return { id: nextId, filePath };
}

export function moveStory(slug: string, storyId: string, from: StoryStatus, to: StoryStatus) {
  const fromDir = pmosPath("projects", slug, STORY_DIRS[from]);
  const toDir = pmosPath("projects", slug, STORY_DIRS[to]);
  if (!fs.existsSync(toDir)) fs.mkdirSync(toDir, { recursive: true });

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

export function updateStoryStatus(slug: string, storyId: string, to: StoryStatus) {
  // Find the story in any column and move it
  for (const from of Object.keys(STORY_DIRS) as StoryStatus[]) {
    const fromDir = pmosPath("projects", slug, STORY_DIRS[from]);
    if (!fs.existsSync(fromDir)) continue;
    const files = fs.readdirSync(fromDir).filter((f) => f.includes(storyId));
    if (files.length > 0) {
      return moveStory(slug, storyId, from, to);
    }
  }
  return null;
}

// ── Agents ─────────────────────────────────────────

export function getAllAgents(slug: string): Agent[] {
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

// ── Intelligence ───────────────────────────────────

export function getIntelligence(slug: string): Intelligence {
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

// ── Dashboard ──────────────────────────────────────

export function getDashboard(slug: string): DashboardData {
  const stories = getAllStories(slug);
  const agents = getAllAgents(slug);
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

// ── Pipeline ───────────────────────────────────────

export function getPipelineSteps(slug: string): PipelineStep[] {
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

  const source = getSourceLocation(slug);
  if (source) steps[0].status = "done";

  const intel = getIntelligence(slug);
  if (intel.architecture || intel.techStack) steps[1].status = "done";
  if (source?.runtime?.status === "ready" || source?.runtime?.status === "running") steps[2].status = "done";

  const journey = readFileSafe(pmosPath("projects", slug, "journey", "journey.md"));
  if (journey) steps[3].status = "done";

  const storyMap = readFileSafe(pmosPath("projects", slug, "stories", "story-map.md"));
  if (storyMap) steps[4].status = "done";

  const stories = getAllStories(slug);
  if (stories.length > 0) steps[5].status = "done";

  if (agentsExist(slug)) steps[6].status = "done";

  const dash = readFileSafe(pmosPath("projects", slug, "dashboard.md"));
  if (dash) steps[7].status = "done";

  return steps;
}

function agentsExist(slug: string): boolean {
  const agentsDir = pmosPath("projects", slug, "agents");
  return fs.existsSync(agentsDir) && fs.readdirSync(agentsDir).length > 0;
}

// ── Journey / Personas ─────────────────────────────

export function getJourneyMarkdown(slug: string): string | null {
  return readFileSafe(pmosPath("projects", slug, "journey", "journey.md"));
}

export function getPersonasMarkdown(slug: string): string | null {
  return readFileSafe(pmosPath("projects", slug, "journey", "personas.md"));
}

export function updateJourneyMarkdown(slug: string, content: string) {
  writeFile(pmosPath("projects", slug, "journey", "journey.md"), content);
}

export function updatePersonasMarkdown(slug: string, content: string) {
  writeFile(pmosPath("projects", slug, "journey", "personas.md"), content);
}

// ── Per-Persona Journeys ───────────────────────────

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

export interface PersonaJourney {
  personaId: string;
  personaName: string;
  role: string;
  quote: string;
  steps: PersonaJourneyStep[];
  rawMarkdown: string;
}

function parsePersonaJourney(md: string): PersonaJourney {
  const lines = md.split("\n");

  // Extract header info
  const nameMatch = md.match(/#\s*Customer Journey\s*[—–-]\s*(.+?)\s*\((.+?)\)/);
  const personaName = nameMatch?.[1] || "Unknown";
  const role = nameMatch?.[2] || "Unknown";
  const quoteMatch = md.match(/\*\*Quote\*\*:\s*"(.+?)"/);
  const quote = quoteMatch?.[1] || "";
  const personaId = personaName.toLowerCase().replace(/\s+/g, "-");

  // Parse the journey steps table
  const steps: PersonaJourneyStep[] = [];
  const tableRegex = /\|\s*\*\*(\d+)\.\s*(.+?)\*\*\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|/g;
  let match;

  while ((match = tableRegex.exec(md)) !== null) {
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
  while ((match = storyRegex.exec(md)) !== null) {
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

  return { personaId, personaName, role, quote, steps, rawMarkdown: md };
}

export function getPersonaJourneys(slug: string): PersonaJourney[] {
  const journeyDir = pmosPath("projects", slug, "journey");
  if (!fs.existsSync(journeyDir)) return [];

  const files = fs.readdirSync(journeyDir).filter((f) => f.startsWith("persona-") && f.endsWith(".md"));
  return files.map((file) => {
    const md = readFileSafe(path.join(journeyDir, file));
    return md ? parsePersonaJourney(md) : null;
  }).filter(Boolean) as PersonaJourney[];
}

// ── Story Map (Jeff Patton style) ──────────────────

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

export function getStoryMap(slug: string): StoryMap {
  const journeys = getPersonaJourneys(slug);
  const stories = getAllStories(slug);

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

// ── Screen Mockups (maps step names to screen types) ─

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
      { id: "length", label: "Duration Picker", type: "settings", description: "Set video length (30s / 60s / 120s)" },
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

// ── Markdown → HTML ────────────────────────────────

export async function markdownToHtml(md: string): Promise<string> {
  const { marked } = await import("marked");
  return marked.parse(md) as string;
}

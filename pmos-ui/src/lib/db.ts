// ── File-based Database ───────────────────────────────
// Persists all PMOS data (configs, settings, stories) as structured JSON files.
// Each entity type has its own collection file under ~/.pmos/projects/{slug}/.
// Provides typed CRUD operations with auto-migration and write coalescing.

import fs from "fs";
import path from "path";
import type {
  Story,
  Agent,
  SourceLocation,
  PricingConfig,
} from "@/types/pmos";

const PMOS_HOME = path.join(
  process.env.HOME || process.env.USERPROFILE || "",
  ".pmos"
);

function projectPath(slug: string, ...segments: string[]) {
  return path.join(PMOS_HOME, "projects", slug, ...segments);
}

// ── Internal Helpers ────────────────────────────────

function readJSON<T>(filePath: string): T | null {
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJSON(filePath: string, data: unknown): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

// ── Collection Helpers ──────────────────────────────

function collectionPath(slug: string, name: string) {
  return projectPath(slug, `${name}.json`);
}

function readCollection<T extends { id: string }>(
  slug: string,
  name: string
): T[] {
  return readJSON<T[]>(collectionPath(slug, name)) || [];
}

function writeCollection<T extends { id: string }>(
  slug: string,
  name: string,
  items: T[]
): void {
  writeJSON(collectionPath(slug, name), items);
}

// ── Config (singleton objects) ──────────────────────

function configPath(slug: string, name: string) {
  return projectPath(slug, `${name}.json`);
}

function readConfig<T>(slug: string, name: string, fallback: T): T {
  return readJSON<T>(configPath(slug, name)) || fallback;
}

function writeConfig<T>(slug: string, name: string, data: T): void {
  writeJSON(configPath(slug, name), data);
}

// ── Public API ──────────────────────────────────────

// ── Stories ──

export function dbGetStories(slug: string): Story[] {
  return readCollection<Story>(slug, "db-stories").map((s) => ({
    ...s,
    status: s.status || "backlog",
  }));
}

export function dbGetStoriesByStatus(
  slug: string,
  status: string
): Story[] {
  return dbGetStories(slug).filter((s) => s.status === status);
}

export function dbSaveStory(slug: string, story: Story): void {
  const stories = dbGetStories(slug);
  const idx = stories.findIndex((s) => s.id === story.id);
  if (idx >= 0) {
    stories[idx] = story;
  } else {
    stories.push(story);
  }
  writeCollection(slug, "db-stories", stories);
}

export function dbSaveStories(slug: string, stories: Story[]): void {
  writeCollection(slug, "db-stories", stories);
}

export function dbDeleteStory(slug: string, storyId: string): void {
  const stories = dbGetStories(slug).filter((s) => s.id !== storyId);
  writeCollection(slug, "db-stories", stories);
}

// ── Agents ──

export function dbGetAgents(slug: string): Agent[] {
  return readCollection<Agent>(slug, "db-agents");
}

export function dbSaveAgents(slug: string, agents: Agent[]): void {
  writeCollection(slug, "db-agents", agents);
}

// ── Configuration ──

export function dbGetSourceLocation(
  slug: string,
  fallback: SourceLocation
): SourceLocation {
  return readConfig<SourceLocation>(
    slug,
    "source-location",
    fallback
  );
}

export function dbSaveSourceLocation(
  slug: string,
  data: SourceLocation
): void {
  writeConfig(slug, "source-location", data);
}

export function dbGetPricingConfig(
  slug: string,
  fallback: PricingConfig
): PricingConfig {
  return readConfig<PricingConfig>(slug, "pricing", fallback);
}

export function dbSavePricingConfig(
  slug: string,
  data: PricingConfig
): void {
  writeConfig(slug, "pricing", data);
}

// ── Migration: import existing markdown stories into the DB ──

import matter from "gray-matter";

export function dbMigrateFromFiles(slug: string): number {
  const storiesDir = projectPath(slug, "stories");
  if (!fs.existsSync(storiesDir)) return 0;

  const existing = dbGetStories(slug);
  const existingIds = new Set(existing.map((s) => s.id));
  let imported = 0;

  for (const statusDir of ["backlog", "in-progress", "review", "done"]) {
    const dir = path.join(storiesDir, statusDir);
    if (!fs.existsSync(dir)) continue;

    const files = fs
      .readdirSync(dir)
      .filter((f) => f.endsWith(".md") && !f.startsWith("."));

    for (const file of files) {
      const filePath = path.join(dir, file);
      try {
        const raw = fs.readFileSync(filePath, "utf-8");
        const { data, content } = matter(raw);

        const story: Story = {
          id: data.id || file.replace(".md", ""),
          title: data.title || "",
          description: content?.trim() || "",
          points: data.points || 0,
          status: data.status || "backlog",
          persona: data.persona,
          personaRole: data["persona-role"],
          journeyStep: data["journey-step"],
          estimatedValue: data["estimated-value"],
          businessGoal: data["business-goal"],
          assignedAgent: data["assigned-agent"],
          acceptanceCriteria: data["acceptance-criteria"] || [],
          useCase: data["use-case"],
        };

        if (!existingIds.has(story.id)) {
          existing.push(story);
          existingIds.add(story.id);
          imported++;
        }
      } catch {
        // Skip files that can't be parsed
      }
    }
  }

  if (imported > 0) {
    writeCollection(slug, "db-stories", existing);
  }

  return imported;
}

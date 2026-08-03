// PMOS Bugs
// Stored as JSON per project: ~/.pmos/projects/{slug}/bugs.json

import fs from "fs";
import path from "path";
import type { Bug, BugStatus, BugSeverity } from "@/types/pmos";

const PMOS_HOME = path.join(
  process.env.HOME || process.env.USERPROFILE || "",
  ".pmos"
);

function bugsPath(slug: string) {
  return path.join(PMOS_HOME, "projects", slug, "bugs.json");
}

function ensureDir(filePath: string) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function readJSON<T>(filePath: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8")) as T;
  } catch {
    return null;
  }
}

function writeJSON(filePath: string, data: unknown): void {
  ensureDir(filePath);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

export const BUG_STATUSES: BugStatus[] = [
  "open",
  "in-progress",
  "review",
  "fixed",
  "closed",
];

export const BUG_SEVERITIES: BugSeverity[] = [
  "critical",
  "major",
  "minor",
  "cosmetic",
];

export function getBugs(slug: string): Bug[] {
  return readJSON<Bug[]>(bugsPath(slug)) || [];
}

export function saveBugs(slug: string, bugs: Bug[]): void {
  writeJSON(bugsPath(slug), bugs);
}

export function getBug(slug: string, id: string): Bug | null {
  return getBugs(slug).find((b) => b.id === id) || null;
}

export function createBug(
  slug: string,
  data: {
    title: string;
    description: string;
    severity?: BugSeverity;
    status?: BugStatus;
    stepsToReproduce?: string;
    expectedBehavior?: string;
    actualBehavior?: string;
    reportedBy?: string;
    storyId?: string;
  }
): Bug {
  const bugs = getBugs(slug);
  const maxNum = bugs.reduce((max, b) => {
    const num = parseInt(b.id.replace("BUG-", ""));
    return isNaN(num) ? max : Math.max(max, num);
  }, 0);
  const bug: Bug = {
    id: `BUG-${String(maxNum + 1).padStart(3, "0")}`,
    title: data.title,
    description: data.description,
    severity: data.severity || "minor",
    status: data.status || "open",
    stepsToReproduce: data.stepsToReproduce,
    expectedBehavior: data.expectedBehavior,
    actualBehavior: data.actualBehavior,
    reportedBy: data.reportedBy || "PM",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    storyId: data.storyId,
  };
  bugs.push(bug);
  saveBugs(slug, bugs);
  return bug;
}

export function updateBug(
  slug: string,
  id: string,
  updates: Partial<Bug>
): Bug | null {
  const bugs = getBugs(slug);
  const idx = bugs.findIndex((b) => b.id === id);
  if (idx < 0) return null;
  bugs[idx] = { ...bugs[idx], ...updates, updatedAt: new Date().toISOString() };
  saveBugs(slug, bugs);
  return bugs[idx];
}

export function deleteBug(slug: string, id: string): boolean {
  const bugs = getBugs(slug);
  const filtered = bugs.filter((b) => b.id !== id);
  if (filtered.length === bugs.length) return false;
  saveBugs(slug, filtered);
  return true;
}

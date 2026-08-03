// PMOS Change Requests
// Stored as JSON per project: ~/.pmos/projects/{slug}/change-requests.json

import fs from "fs";
import path from "path";
import type {
  ChangeRequest,
  ChangeRequestPriority,
  ChangeRequestCategory,
  ChangeRequestStatus,
} from "@/types/pmos";

const PMOS_HOME = path.join(
  process.env.HOME || process.env.USERPROFILE || "",
  ".pmos"
);

function crPath(slug: string) {
  return path.join(PMOS_HOME, "projects", slug, "change-requests.json");
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

export const CR_STATUSES: ChangeRequestStatus[] = [
  "submitted",
  "in-review",
  "approved",
  "rejected",
  "implemented",
];

export const CR_PRIORITIES: ChangeRequestPriority[] = ["high", "medium", "low"];

export const CR_CATEGORIES: ChangeRequestCategory[] = [
  "new-feature",
  "enhancement",
  "bugfix",
  "refactor",
  "design",
];

export function getChangeRequests(slug: string): ChangeRequest[] {
  return readJSON<ChangeRequest[]>(crPath(slug)) || [];
}

export function saveChangeRequests(
  slug: string,
  crs: ChangeRequest[]
): void {
  writeJSON(crPath(slug), crs);
}

export function getChangeRequest(slug: string, id: string): ChangeRequest | null {
  return getChangeRequests(slug).find((c) => c.id === id) || null;
}

export function createChangeRequest(
  slug: string,
  data: {
    title: string;
    description: string;
    priority?: ChangeRequestPriority;
    category?: ChangeRequestCategory;
    status?: ChangeRequestStatus;
    requestedBy?: string;
    linkedObjectiveId?: string;
  }
): ChangeRequest {
  const crs = getChangeRequests(slug);
  const maxNum = crs.reduce((max, c) => {
    const num = parseInt(c.id.replace("CR-", ""));
    return isNaN(num) ? max : Math.max(max, num);
  }, 0);
  const cr: ChangeRequest = {
    id: `CR-${String(maxNum + 1).padStart(3, "0")}`,
    title: data.title,
    description: data.description,
    priority: data.priority || "medium",
    category: data.category || "enhancement",
    status: data.status || "submitted",
    requestedBy: data.requestedBy || "PM",
    linkedObjectiveId: data.linkedObjectiveId,
    storyIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  crs.push(cr);
  saveChangeRequests(slug, crs);
  return cr;
}

export function updateChangeRequest(
  slug: string,
  id: string,
  updates: Partial<ChangeRequest>
): ChangeRequest | null {
  const crs = getChangeRequests(slug);
  const idx = crs.findIndex((c) => c.id === id);
  if (idx < 0) return null;
  crs[idx] = { ...crs[idx], ...updates, updatedAt: new Date().toISOString() };
  saveChangeRequests(slug, crs);
  return crs[idx];
}

export function deleteChangeRequest(slug: string, id: string): boolean {
  const crs = getChangeRequests(slug);
  const filtered = crs.filter((c) => c.id !== id);
  if (filtered.length === crs.length) return false;
  saveChangeRequests(slug, filtered);
  return true;
}

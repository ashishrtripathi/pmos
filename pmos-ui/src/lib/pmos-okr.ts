// ── PMOS OKR (Objectives & Key Results) ──────────────
// Stored as JSON files per project: ~/.pmos/projects/{slug}/okrs.json

import fs from "fs";
import path from "path";
import type { Objective, KeyResult } from "@/types/pmos";

const PMOS_HOME = path.join(
  process.env.HOME || process.env.USERPROFILE || "",
  ".pmos"
);

function okrPath(slug: string) {
  return path.join(PMOS_HOME, "projects", slug, "okrs.json");
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

// ── CRUD ────────────────────────────────────────────

export function getOKRs(slug: string): Objective[] {
  return readJSON<Objective[]>(okrPath(slug)) || [];
}

export function saveOKRs(slug: string, okrs: Objective[]): void {
  writeJSON(okrPath(slug), okrs);
}

export function getObjective(slug: string, id: string): Objective | null {
  return getOKRs(slug).find((o) => o.id === id) || null;
}

export function createObjective(slug: string, obj: Objective): void {
  const okrs = getOKRs(slug);
  okrs.push(obj);
  saveOKRs(slug, okrs);
}

export function updateObjective(slug: string, id: string, updates: Partial<Objective>): Objective | null {
  const okrs = getOKRs(slug);
  const idx = okrs.findIndex((o) => o.id === id);
  if (idx < 0) return null;
  okrs[idx] = { ...okrs[idx], ...updates, updatedAt: new Date().toISOString() };
  saveOKRs(slug, okrs);
  return okrs[idx];
}

export function deleteObjective(slug: string, id: string): boolean {
  const okrs = getOKRs(slug).filter((o) => o.id !== id);
  if (okrs.length === getOKRs(slug).length) return false;
  saveOKRs(slug, okrs);
  return true;
}

// ── Key Results ─────────────────────────────────────

export function addKeyResult(slug: string, objectiveId: string, kr: KeyResult): Objective | null {
  const okrs = getOKRs(slug);
  const obj = okrs.find((o) => o.id === objectiveId);
  if (!obj) return null;
  obj.keyResults.push(kr);
  obj.updatedAt = new Date().toISOString();
  saveOKRs(slug, okrs);
  return obj;
}

export function updateKeyResult(slug: string, objectiveId: string, krId: string, updates: Partial<KeyResult>): Objective | null {
  const okrs = getOKRs(slug);
  const obj = okrs.find((o) => o.id === objectiveId);
  if (!obj) return null;
  const krIdx = obj.keyResults.findIndex((k) => k.id === krId);
  if (krIdx < 0) return null;
  obj.keyResults[krIdx] = { ...obj.keyResults[krIdx], ...updates };
  obj.updatedAt = new Date().toISOString();
  saveOKRs(slug, okrs);
  return obj;
}

export function deleteKeyResult(slug: string, objectiveId: string, krId: string): Objective | null {
  const okrs = getOKRs(slug);
  const obj = okrs.find((o) => o.id === objectiveId);
  if (!obj) return null;
  obj.keyResults = obj.keyResults.filter((k) => k.id !== krId);
  obj.updatedAt = new Date().toISOString();
  saveOKRs(slug, okrs);
  return obj;
}

// ── Stats ────────────────────────────────────────────

export function getOKRStats(slug: string) {
  const okrs = getOKRs(slug);
  const allKRs = okrs.flatMap((o) => o.keyResults);
  const totalKRs = allKRs.length;
  const completedKRs = allKRs.filter((kr) => kr.current >= kr.target).length;
  const avgProgress = okrs.length > 0
    ? Math.round(okrs.reduce((s, o) => s + o.progress, 0) / okrs.length)
    : 0;

  return {
    totalObjectives: okrs.length,
    totalKeyResults: totalKRs,
    completedKeyResults: completedKRs,
    averageProgress: avgProgress,
  };
}

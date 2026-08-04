// PMOS OKR (Objectives & Key Results)
// Stored in PostBase (collection `okrs`, doc per project slug) with a legacy
// JSON mirror per project: ~/.pmos/projects/{slug}/okrs.json

import fs from "fs";
import path from "path";
import type { Objective, KeyResult } from "@/types/pmos";
import { readItems, writeItems } from "./postbase";

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

// CRUD

export async function getOKRs(slug: string): Promise<Objective[]> {
  const items = await readItems<Objective>("okrs", slug);
  if (items.length > 0) return items;
  // one-time bootstrap from legacy file
  const fromFile = readJSON<Objective[]>(okrPath(slug)) || [];
  if (fromFile.length > 0) await writeItems("okrs", slug, fromFile);
  return fromFile;
}

export async function saveOKRs(slug: string, okrs: Objective[]): Promise<void> {
  await writeItems("okrs", slug, okrs);
  writeJSON(okrPath(slug), okrs); // mirror
}

export async function getObjective(slug: string, id: string): Promise<Objective | null> {
  const okrs = await getOKRs(slug);
  return okrs.find((o) => o.id === id) || null;
}

export async function createObjective(slug: string, obj: Objective): Promise<void> {
  const okrs = await getOKRs(slug);
  okrs.push(obj);
  await saveOKRs(slug, okrs);
}

export async function updateObjective(slug: string, id: string, updates: Partial<Objective>): Promise<Objective | null> {
  const okrs = await getOKRs(slug);
  const idx = okrs.findIndex((o) => o.id === id);
  if (idx < 0) return null;
  okrs[idx] = { ...okrs[idx], ...updates, updatedAt: new Date().toISOString() };
  await saveOKRs(slug, okrs);
  return okrs[idx];
}

export async function deleteObjective(slug: string, id: string): Promise<boolean> {
  const okrs = await getOKRs(slug);
  const filtered = okrs.filter((o) => o.id !== id);
  if (filtered.length === okrs.length) return false;
  await saveOKRs(slug, filtered);
  return true;
}

// Key Results

export async function addKeyResult(slug: string, objectiveId: string, kr: KeyResult): Promise<Objective | null> {
  const okrs = await getOKRs(slug);
  const obj = okrs.find((o) => o.id === objectiveId);
  if (!obj) return null;
  obj.keyResults.push(kr);
  obj.updatedAt = new Date().toISOString();
  await saveOKRs(slug, okrs);
  return obj;
}

export async function updateKeyResult(slug: string, objectiveId: string, krId: string, updates: Partial<KeyResult>): Promise<Objective | null> {
  const okrs = await getOKRs(slug);
  const obj = okrs.find((o) => o.id === objectiveId);
  if (!obj) return null;
  const krIdx = obj.keyResults.findIndex((k) => k.id === krId);
  if (krIdx < 0) return null;
  obj.keyResults[krIdx] = { ...obj.keyResults[krIdx], ...updates };
  obj.updatedAt = new Date().toISOString();
  await saveOKRs(slug, okrs);
  return obj;
}

export async function deleteKeyResult(slug: string, objectiveId: string, krId: string): Promise<Objective | null> {
  const okrs = await getOKRs(slug);
  const obj = okrs.find((o) => o.id === objectiveId);
  if (!obj) return null;
  obj.keyResults = obj.keyResults.filter((k) => k.id !== krId);
  obj.updatedAt = new Date().toISOString();
  await saveOKRs(slug, okrs);
  return obj;
}

// Stats

export async function getOKRStats(slug: string) {
  const okrs = await getOKRs(slug);
  const allKRs = okrs.flatMap((o) => o.keyResults);
  const totalKRs = allKRs.length;
  const completedKRs = allKRs.filter((kr) => kr.current >= kr.target).length;
  const avgProgress =
    okrs.length > 0
      ? Math.round(
          okrs.reduce((s, o) => {
            if (o.keyResults.length === 0) return s;
            const objProgress = Math.round(
              (o.keyResults.reduce(
                (sum, kr) =>
                  sum +
                  Math.min(100, Math.round((kr.current / Math.max(kr.target, 1)) * 100)),
                0
              ) /
                o.keyResults.length) *
                10
            ) / 10;
            return s + objProgress;
          }, 0) / okrs.length
        )
      : 0;

  return {
    totalObjectives: okrs.length,
    totalKeyResults: totalKRs,
    completedKeyResults: completedKRs,
    averageProgress: avgProgress,
  };
}

// This module generates static params for GitHub Pages export
// It runs at build time and needs to access the project registry
// Since we can't use fs in the browser, we'll read from the registry.json file

import fs from "fs";
import path from "path";

const PMOS_HOME = path.join(
  process.env.HOME || process.env.USERPROFILE || "",
  ".pmos"
);

function readJson<T>(filePath: string): T | null {
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export interface Project {
  slug: string;
  name: string;
  description?: string;
  version?: string;
}

export async function generateProjectStaticParams() {
  const registry = readJson<{ projects: Project[] }>(path.join(PMOS_HOME, "registry.json"));
  const projects = registry?.projects || [];
  return projects.map((project) => ({
    slug: project.slug,
  }));
}
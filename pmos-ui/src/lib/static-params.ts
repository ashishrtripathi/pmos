// This module generates static params for GitHub Pages export
// It runs at build time and needs to access the project registry
// Since we can't use fs in the browser, we'll read from the registry.json file

import fs from "fs";
import path from "path";

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
  const pmosDir = getPmosHome();
  const registry = readJson<{ projects: Project[] }>(path.join(pmosDir, "registry.json"));
  const projects = registry?.projects || [
    { slug: "pmos", name: "PMOS" },
    { slug: "voxstyle", name: "VoxStyle" },
  ];
  return projects.map((project) => ({
    slug: project.slug,
  }));
}
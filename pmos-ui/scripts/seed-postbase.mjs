#!/usr/bin/env node
/**
 * seed-postbase.mjs
 * One-time / re-runnable migration: copies all existing PMOS data from
 * ~/.pmos (JSON + markdown files) into the local PostBase backend.
 *
 * Idempotent: every write is an upsert (PUT /api/db/{table}/{id}).
 *
 * Usage:
 *   node scripts/seed-postbase.mjs [--base http://localhost:8081/api/db] [--slug <project>]
 */
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import matter from "gray-matter";

const PMOS_HOME = path.join(os.homedir(), ".pmos");
const BASE = process.argv.includes("--base")
  ? process.argv[process.argv.indexOf("--base") + 1]
  : process.env.POSTBASE_URL || "http://localhost:8081/api/db";

const onlySlug = process.argv.includes("--slug")
  ? process.argv[process.argv.indexOf("--slug") + 1]
  : null;

const readFile = (p) => {
  try {
    return fs.readFileSync(p, "utf-8");
  } catch {
    return null;
  }
};

const readJson = (p) => {
  const raw = readFile(p);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const exists = (p) => fs.existsSync(p);

async function put(table, id, data) {
  const url = `${BASE}/${encodeURIComponent(table)}/${encodeURIComponent(id)}`;
  const res = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error(`  [FAIL] PUT ${table}/${id} -> ${res.status} ${text.slice(0, 200)}`);
    return false;
  }
  return true;
}

const STORY_STATUS_DIRS = ["backlog", "in-progress", "review", "done"];

function parseStory(filePath, status) {
  const raw = readFile(filePath);
  if (!raw) return null;
  const { data, content } = matter(raw);

  const asAMatch = content.match(/\*\*As a\*\*\s*(.+)/);
  const iWantMatch = content.match(/\*\*I want to\*\*\s*(.+)/);
  const soThatMatch = content.match(/\*\*so that\*\*\s*(.+)/);

  const businessGoalMatch = content.match(/##\s*Business Goal\s*\n([\s\S]*?)(?=\n## |\n$)/);
  const acMatch = content.match(/##\s*Acceptance Criteria\s*\n([\s\S]*?)(?=\n## |\n$)/);
  const acceptanceCriteria = [];
  if (acMatch) {
    const scenarioMatch = acMatch[1].match(/\*\*Scenario:\*\*\s*(.+)/);
    if (scenarioMatch) {
      const givens = [...acMatch[1].matchAll(/(?:and\s+)?\*\*Given:\*\*\s*(.+)/gi)].map((m) => m[1].trim());
      const whenMatch = acMatch[1].match(/\*\*When:\*\*\s*(.+)/);
      const thenMatch = acMatch[1].match(/\*\*Then:\*\*\s*(.+)/);
      acceptanceCriteria.push({
        scenario: scenarioMatch[1].trim(),
        given: givens,
        when: whenMatch?.[1]?.trim() || "",
        then: thenMatch?.[1]?.trim() || "",
      });
    } else {
      const bullets = acMatch[1]
        .split("\n")
        .filter((l) => l.startsWith("- ") || l.startsWith("* "))
        .map((l) => l.replace(/^[-*]\s*/, "").trim());
      if (bullets.length > 0) {
        acceptanceCriteria.push({ scenario: "Default", given: [], when: "", then: bullets.join("; ") });
      }
    }
  }

  return {
    id: data.id || path.basename(filePath, ".md"),
    title: data.title || data.story || path.basename(filePath, ".md"),
    description: data.description || "",
    points: data.points || data.estimate || 0,
    status,
    useCase: {
      asA: asAMatch?.[1]?.trim() || "",
      iWant: iWantMatch?.[1]?.trim() || "",
      soThat: soThatMatch?.[1]?.trim() || "",
    },
    businessGoal: businessGoalMatch?.[1]?.trim() || data["business-goal"] || "",
    acceptanceCriteria,
    persona: data.persona,
    personaRole: data["persona-role"],
    journeyStep: data["journey-step"],
    estimatedValue: data["estimated-value"] || data.estimatedValue || undefined,
    source: data.source || "legacy",
    filePath,
  };
}

function parseAgent(filePath) {
  const raw = readFile(filePath);
  if (!raw) return null;
  const { data, content } = matter(raw);
  const focusMatch = content.match(/## Focus Areas\s*\n([\s\S]*?)(?=\n## |\n$)/);
  const activeMatch = content.match(/## Active Stories\s*\n([\s\S]*?)(?=\n## |\n$)/);
  return {
    id: path.basename(filePath, ".md"),
    name: data.name || path.basename(filePath, ".md"),
    role: data.role || "Agent",
    focus: focusMatch
      ? focusMatch[1].split("\n").filter((l) => l.startsWith("- ")).map((l) => l.replace(/^-\s*/, "").trim())
      : [],
    activeStories: activeMatch
      ? activeMatch[1].split("\n").filter((l) => l.startsWith("- ")).map((l) => l.replace(/^-\s*/, "").trim())
      : [],
    filePath,
  };
}

async function seedProject(slug) {
  const projectDir = path.join(PMOS_HOME, "projects", slug);
  if (!exists(projectDir)) {
    console.log(`  [SKIP] project dir missing: ${projectDir}`);
    return;
  }
  let counts = {};

  // project.md
  const projectMd = readFile(path.join(projectDir, "project.md"));
  if (projectMd) {
    if (await put("projects", slug, { markdown: projectMd })) counts["projects"] = 1;
  }

  // source-location.json
  const sourceLocation = readJson(path.join(projectDir, "source-location.json"));
  if (sourceLocation) {
    if (await put("source_location", slug, sourceLocation)) counts["source_location"] = 1;
  }

  // pricing.json
  const pricing = readJson(path.join(projectDir, "pricing.json"));
  if (pricing) {
    if (await put("pricing", slug, pricing)) counts["pricing"] = 1;
  }

  // stories
  const stories = [];
  for (const status of STORY_STATUS_DIRS) {
    const dir = path.join(projectDir, "stories", status);
    if (!exists(dir)) continue;
    for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".md"))) {
      const story = parseStory(path.join(dir, file), status);
      if (story) stories.push(story);
    }
  }
  if (stories.length > 0) {
    if (await put("stories", slug, { items: stories })) counts["stories"] = stories.length;
  }

  // agents
  const agentsDir = path.join(projectDir, "agents");
  const agents = exists(agentsDir)
    ? fs.readdirSync(agentsDir).filter((f) => f.endsWith(".md")).map((f) => parseAgent(path.join(agentsDir, f))).filter(Boolean)
    : [];
  if (agents.length > 0) {
    if (await put("agents", slug, { items: agents })) counts["agents"] = agents.length;
  }

  // bugs.json
  const bugs = readJson(path.join(projectDir, "bugs.json"));
  if (bugs && Array.isArray(bugs) && bugs.length > 0) {
    if (await put("bugs", slug, { items: bugs })) counts["bugs"] = bugs.length;
  }

  // okrs.json
  const okrs = readJson(path.join(projectDir, "okrs.json"));
  if (okrs && Array.isArray(okrs) && okrs.length > 0) {
    if (await put("okrs", slug, { items: okrs })) counts["okrs"] = okrs.length;
  }

  // mockups
  const mockupsDir = path.join(projectDir, "mockups");
  if (exists(mockupsDir)) {
    const mockups = fs
      .readdirSync(mockupsDir)
      .filter((f) => f.endsWith(".json"))
      .map((f) => readJson(path.join(mockupsDir, f)))
      .filter(Boolean);
    if (mockups.length > 0) {
      if (await put("mockups", slug, { items: mockups })) counts["mockups"] = mockups.length;
    }
  }

  // journeys
  const journeyMd = readFile(path.join(projectDir, "journey", "journey.md"));
  const personasMd = readFile(path.join(projectDir, "journey", "personas.md"));
  if (journeyMd || personasMd) {
    if (await put("journeys", slug, { journey: journeyMd, personas: personasMd })) counts["journeys"] = 1;
  }

  // persona journeys
  const journeyDir = path.join(projectDir, "journey");
  if (exists(journeyDir)) {
    for (const file of fs.readdirSync(journeyDir).filter((f) => f.startsWith("persona-") && f.endsWith(".md"))) {
      const md = readFile(path.join(journeyDir, file));
      if (!md) continue;
      const nameMatch = md.match(/#\s*Customer Journey\s*[—-]\s*(.+?)\s*\(/);
      const personaId = (nameMatch?.[1] || file.replace(/^persona-/, "").replace(/\.md$/, ""))
        .toLowerCase()
        .replace(/\s+/g, "-");
      if (await put("persona_journeys", `${slug}::${personaId}`, { markdown: md })) {
        counts["persona_journeys"] = (counts["persona_journeys"] || 0) + 1;
      }
    }
  }

  // intelligence
  const intelDir = path.join(projectDir, "intelligence");
  const intelNames = ["architecture", "domain-model", "tech-stack", "features", "code-quality", "improvements", "api-docs", "missing-docs"];
  if (exists(intelDir)) {
    const intel = {};
    for (const name of intelNames) {
      const md = readFile(path.join(intelDir, `${name}.md`));
      if (md) intel[name] = md;
    }
    if (Object.keys(intel).length > 0) {
      if (await put("intelligence", slug, intel)) counts["intelligence"] = Object.keys(intel).length;
    }
  }

  // story-map.md / dashboard.md (read-only pipeline markers)
  const storyMapMd = readFile(path.join(projectDir, "stories", "story-map.md"));
  if (storyMapMd) {
    if (await put("story_map_md", slug, { markdown: storyMapMd })) counts["story_map_md"] = 1;
  }
  const dashboardMd = readFile(path.join(projectDir, "dashboard.md"));
  if (dashboardMd) {
    if (await put("dashboard_md", slug, { markdown: dashboardMd })) counts["dashboard_md"] = 1;
  }

  // ui-structure / pipeline-data
  const uiStructure = readJson(path.join(projectDir, "ui-structure.json"));
  if (uiStructure) {
    if (await put("ui_structure", slug, uiStructure)) counts["ui_structure"] = 1;
  }
  const pipelineData = readJson(path.join(projectDir, "pipeline-data.json"));
  if (pipelineData) {
    if (await put("pipeline_data", slug, pipelineData)) counts["pipeline_data"] = 1;
  }

  console.log(`  [OK] ${slug}: ${JSON.stringify(counts)}`);
}

async function main() {
  console.log(`Seeding PMOS data from ${PMOS_HOME} into PostBase at ${BASE}...`);

  // registry
  const registry = readJson(path.join(PMOS_HOME, "registry.json"));
  if (registry) {
    if (await put("registry", "main", registry)) {
      console.log(`  [OK] registry: ${registry.projects?.length ?? 0} projects`);
    }
  } else {
    console.log("  [WARN] no registry.json found");
  }

  // per-project
  const projectsDir = path.join(PMOS_HOME, "projects");
  if (!exists(projectsDir)) {
    console.log("  [WARN] no projects dir found — nothing to seed");
    return;
  }

  const slugs = onlySlug ? [onlySlug] : fs.readdirSync(projectsDir).filter((d) => !d.startsWith("."));
  for (const slug of slugs) {
    await seedProject(slug);
  }

  console.log("Seed complete.");
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});

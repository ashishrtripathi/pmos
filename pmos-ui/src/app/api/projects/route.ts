import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getRegistry, updateRegistry } from "@/lib/pmos";
import { writeDoc } from "@/lib/postbase";
import type { Registry } from "@/types/pmos";

const PMOS_ROOT = path.join(
  process.env.HOME || process.env.USERPROFILE || "",
  ".pmos"
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, localPath, repoUrl, source } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Project name is required" },
        { status: 400 }
      );
    }

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    // Check if project already exists
    const registry = await getRegistry();
    if (registry?.projects?.some((p) => p.slug === slug)) {
      return NextResponse.json(
        { error: `Project "${slug}" already exists` },
        { status: 409 }
      );
    }

    // Create project directory structure (mirror scaffolding for external tooling)
    const projectDir = path.join(PMOS_ROOT, "projects", slug);
    const dirs = [
      "",
      "journey",
      "intelligence",
      "stories/backlog",
      "stories/in-progress",
      "stories/review",
      "stories/done",
      "agents",
      "specs",
    ];
    for (const dir of dirs) {
      const dirPath = path.join(projectDir, dir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
    }

    // Determine source mode
    const mode = source || (repoUrl && localPath ? "github" : localPath ? "local" : "github-only");

    // Write source-location.json (PostBase + mirror)
    const sourceLocation = {
      mode,
      localPath: localPath || null,
      repoUrl: repoUrl || null,
      resolvedAt: new Date().toISOString(),
      lastAnalyzed: null,
      runtime: {
        status: "not-running",
        url: null,
        port: null,
        startedAt: null,
        method: null,
      },
    };
    await writeDoc("source_location", slug, sourceLocation);
    fs.writeFileSync(
      path.join(projectDir, "source-location.json"),
      JSON.stringify(sourceLocation, null, 2)
    );

    // Write project.md (PostBase + mirror)
    const projectMd = `# ${name}

## Project Overview

Project registered via PMOS Dashboard. Run intelligence analysis to populate details.

## Key Facts

- **Type**: Attached via Dashboard
- **Status**: Active Development
${repoUrl ? `- **Repository**: ${repoUrl}` : ""}
${localPath ? `- **Local Path**: ${localPath}` : ""}
`;
    await writeDoc("projects", slug, { markdown: projectMd });
    fs.writeFileSync(path.join(projectDir, "project.md"), projectMd);

    // Update registry (PostBase + mirror)
    const nextRegistry: Registry = {
      version: String(registry?.version ?? "1"),
      createdAt: String(registry?.createdAt || new Date().toISOString().split("T")[0]),
      projects: [
        ...(registry?.projects || []),
        {
          slug,
          name: name.trim(),
          source: mode,
          repoUrl: repoUrl || null,
          localPath: localPath || null,
          path: `~/.pmos/projects/${slug}`,
          status: "attached",
          attachedAt: new Date().toISOString().split("T")[0],
          projectType: "full-codebase",
        },
      ],
    };
    await updateRegistry(nextRegistry);

    return NextResponse.json({
      success: true,
      slug,
      message: `Project "${name}" created successfully`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create project" },
      { status: 500 }
    );
  }
}

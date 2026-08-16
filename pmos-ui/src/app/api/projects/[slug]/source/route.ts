import { NextResponse } from "next/server";
import { getSourceLocation, updateSourceLocation, getRegistry, updateRegistry } from "@/lib/pmos";

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;
  try {
    const source = await getSourceLocation(slug);
    if (!source) {
      // Fallback: check registry for project info
      const registry = await getRegistry();
      const proj = registry?.projects.find((p) => p.slug === slug);
      if (proj) {
        return NextResponse.json({
          mode: proj.source || "local",
          localPath: proj.localPath || "",
          repoUrl: proj.repoUrl || "",
          resolvedAt: proj.attachedAt || new Date().toISOString(),
          lastAnalyzed: null,
          runtime: {
            status: "not-running",
            url: null,
            port: null,
            startedAt: null,
            method: null,
          },
        });
      }
      return NextResponse.json({ error: "Source location not found" }, { status: 404 });
    }
    return NextResponse.json(source);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;
  try {
    const body = await request.json();
    await updateSourceLocation(slug, body);

    // Also sync with registry.json if localPath or repoUrl changed
    const registry = await getRegistry();
    if (registry) {
      const updatedProjects = registry.projects.map((p) => {
        if (p.slug === slug) {
          return {
            ...p,
            source: body.mode || p.source,
            localPath: body.localPath || p.localPath,
            repoUrl: body.repoUrl || p.repoUrl,
          };
        }
        return p;
      });
      await updateRegistry({ ...registry, projects: updatedProjects });
    }

    return NextResponse.json({ success: true, source: body });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { listProjects, getDashboard, getAllStories } from "@/lib/pmos";

export async function GET() {
  const projects = await listProjects();

  const enriched = [];
  for (const project of projects) {
    const dashboard = await getDashboard(project.slug);
    const stories = await getAllStories(project.slug);
    enriched.push({
      ...project,
      dashboard,
      storyCount: stories.length,
    });
  }

  return NextResponse.json({ projects: enriched });
}

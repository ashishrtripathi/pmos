import { NextResponse } from "next/server";
import { listProjects, getDashboard, getAllStories } from "@/lib/pmos";

export async function GET() {
  const projects = listProjects();

  const enriched = projects.map((project) => {
    const dashboard = getDashboard(project.slug);
    const stories = getAllStories(project.slug);
    return {
      ...project,
      dashboard,
      storyCount: stories.length,
    };
  });

  return NextResponse.json({ projects: enriched });
}

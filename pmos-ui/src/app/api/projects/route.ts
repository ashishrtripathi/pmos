import { NextResponse } from "next/server";
import { createProject, listProjects } from "@/lib/pmos";

export async function GET() {
  try {
    const projects = await listProjects();
    return NextResponse.json({ projects });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, projects: [] }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.name || !body.name.trim()) {
      return NextResponse.json({ error: "Project name is required" }, { status: 400 });
    }
    const project = await createProject(body);
    return NextResponse.json(project, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

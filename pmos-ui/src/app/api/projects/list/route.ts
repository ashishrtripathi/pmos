import { NextResponse } from "next/server";
import { listProjects } from "@/lib/pmos";

export async function GET() {
  try {
    const projects = await listProjects();
    return NextResponse.json({ projects });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, projects: [] }, { status: 500 });
  }
}

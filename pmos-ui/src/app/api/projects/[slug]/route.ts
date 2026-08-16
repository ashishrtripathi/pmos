import { NextResponse } from "next/server";
import { removeProject, getProject } from "@/lib/pmos";

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;
  try {
    const project = await getProject(slug);
    return NextResponse.json(project);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;
  try {
    const success = await removeProject(slug, { deleteMetadata: true });
    if (!success) {
      return NextResponse.json({ error: `Project '${slug}' not found` }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: `Project '${slug}' removed from PMOS` });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

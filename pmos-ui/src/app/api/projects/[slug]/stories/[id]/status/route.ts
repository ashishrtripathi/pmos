import { NextResponse } from "next/server";
import { updateStoryStatus } from "@/lib/pmos";
import type { StoryStatus } from "@/types/pmos";

export async function POST(
  request: Request,
  { params }: { params: { slug: string; id: string } }
) {
  const { slug, id } = params;
  try {
    const body = await request.json();
    const status = body.status as StoryStatus;
    if (!status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 });
    }
    const agentId = await updateStoryStatus(slug, id, status);
    return NextResponse.json({ success: true, storyId: id, status, pickedUpBy: agentId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { slug: string; id: string } }
) {
  return POST(request, { params });
}

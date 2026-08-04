import { NextRequest, NextResponse } from "next/server";
import { updateStoryStatus, assignToCodingAgent } from "@/lib/pmos";

type Params = { params: { slug: string; storyId: string } };

export async function PATCH(req: NextRequest, { params }: Params) {
  const { slug, storyId } = params;
  const body = await req.json();
  const { to, from } = body;

  if (!to || !["backlog", "in-progress", "review", "done"].includes(to)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  try {
    const dest = await updateStoryStatus(slug, storyId, to);

    // When a story moves to in-progress, the coding agent picks it up
    let pickedUpBy: string | null = null;
    if (to === "in-progress") {
      pickedUpBy = await assignToCodingAgent(slug, storyId);
    }

    if (!dest && !pickedUpBy) {
      return NextResponse.json(
        { error: "Story not found", storyId },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, moved: !!dest, pickedUpBy, from, to });
  } catch (err) {
    console.error("[status] failed to update story status:", err);
    return NextResponse.json(
      { error: "Failed to update story status" },
      { status: 500 }
    );
  }
}

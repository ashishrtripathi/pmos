import { NextRequest, NextResponse } from "next/server";
import { updateStoryStatus, pickUpStory, getAllStories } from "@/lib/pmos";

type Params = { params: { slug: string; storyId: string } };

const VALID_STATUSES = ["backlog", "in-progress", "review", "done"];

async function handleStatusChange(req: NextRequest, { params }: Params) {
  const { slug, storyId } = params;
  const body = await req.json();
  // The kanban board sends PUT { status }; legacy clients send PATCH { to }.
  const to = body.to ?? body.status;
  const from = body.from ?? null;

  if (!to || !VALID_STATUSES.includes(to)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  try {
    // Verify the story exists before mutating.
    const stories = await getAllStories(slug);
    if (!stories.some((s) => s.id === storyId)) {
      return NextResponse.json(
        { error: "Story not found", storyId },
        { status: 404 }
      );
    }

    const dest = await updateStoryStatus(slug, storyId, to);

    // When a story moves to in-progress, the team picks it up:
    // the best-fit agent (focus match + load balance) owns it.
    let pickedUpBy: string | null = null;
    let pickedUpByName: string | null = null;
    if (to === "in-progress") {
      const pickup = await pickUpStory(slug, storyId);
      if (pickup) {
        pickedUpBy = pickup.agentId;
        pickedUpByName = pickup.agentName;
      }
    }

    return NextResponse.json({
      ok: true,
      moved: !!dest,
      pickedUpBy,
      pickedUpByName,
      from,
      to,
    });
  } catch (err) {
    console.error("[status] failed to update story status:", err);
    return NextResponse.json(
      { error: "Failed to update story status" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  return handleStatusChange(req, { params });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  return handleStatusChange(req, { params });
}

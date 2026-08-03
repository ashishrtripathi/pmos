import { NextRequest, NextResponse } from "next/server";
import {
  getChangeRequests,
  createChangeRequest,
  updateChangeRequest,
  deleteChangeRequest,
} from "@/lib/pmos-change-requests";
import { createStory } from "@/lib/pmos";

type Params = { params: { slug: string } };

export async function GET(_req: NextRequest, { params }: Params) {
  const changeRequests = getChangeRequests(params.slug);
  return NextResponse.json({ changeRequests });
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const data = await req.json();
    const { action } = data;

    switch (action) {
      case "create": {
        const cr = createChangeRequest(params.slug, data);
        return NextResponse.json({ changeRequest: cr }, { status: 201 });
      }
      case "update": {
        if (!data.id) {
          return NextResponse.json(
            { error: "Change Request ID is required" },
            { status: 400 }
          );
        }
        const cr = updateChangeRequest(params.slug, data.id, data.updates || data);
        if (!cr) {
          return NextResponse.json(
            { error: "Change Request not found" },
            { status: 404 }
          );
        }
        return NextResponse.json({ changeRequest: cr });
      }
      case "status": {
        if (!data.id || !data.status) {
          return NextResponse.json(
            { error: "Change Request ID and status are required" },
            { status: 400 }
          );
        }
        const cr = updateChangeRequest(params.slug, data.id, {
          status: data.status,
        });
        if (!cr) {
          return NextResponse.json(
            { error: "Change Request not found" },
            { status: 404 }
          );
        }
        return NextResponse.json({ changeRequest: cr });
      }
      case "convert": {
        // Convert a change request into a story in the backlog
        if (!data.id) {
          return NextResponse.json(
            { error: "Change Request ID is required" },
            { status: 400 }
          );
        }
        const cr = getChangeRequests(params.slug).find((c) => c.id === data.id);
        if (!cr) {
          return NextResponse.json(
            { error: "Change Request not found" },
            { status: 404 }
          );
        }
        const points = Number(data.points) || 1;
        const story = createStory(params.slug, {
          title: cr.title,
          description: cr.description,
          points,
          businessGoal: `Change request ${cr.id}: ${cr.priority} priority (${cr.category})`,
          estimatedValue: data.estimatedValue
            ? Number(data.estimatedValue)
            : undefined,
        });
        // Link the story to the CR and move it to approved if it was submitted
        const updated = updateChangeRequest(params.slug, cr.id, {
          storyIds: [...cr.storyIds, story.id],
          status: cr.status === "submitted" ? "in-review" : cr.status,
        });
        return NextResponse.json({ story, changeRequest: updated });
      }
      case "delete": {
        if (!data.id) {
          return NextResponse.json(
            { error: "Change Request ID is required" },
            { status: 400 }
          );
        }
        const ok = deleteChangeRequest(params.slug, data.id);
        if (!ok) {
          return NextResponse.json(
            { error: "Change Request not found" },
            { status: 404 }
          );
        }
        return NextResponse.json({ ok: true });
      }
      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (err) {
    return NextResponse.json(
      { error: `Failed to process request: ${(err as Error).message}` },
      { status: 500 }
    );
  }
}

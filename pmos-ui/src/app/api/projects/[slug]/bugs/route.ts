import { NextResponse } from "next/server";
import { getBugs, createBug, updateBug, deleteBug } from "@/lib/pmos-bugs";
import { pickUpBug } from "@/lib/pmos";

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;
  try {
    const bugs = await getBugs(slug);
    return NextResponse.json({ bugs });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, bugs: [] }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;
  try {
    const body = await request.json();

    if (body.action === "create") {
      const bug = await createBug(slug, {
        title: body.title,
        description: body.description,
        severity: body.severity,
        stepsToReproduce: body.stepsToReproduce,
        expectedBehavior: body.expectedBehavior,
        actualBehavior: body.actualBehavior,
        reportedBy: body.reportedBy || "PM",
        storyId: body.storyId,
      });
      return NextResponse.json({ success: true, bug }, { status: 201 });
    }

    if (body.action === "status" && body.id) {
      const bug = await updateBug(slug, body.id, { status: body.status });
      let agentAssignment = null;
      if (body.status === "in-progress") {
        agentAssignment = await pickUpBug(slug, body.id);
      }
      return NextResponse.json({
        success: true,
        bug,
        pickedUpBy: agentAssignment?.agentId || null,
      });
    }

    if (body.action === "delete" && body.id) {
      const deleted = await deleteBug(slug, body.id);
      return NextResponse.json({ success: deleted });
    }

    return NextResponse.json({ error: "Invalid bug action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

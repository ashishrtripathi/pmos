import { NextResponse } from "next/server";
import {
  getOKRs,
  saveOKRs,
  createObjective,
  updateObjective,
  deleteObjective,
  getObjective,
} from "@/lib/pmos-okr";

export async function GET(
  _request: Request,
  { params }: { params: { slug: string } }
) {
  const okrs = getOKRs(params.slug);
  return NextResponse.json(okrs);
}

export async function POST(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const body = await request.json();
  const { action, objective, objectiveId, keyResult } = body;
  const slug = params.slug;

  switch (action) {
    case "create":
      if (!objective?.id || !objective?.title) {
        return NextResponse.json({ error: "Objective needs id and title" }, { status: 400 });
      }
      createObjective(slug, {
        ...objective,
        keyResults: objective.keyResults || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      return NextResponse.json({ success: true, objective: getObjective(slug, objective.id) });

    case "update":
      if (!objectiveId) {
        return NextResponse.json({ error: "objectiveId required" }, { status: 400 });
      }
      const updated = updateObjective(slug, objectiveId, body.updates || body);
      if (!updated) {
        return NextResponse.json({ error: "Objective not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, objective: updated });

    case "delete":
      if (!objectiveId) {
        return NextResponse.json({ error: "objectiveId required" }, { status: 400 });
      }
      deleteObjective(slug, objectiveId);
      return NextResponse.json({ success: true });

    case "add-key-result":
      if (!objectiveId || !keyResult?.id || !keyResult?.title) {
        return NextResponse.json({ error: "objectiveId and keyResult (id, title) required" }, { status: 400 });
      }
      const { addKeyResult } = await import("@/lib/pmos-okr");
      const objWithKR = addKeyResult(slug, objectiveId, keyResult);
      if (!objWithKR) {
        return NextResponse.json({ error: "Objective not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, objective: objWithKR });

    case "update-key-result":
      if (!objectiveId || !keyResult?.id) {
        return NextResponse.json({ error: "objectiveId and keyResult.id required" }, { status: 400 });
      }
      const { updateKeyResult } = await import("@/lib/pmos-okr");
      const objWithKRUpdated = updateKeyResult(slug, objectiveId, keyResult.id, keyResult);
      if (!objWithKRUpdated) {
        return NextResponse.json({ error: "Objective or KeyResult not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, objective: objWithKRUpdated });

    case "delete-key-result":
      if (!objectiveId || !keyResult?.id) {
        return NextResponse.json({ error: "objectiveId and keyResult.id required" }, { status: 400 });
      }
      const { deleteKeyResult } = await import("@/lib/pmos-okr");
      const objAfterDelete = deleteKeyResult(slug, objectiveId, keyResult.id);
      if (!objAfterDelete) {
        return NextResponse.json({ error: "Objective not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, objective: objAfterDelete });

    case "save-all":
      if (!Array.isArray(body.objectives)) {
        return NextResponse.json({ error: "objectives array required" }, { status: 400 });
      }
      saveOKRs(slug, body.objectives);
      return NextResponse.json({ success: true, count: body.objectives.length });

    default:
      return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  }
}

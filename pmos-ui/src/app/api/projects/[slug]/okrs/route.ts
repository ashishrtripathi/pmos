import { NextResponse } from "next/server";
import {
  getOKRs,
  saveOKRs,
  createObjective,
  updateObjective,
  deleteObjective,
  addKeyResult,
  updateKeyResult,
  deleteKeyResult,
} from "@/lib/pmos-okr";

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;
  try {
    const okrs = await getOKRs(slug);
    return NextResponse.json(okrs);
  } catch (err: any) {
    return NextResponse.json({ error: err.message, okrs: [] }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;
  try {
    const body = await request.json();

    if (body.action === "save-all" && Array.isArray(body.objectives)) {
      await saveOKRs(slug, body.objectives);
      return NextResponse.json({ success: true, objectives: body.objectives });
    }

    if (body.action === "create" && body.objective) {
      await createObjective(slug, body.objective);
      return NextResponse.json({ success: true, objective: body.objective }, { status: 201 });
    }

    if (body.action === "update" && body.id) {
      const updated = await updateObjective(slug, body.id, body.updates || {});
      return NextResponse.json({ success: true, objective: updated });
    }

    if (body.action === "delete" && body.id) {
      const deleted = await deleteObjective(slug, body.id);
      return NextResponse.json({ success: deleted });
    }

    if (body.action === "add-kr" && body.objectiveId && body.kr) {
      const updated = await addKeyResult(slug, body.objectiveId, body.kr);
      return NextResponse.json({ success: true, objective: updated });
    }

    if (body.action === "update-kr" && body.objectiveId && body.krId) {
      const updated = await updateKeyResult(slug, body.objectiveId, body.krId, body.updates || {});
      return NextResponse.json({ success: true, objective: updated });
    }

    if (body.action === "delete-kr" && body.objectiveId && body.krId) {
      const updated = await deleteKeyResult(slug, body.objectiveId, body.krId);
      return NextResponse.json({ success: true, objective: updated });
    }

    // Default fallback: if body is an array of objectives directly
    if (Array.isArray(body)) {
      await saveOKRs(slug, body);
      return NextResponse.json({ success: true, objectives: body });
    }

    return NextResponse.json({ error: "Invalid OKR action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { slug: string } }
) {
  return POST(request, { params });
}

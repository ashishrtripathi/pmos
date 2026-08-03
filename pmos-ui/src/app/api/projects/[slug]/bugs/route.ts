import { NextRequest, NextResponse } from "next/server";
import {
  getBugs,
  createBug,
  updateBug,
  deleteBug,
} from "@/lib/pmos-bugs";

type Params = { params: { slug: string } };

export async function GET(_req: NextRequest, { params }: Params) {
  const bugs = getBugs(params.slug);
  return NextResponse.json({ bugs });
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const data = await req.json();
    const { action } = data;

    switch (action) {
      case "create": {
        const bug = createBug(params.slug, data);
        return NextResponse.json({ bug }, { status: 201 });
      }
      case "update": {
        if (!data.id) {
          return NextResponse.json(
            { error: "Bug ID is required" },
            { status: 400 }
          );
        }
        const bug = updateBug(params.slug, data.id, data.updates || data);
        if (!bug) {
          return NextResponse.json({ error: "Bug not found" }, { status: 404 });
        }
        return NextResponse.json({ bug });
      }
      case "status": {
        if (!data.id || !data.status) {
          return NextResponse.json(
            { error: "Bug ID and status are required" },
            { status: 400 }
          );
        }
        const bug = updateBug(params.slug, data.id, { status: data.status });
        if (!bug) {
          return NextResponse.json({ error: "Bug not found" }, { status: 404 });
        }
        return NextResponse.json({ bug });
      }
      case "delete": {
        if (!data.id) {
          return NextResponse.json(
            { error: "Bug ID is required" },
            { status: 400 }
          );
        }
        const ok = deleteBug(params.slug, data.id);
        if (!ok) {
          return NextResponse.json({ error: "Bug not found" }, { status: 404 });
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

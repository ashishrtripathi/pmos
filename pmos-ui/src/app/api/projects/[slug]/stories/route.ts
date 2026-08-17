import { NextResponse } from "next/server";
import { getAllStories, createStory, updateStory } from "@/lib/pmos";
import { writeItems } from "@/lib/postbase";

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;
  try {
    const stories = await getAllStories(slug);
    return NextResponse.json(stories);
  } catch (err: any) {
    return NextResponse.json({ error: err.message, stories: [] }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;
  try {
    const body = await request.json();

    if (body.action === "update" && body.id) {
      const updated = await updateStory(slug, body.id, body.updates || {});
      return NextResponse.json({ success: true, story: updated });
    }

    if (body.action === "save-all" && Array.isArray(body.stories)) {
      await writeItems("stories", slug, body.stories);
      return NextResponse.json({ success: true, count: body.stories.length });
    }

    if (!body.title || !body.title.trim()) {
      return NextResponse.json({ error: "Story title is required" }, { status: 400 });
    }
    const created = await createStory(slug, body);
    return NextResponse.json(created, { status: 201 });
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

export async function PATCH(
  request: Request,
  { params }: { params: { slug: string } }
) {
  return POST(request, { params });
}

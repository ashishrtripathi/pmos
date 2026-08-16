import { NextResponse } from "next/server";
import { getAllStories, createStory } from "@/lib/pmos";

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
    if (!body.title || !body.title.trim()) {
      return NextResponse.json({ error: "Story title is required" }, { status: 400 });
    }
    const created = await createStory(slug, body);
    return NextResponse.json(created, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

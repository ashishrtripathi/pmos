import { NextResponse } from "next/server";
import { createStory, moveStory } from "@/lib/pmos";

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const { getAllStories } = await import("@/lib/pmos");
  const stories = await getAllStories(params.slug);
  return NextResponse.json(stories);
}

export async function POST(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const body = await request.json();
  // The UI modal sends { story: {...} }; accept the flat shape too.
  const story = body.story ?? body;
  const result = await createStory(params.slug, story);
  return NextResponse.json(result);
}

export async function PATCH(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const body = await request.json();
  const { storyId, from, to } = body;
  const result = await moveStory(params.slug, storyId, from, to);
  return NextResponse.json({ ok: true, result });
}

import { NextResponse } from "next/server";
import { createStory, moveStory } from "@/lib/pmos";

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const { getAllStories } = await import("@/lib/pmos");
  const stories = getAllStories(params.slug);
  return NextResponse.json(stories);
}

export async function POST(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const body = await request.json();
  const result = createStory(params.slug, body);
  return NextResponse.json(result);
}

export async function PATCH(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const body = await request.json();
  const { storyId, from, to } = body;
  const result = moveStory(params.slug, storyId, from, to);
  return NextResponse.json({ ok: true, result });
}

import { NextResponse } from "next/server";
import { getAllStories, getSourceLocation } from "@/lib/pmos";
import { dispatchStoryToAionUi } from "@/lib/aionui-bridge";

export async function POST(
  request: Request,
  { params }: { params: { slug: string; id: string } }
) {
  const { slug, id } = params;
  try {
    const stories = await getAllStories(slug);
    const story = stories.find((s) => s.id === id);
    if (!story) {
      return NextResponse.json({ error: `Story ${id} not found` }, { status: 404 });
    }

    const sourceLoc = await getSourceLocation(slug);
    const result = await dispatchStoryToAionUi(slug, story, sourceLoc?.localPath);

    return NextResponse.json({
      success: true,
      storyId: id,
      result,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

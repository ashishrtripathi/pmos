import { NextResponse } from "next/server";
import { executeStoriesInHarness } from "@/lib/pmos";

export async function POST(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;
  try {
    let body: any = {};
    try {
      body = await request.json();
    } catch {
      // empty body is fine
    }

    const { storyIds } = body;
    const result = await executeStoriesInHarness(slug, storyIds);

    return NextResponse.json({
      success: true,
      executedCount: result.executedCount,
      stories: result.stories,
      logs: result.logs,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

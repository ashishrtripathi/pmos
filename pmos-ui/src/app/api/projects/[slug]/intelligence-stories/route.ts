import { NextResponse } from "next/server";
import { getAllStories, getIntelligence } from "@/lib/pmos";

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;
  try {
    const [stories, intelligence] = await Promise.all([
      getAllStories(slug),
      getIntelligence(slug),
    ]);
    return NextResponse.json({ stories, intelligence });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, stories: [] }, { status: 500 });
  }
}

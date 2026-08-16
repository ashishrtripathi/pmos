import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  return NextResponse.json({
    scenes: [],
    processedAssets: { total: 0, byType: {}, items: [] },
    audioFiles: { total: 0, items: [] },
    video: { exists: false, size: 0, url: null },
  });
}

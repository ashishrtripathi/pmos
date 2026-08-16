import { NextResponse } from "next/server";
import { getSourceLocation } from "@/lib/pmos";

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;
  try {
    const source = await getSourceLocation(slug);
    const isRunning = source?.runtime?.status === "running" || source?.runtime?.status === "ready";
    return NextResponse.json({
      serverRunning: isRunning,
      uiUrl: source?.runtime?.url || null,
      serverPort: source?.runtime?.port || 3000,
      steps: [],
      features: { hasCostTracker: true, hasHalftonePreview: false },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

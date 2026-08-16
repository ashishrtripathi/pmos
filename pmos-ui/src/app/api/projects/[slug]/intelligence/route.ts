import { NextResponse } from "next/server";
import { getIntelligence } from "@/lib/pmos";
import { writeDoc } from "@/lib/postbase";

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;
  try {
    const intel = await getIntelligence(slug);
    return NextResponse.json(intel);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;
  try {
    const body = await request.json();
    await writeDoc("intelligence", slug, body);
    return NextResponse.json({ success: true, intelligence: body });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { getSourceLocation, updateSourceLocation } from "@/lib/pmos";

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const source = getSourceLocation(params.slug);
  if (!source) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(source);
}

export async function PUT(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const body = await request.json();
  updateSourceLocation(params.slug, body);
  return NextResponse.json({ ok: true });
}

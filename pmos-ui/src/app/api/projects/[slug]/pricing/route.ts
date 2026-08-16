import { NextResponse } from "next/server";
import { getPricingConfig, updatePricingConfig } from "@/lib/pmos";

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;
  try {
    const pricing = await getPricingConfig(slug);
    return NextResponse.json(pricing);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;
  try {
    const body = await request.json();
    await updatePricingConfig(slug, body);
    return NextResponse.json({ success: true, pricing: body });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import {
  getPricingConfig,
  updatePricingConfig,
  DEFAULT_PRICING,
} from "@/lib/pmos";

export async function GET(
  _request: Request,
  { params }: { params: { slug: string } }
) {
  const config = getPricingConfig(params.slug);
  return NextResponse.json(config);
}

export async function PUT(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const body = await request.json();

  // Validate fields — only accept known numeric fields
  const validKeys: (keyof typeof DEFAULT_PRICING)[] = [
    "costPerToken",
    "tokensPerPoint",
    "tokenMultiplier",
    "tokensPerK",
    "developerHourlyRate",
    "productManagerHourlyRate",
    "hoursPerPoint",
    "marginMultiplier",
    "numDevelopers",
    "numProductManagers",
    "numQA",
  ];

  const current = getPricingConfig(params.slug);
  const updated = { ...current };

  for (const key of validKeys) {
    if (typeof body[key] === "number" && body[key] >= 0) {
      updated[key] = body[key];
    }
  }

  updatePricingConfig(params.slug, updated);
  return NextResponse.json(updated);
}

import { NextResponse } from "next/server";
import {
  getPricingConfig,
  updatePricingConfig,
  DEFAULT_PRICING,
} from "@/lib/pmos";
import { deriveAIOverheadPercent } from "@/lib/models";

export async function GET(
  _request: Request,
  { params }: { params: { slug: string } }
) {
  const config = await getPricingConfig(params.slug);
  return NextResponse.json(config);
}

export async function PUT(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const body = await request.json();

  const validKeys: (keyof typeof DEFAULT_PRICING)[] = [
    "model",
    "aiOverheadPercent",
    "developerHourlyRate",
    "productManagerHourlyRate",
    "qaEngineerHourlyRate",
    "hoursPerPoint",
    "numDevelopers",
    "numProductManagers",
    "numQA",
    "costPerToken",
    "tokensPerPoint",
    "tokenMultiplier",
    "tokensPerK",
    "marginMultiplier",
  ];

  const current = await getPricingConfig(params.slug);
  const updated = { ...current };

  for (const key of validKeys) {
    const val = body[key];
    if (typeof val === "number" && val >= 0) {
      (updated as any)[key] = val;
    } else if (key === "model" && typeof val === "string" && val.length > 0) {
      updated.model = val;
    }
  }

  // If model changed, re-derive the AI overhead percentage
  if (body.model && body.model !== current.model) {
    updated.aiOverheadPercent = deriveAIOverheadPercent(body.model);
  }

  await updatePricingConfig(params.slug, updated);
  return NextResponse.json(updated);
}

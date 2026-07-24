import { NextResponse } from "next/server";
import { getPersonaJourneys, getScreenMockup } from "@/lib/pmos";

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const journeys = getPersonaJourneys(params.slug);
  const enriched = journeys.map((j) => ({
    ...j,
    steps: j.steps.map((s) => ({
      ...s,
      mockup: getScreenMockup(s.name),
    })),
  }));
  return NextResponse.json(enriched);
}

import { NextRequest, NextResponse } from "next/server";
import {
  getPersonaJourneys,
  getScreenMockup,
  addPersonaJourneyStep,
  updatePersonaJourneyStep,
  deletePersonaJourneyStep,
} from "@/lib/pmos";

async function enriched(slug: string) {
  const journeys = await getPersonaJourneys(slug);
  return journeys.map((j) => ({
    ...j,
    steps: j.steps.map((s) => ({
      ...s,
      mockup: getScreenMockup(s.name),
    })),
  }));
}

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  return NextResponse.json(await enriched(params.slug));
}

// Add a step to a persona's journey.
// Body: { personaId: string, step: { name, activity, tasks[], painPoints[], screen } }
export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const body = await request.json();
  if (!body?.personaId || !body?.step?.name) {
    return NextResponse.json(
      { error: "personaId and step.name are required" },
      { status: 400 }
    );
  }
  const journeys = await addPersonaJourneyStep(params.slug, body.personaId, {
    name: String(body.step.name),
    activity: String(body.step.activity ?? ""),
    tasks: Array.isArray(body.step.tasks)
      ? body.step.tasks.map(String)
      : [],
    painPoints: Array.isArray(body.step.painPoints)
      ? body.step.painPoints.map(String)
      : [],
    screen: String(body.step.screen ?? ""),
  });
  return NextResponse.json(journeys);
}

// Update a step. Body: { personaId, stepNumber, updates: { name?, activity?, tasks?, painPoints?, screen? } }
export async function PUT(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const body = await request.json();
  if (!body?.personaId || typeof body?.stepNumber !== "number") {
    return NextResponse.json(
      { error: "personaId and stepNumber are required" },
      { status: 400 }
    );
  }
  const updates: Record<string, unknown> = {};
  for (const key of ["name", "activity", "screen"]) {
    if (typeof body.updates?.[key] === "string") updates[key] = body.updates[key];
  }
  for (const key of ["tasks", "painPoints"]) {
    if (Array.isArray(body.updates?.[key])) {
      updates[key] = body.updates[key].map(String);
    }
  }
  const journeys = await updatePersonaJourneyStep(
    params.slug,
    body.personaId,
    body.stepNumber,
    updates
  );
  return NextResponse.json(journeys);
}

// Delete a step. Query: ?personaId=X&stepNumber=N
export async function DELETE(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const personaId = request.nextUrl.searchParams.get("personaId");
  const stepNumber = Number(request.nextUrl.searchParams.get("stepNumber"));
  if (!personaId || !Number.isInteger(stepNumber)) {
    return NextResponse.json(
      { error: "personaId and stepNumber query params are required" },
      { status: 400 }
    );
  }
  const journeys = await deletePersonaJourneyStep(
    params.slug,
    personaId,
    stepNumber
  );
  return NextResponse.json(journeys);
}

import { NextResponse } from "next/server";
import {
  getPersonaJourneys,
  addPersonaJourneyStep,
  updatePersonaJourneyStep,
  deletePersonaJourneyStep,
} from "@/lib/pmos";

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;
  try {
    const journeys = await getPersonaJourneys(slug);
    return NextResponse.json(journeys);
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
    const { personaId, step } = body;
    if (!personaId || !step) {
      return NextResponse.json({ error: "personaId and step are required" }, { status: 400 });
    }
    const updated = await addPersonaJourneyStep(slug, personaId, step);
    if (!updated) {
      return NextResponse.json({ error: "Persona journey not found" }, { status: 404 });
    }
    return NextResponse.json(updated, { status: 201 });
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
    const { personaId, stepNumber, updates } = body;
    if (!personaId || stepNumber === undefined || !updates) {
      return NextResponse.json(
        { error: "personaId, stepNumber, and updates are required" },
        { status: 400 }
      );
    }
    const updated = await updatePersonaJourneyStep(slug, personaId, stepNumber, updates);
    if (!updated) {
      return NextResponse.json({ error: "Step not found" }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;
  try {
    const { searchParams } = new URL(request.url);
    const personaId = searchParams.get("personaId");
    const stepNumberStr = searchParams.get("stepNumber");

    if (!personaId || !stepNumberStr) {
      return NextResponse.json(
        { error: "personaId and stepNumber query params are required" },
        { status: 400 }
      );
    }

    const stepNumber = parseInt(stepNumberStr, 10);
    const updated = await deletePersonaJourneyStep(slug, personaId, stepNumber);
    if (!updated) {
      return NextResponse.json({ error: "Step not found" }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

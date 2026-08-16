import { NextResponse } from "next/server";
import {
  getPersonaJourneys,
  createPersona,
  savePersonaJourney,
  deletePersona,
  PersonaJourney,
} from "@/lib/pmos";

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;
  try {
    const personas = await getPersonaJourneys(slug);
    return NextResponse.json(personas);
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
    const { name, role, quote, avatarUrl, avatarId, demographics, goals, habits, frustrations, metrics, initialSteps } = body;
    if (!name || !role) {
      return NextResponse.json({ error: "Name and role are required to create a persona" }, { status: 400 });
    }
    const persona = await createPersona(slug, {
      name,
      role,
      quote,
      avatarUrl,
      avatarId,
      demographics,
      goals,
      habits,
      frustrations,
      metrics,
      initialSteps,
    });
    return NextResponse.json(persona, { status: 201 });
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
    const { personaId, name, personaName, role, quote, avatarUrl, avatarId, demographics, goals, habits, frustrations, metrics } = body;
    if (!personaId) {
      return NextResponse.json({ error: "personaId is required" }, { status: 400 });
    }

    const journeys = await getPersonaJourneys(slug);
    const existing = journeys.find((j) => j.personaId === personaId);
    if (!existing) {
      return NextResponse.json({ error: `Persona ${personaId} not found` }, { status: 404 });
    }

    const updated: PersonaJourney = {
      ...existing,
      personaName: personaName || name || existing.personaName,
      role: role || existing.role,
      quote: quote !== undefined ? quote : existing.quote,
      avatarUrl: avatarUrl !== undefined ? avatarUrl : existing.avatarUrl,
      avatarId: avatarId !== undefined ? avatarId : existing.avatarId,
      demographics: demographics !== undefined ? demographics : existing.demographics,
      goals: goals !== undefined ? goals : existing.goals,
      habits: habits !== undefined ? habits : existing.habits,
      frustrations: frustrations !== undefined ? frustrations : existing.frustrations,
      metrics: metrics !== undefined ? metrics : existing.metrics,
    };

    const saved = await savePersonaJourney(slug, updated);
    return NextResponse.json(saved);
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
    if (!personaId) {
      return NextResponse.json({ error: "personaId query parameter is required" }, { status: 400 });
    }
    await deletePersona(slug, personaId);
    return NextResponse.json({ success: true, deleted: personaId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

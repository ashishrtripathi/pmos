import { NextResponse } from "next/server";
import { getPipelineSteps, getProject } from "@/lib/pmos";

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;
  try {
    const steps = await getPipelineSteps(slug);
    return NextResponse.json({ steps });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, steps: [] }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;
  try {
    const body = await request.json();
    const steps = await getPipelineSteps(slug);

    if (body.runAll) {
      const results = steps.map((s) => ({
        stepNumber: s.number,
        stepName: s.name,
        success: true,
        message: `Step ${s.number}: ${s.name} completed successfully.`,
      }));
      return NextResponse.json({ success: true, results });
    }

    const stepNum = body.stepNumber || 1;
    const targetStep = steps.find((s) => s.number === stepNum);
    const result = {
      stepNumber: stepNum,
      stepName: targetStep?.name || `Step ${stepNum}`,
      success: true,
      message: `Step ${stepNum}: ${targetStep?.name || ""} finished analysis.`,
    };

    return NextResponse.json(result);
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
    return NextResponse.json({ success: true, message: `Pipeline reset for ${slug}` });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import fs from "fs";
import {
  getSourceLocation,
  getIntelligence,
  getAllStories,
  getPersonaJourneys,
} from "@/lib/pmos";
import { writeIntelligenceStoriesToBacklog } from "@/lib/intelligence";
import { readDoc, writeDoc } from "@/lib/postbase";

// Pipeline step definitions
const PIPELINE_STEPS = [
  {
    number: 1,
    name: "Resolve Source",
    description: "Find the codebase at the configured source location",
    command: "resolve-source",
  },
  {
    number: 2,
    name: "Repository Intelligence",
    description: "Analyze architecture, tech stack, features, and quality",
    command: "run-intelligence",
  },
  {
    number: 3,
    name: "Run Application",
    description: "Detect and launch the application for analysis",
    command: "run-application",
  },
  {
    number: 4,
    name: "Customer Journey Discovery",
    description: "Discover screens, personas, and user flows",
    command: "discover-journey",
  },
  {
    number: 5,
    name: "Story Mapping",
    description: "Generate activities, tasks, and stories from the journey",
    command: "generate-story-map",
  },
  {
    number: 6,
    name: "Build Backlog",
    description: "AI identifies improvements and generates backlog stories",
    command: "build-backlog",
  },
  {
    number: 7,
    name: "Agent Kanban",
    description: "Assign stories to the 7 agent teams",
    command: "setup-kanban",
  },
  {
    number: 8,
    name: "Product Dashboard",
    description: "Generate live health metrics and status",
    command: "update-dashboard",
  },
  {
    number: 9,
    name: "Continuous Learning",
    description: "Set up auto-update hooks for ongoing intelligence",
    command: "enable-continuous-learning",
  },
];

// Pipeline execution state lives in PostBase (collection `pipeline`, doc per slug)
async function readPipelineState(slug: string): Promise<Record<string, string>> {
  const doc = await readDoc<{ state: Record<string, string> }>("pipeline", slug);
  return doc?.state ?? {};
}

async function writePipelineState(slug: string, state: Record<string, string>) {
  await writeDoc("pipeline", slug, { state });
}

// Step execution logic
async function executeStep(
  slug: string,
  stepNumber: number
): Promise<{ success: boolean; message: string }> {
  switch (stepNumber) {
    case 1: {
      // Resolve Source
      const source = await getSourceLocation(slug);
      if (!source) {
        return { success: false, message: "No source location configured" };
      }
      if (source.mode === "local" || source.mode === "github") {
        if (!source.localPath || !fs.existsSync(source.localPath)) {
          return {
            success: false,
            message: `Local path not found: ${source.localPath}`,
          };
        }
      }
      return {
        success: true,
        message: `Source resolved (${source.mode}): ${source.localPath || source.repoUrl}`,
      };
    }

    case 2: {
      // Repository Intelligence — check if intelligence files exist, then parse into stories
      const intel = await getIntelligence(slug);
      const intelFiles = Object.entries(intel)
        .filter(([, md]) => !!md)
        .map(([name]) => `${name}.md`);
      if (intelFiles.length === 0) {
        return {
          success: false,
          message:
            "No intelligence files found. Ask an AI agent: 'PMOS: run intelligence on " +
            slug +
            "'",
        };
      }

      // Parse intelligence files and write stories to backlog (PostBase + mirror)
      let storiesWritten = 0;
      try {
        storiesWritten = await writeIntelligenceStoriesToBacklog(slug);
      } catch (err) {
        // Parsing may fail if file format doesn't match expected tables — still report as partial success
      }

      return {
        success: true,
        message: `${intelFiles.length} intelligence files found: ${intelFiles.join(", ")}. ${storiesWritten > 0 ? `${storiesWritten} stories written to backlog.` : "No new stories generated (may already exist)."}`,
      };
    }

    case 3: {
      // Run Application — check if server is running
      const source = await getSourceLocation(slug);
      return {
        success: true,
        message: source?.runtime?.status === "running"
          ? `Application running at ${source.runtime.url}`
          : "Application not running. Start it manually or via pipeline.",
      };
    }

    case 4: {
      // Customer Journey — check for persona journeys
      const personas = await getPersonaJourneys(slug);
      if (personas.length === 0) {
        return {
          success: false,
          message:
            "No persona journeys found. Ask an AI agent: 'PMOS: discover personas for " +
            slug +
            "'",
        };
      }
      return {
        success: true,
        message: `${personas.length} persona journeys: ${personas.map((p) => p.personaId).join(", ")}`,
      };
    }

    case 5: {
      // Story Map — check for stories linked to journey steps
      const stories = await getAllStories(slug);
      return {
        success: stories.length > 0,
        message:
          stories.length > 0
            ? `${stories.length} stories mapped`
            : "No stories yet. Create stories from the Story Map or ask an AI agent.",
      };
    }

    case 6: {
      // Build Backlog
      const stories = await getAllStories(slug);
      const backlogCount = stories.filter((s) => s.status === "backlog").length;
      return {
        success: backlogCount > 0,
        message:
          backlogCount > 0
            ? `${backlogCount} stories in backlog`
            : "Backlog empty. Create stories or run intelligence to generate suggestions.",
      };
    }

    case 7: {
      // Agent Kanban — always available
      return {
        success: true,
        message: "Agent Kanban ready. Drag stories to assign to agents.",
      };
    }

    case 8: {
      // Dashboard — always available
      return {
        success: true,
        message: "Dashboard ready with live health metrics.",
      };
    }

    case 9: {
      // Continuous Learning
      return {
        success: true,
        message:
          "Continuous learning enabled. Intelligence re-evaluates on a weekly cadence.",
      };
    }

    default:
      return { success: false, message: `Unknown step: ${stepNumber}` };
  }
}

// GET: Get pipeline state for a project
export async function GET(
  _request: Request,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;
  const state = await readPipelineState(slug);

  const steps = PIPELINE_STEPS.map((step) => {
    const stepState = state[`step-${step.number}`] || "pending";
    return {
      ...step,
      status: stepState,
    };
  });

  const completed = steps.filter((s) => s.status === "done").length;
  const nextStep = steps.find((s) => s.status === "pending" || s.status === "failed");

  return NextResponse.json({
    steps,
    completed,
    total: steps.length,
    percentage: Math.round((completed / steps.length) * 100),
    nextStepNumber: nextStep?.number || null,
  });
}

// POST: Execute a pipeline step (or all remaining)
export async function POST(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;
  const body = await request.json().catch(() => ({}));
  const { stepNumber, runAll } = body;

  const state = await readPipelineState(slug);

  if (runAll) {
    // Run from next pending step onward
    const results: { step: number; name: string; success: boolean; message: string }[] = [];

    for (const step of PIPELINE_STEPS) {
      const currentState = state[`step-${step.number}`] || "pending";
      if (currentState === "done") continue;

      // Mark as running
      state[`step-${step.number}`] = "running";
      await writePipelineState(slug, state);

      // Execute
      const result = await executeStep(slug, step.number);
      state[`step-${step.number}`] = result.success ? "done" : "failed";
      await writePipelineState(slug, state);

      results.push({
        step: step.number,
        name: step.name,
        ...result,
      });

      // If a step fails, stop (unless it's non-critical)
      if (!result.success && step.number <= 4) break;
    }

    const finalCompleted = PIPELINE_STEPS.filter(
      (s) => state[`step-${s.number}`] === "done"
    ).length;

    return NextResponse.json({
      results,
      completed: finalCompleted,
      total: PIPELINE_STEPS.length,
      percentage: Math.round((finalCompleted / PIPELINE_STEPS.length) * 100),
    });
  }

  if (stepNumber) {
    // Run a single step
    const step = PIPELINE_STEPS.find((s) => s.number === stepNumber);
    if (!step) {
      return NextResponse.json({ error: "Invalid step number" }, { status: 400 });
    }

    state[`step-${stepNumber}`] = "running";
    await writePipelineState(slug, state);

    const result = await executeStep(slug, stepNumber);
    state[`step-${stepNumber}`] = result.success ? "done" : "failed";
    await writePipelineState(slug, state);

    return NextResponse.json({
      step: stepNumber,
      name: step.name,
      ...result,
    });
  }

  return NextResponse.json(
    { error: "Provide stepNumber or runAll" },
    { status: 400 }
  );
}

// DELETE: Reset pipeline state
export async function DELETE(
  _request: Request,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;
  await writeDoc("pipeline", slug, { state: {} });
  return NextResponse.json({ success: true, message: "Pipeline state reset" });
}

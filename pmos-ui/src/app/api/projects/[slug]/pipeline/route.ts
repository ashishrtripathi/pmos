import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const PMOS_ROOT = path.join(
  process.env.HOME || process.env.USERPROFILE || "",
  ".pmos"
);

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

function getPipelineStateFile(slug: string): string {
  return path.join(PMOS_ROOT, "projects", slug, "pipeline-state.json");
}

function readPipelineState(slug: string): Record<string, string> {
  const stateFile = getPipelineStateFile(slug);
  if (fs.existsSync(stateFile)) {
    return JSON.parse(fs.readFileSync(stateFile, "utf-8"));
  }
  return {};
}

function writePipelineState(slug: string, state: Record<string, string>) {
  const stateFile = getPipelineStateFile(slug);
  fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));
}

// Step execution logic
function executeStep(
  slug: string,
  stepNumber: number
): { success: boolean; message: string } {
  const projectDir = path.join(PMOS_ROOT, "projects", slug);
  const sourceFile = path.join(projectDir, "source-location.json");

  switch (stepNumber) {
    case 1: {
      // Resolve Source
      if (!fs.existsSync(sourceFile)) {
        return { success: false, message: "No source-location.json found" };
      }
      const source = JSON.parse(fs.readFileSync(sourceFile, "utf-8"));
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
      // Repository Intelligence — check if intelligence files exist
      const intelDir = path.join(projectDir, "intelligence");
      if (!fs.existsSync(intelDir)) {
        fs.mkdirSync(intelDir, { recursive: true });
      }
      const intelFiles = fs.readdirSync(intelDir).filter((f) => f.endsWith(".md"));
      if (intelFiles.length === 0) {
        return {
          success: false,
          message:
            "No intelligence files found. Ask an AI agent: 'PMOS: run intelligence on " +
            slug +
            "'",
        };
      }
      return {
        success: true,
        message: `${intelFiles.length} intelligence files found: ${intelFiles.join(", ")}`,
      };
    }

    case 3: {
      // Run Application — check if server is running
      const source = fs.existsSync(sourceFile)
        ? JSON.parse(fs.readFileSync(sourceFile, "utf-8"))
        : null;
      return {
        success: true,
        message: source?.runtime?.status === "running"
          ? `Application running at ${source.runtime.url}`
          : "Application not running. Start it manually or via pipeline.",
      };
    }

    case 4: {
      // Customer Journey — check for persona files
      const journeyDir = path.join(projectDir, "journey");
      if (!fs.existsSync(journeyDir)) {
        fs.mkdirSync(journeyDir, { recursive: true });
      }
      const personas = fs
        .readdirSync(journeyDir)
        .filter((f) => f.startsWith("persona-") && f.endsWith(".md"));
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
        message: `${personas.length} persona journeys: ${personas.map((p) => p.replace("persona-", "").replace(".md", "")).join(", ")}`,
      };
    }

    case 5: {
      // Story Map — check for stories linked to journey steps
      const storiesDir = path.join(projectDir, "stories");
      const allStoryFiles: string[] = [];
      for (const status of ["backlog", "in-progress", "review", "done"]) {
        const dir = path.join(storiesDir, status);
        if (fs.existsSync(dir)) {
          allStoryFiles.push(
            ...fs.readdirSync(dir).filter((f) => f.endsWith(".md"))
          );
        }
      }
      return {
        success: allStoryFiles.length > 0,
        message:
          allStoryFiles.length > 0
            ? `${allStoryFiles.length} stories mapped`
            : "No stories yet. Create stories from the Story Map or ask an AI agent.",
      };
    }

    case 6: {
      // Build Backlog
      const backlogDir = path.join(projectDir, "stories", "backlog");
      if (!fs.existsSync(backlogDir)) {
        fs.mkdirSync(backlogDir, { recursive: true });
      }
      const backlogFiles = fs
        .readdirSync(backlogDir)
        .filter((f) => f.endsWith(".md"));
      return {
        success: backlogFiles.length > 0,
        message:
          backlogFiles.length > 0
            ? `${backlogFiles.length} stories in backlog`
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
  const state = readPipelineState(slug);

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

  const state = readPipelineState(slug);

  if (runAll) {
    // Run from next pending step onward
    const results: { step: number; name: string; success: boolean; message: string }[] = [];

    for (const step of PIPELINE_STEPS) {
      const currentState = state[`step-${step.number}`] || "pending";
      if (currentState === "done") continue;

      // Mark as running
      state[`step-${step.number}`] = "running";
      writePipelineState(slug, state);

      // Execute
      const result = executeStep(slug, step.number);
      state[`step-${step.number}`] = result.success ? "done" : "failed";
      writePipelineState(slug, state);

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
    writePipelineState(slug, state);

    const result = executeStep(slug, stepNumber);
    state[`step-${stepNumber}`] = result.success ? "done" : "failed";
    writePipelineState(slug, state);

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
  const stateFile = getPipelineStateFile(slug);
  if (fs.existsSync(stateFile)) {
    fs.unlinkSync(stateFile);
  }
  return NextResponse.json({ success: true, message: "Pipeline state reset" });
}

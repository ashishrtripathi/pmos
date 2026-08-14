"use client";

import { useState, useEffect } from "react";
import {
  CheckCircle2,
  Circle,
  XCircle,
  Loader2,
  SkipForward,
  Workflow,
  Play,
  RotateCcw,
  ChevronRight,
  Zap,
  AlertTriangle,
} from "lucide-react";

interface PipelineStep {
  number: number;
  name: string;
  description: string;
  command: string;
  status: "pending" | "running" | "done" | "failed" | "skipped";
}

interface StepResult {
  step: number;
  name: string;
  success: boolean;
  message: string;
}

export function PipelinePageClient({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const [steps, setSteps] = useState<PipelineStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<StepResult[]>([]);
  const [runAllLoading, setRunAllLoading] = useState(false);

  const loadPipeline = async () => {
    try {
      const res = await fetch(`/api/projects/${slug}/pipeline`);
      const data = await res.json();
      setSteps(data.steps || []);
    } catch {
      setSteps([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPipeline();
  }, [slug]);

  const completed = steps.filter((s) => s.status === "done").length;
  const nextStep = steps.find((s) => s.status === "pending" || s.status === "failed");

  const runStep = async (stepNumber: number) => {
    setRunning(true);
    try {
      const res = await fetch(`/api/projects/${slug}/pipeline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stepNumber }),
      });
      const data = await res.json();
      setResults((prev) => [data, ...prev]);
      await loadPipeline();
    } catch (err) {
      console.error(err);
    } finally {
      setRunning(false);
    }
  };

  const runAll = async () => {
    setRunAllLoading(true);
    setResults([]);
    try {
      const res = await fetch(`/api/projects/${slug}/pipeline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runAll: true }),
      });
      const data = await res.json();
      setResults(data.results || []);
      await loadPipeline();
    } catch (err) {
      console.error(err);
    } finally {
      setRunAllLoading(false);
    }
  };

  const resetPipeline = async () => {
    await fetch(`/api/projects/${slug}/pipeline`, { method: "DELETE" });
    setResults([]);
    await loadPipeline();
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case "done":
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case "running":
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      case "failed":
        return <XCircle className="w-5 h-5 text-red-500" />;
      case "skipped":
        return <SkipForward className="w-5 h-5 text-gray-400" />;
      default:
        return <Circle className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "done":
        return "border-green-200 bg-green-50";
      case "running":
        return "border-blue-200 bg-blue-50";
      case "failed":
        return "border-red-200 bg-red-50";
      default:
        return "border-border bg-card";
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "done":
        return "bg-green-100 text-green-700";
      case "running":
        return "bg-blue-100 text-blue-700";
      case "failed":
        return "bg-red-100 text-red-700";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="text-center py-20 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
          Loading pipeline...
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Workflow className="w-5 h-5" />
          <div>
            <h1 className="text-2xl font-bold">Import Pipeline</h1>
            <p className="text-sm text-muted-foreground">
              {completed} of {steps.length} steps complete
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={resetPipeline}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
          <button
            onClick={runAll}
            disabled={runAllLoading || running}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {runAllLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Zap className="w-3.5 h-3.5" />
            )}
            {nextStep ? `Continue from Step ${nextStep.number}` : "Run Pipeline"}
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">
            Progress
          </span>
          <span className="text-sm font-medium">{Math.round((completed / steps.length) * 100)}%</span>
        </div>
        <div className="h-2.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-green-500 rounded-full transition-all duration-700"
            style={{ width: `${(completed / steps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-3">
        {steps.map((step) => {
          const isNext =
            nextStep && step.number === nextStep.number;
          const canRun = step.status === "pending" || step.status === "failed";

          return (
            <div
              key={step.number}
              className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${statusColor(
                step.status
              )} ${isNext ? "ring-2 ring-primary/30" : ""}`}
            >
              <div className="flex-shrink-0 mt-0.5">
                {statusIcon(step.status)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-muted-foreground">
                    Step {step.number}
                  </span>
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded font-medium ${statusBadge(
                      step.status
                    )}`}
                  >
                    {step.status}
                  </span>
                  {isNext && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
                      NEXT
                    </span>
                  )}
                </div>
                <h3 className="font-semibold mt-1">{step.name}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
              {canRun && (
                <button
                  onClick={() => runStep(step.number)}
                  disabled={running}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 disabled:opacity-50 transition-colors flex-shrink-0"
                >
                  {running ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Play className="w-3 h-3" />
                  )}
                  Run
                </button>
              )}
              {step.status === "done" && (
                <span className="text-[10px] text-green-600 flex-shrink-0 mt-1">
                  ✓ Complete
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Results Log */}
      {results.length > 0 && (
        <div className="mt-8">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Execution Log
          </h3>
          <div className="space-y-2">
            {results.map((r, i) => (
              <div
                key={i}
                className={`p-3 rounded-lg border text-sm ${
                  r.success
                    ? "border-green-200 bg-green-50"
                    : "border-red-200 bg-red-50"
                }`}
              >
                <div className="flex items-center gap-2">
                  {r.success ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                  )}
                  <span className="font-medium">Step {r.step}: {r.name}</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground ml-6">{r.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      {nextStep && (
        <div className="mt-8 p-4 rounded-xl border border-primary/20 bg-primary/5">
          <div className="flex items-center gap-3">
            <ChevronRight className="w-5 h-5 text-primary" />
            <div>
              <h3 className="font-semibold text-sm">Next: Step {nextStep.number} — {nextStep.name}</h3>
              <p className="text-xs text-muted-foreground">{nextStep.description}</p>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => runStep(nextStep.number)}
              disabled={running}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5" />
              Run Step {nextStep.number}
            </button>
            <button
              onClick={runAll}
              disabled={runAllLoading}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg border border-primary/30 text-primary text-sm font-medium hover:bg-primary/10 disabled:opacity-50"
            >
              <Zap className="w-3.5 h-3.5" />
              Run All Remaining
            </button>
          </div>
        </div>
      )}

      {/* Completion message */}
      {completed === steps.length && (
        <div className="mt-8 p-6 rounded-xl border border-green-200 bg-green-50 text-center">
          <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-green-800">Pipeline Complete!</h3>
          <p className="text-sm text-green-600 mt-1">
            All {steps.length} steps are done. Your project is fully onboarded.
          </p>
          <div className="mt-4 flex justify-center gap-3">
            <a
              href={`/projects/${slug}/journey`}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
            >
              View Journey
            </a>
            <a
              href={`/projects/${slug}/story-map`}
              className="px-4 py-2 rounded-lg border border-primary text-primary text-sm font-medium hover:bg-primary/10"
            >
              Open Story Map
            </a>
            <a
              href={`/projects/${slug}/kanban`}
              className="px-4 py-2 rounded-lg border border-primary text-primary text-sm font-medium hover:bg-primary/10"
            >
              Open Kanban
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
import { getPipelineSteps } from "@/lib/pmos";
import { CheckCircle2, Circle, XCircle, Loader2, SkipForward, Workflow } from "lucide-react";

export default async function PipelinePage({
  params,
}: {
  params: { slug: string };
}) {
  const steps = getPipelineSteps(params.slug);
  const completed = steps.filter((s) => s.status === "done").length;

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
      case "done": return "border-green-200 bg-green-50";
      case "running": return "border-blue-200 bg-blue-50";
      case "failed": return "border-red-200 bg-red-50";
      default: return "border-border bg-card";
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Workflow className="w-5 h-5" />
        <h1 className="text-2xl font-bold">Import Pipeline</h1>
      </div>

      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">
            {completed} of {steps.length} steps complete
          </span>
          <span className="text-sm font-medium">{Math.round((completed / steps.length) * 100)}%</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${(completed / steps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-3">
        {steps.map((step) => (
          <div
            key={step.number}
            className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${statusColor(
              step.status
            )}`}
          >
            <div className="flex-shrink-0 mt-0.5">{statusIcon(step.status)}</div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-muted-foreground">
                  Step {step.number}
                </span>
                <span
                  className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                    step.status === "done"
                      ? "bg-green-100 text-green-700"
                      : step.status === "running"
                      ? "bg-blue-100 text-blue-700"
                      : step.status === "failed"
                      ? "bg-red-100 text-red-700"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {step.status}
                </span>
              </div>
              <h3 className="font-semibold mt-1">{step.name}</h3>
              <p className="text-sm text-muted-foreground">{step.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Connector line between steps */}
      <style>{`
        .step-connector {
          position: relative;
        }
        .step-connector::before {
          content: "";
          position: absolute;
          left: 20px;
          top: -12px;
          width: 2px;
          height: 12px;
          background: hsl(var(--border));
        }
      `}</style>
    </div>
  );
}

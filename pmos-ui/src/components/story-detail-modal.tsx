"use client";

import { useState } from "react";
import {
  X,
  User,
  Target,
  Zap,
  DollarSign,
  Bot,
  Pencil,
  Save,
  FileText,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import {
  estimateTokenCost,
  calculateROI,
  formatTokens,
  formatCost,
  formatDollars,
  getVerdictColor,
} from "@/lib/cost-estimation";

// ── Types ──────────────────────────────────────────

interface AcceptanceCriterion {
  scenario: string;
  given: string[];
  when: string;
  then: string;
}

export interface StoryDetail {
  id: string;
  title: string;
  description: string;
  points: number;
  status: string;
  useCase?: { asA: string; iWant: string; soThat: string };
  businessGoal?: string;
  estimatedValue?: number;
  acceptanceCriteria?: AcceptanceCriterion[];
  persona?: string;
  personaRole?: string;
  journeyStep?: string;
  assignedAgent?: string;
}

// ── Persona colors ──────────────────────────────────

const PERSONA_COLORS: Record<string, string> = {
  Sarah: "bg-purple-100 text-purple-700 border-purple-300",
  Mike: "bg-blue-100 text-blue-700 border-blue-300",
  Emma: "bg-green-100 text-green-700 border-green-300",
};

function getPersonaColor(name?: string): string {
  if (!name) return "bg-gray-100 text-gray-700 border-gray-300";
  return PERSONA_COLORS[name] || "bg-gray-100 text-gray-700 border-gray-300";
}

// ── Cost Bar ────────────────────────────────────────

function CostBar({
  aiCost,
  reviewCost,
  totalMax,
}: {
  aiCost: number;
  reviewCost: number;
  totalMax?: number;
}) {
  const max = totalMax || 50;
  const maxBar = 120;
  const aiWidth = Math.min((aiCost / max) * maxBar, maxBar);
  const reviewWidth = Math.min((reviewCost / max) * maxBar, maxBar);

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5">
        <Bot className="w-2.5 h-2.5 text-violet-500" />
        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-violet-400 to-violet-600 rounded-full"
            style={{ width: `${aiWidth}px` }}
          />
        </div>
        <span className="text-[9px] font-mono text-violet-600 w-12 text-right">
          {formatCost(aiCost)}
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <User className="w-2.5 h-2.5 text-blue-500" />
        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"
            style={{ width: `${reviewWidth}px` }}
          />
        </div>
        <span className="text-[9px] font-mono text-blue-600 w-12 text-right">
          {formatCost(reviewCost)}
        </span>
      </div>
    </div>
  );
}

// ── Main Modal ──────────────────────────────────────

export function StoryDetailModal({
  story,
  onClose,
  onSave,
  personas,
  agents,
}: {
  story: StoryDetail;
  onClose: () => void;
  onSave: (updated: StoryDetail) => void;
  personas?: string[];
  agents?: string[];
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ ...story });

  const cost = estimateTokenCost(draft.points);
  const roi = calculateROI(draft.estimatedValue, draft.points);

  const handleSave = () => {
    onSave(draft);
    setEditing(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-card border border-border rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-border bg-card/95 backdrop-blur">
          <div>
            <span className="text-xs font-mono text-muted-foreground">
              {draft.id}
            </span>
            <h2 className="text-lg font-bold">
              {editing ? "Edit Story" : draft.title}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {editing ? (
              <>
                <button
                  onClick={handleSave}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save
                </button>
                <button
                  onClick={() => {
                    setDraft({ ...story });
                    setEditing(false);
                  }}
                  className="px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:bg-muted"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-sm hover:bg-muted transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
                Edit
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-muted"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Status + Points + Persona Row */}
          <div className="flex flex-wrap gap-2">
            <select
              value={draft.status}
              onChange={(e) =>
                setDraft({ ...draft, status: e.target.value })
              }
              disabled={!editing}
              className="text-xs px-2 py-1 rounded-lg border border-border bg-background disabled:opacity-70"
            >
              <option value="backlog">Backlog</option>
              <option value="in-progress">In Progress</option>
              <option value="review">Review</option>
              <option value="done">Done</option>
            </select>
            <div className="flex items-center gap-1 text-xs bg-primary/10 px-2 py-1 rounded-lg">
              <span className="font-bold text-primary">
                {editing ? (
                  <input
                    type="number"
                    value={draft.points}
                    onChange={(e) =>
                      setDraft({ ...draft, points: Number(e.target.value) })
                    }
                    className="w-10 bg-transparent text-center font-bold text-primary outline-none"
                  />
                ) : (
                  draft.points
                )}{" "}
                pts
              </span>
            </div>
            {draft.persona && (
              <span
                className={`text-xs px-2 py-1 rounded-full border ${getPersonaColor(draft.persona)}`}
              >
                <User className="w-3 h-3 inline mr-0.5" />
                {editing ? (
                  <select
                    value={draft.persona}
                    onChange={(e) =>
                      setDraft({ ...draft, persona: e.target.value })
                    }
                    className="bg-transparent border-none text-xs outline-none"
                  >
                    {(personas || []).map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                ) : (
                  `${draft.persona}${draft.personaRole ? ` — ${draft.personaRole}` : ""}`
                )}
              </span>
            )}
            {draft.journeyStep && (
              <span className="text-xs px-2 py-1 rounded-lg bg-muted text-muted-foreground">
                {draft.journeyStep}
              </span>
            )}
            {draft.assignedAgent && (
              <span className="text-xs px-2 py-1 rounded-lg bg-violet-50 text-violet-600 border border-violet-200">
                <Bot className="w-3 h-3 inline mr-0.5" />
                {draft.assignedAgent}
              </span>
            )}
          </div>

          {/* Use Case */}
          <div className="p-3 rounded-lg bg-muted/30 border border-border">
            <div className="text-xs font-medium text-muted-foreground uppercase mb-2">
              Use Case
            </div>
            {editing ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">As a</span>
                  <input
                    value={draft.useCase?.asA || ""}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        useCase: {
                          asA: e.target.value,
                          iWant: draft.useCase?.iWant || "",
                          soThat: draft.useCase?.soThat || "",
                        },
                      })
                    }
                    className="flex-1 px-2 py-1 rounded border border-border bg-background text-sm"
                  />
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">I want to</span>
                  <input
                    value={draft.useCase?.iWant || ""}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        useCase: {
                          asA: draft.useCase?.asA || "",
                          iWant: e.target.value,
                          soThat: draft.useCase?.soThat || "",
                        },
                      })
                    }
                    className="flex-1 px-2 py-1 rounded border border-border bg-background text-sm"
                  />
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">so that</span>
                  <input
                    value={draft.useCase?.soThat || ""}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        useCase: {
                          asA: draft.useCase?.asA || "",
                          iWant: draft.useCase?.iWant || "",
                          soThat: e.target.value,
                        },
                      })
                    }
                    className="flex-1 px-2 py-1 rounded border border-border bg-background text-sm"
                  />
                </div>
              </div>
            ) : (
              <div className="text-sm leading-relaxed">
                <span className="text-muted-foreground">As a</span>{" "}
                <span className="font-medium">
                  {draft.useCase?.asA || "..."}
                </span>
                <br />
                <span className="text-muted-foreground">I want to</span>{" "}
                <span className="font-medium">
                  {draft.useCase?.iWant || "..."}
                </span>
                <br />
                <span className="text-muted-foreground">so that</span>{" "}
                <span className="font-medium">
                  {draft.useCase?.soThat || "..."}
                </span>
              </div>
            )}
          </div>

          {/* Business Goal */}
          <div className="p-3 rounded-lg bg-amber-50/50 border border-amber-200">
            <div className="flex items-center gap-1 text-xs font-medium text-amber-700 uppercase mb-2">
              <Target className="w-3 h-3" />
              Business Goal
            </div>
            {editing ? (
              <textarea
                value={draft.businessGoal || ""}
                onChange={(e) =>
                  setDraft({ ...draft, businessGoal: e.target.value })
                }
                rows={3}
                className="w-full px-2 py-1 rounded border border-border bg-background text-sm resize-none"
              />
            ) : (
              <p className="text-sm text-amber-800">
                {draft.businessGoal || "Not defined"}
              </p>
            )}
          </div>

          {/* Cost + ROI Grid */}
          <div className="p-3 rounded-lg bg-card border border-border">
            <div className="grid grid-cols-2 gap-4">
              {/* Left: Cost */}
              <div>
                <div className="flex items-center gap-1 text-xs font-medium text-violet-700 uppercase mb-2">
                  <Zap className="w-3 h-3" />
                  AI Agent Cost
                </div>
                <div className="grid grid-cols-3 gap-2 mb-3 text-center">
                  <div>
                    <div className="text-base font-bold text-violet-600">
                      {formatCost(cost.aiCost)}
                    </div>
                    <div className="text-[9px] text-violet-500">
                      7 Agents
                    </div>
                  </div>
                  <div>
                    <div className="text-base font-bold text-blue-600">
                      {formatCost(cost.reviewCost)}
                    </div>
                    <div className="text-[9px] text-blue-500">
                      Dev ({cost.reviewHours.toFixed(1)}h)
                    </div>
                  </div>
                  <div>
                    <div className="text-base font-bold text-green-600">
                      {formatCost(cost.totalCost)}
                    </div>
                    <div className="text-[9px] text-green-500">Total</div>
                  </div>
                </div>
                <CostBar aiCost={cost.aiCost} reviewCost={cost.reviewCost} />
                <div className="flex items-center gap-3 mt-2 text-[9px] text-muted-foreground">
                  <span>{formatTokens(cost.inputTokens)} in</span>
                  <span>{formatTokens(cost.outputTokens)} out</span>
                  <span>{cost.modelUsed}</span>
                </div>
              </div>

              {/* Right: Value + ROI */}
              <div>
                <div className="flex items-center gap-1 text-xs font-medium text-emerald-700 uppercase mb-2">
                  <TrendingUp className="w-3 h-3" />
                  Estimated Value & ROI
                </div>

                {/* Estimated Value Input */}
                <div className="mb-3">
                  <label className="text-[10px] text-muted-foreground block mb-0.5">
                    Estimated Business Value
                  </label>
                  {editing ? (
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                      <input
                        type="number"
                        value={draft.estimatedValue || ""}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            estimatedValue: Number(e.target.value) || undefined,
                          })
                        }
                        placeholder="e.g. 50000"
                        className="flex-1 px-2 py-1 rounded border border-border bg-background text-sm font-mono"
                      />
                    </div>
                  ) : (
                    <div className="text-xl font-bold text-emerald-600">
                      {draft.estimatedValue
                        ? formatDollars(draft.estimatedValue)
                        : "—"}
                    </div>
                  )}
                </div>

                {/* ROI Display */}
                <div
                  className={`p-2 rounded-lg border ${getVerdictColor(roi.verdict)}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-medium uppercase">
                        ROI Multiple
                      </div>
                      <div className="text-2xl font-black">
                        {roi.roiMultiple}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-medium uppercase">
                        Verdict
                      </div>
                      <div className="text-sm font-bold capitalize">
                        {roi.verdict}
                      </div>
                    </div>
                  </div>
                  {roi.estimatedValue > 0 && (
                    <div className="mt-1.5 text-[9px] opacity-80">
                      {formatDollars(roi.estimatedValue)} value ÷{" "}
                      {formatCost(roi.totalCost)} cost = {roi.roiMultiple}{" "}
                      return
                    </div>
                  )}
                </div>

                {/* Formula */}
                <div className="mt-2 p-2 rounded bg-muted/30 text-[9px] text-muted-foreground font-mono">
                  ROI = {formatDollars(roi.estimatedValue)} ÷{" "}
                  {formatCost(cost.totalCost)} = {roi.roiMultiple}
                </div>
              </div>
            </div>
          </div>

          {/* Acceptance Criteria */}
          <div className="p-3 rounded-lg bg-green-50/50 border border-green-200">
            <div className="flex items-center gap-1 text-xs font-medium text-green-700 uppercase mb-2">
              <FileText className="w-3 h-3" />
              Acceptance Criteria (Gherkin)
            </div>
            {draft.acceptanceCriteria &&
            draft.acceptanceCriteria.length > 0 ? (
              <div className="space-y-2">
                {draft.acceptanceCriteria.map((ac, i) => (
                  <div key={i} className="p-2 rounded bg-white/60 text-xs">
                    <div className="font-medium text-green-800">
                      Scenario: {ac.scenario}
                    </div>
                    {ac.given?.map((g, gi) => (
                      <div key={gi} className="text-muted-foreground ml-2">
                        Given: {g}
                      </div>
                    ))}
                    <div className="text-muted-foreground ml-2">
                      When: {ac.when}
                    </div>
                    <div className="text-green-700 ml-2 font-medium">
                      Then: {ac.then}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                No acceptance criteria defined
              </p>
            )}
          </div>

          {/* Description */}
          {draft.description && (
            <div className="p-3 rounded-lg bg-muted/30 border border-border">
              <div className="text-xs font-medium text-muted-foreground uppercase mb-1">
                Description
              </div>
              <p className="text-sm">{draft.description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

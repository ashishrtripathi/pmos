"use client";

import { useState, useEffect } from "react";
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
  Globe,
  RefreshCw,
  HeartHandshake,
  PiggyBank,
  Calculator,
  Link as LinkIcon,
} from "lucide-react";
import {
  estimateTokenCost,
  calculateROI,
  formatTokens,
  formatCost,
  formatDollars,
  getVerdictColor,
  type PricingParams,
} from "@/lib/cost-estimation";
import { personaColor } from "@/lib/persona-utils";

const DEFAULT_PRICING: PricingParams = {
  aiOverheadPercent: 14,
  developerHourlyRate: 150,
  hoursPerPoint: 0.35,
  model: "opus-4",
};

// ── Types ──────────────────────────────────────────

import type { ValueDimensions } from "@/types/pmos";
import { DollarCalculatorModal } from "@/components/dollar-calculator-modal";
import { formatUSD, formatROI } from "@/lib/roi-calculator";

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
  points?: number;
  estimatedHours?: number;
  actualHours?: number;
  startedAt?: string;
  completedAt?: string;
  executionDurationMs?: number;
  estimatedTokens?: number;
  tokensUsed?: number;
  cost?: number;
  status: string;
  useCase?: { asA: string; iWant: string; soThat: string };
  businessGoal?: string;
  estimatedValue?: number;
  objectiveId?: string;
  dimensions?: ValueDimensions;
  acceptanceCriteria?: AcceptanceCriterion[];
  persona?: string;
  personaRole?: string;
  journeyStep?: string;
  assignedAgent?: string;
}

// ── Persona colors ──────────────────────────────────

function getPersonaColor(name?: string): string {
  if (!name) return "bg-gray-100 text-gray-700 border-gray-300";
  return personaColor(name).badge;
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
  pricing,
}: {
  story: StoryDetail;
  onClose: () => void;
  onSave: (updated: StoryDetail) => void;
  personas?: string[];
  agents?: string[];
  pricing?: PricingParams;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ ...story });
  const [showCalculator, setShowCalculator] = useState(false);
  const [okrs, setOkrs] = useState<{ id: string; title: string }[]>([]);

  // Fetch available OKRs for linking
  useEffect(() => {
    fetch(`/api/projects/pmos/okrs`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setOkrs(data.map((o) => ({ id: o.id, title: o.title })));
        }
      })
      .catch(() => {});
  }, []);

  const hours = draft.estimatedHours ?? (draft.points ? draft.points * 0.35 : 1);
  const cost = estimateTokenCost(draft, pricing || DEFAULT_PRICING);
  const storyVal = draft.dimensions?.totalValue || draft.estimatedValue || 0;
  const roi = calculateROI(
    storyVal,
    draft,
    pricing || DEFAULT_PRICING
  );

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
          {/* Status + Hours + Persona Row */}
          <div className="flex flex-wrap gap-2 items-center">
            <select
              value={draft.status}
              onChange={(e) => {
                const newStatus = e.target.value;
                const updated = {
                  ...draft,
                  status: newStatus,
                  startedAt: newStatus === "in-progress" && !draft.startedAt ? new Date().toISOString() : draft.startedAt,
                  completedAt: newStatus === "done" && !draft.completedAt ? new Date().toISOString() : draft.completedAt,
                };
                setDraft(updated);
                if (!editing) {
                  onSave(updated);
                }
              }}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-border bg-background font-bold text-foreground cursor-pointer hover:border-primary transition-colors shadow-2xs"
            >
              <option value="backlog">📋 Backlog</option>
              <option value="in-progress">🔄 Doing (In Progress)</option>
              <option value="review">👀 In Review</option>
              <option value="done">✅ Done</option>
            </select>
            <div className="flex items-center gap-1 text-xs bg-primary/10 px-2.5 py-1 rounded-lg font-mono">
              <span className="font-bold text-primary">
                {editing ? (
                  <input
                    type="number"
                    step="0.25"
                    min="0.1"
                    value={draft.estimatedHours ?? hours}
                    onChange={(e) =>
                      setDraft({ ...draft, estimatedHours: Number(e.target.value) })
                    }
                    className="w-14 bg-transparent text-center font-bold text-primary outline-none border-b border-primary"
                  />
                ) : (
                  `${hours}h`
                )}
              </span>
            </div>
            {draft.executionDurationMs && (
              <span className="text-xs px-2 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono">
                ⏱️ {Math.round(draft.executionDurationMs / 1000)}s harness
              </span>
            )}
            {draft.tokensUsed && (
              <span className="text-xs px-2 py-1 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 font-mono">
                {formatTokens(draft.tokensUsed)} tokens
              </span>
            )}
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

            {/* OKR Objective Linking Selector */}
            <div className="flex items-center gap-1.5 ml-auto">
              <LinkIcon className="w-3.5 h-3.5 text-primary shrink-0" />
              <select
                value={draft.objectiveId || ""}
                onChange={(e) => {
                  const objId = e.target.value || undefined;
                  const updated = { ...draft, objectiveId: objId };
                  setDraft(updated);
                  if (!editing) onSave(updated);
                }}
                className="text-xs px-2 py-1 rounded-lg border border-border bg-background font-semibold text-foreground focus:outline-none"
              >
                <option value="">(No OKR Linked)</option>
                {okrs.map((o) => (
                  <option key={o.id} value={o.id}>
                    🎯 {o.id}: {o.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 5-Dimension Financial Scoring Breakdown */}
          <div className="p-3.5 rounded-xl border border-border bg-muted/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span>5-Dimension Financial Value & ROI ($)</span>
              </div>
              <button
                type="button"
                onClick={() => setShowCalculator(true)}
                className="px-2.5 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-xs font-bold flex items-center gap-1 shadow-2xs transition-all"
              >
                <Calculator className="w-3.5 h-3.5" />
                <span>⚡ Dollar Calculator</span>
              </button>
            </div>

            {/* 5 Dimension Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
              <div
                className="p-2 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900"
                title={`Strategic Logic: ${draft.dimensions?.strategicAlignment?.logic || "No rationale"}`}
              >
                <div className="text-[9px] font-bold text-blue-700 dark:text-blue-300">1. Strategic</div>
                <div className="font-mono font-bold text-foreground mt-0.5">
                  {formatUSD(draft.dimensions?.strategicAlignment?.value || 0)}
                </div>
              </div>
              <div
                className="p-2 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900"
                title={`New Revenue Logic: ${draft.dimensions?.newRevenueImpact?.logic || "No rationale"}`}
              >
                <div className="text-[9px] font-bold text-emerald-700 dark:text-emerald-300">2. New Rev</div>
                <div className="font-mono font-bold text-foreground mt-0.5">
                  {formatUSD(draft.dimensions?.newRevenueImpact?.value || 0)}
                </div>
              </div>
              <div
                className="p-2 rounded-lg bg-violet-50/50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-900"
                title={`Renewal Logic: ${draft.dimensions?.renewalRevenueImpact?.logic || "No rationale"}`}
              >
                <div className="text-[9px] font-bold text-violet-700 dark:text-violet-300">3. Renewal</div>
                <div className="font-mono font-bold text-foreground mt-0.5">
                  {formatUSD(draft.dimensions?.renewalRevenueImpact?.value || 0)}
                </div>
              </div>
              <div
                className="p-2 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900"
                title={`CX Logic: ${draft.dimensions?.improveCustomerExperience?.logic || "No rationale"}`}
              >
                <div className="text-[9px] font-bold text-amber-700 dark:text-amber-300">4. CX / Churn</div>
                <div className="font-mono font-bold text-foreground mt-0.5">
                  {formatUSD(draft.dimensions?.improveCustomerExperience?.value || 0)}
                </div>
              </div>
              <div
                className="p-2 rounded-lg bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-900"
                title={`Cost Reduction Logic: ${draft.dimensions?.lowersCost?.logic || "No rationale"}`}
              >
                <div className="text-[9px] font-bold text-teal-700 dark:text-teal-300">5. Cost Saved</div>
                <div className="font-mono font-bold text-foreground mt-0.5">
                  {formatUSD(draft.dimensions?.lowersCost?.value || 0)}
                </div>
              </div>
            </div>

            {/* Financial Summary KPI Row */}
            <div className="flex items-center justify-between text-xs pt-2 border-t border-border/80 font-semibold">
              <span>
                Total Value: <strong className="text-emerald-600 font-mono">{formatUSD(storyVal)}</strong>
              </span>
              <span>
                Dev Effort: <strong className="font-mono">{formatUSD(cost.totalCost)}</strong>
              </span>
              <span>
                ROI Multiple: <strong className="text-primary font-mono">{draft.dimensions?.roiMultiple !== undefined ? formatROI(draft.dimensions.roiMultiple) : roi.roiMultiple}</strong>
              </span>
            </div>
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

      {/* Dollar Value & ROI Calculator Wizard Modal */}
      {showCalculator && (
        <DollarCalculatorModal
          initialDimensions={draft.dimensions}
          estimatedHours={draft.estimatedHours ?? hours}
          pricing={pricing}
          title={`Dollar Calculator: ${draft.id} - ${draft.title}`}
          onApply={(dims) => {
            const updated = {
              ...draft,
              dimensions: dims,
              estimatedValue: dims.totalValue,
            };
            setDraft(updated);
            if (!editing) {
              onSave(updated);
            }
          }}
          onClose={() => setShowCalculator(false)}
        />
      )}
    </div>
  );
}

"use client";

// Shared "Create User Story" modal used by both the Kanban board and the
// User Story Map board. Persists via POST /api/projects/[slug]/stories.

import { useState } from "react";
import { Target, Zap } from "lucide-react";
import {
  estimateTokenCost,
  calculateROI,
  formatCost,
  formatDollars,
  getVerdictColor,
  type PricingParams,
} from "@/lib/cost-estimation";

export interface CreateStoryInput {
  id: string;
  title: string;
  description: string;
  points: number;
  status: string;
  persona?: string;
  personaRole?: string;
  journeyStep?: string;
  useCase?: { asA: string; iWant: string; soThat: string };
  businessGoal?: string;
  estimatedValue?: number;
  acceptanceCriteria?: {
    scenario: string;
    given: string[];
    when: string;
    then: string;
  }[];
}

export const DEFAULT_PRICING: PricingParams = {
  aiOverheadPercent: 14,
  developerHourlyRate: 150,
  hoursPerPoint: 0.35,
  model: "opus-4",
};

export function StoryCreateModal({
  slug,
  stepName,
  personas = [],
  pricing = DEFAULT_PRICING,
  onClose,
  onCreated,
}: {
  slug: string;
  stepName?: string;
  personas?: string[];
  pricing?: PricingParams;
  onClose: () => void;
  onCreated: (story: CreateStoryInput) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [points, setPoints] = useState(5);
  const [persona, setPersona] = useState("");
  const [personaRole, setPersonaRole] = useState("");
  const [asA, setAsA] = useState("");
  const [iWant, setIWant] = useState("");
  const [soThat, setSoThat] = useState("");
  const [businessGoal, setBusinessGoal] = useState("");
  const [estimatedValue, setEstimatedValue] = useState<number | undefined>();
  const [acScenario, setAcScenario] = useState("");
  const [acGiven, setAcGiven] = useState("");
  const [acWhen, setAcWhen] = useState("");
  const [acThen, setAcThen] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cost = estimateTokenCost(points, pricing);
  const roi = calculateROI(estimatedValue, points, pricing);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || saving) return;

    const story = {
      title: title.trim(),
      description: description.trim(),
      points,
      status: "backlog",
      useCase: {
        asA: asA.trim() || personaRole || "a user",
        iWant: iWant.trim(),
        soThat: soThat.trim(),
      },
      businessGoal: businessGoal.trim() || undefined,
      estimatedValue: estimatedValue || undefined,
      acceptanceCriteria: acScenario.trim()
        ? [
            {
              scenario: acScenario.trim(),
              given: acGiven
                .split("\n")
                .map((g) => g.trim())
                .filter(Boolean),
              when: acWhen.trim(),
              then: acThen.trim(),
            },
          ]
        : [],
      persona: persona || undefined,
      personaRole: personaRole || undefined,
      journeyStep: stepName,
    };

    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${slug}/stories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ story }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Failed to create story (${res.status})`);
      }
      const data = await res.json();
      const created: CreateStoryInput = {
        ...story,
        // data is { id, filePath } from createStory
        id: data.id || `STORY-${String(Math.floor(Math.random() * 900) + 100)}`,
      };
      onCreated(created);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create story");
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 rounded-2xl bg-card border border-border shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">Create User Story</h2>
            {stepName && (
              <p className="text-xs text-muted-foreground">Step: {stepName}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-muted"
          >
            <span className="text-xl">&times;</span>
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium mb-1 block">
              Story Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Script Generation with Editable Scene Table"
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1 block">
                Primary Persona
              </label>
              <select
                value={persona}
                onChange={(e) => setPersona(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">Select persona...</option>
                {personas.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Role</label>
              <input
                type="text"
                value={personaRole}
                onChange={(e) => setPersonaRole(e.target.value)}
                placeholder="Content Creator"
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="p-3 rounded-lg border border-border bg-muted/30">
            <label className="text-sm font-medium mb-2 block">Use Case</label>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground whitespace-nowrap">
                  As a
                </span>
                <input
                  type="text"
                  value={asA}
                  onChange={(e) => setAsA(e.target.value)}
                  placeholder="content creator"
                  className="flex-1 px-2 py-1 rounded border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground whitespace-nowrap">
                  I want to
                </span>
                <input
                  type="text"
                  value={iWant}
                  onChange={(e) => setIWant(e.target.value)}
                  placeholder="generate a script from a topic"
                  className="flex-1 px-2 py-1 rounded border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground whitespace-nowrap">
                  so that
                </span>
                <input
                  type="text"
                  value={soThat}
                  onChange={(e) => setSoThat(e.target.value)}
                  placeholder="I can create videos quickly"
                  className="flex-1 px-2 py-1 rounded border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block flex items-center gap-1">
              <Target className="w-3.5 h-3.5 text-amber-500" />
              Business Goal
            </label>
            <textarea
              value={businessGoal}
              onChange={(e) => setBusinessGoal(e.target.value)}
              placeholder="Drives new revenue by delivering core content creation..."
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block flex items-center gap-1">
              <Target className="w-3.5 h-3.5 text-emerald-500" />
              Estimated Business Value ($)
            </label>
            <input
              type="number"
              value={estimatedValue || ""}
              onChange={(e) =>
                setEstimatedValue(Number(e.target.value) || undefined)
              }
              placeholder="e.g. 50000"
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">
              Points: <span className="font-bold">{points}</span>
            </label>
            <input
              type="range"
              min={1}
              max={21}
              value={points}
              onChange={(e) => setPoints(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1</span>
              <span>3</span>
              <span>5</span>
              <span>8</span>
              <span>13</span>
              <span>21</span>
            </div>
            <div className="mt-2 p-2 rounded-lg bg-violet-50 border border-violet-200">
              <div className="flex items-center gap-1 text-[10px] text-violet-700 font-medium mb-1">
                <Zap className="w-3 h-3" />
                Live Estimate
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-sm font-bold text-violet-600">
                    {formatCost(cost.aiCost)}
                  </div>
                  <div className="text-[9px] text-violet-500">7 Agents</div>
                </div>
                <div>
                  <div className="text-sm font-bold text-blue-600">
                    {formatCost(cost.reviewCost)}
                  </div>
                  <div className="text-[9px] text-blue-500">
                    Dev ({cost.reviewHours.toFixed(1)}h)
                  </div>
                </div>
                <div>
                  <div className="text-sm font-bold text-green-600">
                    {formatCost(cost.totalCost)}
                  </div>
                  <div className="text-[9px] text-green-500">Total Cost</div>
                </div>
              </div>
              {roi.estimatedValue > 0 && (
                <div className="mt-2 pt-2 border-t border-violet-200 text-center">
                  <span
                    className={`text-sm font-bold px-2 py-0.5 rounded border ${getVerdictColor(roi.verdict)}`}
                  >
                    ROI: {roi.roiMultiple}
                  </span>
                  <span className="text-[9px] text-emerald-600 ml-2">
                    Value {formatDollars(roi.estimatedValue)} / Cost{" "}
                    {formatCost(roi.totalCost)}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="p-3 rounded-lg border border-border bg-muted/30">
            <label className="text-sm font-medium mb-2 block">
              Acceptance Criteria (Gherkin)
            </label>
            <div className="space-y-2">
              <input
                type="text"
                value={acScenario}
                onChange={(e) => setAcScenario(e.target.value)}
                placeholder="Scenario: Generate scene table from a topic"
                className="w-full px-2 py-1 rounded border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <textarea
                value={acGiven}
                onChange={(e) => setAcGiven(e.target.value)}
                placeholder={
                  "Given: I am on the input page\nAnd: I have entered a topic"
                }
                rows={2}
                className="w-full px-2 py-1 rounded border border-border bg-background text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              />
              <input
                type="text"
                value={acWhen}
                onChange={(e) => setAcWhen(e.target.value)}
                placeholder="When: I submit the form"
                className="w-full px-2 py-1 rounded border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <input
                type="text"
                value={acThen}
                onChange={(e) => setAcThen(e.target.value)}
                placeholder="Then: AI generates an editable scene table"
                className="w-full px-2 py-1 rounded border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional additional details..."
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
          </div>

          {error && (
            <div className="p-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
              {error}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!title.trim() || saving}
            className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {saving ? "Creating..." : "Create Story"}
          </button>
        </div>
      </form>
    </div>
  );
}

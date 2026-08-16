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
  points?: number;
  estimatedHours: number;
  estimatedTokens?: number;
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
  model: "claude-sonnet-4",
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
  const [estimatedHours, setEstimatedHours] = useState(2);
  const [estimatedTokens, setEstimatedTokens] = useState(30000);
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

  const cost = estimateTokenCost({ estimatedHours, estimatedTokens }, pricing);
  const roi = calculateROI(estimatedValue, { estimatedHours, estimatedTokens }, pricing);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || saving) return;

    const story = {
      title: title.trim(),
      description: description.trim(),
      estimatedHours,
      estimatedTokens,
      points: Math.max(1, Math.round(estimatedHours / 0.35)),
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1 block">
                Estimated Hours: <span className="font-bold font-mono">{estimatedHours}h</span>
              </label>
              <input
                type="number"
                min="0.25"
                step="0.25"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(Math.max(0.1, parseFloat(e.target.value) || 1))}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <div className="flex gap-1 mt-1.5 flex-wrap">
                {[0.5, 1, 2, 4, 8, 16].map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setEstimatedHours(h)}
                    className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                      estimatedHours === h
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {h}h
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">
                Estimated Tokens: <span className="font-bold font-mono">{(estimatedTokens / 1000).toFixed(0)}k</span>
              </label>
              <input
                type="number"
                min="1000"
                step="5000"
                value={estimatedTokens}
                onChange={(e) => setEstimatedTokens(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <div className="flex gap-1 mt-1.5 flex-wrap">
                {[15000, 30000, 60000, 120000].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setEstimatedTokens(t)}
                    className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                      estimatedTokens === t
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {t / 1000}k
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-violet-50 border border-violet-200">
            <div className="flex items-center gap-1 text-[10px] text-violet-700 font-medium mb-1">
              <Zap className="w-3 h-3" />
              Direct Cost &amp; Execution Estimate
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-sm font-bold text-violet-600 font-mono">
                  {formatCost(cost.aiCost)}
                </div>
                <div className="text-[9px] text-violet-500">AI Tokens ({(estimatedTokens / 1000).toFixed(0)}k)</div>
              </div>
              <div>
                <div className="text-sm font-bold text-blue-600 font-mono">
                  {formatCost(cost.reviewCost)}
                </div>
                <div className="text-[9px] text-blue-500">
                  Labor ({cost.reviewHours.toFixed(1)}h @ ${pricing.developerHourlyRate ?? 150}/hr)
                </div>
              </div>
              <div>
                <div className="text-sm font-bold text-emerald-600 font-mono">
                  {formatCost(cost.totalCost)}
                </div>
                <div className="text-[9px] text-emerald-600 font-semibold">Total Cost</div>
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

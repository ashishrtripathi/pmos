"use client";

// Shared "Create User Story" modal used by both the Kanban board and the
// User Story Map board. Persists via POST /api/projects/[slug]/stories.

import { useState, useEffect, useMemo } from "react";
import { Target, Zap, Calculator, TrendingUp, Link as LinkIcon, DollarSign, UserCheck } from "lucide-react";
import {
  estimateTokenCost,
  calculateROI,
  formatCost,
  formatDollars,
  getVerdictColor,
  type PricingParams,
} from "@/lib/cost-estimation";
import type { ValueDimensions } from "@/types/pmos";
import { DollarCalculatorModal } from "@/components/dollar-calculator-modal";
import { formatUSD, formatROI } from "@/lib/roi-calculator";
import { PRESET_PERSONA_AVATARS } from "@/lib/persona-avatars";

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
  objectiveId?: string;
  dimensions?: ValueDimensions;
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
  const [objectiveId, setObjectiveId] = useState<string>("");
  const [dimensions, setDimensions] = useState<ValueDimensions | undefined>();
  const [showCalculator, setShowCalculator] = useState(false);
  const [okrs, setOkrs] = useState<{ id: string; title: string }[]>([]);
  const [acScenario, setAcScenario] = useState("");
  const [acGiven, setAcGiven] = useState("");
  const [acWhen, setAcWhen] = useState("");
  const [acThen, setAcThen] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Available Persona Roles for dropdown
  const availableRoles = useMemo(() => {
    return Array.from(
      new Set([
        ...PRESET_PERSONA_AVATARS.map((a) => a.suggestedRole),
        "Senior Product Manager",
        "Full-Stack Lead & Architect",
        "UX / UI Design Lead",
        "AI Systems & DevOps Lead",
        "QA & Reliability Engineer",
        "Software Architect",
        "Content Creator & Video Producer",
        "Indie Motion Designer & Video Creator",
        "Online Course Educator",
        "Growth & Marketing Director",
        "AI Autonomous Coder",
        "Automated Pipeline & CI Engine",
        "End User / Customer",
        ...personas.filter(
          (p) =>
            p &&
            ![
              "Priya",
              "Sarah",
              "Dev",
              "Marcus",
              "Elena",
              "Tariq",
              "Amara",
              "Mateo",
              "Liam",
              "David",
              "Kwame",
              "Mei",
              "Clara",
              "Agent",
              "System",
            ].includes(p)
        ),
      ])
    );
  }, [personas]);

  // Fetch available OKRs for linking
  useEffect(() => {
    fetch(`/api/projects/${slug}/okrs`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setOkrs(data.map((o) => ({ id: o.id, title: o.title })));
        }
      })
      .catch(() => {});
  }, [slug]);

  const cost = estimateTokenCost({ estimatedHours, estimatedTokens }, pricing);
  const totalValue = dimensions?.totalValue || estimatedValue || 0;
  const roi = calculateROI(totalValue, { estimatedHours, estimatedTokens }, pricing);

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
      objectiveId: objectiveId || undefined,
      dimensions: dimensions || undefined,
      useCase: {
        asA: asA.trim() || personaRole || "Product Manager",
        iWant: iWant.trim() || (description.trim() ? description.trim() : (title.trim().toLowerCase().startsWith("add ") || title.trim().toLowerCase().startsWith("implement ") || title.trim().toLowerCase().startsWith("fix ") ? title.trim().toLowerCase() : `have ${title.trim().toLowerCase()} available in the product`)),
        soThat: soThat.trim() || businessGoal.trim() || "I can accomplish my workflow efficiently and deliver customer value",
      },
      businessGoal: businessGoal.trim() || undefined,
      estimatedValue: totalValue || undefined,
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
      persona: persona || personaRole || undefined,
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
        throw new Error("Failed to save story");
      }
      const data = await res.json();
      onCreated(data.story || { ...story, id: data.id || "STORY-NEW" });
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to create story");
      setSaving(false);
    }
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
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

            {/* Persona Role Dropdown (Replaces Name Dropdown & Separate Role Box) */}
            <div>
              <label className="text-sm font-medium mb-1 block flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-primary" />
                  Persona Role
                </span>
                {personaRole && (
                  <span className="text-[11px] font-normal text-muted-foreground">
                    Auto-fills Use Case (&ldquo;As a {personaRole}&rdquo;)
                  </span>
                )}
              </label>
              <select
                value={personaRole}
                onChange={(e) => {
                  const selectedRole = e.target.value;
                  setPersonaRole(selectedRole);
                  const matchingPreset = PRESET_PERSONA_AVATARS.find(
                    (a) => a.suggestedRole === selectedRole
                  );
                  if (matchingPreset) {
                    setPersona(matchingPreset.name);
                  } else {
                    setPersona(selectedRole);
                  }
                  if (!asA || availableRoles.includes(asA)) {
                    setAsA(selectedRole);
                  }
                }}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm font-medium focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">Select persona role...</option>
                {availableRoles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
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

          {/* OKR Objective Linking */}
          <div>
            <label className="text-sm font-medium mb-1 block flex items-center gap-1">
              <LinkIcon className="w-3.5 h-3.5 text-primary" />
              Link to Strategic OKR Objective
            </label>
            <select
              value={objectiveId}
              onChange={(e) => setObjectiveId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">(None / Standalone Backlog Story)</option>
              {okrs.map((o) => (
                <option key={o.id} value={o.id}>
                  🎯 {o.id}: {o.title}
                </option>
              ))}
            </select>
          </div>

          {/* 5-Dimension Financial Scoring Breakdown */}
          <div className="p-3.5 rounded-xl border border-border bg-muted/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span>5-Dimension Financial Value &amp; ROI ($)</span>
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

            {/* 5 Dimension Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
              <div className="p-2 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900">
                <div className="text-[9px] font-bold text-blue-700 dark:text-blue-300">1. Strategic</div>
                <div className="font-mono font-bold text-foreground mt-0.5">
                  {formatUSD(dimensions?.strategicAlignment?.value || 0)}
                </div>
              </div>
              <div className="p-2 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900">
                <div className="text-[9px] font-bold text-emerald-700 dark:text-emerald-300">2. New Rev</div>
                <div className="font-mono font-bold text-foreground mt-0.5">
                  {formatUSD(dimensions?.newRevenueImpact?.value || 0)}
                </div>
              </div>
              <div className="p-2 rounded-lg bg-violet-50/50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-900">
                <div className="text-[9px] font-bold text-violet-700 dark:text-violet-300">3. Renewal</div>
                <div className="font-mono font-bold text-foreground mt-0.5">
                  {formatUSD(dimensions?.renewalRevenueImpact?.value || 0)}
                </div>
              </div>
              <div className="p-2 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900">
                <div className="text-[9px] font-bold text-amber-700 dark:text-amber-300">4. CX / Churn</div>
                <div className="font-mono font-bold text-foreground mt-0.5">
                  {formatUSD(dimensions?.improveCustomerExperience?.value || 0)}
                </div>
              </div>
              <div className="p-2 rounded-lg bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-900">
                <div className="text-[9px] font-bold text-teal-700 dark:text-teal-300">5. Cost Saved</div>
                <div className="font-mono font-bold text-foreground mt-0.5">
                  {formatUSD(dimensions?.lowersCost?.value || 0)}
                </div>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="flex items-center justify-between text-xs pt-2 border-t border-border font-semibold">
              <span>
                Total Value: <strong className="text-emerald-600 font-mono">{formatUSD(totalValue)}</strong>
              </span>
              <span>
                Effort Cost: <strong className="font-mono">{formatUSD(cost.totalCost)}</strong>
              </span>
              <span>
                ROI: <strong className="text-primary font-mono">{dimensions?.roiMultiple !== undefined ? formatROI(dimensions.roiMultiple) : roi.roiMultiple}</strong>
              </span>
            </div>
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

      {/* Dollar Value Calculator Modal */}
      {showCalculator && (
        <DollarCalculatorModal
          initialDimensions={dimensions}
          estimatedHours={estimatedHours}
          pricing={pricing}
          title={`Calculate Value: ${title || "New Story"}`}
          onApply={(dims) => {
            setDimensions(dims);
            setEstimatedValue(dims.totalValue);
            setShowCalculator(false);
          }}
          onClose={() => setShowCalculator(false)}
        />
      )}
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  GripVertical,
  X,
  Layers,
  Maximize2,
  User,
  Target,
  ChevronDown,
  ChevronRight,
  Pencil,
  Zap,
  DollarSign,
  Clock,
  Bot,
  Eye,
  Save,
  AlertTriangle,
  FileText,
} from "lucide-react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { PipelineScreen } from "@/components/journey/pipeline-screen";

// ── Types ──────────────────────────────────────────

interface AcceptanceCriterion {
  scenario: string;
  given: string[];
  when: string;
  then: string;
}

interface Story {
  id: string;
  title: string;
  description: string;
  points: number;
  status: string;
  useCase?: { asA: string; iWant: string; soThat: string };
  businessGoal?: string;
  acceptanceCriteria?: AcceptanceCriterion[];
  persona?: string;
  personaRole?: string;
  journeyStep?: string;
}

interface PersonaJourneyStep {
  stepNumber: number;
  name: string;
  activity: string;
  tasks: string[];
  painPoints: string[];
  screen: string;
  stories: { id: string; title: string; points: number; status: string }[];
}

interface PersonaJourney {
  personaId: string;
  personaName: string;
  role: string;
  quote: string;
  steps: PersonaJourneyStep[];
}

interface StoryMap {
  backbone: PersonaJourneyStep[];
  activities: any[][][];
}

interface PipelineData {
  scenes: any[];
  processedAssets: { total: number; byType: any; items: any[] };
  audioFiles: { total: number; items: any[] };
  video: { exists: boolean; size: number; url: string | null };
}

interface UIInfo {
  serverRunning: boolean;
  uiUrl: string | null;
  serverPort: number;
  steps: { number: number; title: string; description: string; fields: string[] }[];
}

// ── Token Cost Estimation ──────────────────────────

// Approximate token costs for different model tiers
const COST_PER_1K_TOKENS = {
  "haiku": 0.00025,    // Claude Haiku: $0.25/M input
  "sonnet": 0.003,     // Claude Sonnet: $3/M input
  "opus": 0.015,       // Claude Opus: $15/M input
  "gpt4o": 0.0025,     // GPT-4o: $2.5/M input
  "gemini-pro": 0.00125, // Gemini Pro: $1.25/M input
};

// Average cost tier per story point (tokens consumed across full agent team)
const TOKENS_PER_POINT = {
  input: 12000,   // avg input tokens per story point across all agents
  output: 8000,   // avg output tokens per story point
  rounds: 3.5,    // avg agent interaction rounds per point
};

// US developer hourly rate default
const DEFAULT_US_HOURLY_RATE = 150;
const DEFAULT_REVIEW_HOURS_PER_POINT = 0.35; // ~2.5 hours for a 7-point story

interface TokenCost {
  inputTokens: number;
  outputTokens: number;
  aiCost: number;       // total AI agent cost in USD
  reviewHours: number;  // developer review hours
  reviewCost: number;   // developer review cost in USD
  totalCost: number;    // total cost in USD
  modelUsed: string;
}

function estimateTokenCost(points: number, modelTier: keyof typeof COST_PER_1K_TOKENS = "sonnet"): TokenCost {
  const inputTokens = Math.round(points * TOKENS_PER_POINT.input * TOKENS_PER_POINT.rounds);
  const outputTokens = Math.round(points * TOKENS_PER_POINT.output * TOKENS_PER_POINT.rounds);

  const costPer1k = COST_PER_1K_TOKENS[modelTier];
  const inputCost = (inputTokens / 1000) * costPer1k;
  const outputCost = (outputTokens / 1000) * costPer1k * 3; // output is 3x input cost
  const aiCost = inputCost + outputCost;

  // 7 agents, each consuming tokens
  const agentMultiplier = 7;
  const totalAiCost = aiCost * agentMultiplier;

  const reviewHours = points * DEFAULT_REVIEW_HOURS_PER_POINT;
  const reviewCost = reviewHours * DEFAULT_US_HOURLY_RATE;

  return {
    inputTokens,
    outputTokens,
    aiCost: totalAiCost,
    reviewHours,
    reviewCost,
    totalCost: totalAiCost + reviewCost,
    modelUsed: modelTier,
  };
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

function formatCost(n: number): string {
  if (n >= 1) return `$${n.toFixed(2)}`;
  if (n >= 0.01) return `$${n.toFixed(2)}`;
  return `$${n.toFixed(3)}`;
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

// ── Cost Bar (mini visual) ──────────────────────────

function CostBreakdown({ points }: { points: number }) {
  const cost = estimateTokenCost(points);
  const maxBar = 120; // max bar width in px
  const totalMax = 50; // $50 for full bar
  const aiWidth = Math.min((cost.aiCost / totalMax) * maxBar, maxBar);
  const reviewWidth = Math.min((cost.reviewCost / totalMax) * maxBar, maxBar);

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
        <span className="text-[9px] font-mono text-violet-600 w-10 text-right">{formatCost(cost.aiCost)}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <User className="w-2.5 h-2.5 text-blue-500" />
        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"
            style={{ width: `${reviewWidth}px` }}
          />
        </div>
        <span className="text-[9px] font-mono text-blue-600 w-10 text-right">{formatCost(cost.reviewCost)}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <DollarSign className="w-2.5 h-2.5 text-green-500" />
        <span className="text-[9px] font-mono font-bold text-green-600">{formatCost(cost.totalCost)}</span>
        <span className="text-[8px] text-muted-foreground">total</span>
      </div>
      <div className="text-[8px] text-muted-foreground">
        {formatTokens(cost.inputTokens + cost.outputTokens)} tokens · {cost.reviewHours.toFixed(1)}h review
      </div>
    </div>
  );
}

// ── Story Detail Modal ──────────────────────────────

function StoryDetailModal({
  story,
  onClose,
  onSave,
  personas,
}: {
  story: Story;
  onClose: () => void;
  onSave: (updated: Story) => void;
  personas: string[];
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ ...story });

  const cost = estimateTokenCost(draft.points);

  const handleSave = () => {
    onSave(draft);
    setEditing(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-card border border-border rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-border bg-card/95 backdrop-blur">
          <div>
            <span className="text-xs font-mono text-muted-foreground">{draft.id}</span>
            <h2 className="text-lg font-bold">{editing ? "Edit Story" : draft.title}</h2>
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
                  onClick={() => { setDraft({ ...story }); setEditing(false); }}
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
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Status + Points + Persona */}
          <div className="flex flex-wrap gap-2">
            <select
              value={draft.status}
              onChange={(e) => setDraft({ ...draft, status: e.target.value })}
              disabled={!editing}
              className="text-xs px-2 py-1 rounded-lg border border-border bg-background disabled:opacity-70"
            >
              <option value="backlog">Backlog</option>
              <option value="in-progress">In Progress</option>
              <option value="review">Review</option>
              <option value="done">Done</option>
            </select>
            <div className="flex items-center gap-1 text-xs bg-primary/10 px-2 py-1 rounded-lg">
              <span className="font-bold text-primary">{editing ? (
                <input
                  type="number"
                  value={draft.points}
                  onChange={(e) => setDraft({ ...draft, points: Number(e.target.value) })}
                  className="w-10 bg-transparent text-center font-bold text-primary outline-none"
                />
              ) : draft.points} pts</span>
            </div>
            {draft.persona && (
              <span className={`text-xs px-2 py-1 rounded-full border ${getPersonaColor(draft.persona)}`}>
                <User className="w-3 h-3 inline mr-0.5" />
                {editing ? (
                  <select
                    value={draft.persona}
                    onChange={(e) => setDraft({ ...draft, persona: e.target.value })}
                    className="bg-transparent border-none text-xs outline-none"
                  >
                    {personas.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                ) : `${draft.persona}${draft.personaRole ? ` — ${draft.personaRole}` : ""}`}
              </span>
            )}
            {draft.journeyStep && (
              <span className="text-xs px-2 py-1 rounded-lg bg-muted text-muted-foreground">
                {draft.journeyStep}
              </span>
            )}
          </div>

          {/* Use Case */}
          <div className="p-3 rounded-lg bg-muted/30 border border-border">
            <div className="text-xs font-medium text-muted-foreground uppercase mb-2">Use Case</div>
            {editing ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">As a</span>
                  <input
                    value={draft.useCase?.asA || ""}
                    onChange={(e) => setDraft({ ...draft, useCase: { ...draft.useCase, asA: e.target.value, iWant: draft.useCase?.iWant || "", soThat: draft.useCase?.soThat || "" } })}
                    className="flex-1 px-2 py-1 rounded border border-border bg-background text-sm"
                  />
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">I want to</span>
                  <input
                    value={draft.useCase?.iWant || ""}
                    onChange={(e) => setDraft({ ...draft, useCase: { ...draft.useCase, asA: draft.useCase?.asA || "", iWant: e.target.value, soThat: draft.useCase?.soThat || "" } })}
                    className="flex-1 px-2 py-1 rounded border border-border bg-background text-sm"
                  />
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">so that</span>
                  <input
                    value={draft.useCase?.soThat || ""}
                    onChange={(e) => setDraft({ ...draft, useCase: { ...draft.useCase, asA: draft.useCase?.asA || "", iWant: draft.useCase?.iWant || "", soThat: e.target.value } })}
                    className="flex-1 px-2 py-1 rounded border border-border bg-background text-sm"
                  />
                </div>
              </div>
            ) : (
              <div className="text-sm leading-relaxed">
                <span className="text-muted-foreground">As a</span> <span className="font-medium">{draft.useCase?.asA || "..."}</span><br />
                <span className="text-muted-foreground">I want to</span> <span className="font-medium">{draft.useCase?.iWant || "..."}</span><br />
                <span className="text-muted-foreground">so that</span> <span className="font-medium">{draft.useCase?.soThat || "..."}</span>
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
                onChange={(e) => setDraft({ ...draft, businessGoal: e.target.value })}
                rows={3}
                className="w-full px-2 py-1 rounded border border-border bg-background text-sm resize-none"
              />
            ) : (
              <p className="text-sm text-amber-800">{draft.businessGoal || "Not defined"}</p>
            )}
          </div>

          {/* Token Cost Breakdown */}
          <div className="p-3 rounded-lg bg-violet-50/50 border border-violet-200">
            <div className="flex items-center gap-1 text-xs font-medium text-violet-700 uppercase mb-2">
              <Zap className="w-3 h-3" />
              AI Agent Cost Estimate
            </div>
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div className="text-center">
                <div className="text-lg font-bold text-violet-600">{formatCost(cost.aiCost)}</div>
                <div className="text-[10px] text-violet-500">7 Agent Team</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">{formatCost(cost.reviewCost)}</div>
                <div className="text-[10px] text-blue-500">Dev Review ({cost.reviewHours.toFixed(1)}h)</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">{formatCost(cost.totalCost)}</div>
                <div className="text-[10px] text-green-500">Total Effort Cost</div>
              </div>
            </div>
            <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
              <span>{formatTokens(cost.inputTokens)} input tokens</span>
              <span>{formatTokens(cost.outputTokens)} output tokens</span>
              <span>Model: {cost.modelUsed}</span>
              <span>Dev rate: ${DEFAULT_US_HOURLY_RATE}/hr</span>
            </div>
            <CostBreakdown points={draft.points} />
          </div>

          {/* Acceptance Criteria */}
          <div className="p-3 rounded-lg bg-green-50/50 border border-green-200">
            <div className="flex items-center gap-1 text-xs font-medium text-green-700 uppercase mb-2">
              <FileText className="w-3 h-3" />
              Acceptance Criteria
            </div>
            {draft.acceptanceCriteria && draft.acceptanceCriteria.length > 0 ? (
              <div className="space-y-2">
                {draft.acceptanceCriteria.map((ac, i) => (
                  <div key={i} className="p-2 rounded bg-white/60 text-xs">
                    <div className="font-medium text-green-800">Scenario: {ac.scenario}</div>
                    {ac.given?.map((g, gi) => (
                      <div key={gi} className="text-muted-foreground ml-2">Given: {g}</div>
                    ))}
                    <div className="text-muted-foreground ml-2">When: {ac.when}</div>
                    <div className="text-green-700 ml-2 font-medium">Then: {ac.then}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No acceptance criteria defined</p>
            )}
          </div>

          {/* Description */}
          {draft.description && (
            <div className="p-3 rounded-lg bg-muted/30 border border-border">
              <div className="text-xs font-medium text-muted-foreground uppercase mb-1">Description</div>
              <p className="text-sm">{draft.description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Story Card (Sortable) ──────────────────────────

function StoryMapCard({
  story,
  compact,
  onClick,
}: {
  story: Story;
  compact?: boolean;
  onClick?: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: story.id, data: { story } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const statusColors: Record<string, string> = {
    backlog: "bg-gray-50 border-gray-200",
    "in-progress": "bg-blue-50 border-blue-200",
    review: "bg-yellow-50 border-yellow-200",
    done: "bg-green-50 border-green-200",
  };

  const cost = estimateTokenCost(story.points);

  if (compact) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`p-1.5 rounded-lg border shadow-sm hover:shadow-md transition-shadow group cursor-pointer ${statusColors[story.status] || "bg-card border-border"}`}
        onClick={onClick}
      >
        <div className="flex items-start gap-1">
          <button
            className="mt-0.5 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
            {...attributes}
            {...listeners}
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="w-3 h-3" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 mb-0.5 flex-wrap">
              <span className="text-[9px] font-mono text-muted-foreground">{story.id}</span>
              {story.persona && (
                <span className={`text-[8px] px-1 py-0 rounded-full border font-medium ${getPersonaColor(story.persona)}`}>
                  {story.persona}
                </span>
              )}
            </div>
            <h4 className="text-[11px] font-medium leading-tight">{story.title}</h4>
            <div className="text-[9px] font-mono text-violet-600 mt-0.5">{formatCost(cost.totalCost)}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-2.5 rounded-lg border shadow-sm hover:shadow-md hover:border-primary/30 transition-all group cursor-pointer ${statusColors[story.status] || "bg-card border-border"}`}
      onClick={onClick}
    >
      <div className="flex items-start gap-1.5">
        <button
          className="mt-0.5 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="w-3 h-3" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 mb-0.5 flex-wrap">
            <span className="text-[9px] font-mono text-muted-foreground">{story.id}</span>
            <span className="text-[9px] px-1 py-0 rounded bg-primary/10 text-primary font-medium">
              {story.points} pts
            </span>
            {story.persona && (
              <span className={`text-[8px] px-1 py-0 rounded-full border font-medium ${getPersonaColor(story.persona)}`}>
                <User className="w-1.5 h-1.5 inline mr-0.5" />
                {story.persona}
              </span>
            )}
          </div>
          <h4 className="text-[11px] font-medium leading-tight">{story.title}</h4>

          {/* Use Case preview */}
          {story.useCase?.asA && (
            <p className="text-[9px] text-muted-foreground mt-1 line-clamp-2">
              As a {story.useCase.asA}... I want to {story.useCase.iWant}
            </p>
          )}

          {/* Business Goal */}
          {story.businessGoal && (
            <div className="mt-1 flex items-center gap-0.5">
              <Target className="w-2 h-2 text-amber-500 shrink-0" />
              <span className="text-[8px] text-muted-foreground line-clamp-1">{story.businessGoal}</span>
            </div>
          )}

          {/* Token Cost */}
          <div className="mt-1.5 pt-1.5 border-t border-border/50">
            <CostBreakdown points={story.points} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Step Column ──────────────────────────────────────

function StepColumn({
  stepIndex,
  step,
  stories,
  expandedScreen,
  onToggleScreen,
  pipelineData,
  uiInfo,
  onCreateStory,
  onStoryClick,
}: {
  stepIndex: number;
  step: PersonaJourneyStep;
  stories: Story[];
  expandedScreen: number | null;
  onToggleScreen: (idx: number) => void;
  pipelineData: PipelineData | null;
  uiInfo: UIInfo | null;
  onCreateStory: (stepName: string) => void;
  onStoryClick: (story: Story) => void;
}) {
  const statusOrder: Record<string, number> = {
    "in-progress": 0,
    review: 1,
    backlog: 2,
    done: 3,
  };
  const sortedStories = [...stories].sort((a, b) => {
    const sa = statusOrder[a.status] ?? 2;
    const sb = statusOrder[b.status] ?? 2;
    if (sa !== sb) return sa - sb;
    return b.points - a.points;
  });

  const totalPoints = sortedStories.reduce((sum, s) => sum + s.points, 0);
  const totalCost = sortedStories.reduce((sum, s) => sum + estimateTokenCost(s.totalCost || s.points).totalCost, 0);

  return (
    <div className="flex flex-col min-w-[320px] max-w-[320px] border-r border-border last:border-r-0">
      {/* Backbone: Step header */}
      <div className="border-b border-border bg-card sticky top-0 z-10">
        <div className="px-3 py-2">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold shrink-0">
              {step.stepNumber}
            </span>
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-semibold truncate">{step.name}</h4>
              <p className="text-[10px] text-muted-foreground truncate">{step.activity}</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="px-3 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
              {sortedStories.length} stories
            </span>
            <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
              {totalPoints} pts
            </span>
            <span className="text-[10px] text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded font-mono">
              {formatCost(totalCost)}
            </span>
          </div>
          <button
            className="text-[9px] text-muted-foreground hover:text-foreground flex items-center gap-0.5 px-1.5 py-0.5 rounded hover:bg-muted transition-colors"
            onClick={() => onToggleScreen(stepIndex)}
          >
            <Eye className="w-2.5 h-2.5" />
            {expandedScreen === stepIndex ? "Hide" : "Preview"}
          </button>
        </div>
      </div>

      {/* Expanded Screen Preview */}
      {expandedScreen === stepIndex && (
        <div className="border-b border-border bg-muted/20 p-2 max-h-[300px] overflow-y-auto">
          <PipelineScreen stepName={step.name} pipelineData={pipelineData} uiInfo={uiInfo} />
        </div>
      )}

      {/* Pain Points */}
      {step.painPoints && step.painPoints.length > 0 && (
        <div className="px-3 py-1.5 border-b border-border bg-red-50/50">
          <div className="flex items-center gap-1 text-[9px] font-medium text-red-600 mb-0.5">
            <AlertTriangle className="w-2.5 h-2.5" />
            Pain Points
          </div>
          {step.painPoints.map((pp, i) => (
            <p key={i} className="text-[9px] text-red-500">{pp}</p>
          ))}
        </div>
      )}

      {/* Stories list (vertical, sorted by priority) */}
      <div className="flex-1 p-2 space-y-2 min-h-[200px]">
        <SortableContext
          items={sortedStories.map((s) => s.id)}
          strategy={verticalListSortingStrategy}
        >
          {sortedStories.map((story) => (
            <StoryMapCard
              key={story.id}
              story={story}
              onClick={() => onStoryClick(story)}
            />
          ))}
        </SortableContext>

        {sortedStories.length === 0 && (
          <div className="h-16 rounded-lg border border-dashed border-border flex items-center justify-center text-[9px] text-muted-foreground">
            No stories for this step
          </div>
        )}

        {/* Add story button */}
        <button
          onClick={() => onCreateStory(step.name)}
          className="w-full py-2 rounded-lg border border-dashed border-border text-[10px] text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors flex items-center justify-center gap-1"
        >
          <Plus className="w-3 h-3" />
          Add Story
        </button>
      </div>
    </div>
  );
}

// ── Create Story Form ──────────────────────────────

function CreateStoryForm({
  onClose,
  onCreate,
  stepName,
  personas,
}: {
  onClose: () => void;
  onCreate: (story: Story) => void;
  stepName: string;
  personas: string[];
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
  const [acScenario, setAcScenario] = useState("");
  const [acGiven, setAcGiven] = useState("");
  const [acWhen, setAcWhen] = useState("");
  const [acThen, setAcThen] = useState("");

  const cost = estimateTokenCost(points);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const story: Story = {
      id: `STORY-${String(Math.floor(Math.random() * 900) + 100)}`,
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
      acceptanceCriteria: acScenario.trim()
        ? [
            {
              scenario: acScenario.trim(),
              given: acGiven.split("\n").map((g) => g.trim()).filter(Boolean),
              when: acWhen.trim(),
              then: acThen.trim(),
            },
          ]
        : [],
      persona: persona || undefined,
      personaRole: personaRole || undefined,
      journeyStep: stepName,
    };

    onCreate(story);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 rounded-2xl bg-card border border-border shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">Create User Story</h2>
            {stepName && <p className="text-xs text-muted-foreground">Step: {stepName}</p>}
          </div>
          <button type="button" onClick={onClose}>
            <X className="w-5 h-5 text-muted-foreground hover:text-foreground" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium mb-1 block">Story Title</label>
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
              <label className="text-sm font-medium mb-1 block">Primary Persona</label>
              <select
                value={persona}
                onChange={(e) => setPersona(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">Select persona...</option>
                {personas.map((p) => (
                  <option key={p} value={p}>{p}</option>
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
                <span className="text-muted-foreground whitespace-nowrap">As a</span>
                <input
                  type="text"
                  value={asA}
                  onChange={(e) => setAsA(e.target.value)}
                  placeholder="content creator"
                  className="flex-1 px-2 py-1 rounded border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground whitespace-nowrap">I want to</span>
                <input
                  type="text"
                  value={iWant}
                  onChange={(e) => setIWant(e.target.value)}
                  placeholder="generate a script from a topic"
                  className="flex-1 px-2 py-1 rounded border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground whitespace-nowrap">so that</span>
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
              <span>1</span><span>3</span><span>5</span><span>8</span><span>13</span><span>21</span>
            </div>
            {/* Live cost estimate */}
            <div className="mt-2 p-2 rounded-lg bg-violet-50 border border-violet-200">
              <div className="flex items-center gap-1 text-[10px] text-violet-700 font-medium mb-1">
                <Zap className="w-3 h-3" />
                Live Cost Estimate
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-sm font-bold text-violet-600">{formatCost(cost.aiCost)}</div>
                  <div className="text-[9px] text-violet-500">7 Agents</div>
                </div>
                <div>
                  <div className="text-sm font-bold text-blue-600">{formatCost(cost.reviewCost)}</div>
                  <div className="text-[9px] text-blue-500">Dev ({cost.reviewHours.toFixed(1)}h)</div>
                </div>
                <div>
                  <div className="text-sm font-bold text-green-600">{formatCost(cost.totalCost)}</div>
                  <div className="text-[9px] text-green-500">Total</div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg border border-border bg-muted/30">
            <label className="text-sm font-medium mb-2 block">Acceptance Criteria (Gherkin)</label>
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
                placeholder={"Given: I am on the input page\nAnd: I have entered a topic"}
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
            <label className="text-sm font-medium mb-1 block">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional additional details..."
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
          </div>
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
            disabled={!title.trim()}
            className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            Create Story
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Main Board ──────────────────────────────────────

export function StoryMapBoard({
  params,
  journeys,
  allStories,
  storyMap,
}: {
  params: { slug: string };
  journeys: PersonaJourney[];
  allStories: Story[];
  storyMap: StoryMap;
}) {
  const [showCreate, setShowCreate] = useState(false);
  const [createForStep, setCreateForStep] = useState<string>("");
  const [activeStory, setActiveStory] = useState<Story | null>(null);
  const [expandedScreen, setExpandedScreen] = useState<number | null>(null);
  const [pipelineData, setPipelineData] = useState<PipelineData | null>(null);
  const [uiInfo, setUiInfo] = useState<UIInfo | null>(null);
  const [stories, setStories] = useState<Story[]>(allStories);
  const [detailStory, setDetailStory] = useState<Story | null>(null);

  useEffect(() => {
    fetch(`/api/projects/${params.slug}/pipeline-data`)
      .then((r) => r.json())
      .then(setPipelineData)
      .catch(() => {});
    fetch(`/api/projects/${params.slug}/ui-structure`)
      .then((r) => r.json())
      .then(setUiInfo)
      .catch(() => {});
  }, [params.slug]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const backbone = storyMap.backbone;
  const totalPoints = stories.reduce((sum, s) => sum + s.points, 0);
  const totalCost = stories.reduce((sum, s) => sum + estimateTokenCost(s.points).totalCost, 0);

  const allPersonas = [
    ...new Set([
      ...journeys.map((j) => j.personaName),
      ...stories.map((s) => s.persona).filter(Boolean),
    ]),
  ] as string[];

  const storiesByStep: Record<string, Story[]> = {};
  backbone.forEach((step) => {
    storiesByStep[step.name] = stories
      .filter((s) => s.journeyStep === step.name)
      .sort((a, b) => b.points - a.points);
  });

  const backlogStories = stories
    .filter((s) => !s.journeyStep || !backbone.some((step) => step.name === s.journeyStep))
    .sort((a, b) => b.points - a.points);

  const findStepForStory = useCallback(
    (storyId: string): string | null => {
      for (const [stepName, stepStories] of Object.entries(storiesByStep)) {
        if (stepStories.some((s) => s.id === storyId)) return stepName;
      }
      return null;
    },
    [storiesByStep]
  );

  const handleDragStart = (event: DragStartEvent) => {
    const story = event.active.data.current?.story as Story;
    if (story) setActiveStory(story);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveStory(null);
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;
    if (activeId === overId) return;

    const activeStep = findStepForStory(activeId);
    const overStep = findStepForStory(overId);
    if (activeStep === overStep) return;

    setStories((prev) =>
      prev.map((s) => {
        if (s.id === activeId) {
          const targetStep = overStep || backbone.find((b) => b.name === overId)?.name || "";
          return { ...s, journeyStep: targetStep || undefined };
        }
        return s;
      })
    );
  };

  const handleCreateStory = (story: Story) => {
    setStories((prev) => [...prev, story]);
  };

  const handleStoryClick = (story: Story) => {
    // Find the latest version from state (may have been moved)
    const latest = stories.find((s) => s.id === story.id) || story;
    setDetailStory(latest);
  };

  const handleStorySave = (updated: Story) => {
    setStories((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    setDetailStory(null);
  };

  return (
    <div className="p-6 max-w-full mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Layers className="w-5 h-5" />
          <h1 className="text-2xl font-bold">User Story Map</h1>
          <span className="text-sm text-muted-foreground">
            {stories.length} stories · {totalPoints} points
          </span>
          <span className="text-sm font-mono text-violet-600 bg-violet-50 px-2 py-0.5 rounded">
            {formatCost(totalCost)} est. AI cost
          </span>
        </div>
        <button
          onClick={() => {
            setCreateForStep("");
            setShowCreate(true);
          }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Story
        </button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Layers className="w-3 h-3" />
          <strong>Top row</strong> = Journey backbone
        </div>
        <div className="flex items-center gap-1.5">
          <GripVertical className="w-3 h-3" />
          Drag stories between steps
        </div>
        <div className="flex items-center gap-1.5">
          <Eye className="w-3 h-3" />
          Preview = real app UI
        </div>
        <div className="flex items-center gap-1.5">
          <Zap className="w-3 h-3 text-violet-500" />
          <span className="text-violet-600">Violet</span> = AI agent cost
        </div>
        <div className="flex items-center gap-1.5">
          <Pencil className="w-3 h-3" />
          Click any story to view/edit
        </div>
      </div>

      {/* Story Map Grid — HORIZONTAL SCROLL */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-0 border border-border rounded-xl min-w-max">
            {/* Backlog Column */}
            <div className="w-[240px] min-w-[240px] border-r border-border bg-muted/20 flex flex-col">
              <div className="px-3 py-2 border-b border-border bg-muted/40 sticky left-0 z-10">
                <h3 className="text-xs font-semibold">Backlog</h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-muted-foreground">
                    {backlogStories.length} unassigned
                  </span>
                  <span className="text-[10px] font-mono text-violet-600">
                    {formatCost(backlogStories.reduce((sum, s) => sum + estimateTokenCost(s.points).totalCost, 0))}
                  </span>
                </div>
              </div>
              <div className="flex-1 p-2 space-y-1.5 min-h-[300px]">
                <SortableContext
                  items={backlogStories.map((s) => s.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {backlogStories.map((story) => (
                    <StoryMapCard
                      key={story.id}
                      story={story}
                      compact
                      onClick={() => handleStoryClick(story)}
                    />
                  ))}
                </SortableContext>
                {backlogStories.length === 0 && (
                  <div className="h-20 rounded-lg border border-dashed border-border flex items-center justify-center text-[10px] text-muted-foreground">
                    All stories placed
                  </div>
                )}
                <button
                  onClick={() => {
                    setCreateForStep("");
                    setShowCreate(true);
                  }}
                  className="w-full py-1.5 rounded-lg border border-dashed border-border text-[10px] text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors flex items-center justify-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Add Story
                </button>
              </div>
            </div>

            {/* Journey Step Columns */}
            {backbone.map((step, si) => (
              <StepColumn
                key={si}
                stepIndex={si}
                step={step}
                stories={storiesByStep[step.name] || []}
                expandedScreen={expandedScreen}
                onToggleScreen={(idx) =>
                  setExpandedScreen(expandedScreen === idx ? null : idx)
                }
                pipelineData={pipelineData}
                uiInfo={uiInfo}
                onCreateStory={(stepName) => {
                  setCreateForStep(stepName);
                  setShowCreate(true);
                }}
                onStoryClick={handleStoryClick}
              />
            ))}
          </div>
        </div>

        <DragOverlay>
          {activeStory ? (
            <div className="p-2.5 rounded-lg border border-primary bg-card shadow-lg opacity-90 w-[240px]">
              <div className="flex items-center gap-1 mb-0.5">
                <span className="text-[9px] font-mono text-muted-foreground">{activeStory.id}</span>
                <span className="text-[9px] px-1 py-0 rounded bg-primary/10 text-primary font-medium">
                  {activeStory.points} pts
                </span>
                {activeStory.persona && (
                  <span className={`text-[8px] px-1 py-0 rounded-full border font-medium ${getPersonaColor(activeStory.persona)}`}>
                    {activeStory.persona}
                  </span>
                )}
              </div>
              <h4 className="text-[11px] font-medium">{activeStory.title}</h4>
              <div className="text-[9px] font-mono text-violet-600 mt-1">{formatCost(estimateTokenCost(activeStory.points).totalCost)}</div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Create Story Modal */}
      {showCreate && (
        <CreateStoryForm
          onClose={() => {
            setShowCreate(false);
            setCreateForStep("");
          }}
          onCreate={handleCreateStory}
          stepName={createForStep}
          personas={allPersonas.length > 0 ? allPersonas : ["Sarah", "Mike", "Emma"]}
        />
      )}

      {/* Story Detail / Edit Modal */}
      {detailStory && (
        <StoryDetailModal
          story={detailStory}
          onClose={() => setDetailStory(null)}
          onSave={handleStorySave}
          personas={allPersonas.length > 0 ? allPersonas : ["Sarah", "Mike", "Emma"]}
        />
      )}
    </div>
  );
}

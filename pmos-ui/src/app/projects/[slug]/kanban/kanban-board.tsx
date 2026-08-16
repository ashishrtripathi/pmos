"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import {
  Columns3,
  GripVertical,
  User,
  Target,
  Zap,
  TrendingUp,
  Brain,
  ExternalLink,
  ArrowRight,
  Bot,
  Plus,
  Play,
  Loader2,
  Clock,
} from "lucide-react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { StoryDetailModal } from "@/components/story-detail-modal";
import { StoryCreateModal } from "@/components/story-create-modal";
import { AGENT_INITIALS, AGENT_COLORS, getAgentBadge } from "@/lib/agent-badges";
import {
  estimateTokenCost,
  calculateROI,
  formatCost,
  formatDollars,
  formatTokens,
  formatDuration,
  getVerdictColor,
  storyRankScore,
  type PricingParams,
} from "@/lib/cost-estimation";

// ── Types ──────────────────────────────────────────

interface KanbanStory {
  id: string;
  title: string;
  description?: string;
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
  acceptanceCriteria?: any[];
  persona?: string;
  personaRole?: string;
  journeyStep?: string;
  assignedAgent?: string;
  agentWork?: {
    status: "queued" | "working" | "done";
    assignedAgent?: string;
    assignedAt?: string;
    startedAt?: string;
    lastHeartbeat?: string;
    completedAt?: string;
    durationMs?: number;
    tokensUsed?: number;
    notes?: string;
  };
  filePath?: string;
  source?: "manual" | "intelligence";
  sourceFile?: string;
  sourceSection?: string;
  category?: string;
}

// ── Constants ──────────────────────────────────────

const STATUS_COLUMNS = [
  { id: "backlog", label: "Backlog", color: "border-t-slate-400", bg: "bg-slate-50/50" },
  { id: "in-progress", label: "Doing", color: "border-t-blue-500", bg: "bg-blue-50/50" },
  { id: "review", label: "Review", color: "border-t-amber-500", bg: "bg-amber-50/50" },
  { id: "done", label: "Done", color: "border-t-emerald-500", bg: "bg-emerald-50/50" },
];

const CATEGORY_BADGE_COLORS: Record<string, string> = {
  "Code Analysis": "bg-blue-50 text-blue-600 border-blue-200",
  "UX/Product": "bg-pink-50 text-pink-600 border-pink-200",
  Technical: "bg-orange-50 text-orange-600 border-orange-200",
  "Missing Feature": "bg-yellow-50 text-yellow-600 border-yellow-200",
  "Critical Issue": "bg-red-100 text-red-700 border-red-300",
  "High Priority Issue": "bg-orange-100 text-orange-700 border-orange-300",
};

// ── Status Column Header ──────────────────────────

function StatusColumnHeader({
  column,
  count,
  totalHours,
}: {
  column: typeof STATUS_COLUMNS[0];
  count: number;
  totalHours: number;
}) {
  const icons: Record<string, string> = {
    backlog: "📋",
    "in-progress": "🔄",
    review: "👀",
    done: "✅",
  };

  return (
    <div className={`flex flex-col border-t-2 ${column.color} rounded-xl bg-card min-w-[260px] w-[260px] shrink-0`}>
      {/* Column Header */}
      <div className="p-3 border-b border-border">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">{icons[column.id] || "📌"}</span>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold">{column.label}</h3>
          </div>
        </div>
        <div className="flex items-center gap-1.5 mt-1">
          <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
            {count} stories
          </span>
          <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-mono">
            {totalHours.toFixed(1)}h est
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Kanban Column (Droppable) ─────────────────────

function KanbanColumn({
  column,
  children,
}: {
  column: { id: string };
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col rounded-xl bg-card min-w-[260px] w-[260px] shrink-0 transition-shadow ${
        isOver ? "ring-2 ring-primary/60" : ""
      }`}
    >
      {children}
    </div>
  );
}

// ── Kanban Story Card (Sortable + Clickable) ────────

function KanbanStoryCard({
  story,
  pricing,
  slug,
  onClick,
}: {
  story: KanbanStory;
  pricing: PricingParams;
  slug?: string;
  onClick: () => void;
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

  const hours = story.estimatedHours ?? (story.points ? story.points * (pricing.hoursPerPoint || 0.5) : 1);
  const cost = estimateTokenCost(story, pricing);
  const roi = calculateROI(story.estimatedValue, story, pricing);
  const isIntelligence = story.source === "intelligence";
  const agentBadge = getAgentBadge(story.assignedAgent);
  const tokens = story.tokensUsed ?? story.estimatedTokens ?? cost.inputTokens + cost.outputTokens;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-2.5 rounded-lg border bg-background shadow-sm hover:shadow-md hover:border-primary/30 transition-all group cursor-grab active:cursor-grabbing ${
        isIntelligence ? "border-l-[3px] border-l-amber-400" : "border-border"
      }`}
      onClick={onClick}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start gap-2">
        <span
          className="mt-0.5 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
          aria-hidden
        >
          <GripVertical className="w-3.5 h-3.5" />
        </span>
        <div className="flex-1 min-w-0">
          {/* Badges row */}
          <div className="flex items-center gap-1 mb-0.5 flex-wrap">
            {isIntelligence && (
              <span className="text-[8px] px-1 py-0 rounded bg-amber-50 text-amber-600 border border-amber-200 font-bold flex items-center gap-0.5">
                <Brain className="w-2 h-2" />
                AI
              </span>
            )}
            {story.assignedAgent ? (
              <span
                className={`flex items-center gap-1 text-[8px] px-1.5 py-0.5 rounded-md border font-semibold ${agentBadge?.color ?? ""}`}
                title={`Being worked on by ${agentBadge?.name ?? story.assignedAgent}`}
              >
                <Bot className="w-2.5 h-2.5" />
                {agentBadge?.name ?? story.assignedAgent}
                {story.agentWork?.status === "working" ? (
                  <span className="ml-0.5 flex items-center gap-1 text-emerald-600">
                    <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                    working
                  </span>
                ) : story.agentWork?.status === "done" ? (
                  <span className="ml-0.5 text-green-600">✓ done</span>
                ) : (
                  <span className="ml-0.5 text-amber-600">queued</span>
                )}
              </span>
            ) : story.status === "in-progress" ? (
              <span className="text-[8px] px-1.5 py-0.5 rounded-md border border-dashed border-blue-300 bg-blue-50/60 text-blue-500 font-medium">
                Working · unassigned
              </span>
            ) : null}
            <span className="text-[10px] font-mono text-muted-foreground">
              {story.id}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-mono font-medium" title={`${hours} estimated hours`}>
              {hours}h
            </span>
            {story.persona && (
              <span className="text-[8px] px-1 py-0 rounded bg-gray-100 text-gray-600 border border-gray-200">
                {story.persona}
              </span>
            )}
            {story.category && (
              <span
                className={`text-[8px] px-1 py-0 rounded-full border font-medium ${
                  CATEGORY_BADGE_COLORS[story.category] || "bg-gray-50 text-gray-600 border-gray-200"
                }`}
              >
                {story.category}
              </span>
            )}
          </div>

          {/* Title */}
          <h4 className="text-[11px] font-semibold leading-tight">{story.title}</h4>

          {/* Description */}
          {story.description && (
            <p className="text-[9px] text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
              {story.description}
            </p>
          )}

          {/* Use Case preview */}
          {story.useCase?.soThat && (
            <div className="mt-1 text-[9px] text-emerald-700 bg-emerald-50/50 rounded px-1.5 py-0.5 border border-emerald-100">
              <span className="font-medium">Outcome:</span> {story.useCase.soThat}
            </div>
          )}

          {/* Business Goal */}
          {story.businessGoal && (
            <div className="mt-1 flex items-start gap-0.5">
              <Target className="w-2 h-2 text-amber-500 shrink-0 mt-0.5" />
              <span className="text-[8px] text-muted-foreground line-clamp-2">{story.businessGoal}</span>
            </div>
          )}

          {/* Execution Time in Harness (if available) */}
          {(story.executionDurationMs || (story.status === "in-progress" && story.startedAt)) && (
            <div className="mt-1 flex items-center gap-1 text-[9px] text-indigo-600 bg-indigo-50/70 border border-indigo-100 rounded px-1.5 py-0.5 font-mono">
              <Clock className="w-2.5 h-2.5" />
              {story.executionDurationMs ? (
                <span>Harness run: {formatDuration(story.executionDurationMs)}</span>
              ) : (
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                  Running in harness...
                </span>
              )}
            </div>
          )}

          {/* Cost + Tokens + ROI + Value */}
          <div className="mt-1.5 pt-1.5 border-t border-border/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 flex-wrap">
                <div className="flex items-center gap-0.5" title={`${hours}h labor + ${formatTokens(tokens)} tokens`}>
                  <Zap className="w-2 h-2 text-violet-500" />
                  <span className="text-[9px] font-mono text-violet-600 font-semibold">
                    {formatCost(cost.totalCost)}
                  </span>
                  <span className="text-[8px] text-muted-foreground font-mono">
                    ({formatTokens(tokens)} tok)
                  </span>
                </div>
                {roi.estimatedValue > 0 && (
                  <>
                    <span className="text-[8px] text-muted-foreground">→</span>
                    <div className="flex items-center gap-0.5">
                      <TrendingUp className="w-2 h-2 text-emerald-500" />
                      <span className="text-[9px] font-mono text-emerald-600">
                        {formatDollars(roi.estimatedValue)}
                      </span>
                    </div>
                  </>
                )}
              </div>
              {roi.estimatedValue > 0 && (
                <span
                  className={`text-[8px] px-1 py-0 rounded font-bold border ${getVerdictColor(roi.verdict)}`}
                >
                  {roi.roiMultiple}
                </span>
              )}
            </div>
          </div>

          {/* Intelligence Reference */}
          {isIntelligence && story.sourceFile && (
            <div className="mt-1 pt-1 border-t border-amber-100">
              <a
                href={`/projects/${slug || "pmos"}/intelligence`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-0.5 text-[8px] text-amber-600 hover:text-amber-800 hover:underline"
              >
                <Brain className="w-2 h-2" />
                <span>{story.sourceFile.replace("intelligence/", "")}</span>
                {story.sourceSection && (
                  <span className="text-muted-foreground"> / {story.sourceSection}</span>
                )}
                <ExternalLink className="w-1.5 h-1.5" />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Board ──────────────────────────────────────

export function KanbanBoard({
  params,
  allStories,
  personas: journeyPersonas,
}: {
  params: { slug: string };
  allStories: KanbanStory[];
  personas: string[];
}) {
  const { slug } = params;
  const [stories, setStories] = useState<KanbanStory[]>(allStories);
  const [activeStory, setActiveStory] = useState<KanbanStory | null>(null);
  const dragStartStatusRef = useRef<string | null>(null);
  // dnd-kit fires a click event on the dragged element after a drop;
  // suppress it so the story detail modal doesn't pop open mid-drag.
  const suppressClickRef = useRef(false);
  const [detailStory, setDetailStory] = useState<KanbanStory | null>(null);
  const [pickupNotice, setPickupNotice] = useState<string | null>(null);
  const [intelStories, setIntelStories] = useState<KanbanStory[]>([]);
  const [savingStatus, setSavingStatus] = useState<Record<string, boolean>>({});
  const [showCreate, setShowCreate] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [pricing, setPricing] = useState<PricingParams>({
    aiOverheadPercent: 3,
    developerHourlyRate: 150,
    hoursPerPoint: 0.35,
    model: "claude-sonnet-4",
  });

  // Fetch intelligence stories
  useEffect(() => {
    fetch(`/api/projects/${slug}/intelligence-stories`)
      .then((r) => r.json())
      .then((data) => {
        if (data.stories) setIntelStories(data.stories);
      })
      .catch(() => {});
  }, [slug]);

  // Fetch pricing config — when this changes, costs/ROI/rankings auto-recalculate
  useEffect(() => {
    fetch(`/api/projects/${slug}/pricing`)
      .then((r) => r.json())
      .then((data) => {
        if (data && !data.error) {
          setPricing({
            aiOverheadPercent: data.aiOverheadPercent ?? 3,
            developerHourlyRate: data.developerHourlyRate ?? 150,
            hoursPerPoint: data.hoursPerPoint ?? 0.35,
            model: data.model ?? "claude-sonnet-4",
          });
        }
      })
      .catch(() => {});
  }, [slug]);

  // Merge intelligence stories into main list
  useEffect(() => {
    if (intelStories.length === 0) return;
    setStories((prev) => {
      const existingIds = new Set(prev.map((s) => s.id));
      const newOnes = intelStories.filter((s) => !existingIds.has(s.id));
      return newOnes.length > 0 ? [...prev, ...newOnes] : prev;
    });
  }, [intelStories]);

  // Recalculate everything when stories or pricing changes
  const columns = useMemo(() =>
    STATUS_COLUMNS.map((col) => {
      const colStories = stories.filter((s) => s.status === col.id);
      const totalHours = colStories.reduce(
        (sum, s) => sum + (s.estimatedHours || (s.points ? s.points * (pricing.hoursPerPoint || 0.5) : 1)),
        0
      );
      return { ...col, stories: colStories, totalHours };
    }),
    [stories, pricing]
  );

  const totals = useMemo(() => {
    const totalStories = stories.length;
    const totalHours = stories.reduce(
      (sum, s) => sum + (s.estimatedHours || (s.points ? s.points * (pricing.hoursPerPoint || 0.5) : 1)),
      0
    );
    const totalCost = stories.reduce(
      (sum, s) => sum + estimateTokenCost(s, pricing).totalCost,
      0
    );
    const totalTokens = stories.reduce(
      (sum, s) => sum + (s.tokensUsed ?? s.estimatedTokens ?? estimateTokenCost(s, pricing).inputTokens + estimateTokenCost(s, pricing).outputTokens),
      0
    );
    const totalValue = stories.reduce((sum, s) => sum + (s.estimatedValue || 0), 0);
    const totalIntel = stories.filter((s) => s.source === "intelligence").length;
    return { totalStories, totalHours, totalCost, totalTokens, totalValue, totalIntel };
  }, [stories, pricing]);

  const {
    totalStories,
    totalHours,
    totalCost,
    totalTokens,
    totalValue,
    totalIntel,
  } = totals;

  const handleStartExecution = async () => {
    setExecuting(true);
    try {
      const res = await fetch(`/api/projects/${slug}/stories/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.stories)) {
        setStories(data.stories);
        setPickupNotice(
          `Executed ${data.executedCount} stories in test harness! Duration & tokens updated.`
        );
        setTimeout(() => setPickupNotice(null), 6000);
      }
    } catch {
      // ignore
    } finally {
      setExecuting(false);
    }
  };

  // Persona options
  const allPersonas = [
    ...new Set([
      ...journeyPersonas,
      ...stories.map((s) => s.persona).filter(Boolean),
    ]),
  ] as string[];
  const personaOptions =
    allPersonas.length > 0
      ? allPersonas
      : ["Product Manager", "Developer", "Designer"];

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const findStoryStatus = useCallback(
    (storyId: string): string | null => {
      const story = stories.find((s) => s.id === storyId);
      return story?.status || null;
    },
    [stories]
  );

  const handleDragStart = (event: DragStartEvent) => {
    const story = event.active.data.current?.story as KanbanStory;
    if (story) {
      setActiveStory(story);
      dragStartStatusRef.current = story.status;
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeStatus = findStoryStatus(activeId);
    if (!activeStatus) return;

    let overStatus: string | null = null;
    for (const col of columns) {
      if (overId === col.id || col.stories.some((s) => s.id === overId)) {
        overStatus = col.id;
        break;
      }
    }
    if (!overStatus || overStatus === activeStatus) return;

    setStories((prev) => {
      const updated = prev.map((s) => {
        if (s.id === activeId) {
          return { ...s, status: overStatus };
        }
        return s;
      });

      const activeItem = updated.find((s) => s.id === activeId);
      const activeIndex = updated.findIndex((s) => s.id === activeId);
      const overIndex = updated.findIndex((s) => s.id === overId);
      if (activeItem && activeIndex >= 0 && overIndex >= 0) {
        updated.splice(activeIndex, 1);
        const insertAt = activeIndex < overIndex ? overIndex - 1 : overIndex;
        updated.splice(insertAt, 0, activeItem);
      }

      return updated;
    });
  };

  const persistStatusChange = useCallback(
    async (storyId: string, newStatus: string) => {
      setSavingStatus((prev) => ({ ...prev, [storyId]: true }));
      try {
        const res = await fetch(`/api/projects/${slug}/stories/${storyId}/status`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        });
        const data = await res.json();
        if (data.pickedUpBy) {
          const story = stories.find((s) => s.id === storyId);
          const agentName = data.pickedUpByName || data.pickedUpBy;
          setPickupNotice(
            `"${story?.title || storyId}" picked up by ${agentName}`
          );
          window.setTimeout(() => setPickupNotice(null), 5000);
          setStories((prev) =>
            prev.map((s) =>
              s.id === storyId ? { ...s, assignedAgent: data.pickedUpBy } : s
            )
          );
        }
      } catch {
        // Silently fail
      } finally {
        setSavingStatus((prev) => ({ ...prev, [storyId]: false }));
      }
    },
    [slug, stories]
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveStory(null);
    suppressClickAfterDrag();
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    const story = stories.find((s) => s.id === activeId);
    if (!story) return;

    const fromStatus = dragStartStatusRef.current;
    const toStatus = story.status;

    if (fromStatus && fromStatus !== toStatus) {
      persistStatusChange(activeId, toStatus);
    }
  };

  const suppressClickAfterDrag = () => {
    suppressClickRef.current = true;
    setTimeout(() => {
      suppressClickRef.current = false;
    }, 100);
  };

  const handleDragCancel = () => {
    setActiveStory(null);
    suppressClickAfterDrag();
  };

  const handleCreateStory = (input: any) => {
    const newStory: KanbanStory = {
      id: input.id,
      title: input.title,
      description: input.description,
      points: input.points,
      estimatedHours: input.estimatedHours,
      estimatedTokens: input.estimatedTokens,
      status: "backlog",
      useCase: input.useCase,
      businessGoal: input.businessGoal,
      estimatedValue: input.estimatedValue,
      acceptanceCriteria: input.acceptanceCriteria,
      persona: input.persona,
      personaRole: input.personaRole,
      journeyStep: input.journeyStep,
      source: "manual",
    };
    setStories((prev) => [...prev, newStory]);
    setShowCreate(false);
  };

  const handleUpdateStory = (updatedStory: any) => {
    setStories((prev) =>
      prev.map((s) => (s.id === updatedStory.id ? { ...s, ...updatedStory } : s))
    );
    setDetailStory(null);
  };

  const handleDeleteStory = (storyId: string) => {
    setStories((prev) => prev.filter((s) => s.id !== storyId));
    setDetailStory(null);
  };

  return (
    <div className="p-8 max-w-full mx-auto">
      {/* Agent pickup notice */}
      {pickupNotice && (
        <div className="mb-4 flex items-center gap-2 px-4 py-2.5 rounded-md bg-violet-50 border border-violet-200 text-violet-700 text-sm">
          <Bot className="w-4 h-4" />
          <span>{pickupNotice}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <Columns3 className="w-5 h-5" />
          <h1 className="text-2xl font-bold">Kanban</h1>
          <span className="text-sm text-muted-foreground font-mono">
            {totalStories} stories &middot; {totalHours.toFixed(1)}h est
          </span>
          <span className="text-sm font-mono text-violet-600 bg-violet-50 px-2 py-0.5 rounded font-medium">
            {formatCost(totalCost)} cost ({formatTokens(totalTokens)} tok)
          </span>
          {totalValue > 0 && (
            <span className="text-sm font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-medium">
              {formatDollars(totalValue)} value
            </span>
          )}
          {totalIntel > 0 && (
            <span className="text-sm text-amber-600 bg-amber-50 px-2 py-0.5 rounded flex items-center gap-1 font-medium">
              <Brain className="w-3.5 h-3.5" />
              {totalIntel} from intelligence
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleStartExecution}
            disabled={executing}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
            title="Immediately dispatch and run active stories in test harness"
          >
            {executing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Running in Harness...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Start Story Execution</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New Story
          </button>
        </div>
      </div>

      {/* Agent dispatch hint */}
      <div className="mb-5 flex items-center justify-between px-4 py-2.5 rounded-md bg-blue-50 border border-blue-200 text-blue-700 text-sm flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 shrink-0" />
          <span>
            Click <strong>Start Story Execution</strong> or drag a story to <strong>Doing</strong> to execute in harness. Duration and token consumption are tracked live.
          </span>
        </div>
        <div className="text-xs font-mono text-blue-600 font-medium">
          Harness Tracking Active
        </div>
      </div>

      {/* Kanban Grid — Status Columns */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-3 min-w-max">
            {columns.map((col) => (
              <KanbanColumn key={col.id} column={col}>
                <div className={`p-3 border-b border-border border-t-2 ${col.color} rounded-t-xl`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">
                      {col.id === "backlog" ? "📋" : col.id === "in-progress" ? "🔄" : col.id === "review" ? "👀" : "✅"}
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold">{col.label}</h3>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                      {col.stories.length} stories
                    </span>
                    <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                      {col.totalHours.toFixed(1)}h
                    </span>
                  </div>
                </div>

                {/* Story List */}
                <div className="flex-1 p-2 space-y-1.5 min-h-[120px]">
                  <SortableContext
                    items={col.stories.map((s) => s.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {col.stories.map((story) => (
                      <KanbanStoryCard
                        key={story.id}
                        story={story}
                        pricing={pricing}
                        slug={slug}
                        onClick={() => {
                          if (suppressClickRef.current) return;
                          setDetailStory(story);
                        }}
                      />
                    ))}
                  </SortableContext>
                  {col.stories.length === 0 && (
                    <div className="h-16 rounded-lg border border-dashed border-border flex items-center justify-center text-[10px] text-muted-foreground">
                      Drop stories here
                    </div>
                  )}
                </div>
              </KanbanColumn>
            ))}
          </div>
        </div>

        <DragOverlay>
          {activeStory ? (
            <div className="p-2.5 rounded-lg border border-primary bg-card shadow-lg opacity-90 min-w-[200px] max-w-[240px]">
              <div className="flex items-center gap-1.5 mb-0.5">
                {activeStory.source === "intelligence" && (
                  <Brain className="w-3 h-3 text-amber-500" />
                )}
                <span className="text-xs font-mono text-muted-foreground">
                  {activeStory.id}
                </span>
                <span className="text-[10px] px-1 py-0.5 rounded bg-primary/10 text-primary font-mono font-medium">
                  {activeStory.estimatedHours ?? (activeStory.points ? activeStory.points * 0.35 : 1)}h
                </span>
              </div>
              <h4 className="text-xs font-medium">{activeStory.title}</h4>
              {activeStory.description && (
                <p className="text-[9px] text-muted-foreground mt-0.5 line-clamp-2">{activeStory.description}</p>
              )}
              <div className="mt-1 flex items-center gap-1">
                <Zap className="w-2.5 h-2.5 text-violet-500" />
                <span className="text-[9px] font-mono text-violet-600">
                  {formatCost(estimateTokenCost(activeStory, pricing).totalCost)}
                </span>
                {activeStory.estimatedValue && activeStory.estimatedValue > 0 && (
                  <>
                    <span className="text-[8px] text-muted-foreground">→</span>
                    <span className="text-[9px] font-mono text-emerald-600">
                      {formatDollars(activeStory.estimatedValue)}
                    </span>
                  </>
                )}
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Story Detail Modal */}
      {detailStory && (
        <StoryDetailModal
          story={{ ...detailStory, description: detailStory.description || "" }}
          onClose={() => setDetailStory(null)}
          onSave={handleUpdateStory}
          pricing={pricing || undefined}
          personas={personaOptions}
        />
      )}

      {/* Create Story Modal */}
      {showCreate && (
        <StoryCreateModal
          slug={slug}
          pricing={pricing || undefined}
          onClose={() => setShowCreate(false)}
          onCreated={handleCreateStory}
          personas={personaOptions}
        />
      )}
    </div>
  );
}

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
  CheckCircle2,
  ChevronRight,
  RotateCcw,
} from "lucide-react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  pointerWithin,
  rectIntersection,
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

// ── Kanban Column (Droppable) ─────────────────────

function KanbanColumn({
  column,
  isDraggingAny,
  children,
}: {
  column: { id: string; label: string; color: string };
  isDraggingAny?: boolean;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col rounded-2xl bg-card border border-border min-w-[280px] w-[280px] shrink-0 transition-all duration-200 ${
        isOver
          ? "ring-2 ring-blue-500 bg-blue-50/30 dark:bg-blue-950/20 shadow-lg scale-[1.01]"
          : isDraggingAny
          ? "border-dashed border-primary/40 bg-muted/10"
          : ""
      }`}
    >
      {children}
    </div>
  );
}

// ── Kanban Story Card (Sortable + Clickable + Quick Actions) ────────

function KanbanStoryCard({
  story,
  pricing,
  slug,
  onClick,
  onMoveStatus,
}: {
  story: KanbanStory;
  pricing: PricingParams;
  slug?: string;
  onClick: () => void;
  onMoveStatus?: (storyId: string, newStatus: string) => void;
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
    opacity: isDragging ? 0.3 : 1,
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
      className={`p-3 rounded-xl border bg-background shadow-xs hover:shadow-md hover:border-primary/40 transition-all group select-none ${
        isIntelligence ? "border-l-[3px] border-l-amber-400" : "border-border"
      }`}
    >
      <div className="flex items-start gap-2">
        {/* Grip Handle for Dragging */}
        <span
          {...attributes}
          {...listeners}
          className="mt-0.5 p-1 -ml-1 cursor-grab active:cursor-grabbing text-muted-foreground/60 hover:text-foreground hover:bg-muted rounded transition-colors"
          title="Drag to reorder or move across columns"
        >
          <GripVertical className="w-4 h-4" />
        </span>

        <div className="flex-1 min-w-0" onClick={onClick}>
          {/* Badges row */}
          <div className="flex items-center gap-1 mb-1 flex-wrap cursor-pointer">
            {isIntelligence && (
              <span className="text-[8px] px-1 py-0 rounded bg-amber-50 text-amber-600 border border-amber-200 font-bold flex items-center gap-0.5">
                <Brain className="w-2 h-2" />
                AI
              </span>
            )}
            {story.assignedAgent ? (
              <span
                className={`flex items-center gap-1 text-[8px] px-1.5 py-0.5 rounded-md border font-semibold ${agentBadge?.color ?? ""}`}
                title={`Assigned to ${agentBadge?.name ?? story.assignedAgent}`}
              >
                <Bot className="w-2.5 h-2.5" />
                {agentBadge?.name ?? story.assignedAgent}
                {story.status === "in-progress" ? (
                  <span className="ml-0.5 flex items-center gap-1 text-blue-600">
                    <span className="w-1 h-1 rounded-full bg-blue-500 animate-pulse" />
                    doing
                  </span>
                ) : story.status === "done" ? (
                  <span className="ml-0.5 text-emerald-600">✓ done</span>
                ) : null}
              </span>
            ) : story.status === "in-progress" ? (
              <span className="text-[8px] px-1.5 py-0.5 rounded-md border border-dashed border-blue-300 bg-blue-50/60 text-blue-600 font-medium flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-blue-500 animate-pulse" />
                Doing · in harness
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
          <h4 className="text-xs font-semibold leading-tight cursor-pointer hover:text-primary transition-colors">
            {story.title}
          </h4>

          {/* Description */}
          {story.description && (
            <p className="text-[9px] text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed cursor-pointer">
              {story.description}
            </p>
          )}

          {/* Harness Duration & Execution Timer */}
          {(story.executionDurationMs || (story.status === "in-progress" && story.startedAt)) && (
            <div className="mt-1.5 flex items-center gap-1 text-[9px] text-indigo-600 bg-indigo-50/70 border border-indigo-100 rounded px-1.5 py-0.5 font-mono">
              <Clock className="w-2.5 h-2.5" />
              {story.executionDurationMs ? (
                <span>⏱️ {formatDuration(story.executionDurationMs)} in harness</span>
              ) : (
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                  Running in test harness...
                </span>
              )}
            </div>
          )}

          {/* Cost + Tokens + ROI */}
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
        </div>
      </div>

      {/* Quick Move Action Buttons */}
      <div className="mt-2.5 pt-1.5 border-t border-border/60 flex items-center justify-between gap-1">
        <span className="text-[8px] text-muted-foreground font-medium uppercase tracking-wider">Move:</span>
        <div className="flex items-center gap-1">
          {story.status !== "in-progress" && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onMoveStatus?.(story.id, "in-progress");
              }}
              className="px-2 py-0.5 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[9px] font-semibold flex items-center gap-0.5 transition-all hover:scale-105 shadow-2xs"
              title="Move to Doing (Execute in test harness)"
            >
              <Play className="w-2 h-2 fill-blue-700" />
              <span>Doing</span>
            </button>
          )}
          {story.status === "in-progress" && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveStatus?.(story.id, "review");
                }}
                className="px-1.5 py-0.5 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-[9px] font-semibold transition-all hover:scale-105"
              >
                Review →
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveStatus?.(story.id, "done");
                }}
                className="px-1.5 py-0.5 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[9px] font-semibold transition-all hover:scale-105"
              >
                ✓ Done
              </button>
            </>
          )}
          {story.status === "review" && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onMoveStatus?.(story.id, "done");
              }}
              className="px-2 py-0.5 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[9px] font-semibold transition-all hover:scale-105"
            >
              ✓ Done
            </button>
          )}
          {story.status !== "backlog" && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onMoveStatus?.(story.id, "backlog");
              }}
              className="px-1.5 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 text-[9px] font-medium transition-colors"
              title="Move back to Backlog"
            >
              ← Backlog
            </button>
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

  // Fetch pricing config
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

  // Recalculate columns
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

  const getColumnForId = useCallback(
    (id: string, currentStories: KanbanStory[]): string | null => {
      if (STATUS_COLUMNS.some((col) => col.id === id)) {
        return id;
      }
      const target = currentStories.find((s) => s.id === id);
      return target ? target.status : null;
    },
    []
  );

  const findStoryStatus = useCallback(
    (storyId: string): string | null => {
      const story = stories.find((s) => s.id === storyId);
      return story?.status || null;
    },
    [stories]
  );

  // Multi-tier collision detection for instant drop responsiveness
  const collisionDetectionStrategy = useCallback((args: any) => {
    const pointerCollisions = pointerWithin(args);
    if (pointerCollisions.length > 0) {
      return pointerCollisions;
    }
    const rectCollisions = rectIntersection(args);
    if (rectCollisions.length > 0) {
      return rectCollisions;
    }
    return closestCorners(args);
  }, []);

  const persistStatusChange = useCallback(
    async (storyId: string, newStatus: string) => {
      setSavingStatus((prev) => ({ ...prev, [storyId]: true }));
      try {
        const res = await fetch(`/api/projects/${slug}/stories/${storyId}/status`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        });
        const data = await res.json();
        if (data.pickedUpBy) {
          const story = stories.find((s) => s.id === storyId);
          const agentName = data.pickedUpByName || data.pickedUpBy;
          setPickupNotice(
            `"${story?.title || storyId}" moved to ${newStatus.toUpperCase()} & assigned to ${agentName}`
          );
          window.setTimeout(() => setPickupNotice(null), 5000);
          setStories((prev) =>
            prev.map((s) =>
              s.id === storyId ? { ...s, assignedAgent: data.pickedUpBy } : s
            )
          );
        }
      } catch (err) {
        console.error("Failed to persist status change", err);
      } finally {
        setSavingStatus((prev) => ({ ...prev, [storyId]: false }));
      }
    },
    [slug, stories]
  );

  const handleManualMoveStatus = useCallback(
    (storyId: string, newStatus: string) => {
      setStories((prev) =>
        prev.map((s) => {
          if (s.id === storyId) {
            return {
              ...s,
              status: newStatus,
              startedAt: newStatus === "in-progress" && !s.startedAt ? new Date().toISOString() : s.startedAt,
              completedAt: newStatus === "done" && !s.completedAt ? new Date().toISOString() : s.completedAt,
            };
          }
          return s;
        })
      );
      persistStatusChange(storyId, newStatus);
    },
    [persistStatusChange]
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

    const activeId = String(active.id);
    const overId = String(over.id);

    const activeStatus = findStoryStatus(activeId);
    const overStatus = getColumnForId(overId, stories);

    if (!activeStatus || !overStatus || activeStatus === overStatus) return;

    setStories((prev) => {
      const activeItem = prev.find((s) => s.id === activeId);
      if (!activeItem) return prev;

      const withoutActive = prev.filter((s) => s.id !== activeId);
      const updatedItem = { ...activeItem, status: overStatus };

      const overIndex = withoutActive.findIndex((s) => s.id === overId);
      if (overIndex >= 0) {
        withoutActive.splice(overIndex, 0, updatedItem);
        return withoutActive;
      } else {
        return [...withoutActive, updatedItem];
      }
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveStory(null);
    suppressClickAfterDrag();

    const activeId = String(active.id);
    const fromStatus = dragStartStatusRef.current;

    let targetStatus: string | null = null;
    if (over) {
      const overId = String(over.id);
      targetStatus = getColumnForId(overId, stories);
    }

    if (!targetStatus) {
      const currentStory = stories.find((s) => s.id === activeId);
      targetStatus = currentStory?.status || fromStatus || null;
    }

    if (targetStatus) {
      setStories((prev) =>
        prev.map((s) => {
          if (s.id === activeId) {
            return {
              ...s,
              status: targetStatus!,
              startedAt: targetStatus === "in-progress" && !s.startedAt ? new Date().toISOString() : s.startedAt,
              completedAt: targetStatus === "done" && !s.completedAt ? new Date().toISOString() : s.completedAt,
            };
          }
          return s;
        })
      );

      if (fromStatus && fromStatus !== targetStatus) {
        persistStatusChange(activeId, targetStatus);
      }
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
    if (updatedStory.status) {
      persistStatusChange(updatedStory.id, updatedStory.status);
    }
    setDetailStory(null);
  };

  const handleDeleteStory = (storyId: string) => {
    setStories((prev) => prev.filter((s) => s.id !== storyId));
    setDetailStory(null);
  };

  return (
    <div className="p-8 max-w-full mx-auto space-y-5">
      {/* Agent pickup notice */}
      {pickupNotice && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-50 border border-violet-200 text-violet-700 text-sm animate-in fade-in">
          <Bot className="w-4 h-4" />
          <span>{pickupNotice}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Columns3 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Kanban Work Execution Board</h1>
            <p className="text-sm text-muted-foreground">
              {totalStories} stories &middot; {totalHours.toFixed(1)}h estimated &middot; Drag across columns or use quick-action buttons
            </p>
          </div>

          <div className="flex items-center gap-2 ml-2">
            <span className="text-xs font-mono text-violet-700 bg-violet-50 border border-violet-200 dark:bg-violet-950/30 dark:text-violet-300 px-2.5 py-1 rounded-full font-medium">
              {formatCost(totalCost)} total ({formatTokens(totalTokens)} tok)
            </span>
            {totalValue > 0 && (
              <span className="text-xs font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 px-2.5 py-1 rounded-full font-medium">
                {formatDollars(totalValue)} ROI value
              </span>
            )}
            {totalIntel > 0 && (
              <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 px-2.5 py-1 rounded-full flex items-center gap-1 font-medium">
                <Brain className="w-3 h-3" />
                {totalIntel} AI intelligence
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleStartExecution}
            disabled={executing}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-all shadow-sm disabled:opacity-50"
            title="Immediately dispatch and run active stories in test harness"
          >
            {executing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Executing in Harness...</span>
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
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>New Story</span>
          </button>
        </div>
      </div>

      {/* Info Dispatch Banner */}
      <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-xs flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 shrink-0" />
          <span>
            <strong>Drag-and-Drop or Quick Move</strong>: Drag stories between columns or click <strong>▶ Doing</strong> on any story card to immediately start execution in the test harness.
          </span>
        </div>
        <div className="font-mono text-blue-600 font-semibold flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
          Test Harness Active
        </div>
      </div>

      {/* Kanban Grid — Status Columns */}
      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetectionStrategy}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {columns.map((col) => (
              <KanbanColumn
                key={col.id}
                column={col}
                isDraggingAny={Boolean(activeStory)}
              >
                {/* Column Header */}
                <div className={`p-4 border-b border-border border-t-4 ${col.color} rounded-t-2xl bg-card`}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">
                        {col.id === "backlog" ? "📋" : col.id === "in-progress" ? "🔄" : col.id === "review" ? "👀" : "✅"}
                      </span>
                      <h3 className="text-sm font-bold text-foreground">{col.label}</h3>
                    </div>
                    <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-muted text-foreground">
                      {col.stories.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-mono">
                    <span>{col.totalHours.toFixed(1)}h est</span>
                    <span>&middot;</span>
                    <span>{formatCost(col.stories.reduce((acc, s) => acc + estimateTokenCost(s, pricing).totalCost, 0))}</span>
                  </div>
                </div>

                {/* Story List Droppable Zone */}
                <div className="flex-1 p-2.5 space-y-2.5 min-h-[320px] flex flex-col">
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
                        onMoveStatus={handleManualMoveStatus}
                      />
                    ))}
                  </SortableContext>

                  {col.stories.length === 0 && (
                    <div className="flex-1 min-h-[160px] rounded-xl border-2 border-dashed border-border/80 flex flex-col items-center justify-center p-4 text-center bg-muted/20">
                      <span className="text-xs font-semibold text-muted-foreground mb-1">
                        {col.id === "in-progress" ? "Drop stories to start Doing" : `Drop stories here`}
                      </span>
                      <span className="text-[10px] text-muted-foreground/70">
                        {col.id === "in-progress"
                          ? "Stories will immediately enter the test harness"
                          : "Drag from other columns or use quick buttons"}
                      </span>
                    </div>
                  )}
                </div>
              </KanbanColumn>
            ))}
          </div>
        </div>

        {/* Drag Overlay for smooth cursor trailing */}
        <DragOverlay>
          {activeStory ? (
            <div className="p-3 rounded-xl border-2 border-blue-500 bg-card shadow-2xl opacity-95 min-w-[240px] max-w-[280px] rotate-1">
              <div className="flex items-center gap-1.5 mb-1">
                {activeStory.source === "intelligence" && (
                  <Brain className="w-3 h-3 text-amber-500" />
                )}
                <span className="text-xs font-mono font-bold text-muted-foreground">
                  {activeStory.id}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-mono font-semibold">
                  {activeStory.estimatedHours ?? (activeStory.points ? activeStory.points * 0.35 : 1)}h
                </span>
              </div>
              <h4 className="text-xs font-bold text-foreground">{activeStory.title}</h4>
              <div className="mt-1 flex items-center gap-1">
                <Zap className="w-3 h-3 text-violet-500" />
                <span className="text-[10px] font-mono text-violet-600 font-semibold">
                  {formatCost(estimateTokenCost(activeStory, pricing).totalCost)}
                </span>
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

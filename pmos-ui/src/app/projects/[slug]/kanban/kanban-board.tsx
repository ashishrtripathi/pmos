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
  getVerdictColor,
  storyRankScore,
  type PricingParams,
} from "@/lib/cost-estimation";

// ── Types ──────────────────────────────────────────

interface KanbanStory {
  id: string;
  title: string;
  description?: string;
  points: number;
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
  totalPoints,
}: {
  column: typeof STATUS_COLUMNS[0];
  count: number;
  totalPoints: number;
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
          <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
            {totalPoints} pts
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
  onClick,
}: {
  story: KanbanStory;
  pricing: PricingParams;
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

  const cost = estimateTokenCost(story.points, pricing);
  const roi = calculateROI(story.estimatedValue, story.points, pricing);
  const isIntelligence = story.source === "intelligence";
  const agentBadge = getAgentBadge(story.assignedAgent);

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
            <span className="text-[10px] px-1 py-0 rounded bg-primary/10 text-primary font-medium">
              {story.points} pts
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

          {/* Cost + ROI + Value */}
          <div className="mt-1.5 pt-1.5 border-t border-border/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="flex items-center gap-0.5">
                  <Zap className="w-2 h-2 text-violet-500" />
                  <span className="text-[9px] font-mono text-violet-600">
                    {formatCost(cost.totalCost)}
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
                href={`/projects/voxstyle/intelligence`}
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
      const totalPoints = colStories.reduce((sum, s) => sum + s.points, 0);
      return { ...col, stories: colStories, totalPoints };
    }),
    [stories]
  );

  const totals = useMemo(() => {
    const totalStories = stories.length;
    const totalPoints = stories.reduce((sum, s) => sum + s.points, 0);
    const totalCost = stories.reduce(
      (sum, s) => sum + estimateTokenCost(s.points, pricing).totalCost,
      0
    );
    const totalValue = stories.reduce((sum, s) => sum + (s.estimatedValue || 0), 0);
    const totalIntel = stories.filter((s) => s.source === "intelligence").length;
    return { totalStories, totalPoints, totalCost, totalValue, totalIntel };
  }, [stories, pricing]);

  const {
    totalStories,
    totalPoints,
    totalCost,
    totalValue,
    totalIntel,
  } = totals;

  // Persona options for the detail/create modals — journey personas are the
  // source of truth (must match the Customer Journey), merged with any
  // personas already used on stories so existing values stay selectable.
  // Fall back to the default personas only when no journey personas exist.
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

    // Find which column the over element is in (card id OR column id)
    let overStatus: string | null = null;
    for (const col of columns) {
      if (overId === col.id || col.stories.some((s) => s.id === overId)) {
        overStatus = col.id;
        break;
      }
    }
    if (!overStatus || overStatus === activeStatus) return;

    // Move story between columns
    setStories((prev) => {
      const updated = prev.map((s) => {
        if (s.id === activeId) {
          return { ...s, status: overStatus };
        }
        return s;
      });

      // Reorder within the target column. Only when dropping over another
      // card (overId is a story id), and account for the removed item
      // shifting indices down by one (fixes the card snapping back).
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
        if (!res.ok && !data.ok) {
          console.error("Failed to persist status change:", data);
        }
        if (data.pickedUpBy) {
          const story = stories.find((s) => s.id === storyId);
          const agentName = data.pickedUpByName || data.pickedUpBy;
          setPickupNotice(
            `"${story?.title || storyId}" picked up by ${agentName}`
          );
          window.setTimeout(() => setPickupNotice(null), 5000);
          // Reflect the assignment locally so the agent badge appears
          setStories((prev) =>
            prev.map((s) =>
              s.id === storyId ? { ...s, assignedAgent: data.pickedUpBy } : s
            )
          );
        }
      } catch {
        // Silently fail — the UI already reflects the change
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

    // The optimistic reorder in handleDragOver already changed story.status,
    // so compare against the status captured at drag start instead.
    const originalStatus = dragStartStatusRef.current ?? story.status;
    dragStartStatusRef.current = null;

    // Find which column the over element is in
    for (const col of columns) {
      if (col.stories.some((s) => s.id === overId) || col.id === overId) {
        if (col.id !== originalStatus) {
          persistStatusChange(activeId, col.id);
        }
        break;
      }
    }

    // Reorder only when the drop stayed within the drag-origin column.
    // Cross-column moves were already reordered in handleDragOver; re-splicing
    // here (using the optimistic status) snapped the card back to its old
    // index — the root cause of BUG-001.
    const overStatus = findStoryStatus(overId);
    if (originalStatus && overStatus && originalStatus === overStatus) {
      setStories((prev) => {
        const updated = [...prev];
        const activeIndex = updated.findIndex((s) => s.id === activeId);
        const overIndex = updated.findIndex((s) => s.id === overId);
        if (activeIndex >= 0 && overIndex >= 0 && activeIndex !== overIndex) {
          const [moved] = updated.splice(activeIndex, 1);
          const insertAt = activeIndex < overIndex ? overIndex - 1 : overIndex;
          updated.splice(insertAt, 0, moved);
        }
        return updated;
      });
    }
  };

  // Suppress the click event dnd-kit fires after a drop so the story
  // detail modal doesn't open right after a drag.
  const suppressClickAfterDrag = () => {
    suppressClickRef.current = true;
    window.setTimeout(() => {
      suppressClickRef.current = false;
    }, 0);
  };

  const handleDragCancel = () => {
    setActiveStory(null);
    dragStartStatusRef.current = null;
    suppressClickAfterDrag();
  };

  // Also persist when dropping onto an empty column
  const handleDropOnColumn = useCallback(
    (columnId: string, storyId: string) => {
      const story = stories.find((s) => s.id === storyId);
      if (story && story.status !== columnId) {
        persistStatusChange(storyId, columnId);
      }
    },
    [stories, persistStatusChange]
  );

  const handleStoryClick = (story: KanbanStory) => {
    setDetailStory(story);
  };

  const handleStorySave = (updated: KanbanStory) => {
    setStories((prev) =>
      prev.map((s) => (s.id === updated.id ? { ...s, ...updated } : s))
    );
    setDetailStory(null);
  };

  const handleStoryCreated = (story: KanbanStory) => {
    // Persisted via POST /api/projects/[slug]/stories — append to the board
    setStories((prev) =>
      prev.some((s) => s.id === story.id) ? prev : [...prev, story]
    );
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
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Columns3 className="w-5 h-5" />
          <h1 className="text-2xl font-bold">Kanban</h1>
          <span className="text-sm text-muted-foreground">
            {totalStories} stories &middot;{" "}
            {totalPoints} pts
          </span>
          <span className="text-sm font-mono text-violet-600 bg-violet-50 px-2 py-0.5 rounded">
            {formatCost(totalCost)} cost
          </span>
          {totalValue > 0 && (
            <span className="text-sm font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
              {formatDollars(totalValue)} value
            </span>
          )}
          {totalIntel > 0 && (
            <span className="text-sm text-amber-600 bg-amber-50 px-2 py-0.5 rounded flex items-center gap-1 font-medium">
              <Brain className="w-3.5 h-3.5" />
              {totalIntel} from intelligence
            </span>
          )}
          <span
            className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border border-green-200 bg-green-50 text-green-700 font-medium"
            title="Scheduled AionUi task 'PMOS Story Worker' runs every 10 minutes"
          >
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Agent worker: every 10 min
          </span>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          New Story
        </button>
      </div>

      {/* Agent dispatch hint */}
      <div className="mb-5 flex items-center gap-2 px-4 py-2.5 rounded-md bg-blue-50 border border-blue-200 text-blue-700 text-sm">
        <Bot className="w-4 h-4 shrink-0" />
        <span>
          Drag a story to <strong>Doing</strong> — the best-fit agent picks it up
          instantly, and the background worker implements it (checks every 10
          min). Card badge shows:{" "}
          <span className="font-medium text-amber-600">queued</span> →{" "}
          <span className="font-medium text-emerald-600">working</span> →{" "}
          <span className="font-medium text-green-600">done</span>.
        </span>
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
                {/* Column Header */}
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
                      {col.totalPoints} pts
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
                        onClick={() => {
                    if (suppressClickRef.current) return;
                    handleStoryClick(story);
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
                <span className="text-[10px] px-1 py-0.5 rounded bg-primary/10 text-primary font-medium">
                  {activeStory.points} pts
                </span>
              </div>
              <h4 className="text-xs font-medium">{activeStory.title}</h4>
              {activeStory.description && (
                <p className="text-[9px] text-muted-foreground mt-0.5 line-clamp-2">{activeStory.description}</p>
              )}
              <div className="mt-1 flex items-center gap-1">
                <Zap className="w-2.5 h-2.5 text-violet-500" />
                <span className="text-[9px] font-mono text-violet-600">
                  {formatCost(estimateTokenCost(activeStory.points, pricing).totalCost)}
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
          onSave={handleStorySave}
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
          onCreated={handleStoryCreated}
          personas={personaOptions}
        />
      )}
    </div>
  );
}

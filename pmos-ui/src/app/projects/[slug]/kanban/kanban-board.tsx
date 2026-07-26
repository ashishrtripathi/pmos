"use client";

import { useState, useCallback } from "react";
import {
  Columns3,
  GripVertical,
  User,
  Target,
  Zap,
  DollarSign,
  TrendingUp,
  Bot,
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
  type DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  KanbanStoryModal,
} from "@/components/story-detail-modal";
import {
  estimateTokenCost,
  calculateROI,
  formatCost,
  formatDollars,
  getVerdictColor,
} from "@/lib/cost-estimation";

// ── Types ──────────────────────────────────────────

interface Agent {
  id: string;
  name: string;
  role: string;
  focus: string[];
}

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
  filePath?: string;
}

// ── Constants ──────────────────────────────────────

const AGENT_COLORS: Record<string, string> = {
  "product-manager": "border-t-purple-500",
  "ux-designer": "border-t-pink-500",
  architect: "border-t-orange-500",
  "software-engineer": "border-t-blue-500",
  "qa-engineer": "border-t-green-500",
  "documentation-agent": "border-t-yellow-500",
  "product-intelligence": "border-t-red-500",
};

const AGENT_INITIALS: Record<string, string> = {
  "product-manager": "PM",
  "ux-designer": "UX",
  architect: "AR",
  "software-engineer": "SE",
  "qa-engineer": "QA",
  "documentation-agent": "DO",
  "product-intelligence": "PI",
};

const PERSONA_COLORS: Record<string, string> = {
  Sarah: "bg-purple-100 text-purple-700 border-purple-300",
  Mike: "bg-blue-100 text-blue-700 border-blue-300",
  Emma: "bg-green-100 text-green-700 border-green-300",
};

function getPersonaColor(name?: string): string {
  if (!name) return "bg-gray-100 text-gray-700 border-gray-300";
  return PERSONA_COLORS[name] || "bg-gray-100 text-gray-700 border-gray-300";
}

// ── Kanban Story Card (Sortable + Clickable) ────────

function KanbanStoryCard({
  story,
  onClick,
}: {
  story: KanbanStory;
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

  const cost = estimateTokenCost(story.points);
  const roi = calculateROI(story.estimatedValue, story.points);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="p-2.5 rounded-lg border border-border bg-background shadow-sm hover:shadow-md hover:border-primary/30 transition-all group cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start gap-2">
        <button
          className="mt-0.5 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="w-3.5 h-3.5" />
        </button>
        <div className="flex-1 min-w-0">
          {/* ID + Points + Persona */}
          <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
            <span className="text-xs font-mono text-muted-foreground">
              {story.id}
            </span>
            <span className="text-[10px] px-1 py-0.5 rounded bg-primary/10 text-primary font-medium">
              {story.points} pts
            </span>
            {story.persona && (
              <span
                className={`text-[9px] px-1 py-0.5 rounded-full border font-medium ${getPersonaColor(story.persona)}`}
              >
                <User className="w-2 h-2 inline mr-0.5" />
                {story.persona}
              </span>
            )}
          </div>

          {/* Title */}
          <h4 className="text-xs font-medium leading-tight">{story.title}</h4>

          {/* Use Case preview */}
          {story.useCase?.asA && (
            <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">
              As a {story.useCase.asA}...
            </p>
          )}

          {/* Business Goal */}
          {story.businessGoal && (
            <div className="mt-1 flex items-center gap-1">
              <Target className="w-2.5 h-2.5 text-amber-500 shrink-0" />
              <span className="text-[10px] text-muted-foreground line-clamp-1">
                {story.businessGoal}
              </span>
            </div>
          )}

          {/* Cost + ROI */}
          <div className="mt-1.5 pt-1.5 border-t border-border/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Zap className="w-2.5 h-2.5 text-violet-500" />
                <span className="text-[9px] font-mono text-violet-600">
                  {formatCost(cost.totalCost)}
                </span>
              </div>
              {roi.estimatedValue > 0 && (
                <div
                  className={`text-[9px] px-1 py-0 rounded font-bold border ${getVerdictColor(roi.verdict)}`}
                >
                  {roi.roiMultiple}
                </div>
              )}
            </div>
            {roi.estimatedValue > 0 && (
              <div className="text-[9px] text-emerald-600 mt-0.5">
                <TrendingUp className="w-2 h-2 inline mr-0.5" />
                Value: {formatDollars(roi.estimatedValue)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Agent Column ────────────────────────────────────

function AgentColumn({
  agent,
  stories,
  onStoryClick,
}: {
  agent: Agent;
  stories: KanbanStory[];
  onStoryClick: (story: KanbanStory) => void;
}) {
  const totalPoints = stories.reduce((sum, s) => sum + s.points, 0);
  const totalCost = stories.reduce(
    (sum, s) => sum + estimateTokenCost(s.points).totalCost,
    0
  );
  const totalValue = stories.reduce((sum, s) => sum + (s.estimatedValue || 0), 0);
  const colorClass = AGENT_COLORS[agent.id] || "border-t-gray-400";
  const initials =
    AGENT_INITIALS[agent.id] || agent.name.substring(0, 2).toUpperCase();

  return (
    <div
      className={`flex flex-col border-t-2 ${colorClass} rounded-xl bg-card min-w-[220px] w-[220px] shrink-0`}
    >
      {/* Agent Header */}
      <div className="p-3 border-b border-border">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
            {initials}
          </div>
          <div className="min-w-0">
            <h3 className="text-xs font-semibold truncate">{agent.name}</h3>
            <span className="text-[10px] text-muted-foreground">
              {agent.role}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
          <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
            {stories.length} stories
          </span>
          <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
            {totalPoints} pts
          </span>
          <span className="text-[10px] text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded font-mono">
            {formatCost(totalCost)}
          </span>
          {totalValue > 0 && (
            <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-mono">
              +{formatDollars(totalValue)}
            </span>
          )}
        </div>
      </div>

      {/* Focus Areas */}
      <div className="px-3 py-2 border-b border-border">
        <div className="flex flex-wrap gap-1">
          {agent.focus.map((f) => (
            <span
              key={f}
              className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
            >
              {f}
            </span>
          ))}
        </div>
      </div>

      {/* Story List */}
      <div className="flex-1 p-2 space-y-1.5 min-h-[120px]">
        <SortableContext
          items={stories.map((s) => s.id)}
          strategy={verticalListSortingStrategy}
        >
          {stories.map((story) => (
            <KanbanStoryCard
              key={story.id}
              story={story}
              onClick={() => onStoryClick(story)}
            />
          ))}
        </SortableContext>
        {stories.length === 0 && (
          <div className="h-16 rounded-lg border border-dashed border-border flex items-center justify-center text-[10px] text-muted-foreground">
            No stories assigned
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Board ──────────────────────────────────────

export function KanbanBoard({
  params,
  agents,
  initialAssignments,
  allStories,
}: {
  params: { slug: string };
  agents: Agent[];
  initialAssignments: Record<string, KanbanStory[]>;
  allStories: KanbanStory[];
}) {
  const { slug } = params;
  const [activeStory, setActiveStory] = useState<KanbanStory | null>(null);
  const [detailStory, setDetailStory] = useState<KanbanStory | null>(null);

  const unassigned = allStories.filter(
    (s) =>
      !Object.values(initialAssignments)
        .flat()
        .some((a) => a.id === s.id)
  );

  const [assignments, setAssignments] = useState<
    Record<string, KanbanStory[]>
  >(
    Object.keys(initialAssignments).length > 0
      ? initialAssignments
      : Object.fromEntries(agents.map((a) => [a.id, []]))
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const findAgent = useCallback(
    (storyId: string): string | null => {
      for (const [agentId, stories] of Object.entries(assignments)) {
        if (stories.find((s) => s.id === storyId)) return agentId;
      }
      return null;
    },
    [assignments]
  );

  const handleDragStart = (event: DragStartEvent) => {
    const story = event.active.data.current?.story as KanbanStory;
    if (story) setActiveStory(story);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeAgent = findAgent(activeId);
    const overAgent = findAgent(overId);

    if (!activeAgent || !overAgent) return;
    if (activeAgent === overAgent) return;

    setAssignments((prev) => {
      const updated = { ...prev };
      const activeItems = [...(updated[activeAgent] || [])];
      const overItems = [...(updated[overAgent] || [])];

      const activeIndex = activeItems.findIndex((s) => s.id === activeId);
      if (activeIndex < 0) return prev;
      const activeItem = activeItems[activeIndex];
      activeItems.splice(activeIndex, 1);

      const overIndex = overItems.findIndex((s) => s.id === overId);
      if (overIndex >= 0) {
        overItems.splice(overIndex, 0, activeItem);
      } else {
        overItems.push(activeItem);
      }

      updated[activeAgent] = activeItems;
      updated[overAgent] = overItems;
      return updated;
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveStory(null);
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    const activeAgent = findAgent(activeId);
    const overAgent = findAgent(overId);

    if (!activeAgent) return;

    if (activeAgent === overAgent && overAgent) {
      setAssignments((prev) => {
        const updated = { ...prev };
        const items = [...(updated[activeAgent] || [])];
        const activeIndex = items.findIndex((s) => s.id === activeId);
        const overIndex = items.findIndex((s) => s.id === overId);
        if (activeIndex >= 0 && overIndex >= 0) {
          const [moved] = items.splice(activeIndex, 1);
          items.splice(overIndex, 0, moved);
        }
        updated[activeAgent] = items;
        return updated;
      });
    }
  };

  const handleStoryClick = (story: KanbanStory) => {
    setDetailStory(story);
  };

  const handleStorySave = (updated: KanbanStory) => {
    setAssignments((prev) => {
      const next = { ...prev };
      for (const [agentId, stories] of Object.entries(next)) {
        next[agentId] = stories.map((s) =>
          s.id === updated.id ? updated : s
        );
      }
      return next;
    });
    setDetailStory(null);
  };

  const totalAssigned = Object.values(assignments).flat().length;
  const totalPoints = allStories.reduce((sum, s) => sum + s.points, 0);
  const totalCost = allStories.reduce(
    (sum, s) => sum + estimateTokenCost(s.points).totalCost,
    0
  );
  const totalValue = allStories.reduce(
    (sum, s) => sum + (s.estimatedValue || 0),
    0
  );

  return (
    <div className="p-8 max-w-full mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Columns3 className="w-5 h-5" />
          <h1 className="text-2xl font-bold">Agent Kanban</h1>
          <span className="text-sm text-muted-foreground">
            {agents.length} agents &middot; {totalAssigned} assigned &middot;{" "}
            {totalPoints} pts
          </span>
          <span className="text-sm font-mono text-violet-600 bg-violet-50 px-2 py-0.5 rounded">
            {formatCost(totalCost)} est. cost
          </span>
          {totalValue > 0 && (
            <span className="text-sm font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
              {formatDollars(totalValue)} est. value
            </span>
          )}
        </div>
      </div>

      {/* Kanban Grid — HORIZONTAL SCROLL */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-3 min-w-max">
            {agents.map((agent) => (
              <AgentColumn
                key={agent.id}
                agent={agent}
                stories={assignments[agent.id] || []}
                onStoryClick={handleStoryClick}
              />
            ))}
          </div>
        </div>

        <DragOverlay>
          {activeStory ? (
            <div className="p-2.5 rounded-lg border border-primary bg-card shadow-lg opacity-90 min-w-[200px] max-w-[240px]">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-xs font-mono text-muted-foreground">
                  {activeStory.id}
                </span>
                <span className="text-[10px] px-1 py-0.5 rounded bg-primary/10 text-primary font-medium">
                  {activeStory.points} pts
                </span>
                {activeStory.persona && (
                  <span
                    className={`text-[9px] px-1 py-0.5 rounded-full border font-medium ${getPersonaColor(activeStory.persona)}`}
                  >
                    {activeStory.persona}
                  </span>
                )}
              </div>
              <h4 className="text-xs font-medium">{activeStory.title}</h4>
              {activeStory.useCase?.asA && (
                <p className="text-[10px] text-muted-foreground mt-1">
                  As a {activeStory.useCase.asA}...
                </p>
              )}
              <div className="mt-1 flex items-center gap-1">
                <Zap className="w-2.5 h-2.5 text-violet-500" />
                <span className="text-[9px] font-mono text-violet-600">
                  {formatCost(
                    estimateTokenCost(activeStory.points).totalCost
                  )}
                </span>
                {calculateROI(activeStory.estimatedValue, activeStory.points)
                  .estimatedValue > 0 && (
                  <span
                    className={`text-[9px] px-1 py-0 rounded font-bold ${getVerdictColor(
                      calculateROI(
                        activeStory.estimatedValue,
                        activeStory.points
                      ).verdict
                    )}`}
                  >
                    {
                      calculateROI(
                        activeStory.estimatedValue,
                        activeStory.points
                      ).roiMultiple
                    }
                  </span>
                )}
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Story Detail / Edit Modal */}
      {detailStory && (
        <KanbanStoryModal
          story={detailStory}
          onClose={() => setDetailStory(null)}
          onSave={handleStorySave}
          personas={[
            ...new Set(
              allStories.map((s) => s.persona).filter(Boolean)
            ),
          ] as string[]}
          agents={agents.map((a) => a.name)}
        />
      )}
    </div>
  );
}

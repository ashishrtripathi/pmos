"use client";

import { useState, useCallback } from "react";
import { Columns3, GripVertical, Plus } from "lucide-react";
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

// ── Types ──────────────────────────────────────────

interface AgentStory {
  id: string;
  title: string;
  points: number;
  status: string;
  description?: string;
}

interface Agent {
  id: string;
  name: string;
  role: string;
  focus: string[];
}

const AGENT_COLORS: Record<string, string> = {
  "product-manager": "border-t-purple-500",
  "ux-designer": "border-t-pink-500",
  "architect": "border-t-orange-500",
  "software-engineer": "border-t-blue-500",
  "qa-engineer": "border-t-green-500",
  "documentation-agent": "border-t-yellow-500",
  "product-intelligence": "border-t-red-500",
};

const AGENT_INITIALS: Record<string, string> = {
  "product-manager": "PM",
  "ux-designer": "UX",
  "architect": "AR",
  "software-engineer": "SE",
  "qa-engineer": "QA",
  "documentation-agent": "DO",
  "product-intelligence": "PI",
};

// ── Story Card (Sortable) ──────────────────────────

function KanbanStoryCard({ story }: { story: AgentStory }) {
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="p-2.5 rounded-lg border border-border bg-background shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-start gap-2">
        <button
          className="mt-0.5 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="w-3.5 h-3.5" />
        </button>
        <div className="flex-1 min-w-0">
          <span className="text-xs font-mono text-muted-foreground block mb-0.5">
            {story.id}
          </span>
          <h4 className="text-xs font-medium leading-tight">{story.title}</h4>
          <span className="text-xs text-muted-foreground mt-1 inline-block">
            {story.points} pts
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Agent Column ───────────────────────────────────

function AgentColumn({
  agent,
  stories,
}: {
  agent: Agent;
  stories: AgentStory[];
}) {
  const totalPoints = stories.reduce((sum, s) => sum + s.points, 0);
  const colorClass = AGENT_COLORS[agent.id] || "border-t-gray-400";
  const initials = AGENT_INITIALS[agent.id] || agent.name.substring(0, 2).toUpperCase();

  return (
    <div className={`flex flex-col border-t-2 ${colorClass} rounded-xl bg-card min-w-[180px]`}>
      {/* Agent Header */}
      <div className="p-3 border-b border-border">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
            {initials}
          </div>
          <div className="min-w-0">
            <h3 className="text-xs font-semibold truncate">{agent.name}</h3>
            <span className="text-[10px] text-muted-foreground">{agent.role}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
            {stories.length} stories
          </span>
          <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
            {totalPoints} pts
          </span>
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
            <KanbanStoryCard key={story.id} story={story} />
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

// ── Main Kanban ────────────────────────────────────

export function KanbanBoard({
  params,
  agents,
  initialAssignments,
  allStories,
}: {
  params: { slug: string };
  agents: Agent[];
  initialAssignments: Record<string, AgentStory[]>;
  allStories: AgentStory[];
}) {
  const { slug } = params;
  const [activeStory, setActiveStory] = useState<AgentStory | null>(null);
  const [showAssign, setShowAssign] = useState(false);

  // Merge: start with initial assignments, but add any unassigned stories to a "unassigned" virtual column
  const unassigned = allStories.filter(
    (s) => !Object.values(initialAssignments).flat().some((a) => a.id === s.id)
  );

  const [assignments, setAssignments] = useState<Record<string, AgentStory[]>>(
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
    const story = event.active.data.current?.story as AgentStory;
    if (story) setActiveStory(story);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeAgent = findAgent(activeId);
    const overAgent = findAgent(overId) || (AGENTS_MAP[overId] ? overId : null);

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

  const totalAssigned = Object.values(assignments).flat().length;
  const unassignedCount = allStories.length - totalAssigned;

  return (
    <div className="p-8 max-w-full mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Columns3 className="w-5 h-5" />
          <h1 className="text-2xl font-bold">Agent Kanban</h1>
          <span className="text-sm text-muted-foreground">
            {agents.length} agents · {totalAssigned} assigned
            {unassignedCount > 0 && (
              <span className="text-yellow-600 ml-1">· {unassignedCount} unassigned</span>
            )}
          </span>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-3 overflow-x-auto pb-4">
          {agents.map((agent) => (
            <AgentColumn
              key={agent.id}
              agent={agent}
              stories={assignments[agent.id] || []}
            />
          ))}
        </div>

        <DragOverlay>
          {activeStory ? (
            <div className="p-2.5 rounded-lg border border-primary bg-card shadow-lg opacity-90 min-w-[160px]">
              <span className="text-xs font-mono text-muted-foreground block">
                {activeStory.id}
              </span>
              <h4 className="text-xs font-medium">{activeStory.title}</h4>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

// Helper to map agent IDs
const AGENTS_MAP: Record<string, string> = {
  "product-manager": "product-manager",
  "ux-designer": "ux-designer",
  "architect": "architect",
  "software-engineer": "software-engineer",
  "qa-engineer": "qa-engineer",
  "documentation-agent": "documentation-agent",
  "product-intelligence": "product-intelligence",
};

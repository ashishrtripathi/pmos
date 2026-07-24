"use client";

import { useState, useCallback } from "react";
import { BookOpen, Plus, GripVertical, X } from "lucide-react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
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

interface Story {
  id: string;
  title: string;
  description: string;
  points: number;
  status: string;
  acceptanceCriteria: string[];
}

type ColumnId = "backlog" | "in-progress" | "review" | "done";

const COLUMNS: { id: ColumnId; label: string; color: string }[] = [
  { id: "backlog", label: "Backlog", color: "border-t-gray-400" },
  { id: "in-progress", label: "In Progress", color: "border-t-blue-500" },
  { id: "review", label: "Review", color: "border-t-yellow-500" },
  { id: "done", label: "Done", color: "border-t-green-500" },
];

// ── Story Card ─────────────────────────────────────

function StoryCard({
  story,
  onRemove,
}: {
  story: Story;
  onRemove?: () => void;
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="p-3 rounded-lg border border-border bg-card shadow-sm hover:shadow-md transition-shadow group"
    >
      <div className="flex items-start gap-2">
        <button
          className="mt-1 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-muted-foreground">{story.id}</span>
            <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
              {story.points} pts
            </span>
          </div>
          <h4 className="text-sm font-medium leading-tight">{story.title}</h4>
          {story.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {story.description}
            </p>
          )}
        </div>
        {onRemove && (
          <button
            onClick={onRemove}
            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 transition-all"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}

// ── Column ─────────────────────────────────────────

function StoryColumn({
  column,
  stories,
  onRemoveStory,
}: {
  column: (typeof COLUMNS)[number];
  stories: Story[];
  onRemoveStory: (id: string) => void;
}) {
  const totalPoints = stories.reduce((sum, s) => sum + s.points, 0);

  return (
    <div className={`flex flex-col border-t-2 ${column.color} rounded-xl bg-muted/30`}>
      <div className="px-3 py-2 border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">{column.label}</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
              {stories.length}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {totalPoints} pts
            </span>
          </div>
        </div>
      </div>
      <div className="flex-1 p-2 space-y-2 min-h-[200px]">
        <SortableContext
          items={stories.map((s) => s.id)}
          strategy={verticalListSortingStrategy}
        >
          {stories.map((story) => (
            <StoryCard
              key={story.id}
              story={story}
              onRemove={() => onRemoveStory(story.id)}
            />
          ))}
        </SortableContext>
        {stories.length === 0 && (
          <div className="h-20 rounded-lg border border-dashed border-border flex items-center justify-center text-xs text-muted-foreground">
            Drop stories here
          </div>
        )}
      </div>
    </div>
  );
}

// ── Create Story Form ──────────────────────────────

function CreateStoryForm({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (story: { title: string; description: string; points: number; acceptanceCriteria: string[] }) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [points, setPoints] = useState(5);
  const [criteria, setCriteria] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onCreate({
      title: title.trim(),
      description: description.trim(),
      points,
      acceptanceCriteria: criteria
        .split("\n")
        .map((c) => c.trim())
        .filter(Boolean),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md p-6 rounded-2xl bg-card border border-border shadow-2xl"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Create Story</h2>
          <button type="button" onClick={onClose}>
            <X className="w-5 h-5 text-muted-foreground hover:text-foreground" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Add dark mode support"
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              autoFocus
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="As a user, I want..."
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">
              Story Points: <span className="font-bold">{points}</span>
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
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">
              Acceptance Criteria (one per line)
            </label>
            <textarea
              value={criteria}
              onChange={(e) => setCriteria(e.target.value)}
              placeholder={"Toggle works in header\nTheme persists across sessions\nAll components update colors"}
              rows={4}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
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

// ── Main Board ─────────────────────────────────────

export function StoriesBoard({
  params,
  initialStories,
}: {
  params: { slug: string };
  initialStories: Record<ColumnId, Story[]>;
}) {
  const { slug } = params;
  const [showCreate, setShowCreate] = useState(false);
  const [activeStory, setActiveStory] = useState<Story | null>(null);

  const [columns, setColumns] = useState<Record<ColumnId, Story[]>>(initialStories);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const findColumn = useCallback(
    (storyId: string): ColumnId | null => {
      for (const [colId, stories] of Object.entries(columns)) {
        if (stories.find((s) => s.id === storyId)) return colId as ColumnId;
      }
      return null;
    },
    [columns]
  );

  const handleDragStart = (event: DragStartEvent) => {
    const story = event.active.data.current?.story as Story;
    if (story) setActiveStory(story);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeCol = findColumn(activeId);
    // If dropped on a column header (the column ID itself), use that column
    const overCol = findColumn(overId) || (COLUMNS.find((c) => c.id === overId)?.id as ColumnId);

    if (!activeCol || !overCol || activeCol === overCol) return;

    setColumns((prev) => {
      const updated = { ...prev };
      const activeItems = [...updated[activeCol]];
      const overItems = [...updated[overCol]];

      const activeIndex = activeItems.findIndex((s) => s.id === activeId);
      const activeItem = activeItems[activeIndex];
      activeItems.splice(activeIndex, 1);

      const overIndex = overItems.findIndex((s) => s.id === overId);
      if (overIndex >= 0) {
        overItems.splice(overIndex, 0, { ...activeItem, status: overCol });
      } else {
        overItems.push({ ...activeItem, status: overCol });
      }

      updated[activeCol] = activeItems;
      updated[overCol] = overItems;
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

    const activeCol = findColumn(activeId);
    const overCol = findColumn(overId);

    if (!activeCol) return;

    if (activeCol === overCol && overCol) {
      setColumns((prev) => {
        const updated = { ...prev };
        const items = [...updated[activeCol]];
        const activeIndex = items.findIndex((s) => s.id === activeId);
        const overIndex = items.findIndex((s) => s.id === overId);
        if (activeIndex >= 0 && overIndex >= 0) {
          const [moved] = items.splice(activeIndex, 1);
          items.splice(overIndex, 0, moved);
        }
        updated[activeCol] = items;
        return updated;
      });
    }
  };

  const handleCreate = (story: {
    title: string;
    description: string;
    points: number;
    acceptanceCriteria: string[];
  }) => {
    const newStory: Story = {
      id: `STORY-${String(Math.floor(Math.random() * 900) + 100)}`,
      ...story,
      status: "backlog",
    };
    setColumns((prev) => ({
      ...prev,
      backlog: [...prev.backlog, newStory],
    }));
  };

  const handleRemoveStory = (storyId: string) => {
    setColumns((prev) => {
      const updated = { ...prev };
      for (const colId of Object.keys(updated) as ColumnId[]) {
        updated[colId] = updated[colId].filter((s) => s.id !== storyId);
      }
      return updated;
    });
  };

  const totalPoints = Object.values(columns)
    .flat()
    .reduce((sum, s) => sum + s.points, 0);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <BookOpen className="w-5 h-5" />
          <h1 className="text-2xl font-bold">Story Map</h1>
          <span className="text-sm text-muted-foreground">
            {Object.values(columns).flat().length} stories · {totalPoints} points
          </span>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Story
        </button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-4 gap-4">
          {COLUMNS.map((col) => (
            <StoryColumn
              key={col.id}
              column={col}
              stories={columns[col.id]}
              onRemoveStory={handleRemoveStory}
            />
          ))}
        </div>

        <DragOverlay>
          {activeStory ? (
            <div className="p-3 rounded-lg border border-primary bg-card shadow-lg opacity-90 w-[250px]">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono text-muted-foreground">{activeStory.id}</span>
                <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
                  {activeStory.points} pts
                </span>
              </div>
              <h4 className="text-sm font-medium">{activeStory.title}</h4>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {showCreate && (
        <CreateStoryForm
          onClose={() => setShowCreate(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
  );
}

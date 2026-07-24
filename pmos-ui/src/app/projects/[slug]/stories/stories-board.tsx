"use client";

import { useState, useCallback } from "react";
import { BookOpen, Plus, GripVertical, X, Target, DollarSign, User, ChevronDown, ChevronRight } from "lucide-react";
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
  useCase: {
    asA: string;
    iWant: string;
    soThat: string;
  };
  businessGoal?: string;
  acceptanceCriteria: AcceptanceCriterion[];
  persona?: string;
  personaRole?: string;
  journeyStep?: string;
}

type ColumnId = "backlog" | "in-progress" | "review" | "done";

const COLUMNS: { id: ColumnId; label: string; color: string }[] = [
  { id: "backlog", label: "Backlog", color: "border-t-gray-400" },
  { id: "in-progress", label: "In Progress", color: "border-t-blue-500" },
  { id: "review", label: "Review", color: "border-t-yellow-500" },
  { id: "done", label: "Done", color: "border-t-green-500" },
];

const PERSONA_COLORS: Record<string, string> = {
  Sarah: "bg-purple-100 text-purple-700 border-purple-300",
  Mike: "bg-blue-100 text-blue-700 border-blue-300",
  Emma: "bg-green-100 text-green-700 border-green-300",
};

function getPersonaColor(name?: string): string {
  if (!name) return "bg-gray-100 text-gray-700 border-gray-300";
  return PERSONA_COLORS[name] || "bg-gray-100 text-gray-700 border-gray-300";
}

// ── Story Card ──────────────────────────────────────

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

  const [expanded, setExpanded] = useState(false);

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
          {/* Story ID + Points + Persona Badge */}
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-xs font-mono text-muted-foreground">{story.id}</span>
            <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
              {story.points} pts
            </span>
            {story.persona && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${getPersonaColor(story.persona)}`}>
                <User className="w-2.5 h-2.5 inline mr-0.5" />
                {story.persona}
                {story.personaRole ? ` — ${story.personaRole}` : ""}
              </span>
            )}
          </div>

          {/* Title */}
          <h4 className="text-sm font-medium leading-tight">{story.title}</h4>

          {/* Use Case */}
          {story.useCase?.asA && (
            <div className="mt-2 p-2 rounded bg-muted/50 text-xs leading-relaxed">
              <span className="text-muted-foreground">As a</span> <span className="font-medium">{story.useCase.asA}</span>
              <br />
              <span className="text-muted-foreground">I want to</span> <span className="font-medium">{story.useCase.iWant}</span>
              <br />
              <span className="text-muted-foreground">so that</span> <span className="font-medium">{story.useCase.soThat}</span>
            </div>
          )}

          {/* Business Goal */}
          {story.businessGoal && (
            <div className="mt-2 flex items-start gap-1 text-xs">
              <Target className="w-3 h-3 text-amber-500 mt-0.5 shrink-0" />
              <span className="text-muted-foreground line-clamp-2">{story.businessGoal}</span>
            </div>
          )}

          {/* Journey Step */}
          {story.journeyStep && (
            <div className="mt-1 text-[10px] text-muted-foreground">
              Journey: {story.journeyStep}
            </div>
          )}

          {/* Expand/Collapse AC */}
          {story.acceptanceCriteria?.length > 0 && story.acceptanceCriteria[0].scenario !== "Default" && (
            <div className="mt-2">
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
              >
                {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                {story.acceptanceCriteria.length} Acceptance Criteria
              </button>
              {expanded && (
                <div className="mt-1.5 space-y-2 pl-1">
                  {story.acceptanceCriteria.map((ac, i) => (
                    <div key={i} className="text-[10px] p-1.5 rounded bg-muted/30">
                      <div className="font-medium text-foreground">Scenario: {ac.scenario}</div>
                      {ac.given.map((g, gi) => (
                        <div key={gi} className="text-muted-foreground">Given: {g}</div>
                      ))}
                      <div className="text-muted-foreground">When: {ac.when}</div>
                      <div className="text-green-600">Then: {ac.then}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
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

// ── Column ──────────────────────────────────────────

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
      <div className="flex-1 p-2 space-y-2 min-h-[200px] overflow-y-auto max-h-[calc(100vh-300px)]">
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

// ── Create Story Form ────────────────────────────────

function CreateStoryForm({
  onClose,
  onCreate,
  personas,
}: {
  onClose: () => void;
  onCreate: (story: Story) => void;
  personas: string[];
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [points, setPoints] = useState(5);
  const [persona, setPersona] = useState("");
  const [personaRole, setPersonaRole] = useState("");
  const [journeyStep, setJourneyStep] = useState("");
  const [asA, setAsA] = useState("");
  const [iWant, setIWant] = useState("");
  const [soThat, setSoThat] = useState("");
  const [businessGoal, setBusinessGoal] = useState("");
  const [acScenario, setAcScenario] = useState("");
  const [acGiven, setAcGiven] = useState("");
  const [acWhen, setAcWhen] = useState("");
  const [acThen, setAcThen] = useState("");

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
        asA: asA.trim() || persona,
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
      journeyStep: journeyStep || undefined,
    };

    onCreate(story);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 rounded-2xl bg-card border border-border shadow-2xl"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Create User Story</h2>
          <button type="button" onClick={onClose}>
            <X className="w-5 h-5 text-muted-foreground hover:text-foreground" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Title */}
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

          {/* Persona Selection */}
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
              <label className="text-sm font-medium mb-1 block">Persona Role</label>
              <input
                type="text"
                value={personaRole}
                onChange={(e) => setPersonaRole(e.target.value)}
                placeholder="Content Creator"
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Journey Step */}
          <div>
            <label className="text-sm font-medium mb-1 block">Journey Step</label>
            <input
              type="text"
              value={journeyStep}
              onChange={(e) => setJourneyStep(e.target.value)}
              placeholder="Generate Script"
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Use Case (Mike Cohn Format) */}
          <div className="p-3 rounded-lg border border-border bg-muted/30">
            <label className="text-sm font-medium mb-2 block">Use Case</label>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground whitespace-nowrap">As a</span>
                <input
                  type="text"
                  value={asA}
                  onChange={(e) => setAsA(e.target.value)}
                  placeholder={persona ? `${personaRole || persona}` : "content creator"}
                  className="flex-1 px-2 py-1 rounded border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground whitespace-nowrap">I want to</span>
                <input
                  type="text"
                  value={iWant}
                  onChange={(e) => setIWant(e.target.value)}
                  placeholder="enter a subject and get an AI-generated script"
                  className="flex-1 px-2 py-1 rounded border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground whitespace-nowrap">so that</span>
                <input
                  type="text"
                  value={soThat}
                  onChange={(e) => setSoThat(e.target.value)}
                  placeholder="I can create professional videos quickly"
                  className="flex-1 px-2 py-1 rounded border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          {/* Business Goal */}
          <div>
            <label className="text-sm font-medium mb-1 block flex items-center gap-1">
              <Target className="w-3.5 h-3.5 text-amber-500" />
              Business Goal
            </label>
            <textarea
              value={businessGoal}
              onChange={(e) => setBusinessGoal(e.target.value)}
              placeholder="Drives new revenue by delivering the core content creation experience..."
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
          </div>

          {/* Story Points */}
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
              <span>1</span><span>3</span><span>5</span><span>8</span><span>13</span><span>21</span>
            </div>
          </div>

          {/* Acceptance Criteria (Gherkin) */}
          <div className="p-3 rounded-lg border border-border bg-muted/30">
            <label className="text-sm font-medium mb-2 block">Acceptance Criteria (Gherkin)</label>
            <div className="space-y-2">
              <input
                type="text"
                value={acScenario}
                onChange={(e) => setAcScenario(e.target.value)}
                placeholder="Scenario: Generate a scene table from a topic"
                className="w-full px-2 py-1 rounded border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <textarea
                value={acGiven}
                onChange={(e) => setAcGiven(e.target.value)}
                placeholder={"Given: I am on the subject input page\nAnd: I have entered a topic and target length"}
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

// ── Main Board ──────────────────────────────────────

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

  // Extract unique personas from all stories
  const allPersonas = [...new Set(
    Object.values(columns).flat().map((s) => s.persona).filter(Boolean)
  )] as string[];

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

  const handleCreate = (story: Story) => {
    setColumns((prev) => ({
      ...prev,
      backlog: [...prev.backlog, story],
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
                {activeStory.persona && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${getPersonaColor(activeStory.persona)}`}>
                    {activeStory.persona}
                  </span>
                )}
              </div>
              <h4 className="text-sm font-medium">{activeStory.title}</h4>
              {activeStory.useCase?.asA && (
                <p className="text-xs text-muted-foreground mt-1">
                  As a {activeStory.useCase.asA}...
                </p>
              )}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {showCreate && (
        <CreateStoryForm
          onClose={() => setShowCreate(false)}
          onCreate={handleCreate}
          personas={allPersonas.length > 0 ? allPersonas : ["Sarah", "Mike", "Emma"]}
        />
      )}
    </div>
  );
}

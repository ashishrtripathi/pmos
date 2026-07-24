"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  GripVertical,
  X,
  Layers,
  Maximize2,
  Loader2,
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

interface Story {
  id: string;
  title: string;
  description: string;
  points: number;
  status: string;
  acceptanceCriteria: string[];
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
  activities: { name: string; tasks: { name: string; stories: Story[] }[] }[][];
}

interface PipelineData {
  scenes: any[];
  processedAssets: { total: number; byType: any; items: any[] };
  audioFiles: { total: number; items: any[] };
  video: { exists: boolean; size: number; url: string | null };
}

// ── Sortable Story Card ────────────────────────────

function StoryMapCard({ story }: { story: Story }) {
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
    backlog: "bg-gray-100 border-gray-200",
    "in-progress": "bg-blue-50 border-blue-200",
    review: "bg-yellow-50 border-yellow-200",
    done: "bg-green-50 border-green-200",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-2 rounded-lg border shadow-sm hover:shadow-md transition-shadow group ${
        statusColors[story.status] || "bg-card border-border"
      }`}
    >
      <div className="flex items-start gap-1.5">
        <button
          className="mt-0.5 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="w-3 h-3" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 mb-0.5">
            <span className="text-[9px] font-mono text-muted-foreground">{story.id}</span>
            <span className="text-[9px] px-1 py-0 rounded bg-primary/10 text-primary font-medium">
              {story.points}
            </span>
          </div>
          <h4 className="text-[11px] font-medium leading-tight">{story.title}</h4>
        </div>
      </div>
    </div>
  );
}

// ── Step Column ────────────────────────────────────

function StepColumn({
  stepIndex,
  step,
  personaActivities,
  allJourneys,
  expandedScreen,
  onToggleScreen,
  pipelineData,
}: {
  stepIndex: number;
  step: PersonaJourneyStep;
  personaActivities: { name: string; tasks: { name: string; stories: Story[] }[] }[][];
  allJourneys: PersonaJourney[];
  expandedScreen: number | null;
  onToggleScreen: (idx: number) => void;
  pipelineData: PipelineData | null;
}) {
  return (
    <div className="flex flex-col min-w-[280px] max-w-[280px]">
      {/* Backbone: Step header */}
      <div className="border border-border rounded-t-xl bg-card sticky top-0 z-10">
        <div className="px-3 py-2 border-b border-border bg-primary/5">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold">
              {step.stepNumber}
            </span>
            <div>
              <h4 className="text-xs font-semibold">{step.name}</h4>
              <p className="text-[10px] text-muted-foreground">{step.activity}</p>
            </div>
          </div>
        </div>

        {/* Toggle screen view */}
        <button
          className="w-full px-3 py-2 hover:bg-muted/50 transition-colors text-left"
          onClick={() => onToggleScreen(stepIndex)}
        >
          <div className="text-[9px] text-muted-foreground flex items-center justify-center gap-1">
            <Maximize2 className="w-2.5 h-2.5" />
            {expandedScreen === stepIndex ? "Hide" : "View"} real pipeline data
          </div>
        </button>
      </div>

      {/* Expanded Screen */}
      {expandedScreen === stepIndex && (
        <div className="border-x border-border bg-muted/20 p-2 max-h-[350px] overflow-y-auto">
          <PipelineScreen stepName={step.name} pipelineData={pipelineData} />
        </div>
      )}

      {/* Persona Rows */}
      {allJourneys.map((journey) => {
        const activities = personaActivities[allJourneys.indexOf(journey)]?.[stepIndex];
        const stepStories = activities?.tasks.flatMap((t) => t.stories) || [];

        return (
          <div
            key={journey.personaId}
            className="border-x border-b border-border last:rounded-b-xl bg-card"
          >
            <div className="px-2 py-1 border-b border-border bg-muted/30">
              <span className="text-[9px] font-medium text-muted-foreground">
                {journey.personaName}
              </span>
            </div>
            <div className="p-2 min-h-[60px]">
              <SortableContext
                items={stepStories.map((s) => s.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-1.5">
                  {stepStories.map((story) => (
                    <StoryMapCard key={story.id} story={story} />
                  ))}
                </div>
              </SortableContext>
              {stepStories.length === 0 && (
                <div className="h-10 rounded border border-dashed border-border flex items-center justify-center text-[9px] text-muted-foreground">
                  Drop stories
                </div>
              )}
            </div>
          </div>
        );
      })}
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
      acceptanceCriteria: criteria.split("\n").map((c) => c.trim()).filter(Boolean),
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
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">
              Acceptance Criteria (one per line)
            </label>
            <textarea
              value={criteria}
              onChange={(e) => setCriteria(e.target.value)}
              placeholder="Toggle works in header\nTheme persists across sessions"
              rows={4}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button type="button" onClick={onClose} className="px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors">
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
  const [activeStory, setActiveStory] = useState<Story | null>(null);
  const [expandedScreen, setExpandedScreen] = useState<number | null>(null);
  const [pipelineData, setPipelineData] = useState<PipelineData | null>(null);
  const [backlogStories, setBacklogStories] = useState<Story[]>(
    allStories.filter(
      (s) =>
        !journeys.some((j) =>
          j.steps.some((step) => step.stories.some((js) => js.id === s.id))
        )
    )
  );

  useEffect(() => {
    fetch(`/api/projects/${params.slug}/pipeline-data`)
      .then((r) => r.json())
      .then(setPipelineData)
      .catch(() => {});
  }, [params.slug]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const story = event.active.data.current?.story as Story;
    if (story) setActiveStory(story);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveStory(null);
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
    setBacklogStories((prev) => [...prev, newStory]);
  };

  const backbone = storyMap.backbone;
  const totalPoints = allStories.reduce((sum, s) => sum + s.points, 0);

  return (
    <div className="p-8 max-w-[1800px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Layers className="w-5 h-5" />
          <h1 className="text-2xl font-bold">User Story Map</h1>
          <span className="text-sm text-muted-foreground">
            {allStories.length} stories · {totalPoints} points · {journeys.length} personas
          </span>
          {pipelineData && (
            <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
              Pipeline loaded: {pipelineData.scenes.length} scenes, {pipelineData.processedAssets.total} images
            </span>
          )}
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Story
        </button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Layers className="w-3 h-3" />
          <strong>Top row</strong> = Journey backbone (customer steps)
        </div>
        <div className="flex items-center gap-1.5">
          <Maximize2 className="w-3 h-3" />
          Click &quot;View real pipeline data&quot; to see actual images, audio, scene data
        </div>
        <div className="flex items-center gap-1.5">
          <GripVertical className="w-3 h-3" />
          Drag stories between steps and personas
        </div>
      </div>

      {/* Story Map Grid */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-0 border border-border rounded-xl overflow-hidden">
          {/* Backlog Column */}
          <div className="w-[200px] min-w-[200px] border-r border-border bg-muted/20 flex flex-col">
            <div className="px-3 py-2 border-b border-border bg-muted/40 sticky top-0 z-10">
              <h3 className="text-xs font-semibold">Backlog</h3>
              <span className="text-[10px] text-muted-foreground">
                {backlogStories.length} unassigned
              </span>
            </div>
            <div className="flex-1 p-2 space-y-1.5 min-h-[300px]">
              <SortableContext
                items={backlogStories.map((s) => s.id)}
                strategy={verticalListSortingStrategy}
              >
                {backlogStories.map((story) => (
                  <StoryMapCard key={story.id} story={story} />
                ))}
              </SortableContext>
              {backlogStories.length === 0 && (
                <div className="h-20 rounded-lg border border-dashed border-border flex items-center justify-center text-xs text-muted-foreground">
                  All stories placed
                </div>
              )}
            </div>
          </div>

          {/* Journey Step Columns */}
          {backbone.map((step, si) => (
            <StepColumn
              key={si}
              stepIndex={si}
              step={step}
              personaActivities={storyMap.activities}
              allJourneys={journeys}
              expandedScreen={expandedScreen}
              onToggleScreen={(idx) =>
                setExpandedScreen(expandedScreen === idx ? null : idx)
              }
              pipelineData={pipelineData}
            />
          ))}
        </div>

        <DragOverlay>
          {activeStory ? (
            <div className="p-2 rounded-lg border border-primary bg-card shadow-lg opacity-90 w-[220px]">
              <span className="text-[9px] font-mono text-muted-foreground">
                {activeStory.id}
              </span>
              <h4 className="text-[11px] font-medium">{activeStory.title}</h4>
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

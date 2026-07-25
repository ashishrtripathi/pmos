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

// ── Story Card (Sortable) ──────────────────────────

function StoryMapCard({
  story,
  compact,
}: {
  story: Story;
  compact?: boolean;
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

  const [expanded, setExpanded] = useState(false);

  if (compact) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`p-1.5 rounded-lg border shadow-sm hover:shadow-md transition-shadow group cursor-pointer ${statusColors[story.status] || "bg-card border-border"}`}
      >
        <div className="flex items-start gap-1">
          <button
            className="mt-0.5 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="w-3 h-3" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 mb-0.5 flex-wrap">
              <span className="text-[9px] font-mono text-muted-foreground">{story.id}</span>
              <span className="text-[9px] px-1 py-0 rounded bg-primary/10 text-primary font-medium">
                {story.points}
              </span>
              {story.persona && (
                <span className={`text-[8px] px-1 py-0 rounded-full border font-medium ${getPersonaColor(story.persona)}`}>
                  <User className="w-1.5 h-1.5 inline mr-0.5" />
                  {story.persona}
                </span>
              )}
            </div>
            <h4 className="text-[11px] font-medium leading-tight">{story.title}</h4>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-2 rounded-lg border shadow-sm hover:shadow-md transition-shadow group ${statusColors[story.status] || "bg-card border-border"}`}
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
            <p className="text-[9px] text-muted-foreground mt-0.5 line-clamp-2">
              As a {story.useCase.asA}... I want to {story.useCase.iWant}
            </p>
          )}

          {/* Business Goal */}
          {story.businessGoal && (
            <div className="mt-0.5 flex items-center gap-0.5">
              <Target className="w-2 h-2 text-amber-500 shrink-0" />
              <span className="text-[8px] text-muted-foreground line-clamp-1">{story.businessGoal}</span>
            </div>
          )}

          {/* Expandable Acceptance Criteria */}
          {story.acceptanceCriteria && story.acceptanceCriteria.length > 0 && (
            <div className="mt-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setExpanded(!expanded);
                }}
                className="flex items-center gap-0.5 text-[8px] text-muted-foreground hover:text-foreground"
              >
                {expanded ? <ChevronDown className="w-2 h-2" /> : <ChevronRight className="w-2 h-2" />}
                {story.acceptanceCriteria.length} AC
              </button>
              {expanded && (
                <div className="mt-1 space-y-1 pl-1">
                  {story.acceptanceCriteria.map((ac, i) => (
                    <div key={i} className="text-[8px] p-1 rounded bg-muted/30">
                      <div className="font-medium">{ac.scenario}</div>
                      {ac.given?.map((g, gi) => (
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
  onCreateStory,
  personas,
}: {
  stepIndex: number;
  step: PersonaJourneyStep;
  stories: Story[];
  expandedScreen: number | null;
  onToggleScreen: (idx: number) => void;
  pipelineData: PipelineData | null;
  onCreateStory: (stepName: string) => void;
  personas: string[];
}) {
  // Sort stories: in-progress first, then review, then backlog, then done
  // Within same status, sort by points descending (highest priority first)
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
    return b.points - a.points; // Higher points = higher priority
  });

  const totalPoints = sortedStories.reduce((sum, s) => sum + s.points, 0);

  return (
    <div className="flex flex-col min-w-[280px] max-w-[280px] border-r border-border last:border-r-0">
      {/* Backbone: Step header */}
      <div className="border-b border-border bg-card sticky top-0 z-10">
        <div className="px-3 py-2">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold shrink-0">
              {step.stepNumber}
            </span>
            <div className="min-w-0">
              <h4 className="text-xs font-semibold truncate">{step.name}</h4>
              <p className="text-[10px] text-muted-foreground truncate">{step.activity}</p>
            </div>
          </div>
        </div>

        {/* Stats + toggle */}
        <div className="px-3 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
              {sortedStories.length} stories
            </span>
            <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
              {totalPoints} pts
            </span>
          </div>
          <button
            className="text-[9px] text-muted-foreground hover:text-foreground flex items-center gap-0.5"
            onClick={() => onToggleScreen(stepIndex)}
          >
            <Maximize2 className="w-2.5 h-2.5" />
            {expandedScreen === stepIndex ? "Hide" : "UI"}
          </button>
        </div>
      </div>

      {/* Expanded Screen Preview */}
      {expandedScreen === stepIndex && (
        <div className="border-b border-border bg-muted/20 p-2 max-h-[300px] overflow-y-auto">
          <PipelineScreen stepName={step.name} pipelineData={pipelineData} />
        </div>
      )}

      {/* Pain Points */}
      {step.painPoints && step.painPoints.length > 0 && (
        <div className="px-3 py-1.5 border-b border-border bg-red-50/50">
          <span className="text-[9px] font-medium text-red-600">Pain Points:</span>
          {step.painPoints.map((pp, i) => (
            <p key={i} className="text-[9px] text-red-500">{pp}</p>
          ))}
        </div>
      )}

      {/* Stories list (vertical, sorted by priority) */}
      <div className="flex-1 p-2 space-y-1.5 min-h-[200px]">
        <SortableContext
          items={sortedStories.map((s) => s.id)}
          strategy={verticalListSortingStrategy}
        >
          {sortedStories.map((story) => (
            <StoryMapCard key={story.id} story={story} />
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
          className="w-full py-1.5 rounded-lg border border-dashed border-border text-[10px] text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors flex items-center justify-center gap-1"
        >
          <Plus className="w-3 h-3" />
          Add Story
        </button>
      </div>
    </div>
  );
}

// ── Create Story Form (Mike Cohn + Gherkin + Persona) ─

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
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 rounded-2xl bg-card border border-border shadow-2xl"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">Create User Story</h2>
            <p className="text-xs text-muted-foreground">Step: {stepName}</p>
          </div>
          <button type="button" onClick={onClose}>
            <X className="w-5 h-5 text-muted-foreground hover:text-foreground" />
          </button>
        </div>

        <div className="space-y-3">
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

          {/* Persona */}
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

          {/* Use Case */}
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

          {/* Business Goal */}
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

          {/* Points */}
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
          </div>

          {/* AC (Gherkin) */}
          <div className="p-3 rounded-lg border border-border bg-muted/30">
            <label className="text-sm font-medium mb-2 block">Acceptance Criteria</label>
            <div className="space-y-2">
              <input
                type="text"
                value={acScenario}
                onChange={(e) => setAcScenario(e.target.value)}
                placeholder="Scenario: Generate scene table"
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

          {/* Description */}
          <div>
            <label className="text-sm font-medium mb-1 block">Additional Description</label>
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
  const [stories, setStories] = useState<Story[]>(allStories);

  useEffect(() => {
    fetch(`/api/projects/${params.slug}/pipeline-data`)
      .then((r) => r.json())
      .then(setPipelineData)
      .catch(() => {});
  }, [params.slug]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const backbone = storyMap.backbone;
  const totalPoints = stories.reduce((sum, s) => sum + s.points, 0);

  // Get unique personas from all stories and journeys
  const allPersonas = [
    ...new Set([
      ...journeys.map((j) => j.personaName),
      ...stories.map((s) => s.persona).filter(Boolean),
    ]),
  ] as string[];

  // Map stories to journey steps by matching persona + journeyStep
  // A story belongs to a step if its journeyStep matches the step name
  const storiesByStep: Record<string, Story[]> = {};
  backbone.forEach((step) => {
    storiesByStep[step.name] = stories
      .filter((s) => s.journeyStep === step.name)
      .sort((a, b) => b.points - a.points);
  });

  // Backlog = stories with no matching journey step
  const backlogStories = stories.filter(
    (s) => !s.journeyStep || !backbone.some((step) => step.name === s.journeyStep)
  ).sort((a, b) => b.points - a.points);

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

    // Find which step the active story is in (or backlog)
    const activeStep = findStepForStory(activeId);
    // Find what the over target is (could be a story in a step, or a step drop zone)
    const overStep = findStepForStory(overId);

    if (activeStep === overStep) return;

    // Move the story to the new step
    setStories((prev) =>
      prev.map((s) => {
        if (s.id === activeId) {
          const targetStep = overStep || (backbone.find((b) => b.name === overId)?.name) || "";
          return { ...s, journeyStep: targetStep || undefined };
        }
        return s;
      })
    );
  };

  const handleCreateStory = (story: Story) => {
    setStories((prev) => [...prev, story]);
  };

  return (
    <div className="p-6 max-w-[1800px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Layers className="w-5 h-5" />
          <h1 className="text-2xl font-bold">User Story Map</h1>
          <span className="text-sm text-muted-foreground">
            {stories.length} stories · {totalPoints} points · {journeys.length} personas
          </span>
          {pipelineData && (
            <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
              Pipeline: {pipelineData.scenes.length} scenes
            </span>
          )}
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
          <strong>Top row</strong> = Journey backbone (customer steps)
        </div>
        <div className="flex items-center gap-1.5">
          <GripVertical className="w-3 h-3" />
          Drag stories between steps
        </div>
        <div className="flex items-center gap-1.5">
          <Maximize2 className="w-3 h-3" />
          Click UI to see real app preview
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 border border-blue-200">in-progress</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-50 border border-yellow-200">review</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-50 border border-gray-200">backlog</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-50 border border-green-200">done</span>
        </div>
        {allPersonas.map((p) => (
          <div key={p} className="flex items-center gap-1">
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${getPersonaColor(p)}`}>
              <User className="w-2 h-2 inline mr-0.5" />
              {p}
            </span>
          </div>
        ))}
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
          <div className="w-[220px] min-w-[220px] border-r border-border bg-muted/20 flex flex-col">
            <div className="px-3 py-2 border-b border-border bg-muted/40 sticky top-0 z-10">
              <h3 className="text-xs font-semibold">Backlog</h3>
              <span className="text-[10px] text-muted-foreground">
                {backlogStories.length} unassigned ·{" "}
                {backlogStories.reduce((sum, s) => sum + s.points, 0)} pts
              </span>
            </div>
            <div className="flex-1 p-2 space-y-1.5 min-h-[300px]">
              <SortableContext
                items={backlogStories.map((s) => s.id)}
                strategy={verticalListSortingStrategy}
              >
                {backlogStories.map((story) => (
                  <StoryMapCard key={story.id} story={story} compact />
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
              onCreateStory={(stepName) => {
                setCreateForStep(stepName);
                setShowCreate(true);
              }}
              personas={allPersonas}
            />
          ))}
        </div>

        <DragOverlay>
          {activeStory ? (
            <div className="p-2 rounded-lg border border-primary bg-card shadow-lg opacity-90 w-[220px]">
              <div className="flex items-center gap-1 mb-0.5">
                <span className="text-[9px] font-mono text-muted-foreground">{activeStory.id}</span>
                <span className="text-[9px] px-1 py-0 rounded bg-primary/10 text-primary font-medium">
                  {activeStory.points}
                </span>
                {activeStory.persona && (
                  <span className={`text-[8px] px-1 py-0 rounded-full border font-medium ${getPersonaColor(activeStory.persona)}`}>
                    {activeStory.persona}
                  </span>
                )}
              </div>
              <h4 className="text-[11px] font-medium">{activeStory.title}</h4>
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
    </div>
  );
}

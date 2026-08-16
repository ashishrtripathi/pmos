"use client";

import { useState, useEffect } from "react";
import { Map, Loader2, Monitor, MonitorOff, Plus, UserPlus, Sparkles } from "lucide-react";
import { PersonaJourneyBoard } from "@/components/journey/persona-journey";
import { PersonaCard } from "@/components/persona/persona-card";
import { PersonaModal } from "@/components/persona/persona-modal";
import { personaInitials } from "@/lib/persona-utils";
import { getAvatarUrl } from "@/lib/persona-avatars";
import { PersonaJourney } from "@/lib/pmos";

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
  features: { hasCostTracker: boolean; hasHalftonePreview: boolean };
}

export function JourneyPageClient({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const [journeys, setJourneys] = useState<PersonaJourney[]>([]);
  const [pipelineData, setPipelineData] = useState<PipelineData | null>(null);
  const [uiInfo, setUiInfo] = useState<UIInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePersona, setActivePersona] = useState<string | null>(null);

  // Persona Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [personaToEdit, setPersonaToEdit] = useState<PersonaJourney | null>(null);

  const loadData = async () => {
    try {
      const [journeysData, pipeline, ui] = await Promise.all([
        fetch(`/api/projects/${slug}/personas`).then((r) => r.json()),
        fetch(`/api/projects/${slug}/pipeline-data`).then((r) => r.json()),
        fetch(`/api/projects/${slug}/ui-structure`).then((r) => r.json()),
      ]);

      const validJourneys = Array.isArray(journeysData) ? journeysData : [];
      setJourneys(validJourneys);
      setPipelineData(pipeline);
      setUiInfo(ui);

      if (validJourneys.length > 0 && (!activePersona || !validJourneys.some((j: any) => j.personaId === activePersona))) {
        setActivePersona(validJourneys[0].personaId);
      }
      setLoading(false);
    } catch {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [slug]);

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Loading journey and persona data...</span>
        </div>
      </div>
    );
  }

  const refreshJourneys = async () => {
    const data = await fetch(`/api/projects/${slug}/personas`).then((r) => r.json());
    if (Array.isArray(data)) {
      setJourneys(data);
      if (data.length > 0 && (!activePersona || !data.some((j) => j.personaId === activePersona))) {
        setActivePersona(data[0].personaId);
      }
    }
  };

  const handleOpenCreateModal = () => {
    setPersonaToEdit(null);
    setModalOpen(true);
  };

  const handleOpenEditModal = (persona: PersonaJourney) => {
    setPersonaToEdit(persona);
    setModalOpen(true);
  };

  const handleDeletePersona = async (personaId: string) => {
    try {
      await fetch(`/api/projects/${slug}/personas?personaId=${encodeURIComponent(personaId)}`, {
        method: "DELETE",
      });
      await refreshJourneys();
    } catch (e) {
      console.error("Failed to delete persona", e);
    }
  };

  const activeJourney = journeys.find((j) => j.personaId === activePersona);

  return (
    <div className="p-8 max-w-[1800px] mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="w-10 h-10 rounded-xl bg-rose-600/10 text-rose-600 flex items-center justify-center">
            <Map className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Customer Journey & User Personas</h1>
            <p className="text-sm text-muted-foreground">
              Define user personas, map their end-to-end journey steps, and connect user stories to pain points.
            </p>
          </div>

          <div className="flex items-center gap-2 ml-2">
            {uiInfo && (
              <span
                className={`text-xs px-2.5 py-1 rounded-full flex items-center gap-1 font-medium ${
                  uiInfo.serverRunning
                    ? "text-emerald-700 bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300"
                    : "text-amber-700 bg-amber-50 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300"
                }`}
              >
                {uiInfo.serverRunning ? <Monitor className="w-3.5 h-3.5" /> : <MonitorOff className="w-3.5 h-3.5" />}
                {uiInfo.serverRunning ? `App on :${uiInfo.serverPort}` : `App offline (${uiInfo.steps?.length || 0} UI steps)`}
              </span>
            )}
            {pipelineData && (
              <span className="text-xs text-blue-700 bg-blue-50 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 px-2.5 py-1 rounded-full font-medium">
                {pipelineData.scenes?.length || 0} scenes · {pipelineData.processedAssets?.total || 0} assets
              </span>
            )}
          </div>
        </div>

        {/* Create Persona Button */}
        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-all"
        >
          <UserPlus className="w-4 h-4" />
          <span>Create User Persona</span>
        </button>
      </div>

      {journeys.length === 0 ? (
        <div className="p-16 rounded-2xl border-2 border-dashed border-border text-center bg-card space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-600/10 text-rose-600 flex items-center justify-center mx-auto">
            <UserPlus className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold">No User Personas Yet</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Before creating user journeys, establish your target user personas with photos, demographics, goals, and habits.
          </p>
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create Your First Persona</span>
          </button>
        </div>
      ) : (
        <>
          {/* Persona Tabs with Real Avatars */}
          <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
            {journeys.map((j) => {
              const isSelected = activePersona === j.personaId;
              const avatar = getAvatarUrl(j.avatarUrl || j.avatarId, j.personaName);

              return (
                <button
                  key={j.personaId}
                  type="button"
                  onClick={() => setActivePersona(j.personaId)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl border transition-all shrink-0 ${
                    isSelected
                      ? "border-rose-600 bg-rose-50/60 dark:bg-rose-950/20 shadow-sm ring-1 ring-rose-600"
                      : "border-border hover:border-primary/40 bg-card"
                  }`}
                >
                  <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-border shadow-xs shrink-0">
                    <img src={avatar} alt={j.personaName} className="w-full h-full object-cover" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-bold text-foreground truncate max-w-[140px]">
                      {j.personaName}
                    </div>
                    <div className="text-[11px] text-muted-foreground truncate max-w-[140px]">
                      {j.role}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Persona Card Profile (Matching UX Persona Specification) */}
          {activeJourney && (
            <PersonaCard
              persona={activeJourney}
              onEdit={handleOpenEditModal}
              onDelete={handleDeletePersona}
            />
          )}

          {/* Journey Steps Board */}
          {activeJourney && (
            <div className="pt-2">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-foreground">
                    {activeJourney.personaName}&apos;s End-to-End Customer Journey
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {activeJourney.steps?.length || 0} Journey Steps · Linked to Stories and Live UI Mockups
                  </p>
                </div>
              </div>
              <PersonaJourneyBoard
                journey={activeJourney}
                pipelineData={pipelineData}
                uiInfo={uiInfo}
                slug={slug}
                onJourneysChanged={refreshJourneys}
              />
            </div>
          )}

          {/* Guide Footer */}
          <div className="p-4 rounded-xl border border-border bg-muted/20">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Customer Journey Navigation Guide
            </h3>
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <strong>Scroll horizontally</strong> through journey stages
              </span>
              <span>
                {uiInfo?.serverRunning
                  ? "Live application views embedded below each step"
                  : "Screenshots and UI mockups displayed for each step"}
              </span>
              <span>Click step cards to edit activities and tasks</span>
              <span className="text-red-500 font-medium">• Red badges = User Pain Points & Friction</span>
            </div>
          </div>
        </>
      )}

      {/* Persona Creation & Editing Modal */}
      <PersonaModal
        slug={slug}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={refreshJourneys}
        personaToEdit={personaToEdit}
      />
    </div>
  );
}
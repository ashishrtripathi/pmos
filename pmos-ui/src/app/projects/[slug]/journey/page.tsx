"use client";

import { useState, useEffect } from "react";
import { Map, Loader2, Monitor, MonitorOff } from "lucide-react";
import { PersonaJourneyBoard } from "@/components/journey/persona-journey";
import { personaInitials } from "@/lib/persona-utils";

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

/**
 * Persona tab avatar + label - generic, derived from each persona's role.
 */

export default function JourneyPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const [journeys, setJourneys] = useState<any[]>([]);
  const [pipelineData, setPipelineData] = useState<PipelineData | null>(null);
  const [uiInfo, setUiInfo] = useState<UIInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePersona, setActivePersona] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch(`/api/projects/${slug}/journeys`).then((r) => r.json()),
      fetch(`/api/projects/${slug}/pipeline-data`).then((r) => r.json()),
      fetch(`/api/projects/${slug}/ui-structure`).then((r) => r.json()),
    ])
      .then(([journeysData, pipeline, ui]) => {
        setJourneys(journeysData);
        setPipelineData(pipeline);
        setUiInfo(ui);
        if (journeysData.length > 0) setActivePersona(journeysData[0].personaId);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Loading journey data...</span>
        </div>
      </div>
    );
  }

  const refreshJourneys = async () => {
    const data = await fetch(`/api/projects/${slug}/journeys`).then((r) => r.json());
    setJourneys(data);
  };

  const activeJourney = journeys.find((j: any) => j.personaId === activePersona);

  return (
    <div className="p-8 max-w-[1800px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Map className="w-5 h-5" />
          <h1 className="text-2xl font-bold">Customer Journey Map</h1>
          <span className="text-sm text-muted-foreground">
            {journeys.length} persona{journeys.length !== 1 ? "s" : ""} · {activeJourney?.steps.length || 0} steps each
          </span>
          {uiInfo && (
            <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${
              uiInfo.serverRunning
                ? "text-green-600 bg-green-50"
                : "text-orange-600 bg-orange-50"
            }`}>
              {uiInfo.serverRunning ? <Monitor className="w-3 h-3" /> : <MonitorOff className="w-3 h-3" />}
              {uiInfo.serverRunning ? `App running on :${uiInfo.serverPort}` : `App not running (${uiInfo.steps?.length || 0} UI steps detected)`}
            </span>
          )}
          {pipelineData && (
            <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
              {pipelineData.scenes.length} scenes · {pipelineData.processedAssets.total} images
            </span>
          )}
        </div>
      </div>

      {journeys.length === 0 ? (
        <div className="p-12 rounded-xl border border-dashed border-border text-center">
          <p className="text-muted-foreground">No persona journeys found.</p>
        </div>
      ) : (
        <>
          <div className="flex gap-2 mb-6">
            {journeys.map((j: any) => (
              <button
                key={j.personaId}
                onClick={() => setActivePersona(j.personaId)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all ${
                  activePersona === j.personaId
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border hover:border-primary/30 bg-card"
                }`}
              >
                <span className="w-9 h-9 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center text-xs font-bold">{personaInitials(j)}</span>
                <div className="text-left">
                  <div className="text-sm font-medium">{j.role}</div>
                  <div className="text-[10px] text-muted-foreground">{j.personaName}</div>
                </div>
              </button>
            ))}
          </div>

          <div className="space-y-8">
            {journeys.filter((j: any) => j.personaId === activePersona).map((j: any) => (
              <div key={j.personaId}>
                <PersonaJourneyBoard journey={j} pipelineData={pipelineData} uiInfo={uiInfo} slug={slug} onJourneysChanged={refreshJourneys} />
              </div>
            ))}
          </div>

          <div className="mt-8 p-4 rounded-xl border border-border bg-muted/30">
            <h3 className="text-sm font-semibold mb-2">How to Read This Map</h3>
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg> <strong>Scroll left/right</strong> through journey steps</span>
              <span>
                {uiInfo?.serverRunning
                  ? <><svg className="w-3.5 h-3.5 inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg> The actual application UI is embedded live below each step</>
                  : <><svg className="w-3.5 h-3.5 inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg> Screenshots of the actual application UI shown at each step</>}
              </span>
              <span><svg className="w-3.5 h-3.5 inline text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> Click to zoom into full-screen view</span>
              <span><svg className="w-3 h-3 inline text-red-500" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg> Red items = user pain points</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

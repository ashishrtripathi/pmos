"use client";

import { useState, useEffect } from "react";
import { Map, Loader2, Monitor, MonitorOff } from "lucide-react";
import { PersonaJourneyBoard } from "@/components/journey/persona-journey";

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

const PERSONA_AVATARS: Record<string, string> = {
  sarah: "👩‍🎨",
  mike: "👨‍💼",
  emma: "👩‍🏫",
};

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
              {uiInfo.serverRunning ? `App running on :${uiInfo.serverPort}` : `App not running (${uiInfo.steps.length} UI steps detected)`}
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
                <span className="text-xl">{PERSONA_AVATARS[j.personaId] || "👤"}</span>
                <div className="text-left">
                  <div className="text-sm font-medium">{j.personaName}</div>
                  <div className="text-[10px] text-muted-foreground">{j.role}</div>
                </div>
              </button>
            ))}
          </div>

          <div className="space-y-8">
            {journeys.map((j: any) => (
              <div
                key={j.personaId}
                className={`transition-all ${
                  activePersona === j.personaId ? "opacity-100" : "opacity-50 hover:opacity-75"
                }`}
                onClick={() => setActivePersona(j.personaId)}
              >
                <PersonaJourneyBoard journey={j} pipelineData={pipelineData} uiInfo={uiInfo} />
              </div>
            ))}
          </div>

          <div className="mt-8 p-4 rounded-xl border border-border bg-muted/30">
            <h3 className="text-sm font-semibold mb-2">How to Read This Map</h3>
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
              <span>⬅️➡️ <strong>Scroll left/right</strong> through journey steps</span>
              <span>
                {uiInfo?.serverRunning
                  ? "🖥️ The actual application UI is embedded live below each step"
                  : "🖼️ Screenshots of the actual application UI shown at each step"}
              </span>
              <span>🔍 Click to zoom into full-screen view</span>
              <span>🔴 Red items = user pain points</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

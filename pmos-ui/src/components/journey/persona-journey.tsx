"use client";

import { useState, useEffect, useRef } from "react";
import {
  ChevronDown,
  ChevronRight,
  Quote,
  Maximize2,
  X,
  Camera,
  Loader2,
  ImageIcon,
  Palette,
  Globe,
  FileText,
  FolderPlus,
  PenLine,
  NotebookPen,
  Search,
  Flag,
  Accessibility,
  PlayCircle,
  RefreshCw,
  Scissors,
  Users,
  Share2,
  Bookmark,
  AlertTriangle,
} from "lucide-react";
import { PipelineScreen } from "./pipeline-screen";
import { personaGradient, personaInitials } from "@/lib/persona-utils";

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

const STEP_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Discovery: Globe,
  "Sign Up": FileText,
  "Choose Template": Palette,
  "Choose Educational Template": Palette,
  "Create Project": FolderPlus,
  "Enter Subject": PenLine,
  "Generate Script": NotebookPen,
  "Review Script for Accuracy": Search,
  "Add Branding": Flag,
  "Add Accessibility": Accessibility,
  "Preview Video": PlayCircle,
  "Review & Iterate": RefreshCw,
  "Edit Scenes": Scissors,
  "Team Review": Users,
  "Export & Share": Share2,
  "Export & Distribute": Share2,
  "Export for LMS": Share2,
};

export function PersonaJourneyBoard({
  journey,
  pipelineData,
  uiInfo,
  slug,
}: {
  journey: PersonaJourney;
  pipelineData: PipelineData | null;
  uiInfo?: UIInfo | null;
  slug?: string;
}) {
  const [expandedStep, setExpandedStep] = useState<number | null>(null);
  const [zoomStep, setZoomStep] = useState<number | null>(null);
  const [screenshotLoaded, setScreenshotLoaded] = useState<Record<number, boolean>>({});
  const [screenshotError, setScreenshotError] = useState<Record<number, boolean>>({});
  const color = personaGradient(journey.personaId);

  // Parse screen field for markdown image: ![alt](path)
  const getScreenshotUrl = (screen: string): string | null => {
    if (!slug) return null;
    const match = screen.match(/!\[.*?\]\((.+?)\)/);
    if (!match) return null;
    const imgPath = match[1];
    const imgName = imgPath.split("/").pop() || imgPath;
    return `/api/projects/${slug}/screens?name=${encodeURIComponent(imgName)}`;
  };

  // Get screenshot caption from screen field
  const getScreenshotCaption = (screen: string): string => {
    const match = screen.match(/\[(.*?)\]\s*\(/);
    if (match) return match[1];
    return "View screenshot";
  };

  return (
    <div className="space-y-4">
      {/* Persona Header */}
      <div className={`bg-gradient-to-r ${color} rounded-xl p-4 text-white`}>
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-full bg-white/25 flex items-center justify-center text-sm font-bold shrink-0">{personaInitials(journey)}</span>
          <div>
            <h3 className="text-lg font-bold">{journey.role}</h3>
            <p className="text-sm opacity-80">{journey.personaName}</p>
          </div>
          <div className="ml-auto flex items-center gap-2 bg-white/20 rounded-lg px-3 py-1.5">
            <Quote className="w-3 h-3" />
            <span className="text-xs italic">&ldquo;{journey.quote}&rdquo;</span>
          </div>
        </div>
      </div>

      {/* Horizontal Journey Steps */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-3 min-w-max">
          {journey.steps.map((step, idx) => {
            const StepIcon = STEP_ICONS[step.name] || Bookmark;
            const isExpanded = expandedStep === idx;

            return (
              <div key={idx} className="flex items-stretch">
                {/* Step Card */}
                <div
                  className={`w-[340px] rounded-xl border transition-all flex flex-col ${
                    isExpanded ? "border-primary shadow-lg" : "border-border hover:border-primary/30"
                  } bg-card`}
                >
                  {/* Step Header */}
                  <div className="p-3 border-b border-border">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg flex items-center"><StepIcon className="w-5 h-5" /></span>
                      <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                        {step.stepNumber}
                      </span>
                      <h4 className="text-sm font-semibold flex-1">{step.name}</h4>
                    </div>
                    <p className="text-xs text-muted-foreground ml-9">{step.activity}</p>
                  </div>

                  {/* Preview area - shows screenshot, pipeline data, or placeholder */}
                  <div className="px-3 py-2">
                    <button
                      className="w-full text-left hover:ring-1 hover:ring-primary/30 rounded-lg transition-all overflow-hidden border border-border relative group"
                      onClick={() => setExpandedStep(isExpanded ? null : idx)}
                    >
                      {/* Screenshot from screen field */}
                      {(() => {
                        const screenshotUrl = getScreenshotUrl(step.screen);
                        if (screenshotUrl && !screenshotError[idx]) {
                          return (
                            <div className="bg-gray-50 rounded overflow-hidden h-32 relative">
                              {!screenshotLoaded[idx] && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                                </div>
                              )}
                              <img
                                src={screenshotUrl}
                                alt={getScreenshotCaption(step.screen)}
                                className={`w-full h-full object-cover transition-opacity ${screenshotLoaded[idx] ? "opacity-100" : "opacity-0"}`}
                                onLoad={() => setScreenshotLoaded((prev) => ({ ...prev, [idx]: true }))}
                                onError={() => setScreenshotError((prev) => ({ ...prev, [idx]: true }))}
                              />
                              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                                <span className="text-[10px] text-white font-medium flex items-center gap-1">
                                  <Camera className="w-3 h-3" />
                                  {getScreenshotCaption(step.screen)}
                                </span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })()}

                      {/* Fallback: iframe or pipeline data when no screenshot */}
                      {uiInfo?.serverRunning && uiInfo.uiUrl ? (
                        <div className="bg-gray-50 rounded overflow-hidden h-32 relative">
                          <iframe
                            src={uiInfo.uiUrl}
                            className="border-0"
                            style={{
                              position: "absolute",
                              top: 0,
                              left: 0,
                              width: "1200px",
                              height: "800px",
                              transform: "scale(0.27)",
                              transformOrigin: "top left",
                              pointerEvents: "none",
                            }}
                            title={`UI preview for ${step.name}`}
                          />
                        </div>
                      ) : step.name === "Generate Script" || step.name === "Review Script for Accuracy" ? (
                        <div className="bg-white p-2 border-b border-gray-200">
                          {(pipelineData?.scenes || []).slice(0, 3).map((s: any) => (
                            <div key={s.sceneNumber} className="flex gap-2 text-[8px] text-gray-600 py-0.5 border-t border-gray-100">
                              <span className="w-4">{s.sceneNumber}</span>
                              <span className={`w-12 ${s.sceneType === "cutout" ? "text-blue-500" : "text-purple-500"}`}>{s.sceneType}</span>
                              <span className="flex-1 truncate">{s.voiceoverLine}</span>
                            </div>
                          ))}
                        </div>
                      ) : step.name === "Edit Scenes" ? (
                        <div className="grid grid-cols-3 gap-0.5 bg-gray-100 p-0.5">
                          {(pipelineData?.processedAssets?.items || []).filter((i: any) => i.type === "halftone").slice(0, 6).map((item: any) => (
                            <div key={item.name} className="aspect-square bg-white overflow-hidden">
                              {item.url ? <img src={item.url} alt="" className="w-full h-full object-cover" loading="lazy" /> : <div className="w-full h-full bg-gray-200" />}
                            </div>
                          ))}
                        </div>
                      ) : step.name === "Preview Video" || step.name === "Review & Iterate" ? (
                        <div className="bg-black aspect-video flex items-center justify-center">
                          {pipelineData?.video?.exists ? (
                            <div className="text-white text-xs flex items-center gap-1"><PlayCircle className="w-3.5 h-3.5" /> Video Preview Available</div>
                          ) : (
                            <div className="text-gray-500 text-xs">No video rendered yet</div>
                          )}
                        </div>
                      ) : (
                        <div className="bg-gray-50 p-2 h-32 flex items-center justify-center">
                          <div className="text-[10px] text-muted-foreground text-center">
                            Click to view this step
                          </div>
                        </div>
                      )}
                    </button>
                  </div>

                  {/* Tasks */}
                  <div className="px-3 pb-2 space-y-2 flex-1">
                    <div>
                      <div className="text-[10px] font-medium text-muted-foreground uppercase mb-1">Tasks</div>
                      {step.tasks.map((task, ti) => (
                        <div key={ti} className="text-xs text-muted-foreground flex items-start gap-1 mb-0.5">
                          <ChevronRight className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          <span>{task}</span>
                        </div>
                      ))}
                    </div>
                    <div>
                      <div className="text-[10px] font-medium text-red-500 uppercase mb-1">Pain Points</div>
                      {step.painPoints.map((pp, pi) => (
                        <div key={pi} className="text-xs text-red-400 flex items-start gap-1 mb-0.5">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-px" />
                          <span>{pp}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Stories */}
                  {step.stories.length > 0 && (
                    <div className="px-3 pb-2">
                      <div className="text-[10px] font-medium text-primary uppercase mb-1">
                        Stories ({step.stories.length})
                      </div>
                      <div className="space-y-1">
                        {step.stories.map((story) => (
                          <div key={story.id} className="text-[10px] bg-primary/5 border border-primary/10 rounded px-2 py-1 flex items-center justify-between">
                            <span className="font-mono text-primary">{story.id}</span>
                            <span className="text-muted-foreground">{story.points} pts</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* View Button */}
                  <button
                    className="border-t border-border px-3 py-2 text-xs text-muted-foreground hover:text-primary hover:bg-muted/50 transition-colors flex items-center gap-1"
                    onClick={() => { setExpandedStep(isExpanded ? null : idx); setZoomStep(idx); }}
                  >
                    <Maximize2 className="w-3 h-3" />
                    {isExpanded ? "View full screen" : "View real pipeline data"}
                  </button>
                </div>

                {/* Connector arrow */}
                {idx < journey.steps.length - 1 && (
                  <div className="flex items-center px-1">
                    <div className="w-4 h-0.5 bg-border" />
                    <div className="w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-l-[6px] border-l-border" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Expanded Inline View */}
      {expandedStep !== null && (
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold">
              Step {expandedStep + 1}: {journey.steps[expandedStep].name}
            </h4>
            <button
              onClick={() => { setZoomStep(expandedStep); }}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary px-2 py-1 rounded hover:bg-muted transition-colors"
            >
              <Maximize2 className="w-3 h-3" />
              Full screen
            </button>
          </div>
          <PipelineScreen stepName={journey.steps[expandedStep].name} pipelineData={pipelineData} uiInfo={uiInfo} />
        </div>
      )}

      {/* Full-Screen Zoom Modal */}
      {zoomStep !== null && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setZoomStep(null)}>
          <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
              <h3 className="text-lg font-bold">
                {(() => { const ZoomIcon = STEP_ICONS[journey.steps[zoomStep].name] || Bookmark; return <><ZoomIcon className="w-4 h-4" /> {journey.steps[zoomStep].name}</>; })()}
              </h3>
              <button onClick={() => setZoomStep(null)} className="p-1 rounded-lg hover:bg-muted transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <PipelineScreen stepName={journey.steps[zoomStep].name} pipelineData={pipelineData} uiInfo={uiInfo} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

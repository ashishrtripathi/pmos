"use client";

import { useState } from "react";
import { X, Maximize2, MousePointer2 } from "lucide-react";

interface ScreenComponent {
  id: string;
  label: string;
  type: "input" | "button" | "table" | "gallery" | "video" | "form" | "nav" | "card" | "settings";
  description: string;
}

interface ScreenMockupProps {
  stepName: string;
  screenType: string;
  components: ScreenComponent[];
  accentColor?: string;
}

// ── Component Renderer ─────────────────────────────

function MockupComponent({
  comp,
  isHighlighted,
  onClick,
}: {
  comp: ScreenComponent;
  isHighlighted: boolean;
  onClick: () => void;
}) {
  const base = `relative cursor-pointer transition-all duration-200 rounded ${
    isHighlighted ? "ring-2 ring-primary shadow-lg scale-[1.02]" : "hover:ring-1 hover:ring-primary/40"
  }`;

  const badge = isHighlighted ? (
    <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-[9px] font-bold px-1.5 py-0.5 rounded-full z-10">
      {comp.type}
    </span>
  ) : null;

  switch (comp.type) {
    case "nav":
      return (
        <div className={base} onClick={onClick}>
          {badge}
          <div className="bg-gray-800 rounded-t-md px-3 py-1.5 flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
            <div className="flex-1 mx-2 bg-gray-700 rounded h-1.5" />
            <div className="flex gap-2">
              <div className="bg-gray-600 rounded h-1.5 w-6" />
              <div className="bg-gray-600 rounded h-1.5 w-6" />
              <div className="bg-gray-600 rounded h-1.5 w-6" />
            </div>
          </div>
        </div>
      );
    case "card":
      return (
        <div className={`${base} bg-white border border-gray-200`} onClick={onClick}>
          {badge}
          <div className="p-3">
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded h-12 mb-2" />
            <div className="bg-gray-100 rounded h-2 w-3/4 mb-1" />
            <div className="bg-gray-100 rounded h-2 w-1/2" />
          </div>
        </div>
      );
    case "input":
      return (
        <div className={base} onClick={onClick}>
          {badge}
          <div className="bg-white border border-gray-200 rounded-md px-2 py-1.5">
            <div className="text-[7px] text-gray-400 mb-0.5">{comp.label}</div>
            <div className="bg-gray-50 border border-gray-200 rounded px-2 py-1">
              <span className="text-[8px] text-gray-300 italic">Type here...</span>
            </div>
          </div>
        </div>
      );
    case "button":
      return (
        <div
          className={`${base} bg-primary text-primary-foreground text-center rounded-md px-3 py-1.5 text-[8px] font-semibold`}
          onClick={onClick}
        >
          {badge}
          {comp.label}
        </div>
      );
    case "table":
      return (
        <div className={`${base} bg-white border border-gray-200 rounded-md overflow-hidden`} onClick={onClick}>
          {badge}
          <div className="bg-gray-100 px-2 py-1 flex gap-3 text-[6px] font-semibold text-gray-600">
            <span>#</span>
            <span className="flex-1">Scene</span>
            <span>Type</span>
            <span>Voiceover</span>
          </div>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="px-2 py-0.5 flex gap-3 text-[6px] text-gray-500 border-t border-gray-100">
              <span>{i}</span>
              <span className="flex-1 bg-gray-50 rounded h-1.5 mt-0.5" />
              <span className="bg-blue-50 text-blue-500 rounded px-1">{i % 2 === 0 ? "cutout" : "b-roll"}</span>
              <span className="flex-1 bg-gray-50 rounded h-1.5 mt-0.5" />
            </div>
          ))}
        </div>
      );
    case "gallery":
      return (
        <div className={base} onClick={onClick}>
          {badge}
          <div className="grid grid-cols-3 gap-1.5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded border border-gray-200 flex items-center justify-center"
              >
                <div className="text-[8px] text-gray-400">#{i}</div>
              </div>
            ))}
          </div>
        </div>
      );
    case "video":
      return (
        <div className={`${base} bg-black rounded-md overflow-hidden`} onClick={onClick}>
          {badge}
          <div className="aspect-video flex items-center justify-center relative">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <div className="w-0 h-0 border-l-[6px] border-l-white border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent ml-0.5" />
            </div>
            <div className="absolute bottom-1 left-1 right-1 h-1 bg-gray-700 rounded">
              <div className="h-full bg-primary rounded w-1/3" />
            </div>
          </div>
        </div>
      );
    case "form":
      return (
        <div className={`${base} bg-white border border-gray-200 rounded-md p-2`} onClick={onClick}>
          {badge}
          <div className="space-y-1.5">
            {[1, 2, 3].map((i) => (
              <div key={i}>
                <div className="text-[7px] text-gray-400 mb-0.5">Field {i}</div>
                <div className="bg-gray-50 border border-gray-200 rounded h-3" />
              </div>
            ))}
          </div>
        </div>
      );
    case "settings":
      return (
        <div
          className={`${base} bg-white border border-gray-200 rounded-md px-2 py-1.5 flex items-center justify-between`}
          onClick={onClick}
        >
          {badge}
          <span className="text-[8px] text-gray-600">{comp.label}</span>
          <div className="w-6 h-3 bg-primary rounded-full relative">
            <div className="absolute right-0.5 top-0.5 w-2 h-2 bg-white rounded-full" />
          </div>
        </div>
      );
    default:
      return (
        <div className={`${base} bg-gray-100 border border-gray-200 rounded-md p-2`} onClick={onClick}>
          {badge}
          <div className="text-[8px] text-gray-400">{comp.label}</div>
        </div>
      );
  }
}

// ── Screen Type Layouts ────────────────────────────

function ScreenLayout({
  screenType,
  components,
  highlightedId,
  onComponentClick,
}: {
  screenType: string;
  components: ScreenComponent[];
  highlightedId: string | null;
  onComponentClick: (comp: ScreenComponent) => void;
  }) {
  // Group components by type for layout
  const nav = components.find((c) => c.type === "nav");
  const main = components.filter((c) => c.type !== "nav");

  return (
    <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden text-left">
      {nav && (
        <MockupComponent
          comp={nav}
          isHighlighted={highlightedId === nav.id}
          onClick={() => onComponentClick(nav)}
        />
      )}
      <div className="p-2 space-y-2">
        {main.map((comp) => (
          <MockupComponent
            key={comp.id}
            comp={comp}
            isHighlighted={highlightedId === comp.id}
            onClick={() => onComponentClick(comp)}
          />
        ))}
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────

export function ScreenMockupPanel({
  stepName,
  screenType,
  components,
  accentColor = "#6366f1",
}: ScreenMockupProps) {
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [zoomedComponent, setZoomedComponent] = useState<ScreenComponent | null>(null);

  const handleComponentClick = (comp: ScreenComponent) => {
    if (highlightedId === comp.id) {
      // Second click = zoom in
      setZoomedComponent(comp);
    } else {
      setHighlightedId(comp.id);
    }
  };

  return (
    <div className="relative">
      {/* Screen mockup */}
      <div className="bg-gray-800 rounded-t-xl px-3 py-1.5 flex items-center gap-1.5">
        <div className="w-2 h-2 rounded-full bg-red-400" />
        <div className="w-2 h-2 rounded-full bg-yellow-400" />
        <div className="w-2 h-2 rounded-full bg-green-400" />
        <span className="text-[9px] text-gray-400 ml-2 font-mono">{screenType}</span>
      </div>
      <ScreenLayout
        screenType={screenType}
        components={components}
        highlightedId={highlightedId}
        onComponentClick={handleComponentClick}
      />

      {/* Component legend */}
      <div className="mt-2 flex flex-wrap gap-1">
        {components.map((comp) => (
          <button
            key={comp.id}
            className={`text-[8px] px-1.5 py-0.5 rounded-full border transition-all ${
              highlightedId === comp.id
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-muted text-muted-foreground border-border hover:border-primary/40"
            }`}
            onClick={() => handleComponentClick(comp)}
          >
            {comp.label}
          </button>
        ))}
      </div>

      {/* Zoom Overlay */}
      {zoomedComponent && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-8" onClick={() => setZoomedComponent(null)}>
          <div
            className="bg-card rounded-2xl border border-border shadow-2xl max-w-lg w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-xs text-muted-foreground font-mono mb-1">{zoomedComponent.type}</div>
                <h3 className="text-lg font-bold">{zoomedComponent.label}</h3>
              </div>
              <button
                onClick={() => setZoomedComponent(null)}
                className="p-1 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-sm text-muted-foreground mb-4">{zoomedComponent.description}</p>

            {/* Zoomed mockup */}
            <div className="bg-gray-50 rounded-xl border border-border p-6 flex items-center justify-center">
              <div className="w-full max-w-sm">
                <MockupComponent
                  comp={zoomedComponent}
                  isHighlighted={false}
                  onClick={() => {}}
                />
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
              <MousePointer2 className="w-3 h-3" />
              Click components in the small view to highlight, click again to zoom
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

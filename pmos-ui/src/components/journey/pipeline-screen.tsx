"use client";

import { useState, useEffect } from "react";
import { Play, Pause, Volume2, Download, ExternalLink, Monitor, Loader2 } from "lucide-react";

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

// ── Live App Embed ─────────────────────────────────

function LiveAppEmbed({ uiUrl }: { uiUrl: string }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-2">
        <Monitor className="w-4 h-4 text-green-500" />
        <span className="text-xs font-medium text-green-600">Live Application</span>
        <a
          href={uiUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] text-primary hover:underline flex items-center gap-1"
        >
          Open in new tab <ExternalLink className="w-2.5 h-2.5" />
        </a>
      </div>
      <div className="rounded-lg border border-border overflow-hidden bg-white">
        <iframe
          src={uiUrl}
          className="w-full border-0"
          style={{ height: "600px", minHeight: "400px" }}
          title="Application UI"
        />
      </div>
    </div>
  );
}

// ── Parsed UI Structure ────────────────────────────

function UIStructureView({ ui }: { ui: UIInfo }) {
  if (!ui.steps || ui.steps.length === 0) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        No UI steps detected. The application may not have a web interface.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {ui.steps.map((step) => (
        <div key={step.number} className="border border-border rounded-lg overflow-hidden">
          <div className="bg-muted/50 px-3 py-2 border-b border-border flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold">
              {step.number}
            </span>
            <h4 className="text-sm font-semibold">{step.title}</h4>
          </div>
          {step.description && (
            <div className="px-3 py-2 text-xs text-muted-foreground border-b border-border/50">
              {step.description}
            </div>
          )}
          {step.fields.length > 0 && (
            <div className="px-3 py-2">
              <div className="text-[10px] font-medium text-muted-foreground uppercase mb-1">
                Form Fields
              </div>
              <div className="flex flex-wrap gap-1">
                {step.fields.map((field) => (
                  <span key={field} className="text-[10px] px-2 py-0.5 rounded bg-muted border border-border">
                    {field}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
      {ui.features.hasCostTracker && (
        <div className="text-[10px] text-muted-foreground flex items-center gap-1">
          💰 Cost tracker built-in
        </div>
      )}
    </div>
  );
}

// ── Scene Table ────────────────────────────────────

function SceneTableView({ scenes }: { scenes: PipelineData["scenes"] }) {
  if (scenes.length === 0) {
    return (
      <div className="p-4 text-sm text-muted-foreground italic">
        No scenes generated yet.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
      <table className="w-full text-xs">
        <thead className="sticky top-0 bg-card">
          <tr className="border-b border-border">
            <th className="text-left p-2 font-medium">#</th>
            <th className="text-left p-2 font-medium">Type</th>
            <th className="text-left p-2 font-medium">Voiceover</th>
            <th className="text-left p-2 font-medium">Midground</th>
          </tr>
        </thead>
        <tbody>
          {scenes.map((scene) => (
            <tr key={scene.sceneNumber} className="border-b border-border/50 hover:bg-muted/50">
              <td className="p-2 font-mono text-muted-foreground">{scene.sceneNumber}</td>
              <td className="p-2">
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                  scene.sceneType === "cutout" ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"
                }`}>
                  {scene.sceneType}
                </span>
              </td>
              <td className="p-2 max-w-[300px] truncate">{scene.voiceoverLine}</td>
              <td className="p-2 max-w-[250px] truncate text-muted-foreground italic">{scene.midgroundPrompt}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Image Gallery ──────────────────────────────────

function ImageGalleryView({ items, type }: { items: PipelineData["processedAssets"]["items"]; type?: string }) {
  const filtered = type ? items.filter((i) => i.type === type) : items;
  if (filtered.length === 0) {
    return <div className="p-4 text-sm text-muted-foreground italic">No images found.</div>;
  }

  return (
    <div className="grid grid-cols-4 gap-2 p-2 max-h-[300px] overflow-y-auto">
      {filtered.slice(0, 12).map((item) => (
        <div key={item.name} className="group">
          <div className="aspect-video bg-gray-100 rounded border border-border overflow-hidden">
            {item.url ? (
              <img src={item.url} alt={item.name} className="w-full h-full object-cover" loading="lazy"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            ) : (
              <div className="flex items-center justify-center h-full text-[10px] text-muted-foreground p-1 text-center">{item.name}</div>
            )}
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-[9px] font-mono text-muted-foreground">S{item.scene}</span>
            <span className={`text-[8px] px-1 py-0.5 rounded ${
              item.type === "halftone" ? "bg-purple-50 text-purple-600"
              : item.type === "nobg" ? "bg-green-50 text-green-600"
              : "bg-gray-100 text-gray-600"
            }`}>{item.type}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Video Player ───────────────────────────────────

function VideoPlayerView({ video }: { video: PipelineData["video"] }) {
  if (!video.exists) {
    return (
      <div className="p-8 text-center">
        <div className="text-muted-foreground text-sm">No rendered video yet</div>
      </div>
    );
  }

  return (
    <div className="p-2">
      <div className="rounded-lg overflow-hidden border border-border bg-black">
        <video src={video.url!} controls className="w-full" style={{ maxHeight: "240px" }} />
      </div>
      <div className="mt-2 flex items-center justify-between px-2">
        <span className="text-xs text-muted-foreground">{(video.size / (1024 * 1024)).toFixed(1)}MB</span>
        <a href={video.url!} download className="flex items-center gap-1 text-xs text-primary hover:underline">
          <Download className="w-3 h-3" /> Download
        </a>
      </div>
    </div>
  );
}

// ── Main Pipeline Screen ───────────────────────────

export function PipelineScreen({
  stepName,
  pipelineData,
  uiInfo,
}: {
  stepName: string;
  pipelineData: PipelineData | null;
  uiInfo?: UIInfo | null;
}) {
  // If the server is running, show live app for relevant steps
  if (uiInfo?.serverRunning && uiInfo.uiUrl) {
    // For the main workflow steps, show the live app
    if (["Discovery", "Sign Up", "Enter Subject", "Create Project", "Generate Script",
         "Edit Scenes", "Preview Video", "Export & Share"].includes(stepName)) {
      return <LiveAppEmbed uiUrl={uiInfo.uiUrl} />;
    }
  }

  // Fall back to parsed UI structure or pipeline data
  if (uiInfo && uiInfo.steps.length > 0) {
    return <UIStructureView ui={uiInfo} />;
  }

  if (!pipelineData) {
    return (
      <div className="p-4 flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading pipeline data...
      </div>
    );
  }

  switch (stepName) {
    case "Generate Script":
    case "Review Script for Accuracy":
      return <SceneTableView scenes={pipelineData.scenes} />;
    case "Edit Scenes":
      return <ImageGalleryView items={pipelineData.processedAssets.items} type="halftone" />;
    case "Preview Video":
    case "Review & Iterate":
    case "Team Review":
      return <VideoPlayerView video={pipelineData.video} />;
    case "Export & Share":
    case "Export & Distribute":
    case "Export for LMS":
      return (
        <div className="p-3 space-y-3">
          <VideoPlayerView video={pipelineData.video} />
          <div className="grid grid-cols-3 gap-2">
            {["MP4 (1920×1080)", "MP4 (1080×1920)", "MP4 (1080×1080)"].map((fmt) => (
              <div key={fmt} className="border border-border rounded-lg p-2 text-center hover:border-primary/40 cursor-pointer">
                <Download className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                <div className="text-[10px]">{fmt}</div>
              </div>
            ))}
          </div>
        </div>
      );
    default:
      return (
        <div className="p-2">
          <ImageGalleryView items={pipelineData.processedAssets.items} />
        </div>
      );
  }
}

// src/components/cost-bar.tsx
// PMOS Shared CostBar & Financial Breakdown Component
// Reusable across Kanban Cards, Detail Modals, Board Headers, and OKR Story Links

"use client";

import React from "react";
import { Zap, Clock, TrendingUp, DollarSign, Sparkles } from "lucide-react";
import {
  estimateTokenCost,
  calculateROI,
  formatCost,
  formatDollars,
  formatTokens,
  formatDuration,
  getVerdictColor,
  type PricingParams,
} from "@/lib/cost-estimation";
import type { Story } from "@/types/pmos";

interface CostBarProps {
  story: Story;
  pricing?: PricingParams;
  variant?: "compact" | "detailed" | "banner";
  showROI?: boolean;
  className?: string;
}

export function CostBar({
  story,
  pricing = {
    developerHourlyRate: 150,
    hoursPerPoint: 0.35,
    aiOverheadPercent: 14,
    model: "claude-sonnet-4",
  },
  variant = "compact",
  showROI = true,
  className = "",
}: CostBarProps) {
  const storyVal = story.dimensions?.totalValue || story.estimatedValue || 0;
  const cost = estimateTokenCost(story, pricing);
  const roi = calculateROI(storyVal, story, pricing);
  const hours =
    story.estimatedHours ??
    (story.points ? story.points * (pricing.hoursPerPoint || 0.35) : 1);
  const totalTokens = cost.inputTokens + cost.outputTokens;
  const tokens = story.tokensUsed || story.estimatedTokens || totalTokens;

  if (variant === "detailed") {
    return (
      <div
        className={`p-3.5 rounded-xl border border-border bg-muted/20 space-y-2 ${className}`}
      >
        <div className="flex items-center justify-between text-xs font-semibold text-foreground">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Zap className="w-4 h-4 text-violet-500" />
            <span>Financial &amp; Effort Breakdown</span>
          </span>
          {showROI && roi.estimatedValue > 0 && (
            <span
              className={`text-xs px-2 py-0.5 rounded-md font-bold font-mono border ${getVerdictColor(
                roi.verdict
              )}`}
            >
              ROI: {roi.roiMultiple}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          {/* Estimated Labor */}
          <div className="p-2 rounded-lg bg-card border border-border/70 text-xs">
            <div className="text-[10px] text-muted-foreground">Dev Labor</div>
            <div className="font-mono font-bold text-foreground">
              {hours.toFixed(1)}h (${Math.round(hours * (pricing.developerHourlyRate || 150)).toLocaleString()})
            </div>
          </div>

          {/* AI Tokens */}
          <div className="p-2 rounded-lg bg-card border border-border/70 text-xs">
            <div className="text-[10px] text-muted-foreground">AI Tokens</div>
            <div className="font-mono font-bold text-violet-600 dark:text-violet-400">
              {formatTokens(tokens)} ({formatCost(cost.aiCost)})
            </div>
          </div>

          {/* Total Cost */}
          <div className="p-2 rounded-lg bg-card border border-border/70 text-xs">
            <div className="text-[10px] text-muted-foreground">Total Effort Cost</div>
            <div className="font-mono font-bold text-foreground">
              {formatCost(cost.totalCost)}
            </div>
          </div>

          {/* Business Value */}
          <div className="p-2 rounded-lg bg-card border border-border/70 text-xs">
            <div className="text-[10px] text-muted-foreground">Target Value</div>
            <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
              {formatDollars(roi.estimatedValue || 0)}
            </div>
          </div>
        </div>

        {story.executionDurationMs ? (
          <div className="flex items-center gap-1.5 text-[11px] text-indigo-600 dark:text-indigo-400 font-mono pt-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Harness Duration: {formatDuration(story.executionDurationMs)}</span>
          </div>
        ) : null}
      </div>
    );
  }

  // Default "compact" variant for cards
  return (
    <div className={`flex items-center justify-between gap-1.5 text-[9px] ${className}`}>
      <div className="flex items-center gap-1.5 flex-wrap">
        <div
          className="flex items-center gap-0.5"
          title={`${hours.toFixed(1)}h labor + ${formatTokens(tokens)} tokens`}
        >
          <Zap className="w-2.5 h-2.5 text-violet-500" />
          <span className="font-mono text-violet-600 dark:text-violet-400 font-bold">
            {formatCost(cost.totalCost)}
          </span>
          <span className="text-[8px] text-muted-foreground font-mono">
            ({formatTokens(tokens)} tok)
          </span>
        </div>

        {showROI && roi.estimatedValue > 0 && (
          <>
            <span className="text-muted-foreground text-[8px]">→</span>
            <div className="flex items-center gap-0.5">
              <TrendingUp className="w-2.5 h-2.5 text-emerald-500" />
              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                {formatDollars(roi.estimatedValue)}
              </span>
            </div>
          </>
        )}
      </div>

      {showROI && roi.estimatedValue > 0 && (
        <span
          className={`text-[8px] px-1.5 py-0.2 rounded font-bold font-mono border ${getVerdictColor(
            roi.verdict
          )}`}
        >
          {roi.roiMultiple}
        </span>
      )}
    </div>
  );
}

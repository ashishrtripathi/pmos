// ── Direct Hours & Token Cost & ROI Estimation ──────────────
// Calculates exact cost based on Estimated Hours × Hourly Rate + Tokens × Model Price.
// Allows zero rates / zero token cost for local / free models.

export interface TokenCost {
  inputTokens: number;
  outputTokens: number;
  aiCost: number;
  reviewHours: number;
  reviewCost: number;
  totalCost: number;
  modelUsed: string;
}

export interface ROI {
  estimatedValue: number;
  totalCost: number;
  roi: number;
  roiMultiple: string;
  verdict: "strong" | "moderate" | "weak" | "negative" | "unknown";
}

export interface PricingParams {
  aiOverheadPercent?: number;
  developerHourlyRate: number;
  productManagerHourlyRate?: number;
  qaEngineerHourlyRate?: number;
  hoursPerPoint?: number;
  costPerToken?: number;
  costPer1KTokens?: number;
  model: string;
}

/**
 * Estimate story cost directly from hours and tokens.
 */
export function estimateTokenCost(
  storyOrHours: number | { estimatedHours?: number; points?: number; estimatedTokens?: number; tokensUsed?: number },
  pricing: PricingParams
): TokenCost {
  let hours = 1;
  let customTokens: number | undefined;

  if (typeof storyOrHours === "number") {
    // If number passed: check if hoursPerPoint is used
    hours = storyOrHours > 0 ? storyOrHours * (pricing.hoursPerPoint || 0.5) : 0.5;
  } else if (storyOrHours) {
    if (storyOrHours.estimatedHours !== undefined && storyOrHours.estimatedHours !== null) {
      hours = storyOrHours.estimatedHours;
    } else if (storyOrHours.points) {
      hours = storyOrHours.points * (pricing.hoursPerPoint || 0.5);
    }
    customTokens = storyOrHours.tokensUsed ?? storyOrHours.estimatedTokens;
  }

  const devRate = Math.max(0, pricing.developerHourlyRate ?? 150);
  const reviewCost = hours * devRate;

  // Cost per 1K tokens
  const costPer1K = pricing.costPer1KTokens !== undefined
    ? pricing.costPer1KTokens
    : (pricing.costPerToken !== undefined ? pricing.costPerToken * 1000 : 0.003);

  const estimatedTokens = customTokens !== undefined ? customTokens : Math.max(1000, Math.round(hours * 15000));
  const aiCost = (estimatedTokens / 1000) * Math.max(0, costPer1K);

  return {
    inputTokens: Math.round(estimatedTokens * 0.6),
    outputTokens: Math.round(estimatedTokens * 0.4),
    aiCost,
    reviewHours: hours,
    reviewCost,
    totalCost: reviewCost + aiCost,
    modelUsed: pricing.model || "claude-sonnet-4",
  };
}

/**
 * Calculate ROI given an estimated business value and implementation cost.
 */
export function calculateROI(
  estimatedValue: number | undefined,
  storyOrHours: number | { estimatedHours?: number; points?: number; estimatedTokens?: number },
  pricing: PricingParams
): ROI {
  const cost = estimateTokenCost(storyOrHours, pricing);
  const totalCost = cost.totalCost;
  const value = estimatedValue ?? 0;

  if (value === 0) {
    return {
      estimatedValue: 0,
      totalCost,
      roi: 0,
      roiMultiple: "—",
      verdict: "unknown",
    };
  }

  const roi = totalCost > 0 ? value / totalCost : value > 0 ? 99 : 0;

  let verdict: ROI["verdict"] = "weak";
  if (roi >= 10) verdict = "strong";
  else if (roi >= 3) verdict = "moderate";
  else if (roi > 0) verdict = "weak";
  else verdict = "negative";

  return {
    estimatedValue: value,
    totalCost,
    roi,
    roiMultiple: roi > 0 ? `${roi.toFixed(1)}x` : "—",
    verdict,
  };
}

/**
 * Score a story for ranking purposes.
 * Higher score = higher priority.
 */
export function storyRankScore(
  story: { estimatedHours?: number; points?: number; estimatedValue?: number },
  pricing: PricingParams
): number {
  const cost = estimateTokenCost(story, pricing);
  const value = story.estimatedValue ?? 0;

  if (value === 0 && (!story.estimatedHours && !story.points)) return 0;

  // ROI-based score: value/cost, normalized
  if (cost.totalCost > 0) {
    const roi = value / cost.totalCost;
    return roi * 10 + (value > 0 ? 100 : 0) + (cost.reviewHours > 0 ? 50 / cost.reviewHours : 0);
  }

  return value > 0 ? 50 : 0;
}

// ── Formatting helpers ──────────────────────────────

export function formatTokens(n: number): string {
  if (!n || n <= 0) return "0";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

export function formatCost(n: number): string {
  if (n === 0) return "$0.00";
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}K`;
  if (n >= 1) return `$${n.toFixed(2)}`;
  if (n >= 0.01) return `$${n.toFixed(2)}`;
  return `$${n.toFixed(3)}`;
}

export function formatDollars(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

export function formatDuration(ms?: number): string {
  if (!ms || ms <= 0) return "0s";
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remSec = seconds % 60;
  if (minutes < 60) return `${minutes}m ${remSec}s`;
  const hours = (seconds / 3600).toFixed(1);
  return `${hours}h`;
}

const VERDICT_COLORS: Record<string, string> = {
  strong: "text-emerald-600 bg-emerald-50 border-emerald-200",
  moderate: "text-blue-600 bg-blue-50 border-blue-200",
  weak: "text-yellow-600 bg-yellow-50 border-yellow-200",
  negative: "text-red-600 bg-red-50 border-red-200",
  unknown: "text-gray-500 bg-gray-50 border-gray-200",
};

export function getVerdictColor(verdict: string): string {
  return VERDICT_COLORS[verdict] || VERDICT_COLORS.unknown;
}

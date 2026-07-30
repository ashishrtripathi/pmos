// ── Dynamic Token Cost & ROI Estimation ──────────────
// Reads pricing config from API to calculate costs.
// When pricing changes, costs/ROI automatically update.

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

// ── Dynamic estimation (accepts pricing config) ──────

export interface PricingParams {
  aiOverheadPercent: number;
  developerHourlyRate: number;
  hoursPerPoint: number;
  model: string;
}

export function estimateTokenCost(
  points: number,
  pricing: PricingParams
): TokenCost {
  const baseHours = points * pricing.hoursPerPoint;
  const devCost = baseHours * pricing.developerHourlyRate;
  const aiCost = devCost * (pricing.aiOverheadPercent / 100);

  // Estimated token count (derived from ai cost, for display only)
  const estimatedTokens = Math.round(aiCost * 500);

  return {
    inputTokens: Math.round(estimatedTokens * 0.6),
    outputTokens: Math.round(estimatedTokens * 0.4),
    aiCost,
    reviewHours: baseHours,
    reviewCost: devCost,
    totalCost: devCost + aiCost,
    modelUsed: pricing.model,
  };
}

/**
 * Calculate ROI given an estimated business value and implementation cost.
 */
export function calculateROI(
  estimatedValue: number | undefined,
  points: number,
  pricing: PricingParams
): ROI {
  const cost = estimateTokenCost(points, pricing);
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

  const roi = totalCost > 0 ? value / totalCost : 0;

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
  story: { points: number; estimatedValue?: number },
  pricing: PricingParams
): number {
  const cost = estimateTokenCost(story.points, pricing);
  const value = story.estimatedValue ?? 0;

  if (value === 0 && story.points === 0) return 0;

  // ROI-based score: value/cost, normalized
  if (cost.totalCost > 0) {
    const roi = value / cost.totalCost;
    return roi * 10 + (value > 0 ? 100 : 0) + (story.points > 0 ? 50 / story.points : 0);
  }

  return value > 0 ? 50 : 0;
}

// ── Formatting helpers ──────────────────────────────

export function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

export function formatCost(n: number): string {
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

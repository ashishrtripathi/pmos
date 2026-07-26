// ── Token Cost & ROI Estimation ──────────────────────
// Shared between Story Map and Kanban Board

// Approximate token costs per 1K tokens for different model tiers
export const COST_PER_1K_TOKENS: Record<string, number> = {
  haiku: 0.00025,
  sonnet: 0.003,
  opus: 0.015,
  "gpt-4o": 0.0025,
  "gemini-pro": 0.00125,
};

// Average token consumption per story point across the full 7-agent team
export const TOKENS_PER_POINT = {
  input: 12000,
  output: 8000,
  rounds: 3.5, // avg agent interaction rounds per point
};

// Defaults — PM can override per project via team-cost.json
export const DEFAULT_US_HOURLY_RATE = 150;
export const DEFAULT_REVIEW_HOURS_PER_POINT = 0.35;

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
  roi: number; // value / cost ratio
  roiMultiple: string; // e.g. "12.5x"
  verdict: "strong" | "moderate" | "weak" | "negative" | "unknown";
}

/**
 * Estimate the AI agent team + developer review cost for a story.
 */
export function estimateTokenCost(
  points: number,
  modelTier: string = "sonnet"
): TokenCost {
  const costPer1k = COST_PER_1K_TOKENS[modelTier] ?? COST_PER_1K_TOKENS.sonnet;

  const inputTokens = Math.round(
    points * TOKENS_PER_POINT.input * TOKENS_PER_POINT.rounds
  );
  const outputTokens = Math.round(
    points * TOKENS_PER_POINT.output * TOKENS_PER_POINT.rounds
  );

  const inputCost = (inputTokens / 1000) * costPer1k;
  const outputCost = (inputTokens / 1000) * costPer1k * 3; // output priced 3× input
  const singleAgentCost = inputCost + outputCost;

  const agentMultiplier = 7; // 7 agents on the team
  const totalAiCost = singleAgentCost * agentMultiplier;

  const reviewHours = points * DEFAULT_REVIEW_HOURS_PER_POINT;
  const reviewCost = reviewHours * DEFAULT_US_HOURLY_RATE;

  return {
    inputTokens,
    outputTokens,
    aiCost: totalAiCost,
    reviewHours,
    reviewCost,
    totalCost: totalAiCost + reviewCost,
    modelUsed: modelTier,
  };
}

/**
 * Calculate ROI given an estimated business value and implementation cost.
 */
export function calculateROI(
  estimatedValue: number | undefined,
  points: number
): ROI {
  const cost = estimateTokenCost(points);
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

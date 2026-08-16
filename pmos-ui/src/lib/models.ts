// ── Model Pricing Registry ─────────────────────────────
// Each model has a known cost per 1K input/output tokens.
// Cost calculations are based on estimated hours and token consumption.

export interface ModelPricing {
  id: string;
  name: string;
  provider: string;
  costPer1KTokens: number; // blended input+output cost per 1K tokens ($)
  notes?: string;
}

export const MODEL_REGISTRY: ModelPricing[] = [
  // Local / Free Models ($0.00)
  { id: "local-ollama", name: "Local Ollama / Llama 3 (Free)", provider: "Local", costPer1KTokens: 0.0, notes: "Zero token cost (self-hosted / open source)" },
  { id: "deepseek-r1-local", name: "DeepSeek R1 (Local / Free)", provider: "Local", costPer1KTokens: 0.0, notes: "Zero token cost (local weights)" },

  // Anthropic Claude
  { id: "claude-sonnet-4", name: "Claude Sonnet 4", provider: "Anthropic", costPer1KTokens: 0.003, notes: "Best balance of speed & quality" },
  { id: "claude-haiku-3.5", name: "Claude Haiku 3.5", provider: "Anthropic", costPer1KTokens: 0.001, notes: "Fast & economical" },
  { id: "claude-opus-4", name: "Claude Opus 4", provider: "Anthropic", costPer1KTokens: 0.015, notes: "Maximum capability" },

  // OpenAI GPT
  { id: "gpt-4o", name: "GPT-4o", provider: "OpenAI", costPer1KTokens: 0.005, notes: "Latest GPT-4 class" },
  { id: "gpt-4o-mini", name: "GPT-4o Mini", provider: "OpenAI", costPer1KTokens: 0.0015, notes: "Lightweight & fast" },
  { id: "gpt-4-turbo", name: "GPT-4 Turbo", provider: "OpenAI", costPer1KTokens: 0.01, notes: "Previous generation" },

  // Google Gemini
  { id: "gemini-2-flash", name: "Gemini 2.0 Flash", provider: "Google", costPer1KTokens: 0.0005, notes: "Very low cost" },
  { id: "gemini-2-pro", name: "Gemini 2.0 Pro", provider: "Google", costPer1KTokens: 0.002, notes: "High quality" },

  // Custom ($0.00+)
  { id: "custom", name: "Custom Pricing", provider: "Custom", costPer1KTokens: 0.0, notes: "Set custom rate per 1K tokens ($0.00+)" },
];

export function getModelById(id: string): ModelPricing | undefined {
  return MODEL_REGISTRY.find((m) => m.id === id);
}

/**
 * Calculate actual story cost from estimated hours, hourly rate, and token usage.
 */
export function calculateStoryCostDirect({
  estimatedHours,
  hourlyRate = 150,
  estimatedTokens,
  costPer1KTokens = 0.003,
}: {
  estimatedHours: number;
  hourlyRate?: number;
  estimatedTokens?: number;
  costPer1KTokens?: number;
}): {
  laborCost: number;
  tokenCost: number;
  totalCost: number;
} {
  const hours = Math.max(0, estimatedHours || 0);
  const laborCost = hours * Math.max(0, hourlyRate);
  const tokens = estimatedTokens !== undefined ? estimatedTokens : Math.max(1000, Math.round(hours * 15000));
  const tokenCost = (tokens / 1000) * Math.max(0, costPer1KTokens);

  return {
    laborCost,
    tokenCost,
    totalCost: laborCost + tokenCost,
  };
}

export function deriveAIOverheadPercent(modelId: string): number {
  const model = getModelById(modelId);
  if (!model || model.costPer1KTokens === 0) return 0;

  // Estimated tokens per hour: ~25k tokens per dev hour
  const tokensPerHour = 25000;
  const tokenCostPerHour = (tokensPerHour / 1000) * model.costPer1KTokens;
  const laborPerHour = 150;

  const percent = (tokenCostPerHour / laborPerHour) * 100;
  return Math.min(50, Math.max(0, Math.round(percent * 10) / 10));
}

// ── Model Pricing Registry ─────────────────────────────
// Each model has a known cost per 1K input/output tokens.
// The AI overhead percentage is derived from this + estimated
// token usage per story point (20K tokens per point average).

export interface ModelPricing {
  id: string;
  name: string;
  provider: string;
  costPer1KTokens: number; // blended input+output cost per 1K tokens
  notes?: string;
}

export const MODEL_REGISTRY: ModelPricing[] = [
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

  // Open source / local
  { id: "local-llama", name: "Llama 3 (local)", provider: "Local", costPer1KTokens: 0.0001, notes: "Free if self-hosted" },
  { id: "custom", name: "Custom pricing", provider: "Custom", costPer1KTokens: 0.003, notes: "Set your own cost per 1K tokens" },
];

export function getModelById(id: string): ModelPricing | undefined {
  return MODEL_REGISTRY.find((m) => m.id === id);
}

// ── AI Overhead Calculation ──────────────────────────
// Derives the AI overhead percentage from:
//   estimated tokens per story × model cost ÷ labor cost per story
//
// Default assumptions (tunable):
//   - 20K tokens per story point (prompt + completion, multi-turn)
//   - 3.5× multiplier for agentic loops (tool calls, retries, context)
//   - 7× margin for inefficiency, failed runs, re-prompts
//   - 0.35 hours per point at $150/hr developer rate = $52.50 labor per point

const DEFAULT_TOKENS_PER_POINT = 20000;
const DEFAULT_AGENT_MULTIPLIER = 3.5;
const DEFAULT_MARGIN = 7;

export function deriveAIOverheadPercent(modelId: string): number {
  const model = getModelById(modelId);
  if (!model) return 3; // fallback default

  // Estimated tokens per story point
  const tokensPerPoint = DEFAULT_TOKENS_PER_POINT * DEFAULT_AGENT_MULTIPLIER;

  // AI cost per point: (tokens / 1000) * costPer1KTokens * margin
  const costPerPoint = (tokensPerPoint / 1000) * model.costPer1KTokens * DEFAULT_MARGIN;

  // Labor cost per point: 0.35 hours × $150/hr
  const laborPerPoint = 0.35 * 150;

  // Overhead percentage
  const percent = (costPerPoint / laborPerPoint) * 100;

  // Round to 1 decimal place, min 0.5%, max 50%
  return Math.min(50, Math.max(0.5, Math.round(percent * 10) / 10));
}

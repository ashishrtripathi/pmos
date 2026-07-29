"use client";

import { useState, useTransition, useEffect } from "react";
import { Settings, Folder, Globe, Check, DollarSign, ChevronDown, ChevronRight } from "lucide-react";

const MODELS = [
  { id: "claude-sonnet-4", name: "Claude Sonnet 4", provider: "Anthropic", desc: "Best balance of speed & quality" },
  { id: "claude-haiku-3.5", name: "Claude Haiku 3.5", provider: "Anthropic", desc: "Fast & economical" },
  { id: "claude-opus-4", name: "Claude Opus 4", provider: "Anthropic", desc: "Maximum capability" },
  { id: "gpt-4o", name: "GPT-4o", provider: "OpenAI", desc: "Latest GPT-4 class" },
  { id: "gpt-4o-mini", name: "GPT-4o Mini", provider: "OpenAI", desc: "Lightweight & fast" },
  { id: "gpt-4-turbo", name: "GPT-4 Turbo", provider: "OpenAI", desc: "Previous generation" },
  { id: "gemini-2-flash", name: "Gemini 2.0 Flash", provider: "Google", desc: "Very low cost" },
  { id: "gemini-2-pro", name: "Gemini 2.0 Pro", provider: "Google", desc: "High quality" },
  { id: "local-llama", name: "Llama 3 (local)", provider: "Local", desc: "Free if self-hosted" },
  { id: "custom", name: "Custom pricing", provider: "Custom", desc: "Set your own cost per 1K tokens" },
];

const RATE_FIELDS = [
  { key: "developerHourlyRate", label: "Developer Hourly Rate ($)", step: "1", default: 150 },
  { key: "productManagerHourlyRate", label: "Product Manager Hourly Rate ($)", step: "1", default: 150 },
  { key: "qaEngineerHourlyRate", label: "QA Engineer Hourly Rate ($)", step: "1", default: 90 },
  { key: "hoursPerPoint", label: "Hours per Point", step: "0.01", default: 0.35 },
];

const TEAM_FIELDS = [
  { key: "numDevelopers", label: "Number of Developers", step: "1", default: 1 },
  { key: "numProductManagers", label: "Number of Product Managers", step: "1", default: 0 },
  { key: "numQA", label: "Number of QA Engineers", step: "1", default: 0 },
];

const ADVANCED_FIELDS = [
  { key: "costPerToken", label: "Cost per Token ($)", step: "0.0001", default: 0.003 },
  { key: "tokensPerPoint", label: "Tokens per Point", step: "100", default: 20000 },
  { key: "tokenMultiplier", label: "Token Multiplier", step: "0.1", default: 3.5 },
  { key: "tokensPerK", label: "Tokens per K", step: "100", default: 1000 },
  { key: "marginMultiplier", label: "Margin Multiplier", step: "0.1", default: 7 },
];

// ── Helper to calculate AI overhead from model + multipliers ──
function computeAIOverhead(modelId: string, costPerToken: number, tokensPerPoint: number, tokenMultiplier: number, tokensPerK: number, marginMultiplier: number): number {
  // Use model's known cost if available; otherwise use the custom costPerToken
  const model = MODELS.find((m) => m.id === modelId);
  const effectiveCost = model && model.id !== "custom" ? model.costPer1KTokens : costPerToken * tokensPerK;
  const perStoryTokens = tokensPerPoint * tokenMultiplier;
  const aiCostPerPoint = (perStoryTokens / tokensPerK) * effectiveCost * marginMultiplier;
  const laborPerPoint = 0.35 * 150; // hardcoded baseline for percentage derivation
  return Math.min(50, Math.max(0.5, Math.round((aiCostPerPoint / laborPerPoint) * 1000) / 10));
}

export default function SetupPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const [source, setSource] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState("local");
  const [localPath, setLocalPath] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, startSave] = useTransition();

  const [pricing, setPricing] = useState<Record<string, any>>({});
  const [pricingSaved, setPricingSaved] = useState(false);
  const [pricingSaving, startPricingSave] = useTransition();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [modelSearch, setModelSearch] = useState("");

  useEffect(() => {
    Promise.all([
      fetch(`/api/projects/${slug}/source`).then((r) => r.json()),
      fetch(`/api/projects/${slug}/pricing`).then((r) => r.json()),
    ])
      .then(([sourceData, pricingData]) => {
        if (sourceData && !sourceData.error) {
          setSource(sourceData);
          setMode(sourceData.mode || "local");
          setLocalPath(sourceData.localPath || "");
          setRepoUrl(sourceData.repoUrl || "");
        }
        if (pricingData && !pricingData.error) {
          setPricing(pricingData);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [slug]);

  const handleSave = () => {
    startSave(async () => {
      const data = {
        mode,
        localPath,
        repoUrl: repoUrl || null,
        resolvedAt: new Date().toISOString(),
        lastAnalyzed: source?.lastAnalyzed || null,
        runtime: source?.runtime || {
          status: "not-running",
          url: null,
          port: null,
          startedAt: null,
          method: null,
        },
      };
      await fetch(`/api/projects/${slug}/source`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      setSource(data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  };

  const handlePricingChange = (key: string, value: string) => {
    const num = parseFloat(value);
    if (!isNaN(num)) {
      const isHeadcount = ["numDevelopers", "numProductManagers", "numQA"].includes(key);
      if (isHeadcount ? num >= 0 : num > 0) {
        setPricing((prev) => ({ ...prev, [key]: num }));
      }
    }
  };

  const handleModelChange = (modelId: string) => {
    const model = MODELS.find((m) => m.id === modelId);
    if (!model) return;
    setPricing((prev) => ({
      ...prev,
      model: modelId,
      // Auto-derive overhead. If custom, keep existing costPerToken; otherwise use model's known cost
      costPerToken: model.id !== "custom" ? model.costPer1KTokens / 1000 : (prev.costPerToken ?? 0.003),
    }));
  };

  const handlePricingSave = () => {
    startPricingSave(async () => {
      await fetch(`/api/projects/${slug}/pricing`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pricing),
      });
      setPricingSaved(true);
      setTimeout(() => setPricingSaved(false), 2000);
    });
  };

  if (loading) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-64" />
          <div className="h-4 bg-muted rounded w-96" />
        </div>
      </div>
    );
  }

  const selectedModel = MODELS.find((m) => m.id === pricing.model) || MODELS[0];
  const filteredModels = modelSearch
    ? MODELS.filter((m) => m.name.toLowerCase().includes(modelSearch.toLowerCase()) || m.provider.toLowerCase().includes(modelSearch.toLowerCase()))
    : MODELS;

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="w-5 h-5" />
        <h1 className="text-2xl font-bold">Setup &mdash; {slug}</h1>
      </div>

      {/* ═══════════ Source Location ═══════════ */}
      <div className="mb-10">
        <h2 className="text-lg font-semibold mb-1">Source Location</h2>
        <p className="text-muted-foreground text-sm mb-4">
          Tell PMOS where your code lives. PMOS never clones &mdash; it reads from wherever you point it.
        </p>

        <div className="mb-4">
          <label className="text-sm font-medium mb-2 block">Source Mode</label>
          <div className="flex gap-3">
            {[
              { value: "local", icon: Folder, label: "Local Directory", desc: "Code on this machine" },
              { value: "github", icon: Globe, label: "GitHub + Local", desc: "Local clone + GitHub sync" },
              { value: "github-only", icon: Globe, label: "GitHub Only", desc: "No local clone" },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setMode(opt.value)}
                className={`flex-1 p-4 rounded-xl border text-left transition-all ${
                  mode === opt.value
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border hover:border-primary/30"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <opt.icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{opt.label}</span>
                </div>
                <span className="text-xs text-muted-foreground">{opt.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {(mode === "local" || mode === "github") && (
          <div className="mb-4">
            <label className="text-sm font-medium mb-2 block">Local Path</label>
            <input
              type="text"
              value={localPath}
              onChange={(e) => setLocalPath(e.target.value)}
              placeholder="C:\Users\ashis\Projects\my-project"
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        )}

        <div className="mb-4">
          <label className="text-sm font-medium mb-2 block">GitHub Repository URL (optional)</label>
          <input
            type="text"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            placeholder="https://github.com/user/repo"
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Source Configuration"}
          </button>
          {saved && (
            <span className="flex items-center gap-1 text-sm text-green-600">
              <Check className="w-4 h-4" /> Saved
            </span>
          )}
        </div>

        {source && (
          <div className="mt-4 p-4 rounded-xl border border-border bg-muted/50">
            <h3 className="text-sm font-semibold mb-2">Current Source Config</h3>
            <pre className="text-xs text-muted-foreground font-mono whitespace-pre-wrap">
              {JSON.stringify(source, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* ═══════════ Pricing Configuration ═══════════ */}
      <div className="mb-10 pt-8 border-t border-border">
        <div className="flex items-center gap-3 mb-1">
          <DollarSign className="w-5 h-5" />
          <h2 className="text-lg font-semibold">Pricing Configuration</h2>
        </div>
        <p className="text-muted-foreground text-sm mb-4">
          Configure your team rates, headcount, and AI model. Costs are auto-calculated for intelligence stories.
        </p>

        {/* Model Picker */}
        <div className="mb-4">
          <label className="text-sm font-medium mb-2 block">AI Model</label>
          <div className="relative">
            <input
              type="text"
              value={modelSearch}
              onChange={(e) => setModelSearch(e.target.value)}
              placeholder="Search models..."
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary mb-2"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-border rounded-lg p-2">
              {filteredModels.map((m) => (
                <button
                  key={m.id}
                  onClick={() => handleModelChange(m.id)}
                  className={`text-left p-2 rounded-lg text-sm transition-all ${
                    pricing.model === m.id
                      ? "bg-primary/10 ring-1 ring-primary"
                      : "hover:bg-muted"
                  }`}
                >
                  <div className="font-medium">{m.name}</div>
                  <div className="text-xs text-muted-foreground">{m.provider} &mdash; {m.desc}</div>
                </button>
              ))}
            </div>
          </div>
          {selectedModel && (
            <div className="mt-2 text-xs text-muted-foreground">
              Selected: <span className="font-medium text-foreground">{selectedModel.name}</span>
              {selectedModel.id !== "custom" && (
                <> &mdash; AI overhead: <span className="font-medium text-foreground">
                  {computeAIOverhead(
                    selectedModel.id,
                    pricing.costPerToken ?? 0.003,
                    pricing.tokensPerPoint ?? 20000,
                    pricing.tokenMultiplier ?? 3.5,
                    pricing.tokensPerK ?? 1000,
                    pricing.marginMultiplier ?? 7
                  )}%
                </span> of labor cost</>
              )}
            </div>
          )}
        </div>

        {/* Hourly Rates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          {RATE_FIELDS.map((field) => (
            <div key={field.key}>
              <label className="text-sm font-medium mb-1 block">{field.label}</label>
              <input
                type="number"
                step={field.step}
                value={pricing[field.key] ?? field.default}
                onChange={(e) => handlePricingChange(field.key, e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          ))}
        </div>

        {/* Team Composition */}
        <div className="mb-4 p-4 rounded-xl border border-border bg-muted/30">
          <h3 className="text-sm font-semibold mb-3">Team Composition</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {TEAM_FIELDS.map((field) => (
              <div key={field.key}>
                <label className="text-sm font-medium mb-1 block">{field.label}</label>
                <input
                  type="number"
                  min="0"
                  step={field.step}
                  value={pricing[field.key] ?? field.default}
                  onChange={(e) => handlePricingChange(field.key, e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Set to 0 if no one in that role is assigned to this project.
          </p>
        </div>

        {/* Live cost preview */}
        <div className="p-4 rounded-xl border border-border bg-muted/50 mb-4">
          <h3 className="text-sm font-semibold mb-2">Cost Preview (per 5-point story)</h3>
          <div className="text-xs text-muted-foreground space-y-1">
            {(() => {
              const dr = pricing.developerHourlyRate ?? 150;
              const pmr = pricing.productManagerHourlyRate ?? 150;
              const qar = pricing.qaEngineerHourlyRate ?? 90;
              const hpp = pricing.hoursPerPoint ?? 0.35;
              const nd = pricing.numDevelopers ?? 1;
              const npm = pricing.numProductManagers ?? 0;
              const nqa = pricing.numQA ?? 0;

              const baseHours = 5 * hpp;
              const per5PointDev = baseHours * dr * nd;
              const per5PointPM = baseHours * pmr * npm;
              const per5PointQA = baseHours * qar * nqa;
              const per5PointHuman = per5PointDev + per5PointPM + per5PointQA;

              const aiPct = computeAIOverhead(
                pricing.model ?? "claude-sonnet-4",
                pricing.costPerToken ?? 0.003,
                pricing.tokensPerPoint ?? 20000,
                pricing.tokenMultiplier ?? 3.5,
                pricing.tokensPerK ?? 1000,
                pricing.marginMultiplier ?? 7
              );
              const per5PointAI = per5PointHuman * (aiPct / 100);
              const per5PointTotal = per5PointHuman + per5PointAI;

              return (
                <>
                  {nd > 0 && (
                    <div className="flex justify-between">
                      <span>Developer cost ({nd}× {dr}/hr):</span>
                      <span className="font-mono">${per5PointDev.toFixed(2)}</span>
                    </div>
                  )}
                  {npm > 0 && (
                    <div className="flex justify-between">
                      <span>PM cost ({npm}× {pmr}/hr):</span>
                      <span className="font-mono">${per5PointPM.toFixed(2)}</span>
                    </div>
                  )}
                  {nqa > 0 && (
                    <div className="flex justify-between">
                      <span>QA cost ({nqa}× {qar}/hr):</span>
                      <span className="font-mono">${per5PointQA.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>AI overhead ({aiPct}% of labor):</span>
                    <span className="font-mono">${per5PointAI.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-foreground pt-1 border-t border-border mt-1">
                    <span>Total (5-point story):</span>
                    <span className="font-mono">${per5PointTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground pt-1">
                    <span>Team size:</span>
                    <span className="font-mono">{nd + npm + nqa} people</span>
                  </div>
                </>
              );
            })()}
          </div>
        </div>

        {/* Advanced AI Settings (collapsible) */}
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          {showAdvanced ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          {showAdvanced ? "Hide Advanced AI Settings" : "Show Advanced AI Settings"}
        </button>

        {showAdvanced && (
          <div className="p-4 rounded-xl border border-border bg-muted/30 mb-4">
            <p className="text-xs text-muted-foreground mb-3">
              These fields control how the AI overhead percentage is calculated. You normally don&apos;t need to change them unless you have specific token usage data.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {ADVANCED_FIELDS.map((field) => (
                <div key={field.key}>
                  <label className="text-sm font-medium mb-1 block">{field.label}</label>
                  <input
                    type="number"
                    step={field.step}
                    value={pricing[field.key] ?? field.default}
                    onChange={(e) => handlePricingChange(field.key, e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            onClick={handlePricingSave}
            disabled={pricingSaving}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {pricingSaving ? "Saving..." : "Save Pricing"}
          </button>
          {pricingSaved && (
            <span className="flex items-center gap-1 text-sm text-green-600">
              <Check className="w-4 h-4" /> Saved
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

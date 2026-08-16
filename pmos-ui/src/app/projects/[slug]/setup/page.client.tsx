"use client";

import { useState, useTransition, useEffect } from "react";
import { Settings, Folder, Globe, Check, DollarSign, ChevronDown, ChevronRight, Search, Loader2, HardDrive, FolderGit2, X, Trash2, AlertTriangle, Save } from "lucide-react";
import { MODEL_REGISTRY } from "@/lib/models";
import { GitHubRepo, GitHubSearch, FileSystemBrowser } from "@/components/project-source-browser";
import { RemoveProjectModal } from "@/components/remove-project-modal";

const MODELS = MODEL_REGISTRY.map((m) => ({
  id: m.id,
  name: m.name,
  provider: m.provider,
  desc: m.notes,
  costPer1KTokens: m.costPer1KTokens,
}));

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

export function SetupPageClient({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const [source, setSource] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState("local");
  const [localPath, setLocalPath] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [repoInfo, setRepoInfo] = useState<GitHubRepo | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, startSave] = useTransition();

  const [pricing, setPricing] = useState<Record<string, any>>({});
  const [pricingSaved, setPricingSaved] = useState(false);
  const [pricingSaving, startPricingSave] = useTransition();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [modelSearch, setModelSearch] = useState("");
  const [showRemoveModal, setShowRemoveModal] = useState(false);

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

  const handleRepoSelect = (repo: GitHubRepo) => {
    setRepoInfo(repo);
    setRepoUrl(repo.cloneUrl);
  };

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
    if (!isNaN(num) && num >= 0) {
      setPricing((prev) => ({ ...prev, [key]: num }));
    }
  };

  const handleModelChange = (modelId: string) => {
    const model = MODELS.find((m) => m.id === modelId);
    if (!model) return;
    setPricing((prev) => ({
      ...prev,
      model: modelId,
      // Auto-derive overhead. If custom, keep existing costPerToken; otherwise use model's known cost
      costPerToken: model.id !== "custom" ? model.costPer1KTokens / 1000 : (prev.costPerToken ?? 0),
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

        <div className="mb-6">
          <label className="text-sm font-semibold mb-2 block">Source Mode</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { value: "local", icon: Folder, label: "Local Directory", desc: "Code on this machine" },
              { value: "github", icon: Globe, label: "GitHub + Local", desc: "Local clone + GitHub sync" },
              { value: "github-only", icon: Globe, label: "GitHub Only", desc: "No local clone" },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setMode(opt.value)}
                className={`p-4 rounded-xl border text-left transition-all relative ${
                  mode === opt.value
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm"
                    : "border-border hover:border-primary/40 hover:bg-muted/40"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <opt.icon className={`w-4 h-4 ${mode === opt.value ? "text-primary" : "text-muted-foreground"}`} />
                  <span className={`text-sm font-semibold ${mode === opt.value ? "text-primary" : "text-foreground"}`}>
                    {opt.label}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{opt.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {(mode === "local" || mode === "github") && (
          <div className="mb-4">
            <label className="text-sm font-medium mb-2 block flex items-center gap-1.5">
              <HardDrive className="w-4 h-4 text-blue-500" />
              {mode === "github" ? "Local Clone Path" : "Project Directory"}
            </label>
            <FileSystemBrowser
              onSelect={setLocalPath}
              initialPath={localPath}
            />
          </div>
        )}

        {(mode === "github" || mode === "github-only") && (
          <div className="mb-4">
            <label className="text-sm font-medium mb-2 block flex items-center gap-1.5">
              <FolderGit2 className="w-4 h-4 text-green-500" />
              GitHub Repository
            </label>
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={repoUrl}
                  onChange={(e) => { setRepoUrl(e.target.value); setRepoInfo(null); }}
                  placeholder="https://github.com/owner/repo"
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-border bg-background text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="text-center text-xs text-muted-foreground">— or search —</div>
              <GitHubSearch onSelect={handleRepoSelect} />
              {repoInfo && (
                <div className="p-3 rounded-lg border border-green-200 bg-green-50/50 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-green-800 truncate">{repoInfo.fullName}</div>
                    <div className="text-xs text-green-700 truncate">{repoInfo.cloneUrl}</div>
                  </div>
                  <button
                    onClick={() => { setRepoInfo(null); setRepoUrl(""); }}
                    className="p-1 rounded-md text-green-600 hover:text-green-800 hover:bg-green-100 shrink-0"
                    title="Clear selection"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? "Saving..." : saved ? "Saved!" : "Save Source Configuration"}
        </button>
      </div>

      {/* ═══════════ Pricing & Cost Estimation ═══════════ */}
      <div className="mb-10">
        <h2 className="text-lg font-semibold mb-1">Pricing &amp; Cost Estimation</h2>
        <p className="text-muted-foreground text-sm mb-4">
          Direct calculation based on estimated hours and token consumption. Supports $0.00 for local models.
        </p>

        {/* Model Selection */}
        <div className="mb-4">
          <label className="text-sm font-medium mb-1 block">AI Model</label>
          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={modelSearch}
              onChange={(e) => setModelSearch(e.target.value)}
              placeholder="Filter models..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="max-h-48 overflow-y-auto rounded-lg border border-border divide-y divide-border">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 p-1">
              {filteredModels.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => handleModelChange(m.id)}
                  className={`p-2.5 rounded-md text-left text-sm transition-colors ${
                    (pricing.model || "claude-sonnet-4") === m.id
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
                <> &mdash; AI cost: <span className="font-medium text-foreground font-mono">
                  ${(selectedModel.costPer1KTokens || 0).toFixed(4)}/1K tokens
                </span></>
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
                min="0"
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
          <h3 className="text-sm font-semibold mb-2">Cost &amp; Execution Preview (per 2-hour story · ~30K tokens)</h3>
          <div className="text-xs text-muted-foreground space-y-1.5">
            {(() => {
              const dr = pricing.developerHourlyRate ?? 150;
              const pmr = pricing.productManagerHourlyRate ?? 150;
              const qar = pricing.qaEngineerHourlyRate ?? 90;
              const nd = pricing.numDevelopers ?? 1;
              const npm = pricing.numProductManagers ?? 0;
              const nqa = pricing.numQA ?? 0;

              const sampleHours = 2;
              const sampleTokens = 30000;

              const devLabor = sampleHours * dr * nd;
              const pmLabor = (sampleHours * 0.2) * pmr * npm;
              const qaLabor = (sampleHours * 0.3) * qar * nqa;
              const totalHumanLabor = devLabor + pmLabor + qaLabor;

              const costPer1K = selectedModel.costPer1KTokens ?? (pricing.costPerToken ?? 0.003) * 1000;
              const tokenCost = (sampleTokens / 1000) * costPer1K;
              const totalStoryCost = totalHumanLabor + tokenCost;

              return (
                <>
                  {nd > 0 && (
                    <div className="flex justify-between">
                      <span>Developer labor (2h @ ${dr}/hr):</span>
                      <span className="font-mono">${devLabor.toFixed(2)}</span>
                    </div>
                  )}
                  {npm > 0 && (
                    <div className="flex justify-between">
                      <span>PM review (0.4h @ ${pmr}/hr):</span>
                      <span className="font-mono">${pmLabor.toFixed(2)}</span>
                    </div>
                  )}
                  {nqa > 0 && (
                    <div className="flex justify-between">
                      <span>QA validation (0.6h @ ${qar}/hr):</span>
                      <span className="font-mono">${qaLabor.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>AI Model tokens (30K tokens @ ${costPer1K.toFixed(4)}/1K):</span>
                    <span className="font-mono font-medium text-foreground">${tokenCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-foreground pt-1 border-t border-border mt-1">
                    <span>Total Story Cost:</span>
                    <span className="font-mono">${totalStoryCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground pt-1">
                    <span>Estimated Harness Execution Time:</span>
                    <span className="font-mono">~45s – 2m per story</span>
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

      {/* ═══════════ Danger Zone: Remove Project ═══════════ */}
      <div className="pt-8 border-t border-border">
        <h2 className="text-lg font-semibold text-destructive mb-1 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" /> Danger Zone
        </h2>
        <p className="text-muted-foreground text-sm mb-4">
          Actions that affect the project registration in PMOS.
        </p>

        <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-sm text-foreground">Remove this project from PMOS</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Detach &ldquo;{slug}&rdquo; from PMOS and clean up its metadata. Your actual code on disk or GitHub is not deleted.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowRemoveModal(true)}
            className="px-4 py-2 rounded-lg border border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground text-sm font-medium transition-all shrink-0 flex items-center justify-center gap-2 shadow-sm"
          >
            <Trash2 className="w-4 h-4" />
            Remove Project
          </button>
        </div>
      </div>

      {/* Remove Confirmation Modal */}
      <RemoveProjectModal
        slug={slug}
        projectName={slug}
        isOpen={showRemoveModal}
        onClose={() => setShowRemoveModal(false)}
        redirectToHome={true}
      />
    </div>
  );
}
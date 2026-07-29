"use client";

import { useState, useTransition, useEffect } from "react";
import { Settings, Folder, Globe, Check, DollarSign } from "lucide-react";

const PRICING_FIELDS = [
  { key: "costPerToken", label: "Cost per Token ($)", step: "0.0001", default: 0.003 },
  { key: "tokensPerPoint", label: "Tokens per Point", step: "100", default: 20000 },
  { key: "tokenMultiplier", label: "Token Multiplier", step: "0.1", default: 3.5 },
  { key: "tokensPerK", label: "Tokens per K", step: "100", default: 1000 },
  { key: "developerHourlyRate", label: "Developer Hourly Rate ($)", step: "1", default: 150 },
  { key: "productManagerHourlyRate", label: "Product Manager Hourly Rate ($)", step: "1", default: 150 },
  { key: "qaEngineerHourlyRate", label: "QA Engineer Hourly Rate ($)", step: "1", default: 90 },
  { key: "hoursPerPoint", label: "Hours per Point", step: "0.01", default: 0.35 },
  { key: "marginMultiplier", label: "Margin Multiplier", step: "0.1", default: 7 },
];

const TEAM_FIELDS = [
  { key: "numDevelopers", label: "Number of Developers", step: "1", default: 1 },
  { key: "numProductManagers", label: "Number of Product Managers", step: "1", default: 0 },
  { key: "numQA", label: "Number of QA Engineers", step: "1", default: 0 },
];

export default function SetupPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const [source, setSource] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState("local");
  const [localPath, setLocalPath] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, startSave] = useTransition();

  // Pricing state
  const [pricing, setPricing] = useState<Record<string, number>>({});
  const [pricingSaved, setPricingSaved] = useState(false);
  const [pricingSaving, startPricingSave] = useTransition();

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
      // Headcount fields can be 0, monetary fields must be > 0
      const isHeadcount = ["numDevelopers", "numProductManagers", "numQA"].includes(key);
      if (isHeadcount ? num >= 0 : num > 0) {
        setPricing((prev) => ({ ...prev, [key]: num }));
      }
    }
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
          Configure how story costs are calculated. These values feed into the AI cost and developer cost estimates for intelligence stories.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          {PRICING_FIELDS.map((field) => (
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
          <h3 className="text-sm font-semibold mb-2">Cost Preview</h3>
          <div className="text-xs text-muted-foreground space-y-1">
            {(() => {
              const pp = pricing.tokensPerPoint ?? 20000;
              const tm = pricing.tokenMultiplier ?? 3.5;
              const tk = pricing.tokensPerK ?? 1000;
              const cpt = pricing.costPerToken ?? 0.003;
              const mm = pricing.marginMultiplier ?? 7;
              const dr = pricing.developerHourlyRate ?? 150;
              const pmr = pricing.productManagerHourlyRate ?? 150;
              const qar = pricing.qaEngineerHourlyRate ?? 90;
              const hpp = pricing.hoursPerPoint ?? 0.35;
              const nd = pricing.numDevelopers ?? 1;
              const npm = pricing.numProductManagers ?? 0;
              const nqa = pricing.numQA ?? 0;

              const baseHours = 5 * hpp;
              const per5PointTokens = 5 * pp * tm;
              const per5PointAi = (per5PointTokens / tk) * cpt * mm;
              const per5PointDev = baseHours * dr * nd;
              const per5PointPM = baseHours * pmr * npm;
              const per5PointQA = baseHours * qar * nqa;
              const per5PointTotal = per5PointAi + per5PointDev + per5PointPM + per5PointQA;

              return (
                <>
                  <div className="flex justify-between">
                    <span>AI cost (5-point story):</span>
                    <span className="font-mono">${per5PointAi.toFixed(2)}</span>
                  </div>
                  {nd > 0 && (
                    <div className="flex justify-between">
                      <span>Developer cost ({nd} × {nd > 1 ? `${dr}/hr each` : `${dr}/hr`}):</span>
                      <span className="font-mono">${per5PointDev.toFixed(2)}</span>
                    </div>
                  )}
                  {npm > 0 && (
                    <div className="flex justify-between">
                      <span>PM cost ({npm} × {pmr}/hr):</span>
                      <span className="font-mono">${per5PointPM.toFixed(2)}</span>
                    </div>
                  )}
                  {nqa > 0 && (
                    <div className="flex justify-between">
                      <span>QA cost ({nqa} × {qar}/hr):</span>
                      <span className="font-mono">${per5PointQA.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold text-foreground pt-1 border-t border-border mt-1">
                    <span>Total (5-point story):</span>
                    <span className="font-mono">${per5PointTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground pt-1">
                    <span>Tokens per 5-point story:</span>
                    <span className="font-mono">{Math.round(per5PointTokens).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Team size:</span>
                    <span className="font-mono">{nd + npm + nqa} people</span>
                  </div>
                </>
              );
            })()}
          </div>
        </div>

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

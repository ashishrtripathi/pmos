"use client";

import { useState, useTransition, useEffect } from "react";
import { Settings, Folder, Globe, Check } from "lucide-react";

export default function SetupPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const [source, setSource] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState("local");
  const [localPath, setLocalPath] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, startSave] = useTransition();

  useEffect(() => {
    fetch(`/api/projects/${slug}/source`)
      .then((r) => r.json())
      .then((data) => {
        if (data && !data.error) {
          setSource(data);
          setMode(data.mode || "local");
          setLocalPath(data.localPath || "");
          setRepoUrl(data.repoUrl || "");
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
        <h1 className="text-2xl font-bold">Setup — Source Location</h1>
      </div>

      <p className="text-muted-foreground mb-6">
        Tell PMOS where your code lives. PMOS never clones — it reads from wherever you point it.
      </p>

      {/* Mode Selector */}
      <div className="mb-6">
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

      {/* Local Path */}
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

      {/* Repo URL */}
      <div className="mb-6">
        <label className="text-sm font-medium mb-2 block">GitHub Repository URL (optional)</label>
        <input
          type="text"
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
          placeholder="https://github.com/user/repo"
          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Save */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Configuration"}
        </button>
        {saved && (
          <span className="flex items-center gap-1 text-sm text-green-600">
            <Check className="w-4 h-4" /> Saved
          </span>
        )}
      </div>

      {/* Current Status */}
      {source && (
        <div className="mt-8 p-4 rounded-xl border border-border bg-muted/50">
          <h3 className="text-sm font-semibold mb-2">Current Configuration</h3>
          <pre className="text-xs text-muted-foreground font-mono whitespace-pre-wrap">
            {JSON.stringify(source, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

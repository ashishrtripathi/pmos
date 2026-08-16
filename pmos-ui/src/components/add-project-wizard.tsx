"use client";

import { useState, useEffect, useCallback } from "react";
import {
  X,
  FolderGit2,
  Globe,
  HardDrive,
  Search,
  ChevronRight,
  ChevronLeft,
  Check,
  Loader2,
  AlertCircle,
  Plus,
} from "lucide-react";
import { GitHubRepo, GitHubSearch, FileSystemBrowser } from "./project-source-browser";

// ── Types ──────────────────────────────────────────

type SourceMode = "local" | "github" | "github-only";

// ── Step Indicator ──────────────────────────────────

function StepIndicator({ step, total, labels }: { step: number; total: number; labels: string[] }) {
  return (
    <div className="flex items-center gap-2 mb-6">
      {labels.map((label, i) => (
        <div key={i} className="flex items-center gap-2">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
              i + 1 < step
                ? "bg-green-500 text-white"
                : i + 1 === step
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
            }`}
          >
            {i + 1 < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
          </div>
          <span className={`text-xs font-medium hidden sm:inline ${i + 1 === step ? "text-foreground" : "text-muted-foreground"}`}>
            {label}
          </span>
          {i < labels.length - 1 && <ChevronRight className="w-3 h-3 text-muted-foreground hidden sm:block" />}
        </div>
      ))}
    </div>
  );
}

// ── Main Wizard ─────────────────────────────────────

export function AddProjectWizard({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (slug: string) => void;
}) {
  const [step, setStep] = useState(1);
  const [mode, setMode] = useState<SourceMode>("local");
  const [projectName, setProjectName] = useState("");
  const [localPath, setLocalPath] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [repoInfo, setRepoInfo] = useState<GitHubRepo | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  // Handle GitHub repo selection
  const handleRepoSelect = (repo: GitHubRepo) => {
    setRepoInfo(repo);
    setRepoUrl(repo.cloneUrl);
    if (!projectName) setProjectName(repo.name);
    setStep(3); // Go to confirm
  };

  // Handle local path selection
  const handlePathSelect = (path: string) => {
    setLocalPath(path);
    if (!projectName) {
      const folderName = path.split(/[\\/]/).pop() || "";
      setProjectName(folderName);
    }
    setStep(3); // Go to confirm
  };

  // Handle URL paste for GitHub
  const handleUrlPaste = (url: string) => {
    setRepoUrl(url);
    // Extract owner/repo from URL
    const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (match) {
      if (!projectName) setProjectName(match[2]);
    }
    setStep(3);
  };

  // Create project
  const handleCreate = async () => {
    if (!projectName.trim()) return;
    setCreating(true);
    setError("");
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: projectName.trim(),
          localPath: localPath || undefined,
          repoUrl: repoUrl || undefined,
          source: mode,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create project");
        return;
      }
      onCreated(data.slug);
    } catch (err: any) {
      setError(err.message || "Network error");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-xl max-h-[90vh] overflow-y-auto bg-card border border-border rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-lg font-bold">Add Project</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5">
          {/* Step indicator */}
          <StepIndicator
            step={step}
            total={3}
            labels={["Source", "Configure", "Confirm"]}
          />

          {/* Step 1: Choose Source Type */}
          {step === 1 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground mb-4">How is your project&apos;s source code located?</p>
              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={() => { setMode("local"); setStep(2); }}
                  className="p-4 rounded-xl border border-border hover:border-primary/40 hover:bg-muted/50 transition-all text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                      <HardDrive className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">Local Directory</h3>
                      <p className="text-xs text-muted-foreground">Code lives on this machine</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
                  </div>
                </button>

                <button
                  onClick={() => { setMode("github"); setStep(2); }}
                  className="p-4 rounded-xl border border-border hover:border-primary/40 hover:bg-muted/50 transition-all text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                      <FolderGit2 className="w-5 h-5 text-purple-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">GitHub + Local</h3>
                      <p className="text-xs text-muted-foreground">Code on GitHub with a local clone</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
                  </div>
                </button>

                <button
                  onClick={() => { setMode("github-only"); setStep(2); }}
                  className="p-4 rounded-xl border border-border hover:border-primary/40 hover:bg-muted/50 transition-all text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                      <Globe className="w-5 h-5 text-green-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">GitHub Only</h3>
                      <p className="text-xs text-muted-foreground">No local clone — read from GitHub API</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Configure */}
          {step === 2 && (
            <div className="space-y-4">
              <button onClick={() => setStep(1)} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                <ChevronLeft className="w-3 h-3" /> Change source type
              </button>

              {/* Local path / GitHub + Local */}
              {(mode === "local" || mode === "github") && (
                <div>
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-blue-500" />
                    {mode === "github" ? "Local Clone Path" : "Project Directory"}
                  </h3>
                  <FileSystemBrowser
                    onSelect={handlePathSelect}
                    initialPath={localPath}
                  />
                </div>
              )}

              {/* GitHub Only or GitHub URL input */}
              {mode === "github-only" && (
                <div>
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-green-500" />
                    GitHub Repository
                  </h3>
                  <div className="space-y-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="text"
                        value={repoUrl}
                        onChange={(e) => setRepoUrl(e.target.value)}
                        onBlur={() => repoUrl && handleUrlPaste(repoUrl)}
                        onKeyDown={(e) => e.key === "Enter" && repoUrl && handleUrlPaste(repoUrl)}
                        placeholder="https://github.com/owner/repo"
                        className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-border bg-background text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                        autoFocus
                      />
                    </div>
                    <div className="text-center text-xs text-muted-foreground">
                      — or search —
                    </div>
                    <GitHubSearch onSelect={handleRepoSelect} />
                  </div>
                </div>
              )}

              {/* GitHub + Local: also show GitHub search for the URL */}
              {mode === "github" && (
                <div className="pt-2 border-t border-border">
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-green-500" />
                    GitHub Repository URL (optional)
                  </h3>
                  <input
                    type="text"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    placeholder="https://github.com/owner/repo"
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">Link the GitHub repo for remote access and tracking</p>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Confirm */}
          {step === 3 && (
            <div className="space-y-4">
              <button onClick={() => setStep(2)} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                <ChevronLeft className="w-3 h-3" /> Go back
              </button>

              <div>
                <label className="text-sm font-medium mb-1 block">Project Name</label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="my-project"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  autoFocus
                />
              </div>

              {/* Summary */}
              <div className="p-4 rounded-xl bg-muted/30 border border-border space-y-2">
                <h4 className="text-xs font-medium text-muted-foreground uppercase">Configuration Summary</h4>
                <div className="space-y-1.5 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground w-16">Source:</span>
                    <span className="font-medium capitalize flex items-center gap-1">
                      {mode === "local" && <HardDrive className="w-3 h-3" />}
                      {mode === "github" && <FolderGit2 className="w-3 h-3" />}
                      {mode === "github-only" && <Globe className="w-3 h-3" />}
                      {mode === "github" ? "GitHub + Local" : mode === "github-only" ? "GitHub Only" : "Local"}
                    </span>
                  </div>
                  {localPath && (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground w-16">Path:</span>
                      <span className="font-mono text-xs truncate">{localPath}</span>
                    </div>
                  )}
                  {repoUrl && (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground w-16">GitHub:</span>
                      <a href={repoUrl} target="_blank" rel="noopener noreferrer" className="font-mono text-xs text-primary hover:underline truncate">
                        {repoUrl}
                      </a>
                    </div>
                  )}
                  {repoInfo && (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground w-16">Repo:</span>
                      <span className="text-xs">{repoInfo.fullName} · {repoInfo.language} · ★ {repoInfo.stars}</span>
                    </div>
                  )}
                </div>
              </div>

              {error && (
                <div className="p-2 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <button
                onClick={handleCreate}
                disabled={!projectName.trim() || creating}
                className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {creating ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</>
                ) : (
                  <><Plus className="w-4 h-4" /> Create Project</>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

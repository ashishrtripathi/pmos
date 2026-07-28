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
  ArrowUp,
  FolderOpen,
  Check,
  Loader2,
  Star,
  GitFork,
  ExternalLink,
  Package,
  AlertCircle,
  Plus,
  FileCode,
  CheckCircle2,
} from "lucide-react";

// ── Types ──────────────────────────────────────────

type SourceMode = "local" | "github" | "github-only";

interface GitHubRepo {
  name: string;
  fullName: string;
  description: string;
  htmlUrl: string;
  cloneUrl: string;
  language: string;
  stars: number;
  updatedAt: string;
  topics: string[];
  defaultBranch: string;
  hasPackageJson: boolean;
  hasReadme: boolean;
  rootFiles: string[];
  readme: string;
}

interface FSDirEntry {
  name: string;
  path: string;
  hasPackageJson: boolean;
  hasGit: boolean;
}

interface BrowseResult {
  currentPath: string;
  parentPath: string | null;
  directories: FSDirEntry[];
}

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

// ── GitHub Repo Search ──────────────────────────────

function GitHubSearch({
  onSelect,
}: {
  onSelect: (repo: GitHubRepo) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ name: string; fullName: string; description: string; htmlUrl: string; language: string; stars: number; updatedAt: string; topics: string[] }[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<GitHubRepo | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const search = useCallback(async () => {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`/api/github/repos?q=${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      setResults(data.items || []);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, [query]);

  const loadDetail = async (fullName: string) => {
    const [owner, repo] = fullName.split("/");
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/github/repos?owner=${owner}&repo=${repo}`);
      const data = await res.json();
      if (data.name) {
        setSelected(data);
      }
    } catch {
      // error
    } finally {
      setLoadingDetail(false);
    }
  };

  // If we have a selected repo, show its details
  if (selected) {
    return (
      <div className="space-y-3">
        <button onClick={() => setSelected(null)} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
          <ChevronLeft className="w-3 h-3" /> Back to search
        </button>
        <div className="p-4 rounded-xl border border-green-200 bg-green-50/50">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-green-800">{selected.fullName}</h3>
              <p className="text-sm text-green-700 mt-0.5">{selected.description || "No description"}</p>
            </div>
            <a href={selected.htmlUrl} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-800">
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
          <div className="flex flex-wrap gap-2 mt-3 text-xs text-green-600">
            {selected.language && (
              <span className="flex items-center gap-1 bg-green-100 px-2 py-0.5 rounded-full">
                <FileCode className="w-3 h-3" /> {selected.language}
              </span>
            )}
            <span className="flex items-center gap-1 bg-green-100 px-2 py-0.5 rounded-full">
              <Star className="w-3 h-3" /> {selected.stars}
            </span>
            <span className="flex items-center gap-1 bg-green-100 px-2 py-0.5 rounded-full">
              <GitFork className="w-3 h-3" /> {selected.forks}
            </span>
            {selected.hasPackageJson && (
              <span className="flex items-center gap-1 bg-green-100 px-2 py-0.5 rounded-full">
                <Package className="w-3 h-3" /> package.json
              </span>
            )}
          </div>
          {selected.topics && selected.topics.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {selected.topics.map((t) => (
                <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-green-100 text-green-700">{t}</span>
              ))}
            </div>
          )}
          {/* Root files */}
          <div className="mt-3">
            <span className="text-[10px] font-medium text-green-700 uppercase">Root Files</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {selected.rootFiles.slice(0, 20).map((f) => (
                <span key={f} className="text-[10px] px-1.5 py-0.5 rounded bg-white border border-green-200 text-green-800 font-mono">{f}</span>
              ))}
              {selected.rootFiles.length > 20 && (
                <span className="text-[10px] text-green-600">+{selected.rootFiles.length - 20} more</span>
              )}
            </div>
          </div>
          {/* README preview */}
          {selected.readme && (
            <div className="mt-3 max-h-[120px] overflow-y-auto text-xs text-green-700 bg-white/60 rounded p-2 border border-green-200 font-mono whitespace-pre-wrap">
              {selected.readme.substring(0, 1500)}
            </div>
          )}
        </div>
        <button
          onClick={() => onSelect(selected)}
          className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Use This Repository
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && search()}
          placeholder="Search GitHub repositories... (e.g., 'react dashboard')"
          className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          autoFocus
        />
        {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />}
      </div>
      <p className="text-[10px] text-muted-foreground">
        Or paste a direct URL: <span className="font-mono">https://github.com/owner/repo</span>
      </p>
      {results.length > 0 && (
        <div className="max-h-[300px] overflow-y-auto space-y-1.5">
          {results.map((repo) => (
            <button
              key={repo.fullName}
              onClick={() => loadDetail(repo.fullName)}
              className="w-full text-left p-3 rounded-lg border border-border hover:border-primary/40 hover:bg-muted/50 transition-all"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium">{repo.fullName}</span>
                  {repo.language && (
                    <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{repo.language}</span>
                  )}
                </div>
                <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                  <Star className="w-2.5 h-2.5" /> {repo.stars}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{repo.description || "No description"}</p>
            </button>
          ))}
        </div>
      )}
      {query && !searching && results.length === 0 && (
        <div className="text-center py-8 text-sm text-muted-foreground">
          No repositories found. Try a different search.
        </div>
      )}
    </div>
  );
}

// ── File System Browser ─────────────────────────────

function FileSystemBrowser({
  onSelect,
  initialPath,
}: {
  onSelect: (path: string) => void;
  initialPath?: string;
}) {
  const [currentPath, setCurrentPath] = useState(initialPath || "");
  const [parentPath, setParentPath] = useState<string | null>(null);
  const [directories, setDirectories] = useState<FSDirEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [manualPath, setManualPath] = useState(initialPath || "");

  const browse = useCallback(async (dirPath: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/fs/browse?path=${encodeURIComponent(dirPath)}`);
      const data: BrowseResult = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setCurrentPath(data.currentPath);
        setParentPath(data.parentPath);
        setDirectories(data.directories);
        setManualPath(data.currentPath);
      }
    } catch (err: any) {
      setError(err.message || "Failed to browse");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    browse(initialPath || "");
  }, []);

  const goUp = () => {
    if (parentPath) browse(parentPath);
  };

  const navigateTo = (dirPath: string) => {
    browse(dirPath);
  };

  return (
    <div className="space-y-3">
      {/* Manual path input */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <FolderOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={manualPath}
            onChange={(e) => setManualPath(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && browse(manualPath)}
            placeholder="C:\Users\you\projects"
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <button
          onClick={() => browse(manualPath)}
          className="px-3 py-2 rounded-lg border border-border text-sm hover:bg-muted transition-colors"
        >
          Go
        </button>
      </div>

      {/* Current path breadcrumb */}
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        {currentPath.split(/[\\/]/).filter(Boolean).map((part, i, arr) => (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="w-2.5 h-2.5" />}
            <button
              onClick={() => {
                const fullPath = arr.slice(0, i + 1).join("\\");
                // On Windows paths, re-add drive letter separator
                const rebuildPath = i === 0 ? fullPath : arr.slice(0, i + 1).join("\\");
                navigateTo(rebuildPath);
              }}
              className="hover:text-foreground transition-colors"
            >
              {part}
            </button>
          </span>
        ))}
      </div>

      {/* Go up button */}
      {parentPath && (
        <button
          onClick={goUp}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowUp className="w-3 h-3" />
          Up one level
        </button>
      )}

      {/* Directory listing */}
      {error ? (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      ) : loading ? (
        <div className="text-center py-8 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin mx-auto mb-2" />
          Loading...
        </div>
      ) : (
        <>
          {/* Select current directory button */}
          {currentPath && (
            <button
              onClick={() => onSelect(currentPath)}
              className="w-full p-2.5 rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 text-sm font-medium text-primary hover:bg-primary/10 transition-colors flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              Select this folder
            </button>
          )}

          <div className="max-h-[280px] overflow-y-auto space-y-0.5 border border-border rounded-lg">
            {directories.length === 0 ? (
              <div className="text-center py-6 text-sm text-muted-foreground">No subdirectories</div>
            ) : (
              directories.map((dir) => (
                <button
                  key={dir.path}
                  onClick={() => navigateTo(dir.path)}
                  className="w-full text-left px-3 py-2 hover:bg-muted/50 transition-colors flex items-center gap-2 border-b border-border/50 last:border-b-0"
                >
                  <FolderOpen className="w-4 h-4 text-amber-500 shrink-0" />
                  <span className="text-sm flex-1 truncate">{dir.name}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {dir.hasGit && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-200 font-medium">
                        Git
                      </span>
                    )}
                    {dir.hasPackageJson && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-green-50 text-green-600 border border-green-200 font-medium">
                        npm
                      </span>
                    )}
                    <ChevronRight className="w-3 h-3 text-muted-foreground" />
                  </div>
                </button>
              ))
            )}
          </div>
        </>
      )}
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
              <p className="text-sm text-muted-foreground mb-4">How is your project's source code located?</p>
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

"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ChevronLeft,
  Search,
  Loader2,
  ExternalLink,
  Star,
  GitFork,
  Package,
  FileCode,
  FolderOpen,
  Folder,
  ChevronRight,
  ArrowUp,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

// ── Types ──────────────────────────────────────────

export interface GitHubRepo {
  name: string;
  fullName: string;
  description: string;
  htmlUrl: string;
  cloneUrl: string;
  language: string;
  stars: number;
  forks: number;
  updatedAt: string;
  topics: string[];
  defaultBranch: string;
  hasPackageJson: boolean;
  hasReadme: boolean;
  rootFiles: string[];
  readme: string;
}

export interface FSDirEntry {
  name: string;
  path: string;
  hasPackageJson: boolean;
  hasGit: boolean;
}

interface BrowseResult {
  currentPath: string;
  parentPath: string | null;
  directories: FSDirEntry[];
  error?: string;
}

// ── GitHub Repo Search ──────────────────────────────

export function GitHubSearch({
  onSelect,
}: {
  onSelect: (repo: GitHubRepo) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ name: string; fullName: string; description: string; htmlUrl: string; cloneUrl: string; language: string; stars: number; updatedAt: string; topics: string[] }[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<GitHubRepo | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const loadInitialRepos = useCallback(async () => {
    setSearching(true);
    try {
      const res = await fetch("/api/github/repos");
      const data = await res.json();
      if (Array.isArray(data.items) && data.items.length > 0) {
        setResults(data.items);
      }
    } catch {
      // ignore
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    loadInitialRepos();
  }, [loadInitialRepos]);

  const search = useCallback(async (searchQuery?: string) => {
    const q = searchQuery !== undefined ? searchQuery : query;
    if (!q.trim()) {
      loadInitialRepos();
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/github/repos?q=${encodeURIComponent(q.trim())}`);
      const data = await res.json();
      setResults(data.items || []);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, [query, loadInitialRepos]);

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
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && search()}
            placeholder="Search GitHub repositories..."
            className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />}
        </div>
        <button
          type="button"
          onClick={() => search()}
          className="px-3.5 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
        >
          Search
        </button>
        <a
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors flex items-center gap-1 text-muted-foreground hover:text-foreground"
          title="Open GitHub in browser"
        >
          <ExternalLink className="w-4 h-4" />
          GitHub
        </a>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{query ? "Search Results" : "Available Repositories"}</span>
        <span>{results.length} found</span>
      </div>

      {results.length > 0 && (
        <div className="max-h-[260px] overflow-y-auto space-y-1.5 pr-1">
          {results.map((repo) => (
            <button
              key={repo.fullName}
              type="button"
              onClick={() => {
                loadDetail(repo.fullName);
              }}
              className="w-full text-left p-3 rounded-lg border border-border hover:border-primary/40 hover:bg-muted/50 transition-all flex flex-col gap-0.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">{repo.fullName}</span>
                <div className="flex items-center gap-2">
                  {repo.language && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium">{repo.language}</span>
                  )}
                  {repo.stars > 0 && (
                    <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                      <Star className="w-2.5 h-2.5" /> {repo.stars}
                    </span>
                  )}
                </div>
              </div>
              {repo.description && (
                <p className="text-xs text-muted-foreground line-clamp-1">{repo.description}</p>
              )}
            </button>
          ))}
        </div>
      )}
      {query && !searching && results.length === 0 && (
        <div className="text-center py-6 text-sm text-muted-foreground">
          No repositories found for &ldquo;{query}&rdquo;.
        </div>
      )}
    </div>
  );
}

// ── File System Browser ─────────────────────────────

export function FileSystemBrowser({
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
      if (data.error && (!data.directories || data.directories.length === 0)) {
        setError(data.error);
      } else {
        setCurrentPath(data.currentPath);
        setParentPath(data.parentPath);
        setDirectories(data.directories || []);
        setManualPath(data.currentPath);
        onSelect(data.currentPath);
      }
    } catch (err: any) {
      setError(err.message || "Failed to browse directory");
    } finally {
      setLoading(false);
    }
  }, [onSelect]);

  useEffect(() => {
    browse(initialPath || "");
  }, []);

  const openBrowserDirectoryPicker = async () => {
    try {
      // @ts-ignore
      if (typeof window !== "undefined" && window.showDirectoryPicker) {
        // @ts-ignore
        const dirHandle = await window.showDirectoryPicker();
        if (dirHandle && dirHandle.name) {
          const guessedPath = manualPath
            ? `${manualPath.replace(/[\\/][^\\/]+$/, "")}\\${dirHandle.name}`
            : dirHandle.name;
          setManualPath(guessedPath);
          onSelect(guessedPath);
          browse(guessedPath);
        }
      } else {
        // Fallback to hidden input
        const input = document.createElement("input");
        input.type = "file";
        // @ts-ignore
        input.webkitdirectory = true;
        // @ts-ignore
        input.directory = true;
        input.onchange = (e: any) => {
          const files = e.target.files;
          if (files && files.length > 0) {
            const rel = files[0].webkitRelativePath || "";
            const folder = rel.split("/")[0] || files[0].name;
            if (folder) {
              setManualPath(folder);
              onSelect(folder);
              browse(folder);
            }
          }
        };
        input.click();
      }
    } catch {
      // User cancelled picker
    }
  };

  const goUp = () => {
    if (parentPath) browse(parentPath);
  };

  const navigateTo = (dirPath: string) => {
    browse(dirPath);
  };

  return (
    <div className="space-y-3">
      {/* Primary Browser Folder Picker Action */}
      <div className="p-4 rounded-xl border-2 border-primary/20 bg-primary/5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <FolderOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-semibold text-foreground">Select Project Folder</div>
            <div className="text-xs text-muted-foreground">
              Choose your local codebase folder using the browser folder selector
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={openBrowserDirectoryPicker}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all shadow-sm flex items-center justify-center gap-2"
          >
            <FolderOpen className="w-4 h-4" />
            Browser Picker
          </button>
        </div>
      </div>

      {/* Manual path input & explorer */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <FolderOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={manualPath}
            onChange={(e) => setManualPath(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && browse(manualPath)}
            placeholder="C:\Users\you\projects\my-app"
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <button
          type="button"
          onClick={() => browse(manualPath)}
          className="px-3.5 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
        >
          Go
        </button>
      </div>

      {/* Current path breadcrumb */}
      {currentPath && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground flex-wrap bg-muted/40 p-2 rounded-lg font-mono">
          <span className="text-muted-foreground font-sans text-[11px] mr-1">Current:</span>
          {currentPath.split(/[\\/]/).filter(Boolean).map((part, i, arr) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="w-2.5 h-2.5 text-muted-foreground/60" />}
              <button
                type="button"
                onClick={() => {
                  const fullPath = arr.slice(0, i + 1).join("\\");
                  navigateTo(fullPath);
                }}
                className="hover:text-primary hover:underline transition-colors"
              >
                {part}
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Go up button */}
      {parentPath && (
        <button
          type="button"
          onClick={goUp}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
        >
          <ArrowUp className="w-3.5 h-3.5" />
          Up one directory level
        </button>
      )}

      {/* Directory listing */}
      {error ? (
        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <div className="text-xs">{error}</div>
        </div>
      ) : loading ? (
        <div className="text-center py-6 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin mx-auto mb-2 text-primary" />
          Loading directory...
        </div>
      ) : (
        <div className="space-y-2">
          <div className="max-h-[220px] overflow-y-auto space-y-0.5 border border-border rounded-lg bg-card">
            {directories.length === 0 ? (
              <div className="text-center py-6 text-xs text-muted-foreground">No subdirectories in this folder</div>
            ) : (
              directories.map((dir) => (
                <button
                  key={dir.path}
                  type="button"
                  onClick={() => navigateTo(dir.path)}
                  className="w-full text-left px-3 py-2 hover:bg-muted/60 transition-colors flex items-center gap-2 border-b border-border/50 last:border-b-0"
                >
                  <FolderOpen className="w-4 h-4 text-amber-500 shrink-0" />
                  <span className="text-sm flex-1 truncate font-sans">{dir.name}</span>
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
        </div>
      )}
    </div>
  );
}

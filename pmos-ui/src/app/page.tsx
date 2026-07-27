"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  ArrowRight,
  Activity,
  BookOpen,
  Bot,
  Plus,
  X,
  FolderGit2,
  Globe,
  HardDrive,
  Loader2,
} from "lucide-react";

interface Project {
  slug: string;
  name: string;
  source: string;
  localPath?: string;
  repoUrl?: string;
  status: string;
}

interface Dashboard {
  healthScore: number;
  agentWorkload: { agentId: string; storyCount: number; totalPoints: number }[];
  storyBreakdown: { backlog: number; inProgress: number; review: number; done: number };
}

// ── Add Project Modal ───────────────────────────────

function AddProjectModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (slug: string) => void;
}) {
  const [name, setName] = useState("");
  const [localPath, setLocalPath] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [source, setSource] = useState<"local" | "github" | "github-only">("local");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          localPath: localPath.trim() || undefined,
          repoUrl: repoUrl.trim() || undefined,
          source,
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
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold">Add Project</h2>
          <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-muted">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Project Name */}
          <div>
            <label className="text-sm font-medium mb-1 block">Project Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Awesome Project"
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              autoFocus
            />
          </div>

          {/* Source Type */}
          <div>
            <label className="text-sm font-medium mb-2 block">Source Location</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSource("local")}
                className={`p-3 rounded-lg border text-center text-xs transition-colors ${
                  source === "local"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:bg-muted"
                }`}
              >
                <HardDrive className="w-5 h-5 mx-auto mb-1" />
                Local
              </button>
              <button
                type="button"
                onClick={() => setSource("github")}
                className={`p-3 rounded-lg border text-center text-xs transition-colors ${
                  source === "github"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:bg-muted"
                }`}
              >
                <FolderGit2 className="w-5 h-5 mx-auto mb-1" />
                GitHub + Local
              </button>
              <button
                type="button"
                onClick={() => setSource("github-only")}
                className={`p-3 rounded-lg border text-center text-xs transition-colors ${
                  source === "github-only"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:bg-muted"
                }`}
              >
                <Globe className="w-5 h-5 mx-auto mb-1" />
                GitHub Only
              </button>
            </div>
          </div>

          {/* Local Path */}
          {source !== "github-only" && (
            <div>
              <label className="text-sm font-medium mb-1 block">
                Local Path {source === "local" && <span className="text-red-500">*</span>}
              </label>
              <input
                type="text"
                value={localPath}
                onChange={(e) => setLocalPath(e.target.value)}
                placeholder="C:\Users\you\projects\my-app"
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                Path to the project source code on your machine
              </p>
            </div>
          )}

          {/* GitHub URL */}
          <div>
            <label className="text-sm font-medium mb-1 block">
              GitHub Repository URL {source === "github-only" && <span className="text-red-500">*</span>}
            </label>
            <input
              type="text"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/user/repo"
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="p-2 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
              {error}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:bg-muted"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!name.trim() || loading || (source !== "github-only" && source !== "github" && !localPath.trim()) || (source === "github-only" && !repoUrl.trim())}
            className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center gap-1.5"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            Create Project
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Dashboard Page ──────────────────────────────────

export default function HomePage() {
  const [projects, setProjects] = useState<(Project & { dashboard: Dashboard; storyCount: number })[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadProjects = async () => {
    setLoading(true);
    try {
      // Fetch all projects from registry via a simple fetch
      const res = await fetch("/api/projects/list");
      const data = await res.json();
      setProjects(data.projects || []);
    } catch {
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleCreated = (slug: string) => {
    setShowAdd(false);
    window.location.href = `/projects/${slug}/setup`;
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <LayoutDashboard className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">PMOS</h1>
            <p className="text-sm text-muted-foreground">
              Product Management OS — {projects.length} project{projects.length !== 1 ? "s" : ""} attached
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Project
        </button>
      </div>

      {/* Project Cards */}
      {loading ? (
        <div className="text-center py-20 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
          Loading projects...
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <FolderGit2 className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Add your first project to get started with PMOS
          </p>
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
          >
            <Plus className="w-4 h-4" />
            Add Your First Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <Link
              key={project.slug}
              href={`/projects/${project.slug}`}
              className="group block p-5 rounded-xl border border-border bg-card hover:border-primary/40 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h2 className="text-lg font-semibold group-hover:text-primary transition-colors">
                    {project.name}
                  </h2>
                  <span className="text-xs text-muted-foreground font-mono">
                    {project.source}
                    {project.source === "github" ? " · github.com" : ""}
                    {project.source === "local" ? " · local" : ""}
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors mt-1" />
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 mt-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                    <Activity className="w-3 h-3" />
                    <span className="text-xs">Health</span>
                  </div>
                  <span className="text-lg font-bold">{project.dashboard.healthScore}%</span>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                    <BookOpen className="w-3 h-3" />
                    <span className="text-xs">Stories</span>
                  </div>
                  <span className="text-lg font-bold">{project.storyCount}</span>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                    <Bot className="w-3 h-3" />
                    <span className="text-xs">Agents</span>
                  </div>
                  <span className="text-lg font-bold">{project.dashboard.agentWorkload.length}</span>
                </div>
              </div>

              {/* Status bar */}
              <div className="mt-4 flex gap-1 h-1.5 rounded-full overflow-hidden bg-muted">
                {project.storyCount > 0 && (
                  <>
                    {project.dashboard.storyBreakdown.done > 0 && (
                      <div
                        className="bg-green-500"
                        style={{ width: `${(project.dashboard.storyBreakdown.done / project.storyCount) * 100}%` }}
                      />
                    )}
                    {project.dashboard.storyBreakdown.review > 0 && (
                      <div
                        className="bg-yellow-500"
                        style={{ width: `${(project.dashboard.storyBreakdown.review / project.storyCount) * 100}%` }}
                      />
                    )}
                    {project.dashboard.storyBreakdown.inProgress > 0 && (
                      <div
                        className="bg-blue-500"
                        style={{ width: `${(project.dashboard.storyBreakdown.inProgress / project.storyCount) * 100}%` }}
                      />
                    )}
                    {project.dashboard.storyBreakdown.backlog > 0 && (
                      <div
                        className="bg-gray-400"
                        style={{ width: `${(project.dashboard.storyBreakdown.backlog / project.storyCount) * 100}%` }}
                      />
                    )}
                  </>
                )}
              </div>
            </Link>
          ))}

          {/* Add Project Card */}
          <button
            onClick={() => setShowAdd(true)}
            className="group block p-5 rounded-xl border-2 border-dashed border-border hover:border-primary/40 transition-all flex flex-col items-center justify-center min-h-[200px]"
          >
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3 group-hover:bg-primary/10 transition-colors">
              <Plus className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <span className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">
              Add Project
            </span>
          </button>
        </div>
      )}

      {/* Add Project Modal */}
      {showAdd && (
        <AddProjectModal onClose={() => setShowAdd(false)} onCreated={handleCreated} />
      )}
    </div>
  );
}

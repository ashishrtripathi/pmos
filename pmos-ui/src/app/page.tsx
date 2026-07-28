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
  FolderGit2,
  Loader2,
} from "lucide-react";
import { AddProjectWizard } from "@/components/add-project-wizard";

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

      {/* Add Project Wizard */}
      {showAdd && (
        <AddProjectWizard onClose={() => setShowAdd(false)} onCreated={handleCreated} />
      )}
    </div>
  );
}

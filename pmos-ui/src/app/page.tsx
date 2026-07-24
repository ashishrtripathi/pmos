import { listProjects, getDashboard, getAllStories } from "@/lib/pmos";
import Link from "next/link";
import {
  LayoutDashboard,
  ArrowRight,
  Activity,
  BookOpen,
  Bot,
} from "lucide-react";

export default function HomePage() {
  const projects = listProjects();

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
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

      {/* Project Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((project) => {
          const dashboard = getDashboard(project.slug);
          const stories = getAllStories(project.slug);

          return (
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
                  <span className="text-lg font-bold">{dashboard.healthScore}%</span>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                    <BookOpen className="w-3 h-3" />
                    <span className="text-xs">Stories</span>
                  </div>
                  <span className="text-lg font-bold">{stories.length}</span>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                    <Bot className="w-3 h-3" />
                    <span className="text-xs">Agents</span>
                  </div>
                  <span className="text-lg font-bold">{dashboard.agentWorkload.length}</span>
                </div>
              </div>

              {/* Status bar */}
              <div className="mt-4 flex gap-1 h-1.5 rounded-full overflow-hidden bg-muted">
                {stories.length > 0 && (
                  <>
                    {dashboard.storyBreakdown.done > 0 && (
                      <div
                        className="bg-green-500"
                        style={{ width: `${(dashboard.storyBreakdown.done / stories.length) * 100}%` }}
                      />
                    )}
                    {dashboard.storyBreakdown.review > 0 && (
                      <div
                        className="bg-yellow-500"
                        style={{ width: `${(dashboard.storyBreakdown.review / stories.length) * 100}%` }}
                      />
                    )}
                    {dashboard.storyBreakdown.inProgress > 0 && (
                      <div
                        className="bg-blue-500"
                        style={{ width: `${(dashboard.storyBreakdown.inProgress / stories.length) * 100}%` }}
                      />
                    )}
                    {dashboard.storyBreakdown.backlog > 0 && (
                      <div
                        className="bg-gray-400"
                        style={{ width: `${(dashboard.storyBreakdown.backlog / stories.length) * 100}%` }}
                      />
                    )}
                  </>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

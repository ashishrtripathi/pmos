import { getDashboard, getAllStories, getAllAgents, getPipelineSteps } from "@/lib/pmos";
import Link from "next/link";
import {
  Activity,
  BookOpen,
  Bot,
  Map,
  Columns3,
  Brain,
  Workflow,
  Settings,
  ArrowRight,
  Layers,
} from "lucide-react";

export default async function ProjectDashboard({
  params,
}: {
  params: { slug: string };
}) {
  const { slug } = params;
  const dashboard = getDashboard(slug);
  const stories = getAllStories(slug);
  const agents = getAllAgents(slug);
  const pipeline = getPipelineSteps(slug);
  const completedSteps = pipeline.filter((s) => s.status === "done").length;

  const navCards = [
    { href: "setup", icon: Settings, label: "Setup", desc: "Configure source" },
    { href: "pipeline", icon: Workflow, label: "Pipeline", desc: `${completedSteps}/9 steps done` },
    { href: "journey", icon: Map, label: "Journey", desc: "Customer journey" },
    { href: "story-map", icon: Layers, label: "Story Map", desc: `${stories.length} stories mapped` },
    { href: "kanban", icon: Columns3, label: "Kanban", desc: "Agent board" },
    { href: "intelligence", icon: Brain, label: "Intelligence", desc: "Code analysis" },
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold capitalize mb-1">{slug}</h1>
        <p className="text-muted-foreground">Project Dashboard</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard icon={Activity} label="Health Score" value={`${dashboard.healthScore}%`} />
        <StatCard icon={BookOpen} label="Total Stories" value={stories.length.toString()} />
        <StatCard icon={Bot} label="Active Agents" value={agents.length.toString()} />
        <StatCard icon={Workflow} label="Pipeline" value={`${completedSteps}/9`} />
      </div>

      {/* Story Breakdown */}
      <div className="mb-8 p-5 rounded-xl border border-border bg-card">
        <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
          Story Breakdown
        </h2>
        <div className="flex gap-4">
          <BreakdownItem label="Backlog" count={dashboard.storyBreakdown.backlog} color="bg-gray-400" />
          <BreakdownItem label="In Progress" count={dashboard.storyBreakdown.inProgress} color="bg-blue-500" />
          <BreakdownItem label="Review" count={dashboard.storyBreakdown.review} color="bg-yellow-500" />
          <BreakdownItem label="Done" count={dashboard.storyBreakdown.done} color="bg-green-500" />
        </div>
      </div>

      {/* Navigation Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {navCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.href}
              href={`/projects/${slug}/${card.href}`}
              className="group p-4 rounded-xl border border-border bg-card hover:border-primary/40 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center mb-3">
                  <Icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <h3 className="font-semibold mb-0.5">{card.label}</h3>
              <p className="text-sm text-muted-foreground">{card.desc}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="p-4 rounded-xl border border-border bg-card">
      <div className="flex items-center gap-2 text-muted-foreground mb-2">
        <Icon className="w-4 h-4" />
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}

function BreakdownItem({
  label,
  count,
  color,
}: {
  label: string;
  count: number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-3 h-3 rounded-sm ${color}`} />
      <span className="text-sm">
        {label}: <span className="font-semibold">{count}</span>
      </span>
    </div>
  );
}

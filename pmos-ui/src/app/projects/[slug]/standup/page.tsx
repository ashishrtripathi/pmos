"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ListTodo,
  Loader2,
  Megaphone,
  Mic,
  CalendarClock,
  ShieldAlert,
  GitPullRequest,
  Bug,
} from "lucide-react";
import { getAgentBadge } from "@/lib/agent-badges";

// ── Types (mirror of src/lib/standup.ts) ──────────

interface StandupItem {
  id: string;
  title: string;
  points: number;
  status: string;
}

interface StandupBlocker {
  type: "bug" | "stuck";
  title: string;
  detail: string;
  severity?: string;
}

interface StandupEntry {
  agentId: string;
  agentName: string;
  role: string;
  completed: StandupItem[];
  planned: StandupItem[];
  blockers: StandupBlocker[];
  summary: string;
}

interface StandupReport {
  runAt: string;
  previousRunAt: string | null;
  isFirstStandup: boolean;
  entries: StandupEntry[];
  totals: {
    completed: number;
    planned: number;
    blockers: number;
    openBugs: number;
  };
  unclaimedBacklog: StandupItem[];
}

interface StandupSnapshot {
  lastRunAt: string;
  agents: Record<string, unknown>;
}

interface StandupGetResponse {
  agents: unknown[];
  stories: unknown[];
  bugs: unknown[];
  lastStandup: StandupSnapshot | null;
}

// ── Helpers ────────────────────────────────────────

function formatTime(
  iso: string | null | undefined | { seconds?: number | string; nanoseconds?: number }
): string {
  if (!iso) return "never";
  try {
    let d: Date;
    if (typeof iso === "object" && "seconds" in iso) {
      const ms =
        Number(iso.seconds) * 1000 + Math.floor((iso.nanoseconds ?? 0) / 1e6);
      d = new Date(ms);
    } else {
      d = new Date(iso as string);
    }
    return d.toLocaleString();
  } catch {
    return String(iso);
  }
}

function BlockerIcon({ type }: { type: "bug" | "stuck" }) {
  if (type === "bug") return <Bug className="h-4 w-4 shrink-0" />;
  return <AlertCircle className="h-4 w-4 shrink-0" />;
}

// ── Page ───────────────────────────────────────────

export default function StandupPage({ params }: { params: { slug: string } }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<StandupReport | null>(null);
  const [lastRunAt, setLastRunAt] = useState<string | null>(null);
  const [boardStats, setBoardStats] = useState<{
    stories: number;
    agents: number;
    bugs: number;
  }>({ stories: 0, agents: 0, bugs: 0 });

  const fetchBoard = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${params.slug}/standup`);
      if (!res.ok) throw new Error("Failed to load board state");
      const data: StandupGetResponse = await res.json();
      setBoardStats({
        stories: data.stories.length,
        agents: data.agents.length,
        bugs: data.bugs.length,
      });
      setLastRunAt(data.lastStandup?.lastRunAt ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load board state");
    }
  }, [params.slug]);

  useEffect(() => {
    fetchBoard();
  }, [fetchBoard]);

  const runStandup = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${params.slug}/standup`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Standup failed to run");
      const data = await res.json();
      setReport(data.report as StandupReport);
      setLastRunAt(data.report.runAt as string);
      await fetchBoard();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Standup failed to run");
    } finally {
      setLoading(false);
    }
  }, [params.slug, fetchBoard]);

  const totalBlockers = report?.totals.blockers ?? 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
              <Megaphone className="h-6 w-6 text-indigo-600" />
              Daily Standup
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Each agent reports to the <strong>Product Manager</strong> — what
              they completed since the last standup, what they plan to work on
              next in the kanban, and any blockers.
            </p>
          </div>
          <button
            onClick={runStandup}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
            {loading ? "Standup in progress…" : "Run Standup"}
          </button>
        </header>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Board stats + last run */}
        <section className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard
            label="Stories"
            value={boardStats.stories}
            icon={<ListTodo className="h-5 w-5 text-blue-600" />}
          />
          <StatCard
            label="Agents"
            value={boardStats.agents}
            icon={<Mic className="h-5 w-5 text-indigo-600" />}
          />
          <StatCard
            label="Open Bugs"
            value={boardStats.bugs}
            icon={<Bug className="h-5 w-5 text-red-600" />}
          />
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Last Standup
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-gray-800">
              <CalendarClock className="h-4 w-4 text-gray-400" />
              {formatTime(lastRunAt)}
            </p>
          </div>
        </section>

        {/* PM summary */}
        {report && (
          <section className="mb-8 rounded-xl border border-indigo-200 bg-indigo-50 p-5">
            <h2 className="flex items-center gap-2 text-base font-bold text-indigo-900">
              <GitPullRequest className="h-5 w-5" />
              Product Manager — Standup Summary
            </h2>
            <p className="mt-1 text-sm text-indigo-800/80">
              {report.isFirstStandup
                ? "This is the team's first standup — everything currently in review/done counts as completed."
                : `Since the last standup (${formatTime(report.previousRunAt)}):`}
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              <SummaryPill
                label="Completed"
                value={report.totals.completed}
                tone="green"
              />
              <SummaryPill
                label="Planned"
                value={report.totals.planned}
                tone="blue"
              />
              <SummaryPill
                label="Blockers"
                value={report.totals.blockers}
                tone="red"
              />
              {report.unclaimedBacklog.length > 0 && (
                <SummaryPill
                  label="Unclaimed Backlog"
                  value={report.unclaimedBacklog.length}
                  tone="amber"
                />
              )}
            </div>
            {report.unclaimedBacklog.length > 0 && (
              <p className="mt-3 text-xs text-indigo-700">
                ⚠ {report.unclaimedBacklog.length} backlog story
                {report.unclaimedBacklog.length > 1 ? "s" : ""} not yet picked up
                by any agent:{" "}
                {report.unclaimedBacklog.map((s) => s.id).join(", ")}
              </p>
            )}
          </section>
        )}

        {/* Agent reports */}
        {report ? (
          <div className="space-y-5">
            {report.entries.map((entry) => (
              <AgentCard key={entry.agentId} entry={entry} />
            ))}
            {report.entries.length === 0 && (
              <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
                No agents configured for this project yet.
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
            {loading ? (
              <p className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" /> Gathering agent
                reports…
              </p>
            ) : (
              <p className="text-sm text-gray-500">
                Press <strong>Run Standup</strong> to have each agent report
                their status to the Product Manager.
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-gray-500">
        {icon}
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

function SummaryPill({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "green" | "blue" | "red" | "amber";
}) {
  const tones: Record<string, string> = {
    green: "bg-green-100 text-green-800",
    blue: "bg-blue-100 text-blue-800",
    red: "bg-red-100 text-red-800",
    amber: "bg-amber-100 text-amber-800",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${tones[tone]}`}
    >
      {label}: {value}
    </span>
  );
}

function AgentCard({ entry }: { entry: StandupEntry }) {
  const badge = getAgentBadge(entry.agentId);

  return (
    <article className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* Card header */}
      <header className="flex items-center gap-3 border-b border-gray-100 bg-gray-50/60 px-5 py-4">
        {badge ? (
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${badge.color}`}
          >
            {badge.initial}
          </span>
        ) : (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-300 bg-gray-100 text-xs font-bold text-gray-700">
            {entry.agentName.slice(0, 2).toUpperCase()}
          </span>
        )}
        <div className="min-w-0">
          <h3 className="truncate text-base font-bold text-gray-900">
            {entry.agentName}
            <span className="ml-2 text-xs font-medium uppercase tracking-wide text-gray-400">
              {entry.role}
            </span>
          </h3>
          <p className="mt-0.5 line-clamp-2 text-xs italic leading-relaxed text-gray-600">
            {entry.summary}
          </p>
        </div>
        {entry.blockers.length > 0 && (
          <span className="ml-auto flex shrink-0 items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">
            <ShieldAlert className="h-3.5 w-3.5" />
            {entry.blockers.length}
          </span>
        )}
      </header>

      {/* Body: Completed / Planned / Blockers */}
      <div className="grid gap-px bg-gray-100 sm:grid-cols-3">
        <ReportColumn
          title="Completed since last standup"
          tone="green"
          icon={<CheckCircle2 className="h-4 w-4 text-green-600" />}
          emptyText="Nothing completed yet"
        >
          {entry.completed.map((item) => (
            <ItemRow key={item.id} item={item} />
          ))}
        </ReportColumn>

        <ReportColumn
          title="Planned (kanban next)"
          tone="blue"
          icon={<ListTodo className="h-4 w-4 text-blue-600" />}
          emptyText="Nothing planned"
        >
          {entry.planned.map((item) => (
            <ItemRow key={item.id} item={item} />
          ))}
        </ReportColumn>

        <ReportColumn
          title="Blockers"
          tone="red"
          icon={<AlertCircle className="h-4 w-4 text-red-600" />}
          emptyText="No blockers"
        >
          {entry.blockers.map((blocker, i) => (
            <div
              key={`${blocker.type}-${i}`}
              className={`flex items-start gap-2 rounded-lg p-2 text-xs ${
                blocker.type === "bug"
                  ? "bg-red-50 text-red-800"
                  : "bg-amber-50 text-amber-800"
              }`}
            >
              <BlockerIcon type={blocker.type} />
              <div>
                <p className="font-semibold">{blocker.title}</p>
                <p className="mt-0.5 text-[11px] opacity-80">
                  {blocker.detail}
                </p>
              </div>
            </div>
          ))}
        </ReportColumn>
      </div>
    </article>
  );
}

function ReportColumn({
  title,
  tone,
  icon,
  emptyText,
  children,
}: {
  title: string;
  tone: "green" | "blue" | "red";
  icon: React.ReactNode;
  emptyText: string;
  children: React.ReactNode;
}) {
  const tones: Record<string, string> = {
    green: "text-green-800",
    blue: "text-blue-800",
    red: "text-red-800",
  };
  const hasContent = Array.isArray(children) && children.length > 0;

  return (
    <section className="bg-white p-4">
      <h4
        className={`mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide ${tones[tone]}`}
      >
        {icon}
        {title}
      </h4>
      <div className="space-y-1.5">
        {hasContent ? (
          children
        ) : (
          <p className="rounded-lg bg-gray-50 p-2 text-xs text-gray-400">
            {emptyText}
          </p>
        )}
      </div>
    </section>
  );
}

function ItemRow({ item }: { item: StandupItem }) {
  const statusTone: Record<string, string> = {
    review: "bg-purple-100 text-purple-700",
    done: "bg-green-100 text-green-700",
    "in-progress": "bg-blue-100 text-blue-700",
    backlog: "bg-gray-100 text-gray-600",
  };
  return (
    <div className="rounded-lg border border-gray-100 p-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold text-gray-500">{item.id}</span>
        <span
          className={`rounded px-1.5 py-0.5 text-[10px] font-semibold capitalize ${
            statusTone[item.status] ?? "bg-gray-100 text-gray-600"
          }`}
        >
          {item.status}
        </span>
      </div>
      <p className="mt-1 text-xs font-medium leading-snug text-gray-800">
        {item.title}
      </p>
      <p className="mt-0.5 text-[11px] text-gray-400">{item.points} pts</p>
    </div>
  );
}

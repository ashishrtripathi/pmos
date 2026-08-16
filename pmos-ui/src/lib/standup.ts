import type { Agent, Bug, Story, StoryStatus } from "@/types/pmos";
import { readDoc, writeDoc } from "@/lib/postbase";

// ─────────────────────────────────────────────────────────────────────────────
// Standup — each agent reports to the Product Manager: what they completed
// since the last standup, what they plan to work on next in the kanban, and
// what blockers they have.
// ─────────────────────────────────────────────────────────────────────────────

export type StandupItemStatus = StoryStatus;

export interface StandupItem {
  id: string;
  title: string;
  points: number;
  status: StandupItemStatus;
}

export interface StandupBlocker {
  type: "bug" | "stuck";
  title: string;
  detail: string;
  severity?: Bug["severity"];
}

export interface StandupEntry {
  agentId: string;
  agentName: string;
  role: string;
  /** Stories the agent completed since the last standup (now review/done). */
  completed: StandupItem[];
  /** Stories the agent plans to work on next (in-progress + top of backlog). */
  planned: StandupItem[];
  /** Blockers: open bugs on their stories + stories stuck across standups. */
  blockers: StandupBlocker[];
  /** One-line spoken summary addressed to the Product Manager. */
  summary: string;
}

export interface StandupReport {
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
  /** Stories with no agent attached and still in backlog (unclaimed work). */
  unclaimedBacklog: StandupItem[];
}

export interface StandupSnapshotAgentState {
  /** Story ids that were in review/done at snapshot time. */
  completedIds: string[];
  /** Story ids that were in-progress at snapshot time. */
  inProgressIds: string[];
}

export interface StandupSnapshot {
  lastRunAt: string;
  agents: Record<string, StandupSnapshotAgentState>;
}

const STANDUP_TABLE = "standups";

// ── Storage ──────────────────────────────────────────────────────────────────

/** PostBase returns timestamps as {_type:"timestamp", seconds, nanoseconds}. */
export type PostBaseTimestamp =
  | string
  | { _type?: "timestamp"; seconds?: number | string; nanoseconds?: number }
  | null
  | undefined;

export function normalizeTimestamp(
  ts: PostBaseTimestamp
): string | null {
  if (!ts) return null;
  if (typeof ts === "string") return ts;
  if (typeof ts === "object" && "seconds" in ts) {
    const ms = Number(ts.seconds) * 1000 + Math.floor((ts.nanoseconds ?? 0) / 1e6);
    if (!Number.isFinite(ms)) return null;
    return new Date(ms).toISOString();
  }
  return null;
}

export async function getLastStandup(slug: string): Promise<StandupSnapshot | null> {
  const doc = await readDoc<StandupSnapshot>(STANDUP_TABLE, slug);
  if (!doc) return null;
  const lastRunAt = normalizeTimestamp(doc.lastRunAt as PostBaseTimestamp);
  return {
    lastRunAt: lastRunAt ?? doc.lastRunAt,
    agents: doc.agents ?? {},
  };
}

export async function saveStandup(
  slug: string,
  snapshot: StandupSnapshot
): Promise<void> {
  await writeDoc(STANDUP_TABLE, slug, snapshot);
}

// ── Report generation ────────────────────────────────────────────────────────

export interface StandupInput {
  agents: Agent[];
  stories: Story[];
  bugs: Bug[];
  prevSnapshot: StandupSnapshot | null;
  runAt?: string;
}

const OPEN_BUG_STATUSES: Bug["status"][] = ["open", "in-progress", "review"];

function isDoneStatus(status: StoryStatus): boolean {
  return status === "review" || status === "done";
}

function isWipStatus(status: StoryStatus): boolean {
  return status === "in-progress";
}

/** Backlog priority: estimated value desc, then points desc, then id. */
function backlogComparator(a: Story, b: Story): number {
  const av = a.estimatedValue ?? 0;
  const bv = b.estimatedValue ?? 0;
  if (av !== bv) return bv - av;
  const ap = a.points ?? (a.estimatedHours ? Math.round(a.estimatedHours / 0.35) : 0);
  const bp = b.points ?? (b.estimatedHours ? Math.round(b.estimatedHours / 0.35) : 0);
  if (ap !== bp) return bp - ap;
  return a.id.localeCompare(b.id);
}

function storyToItem(s: Story): StandupItem {
  return {
    id: s.id,
    title: s.title,
    points: s.points ?? (s.estimatedHours ? Math.round(s.estimatedHours / 0.35) : 1),
    status: s.status,
  };
}

export function generateStandupReport({
  agents,
  stories,
  bugs,
  prevSnapshot,
  runAt,
}: StandupInput): StandupReport {
  const now = normalizeTimestamp(runAt) ?? new Date().toISOString();
  const isFirstStandup = !prevSnapshot;

  // Map stories to agents: explicit assignedAgent wins, else activeStories list.
  const storiesByAgent = new Map<string, Story[]>();
  for (const agent of agents) {
    const mine = stories.filter(
      (s) =>
        (s.assignedAgent && s.assignedAgent === agent.id) ||
        (!s.assignedAgent && agent.activeStories.includes(s.id))
    );
    storiesByAgent.set(agent.id, mine);
  }

  const openBugs = bugs.filter((b) => OPEN_BUG_STATUSES.includes(b.status));

  const entries: StandupEntry[] = agents.map((agent) => {
    const mine = storiesByAgent.get(agent.id) ?? [];
    const prevState = prevSnapshot?.agents?.[agent.id];

    // ── Completed since last standup ──
    let completed = mine.filter((s) => isDoneStatus(s.status));
    if (prevState) {
      const prevDone = new Set(prevState.completedIds ?? []);
      completed = completed.filter((s) => !prevDone.has(s.id));
    }

    // ── Planned: in-progress + next backlog items ──
    const inProgress = mine
      .filter((s) => isWipStatus(s.status))
      .sort(backlogComparator);
    const backlog = mine
      .filter((s) => s.status === "backlog")
      .sort(backlogComparator)
      .slice(0, 3);
    const planned = [...inProgress, ...backlog];

    // ── Blockers ──
    const mineIds = new Set(mine.map((s) => s.id));
    const bugBlockers: StandupBlocker[] = openBugs
      .filter(
        (b) =>
          (b.storyId && mineIds.has(b.storyId)) ||
          agent.activeStories.includes(b.id)
      )
      .map((b) => ({
        type: "bug" as const,
        title: b.title,
        detail: b.storyId
          ? `Open bug ${b.id} (${b.severity}) attached to ${b.storyId}`
          : `Open bug ${b.id} (${b.severity})`,
        severity: b.severity,
      }));

    // Stuck: still in-progress across at least one standup cycle.
    let stuck: StandupBlocker[] = [];
    if (prevState) {
      const prevWip = new Set(prevState.inProgressIds ?? []);
      stuck = inProgress
        .filter((s) => prevWip.has(s.id))
        .map((s) => ({
          type: "stuck" as const,
          title: s.title,
          detail: `${s.id} has been in progress since the last standup`,
        }));
    }

    const blockers = [...bugBlockers, ...stuck];

    // ── Spoken summary (addressed to the Product Manager) ──
    const completedTitles = completed.map((c) => c.id).join(", ") || "nothing";
    const plannedTitles = planned.map((p) => p.id).join(", ") || "nothing new";
    const blockerNote =
      blockers.length > 0
        ? ` Blockers: ${blockers.map((b) => b.title).join("; ")}.`
        : " No blockers.";
    const summary = `I'm ${agent.name}, ${agent.role}. Since the last standup I completed ${completedTitles}. Next I plan to work on ${plannedTitles}.${blockerNote}`;

    return {
      agentId: agent.id,
      agentName: agent.name,
      role: agent.role,
      completed: completed.map(storyToItem),
      planned: planned.map(storyToItem),
      blockers,
      summary,
    };
  });

  // Stories still in backlog with no agent attached (unclaimed work).
  const claimedIds = new Set(
    stories
      .filter(
        (s) => s.assignedAgent || agents.some((a) => a.activeStories.includes(s.id))
      )
      .map((s) => s.id)
  );
  const unclaimedBacklog = stories
    .filter((s) => s.status === "backlog" && !claimedIds.has(s.id))
    .sort(backlogComparator)
    .map(storyToItem);

  const totals = {
    completed: entries.reduce((n, e) => n + e.completed.length, 0),
    planned: entries.reduce((n, e) => n + e.planned.length, 0),
    blockers: entries.reduce((n, e) => n + e.blockers.length, 0),
    openBugs: openBugs.length,
  };

  return {
    runAt: now,
    previousRunAt: prevSnapshot?.lastRunAt ?? null,
    isFirstStandup,
    entries,
    totals,
    unclaimedBacklog,
  };
}

/** Build a snapshot from the current report — used to diff on the next run. */
export function snapshotFromReport(report: StandupReport): StandupSnapshot {
  const agents: Record<string, StandupSnapshotAgentState> = {};
  for (const entry of report.entries) {
    agents[entry.agentId] = {
      completedIds: entry.completed
        .filter((i) => i.status === "review" || i.status === "done")
        .map((i) => i.id),
      inProgressIds: entry.planned
        .filter((i) => i.status === "in-progress")
        .map((i) => i.id),
    };
  }
  return { lastRunAt: report.runAt, agents };
}

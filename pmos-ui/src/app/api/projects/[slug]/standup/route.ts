import { NextResponse } from "next/server";
import {
  generateStandupReport,
  getLastStandup,
  saveStandup,
  snapshotFromReport,
} from "@/lib/standup";
import { getAllAgents, getAllStories } from "@/lib/pmos";
import { getBugs } from "@/lib/pmos-bugs";

// GET — current board state + last standup snapshot (for initial render).
export async function GET(
  _request: Request,
  { params }: { params: { slug: string } }
) {
  const [agents, stories, bugs, lastStandup] = await Promise.all([
    getAllAgents(params.slug),
    getAllStories(params.slug),
    getBugs(params.slug),
    getLastStandup(params.slug),
  ]);
  return NextResponse.json({ agents, stories, bugs, lastStandup });
}

// POST — run the standup: compute the report, persist a snapshot for the next run.
export async function POST(
  _request: Request,
  { params }: { params: { slug: string } }
) {
  const [agents, stories, bugs, prevSnapshot] = await Promise.all([
    getAllAgents(params.slug),
    getAllStories(params.slug),
    getBugs(params.slug),
    getLastStandup(params.slug),
  ]);

  const report = generateStandupReport({
    agents,
    stories,
    bugs,
    prevSnapshot,
  });

  await saveStandup(params.slug, snapshotFromReport(report));

  return NextResponse.json({ ok: true, report });
}

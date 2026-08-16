import { NextResponse } from "next/server";
import { getAllStories, getAllAgents } from "@/lib/pmos";
import { getBugs } from "@/lib/pmos-bugs";
import {
  getLastStandup,
  saveStandup,
  generateStandupReport,
  snapshotFromReport,
} from "@/lib/standup";

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;
  try {
    const [stories, agents, bugs, lastStandup] = await Promise.all([
      getAllStories(slug),
      getAllAgents(slug),
      getBugs(slug),
      getLastStandup(slug),
    ]);
    return NextResponse.json({
      stories,
      agents,
      bugs,
      lastStandup,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message, stories: [], agents: [], bugs: [], lastStandup: null },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;
  try {
    const [stories, agents, bugs, prevSnapshot] = await Promise.all([
      getAllStories(slug),
      getAllAgents(slug),
      getBugs(slug),
      getLastStandup(slug),
    ]);

    const report = generateStandupReport({
      stories,
      agents,
      bugs,
      prevSnapshot,
    });

    const nextSnapshot = snapshotFromReport(report);
    await saveStandup(slug, nextSnapshot);

    return NextResponse.json({ success: true, report });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

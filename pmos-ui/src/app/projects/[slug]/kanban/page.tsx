import { getAllAgents, getAllStories } from "@/lib/pmos";
import { KanbanBoard } from "./kanban-board";

export default async function KanbanPage({
  params,
}: {
  params: { slug: string };
}) {
  const agents = getAllAgents(params.slug);
  const stories = getAllStories(params.slug);

  // Build initial assignments: map stories to agents based on story's assigned agent
  const assignments: Record<string, typeof stories> = {};
  for (const agent of agents) {
    assignments[agent.id] = stories.filter(
      (s) => agent.activeStories.some((a) => a.includes(s.id))
    );
  }

  // Stories not assigned to any agent go to a "unassigned" bucket
  // but we won't show that — the kanban will have all 7 agents

  return (
    <KanbanBoard
      params={params}
      agents={agents}
      initialAssignments={assignments}
      allStories={stories}
    />
  );
}

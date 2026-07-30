import { getAllStories } from "@/lib/pmos";
import { KanbanBoard } from "./kanban-board";

export default async function KanbanPage({
  params,
}: {
  params: { slug: string };
}) {
  const allStories = getAllStories(params.slug);

  return (
    <KanbanBoard
      params={params}
      allStories={allStories}
    />
  );
}

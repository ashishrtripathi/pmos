import { getAllStories, getRegistry } from "@/lib/pmos";
import { KanbanBoard } from "./kanban-board";

export default async function KanbanPage({
  params,
}: {
  params: { slug: string };
}) {
  const [allStories, registry] = await Promise.all([
    getAllStories(params.slug),
    getRegistry(),
  ]);
  const registryProject = registry?.projects?.find(
    (p) => p.slug === params.slug
  );

  return (
    <KanbanBoard
      params={params}
      allStories={allStories}
      projectVersion={registryProject?.version}
    />
  );
}

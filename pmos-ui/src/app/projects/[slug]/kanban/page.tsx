import { getAllStories, getPersonaJourneys } from "@/lib/pmos";
import { KanbanBoard } from "./kanban-board";

export default async function KanbanPage({
  params,
}: {
  params: { slug: string };
}) {
  const allStories = await getAllStories(params.slug);
  const personas = (await getPersonaJourneys(params.slug)).map(
    (j) => j.personaName
  );

  return (
    <KanbanBoard params={params} allStories={allStories} personas={personas} />
  );
}

import { getAllStories, getPersonaJourneys } from "@/lib/pmos";
import { KanbanBoard } from "./kanban-board";
import { generateProjectStaticParams } from "@/lib/static-params";

export { generateProjectStaticParams as generateStaticParams };
export const dynamic = "force-dynamic";
export const revalidate = 0;

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
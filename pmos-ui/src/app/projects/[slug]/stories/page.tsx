import { getStoriesByStatus, getPersonaJourneys } from "@/lib/pmos";
import { StoriesBoard } from "./stories-board";

export default async function StoriesPage({
  params,
}: {
  params: { slug: string };
}) {
  const storiesByStatus = await getStoriesByStatus(params.slug);
  const personas = (await getPersonaJourneys(params.slug)).map(
    (j) => j.personaName
  );

  return (
    <StoriesBoard
      params={params}
      initialStories={storiesByStatus}
      personas={personas}
    />
  );
}

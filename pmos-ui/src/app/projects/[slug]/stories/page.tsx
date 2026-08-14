import { getStoriesByStatus, getPersonaJourneys } from "@/lib/pmos";
import { StoriesBoard } from "./stories-board";
import { generateProjectStaticParams } from "@/lib/static-params";

export { generateProjectStaticParams as generateStaticParams };
export const dynamic = "force-static";

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
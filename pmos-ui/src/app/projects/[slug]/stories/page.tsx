import { getStoriesByStatus } from "@/lib/pmos";
import { StoriesBoard } from "./stories-board";

export default async function StoriesPage({
  params,
}: {
  params: { slug: string };
}) {
  const storiesByStatus = await getStoriesByStatus(params.slug);
  return <StoriesBoard params={params} initialStories={storiesByStatus} />;
}

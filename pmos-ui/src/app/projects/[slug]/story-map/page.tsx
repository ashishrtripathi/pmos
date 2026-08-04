import { getPersonaJourneys, getAllStories, getStoryMap, getScreenMockup } from "@/lib/pmos";
import { StoryMapBoard } from "./story-map-board";

export default async function StoryMapPage({
  params,
}: {
  params: { slug: string };
}) {
  const journeys = (await getPersonaJourneys(params.slug)).map((j) => ({
    ...j,
    steps: j.steps.map((s) => ({
      ...s,
      mockup: getScreenMockup(s.name),
    })),
  }));
  const stories = await getAllStories(params.slug);
  const storyMap = await getStoryMap(params.slug);

  return (
    <StoryMapBoard
      params={params}
      journeys={journeys}
      allStories={stories}
      storyMap={storyMap}
    />
  );
}

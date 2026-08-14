import { generateProjectStaticParams } from "@/lib/static-params";

export { generateProjectStaticParams as generateStaticParams };
export const dynamic = "force-static";

import { JourneyPageClient } from "./page.client";

export default function JourneyPage(props: { params: { slug: string } }) {
  return <JourneyPageClient {...props} />;
}
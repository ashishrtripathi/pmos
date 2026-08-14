import { generateProjectStaticParams } from "@/lib/static-params";

export { generateProjectStaticParams as generateStaticParams };
export const dynamic = "force-static";

import { PipelinePageClient } from "./page.client";

export default function PipelinePage(props: { params: { slug: string } }) {
  return <PipelinePageClient {...props} />;
}
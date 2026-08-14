import { generateProjectStaticParams } from "@/lib/static-params";

export { generateProjectStaticParams as generateStaticParams };
export const dynamic = "force-static";

import { StandupPageClient } from "./page.client";

export default function StandupPage(props: { params: { slug: string } }) {
  return <StandupPageClient {...props} />;
}
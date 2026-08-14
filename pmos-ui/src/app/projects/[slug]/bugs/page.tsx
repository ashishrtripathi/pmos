import { generateProjectStaticParams } from "@/lib/static-params";

export { generateProjectStaticParams as generateStaticParams };
export const dynamic = "force-static";

import { BugsPageClient } from "./page.client";

export default function BugsPage(props: { params: { slug: string } }) {
  return <BugsPageClient {...props} />;
}
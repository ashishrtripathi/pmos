import { generateProjectStaticParams } from "@/lib/static-params";

export { generateProjectStaticParams as generateStaticParams };
export const dynamic = "force-static";

import { OKRsPageClient } from "./page.client";

export default function OKRsPage(props: { params: { slug: string } }) {
  return <OKRsPageClient {...props} />;
}
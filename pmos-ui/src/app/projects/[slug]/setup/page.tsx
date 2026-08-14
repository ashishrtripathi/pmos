import { generateProjectStaticParams } from "@/lib/static-params";

export { generateProjectStaticParams as generateStaticParams };
export const dynamic = "force-static";

import { SetupPageClient } from "./page.client";

export default function SetupPage(props: { params: { slug: string } }) {
  return <SetupPageClient {...props} />;
}
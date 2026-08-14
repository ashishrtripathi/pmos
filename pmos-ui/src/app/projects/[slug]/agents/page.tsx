import { AgentDispatchPanel } from "@/components/agent-dispatch-panel";
import { generateProjectStaticParams } from "@/lib/static-params";

export { generateProjectStaticParams as generateStaticParams };
export const dynamic = "force-static";

export default function AgentsPage({
  params,
}: {
  params: { slug: string };
}) {
  return <AgentDispatchPanel slug={params.slug} />;
}
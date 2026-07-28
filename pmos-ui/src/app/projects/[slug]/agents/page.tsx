import { AgentDispatchPanel } from "@/components/agent-dispatch-panel";

export default function AgentsPage({
  params,
}: {
  params: { slug: string };
}) {
  return <AgentDispatchPanel slug={params.slug} />;
}

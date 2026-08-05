// Shared agent badge registry — used by Kanban board, Standup, Agents pages.
// Extended with the gstack-inspired agents (security-officer, release-engineer,
// debugger, code-reviewer).

export const AGENT_INITIALS: Record<string, string> = {
  "product-manager": "PM",
  "ux-designer": "UX",
  architect: "AR",
  "software-engineer": "SE",
  "qa-engineer": "QA",
  "documentation-agent": "DO",
  "product-intelligence": "PI",
  "security-officer": "SO",
  "release-engineer": "RE",
  debugger: "DB",
  "code-reviewer": "CR",
};

export const AGENT_COLORS: Record<string, string> = {
  "product-manager": "bg-purple-100 text-purple-700 border-purple-300",
  "ux-designer": "bg-pink-100 text-pink-700 border-pink-300",
  architect: "bg-orange-100 text-orange-700 border-orange-300",
  "software-engineer": "bg-blue-100 text-blue-700 border-blue-300",
  "qa-engineer": "bg-green-100 text-green-700 border-green-300",
  "documentation-agent": "bg-yellow-100 text-yellow-700 border-yellow-300",
  "product-intelligence": "bg-red-100 text-red-700 border-red-300",
  "security-officer": "bg-indigo-100 text-indigo-700 border-indigo-300",
  "release-engineer": "bg-cyan-100 text-cyan-700 border-cyan-300",
  debugger: "bg-amber-100 text-amber-700 border-amber-300",
  "code-reviewer": "bg-emerald-100 text-emerald-700 border-emerald-300",
};

export function getAgentBadge(agentId?: string) {
  if (!agentId || !AGENT_INITIALS[agentId]) return null;
  const initial = AGENT_INITIALS[agentId];
  const color =
    AGENT_COLORS[agentId] || "bg-gray-100 text-gray-700 border-gray-300";
  return { initial, color };
}

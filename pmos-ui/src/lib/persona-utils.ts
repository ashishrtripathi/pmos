// Generic persona utilities - work for arbitrary personas in any project.
// No hardcoded persona names/ids anywhere in here.

const PERSONA_BADGES = [
  { badge: "bg-purple-100 text-purple-700 border-purple-300", dot: "#a855f7" },
  { badge: "bg-blue-100 text-blue-700 border-blue-300", dot: "#3b82f6" },
  { badge: "bg-emerald-100 text-emerald-700 border-emerald-300", dot: "#10b981" },
  { badge: "bg-amber-100 text-amber-700 border-amber-300", dot: "#f59e0b" },
  { badge: "bg-rose-100 text-rose-700 border-rose-300", dot: "#f43f5e" },
  { badge: "bg-cyan-100 text-cyan-700 border-cyan-300", dot: "#06b6d4" },
  { badge: "bg-indigo-100 text-indigo-700 border-indigo-300", dot: "#6366f1" },
  { badge: "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-300", dot: "#d946ef" },
  { badge: "bg-slate-100 text-slate-600 border-slate-300", dot: "#64748b" },
];

const PERSONA_GRADIENTS = [
  "from-pink-500 to-rose-500",
  "from-blue-500 to-indigo-500",
  "from-green-500 to-emerald-500",
  "from-violet-500 to-purple-500",
  "from-amber-500 to-orange-500",
  "from-cyan-500 to-teal-500",
  "from-fuchsia-500 to-pink-500",
  "from-slate-500 to-slate-700",
];

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

/**
 * Stable badge/dot colors for any persona id (name or role string).
 * Same persona always gets the same color.
 */
export function personaColor(
  id: string
): { badge: string; dot: string } {
  return PERSONA_BADGES[hashString(id) % PERSONA_BADGES.length];
}

/** Stable gradient classes for any persona id (journey card headers). */
export function personaGradient(id: string): string {
  return PERSONA_GRADIENTS[hashString(id) % PERSONA_GRADIENTS.length];
}

/**
 * Derive initials from a persona's role (or name).
 * "Full-Stack Developer / Technical Lead" -> "FD"
 * "Senior Product Manager" -> "SP"
 */
export function personaInitials(p: {
  role?: string;
  personaName?: string;
}): string {
  const source = p.role || p.personaName || "";
  const words = source.split(/[\s\/()]+/).filter((w) => /^[A-Za-z]/.test(w));
  if (words.length === 0) return "?";
  return words
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join("");
}

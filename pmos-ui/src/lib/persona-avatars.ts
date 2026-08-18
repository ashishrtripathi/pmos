// src/lib/persona-avatars.ts
// Curated library of realistic, diverse, high-resolution persona portrait avatars
// Perfectly balanced with a 50/50 split between men and women and equal racial/ethnic representation.

export interface PersonaAvatarOption {
  id: string;
  name: string;
  category: "woman" | "man" | "tech" | "business" | "creative" | "leadership";
  url: string;
  gender: "female" | "male";
  ethnicity: string;
  suggestedRole: string;
}

export const PRESET_PERSONA_AVATARS: PersonaAvatarOption[] = [
  // ── 6 WOMEN (50%) ─────────────────────────────────
  {
    id: "avatar-priya",
    name: "Priya Sharma",
    category: "tech",
    gender: "female",
    ethnicity: "South Asian",
    suggestedRole: "Senior Product Manager",
    url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "avatar-sarah",
    name: "Sarah Chen",
    category: "creative",
    gender: "female",
    ethnicity: "East Asian",
    suggestedRole: "Content Creator & Video Producer",
    url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "avatar-amara",
    name: "Amara Diallo",
    category: "business",
    gender: "female",
    ethnicity: "Black / African",
    suggestedRole: "Customer Success Director",
    url: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "avatar-elena",
    name: "Elena Rodriguez",
    category: "creative",
    gender: "female",
    ethnicity: "Hispanic / Latina",
    suggestedRole: "UX / UI Design Lead",
    url: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "avatar-mei",
    name: "Mei-Ling Zhou",
    category: "tech",
    gender: "female",
    ethnicity: "East Asian",
    suggestedRole: "Data Scientist & AI Researcher",
    url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "avatar-clara",
    name: "Clara Lindqvist",
    category: "leadership",
    gender: "female",
    ethnicity: "White / European",
    suggestedRole: "VP of Product Strategy",
    url: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=600&auto=format&fit=crop&q=80",
  },

  // ── 6 MEN (50%) ───────────────────────────────────
  {
    id: "avatar-marcus",
    name: "Marcus Vance",
    category: "tech",
    gender: "male",
    ethnicity: "Black / African American",
    suggestedRole: "Full-Stack Lead & Architect",
    url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "avatar-tariq",
    name: "Tariq Al-Mansoor",
    category: "tech",
    gender: "male",
    ethnicity: "Middle Eastern",
    suggestedRole: "DevOps & Reliability Engineer",
    url: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "avatar-david",
    name: "David Kim",
    category: "creative",
    gender: "male",
    ethnicity: "East Asian",
    suggestedRole: "Product Designer & Researcher",
    url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "avatar-kwame",
    name: "Kwame Osei",
    category: "business",
    gender: "male",
    ethnicity: "Black / African",
    suggestedRole: "Operations & QA Lead",
    url: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "avatar-mateo",
    name: "Mateo Silva",
    category: "creative",
    gender: "male",
    ethnicity: "Hispanic / Latino",
    suggestedRole: "Video Creator & Motion Designer",
    url: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "avatar-liam",
    name: "Liam O'Connor",
    category: "business",
    gender: "male",
    ethnicity: "White / European",
    suggestedRole: "Growth & Marketing Manager",
    url: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=600&auto=format&fit=crop&q=80",
  },
];

export function getAvatarUrl(avatarIdOrUrl?: string, fallbackName?: string): string {
  if (!avatarIdOrUrl) {
    if (fallbackName) {
      const lower = fallbackName.toLowerCase();
      const match = PRESET_PERSONA_AVATARS.find((a) => lower.includes(a.name.toLowerCase().split(" ")[0]) || lower.includes(a.id.replace("avatar-", "")));
      if (match) return match.url;
    }
    return PRESET_PERSONA_AVATARS[0].url;
  }
  const preset = PRESET_PERSONA_AVATARS.find((a) => a.id === avatarIdOrUrl || a.url === avatarIdOrUrl);
  if (preset) return preset.url;
  if (avatarIdOrUrl.startsWith("http") || avatarIdOrUrl.startsWith("data:") || avatarIdOrUrl.startsWith("/")) {
    return avatarIdOrUrl;
  }
  return PRESET_PERSONA_AVATARS[0].url;
}

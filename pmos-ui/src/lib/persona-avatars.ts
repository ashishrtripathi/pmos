// src/lib/persona-avatars.ts
// Curated library of realistic, diverse, high-resolution persona portrait avatars.

export interface PersonaAvatarOption {
  id: string;
  name: string;
  category: "man" | "woman" | "tech" | "business" | "creative" | "student";
  url: string;
  gender: string;
  suggestedRole: string;
}

export const PRESET_PERSONA_AVATARS: PersonaAvatarOption[] = [
  {
    id: "avatar-henry",
    name: "Henry",
    category: "business",
    gender: "male",
    suggestedRole: "Purchasing Department Manager",
    url: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "avatar-sarah",
    name: "Sarah Chen",
    category: "creative",
    gender: "female",
    suggestedRole: "Content Creator & Video Producer",
    url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "avatar-marcus",
    name: "Marcus Vance",
    category: "business",
    gender: "male",
    suggestedRole: "Enterprise Administrator",
    url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "avatar-elena",
    name: "Elena Rostova",
    category: "tech",
    gender: "female",
    suggestedRole: "Product Manager & Strategist",
    url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "avatar-priya",
    name: "Priya Sharma",
    category: "tech",
    gender: "female",
    suggestedRole: "Senior Software Engineer",
    url: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "avatar-david",
    name: "David Kim",
    category: "creative",
    gender: "male",
    suggestedRole: "UX / UI Designer",
    url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "avatar-maya",
    name: "Maya Patel",
    category: "student",
    gender: "female",
    suggestedRole: "Language Student & Researcher",
    url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "avatar-alex",
    name: "Alex Rivera",
    category: "tech",
    gender: "male",
    suggestedRole: "DevOps & QA Engineer",
    url: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "avatar-clara",
    name: "Clara Johnson",
    category: "business",
    gender: "female",
    suggestedRole: "Customer Success Director",
    url: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "avatar-liam",
    name: "Liam O'Connor",
    category: "creative",
    gender: "male",
    suggestedRole: "Marketing Specialist",
    url: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=600&auto=format&fit=crop&q=80",
  },
];

export function getAvatarUrl(avatarIdOrUrl?: string, fallbackInitials?: string): string {
  if (!avatarIdOrUrl) {
    return PRESET_PERSONA_AVATARS[0].url;
  }
  const preset = PRESET_PERSONA_AVATARS.find((a) => a.id === avatarIdOrUrl || a.url === avatarIdOrUrl);
  if (preset) return preset.url;
  if (avatarIdOrUrl.startsWith("http") || avatarIdOrUrl.startsWith("data:") || avatarIdOrUrl.startsWith("/")) {
    return avatarIdOrUrl;
  }
  return PRESET_PERSONA_AVATARS[0].url;
}

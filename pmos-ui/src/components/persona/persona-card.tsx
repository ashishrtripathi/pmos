"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Edit3, Trash2, ChevronDown, ChevronUp, Quote as QuoteIcon, Sparkles } from "lucide-react";
import { PersonaJourney } from "@/lib/pmos";
import { getAvatarUrl } from "@/lib/persona-avatars";

interface PersonaCardProps {
  persona: PersonaJourney;
  onEdit: (persona: PersonaJourney) => void;
  onDelete?: (personaId: string) => void;
  isCompact?: boolean;
}

export function PersonaCard({ persona, onEdit, onDelete, isCompact = false }: PersonaCardProps) {
  const [collapsed, setCollapsed] = useState(isCompact);

  const avatarUrl = getAvatarUrl(persona.avatarUrl || persona.avatarId, persona.personaName);
  const demographics = persona.demographics || {
    age: 32,
    location: "Chongqing, China",
    job: persona.role,
  };

  const goals = persona.goals && persona.goals.length > 0
    ? persona.goals
    : [
        "Accumulate a large number of professional vocabulary",
        "Read business letters with no hint or barrier",
      ];

  const habits = persona.habits && persona.habits.length > 0
    ? persona.habits
    : [
        "Using fragmentation time to learn English",
        "Reads eBooks but prefers the paper book",
      ];

  const frustrations = persona.frustrations && persona.frustrations.length > 0
    ? persona.frustrations
    : [
        "Can't recognize some professional words instantly",
        "Always forgot some words learned before",
      ];

  const metrics = persona.metrics && persona.metrics.length > 0
    ? persona.metrics
    : [
        { label: "Social networks", score: 85 },
        { label: "Messaging", score: 70 },
        { label: "Learning", score: 45 },
      ];

  return (
    <div className="w-full bg-card rounded-2xl border border-border shadow-sm overflow-hidden transition-all">
      {/* Header bar */}
      <div className="px-6 py-3 bg-muted/40 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-sm bg-rose-600" />
          <span className="text-xs font-bold tracking-wider uppercase text-foreground">
            User Persona Profile
          </span>
          <span className="text-xs text-muted-foreground">· {persona.role}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onEdit(persona)}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            title="Edit Persona"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Persona</span>
          </button>
          {onDelete && (
            <button
              type="button"
              onClick={() => {
                if (confirm(`Are you sure you want to delete the persona "${persona.personaName}"?`)) {
                  onDelete(persona.personaId);
                }
              }}
              className="p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
              title="Delete Persona"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 text-muted-foreground hover:text-foreground rounded-lg transition-colors"
          >
            {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[380px] bg-background">
          {/* Left Column: Portrait Photo with Name & Quote Overlay */}
          <div className="relative lg:col-span-4 min-h-[320px] lg:min-h-[400px] overflow-hidden bg-zinc-900 flex flex-col justify-end p-6">
            {/* Background Image */}
            <img
              src={avatarUrl}
              alt={persona.personaName}
              className="absolute inset-0 w-full h-full object-cover object-center scale-100 hover:scale-105 transition-transform duration-500"
            />
            {/* Gradient Overlay for text legibility */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

            {/* Persona watermark badge (P emblem) */}
            <div className="absolute top-4 right-4 w-9 h-9 rounded-lg bg-rose-600 flex items-center justify-center text-white font-black text-lg shadow-md">
              P
            </div>

            {/* Text Overlay */}
            <div className="relative z-10 text-white space-y-2">
              <h2 className="text-3xl font-black tracking-tight drop-shadow-md">
                {persona.personaName}
              </h2>
              {persona.quote && (
                <p className="text-sm font-medium text-white/90 italic leading-relaxed drop-shadow">
                  &ldquo;{persona.quote}&rdquo;
                </p>
              )}
            </div>
          </div>

          {/* Right Column: Demographics, Goals, Habits, Frustrations, Metrics */}
          <div className="lg:col-span-8 p-6 lg:p-8 flex flex-col justify-between space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              {/* Section 1: Demographics */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2.5 h-2.5 rounded-sm bg-rose-600" />
                  <h3 className="text-base font-bold tracking-tight text-foreground">Demographics</h3>
                </div>
                <div className="space-y-1.5 text-xs text-muted-foreground ml-4">
                  {demographics.age && (
                    <div className="flex items-baseline gap-4">
                      <span className="font-semibold text-foreground w-16">• Age:</span>
                      <span>{demographics.age}</span>
                    </div>
                  )}
                  {demographics.location && (
                    <div className="flex items-baseline gap-4">
                      <span className="font-semibold text-foreground w-16">• Location:</span>
                      <span>{demographics.location}</span>
                    </div>
                  )}
                  {demographics.job && (
                    <div className="flex items-baseline gap-4">
                      <span className="font-semibold text-foreground w-16">• Job:</span>
                      <span className="text-foreground font-medium">{demographics.job}</span>
                    </div>
                  )}
                  {demographics.education && (
                    <div className="flex items-baseline gap-4">
                      <span className="font-semibold text-foreground w-16">• Education:</span>
                      <span>{demographics.education}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Section 2: Goals */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2.5 h-2.5 rounded-sm bg-rose-600" />
                  <h3 className="text-base font-bold tracking-tight text-foreground">Goals</h3>
                </div>
                <ul className="space-y-1.5 text-xs text-muted-foreground ml-4 list-disc list-outside">
                  {goals.map((g, idx) => (
                    <li key={idx} className="leading-relaxed">
                      {g}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Section 3: Learning habits / Habits */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2.5 h-2.5 rounded-sm bg-rose-600" />
                  <h3 className="text-base font-bold tracking-tight text-foreground">Learning habits</h3>
                </div>
                <ul className="space-y-1.5 text-xs text-muted-foreground ml-4 list-disc list-outside">
                  {habits.map((h, idx) => (
                    <li key={idx} className="leading-relaxed">
                      {h}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Section 4: Frustrations & Phone usage */}
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2.5 h-2.5 rounded-sm bg-rose-600" />
                    <h3 className="text-base font-bold tracking-tight text-foreground">Frustrations</h3>
                  </div>
                  <ul className="space-y-1.5 text-xs text-muted-foreground ml-4 list-disc list-outside">
                    {frustrations.map((f, idx) => (
                      <li key={idx} className="leading-relaxed">
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Section 5: Usage metrics */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2.5 h-2.5 rounded-sm bg-rose-600" />
                    <h3 className="text-base font-bold tracking-tight text-foreground">Phone & Tool usage</h3>
                  </div>
                  <div className="space-y-3 ml-1">
                    {metrics.map((m, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground font-medium">{m.label}</span>
                          <span className="text-xs font-semibold text-rose-600">{m.score}%</span>
                        </div>
                        <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-rose-600 h-full rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, Math.max(0, m.score))}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

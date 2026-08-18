"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Plus,
  Trash2,
  Upload,
  Image as ImageIcon,
  Check,
  Sparkles,
  Save,
  Loader2,
} from "lucide-react";
import { PersonaJourney, PersonaDemographics, PersonaUsageMetric } from "@/lib/pmos";
import { PRESET_PERSONA_AVATARS, getAvatarUrl } from "@/lib/persona-avatars";

interface PersonaModalProps {
  slug: string;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  personaToEdit?: PersonaJourney | null;
}

export function PersonaModal({
  slug,
  isOpen,
  onClose,
  onSaved,
  personaToEdit,
}: PersonaModalProps) {
  const isEditing = Boolean(personaToEdit);

  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [quote, setQuote] = useState("");
  const [selectedAvatarId, setSelectedAvatarId] = useState("avatar-henry");
  const [customAvatarUrl, setCustomAvatarUrl] = useState("");
  const [avatarTab, setAvatarTab] = useState<"preset" | "url" | "upload">("preset");

  const [demographics, setDemographics] = useState<PersonaDemographics>({
    age: 32,
    location: "Chongqing, China",
    job: "",
    education: "",
  });

  const [goals, setGoals] = useState<string[]>([
    "Accumulate a large number of professional vocabulary",
    "Read business letters with no hint or barrier",
  ]);

  const [habits, setHabits] = useState<string[]>([
    "Using fragmentation time to learn English",
    "Reads eBooks but prefers the paper book",
  ]);

  const [frustrations, setFrustrations] = useState<string[]>([
    "Can't recognize some professional words instantly",
    "Always forgot some words learned before",
  ]);

  const [metrics, setMetrics] = useState<PersonaUsageMetric[]>([
    { label: "Social networks", score: 85 },
    { label: "Messaging", score: 70 },
    { label: "Learning", score: 45 },
  ]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (personaToEdit) {
      setName(personaToEdit.personaName || "");
      setRole(personaToEdit.role || "");
      setQuote(personaToEdit.quote || "");
      if (personaToEdit.avatarUrl?.startsWith("data:") || personaToEdit.avatarUrl?.startsWith("http")) {
        setCustomAvatarUrl(personaToEdit.avatarUrl);
        setAvatarTab("url");
      }
      setSelectedAvatarId(personaToEdit.avatarId || "avatar-henry");

      setDemographics(
        personaToEdit.demographics || {
          age: 32,
          location: "Chongqing, China",
          job: personaToEdit.role || "",
          education: "",
        }
      );

      setGoals(
        personaToEdit.goals && personaToEdit.goals.length > 0
          ? personaToEdit.goals
          : ["Achieve core workflow tasks efficiently"]
      );

      setHabits(
        personaToEdit.habits && personaToEdit.habits.length > 0
          ? personaToEdit.habits
          : ["Values fast, intuitive tools"]
      );

      setFrustrations(
        personaToEdit.frustrations && personaToEdit.frustrations.length > 0
          ? personaToEdit.frustrations
          : ["Manual duplicate entry"]
      );

      setMetrics(
        personaToEdit.metrics && personaToEdit.metrics.length > 0
          ? personaToEdit.metrics
          : [
              { label: "Social networks", score: 85 },
              { label: "Messaging", score: 70 },
              { label: "Learning", score: 45 },
            ]
      );
    } else {
      setName("");
      setRole("");
      setQuote("You have to believe in yourself. That's the secret of success.");
      setSelectedAvatarId("avatar-henry");
      setCustomAvatarUrl("");
      setAvatarTab("preset");
      setDemographics({
        age: 32,
        location: "Chongqing, China",
        job: "Purchasing Department Manager",
        education: "B.S. Supply Chain",
      });
      setGoals([
        "Accumulate a large number of professional vocabulary",
        "Read business letters with no hint or barrier",
      ]);
      setHabits([
        "Using fragmentation time to learn English",
        "Reads eBooks but prefers the paper book",
      ]);
      setFrustrations([
        "Can't recognize some professional words instantly",
        "Always forgot some words learned before",
      ]);
      setMetrics([
        { label: "Social networks", score: 85 },
        { label: "Messaging", score: 70 },
        { label: "Learning", score: 45 },
      ]);
    }
  }, [personaToEdit, isOpen]);

  if (!isOpen) return null;

  const currentAvatarUrl =
    avatarTab === "preset"
      ? getAvatarUrl(selectedAvatarId)
      : customAvatarUrl || getAvatarUrl(selectedAvatarId);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setCustomAvatarUrl(reader.result);
        setAvatarTab("upload");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !role.trim()) {
      setError("Please provide both a Name and Role for the persona.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload = {
        personaId: personaToEdit?.personaId,
        name: name.trim(),
        personaName: name.trim(),
        role: role.trim(),
        quote: quote.trim(),
        avatarUrl: currentAvatarUrl,
        avatarId: avatarTab === "preset" ? selectedAvatarId : undefined,
        demographics: {
          ...demographics,
          job: demographics.job?.trim() || role.trim(),
        },
        goals: goals.filter((g) => g.trim().length > 0),
        habits: habits.filter((h) => h.trim().length > 0),
        frustrations: frustrations.filter((f) => f.trim().length > 0),
        metrics: metrics.filter((m) => m.label.trim().length > 0),
      };

      const endpoint = `/api/projects/${slug}/personas`;
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save persona");
      }

      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-card rounded-2xl border border-border shadow-2xl overflow-hidden flex flex-col my-8">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-muted/40 border-b border-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-rose-600" />
            <h2 className="text-lg font-bold text-foreground">
              {isEditing ? `Edit Persona: ${personaToEdit?.personaName}` : "Create New User Persona"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSave} className="overflow-y-auto p-6 space-y-6 flex-1">
          {error && (
            <div className="p-3 text-sm rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
              {error}
            </div>
          )}

          {/* Section 1: Persona Avatar & Picture Picker */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-foreground flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-rose-600" />
                Select Persona Picture
              </label>
              <div className="flex gap-1 bg-muted p-1 rounded-lg text-xs">
                <button
                  type="button"
                  onClick={() => setAvatarTab("preset")}
                  className={`px-3 py-1 rounded-md font-medium transition-all ${
                    avatarTab === "preset"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Preset Avatars
                </button>
                <button
                  type="button"
                  onClick={() => setAvatarTab("url")}
                  className={`px-3 py-1 rounded-md font-medium transition-all ${
                    avatarTab === "url"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Image URL
                </button>
                <button
                  type="button"
                  onClick={() => setAvatarTab("upload")}
                  className={`px-3 py-1 rounded-md font-medium transition-all ${
                    avatarTab === "upload"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Upload File
                </button>
              </div>
            </div>

            {/* Avatar Selector UI */}
            {avatarTab === "preset" && (
              <div className="grid grid-cols-4 sm:grid-cols-7 md:grid-cols-7 lg:grid-cols-14 gap-2.5">
                {PRESET_PERSONA_AVATARS.map((av) => {
                  const isSelected = selectedAvatarId === av.id;
                  const label =
                    av.personaType === "agent"
                      ? "🤖 AI Agent"
                      : av.personaType === "system"
                      ? "⚙️ System Service"
                      : `${av.gender === "female" ? "Woman" : "Man"} (${av.ethnicity})`;
                  return (
                    <button
                      key={av.id}
                      type="button"
                      onClick={() => {
                        setSelectedAvatarId(av.id);
                        if (!name) setName(av.name);
                        if (!role) setRole(av.suggestedRole);
                      }}
                      className={`group relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                        isSelected
                          ? "border-rose-600 ring-2 ring-rose-600/30 scale-105"
                          : "border-border hover:border-primary/50 opacity-85 hover:opacity-100"
                      } ${av.personaType !== "human" ? "bg-slate-950 p-1" : ""}`}
                      title={`${av.name} [${label}] — ${av.suggestedRole}`}
                    >
                      <img src={av.url} alt={av.name} className="w-full h-full object-cover rounded-lg" />
                      {isSelected && (
                        <div className="absolute inset-0 bg-rose-600/20 flex items-center justify-center">
                          <div className="w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-md">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        </div>
                      )}
                      {av.personaType === "agent" && (
                        <div className="absolute bottom-0.5 right-0.5 px-1 py-0.2 bg-indigo-600 text-[9px] font-bold text-white rounded shadow">
                          AI
                        </div>
                      )}
                      {av.personaType === "system" && (
                        <div className="absolute bottom-0.5 right-0.5 px-1 py-0.2 bg-emerald-600 text-[9px] font-bold text-white rounded shadow">
                          SYS
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {avatarTab === "url" && (
              <div className="space-y-2">
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/photo-..."
                  value={customAvatarUrl}
                  onChange={(e) => setCustomAvatarUrl(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            )}

            {avatarTab === "upload" && (
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-dashed border-border bg-muted/40 hover:bg-muted transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  Choose Photo File
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                {customAvatarUrl && (
                  <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Photo loaded
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Section 2: Core Identity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5">
                Persona Name <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Henry"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5">
                Role / Title <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Purchasing Department Manager"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </div>

          {/* Section 3: Quote */}
          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5">
              Inspiring Quote
            </label>
            <input
              type="text"
              placeholder="e.g. You have to believe in yourself. That's the secret of success."
              value={quote}
              onChange={(e) => setQuote(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background italic focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          {/* Section 4: Demographics */}
          <div className="p-4 rounded-xl bg-muted/30 border border-border space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-sm bg-rose-600" />
              <h3 className="text-sm font-bold text-foreground">Demographics</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Age</label>
                <input
                  type="number"
                  placeholder="32"
                  value={demographics.age || ""}
                  onChange={(e) =>
                    setDemographics({ ...demographics, age: parseInt(e.target.value, 10) || "" })
                  }
                  className="w-full px-3 py-1.5 text-sm rounded-lg border border-border bg-background"
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Location</label>
                <input
                  type="text"
                  placeholder="e.g. Chongqing, China"
                  value={demographics.location || ""}
                  onChange={(e) =>
                    setDemographics({ ...demographics, location: e.target.value })
                  }
                  className="w-full px-3 py-1.5 text-sm rounded-lg border border-border bg-background"
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Job / Department</label>
                <input
                  type="text"
                  placeholder="e.g. Purchasing Manager"
                  value={demographics.job || ""}
                  onChange={(e) =>
                    setDemographics({ ...demographics, job: e.target.value })
                  }
                  className="w-full px-3 py-1.5 text-sm rounded-lg border border-border bg-background"
                />
              </div>
            </div>
          </div>

          {/* Section 5: Goals & Learning Habits */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Goals */}
            <div className="p-4 rounded-xl bg-muted/30 border border-border space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-sm bg-rose-600" />
                  <h3 className="text-sm font-bold text-foreground">Goals</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setGoals([...goals, ""])}
                  className="text-xs text-rose-600 font-medium flex items-center gap-1 hover:underline"
                >
                  <Plus className="w-3 h-3" /> Add Goal
                </button>
              </div>
              <div className="space-y-2">
                {goals.map((goal, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={goal}
                      placeholder="e.g. Accumulate professional vocabulary"
                      onChange={(e) => {
                        const newGoals = [...goals];
                        newGoals[idx] = e.target.value;
                        setGoals(newGoals);
                      }}
                      className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-border bg-background"
                    />
                    <button
                      type="button"
                      onClick={() => setGoals(goals.filter((_, i) => i !== idx))}
                      className="p-1 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Learning Habits */}
            <div className="p-4 rounded-xl bg-muted/30 border border-border space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-sm bg-rose-600" />
                  <h3 className="text-sm font-bold text-foreground">Learning Habits / Behaviors</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setHabits([...habits, ""])}
                  className="text-xs text-rose-600 font-medium flex items-center gap-1 hover:underline"
                >
                  <Plus className="w-3 h-3" /> Add Habit
                </button>
              </div>
              <div className="space-y-2">
                {habits.map((habit, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={habit}
                      placeholder="e.g. Uses fragmentation time to learn"
                      onChange={(e) => {
                        const newHabits = [...habits];
                        newHabits[idx] = e.target.value;
                        setHabits(newHabits);
                      }}
                      className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-border bg-background"
                    />
                    <button
                      type="button"
                      onClick={() => setHabits(habits.filter((_, i) => i !== idx))}
                      className="p-1 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section 6: Frustrations & Usage Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Frustrations */}
            <div className="p-4 rounded-xl bg-muted/30 border border-border space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-sm bg-rose-600" />
                  <h3 className="text-sm font-bold text-foreground">Frustrations & Blockers</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setFrustrations([...frustrations, ""])}
                  className="text-xs text-rose-600 font-medium flex items-center gap-1 hover:underline"
                >
                  <Plus className="w-3 h-3" /> Add Frustration
                </button>
              </div>
              <div className="space-y-2">
                {frustrations.map((frustration, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={frustration}
                      placeholder="e.g. Can't recognize professional words instantly"
                      onChange={(e) => {
                        const newFrustrations = [...frustrations];
                        newFrustrations[idx] = e.target.value;
                        setFrustrations(newFrustrations);
                      }}
                      className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-border bg-background"
                    />
                    <button
                      type="button"
                      onClick={() => setFrustrations(frustrations.filter((_, i) => i !== idx))}
                      className="p-1 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Usage Metrics */}
            <div className="p-4 rounded-xl bg-muted/30 border border-border space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-sm bg-rose-600" />
                  <h3 className="text-sm font-bold text-foreground">Phone & Tool Usage</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setMetrics([...metrics, { label: "New Channel", score: 50 }])}
                  className="text-xs text-rose-600 font-medium flex items-center gap-1 hover:underline"
                >
                  <Plus className="w-3 h-3" /> Add Metric
                </button>
              </div>
              <div className="space-y-3">
                {metrics.map((metric, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        value={metric.label}
                        onChange={(e) => {
                          const newMetrics = [...metrics];
                          newMetrics[idx].label = e.target.value;
                          setMetrics(newMetrics);
                        }}
                        className="text-xs font-medium px-2 py-0.5 rounded border border-border bg-background w-32"
                      />
                      <span className="text-xs font-semibold text-rose-600">{metric.score}%</span>
                      <button
                        type="button"
                        onClick={() => setMetrics(metrics.filter((_, i) => i !== idx))}
                        className="p-0.5 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={metric.score}
                      onChange={(e) => {
                        const newMetrics = [...metrics];
                        newMetrics[idx].score = parseInt(e.target.value, 10);
                        setMetrics(newMetrics);
                      }}
                      className="w-full accent-rose-600"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-border flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all shadow-sm disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving Persona...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {isEditing ? "Save Persona Updates" : "Create Persona & Journey"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

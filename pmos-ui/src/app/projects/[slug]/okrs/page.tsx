"use client";

import { useState, useEffect, useCallback } from "react";
import { Target, Plus, Trash2, Check, ChevronDown, ChevronRight, Edit3, TrendingUp, BarChart3 } from "lucide-react";

// ── Types ──────────────────────────────────────────

interface KeyResult {
  id: string;
  title: string;
  description: string;
  metric: string;
  target: number;
  current: number;
  unit: string;
  owner: string;
}

interface Objective {
  id: string;
  title: string;
  description: string;
  quarter: string;
  owner: string;
  keyResults: KeyResult[];
  progress: number;
  createdAt: string;
  updatedAt: string;
}

const QUARTERS = ["Q1 2026", "Q2 2026", "Q3 2026", "Q4 2026", "Q1 2027"];

let krCounter = 0;
function genKRId() {
  krCounter++;
  return `KR-${String(krCounter).padStart(3, "0")}`;
}

function genObjId() {
  return `OBJ-${Date.now().toString(36).toUpperCase()}`;
}

// ── Key Result Row ─────────────────────────────────

function KRRow({
  kr,
  onChange,
  onDelete,
}: {
  kr: KeyResult;
  onChange: (kr: KeyResult) => void;
  onDelete: () => void;
}) {
  const progressPct = kr.target > 0 ? Math.min(100, Math.round((kr.current / kr.target) * 100)) : 0;

  return (
    <div className="p-3 rounded-lg border border-border bg-background">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <input
            type="text"
            value={kr.title}
            onChange={(e) => onChange({ ...kr, title: e.target.value })}
            placeholder="Key Result title"
            className="w-full text-sm font-medium bg-transparent border-b border-transparent focus:border-primary/30 focus:outline-none mb-1"
          />
          <input
            type="text"
            value={kr.description}
            onChange={(e) => onChange({ ...kr, description: e.target.value })}
            placeholder="Description (optional)"
            className="w-full text-xs text-muted-foreground bg-transparent border-b border-transparent focus:border-primary/30 focus:outline-none"
          />
          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
            <span>Metric:</span>
            <input
              type="text"
              value={kr.metric}
              onChange={(e) => onChange({ ...kr, metric: e.target.value })}
              className="px-1.5 py-0.5 rounded bg-muted border border-transparent focus:border-primary/30 focus:outline-none w-28"
              placeholder="e.g. story count"
            />
            <span>Target:</span>
            <input
              type="number"
              value={kr.target}
              onChange={(e) => onChange({ ...kr, target: Number(e.target.value) })}
              className="px-1.5 py-0.5 rounded bg-muted border border-transparent focus:border-primary/30 focus:outline-none w-16 text-right font-mono"
            />
            <input
              type="text"
              value={kr.unit}
              onChange={(e) => onChange({ ...kr, unit: e.target.value })}
              className="px-1.5 py-0.5 rounded bg-muted border border-transparent focus:border-primary/30 focus:outline-none w-16"
              placeholder="unit"
            />
            <span className="text-muted-foreground">→</span>
            <span className="font-mono font-medium">{kr.current}</span>
            <span className="text-muted-foreground">/ {kr.target}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="text-right">
            <div className="text-lg font-bold font-mono" style={{ color: progressPct >= 80 ? "#059669" : progressPct >= 50 ? "#d97706" : "#dc2626" }}>
              {progressPct}%
            </div>
            <div className="text-[9px] text-muted-foreground">complete</div>
          </div>
          <button onClick={onDelete} className="p-1 text-muted-foreground hover:text-red-500 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      {/* Progress bar */}
      <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${progressPct}%`,
            backgroundColor: progressPct >= 80 ? "#059669" : progressPct >= 50 ? "#d97706" : "#dc2626",
          }}
        />
      </div>
    </div>
  );
}

// ── Objective Card ─────────────────────────────────

function ObjectiveCard({
  objective,
  onChange,
  onDelete,
}: {
  objective: Objective;
  onChange: (o: Objective) => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(true);

  const addKR = () => {
    const newKR: KeyResult = {
      id: genKRId(),
      title: "",
      description: "",
      metric: "",
      target: 0,
      current: 0,
      unit: "",
      owner: objective.owner,
    };
    onChange({
      ...objective,
      keyResults: [...objective.keyResults, newKR],
    });
  };

  const updateKR = (index: number, kr: KeyResult) => {
    const krs = [...objective.keyResults];
    krs[index] = kr;
    // Recalculate progress as average of all KR percentages
    const progress = krs.length > 0
      ? Math.round(krs.reduce((s, k) => s + (k.target > 0 ? (k.current / k.target) * 100 : 0), 0) / krs.length)
      : 0;
    onChange({
      ...objective,
      keyResults: krs,
      progress: Math.min(100, progress),
    });
  };

  const deleteKR = (index: number) => {
    const krs = objective.keyResults.filter((_, i) => i !== index);
    const progress = krs.length > 0
      ? Math.round(krs.reduce((s, k) => s + (k.target > 0 ? (k.current / k.target) * 100 : 0), 0) / krs.length)
      : 0;
    onChange({
      ...objective,
      keyResults: krs,
      progress: Math.min(100, progress),
    });
  };

  const progressColor = objective.progress >= 80 ? "#059669" : objective.progress >= 50 ? "#d97706" : "#dc2626";

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="p-4 flex items-start gap-4 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {expanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
            <input
              type="text"
              value={objective.title}
              onChange={(e) => onChange({ ...objective, title: e.target.value })}
              placeholder="Objective title"
              className="text-base font-semibold bg-transparent border-b border-transparent focus:border-primary/30 focus:outline-none flex-1"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="flex items-center gap-3 ml-6 text-xs text-muted-foreground">
            <input
              type="text"
              value={objective.quarter}
              onChange={(e) => onChange({ ...objective, quarter: e.target.value })}
              className="px-1.5 py-0.5 rounded bg-muted border border-transparent focus:border-primary/30 focus:outline-none w-24"
              placeholder="Quarter"
              onClick={(e) => e.stopPropagation()}
            />
            <span>Owner:</span>
            <input
              type="text"
              value={objective.owner}
              onChange={(e) => onChange({ ...objective, owner: e.target.value })}
              className="px-1.5 py-0.5 rounded bg-muted border border-transparent focus:border-primary/30 focus:outline-none w-28"
              placeholder="Owner name"
              onClick={(e) => e.stopPropagation()}
            />
            <span className="text-muted-foreground">{objective.keyResults.length} key results</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-2xl font-bold font-mono" style={{ color: progressColor }}>{objective.progress}%</div>
            <div className="text-[9px] text-muted-foreground">progress</div>
          </div>
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-1 text-muted-foreground hover:text-red-500 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Description */}
      <div className="px-4 pb-2 ml-6">
        <input
          type="text"
          value={objective.description}
          onChange={(e) => onChange({ ...objective, description: e.target.value })}
          placeholder="Description (optional)"
          className="w-full text-xs text-muted-foreground bg-transparent border-b border-transparent focus:border-primary/30 focus:outline-none"
        />
      </div>

      {/* Progress bar */}
      <div className="px-4 ml-6 mb-2">
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${objective.progress}%`, backgroundColor: progressColor }} />
        </div>
      </div>

      {/* Key Results */}
      {expanded && (
        <div className="px-4 pb-4 ml-6 space-y-2">
          {objective.keyResults.map((kr, i) => (
            <KRRow
              key={kr.id}
              kr={kr}
              onChange={(updated) => updateKR(i, updated)}
              onDelete={() => deleteKR(i)}
            />
          ))}
          <button
            onClick={addKR}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mt-1"
          >
            <Plus className="w-3.5 h-3.5" /> Add Key Result
          </button>
        </div>
      )}
    </div>
  );
}

// ── OKR Dashboard Page ─────────────────────────────

export default function OKRPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    fetch(`/api/projects/${slug}/okrs`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setObjectives(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [slug]);

  const addObjective = () => {
    const newObj: Objective = {
      id: genObjId(),
      title: "",
      description: "",
      quarter: QUARTERS[Math.floor(new Date().getMonth() / 3)],
      owner: "",
      keyResults: [],
      progress: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setObjectives([...objectives, newObj]);
  };

  const updateObjective = (index: number, updated: Objective) => {
    const objs = [...objectives];
    objs[index] = { ...updated, updatedAt: new Date().toISOString() };
    setObjectives(objs);
  };

  const deleteObjective = (index: number) => {
    setObjectives(objectives.filter((_, i) => i !== index));
  };

  const saveAll = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${slug}/okrs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save-all", objectives }),
      });
      const data = await res.json();
      if (data.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  // Stats
  const totalKRs = objectives.reduce((s, o) => s + o.keyResults.length, 0);
  const completedKRs = objectives.reduce(
    (s, o) => s + o.keyResults.filter((kr) => kr.target > 0 && kr.current >= kr.target).length,
    0
  );
  const avgProgress = objectives.length > 0
    ? Math.round(objectives.reduce((s, o) => s + o.progress, 0) / objectives.length)
    : 0;

  if (loading) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-64" />
          <div className="h-4 bg-muted rounded w-96" />
          <div className="h-48 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Target className="w-5 h-5" />
          <h1 className="text-2xl font-bold">OKRs &mdash; {slug}</h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={saveAll}
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save All"}
          </button>
          {saved && (
            <span className="flex items-center gap-1 text-sm text-green-600">
              <Check className="w-4 h-4" /> Saved
            </span>
          )}
        </div>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="p-4 rounded-xl border border-border bg-card">
          <div className="text-2xl font-bold">{objectives.length}</div>
          <div className="text-xs text-muted-foreground">Objectives</div>
        </div>
        <div className="p-4 rounded-xl border border-border bg-card">
          <div className="text-2xl font-bold">{totalKRs}</div>
          <div className="text-xs text-muted-foreground">Key Results</div>
        </div>
        <div className="p-4 rounded-xl border border-border bg-card">
          <div className="text-2xl font-bold" style={{ color: avgProgress >= 80 ? "#059669" : avgProgress >= 50 ? "#d97706" : "#dc2626" }}>
            {avgProgress}%
          </div>
          <div className="text-xs text-muted-foreground">Avg Progress</div>
        </div>
        <div className="p-4 rounded-xl border border-border bg-card">
          <div className="text-2xl font-bold">{completedKRs}/{totalKRs}</div>
          <div className="text-xs text-muted-foreground">KRs Completed</div>
        </div>
      </div>

      {/* Objectives */}
      <div className="space-y-3">
        {objectives.map((obj, i) => (
          <ObjectiveCard
            key={obj.id}
            objective={obj}
            onChange={(updated) => updateObjective(i, updated)}
            onDelete={() => deleteObjective(i)}
          />
        ))}
      </div>

      {/* Add button */}
      <div className="mt-6">
        <button
          onClick={addObjective}
          className="w-full py-3 rounded-xl border-2 border-dashed border-border text-sm text-muted-foreground hover:border-primary/30 hover:text-foreground transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Objective
        </button>
      </div>
    </div>
  );
}

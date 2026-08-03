"use client";

import { useState, useEffect, useCallback } from "react";
import {
  GitPullRequest,
  Plus,
  Trash2,
  ArrowRight,
  FilePlus2,
  Loader2,
} from "lucide-react";

type Priority = "high" | "medium" | "low";
type Category = "new-feature" | "enhancement" | "bugfix" | "refactor" | "design";
type Status = "submitted" | "in-review" | "approved" | "rejected" | "implemented";

interface ChangeRequest {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  category: Category;
  status: Status;
  requestedBy: string;
  storyIds: string[];
  createdAt: string;
  updatedAt: string;
}

const PRIORITIES: Priority[] = ["high", "medium", "low"];
const CATEGORIES: Category[] = [
  "new-feature",
  "enhancement",
  "bugfix",
  "refactor",
  "design",
];
const STATUSES: Status[] = [
  "submitted",
  "in-review",
  "approved",
  "rejected",
  "implemented",
];

const PRIORITY_COLORS: Record<Priority, string> = {
  high: "bg-red-100 text-red-700 border-red-200",
  medium: "bg-amber-100 text-amber-700 border-amber-200",
  low: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

const STATUS_COLORS: Record<Status, string> = {
  submitted: "bg-blue-50 text-blue-700 border-blue-200",
  "in-review": "bg-violet-50 text-violet-700 border-violet-200",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-red-50 text-red-600 border-red-200",
  implemented: "bg-slate-100 text-slate-600 border-slate-200",
};

const CATEGORY_LABEL: Record<Category, string> = {
  "new-feature": "New Feature",
  enhancement: "Enhancement",
  bugfix: "Bug Fix",
  refactor: "Refactor",
  design: "Design",
};

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

export default function ChangeRequestsPage({
  params,
}: {
  params: { slug: string };
}) {
  const [crs, setCrs] = useState<ChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [convertingId, setConvertingId] = useState<string | null>(null);

  // New CR form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [category, setCategory] = useState<Category>("enhancement");
  const [points, setPoints] = useState("1");
  const [saving, setSaving] = useState(false);

  const loadCRs = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${params.slug}/change-requests`);
      const data = await res.json();
      setCrs(data.changeRequests || []);
      setError(null);
    } catch {
      setError("Failed to load change requests");
    } finally {
      setLoading(false);
    }
  }, [params.slug]);

  useEffect(() => {
    loadCRs();
  }, [loadCRs]);

  const handleCreate = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${params.slug}/change-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          title: title.trim(),
          description: description.trim(),
          priority,
          category,
          requestedBy: "PM",
        }),
      });
      if (res.ok) {
        setTitle("");
        setDescription("");
        setPriority("medium");
        setCategory("enhancement");
        await loadCRs();
      }
    } catch {
      setError("Failed to create change request");
    } finally {
      setSaving(false);
    }
  };

  const handleStatus = async (id: string, status: Status) => {
    await fetch(`/api/projects/${params.slug}/change-requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "status", id, status }),
    });
    await loadCRs();
  };

  const handleConvert = async (id: string) => {
    setConvertingId(id);
    try {
      await fetch(`/api/projects/${params.slug}/change-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "convert",
          id,
          points: Number(points) || 1,
        }),
      });
      await loadCRs();
    } finally {
      setConvertingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/projects/${params.slug}/change-requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", id }),
    });
    await loadCRs();
  };

  const sorted = [...crs].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <GitPullRequest className="w-6 h-6 text-violet-500" /> Change Requests
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Capture what needs to change next and turn it into work
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" /> New Request
        </button>
      </div>

      {/* New Change Request Form */}
      {showForm && (
        <div className="mb-6 p-5 rounded-lg border-2 border-violet-200 bg-card">
          <div className="flex items-center gap-2 mb-3">
            <FilePlus2 className="w-4 h-4 text-violet-500" />
            <h2 className="font-semibold text-sm">Submit the next change request</h2>
          </div>
          <div className="grid gap-3">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Change request title * (e.g. Add dark mode support)"
              className="px-3 py-2 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what should change and why..."
              rows={3}
              className="px-3 py-2 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y"
            />
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-medium">Category:</span>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as Category)}
                  className="px-2 py-1.5 rounded-md border border-border bg-background text-xs focus:outline-none"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {CATEGORY_LABEL[c]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-medium">Priority:</span>
                <div className="flex gap-1.5">
                  {PRIORITIES.map((p) => (
                    <button
                      key={p}
                      onClick={() => setPriority(p)}
                      className={`px-3 py-1 rounded-md text-xs font-medium border transition-colors ${
                        priority === p
                          ? PRIORITY_COLORS[p]
                          : "border-border text-muted-foreground hover:border-slate-300"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-medium">Story points:</span>
                <input
                  type="number"
                  min={0.5}
                  step={0.5}
                  value={points}
                  onChange={(e) => setPoints(e.target.value)}
                  className="w-16 px-2 py-1.5 rounded-md border border-border bg-background text-xs font-mono focus:outline-none"
                />
              </div>
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowForm(false)}
                className="px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!title.trim() || saving}
                className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 hover:opacity-90 transition-opacity"
              >
                {saving ? "Saving..." : "Submit Change Request"}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 text-muted-foreground">Loading...</div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-16 border border-dashed rounded-lg">
          <GitPullRequest className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
          <p className="text-muted-foreground">
            No change requests yet. Submit one above to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((cr) => (
            <div key={cr.id} className="p-4 rounded-lg border border-border bg-card">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono text-muted-foreground">{cr.id}</span>
                    <span
                      className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${PRIORITY_COLORS[cr.priority]}`}
                    >
                      {cr.priority}
                    </span>
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded border border-border text-muted-foreground">
                      {CATEGORY_LABEL[cr.category]}
                    </span>
                    <span
                      className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${STATUS_COLORS[cr.status]}`}
                    >
                      {cr.status}
                    </span>
                  </div>
                  <h3 className="font-medium">{cr.title}</h3>
                  {cr.description && (
                    <p className="text-sm text-muted-foreground mt-1">{cr.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                    <span>{cr.requestedBy}</span>
                    <span>·</span>
                    <span>{formatDate(cr.createdAt)}</span>
                    {cr.storyIds.length > 0 && (
                      <>
                        <span>·</span>
                        <span className="font-mono text-emerald-600">
                          {cr.storyIds.length} story{cr.storyIds.length > 1 ? "s" : ""} created
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(cr.id)}
                  className="p-1 text-muted-foreground hover:text-red-500 transition-colors shrink-0"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-border">
                <span className="text-[11px] text-muted-foreground mr-1">Status:</span>
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleStatus(cr.id, s)}
                    disabled={cr.status === s}
                    className={`text-[11px] px-2 py-1 rounded-md border transition-colors disabled:opacity-100 ${
                      cr.status === s
                        ? STATUS_COLORS[s]
                        : "border-border text-muted-foreground hover:border-slate-300"
                    }`}
                  >
                    {s}
                  </button>
                ))}
                <div className="flex-1" />
                <button
                  onClick={() => handleConvert(cr.id)}
                  disabled={convertingId === cr.id}
                  className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-md bg-violet-50 text-violet-700 border border-violet-200 hover:bg-violet-100 transition-colors disabled:opacity-50"
                  title="Create a story in the backlog from this change request"
                >
                  {convertingId === cr.id ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <ArrowRight className="w-3 h-3" />
                  )}
                  Convert to Story
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

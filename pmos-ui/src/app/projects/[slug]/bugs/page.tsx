"use client";

import { useState, useEffect, useCallback } from "react";
import { Bug as BugIcon, Plus, Trash2, AlertTriangle, Search, BugOff } from "lucide-react";

type Severity = "critical" | "major" | "minor" | "cosmetic";
type Status = "open" | "in-progress" | "review" | "fixed" | "closed";

interface Bug {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  status: Status;
  stepsToReproduce?: string;
  expectedBehavior?: string;
  actualBehavior?: string;
  reportedBy: string;
  createdAt: string;
  updatedAt: string;
}

const SEVERITIES: Severity[] = ["critical", "major", "minor", "cosmetic"];
const STATUSES: Status[] = ["open", "in-progress", "review", "fixed", "closed"];

const SEVERITY_COLORS: Record<Severity, { badge: string; dot: string }> = {
  critical: { badge: "bg-red-100 text-red-700 border-red-200", dot: "#dc2626" },
  major: { badge: "bg-orange-100 text-orange-700 border-orange-200", dot: "#ea580c" },
  minor: { badge: "bg-yellow-100 text-yellow-700 border-yellow-200", dot: "#ca8a04" },
  cosmetic: { badge: "bg-slate-100 text-slate-600 border-slate-200", dot: "#64748b" },
};

const STATUS_COLORS: Record<Status, string> = {
  open: "bg-red-50 text-red-700 border-red-200",
  "in-progress": "bg-blue-50 text-blue-700 border-blue-200",
  review: "bg-amber-50 text-amber-700 border-amber-200",
  fixed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  closed: "bg-slate-100 text-slate-500 border-slate-200",
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

export default function BugsPage({ params }: { params: { slug: string } }) {
  const [bugs, setBugs] = useState<Bug[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  // New bug form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<Severity>("minor");
  const [steps, setSteps] = useState("");
  const [expected, setExpected] = useState("");
  const [actual, setActual] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const loadBugs = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${params.slug}/bugs`);
      const data = await res.json();
      setBugs(data.bugs || []);
      setError(null);
    } catch {
      setError("Failed to load bugs");
    } finally {
      setLoading(false);
    }
  }, [params.slug]);

  useEffect(() => {
    loadBugs();
  }, [loadBugs]);

  const handleCreate = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${params.slug}/bugs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          title: title.trim(),
          description: description.trim(),
          severity,
          stepsToReproduce: steps.trim(),
          expectedBehavior: expected.trim(),
          actualBehavior: actual.trim(),
          reportedBy: "PM",
        }),
      });
      if (res.ok) {
        setTitle("");
        setDescription("");
        setSteps("");
        setExpected("");
        setActual("");
        setSeverity("minor");
        setShowForm(false);
        await loadBugs();
      }
    } catch {
      setError("Failed to create bug");
    } finally {
      setSaving(false);
    }
  };

  const handleStatus = async (id: string, status: Status) => {
    try {
      const res = await fetch(`/api/projects/${params.slug}/bugs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "status", id, status }),
      });
      const data = await res.json();
      if (data.pickedUpBy) {
        const bug = bugs.find((b) => b.id === id);
        setNotice(
          `"${bug?.title || id}" handed to the coding agent`
        );
        window.setTimeout(() => setNotice(null), 5000);
      }
    } catch {
      // ignore
    }
    await loadBugs();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/projects/${params.slug}/bugs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", id }),
    });
    await loadBugs();
  };

  const filtered = bugs.filter(
    (b) =>
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.description.toLowerCase().includes(search.toLowerCase()) ||
      b.id.toLowerCase().includes(search.toLowerCase())
  );

  const byStatus = STATUSES.map((s) => ({
    status: s,
    bugs: filtered.filter((b) => b.status === s),
  })).filter((g) => g.bugs.length > 0);

  const criticalCount = bugs.filter((b) => b.severity === "critical" && b.status !== "closed").length;
  const openCount = bugs.filter((b) => b.status !== "closed" && b.status !== "fixed").length;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BugIcon className="w-6 h-6 text-red-500" /> Bugs
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track, triage and fix defects found in the application
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" /> Add Bug
        </button>
      </div>

      {/* Agent pickup notice */}
      {notice && (
        <div className="mb-4 flex items-center gap-2 px-4 py-2.5 rounded-md bg-violet-50 border border-violet-200 text-violet-700 text-sm">
          <AlertTriangle className="w-4 h-4" />
          <span>{notice}</span>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <div className="p-3 rounded-lg border border-border bg-card">
          <div className="text-2xl font-bold font-mono">{bugs.length}</div>
          <div className="text-xs text-muted-foreground">Total bugs</div>
        </div>
        <div className="p-3 rounded-lg border border-border bg-card">
          <div className="text-2xl font-bold font-mono text-red-600">{openCount}</div>
          <div className="text-xs text-muted-foreground">Open (not fixed)</div>
        </div>
        <div className="p-3 rounded-lg border border-border bg-card">
          <div className="text-2xl font-bold font-mono text-red-700">{criticalCount}</div>
          <div className="text-xs text-muted-foreground">Critical</div>
        </div>
        <div className="p-3 rounded-lg border border-border bg-card">
          <div className="text-2xl font-bold font-mono text-emerald-600">
            {bugs.filter((b) => b.status === "fixed").length}
          </div>
          <div className="text-xs text-muted-foreground">Fixed</div>
        </div>
        <div className="p-3 rounded-lg border border-border bg-card">
          <div className="text-2xl font-bold font-mono text-slate-500">
            {bugs.filter((b) => b.status === "closed").length}
          </div>
          <div className="text-xs text-muted-foreground">Closed</div>
        </div>
      </div>

      {/* Add Bug Form */}
      {showForm && (
        <div className="mb-6 p-4 rounded-lg border border-border bg-card">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <h2 className="font-semibold text-sm">New Bug Report</h2>
          </div>
          <div className="grid gap-3">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Bug title * (e.g. Kanban drag-drop loses card position)"
              className="px-3 py-2 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the bug"
              rows={2}
              className="px-3 py-2 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y"
            />
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs text-muted-foreground font-medium">Severity:</span>
              <div className="flex gap-1.5">
                {SEVERITIES.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSeverity(s)}
                    className={`px-3 py-1 rounded-md text-xs font-medium border transition-colors ${
                      severity === s
                        ? SEVERITY_COLORS[s].badge
                        : "border-border text-muted-foreground hover:border-slate-300"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <textarea
              value={steps}
              onChange={(e) => setSteps(e.target.value)}
              placeholder="Steps to reproduce (one per line)"
              rows={2}
              className="px-3 py-2 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y"
            />
            <div className="grid md:grid-cols-2 gap-3">
              <input
                type="text"
                value={expected}
                onChange={(e) => setExpected(e.target.value)}
                placeholder="Expected behavior"
                className="px-3 py-2 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <input
                type="text"
                value={actual}
                onChange={(e) => setActual(e.target.value)}
                placeholder="Actual behavior"
                className="px-3 py-2 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
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
                {saving ? "Saving..." : "Create Bug"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-4">
        <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search bugs..."
          className="w-full pl-9 pr-3 py-2 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {loading ? (
        <div className="text-center py-16 text-muted-foreground">Loading bugs...</div>
      ) : bugs.length === 0 ? (
        <div className="text-center py-16 border border-dashed rounded-lg">
          <BugOff className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
          <p className="text-muted-foreground">No bugs yet. Click &quot;Add Bug&quot; to report the first one.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {byStatus.map((group) => (
            <div key={group.status} className="rounded-lg border border-border bg-card">
              <div className="px-3 py-2 border-b border-border flex items-center justify-between">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${STATUS_COLORS[group.status]}`}>
                  {group.status}
                </span>
                <span className="text-xs text-muted-foreground font-mono">{group.bugs.length}</span>
              </div>
              <div className="p-2 space-y-2 max-h-[420px] overflow-y-auto">
                {group.bugs.map((bug) => (
                  <div key={bug.id} className="p-3 rounded-md border border-border bg-background hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-mono text-muted-foreground">{bug.id}</span>
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${SEVERITY_COLORS[bug.severity].badge}`}>
                            {bug.severity}
                          </span>
                        </div>
                        <h3 className="text-sm font-medium leading-tight">{bug.title}</h3>
                        {bug.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{bug.description}</p>
                        )}
                        {bug.stepsToReproduce && (
                          <div className="mt-2 p-2 rounded bg-muted/50">
                            <div className="text-[10px] font-medium text-muted-foreground mb-0.5">Steps to reproduce</div>
                            <pre className="text-[11px] font-mono whitespace-pre-wrap">{bug.stepsToReproduce}</pre>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleDelete(bug.id)}
                        className="p-1 text-muted-foreground hover:text-red-500 transition-colors shrink-0"
                        title="Delete bug"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
                      <span className="text-[10px] text-muted-foreground">
                        {bug.reportedBy} · {formatDate(bug.createdAt)}
                      </span>
                      <select
                        value={bug.status}
                        onChange={(e) => handleStatus(bug.id, e.target.value as Status)}
                        className="text-[11px] px-1.5 py-0.5 rounded border border-border bg-background focus:outline-none"
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

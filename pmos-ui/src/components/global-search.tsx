"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Loader2, Columns3, FileText } from "lucide-react";

interface SearchProject {
  slug: string;
  name: string;
}

interface SearchStory {
  id: string;
  title: string;
  status: string;
  description?: string;
  useCase?: { iWant?: string; soThat?: string; asA?: string };
  businessGoal?: string;
  persona?: string;
}

interface SearchHit {
  project: SearchProject;
  story: SearchStory;
}

export function GlobalSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<SearchProject[]>([]);
  const [storiesByProject, setStoriesByProject] = useState<Record<string, SearchStory[]>>({});
  const boxRef = useRef<HTMLDivElement>(null);

  // Load projects + all stories across boards (pmos, voxstyle, …)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/projects/list");
        const data = await res.json();
        const projs: SearchProject[] = (data.projects || []).map(
          (p: { slug: string; name: string }) => ({ slug: p.slug, name: p.name })
        );
        if (cancelled) return;
        setProjects(projs);

        const byProject: Record<string, SearchStory[]> = {};
        await Promise.all(
          projs.map(async (p) => {
            try {
              const sr = await fetch(`/api/projects/${p.slug}/stories`);
              const stories = await sr.json();
              if (Array.isArray(stories)) byProject[p.slug] = stories;
            } catch {
              byProject[p.slug] = [];
            }
          })
        );
        if (!cancelled) {
          setStoriesByProject(byProject);
          setLoading(false);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Close when clicking outside
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const hits = useMemo<SearchHit[]>(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    const results: SearchHit[] = [];
    for (const p of projects) {
      for (const s of storiesByProject[p.slug] || []) {
        const title = (s.title || "").toLowerCase();
        const desc = (s.description || "").toLowerCase();
        const iWant = (s.useCase?.iWant || "").toLowerCase();
        const goal = (s.businessGoal || "").toLowerCase();
        if (
          title.includes(q) ||
          desc.includes(q) ||
          iWant.includes(q) ||
          goal.includes(q)
        ) {
          results.push({ project: p, story: s });
        }
      }
    }
    // Title matches first, then by id
    results.sort((a, b) => {
      const aTitle = (a.story.title || "").toLowerCase().startsWith(q) ? 0 : 1;
      const bTitle = (b.story.title || "").toLowerCase().startsWith(q) ? 0 : 1;
      if (aTitle !== bTitle) return aTitle - bTitle;
      return (a.story.id || "").localeCompare(b.story.id || "");
    });
    return results.slice(0, 20);
  }, [query, projects, storiesByProject]);

  const goTo = (slug: string) => {
    setOpen(false);
    setQuery("");
    router.push(`/projects/${slug}/kanban`);
  };

  return (
    <div ref={boxRef} className="relative">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && hits.length > 0) goTo(hits[0].project.slug);
            if (e.key === "Escape") setOpen(false);
          }}
          placeholder="Search all boards…"
          className="w-full pl-8 pr-3 py-1.5 rounded-md border border-border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary"
        />
        {loading && <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 animate-spin text-muted-foreground" />}
      </div>

      {open && query.trim().length >= 2 && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 rounded-md border border-border bg-card shadow-xl overflow-hidden">
          {loading ? (
            <div className="p-3 text-xs text-muted-foreground flex items-center gap-2">
              <Loader2 className="w-3 h-3 animate-spin" /> Loading boards…
            </div>
          ) : hits.length === 0 ? (
            <div className="p-3 text-xs text-muted-foreground">No stories match “{query}”</div>
          ) : (
            <ul className="max-h-72 overflow-y-auto">
              {hits.map(({ project, story }) => (
                <li key={`${project.slug}:${story.id}`}>
                  <Link
                    href={`/projects/${project.slug}/kanban`}
                    onClick={() => {
                      setOpen(false);
                      setQuery("");
                    }}
                    className="flex items-start gap-2 px-3 py-2 hover:bg-muted/60 transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5 mt-0.5 text-muted-foreground shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium truncate">
                        {story.title || story.id}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-muted-foreground">
                        <span className="font-mono">{story.id}</span>
                        <span
                          className={`px-1 py-px rounded ${
                            story.status === "done"
                              ? "bg-green-50 text-green-600"
                              : story.status === "in-progress"
                              ? "bg-amber-50 text-amber-600"
                              : "bg-muted"
                          }`}
                        >
                          {story.status}
                        </span>
                      </div>
                    </div>
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground shrink-0">
                      <Columns3 className="w-3 h-3" />
                      {project.slug}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  GitBranch,
  Workflow,
  Map,
  BookOpen,
  Columns3,
  Brain,
  FolderOpen,
  Settings,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/setup", icon: Settings, label: "Setup" },
  { href: "/pipeline", icon: Workflow, label: "Pipeline" },
  { href: "/journey", icon: Map, label: "Journey" },
  { href: "/story-map", icon: Layers, label: "Story Map" },
  { href: "/kanban", icon: Columns3, label: "Kanban" },
  { href: "/intelligence", icon: Brain, label: "Intelligence" },
];

export function Sidebar() {
  const pathname = usePathname();
  const slug = pathname.split("/")[2] || "voxstyle";

  return (
    <aside className="w-56 border-r border-border bg-card flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="p-4 border-b border-border">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <FolderOpen className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg">PMOS</span>
        </Link>
      </div>

      {/* Project selector */}
      <div className="px-4 py-3 border-b border-border">
        <div className="text-xs text-muted-foreground mb-1">Project</div>
        <Link
          href={`/projects/${slug}`}
          className="text-sm font-medium hover:text-primary transition-colors"
        >
          {slug}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-0.5">
        {navItems.map((item) => {
          const href = `/projects/${slug}${item.href ? `/${item.href}` : ""}`;
          const isActive =
            item.href === ""
              ? pathname === `/projects/${slug}` || pathname === `/projects/${slug}/`
              : pathname.startsWith(href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                isActive
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-border">
        <Link
          href="/"
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <GitBranch className="w-3 h-3" />
          All Projects
        </Link>
      </div>
    </aside>
  );
}

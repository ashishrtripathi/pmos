// src/components/theme-toggle.tsx
// Theme toggle with localStorage persistence and system preference detection

"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("pmos-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialDark = stored ? stored === "dark" : prefersDark;

    setIsDark(initialDark);
    if (initialDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("pmos-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("pmos-theme", "light");
    }
  };

  if (!mounted) {
    return (
      <button
        type="button"
        className={`flex items-center gap-2 p-2 rounded-lg text-xs font-semibold text-muted-foreground hover:bg-muted transition-colors ${className}`}
        aria-label="Toggle theme"
      >
        <Sun className="w-4 h-4" />
        <span>Theme</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`flex items-center justify-between w-full px-3 py-2 rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-all border border-border/50 ${className}`}
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
    >
      <div className="flex items-center gap-2">
        {isDark ? (
          <Moon className="w-4 h-4 text-violet-400" />
        ) : (
          <Sun className="w-4 h-4 text-amber-500" />
        )}
        <span>{isDark ? "Dark Mode" : "Light Mode"}</span>
      </div>
      <span className="text-[10px] px-1.5 py-0.5 rounded bg-card border border-border font-mono">
        {isDark ? "ON" : "OFF"}
      </span>
    </button>
  );
}

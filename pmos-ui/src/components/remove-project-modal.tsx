"use client";

import { useState } from "react";
import { AlertTriangle, Trash2, Loader2, X, ShieldCheck } from "lucide-react";

interface RemoveProjectModalProps {
  slug: string;
  projectName?: string;
  isOpen: boolean;
  onClose: () => void;
  onRemoved?: () => void;
  redirectToHome?: boolean;
}

export function RemoveProjectModal({
  slug,
  projectName,
  isOpen,
  onClose,
  onRemoved,
  redirectToHome = false,
}: RemoveProjectModalProps) {
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const displayName = projectName || slug;

  const handleRemove = async () => {
    setRemoving(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${slug}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to remove project");
      }

      if (onRemoved) {
        onRemoved();
      }

      if (redirectToHome) {
        window.location.href = "/";
      } else {
        onClose();
      }
    } catch (err: any) {
      setError(err.message || "Failed to remove project");
      setRemoving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border shadow-xl rounded-2xl max-w-md w-full overflow-hidden animate-in fade-in-0 zoom-in-95">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 flex items-start justify-between border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-foreground">Remove Project</h3>
              <p className="text-xs text-muted-foreground font-mono">{slug}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={removing}
            className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-foreground">
            Are you sure you want to remove <strong className="text-foreground font-semibold">&ldquo;{displayName}&rdquo;</strong> from PMOS?
          </p>

          <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/40 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-800 dark:text-blue-300">
              <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Your Source Code is Safe</span>
            </div>
            <p className="text-xs text-blue-700/90 dark:text-blue-400">
              This only removes PMOS metadata (journeys, story maps, intelligence). Your original source files and GitHub repositories will <strong>not</strong> be deleted or modified.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-xl border border-destructive/30 bg-destructive/10 text-xs text-destructive">
              {error}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 py-4 bg-muted/40 border-t border-border flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={removing}
            className="px-4 py-2 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleRemove}
            disabled={removing}
            className="px-4 py-2 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
          >
            {removing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Removing...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Remove Project
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

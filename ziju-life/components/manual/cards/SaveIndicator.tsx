"use client";

import { Check, Loader2 } from "lucide-react";

export function SaveIndicator({ saving, saved }: { saving: boolean; saved: boolean }) {
  if (saving) {
    return (
      <span className="inline-flex items-center gap-1 text-lg text-foreground/30">
        <Loader2 size={11} className="animate-spin" /> Ukládám…
      </span>
    );
  }
  if (saved) {
    return (
      <span className="inline-flex items-center gap-1 text-lg text-green-600/70">
        <Check size={11} /> Uloženo
      </span>
    );
  }
  return null;
}

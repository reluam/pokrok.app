"use client";

import { useState } from "react";
import type { VisionData, IdealDayData } from "@/lib/exercise-registry";

const EMPTY: IdealDayData = {
  idealDay: "",
  savedAt: "",
};

export default function VizeFlow({
  initialData,
  onSave,
  onComplete,
}: {
  initialData: VisionData | IdealDayData | null;
  onSave: (data: IdealDayData) => Promise<void>;
  onComplete: () => void;
}) {
  const [text, setText] = useState(initialData?.idealDay ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    await onSave({ idealDay: text, savedAt: new Date().toISOString() });
    setSaving(false);
  }

  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <h2 className="text-xl font-bold text-foreground">🔭 Den v životě za 5 let</h2>
        <p className="text-base text-foreground/55 mt-1">
          Piš v přítomném čase. Buď konkrétní — kde žiješ, s kým se probouzíš, co děláš, jak se cítíš?
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-lg text-foreground/40">Minimálně 300 slov — čím konkrétnější, tím lépe</p>
          <span className={`text-lg font-bold ${wordCount >= 300 ? "text-green-500" : "text-foreground/30"}`}>
            {wordCount} slov
          </span>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={14}
          className="w-full px-5 py-4 border border-black/10 rounded-2xl text-base bg-white focus:ring-2 focus:ring-accent/20 focus:border-accent resize-none leading-relaxed"
          placeholder="Je rok 2031. Probouzím se v..."
        />
      </div>

      <button
        onClick={async () => { await save(); onComplete(); }}
        disabled={saving || !text.trim()}
        className="w-full py-2.5 bg-accent text-white rounded-full font-bold text-base hover:bg-accent-hover transition-colors disabled:opacity-60"
      >
        {saving ? "Ukládám…" : "Uložit vizi ✓"}
      </button>
    </div>
  );
}

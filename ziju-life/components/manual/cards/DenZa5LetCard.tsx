"use client";

import { useState, useCallback } from "react";
import { DashboardCard } from "./DashboardCard";
import { printExercise } from "@/lib/print-exercise";
import type { VisionData, IdealDayData } from "@/lib/exercise-registry";

export function DenZa5LetCard({
  data,
  saveContext,
}: {
  data: VisionData | IdealDayData | null;
  saveContext: (type: string, data: unknown) => Promise<void>;
}) {
  const idealDay = data?.idealDay ?? "";
  const isEmpty = !idealDay;

  const handlePrint = () => {
    printExercise({
      title: "Den za 5 let",
      sections: [{ text: idealDay }],
    });
  };

  return (
    <DashboardCard
      emoji="🔭"
      title="Den za 5 let"
      isEmpty={isEmpty}
      emptyDescription="Představ si svůj ideální den za 5 let. Tenhle obraz ti pomůže pochopit, kam vlastně chceš směřovat."
      editContent={<EditMode data={data} saveContext={saveContext} />}
      onPrint={isEmpty ? undefined : handlePrint}
    >
      <ViewMode text={idealDay} />
    </DashboardCard>
  );
}

function ViewMode({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const preview = text.slice(0, 200);
  const isLong = text.length > 200;

  return (
    <div className="space-y-2">
      <p className="text-sm text-foreground/60 leading-relaxed whitespace-pre-wrap">
        {expanded ? text : preview}{isLong && !expanded ? "…" : ""}
      </p>
      {isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-accent hover:opacity-80 transition-opacity"
        >
          {expanded ? "Méně" : "Celý text →"}
        </button>
      )}
      <p className="text-[10px] text-foreground/25">
        {text.split(/\s+/).filter(Boolean).length} slov
      </p>
    </div>
  );
}

function EditMode({
  data,
  saveContext,
}: {
  data: VisionData | IdealDayData | null;
  saveContext: (type: string, data: unknown) => Promise<void>;
}) {
  const [text, setText] = useState(data?.idealDay ?? "");
  const [saving, setSaving] = useState(false);

  const handleSave = useCallback(async () => {
    setSaving(true);
    const saveData: IdealDayData = { idealDay: text, savedAt: new Date().toISOString() };
    await saveContext("vision", saveData);
    setSaving(false);
  }, [text, saveContext]);

  const words = text.split(/\s+/).filter(Boolean).length;

  return (
    <div className="space-y-3">
      <p className="text-xs text-foreground/50">
        Popiš svůj ideální den za 5 let. Kde jsi, s kým, co děláš?
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Je rok 2031. Probouzím se..."
        rows={8}
        className="w-full text-sm rounded-xl border border-black/[0.08] bg-white/70 px-3 py-2 text-foreground/70 placeholder:text-foreground/25 resize-y focus:outline-none focus:border-black/20 transition-all"
      />
      <div className="flex items-center justify-between">
        <span className={`text-xs ${words >= 300 ? "text-green-600" : "text-foreground/30"}`}>
          {words} slov {words < 300 && "(doporučeno 300+)"}
        </span>
        <button
          onClick={handleSave}
          disabled={saving || !text.trim()}
          className="px-4 py-2 bg-accent text-white rounded-full text-sm font-bold hover:bg-accent-hover transition-colors disabled:opacity-50"
        >
          {saving ? "Ukládám…" : "Uložit ✓"}
        </button>
      </div>
    </div>
  );
}

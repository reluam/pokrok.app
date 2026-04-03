"use client";

import { useState, useCallback } from "react";
import { DashboardCard } from "./DashboardCard";
import { printExercise } from "@/lib/print-exercise";
import type { FuneralSpeechData } from "@/lib/exercise-registry";

const FIELDS = [
  { key: "rodina" as const, label: "Rodina", question: "Co by o tobě na pohřbu řekla tvoje rodina?" },
  { key: "blizci" as const, label: "Blízcí", question: "Co by řekli tvoji nejbližší přátelé?" },
  { key: "znami" as const, label: "Známí a kolegové", question: "Co by řekli známí, kolegové a komunita?" },
];

export function SmutecniRecCard({
  data,
  saveContext,
}: {
  data: FuneralSpeechData | null;
  saveContext: (type: string, data: unknown) => Promise<void>;
}) {
  const isEmpty = !data?.rodina && !data?.blizci && !data?.znami;

  const handlePrint = () => {
    const sections = FIELDS
      .filter((f) => data?.[f.key])
      .map((f) => ({ heading: f.label, text: data![f.key]! }));
    printExercise({ title: "Smuteční řeč", emoji: "🕯️", sections });
  };

  return (
    <DashboardCard
      emoji="🕯️"
      title="Smuteční řeč"
      isEmpty={isEmpty}
      emptyDescription="Co bys chtěl, aby o tobě jednou řekli? Tohle cvičení ti ukáže, na čem v životě opravdu záleží."
      editContent={<EditMode data={data} saveContext={saveContext} />}
      onPrint={isEmpty ? undefined : handlePrint}
    >
      <ViewMode data={data!} />
    </DashboardCard>
  );
}

function ViewMode({ data }: { data: FuneralSpeechData }) {
  return (
    <div className="space-y-3">
      {FIELDS.map((f) => {
        const text = data[f.key];
        if (!text) return null;
        return (
          <div key={f.key} className="space-y-0.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/30">{f.label}</p>
            <p className="text-sm text-foreground/60 leading-relaxed">
              {text.slice(0, 120)}{text.length > 120 ? "…" : ""}
            </p>
          </div>
        );
      })}
    </div>
  );
}

function EditMode({
  data,
  saveContext,
}: {
  data: FuneralSpeechData | null;
  saveContext: (type: string, data: unknown) => Promise<void>;
}) {
  const [form, setForm] = useState({
    rodina: data?.rodina ?? "",
    blizci: data?.blizci ?? "",
    znami: data?.znami ?? "",
  });
  const [saving, setSaving] = useState(false);

  const handleSave = useCallback(async () => {
    setSaving(true);
    await saveContext("funeral-speech", { ...form, savedAt: new Date().toISOString() });
    setSaving(false);
  }, [form, saveContext]);

  return (
    <div className="space-y-3">
      <div>
        <p className="text-xs font-bold text-foreground/70">Co bys chtěl, aby o tobě řekli?</p>
        <p className="text-[11px] text-foreground/40 mt-0.5 leading-relaxed">
          Představ si svůj pohřeb. Co by o tobě řekla rodina, blízcí přátelé a kolegové? Tohle cvičení ti ukáže, na čem ti v životě opravdu záleží.
        </p>
      </div>
      {FIELDS.map((f) => (
        <div key={f.key} className="space-y-1">
          <label className="text-xs font-medium text-foreground/50">{f.question}</label>
          <textarea
            value={form[f.key]}
            onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
            placeholder="Napiš sem..."
            rows={3}
            className="w-full text-sm rounded-xl border border-black/[0.08] bg-white/70 px-3 py-2 text-foreground/70 placeholder:text-foreground/25 resize-none focus:outline-none focus:border-black/20 transition-all"
          />
        </div>
      ))}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-2 bg-accent text-white rounded-full text-sm font-bold hover:bg-accent-hover transition-colors disabled:opacity-50"
      >
        {saving ? "Ukládám…" : "Uložit ✓"}
      </button>
    </div>
  );
}

"use client";

import { useState } from "react";
import { DashboardCard, useDashboardDone } from "./DashboardCard";
import { useAutoSave } from "./useAutoSave";
import { SaveIndicator } from "./SaveIndicator";
import { printExercise } from "@/lib/print-exercise";
import type { FuneralSpeechData } from "@/lib/exercise-registry";

const FIELDS = [
  { key: "rodina" as const, label: "Za co jsem vděčný/á", question: "Na co vzpomínám s vděčností? Co se mi v životě povedlo?" },
  { key: "blizci" as const, label: "Čeho lituji", question: "Co jsem neudělal/a a přál/a bych si, abych udělal/a? Čeho lituji?" },
  { key: "znami" as const, label: "Co chci, aby se ještě stalo", question: "Kdybych měl/a ještě šanci — co bych změnil/a? Co bych začal/a dělat?" },
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
    printExercise({ title: "Na smrtelné posteli", emoji: "🕯️", sections });
  };

  return (
    <DashboardCard
      emoji="🕯️"
      title="Na smrtelné posteli"
      isEmpty={isEmpty}
      emptyDescription="Představ si, že ležíš na smrtelné posteli a přemítáš nad životem. Na co vzpomínáš s vděčností? Čeho lituješ? Co chceš, aby se ještě stalo?"
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
            <p className="text-base font-semibold uppercase tracking-wider text-foreground/30">{f.label}</p>
            <p className="text-base text-foreground/60 leading-relaxed whitespace-pre-wrap">{text}</p>
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
  const done = useDashboardDone();
  const [form, setForm] = useState({
    rodina: data?.rodina ?? "",
    blizci: data?.blizci ?? "",
    znami: data?.znami ?? "",
  });

  const { saving, saved, flush } = useAutoSave(
    async () => { await saveContext("funeral-speech", { ...form, savedAt: new Date().toISOString() }); },
    [form.rodina, form.blizci, form.znami],
  );

  const handleDone = async () => { await flush(); done?.(); };

  return (
    <div className="space-y-3">
      <div>
        <p className="text-lg font-bold text-foreground/70">Na smrtelné posteli</p>
        <p className="text-lg text-foreground/40 mt-0.5 leading-relaxed">
          Ležíš na smrtelné posteli a přemítáš si celý svůj život. Co vidíš? Piš z pozice toho člověka na konci — co chceš a co nechceš, aby se stalo.
        </p>
      </div>
      {FIELDS.map((f) => (
        <div key={f.key} className="space-y-1">
          <label className="text-lg font-medium text-foreground/50">{f.question}</label>
          <textarea
            value={form[f.key]}
            onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
            placeholder="Napiš sem..."
            rows={3}
            className="w-full text-base rounded-xl border border-black/[0.08] bg-white/70 px-3 py-2 text-foreground/70 placeholder:text-foreground/25 resize-none focus:outline-none focus:border-black/20 transition-all"
          />
        </div>
      ))}
      <div className="flex items-center justify-between">
        <SaveIndicator saving={saving} saved={saved} />
        <button
          onClick={handleDone}
          className="px-4 py-2 bg-accent text-white rounded-full text-base font-bold hover:bg-accent-hover transition-colors"
        >
          Hotovo ✓
        </button>
      </div>
    </div>
  );
}

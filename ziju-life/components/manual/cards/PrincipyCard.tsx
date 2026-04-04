"use client";

import { useState, useCallback } from "react";
import { Plus, X } from "lucide-react";
import { DashboardCard, useDashboardDone } from "./DashboardCard";
import { useAutoSave } from "./useAutoSave";
import { SaveIndicator } from "./SaveIndicator";
import type { PrinciplesData } from "@/lib/exercise-registry";

const EXAMPLES: { text: string; origin: string }[] = [
  { text: "Nikdy nedělej důležité rozhodnutí ve stresu", origin: "Poučení — třikrát jsem se rozhodl pod tlakem a pokaždé litoval" },
  { text: "Raději řekni ne hned než ano a pak to nedodržíš", origin: "Poučení — říkal jsem ano všem a nedotahoval nic" },
  { text: "Ráno patří tobě, než se o tebe přihlásí svět", origin: "Osvědčený přístup — nejproduktivnější hodiny jsou ty první" },
  { text: "Nepředpokládej záměr — zeptej se", origin: "Poučení — většina konfliktů vznikla z domýšlení si" },
  { text: "Jednou týdně úplně vypni", origin: "Osvědčený přístup — bez pauzy se kreativita vyčerpá" },
];

export function PrincipyCard({
  data,
  saveContext,
}: {
  data: PrinciplesData | null;
  saveContext: (type: string, data: unknown) => Promise<void>;
}) {
  const filled = (data?.principles ?? []).filter(p => p.text);
  const isEmpty = filled.length === 0;

  return (
    <DashboardCard
      emoji="⚖️"
      title="Principy"
      isEmpty={isEmpty}
      emptyDescription="Principy jsou osvědčená řešení opakujících se situací. Vzešly z tvých chyb, zkušeností nebo intuice. Zapiš si je, ať je máš stále na očích."
      editContent={<EditMode data={data} saveContext={saveContext} />}
    >
      <ViewMode principles={filled} />
    </DashboardCard>
  );
}

function ViewMode({ principles }: { principles: { text: string; origin: string }[] }) {
  return (
    <div className="space-y-2">
      {principles.slice(0, 5).map((p, i) => (
        <div key={i} className="flex items-start gap-2">
          <span className="text-accent/40 font-bold text-lg mt-0.5 shrink-0">{i + 1}.</span>
          <div>
            <p className="text-base text-foreground/70 font-medium leading-relaxed">{p.text}</p>
            {p.origin && (
              <p className="text-lg text-foreground/35 leading-relaxed">{p.origin}</p>
            )}
          </div>
        </div>
      ))}
      {principles.length > 5 && (
        <p className="text-lg text-foreground/30">+ {principles.length - 5} dalších</p>
      )}
    </div>
  );
}

function EditMode({
  data,
  saveContext,
}: {
  data: PrinciplesData | null;
  saveContext: (type: string, data: unknown) => Promise<void>;
}) {
  const done = useDashboardDone();
  const [principles, setPrinciples] = useState<{ text: string; origin: string }[]>(
    data?.principles?.length ? data.principles : [{ text: "", origin: "" }]
  );
  const [showExamples, setShowExamples] = useState(false);

  const depsKey = JSON.stringify(principles);
  const { saving, saved, flush } = useAutoSave(
    async () => {
      const filtered = principles.filter(p => p.text.trim());
      await saveContext("principles", { principles: filtered, savedAt: new Date().toISOString() });
    },
    [depsKey],
  );

  const handleDone = async () => { await flush(); done?.(); };

  const addRow = () => setPrinciples(prev => [...prev, { text: "", origin: "" }]);
  const removeRow = (i: number) => setPrinciples(prev => prev.filter((_, idx) => idx !== i));
  const update = (i: number, field: "text" | "origin", value: string) => {
    setPrinciples(prev => prev.map((p, idx) => idx === i ? { ...p, [field]: value } : p));
  };

  const hasFilled = principles.some(p => p.text.trim());

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <p className="text-lg text-foreground/50 leading-relaxed">
          Principy jsou osvědčená řešení situací, které se opakují. Buď ses poučil/a z chyby, nebo to děláš odjakživa a funguje to. Zapiš si je, ať je máš stále na očích.
        </p>
      </div>

      <div className="space-y-3">
        {principles.map((p, i) => (
          <div key={i} className="space-y-1 p-3 rounded-xl bg-black/[0.02] border border-black/[0.05] relative group">
            {principles.length > 1 && (
              <button
                onClick={() => removeRow(i)}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-0.5 text-foreground/25 hover:text-red-500 transition-all"
              >
                <X size={13} />
              </button>
            )}
            <input
              value={p.text}
              onChange={(e) => update(i, "text", e.target.value)}
              placeholder={`Princip ${i + 1} — např. „Nikdy se nerozhoduj ve stresu"`}
              className="w-full text-base font-medium rounded-lg border border-black/[0.06] bg-white/80 px-3 py-2 text-foreground/70 placeholder:text-foreground/20 focus:outline-none focus:border-black/15 transition-all"
            />
            <input
              value={p.origin}
              onChange={(e) => update(i, "origin", e.target.value)}
              placeholder="Odkud vzešel? (poučení z chyby, osvědčený přístup...)"
              className="w-full text-lg rounded-lg border border-black/[0.04] bg-white/60 px-3 py-1.5 text-foreground/50 placeholder:text-foreground/15 focus:outline-none focus:border-black/10 transition-all"
            />
          </div>
        ))}
      </div>

      <button
        onClick={addRow}
        className="flex items-center gap-1.5 text-lg font-medium text-accent/60 hover:text-accent transition-colors"
      >
        <Plus size={14} /> Přidat princip
      </button>

      <button
        onClick={() => setShowExamples(!showExamples)}
        className="text-lg text-accent/70 hover:text-accent transition-colors"
      >
        {showExamples ? "Skrýt příklady" : "Ukázat příklady pro inspiraci →"}
      </button>

      {showExamples && (
        <div className="space-y-3 p-3 rounded-xl bg-accent/5 border border-accent/10">
          <p className="text-base font-bold text-accent/60 uppercase tracking-wider">Příklady principů</p>
          {EXAMPLES.map((ex, i) => (
            <div key={i} className="border-l-2 border-accent/20 pl-2.5 space-y-0.5">
              <p className="text-lg text-foreground/60 font-medium">{ex.text}</p>
              <p className="text-lg text-foreground/35 italic">{ex.origin}</p>
            </div>
          ))}
          <p className="text-lg text-foreground/40 pt-1 border-t border-accent/10">
            Pro hluboký ponor do tématu doporučujeme knihu <strong className="text-foreground/60">Principy</strong> od Raye Dalia.
          </p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <SaveIndicator saving={saving} saved={saved} />
        <div className="flex-1" />
        <button
          onClick={handleDone}
          disabled={!hasFilled}
          className="px-4 py-2 bg-accent text-white rounded-full text-base font-bold hover:bg-accent-hover transition-colors disabled:opacity-50"
        >
          Hotovo ✓
        </button>
      </div>
    </div>
  );
}

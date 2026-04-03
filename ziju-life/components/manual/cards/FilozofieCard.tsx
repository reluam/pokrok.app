"use client";

import { useState, useCallback } from "react";
import { DashboardCard, useDashboardDone } from "./DashboardCard";
import { useAutoSave } from "./useAutoSave";
import { SaveIndicator } from "./SaveIndicator";
import type { PhilosophyData } from "@/lib/exercise-registry";

const EXAMPLES = [
  "Je to člověk, který říká věci na rovinu, ale s respektem. Když něco slíbí, udělá to. Nebere se moc vážně, ale to, co dělá, bere vážně.",
  "Žije přítomností, ale ví kam míří. Najde si čas na lidi, na kterých mu záleží. Nehoní se za dokonalostí — hledá rovnováhu.",
  "Je zvědavý a nebojí se říct 'nevím'. Když spadne, vstane a jde dál. Inspiruje ostatní tím, jak žije, ne tím, co říká.",
];

export function FilozofieCard({
  data,
  saveContext,
}: {
  data: PhilosophyData | null;
  saveContext: (type: string, data: unknown) => Promise<void>;
}) {
  const isEmpty = !data?.statement;

  return (
    <DashboardCard
      emoji="🌱"
      title="Životní filozofie"
      isEmpty={isEmpty}
      emptyDescription="Jak bys chtěl, aby tě popsal dobrý známý? Popiš člověka, kterým chceš být — je to tvůj kompas pro velká i malá rozhodnutí."
      editContent={<EditMode data={data} saveContext={saveContext} />}
    >
      <ViewMode data={data!} />
    </DashboardCard>
  );
}

function ViewMode({ data }: { data: PhilosophyData }) {
  const [expanded, setExpanded] = useState(false);
  const text = data.statement;
  const preview = text.slice(0, 200);
  const isLong = text.length > 200;

  return (
    <div className="space-y-2">
      <p className="text-sm text-foreground/60 leading-relaxed italic">
        &ldquo;{expanded ? text : preview}{isLong && !expanded ? "…" : ""}&rdquo;
      </p>
      {isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-accent hover:opacity-80 transition-opacity"
        >
          {expanded ? "Méně" : "Celý text →"}
        </button>
      )}
    </div>
  );
}

function EditMode({
  data,
  saveContext,
}: {
  data: PhilosophyData | null;
  saveContext: (type: string, data: unknown) => Promise<void>;
}) {
  const done = useDashboardDone();
  const [statement, setStatement] = useState(data?.statement ?? "");
  const [showExamples, setShowExamples] = useState(false);

  const { saving, saved, flush } = useAutoSave(
    async () => {
      if (!statement.trim()) return;
      await saveContext("philosophy", { statement, principles: data?.principles ?? [], savedAt: new Date().toISOString() });
    },
    [statement],
  );

  const handleDone = async () => { await flush(); done?.(); };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <p className="text-xs text-foreground/50 leading-relaxed">
          Představ si, že se o tobě vyjadřuje tvůj dobrý známý. Jak bys chtěl, aby tě popsal? Jaký člověk chceš být?
        </p>
        <textarea
          value={statement}
          onChange={(e) => setStatement(e.target.value)}
          placeholder="Je to člověk, který..."
          rows={5}
          className="w-full text-sm rounded-xl border border-black/[0.08] bg-white/70 px-3 py-2 text-foreground/70 placeholder:text-foreground/25 resize-y focus:outline-none focus:border-black/20 transition-all"
        />
      </div>

      <button
        onClick={() => setShowExamples(!showExamples)}
        className="text-xs text-accent/70 hover:text-accent transition-colors"
      >
        {showExamples ? "Skrýt příklady" : "Ukázat příklady pro inspiraci →"}
      </button>

      {showExamples && (
        <div className="space-y-2 p-3 rounded-xl bg-accent/5 border border-accent/10">
          <p className="text-[10px] font-bold text-accent/60 uppercase tracking-wider">Příklady</p>
          {EXAMPLES.map((ex, i) => (
            <p key={i} className="text-xs text-foreground/50 leading-relaxed italic border-l-2 border-accent/20 pl-2.5">
              &ldquo;{ex}&rdquo;
            </p>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <SaveIndicator saving={saving} saved={saved} />
        <button
          onClick={handleDone}
          disabled={!statement.trim()}
          className="px-4 py-2 bg-accent text-white rounded-full text-sm font-bold hover:bg-accent-hover transition-colors disabled:opacity-50"
        >
          Hotovo ✓
        </button>
      </div>
    </div>
  );
}

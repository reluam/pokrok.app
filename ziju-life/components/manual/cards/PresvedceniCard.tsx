"use client";

import { useState, useCallback } from "react";
import { DashboardCard, useDashboardDone } from "./DashboardCard";
import { useAutoSave } from "./useAutoSave";
import { SaveIndicator } from "./SaveIndicator";
import type { BeliefsData } from "@/lib/exercise-registry";

type Belief = { area: string; belief: string; evidence: string; counter: string; reframe: string };
const EMPTY_BELIEF: Belief = { area: "", belief: "", evidence: "", counter: "", reframe: "" };

export function PresvedceniCard({
  data,
  saveContext,
}: {
  data: BeliefsData | null;
  saveContext: (type: string, data: unknown) => Promise<void>;
}) {
  const isEmpty = !data?.savedAt;

  return (
    <DashboardCard
      emoji="🧠"
      title="Přesvědčení"
      isEmpty={isEmpty}
      emptyDescription="Odhal myšlenky, které tě brzdí, a přeformuluj je. Často stačí malý posun v přemýšlení, aby se pohnuly velké věci."
      editContent={<EditMode data={data} saveContext={saveContext} />}
    >
      <ViewMode data={data!} />
    </DashboardCard>
  );
}

function ViewMode({ data }: { data: BeliefsData }) {
  const beliefs = (data.beliefs ?? []).filter((b) => b.belief);
  const reframed = beliefs.filter((b) => b.reframe).length;

  return (
    <div className="space-y-2">
      <p className="text-lg text-foreground/40">{reframed}/{beliefs.length} přeformulováno</p>
      {beliefs.map((b, i) => (
        <div key={i} className="space-y-0.5">
          <p className="text-base text-red-400 line-through">{b.belief}</p>
          {b.reframe && <p className="text-base text-green-600">{b.reframe}</p>}
        </div>
      ))}
    </div>
  );
}

function EditMode({
  data,
  saveContext,
}: {
  data: BeliefsData | null;
  saveContext: (type: string, data: unknown) => Promise<void>;
}) {
  const done = useDashboardDone();
  const [beliefs, setBeliefs] = useState<Belief[]>(
    data?.beliefs?.length ? [...data.beliefs] : [{ ...EMPTY_BELIEF }, { ...EMPTY_BELIEF }, { ...EMPTY_BELIEF }]
  );
  const [activeIdx, setActiveIdx] = useState(0);

  const b = beliefs[activeIdx] ?? EMPTY_BELIEF;

  const update = (field: keyof Belief, value: string) => {
    const next = [...beliefs];
    next[activeIdx] = { ...next[activeIdx], [field]: value };
    setBeliefs(next);
  };

  const depsKey = JSON.stringify(beliefs);
  const { saving, saved, flush } = useAutoSave(
    async () => { await saveContext("beliefs", { beliefs, savedAt: new Date().toISOString() }); },
    [depsKey],
  );

  const handleDone = async () => { await flush(); done?.(); };

  const addBelief = () => {
    setBeliefs((p) => [...p, { ...EMPTY_BELIEF }]);
    setActiveIdx(beliefs.length);
  };

  return (
    <div className="space-y-3">
      {/* Tabs */}
      <div className="flex gap-1 flex-wrap">
        {beliefs.map((_, i) => (
          <button
            key={i}
            onClick={() => setActiveIdx(i)}
            className="px-2.5 py-1 rounded-lg text-lg font-semibold transition-all"
            style={i === activeIdx
              ? { background: "#FF8C42", color: "white" }
              : { background: "rgba(0,0,0,0.05)", color: "rgba(0,0,0,0.4)" }
            }
          >
            {i + 1}
          </button>
        ))}
        <button onClick={addBelief} className="px-2 py-1 text-lg text-accent hover:opacity-80">+</button>
      </div>

      {/* Fields */}
      <div className="space-y-2">
        {[
          { field: "belief" as const, label: "Přesvědčení", placeholder: "Nikdy nebudu…" },
          { field: "evidence" as const, label: "Proč tomu věřím?", placeholder: "Jak jsem k tomu došel/la?" },
          { field: "counter" as const, label: "Kdy to neplatilo?", placeholder: "Kdy to nebyla pravda?" },
          { field: "reframe" as const, label: "Nové přesvědčení", placeholder: "Ve skutečnosti…" },
        ].map(({ field, label, placeholder }) => (
          <div key={field} className="space-y-0.5">
            <label className="text-base font-semibold text-foreground/50">{label}</label>
            <input
              type="text"
              value={b[field]}
              onChange={(e) => update(field, e.target.value)}
              placeholder={placeholder}
              className="w-full text-base rounded-xl border border-black/[0.08] bg-white/70 px-3 py-2 text-foreground/70 placeholder:text-foreground/25 focus:outline-none focus:border-black/20 transition-all"
            />
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <SaveIndicator saving={saving} saved={saved} />
        <div className="flex-1" />
        <button
          onClick={handleDone}
          className="px-4 py-2 bg-accent text-white rounded-full text-base font-bold disabled:opacity-50"
        >
          Hotovo ✓
        </button>
      </div>
    </div>
  );
}

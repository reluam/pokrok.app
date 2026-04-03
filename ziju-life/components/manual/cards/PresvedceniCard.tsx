"use client";

import { useState, useCallback } from "react";
import { DashboardCard } from "./DashboardCard";
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
      title="Limitující přesvědčení"
      isEmpty={isEmpty}
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
      <p className="text-xs text-foreground/40">{reframed}/{beliefs.length} přeformulováno</p>
      {beliefs.slice(0, 3).map((b, i) => (
        <div key={i} className="space-y-0.5">
          <p className="text-xs text-red-400 line-through">{b.belief}</p>
          {b.reframe && <p className="text-xs text-green-600">{b.reframe}</p>}
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
  const [beliefs, setBeliefs] = useState<Belief[]>(
    data?.beliefs?.length ? [...data.beliefs] : [{ ...EMPTY_BELIEF }, { ...EMPTY_BELIEF }, { ...EMPTY_BELIEF }]
  );
  const [activeIdx, setActiveIdx] = useState(0);
  const [saving, setSaving] = useState(false);

  const b = beliefs[activeIdx] ?? EMPTY_BELIEF;

  const update = (field: keyof Belief, value: string) => {
    const next = [...beliefs];
    next[activeIdx] = { ...next[activeIdx], [field]: value };
    setBeliefs(next);
  };

  const handleSave = useCallback(async () => {
    setSaving(true);
    await saveContext("beliefs", { beliefs, savedAt: new Date().toISOString() });
    setSaving(false);
  }, [beliefs, saveContext]);

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
            className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
            style={i === activeIdx
              ? { background: "#FF8C42", color: "white" }
              : { background: "rgba(0,0,0,0.05)", color: "rgba(0,0,0,0.4)" }
            }
          >
            {i + 1}
          </button>
        ))}
        <button onClick={addBelief} className="px-2 py-1 text-xs text-accent hover:opacity-80">+</button>
      </div>

      {/* Fields */}
      <div className="space-y-2">
        {[
          { field: "area" as const, label: "Oblast", placeholder: "Např. Kariéra" },
          { field: "belief" as const, label: "Přesvědčení", placeholder: "Já nikdy nebudu..." },
          { field: "evidence" as const, label: "Proč tomu věřím?", placeholder: "Důkazy pro..." },
          { field: "counter" as const, label: "Protidůkazy", placeholder: "Kdy to neplatilo?" },
          { field: "reframe" as const, label: "Přeformulace", placeholder: "Ve skutečnosti..." },
        ].map(({ field, label, placeholder }) => (
          <div key={field} className="space-y-0.5">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-foreground/30">{label}</label>
            <input
              type="text"
              value={b[field]}
              onChange={(e) => update(field, e.target.value)}
              placeholder={placeholder}
              className="w-full text-sm rounded-xl border border-black/[0.08] bg-white/70 px-3 py-2 text-foreground/70 placeholder:text-foreground/25 focus:outline-none focus:border-black/20 transition-all"
            />
          </div>
        ))}
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-2 bg-accent text-white rounded-full text-sm font-bold disabled:opacity-50"
      >
        {saving ? "Ukládám…" : "Uložit ✓"}
      </button>
    </div>
  );
}

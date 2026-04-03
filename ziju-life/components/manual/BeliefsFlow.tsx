"use client";

import { useState } from "react";
import { WHEEL_AREAS } from "./shared";

export type BeliefEntry = {
  area: string;
  belief: string;
  evidence: string;
  counter: string;
  reframe: string;
};

export type BeliefsData = {
  beliefs: BeliefEntry[];
  savedAt: string;
};

const EMPTY_BELIEF: BeliefEntry = { area: "", belief: "", evidence: "", counter: "", reframe: "" };

const EMPTY: BeliefsData = {
  beliefs: [{ ...EMPTY_BELIEF }, { ...EMPTY_BELIEF }, { ...EMPTY_BELIEF }],
  savedAt: "",
};

export default function BeliefsFlow({
  initialData,
  onSave,
  onComplete,
}: {
  initialData: BeliefsData | null;
  onSave: (data: BeliefsData) => Promise<void>;
  onComplete: () => void;
}) {
  const [data, setData] = useState<BeliefsData>(initialData ?? EMPTY);
  const [activeIdx, setActiveIdx] = useState(0);
  const [saving, setSaving] = useState(false);

  const belief = data.beliefs[activeIdx] ?? EMPTY_BELIEF;

  function updateBelief(field: keyof BeliefEntry, value: string) {
    const next = [...data.beliefs];
    next[activeIdx] = { ...next[activeIdx], [field]: value };
    setData((d) => ({ ...d, beliefs: next }));
  }

  function addBelief() {
    setData((d) => ({ ...d, beliefs: [...d.beliefs, { ...EMPTY_BELIEF }] }));
    setActiveIdx(data.beliefs.length);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">🧠 Limitující přesvědčení</h2>
        <p className="text-base text-foreground/55 mt-1">
          Za každou oblastí, kde se opakovaně nedaří, stojí přesvědčení, které to blokuje.
          Odhal ho, zpochybni a přeformuluj.
        </p>
      </div>

      {/* Belief tabs */}
      <div className="flex flex-wrap gap-2">
        {data.beliefs.map((b, i) => (
          <button
            key={i}
            onClick={() => setActiveIdx(i)}
            className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-all ${
              i === activeIdx
                ? "bg-accent text-white"
                : b.belief ? "bg-accent/10 text-accent" : "bg-foreground/5 text-foreground/40"
            }`}
          >
            {b.belief ? b.belief.slice(0, 20) + (b.belief.length > 20 ? "…" : "") : `Přesvědčení ${i + 1}`}
          </button>
        ))}
        <button onClick={addBelief} className="px-3 py-1.5 rounded-full text-sm font-semibold bg-foreground/5 text-foreground/40 hover:text-accent">
          + Přidat
        </button>
      </div>

      {/* Current belief form */}
      <div className="bg-white border border-black/8 rounded-[24px] px-5 py-5 space-y-4">
        {/* Area selector */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-foreground/50 uppercase tracking-wider">Oblast</label>
          <div className="flex flex-wrap gap-1.5">
            {WHEEL_AREAS.map((a) => (
              <button
                key={a.key}
                onClick={() => updateBelief("area", a.key)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  belief.area === a.key
                    ? "bg-accent text-white"
                    : "bg-foreground/5 text-foreground/50 hover:bg-accent/10 hover:text-accent"
                }`}
              >
                {a.short}
              </button>
            ))}
          </div>
        </div>

        {/* Belief */}
        <div className="space-y-1.5">
          <label className="text-base font-medium text-foreground/70">
            Co si v této oblasti o sobě říkáš? Jaký příběh si vyprávíš?
          </label>
          <textarea
            value={belief.belief}
            onChange={(e) => updateBelief("belief", e.target.value)}
            rows={2}
            className="w-full px-4 py-3 border border-black/10 rounded-2xl text-base bg-white focus:ring-2 focus:ring-accent/20 focus:border-accent resize-none"
            placeholder={'„Nejsem dost dobrý/á na…", „To pro mě není…"'}
          />
        </div>

        {/* Evidence */}
        <div className="space-y-1.5">
          <label className="text-base font-medium text-foreground/70">
            Jaké máš důkazy, že je to pravda?
          </label>
          <textarea
            value={belief.evidence}
            onChange={(e) => updateBelief("evidence", e.target.value)}
            rows={2}
            className="w-full px-4 py-3 border border-black/10 rounded-2xl text-base bg-white focus:ring-2 focus:ring-accent/20 focus:border-accent resize-none"
            placeholder="Důkazy pro toto přesvědčení..."
          />
        </div>

        {/* Counter-evidence */}
        <div className="space-y-1.5">
          <label className="text-base font-medium text-foreground/70">
            Jaké máš důkazy proti? Kdy to nebylo pravda?
          </label>
          <textarea
            value={belief.counter}
            onChange={(e) => updateBelief("counter", e.target.value)}
            rows={2}
            className="w-full px-4 py-3 border border-black/10 rounded-2xl text-base bg-white focus:ring-2 focus:ring-accent/20 focus:border-accent resize-none"
            placeholder="Naopak, jednou jsem…"
          />
        </div>

        {/* Reframe */}
        <div className="space-y-1.5">
          <label className="text-base font-medium text-foreground/70">
            Nové přesvědčení — co bys musel/a začít věřit?
          </label>
          <textarea
            value={belief.reframe}
            onChange={(e) => updateBelief("reframe", e.target.value)}
            rows={2}
            className="w-full px-4 py-3 border border-accent/20 rounded-2xl text-base bg-accent/[0.02] focus:ring-2 focus:ring-accent/20 focus:border-accent resize-none"
            placeholder={'Nové přesvědčení: „Jsem schopný/á…"'}
          />
        </div>
      </div>

      <button
        onClick={async () => {
          setSaving(true);
          await onSave({ ...data, savedAt: new Date().toISOString() });
          setSaving(false);
          onComplete();
        }}
        disabled={saving}
        className="w-full py-3 bg-accent text-white rounded-full font-bold text-base hover:bg-accent-hover transition-colors disabled:opacity-60 shadow-md"
      >
        {saving ? "Ukládám…" : "Uložit přesvědčení ✓"}
      </button>
    </div>
  );
}

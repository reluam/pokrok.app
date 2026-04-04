"use client";

import { useState } from "react";

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
  beliefs: [{ ...EMPTY_BELIEF }],
  savedAt: "",
};

const EXAMPLES = [
  { belief: "Nikdy nebudu dost dobrý/á", reframe: "Učím se a rostu — dokonalost není podmínka pro hodnotu." },
  { belief: "Nemůžu se změnit, takový/á prostě jsem", reframe: "Změna je proces — už jsem se měnil/a mnohokrát." },
  { belief: "Kdybych to zkusil/a, stejně bych selhal/a", reframe: "Neúspěch je zpětná vazba, ne verdikt." },
  { belief: "Ostatní to zvládají líp než já", reframe: "Srovnávám svůj vnitřek s cizí fasádou." },
  { belief: "Je na to už pozdě", reframe: "Včera byl nejlepší čas. Druhý nejlepší je dnes." },
  { belief: "Nejsem dost chytrý/á na to, abych...", reframe: "Inteligence se rozvíjí — záleží na snaze, ne na talentu." },
];

function ExamplesSection() {
  const [show, setShow] = useState(false);
  return (
    <>
      <button
        onClick={() => setShow(!show)}
        className="text-lg text-accent/70 hover:text-accent transition-colors"
      >
        {show ? "Skrýt příklady" : "Ukázat příklady pro inspiraci →"}
      </button>
      {show && (
        <div className="space-y-3 p-3 rounded-xl bg-accent/5 border border-accent/10">
          <p className="text-base font-bold text-accent/60 uppercase tracking-wider">Příklady</p>
          {EXAMPLES.map((ex, i) => (
            <div key={i} className="space-y-0.5">
              <p className="text-base text-red-400 line-through">{ex.belief}</p>
              <p className="text-base text-green-600">{ex.reframe}</p>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

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

  function removeBelief(idx: number) {
    if (data.beliefs.length <= 1) return;
    setData((d) => ({ ...d, beliefs: d.beliefs.filter((_, i) => i !== idx) }));
    setActiveIdx(Math.max(0, activeIdx >= idx ? activeIdx - 1 : activeIdx));
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Intro */}
      <div>
        <h2 className="text-xl font-bold text-foreground">🧠 Limitující přesvědčení</h2>
        <p className="text-base text-foreground/55 mt-2 leading-relaxed">
          Limitující přesvědčení jsou myšlenky, které máš o sobě, o světě nebo o svých možnostech —
          a které tě drží na místě. Vznikají z minulých zkušeností, z toho, co ti říkali druzí,
          nebo z neúspěchů, které sis zobecnil/a na celý život.
        </p>
        <p className="text-base text-foreground/55 mt-2 leading-relaxed">
          Problém není v tom, že existují — to je lidské. Problém je, když jim věříš, aniž bys je
          zpochybnil/a. Toto cvičení ti pomůže je najít, podívat se na ně z odstupu a přeformulovat
          je do něčeho, co ti víc pomáhá.
        </p>
      </div>

      {/* Belief tabs */}
      <div className="flex flex-wrap gap-2">
        {data.beliefs.map((b, i) => (
          <button
            key={i}
            onClick={() => setActiveIdx(i)}
            className={`px-3 py-1.5 rounded-full text-base font-semibold transition-all ${
              i === activeIdx
                ? "bg-accent text-white"
                : b.belief ? "bg-accent/10 text-accent" : "bg-foreground/5 text-foreground/40"
            }`}
          >
            {b.belief ? b.belief.slice(0, 20) + (b.belief.length > 20 ? "…" : "") : `Přesvědčení ${i + 1}`}
          </button>
        ))}
        <button onClick={addBelief} className="px-3 py-1.5 rounded-full text-base font-semibold bg-foreground/5 text-foreground/40 hover:text-accent">
          + Přidat
        </button>
      </div>

      {/* Current belief form */}
      <div className="bg-white border border-black/8 rounded-[24px] px-5 py-5 space-y-5">
        <div className="space-y-2">
          <div>
            <p className="text-base font-semibold text-foreground/70">Přesvědčení</p>
            <p className="text-lg text-foreground/40">Nikdy nebudu… Nemůžu… Nejsem schopný/á…</p>
          </div>
          <textarea
            value={belief.belief}
            onChange={(e) => updateBelief("belief", e.target.value)}
            rows={2}
            className="w-full px-4 py-3 border border-black/10 rounded-2xl text-base bg-white focus:ring-2 focus:ring-accent/20 focus:border-accent resize-none"
            placeholder="Nikdy nebudu dost dobrý/á na to, abych…"
          />
        </div>

        <div className="space-y-2">
          <div>
            <p className="text-base font-semibold text-foreground/70">Proč tomu věřím?</p>
            <p className="text-lg text-foreground/40">Jak jsem k tomu došel/la? Co se stalo?</p>
          </div>
          <textarea
            value={belief.evidence}
            onChange={(e) => updateBelief("evidence", e.target.value)}
            rows={2}
            className="w-full px-4 py-3 border border-black/10 rounded-2xl text-base bg-white focus:ring-2 focus:ring-accent/20 focus:border-accent resize-none"
            placeholder="Protože jednou jsem… / Vždycky mi říkali, že…"
          />
        </div>

        <div className="space-y-2">
          <div>
            <p className="text-base font-semibold text-foreground/70">Kdy to neplatilo?</p>
            <p className="text-lg text-foreground/40">Kdy to nebyla pravda? I malé příklady se počítají.</p>
          </div>
          <textarea
            value={belief.counter}
            onChange={(e) => updateBelief("counter", e.target.value)}
            rows={2}
            className="w-full px-4 py-3 border border-black/10 rounded-2xl text-base bg-white focus:ring-2 focus:ring-accent/20 focus:border-accent resize-none"
            placeholder="Ale jednou jsem přece… / Vlastně minulý rok…"
          />
        </div>

        <div className="space-y-2">
          <div>
            <p className="text-base font-semibold text-foreground/70">Nové přesvědčení</p>
            <p className="text-lg text-foreground/40">Ve skutečnosti…</p>
          </div>
          <textarea
            value={belief.reframe}
            onChange={(e) => updateBelief("reframe", e.target.value)}
            rows={2}
            className="w-full px-4 py-3 border border-accent/20 rounded-2xl text-base bg-accent/[0.02] focus:ring-2 focus:ring-accent/20 focus:border-accent resize-none"
            placeholder="Ve skutečnosti jsem schopný/á… / Můžu se to naučit…"
          />
        </div>

        {data.beliefs.length > 1 && (
          <button
            onClick={() => removeBelief(activeIdx)}
            className="text-lg text-red-400 hover:text-red-500 transition-colors"
          >
            Smazat toto přesvědčení
          </button>
        )}
      </div>

      {/* Examples - collapsible */}
      <ExamplesSection />

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

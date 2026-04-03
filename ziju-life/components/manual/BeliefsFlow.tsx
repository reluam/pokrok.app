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
  beliefs: [{ ...EMPTY_BELIEF }],
  savedAt: "",
};

const EXAMPLE_BELIEFS = [
  "Nejsem dost dobrý/á na to, abych...",
  "Nemám na to talent / schopnosti",
  "Lidé jako já to nedokážou",
  "Je na to už pozdě",
  "Kdybych to zkusil/a, selžu",
];

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
        <h2 className="text-xl font-bold text-foreground">🧠 Přesvědčení</h2>
        <p className="text-base text-foreground/55 mt-2 leading-relaxed">
          Každý máme v hlavě příběhy, které si vyprávíme — o sobě, o světě, o tom, co je a není možné.
          Některé nám pomáhají, ale jiné nás drží na místě. Tady je najdeš a podíváš se na ně z jiného úhlu.
        </p>
      </div>

      {/* How it works */}
      <div className="bg-accent/[0.04] border border-accent/10 rounded-2xl px-5 py-4 space-y-3">
        <p className="text-base font-semibold text-foreground/70">Jak to funguje?</p>
        <ol className="list-decimal list-inside space-y-1.5 text-base text-foreground/55 leading-relaxed">
          <li><strong>Najdi oblast</strong> — kde se ti nedaří tak, jak bys chtěl/a?</li>
          <li><strong>Pojmenuj příběh</strong> — co si v té oblasti o sobě říkáš?</li>
          <li><strong>Hledej důkazy</strong> — je to opravdu pravda? Vždycky?</li>
          <li><strong>Přeformuluj</strong> — jaký příběh by ti víc pomáhal?</li>
        </ol>
        <p className="text-lg text-foreground/40 italic">
          Příklady: {EXAMPLE_BELIEFS.slice(0, 3).map((e, i) => <span key={i}>{i > 0 && " · "}<em>„{e}"</em></span>)}
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
        {/* Step 1: Area */}
        <div className="space-y-2">
          <div>
            <p className="text-base font-semibold text-foreground/70">1. V jaké oblasti to cítíš?</p>
            <p className="text-lg text-foreground/40">Vyber životní oblast, kde tě přesvědčení brzdí.</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {WHEEL_AREAS.map((a) => (
              <button
                key={a.key}
                onClick={() => updateBelief("area", a.key)}
                className={`px-3 py-1.5 rounded-full text-base font-medium transition-all ${
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

        {/* Step 2: Belief */}
        <div className="space-y-2">
          <div>
            <p className="text-base font-semibold text-foreground/70">2. Co si říkáš?</p>
            <p className="text-lg text-foreground/40">
              Jaký příběh si v této oblasti vyprávíš? Co ti automaticky naskočí v hlavě, když se do toho pustíš?
            </p>
          </div>
          <textarea
            value={belief.belief}
            onChange={(e) => updateBelief("belief", e.target.value)}
            rows={2}
            className="w-full px-4 py-3 border border-black/10 rounded-2xl text-base bg-white focus:ring-2 focus:ring-accent/20 focus:border-accent resize-none"
            placeholder={'Např. „Nejsem dost dobrý/á na…", „To pro mě není…", „Nemůžu, protože…"'}
          />
        </div>

        {/* Step 3: Evidence */}
        <div className="space-y-2">
          <div>
            <p className="text-base font-semibold text-foreground/70">3. Proč si to myslíš?</p>
            <p className="text-lg text-foreground/40">
              Jaké máš „důkazy"? Co se stalo, že sis to začal/a myslet? Odkud ten příběh pochází?
            </p>
          </div>
          <textarea
            value={belief.evidence}
            onChange={(e) => updateBelief("evidence", e.target.value)}
            rows={2}
            className="w-full px-4 py-3 border border-black/10 rounded-2xl text-base bg-white focus:ring-2 focus:ring-accent/20 focus:border-accent resize-none"
            placeholder="Protože jednou jsem… / Vždycky mi říkali, že… / Když jsem zkusil/a…"
          />
        </div>

        {/* Step 4: Counter-evidence */}
        <div className="space-y-2">
          <div>
            <p className="text-base font-semibold text-foreground/70">4. Kdy to nebyla pravda?</p>
            <p className="text-lg text-foreground/40">
              Vzpomeň si na situaci, kdy ses zachoval/a jinak. Kdy to šlo? Kdy jsi to zvládl/a? I malé příklady se počítají.
            </p>
          </div>
          <textarea
            value={belief.counter}
            onChange={(e) => updateBelief("counter", e.target.value)}
            rows={2}
            className="w-full px-4 py-3 border border-black/10 rounded-2xl text-base bg-white focus:ring-2 focus:ring-accent/20 focus:border-accent resize-none"
            placeholder="Ale jednou jsem přece… / V roce… se mi povedlo… / Vlastně…"
          />
        </div>

        {/* Step 5: Reframe */}
        <div className="space-y-2">
          <div>
            <p className="text-base font-semibold text-foreground/70">5. Nový příběh</p>
            <p className="text-lg text-foreground/40">
              Kdyby sis mohl/a vybrat, co bys chtěl/a místo toho věřit? Nemusí to být přehnaný optimismus — stačí pravdivější verze.
            </p>
          </div>
          <textarea
            value={belief.reframe}
            onChange={(e) => updateBelief("reframe", e.target.value)}
            rows={2}
            className="w-full px-4 py-3 border border-accent/20 rounded-2xl text-base bg-accent/[0.02] focus:ring-2 focus:ring-accent/20 focus:border-accent resize-none"
            placeholder={'Např. „Ještě jsem to nezkoušel/a dost dlouho", „Můžu se to naučit"'}
          />
        </div>

        {/* Remove belief */}
        {data.beliefs.length > 1 && (
          <button
            onClick={() => removeBelief(activeIdx)}
            className="text-lg text-red-400 hover:text-red-500 transition-colors"
          >
            Smazat toto přesvědčení
          </button>
        )}
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

"use client";

import { useState } from "react";
import type { PhilosophyData } from "@/lib/exercise-registry";

const EMPTY: PhilosophyData = { statement: "", principles: ["", "", "", "", ""], savedAt: "" };

const EXAMPLES = [
  "Žiji vědomě, s odvahou a laskavostí. Vybírám si vztahy, které mě obohacují, a práci, která má smysl.",
  "Svoboda a růst jsou moje priority. Každý den je příležitost být o kousek lepší než včera.",
  "Žiji jednoduše, upřímně a v souladu se svými hodnotami. Nebojím se být zranitelný/á.",
];

export default function FilozofieFlow({
  initialData,
  onSave,
  onComplete,
}: {
  initialData: PhilosophyData | null;
  onSave: (data: PhilosophyData) => Promise<void>;
  onComplete: () => void;
}) {
  const [data, setData] = useState<PhilosophyData>(initialData ?? EMPTY);
  const [saving, setSaving] = useState(false);
  const [showExamples, setShowExamples] = useState(false);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">🌱 Životní filozofie</h2>
        <p className="text-sm text-foreground/55 mt-1">
          Napiš 2–5 vět, které vystihují, jak chceš žít. Neboj se přepisovat — tohle se bude vyvíjet.
        </p>
      </div>

      {/* Examples toggle */}
      <button
        onClick={() => setShowExamples(!showExamples)}
        className="text-xs text-accent font-semibold hover:underline"
      >
        {showExamples ? "Skrýt příklady" : "Ukázat příklady pro inspiraci"}
      </button>

      {showExamples && (
        <div className="space-y-2">
          {EXAMPLES.map((ex, i) => (
            <div key={i} className="px-4 py-3 rounded-2xl bg-accent/5 border border-accent/10">
              <p className="text-sm text-foreground/60 italic">„{ex}"</p>
            </div>
          ))}
        </div>
      )}

      {/* Statement */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-foreground">Moje životní filozofie</label>
        <textarea
          value={data.statement}
          onChange={(e) => setData((d) => ({ ...d, statement: e.target.value }))}
          rows={5}
          className="w-full px-5 py-4 border border-black/10 rounded-2xl text-sm bg-white focus:ring-2 focus:ring-accent/20 focus:border-accent resize-none leading-relaxed"
          placeholder="Žiji..."
        />
      </div>

      {/* Optional principles */}
      <div className="space-y-3">
        <label className="text-sm font-semibold text-foreground">Hlavní principy <span className="text-foreground/40 font-normal">(volitelné)</span></label>
        <p className="text-xs text-foreground/40">3–5 principů, podle kterých se chceš řídit.</p>
        {data.principles.map((p, i) => (
          <input
            key={i}
            value={p}
            onChange={(e) => {
              const next = [...data.principles];
              next[i] = e.target.value;
              setData((d) => ({ ...d, principles: next }));
            }}
            className="w-full px-4 py-2.5 border border-black/10 rounded-xl text-sm bg-white focus:ring-2 focus:ring-accent/20 focus:border-accent"
            placeholder={`Princip ${i + 1}...`}
          />
        ))}
      </div>

      <button
        onClick={async () => {
          setSaving(true);
          await onSave({ ...data, savedAt: new Date().toISOString() });
          setSaving(false);
          onComplete();
        }}
        disabled={saving || !data.statement.trim()}
        className="w-full py-3 bg-accent text-white rounded-full font-bold text-sm hover:bg-accent-hover transition-colors disabled:opacity-60 shadow-md"
      >
        {saving ? "Ukládám…" : "Uložit filozofii ✓"}
      </button>
    </div>
  );
}

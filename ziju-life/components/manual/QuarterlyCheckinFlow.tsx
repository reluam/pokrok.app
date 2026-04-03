"use client";

import { useState } from "react";
import { WHEEL_AREAS } from "./shared";
import { InteractiveSpider } from "./charts/SpiderChart";
import type { KompasData } from "@/components/KompasFlow";
import type { QuarterlyCheckinData } from "@/lib/exercise-registry";

type Step = "celebrate" | "learn" | "adjust" | "rerate";

function getCurrentQuarter(): string {
  const now = new Date();
  const q = Math.ceil((now.getMonth() + 1) / 3);
  return `${now.getFullYear()}-Q${q}`;
}

const EMPTY: QuarterlyCheckinData = {
  quarter: getCurrentQuarter(),
  celebrations: ["", "", "", "", ""],
  learnings: ["", "", ""],
  adjustments: ["", "", ""],
  areaScores: Object.fromEntries(WHEEL_AREAS.map((a) => [a.key, 5])),
  updatedAt: "",
};

export default function QuarterlyCheckinFlow({
  initialData,
  kompasData,
  onSave,
  onComplete,
}: {
  initialData: QuarterlyCheckinData | null;
  kompasData: KompasData | null;
  onSave: (data: QuarterlyCheckinData) => Promise<void>;
  onComplete: () => void;
}) {
  const [data, setData] = useState<QuarterlyCheckinData>(() => {
    if (initialData) return initialData;
    // Pre-fill area scores from kompas if available
    const scores = kompasData?.currentVals
      ? { ...EMPTY.areaScores, ...kompasData.currentVals }
      : EMPTY.areaScores;
    return { ...EMPTY, areaScores: scores };
  });
  const [step, setStep] = useState<Step>("celebrate");
  const [saving, setSaving] = useState(false);

  // ── Step 1: Celebrate ──
  if (step === "celebrate") {
    return (
      <div className="max-w-2xl mx-auto space-y-5">
        <div>
          <h2 className="text-xl font-bold text-foreground">🎉 Oslav nejdřív</h2>
          <p className="text-sm text-foreground/55 mt-1">
            Napiš 5 věcí, které se ti za poslední 3 měsíce povedlo — malé i velké. Pokrok před analýzou mezer.
          </p>
        </div>

        <div className="space-y-3">
          {data.celebrations.map((c, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-lg">🌟</span>
              <input
                value={c}
                onChange={(e) => {
                  const next = [...data.celebrations];
                  next[i] = e.target.value;
                  setData((d) => ({ ...d, celebrations: next }));
                }}
                className="flex-1 px-4 py-2.5 border border-black/10 rounded-xl text-sm bg-white focus:ring-2 focus:ring-accent/20 focus:border-accent"
                placeholder={`Co se mi povedlo ${i + 1}...`}
              />
            </div>
          ))}
        </div>

        <button
          onClick={() => setStep("learn")}
          className="w-full py-2.5 bg-accent text-white rounded-full font-bold text-sm hover:bg-accent-hover transition-colors"
        >
          Dál — co ses naučil/a →
        </button>
      </div>
    );
  }

  // ── Step 2: Learnings ──
  if (step === "learn") {
    return (
      <div className="max-w-2xl mx-auto space-y-5">
        <div>
          <h2 className="text-xl font-bold text-foreground">📈 Co ses naučil/a o sobě?</h2>
          <p className="text-sm text-foreground/55 mt-1">
            Co se změnilo za poslední 3 měsíce — v okolnostech, myšlení, chování?
          </p>
        </div>

        <div className="space-y-3">
          {data.learnings.map((l, i) => (
            <textarea
              key={i}
              value={l}
              onChange={(e) => {
                const next = [...data.learnings];
                next[i] = e.target.value;
                setData((d) => ({ ...d, learnings: next }));
              }}
              rows={2}
              className="w-full px-4 py-3 border border-black/10 rounded-2xl text-sm bg-white focus:ring-2 focus:ring-accent/20 focus:border-accent resize-none"
              placeholder={`Naučil/a jsem se, že ${i + 1}...`}
            />
          ))}
        </div>

        <div className="flex gap-2">
          <button onClick={() => setStep("celebrate")} className="flex-1 py-2.5 border border-foreground/15 text-foreground/60 rounded-full font-semibold text-sm">
            ← Zpět
          </button>
          <button onClick={() => setStep("adjust")} className="flex-1 py-2.5 bg-accent text-white rounded-full font-bold text-sm hover:bg-accent-hover transition-colors">
            Dál — co jinak →
          </button>
        </div>
      </div>
    );
  }

  // ── Step 3: Adjustments ──
  if (step === "adjust") {
    return (
      <div className="max-w-2xl mx-auto space-y-5">
        <div>
          <h2 className="text-xl font-bold text-foreground">🔄 Co chceš příště jinak?</h2>
          <p className="text-sm text-foreground/55 mt-1">
            Na co se chceš v dalším čtvrtletí zaměřit?
          </p>
        </div>

        <div className="space-y-3">
          {data.adjustments.map((a, i) => (
            <textarea
              key={i}
              value={a}
              onChange={(e) => {
                const next = [...data.adjustments];
                next[i] = e.target.value;
                setData((d) => ({ ...d, adjustments: next }));
              }}
              rows={2}
              className="w-full px-4 py-3 border border-black/10 rounded-2xl text-sm bg-white focus:ring-2 focus:ring-accent/20 focus:border-accent resize-none"
              placeholder={`Příště chci ${i + 1}...`}
            />
          ))}
        </div>

        <div className="flex gap-2">
          <button onClick={() => setStep("learn")} className="flex-1 py-2.5 border border-foreground/15 text-foreground/60 rounded-full font-semibold text-sm">
            ← Zpět
          </button>
          <button onClick={() => setStep("rerate")} className="flex-1 py-2.5 bg-accent text-white rounded-full font-bold text-sm hover:bg-accent-hover transition-colors">
            Dál — přehodnoť oblasti →
          </button>
        </div>
      </div>
    );
  }

  // ── Step 4: Re-rate areas ──
  if (step === "rerate") {
    return (
      <div className="max-w-2xl mx-auto space-y-5">
        <div>
          <h2 className="text-xl font-bold text-foreground">🧭 Přehodnoť oblasti</h2>
          <p className="text-sm text-foreground/55 mt-1">
            Klikni na pavouka — aktualizuj hodnocení oblastí za toto čtvrtletí.
            {kompasData?.currentVals && " Přerušovaná čára = poslední kompas."}
          </p>
        </div>

        <div className="flex justify-center">
          <InteractiveSpider
            vals={data.areaScores}
            prevVals={kompasData?.currentVals}
            onChange={(key, score) => setData((d) => ({ ...d, areaScores: { ...d.areaScores, [key]: score } }))}
            size={280}
          />
        </div>

        <div className="flex gap-2">
          <button onClick={() => setStep("adjust")} className="flex-1 py-2.5 border border-foreground/15 text-foreground/60 rounded-full font-semibold text-sm">
            ← Zpět
          </button>
          <button
            onClick={async () => {
              setSaving(true);
              await onSave({ ...data, updatedAt: new Date().toISOString() });
              setSaving(false);
              onComplete();
            }}
            disabled={saving}
            className="flex-1 py-2.5 bg-accent text-white rounded-full font-bold text-sm hover:bg-accent-hover transition-colors disabled:opacity-60"
          >
            {saving ? "Ukládám…" : "Uložit check-in ✓"}
          </button>
        </div>
      </div>
    );
  }

  return null;
}

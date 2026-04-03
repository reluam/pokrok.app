"use client";

import { useState } from "react";
import type { VisionData } from "@/lib/exercise-registry";

type Step = "idealDay" | "eightyBirthday" | "bodyCheck" | "done";

const EMPTY: VisionData = {
  idealDay: "",
  eightyBirthday: { partner: "", children: "", colleagues: "" },
  bodyCheck: { energy: "", tension: "", adjustments: "" },
  savedAt: "",
};

export default function VizeFlow({
  initialData,
  onSave,
  onComplete,
}: {
  initialData: VisionData | null;
  onSave: (data: VisionData) => Promise<void>;
  onComplete: () => void;
}) {
  const [data, setData] = useState<VisionData>(initialData ?? EMPTY);
  const [step, setStep] = useState<Step>("idealDay");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    await onSave({ ...data, savedAt: new Date().toISOString() });
    setSaving(false);
  }

  // ── Step 1: Ideální den za 5 let ──
  if (step === "idealDay") {
    const wordCount = data.idealDay.trim().split(/\s+/).filter(Boolean).length;
    return (
      <div className="max-w-2xl mx-auto space-y-5">
        <div>
          <h2 className="text-xl font-bold text-foreground">🔭 Den v životě za 5 let</h2>
          <p className="text-sm text-foreground/55 mt-1">
            Piš v přítomném čase. Buď konkrétní — kde žiješ, s kým se probouzíš, co děláš, jak se cítíš?
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs text-foreground/40">Minimálně 300 slov — čím konkrétnější, tím lépe</p>
            <span className={`text-xs font-bold ${wordCount >= 300 ? "text-green-500" : "text-foreground/30"}`}>
              {wordCount} slov
            </span>
          </div>
          <textarea
            value={data.idealDay}
            onChange={(e) => setData((d) => ({ ...d, idealDay: e.target.value }))}
            rows={14}
            className="w-full px-5 py-4 border border-black/10 rounded-2xl text-sm bg-white focus:ring-2 focus:ring-accent/20 focus:border-accent resize-none leading-relaxed"
            placeholder="Je rok 2031. Probouzím se v..."
          />
        </div>

        <button
          onClick={() => setStep("eightyBirthday")}
          className="w-full py-2.5 bg-accent text-white rounded-full font-bold text-sm hover:bg-accent-hover transition-colors"
        >
          Dál — 80. narozeniny →
        </button>
      </div>
    );
  }

  // ── Step 2: 80. narozeniny ──
  if (step === "eightyBirthday") {
    const fields: { key: keyof VisionData["eightyBirthday"]; label: string; placeholder: string }[] = [
      { key: "partner", label: "Co by o tobě řekl/a tvůj partner/ka nebo nejbližší přítel/kyně?", placeholder: "Řekl/a by, že..." },
      { key: "children", label: "Co by o tobě řekly tvoje děti nebo lidé, které jsi mentoroval/a?", placeholder: "Řekli by, že..." },
      { key: "colleagues", label: "Co by o tobě řekli kolegové nebo komunita?", placeholder: "Řekli by, že..." },
    ];

    return (
      <div className="max-w-2xl mx-auto space-y-5">
        <div>
          <h2 className="text-xl font-bold text-foreground">🎂 80. narozeniny</h2>
          <p className="text-sm text-foreground/55 mt-1">
            Představ si, že slavíš 80. narozeniny. V místnosti jsou tvoji nejbližší. Co by o tobě řekli?
          </p>
        </div>

        <div className="space-y-4">
          {fields.map((f) => (
            <div key={f.key} className="space-y-1.5">
              <label className="text-sm font-medium text-foreground/70">{f.label}</label>
              <textarea
                value={data.eightyBirthday[f.key]}
                onChange={(e) => setData((d) => ({
                  ...d,
                  eightyBirthday: { ...d.eightyBirthday, [f.key]: e.target.value },
                }))}
                rows={3}
                className="w-full px-4 py-3 border border-black/10 rounded-2xl text-sm bg-white focus:ring-2 focus:ring-accent/20 focus:border-accent resize-none"
                placeholder={f.placeholder}
              />
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <button onClick={() => setStep("idealDay")} className="flex-1 py-2.5 border border-foreground/15 text-foreground/60 rounded-full font-semibold text-sm">
            ← Zpět
          </button>
          <button onClick={() => setStep("bodyCheck")} className="flex-1 py-2.5 bg-accent text-white rounded-full font-bold text-sm hover:bg-accent-hover transition-colors">
            Dál — tělesná zkouška →
          </button>
        </div>
      </div>
    );
  }

  // ── Step 3: Tělesná zkouška ──
  if (step === "bodyCheck") {
    const fields: { key: keyof VisionData["bodyCheck"]; label: string; placeholder: string }[] = [
      { key: "energy", label: "Kde jsi cítil/a otevření, lehkost nebo vzrušení?", placeholder: "Cítil/a jsem energii, když..." },
      { key: "tension", label: "Kde jsi cítil/a stažení, váhavost nebo napětí?", placeholder: "Napětí jsem cítil/a u..." },
      { key: "adjustments", label: "Co chceš na základě této zpětné vazby upravit ve své vizi?", placeholder: "Chci posílit... a vypustit..." },
    ];

    return (
      <div className="max-w-2xl mx-auto space-y-5">
        <div>
          <h2 className="text-xl font-bold text-foreground">🧘 Tělesná zkouška</h2>
          <p className="text-sm text-foreground/55 mt-1">
            Přečti si svou vizi nahlas. Po každé části se zastav — co cítíš v těle? Tělo ví, co mozek popírá.
          </p>
        </div>

        <div className="space-y-4">
          {fields.map((f) => (
            <div key={f.key} className="space-y-1.5">
              <label className="text-sm font-medium text-foreground/70">{f.label}</label>
              <textarea
                value={data.bodyCheck[f.key]}
                onChange={(e) => setData((d) => ({
                  ...d,
                  bodyCheck: { ...d.bodyCheck, [f.key]: e.target.value },
                }))}
                rows={3}
                className="w-full px-4 py-3 border border-black/10 rounded-2xl text-sm bg-white focus:ring-2 focus:ring-accent/20 focus:border-accent resize-none"
                placeholder={f.placeholder}
              />
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <button onClick={() => setStep("eightyBirthday")} className="flex-1 py-2.5 border border-foreground/15 text-foreground/60 rounded-full font-semibold text-sm">
            ← Zpět
          </button>
          <button
            onClick={async () => { await save(); onComplete(); }}
            disabled={saving}
            className="flex-1 py-2.5 bg-accent text-white rounded-full font-bold text-sm hover:bg-accent-hover transition-colors disabled:opacity-60"
          >
            {saving ? "Ukládám…" : "Uložit vizi ✓"}
          </button>
        </div>
      </div>
    );
  }

  return null;
}

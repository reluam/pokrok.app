"use client";

import { useState } from "react";

export type IkigaiData = {
  love: string[];
  goodAt: string[];
  worldNeeds: string[];
  paidFor: string[];
  reflections: { passion: string; mission: string; profession: string; vocation: string; ikigai: string };
  savedAt: string;
};

type Step = "love" | "goodAt" | "worldNeeds" | "paidFor" | "reflect" | "done";

const EMPTY: IkigaiData = {
  love: ["", "", "", "", ""],
  goodAt: ["", "", "", "", ""],
  worldNeeds: ["", "", "", "", ""],
  paidFor: ["", "", "", "", ""],
  reflections: { passion: "", mission: "", profession: "", vocation: "", ikigai: "" },
  savedAt: "",
};

const STEPS: { id: Step; emoji: string; title: string; description: string; field: keyof Pick<IkigaiData, "love" | "goodAt" | "worldNeeds" | "paidFor">; placeholder: string }[] = [
  { id: "love", emoji: "❤️", title: "Co miluješ?", description: "Co tě baví dělat, i kdyby tě za to nikdo neplatil? Co bys dělal/a v sobotu ráno, kdyby ses nemusel/a starat o peníze?", field: "love", placeholder: "Miluji..." },
  { id: "goodAt", emoji: "💪", title: "V čem jsi dobrý/á?", description: "Co ti jde přirozeně? Na co se tě lidé ptají, co obdivují, za co tě chválí?", field: "goodAt", placeholder: "Jsem dobrý/á v..." },
  { id: "worldNeeds", emoji: "🌍", title: "Co svět potřebuje?", description: "Jaké problémy vidíš kolem sebe? Co by se dalo vylepšit? Co tě bolí, že nefunguje?", field: "worldNeeds", placeholder: "Svět potřebuje..." },
  { id: "paidFor", emoji: "💰", title: "Za co tě zaplatí?", description: "Za které dovednosti nebo služby jsou lidé ochotni platit? Co vytváří hodnotu na trhu?", field: "paidFor", placeholder: "Platí mi za..." },
];

const INTERSECTIONS: { key: keyof IkigaiData["reflections"]; label: string; desc: string; emoji: string }[] = [
  { key: "passion", label: "Vášeň", desc: "Co miluješ + v čem jsi dobrý/á", emoji: "🔥" },
  { key: "mission", label: "Mise", desc: "Co miluješ + co svět potřebuje", emoji: "🎯" },
  { key: "profession", label: "Profese", desc: "V čem jsi dobrý/á + za co tě zaplatí", emoji: "💼" },
  { key: "vocation", label: "Povolání", desc: "Co svět potřebuje + za co tě zaplatí", emoji: "🏗️" },
  { key: "ikigai", label: "Tvoje Ikigai", desc: "Průsečík všech čtyř oblastí", emoji: "☀️" },
];

export default function IkigaiFlow({
  initialData,
  onSave,
  onComplete,
}: {
  initialData: IkigaiData | null;
  onSave: (data: IkigaiData) => Promise<void>;
  onComplete: () => void;
}) {
  const [data, setData] = useState<IkigaiData>(initialData ?? EMPTY);
  const [step, setStep] = useState<Step>("love");
  const [saving, setSaving] = useState(false);

  const stepIdx = STEPS.findIndex((s) => s.id === step);
  const currentStep = STEPS[stepIdx];

  // Input steps (love, goodAt, worldNeeds, paidFor)
  if (currentStep) {
    const items = data[currentStep.field];
    return (
      <div className="max-w-2xl mx-auto space-y-5">
        <div>
          <h2 className="text-xl font-bold text-foreground">{currentStep.emoji} {currentStep.title}</h2>
          <p className="text-base text-foreground/55 mt-1">{currentStep.description}</p>
        </div>

        <div className="space-y-3">
          {items.map((item, i) => (
            <input
              key={i}
              value={item}
              onChange={(e) => {
                const next = [...items];
                next[i] = e.target.value;
                setData((d) => ({ ...d, [currentStep.field]: next }));
              }}
              className="w-full px-4 py-2.5 border border-black/10 rounded-xl text-base bg-white focus:ring-2 focus:ring-accent/20 focus:border-accent"
              placeholder={`${currentStep.placeholder} ${i + 1}`}
            />
          ))}
        </div>

        <div className="flex gap-2">
          {stepIdx > 0 && (
            <button onClick={() => setStep(STEPS[stepIdx - 1].id)} className="flex-1 py-2.5 border border-foreground/15 text-foreground/60 rounded-full font-semibold text-base">
              ← Zpět
            </button>
          )}
          <button
            onClick={() => setStep(stepIdx < STEPS.length - 1 ? STEPS[stepIdx + 1].id : "reflect")}
            className="flex-1 py-2.5 bg-accent text-white rounded-full font-bold text-base hover:bg-accent-hover transition-colors"
          >
            Dál →
          </button>
        </div>

        <div className="flex justify-center gap-1">
          {STEPS.map((s, i) => (
            <div key={s.id} className={`w-2 h-2 rounded-full ${i <= stepIdx ? "bg-accent" : "bg-foreground/10"}`} />
          ))}
          <div className={`w-2 h-2 rounded-full ${step === "reflect" ? "bg-accent" : "bg-foreground/10"}`} />
        </div>
      </div>
    );
  }

  // Reflection step
  if (step === "reflect") {
    return (
      <div className="max-w-2xl mx-auto space-y-5">
        <div>
          <h2 className="text-xl font-bold text-foreground">☀️ Průsečíky — tvoje Ikigai</h2>
          <p className="text-base text-foreground/55 mt-1">
            Podívej se na odpovědi výše a najdi průsečíky. Co se opakuje? Kde se kruhy protínají?
          </p>
        </div>

        {/* Summary of inputs */}
        <div className="grid grid-cols-2 gap-3">
          {STEPS.map((s) => (
            <div key={s.id} className="px-4 py-3 rounded-2xl bg-accent/5 border border-accent/10">
              <p className="text-sm font-semibold text-accent/70 mb-1">{s.emoji} {s.title}</p>
              <ul className="space-y-0.5">
                {data[s.field].filter(Boolean).map((item, i) => (
                  <li key={i} className="text-sm text-foreground/60">• {item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Intersection reflections */}
        <div className="space-y-4">
          {INTERSECTIONS.map((inter) => (
            <div key={inter.key} className="space-y-1.5">
              <label className="text-base font-medium text-foreground/70">
                {inter.emoji} {inter.label} — <span className="text-foreground/40 font-normal">{inter.desc}</span>
              </label>
              <textarea
                value={data.reflections[inter.key]}
                onChange={(e) => setData((d) => ({
                  ...d,
                  reflections: { ...d.reflections, [inter.key]: e.target.value },
                }))}
                rows={inter.key === "ikigai" ? 4 : 2}
                className={`w-full px-4 py-3 border rounded-2xl text-base bg-white focus:ring-2 focus:ring-accent/20 focus:border-accent resize-none ${
                  inter.key === "ikigai" ? "border-accent/30 bg-accent/[0.02]" : "border-black/10"
                }`}
                placeholder={inter.key === "ikigai" ? "Můj účel je..." : `Moje ${inter.label.toLowerCase()} je...`}
              />
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <button onClick={() => setStep("paidFor")} className="flex-1 py-2.5 border border-foreground/15 text-foreground/60 rounded-full font-semibold text-base">
            ← Zpět
          </button>
          <button
            onClick={async () => {
              setSaving(true);
              await onSave({ ...data, savedAt: new Date().toISOString() });
              setSaving(false);
              onComplete();
            }}
            disabled={saving}
            className="flex-1 py-2.5 bg-accent text-white rounded-full font-bold text-base hover:bg-accent-hover transition-colors disabled:opacity-60"
          >
            {saving ? "Ukládám…" : "Uložit Ikigai ✓"}
          </button>
        </div>
      </div>
    );
  }

  return null;
}

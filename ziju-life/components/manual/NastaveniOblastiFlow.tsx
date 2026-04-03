"use client";

import { useState, useCallback } from "react";
import { AREA_QUESTIONS } from "@/data/areaQuestions";
import { WHEEL_AREAS } from "./shared";
import { InteractiveSpider } from "./charts/SpiderChart";
import type { KompasData } from "@/components/KompasFlow";
import type { AreaSetupData } from "@/lib/exercise-registry";

type Step = "select" | "questions" | "principles" | "lessons" | "habits" | "metrics" | "summary";

const EMPTY_DATA: AreaSetupData = {
  answers: {}, principles: {}, lessons: {},
  habitsAdd: {}, habitsRemove: {}, metrics: {},
  completedAreas: [], savedAt: "",
};

export default function NastaveniOblastiFlow({
  initialData,
  kompasData,
  onSave,
  onComplete,
  onBack,
}: {
  initialData: AreaSetupData | null;
  kompasData: KompasData | null;
  onSave: (data: AreaSetupData) => Promise<void>;
  onComplete: () => void;
  onBack: () => void;
}) {
  const [data, setData] = useState<AreaSetupData>(initialData ?? EMPTY_DATA);
  const [activeArea, setActiveArea] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("select");
  const [saving, setSaving] = useState(false);

  // Current area's question set
  const areaQ = AREA_QUESTIONS.find((a) => a.key === activeArea);

  const save = useCallback(async (updated: AreaSetupData) => {
    setSaving(true);
    setData(updated);
    await onSave({ ...updated, savedAt: new Date().toISOString() });
    setSaving(false);
  }, [onSave]);

  // ── Area selector ──
  if (step === "select" || !activeArea) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h2 className="text-xl font-bold text-foreground">Nastavení oblastí</h2>
          <p className="text-sm text-foreground/55 mt-1">
            Pro každou oblast projdi koučovací otázky, pak napiš principy, lekce, návyky a metriky.
          </p>
        </div>

        {/* Spider chart reference */}
        {kompasData?.currentVals && (
          <div className="flex justify-center">
            <InteractiveSpider vals={kompasData.currentVals} size={220} />
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {AREA_QUESTIONS.map((area) => {
            const done = data.completedAreas.includes(area.key);
            const hasAnyData = !!(data.answers[area.key]?.some(Boolean));
            return (
              <button
                key={area.key}
                onClick={() => { setActiveArea(area.key); setStep("questions"); }}
                className={`text-left px-5 py-4 rounded-[20px] border transition-all hover:shadow-md ${
                  done ? "border-green-200 bg-green-50/50" :
                  hasAnyData ? "border-amber-200 bg-amber-50/30" :
                  "border-black/8 bg-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{area.emoji}</span>
                  <div className="flex-1">
                    <p className="font-bold text-sm text-foreground">{area.label}</p>
                    {done && <p className="text-xs text-green-600 font-semibold">Hotovo ✓</p>}
                    {!done && hasAnyData && <p className="text-xs text-amber-600 font-semibold">Rozpracováno</p>}
                    {!done && !hasAnyData && <p className="text-xs text-foreground/40">Začít →</p>}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {data.completedAreas.length === 8 && (
          <div className="text-center pt-4">
            <button
              onClick={onComplete}
              className="px-8 py-3 bg-accent text-white rounded-full font-bold text-sm hover:bg-accent-hover transition-colors shadow-md"
            >
              Všechny oblasti hotové — dokončit ✓
            </button>
          </div>
        )}

        <p className="text-xs text-foreground/30 text-center">{data.completedAreas.length}/8 oblastí dokončeno</p>
      </div>
    );
  }

  if (!areaQ) return null;

  // Current area data
  const answers = data.answers[activeArea] ?? ["", "", "", "", ""];
  const principles = data.principles[activeArea] ?? ["", "", "", "", ""];
  const lessons = data.lessons[activeArea] ?? ["", "", ""];
  const habitsAdd = data.habitsAdd[activeArea] ?? ["", ""];
  const habitsRemove = data.habitsRemove[activeArea] ?? [""];
  const metrics = data.metrics[activeArea] ?? ["", "", ""];

  function updateField<T extends string[]>(field: keyof AreaSetupData, values: T) {
    setData((d) => ({ ...d, [field]: { ...d[field] as Record<string, string[]>, [activeArea!]: values } }));
  }

  const navButtons = (prevStep: Step | null, nextStep: Step | null, nextLabel: string = "Dál →") => (
    <div className="flex gap-2 pt-4">
      {prevStep && (
        <button
          onClick={() => setStep(prevStep)}
          className="flex-1 py-2.5 border border-foreground/15 text-foreground/60 rounded-full font-semibold text-sm hover:border-foreground/30 transition-colors"
        >
          ← Zpět
        </button>
      )}
      {nextStep && (
        <button
          onClick={() => setStep(nextStep)}
          className="flex-1 py-2.5 bg-accent text-white rounded-full font-bold text-sm hover:bg-accent-hover transition-colors"
        >
          {nextLabel}
        </button>
      )}
    </div>
  );

  // ── Step: Questions ──
  if (step === "questions") {
    return (
      <div className="max-w-2xl mx-auto space-y-5">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{areaQ.emoji}</span>
          <div>
            <h2 className="text-xl font-bold text-foreground">{areaQ.label}</h2>
            <p className="text-sm text-foreground/50">Koučovací otázky — zamysli se a piš upřímně</p>
          </div>
        </div>

        <div className="space-y-4">
          {areaQ.questions.map((q, i) => (
            <div key={i} className="space-y-1.5">
              <label className="text-sm font-medium text-foreground/70">{i + 1}. {q}</label>
              <textarea
                value={answers[i] ?? ""}
                onChange={(e) => {
                  const next = [...answers];
                  next[i] = e.target.value;
                  updateField("answers", next);
                }}
                rows={3}
                className="w-full px-4 py-3 border border-black/10 rounded-2xl text-sm bg-white focus:ring-2 focus:ring-accent/20 focus:border-accent resize-none"
                placeholder="Tvoje odpověď..."
              />
            </div>
          ))}
        </div>

        {navButtons(null, "principles")}
        <button onClick={() => { setStep("select"); setActiveArea(null); }} className="w-full text-xs text-foreground/30 hover:text-foreground/50 py-2">
          ← Zpět na výběr oblastí
        </button>
      </div>
    );
  }

  // ── Step: Principles ──
  if (step === "principles") {
    return (
      <div className="max-w-2xl mx-auto space-y-5">
        <div>
          <h2 className="text-xl font-bold text-foreground">{areaQ.emoji} Principy — {areaQ.label}</h2>
          <p className="text-sm text-foreground/50 mt-1">Podle čeho se v této oblasti chceš řídit? 3–5 vět.</p>
        </div>

        <div className="space-y-3">
          {principles.map((p, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-xs text-foreground/30 w-5 shrink-0">{i + 1}.</span>
              <input
                value={p}
                onChange={(e) => {
                  const next = [...principles];
                  next[i] = e.target.value;
                  updateField("principles", next);
                }}
                className="flex-1 px-4 py-2.5 border border-black/10 rounded-xl text-sm bg-white focus:ring-2 focus:ring-accent/20 focus:border-accent"
                placeholder={`Princip ${i + 1}...`}
              />
            </div>
          ))}
        </div>

        {navButtons("questions", "lessons")}
      </div>
    );
  }

  // ── Step: Lessons ──
  if (step === "lessons") {
    return (
      <div className="max-w-2xl mx-auto space-y-5">
        <div>
          <h2 className="text-xl font-bold text-foreground">{areaQ.emoji} Lekce — {areaQ.label}</h2>
          <p className="text-sm text-foreground/50 mt-1">Co ses naučil/a? Co bys udělal/a jinak?</p>
        </div>

        <div className="space-y-3">
          {lessons.map((l, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-xs text-foreground/30 w-5 shrink-0">{i + 1}.</span>
              <input
                value={l}
                onChange={(e) => {
                  const next = [...lessons];
                  next[i] = e.target.value;
                  updateField("lessons", next);
                }}
                className="flex-1 px-4 py-2.5 border border-black/10 rounded-xl text-sm bg-white focus:ring-2 focus:ring-accent/20 focus:border-accent"
                placeholder={`Lekce ${i + 1}...`}
              />
            </div>
          ))}
        </div>

        {navButtons("principles", "habits")}
      </div>
    );
  }

  // ── Step: Habits ──
  if (step === "habits") {
    return (
      <div className="max-w-2xl mx-auto space-y-5">
        <div>
          <h2 className="text-xl font-bold text-foreground">{areaQ.emoji} Návyky — {areaQ.label}</h2>
          <p className="text-sm text-foreground/50 mt-1">Které návyky chceš zavést a který odstranit?</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-green-600 uppercase tracking-wider">Zavádím</p>
            {habitsAdd.map((h, i) => (
              <input
                key={i}
                value={h}
                onChange={(e) => {
                  const next = [...habitsAdd];
                  next[i] = e.target.value;
                  updateField("habitsAdd", next);
                }}
                className="w-full px-4 py-2.5 border border-green-200 rounded-xl text-sm bg-green-50/30 focus:ring-2 focus:ring-green-200 focus:border-green-300"
                placeholder={`Nový návyk ${i + 1}...`}
              />
            ))}
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-red-500 uppercase tracking-wider">Odstraňuji</p>
            {habitsRemove.map((h, i) => (
              <input
                key={i}
                value={h}
                onChange={(e) => {
                  const next = [...habitsRemove];
                  next[i] = e.target.value;
                  updateField("habitsRemove", next);
                }}
                className="w-full px-4 py-2.5 border border-red-200 rounded-xl text-sm bg-red-50/30 focus:ring-2 focus:ring-red-200 focus:border-red-300"
                placeholder="Návyk k odstranění..."
              />
            ))}
          </div>
        </div>

        {navButtons("lessons", "metrics")}
      </div>
    );
  }

  // ── Step: Metrics ──
  if (step === "metrics") {
    return (
      <div className="max-w-2xl mx-auto space-y-5">
        <div>
          <h2 className="text-xl font-bold text-foreground">{areaQ.emoji} Metriky — {areaQ.label}</h2>
          <p className="text-sm text-foreground/50 mt-1">Jak poznáš za 3 měsíce, že to funguje?</p>
        </div>

        <div className="space-y-3">
          {metrics.map((m, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-xs text-foreground/30 w-5 shrink-0">{i + 1}.</span>
              <input
                value={m}
                onChange={(e) => {
                  const next = [...metrics];
                  next[i] = e.target.value;
                  updateField("metrics", next);
                }}
                className="flex-1 px-4 py-2.5 border border-black/10 rounded-xl text-sm bg-white focus:ring-2 focus:ring-accent/20 focus:border-accent"
                placeholder={`Metrika ${i + 1}...`}
              />
            </div>
          ))}
        </div>

        {navButtons("habits", "summary", "Shrnutí →")}
      </div>
    );
  }

  // ── Step: Summary ──
  if (step === "summary") {
    const filledAnswers = answers.filter(Boolean).length;
    const filledPrinciples = principles.filter(Boolean).length;
    const filledLessons = lessons.filter(Boolean).length;
    const filledHabits = habitsAdd.filter(Boolean).length + habitsRemove.filter(Boolean).length;
    const filledMetrics = metrics.filter(Boolean).length;

    return (
      <div className="max-w-2xl mx-auto space-y-5">
        <div>
          <h2 className="text-xl font-bold text-foreground">{areaQ.emoji} Shrnutí — {areaQ.label}</h2>
          <p className="text-sm text-foreground/50 mt-1">Zkontroluj a ulož.</p>
        </div>

        <div className="bg-white border border-black/8 rounded-[24px] px-5 py-5 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-foreground/60">Odpovědi na otázky</span>
            <span className="font-bold text-foreground">{filledAnswers}/5</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-foreground/60">Principy</span>
            <span className="font-bold text-foreground">{filledPrinciples}/5</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-foreground/60">Lekce</span>
            <span className="font-bold text-foreground">{filledLessons}/3</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-foreground/60">Návyky</span>
            <span className="font-bold text-foreground">{filledHabits}/3</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-foreground/60">Metriky</span>
            <span className="font-bold text-foreground">{filledMetrics}/3</span>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setStep("metrics")}
            className="flex-1 py-2.5 border border-foreground/15 text-foreground/60 rounded-full font-semibold text-sm hover:border-foreground/30 transition-colors"
          >
            ← Zpět
          </button>
          <button
            onClick={async () => {
              const updated = {
                ...data,
                completedAreas: data.completedAreas.includes(activeArea)
                  ? data.completedAreas
                  : [...data.completedAreas, activeArea],
              };
              await save(updated);
              setStep("select");
              setActiveArea(null);
            }}
            disabled={saving}
            className="flex-1 py-2.5 bg-accent text-white rounded-full font-bold text-sm hover:bg-accent-hover transition-colors disabled:opacity-60"
          >
            {saving ? "Ukládám…" : "Uložit oblast ✓"}
          </button>
        </div>
      </div>
    );
  }

  return null;
}

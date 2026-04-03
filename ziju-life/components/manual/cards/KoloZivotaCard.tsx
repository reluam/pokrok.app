"use client";

import { useState, useCallback } from "react";
import { DashboardCard, useDashboardDone } from "./DashboardCard";
import { useAutoSave } from "./useAutoSave";
import { SaveIndicator } from "./SaveIndicator";
import { SpiderChart, InteractiveSpider } from "../charts/SpiderChart";
import { WHEEL_AREAS } from "../shared";
import type { KompasData } from "@/components/KompasFlow";

const defaultVals = () => Object.fromEntries(WHEEL_AREAS.map((a) => [a.key, 5]));

type Step = "current" | "goal";
const STEPS: Step[] = ["current", "goal"];

const STEP_INFO: Record<Step, { title: string; desc: string }> = {
  current: {
    title: "Kde jsi teď?",
    desc: "Ohodnoť každou oblast 1–10. Buď upřímný/á — nejde o dokonalost, ale o reálný obraz.",
  },
  goal: {
    title: "Kde chceš být?",
    desc: "Nastav cílové hodnoty. Šedý obrys ukazuje tvůj aktuální stav — rozdíl ukáže, kam směřovat.",
  },
};

export function KoloZivotaCard({
  data,
  saveContext,
}: {
  data: KompasData | null;
  saveContext: (type: string, data: unknown) => Promise<void>;
}) {
  const isEmpty = !data?.currentVals || Object.keys(data.currentVals).length === 0;

  return (
    <DashboardCard
      emoji="🎯"
      title="Kolo života"
      isEmpty={isEmpty}
      emptyDescription="Ohodnoť 8 životních oblastí a zjisti, kde jsi teď a kam chceš. Uvidíš, co rozvíjet jako první."
      editContent={<EditFlow data={data} saveContext={saveContext} />}
    >
      <ViewMode data={data!} />
    </DashboardCard>
  );
}

function ViewMode({ data }: { data: KompasData }) {
  const focusArea = WHEEL_AREAS.find((a) => a.key === data.focusArea);
  const avg = Object.values(data.currentVals);
  const mean = avg.length > 0 ? (avg.reduce((s, v) => s + v, 0) / avg.length).toFixed(1) : "—";

  const steps = (data.actionSteps ?? []).filter((s) => s.trim());

  return (
    <div className="flex gap-4 items-start">
      {/* Spider chart — left */}
      <div className="flex-shrink-0 space-y-1">
        <SpiderChart vals={data.currentVals} goalVals={data.goalVals} size={200} />
        <div className="flex items-center justify-center gap-3 text-xs text-foreground/40">
          <span className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-1 rounded-full bg-[#FF8C42]" />
            Teď ({mean})
          </span>
          {data.goalVals && Object.keys(data.goalVals).length > 0 && (
            <span className="flex items-center gap-1">
              <span className="inline-block w-2.5 h-0.5 border-t-2 border-dashed border-[#4ECDC4]" style={{ width: 10 }} />
              Cíl
            </span>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="w-px self-stretch bg-black/[0.07]" />

      {/* Focus + action steps — right */}
      <div className="flex-1 min-w-0 space-y-3 pt-2">
        {focusArea ? (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-foreground/30">Focus</p>
            <p className="text-sm font-bold text-accent mt-0.5">{focusArea.short}</p>
          </div>
        ) : (
          <p className="text-xs text-foreground/35 italic">Focus oblast se nastaví v měsíčním check-inu.</p>
        )}
        {steps.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-foreground/30">Kroky</p>
            {steps.map((step, i) => (
              <p key={i} className="text-sm text-foreground/55">{i + 1}. {step}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SliderRow({
  label,
  value,
  onChange,
  color = "#FF8C42",
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  color?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-foreground/50 w-20 truncate">{label}</span>
      <input
        type="range"
        min={1}
        max={10}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, ${color} ${((value - 1) / 9) * 100}%, rgba(0,0,0,0.08) ${((value - 1) / 9) * 100}%)`,
        }}
      />
      <span className="text-sm font-bold text-foreground/60 w-5 text-right">{value}</span>
    </div>
  );
}

function EditFlow({
  data,
  saveContext,
}: {
  data: KompasData | null;
  saveContext: (type: string, data: unknown) => Promise<void>;
}) {
  const done = useDashboardDone();
  const [step, setStep] = useState<Step>("current");
  const [currentVals, setCurrentVals] = useState<Record<string, number>>(data?.currentVals ?? defaultVals());
  const [goalVals, setGoalVals] = useState<Record<string, number>>(data?.goalVals ?? Object.fromEntries(WHEEL_AREAS.map((a) => [a.key, 7])));

  const stepIdx = STEPS.indexOf(step);
  const info = STEP_INFO[step];

  const buildMerged = useCallback((partial: Partial<KompasData> = {}): KompasData => ({
    currentVals,
    goalVals,
    reflectionAnswers: data?.reflectionAnswers ?? {},
    areaAnswers: data?.areaAnswers ?? {},
    focusArea: data?.focusArea,
    actionSteps: data?.actionSteps,
    completedAt: data?.completedAt ?? new Date().toISOString(),
    ...partial,
  }), [currentVals, goalVals, data]);

  const depsKey = JSON.stringify(currentVals) + JSON.stringify(goalVals);
  const { saving, saved } = useAutoSave(
    async () => { await saveContext("compass", buildMerged()); },
    [depsKey],
  );

  const handleNext = () => {
    if (stepIdx < STEPS.length - 1) {
      setStep(STEPS[stepIdx + 1]);
    }
  };

  const handleFinish = async () => {
    await saveContext("compass", buildMerged({ completedAt: new Date().toISOString() }));
    done?.();
  };

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div className="flex gap-1">
        {STEPS.map((s, i) => (
          <div
            key={s}
            className="h-1 flex-1 rounded-full transition-all"
            style={{ background: i <= stepIdx ? "#FF8C42" : "rgba(0,0,0,0.06)" }}
          />
        ))}
      </div>

      {/* Step description */}
      <div>
        <p className="text-sm font-bold text-foreground/70">{info.title}</p>
        <p className="text-sm text-foreground/40 mt-0.5 leading-relaxed">{info.desc}</p>
      </div>

      {/* Step content */}
      {step === "current" && (
        <div className="space-y-3">
          <div className="flex justify-center">
            <InteractiveSpider
              vals={currentVals}
              onChange={(key, score) => setCurrentVals((p) => ({ ...p, [key]: score }))}
              size={220}
            />
          </div>
          <div className="space-y-2 pt-2 border-t border-black/[0.05]">
            {WHEEL_AREAS.map((a) => (
              <SliderRow
                key={a.key}
                label={a.short}
                value={currentVals[a.key] ?? 5}
                onChange={(v) => setCurrentVals((p) => ({ ...p, [a.key]: v }))}
              />
            ))}
          </div>
        </div>
      )}

      {step === "goal" && (
        <div className="space-y-3">
          <div className="flex justify-center">
            <InteractiveSpider
              vals={goalVals}
              prevVals={currentVals}
              onChange={(key, score) => setGoalVals((p) => ({ ...p, [key]: score }))}
              size={220}
            />
          </div>
          <div className="space-y-2 pt-2 border-t border-black/[0.05]">
            {WHEEL_AREAS.map((a) => (
              <SliderRow
                key={a.key}
                label={a.short}
                value={goalVals[a.key] ?? 7}
                onChange={(v) => setGoalVals((p) => ({ ...p, [a.key]: v }))}
                color="#4ECDC4"
              />
            ))}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center gap-2">
        <SaveIndicator saving={saving} saved={saved} />
        <div className="flex-1" />
        {stepIdx > 0 && (
          <button
            onClick={() => setStep(STEPS[stepIdx - 1])}
            className="px-4 py-2 border border-foreground/15 text-foreground/50 rounded-full text-base font-semibold hover:border-foreground/30 transition-colors"
          >
            ← Zpět
          </button>
        )}
        <button
          onClick={step === "goal" ? handleFinish : handleNext}
          className="px-5 py-2 bg-accent text-white rounded-full text-base font-bold hover:bg-accent-hover transition-colors"
        >
          {step === "goal" ? "Hotovo ✓" : "Dál →"}
        </button>
      </div>
    </div>
  );
}

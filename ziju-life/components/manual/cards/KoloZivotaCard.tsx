"use client";

import { useState, useCallback } from "react";
import { DashboardCard } from "./DashboardCard";
import { SpiderChart, InteractiveSpider } from "../charts/SpiderChart";
import { WHEEL_AREAS } from "../shared";
import type { KompasData } from "@/components/KompasFlow";

const defaultVals = () => Object.fromEntries(WHEEL_AREAS.map((a) => [a.key, 5]));

type Step = "current" | "goal" | "focus" | "actions";
const STEPS: Step[] = ["current", "goal", "focus", "actions"];

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
        <div className="flex items-center justify-center gap-3 text-[10px] text-foreground/40">
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
            <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/30">Focus</p>
            <p className="text-sm font-bold text-accent mt-0.5">{focusArea.short}</p>
          </div>
        ) : (
          <p className="text-xs text-foreground/35 italic">Zatím nemáš vybranou fokus oblast.</p>
        )}
        {steps.length > 0 && (
          <div className="space-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/30">Kroky</p>
            {steps.map((step, i) => (
              <p key={i} className="text-xs text-foreground/55">{i + 1}. {step}</p>
            ))}
          </div>
        )}
      </div>
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
  const [step, setStep] = useState<Step>("current");
  const [currentVals, setCurrentVals] = useState<Record<string, number>>(data?.currentVals ?? defaultVals());
  const [goalVals, setGoalVals] = useState<Record<string, number>>(data?.goalVals ?? Object.fromEntries(WHEEL_AREAS.map((a) => [a.key, 7])));
  const [focusArea, setFocusArea] = useState(data?.focusArea ?? "");
  const [actionSteps, setActionSteps] = useState<string[]>(data?.actionSteps ?? ["", "", ""]);
  const [saving, setSaving] = useState(false);

  const stepIdx = STEPS.indexOf(step);

  const save = useCallback(async (partial: Partial<KompasData>) => {
    setSaving(true);
    const merged: KompasData = {
      currentVals,
      goalVals,
      reflectionAnswers: data?.reflectionAnswers ?? {},
      areaAnswers: data?.areaAnswers ?? {},
      focusArea,
      actionSteps: actionSteps.filter((s) => s.trim()),
      completedAt: data?.completedAt ?? new Date().toISOString(),
      ...partial,
    };
    await saveContext("compass", merged);
    setSaving(false);
  }, [currentVals, goalVals, focusArea, actionSteps, data, saveContext]);

  const handleNext = async () => {
    if (stepIdx < STEPS.length - 1) {
      const nextStep = STEPS[stepIdx + 1];
      setStep(nextStep);
      await save({});
    }
  };

  const handleFinish = async () => {
    const filledSteps = actionSteps.filter((s) => s.trim());
    const now = new Date();
    await save({
      completedAt: now.toISOString(),
      actionSteps: filledSteps.length > 0 ? filledSteps : undefined,
      reflectionDueAt: filledSteps.length > 0 ? new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString() : undefined,
    });
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

      {/* Step content */}
      {step === "current" && (
        <div className="space-y-3">
          <p className="text-xs text-foreground/50">Kde jsi teď? Klikni na graf nebo nastav hodnoty.</p>
          <div className="flex justify-center">
            <InteractiveSpider
              vals={currentVals}
              onChange={(key, score) => setCurrentVals((p) => ({ ...p, [key]: score }))}
              size={240}
            />
          </div>
        </div>
      )}

      {step === "goal" && (
        <div className="space-y-3">
          <p className="text-xs text-foreground/50">Kde chceš být? Šedý obrys = aktuální stav.</p>
          <div className="flex justify-center">
            <InteractiveSpider
              vals={goalVals}
              prevVals={currentVals}
              onChange={(key, score) => setGoalVals((p) => ({ ...p, [key]: score }))}
              size={240}
            />
          </div>
        </div>
      )}

      {step === "focus" && (
        <div className="space-y-3">
          <p className="text-xs text-foreground/50">Na kterou oblast se zaměříš tento měsíc?</p>
          <div className="space-y-1.5">
            {WHEEL_AREAS.map((a) => {
              const cur = currentVals[a.key] ?? 5;
              const goal = goalVals[a.key] ?? 5;
              const diff = goal - cur;
              return (
                <button
                  key={a.key}
                  onClick={() => setFocusArea(a.key)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl border text-left text-sm transition-all"
                  style={focusArea === a.key
                    ? { borderColor: "#FF8C42", background: "rgba(255,140,66,0.06)" }
                    : { borderColor: "rgba(0,0,0,0.07)" }
                  }
                >
                  <span className="font-medium text-foreground/70 flex-1">{a.short}</span>
                  <span className="text-xs text-foreground/40">{cur} → {goal}</span>
                  {diff > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-500">+{diff}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {step === "actions" && (
        <div className="space-y-3">
          <p className="text-xs text-foreground/50">Konkrétní kroky na příští měsíc:</p>
          {[0, 1, 2].map((i) => (
            <input
              key={i}
              type="text"
              value={actionSteps[i] ?? ""}
              onChange={(e) => {
                const next = [...actionSteps];
                next[i] = e.target.value;
                setActionSteps(next);
              }}
              placeholder={`Krok ${i + 1}${i > 0 ? " (volitelný)" : ""}`}
              className="w-full text-sm rounded-xl border border-black/[0.08] bg-white/70 px-3 py-2 text-foreground/70 placeholder:text-foreground/25 focus:outline-none focus:border-black/20 transition-all"
            />
          ))}
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-2">
        {stepIdx > 0 && (
          <button
            onClick={() => setStep(STEPS[stepIdx - 1])}
            className="flex-1 py-2 border border-foreground/15 text-foreground/50 rounded-full text-sm font-semibold hover:border-foreground/30 transition-colors"
          >
            ← Zpět
          </button>
        )}
        <button
          onClick={step === "actions" ? handleFinish : handleNext}
          disabled={saving}
          className="flex-1 py-2 bg-accent text-white rounded-full text-sm font-bold hover:bg-accent-hover transition-colors disabled:opacity-50"
        >
          {saving ? "Ukládám…" : step === "actions" ? "Uložit ✓" : "Dál →"}
        </button>
      </div>
    </div>
  );
}

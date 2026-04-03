"use client";

import { useState, useCallback } from "react";
import { DashboardCard, useDashboardDone } from "./DashboardCard";
import { SpiderChart, InteractiveSpider } from "../charts/SpiderChart";
import { WHEEL_AREAS } from "../shared";
import type { KompasData } from "@/components/KompasFlow";

const defaultVals = () => Object.fromEntries(WHEEL_AREAS.map((a) => [a.key, 5]));

type Step = "current" | "goal" | "focus" | "actions";
const STEPS: Step[] = ["current", "goal", "focus", "actions"];

const STEP_INFO: Record<Step, { title: string; desc: string }> = {
  current: {
    title: "Kde jsi teď?",
    desc: "Ohodnoť každou oblast 1–10. Buď upřímný/á — nejde o dokonalost, ale o reálný obraz.",
  },
  goal: {
    title: "Kde chceš být?",
    desc: "Nastav cílové hodnoty. Šedý obrys ukazuje tvůj aktuální stav — rozdíl ukáže, kam směřovat.",
  },
  focus: {
    title: "Na co se zaměříš?",
    desc: "Vyber jednu oblast, které dáš tento měsíc přednost. Největší rozdíl = největší příležitost.",
  },
  actions: {
    title: "Konkrétní kroky",
    desc: "Zapiš 1–3 kroky, které uděláš tento měsíc. Konkrétní, měřitelné, proveditelné.",
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
    <div className="space-y-4">
      {/* Spider chart */}
      <div className="space-y-1">
        <div className="flex justify-center">
          <SpiderChart vals={data.currentVals} goalVals={data.goalVals} size={200} />
        </div>
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

      {/* Areas breakdown */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
        {WHEEL_AREAS.map((a) => {
          const cur = data.currentVals[a.key] ?? 0;
          const goal = data.goalVals?.[a.key];
          const isFocus = data.focusArea === a.key;
          return (
            <div key={a.key} className={`flex items-center gap-2 ${isFocus ? "font-semibold" : ""}`}>
              <span className="text-xs text-foreground/50 flex-1 truncate">
                {isFocus && <span className="text-accent mr-0.5">●</span>}
                {a.short}
              </span>
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-foreground/60 w-4 text-right">{cur}</span>
                {goal != null && goal !== cur && (
                  <span className="text-[10px] text-[#4ECDC4]">→ {goal}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Focus + action steps */}
      {steps.length > 0 && (
        <div className="space-y-1 pt-1 border-t border-black/[0.05]">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/30">Kroky</p>
          {steps.map((step, i) => (
            <p key={i} className="text-xs text-foreground/55">{i + 1}. {step}</p>
          ))}
        </div>
      )}
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
      <span className="text-xs text-foreground/50 w-20 truncate">{label}</span>
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
      <span className="text-xs font-bold text-foreground/60 w-5 text-right">{value}</span>
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
  const [focusArea, setFocusArea] = useState(data?.focusArea ?? "");
  const [actionSteps, setActionSteps] = useState<string[]>(data?.actionSteps ?? ["", "", ""]);
  const [saving, setSaving] = useState(false);

  const stepIdx = STEPS.indexOf(step);
  const info = STEP_INFO[step];

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

  const syncToPriorities = useCallback(async () => {
    if (!focusArea) return;
    const areaLabel = WHEEL_AREAS.find((a) => a.key === focusArea)?.short ?? focusArea;
    const filledSteps = actionSteps.filter((s) => s.trim());
    const now = new Date().toISOString();

    // Load current priorities
    try {
      const res = await fetch("/api/manual/user-context");
      if (!res.ok) return;
      const d = await res.json();
      const priorities = d.context?.priorities ?? { weekly: [], monthly: [], yearly: [] };

      // Remove old kolo-zivota items from monthly
      const cleaned = (priorities.monthly ?? []).filter(
        (item: { source?: string }) => item.source !== "kolo-zivota"
      );

      // Add focus area + action steps
      const newItems = [
        { text: `Focus: ${areaLabel}`, done: false, source: "kolo-zivota", sourceDate: now },
        ...filledSteps.map((s) => ({ text: s, done: false, source: "kolo-zivota", sourceDate: now })),
      ];

      const updated = { ...priorities, monthly: [...newItems, ...cleaned] };
      await fetch("/api/manual/user-context", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "priorities", data: updated }),
      });
    } catch {}
  }, [focusArea, actionSteps]);

  const handleFinish = async () => {
    const filledSteps = actionSteps.filter((s) => s.trim());
    const now = new Date();
    await save({
      completedAt: now.toISOString(),
      actionSteps: filledSteps.length > 0 ? filledSteps : undefined,
      reflectionDueAt: filledSteps.length > 0 ? new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString() : undefined,
    });
    await syncToPriorities();
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
        <p className="text-xs font-bold text-foreground/70">{info.title}</p>
        <p className="text-[11px] text-foreground/40 mt-0.5 leading-relaxed">{info.desc}</p>
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

      {step === "focus" && (
        <div className="space-y-1.5">
          {[...WHEEL_AREAS]
            .map((a) => ({ ...a, diff: (goalVals[a.key] ?? 5) - (currentVals[a.key] ?? 5) }))
            .sort((a, b) => b.diff - a.diff)
            .map((a) => {
              const cur = currentVals[a.key] ?? 5;
              const goal = goalVals[a.key] ?? 5;
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
                  {a.diff > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-500">+{a.diff}</span>
                  )}
                </button>
              );
            })}
        </div>
      )}

      {step === "actions" && (
        <div className="space-y-2">
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

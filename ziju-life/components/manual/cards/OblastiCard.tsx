"use client";

import { useState, useCallback } from "react";
import { DashboardCard, useDashboardDone } from "./DashboardCard";
import { useAutoSave } from "./useAutoSave";
import { SaveIndicator } from "./SaveIndicator";
import { WHEEL_AREAS } from "../shared";
import type { AreaSetupData } from "@/lib/exercise-registry";

const AREA_STEPS = [
  { key: "answers", label: "Otázky", desc: "Jaké otázky si v této oblasti potřebuješ pokládat? Co je důležité řešit?", count: 5 },
  { key: "principles", label: "Principy", desc: "Jaká pravidla chceš v této oblasti dodržovat? Čím se řídit?", count: 5 },
  { key: "lessons", label: "Lekce", desc: "Co ses v této oblasti naučil/a? Jaké poučení z minulosti si neseš?", count: 3 },
  { key: "habitsAdd", label: "Návyky (+)", desc: "Jaké nové návyky chceš zavést? Co ti pomůže se posunout?", count: 2 },
  { key: "habitsRemove", label: "Návyky (-)", desc: "Čeho se chceš zbavit? Co tě brzdí nebo ti škodí?", count: 1 },
  { key: "metrics", label: "Metriky", desc: "Podle čeho poznáš, že se ti daří? Co budeš měřit nebo sledovat?", count: 3 },
];

export function OblastiCard({
  data,
  saveContext,
}: {
  data: AreaSetupData | null;
  saveContext: (type: string, data: unknown) => Promise<void>;
}) {
  const completed = data?.completedAreas?.length ?? 0;
  const isEmpty = completed === 0 && !data?.savedAt;

  return (
    <DashboardCard
      emoji="📋"
      title="Nastavení oblastí"
      isEmpty={isEmpty}
      emptyDescription="Pro každou životní oblast si nastav principy, lekce a konkrétní návyky. Přeměň přání na systém."
      editContent={<EditMode data={data} saveContext={saveContext} />}
    >
      <ViewMode data={data!} completed={completed} />
    </DashboardCard>
  );
}

function ViewMode({ data, completed }: { data: AreaSetupData; completed: number }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 rounded-full bg-black/[0.05] overflow-hidden">
          <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${(completed / 8) * 100}%` }} />
        </div>
        <span className="text-lg font-bold text-foreground/40">{completed}/8</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {WHEEL_AREAS.map((a) => {
          const done = data.completedAreas?.includes(a.key);
          return (
            <span key={a.key} className={`text-lg px-2 py-0.5 rounded-full ${done ? "bg-accent/10 text-accent font-semibold" : "bg-black/5 text-foreground/30"}`}>
              {a.short}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function EditMode({
  data,
  saveContext,
}: {
  data: AreaSetupData | null;
  saveContext: (type: string, data: unknown) => Promise<void>;
}) {
  const done = useDashboardDone();
  const [areaKey, setAreaKey] = useState(WHEEL_AREAS[0].key);
  const [stepIdx, setStepIdx] = useState(0);

  const emptyArrays = (count: number) => Array.from({ length: count }, () => "");
  const [formData, setFormData] = useState<AreaSetupData>(() => ({
    answers: data?.answers ?? Object.fromEntries(WHEEL_AREAS.map((a) => [a.key, emptyArrays(5)])),
    principles: data?.principles ?? Object.fromEntries(WHEEL_AREAS.map((a) => [a.key, emptyArrays(5)])),
    lessons: data?.lessons ?? Object.fromEntries(WHEEL_AREAS.map((a) => [a.key, emptyArrays(3)])),
    habitsAdd: data?.habitsAdd ?? Object.fromEntries(WHEEL_AREAS.map((a) => [a.key, emptyArrays(2)])),
    habitsRemove: data?.habitsRemove ?? Object.fromEntries(WHEEL_AREAS.map((a) => [a.key, emptyArrays(1)])),
    metrics: data?.metrics ?? Object.fromEntries(WHEEL_AREAS.map((a) => [a.key, emptyArrays(3)])),
    completedAreas: data?.completedAreas ?? [],
    savedAt: data?.savedAt ?? "",
  }));

  const area = WHEEL_AREAS.find((a) => a.key === areaKey) ?? WHEEL_AREAS[0];
  const currentStep = AREA_STEPS[stepIdx];
  const fieldKey = currentStep.key as keyof Pick<AreaSetupData, "answers" | "principles" | "lessons" | "habitsAdd" | "habitsRemove" | "metrics">;
  const items = formData[fieldKey]?.[areaKey] ?? emptyArrays(currentStep.count);

  const updateItems = (newItems: string[]) => {
    setFormData((prev) => ({
      ...prev,
      [fieldKey]: { ...prev[fieldKey], [areaKey]: newItems },
    }));
  };

  const depsKey = JSON.stringify(formData);
  const { saving, saved } = useAutoSave(
    async () => { await saveContext("areas", { ...formData, savedAt: new Date().toISOString() }); },
    [depsKey],
  );

  const handleSave = useCallback(async (updatedData: AreaSetupData) => {
    await saveContext("areas", { ...updatedData, savedAt: new Date().toISOString() });
  }, [saveContext]);

  const handleNext = async () => {
    if (stepIdx < AREA_STEPS.length - 1) {
      setStepIdx((s) => s + 1);
      await handleSave(formData);
    } else {
      // Mark area as completed
      const newCompleted = formData.completedAreas.includes(areaKey)
        ? formData.completedAreas
        : [...formData.completedAreas, areaKey];
      const updated = { ...formData, completedAreas: newCompleted };
      setFormData(updated);
      await handleSave(updated);
      // Move to next incomplete area or close if all done
      const nextArea = WHEEL_AREAS.find((a) => !newCompleted.includes(a.key));
      if (nextArea) {
        setAreaKey(nextArea.key);
        setStepIdx(0);
      } else {
        done?.();
      }
    }
  };

  return (
    <div className="space-y-3">
      {/* Area selector */}
      <div className="flex gap-1 flex-wrap">
        {WHEEL_AREAS.map((a) => {
          const done = formData.completedAreas.includes(a.key);
          return (
            <button
              key={a.key}
              onClick={() => { setAreaKey(a.key); setStepIdx(0); }}
              className="px-2 py-1 rounded-lg text-base font-semibold transition-all"
              style={a.key === areaKey
                ? { background: "#FF8C42", color: "white" }
                : done
                  ? { background: "rgba(255,140,66,0.1)", color: "#FF8C42" }
                  : { background: "rgba(0,0,0,0.04)", color: "rgba(0,0,0,0.35)" }
              }
            >
              {a.short} {done ? "✓" : ""}
            </button>
          );
        })}
      </div>

      {/* Step progress */}
      <div className="flex gap-1">
        {AREA_STEPS.map((_, i) => (
          <div key={i} className="h-1 flex-1 rounded-full" style={{ background: i <= stepIdx ? "#FF8C42" : "rgba(0,0,0,0.06)" }} />
        ))}
      </div>

      {/* Step content */}
      <div>
        <p className="text-lg font-bold text-foreground/70">{area.short} — {currentStep.label}</p>
        <p className="text-lg text-foreground/40 mt-0.5 leading-relaxed">{currentStep.desc}</p>
      </div>
      <div className="space-y-1.5">
        {items.map((item, i) => (
          <input
            key={i}
            type="text"
            value={item}
            onChange={(e) => {
              const next = [...items];
              next[i] = e.target.value;
              updateItems(next);
            }}
            placeholder={`${currentStep.label} ${i + 1}`}
            className="w-full text-base rounded-xl border border-black/[0.08] bg-white/70 px-3 py-2 text-foreground/70 placeholder:text-foreground/25 focus:outline-none focus:border-black/20 transition-all"
          />
        ))}
      </div>

      <div className="flex items-center gap-2">
        <SaveIndicator saving={saving} saved={saved} />
        <div className="flex-1" />
        {stepIdx > 0 && (
          <button onClick={() => setStepIdx((s) => s - 1)} className="px-4 py-2 border border-foreground/15 text-foreground/50 rounded-full text-base font-semibold">
            ← Zpět
          </button>
        )}
        <button
          onClick={handleNext}
          className="px-5 py-2 bg-accent text-white rounded-full text-base font-bold"
        >
          {stepIdx === AREA_STEPS.length - 1 ? "Dokončit oblast ✓" : "Dál →"}
        </button>
      </div>
    </div>
  );
}

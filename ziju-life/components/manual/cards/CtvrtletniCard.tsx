"use client";

import { useState, useCallback } from "react";
import { DashboardCard, useDashboardDone } from "./DashboardCard";
import { useAutoSave } from "./useAutoSave";
import { SaveIndicator } from "./SaveIndicator";
import { InteractiveSpider } from "../charts/SpiderChart";
import { WHEEL_AREAS } from "../shared";
import type { QuarterlyCheckinData } from "@/lib/exercise-registry";

function isDue(data: QuarterlyCheckinData | null): boolean {
  if (!data?.updatedAt) return true;
  const last = new Date(data.updatedAt).getTime();
  const now = Date.now();
  return now - last >= 30 * 24 * 60 * 60 * 1000;
}

function daysSince(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
}

export function CtvrtletniCard({
  data,
  kompasCurrentVals,
  saveContext,
}: {
  data: QuarterlyCheckinData | null;
  kompasCurrentVals?: Record<string, number> | null;
  saveContext: (type: string, data: unknown) => Promise<void>;
}) {
  const isEmpty = !data?.updatedAt;
  const due = isDue(data);

  // Show a prompt when it's time for a new check-in
  const showDueBanner = !isEmpty && due;

  return (
    <DashboardCard
      emoji="🔄"
      title="Měsíční check-in"
      isEmpty={isEmpty}
      emptyDescription="Zastav se jednou za měsíc. Oslav pokrok, aktualizuj životní oblasti a nastav focus na další měsíc."
      editContent={<EditMode data={data} kompasCurrentVals={kompasCurrentVals} saveContext={saveContext} />}
    >
      <ViewMode data={data!} showDue={showDueBanner} />
    </DashboardCard>
  );
}

function ViewMode({ data, showDue }: { data: QuarterlyCheckinData; showDue: boolean }) {
  const days = daysSince(data.updatedAt);
  const focusLabel = data.focusArea ? WHEEL_AREAS.find(a => a.key === data.focusArea)?.short : null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs text-foreground/40">Poslední check-in: před {days} dny</p>
        {showDue && (
          <span className="text-xs font-semibold text-accent px-2 py-0.5 rounded-full bg-accent/10">
            Je čas na check-in!
          </span>
        )}
      </div>
      {focusLabel && (
        <div>
          <p className="text-xs uppercase tracking-wider text-foreground/30 font-semibold">Focus tento měsíc</p>
          <p className="text-sm font-bold text-accent">{focusLabel}</p>
        </div>
      )}
      {data.celebrations?.filter(Boolean).length > 0 && (
        <div>
          <p className="text-xs uppercase tracking-wider text-foreground/30 font-semibold">Úspěchy</p>
          {data.celebrations.filter(Boolean).slice(0, 3).map((c, i) => (
            <p key={i} className="text-sm text-foreground/55">+ {c}</p>
          ))}
        </div>
      )}
    </div>
  );
}

function EditMode({
  data,
  kompasCurrentVals,
  saveContext,
}: {
  data: QuarterlyCheckinData | null;
  kompasCurrentVals?: Record<string, number> | null;
  saveContext: (type: string, data: unknown) => Promise<void>;
}) {
  const done = useDashboardDone();
  const [step, setStep] = useState(0);
  const [celebrations, setCelebrations] = useState<string[]>(["", "", ""]);
  const [learnings, setLearnings] = useState<string[]>(["", "", ""]);
  const [adjustments, setAdjustments] = useState<string[]>(["", "", ""]);
  const [areaScores, setAreaScores] = useState<Record<string, number>>(
    kompasCurrentVals ?? data?.areaScores ?? Object.fromEntries(WHEEL_AREAS.map((a) => [a.key, 5]))
  );
  const [focusArea, setFocusArea] = useState(data?.focusArea ?? "");
  const [actionSteps, setActionSteps] = useState<string[]>(["", "", ""]);

  const buildData = useCallback(
    (): QuarterlyCheckinData => ({
      quarter: data?.quarter ?? "",
      celebrations, learnings, adjustments, areaScores,
      focusArea, actionSteps: actionSteps.filter(s => s.trim()),
      updatedAt: new Date().toISOString(),
    }),
    [data, celebrations, learnings, adjustments, areaScores, focusArea, actionSteps]
  );

  const depsKey = JSON.stringify(celebrations) + JSON.stringify(learnings) + JSON.stringify(adjustments) + JSON.stringify(areaScores) + focusArea + JSON.stringify(actionSteps);
  const { saving, saved } = useAutoSave(
    async () => { await saveContext("quarterly", buildData()); },
    [depsKey],
  );

  const syncToKompas = useCallback(async () => {
    try {
      const res = await fetch("/api/manual/user-context");
      if (!res.ok) return;
      const d = await res.json();
      const compass = d.context?.compass;
      if (!compass) return;

      const filledSteps = actionSteps.filter(s => s.trim());
      const now = new Date();
      const updated = {
        ...compass,
        currentVals: areaScores,
        focusArea,
        actionSteps: filledSteps.length > 0 ? filledSteps : compass.actionSteps,
        completedAt: now.toISOString(),
        reflectionDueAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };
      await fetch("/api/manual/user-context", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "compass", data: updated }),
      });

      // Sync focus + steps to monthly priorities
      const areaLabel = WHEEL_AREAS.find(a => a.key === focusArea)?.short ?? focusArea;
      const priorities = d.context?.priorities ?? { weekly: [], monthly: [], yearly: [] };
      const cleaned = (priorities.monthly ?? []).filter(
        (item: { source?: string }) => item.source !== "kolo-zivota"
      );
      const nowStr = now.toISOString();
      const newItems = [
        { text: `Focus: ${areaLabel}`, done: false, source: "kolo-zivota", sourceDate: nowStr },
        ...filledSteps.map(s => ({ text: s, done: false, source: "kolo-zivota", sourceDate: nowStr })),
      ];
      await fetch("/api/manual/user-context", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "priorities", data: { ...priorities, monthly: [...newItems, ...cleaned] } }),
      });
    } catch {}
  }, [areaScores, focusArea, actionSteps]);

  const handleNext = () => { setStep(s => s + 1); };
  const handleFinish = async () => {
    await saveContext("quarterly", buildData());
    await syncToKompas();
    done?.();
  };

  // Sort areas by gap for focus step
  const sortedAreas = [...WHEEL_AREAS]
    .map(a => {
      const cur = areaScores[a.key] ?? 5;
      const goal = 10; // aim high
      return { ...a, cur, diff: goal - cur };
    })
    .sort((a, b) => b.diff - a.diff);

  const listEditor = (items: string[], setItems: (v: string[]) => void, placeholder: string) => (
    <div className="space-y-1.5">
      {items.map((item, i) => (
        <input
          key={i}
          type="text"
          value={item}
          onChange={(e) => {
            const next = [...items];
            next[i] = e.target.value;
            setItems(next);
          }}
          placeholder={`${placeholder} ${i + 1}`}
          className="w-full text-base rounded-xl border border-black/[0.08] bg-white/70 px-3 py-2 text-foreground/70 placeholder:text-foreground/25 focus:outline-none focus:border-black/20 transition-all"
        />
      ))}
    </div>
  );

  const STEPS = [
    { label: "Co se povedlo?", desc: "Oslav své úspěchy — i ty malé. Co se ti povedlo za poslední měsíc?", content: listEditor(celebrations, setCelebrations, "Úspěch") },
    { label: "Co ses naučil/a?", desc: "Jaké lekce ti dal tento měsíc? Z čeho ses poučil/a?", content: listEditor(learnings, setLearnings, "Lekce") },
    { label: "Co změníš?", desc: "Co uděláš jinak v příštím měsíci? Co přidáš, co ubeřeš?", content: listEditor(adjustments, setAdjustments, "Změna") },
    {
      label: "Aktualizuj Kolo života",
      desc: "Jak se změnily tvoje životní oblasti za poslední měsíc? Uprav hodnoty.",
      content: (
        <div className="space-y-3">
          <div className="flex justify-center">
            <InteractiveSpider
              vals={areaScores}
              onChange={(key, score) => setAreaScores(p => ({ ...p, [key]: score }))}
              size={220}
            />
          </div>
          <div className="space-y-2 pt-2 border-t border-black/[0.05]">
            {WHEEL_AREAS.map(a => (
              <div key={a.key} className="flex items-center gap-2">
                <span className="text-sm text-foreground/50 w-20 truncate">{a.short}</span>
                <input
                  type="range" min={1} max={10} value={areaScores[a.key] ?? 5}
                  onChange={e => setAreaScores(p => ({ ...p, [a.key]: Number(e.target.value) }))}
                  className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer"
                  style={{ background: `linear-gradient(to right, #FF8C42 ${((( areaScores[a.key] ?? 5) - 1) / 9) * 100}%, rgba(0,0,0,0.08) ${(((areaScores[a.key] ?? 5) - 1) / 9) * 100}%)` }}
                />
                <span className="text-sm font-bold text-foreground/60 w-5 text-right">{areaScores[a.key] ?? 5}</span>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      label: "Na co se zaměříš?",
      desc: "Vyber jednu oblast, které dáš příští měsíc přednost.",
      content: (
        <div className="space-y-1.5">
          {sortedAreas.map(a => (
            <button
              key={a.key}
              onClick={() => setFocusArea(a.key)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl border text-left text-base transition-all"
              style={focusArea === a.key
                ? { borderColor: "#FF8C42", background: "rgba(255,140,66,0.06)" }
                : { borderColor: "rgba(0,0,0,0.07)" }
              }
            >
              <span className="font-medium text-foreground/70 flex-1">{a.short}</span>
              <span className="text-sm text-foreground/40">{a.cur}/10</span>
            </button>
          ))}
        </div>
      ),
    },
    {
      label: "Konkrétní kroky",
      desc: "Zapiš 1–3 kroky, které uděláš tento měsíc ve vybrané oblasti.",
      content: listEditor(actionSteps, setActionSteps, "Krok"),
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex gap-1">
        {STEPS.map((_, i) => (
          <div key={i} className="h-1 flex-1 rounded-full" style={{ background: i <= step ? "#FF8C42" : "rgba(0,0,0,0.06)" }} />
        ))}
      </div>
      <div>
        <p className="text-sm font-bold text-foreground/70">{STEPS[step].label}</p>
        <p className="text-sm text-foreground/40 mt-0.5 leading-relaxed">{STEPS[step].desc}</p>
      </div>
      {STEPS[step].content}
      <div className="flex items-center gap-2">
        <SaveIndicator saving={saving} saved={saved} />
        <div className="flex-1" />
        {step > 0 && (
          <button onClick={() => setStep(s => s - 1)} className="px-4 py-2 border border-foreground/15 text-foreground/50 rounded-full text-base font-semibold">
            ← Zpět
          </button>
        )}
        <button
          onClick={step === STEPS.length - 1 ? handleFinish : handleNext}
          className="px-5 py-2 bg-accent text-white rounded-full text-base font-bold"
        >
          {step === STEPS.length - 1 ? "Hotovo ✓" : "Dál →"}
        </button>
      </div>
    </div>
  );
}

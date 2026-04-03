"use client";

import { useState, useCallback } from "react";
import { DashboardCard } from "./DashboardCard";
import { InteractiveSpider } from "../charts/SpiderChart";
import { WHEEL_AREAS } from "../shared";
import type { QuarterlyCheckinData } from "@/lib/exercise-registry";

function currentQuarter() {
  const d = new Date();
  return `Q${Math.ceil((d.getMonth() + 1) / 3)} ${d.getFullYear()}`;
}

export function CtvrtletniCard({
  data,
  saveContext,
}: {
  data: QuarterlyCheckinData | null;
  saveContext: (type: string, data: unknown) => Promise<void>;
}) {
  const isEmpty = !data?.updatedAt;

  return (
    <DashboardCard
      emoji="🔄"
      title="Čtvrtletní check-in"
      isEmpty={isEmpty}
      emptyDescription="Zastav se jednou za čtvrt roku. Oslav pokrok, pouč se z chyb a nastav směr na další 3 měsíce."
      editContent={<EditMode data={data} saveContext={saveContext} />}
    >
      <ViewMode data={data!} />
    </DashboardCard>
  );
}

function ViewMode({ data }: { data: QuarterlyCheckinData }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-accent">{data.quarter}</p>
      {data.celebrations?.filter(Boolean).length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-wider text-foreground/30 font-semibold">Oslavy</p>
          {data.celebrations.filter(Boolean).map((c, i) => (
            <p key={i} className="text-xs text-foreground/55">+ {c}</p>
          ))}
        </div>
      )}
      {data.learnings?.filter(Boolean).length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-wider text-foreground/30 font-semibold">Lekce</p>
          {data.learnings.filter(Boolean).map((l, i) => (
            <p key={i} className="text-xs text-foreground/55">{l}</p>
          ))}
        </div>
      )}
    </div>
  );
}

function EditMode({
  data,
  saveContext,
}: {
  data: QuarterlyCheckinData | null;
  saveContext: (type: string, data: unknown) => Promise<void>;
}) {
  const [step, setStep] = useState(0);
  const [celebrations, setCelebrations] = useState<string[]>(data?.celebrations ?? ["", "", ""]);
  const [learnings, setLearnings] = useState<string[]>(data?.learnings ?? ["", "", ""]);
  const [adjustments, setAdjustments] = useState<string[]>(data?.adjustments ?? ["", "", ""]);
  const [areaScores, setAreaScores] = useState<Record<string, number>>(
    data?.areaScores ?? Object.fromEntries(WHEEL_AREAS.map((a) => [a.key, 5]))
  );
  const [saving, setSaving] = useState(false);

  const buildData = useCallback(
    (): QuarterlyCheckinData => ({
      quarter: data?.quarter ?? currentQuarter(),
      celebrations,
      learnings,
      adjustments,
      areaScores,
      updatedAt: new Date().toISOString(),
    }),
    [data, celebrations, learnings, adjustments, areaScores]
  );

  const handleNext = async () => {
    setStep((s) => s + 1);
    setSaving(true);
    await saveContext("quarterly", buildData());
    setSaving(false);
  };

  const handleFinish = async () => {
    setSaving(true);
    await saveContext("quarterly", buildData());
    setSaving(false);
  };

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
          className="w-full text-sm rounded-xl border border-black/[0.08] bg-white/70 px-3 py-2 text-foreground/70 placeholder:text-foreground/25 focus:outline-none focus:border-black/20 transition-all"
        />
      ))}
    </div>
  );

  const steps = [
    { label: "Co se povedlo?", content: listEditor(celebrations, setCelebrations, "Úspěch") },
    { label: "Co ses naučil/a?", content: listEditor(learnings, setLearnings, "Lekce") },
    { label: "Co změníš?", content: listEditor(adjustments, setAdjustments, "Změna") },
    {
      label: "Aktualizuj oblasti",
      content: (
        <div className="flex justify-center">
          <InteractiveSpider
            vals={areaScores}
            onChange={(key, score) => setAreaScores((p) => ({ ...p, [key]: score }))}
            size={220}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex gap-1">
        {steps.map((_, i) => (
          <div key={i} className="h-1 flex-1 rounded-full" style={{ background: i <= step ? "#FF8C42" : "rgba(0,0,0,0.06)" }} />
        ))}
      </div>
      <p className="text-xs font-medium text-foreground/50">{steps[step].label}</p>
      {steps[step].content}
      <div className="flex gap-2">
        {step > 0 && (
          <button onClick={() => setStep((s) => s - 1)} className="flex-1 py-2 border border-foreground/15 text-foreground/50 rounded-full text-sm font-semibold">
            ← Zpět
          </button>
        )}
        <button
          onClick={step === steps.length - 1 ? handleFinish : handleNext}
          disabled={saving}
          className="flex-1 py-2 bg-accent text-white rounded-full text-sm font-bold disabled:opacity-50"
        >
          {saving ? "Ukládám…" : step === steps.length - 1 ? "Uložit ✓" : "Dál →"}
        </button>
      </div>
    </div>
  );
}

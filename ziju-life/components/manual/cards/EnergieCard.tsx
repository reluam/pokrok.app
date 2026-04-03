"use client";

import { useState, useCallback } from "react";
import { DashboardCard, useDashboardDone } from "./DashboardCard";
import type { EnergyAuditData } from "@/lib/exercise-registry";

const EMPTY_ACTIVITY = { name: "", rating: 0, frequency: "" };

export function EnergieCard({
  data,
  saveContext,
}: {
  data: EnergyAuditData | null;
  saveContext: (type: string, data: unknown) => Promise<void>;
}) {
  const isEmpty = !data?.savedAt;

  return (
    <DashboardCard
      emoji="⚡"
      title="Energetický audit"
      isEmpty={isEmpty}
      emptyDescription="Zjisti, co ti dává energii a co ji bere. Pomůže ti naplánovat dny, ze kterých nebudeš vyčerpaný."
      editContent={<EditMode data={data} saveContext={saveContext} />}
    >
      <ViewMode data={data!} />
    </DashboardCard>
  );
}

function ViewMode({ data }: { data: EnergyAuditData }) {
  const filled = (data.activities ?? []).filter((a) => a.name);
  const energizers = filled.filter((a) => a.rating > 0);
  const vampires = filled.filter((a) => a.rating < 0);

  return (
    <div className="space-y-2">
      <div className="flex gap-4 text-xs">
        <span className="text-green-600">+{energizers.length} energizérů</span>
        <span className="text-red-500">-{vampires.length} vampýrů</span>
      </div>
      {energizers.slice(0, 3).map((a, i) => (
        <p key={i} className="text-xs text-foreground/50">+ {a.name} ({a.rating > 0 ? "+" : ""}{a.rating})</p>
      ))}
      {vampires.slice(0, 3).map((a, i) => (
        <p key={i} className="text-xs text-foreground/50">- {a.name} ({a.rating})</p>
      ))}
      {data.insights && (
        <p className="text-xs text-foreground/40 italic mt-1">{data.insights.slice(0, 100)}{data.insights.length > 100 ? "…" : ""}</p>
      )}
    </div>
  );
}

function EditMode({
  data,
  saveContext,
}: {
  data: EnergyAuditData | null;
  saveContext: (type: string, data: unknown) => Promise<void>;
}) {
  const done = useDashboardDone();
  const [step, setStep] = useState(0);
  const [activities, setActivities] = useState(
    data?.activities?.length ? [...data.activities] : Array.from({ length: 5 }, () => ({ ...EMPTY_ACTIVITY }))
  );
  const [insights, setInsights] = useState(data?.insights ?? "");
  const [idealWeek, setIdealWeek] = useState(data?.idealWeek ?? "");
  const [saving, setSaving] = useState(false);

  const buildData = useCallback(
    (): EnergyAuditData => ({
      activities,
      insights,
      idealWeek,
      savedAt: new Date().toISOString(),
    }),
    [activities, insights, idealWeek]
  );

  const handleNext = async () => {
    setStep((s) => s + 1);
    setSaving(true);
    await saveContext("energy", buildData());
    setSaving(false);
  };

  const handleFinish = async () => {
    setSaving(true);
    await saveContext("energy", buildData());
    setSaving(false);
    done?.();
  };

  const addActivity = () => setActivities((p) => [...p, { ...EMPTY_ACTIVITY }]);

  const steps = [
    {
      label: "Aktivity a lidé",
      desc: "Zapiš aktivity, lidi a situace z tvého běžného týdne. Ohodnoť je: +5 = nabíjí tě energií, -5 = kompletně tě vyčerpává.",
      content: (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {activities.map((a, i) => (
            <div key={i} className="flex gap-1.5 items-center">
              <input
                type="text"
                value={a.name}
                onChange={(e) => {
                  const next = [...activities];
                  next[i] = { ...next[i], name: e.target.value };
                  setActivities(next);
                }}
                placeholder="Aktivita/osoba"
                className="flex-1 text-sm rounded-lg border border-black/[0.08] bg-white/70 px-2 py-1.5 text-foreground/70 placeholder:text-foreground/25 focus:outline-none focus:border-black/20 transition-all"
              />
              <select
                value={a.rating}
                onChange={(e) => {
                  const next = [...activities];
                  next[i] = { ...next[i], rating: Number(e.target.value) };
                  setActivities(next);
                }}
                className="w-16 text-xs rounded-lg border border-black/[0.08] bg-white/70 px-1 py-1.5 text-foreground/70 focus:outline-none"
              >
                {[-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5].map((v) => (
                  <option key={v} value={v}>{v > 0 ? `+${v}` : v}</option>
                ))}
              </select>
            </div>
          ))}
          <button onClick={addActivity} className="text-xs text-accent hover:opacity-80">+ Přidat</button>
        </div>
      ),
    },
    {
      label: "Postřehy a ideální týden",
      desc: "Co tě překvapilo? Jaký vzorec vidíš? Jak by vypadal týden, ze kterého bys neodcházel/a vyčerpaný/á?",
      content: (
        <div className="space-y-2">
          <textarea
            value={insights}
            onChange={(e) => setInsights(e.target.value)}
            placeholder="Co tě překvapilo? Jaký vzorec vidíš?"
            rows={3}
            className="w-full text-sm rounded-xl border border-black/[0.08] bg-white/70 px-3 py-2 text-foreground/70 placeholder:text-foreground/25 resize-none focus:outline-none focus:border-black/20 transition-all"
          />
          <textarea
            value={idealWeek}
            onChange={(e) => setIdealWeek(e.target.value)}
            placeholder="Jak by vypadal tvůj ideální týden?"
            rows={3}
            className="w-full text-sm rounded-xl border border-black/[0.08] bg-white/70 px-3 py-2 text-foreground/70 placeholder:text-foreground/25 resize-none focus:outline-none focus:border-black/20 transition-all"
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
      <div>
        <p className="text-xs font-bold text-foreground/70">{steps[step].label}</p>
        <p className="text-[11px] text-foreground/40 mt-0.5 leading-relaxed">{steps[step].desc}</p>
      </div>
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

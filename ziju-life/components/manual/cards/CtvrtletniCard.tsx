"use client";

import { useState, useCallback } from "react";
import { useAutoSave } from "./useAutoSave";
import { SaveIndicator } from "./SaveIndicator";
import { InteractiveSpider } from "../charts/SpiderChart";
import { WHEEL_AREAS } from "../shared";
import type { QuarterlyCheckinData, EnergyAuditData, RelationshipMapData } from "@/lib/exercise-registry";
import type { HodnotyData } from "@/components/HodnotyFlow";

function isDoneToday(data: QuarterlyCheckinData | null): boolean {
  if (!data?.updatedAt) return false;
  return new Date(data.updatedAt).toISOString().slice(0, 10) === new Date().toISOString().slice(0, 10);
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("cs-CZ", { day: "numeric", month: "long", year: "numeric" });
}

export function CtvrtletniCard({
  data,
  kompasCurrentVals,
  hodnotyData,
  energyData,
  relationshipsData,
  saveContext,
}: {
  data: QuarterlyCheckinData | null;
  kompasCurrentVals?: Record<string, number> | null;
  hodnotyData?: HodnotyData | null;
  energyData?: EnergyAuditData | null;
  relationshipsData?: RelationshipMapData | null;
  saveContext: (type: string, data: unknown) => Promise<void>;
}) {
  const doneToday = isDoneToday(data);
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-[24px] border border-black/[0.08] bg-white/65 backdrop-blur-sm shadow-sm px-5 py-4">
      {/* Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-lg">🔄</span>
          <h3 className="text-xl font-extrabold text-foreground">Check-in</h3>
          {data?.updatedAt && (
            <span className="text-base text-foreground/35 ml-1">
              Poslední: {formatDate(data.updatedAt)}
            </span>
          )}
        </div>
        <button
          onClick={() => setOpen(!open)}
          disabled={doneToday}
          className={`px-4 py-2 rounded-full text-base font-bold transition-colors ${
            doneToday
              ? "bg-green-50 text-green-600 border border-green-200 cursor-default"
              : "bg-accent text-white hover:bg-accent-hover"
          }`}
        >
          {doneToday ? "✓ Hotovo dnes" : open ? "Zavřít" : "Nový check-in →"}
        </button>
      </div>

      {/* Check-in flow */}
      {open && !doneToday && (
        <div className="mt-4 border-t border-black/[0.06] pt-4">
          <CheckinFlow
            data={data}
            kompasCurrentVals={kompasCurrentVals}
            hodnotyData={hodnotyData}
            energyData={energyData}
            relationshipsData={relationshipsData}
            saveContext={saveContext}
            onDone={() => setOpen(false)}
          />
        </div>
      )}
    </div>
  );
}

function CheckinFlow({
  data,
  kompasCurrentVals,
  hodnotyData,
  energyData,
  relationshipsData,
  saveContext,
  onDone,
}: {
  data: QuarterlyCheckinData | null;
  kompasCurrentVals?: Record<string, number> | null;
  hodnotyData?: HodnotyData | null;
  energyData?: EnergyAuditData | null;
  relationshipsData?: RelationshipMapData | null;
  saveContext: (type: string, data: unknown) => Promise<void>;
  onDone: () => void;
}) {
  const [step, setStep] = useState(0);
  const [celebrations, setCelebrations] = useState<string[]>(["", "", ""]);
  const [learnings, setLearnings] = useState<string[]>(["", "", ""]);
  const [adjustments, setAdjustments] = useState<string[]>(["", "", ""]);
  const [areaScores, setAreaScores] = useState<Record<string, number>>(
    kompasCurrentVals ?? data?.areaScores ?? Object.fromEntries(WHEEL_AREAS.map((a) => [a.key, 5]))
  );
  const [focusArea, setFocusArea] = useState(data?.focusArea ?? "");
  const [actionSteps, setActionSteps] = useState<string[]>(["", "", ""]);
  const [valueScores, setValueScores] = useState<Record<string, number>>({});

  const values = hodnotyData?.finalValues ?? [];
  const energyItems = (energyData?.items ?? []).filter(a => a.name && !a.dismissed);
  const people = (relationshipsData?.people ?? []).filter(p => p.name && !p.dismissed);

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
      await fetch("/api/manual/user-context", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "compass",
          data: {
            ...compass,
            currentVals: areaScores,
            focusArea,
            actionSteps: filledSteps.length > 0 ? filledSteps : compass.actionSteps,
            completedAt: now.toISOString(),
          },
        }),
      });
    } catch {}
  }, [areaScores, focusArea, actionSteps]);

  const handleFinish = async () => {
    await saveContext("quarterly", buildData());
    // Save value scores as daily-values entry
    if (Object.keys(valueScores).length > 0) {
      try {
        const dvRes = await fetch("/api/manual/user-context");
        if (dvRes.ok) {
          const dvData = await dvRes.json();
          const existing = dvData.context?.["daily-values"]?.entries ?? [];
          const today = new Date().toISOString().slice(0, 10);
          const filtered = existing.filter((e: { date: string }) => e.date !== today);
          filtered.push({ date: today, scores: valueScores });
          await saveContext("daily-values", { entries: filtered.slice(-90) });
        }
      } catch {}
    }
    await syncToKompas();
    onDone();
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
          className="w-full text-base rounded-xl border border-black/[0.08] bg-white/70 px-3 py-2 text-foreground/70 placeholder:text-foreground/25 focus:outline-none focus:border-black/20 transition-all"
        />
      ))}
    </div>
  );

  const sortedAreas = [...WHEEL_AREAS]
    .map(a => ({ ...a, cur: areaScores[a.key] ?? 5 }))
    .sort((a, b) => a.cur - b.cur);

  const STEPS: { label: string; desc: string; content: React.ReactNode }[] = [
    { label: "Co se povedlo?", desc: "Oslav své úspěchy — i ty malé.", content: listEditor(celebrations, setCelebrations, "Úspěch") },
    { label: "Co ses naučil/a?", desc: "Jaké lekce ti dal tento period?", content: listEditor(learnings, setLearnings, "Lekce") },
    { label: "Co změníš?", desc: "Co uděláš jinak? Co přidáš, co ubeřeš?", content: listEditor(adjustments, setAdjustments, "Změna") },
    {
      label: "Kolo života",
      desc: "Jak se mají tvoje životní oblasti?",
      content: (
        <div className="space-y-3">
          <div className="flex justify-center">
            <InteractiveSpider vals={areaScores} onChange={(key, score) => setAreaScores(p => ({ ...p, [key]: score }))} size={220} />
          </div>
          <div className="space-y-2 pt-2 border-t border-black/[0.05]">
            {WHEEL_AREAS.map(a => (
              <div key={a.key} className="flex items-center gap-2">
                <span className="text-base text-foreground/50 w-20 truncate">{a.short}</span>
                <input
                  type="range" min={1} max={10} value={areaScores[a.key] ?? 5}
                  onChange={e => setAreaScores(p => ({ ...p, [a.key]: Number(e.target.value) }))}
                  className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer"
                  style={{ background: `linear-gradient(to right, #FF8C42 ${(((areaScores[a.key] ?? 5) - 1) / 9) * 100}%, rgba(0,0,0,0.08) ${(((areaScores[a.key] ?? 5) - 1) / 9) * 100}%)` }}
                />
                <span className="text-base font-bold text-foreground/60 w-5 text-right">{areaScores[a.key] ?? 5}</span>
              </div>
            ))}
          </div>
        </div>
      ),
    },
  ];

  // Add values step if user has values
  if (values.length > 0) {
    STEPS.push({
      label: "Hodnoty",
      desc: "Jak moc teď žiješ podle svých hodnot? (1–5)",
      content: (
        <div className="space-y-2">
          {values.map((v) => (
            <div key={v} className="flex items-center gap-2">
              <span className="text-base text-foreground/60 flex-1 truncate">{v}</span>
              <div className="flex gap-1 w-[140px] shrink-0">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => setValueScores(p => ({ ...p, [v]: n }))}
                    className={`flex-1 h-7 rounded text-base font-bold transition-all ${
                      (valueScores[v] ?? 0) >= n ? "bg-accent text-white" : "bg-foreground/6 text-foreground/35 hover:bg-accent/15"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      ),
    });
  }

  // Add energy audit step if user has items
  if (energyItems.length > 0 || people.length > 0) {
    STEPS.push({
      label: "Energetický audit",
      desc: "Jak na tom jsi s energií? Posuď aktuální stav.",
      content: (
        <div className="space-y-4">
          {energyItems.length > 0 && (
            <div className="space-y-1">
              <p className="text-base font-semibold text-foreground/40 uppercase tracking-wider">Činnosti</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <p className="text-base text-green-600 font-medium">Nabíjí</p>
                  {energyItems.filter(a => a.rating > 0).map((a, i) => (
                    <p key={i} className="text-base text-foreground/50">+{a.rating} {a.name}</p>
                  ))}
                </div>
                <div className="space-y-1">
                  <p className="text-base text-red-500 font-medium">Bere</p>
                  {energyItems.filter(a => a.rating < 0).map((a, i) => (
                    <p key={i} className="text-base text-foreground/50">{a.rating} {a.name}</p>
                  ))}
                </div>
              </div>
            </div>
          )}
          {people.length > 0 && (
            <div className="space-y-1">
              <p className="text-base font-semibold text-foreground/40 uppercase tracking-wider">Lidé</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <p className="text-base text-green-600 font-medium">Nabíjí</p>
                  {people.filter(p => p.rating > 0).map((p, i) => (
                    <p key={i} className="text-base text-foreground/50">+{p.rating} {p.name}</p>
                  ))}
                </div>
                <div className="space-y-1">
                  <p className="text-base text-red-500 font-medium">Bere</p>
                  {people.filter(p => p.rating < 0).map((p, i) => (
                    <p key={i} className="text-base text-foreground/50">{p.rating} {p.name}</p>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      ),
    });
  }

  // Focus + action steps - always last
  STEPS.push(
    {
      label: "Na co se zaměříš?",
      desc: "Vyber oblast, které dáš přednost.",
      content: (
        <div className="space-y-1.5">
          {sortedAreas.map(a => (
            <button
              key={a.key}
              onClick={() => setFocusArea(a.key)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl border text-left text-base transition-all"
              style={focusArea === a.key ? { borderColor: "#FF8C42", background: "rgba(255,140,66,0.06)" } : { borderColor: "rgba(0,0,0,0.07)" }}
            >
              <span className="font-medium text-foreground/70 flex-1">{a.short}</span>
              <span className="text-base text-foreground/40">{a.cur}/10</span>
            </button>
          ))}
        </div>
      ),
    },
    {
      label: "Konkrétní kroky",
      desc: "Zapiš 1–3 kroky pro vybranou oblast.",
      content: listEditor(actionSteps, setActionSteps, "Krok"),
    },
  );

  return (
    <div className="space-y-3">
      <div className="flex gap-1">
        {STEPS.map((_, i) => (
          <div key={i} className="h-1 flex-1 rounded-full" style={{ background: i <= step ? "#FF8C42" : "rgba(0,0,0,0.06)" }} />
        ))}
      </div>
      <div>
        <p className="text-lg font-bold text-foreground/70">{STEPS[step].label}</p>
        <p className="text-base text-foreground/40 mt-0.5 leading-relaxed">{STEPS[step].desc}</p>
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
          onClick={step === STEPS.length - 1 ? handleFinish : () => setStep(s => s + 1)}
          className="px-5 py-2 bg-accent text-white rounded-full text-base font-bold"
        >
          {step === STEPS.length - 1 ? "Hotovo ✓" : "Dál →"}
        </button>
      </div>
    </div>
  );
}

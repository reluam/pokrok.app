"use client";

import { useState, useCallback } from "react";
import { DashboardCard, useDashboardDone } from "./DashboardCard";
import { useAutoSave } from "./useAutoSave";
import { SaveIndicator } from "./SaveIndicator";
import type { EnergyAuditData } from "@/lib/exercise-registry";

type Item = { name: string; rating: number; dismissed: boolean; actionPlan: string };
const EMPTY_ITEM: Item = { name: "", rating: 0, dismissed: false, actionPlan: "" };

export function EnergieCard({
  data,
  saveContext,
}: {
  data: EnergyAuditData | null;
  saveContext: (type: string, data: unknown) => Promise<void>;
}) {
  const isEmpty = !data?.savedAt;

  const statsContent = data?.items ? (() => {
    const active = data.items.filter((a) => a.name && !a.dismissed);
    const avgRating = active.length > 0 ? active.reduce((s, a) => s + a.rating, 0) / active.length : 0;
    const withPlan = active.filter((a) => a.rating < 0 && a.actionPlan.trim()).length;
    const drainersTotal = active.filter((a) => a.rating < 0).length;
    return (
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="px-2 py-2 rounded-xl bg-foreground/[0.03] border border-foreground/[0.06]">
          <p className="text-xl font-bold text-foreground/70">{active.length}</p>
          <p className="text-base text-foreground/40">Celkem</p>
        </div>
        <div className="px-2 py-2 rounded-xl bg-foreground/[0.03] border border-foreground/[0.06]">
          <p className={`text-xl font-bold ${avgRating >= 0 ? "text-green-600" : "text-red-500"}`}>{avgRating.toFixed(1)}</p>
          <p className="text-base text-foreground/40">Průměr</p>
        </div>
        <div className="px-2 py-2 rounded-xl bg-foreground/[0.03] border border-foreground/[0.06]">
          <p className="text-xl font-bold text-foreground/70">{withPlan}/{drainersTotal}</p>
          <p className="text-base text-foreground/40">S plánem</p>
        </div>
      </div>
    );
  })() : undefined;

  return (
    <DashboardCard
      emoji="⚡"
      title="Činnosti"
      isEmpty={isEmpty}
      emptyDescription="Zapiš činnosti ze svého dne a zjisti, co ti dává energii a co ji bere."
      editContent={<EditMode data={data} saveContext={saveContext} />}
      statsContent={statsContent}
    >
      <ViewMode data={data!} />
    </DashboardCard>
  );
}

function ViewMode({ data }: { data: EnergyAuditData }) {
  const items = (data.items ?? []).filter((a) => a.name);
  const active = items.filter((a) => !a.dismissed);
  const energizers = active.filter((a) => a.rating > 0).sort((a, b) => b.rating - a.rating);
  const drainers = active.filter((a) => a.rating < 0).sort((a, b) => a.rating - b.rating);
  const dismissed = items.filter((a) => a.dismissed);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <p className="text-base font-semibold text-green-600">⚡ Nabíjí ({energizers.length})</p>
          {energizers.map((a, i) => (
            <p key={i} className="text-base text-foreground/60">+{a.rating} {a.name}</p>
          ))}
          {energizers.length === 0 && <p className="text-base text-foreground/30 italic">Žádné</p>}
        </div>
        <div className="space-y-1.5">
          <p className="text-base font-semibold text-red-500">🧛 Bere ({drainers.length})</p>
          {drainers.map((a, i) => (
            <p key={i} className="text-base text-foreground/60">{a.rating} {a.name}</p>
          ))}
          {drainers.length === 0 && <p className="text-base text-foreground/30 italic">Žádné</p>}
        </div>
      </div>
      {dismissed.length > 0 && (
        <p className="text-lg text-foreground/30 line-through">{dismissed.length} vyškrtnuto</p>
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
  const [items, setItems] = useState<Item[]>(
    data?.items?.length ? [...data.items] : Array.from({ length: 3 }, () => ({ ...EMPTY_ITEM }))
  );

  const buildData = useCallback(
    (): EnergyAuditData => ({ items, savedAt: new Date().toISOString() }),
    [items]
  );

  const depsKey = JSON.stringify(items);
  const { saving, saved } = useAutoSave(
    async () => { await saveContext("energy", buildData()); },
    [depsKey],
  );

  const addItem = () => setItems((p) => [...p, { ...EMPTY_ITEM }]);

  return (
    <div className="space-y-3">
      <p className="text-base text-foreground/40 leading-relaxed">
        Zapiš činnosti a ohodnoť je: +5 = nabíjí, -5 = vyčerpává. Nepotřebné vyškrtni.
      </p>
      <div className="space-y-2 max-h-72 overflow-y-auto">
        {items.map((a, i) => (
          <div key={i} className={`flex gap-1.5 items-center ${a.dismissed ? "opacity-40" : ""}`}>
            <input
              type="text"
              value={a.name}
              onChange={(e) => {
                const next = [...items];
                next[i] = { ...next[i], name: e.target.value };
                setItems(next);
              }}
              placeholder="Činnost"
              className={`flex-1 text-base rounded-lg border border-black/[0.08] bg-white/70 px-2 py-1.5 text-foreground/70 placeholder:text-foreground/25 focus:outline-none focus:border-black/20 transition-all ${a.dismissed ? "line-through" : ""}`}
            />
            <select
              value={a.rating}
              onChange={(e) => {
                const next = [...items];
                next[i] = { ...next[i], rating: Number(e.target.value) };
                setItems(next);
              }}
              className="w-16 text-lg rounded-lg border border-black/[0.08] bg-white/70 px-1 py-1.5 text-foreground/70 focus:outline-none"
            >
              {[-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5].map((v) => (
                <option key={v} value={v}>{v > 0 ? `+${v}` : v}</option>
              ))}
            </select>
            {a.name && (
              <button
                onClick={() => {
                  const next = [...items];
                  next[i] = { ...next[i], dismissed: !next[i].dismissed };
                  setItems(next);
                }}
                className={`text-base w-7 h-7 rounded-full flex-shrink-0 ${a.dismissed ? "bg-foreground/10 text-foreground/50" : "bg-foreground/5 text-foreground/30 hover:bg-foreground/10"}`}
              >
                {a.dismissed ? "↩" : "✕"}
              </button>
            )}
          </div>
        ))}
        <button onClick={addItem} className="text-base text-accent hover:opacity-80">+ Přidat</button>
      </div>
      <div className="flex items-center justify-between">
        <SaveIndicator saving={saving} saved={saved} />
        <button
          onClick={() => done?.()}
          className="px-4 py-2 bg-accent text-white rounded-full text-base font-bold disabled:opacity-50"
        >
          Hotovo ✓
        </button>
      </div>
    </div>
  );
}

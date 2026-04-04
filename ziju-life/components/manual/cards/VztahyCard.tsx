"use client";

import { useState, useCallback } from "react";
import { DashboardCard, useDashboardDone } from "./DashboardCard";
import { useAutoSave } from "./useAutoSave";
import { SaveIndicator } from "./SaveIndicator";
import type { RelationshipMapData } from "@/lib/exercise-registry";

type Person = { name: string; rating: number; dismissed: boolean; note: string };
const EMPTY_PERSON: Person = { name: "", rating: 0, dismissed: false, note: "" };

export function VztahyCard({
  data,
  saveContext,
}: {
  data: RelationshipMapData | null;
  saveContext: (type: string, data: unknown) => Promise<void>;
}) {
  const isEmpty = !data?.savedAt;

  const statsContent = data?.people ? (() => {
    const active = data.people.filter((p) => p.name && !p.dismissed);
    const avgRating = active.length > 0 ? active.reduce((s, p) => s + p.rating, 0) / active.length : 0;
    const pos = active.filter((p) => p.rating > 0).length;
    const neg = active.filter((p) => p.rating < 0).length;
    return (
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="px-2 py-2 rounded-xl bg-foreground/[0.03] border border-foreground/[0.06]">
          <p className="text-xl font-bold text-foreground/70">{active.length}</p>
          <p className="text-base text-foreground/40">Celkem</p>
        </div>
        <div className="px-2 py-2 rounded-xl bg-green-50 border border-green-200">
          <p className="text-xl font-bold text-green-600">{pos}</p>
          <p className="text-base text-foreground/40">Nabíjí</p>
        </div>
        <div className="px-2 py-2 rounded-xl bg-red-50 border border-red-200">
          <p className="text-xl font-bold text-red-500">{neg}</p>
          <p className="text-base text-foreground/40">Vyčerpává</p>
        </div>
      </div>
    );
  })() : undefined;

  return (
    <DashboardCard
      emoji="👥"
      title="Lidé"
      isEmpty={isEmpty}
      emptyDescription="Zmapuj lidi kolem sebe — kdo ti přidává energii a kdo ji bere."
      editContent={<EditMode data={data} saveContext={saveContext} />}
      statsContent={statsContent}
    >
      <ViewMode data={data!} />
    </DashboardCard>
  );
}

function ViewMode({ data }: { data: RelationshipMapData }) {
  const people = (data.people ?? []).filter((p) => p.name);
  const active = people.filter((p) => !p.dismissed);
  const energizers = active.filter((p) => p.rating > 0).sort((a, b) => b.rating - a.rating);
  const drainers = active.filter((p) => p.rating < 0).sort((a, b) => a.rating - b.rating);
  const dismissed = people.filter((p) => p.dismissed);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <p className="text-base font-semibold text-green-600">⚡ Nabíjí ({energizers.length})</p>
          {energizers.map((p, i) => (
            <p key={i} className="text-base text-foreground/60">+{p.rating} {p.name}</p>
          ))}
          {energizers.length === 0 && <p className="text-base text-foreground/30 italic">Žádní</p>}
        </div>
        <div className="space-y-1.5">
          <p className="text-base font-semibold text-red-500">🧛 Bere ({drainers.length})</p>
          {drainers.map((p, i) => (
            <p key={i} className="text-base text-foreground/60">{p.rating} {p.name}</p>
          ))}
          {drainers.length === 0 && <p className="text-base text-foreground/30 italic">Žádní</p>}
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
  data: RelationshipMapData | null;
  saveContext: (type: string, data: unknown) => Promise<void>;
}) {
  const done = useDashboardDone();
  const [people, setPeople] = useState<Person[]>(
    data?.people?.length ? [...data.people] : Array.from({ length: 3 }, () => ({ ...EMPTY_PERSON }))
  );

  const buildData = useCallback(
    (): RelationshipMapData => ({ people, savedAt: new Date().toISOString() }),
    [people]
  );

  const depsKey = JSON.stringify(people);
  const { saving, saved } = useAutoSave(
    async () => { await saveContext("relationships", buildData()); },
    [depsKey],
  );

  const addPerson = () => setPeople((p) => [...p, { ...EMPTY_PERSON }]);

  return (
    <div className="space-y-3">
      <p className="text-base text-foreground/40 leading-relaxed">
        Zapiš lidi a ohodnoť je: +5 = nabíjí, -5 = vyčerpává. Nepotřebné vyškrtni.
      </p>
      <div className="space-y-2 max-h-72 overflow-y-auto">
        {people.map((p, i) => (
          <div key={i} className={`flex gap-1.5 items-center ${p.dismissed ? "opacity-40" : ""}`}>
            <input
              type="text"
              value={p.name}
              onChange={(e) => {
                const next = [...people];
                next[i] = { ...next[i], name: e.target.value };
                setPeople(next);
              }}
              placeholder="Jméno"
              className={`flex-1 text-base rounded-lg border border-black/[0.08] bg-white/70 px-2 py-1.5 text-foreground/70 placeholder:text-foreground/25 focus:outline-none focus:border-black/20 transition-all ${p.dismissed ? "line-through" : ""}`}
            />
            <select
              value={p.rating}
              onChange={(e) => {
                const next = [...people];
                next[i] = { ...next[i], rating: Number(e.target.value) };
                setPeople(next);
              }}
              className="w-16 text-lg rounded-lg border border-black/[0.08] bg-white/70 px-1 py-1.5 text-foreground/70 focus:outline-none"
            >
              {[-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5].map((v) => (
                <option key={v} value={v}>{v > 0 ? `+${v}` : v}</option>
              ))}
            </select>
            {p.name && (
              <button
                onClick={() => {
                  const next = [...people];
                  next[i] = { ...next[i], dismissed: !next[i].dismissed };
                  setPeople(next);
                }}
                className={`text-base w-7 h-7 rounded-full flex-shrink-0 ${p.dismissed ? "bg-foreground/10 text-foreground/50" : "bg-foreground/5 text-foreground/30 hover:bg-foreground/10"}`}
              >
                {p.dismissed ? "↩" : "✕"}
              </button>
            )}
          </div>
        ))}
        <button onClick={addPerson} className="text-base text-accent hover:opacity-80">+ Přidat</button>
      </div>
      <div className="flex items-center justify-between">
        <SaveIndicator saving={saving} saved={saved} />
        <div className="flex-1" />
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

"use client";

import { useState, useCallback } from "react";
import { DashboardCard } from "./DashboardCard";
import type { RelationshipMapData } from "@/lib/exercise-registry";

type Person = { name: string; circle: "inner" | "middle" | "outer"; health: number; energizes: boolean; note: string };
const EMPTY_PERSON: Person = { name: "", circle: "middle", health: 5, energizes: true, note: "" };
const CIRCLE_LABELS = { inner: "Blízcí", middle: "Střed", outer: "Vnější" };

export function VztahyCard({
  data,
  saveContext,
}: {
  data: RelationshipMapData | null;
  saveContext: (type: string, data: unknown) => Promise<void>;
}) {
  const isEmpty = !data?.savedAt;

  return (
    <DashboardCard
      emoji="🗺️"
      title="Mapa vztahů"
      isEmpty={isEmpty}
      editContent={<EditMode data={data} saveContext={saveContext} />}
    >
      <ViewMode data={data!} />
    </DashboardCard>
  );
}

function ViewMode({ data }: { data: RelationshipMapData }) {
  const people = (data.people ?? []).filter((p) => p.name);
  const byCircle = { inner: people.filter((p) => p.circle === "inner"), middle: people.filter((p) => p.circle === "middle"), outer: people.filter((p) => p.circle === "outer") };

  return (
    <div className="space-y-2">
      <p className="text-xs text-foreground/40">{people.length} lidí zmapováno</p>
      {(["inner", "middle", "outer"] as const).map((c) => {
        if (byCircle[c].length === 0) return null;
        return (
          <div key={c}>
            <p className="text-[10px] uppercase tracking-wider text-foreground/30 font-semibold">{CIRCLE_LABELS[c]}</p>
            <div className="flex flex-wrap gap-1 mt-0.5">
              {byCircle[c].map((p, i) => (
                <span key={i} className={`text-xs px-2 py-0.5 rounded-full ${p.energizes ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                  {p.name}
                </span>
              ))}
            </div>
          </div>
        );
      })}
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
  const [people, setPeople] = useState<Person[]>(
    data?.people?.length ? [...data.people] : Array.from({ length: 5 }, () => ({ ...EMPTY_PERSON }))
  );
  const [insights, setInsights] = useState(data?.insights ?? "");
  const [saving, setSaving] = useState(false);

  const handleSave = useCallback(async () => {
    setSaving(true);
    await saveContext("relationships", { people, insights, savedAt: new Date().toISOString() });
    setSaving(false);
  }, [people, insights, saveContext]);

  const addPerson = () => setPeople((p) => [...p, { ...EMPTY_PERSON }]);

  return (
    <div className="space-y-3">
      <div className="space-y-2 max-h-72 overflow-y-auto">
        {people.map((p, i) => (
          <div key={i} className="flex gap-1.5 items-center">
            <input
              type="text"
              value={p.name}
              onChange={(e) => {
                const next = [...people];
                next[i] = { ...next[i], name: e.target.value };
                setPeople(next);
              }}
              placeholder="Jméno"
              className="flex-1 text-sm rounded-lg border border-black/[0.08] bg-white/70 px-2 py-1.5 text-foreground/70 placeholder:text-foreground/25 focus:outline-none focus:border-black/20 transition-all"
            />
            <select
              value={p.circle}
              onChange={(e) => {
                const next = [...people];
                next[i] = { ...next[i], circle: e.target.value as Person["circle"] };
                setPeople(next);
              }}
              className="w-20 text-xs rounded-lg border border-black/[0.08] bg-white/70 px-1 py-1.5 text-foreground/70 focus:outline-none"
            >
              <option value="inner">Blízcí</option>
              <option value="middle">Střed</option>
              <option value="outer">Vnější</option>
            </select>
            <button
              onClick={() => {
                const next = [...people];
                next[i] = { ...next[i], energizes: !next[i].energizes };
                setPeople(next);
              }}
              className={`text-sm w-7 h-7 rounded-full flex-shrink-0 ${p.energizes ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"}`}
            >
              {p.energizes ? "+" : "-"}
            </button>
          </div>
        ))}
        <button onClick={addPerson} className="text-xs text-accent hover:opacity-80">+ Přidat</button>
      </div>
      <textarea
        value={insights}
        onChange={(e) => setInsights(e.target.value)}
        placeholder="Co tě překvapilo? Jaký vzorec vidíš?"
        rows={2}
        className="w-full text-sm rounded-xl border border-black/[0.08] bg-white/70 px-3 py-2 text-foreground/70 placeholder:text-foreground/25 resize-none focus:outline-none focus:border-black/20 transition-all"
      />
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-2 bg-accent text-white rounded-full text-sm font-bold disabled:opacity-50"
      >
        {saving ? "Ukládám…" : "Uložit ✓"}
      </button>
    </div>
  );
}

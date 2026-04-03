"use client";

import { useState, useCallback } from "react";
import { DashboardCard } from "./DashboardCard";
import type { PhilosophyData } from "@/lib/exercise-registry";

export function FilozofieCard({
  data,
  saveContext,
}: {
  data: PhilosophyData | null;
  saveContext: (type: string, data: unknown) => Promise<void>;
}) {
  const isEmpty = !data?.statement;

  return (
    <DashboardCard
      emoji="🌱"
      title="Životní filozofie"
      isEmpty={isEmpty}
      emptyDescription="Shrň do pár vět, jak chceš žít. Tvoje životní filozofie je kompas, když přijde těžké rozhodnutí."
      editContent={<EditMode data={data} saveContext={saveContext} />}
    >
      <ViewMode data={data!} />
    </DashboardCard>
  );
}

function ViewMode({ data }: { data: PhilosophyData }) {
  const principles = (data.principles ?? []).filter(Boolean);
  return (
    <div className="space-y-3">
      <p className="text-sm text-foreground/60 leading-relaxed italic">&ldquo;{data.statement}&rdquo;</p>
      {principles.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {principles.map((p, i) => (
            <span key={i} className="text-xs px-2 py-0.5 rounded-lg bg-green-50 text-green-700 font-medium">
              {p}
            </span>
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
  data: PhilosophyData | null;
  saveContext: (type: string, data: unknown) => Promise<void>;
}) {
  const [statement, setStatement] = useState(data?.statement ?? "");
  const [principles, setPrinciples] = useState<string[]>(data?.principles ?? ["", "", "", "", ""]);
  const [saving, setSaving] = useState(false);

  const handleSave = useCallback(async () => {
    setSaving(true);
    await saveContext("philosophy", {
      statement,
      principles,
      savedAt: new Date().toISOString(),
    });
    setSaving(false);
  }, [statement, principles, saveContext]);

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <label className="text-xs font-medium text-foreground/50">Moje životní filozofie (2–5 vět)</label>
        <textarea
          value={statement}
          onChange={(e) => setStatement(e.target.value)}
          placeholder="Žiji tak, že..."
          rows={4}
          className="w-full text-sm rounded-xl border border-black/[0.08] bg-white/70 px-3 py-2 text-foreground/70 placeholder:text-foreground/25 resize-none focus:outline-none focus:border-black/20 transition-all"
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-foreground/50">Hlavní principy (volitelné)</label>
        {principles.map((p, i) => (
          <input
            key={i}
            type="text"
            value={p}
            onChange={(e) => {
              const next = [...principles];
              next[i] = e.target.value;
              setPrinciples(next);
            }}
            placeholder={`Princip ${i + 1}`}
            className="w-full text-sm rounded-xl border border-black/[0.08] bg-white/70 px-3 py-2 text-foreground/70 placeholder:text-foreground/25 focus:outline-none focus:border-black/20 transition-all"
          />
        ))}
      </div>
      <button
        onClick={handleSave}
        disabled={saving || !statement.trim()}
        className="w-full py-2 bg-accent text-white rounded-full text-sm font-bold hover:bg-accent-hover transition-colors disabled:opacity-50"
      >
        {saving ? "Ukládám…" : "Uložit ✓"}
      </button>
    </div>
  );
}

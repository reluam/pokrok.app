"use client";

import { useState } from "react";
import type { RelationshipMapData } from "@/lib/exercise-registry";

type Person = { name: string; rating: number; dismissed: boolean; note: string };

const EMPTY_PERSON: Person = { name: "", rating: 0, dismissed: false, note: "" };

export default function RelationshipMapFlow({
  initialData,
  onSave,
  onComplete,
}: {
  initialData: RelationshipMapData | null;
  onSave: (data: RelationshipMapData) => Promise<void>;
  onComplete: () => void;
}) {
  const [people, setPeople] = useState<Person[]>(
    initialData?.people?.length ? [...initialData.people] : Array.from({ length: 5 }, () => ({ ...EMPTY_PERSON }))
  );
  const [saving, setSaving] = useState(false);

  function updatePerson(idx: number, field: keyof Person, value: string | number | boolean) {
    const next = [...people];
    next[idx] = { ...next[idx], [field]: value };
    setPeople(next);
  }

  function addPerson() {
    setPeople((prev) => [...prev, { ...EMPTY_PERSON }]);
  }

  function removePerson(idx: number) {
    setPeople((prev) => prev.filter((_, i) => i !== idx));
  }

  const filled = people.filter((p) => p.name.trim());
  const energizers = filled.filter((p) => p.rating > 0 && !p.dismissed);
  const drainers = filled.filter((p) => p.rating < 0 && !p.dismissed);

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <h2 className="text-xl font-bold text-foreground">👥 Lidé — kdo ti dává a bere energii</h2>
        <p className="text-base text-foreground/55 mt-1 leading-relaxed">
          Zapiš lidi ze svého života — rodinu, přátele, kolegy, známé.
          Ohodnoť každého na stejné stupnici: <strong className="text-green-600">+5</strong> = maximálně tě nabíjí,{" "}
          <strong className="text-red-500">-5</strong> = totálně vyčerpává.
        </p>
      </div>

      <div className="space-y-3">
        {people.map((p, i) => (
          <div key={i} className={`bg-white border rounded-[20px] px-4 py-4 space-y-2 transition-opacity ${p.dismissed ? "opacity-40 border-black/5" : "border-black/8"}`}>
            <div className="flex items-center gap-2">
              <input
                value={p.name}
                onChange={(e) => updatePerson(i, "name", e.target.value)}
                className={`flex-1 px-3 py-2 border border-black/10 rounded-xl text-base bg-white focus:ring-2 focus:ring-accent/20 focus:border-accent ${p.dismissed ? "line-through text-foreground/30" : ""}`}
                placeholder={`Osoba ${i + 1}...`}
              />
              {p.name && (
                <div className="flex gap-1">
                  <button
                    onClick={() => updatePerson(i, "dismissed", !p.dismissed)}
                    className={`text-lg px-2 py-1 rounded-lg transition-colors ${p.dismissed ? "bg-foreground/10 text-foreground/50" : "bg-foreground/5 text-foreground/30 hover:bg-foreground/10"}`}
                    title={p.dismissed ? "Obnovit" : "Vyškrtnout"}
                  >
                    {p.dismissed ? "↩" : "✕"}
                  </button>
                  <button
                    onClick={() => removePerson(i)}
                    className="text-lg px-2 py-1 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 transition-colors"
                    title="Smazat"
                  >
                    🗑
                  </button>
                </div>
              )}
            </div>

            {p.name && !p.dismissed && (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-lg text-red-400 w-6 shrink-0">-5</span>
                  <div className="flex-1 flex gap-0.5">
                    {Array.from({ length: 11 }, (_, j) => j - 5).map((v) => (
                      <button
                        key={v}
                        onClick={() => updatePerson(i, "rating", v)}
                        className={`flex-1 h-7 rounded text-base font-bold transition-all ${
                          v === p.rating
                            ? v > 0 ? "bg-green-500 text-white" : v < 0 ? "bg-red-500 text-white" : "bg-foreground/20 text-white"
                            : "bg-foreground/5 text-foreground/30 hover:bg-foreground/10"
                        }`}
                      >
                        {v > 0 ? `+${v}` : v}
                      </button>
                    ))}
                  </div>
                  <span className="text-lg text-green-500 w-6 text-right shrink-0">+5</span>
                </div>

                <input
                  value={p.note}
                  onChange={(e) => updatePerson(i, "note", e.target.value)}
                  className="w-full px-3 py-2 border border-black/10 rounded-xl text-lg bg-white text-foreground/60"
                  placeholder="Poznámka (volitelné)..."
                />
              </>
            )}
          </div>
        ))}
      </div>

      <button onClick={addPerson} className="text-base text-accent font-semibold hover:underline">
        + Přidat osobu
      </button>

      {/* Summary */}
      {filled.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <div className="px-4 py-3 rounded-2xl bg-green-50 border border-green-200 text-center">
            <p className="text-2xl font-bold text-green-600">{energizers.length}</p>
            <p className="text-lg text-green-700">nabíjí tě</p>
          </div>
          <div className="px-4 py-3 rounded-2xl bg-red-50 border border-red-200 text-center">
            <p className="text-2xl font-bold text-red-500">{drainers.length}</p>
            <p className="text-lg text-red-600">vyčerpává</p>
          </div>
        </div>
      )}

      <button
        onClick={async () => {
          setSaving(true);
          await onSave({ people, savedAt: new Date().toISOString() });
          setSaving(false);
          onComplete();
        }}
        disabled={saving || filled.length === 0}
        className="w-full py-2.5 bg-accent text-white rounded-full font-bold text-base hover:bg-accent-hover transition-colors disabled:opacity-40"
      >
        {saving ? "Ukládám…" : "Uložit ✓"}
      </button>
    </div>
  );
}

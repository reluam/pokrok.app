"use client";

import { useState } from "react";
import type { EnergyAuditData } from "@/lib/exercise-registry";

type Item = { name: string; rating: number; dismissed: boolean; actionPlan: string };

const EMPTY_ITEM: Item = { name: "", rating: 0, dismissed: false, actionPlan: "" };

type Step = "items" | "actions";

export default function EnergyAuditFlow({
  initialData,
  onSave,
  onComplete,
}: {
  initialData: EnergyAuditData | null;
  onSave: (data: EnergyAuditData) => Promise<void>;
  onComplete: () => void;
}) {
  const [items, setItems] = useState<Item[]>(
    initialData?.items?.length ? [...initialData.items] : Array.from({ length: 5 }, () => ({ ...EMPTY_ITEM }))
  );
  const [step, setStep] = useState<Step>("items");
  const [saving, setSaving] = useState(false);

  function updateItem(idx: number, field: keyof Item, value: string | number | boolean) {
    const next = [...items];
    next[idx] = { ...next[idx], [field]: value };
    setItems(next);
  }

  function addItem() {
    setItems((prev) => [...prev, { ...EMPTY_ITEM }]);
  }

  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  const filled = items.filter((a) => a.name.trim());
  const drainers = filled.filter((a) => a.rating < 0 && !a.dismissed);

  // ── Step 1: List & rate activities ──
  if (step === "items") {
    return (
      <div className="max-w-2xl mx-auto space-y-5">
        <div>
          <h2 className="text-xl font-bold text-foreground">⚡ Činnosti — co ti dává a bere energii</h2>
          <p className="text-base text-foreground/55 mt-1 leading-relaxed">
            Zapiš činnosti ze svého běžného dne — práce, povinnosti, koníčky, rutiny.
            Ohodnoť každou na stupnici: <strong className="text-green-600">+5</strong> = maximálně tě nabíjí,{" "}
            <strong className="text-red-500">-5</strong> = totálně vyčerpává.
          </p>
        </div>

        <div className="space-y-3">
          {items.map((a, i) => (
            <div key={i} className={`bg-white border rounded-[20px] px-4 py-4 space-y-2 transition-opacity ${a.dismissed ? "opacity-40 border-black/5" : "border-black/8"}`}>
              <div className="flex items-center gap-2">
                <input
                  value={a.name}
                  onChange={(e) => updateItem(i, "name", e.target.value)}
                  className={`flex-1 px-3 py-2 border border-black/10 rounded-xl text-base bg-white focus:ring-2 focus:ring-accent/20 focus:border-accent ${a.dismissed ? "line-through text-foreground/30" : ""}`}
                  placeholder={`Činnost ${i + 1}...`}
                />
                {a.name && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => updateItem(i, "dismissed", !a.dismissed)}
                      className={`text-lg px-2 py-1 rounded-lg transition-colors ${a.dismissed ? "bg-foreground/10 text-foreground/50" : "bg-foreground/5 text-foreground/30 hover:bg-foreground/10"}`}
                      title={a.dismissed ? "Obnovit" : "Vyškrtnout"}
                    >
                      {a.dismissed ? "↩" : "✕"}
                    </button>
                    <button
                      onClick={() => removeItem(i)}
                      className="text-lg px-2 py-1 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 transition-colors"
                      title="Smazat"
                    >
                      🗑
                    </button>
                  </div>
                )}
              </div>

              {a.name && !a.dismissed && (
                <div className="flex items-center gap-2">
                  <span className="text-lg text-red-400 w-6 shrink-0">-5</span>
                  <div className="flex-1 flex gap-0.5">
                    {Array.from({ length: 11 }, (_, j) => j - 5).map((v) => (
                      <button
                        key={v}
                        onClick={() => updateItem(i, "rating", v)}
                        className={`flex-1 h-7 rounded text-base font-bold transition-all ${
                          v === a.rating
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
              )}
            </div>
          ))}
        </div>

        <button onClick={addItem} className="text-base text-accent font-semibold hover:underline">
          + Přidat činnost
        </button>

        <button
          onClick={() => setStep("actions")}
          disabled={filled.length === 0}
          className="w-full py-2.5 bg-accent text-white rounded-full font-bold text-base hover:bg-accent-hover transition-colors disabled:opacity-40"
        >
          {drainers.length > 0 ? `Dál — co s ${drainers.length} zloději energie →` : "Dál — shrnutí →"}
        </button>
      </div>
    );
  }

  // ── Step 2: Action plan for drainers ──
  if (step === "actions") {
    const energizers = filled.filter((a) => a.rating > 0 && !a.dismissed).sort((a, b) => b.rating - a.rating);

    return (
      <div className="max-w-2xl mx-auto space-y-5">
        <div>
          <h2 className="text-xl font-bold text-foreground">⚡ Co s tím uděláš?</h2>
          <p className="text-base text-foreground/55 mt-1 leading-relaxed">
            Pro každého zloděje energie napiš, co s tím můžeš udělat — omezit, delegovat, změnit přístup, nebo to přestat dělat úplně.
          </p>
        </div>

        {drainers.length > 0 ? (
          <div className="space-y-3">
            <p className="text-lg font-bold text-red-600 uppercase tracking-wider">Zloději energie</p>
            {drainers.map((a) => {
              const origIdx = items.indexOf(a);
              return (
                <div key={origIdx} className="bg-red-50 border border-red-200 rounded-[20px] px-4 py-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-base text-red-800">{a.name}</p>
                    <span className="text-lg font-bold text-red-500">{a.rating}</span>
                  </div>
                  <textarea
                    value={a.actionPlan}
                    onChange={(e) => updateItem(origIdx, "actionPlan", e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-red-200 rounded-xl text-base bg-white focus:ring-2 focus:ring-accent/20 focus:border-accent resize-none"
                    placeholder="Co s tím uděláš? Např. zkrátit, delegovat, přestat..."
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="px-4 py-6 rounded-2xl bg-green-50 border border-green-200 text-center">
            <p className="text-base text-green-700 font-medium">Nemáš žádné zloděje energie — skvělé!</p>
          </div>
        )}

        {energizers.length > 0 && (
          <div className="space-y-2">
            <p className="text-lg font-bold text-green-600 uppercase tracking-wider">Energizéry</p>
            <div className="flex flex-wrap gap-2">
              {energizers.map((a, i) => (
                <span key={i} className="px-3 py-1.5 rounded-xl text-base font-medium bg-green-50 border border-green-200 text-green-800">
                  +{a.rating} {a.name}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <button onClick={() => setStep("items")} className="flex-1 py-2.5 border border-foreground/15 text-foreground/60 rounded-full font-semibold text-base">
            ← Zpět
          </button>
          <button
            onClick={async () => {
              setSaving(true);
              await onSave({ items, savedAt: new Date().toISOString() });
              setSaving(false);
              onComplete();
            }}
            disabled={saving}
            className="flex-1 py-2.5 bg-accent text-white rounded-full font-bold text-base hover:bg-accent-hover transition-colors disabled:opacity-60"
          >
            {saving ? "Ukládám…" : "Uložit ✓"}
          </button>
        </div>
      </div>
    );
  }

  return null;
}

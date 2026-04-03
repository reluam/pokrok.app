"use client";

import { useState } from "react";

export type EnergyActivity = { name: string; rating: number; frequency: string };

export type EnergyAuditData = {
  activities: EnergyActivity[];
  insights: string;
  idealWeek: string;
  savedAt: string;
};

type Step = "list" | "rate" | "reflect";

const FREQUENCIES = ["Denně", "Několikrát týdně", "Týdně", "Občas", "Zřídka"];

const EMPTY: EnergyAuditData = {
  activities: Array.from({ length: 10 }, () => ({ name: "", rating: 0, frequency: "" })),
  insights: "",
  idealWeek: "",
  savedAt: "",
};

export default function EnergyAuditFlow({
  initialData,
  onSave,
  onComplete,
}: {
  initialData: EnergyAuditData | null;
  onSave: (data: EnergyAuditData) => Promise<void>;
  onComplete: () => void;
}) {
  const [data, setData] = useState<EnergyAuditData>(initialData ?? EMPTY);
  const [step, setStep] = useState<Step>("list");
  const [saving, setSaving] = useState(false);

  // ── Step 1: List activities ──
  if (step === "list") {
    return (
      <div className="max-w-2xl mx-auto space-y-5">
        <div>
          <h2 className="text-xl font-bold text-foreground">⚡ Energetický audit</h2>
          <p className="text-sm text-foreground/55 mt-1">
            Napiš 10 aktivit ze svého typického týdne — práce, vztahy, koníčky, povinnosti.
          </p>
        </div>

        <div className="space-y-2">
          {data.activities.map((a, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-xs text-foreground/30 w-5 shrink-0">{i + 1}.</span>
              <input
                value={a.name}
                onChange={(e) => {
                  const next = [...data.activities];
                  next[i] = { ...next[i], name: e.target.value };
                  setData((d) => ({ ...d, activities: next }));
                }}
                className="flex-1 px-4 py-2.5 border border-black/10 rounded-xl text-sm bg-white focus:ring-2 focus:ring-accent/20 focus:border-accent"
                placeholder={`Aktivita ${i + 1}...`}
              />
            </div>
          ))}
        </div>

        <button
          onClick={() => setStep("rate")}
          className="w-full py-2.5 bg-accent text-white rounded-full font-bold text-sm hover:bg-accent-hover transition-colors"
        >
          Dál — ohodnoť energii →
        </button>
      </div>
    );
  }

  // ── Step 2: Rate energy ──
  if (step === "rate") {
    const filled = data.activities.filter((a) => a.name.trim());
    return (
      <div className="max-w-2xl mx-auto space-y-5">
        <div>
          <h2 className="text-xl font-bold text-foreground">⚡ Ohodnoť energii</h2>
          <p className="text-sm text-foreground/55 mt-1">
            Pro každou aktivitu: dává ti energii (+) nebo ji bere (-)? -5 = totálně vyčerpává, +5 = maximálně nabíjí.
          </p>
        </div>

        <div className="space-y-4">
          {filled.map((a, i) => {
            const origIdx = data.activities.indexOf(a);
            return (
              <div key={origIdx} className="bg-white border border-black/8 rounded-[20px] px-4 py-4 space-y-2">
                <p className="font-medium text-sm text-foreground">{a.name}</p>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-red-400 w-8">-5</span>
                  <div className="flex-1 flex gap-0.5">
                    {Array.from({ length: 11 }, (_, j) => j - 5).map((v) => (
                      <button
                        key={v}
                        onClick={() => {
                          const next = [...data.activities];
                          next[origIdx] = { ...next[origIdx], rating: v };
                          setData((d) => ({ ...d, activities: next }));
                        }}
                        className={`flex-1 h-7 rounded text-[10px] font-bold transition-all ${
                          v === a.rating
                            ? v > 0 ? "bg-green-500 text-white" : v < 0 ? "bg-red-500 text-white" : "bg-foreground/20 text-white"
                            : "bg-foreground/5 text-foreground/30 hover:bg-foreground/10"
                        }`}
                      >
                        {v > 0 ? `+${v}` : v}
                      </button>
                    ))}
                  </div>
                  <span className="text-xs text-green-500 w-8 text-right">+5</span>
                </div>

                <select
                  value={a.frequency}
                  onChange={(e) => {
                    const next = [...data.activities];
                    next[origIdx] = { ...next[origIdx], frequency: e.target.value };
                    setData((d) => ({ ...d, activities: next }));
                  }}
                  className="text-xs px-3 py-1.5 border border-black/10 rounded-lg bg-white text-foreground/60"
                >
                  <option value="">Jak často?</option>
                  {FREQUENCIES.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
            );
          })}
        </div>

        <div className="flex gap-2">
          <button onClick={() => setStep("list")} className="flex-1 py-2.5 border border-foreground/15 text-foreground/60 rounded-full font-semibold text-sm">
            ← Zpět
          </button>
          <button onClick={() => setStep("reflect")} className="flex-1 py-2.5 bg-accent text-white rounded-full font-bold text-sm hover:bg-accent-hover transition-colors">
            Dál — reflexe →
          </button>
        </div>
      </div>
    );
  }

  // ── Step 3: Reflect ──
  if (step === "reflect") {
    const filled = data.activities.filter((a) => a.name.trim());
    const energizers = filled.filter((a) => a.rating > 0).sort((a, b) => b.rating - a.rating);
    const drainers = filled.filter((a) => a.rating < 0).sort((a, b) => a.rating - b.rating);

    return (
      <div className="max-w-2xl mx-auto space-y-5">
        <div>
          <h2 className="text-xl font-bold text-foreground">⚡ Tvůj energetický profil</h2>
          <p className="text-sm text-foreground/55 mt-1">Co ti dává energii a co ji bere?</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="px-4 py-4 rounded-2xl bg-green-50 border border-green-200 space-y-2">
            <p className="text-xs font-bold text-green-700 uppercase tracking-wider">Energizéry ⚡</p>
            {energizers.length > 0 ? energizers.map((a, i) => (
              <p key={i} className="text-sm text-green-800">+{a.rating} {a.name}</p>
            )) : <p className="text-xs text-green-600/60">Žádné pozitivní aktivity</p>}
          </div>
          <div className="px-4 py-4 rounded-2xl bg-red-50 border border-red-200 space-y-2">
            <p className="text-xs font-bold text-red-700 uppercase tracking-wider">Vampýři 🧛</p>
            {drainers.length > 0 ? drainers.map((a, i) => (
              <p key={i} className="text-sm text-red-800">{a.rating} {a.name}</p>
            )) : <p className="text-xs text-red-600/60">Žádné vyčerpávající aktivity</p>}
          </div>
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground/70">Co si uvědomuješ? Jaké vzorce vidíš?</label>
            <textarea
              value={data.insights}
              onChange={(e) => setData((d) => ({ ...d, insights: e.target.value }))}
              rows={3}
              className="w-full px-4 py-3 border border-black/10 rounded-2xl text-sm bg-white focus:ring-2 focus:ring-accent/20 focus:border-accent resize-none"
              placeholder="Uvědomuji si, že..."
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground/70">Jak by vypadal tvůj ideální energetický týden?</label>
            <textarea
              value={data.idealWeek}
              onChange={(e) => setData((d) => ({ ...d, idealWeek: e.target.value }))}
              rows={3}
              className="w-full px-4 py-3 border border-black/10 rounded-2xl text-sm bg-white focus:ring-2 focus:ring-accent/20 focus:border-accent resize-none"
              placeholder="V ideálním týdnu bych..."
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={() => setStep("rate")} className="flex-1 py-2.5 border border-foreground/15 text-foreground/60 rounded-full font-semibold text-sm">
            ← Zpět
          </button>
          <button
            onClick={async () => {
              setSaving(true);
              await onSave({ ...data, savedAt: new Date().toISOString() });
              setSaving(false);
              onComplete();
            }}
            disabled={saving}
            className="flex-1 py-2.5 bg-accent text-white rounded-full font-bold text-sm hover:bg-accent-hover transition-colors disabled:opacity-60"
          >
            {saving ? "Ukládám…" : "Uložit audit ✓"}
          </button>
        </div>
      </div>
    );
  }

  return null;
}

"use client";

import { useState } from "react";
import type { FuneralSpeechData } from "@/lib/exercise-registry";

const FIELDS = [
  { key: "rodina" as const, label: "Co by o tobě na pohřbu řekla tvoje rodina?", placeholder: "Řekli by, že..." },
  { key: "blizci" as const, label: "Co by řekli tvoji nejbližší přátelé?", placeholder: "Řekli by, že..." },
  { key: "znami" as const, label: "Co by řekli známí, kolegové a komunita?", placeholder: "Řekli by, že..." },
];

const EMPTY: FuneralSpeechData = { rodina: "", blizci: "", znami: "", savedAt: "" };

export default function SmutecniRecFlow({
  initialData,
  onSave,
  onComplete,
}: {
  initialData: FuneralSpeechData | null;
  onSave: (data: FuneralSpeechData) => Promise<void>;
  onComplete: () => void;
}) {
  const [form, setForm] = useState<FuneralSpeechData>(initialData ?? EMPTY);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    await onSave({ ...form, savedAt: new Date().toISOString() });
    setSaving(false);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <h2 className="text-xl font-bold text-foreground">🕯️ Smuteční řeč</h2>
        <p className="text-base text-foreground/55 mt-1">
          Co bys chtěl, aby o tobě řekli na tvém pohřbu? Jak by tě popsali lidé z různých kruhů tvého života?
        </p>
      </div>

      <div className="space-y-4">
        {FIELDS.map((f) => (
          <div key={f.key} className="space-y-1.5">
            <label className="text-base font-medium text-foreground/70">{f.label}</label>
            <textarea
              value={form[f.key]}
              onChange={(e) => setForm((d) => ({ ...d, [f.key]: e.target.value }))}
              rows={4}
              className="w-full px-4 py-3 border border-black/10 rounded-2xl text-base bg-white focus:ring-2 focus:ring-accent/20 focus:border-accent resize-none"
              placeholder={f.placeholder}
            />
          </div>
        ))}
      </div>

      <button
        onClick={async () => { await save(); onComplete(); }}
        disabled={saving || (!form.rodina && !form.blizci && !form.znami)}
        className="w-full py-2.5 bg-accent text-white rounded-full font-bold text-base hover:bg-accent-hover transition-colors disabled:opacity-60"
      >
        {saving ? "Ukládám…" : "Uložit ✓"}
      </button>
    </div>
  );
}

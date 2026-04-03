"use client";

import { useState } from "react";

export type RelationshipPerson = { name: string; circle: "inner" | "middle" | "outer"; health: number; energizes: boolean; note: string };

export type RelationshipMapData = {
  people: RelationshipPerson[];
  insights: string;
  savedAt: string;
};

type Step = "map" | "reflect";

const EMPTY: RelationshipMapData = {
  people: [],
  insights: "",
  savedAt: "",
};

const EMPTY_PERSON: RelationshipPerson = { name: "", circle: "inner", health: 5, energizes: true, note: "" };

export default function RelationshipMapFlow({
  initialData,
  onSave,
  onComplete,
}: {
  initialData: RelationshipMapData | null;
  onSave: (data: RelationshipMapData) => Promise<void>;
  onComplete: () => void;
}) {
  const [data, setData] = useState<RelationshipMapData>(initialData?.people?.length ? initialData : {
    ...EMPTY,
    people: Array.from({ length: 5 }, () => ({ ...EMPTY_PERSON })),
  });
  const [step, setStep] = useState<Step>("map");
  const [saving, setSaving] = useState(false);

  function updatePerson(idx: number, field: keyof RelationshipPerson, value: string | number | boolean) {
    const next = [...data.people];
    next[idx] = { ...next[idx], [field]: value };
    setData((d) => ({ ...d, people: next }));
  }

  function addPerson() {
    setData((d) => ({ ...d, people: [...d.people, { ...EMPTY_PERSON }] }));
  }

  // ── Step 1: Map ──
  if (step === "map") {
    const circles: { id: RelationshipPerson["circle"]; label: string; emoji: string; desc: string }[] = [
      { id: "inner", label: "Nejbližší kruh", emoji: "❤️", desc: "5 nejbližších lidí" },
      { id: "middle", label: "Střední kruh", emoji: "🤝", desc: "Přátelé a blízcí kolegové" },
      { id: "outer", label: "Vnější kruh", emoji: "👋", desc: "Známí a vzdálenější kontakty" },
    ];

    return (
      <div className="max-w-2xl mx-auto space-y-5">
        <div>
          <h2 className="text-xl font-bold text-foreground">🗺️ Mapa vztahů</h2>
          <p className="text-base text-foreground/55 mt-1">
            Zapiš důležité lidi ve svém životě. Pro každého urči: jak blízký vztah, jak zdravý, a zda tě nabíjí nebo vyčerpává.
          </p>
        </div>

        <div className="space-y-4">
          {data.people.map((p, i) => (
            <div key={i} className="bg-white border border-black/8 rounded-[20px] px-4 py-4 space-y-3">
              <input
                value={p.name}
                onChange={(e) => updatePerson(i, "name", e.target.value)}
                className="w-full px-3 py-2 border border-black/10 rounded-xl text-base font-medium bg-white focus:ring-2 focus:ring-accent/20 focus:border-accent"
                placeholder={`Jméno osoby ${i + 1}`}
              />

              {p.name && (
                <>
                  {/* Circle */}
                  <div className="flex gap-1.5">
                    {circles.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => updatePerson(i, "circle", c.id)}
                        className={`flex-1 px-2 py-1.5 rounded-lg text-sm font-medium transition-all ${
                          p.circle === c.id
                            ? "bg-accent text-white"
                            : "bg-foreground/5 text-foreground/40 hover:bg-accent/10"
                        }`}
                      >
                        {c.emoji} {c.label}
                      </button>
                    ))}
                  </div>

                  {/* Health 1-10 */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-foreground/40 w-20 shrink-0">Zdraví vztahu:</span>
                    <div className="flex gap-0.5 flex-1">
                      {Array.from({ length: 10 }, (_, j) => j + 1).map((v) => (
                        <button
                          key={v}
                          onClick={() => updatePerson(i, "health", v)}
                          className={`flex-1 h-6 rounded text-xs font-bold transition-all ${
                            v <= p.health ? "bg-accent text-white" : "bg-foreground/5 text-foreground/25"
                          }`}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Energizes? */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => updatePerson(i, "energizes", true)}
                      className={`flex-1 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                        p.energizes ? "bg-green-100 text-green-700 border border-green-200" : "bg-foreground/5 text-foreground/40"
                      }`}
                    >
                      ⚡ Nabíjí mě
                    </button>
                    <button
                      onClick={() => updatePerson(i, "energizes", false)}
                      className={`flex-1 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                        !p.energizes ? "bg-red-100 text-red-700 border border-red-200" : "bg-foreground/5 text-foreground/40"
                      }`}
                    >
                      🧛 Vyčerpává
                    </button>
                  </div>

                  {/* Note */}
                  <input
                    value={p.note}
                    onChange={(e) => updatePerson(i, "note", e.target.value)}
                    className="w-full px-3 py-2 border border-black/10 rounded-xl text-sm bg-white text-foreground/60"
                    placeholder="Poznámka (volitelné)..."
                  />
                </>
              )}
            </div>
          ))}
        </div>

        <button onClick={addPerson} className="text-sm text-accent font-semibold hover:underline">
          + Přidat další osobu
        </button>

        <button
          onClick={() => setStep("reflect")}
          className="w-full py-2.5 bg-accent text-white rounded-full font-bold text-base hover:bg-accent-hover transition-colors"
        >
          Dál — reflexe →
        </button>
      </div>
    );
  }

  // ── Step 2: Reflect ──
  if (step === "reflect") {
    const filled = data.people.filter((p) => p.name.trim());
    const inner = filled.filter((p) => p.circle === "inner");
    const energizers = filled.filter((p) => p.energizes);
    const drainers = filled.filter((p) => !p.energizes);
    const avgHealth = filled.length > 0
      ? (filled.reduce((s, p) => s + p.health, 0) / filled.length).toFixed(1)
      : "—";

    return (
      <div className="max-w-2xl mx-auto space-y-5">
        <div>
          <h2 className="text-xl font-bold text-foreground">🗺️ Tvůj vztahový profil</h2>
          <p className="text-base text-foreground/55 mt-1">Co vidíš? Jaké vzorce se ti odhalují?</p>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="px-3 py-3 rounded-2xl bg-accent/5 border border-accent/10">
            <p className="text-2xl font-bold text-accent">{inner.length}</p>
            <p className="text-xs text-foreground/40">Nejbližší kruh</p>
          </div>
          <div className="px-3 py-3 rounded-2xl bg-green-50 border border-green-200">
            <p className="text-2xl font-bold text-green-600">{energizers.length}</p>
            <p className="text-xs text-foreground/40">Nabíjí tě</p>
          </div>
          <div className="px-3 py-3 rounded-2xl bg-red-50 border border-red-200">
            <p className="text-2xl font-bold text-red-500">{drainers.length}</p>
            <p className="text-xs text-foreground/40">Vyčerpává</p>
          </div>
        </div>

        <p className="text-sm text-foreground/40 text-center">Průměrné zdraví vztahů: {avgHealth}/10</p>

        <div className="space-y-1.5">
          <label className="text-base font-medium text-foreground/70">
            Co si uvědomuješ o svých vztazích? Co chceš změnit?
          </label>
          <textarea
            value={data.insights}
            onChange={(e) => setData((d) => ({ ...d, insights: e.target.value }))}
            rows={4}
            className="w-full px-4 py-3 border border-black/10 rounded-2xl text-base bg-white focus:ring-2 focus:ring-accent/20 focus:border-accent resize-none"
            placeholder="Uvědomuji si, že..."
          />
        </div>

        <div className="flex gap-2">
          <button onClick={() => setStep("map")} className="flex-1 py-2.5 border border-foreground/15 text-foreground/60 rounded-full font-semibold text-base">
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
            className="flex-1 py-2.5 bg-accent text-white rounded-full font-bold text-base hover:bg-accent-hover transition-colors disabled:opacity-60"
          >
            {saving ? "Ukládám…" : "Uložit mapu ✓"}
          </button>
        </div>
      </div>
    );
  }

  return null;
}

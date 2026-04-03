"use client";

import { useState, useCallback } from "react";
import { DashboardCard, useDashboardDone } from "./DashboardCard";
import { useAutoSave } from "./useAutoSave";
import { SaveIndicator } from "./SaveIndicator";
import type { IkigaiData } from "@/lib/exercise-registry";

const CIRCLES = [
  { key: "love" as const, emoji: "❤️", label: "Co miluješ", placeholder: "Aktivita, kterou miluješ" },
  { key: "goodAt" as const, emoji: "💪", label: "V čem jsi dobrý/á", placeholder: "Tvoje silná stránka" },
  { key: "worldNeeds" as const, emoji: "🌍", label: "Co svět potřebuje", placeholder: "Problém, který vidíš" },
  { key: "paidFor" as const, emoji: "💰", label: "Za co ti platí", placeholder: "Služba nebo dovednost" },
];

const REFLECTIONS = [
  { key: "passion" as const, label: "Vášeň (❤️ + 💪)" },
  { key: "mission" as const, label: "Mise (❤️ + 🌍)" },
  { key: "profession" as const, label: "Profese (💪 + 💰)" },
  { key: "vocation" as const, label: "Poslání (🌍 + 💰)" },
  { key: "ikigai" as const, label: "Ikigai (průsečík všeho)" },
];

const EMPTY_DATA: IkigaiData = {
  love: ["", "", "", "", ""],
  goodAt: ["", "", "", "", ""],
  worldNeeds: ["", "", "", "", ""],
  paidFor: ["", "", "", "", ""],
  reflections: { passion: "", mission: "", profession: "", vocation: "", ikigai: "" },
  savedAt: "",
};

export function IkigaiCard({
  data,
  saveContext,
}: {
  data: IkigaiData | null;
  saveContext: (type: string, data: unknown) => Promise<void>;
}) {
  const isEmpty = !data?.savedAt;

  return (
    <DashboardCard
      emoji="☀️"
      title="Ikigai"
      isEmpty={isEmpty}
      emptyDescription="Najdi průsečík toho, co miluješ, umíš, svět potřebuje a co tě živí. Tvůj osobní smysl na jednom místě."
      editContent={<EditMode data={data} saveContext={saveContext} />}
    >
      <ViewMode data={data!} />
    </DashboardCard>
  );
}

function ViewMode({ data }: { data: IkigaiData }) {
  const ikigai = data.reflections?.ikigai;
  return (
    <div className="space-y-2">
      {ikigai && <p className="text-base text-foreground/60 leading-relaxed italic">&ldquo;{ikigai.slice(0, 150)}{ikigai.length > 150 ? "…" : ""}&rdquo;</p>}
      <div className="flex flex-wrap gap-2">
        {CIRCLES.map((c) => {
          const filled = (data[c.key] ?? []).filter(Boolean).length;
          return (
            <span key={c.key} className="text-sm text-foreground/40">
              {c.emoji} {filled}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function EditMode({
  data,
  saveContext,
}: {
  data: IkigaiData | null;
  saveContext: (type: string, data: unknown) => Promise<void>;
}) {
  const done = useDashboardDone();
  const d = data ?? EMPTY_DATA;
  const [step, setStep] = useState(0);
  const [love, setLove] = useState([...d.love]);
  const [goodAt, setGoodAt] = useState([...d.goodAt]);
  const [worldNeeds, setWorldNeeds] = useState([...d.worldNeeds]);
  const [paidFor, setPaidFor] = useState([...d.paidFor]);
  const [reflections, setReflections] = useState({ ...d.reflections });

  const lists = [love, goodAt, worldNeeds, paidFor];
  const setters = [setLove, setGoodAt, setWorldNeeds, setPaidFor];

  const buildData = useCallback(
    (): IkigaiData => ({
      love, goodAt, worldNeeds, paidFor, reflections,
      savedAt: new Date().toISOString(),
    }),
    [love, goodAt, worldNeeds, paidFor, reflections]
  );

  const depsKey = JSON.stringify(love) + JSON.stringify(goodAt) + JSON.stringify(worldNeeds) + JSON.stringify(paidFor) + JSON.stringify(reflections);
  const { saving, saved } = useAutoSave(
    async () => { await saveContext("ikigai", buildData()); },
    [depsKey],
  );

  const handleNext = () => { setStep((s) => s + 1); };
  const handleFinish = async () => { done?.(); };

  // Steps 0-3: circles, step 4: reflections
  const totalSteps = 5;

  return (
    <div className="space-y-3">
      <div className="flex gap-1">
        {Array.from({ length: totalSteps }, (_, i) => (
          <div key={i} className="h-1 flex-1 rounded-full" style={{ background: i <= step ? "#FF8C42" : "rgba(0,0,0,0.06)" }} />
        ))}
      </div>

      {step < 4 ? (
        <div className="space-y-2">
          <div>
            <p className="text-sm font-bold text-foreground/70">
              {CIRCLES[step].emoji} {CIRCLES[step].label}
            </p>
            <p className="text-sm text-foreground/40 mt-0.5 leading-relaxed">
              {step === 0 && "Co tě baví natolik, že zapomínáš na čas? Co bys dělal/a i zadarmo?"}
              {step === 1 && "V čem vynikáš? Co ti jde přirozeně lépe než ostatním?"}
              {step === 2 && "Jaký problém ve světě tě trápí? Kde vidíš mezeru, kterou bys mohl/a vyplnit?"}
              {step === 3 && "Za co ti lidé platí nebo by platili? Jakou hodnotu vytváříš?"}
            </p>
          </div>
          {lists[step].map((item, i) => (
            <input
              key={i}
              type="text"
              value={item}
              onChange={(e) => {
                const next = [...lists[step]];
                next[i] = e.target.value;
                setters[step](next);
              }}
              placeholder={CIRCLES[step].placeholder}
              className="w-full text-base rounded-xl border border-black/[0.08] bg-white/70 px-3 py-2 text-foreground/70 placeholder:text-foreground/25 focus:outline-none focus:border-black/20 transition-all"
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          <div>
            <p className="text-sm font-bold text-foreground/70">Reflexe průsečíků</p>
            <p className="text-sm text-foreground/40 mt-0.5 leading-relaxed">Podívej se na průsečíky svých odpovědí. Co mají společného? Co je tvůj Ikigai?</p>
          </div>
          {REFLECTIONS.map((r) => (
            <div key={r.key} className="space-y-0.5">
              <label className="text-sm text-foreground/40">{r.label}</label>
              <textarea
                value={reflections[r.key]}
                onChange={(e) => setReflections((p) => ({ ...p, [r.key]: e.target.value }))}
                placeholder="Tvoje reflexe..."
                rows={2}
                className="w-full text-base rounded-xl border border-black/[0.08] bg-white/70 px-3 py-2 text-foreground/70 placeholder:text-foreground/25 resize-none focus:outline-none focus:border-black/20 transition-all"
              />
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        <SaveIndicator saving={saving} saved={saved} />
        <div className="flex-1" />
        {step > 0 && (
          <button onClick={() => setStep((s) => s - 1)} className="px-4 py-2 border border-foreground/15 text-foreground/50 rounded-full text-base font-semibold">
            ← Zpět
          </button>
        )}
        <button
          onClick={step === totalSteps - 1 ? handleFinish : handleNext}
          className="px-5 py-2 bg-accent text-white rounded-full text-base font-bold"
        >
          {step === totalSteps - 1 ? "Hotovo ✓" : "Dál →"}
        </button>
      </div>
    </div>
  );
}

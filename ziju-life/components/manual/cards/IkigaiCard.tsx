"use client";

import { useState, useCallback } from "react";
import { Loader2, Sparkles } from "lucide-react";
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
  { key: "passion" as const, label: "Vášeň", desc: "❤️ + 💪" },
  { key: "mission" as const, label: "Mise", desc: "❤️ + 🌍" },
  { key: "profession" as const, label: "Profese", desc: "💪 + 💰" },
  { key: "vocation" as const, label: "Poslání", desc: "🌍 + 💰" },
  { key: "ikigai" as const, label: "Ikigai", desc: "průsečík všeho" },
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
    <div className="space-y-3">
      {ikigai && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-foreground/30">Tvoje Ikigai</p>
          <p className="text-base text-foreground/60 leading-relaxed italic mt-0.5">
            &ldquo;{ikigai.slice(0, 200)}{ikigai.length > 200 ? "…" : ""}&rdquo;
          </p>
        </div>
      )}
      <div className="grid grid-cols-2 gap-2">
        {REFLECTIONS.slice(0, 4).map((r) => {
          const text = data.reflections?.[r.key];
          if (!text) return null;
          return (
            <div key={r.key} className="space-y-0.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/30">{r.label}</p>
              <p className="text-xs text-foreground/50 leading-relaxed">{text.slice(0, 80)}{text.length > 80 ? "…" : ""}</p>
            </div>
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
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState("");

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

  const analyzeWithAI = async () => {
    setAnalyzing(true);
    setAnalyzeError("");
    try {
      const res = await fetch("/api/manual/ikigai-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ love, goodAt, worldNeeds, paidFor }),
      });
      if (!res.ok) throw new Error("Chyba");
      const result = await res.json();
      setReflections(result);
      // Move to results step
      setStep(4);
      // Auto-save with new reflections
      await saveContext("ikigai", {
        love, goodAt, worldNeeds, paidFor, reflections: result,
        savedAt: new Date().toISOString(),
      });
    } catch {
      setAnalyzeError("Nepodařilo se analyzovat. Zkus to znovu.");
    }
    setAnalyzing(false);
  };

  const handleNext = () => {
    if (step < 3) {
      setStep(s => s + 1);
    } else if (step === 3) {
      // After 4th circle, trigger AI analysis
      analyzeWithAI();
    }
  };

  const handleFinish = async () => { done?.(); };

  // 5 steps: 4 circles + 1 AI results
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
      ) : analyzing ? (
        <div className="flex flex-col items-center justify-center py-8 gap-3">
          <Loader2 size={24} className="animate-spin text-accent" />
          <p className="text-sm text-foreground/50">Analyzuji průsečíky…</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <p className="text-sm font-bold text-foreground/70">
              <Sparkles size={14} className="inline text-accent mr-1" />
              Tvoje Ikigai průsečíky
            </p>
            <p className="text-sm text-foreground/40 mt-0.5 leading-relaxed">
              AI analyzovalo tvoje odpovědi a našlo průsečíky. Můžeš je upravit.
            </p>
          </div>
          {REFLECTIONS.map((r) => (
            <div key={r.key} className={`space-y-1 p-3 rounded-xl border ${r.key === "ikigai" ? "bg-accent/5 border-accent/15" : "bg-black/[0.02] border-black/[0.05]"}`}>
              <label className="text-xs font-semibold text-foreground/50">
                {r.label} <span className="text-foreground/30 font-normal">({r.desc})</span>
              </label>
              <textarea
                value={reflections[r.key]}
                onChange={(e) => setReflections((p) => ({ ...p, [r.key]: e.target.value }))}
                rows={r.key === "ikigai" ? 3 : 2}
                className="w-full text-sm rounded-lg border border-black/[0.06] bg-white/80 px-3 py-2 text-foreground/70 placeholder:text-foreground/25 resize-none focus:outline-none focus:border-black/15 transition-all"
              />
            </div>
          ))}

          <button
            onClick={analyzeWithAI}
            disabled={analyzing}
            className="flex items-center gap-1.5 text-xs text-accent/70 hover:text-accent transition-colors"
          >
            <Sparkles size={12} /> Přegenerovat průsečíky
          </button>
        </div>
      )}

      {analyzeError && <p className="text-xs text-red-500">{analyzeError}</p>}

      <div className="flex items-center gap-2">
        <SaveIndicator saving={saving} saved={saved} />
        <div className="flex-1" />
        {step > 0 && !analyzing && (
          <button onClick={() => setStep((s) => s - 1)} className="px-4 py-2 border border-foreground/15 text-foreground/50 rounded-full text-base font-semibold">
            ← Zpět
          </button>
        )}
        {!analyzing && (
          <button
            onClick={step >= 4 ? handleFinish : handleNext}
            className="px-5 py-2 bg-accent text-white rounded-full text-base font-bold"
          >
            {step >= 4 ? "Hotovo ✓" : step === 3 ? "Analyzovat ✨" : "Dál →"}
          </button>
        )}
      </div>
    </div>
  );
}

"use client";

import { WHEEL_AREAS } from "./shared";
import type { KompasData } from "@/components/KompasFlow";

export function MonthlyReflexionCard({
  kompasData,
  onContinue,
  onChangeArea,
}: {
  kompasData: KompasData;
  onContinue: () => void;
  onChangeArea: () => void;
}) {
  const focusLabel = WHEEL_AREAS.find((a) => a.key === kompasData.focusArea)?.short ?? kompasData.focusArea;
  const areaAnswers = kompasData.areaAnswers?.[kompasData.focusArea ?? ""] ?? [];

  return (
    <div className="bg-[#fdf0e6]/50 border border-black/8 rounded-[28px] px-6 py-6 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-accent uppercase tracking-widest mb-1">Měsíční reflexe</p>
          <p className="font-bold text-foreground text-lg leading-snug">
            Podívej se na svou mozaiku. Posunul/a ses?
          </p>
        </div>
        <span className="text-3xl">🔍</span>
      </div>

      {kompasData.focusArea && (
        <div className="px-4 py-3 rounded-2xl bg-white/70 border border-black/5 space-y-2">
          <p className="text-sm text-foreground/50 font-semibold uppercase tracking-wider">Tvoje focus oblast</p>
          <p className="font-bold text-foreground">{focusLabel}</p>
          {areaAnswers.filter(Boolean).map((ans, i) => (
            <p key={i} className="text-base text-foreground/60 leading-relaxed">„{ans}"</p>
          ))}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-2 pt-1">
        <button
          onClick={onContinue}
          className="flex-1 py-2.5 px-4 bg-accent text-white rounded-full font-semibold text-base hover:bg-accent-hover transition-colors"
        >
          Pokračuji v této oblasti →
        </button>
        <button
          onClick={onChangeArea}
          className="flex-1 py-2.5 px-4 border border-foreground/15 text-foreground/70 rounded-full font-semibold text-base hover:border-foreground/30 transition-colors"
        >
          Chci změnit oblast
        </button>
      </div>
    </div>
  );
}

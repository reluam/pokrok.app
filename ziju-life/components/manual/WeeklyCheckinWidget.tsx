"use client";

import { useState } from "react";
import { WHEEL_AREAS, type CheckinEntry } from "./shared";
import { InteractiveSpider } from "./charts/SpiderChart";
import { AreaSparklines } from "./charts/Sparkline";
import { ScoreBar } from "./ScoreBar";
import type { HodnotyData } from "@/components/HodnotyFlow";

type CheckinStep = "values" | "areas";

export function WeeklyCheckinWidget({
  checkins,
  thisWeekDone,
  hodnotyData,
  onSave,
}: {
  checkins: CheckinEntry[];
  thisWeekDone: boolean;
  hodnotyData: HodnotyData | null;
  onSave: (data: { valueScores: Record<string, number>; areaScores: Record<string, number> }) => Promise<void>;
}) {
  const [step, setStep] = useState<CheckinStep>("values");
  const [valueScores, setValueScores] = useState<Record<string, number>>(() =>
    Object.fromEntries((hodnotyData?.finalValues ?? []).map((v) => [v, 5]))
  );
  const [areaScores, setAreaScores] = useState<Record<string, number>>(
    () => Object.fromEntries(WHEEL_AREAS.map((a) => [a.key, 5]))
  );
  const [saving, setSaving] = useState(false);

  const values = hodnotyData?.finalValues ?? [];
  const prevCheckin = checkins.length >= 2 ? checkins[checkins.length - 2] : null;
  const lastCheckin = checkins[checkins.length - 1];

  const effectiveStep = step === "values" && values.length === 0 ? "areas" : step;

  // ── Done state: show results ──
  if (thisWeekDone && lastCheckin) {
    const aS = lastCheckin.area_scores ?? {};
    const vS = lastCheckin.value_scores ?? {};
    return (
      <div className="space-y-6">
        <p className="text-xs text-foreground/40">Tento týden vyplněno ✓</p>

        {Object.keys(vS).length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-foreground/50 uppercase tracking-wider">Hodnoty</p>
            {Object.entries(vS).map(([v, s]) => (
              <div key={v} className="flex items-center gap-2">
                <span className="text-xs text-foreground/60 w-24 truncate">{v}</span>
                <div className="flex-1 bg-black/5 rounded-full h-1.5 overflow-hidden">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${s * 10}%` }} />
                </div>
                <span className="text-xs font-bold text-accent w-4 text-right">{s}</span>
              </div>
            ))}
          </div>
        )}

        {Object.keys(aS).length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-foreground/50 uppercase tracking-wider">
              Oblasti{prevCheckin?.area_scores ? " — plná čára = tento týden, přerušovaná = minulý" : ""}
            </p>
            <div className="flex justify-center">
              <InteractiveSpider vals={aS} prevVals={prevCheckin?.area_scores ?? undefined} size={240} />
            </div>
          </div>
        )}

        <AreaSparklines checkins={checkins} />
      </div>
    );
  }

  // ── Step: values ──
  if (effectiveStep === "values") {
    return (
      <div className="space-y-5">
        <div>
          <p className="font-semibold text-foreground">Hodnoty — jak jsi je žil/a tento týden?</p>
          <p className="text-xs text-foreground/45 mt-0.5">
            {values.length > 0 ? "Ohodnoť každou hodnotu 1–10." : "Nejdřív si ulož svoje hodnoty v záložce Hodnoty."}
          </p>
        </div>

        {values.length > 0 ? (
          <div className="space-y-3">
            {values.map((v) => (
              <div key={v} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground/70">{v}</span>
                  <span className="text-xs font-bold text-accent">{valueScores[v] ?? 5}</span>
                </div>
                <ScoreBar
                  value={valueScores[v] ?? 5}
                  onChange={(n) => setValueScores((p) => ({ ...p, [v]: n }))}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-accent/20 bg-accent/5 p-5 text-center space-y-2">
            <p className="text-sm text-foreground/60">
              Nejdřív si vyplň hodnoty v záložce <strong>Hodnoty</strong>, pak se tu objeví měřítka pro každou z nich.
            </p>
          </div>
        )}

        {values.length > 0 && (
          <button
            onClick={() => setStep("areas")}
            className="w-full py-2.5 bg-accent text-white rounded-full font-bold text-sm hover:bg-accent-hover transition-colors"
          >
            Dál — oblasti →
          </button>
        )}
      </div>
    );
  }

  // ── Step: areas ──
  return (
    <div className="space-y-5">
      <div>
        <p className="font-semibold text-foreground">Oblasti — jak se ti dařilo tento týden?</p>
        <p className="text-xs text-foreground/45 mt-0.5">Klikni na pavouka — každá osa = oblast, vzdálenost od středu = skóre 1–10.</p>
      </div>

      <div className="flex justify-center">
        <InteractiveSpider
          vals={areaScores}
          prevVals={prevCheckin?.area_scores ?? undefined}
          onChange={(key, score) => setAreaScores((p) => ({ ...p, [key]: score }))}
          size={260}
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setStep("values")}
          className="flex-1 py-2.5 border border-foreground/15 text-foreground/60 rounded-full font-semibold text-sm hover:border-foreground/30 transition-colors"
        >
          ← Zpět
        </button>
        <button
          onClick={async () => {
            setSaving(true);
            await onSave({ valueScores, areaScores });
            setSaving(false);
          }}
          disabled={saving}
          className="flex-1 py-2.5 bg-accent text-white rounded-full font-bold text-sm hover:bg-accent-hover transition-colors disabled:opacity-60"
        >
          {saving ? "Ukládám…" : "Uložit check-in ✓"}
        </button>
      </div>

      {checkins.length >= 2 && <AreaSparklines checkins={checkins} />}
    </div>
  );
}

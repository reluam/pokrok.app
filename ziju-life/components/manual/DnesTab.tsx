"use client";

import { useState, useEffect } from "react";
import { type CheckinEntry } from "./shared";
import { Sparkline, AreaSparklines } from "./charts/Sparkline";
import { WeeklyCheckinWidget } from "./WeeklyCheckinWidget";
import { MonthlyReflexionCard } from "./MonthlyReflexionCard";
import { EmptyCta } from "./EmptyCta";

import type { KompasData } from "@/components/KompasFlow";
import type { HodnotyData } from "@/components/HodnotyFlow";
import dynamic from "next/dynamic";

const PrioritiesWidget = dynamic(() => import("@/components/manual/PrioritiesWidget"), { ssr: false });
const DailyTodosWidget = dynamic(() => import("@/components/manual/DailyTodosWidget"), { ssr: false });
const RitualsChecklistWidget = dynamic(() => import("@/components/manual/RitualsChecklistWidget"), { ssr: false });

type RitualSelection = { morning: string[]; daily: string[]; evening: string[]; durationOverrides?: Record<string, number> };

const LS_REFLEXION_KEY = "mozaika-reflexion-dismissed";

export function DnesTab({
  ritualSelection,
  kompasData,
  hodnotyData,
  checkins,
  thisWeekDone,
  reflectionDone,
  onTabChange,
  onCheckinSave,
}: {
  ritualSelection: RitualSelection | null;
  kompasData: KompasData | null;
  hodnotyData: HodnotyData | null;
  checkins: CheckinEntry[];
  thisWeekDone: boolean;
  reflectionDone: boolean;
  onTabChange: (tab: string) => void;
  onCheckinSave: (data: { valueScores: Record<string, number>; areaScores: Record<string, number> }) => Promise<void>;
}) {
  const hasRituals = (ritualSelection?.morning?.length ?? 0) + (ritualSelection?.daily?.length ?? 0) + (ritualSelection?.evening?.length ?? 0) > 0;

  // Monthly reflexion
  const [showReflexion, setShowReflexion] = useState(false);
  useEffect(() => {
    if (!kompasData?.completedAt || !kompasData.focusArea) return;
    const daysSince = (Date.now() - new Date(kompasData.completedAt).getTime()) / 86400000;
    if (daysSince < 30) return;
    try {
      const d = localStorage.getItem(LS_REFLEXION_KEY);
      if (d && (Date.now() - new Date(d).getTime()) / 86400000 < 30) return;
    } catch {}
    setShowReflexion(true);
  }, [kompasData]);

  function dismissReflexion() {
    try { localStorage.setItem(LS_REFLEXION_KEY, new Date().toISOString()); } catch {}
    setShowReflexion(false);
  }

  return (
    <div className="space-y-6">

      {/* 3-column layout: ToDo | Priority | Rituály */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
        <DailyTodosWidget />
        <PrioritiesWidget />
        {hasRituals ? (
          <RitualsChecklistWidget ritualSelection={ritualSelection} />
        ) : (
          <div className="bg-white border border-black/8 rounded-[24px] px-5 py-5 space-y-3">
            <h3 className="text-sm font-bold text-foreground">Rituály</h3>
            <EmptyCta emoji="⏱️" title="Sestav si denní rituály"
              description="Vyber rituály pro ráno, den i večer."
              buttonLabel="Nastavit →" onClick={() => onTabChange("manual")} />
          </div>
        )}
      </div>

      {/* Weekly check-in */}
      {checkins.length > 0 && (
        <div className="bg-white border border-black/8 rounded-[24px] px-5 py-5">
          <WeeklyCheckinWidget
            checkins={checkins}
            thisWeekDone={thisWeekDone}
            hodnotyData={hodnotyData}
            onSave={onCheckinSave}
          />
        </div>
      )}

      {/* Historical sparklines */}
      {checkins.length >= 2 && (
        <div className="bg-white border border-black/8 rounded-[24px] px-5 py-5 space-y-4">
          <p className="text-sm font-bold text-foreground">Trend</p>
          <Sparkline checkins={checkins} />
          <AreaSparklines checkins={checkins} />
        </div>
      )}

      {/* Monthly reflexion banner */}
      {showReflexion && kompasData && (
        <MonthlyReflexionCard
          kompasData={kompasData}
          onContinue={dismissReflexion}
          onChangeArea={() => { dismissReflexion(); onTabChange("manual"); }}
        />
      )}
    </div>
  );
}

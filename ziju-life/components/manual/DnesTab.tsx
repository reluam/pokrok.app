"use client";

import { useState, useEffect } from "react";
import { X, HelpCircle } from "lucide-react";
import { type CheckinEntry } from "./shared";
import { Sparkline, AreaSparklines } from "./charts/Sparkline";
import { WeeklyCheckinWidget } from "./WeeklyCheckinWidget";
import { MonthlyReflexionCard } from "./MonthlyReflexionCard";
import type { KompasData } from "@/components/KompasFlow";
import type { HodnotyData } from "@/components/HodnotyFlow";
import dynamic from "next/dynamic";

const PrioritiesWidget = dynamic(() => import("@/components/manual/PrioritiesWidget"), { ssr: false });
const DailyTodosWidget = dynamic(() => import("@/components/manual/DailyTodosWidget"), { ssr: false });
const RitualsChecklistWidget = dynamic(() => import("@/components/manual/RitualsChecklistWidget"), { ssr: false });

type RitualSelection = { morning: string[]; daily: string[]; evening: string[]; durationOverrides?: Record<string, number> };

const LS_REFLEXION_KEY = "mozaika-reflexion-dismissed";
const LS_ONBOARDING_KEY = "manual-onboarding-dismissed";
const LS_UPDATE_DISMISSED_KEY = "manual-update-dismissed";

// ── Update news ─────────────────────────────────────────────────────────────
const UPDATES: { id: string; date: string; title: string; description: string }[] = [
  {
    id: "2026-04-energeticky-audit",
    date: "2026-04-03",
    title: "Nový Energetický audit",
    description: "Přidali jsme sekci Energetický audit — zjisti, jaké činnosti a lidé ti dávají a berou energii. U každého zloděje si můžeš nastavit akční plán.",
  },
  {
    id: "2026-04-statistiky",
    date: "2026-04-03",
    title: "Statistiky u cvičení",
    description: "U Kola života, Hodnot a dalších cvičení najdeš novou ikonu statistik — klikni na ni a uvidíš přehled.",
  },
];

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

  // ── Onboarding banner ──
  const [showOnboarding, setShowOnboarding] = useState(false);
  useEffect(() => {
    try {
      const dismissed = localStorage.getItem(LS_ONBOARDING_KEY);
      if (!dismissed) setShowOnboarding(true);
    } catch {}
  }, []);

  function dismissOnboarding() {
    try { localStorage.setItem(LS_ONBOARDING_KEY, new Date().toISOString()); } catch {}
    setShowOnboarding(false);
  }

  function showHelp() {
    setShowOnboarding(true);
  }

  // ── Update banner ──
  const [dismissedUpdates, setDismissedUpdates] = useState<string[]>([]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_UPDATE_DISMISSED_KEY);
      if (raw) setDismissedUpdates(JSON.parse(raw));
    } catch {}
  }, []);

  const visibleUpdates = UPDATES.filter((u) => !dismissedUpdates.includes(u.id));

  function dismissUpdate(id: string) {
    const next = [...dismissedUpdates, id];
    setDismissedUpdates(next);
    try { localStorage.setItem(LS_UPDATE_DISMISSED_KEY, JSON.stringify(next)); } catch {}
  }

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
    <div className="space-y-6 print:space-y-4">

      {/* ── Onboarding banner ── */}
      {showOnboarding && (
        <div className="bg-accent/[0.06] border border-accent/15 rounded-[24px] px-6 py-5 relative print:hidden">
          <button
            onClick={dismissOnboarding}
            className="absolute top-4 right-4 text-foreground/30 hover:text-foreground/60 transition-colors"
          >
            <X size={18} />
          </button>
          <h3 className="text-lg font-bold text-foreground mb-2">Vítej v Manuálu</h3>
          <div className="space-y-2 text-base text-foreground/60 leading-relaxed">
            <p>
              Manuál je tvůj osobní prostor pro vědomý život. Najdeš tu nástroje, které ti pomůžou pojmenovat,
              co je pro tebe důležité, a pak podle toho opravdu žít.
            </p>
            <p>
              <strong>Dnes</strong> — tvůj denní přehled: úkoly, priority a rituály.{" "}
              <strong>Manuál</strong> — cvičení pro sebepoznání: hodnoty, kolo života, přesvědčení a víc.{" "}
              <strong>Průvodce</strong> — AI kouč, který ti pomůže reflektovat.
            </p>
            <p className="text-foreground/40">
              Začni tím, co tě táhne. Není třeba vyplňovat vše najednou — vrátit se můžeš kdykoli.
            </p>
          </div>
        </div>
      )}

      {/* ── Update banners ── */}
      {visibleUpdates.map((update) => (
        <div key={update.id} className="bg-blue-50 border border-blue-200 rounded-[20px] px-5 py-4 relative print:hidden">
          <button
            onClick={() => dismissUpdate(update.id)}
            className="absolute top-3 right-3 text-blue-300 hover:text-blue-500 transition-colors"
          >
            <X size={16} />
          </button>
          <p className="text-base font-bold text-blue-800">{update.title}</p>
          <p className="text-base text-blue-700/70 mt-1 leading-relaxed pr-6">{update.description}</p>
        </div>
      ))}

      {/* 3-column layout: ToDo | Priority | Rituály */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
        <DailyTodosWidget />
        <PrioritiesWidget />
        {hasRituals ? (
          <RitualsChecklistWidget ritualSelection={ritualSelection} />
        ) : (
          <div className="bg-white border border-black/8 rounded-[24px] px-7 py-7 space-y-6 print:break-inside-avoid">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-extrabold text-foreground">Rituály</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={showHelp}
                  className="text-foreground/30 hover:text-foreground/60 transition-colors print:hidden"
                  title="Jak to funguje?"
                >
                  <HelpCircle size={16} />
                </button>
                <button
                  onClick={() => window.print()}
                  className="text-foreground/30 hover:text-foreground/60 transition-colors print:hidden"
                  title="Vytisknout"
                >
                  🖨
                </button>
              </div>
            </div>
            <p className="text-base text-foreground/45 print:hidden">
              Zatím nemáš nastavené rituály.{" "}
              <button onClick={() => onTabChange("nastav-den")} className="text-accent font-semibold hover:underline">
                Nastavit →
              </button>
            </p>
            {/* Printable empty slots */}
            <div className="divide-y divide-black/5">
              {([
                { emoji: "🌅", label: "Ranní rituály" },
                { emoji: "☀️", label: "Denní rituály" },
                { emoji: "🌙", label: "Večerní rituály" },
              ]).map(({ emoji, label }) => (
                <div key={label} className="py-4 first:pt-0 last:pb-0">
                  <p className="text-base font-bold text-foreground/60 uppercase tracking-wider mb-3">
                    {emoji} {label}
                  </p>
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <div key={n} className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-md border-2 border-black/15 shrink-0" />
                        <div className="flex-1 border-b border-dashed border-black/10 pb-2 min-h-[24px]" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
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
          <p className="text-base font-bold text-foreground">Trend</p>
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

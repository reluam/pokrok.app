"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { DashboardCard } from "./DashboardCard";
import type { HodnotyData } from "@/components/HodnotyFlow";
import type { DailyValuesData } from "@/lib/exercise-registry";

function ScoreBar5({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hovered, setHovered] = useState<number | null>(null);
  return (
    <div className="flex gap-1 flex-shrink-0 w-[140px]">
      {[1, 2, 3, 4, 5].map((n) => {
        const fill = hovered !== null ? n <= hovered : n <= value;
        return (
          <button
            key={n}
            onMouseEnter={() => setHovered(n)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => onChange(n)}
            className={`flex-1 h-7 rounded text-[11px] font-bold transition-all ${
              fill ? "bg-accent text-white" : "bg-foreground/6 text-foreground/35 hover:bg-accent/15 hover:text-accent"
            }`}
          >
            {n}
          </button>
        );
      })}
    </div>
  );
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function HodnotyDailyCard({
  hodnotyData,
  dailyData,
  saveContext,
  onTabChange,
}: {
  hodnotyData: HodnotyData | null;
  dailyData: DailyValuesData | null;
  saveContext: (type: string, data: unknown) => Promise<void>;
  onTabChange?: (tab: string) => void;
}) {
  const values = hodnotyData?.finalValues ?? [];
  const today = todayKey();

  const todayEntry = dailyData?.entries?.find((e) => e.date === today);
  const [scores, setScores] = useState<Record<string, number>>(todayEntry?.scores ?? {});
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset when day changes
  useEffect(() => {
    const entry = dailyData?.entries?.find((e) => e.date === todayKey());
    setScores(entry?.scores ?? {});
  }, [dailyData]);

  const saveDailyValues = useCallback(
    (newScores: Record<string, number>) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        const entries = [...(dailyData?.entries ?? [])];
        const idx = entries.findIndex((e) => e.date === today);
        if (idx >= 0) {
          entries[idx] = { date: today, scores: newScores };
        } else {
          entries.push({ date: today, scores: newScores });
        }
        // Keep max 90 days
        const trimmed = entries.slice(-90);
        await saveContext("daily-values", { entries: trimmed });
      }, 500);
    },
    [dailyData, today, saveContext]
  );

  const handleChange = (value: string, score: number) => {
    const next = { ...scores, [value]: score };
    setScores(next);
    saveDailyValues(next);
  };

  if (values.length === 0) {
    return (
      <DashboardCard emoji="💎" title="Hodnoty" isEmpty emptyDescription="Pojmenuj si, co je pro tebe v životě nejdůležitější. Tvoje hodnoty ti pak pomůžou dělat lepší rozhodnutí každý den.">
        <div className="text-center py-4 space-y-2">
          <span className="text-2xl">💎</span>
          <p className="text-sm font-semibold text-foreground">Hodnoty</p>
          <p className="text-xs text-foreground/45 leading-relaxed max-w-xs mx-auto">Pojmenuj si, co je pro tebe v životě nejdůležitější. Tvoje hodnoty ti pak pomůžou dělat lepší rozhodnutí každý den.</p>
          <button
            onClick={() => onTabChange?.("manual")}
            className="text-sm text-accent font-semibold hover:opacity-80 transition-opacity"
          >
            Vyplnit hodnoty →
          </button>
        </div>
      </DashboardCard>
    );
  }

  const filled = Object.keys(scores).filter((k) => scores[k] > 0).length;
  const total = values.length;
  const avg = filled > 0 ? (Object.values(scores).reduce((s, v) => s + v, 0) / filled).toFixed(1) : "—";

  return (
    <DashboardCard emoji="💎" title="Hodnoty">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs text-foreground/40">Jak moc dnes žiješ podle svých hodnot?</p>
          <span className="text-xs text-foreground/30">
            {filled}/{total} · {avg}/5
          </span>
        </div>
        {values.map((v) => (
          <div key={v} className="flex items-center gap-3">
            <span className="text-sm font-medium text-foreground/65 flex-1 min-w-0 truncate">{v}</span>
            <ScoreBar5 value={scores[v] ?? 0} onChange={(n) => handleChange(v, n)} />
          </div>
        ))}
      </div>
    </DashboardCard>
  );
}

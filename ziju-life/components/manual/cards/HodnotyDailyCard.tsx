"use client";

import { DashboardCard } from "./DashboardCard";
import type { HodnotyData } from "@/components/HodnotyFlow";
import type { DailyValuesData } from "@/lib/exercise-registry";

export function HodnotyDailyCard({
  hodnotyData,
  dailyData,
  onTabChange,
}: {
  hodnotyData: HodnotyData | null;
  dailyData: DailyValuesData | null;
  saveContext: (type: string, data: unknown) => Promise<void>;
  onTabChange?: (tab: string) => void;
}) {
  const values = hodnotyData?.finalValues ?? [];

  if (values.length === 0) {
    return (
      <DashboardCard emoji="💎" title="Hodnoty" isEmpty emptyDescription="Pojmenuj si, co je pro tebe v životě nejdůležitější. Tvoje hodnoty ti pak pomůžou dělat lepší rozhodnutí každý den.">
        <div className="text-center py-4 space-y-2">
          <span className="text-2xl">💎</span>
          <p className="text-xl font-extrabold text-foreground">Hodnoty</p>
          <p className="text-lg text-foreground/45 leading-relaxed max-w-xs mx-auto">Pojmenuj si, co je pro tebe v životě nejdůležitější. Tvoje hodnoty ti pak pomůžou dělat lepší rozhodnutí každý den.</p>
          <button
            onClick={() => onTabChange?.("manual")}
            className="text-base text-accent font-semibold hover:opacity-80 transition-opacity"
          >
            Vyplnit hodnoty →
          </button>
        </div>
      </DashboardCard>
    );
  }

  const entries = dailyData?.entries ?? [];
  const recent = entries.slice(-14); // last 14 entries for the chart

  // Compute per-value averages
  const valueStats = values.map((v) => {
    const scored = entries.filter((e) => (e.scores[v] ?? 0) > 0);
    const avg = scored.length > 0 ? scored.reduce((s, e) => s + (e.scores[v] ?? 0), 0) / scored.length : 0;
    return { value: v, avg };
  });

  const overallAvgs = recent.map((e) => {
    const vals = values.map((v) => e.scores[v] ?? 0).filter((s) => s > 0);
    return { date: e.date, avg: vals.length > 0 ? vals.reduce((s, v) => s + v, 0) / vals.length : 0 };
  });

  const totalAvg = valueStats.filter(v => v.avg > 0).length > 0
    ? (valueStats.filter(v => v.avg > 0).reduce((s, v) => s + v.avg, 0) / valueStats.filter(v => v.avg > 0).length).toFixed(1)
    : "—";

  return (
    <DashboardCard emoji="💎" title="Hodnoty">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <p className="text-base text-foreground/40">
            {entries.length > 0
              ? `${entries.length} check-inů · průměr ${totalAvg}/5`
              : "Zatím žádné check-iny"
            }
          </p>
          <button
            onClick={() => onTabChange?.("manual")}
            className="text-base text-accent/60 hover:text-accent font-medium transition-colors"
          >
            Upravit →
          </button>
        </div>

        {/* Mini line chart - overall average over time */}
        {overallAvgs.length >= 2 && (
          <div className="space-y-1">
            <p className="text-base font-semibold text-foreground/30 uppercase tracking-wider">Trend</p>
            <div className="h-16 flex items-end gap-[2px]">
              {overallAvgs.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
                  <div
                    className="w-full rounded-sm bg-accent/70 min-h-[2px] transition-all"
                    style={{ height: `${(d.avg / 5) * 100}%` }}
                    title={`${d.date}: ${d.avg.toFixed(1)}/5`}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs text-foreground/20">
              <span>{overallAvgs[0]?.date?.slice(5)}</span>
              <span>{overallAvgs[overallAvgs.length - 1]?.date?.slice(5)}</span>
            </div>
          </div>
        )}

        {/* Per-value bars */}
        <div className="space-y-1.5">
          {valueStats.map(({ value, avg }) => (
            <div key={value} className="flex items-center gap-2">
              <span className="text-base text-foreground/60 flex-1 truncate">{value}</span>
              <div className="w-24 h-2 bg-foreground/5 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${(avg / 5) * 100}%` }} />
              </div>
              <span className="text-base font-bold text-foreground/50 w-8 text-right">{avg > 0 ? avg.toFixed(1) : "—"}</span>
            </div>
          ))}
        </div>

        {entries.length === 0 && (
          <p className="text-base text-foreground/35 italic text-center py-2">
            Data z check-inů se tu zobrazí jako graf.
          </p>
        )}
      </div>
    </DashboardCard>
  );
}

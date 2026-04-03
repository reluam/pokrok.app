"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { ritualsById, SLOT_LABELS } from "@/data/adhdRituals";

interface RitualSelection {
  morning: string[];
  daily: string[];
  evening: string[];
  durationOverrides?: Record<string, number>;
}

const SLOT_ORDER: (keyof typeof SLOT_LABELS)[] = ["morning", "daily", "evening"];
const SLOT_EMOJI: Record<string, string> = { morning: "🌅", daily: "☀️", evening: "🌙" };

const DAY_LABELS_CZ = ["Ne", "Po", "Út", "St", "Čt", "Pá", "So"];

function getRitualName(id: string): string {
  if (id.startsWith("custom::")) return id.split("::")[1] ?? id;
  return ritualsById[id]?.name ?? id;
}

function formatDayLabel(dateStr: string, todayStr: string): string {
  if (dateStr === todayStr) return "Dnes";
  const d = new Date(dateStr + "T12:00:00");
  const today = new Date(todayStr + "T12:00:00");
  const diff = Math.round((today.getTime() - d.getTime()) / 86400000);
  if (diff === 1) return "Včera";
  const dayName = DAY_LABELS_CZ[d.getDay()];
  return `${dayName} ${d.getDate()}.${d.getMonth() + 1}.`;
}

interface Props {
  ritualSelection: RitualSelection | null;
}

export default function RitualsChecklistWidget({ ritualSelection }: Props) {
  const [days, setDays] = useState<string[]>([]);
  const [history, setHistory] = useState<Record<string, Set<string>>>({});
  const [stats, setStats] = useState<Record<string, number>>({});
  const [loaded, setLoaded] = useState(false);
  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(-1); // -1 = not set yet

  const loadCompletions = useCallback(async () => {
    try {
      const res = await fetch("/api/manual/ritual-completions");
      if (res.ok) {
        const d = await res.json();
        const loadedDays: string[] = d.days ?? [];
        setDays(loadedDays);
        setStats(d.stats ?? {});

        const h: Record<string, Set<string>> = {};
        for (const [rid, dates] of Object.entries(d.history ?? {})) {
          h[rid] = new Set(dates as string[]);
        }
        setHistory(h);

        // Default to today (last day in array)
        if (loadedDays.length > 0) {
          setSelectedDayIdx(prev => prev === -1 ? loadedDays.length - 1 : prev);
        }
      }
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => { loadCompletions(); }, [loadCompletions]);

  const selectedDate = days[selectedDayIdx] ?? "";
  const todayStr = days.length > 0 ? days[days.length - 1] : "";
  const isToday = selectedDate === todayStr;
  const canGoLeft = selectedDayIdx > 0;
  const canGoRight = selectedDayIdx < days.length - 1;

  const completedOnDay = useCallback((ritualId: string) => {
    return history[ritualId]?.has(selectedDate) ?? false;
  }, [history, selectedDate]);

  const toggleRitual = async (ritualId: string) => {
    const isCompleted = completedOnDay(ritualId);
    // Optimistic update
    setHistory(prev => {
      const newSet = new Set(prev[ritualId] ?? []);
      if (isCompleted) newSet.delete(selectedDate); else newSet.add(selectedDate);
      return { ...prev, [ritualId]: newSet };
    });
    if (isToday) {
      setStats(prev => ({
        ...prev,
        [ritualId]: Math.max(0, (prev[ritualId] ?? 0) + (isCompleted ? -1 : 1)),
      }));
    }
    try {
      await fetch("/api/manual/ritual-completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ritualId, completed: !isCompleted, date: selectedDate }),
      });
    } catch {}
  };

  if (!ritualSelection || !loaded) return null;

  const allRituals = SLOT_ORDER.flatMap((slot) =>
    (ritualSelection[slot] ?? []).map((id) => ({ id, slot, name: getRitualName(id) }))
  );

  if (allRituals.length === 0) return null;

  const completedCount = allRituals.filter((r) => completedOnDay(r.id)).length;
  const totalCount = allRituals.length;
  const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="bg-white border border-black/8 rounded-[24px] px-7 py-7 space-y-6">
      {/* Header with day navigation */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-extrabold text-foreground">Rituály</h3>
        <div className="flex items-center gap-3">
          <div className="w-20 h-2 bg-black/8 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all bg-accent" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-sm text-foreground/40 font-medium">{completedCount}/{totalCount}</span>
        </div>
      </div>

      {/* Day navigator */}
      {days.length > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => canGoLeft && setSelectedDayIdx(i => i - 1)}
            disabled={!canGoLeft}
            className={`p-1.5 rounded-full transition-colors ${canGoLeft ? "hover:bg-black/5 text-foreground/50" : "text-foreground/15 cursor-default"}`}
          >
            <ChevronLeft size={18} />
          </button>
          <span className={`text-base font-semibold min-w-[100px] text-center ${isToday ? "text-accent" : "text-foreground/60"}`}>
            {selectedDate && formatDayLabel(selectedDate, todayStr)}
          </span>
          <button
            onClick={() => canGoRight && setSelectedDayIdx(i => i + 1)}
            disabled={!canGoRight}
            className={`p-1.5 rounded-full transition-colors ${canGoRight ? "hover:bg-black/5 text-foreground/50" : "text-foreground/15 cursor-default"}`}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      <div className="divide-y divide-black/5">
        {SLOT_ORDER.map((slot) => {
          const ids = ritualSelection[slot] ?? [];
          if (ids.length === 0) return null;
          return (
            <div key={slot} className="py-4 first:pt-0 last:pb-0">
              <p className="text-base font-bold text-foreground/60 uppercase tracking-wider mb-3">
                {SLOT_EMOJI[slot]} {SLOT_LABELS[slot]}
              </p>
              <ul className="space-y-2.5">
                {ids.map((id) => {
                  const done = completedOnDay(id);
                  const count = stats[id] ?? 0;
                  return (
                    <li key={id} className="flex items-center gap-3 group">
                      <button
                        onClick={() => toggleRitual(id)}
                        className={`w-6 h-6 rounded-lg border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                          done ? "bg-accent border-accent text-white" : "border-black/15 hover:border-accent/50"
                        }`}
                      >
                        {done && <Check size={14} strokeWidth={3} />}
                      </button>
                      <span className={`text-base flex-1 leading-snug ${done ? "line-through text-foreground/30" : "text-foreground/80"}`}>
                        {getRitualName(id)}
                      </span>
                      {count > 0 && (
                        <span className="text-sm text-foreground/30" title={`${count}× za posledních 30 dní`}>
                          {count}×
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}

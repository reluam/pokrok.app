"use client";

import { useCallback, useEffect, useState } from "react";
import { Check } from "lucide-react";
import { ritualsById, SLOT_LABELS } from "@/data/adhdRituals";

interface RitualSelection {
  morning: string[];
  daily: string[];
  evening: string[];
  durationOverrides?: Record<string, number>;
}

const SLOT_ORDER: (keyof typeof SLOT_LABELS)[] = ["morning", "daily", "evening"];
const SLOT_EMOJI: Record<string, string> = { morning: "🌅", daily: "☀️", evening: "🌙" };

function getRitualName(id: string): string {
  if (id.startsWith("custom::")) {
    const parts = id.split("::");
    return parts[1] ?? id;
  }
  return ritualsById[id]?.name ?? id;
}

interface Props {
  ritualSelection: RitualSelection | null;
}

export default function RitualsChecklistWidget({ ritualSelection }: Props) {
  const [completedToday, setCompletedToday] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState<Record<string, number>>({});
  const [loaded, setLoaded] = useState(false);

  const loadCompletions = useCallback(async () => {
    try {
      const res = await fetch("/api/laborator/ritual-completions");
      if (res.ok) {
        const d = await res.json();
        setCompletedToday(new Set(d.today ?? []));
        setStats(d.stats ?? {});
      }
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => { loadCompletions(); }, [loadCompletions]);

  useEffect(() => {
    const interval = setInterval(loadCompletions, 3 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadCompletions]);

  const toggleRitual = async (ritualId: string) => {
    const isCompleted = completedToday.has(ritualId);
    const newSet = new Set(completedToday);
    if (isCompleted) newSet.delete(ritualId); else newSet.add(ritualId);
    setCompletedToday(newSet);

    setStats((prev) => ({
      ...prev,
      [ritualId]: Math.max(0, (prev[ritualId] ?? 0) + (isCompleted ? -1 : 1)),
    }));

    try {
      await fetch("/api/laborator/ritual-completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ritualId, completed: !isCompleted }),
      });
    } catch {}
  };

  if (!ritualSelection || !loaded) return null;

  const allRituals = SLOT_ORDER.flatMap((slot) =>
    (ritualSelection[slot] ?? []).map((id) => ({ id, slot, name: getRitualName(id) }))
  );

  if (allRituals.length === 0) return null;

  const completedCount = allRituals.filter((r) => completedToday.has(r.id)).length;
  const totalCount = allRituals.length;
  const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="bg-white border border-black/8 rounded-[24px] px-7 py-7 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-extrabold text-foreground">Rituály</h3>
        <div className="flex items-center gap-3">
          <div className="w-20 h-2 bg-black/8 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all bg-accent" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-xs text-foreground/40 font-medium">{completedCount}/{totalCount}</span>
        </div>
      </div>

      <div className="divide-y divide-black/5">
        {SLOT_ORDER.map((slot) => {
          const ids = ritualSelection[slot] ?? [];
          if (ids.length === 0) return null;
          return (
            <div key={slot} className="py-4 first:pt-0 last:pb-0">
              <p className="text-sm font-bold text-foreground/60 uppercase tracking-wider mb-3">
                {SLOT_EMOJI[slot]} {SLOT_LABELS[slot]}
              </p>
              <ul className="space-y-2.5">
                {ids.map((id) => {
                  const done = completedToday.has(id);
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
                        <span className="text-xs text-foreground/30" title={`${count}× za posledních 30 dní`}>
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

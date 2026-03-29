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

  // Auto-refresh every 3 minutes to sync with mobile
  useEffect(() => {
    const interval = setInterval(loadCompletions, 3 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadCompletions]);

  const toggleRitual = async (ritualId: string) => {
    const isCompleted = completedToday.has(ritualId);
    const newSet = new Set(completedToday);
    if (isCompleted) newSet.delete(ritualId); else newSet.add(ritualId);
    setCompletedToday(newSet);

    // Update stats optimistically
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
    <div className="paper-card rounded-[20px] px-5 py-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground">Rituály</h3>
        <div className="flex items-center gap-2">
          <div className="w-16 h-1.5 bg-black/10 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all bg-accent" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-[10px] text-foreground/40">{completedCount}/{totalCount}</span>
        </div>
      </div>

      <div className="space-y-3">
        {SLOT_ORDER.map((slot) => {
          const ids = ritualSelection[slot] ?? [];
          if (ids.length === 0) return null;
          return (
            <div key={slot} className="rounded-xl bg-black/[0.02] border border-black/5 px-3.5 py-3">
              <p className="text-[10px] font-semibold text-foreground/40 uppercase tracking-wider mb-2">
                {SLOT_EMOJI[slot]} {SLOT_LABELS[slot]}
              </p>
              <ul className="space-y-1.5">
                {ids.map((id) => {
                  const done = completedToday.has(id);
                  const count = stats[id] ?? 0;
                  return (
                    <li key={id} className="flex items-center gap-2 group">
                      <button
                        onClick={() => toggleRitual(id)}
                        className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${
                          done ? "bg-accent border-accent text-white" : "border-black/20 hover:border-accent/50"
                        }`}
                      >
                        {done && <Check size={10} />}
                      </button>
                      <span className={`text-sm flex-1 leading-snug ${done ? "line-through text-foreground/35" : "text-foreground/70"}`}>
                        {getRitualName(id)}
                      </span>
                      {count > 0 && (
                        <span className="text-[10px] text-foreground/30" title={`${count}× za posledních 30 dní`}>
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

"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export type CalendarItem = {
  type: "session" | "booking";
  id: string;
  title: string;
  scheduled_at: string | null;
  duration_minutes?: number | null;
  client_name: string;
  client_email?: string | null;
};

const DAY_LABELS = ["Po", "Út", "St", "Čt", "Pá", "So", "Ne"];
const MAX_VISIBLE = 3;

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("cs-CZ", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function groupByDay(items: CalendarItem[], weekStart: string): Map<number, CalendarItem[]> {
  const start = new Date(weekStart + "T12:00:00");
  const map = new Map<number, CalendarItem[]>();
  for (let i = 0; i < 7; i++) map.set(i, []);
  for (const item of items) {
    if (!item.scheduled_at) continue;
    const d = new Date(item.scheduled_at);
    const dayIndex = Math.floor((d.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
    if (dayIndex >= 0 && dayIndex < 7) {
      map.get(dayIndex)!.push(item);
    }
  }
  for (const arr of map.values()) {
    arr.sort((a, b) => String(a.scheduled_at).localeCompare(String(b.scheduled_at)));
  }
  return map;
}

type WeekGridProps = {
  items: CalendarItem[];
  weekStart: string; // YYYY-MM-DD Monday
  prevWeekHref: string;
  nextWeekHref: string;
  weekLabel: string;
};

export function WeekGrid({ items, weekStart, prevWeekHref, nextWeekHref, weekLabel }: WeekGridProps) {
  const byDay = useMemo(() => groupByDay(items, weekStart), [items, weekStart]);
  const [popoverDay, setPopoverDay] = useState<number | null>(null);

  const startDate = new Date(weekStart + "T12:00:00");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <nav className="flex items-center gap-2">
          <Link
            href={prevWeekHref}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            ← Předchozí
          </Link>
          <span className="min-w-[200px] text-center text-sm font-medium text-slate-800">
            {weekLabel}
          </span>
          <Link
            href={nextWeekHref}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Další →
          </Link>
        </nav>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {DAY_LABELS.map((label, i) => {
          const dayItems = byDay.get(i) ?? [];
          const visible = dayItems.slice(0, MAX_VISIBLE);
          const rest = dayItems.slice(MAX_VISIBLE);
          const dayDate = new Date(startDate);
          dayDate.setDate(startDate.getDate() + i);

          return (
            <div
              key={i}
              className="min-h-[140px] rounded-xl border border-slate-200 bg-slate-50/50 p-2"
            >
              <div className="mb-1.5 flex items-baseline justify-between">
                <span className="text-xs font-semibold text-slate-500">{label}</span>
                <span className="text-xs text-slate-400">
                  {dayDate.getDate()}.{dayDate.getMonth() + 1}.
                </span>
              </div>
              <div className="space-y-1">
                {visible.map((item) => (
                  <div
                    key={item.type === "session" ? item.id : `b-${item.id}`}
                    className={`rounded-lg px-2 py-1 text-[11px] ${
                      item.type === "booking"
                        ? "bg-amber-100 text-amber-900"
                        : "bg-white shadow-sm ring-1 ring-slate-100"
                    }`}
                  >
                    <div className="font-medium text-slate-900 truncate" title={item.title}>
                      {item.title}
                    </div>
                    <div className="text-slate-500">{formatTime(item.scheduled_at!)}</div>
                    <div className="truncate text-slate-600">{item.client_name}</div>
                  </div>
                ))}
                {rest.length > 0 && (
                  <div className="relative">
                    <button
                      type="button"
                      className="w-full rounded-lg border border-dashed border-slate-300 bg-white py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-50"
                      onMouseEnter={() => setPopoverDay(i)}
                      onMouseLeave={() => setPopoverDay(null)}
                    >
                      +{rest.length} další
                    </button>
                    {popoverDay === i && (
                      <div
                        className="absolute left-0 top-full z-20 mt-1 min-w-[200px] rounded-lg border border-slate-200 bg-white p-2 shadow-lg"
                        onMouseEnter={() => setPopoverDay(i)}
                        onMouseLeave={() => setPopoverDay(null)}
                      >
                        <div className="mb-1 text-[10px] font-semibold uppercase text-slate-400">
                          {DAY_LABELS[i]} {dayDate.getDate()}.{dayDate.getMonth() + 1}.
                        </div>
                        {rest.map((item) => (
                          <div
                            key={item.type === "session" ? item.id : `b-${item.id}`}
                            className={`border-b border-slate-100 py-1.5 last:border-0 ${
                              item.type === "booking" ? "text-amber-800" : ""
                            }`}
                          >
                            <div className="font-medium">{item.title}</div>
                            <div className="text-xs text-slate-500">
                              {formatTime(item.scheduled_at!)} · {item.client_name}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

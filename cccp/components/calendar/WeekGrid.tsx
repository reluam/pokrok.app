"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useRef } from "react";
import { BookingDetailModal } from "./BookingDetailModal";
import { AddCalendarItemModal } from "./AddCalendarItemModal";

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
  const router = useRouter();
  const byDay = useMemo(() => groupByDay(items, weekStart), [items, weekStart]);
  const [popoverDay, setPopoverDay] = useState<number | null>(null);
  const [popoverPositions, setPopoverPositions] = useState<Map<number, "bottom" | "top">>(new Map());
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [addModalDate, setAddModalDate] = useState<string | null>(null);
  const popoverRefs = useRef<Map<number, { button: HTMLButtonElement | null; popover: HTMLDivElement | null }>>(new Map());

  const startDate = new Date(weekStart + "T12:00:00");

  function getDateForDay(dayIndex: number): string {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + dayIndex);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

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
                <button
                  type="button"
                  onClick={() => setAddModalDate(getDateForDay(i))}
                  className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-300"
                  title="Přidat schůzku"
                >
                  +
                </button>
                <div className="flex items-baseline gap-1">
                  <span className="text-xs font-semibold text-slate-500">{label}</span>
                  <span className="text-xs text-slate-400">
                    {dayDate.getDate()}.{dayDate.getMonth() + 1}.
                  </span>
                </div>
              </div>
              <div className="space-y-1">
                {visible.map((item) => (
                  <div
                    key={item.type === "session" ? item.id : `b-${item.id}`}
                    role={item.type === "booking" ? "button" : undefined}
                    tabIndex={item.type === "booking" ? 0 : undefined}
                    onClick={
                      item.type === "booking"
                        ? () => setSelectedBookingId(item.id)
                        : undefined
                    }
                    onKeyDown={
                      item.type === "booking"
                        ? (e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              setSelectedBookingId(item.id);
                            }
                          }
                        : undefined
                    }
                    className={`rounded-lg px-2 py-1 text-[11px] ${
                      item.type === "booking"
                        ? "cursor-pointer bg-amber-100 text-amber-900 hover:bg-amber-200"
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
                      ref={(el) => {
                        const map = popoverRefs.current;
                        if (!map.has(i)) map.set(i, { button: null, popover: null });
                        map.get(i)!.button = el;
                      }}
                      type="button"
                      className="w-full rounded-lg border border-dashed border-slate-300 bg-white py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-50"
                      onMouseEnter={() => {
                        setPopoverDay(i);
                        setTimeout(() => {
                          const refs = popoverRefs.current.get(i);
                          if (refs?.button && refs?.popover) {
                            const buttonRect = refs.button.getBoundingClientRect();
                            const popoverRect = refs.popover.getBoundingClientRect();
                            const viewportHeight = window.innerHeight;
                            
                            const position = buttonRect.bottom + popoverRect.height > viewportHeight - 20 ? "top" : "bottom";
                            setPopoverPositions((prev) => {
                              const next = new Map(prev);
                              next.set(i, position);
                              return next;
                            });
                          }
                        }, 10);
                      }}
                      onMouseLeave={() => setPopoverDay(null)}
                    >
                      +{rest.length} další
                    </button>
                    {popoverDay === i && (
                      <div
                        ref={(el) => {
                          const map = popoverRefs.current;
                          if (!map.has(i)) map.set(i, { button: null, popover: null });
                          map.get(i)!.popover = el;
                        }}
                        className={`absolute left-0 z-50 min-w-[200px] max-w-[280px] rounded-lg border border-slate-200 bg-white p-2 shadow-xl ${
                          (popoverPositions.get(i) || "bottom") === "bottom" ? "top-full mt-1" : "bottom-full mb-1"
                        }`}
                        onMouseEnter={() => setPopoverDay(i)}
                        onMouseLeave={() => setPopoverDay(null)}
                      >
                        <div className="mb-1 text-[10px] font-semibold uppercase text-slate-400">
                          {DAY_LABELS[i]} {dayDate.getDate()}.{dayDate.getMonth() + 1}.
                        </div>
                        {rest.map((item) => (
                          <div
                            key={item.type === "session" ? item.id : `b-${item.id}`}
                            role={item.type === "booking" ? "button" : undefined}
                            tabIndex={item.type === "booking" ? 0 : undefined}
                            onClick={
                              item.type === "booking"
                                ? () => setSelectedBookingId(item.id)
                                : undefined
                            }
                            onKeyDown={
                              item.type === "booking"
                                ? (e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                      e.preventDefault();
                                      setSelectedBookingId(item.id);
                                    }
                                  }
                                : undefined
                            }
                            className={`border-b border-slate-100 py-1.5 last:border-0 ${
                              item.type === "booking"
                                ? "cursor-pointer text-amber-800 hover:bg-amber-50"
                                : ""
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
      <BookingDetailModal
        bookingId={selectedBookingId}
        open={selectedBookingId !== null}
        onClose={() => setSelectedBookingId(null)}
        onCancelled={() => router.refresh()}
      />
      <AddCalendarItemModal
        open={addModalDate !== null}
        date={addModalDate || ""}
        onClose={() => setAddModalDate(null)}
        onAdded={() => {
          router.refresh();
          setAddModalDate(null);
        }}
      />
    </div>
  );
}

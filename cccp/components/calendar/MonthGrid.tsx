"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
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

function groupByDate(items: CalendarItem[]): Map<string, CalendarItem[]> {
  const map = new Map<string, CalendarItem[]>();
  for (const item of items) {
    if (item.scheduled_at == null) continue;
    const raw = item.scheduled_at;
    const d =
      typeof raw === "string"
        ? raw.slice(0, 10)
        : new Date(raw as unknown as string | number).toISOString().slice(0, 10);
    if (!map.has(d)) map.set(d, []);
    map.get(d)!.push(item);
  }
  for (const arr of map.values()) {
    arr.sort((a, b) => String(a.scheduled_at).localeCompare(String(b.scheduled_at)));
  }
  return map;
}

type MonthGridProps = {
  items: CalendarItem[];
  year: number;
  month: number; // 1–12
  prevMonthHref: string;
  nextMonthHref: string;
  monthLabel: string;
};

export function MonthGrid({
  items,
  year,
  month,
  prevMonthHref,
  nextMonthHref,
  monthLabel,
}: MonthGridProps) {
  const router = useRouter();
  const byDate = useMemo(() => groupByDate(items), [items]);
  const [popoverKey, setPopoverKey] = useState<string | null>(null);
  const [popoverPositions, setPopoverPositions] = useState<Map<string, "bottom" | "top">>(new Map());
  const [popoverAnchor, setPopoverAnchor] = useState<{ left: number; top: number; bottom: number } | null>(null);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [addModalDate, setAddModalDate] = useState<string | null>(null);
  const [mobileSelectedDayKey, setMobileSelectedDayKey] = useState<string | null>(null);
  const popoverRefs = useRef<Map<string, { button: HTMLButtonElement | null }>>(new Map());
  const popoverCloseTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (selectedBookingId) {
      setPopoverKey(null);
      setPopoverAnchor(null);
    }
  }, [selectedBookingId]);

  // Keep popover anchor in sync on scroll/resize when open
  useEffect(() => {
    if (!popoverKey) return;
    const update = () => {
      const refs = popoverRefs.current.get(popoverKey);
      if (refs?.button) {
        const rect = refs.button.getBoundingClientRect();
        setPopoverAnchor({ left: rect.left, top: rect.top, bottom: rect.bottom });
      }
    };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [popoverKey]);

  const rows = useMemo(() => {
    const firstDay = new Date(year, month - 1, 1);
    const daysInMonth = new Date(year, month, 0).getDate();
    const startCol = (firstDay.getDay() + 6) % 7;
    const dayNumbers: (number | null)[] = [
      ...Array(startCol).fill(null),
      ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];
    const r: (number | null)[][] = [];
    for (let i = 0; i < dayNumbers.length; i += 7) {
      r.push(dayNumbers.slice(i, i + 7));
    }
    return r;
  }, [year, month]);

  function dateKey(day: number): string {
    const d = String(day).padStart(2, "0");
    const m = String(month).padStart(2, "0");
    return `${year}-${m}-${d}`;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <nav className="flex items-center gap-2">
          <Link
            href={prevMonthHref}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            ← Předchozí
          </Link>
          <span className="min-w-[200px] text-center text-sm font-medium text-slate-800">
            {monthLabel}
          </span>
          <Link
            href={nextMonthHref}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Další →
          </Link>
        </nav>
      </div>

      <p className="mb-2 text-xs text-slate-500 md:sr-only">
        Klepni na den pro zobrazení schůzek.
      </p>
      <div className="overflow-x-auto -mx-1 px-1 md:mx-0 md:px-0" style={{ WebkitOverflowScrolling: "touch" }}>
        <div className="grid w-full min-w-0 grid-cols-7 gap-1 md:min-w-[600px] md:gap-2">
          {/* Header row: day labels */}
          {DAY_LABELS.map((label) => (
            <div
              key={label}
              className="rounded-lg border border-slate-200 bg-slate-50 py-1 text-center text-[10px] font-semibold text-slate-600 md:rounded-xl md:py-1.5 md:text-xs"
            >
              {label}
            </div>
          ))}
          {/* Day cells (including empty placeholders) */}
          {rows.flat().map((day, idx) => {
            if (day === null) {
              return (
                <div
                  key={`empty-${idx}`}
                  className="min-h-[64px] rounded-lg border border-slate-100 bg-slate-50/30 p-1 md:min-h-[100px] md:rounded-xl md:p-2"
                />
              );
            }
            const key = dateKey(day);
            const dayItems = byDate.get(key) ?? [];
            const visible = dayItems.slice(0, MAX_VISIBLE);
            const rest = dayItems.slice(MAX_VISIBLE);
            const count = dayItems.length;
            const isMobileSelected = mobileSelectedDayKey === key;

            return (
              <div
                key={key}
                className={`min-h-[64px] rounded-lg border p-1 md:min-h-[100px] md:rounded-xl md:border-slate-200 md:bg-slate-50/50 md:p-2 ${
                  isMobileSelected
                    ? "border-slate-400 bg-slate-100 ring-2 ring-slate-300"
                    : "border-slate-200 bg-slate-50/50"
                }`}
              >
                {/* Mobile: compact cell – day number + count, tap to select and show list below */}
                <div
                  className="flex h-full min-h-[56px] flex-col items-center justify-center gap-0.5 md:hidden"
                  role="button"
                  tabIndex={0}
                  onClick={() => setMobileSelectedDayKey((prev) => (prev === key ? null : key))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setMobileSelectedDayKey((prev) => (prev === key ? null : key));
                    }
                  }}
                >
                  <span className="text-xs font-medium text-slate-700">{day}</span>
                  {count > 0 ? (
                    <span className="rounded-full bg-slate-600 px-1.5 py-0.5 text-[10px] font-medium text-white">
                      {count}
                    </span>
                  ) : (
                    <span className="text-slate-300 text-[10px]">·</span>
                  )}
                </div>

                {/* Desktop: full cell content */}
                <div className="hidden md:block">
                  <div className="mb-1.5 flex items-baseline justify-between">
                    <button
                      type="button"
                      onClick={() => setAddModalDate(key)}
                      className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-300"
                      title="Přidat schůzku"
                    >
                      +
                    </button>
                    <span className="text-right text-xs font-medium text-slate-500">{day}</span>
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
                        <div className="truncate font-medium text-slate-900" title={item.title}>
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
                            if (!map.has(key)) map.set(key, { button: null });
                            map.get(key)!.button = el;
                          }}
                          type="button"
                          className="w-full rounded-lg border border-dashed border-slate-300 bg-white py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-50"
                          onMouseEnter={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setPopoverAnchor({ left: rect.left, top: rect.top, bottom: rect.bottom });
                            const position: "bottom" | "top" =
                              rect.bottom + 280 > window.innerHeight - 20 ? "top" : "bottom";
                            setPopoverPositions((prev) => {
                              const next = new Map(prev);
                              next.set(key, position);
                              return next;
                            });
                            setPopoverKey(key);
                          }}
                          onMouseLeave={() => {
                            popoverCloseTimeout.current = setTimeout(() => {
                              setPopoverKey(null);
                              setPopoverAnchor(null);
                              popoverCloseTimeout.current = null;
                            }, 150);
                          }}
                        >
                          +{rest.length} další
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile: selected day – list of events below the grid */}
      {mobileSelectedDayKey && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:hidden">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">
              {(() => {
                const [y, m, d] = mobileSelectedDayKey.split("-").map(Number);
                return `${d}. ${m}. ${y}`;
              })()}
            </h3>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setAddModalDate(mobileSelectedDayKey)}
                className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200"
              >
                + Přidat
              </button>
              <button
                type="button"
                onClick={() => setMobileSelectedDayKey(null)}
                className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                Zavřít
              </button>
            </div>
          </div>
          <div className="space-y-2">
            {(byDate.get(mobileSelectedDayKey) ?? []).length === 0 ? (
              <p className="py-4 text-center text-sm text-slate-500">
                V tento den nemáš žádné schůzky. Přidej ji tlačítkem výše.
              </p>
            ) : null}
            {(byDate.get(mobileSelectedDayKey) ?? []).map((item) => (
              <div
                key={item.type === "session" ? item.id : `b-${item.id}`}
                role={item.type === "booking" ? "button" : undefined}
                tabIndex={item.type === "booking" ? 0 : undefined}
                onClick={
                  item.type === "booking" ? () => setSelectedBookingId(item.id) : undefined
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
                className={`flex items-center justify-between rounded-lg px-3 py-2 text-left ${
                  item.type === "booking"
                    ? "cursor-pointer bg-amber-50 ring-1 ring-amber-200/60"
                    : "bg-slate-50 ring-1 ring-slate-100"
                }`}
              >
                <div>
                  <div className="text-sm font-medium text-slate-900">{item.title}</div>
                  <div className="text-xs text-slate-500">
                    {formatTime(item.scheduled_at!)} · {item.client_name}
                  </div>
                </div>
                {item.type === "booking" ? (
                  <span className="rounded bg-amber-200/70 px-1.5 py-0.5 text-[10px] font-medium text-amber-900">
                    Rezervace
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      )}
      {typeof document !== "undefined" &&
        popoverKey &&
        popoverAnchor &&
        createPortal(
          <div
            className="fixed z-[100] min-w-[220px] max-w-[300px] rounded-lg border border-slate-200 bg-white p-2 shadow-xl"
            style={{
              left: popoverAnchor.left,
              ...((popoverPositions.get(popoverKey) || "bottom") === "bottom"
                ? { top: popoverAnchor.bottom + 4 }
                : { bottom: window.innerHeight - popoverAnchor.top + 8 }),
            }}
            onMouseEnter={() => {
              if (popoverCloseTimeout.current) {
                clearTimeout(popoverCloseTimeout.current);
                popoverCloseTimeout.current = null;
              }
            }}
            onMouseLeave={() => {
              setPopoverKey(null);
              setPopoverAnchor(null);
            }}
          >
            {(() => {
              const dayItems = byDate.get(popoverKey) ?? [];
              const rest = dayItems.slice(MAX_VISIBLE);
              const [y, m, d] = popoverKey.split("-").map(Number);
              return (
                <>
                  <div className="mb-1 text-[10px] font-semibold uppercase text-slate-400">
                    {d}. {m}. {y}
                  </div>
                  <div className="space-y-0">
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
                </>
              );
            })()}
          </div>,
          document.body
        )}
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

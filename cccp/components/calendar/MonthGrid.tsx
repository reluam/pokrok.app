"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { BookingDetailModal } from "./BookingDetailModal";

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
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);

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

      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] table-fixed border-collapse">
          <thead>
            <tr>
              {DAY_LABELS.map((label) => (
                <th
                  key={label}
                  className="border border-slate-200 bg-slate-50 py-1.5 text-xs font-semibold text-slate-600"
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri}>
                {row.map((day, di) => {
                  if (day === null) {
                    return <td key={di} className="min-h-[100px] border border-slate-100 bg-slate-50/30 p-1 align-top" />;
                  }
                  const key = dateKey(day);
                  const dayItems = byDate.get(key) ?? [];
                  const visible = dayItems.slice(0, MAX_VISIBLE);
                  const rest = dayItems.slice(MAX_VISIBLE);
                  const popoverOpen = popoverKey === key;

                  return (
                    <td
                      key={di}
                      className="min-h-[100px] min-w-[80px] border border-slate-200 bg-white p-1 align-top"
                    >
                      <div className="mb-1 text-right text-xs font-medium text-slate-500">
                        {day}
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
                            className={`rounded px-1.5 py-1 text-[11px] ${
                              item.type === "booking"
                                ? "cursor-pointer bg-amber-100 text-amber-900 hover:bg-amber-200"
                                : "bg-slate-50 ring-1 ring-slate-100"
                            }`}
                          >
                            <div className="truncate font-medium" title={item.title}>
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
                              className="w-full rounded border border-dashed border-slate-300 bg-white py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-50"
                              onMouseEnter={() => setPopoverKey(key)}
                              onMouseLeave={() => setPopoverKey(null)}
                            >
                              +{rest.length} další
                            </button>
                            {popoverOpen && (
                              <div
                                className="absolute left-0 top-full z-20 mt-1 min-w-[220px] rounded-lg border border-slate-200 bg-white p-2 shadow-lg"
                                onMouseEnter={() => setPopoverKey(key)}
                                onMouseLeave={() => setPopoverKey(null)}
                              >
                                <div className="mb-1 text-[10px] font-semibold uppercase text-slate-400">
                                  {day}. {month}. {year}
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
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <BookingDetailModal
        bookingId={selectedBookingId}
        open={selectedBookingId !== null}
        onClose={() => setSelectedBookingId(null)}
        onCancelled={() => router.refresh()}
      />
    </div>
  );
}

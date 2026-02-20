"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BookingDetailModal } from "./BookingDetailModal";

export type SlotItem = {
  type: "session" | "booking";
  id: string;
  title: string;
  scheduled_at: string | null;
  duration_minutes?: number | null;
  client_name: string;
  client_email?: string | null;
};

type DaySection = {
  label: string;
  dateKey: string;
  items: SlotItem[];
};

type CalendarSlotsListProps = {
  daySections: DaySection[];
};

export function CalendarSlotsList({ daySections }: CalendarSlotsListProps) {
  const router = useRouter();
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);

  return (
    <>
      <div className="space-y-6 text-sm">
        {daySections.map(({ label, dateKey, items }, i) => (
          <div key={dateKey ? `${dateKey}-${label}` : `dalsi-${i}`}>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              {label}
            </h2>
            <div className="space-y-2">
              {items.map((s) => (
                <div
                  key={s.type === "session" ? s.id : `b-${s.id}`}
                  role={s.type === "booking" ? "button" : undefined}
                  tabIndex={s.type === "booking" ? 0 : undefined}
                  onClick={
                    s.type === "booking"
                      ? () => setSelectedBookingId(s.id)
                      : undefined
                  }
                  onKeyDown={
                    s.type === "booking"
                      ? (e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setSelectedBookingId(s.id);
                          }
                        }
                      : undefined
                  }
                  className={`flex items-center justify-between rounded-xl px-3 py-2 ${
                    s.type === "booking"
                      ? "cursor-pointer bg-amber-50 ring-1 ring-amber-200/60 hover:bg-amber-100/80"
                      : "bg-slate-50"
                  }`}
                >
                  <div>
                    <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      {s.scheduled_at
                        ? new Date(s.scheduled_at).toLocaleString("cs-CZ", {
                            weekday: "short",
                            day: "numeric",
                            month: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "Bez data"}
                      {s.type === "booking" ? (
                        <span className="ml-1.5 rounded bg-amber-200/70 px-1.5 py-0.5 text-[10px] font-medium text-amber-900">
                          Rezervace
                        </span>
                      ) : null}
                    </div>
                    <div className="text-sm font-semibold text-slate-900">
                      {s.title}
                    </div>
                  </div>
                  <div className="text-right text-xs text-slate-500">
                    <div className="font-medium text-slate-800">{s.client_name}</div>
                    <div>{s.client_email ?? ""}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <BookingDetailModal
        bookingId={selectedBookingId}
        open={selectedBookingId !== null}
        onClose={() => setSelectedBookingId(null)}
        onCancelled={() => router.refresh()}
      />
    </>
  );
}

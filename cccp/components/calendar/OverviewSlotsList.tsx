"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BookingDetailModal } from "./BookingDetailModal";
import { SessionDetailModal } from "./SessionDetailModal";

export type OverviewSlotItem = {
  type: "session" | "booking";
  id: string;
  title: string;
  scheduled_at: string;
  duration_minutes?: number | null;
  client_name: string;
};

type OverviewSlotsListProps = {
  slots: OverviewSlotItem[];
};

export function OverviewSlotsList({ slots }: OverviewSlotsListProps) {
  const router = useRouter();
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  function refresh() {
    router.refresh();
  }

  return (
    <>
      <div className="space-y-2 text-sm">
        {slots.map((s) => (
          <div
            key={s.type === "session" ? s.id : `b-${s.id}`}
            role="button"
            tabIndex={0}
            onClick={() =>
              s.type === "booking"
                ? setSelectedBookingId(s.id)
                : setSelectedSessionId(s.id)
            }
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                s.type === "booking"
                  ? setSelectedBookingId(s.id)
                  : setSelectedSessionId(s.id);
              }
            }}
            className={`flex cursor-pointer items-center justify-between rounded-xl px-3 py-2 ${
              s.type === "booking"
                ? "bg-amber-50 ring-1 ring-amber-200/60 hover:bg-amber-100/80"
                : "bg-slate-50 ring-1 ring-slate-200/60 hover:bg-slate-100/80"
            }`}
          >
            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                {new Date(s.scheduled_at).toLocaleTimeString("cs-CZ", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                {s.duration_minutes ? ` · ${s.duration_minutes} min` : null}
                {s.type === "booking" ? (
                  <span className="ml-1.5 rounded bg-amber-200/70 px-1.5 py-0.5 text-[10px] font-medium text-amber-900">
                    Rezervace
                  </span>
                ) : (
                  <span className="ml-1.5 rounded bg-slate-200/70 px-1.5 py-0.5 text-[10px] font-medium text-slate-700">
                    Schůzka
                  </span>
                )}
              </div>
              <div className="text-sm font-semibold text-slate-900">
                {s.title}
              </div>
            </div>
            <div className="text-right text-xs text-slate-500">
              <div className="font-medium text-slate-800">{s.client_name}</div>
            </div>
          </div>
        ))}
      </div>
      <BookingDetailModal
        bookingId={selectedBookingId}
        open={selectedBookingId !== null}
        onClose={() => setSelectedBookingId(null)}
        onCancelled={refresh}
      />
      <SessionDetailModal
        sessionId={selectedSessionId}
        open={selectedSessionId !== null}
        onClose={() => setSelectedSessionId(null)}
        onSaved={refresh}
      />
    </>
  );
}

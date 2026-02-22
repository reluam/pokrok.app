"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type BookingPopupParams = {
  email?: string;
  name?: string;
  note?: string;
  leadId?: string;
  source?: string;
};

type BookingPopupContextValue = {
  openBookingPopup: (params?: BookingPopupParams) => void;
  closeBookingPopup: () => void;
};

const BookingPopupContext = createContext<BookingPopupContextValue | null>(null);

export function useBookingPopup() {
  return useContext(BookingPopupContext);
}

export function BookingPopupProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [prefill, setPrefill] = useState<BookingPopupParams>({});

  const openBookingPopup = useCallback((params?: BookingPopupParams) => {
    setPrefill(params ?? {});
    setIsOpen(true);
  }, []);

  const closeBookingPopup = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <BookingPopupContext.Provider value={{ openBookingPopup, closeBookingPopup }}>
      {children}
      <BookingModal isOpen={isOpen} onClose={closeBookingPopup} prefill={prefill} />
    </BookingPopupContext.Provider>
  );
}

type Slot = { id: string; startAt: string; durationMinutes: number; title?: string | null };

const FIRST_DAY_OF_WEEK = 1; // Pondělí

function getWeekStart(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  const day = (copy.getDay() + 6) % 7;
  copy.setDate(copy.getDate() - day);
  return copy;
}

function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getDatesForOffset(offset: number): string[] {
  const today = new Date();
  const weekStart = getWeekStart(today);
  const start = new Date(weekStart);
  start.setDate(weekStart.getDate() + offset * 28);
  const out: string[] = [];
  for (let i = 0; i < 28; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    out.push(toDateKey(d));
  }
  return out;
}

function todayKey(): string {
  return toDateKey(new Date());
}

function dateKeyFromSlot(startAt: string): string {
  return startAt.slice(0, 10);
}

function formatSlotDate(iso: string): string {
  return new Date(iso).toLocaleDateString("cs-CZ", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function formatSlotTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("cs-CZ", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function BookingModal({
  isOpen,
  onClose,
  prefill,
}: {
  isOpen: boolean;
  onClose: () => void;
  prefill: BookingPopupParams;
}) {
  const [offset, setOffset] = useState(0);
  const dates = useMemo(() => getDatesForOffset(offset), [offset]);
  const [allSlots, setAllSlots] = useState<Slot[]>([]);
  const [slotsByDate, setSlotsByDate] = useState<Record<string, Slot[]>>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [slotsForDay, setSlotsForDay] = useState<Slot[]>([]);
  const [selected, setSelected] = useState<Slot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [reserving, setReserving] = useState(false);
  const [reserveError, setReserveError] = useState("");
  const [success, setSuccess] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  const fromParam = dates[0];
  const toParam = dates[27];

  const loadSlots = useCallback((from: string, to: string, dateList: string[]) => {
    setLoading(true);
    setError("");
    setSelected(null);
    setSelectedDate(null);
    setSlotsForDay([]);
    fetch(`/api/booking/slots?from=${from}&to=${to}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
          setAllSlots([]);
          setSlotsByDate({});
        } else {
          const slots: Slot[] = data.slots ?? [];
          setAllSlots(slots);
          const byDate: Record<string, Slot[]> = {};
          for (const date of dateList) byDate[date] = [];
          for (const slot of slots) {
            const key = dateKeyFromSlot(slot.startAt);
            if (byDate[key]) byDate[key].push(slot);
          }
          setSlotsByDate(byDate);
          const firstWithSlots = dateList.find((d) => (byDate[d]?.length ?? 0) > 0);
          if (firstWithSlots && (byDate[firstWithSlots]?.length ?? 0) > 0) {
            setSelectedDate(firstWithSlots);
            setSlotsForDay(byDate[firstWithSlots]);
          }
        }
      })
      .catch(() => {
        setError("Nepodařilo se načíst termíny.");
        setAllSlots([]);
        setSlotsByDate({});
      })
      .finally(() => {
        setLoading(false);
        setInitialLoadDone(true);
      });
  }, []);

  useEffect(() => {
    if (isOpen && fromParam && toParam) {
      setSuccess(false);
      setReserveError("");
      setInitialLoadDone(false);
      loadSlots(fromParam, toParam, dates);
    }
  }, [isOpen, fromParam, toParam, dates, loadSlots]);

  const selectDate = useCallback((date: string) => {
    if (isPast(date)) return;
    const daySlots = slotsByDate[date] ?? [];
    if (daySlots.length === 0) return;
    setSelectedDate(date);
    setSlotsForDay(daySlots);
    setSelected(null);
    setReserveError("");
  }, [slotsByDate]);

  const today = todayKey();
  const isPast = (date: string) => date < today;
  const hasSlots = (date: string) => (slotsByDate[date]?.length ?? 0) > 0;
  const canSelectDate = (date: string) => !isPast(date) && hasSlots(date);

  const goToPrevWeeks = () => {
    setOffset((o) => Math.max(0, o - 1));
    setSelectedDate(null);
    setSlotsForDay([]);
    setSelected(null);
  };

  const goToNextWeeks = () => {
    setOffset((o) => o + 1);
    setSelectedDate(null);
    setSlotsForDay([]);
    setSelected(null);
  };

  const goToToday = () => {
    setOffset(0);
    setSelectedDate(null);
    setSlotsForDay([]);
    setSelected(null);
  };

  const handleReserve = () => {
    if (!selected || !prefill.email || !prefill.name) return;
    setReserving(true);
    setReserveError("");
    fetch("/api/booking/reserve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slotId: selected.id,
        startAt: selected.startAt,
        durationMinutes: selected.durationMinutes,
        email: prefill.email,
        name: prefill.name,
        note: prefill.note ?? undefined,
        source: prefill.source ?? "koucing",
        leadId: prefill.leadId ?? undefined,
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setReserveError(data.error);
        else setSuccess(true);
      })
      .catch(() => setReserveError("Rezervaci se nepodařilo dokončit."))
      .finally(() => setReserving(false));
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-label="Rezervace termínu"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between shrink-0 px-4 py-3 border-b border-black/10">
          <span className="font-semibold text-foreground">Vyber si termín</span>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-black/5 transition-colors"
            aria-label="Zavřít"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="p-4">
          {success ? (
            <div className="text-center space-y-4 py-6">
              <p className="text-xl font-semibold text-foreground">Rezervace proběhla úspěšně</p>
              <p className="text-foreground/80 text-sm sm:text-base leading-relaxed">
                Děkuji a těším se na náš hovor. Na tvůj e-mail ti přijde potvrzení s detaily termínu.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 bg-accent text-white rounded-xl font-medium hover:bg-accent-hover"
              >
                Zavřít
              </button>
            </div>
          ) : (
          <>
              {loading && !initialLoadDone && (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-foreground/20 border-t-accent" />
                  <p className="mt-3 text-sm text-foreground/60">Načítám dostupnost…</p>
                </div>
              )}

              {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

              {initialLoadDone && !loading && (
                <div className="flex flex-col gap-6 md:flex-row md:items-start">
                  {/* Kalendář: 4 týdny, řádky Po–Ne */}
                  <div className="shrink-0">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-foreground/60">Datum</p>
                      <div className="flex items-center gap-1">
                        {offset > 0 && (
                          <>
                            <button type="button" onClick={goToPrevWeeks} className="rounded-lg border border-black/10 bg-white px-2 py-1.5 text-xs font-medium text-foreground shadow-sm hover:bg-black/5">
                              ← Zpět
                            </button>
                            <button type="button" onClick={goToToday} className="rounded-lg border border-black/10 bg-white px-2 py-1.5 text-xs font-medium text-foreground shadow-sm hover:bg-black/5">
                              Dnes
                            </button>
                          </>
                        )}
                        <button type="button" onClick={goToNextWeeks} className="rounded-lg border border-black/10 bg-white px-2 py-1.5 text-xs font-medium text-foreground shadow-sm hover:bg-black/5">
                          Další →
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-7 gap-1.5" style={{ gridTemplateColumns: "repeat(7, minmax(2.25rem, 1fr))" }}>
                      {dates.map((d) => {
                        const past = isPast(d);
                        const selectable = canSelectDate(d);
                        const isSelected = selectedDate === d;
                        return (
                          <button
                            key={d}
                            type="button"
                            onClick={() => selectDate(d)}
                            disabled={!selectable}
                            className={`flex min-w-0 flex-col items-center justify-center rounded-lg border px-1.5 py-2 text-center text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-accent ${
                              past ? "cursor-default border-black/5 bg-black/5 text-foreground/40" :
                              !selectable ? "cursor-not-allowed border-black/5 bg-black/5 text-foreground/40" :
                              isSelected ? "border-accent bg-accent text-white" :
                              "border-black/10 bg-white text-foreground hover:border-accent/50 hover:bg-accent/10"
                            }`}
                          >
                            <span className="block w-full truncate text-[10px] opacity-80">
                              {new Date(d + "T12:00:00").toLocaleDateString("cs-CZ", { weekday: "short" })}
                            </span>
                            <span className="mt-0.5 block font-semibold">{new Date(d + "T12:00:00").getDate()}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Časy: vedle na md+, pod na mobilu */}
                  <div className="min-w-0 flex-1">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-foreground/60">
                      {selectedDate ? `Čas — ${formatSlotDate(selectedDate + "T12:00:00")}` : "Čas"}
                    </p>
                    {!selectedDate ? (
                      <p className="rounded-xl bg-black/5 px-4 py-3 text-sm text-foreground/60">Vyber datum v kalendáři.</p>
                    ) : slotsForDay.length === 0 ? (
                      <p className="rounded-xl bg-black/5 px-4 py-3 text-sm text-foreground/60">Pro tento den nejsou volné termíny.</p>
                    ) : (
                      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-3">
                        {slotsForDay.map((slot) => (
                          <button
                            key={slot.id}
                            type="button"
                            onClick={() => setSelected(slot)}
                            className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-accent ${
                              selected?.id === slot.id
                                ? "border-accent bg-accent text-white"
                                : "border-black/10 bg-white text-foreground hover:border-accent/50 hover:bg-accent/10"
                            }`}
                          >
                            {formatSlotTime(slot.startAt)}
                          </button>
                        ))}
                      </div>
                    )}

                    {selected && (
                      <div className="mt-4 pt-4 border-t border-black/10">
                        <p className="text-sm text-foreground/70 mb-2">
                          Vybráno: {formatSlotDate(selected.startAt)} v {formatSlotTime(selected.startAt)}
                          {selected.durationMinutes ? ` (${selected.durationMinutes} min)` : ""}
                        </p>
                        {reserveError && <p className="text-sm text-red-600 mb-2">{reserveError}</p>}
                        <button
                          type="button"
                          onClick={handleReserve}
                          disabled={reserving}
                          className="w-full px-6 py-3 bg-accent text-white rounded-xl font-semibold hover:bg-accent-hover disabled:opacity-70"
                        >
                          {reserving ? "Rezervuji…" : "Potvrdit rezervaci"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {initialLoadDone && !loading && allSlots.length === 0 && !error && (
                <p className="py-4 text-center text-foreground/60 text-sm">Zatím nejsou k dispozici žádné termíny.</p>
              )}
          </>
          )}
        </div>
      </div>
    </div>
  );
}

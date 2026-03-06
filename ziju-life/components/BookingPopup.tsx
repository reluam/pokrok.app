"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

export type BookingPopupParams = {
  email?: string;
  name?: string;
  note?: string;
  leadId?: string;
  source?: string;
  /** Preferovaný (nebo zamknutý) typ schůzky – id z adminu (např. intro_free / coaching_paid) */
  preferredMeetingTypeId?: string;
  /** Pokud true, uživatel si typ v popupu nepřepíná (funnel). */
  lockMeetingType?: boolean;
  /** Preferovaný typ podle charakteru schůzky – použije se, pokud preferredMeetingTypeId neexistuje. */
  preferredKind?: "paid" | "free";
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

type MeetingType = {
  id: string;
  label: string;
  description?: string;
  isPaid?: boolean;
  startDate?: string;
  endDate?: string;
  defaultDurationMinutes?: number;
  priceId?: string;
  /** Cena schůzky v Kč pro daný typ (pokud je nastavená v administraci). */
  priceCzk?: number;
  /** Volitelný Stripe Payment Link specifický pro tento typ schůzky. */
  stripePaymentLinkUrl?: string;
};

const DEFAULT_MEETING_TYPES: MeetingType[] = [
  {
    id: "intro_free",
    label: "Úvodní 30min sezení zdarma",
    isPaid: false,
  },
  {
    id: "coaching_paid",
    label: "Koučovací sezení (placené)",
    isPaid: true,
  },
];

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

/** Sestaví SPAYD řetězec pro QR platbu (český formát). */
function buildSpaydString(amountCzk: string, ibanOrAccount: string, message: string): string {
  const amount = amountCzk.replace(/\s/g, "").replace(/[^\d.,]/g, "").replace(",", ".");
  const am = Number.parseFloat(amount) || 0;
  const amStr = am.toFixed(2);
  // Příjemce necháme ve formátu, který zadáš v administraci (IBAN nebo 123456789/0600),
  // pouze odstraníme mezery.
  const acc = ibanOrAccount.replace(/\s/g, "");
  const msg = message.slice(0, 60).replace(/[^a-zA-Z0-9 $%+\-]/g, " ");
  return `SPD*1.0*ACC:${acc}*AM:${amStr}*CC:CZK*MSG:${msg}*`;
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
  const [meetingTypes, setMeetingTypes] = useState<MeetingType[]>(DEFAULT_MEETING_TYPES);
  const [selectedMeetingTypeId, setSelectedMeetingTypeId] = useState<string>(
    DEFAULT_MEETING_TYPES[0]?.id ?? "intro_free"
  );
  const lockMeetingType = prefill.lockMeetingType ?? false;
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const modalScrollRef = useRef<HTMLDivElement>(null);

  const handleCopy = useCallback((field: string, text: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
      },
      () => {}
    );
  }, []);

  const fromParam = dates[0];
  const toParam = dates[27];

  const loadSlots = useCallback((from: string, to: string, dateList: string[]) => {
    setLoading(true);
    setError("");
    setSelected(null);
    setSelectedDate(null);
    setSlotsForDay([]);
    const meetingTypeParam = selectedMeetingTypeId
      ? `&meetingType=${encodeURIComponent(selectedMeetingTypeId)}`
      : "";
    fetch(`/api/booking/slots?from=${from}&to=${to}${meetingTypeParam}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
          setAllSlots([]);
          setSlotsByDate({});
        } else {
          const slots: Slot[] = data.slots ?? [];
          // Filtrovat sloty podle datumového okna vybraného typu schůzky (pokud je nastavené)
          let filteredSlots = slots;
          const mt = meetingTypes.find((t) => t.id === selectedMeetingTypeId);
          if (mt && (mt.startDate || mt.endDate)) {
            filteredSlots = slots.filter((slot) => {
              const dateKey = dateKeyFromSlot(slot.startAt);
              if (mt.startDate && dateKey < mt.startDate) return false;
              if (mt.endDate && dateKey > mt.endDate) return false;
              return true;
            });
          }
          setAllSlots(filteredSlots);
          const byDate: Record<string, Slot[]> = {};
          for (const date of dateList) byDate[date] = [];
          for (const slot of filteredSlots) {
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
  }, [meetingTypes, selectedMeetingTypeId]);

  useEffect(() => {
    // Načti typy schůzek z nastavení (bez autentizace)
    fetch("/api/settings/meeting-types")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.meetingTypes) && data.meetingTypes.length > 0) {
          setMeetingTypes(data.meetingTypes);
          const preferred = prefill.preferredMeetingTypeId;
          const hasPreferred =
            typeof preferred === "string" &&
            data.meetingTypes.some((mt: MeetingType) => mt.id === preferred);

          let fallbackId = data.meetingTypes[0].id as string;
          const kind = prefill.preferredKind;
          if (kind === "paid") {
            const paid = data.meetingTypes.find((mt: MeetingType) => mt.isPaid);
            if (paid) fallbackId = paid.id;
          } else if (kind === "free") {
            const free = data.meetingTypes.find((mt: MeetingType) => !mt.isPaid);
            if (free) fallbackId = free.id;
          }

          setSelectedMeetingTypeId(hasPreferred ? (preferred as string) : fallbackId);
        }
      })
      .catch(() => {
        // fallback na výchozí typy
      });
  }, [prefill.preferredMeetingTypeId, prefill.preferredKind]);

  // Pokud se preferovaný typ změní po načtení typů (např. při opětovném otevření popupu)
  useEffect(() => {
    const preferred = prefill.preferredMeetingTypeId;
    if (!preferred) return;
    if (meetingTypes.some((mt) => mt.id === preferred)) {
      setSelectedMeetingTypeId(preferred);
    }
  }, [prefill.preferredMeetingTypeId, meetingTypes]);

  useEffect(() => {
    if (isOpen && fromParam && toParam) {
      setSuccess(false);
      setReserveError("");
      setInitialLoadDone(false);
      loadSlots(fromParam, toParam, dates);
    }
  }, [isOpen, fromParam, toParam, dates, loadSlots]);

  useEffect(() => {
    if (!isOpen) return;
    const scrollY = window.scrollY ?? window.pageYOffset;
    const prevOverflow = document.body.style.overflow;
    const prevPosition = document.body.style.position;
    const prevTop = document.body.style.top;
    const prevWidth = document.body.style.width;
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";
    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.position = prevPosition;
      document.body.style.top = prevTop;
      document.body.style.width = prevWidth;
      window.scrollTo(0, scrollY);
    };
  }, [isOpen]);

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
        meetingType: selectedMeetingTypeId,
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Rezervace termínu"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="relative w-full max-w-2xl h-[90vh] max-h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
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

        <div
          ref={modalScrollRef}
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4"
          onWheel={(e) => {
            const el = modalScrollRef.current;
            if (!el) return;
            e.preventDefault();
            el.scrollTop += e.deltaY;
          }}
        >
          {success ? (
            (() => {
              const mt = meetingTypes.find((t) => t.id === selectedMeetingTypeId);
              const isPaidSuccess = Boolean(mt?.isPaid);
              const amountFromType =
                typeof mt?.priceCzk === "number" && mt.priceCzk > 0
                  ? String(mt.priceCzk)
                  : undefined;
              const amount = amountFromType ?? process.env.NEXT_PUBLIC_BOOKING_PAID_PRICE_CZK;
              const bankIban = process.env.NEXT_PUBLIC_BOOKING_PAYMENT_BANK_IBAN;
              const bankName = process.env.NEXT_PUBLIC_BOOKING_PAYMENT_BANK_NAME;
              const stripeLink =
                mt?.stripePaymentLinkUrl || process.env.NEXT_PUBLIC_BOOKING_STRIPE_PAYMENT_LINK_URL;
              const paymentMessage = prefill.name || "Platba konzultace";
              const spaydString =
                amount && bankIban
                  ? buildSpaydString(amount, bankIban, paymentMessage)
                  : "";

              if (!isPaidSuccess) {
                return (
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
                );
              }

              return (
                <div className="space-y-6">
                  <div className="text-center space-y-2">
                    <p className="text-xl font-semibold text-foreground">Rezervace proběhla úspěšně</p>
                    <p className="text-foreground/80 text-sm leading-relaxed">
                      Na tvůj e-mail ti přijde potvrzení s detaily termínu.
                    </p>
                  </div>

                  <div className="rounded-xl border-2 border-accent/30 bg-accent/5 p-4 space-y-2">
                    <p className="text-sm font-semibold text-foreground">
                      Schůzka je placená
                    </p>
                    <p className="text-sm text-foreground/85 leading-relaxed">
                      Je potřeba ji zaplatit nejpozději <strong>48 hodin po vytvoření rezervace</strong>, aby zůstala v platnosti.
                    </p>
                    <p className="text-sm text-foreground/85 leading-relaxed">
                      Změna termínu schůzky je možná nejpozději <strong>48 hodin před konáním</strong>.
                    </p>
                  </div>

                  {(bankName || bankIban || amount) && (
                    <div className="rounded-xl border border-black/10 bg-black/[0.04] p-4 space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-foreground/60">
                        Platba převodem
                      </p>
                      <dl className="space-y-3 text-sm text-foreground/85">
                        {amount && (
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <dt className="text-foreground/55 text-xs">Částka</dt>
                              <dd className="font-medium text-foreground">{amount} Kč</dd>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCopy("amount", `${amount} Kč`)}
                              className="shrink-0 p-2 rounded-lg border border-black/10 bg-white hover:bg-black/5 text-foreground/70 hover:text-foreground transition-colors"
                              title="Zkopírovat částku"
                            >
                              {copiedField === "amount" ? (
                                <span className="text-xs font-medium text-green-600">Zkopírováno</span>
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                              )}
                            </button>
                          </div>
                        )}
                        {bankName && (
                          <div>
                            <dt className="text-foreground/55 text-xs">Banka</dt>
                            <dd className="font-medium text-foreground">{bankName}</dd>
                          </div>
                        )}
                        {bankIban && (
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <dt className="text-foreground/55 text-xs">Číslo účtu / IBAN</dt>
                              <dd className="font-mono text-foreground break-all">{bankIban}</dd>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCopy("iban", bankIban)}
                              className="shrink-0 p-2 rounded-lg border border-black/10 bg-white hover:bg-black/5 text-foreground/70 hover:text-foreground transition-colors"
                              title="Zkopírovat číslo účtu"
                            >
                              {copiedField === "iban" ? (
                                <span className="text-xs font-medium text-green-600">Zkopírováno</span>
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                              )}
                            </button>
                          </div>
                        )}
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <dt className="text-foreground/55 text-xs">Zpráva pro příjemce</dt>
                            <dd className="font-mono text-foreground break-all">
                              {prefill.name || "Jméno + termín konzultace"}
                            </dd>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopy("message", prefill.name || "Jméno + termín konzultace")}
                            className="shrink-0 p-2 rounded-lg border border-black/10 bg-white hover:bg-black/5 text-foreground/70 hover:text-foreground transition-colors"
                            title="Zkopírovat zprávu"
                          >
                            {copiedField === "message" ? (
                              <span className="text-xs font-medium text-green-600">Zkopírováno</span>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                            )}
                          </button>
                        </div>
                      </dl>
                    </div>
                  )}

                  {(spaydString || amount) && (
                    <div className="rounded-xl border border-black/10 bg-black/[0.04] p-4 space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-foreground/60">
                        Platba QR kódem
                      </p>
                      <p className="text-sm text-foreground/70">
                        Naskenuj QR kód v bance a zaplatíš rychle bez přepisování údajů.
                      </p>
                      {spaydString ? (
                        <div className="flex justify-center py-2">
                          <QRCodeSVG
                            value={spaydString}
                            size={180}
                            level="M"
                            includeMargin
                            className="rounded-lg border border-black/10 bg-white p-2"
                            aria-label="QR kód pro platbu"
                          />
                        </div>
                      ) : (
                        <p className="text-sm text-foreground/60 italic">
                          Pro generování QR kódu nastav v administraci částku a číslo účtu (IBAN).
                        </p>
                      )}
                    </div>
                  )}

                  {stripeLink && (
                    <div className="rounded-xl border border-black/10 bg-black/[0.04] p-4 space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-foreground/60">
                        Platba kartou
                      </p>
                      <p className="text-sm text-foreground/70">
                        Bezpečná platba kartou přes Stripe (otevře se v novém okně).
                      </p>
                      <a
                        href={stripeLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center w-full sm:w-auto min-w-[200px] rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-white hover:bg-accent-hover transition-colors"
                      >
                        Zaplatit kartou přes Stripe
                      </a>
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="w-full px-6 py-3 bg-accent text-white rounded-xl font-medium hover:bg-accent-hover"
                    >
                      Zavřít
                    </button>
                  </div>
                </div>
              );
            })()
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
                <div className="space-y-4">
                  {/* Typ schůzky */}
                  {meetingTypes.length > 0 && (
                    <div className="rounded-xl border border-black/10 bg-black/3 px-3 py-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-foreground/60 mb-1">
                        Typ schůzky
                      </p>
                      {(() => {
                        const selected =
                          meetingTypes.find((t) => t.id === selectedMeetingTypeId) ??
                          meetingTypes[0];
                        if (!selected) return null;
                        if (lockMeetingType || meetingTypes.length === 1) {
                          return (
                            <p className="text-sm text-foreground">
                              {selected.label}
                              {selected.isPaid && (
                                <span className="ml-2 text-xs text-foreground/60">(placené)</span>
                              )}
                            </p>
                          );
                        }
                        return (
                          <div className="flex flex-wrap gap-2">
                            {meetingTypes.map((t) => (
                              <button
                                key={t.id}
                                type="button"
                                onClick={() => setSelectedMeetingTypeId(t.id)}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                                  selectedMeetingTypeId === t.id
                                    ? "bg-accent text-white border-accent"
                                    : "bg-white text-foreground border-black/10 hover:border-accent/50 hover:bg-accent/5"
                                }`}
                              >
                                {t.label}
                              </button>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  )}

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
                      <div className="mt-4 pt-4 border-t border-black/10 space-y-4">
                        <p className="text-sm text-foreground/70">
                          Vybráno: {formatSlotDate(selected.startAt)} v {formatSlotTime(selected.startAt)}
                          {selected.durationMinutes ? ` (${selected.durationMinutes} min)` : ""}
                        </p>

                        {reserveError && <p className="text-sm text-red-600">{reserveError}</p>}
                        <button
                          type="button"
                          onClick={handleReserve}
                          disabled={reserving}
                          className="w-full px-6 py-3 bg-accent text-white rounded-xl font-semibold hover:bg-accent-hover disabled:opacity-70"
                        >
                          {reserving ? "Zpracovávám…" : "Potvrdit rezervaci"}
                        </button>
                      </div>
                    )}
                  </div>
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

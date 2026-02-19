"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type Slot = { slot_at: string; duration_minutes: number };

const TZ = "Europe/Prague";

function formatSlotDate(iso: string): string {
  return new Date(iso).toLocaleDateString("cs-CZ", {
    timeZone: TZ,
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function formatSlotTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("cs-CZ", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getNextDays(count: number): string[] {
  const out: string[] = [];
  const d = new Date();
  for (let i = 0; i < count; i++) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    out.push(`${y}-${m}-${day}`);
    d.setDate(d.getDate() + 1);
  }
  return out;
}

export function BookingFlow() {
  const searchParams = useSearchParams();
  const success = searchParams.get("success") === "1";

  const [step, setStep] = useState<"date" | "slot" | "form">("date");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const dates = getNextDays(14);

  const fetchSlots = useCallback(async (date: string) => {
    setLoadingSlots(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/bookings/slots?from=${encodeURIComponent(date)}&to=${encodeURIComponent(date)}`
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || res.statusText);
      }
      const data = await res.json();
      setSlots(Array.isArray(data) ? data : []);
      setSelectedDate(date);
      setStep("slot");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoadingSlots(false);
    }
  }, []);

  useEffect(() => {
    if (success) return;
    if (step === "slot" && selectedDate && slots.length === 0 && !loadingSlots) {
      setError("Pro tento den nejsou k dispozici žádné volné termíny.");
    }
  }, [success, step, selectedDate, slots.length, loadingSlots]);

  const handleSelectSlot = (slot: Slot) => {
    setSelectedSlot(slot);
    setStep("form");
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduled_at: selectedSlot.slot_at,
          email: email.trim(),
          name: name.trim(),
          phone: phone.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || res.statusText);
      }
      window.location.href = "/book?success=1";
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const backToDate = () => {
    setStep("date");
    setSelectedDate(null);
    setSelectedSlot(null);
    setSlots([]);
    setError(null);
  };

  const backToSlot = () => {
    setStep("slot");
    setSelectedSlot(null);
    setError(null);
  };

  if (success) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 md:p-8">
        <h2 className="text-xl font-semibold text-slate-900">
          Termín je zarezervovaný
        </h2>
        <p className="mt-2 text-slate-600">
          Děkujeme. Brzy tě budeme kontaktovat s potvrzením. Můžeš zavřít toto okno nebo se vrátit na stránku, odkud jsi přišel.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 md:p-8">
      <h2 className="text-xl font-semibold text-slate-900">
        Rezervovat termín
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        Vyber datum, potom čas a vyplň údaje.
      </p>

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {step === "date" && (
        <div className="mt-6">
          <p className="mb-2 text-sm font-medium text-slate-700">Datum</p>
          <div className="flex flex-wrap gap-2">
            {dates.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => fetchSlots(d)}
                disabled={loadingSlots}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
              >
                {new Date(d + "T12:00:00").toLocaleDateString("cs-CZ", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                })}
              </button>
            ))}
          </div>
          {loadingSlots && (
            <p className="mt-2 text-xs text-slate-500">Načítám volné termíny…</p>
          )}
        </div>
      )}

      {step === "slot" && selectedDate && (
        <div className="mt-6">
          <button
            type="button"
            onClick={backToDate}
            className="mb-2 text-sm text-slate-600 underline hover:text-slate-900"
          >
            ← Zpět na výběr data
          </button>
          <p className="mb-2 text-sm font-medium text-slate-700">
            Volné termíny pro {formatSlotDate(slots[0]?.slot_at ?? selectedDate + "T12:00:00")}
          </p>
          {slots.length === 0 ? (
            <p className="text-sm text-slate-500">
              Pro tento den nejsou k dispozici žádné volné termíny. Zvol jiný den.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {slots.map((slot) => (
                <button
                  key={slot.slot_at}
                  type="button"
                  onClick={() => handleSelectSlot(slot)}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                >
                  {formatSlotTime(slot.slot_at)}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {step === "form" && selectedSlot && (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <button
            type="button"
            onClick={backToSlot}
            className="text-sm text-slate-600 underline hover:text-slate-900"
          >
            ← Zpět na výběr času
          </button>
          <p className="text-sm text-slate-700">
            Termín: {formatSlotDate(selectedSlot.slot_at)} v {formatSlotTime(selectedSlot.slot_at)} ({selectedSlot.duration_minutes} min)
          </p>
          <div>
            <label htmlFor="book-name" className="mb-1 block text-sm font-medium text-slate-700">
              Jméno *
            </label>
            <input
              id="book-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="book-email" className="mb-1 block text-sm font-medium text-slate-700">
              E-mail *
            </label>
            <input
              id="book-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="book-phone" className="mb-1 block text-sm font-medium text-slate-700">
              Telefon
            </label>
            <input
              id="book-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {submitting ? "Odesílám…" : "Rezervovat termín"}
          </button>
        </form>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type BookingDetail = {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  name: string;
  email: string;
  phone: string | null;
  note: string | null;
  status: string;
  created_at: string;
  lead: { id: string; name: string | null; email: string | null; status: string | null } | null;
  event: { id: string; name: string | null; slug: string | null } | null;
  booking_link: string | null;
};

type BookingDetailModalProps = {
  bookingId: string | null;
  open: boolean;
  onClose: () => void;
  onCancelled?: () => void;
};

export function BookingDetailModal({
  bookingId,
  open,
  onClose,
  onCancelled,
}: BookingDetailModalProps) {
  const [detail, setDetail] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !bookingId) {
      setDetail(null);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    fetch(`/api/bookings/${bookingId}`)
      .then((res) => {
        if (!res.ok) throw new Error(res.status === 404 ? "Rezervace nenalezena" : "Chyba načtení");
        return res.json();
      })
      .then((data) => {
        setDetail(data);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [open, bookingId]);

  async function handleCancel() {
    if (!bookingId || !detail || detail.status === "cancelled") return;
    setCancelling(true);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/cancel`, { method: "PATCH" });
      if (!res.ok) throw new Error("Zrušení se nepovedlo");
      onCancelled?.();
      onClose();
    } catch {
      setError("Schůzku se nepodařilo zrušit.");
    } finally {
      setCancelling(false);
    }
  }

  if (!open) return null;

  const dateTime = detail?.scheduled_at
    ? new Date(detail.scheduled_at).toLocaleString("cs-CZ", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-detail-title"
    >
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="border-b border-slate-100 px-4 py-3">
          <h2 id="booking-detail-title" className="text-lg font-semibold text-slate-900">
            Detail schůzky
          </h2>
        </div>
        <div className="p-4">
          {loading && (
            <p className="py-8 text-center text-sm text-slate-500">Načítám…</p>
          )}
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
          {!loading && detail && (
            <div className="space-y-4">
              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Termín
                </div>
                <p className="text-slate-900">{dateTime}</p>
                {detail.duration_minutes ? (
                  <p className="text-sm text-slate-500">{detail.duration_minutes} min</p>
                ) : null}
              </div>

              {detail.lead && (
                <div>
                  <div className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Lead
                  </div>
                  <Link
                    href="/crm"
                    className="inline-block rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-200"
                  >
                    {detail.lead.name || detail.lead.email || "Bez jména"} →
                  </Link>
                  {detail.lead.status && (
                    <span className="ml-2 text-xs text-slate-500">{detail.lead.status}</span>
                  )}
                </div>
              )}

              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Kontakt
                </div>
                <p className="text-slate-900">{detail.name}</p>
                <a
                  href={`mailto:${detail.email}`}
                  className="text-sm text-sky-600 hover:underline"
                >
                  {detail.email}
                </a>
                {detail.phone && (
                  <p className="text-sm text-slate-600">
                    <a href={`tel:${detail.phone}`} className="hover:underline">
                      {detail.phone}
                    </a>
                  </p>
                )}
              </div>

              {detail.booking_link && (
                <div>
                  <div className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Odkaz na schůzku
                  </div>
                  <a
                    href={detail.booking_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="break-all text-sm text-sky-600 hover:underline"
                  >
                    {typeof window !== "undefined"
                      ? `${window.location.origin}${detail.booking_link}`
                      : detail.booking_link}
                  </a>
                </div>
              )}

              {detail.note && (
                <div>
                  <div className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Poznámka
                  </div>
                  <p className="text-sm text-slate-700">{detail.note}</p>
                </div>
              )}

              {detail.status === "cancelled" ? (
                <p className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-600">
                  Tato schůzka je zrušená.
                </p>
              ) : (
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Zavřít
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={cancelling}
                    className="flex-1 rounded-lg bg-red-100 px-3 py-2 text-sm font-medium text-red-800 hover:bg-red-200 disabled:opacity-50"
                  >
                    {cancelling ? "Ruším…" : "Zrušit schůzku"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

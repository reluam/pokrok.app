"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { EventAvailabilitySettings } from "../../../../../components/calendar/EventAvailabilitySettings";

type EventData = {
  id: string;
  user_id: string;
  slug: string;
  name: string;
  duration_minutes: number;
  min_advance_minutes?: number;
  created_at: string;
  updated_at: string;
};

const MIN_ADVANCE_OPTIONS = [
  { value: 0, label: "Okamžitě" },
  { value: 720, label: "12 hodin dopředu" },
  { value: 1440, label: "24 hodin (1 den) dopředu" },
  { value: 4320, label: "3 dny dopředu" },
  { value: 10080, label: "7 dní dopředu" },
] as const;

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [event, setEvent] = useState<EventData | null>(null);
  const [bookingSlug, setBookingSlug] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [minAdvanceMinutes, setMinAdvanceMinutes] = useState(0);
  const [copied, setCopied] = useState<"link" | "iframe" | null>(null);

  const fetchEvent = useCallback(async () => {
    try {
      const res = await fetch(`/api/events/${id}`);
      if (res.status === 404) {
        router.push("/calendar/events");
        return;
      }
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setEvent(data);
      setName(data.name);
      setSlug(data.slug);
      setDurationMinutes(data.duration_minutes ?? 30);
      setMinAdvanceMinutes(data.min_advance_minutes ?? 0);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  useEffect(() => {
    fetch("/api/settings/booking-slug")
      .then((r) => r.json())
      .then((d) => setBookingSlug(d.slug ?? ""))
      .catch(() => {});
  }, []);

  const saveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch(`/api/events/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim().toLowerCase(),
          duration_minutes: Math.min(120, Math.max(15, durationMinutes)),
          min_advance_minutes: minAdvanceMinutes,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || res.statusText);
      setEvent(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL ?? "";
  const bookingPath = bookingSlug && event ? `/book/${bookingSlug}/${event.slug}` : "";
  const bookingUrl = baseUrl && bookingPath ? `${baseUrl}${bookingPath}` : "";
  const iframeUrl = bookingUrl ? `${bookingUrl}?embed=1` : "";

  const copyToClipboard = (text: string, kind: "link" | "iframe") => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(kind);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  if (loading || !event) {
    return (
      <div className="py-2">
        <p className="text-sm text-slate-500">Načítám event…</p>
      </div>
    );
  }

  return (
    <div className="py-2">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
        {event.name}
      </h1>
      <p className="mt-1 text-sm text-slate-600">
        Uprav název, slug a délku. Nastav dostupnost a zkopíruj odkaz nebo iframe.
      </p>

      <div className="mt-4">
        <Link
          href="/calendar/events"
          className="text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          ← Zpět na eventy
        </Link>
      </div>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <form onSubmit={saveEvent} className="mt-6 max-w-md space-y-4 rounded-2xl bg-white/80 p-6 shadow-sm ring-1 ring-slate-100">
        <div>
          <label htmlFor="ev-name" className="block text-sm font-medium text-slate-700">
            Název *
          </label>
          <input
            id="ev-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="ev-slug" className="block text-sm font-medium text-slate-700">
            Slug (pro odkaz)
          </label>
          <input
            id="ev-slug"
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-mono"
          />
        </div>
        <div>
          <label htmlFor="ev-duration" className="block text-sm font-medium text-slate-700">
            Délka (minuty)
          </label>
          <input
            id="ev-duration"
            type="number"
            min={15}
            max={120}
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(Number(e.target.value) || 30)}
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="ev-min-advance" className="block text-sm font-medium text-slate-700">
            Nejdříve bookovatelný
          </label>
          <select
            id="ev-min-advance"
            value={minAdvanceMinutes}
            onChange={(e) => setMinAdvanceMinutes(Number(e.target.value))}
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
          >
            {MIN_ADVANCE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <p className="mt-0.5 text-xs text-slate-500">
            Klient uvidí pouze termíny od tohoto času dopředu (např. 12 h = nelze bookovat na příštích 12 h).
          </p>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {saving ? "Ukládám…" : "Uložit změny"}
        </button>
      </form>

      <div className="mt-8">
        <EventAvailabilitySettings eventId={id} />
      </div>

      <section className="mt-8 rounded-2xl bg-white/80 p-6 shadow-sm ring-1 ring-slate-100">
        <h2 className="text-sm font-semibold text-slate-900">Odkaz a iframe</h2>
        <p className="mt-1 text-xs text-slate-600">
          Nastav si v Nastavení → Obecné svůj „booking slug“ (např. jmeno). Odkaz pak bude obsahovat tvůj slug i slug eventu.
        </p>
        {!bookingSlug ? (
          <p className="mt-3 text-sm text-amber-700">
            Nejprve nastav svůj booking slug v{" "}
            <Link href="/settings" className="font-medium text-amber-800 underline hover:no-underline">
              Nastavení
            </Link>
            , aby odkaz fungoval.
          </p>
        ) : (
          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-500">Odkaz na rezervaci</label>
              <div className="mt-1 flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={bookingUrl}
                  className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-mono text-slate-700"
                />
                <button
                  type="button"
                  onClick={() => copyToClipboard(bookingUrl, "link")}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  {copied === "link" ? "Zkopírováno" : "Kopírovat"}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500">Iframe (vložit na stránku)</label>
              <textarea
                readOnly
                value={iframeUrl ? `<iframe src="${iframeUrl}" title="Rezervace" width="100%" height="600" style="border:0;"></iframe>` : ""}
                rows={2}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono text-slate-700"
              />
              <button
                type="button"
                onClick={() =>
                  copyToClipboard(
                    iframeUrl ? `<iframe src="${iframeUrl}" title="Rezervace" width="100%" height="600" style="border:0;"></iframe>` : "",
                    "iframe"
                  )
                }
                className="mt-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                {copied === "iframe" ? "Zkopírováno" : "Kopírovat iframe"}
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

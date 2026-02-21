"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { EventAvailabilitySettings } from "../../../../../components/calendar/EventAvailabilitySettings";
import { useProjects } from "../../../../../contexts/ProjectsContext";

type EventData = {
  id: string;
  user_id: string;
  slug: string;
  name: string;
  duration_minutes: number;
  min_advance_minutes?: number;
  one_booking_per_email?: boolean;
  project_id?: string | null;
  created_at: string;
  updated_at: string;
};

function minutesToAdvanceDisplay(minutes: number): { value: number; unit: "hours" | "days" } {
  if (minutes <= 0) return { value: 24, unit: "hours" };
  if (minutes >= 1440 && minutes % 1440 === 0) return { value: minutes / 1440, unit: "days" };
  return { value: Math.round(minutes / 60), unit: "hours" };
}

function advanceToMinutes(value: number, unit: "hours" | "days"): number {
  if (unit === "hours") return Math.min(43200, Math.max(0, value * 60));
  return Math.min(43200, Math.max(0, value * 24 * 60));
}

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
  const [minAdvanceImmediate, setMinAdvanceImmediate] = useState(true);
  const [minAdvanceValue, setMinAdvanceValue] = useState(24);
  const [minAdvanceUnit, setMinAdvanceUnit] = useState<"hours" | "days">("hours");
  const [oneBookingPerEmail, setOneBookingPerEmail] = useState(false);
  const [projectId, setProjectId] = useState<string>("");
  const [copied, setCopied] = useState<"link" | "iframe" | null>(null);
  const projects = useProjects()?.projects ?? [];

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
      const adv = data.min_advance_minutes ?? 0;
      setMinAdvanceImmediate(adv === 0);
      const { value, unit } = minutesToAdvanceDisplay(adv);
      setMinAdvanceValue(value);
      setMinAdvanceUnit(unit);
      setOneBookingPerEmail(Boolean(data.one_booking_per_email));
      setProjectId(data.project_id ?? "");
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
          min_advance_minutes: minAdvanceImmediate ? 0 : advanceToMinutes(minAdvanceValue, minAdvanceUnit),
          one_booking_per_email: oneBookingPerEmail,
          project_id: projectId.trim() || null,
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
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
        {/* Levý sloupec: název, nastavení eventu, odkaz/iframe */}
        <div className="space-y-6">
          <div>
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
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <form onSubmit={saveEvent} className="max-w-md space-y-4 rounded-xl border border-slate-200 bg-white p-6">
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
          <label className="block text-sm font-medium text-slate-700">
            Nejdříve bookovatelný
          </label>
          <div className="mt-1 flex flex-wrap items-center gap-4">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="min-advance-mode"
                checked={minAdvanceImmediate}
                onChange={() => setMinAdvanceImmediate(true)}
                className="rounded-full border-slate-300 text-slate-800 focus:ring-slate-500"
              />
              <span className="text-sm text-slate-800">Okamžitě</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="min-advance-mode"
                checked={!minAdvanceImmediate}
                onChange={() => setMinAdvanceImmediate(false)}
                className="rounded-full border-slate-300 text-slate-800 focus:ring-slate-500"
              />
              <span className="text-sm text-slate-800">Nastavit dopředu</span>
            </label>
          </div>
          {!minAdvanceImmediate && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <input
                id="ev-min-advance-value"
                type="number"
                min={1}
                max={minAdvanceUnit === "hours" ? 720 : 30}
                value={minAdvanceValue}
                onChange={(e) => setMinAdvanceValue(Math.max(1, Number(e.target.value) || 1))}
                className="w-20 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
              />
              <select
                id="ev-min-advance-unit"
                value={minAdvanceUnit}
                onChange={(e) => setMinAdvanceUnit(e.target.value as "hours" | "days")}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
              >
                <option value="hours">hodin</option>
                <option value="days">dní</option>
              </select>
              <span className="text-sm text-slate-500">dopředu</span>
            </div>
          )}
          <p className="mt-1.5 text-xs text-slate-500">
            {minAdvanceImmediate
              ? "Klient může rezervovat jakýkoli volný termín včetně nejbližších minut."
              : "Klient uvidí pouze termíny alespoň tolik hodin/dní v budoucnosti."}
          </p>
        </div>
        <div>
          <label htmlFor="ev-project" className="block text-sm font-medium text-slate-700">
            Projekt
          </label>
          <select
            id="ev-project"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
          >
            <option value="">— Bez projektu —</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={oneBookingPerEmail}
              onChange={(e) => setOneBookingPerEmail(e.target.checked)}
              className="rounded border-slate-300 text-slate-800 focus:ring-slate-500"
            />
            <span className="text-sm font-medium text-slate-700">
              Jedna rezervace na e-mail
            </span>
          </label>
          <p className="mt-1 text-xs text-slate-500">
            Každý e-mail smí u tohoto eventu mít jen jednu aktivní rezervaci. Při pokusu o druhou uvidí hlášku, že už rezervaci má.
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

          <section className="rounded-xl border border-slate-200 bg-white p-6">
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

        {/* Pravý sloupec: dostupnost pro event */}
        <div className="lg:min-w-0">
          <EventAvailabilitySettings eventId={id} />
        </div>
      </div>
    </div>
  );
}

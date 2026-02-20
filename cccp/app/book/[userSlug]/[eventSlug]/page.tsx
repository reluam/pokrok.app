"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { BookingFlow } from "../../../../components/booking/BookingFlow";

type EventBySlug = {
  id: string;
  user_id: string;
  slug: string;
  name: string;
  duration_minutes: number;
  user_slug: string;
  event_slug: string;
};

export default function BookBySlugPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const userSlug = params.userSlug as string;
  const eventSlug = params.eventSlug as string;
  const isEmbed = searchParams.get("embed") === "1";
  const [event, setEvent] = useState<EventBySlug | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const containerClass = isEmbed ? "mx-auto w-full max-w-4xl px-4 py-4" : "mx-auto max-w-lg px-4 py-8";

  const fetchEvent = useCallback(async () => {
    if (!userSlug || !eventSlug) return;
    try {
      const res = await fetch(
        `/api/events/by-slug?userSlug=${encodeURIComponent(userSlug)}&eventSlug=${encodeURIComponent(eventSlug)}`
      );
      if (res.status === 404) {
        setError("Event nebo kouč nebyl nalezen.");
        return;
      }
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setEvent(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [userSlug, eventSlug]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  if (loading) {
    return (
      <main className={`min-h-screen bg-slate-50 ${isEmbed ? "py-4" : "py-8"}`}>
        <div className={containerClass}>
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 md:p-8">
            <div className="h-8 w-48 animate-pulse rounded bg-slate-200" />
            <div className="mt-4 h-4 w-full animate-pulse rounded bg-slate-100" />
          </div>
        </div>
      </main>
    );
  }

  if (error || !event) {
    return (
      <main className={`min-h-screen bg-slate-50 ${isEmbed ? "py-4" : "py-8"}`}>
        <div className={containerClass}>
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 md:p-8">
            <h2 className="text-xl font-semibold text-slate-900">Rezervace není k dispozici</h2>
            <p className="mt-2 text-slate-600">{error ?? "Event nebyl nalezen."}</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={`min-h-screen bg-slate-50 ${isEmbed ? "py-4" : "py-8"}`}>
      <div className={containerClass}>
        <BookingFlow
          coach={event.user_id}
          eventId={event.id}
          eventName={event.name}
        />
      </div>
    </main>
  );
}

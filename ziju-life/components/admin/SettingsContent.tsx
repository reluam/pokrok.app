"use client";

import { useState, useEffect } from "react";
import { Save, Check, ExternalLink } from "lucide-react";

export default function SettingsContent() {
  const [calLink, setCalLink] = useState("");
  const [googleCalendarId, setGoogleCalendarId] = useState("primary");
  const [googleCalendarConnected, setGoogleCalendarConnected] = useState(false);
  const [showPrinciples, setShowPrinciples] = useState(true);
  const [bookingMeetingTypes, setBookingMeetingTypes] = useState<
    { id: string; label: string; description?: string; isPaid?: boolean }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.calLink) setCalLink(data.calLink);
        if (data.googleCalendarId) setGoogleCalendarId(data.googleCalendarId);
        if (data.googleCalendarConnected != null) setGoogleCalendarConnected(Boolean(data.googleCalendarConnected));
        if (data.showPrinciples != null) setShowPrinciples(Boolean(data.showPrinciples));
        if (Array.isArray(data.bookingMeetingTypes)) setBookingMeetingTypes(data.bookingMeetingTypes);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
    const g = params.get("google");
    if (g === "connected") {
      setGoogleCalendarConnected(true);
      window.history.replaceState({}, "", "/admin");
    }
  }, []);

  const handleSave = async () => {
    setLoading(true);
    setError("");
    setSaved(false);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          calLink: calLink.trim() || null,
          googleCalendarId: googleCalendarId.trim() || "primary",
          showPrinciples,
          bookingMeetingTypes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Nepodařilo se uložit nastavení.");
        setLoading(false);
        return;
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      setLoading(false);
    } catch {
      setError("Chyba při ukládání nastavení.");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-foreground mb-2">Nastavení</h2>
        <p className="text-foreground/70">
          Konfigurace integrací a externích služeb.
        </p>
      </div>

      {/* Rezervace – Google Kalendář */}
      <section className="bg-white rounded-2xl p-6 border-2 border-black/10">
        <h3 className="text-xl font-bold text-foreground mb-4">Rezervace – Google Kalendář</h3>
        <p className="text-sm text-foreground/60 mb-4">
          Sloty se filtrují podle obsazenosti v Google Kalendáři. Google: stačí jednou kliknout na „Připojit Google Kalendář" (bez JSON klíče) – viz návod.
        </p>
        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <label htmlFor="google-calendar-id" className="block text-sm font-medium text-foreground">
                Google Kalendář (konflikty slotů)
              </label>
              {googleCalendarConnected ? (
                <span className="text-sm text-green-600 font-medium">Připojeno</span>
              ) : (
                <a
                  href="/api/admin/google-auth"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
                >
                  <ExternalLink className="w-4 h-4" />
                  Připojit Google Kalendář
                </a>
              )}
            </div>
            <input
              id="google-calendar-id"
              type="text"
              value={googleCalendarId}
              onChange={(e) => setGoogleCalendarId(e.target.value)}
              placeholder="primary"
              className="w-full px-4 py-3 border-2 border-black/10 rounded-xl focus:ring-2 focus:ring-accent focus:border-accent bg-white mt-2"
            />
            <p className="text-xs text-foreground/50 mt-1">
              Kalendář, podle kterého se filtrují obsazené časy. &quot;primary&quot; = hlavní kalendář. Pro připojení potřebuješ v .env nastavit GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET a GOOGLE_OAUTH_REDIRECT_URI (návod v GOOGLE_CALENDAR_NAVOD.md).
            </p>
          </div>
          <div className="pt-4 border-t border-black/10 space-y-4">
            {/* Typy schůzek */}
            <div>
              <p className="text-sm font-medium text-foreground mb-1">Typy schůzek</p>
              <p className="text-xs text-foreground/60 mb-2">
                Stejné sloty v kalendáři můžeš použít pro více typů schůzek (např. úvodní zdarma a placené
                koučovací sezení). Typ se uloží k rezervaci a do e-mailů.
              </p>
              <div className="space-y-2">
                {bookingMeetingTypes.map((t, index) => (
                  <div
                    key={t.id || index}
                    className="flex flex-col sm:flex-row gap-3 items-start sm:items-center bg-black/2 rounded-xl px-3 py-2"
                  >
                    <div className="flex-1 space-y-1 w-full">
                      <input
                        type="text"
                        value={t.label}
                        onChange={(e) => {
                          const label = e.target.value;
                          setBookingMeetingTypes((prev) =>
                            prev.map((mt, i) =>
                              i === index
                                ? {
                                    ...mt,
                                    label,
                                    id:
                                      mt.id ||
                                      label
                                        .toLowerCase()
                                        .replace(/[^a-z0-9]+/g, "-")
                                        .replace(/^-|-$/g, ""),
                                  }
                                : mt
                            )
                          );
                        }}
                        placeholder="Název typu (např. Úvodní 30min zdarma)"
                        className="w-full px-3 py-2 border-2 border-black/10 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent bg-white text-sm"
                      />
                      <input
                        type="text"
                        value={t.description ?? ""}
                        onChange={(e) => {
                          const description = e.target.value;
                          setBookingMeetingTypes((prev) =>
                            prev.map((mt, i) => (i === index ? { ...mt, description } : mt))
                          );
                        }}
                        placeholder="Krátký popis (volitelné)"
                        className="w-full px-3 py-2 border-2 border-black/10 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent bg-white text-xs text-foreground/80"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="inline-flex items-center gap-2 text-xs text-foreground/80">
                        <input
                          type="checkbox"
                          checked={Boolean(t.isPaid)}
                          onChange={(e) => {
                            const isPaid = e.target.checked;
                            setBookingMeetingTypes((prev) =>
                              prev.map((mt, i) => (i === index ? { ...mt, isPaid } : mt))
                            );
                          }}
                        />
                        <span>Placení</span>
                      </label>
                      {bookingMeetingTypes.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            setBookingMeetingTypes((prev) => prev.filter((_, i) => i !== index))
                          }
                          className="text-xs text-red-600 hover:underline"
                        >
                          Odebrat
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    setBookingMeetingTypes((prev) => [
                      ...prev,
                      {
                        id: `custom_${Date.now().toString(36)}`,
                        label: "Nový typ schůzky",
                        description: "",
                        isPaid: false,
                      },
                    ])
                  }
                  className="mt-1 inline-flex items-center gap-2 text-xs font-medium text-accent hover:underline"
                >
                  Přidat typ schůzky
                </button>
              </div>
            </div>

            {/* Připomínka 24 h před schůzkou */}
            <div className="pt-2 border-t border-black/10">
            <p className="text-sm font-medium text-foreground mb-2">Připomínka 24 h před schůzkou (cron-job.org)</p>
            <p className="text-xs text-foreground/60 mb-2">
              Nastav v .env: <code className="bg-black/5 px-1 rounded">CRONJOB_ORG_API_KEY</code> (API klíč z cron-job.org → Settings), <code className="bg-black/5 px-1 rounded">CRON_SECRET</code>, <code className="bg-black/5 px-1 rounded">NEXT_PUBLIC_SITE_URL</code> (např. https://ziju.life). Pak klikni níže – vytvoří se job, který každou hodinu volá endpoint připomínek.
            </p>
            <button
              type="button"
              onClick={async () => {
                try {
                  const res = await fetch("/api/admin/cron-job/setup-booking-reminders", { method: "POST" });
                  const data = await res.json();
                  if (res.ok) {
                    alert(data.message + (data.jobId ? ` (jobId: ${data.jobId})` : ""));
                  } else {
                    alert("Chyba: " + (data.error || res.status));
                  }
                } catch (e) {
                  alert("Chyba: " + (e instanceof Error ? e.message : "network"));
                }
              }}
              className="px-4 py-2 text-sm font-medium bg-black/10 hover:bg-black/15 rounded-xl transition-colors"
            >
              Nastavit cron na cron-job.org
            </button>
            </div>
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-foreground mb-2">Cal link (volitelné)</label>
          <input
            id="cal-link"
            type="text"
            value={calLink}
            onChange={(e) => setCalLink(e.target.value)}
            placeholder="matej-mauler/30min"
            className="w-full px-4 py-3 border-2 border-black/10 rounded-xl focus:ring-2 focus:ring-accent focus:border-accent bg-white"
          />
        </div>
      </section>


      {/* Externí CRM služby */}
      <section className="bg-white rounded-2xl p-6 border-2 border-black/10">
        <h3 className="text-xl font-bold text-foreground mb-4">Externí CRM služby</h3>
        <p className="text-sm text-foreground/60 mb-4">
          Pro profesionálnější CRM s fakturacemi a mobilní aplikací doporučujeme:
        </p>
        <ul className="space-y-2 text-sm text-foreground/80 mb-6">
          <li>
            • <strong>Paperbell</strong> – CRM pro kouče, fakturace, mobilní app
          </li>
          <li>
            • <strong>HoneyBook</strong> – CRM pro service professionals, fakturace, smlouvy
          </li>
          <li>
            • <strong>Zoho CRM + Books</strong> – komplexní CRM + fakturace, mobilní app
          </li>
        </ul>
        <p className="text-xs text-foreground/50">
          Leady lze exportovat do těchto služeb přes jejich API (nastavení v budoucí verzi).
        </p>
      </section>

      {/* Save button */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3 bg-accent text-white rounded-xl font-semibold hover:bg-accent-hover transition-colors disabled:opacity-70"
        >
          {saved ? (
            <>
              <Check size={20} />
              <span>Uloženo</span>
            </>
          ) : (
            <>
              <Save size={20} />
              <span>{loading ? "Ukládám..." : "Uložit nastavení"}</span>
            </>
          )}
        </button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}

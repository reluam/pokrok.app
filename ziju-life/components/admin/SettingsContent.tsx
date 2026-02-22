"use client";

import { useState, useEffect } from "react";
import { Save, Check, ExternalLink } from "lucide-react";

export default function SettingsContent() {
  const [notionApiKey, setNotionApiKey] = useState("");
  const [notionDatabaseId, setNotionDatabaseId] = useState("");
  const [calLink, setCalLink] = useState("");
  const [clickupListId, setClickupListId] = useState("");
  const [googleCalendarId, setGoogleCalendarId] = useState("primary");
  const [googleCalendarConnected, setGoogleCalendarConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.notionApiKey) setNotionApiKey(data.notionApiKey);
        if (data.notionDatabaseId) setNotionDatabaseId(data.notionDatabaseId);
        if (data.calLink) setCalLink(data.calLink);
        if (data.clickupListId) setClickupListId(data.clickupListId);
        if (data.googleCalendarId) setGoogleCalendarId(data.googleCalendarId);
        if (data.googleCalendarConnected != null) setGoogleCalendarConnected(Boolean(data.googleCalendarConnected));
      })
      .catch(() => {
        setNotionApiKey("••••••••••••••••");
        setNotionDatabaseId("••••••••••••••••");
      });
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
          notionApiKey: notionApiKey.trim() || null,
          notionDatabaseId: notionDatabaseId.trim() || null,
          calLink: calLink.trim() || null,
          bookingEmbedUrl: null,
          clickupListId: clickupListId.trim() || null,
          googleCalendarId: googleCalendarId.trim() || "primary",
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

      {/* Notion */}
      <section className="bg-white rounded-2xl p-6 border-2 border-black/10">
        <h3 className="text-xl font-bold text-foreground mb-4">Notion CRM</h3>
        <p className="text-sm text-foreground/60 mb-6">
          Leady se automaticky posílají do Notionu, pokud jsou nastavené údaje níže.
        </p>

        <div className="space-y-4">
          <div>
            <label htmlFor="notion-api-key" className="block text-sm font-medium text-foreground mb-2">
              Notion API Key
            </label>
            <input
              id="notion-api-key"
              type="password"
              value={notionApiKey}
              onChange={(e) => setNotionApiKey(e.target.value)}
              placeholder="secret_..."
              className="w-full px-4 py-3 border-2 border-black/10 rounded-xl focus:ring-2 focus:ring-accent focus:border-accent bg-white"
            />
            <p className="text-xs text-foreground/50 mt-1">
              Získáš v{" "}
              <a
                href="https://www.notion.so/my-integrations"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline"
              >
                Notion Integrations
              </a>
            </p>
          </div>

          <div>
            <label htmlFor="notion-db-id" className="block text-sm font-medium text-foreground mb-2">
              Notion Database ID
            </label>
            <input
              id="notion-db-id"
              type="text"
              value={notionDatabaseId}
              onChange={(e) => setNotionDatabaseId(e.target.value)}
              placeholder="32-znakový ID z URL databáze"
              className="w-full px-4 py-3 border-2 border-black/10 rounded-xl focus:ring-2 focus:ring-accent focus:border-accent bg-white"
            />
            <p className="text-xs text-foreground/50 mt-1">
              ID najdeš v URL databáze: notion.so/XXXXX?v=... → XXXXX je Database ID
            </p>
          </div>
        </div>
      </section>

      {/* Rezervace – ClickUp a Google Kalendář */}
      <section className="bg-white rounded-2xl p-6 border-2 border-black/10">
        <h3 className="text-xl font-bold text-foreground mb-4">Rezervace – ClickUp a Google Kalendář</h3>
        <p className="text-sm text-foreground/60 mb-4">
          Po potvrzení rezervace se vytvoří úkol v ClickUp (s termínem). Sloty se filtrují podle obsazenosti v Google Kalendáři. ClickUp token nastav v .env (CLICKUP_API_TOKEN). Google: stačí jednou kliknout na „Připojit Google Kalendář“ (bez JSON klíče) – viz návod.
        </p>
        <div className="space-y-4">
          <div>
            <label htmlFor="clickup-list-id" className="block text-sm font-medium text-foreground mb-2">
              ClickUp List ID
            </label>
            <input
              id="clickup-list-id"
              type="text"
              value={clickupListId}
              onChange={(e) => setClickupListId(e.target.value)}
              placeholder="123456789 (z URL: .../list/123456789)"
              className="w-full px-4 py-3 border-2 border-black/10 rounded-xl focus:ring-2 focus:ring-accent focus:border-accent bg-white"
            />
            <p className="text-xs text-foreground/50 mt-1">
              List ID najdeš v URL listu v ClickUp. Token nastav v .env jako CLICKUP_API_TOKEN.
            </p>
          </div>
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

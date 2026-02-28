"use client";

import { useState, useEffect } from "react";
import { Save, Check, ExternalLink } from "lucide-react";

export default function SettingsContent() {
  const [notionApiKey, setNotionApiKey] = useState("");
  const [notionDatabaseId, setNotionDatabaseId] = useState("");
  const [calLink, setCalLink] = useState("");
  const [clickupListId, setClickupListId] = useState("");
  const [clickupFieldMail, setClickupFieldMail] = useState("");
  const [clickupFieldZdroj, setClickupFieldZdroj] = useState("");
  const [clickupFieldJmeno, setClickupFieldJmeno] = useState("");
  const [clickupFieldStatus, setClickupFieldStatus] = useState("");
  const [clickupStatusReachOut, setClickupStatusReachOut] = useState("");
  const [clickupStatusMeeting, setClickupStatusMeeting] = useState("");
  const [clickupStatusNameReachOut, setClickupStatusNameReachOut] = useState("");
  const [clickupStatusNameMeeting, setClickupStatusNameMeeting] = useState("");
  const [googleCalendarId, setGoogleCalendarId] = useState("primary");
  const [googleCalendarConnected, setGoogleCalendarConnected] = useState(false);
  const [showPrinciples, setShowPrinciples] = useState(true);
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
        if (data.clickupFieldMail != null) setClickupFieldMail(data.clickupFieldMail);
        if (data.clickupFieldZdroj != null) setClickupFieldZdroj(data.clickupFieldZdroj);
        if (data.clickupFieldJmeno != null) setClickupFieldJmeno(data.clickupFieldJmeno);
        if (data.clickupFieldStatus != null) setClickupFieldStatus(data.clickupFieldStatus);
        if (data.clickupStatusReachOut != null) setClickupStatusReachOut(data.clickupStatusReachOut);
        if (data.clickupStatusMeeting != null) setClickupStatusMeeting(data.clickupStatusMeeting);
        if (data.clickupStatusNameReachOut != null) setClickupStatusNameReachOut(data.clickupStatusNameReachOut);
        if (data.clickupStatusNameMeeting != null) setClickupStatusNameMeeting(data.clickupStatusNameMeeting);
        if (data.googleCalendarId) setGoogleCalendarId(data.googleCalendarId);
        if (data.googleCalendarConnected != null) setGoogleCalendarConnected(Boolean(data.googleCalendarConnected));
        if (data.showPrinciples != null) setShowPrinciples(Boolean(data.showPrinciples));
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
          clickupFieldMail: clickupFieldMail.trim() || null,
          clickupFieldZdroj: clickupFieldZdroj.trim() || null,
          clickupFieldJmeno: clickupFieldJmeno.trim() || null,
          clickupFieldStatus: clickupFieldStatus.trim() || null,
          clickupStatusReachOut: clickupStatusReachOut.trim() || null,
          clickupStatusMeeting: clickupStatusMeeting.trim() || null,
          clickupStatusNameReachOut: clickupStatusNameReachOut.trim() || null,
          clickupStatusNameMeeting: clickupStatusNameMeeting.trim() || null,
          googleCalendarId: googleCalendarId.trim() || "primary",
          showPrinciples,
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
              placeholder="90123456789"
              className="w-full px-4 py-3 border-2 border-black/10 rounded-xl focus:ring-2 focus:ring-accent focus:border-accent bg-white"
            />
            <p className="text-xs text-foreground/50 mt-1">
              List ID: v ClickUp u listu klikni na ⋮ (tři tečky) → Copy link. V URL je číslo za <code className="bg-black/5 px-1 rounded">/li/</code> (např. …/li/<strong>90123456789</strong>). Token nastav v .env jako CLICKUP_API_TOKEN.
            </p>
          </div>
          <p className="text-sm font-medium text-foreground mt-4 mb-2">Výchozí Status (sloupec v boardu)</p>
          <p className="text-xs text-foreground/60 mb-2">
            Pokud používáte standardní sloupec <strong>Status</strong> v ClickUp, vyplňte přesně názvy, jak je vidíte v záhlaví sloupců (např. &quot;Reach out&quot;, &quot;Meeting&quot;). Názvy najdete přímo v boardu u listu.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="clickup-status-name-reach-out" className="block text-sm font-medium text-foreground mb-1">Název statusu pro lead (Reach out)</label>
              <input id="clickup-status-name-reach-out" type="text" value={clickupStatusNameReachOut} onChange={(e) => setClickupStatusNameReachOut(e.target.value)} placeholder="např. Reach out" className="w-full px-4 py-2 border-2 border-black/10 rounded-xl focus:ring-2 focus:ring-accent bg-white" />
            </div>
            <div>
              <label htmlFor="clickup-status-name-meeting" className="block text-sm font-medium text-foreground mb-1">Název statusu pro konzultaci (Meeting)</label>
              <input id="clickup-status-name-meeting" type="text" value={clickupStatusNameMeeting} onChange={(e) => setClickupStatusNameMeeting(e.target.value)} placeholder="např. Meeting" className="w-full px-4 py-2 border-2 border-black/10 rounded-xl focus:ring-2 focus:ring-accent bg-white" />
            </div>
          </div>
          <p className="text-sm font-medium text-foreground mt-4 mb-2">ClickUp custom pole (ID – jen pokud nepoužíváte výchozí Status)</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="clickup-field-mail" className="block text-sm font-medium text-foreground mb-1">Pole E-mail (field ID)</label>
              <input id="clickup-field-mail" type="text" value={clickupFieldMail} onChange={(e) => setClickupFieldMail(e.target.value)} placeholder="např. uuid" className="w-full px-4 py-2 border-2 border-black/10 rounded-xl focus:ring-2 focus:ring-accent bg-white" />
            </div>
            <div>
              <label htmlFor="clickup-field-zdroj" className="block text-sm font-medium text-foreground mb-1">Pole Zdroj (field ID)</label>
              <input id="clickup-field-zdroj" type="text" value={clickupFieldZdroj} onChange={(e) => setClickupFieldZdroj(e.target.value)} placeholder="volitelné" className="w-full px-4 py-2 border-2 border-black/10 rounded-xl focus:ring-2 focus:ring-accent bg-white" />
            </div>
            <div>
              <label htmlFor="clickup-field-jmeno" className="block text-sm font-medium text-foreground mb-1">Pole Jméno (field ID)</label>
              <input id="clickup-field-jmeno" type="text" value={clickupFieldJmeno} onChange={(e) => setClickupFieldJmeno(e.target.value)} placeholder="volitelné" className="w-full px-4 py-2 border-2 border-black/10 rounded-xl focus:ring-2 focus:ring-accent bg-white" />
            </div>
            <div>
              <label htmlFor="clickup-field-status" className="block text-sm font-medium text-foreground mb-1">Pole Status (custom dropdown – field ID)</label>
              <input id="clickup-field-status" type="text" value={clickupFieldStatus} onChange={(e) => setClickupFieldStatus(e.target.value)} placeholder="volitelné" className="w-full px-4 py-2 border-2 border-black/10 rounded-xl focus:ring-2 focus:ring-accent bg-white" />
            </div>
            <div>
              <label htmlFor="clickup-status-reach-out" className="block text-sm font-medium text-foreground mb-1">Option ID: Reach out (jen u custom pole)</label>
              <input id="clickup-status-reach-out" type="text" value={clickupStatusReachOut} onChange={(e) => setClickupStatusReachOut(e.target.value)} placeholder="číslo option" className="w-full px-4 py-2 border-2 border-black/10 rounded-xl focus:ring-2 focus:ring-accent bg-white" />
            </div>
            <div>
              <label htmlFor="clickup-status-meeting" className="block text-sm font-medium text-foreground mb-1">Option ID: Konzultace (jen u custom pole)</label>
              <input id="clickup-status-meeting" type="text" value={clickupStatusMeeting} onChange={(e) => setClickupStatusMeeting(e.target.value)} placeholder="číslo option" className="w-full px-4 py-2 border-2 border-black/10 rounded-xl focus:ring-2 focus:ring-accent bg-white" />
            </div>
          </div>
          <p className="text-xs text-foreground/50 mt-1">
            Custom pole: Field ID a option ID získáš v ClickUp přes API (GET list / task) nebo z URL custom pole. Pokud vyplníš &quot;Název statusu&quot; výše, tato pole nejsou potřeba.
          </p>
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

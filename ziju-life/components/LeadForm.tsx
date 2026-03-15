"use client";

import { useState } from "react";
import { useBookingPopup } from "@/components/BookingPopup";

type LeadFormProps = {
  source?: string;
  /** Pokud předáš UTM z URL (např. z useSearchParams) */
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  onSuccess?: () => void;
  className?: string;
  /** Kompaktní varianta (např. pro ChooseYourPath) */
  compact?: boolean;
  /** Preferovaný typ schůzky (placený / free) při otevření popupu. */
  preferredKind?: "paid" | "free";
  /** Konkrétní id typu schůzky pro popup (např. intro_free, coaching_paid). */
  preferredMeetingTypeId?: string;
  /** Zamknout výběr typu schůzky v popupu. */
  lockMeetingType?: boolean;
  /** Přeskočit booking popup a místo toho zobrazit zprávu o úspěchu (např. pro lead magnet). */
  skipBooking?: boolean;
  /** Text úspěšného odeslání (jen při skipBooking=true). */
  successMessage?: string;
  /** Popisek tlačítka. Výchozí: "Pokračovat k výběru termínu". */
  submitLabel?: string;
  /** Text souhlasu se zpracováním (výchozí: pro domluvení konzultace). */
  consentText?: string;
};

export default function LeadForm({
  source = "koucing",
  utmSource,
  utmMedium,
  utmCampaign,
  onSuccess,
  className = "",
  compact = false,
  preferredKind,
  preferredMeetingTypeId,
  lockMeetingType,
  skipBooking = false,
  successMessage = "Hotovo! Brzy ti pošleme vše na email.",
  submitLabel,
  consentText,
}: LeadFormProps) {
  const { openBookingPopup } = useBookingPopup() ?? {};
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) {
      setError("Vyplňte prosím jméno.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name: name.trim() || undefined,
          message: compact ? undefined : (message?.trim() || undefined),
          source,
          utm_source: utmSource,
          utm_medium: utmMedium,
          utm_campaign: utmCampaign,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Něco se pokazilo.");
        setLoading(false);
        return;
      }
      onSuccess?.();
      setLoading(false);
      if (skipBooking) {
        setSubmitted(true);
        return;
      }
      if (openBookingPopup) {
        openBookingPopup({
          email,
          name: name.trim() || undefined,
          note: message?.trim() || undefined,
          leadId: data.leadId,
          source,
          preferredKind,
          preferredMeetingTypeId,
          lockMeetingType,
        });
      }
    } catch {
      setError("Nepodařilo se odeslat. Zkuste to prosím znovu.");
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-6 space-y-2">
        <div className="text-3xl">✅</div>
        <p className="text-lg font-semibold text-foreground">{successMessage}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div className={compact ? "space-y-3" : "space-y-4"}>
        <div>
          <label htmlFor="lead-name" className="block text-sm font-medium text-foreground mb-1">
            Jméno *
          </label>
          <input
            id="lead-name"
            type="text"
            inputMode="text"
            autoComplete="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 border-2 border-black/10 rounded-xl focus:ring-2 focus:ring-accent focus:border-accent bg-white"
            placeholder="Vaše jméno"
            disabled={loading}
          />
        </div>
        <div>
          <label htmlFor="lead-email" className="block text-sm font-medium text-foreground mb-1">
            E-mail *
          </label>
          <input
            id="lead-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 border-2 border-black/10 rounded-xl focus:ring-2 focus:ring-accent focus:border-accent bg-white"
            placeholder="vas@email.cz"
            disabled={loading}
          />
        </div>
        {!compact && (
          <div>
            <label htmlFor="lead-message" className="block text-sm font-medium text-foreground mb-1">
              S čím vám můžu pomoct? (nepovinné)
            </label>
            <textarea
              id="lead-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border-2 border-black/10 rounded-xl focus:ring-2 focus:ring-accent focus:border-accent bg-white resize-none"
              placeholder="Stručně popište, o čem chcete mluvit..."
              disabled={loading}
            />
          </div>
        )}
        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
        <p className="text-xs text-foreground/60">
          {consentText ?? "Odesláním souhlasíte se zpracováním údajů pro domluvení konzultace."}{" "}
          <a href="/gdpr" className="text-accent hover:underline">
            Zásady ochrany osobních údajů
          </a>
          .
        </p>
        <button
          type="submit"
          disabled={loading}
          className="w-full px-6 py-4 bg-accent text-white rounded-xl font-semibold hover:bg-accent-hover transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? "Odesílám…" : (submitLabel ?? "Pokračovat k výběru termínu")}
        </button>
      </div>
    </form>
  );
}

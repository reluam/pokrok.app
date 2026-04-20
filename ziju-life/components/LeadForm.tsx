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
  /** Zobrazit message pole i v compact módu. */
  showMessage?: boolean;
  /** Label pro message pole. */
  messageLabel?: string;
  /** Placeholder pro message pole. */
  messagePlaceholder?: string;
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
  showMessage,
  messageLabel = "S čím vám můžu pomoct? (nepovinné)",
  messagePlaceholder = "Stručně popište, o čem chcete mluvit...",
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
          message: (!compact || showMessage) ? (message?.trim() || undefined) : undefined,
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
      <div className="text-center py-8 space-y-3">
        <div className="text-4xl">✨</div>
        <p className="font-display text-lg font-extrabold text-foreground">{successMessage}</p>
      </div>
    );
  }

  const inputClass =
    "input-sketch w-full px-1 pt-2 bg-transparent border-0 rounded-none focus:outline-none placeholder:text-muted/45";
  const labelClass =
    "block text-sm font-display font-bold text-foreground mb-1";

  const textareaLineHeight = 28;
  const textareaStyle = {
    lineHeight: `${textareaLineHeight}px`,
    backgroundImage: `repeating-linear-gradient(to bottom, transparent 0, transparent ${textareaLineHeight - 1}px, rgba(23,23,23,0.25) ${textareaLineHeight - 1}px, rgba(23,23,23,0.25) ${textareaLineHeight}px)`,
    backgroundSize: `100% ${textareaLineHeight}px`,
    backgroundPosition: "0 3px",
  };

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div className={compact ? "space-y-3" : "space-y-4"}>
        <div>
          <label htmlFor="lead-name" className={labelClass}>
            Jméno <span className="text-primary">*</span>
          </label>
          <input
            id="lead-name"
            type="text"
            inputMode="text"
            autoComplete="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
            placeholder="Tvoje jméno"
            disabled={loading}
          />
        </div>
        <div>
          <label htmlFor="lead-email" className={labelClass}>
            E-mail <span className="text-primary">*</span>
          </label>
          <input
            id="lead-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
            placeholder="tvuj@mail.cz"
            disabled={loading}
          />
        </div>
        {(!compact || showMessage) && (
          <div>
            <label htmlFor="lead-message" className={labelClass}>
              {messageLabel}
            </label>
            <textarea
              id="lead-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              className="w-full px-1 py-0 bg-transparent border-0 focus:outline-none resize-none placeholder:text-muted/45"
              style={textareaStyle}
              placeholder={messagePlaceholder}
              disabled={loading}
            />
          </div>
        )}
        {error && (
          <p className="text-sm text-red-600 font-semibold" role="alert">
            {error}
          </p>
        )}
        <p className="text-xs text-muted leading-relaxed">
          {consentText ?? "Odesláním souhlasíte se zpracováním údajů pro domluvení konzultace."}{" "}
          <a href="/gdpr" className="text-primary font-semibold hover:opacity-80 transition-opacity">
            Zásady ochrany osobních údajů
          </a>
          .
        </p>
        <button
          type="submit"
          disabled={loading}
          className="btn-playful w-full justify-center text-base disabled:opacity-60 disabled:cursor-not-allowed"
          data-shape="3"
        >
          {loading ? "Odesílám…" : (submitLabel ?? "Pokračovat k výběru termínu")}
          {!loading && <span aria-hidden>&rarr;</span>}
        </button>
      </div>
    </form>
  );
}

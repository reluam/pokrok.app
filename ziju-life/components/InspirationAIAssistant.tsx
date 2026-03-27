"use client";

import { useState } from "react";
import { Sparkles, Send, AlertCircle, LogIn } from "lucide-react";

interface Recommendation {
  itemType: "tool" | "inspiration";
  slug?: string;
  id?: string;
  title: string;
  reason: string;
}

interface AIResponse {
  summary: string;
  recommendations: Recommendation[];
  closingNote: string;
}

interface Props {
  onSelectTool: (slug: string) => void;
  onSelectInspiration?: (id: string) => void;
}

export default function InspirationAIAssistant({ onSelectTool, onSelectInspiration }: Props) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AIResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!message.trim() || loading) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/inspirace/ai-recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: message.trim() }),
      });

      const data = await res.json();

      if (res.status === 401 && data.error === "login_required") {
        setError("login_required");
        return;
      }

      if (res.status === 402) {
        if (data.error === "limit_reached") {
          setError("limit_reached");
        } else {
          setError("no_credits");
        }
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || "Chyba");
      }

      setResult(data.response);
      setMessage("");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Nepodařilo se získat doporučení.");
    } finally {
      setLoading(false);
    }
  };

  const handleRecommendationClick = (rec: Recommendation) => {
    if (rec.itemType === "tool" && rec.slug) {
      onSelectTool(rec.slug);
    } else if (rec.itemType === "inspiration" && rec.id && onSelectInspiration) {
      onSelectInspiration(rec.id);
    }
  };

  return (
    <div className="paper-card rounded-[24px] px-6 py-7 md:px-8 md:py-8 space-y-5 border-2 border-accent/15">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
          <Sparkles size={20} className="text-accent" />
        </div>
        <div>
          <p className="text-base font-bold text-foreground">Co teď řešíš?</p>
          <p className="text-sm text-foreground/50">
            Popiš svou situaci a doporučím ti nástroje a inspirace
          </p>
        </div>
      </div>

      {/* Login required */}
      {error === "login_required" && (
        <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 space-y-3">
          <div className="flex items-start gap-2">
            <LogIn size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-blue-800">Přihlaš se pro doporučení</p>
              <p className="text-xs text-blue-700 mt-0.5">
                Stačí zadat e-mail — pošleme ti přihlašovací odkaz. Jeden dotaz měsíčně je zdarma.
              </p>
            </div>
          </div>
          <a
            href="/ucet"
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-white font-semibold hover:bg-accent-hover transition-colors text-sm"
          >
            <LogIn size={16} />
            Přihlásit se
          </a>
        </div>
      )}

      {/* Limit reached (free user) */}
      {error === "limit_reached" && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 space-y-3">
          <div className="flex items-start gap-2">
            <AlertCircle size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-800">Tento měsíc jsi už dotaz využil/a</p>
              <p className="text-xs text-amber-700 mt-0.5">
                S předplatným Laboratoře získáš 15 AI doporučení měsíčně + přístup k interaktivním cvičením.
              </p>
            </div>
          </div>
          <a
            href="/laborator"
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-white font-semibold hover:bg-accent-hover transition-colors text-sm"
          >
            Získej přístup do Laboratoře →
          </a>
        </div>
      )}

      {/* No credits (subscriber) */}
      {error === "no_credits" && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 space-y-3">
          <div className="flex items-start gap-2">
            <AlertCircle size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-800">Kredity vyčerpány</p>
              <p className="text-xs text-amber-700 mt-0.5">
                Využil/a jsi všechny dostupné interakce tento měsíc.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error (generic) */}
      {error && !["login_required", "limit_reached", "no_credits"].includes(error) && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700 flex items-start gap-2">
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="space-y-3">
          <p className="text-sm text-foreground/70 leading-relaxed">{result.summary}</p>

          <div className="space-y-2">
            {result.recommendations.map((rec, i) => (
              <button
                key={rec.slug || rec.id || i}
                type="button"
                onClick={() => handleRecommendationClick(rec)}
                className="w-full text-left rounded-xl border border-black/10 p-3.5 hover:border-accent/30 hover:shadow-sm transition-all group"
              >
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    rec.itemType === "tool"
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-accent/10 text-accent"
                  }`}>
                    {rec.itemType === "tool" ? "Nástroj" : "Inspirace"}
                  </span>
                  <p className="text-sm font-bold text-foreground group-hover:text-accent transition-colors">
                    {rec.title}
                  </p>
                </div>
                <p className="text-xs text-foreground/50 mt-1.5 leading-relaxed">
                  {rec.reason}
                </p>
              </button>
            ))}
          </div>

          {result.closingNote && (
            <p className="text-xs text-foreground/45 italic">{result.closingNote}</p>
          )}

          <button
            type="button"
            onClick={() => {
              setResult(null);
              setError(null);
            }}
            className="text-xs text-accent font-medium hover:underline"
          >
            Zeptat se znovu
          </button>
        </div>
      )}

      {/* Input (shown when no result and no blocking error) */}
      {!result && !["login_required", "limit_reached", "no_credits"].includes(error ?? "") && (
        <div className="space-y-3">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, 2000))}
            placeholder={'Například: "Chci si lépe organizovat čas, ale nevím kde začít."'}
            className="w-full px-4 py-3 border-2 border-black/10 rounded-xl bg-white/80 text-sm min-h-[80px] max-h-[160px] resize-y focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
            disabled={loading}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-foreground/35">
              {message.length}/2000
            </span>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || !message.trim()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-white font-semibold hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Přemýšlím...
                </>
              ) : (
                <>
                  <Send size={16} />
                  Doporučit
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

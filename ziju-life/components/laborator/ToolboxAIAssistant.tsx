"use client";

import { useEffect, useState, useCallback } from "react";
import { Sparkles, Send, ChevronDown, ChevronUp, ShoppingCart, AlertCircle } from "lucide-react";
import type { AICreditsBalance } from "@/lib/ai-credits";

interface Recommendation {
  slug: string;
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
}

export default function ToolboxAIAssistant({ onSelectTool }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AIResponse | null>(null);
  const [credits, setCredits] = useState<AICreditsBalance | null>(null);
  const [creditsLoading, setCreditsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [purchaseLoading, setPurchaseLoading] = useState(false);

  const loadCredits = useCallback(async () => {
    setCreditsLoading(true);
    try {
      const res = await fetch("/api/laborator/ai-credits");
      if (res.ok) {
        const data = await res.json();
        setCredits(data);
      }
    } catch {
      // Silent fail — credits display will show "?"
    } finally {
      setCreditsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCredits();
  }, [loadCredits]);

  const handleSubmit = async () => {
    if (!message.trim() || loading) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/laborator/ai-recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: message.trim() }),
      });

      const data = await res.json();

      if (res.status === 402) {
        setCredits(data.credits);
        setError("no_credits");
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || "Chyba");
      }

      setResult(data.response);
      setCredits(data.credits);
      setMessage("");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Nepodařilo se získat doporučení.");
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    setPurchaseLoading(true);
    try {
      const res = await fetch("/api/laborator/ai-credits/checkout", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || "Nepodařilo se vytvořit platbu.");
      }
    } catch {
      setError("Nepodařilo se vytvořit platbu.");
    } finally {
      setPurchaseLoading(false);
    }
  };

  const creditsLabel = creditsLoading
    ? "..."
    : credits
      ? `${credits.available} ${credits.available === 1 ? "kredit" : credits.available >= 2 && credits.available <= 4 ? "kredity" : "kreditů"}`
      : "?";

  return (
    <div className="paper-card rounded-[20px] overflow-hidden border-2 border-accent/10">
      {/* Collapsed header */}
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-accent/3 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
            <Sparkles size={20} className="text-accent" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">AI Pomocník</p>
            <p className="text-xs text-foreground/50">
              {result
                ? "Máš nové doporučení"
                : "Popiš svou situaci a doporučím ti nástroje"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-medium text-foreground/40 bg-black/5 px-2.5 py-1 rounded-full">
            {creditsLabel}
          </span>
          {expanded ? (
            <ChevronUp size={16} className="text-foreground/30" />
          ) : (
            <ChevronDown size={16} className="text-foreground/30" />
          )}
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-5 pb-5 space-y-4 border-t border-black/5 pt-4">
          {/* No credits state */}
          {error === "no_credits" && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 space-y-3">
              <div className="flex items-start gap-2">
                <AlertCircle size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-amber-800">Kredity vyčerpány</p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    Využil/a jsi všechny dostupné interakce. Dokup si balíček a pokračuj.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handlePurchase}
                disabled={purchaseLoading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-white font-semibold hover:bg-accent-hover disabled:opacity-60 transition-colors text-sm"
              >
                <ShoppingCart size={16} />
                {purchaseLoading ? "Přesměrovávám..." : "Koupit 50 interakcí za 49 Kč"}
              </button>
            </div>
          )}

          {/* Error state (not no_credits) */}
          {error && error !== "no_credits" && (
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
                {result.recommendations.map((rec) => (
                  <button
                    key={rec.slug}
                    type="button"
                    onClick={() => onSelectTool(rec.slug)}
                    className="w-full text-left rounded-xl border border-black/10 p-3.5 hover:border-accent/30 hover:shadow-sm transition-all group"
                  >
                    <p className="text-sm font-bold text-foreground group-hover:text-accent transition-colors">
                      {rec.title}
                    </p>
                    <p className="text-xs text-foreground/50 mt-1 leading-relaxed">
                      {rec.reason}
                    </p>
                  </button>
                ))}
              </div>

              {result.closingNote && (
                <p className="text-xs text-foreground/45 italic">{result.closingNote}</p>
              )}

              {/* Ask again */}
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

          {/* Input (shown when no result) */}
          {!result && error !== "no_credits" && (
            <div className="space-y-3">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, 2000))}
                placeholder="Popiš svou situaci, výzvu nebo cíl... Například: &quot;Chci si lépe organizovat čas, ale nevím kde začít.&quot;"
                className="w-full px-4 py-3 border-2 border-black/10 rounded-xl bg-white/80 text-sm min-h-[80px] max-h-[160px] resize-y focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
                disabled={loading}
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
                      Doporučit nástroje
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

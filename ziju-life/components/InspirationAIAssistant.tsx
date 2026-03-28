"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Sparkles, Send, AlertCircle, LogIn, RotateCcw } from "lucide-react";

interface Recommendation {
  itemType: "tool" | "inspiration";
  slug?: string;
  id?: string;
  title: string;
  icon?: string;
  reason: string;
}

interface AIResponse {
  summary: string;
  recommendations: Recommendation[];
  closingNote: string;
}

type ChatMessage = { role: "user" | "assistant"; content: string };

type Step = "input" | "reflecting" | "reflection" | "loading" | "results" | "max_reflections";

interface Props {
  onSelectTool: (slug: string) => void;
  onSelectInspiration?: (id: string) => void;
}

const BORDER_COLORS: Record<string, string> = {
  tool: "border-emerald-300 hover:border-emerald-400",
  inspiration: "border-accent/30 hover:border-accent/50",
};

const TAG_STYLES: Record<string, string> = {
  tool: "bg-emerald-50 text-emerald-700",
  inspiration: "bg-accent/10 text-accent",
};

export default function InspirationAIAssistant({ onSelectTool, onSelectInspiration }: Props) {
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [reflection, setReflection] = useState<string | null>(null);
  const [result, setResult] = useState<AIResponse | null>(null);
  const [step, setStep] = useState<Step>("input");
  const [error, setError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [reflectionCount, setReflectionCount] = useState(0);
  const [collapsed, setCollapsed] = useState(true);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      setIsLoggedIn(!!data?.loggedIn);
    } catch {
      setIsLoggedIn(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  /** Try to parse raw text as JSON recommendations (fallback when API misclassifies). */
  const tryParseRecommendations = (text: string): AIResponse | null => {
    const t = (text ?? "").trim();
    const tryParse = (s: string): AIResponse | null => {
      try {
        const p = JSON.parse(s);
        return p?.recommendations?.length > 0 ? p : null;
      } catch { return null; }
    };
    // 1. Direct parse
    const direct = tryParse(t);
    if (direct) return direct;
    // 2. Markdown code block
    const match = t.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match) { const r = tryParse(match[1].trim()); if (r) return r; }
    // 3. Find first {...} in text
    const braceStart = t.indexOf("{");
    const braceEnd = t.lastIndexOf("}");
    if (braceStart !== -1 && braceEnd > braceStart) {
      const r = tryParse(t.slice(braceStart, braceEnd + 1));
      if (r) return r;
    }
    return null;
  };

  const callAPI = async (messages: ChatMessage[]) => {
    const res = await fetch("/api/inspirace/ai-recommend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
    });

    const data = await res.json();

    if (res.status === 401 && data.error === "login_required") {
      setIsLoggedIn(false);
      setError("login_required");
      setStep("input");
      return null;
    }
    if (res.status === 402) {
      setError(data.error ?? "no_budget");
      setStep("input");
      return null;
    }
    if (!res.ok) throw new Error(data.error || "Chyba");

    return data;
  };

  // Step 1: User sends initial message → AI reflects
  const handleInitialSubmit = async () => {
    if (!message.trim()) return;

    if (!isLoggedIn) {
      setError("login_required");
      return;
    }

    setError(null);
    setStep("reflecting");

    const userMsg: ChatMessage = { role: "user", content: message.trim() };
    const newHistory = [userMsg];
    setChatHistory(newHistory);
    setMessage("");

    try {
      const data = await callAPI(newHistory);
      if (!data) return;

      if (data.type === "reflection") {
        // Safety: if AI returned JSON despite being asked for reflection, parse it
        const maybeJson = tryParseRecommendations(data.text);
        if (maybeJson) {
          setResult(maybeJson);
          setStep("results");
        } else {
          setReflection(data.text);
          setReflectionCount(1);
          setChatHistory([...newHistory, { role: "assistant", content: data.text }]);
          setStep("reflection");
        }
      } else {
        setResult(data.response);
        setStep("results");
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Nepodařilo se získat doporučení.");
      setStep("input");
    }
  };

  // Step 2: User confirms/adds → AI recommends
  const handleConfirm = async (additionalText?: string) => {
    setStep("loading");
    setError(null);

    // If confirming without additional text, or we've already reflected twice, force recommendations
    const isConfirm = !additionalText?.trim();
    const forceRecommend = isConfirm || reflectionCount >= 2;

    const confirmMsg: ChatMessage = {
      role: "user",
      content: forceRecommend
        ? (additionalText?.trim() ? `${additionalText.trim()} Doporuč mi prosím nástroje a inspirace.` : "Ano, rozumíš mi správně. Doporuč mi prosím nástroje a inspirace.")
        : additionalText!.trim(),
    };
    const newHistory = [...chatHistory, confirmMsg];
    setChatHistory(newHistory);
    setMessage("");

    try {
      const data = await callAPI(newHistory);
      if (!data) return;

      if (data.type === "recommendations" && data.response) {
        setResult(data.response);
        setStep("results");
      } else {
        // Safety: try parsing as JSON in case API misclassified
        const maybeJson = tryParseRecommendations(data.text ?? "");
        if (maybeJson) {
          setResult(maybeJson);
          setStep("results");
        } else if (reflectionCount >= 2) {
          setReflection(data.text);
          setChatHistory([...newHistory, { role: "assistant", content: data.text }]);
          setStep("max_reflections");
        } else {
          setReflection(data.text);
          setReflectionCount((c) => c + 1);
          setChatHistory([...newHistory, { role: "assistant", content: data.text }]);
          setStep("reflection");
        }
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Nepodařilo se získat doporučení.");
      setStep("reflection");
    }
  };

  const handleReset = () => {
    setMessage("");
    setChatHistory([]);
    setReflection(null);
    setReflectionCount(0);
    setResult(null);
    setStep("input");
    setError(null);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleRecommendationClick = (rec: Recommendation) => {
    if (rec.itemType === "tool" && rec.slug) onSelectTool(rec.slug);
    else if (rec.itemType === "inspiration" && rec.id && onSelectInspiration) onSelectInspiration(rec.id);
  };

  const isBlocked = ["login_required", "limit_reached", "no_credits", "no_budget"].includes(error ?? "");

  const expand = () => {
    if (collapsed) {
      setCollapsed(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  // Collapsed: just a fake input
  if (collapsed && step === "input" && !isBlocked) {
    return (
      <div
        className="paper-card rounded-[24px] px-6 py-4 border-2 border-accent/15 cursor-text"
        onClick={expand}
      >
        <div className="flex items-center gap-3 text-foreground/40">
          <Sparkles size={18} className="text-accent/50" />
          <span className="text-sm">Co teď řešíš?</span>
        </div>
      </div>
    );
  }

  return (
    <div className="paper-card rounded-[24px] px-6 py-7 md:px-8 md:py-8 space-y-5 border-2 border-accent/15">
      {/* Header */}
      <div className="flex items-center justify-between">
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
        {step !== "input" ? (
          <button onClick={handleReset} className="p-2 rounded-xl hover:bg-black/5 text-foreground/40 hover:text-foreground/70 transition-colors" title="Začít znovu">
            <RotateCcw size={16} />
          </button>
        ) : (
          <button onClick={() => setCollapsed(true)} className="p-2 rounded-xl hover:bg-black/5 text-foreground/40 hover:text-foreground/70 transition-colors" title="Minimalizovat">
            <span className="text-xs">✕</span>
          </button>
        )}
      </div>

      {/* Error states */}
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
          <a href="/ucet" className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-white font-semibold hover:bg-accent-hover transition-colors text-sm">
            <LogIn size={16} /> Přihlásit se
          </a>
        </div>
      )}

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
          <a href="/laborator" className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-white font-semibold hover:bg-accent-hover transition-colors text-sm">
            Získej přístup do Laboratoře →
          </a>
        </div>
      )}

      {(error === "no_credits" || error === "no_budget") && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 space-y-3">
          <div className="flex items-start gap-2">
            <AlertCircle size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-800">AI rozpočet vyčerpaný</p>
              <p className="text-xs text-amber-700 mt-0.5">
                Můžeš si ho obnovit za 99 Kč, nebo se obnoví automaticky s dalším ročním předplatným.
              </p>
            </div>
          </div>
        </div>
      )}

      {error && !isBlocked && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700 flex items-start gap-2">
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Step: Reflecting (loading) */}
      {step === "reflecting" && (
        <div className="flex items-center gap-3 py-4">
          <div className="w-5 h-5 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
          <p className="text-sm text-foreground/60">Čtu, co píšeš...</p>
        </div>
      )}

      {/* Step: Reflection — show AI's understanding + confirm/edit */}
      {step === "reflection" && reflection && (
        <div className="space-y-4">
          {/* User's original message */}
          <div className="flex justify-end">
            <div className="bg-accent/10 rounded-2xl rounded-br-md px-4 py-3 max-w-[85%]">
              <p className="text-sm text-foreground/80">{chatHistory[0]?.content}</p>
            </div>
          </div>

          {/* AI reflection */}
          <div className="flex justify-start">
            <div className="bg-black/[0.03] rounded-2xl rounded-bl-md px-4 py-3 max-w-[85%]">
              <p className="text-sm text-foreground/75 leading-relaxed">{reflection}</p>
            </div>
          </div>

          {/* Confirm / refine input */}
          <div className="space-y-3 pt-1">
            <textarea
              ref={inputRef}
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, 2000))}
              placeholder="Chceš něco doplnit nebo upřesnit? Nebo stačí potvrdit..."
              className="w-full px-4 py-3 border-2 border-black/10 rounded-xl bg-white/80 text-sm min-h-[60px] max-h-[120px] resize-y focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleConfirm(message || undefined);
                }
              }}
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleConfirm()}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-white font-semibold hover:bg-accent-hover transition-colors text-sm"
              >
                Ano, doporuč mi →
              </button>
              {message.trim() && (
                <button
                  type="button"
                  onClick={() => handleConfirm(message)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-black/15 font-semibold hover:bg-black/5 transition-colors text-sm text-foreground/70"
                >
                  <Send size={14} />
                  Odeslat doplnění
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Step: Loading recommendations */}
      {step === "loading" && (
        <div className="flex items-center gap-3 py-4">
          <div className="w-5 h-5 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
          <p className="text-sm text-foreground/60">Připravuji doporučení...</p>
        </div>
      )}

      {/* Step: Max reflections reached */}
      {step === "max_reflections" && (
        <div className="space-y-4">
          {reflection && (
            <div className="flex justify-start">
              <div className="bg-black/[0.03] rounded-2xl rounded-bl-md px-4 py-3 max-w-[85%]">
                <p className="text-sm text-foreground/75 leading-relaxed">{reflection}</p>
              </div>
            </div>
          )}
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 space-y-3">
            <p className="text-sm text-foreground/70">
              Nedaří se mi úplně pochopit tvou situaci. Zkus to prosím popsat jinak — tohle je jedenkrát zadarmo.
            </p>
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-white font-semibold hover:bg-accent-hover transition-colors text-sm"
            >
              <RotateCcw size={14} />
              Začít znovu
            </button>
          </div>
        </div>
      )}

      {/* Step: Results — tile layout */}
      {step === "results" && result && (
        <div className="space-y-5">
          <p className="text-sm text-foreground/70 leading-relaxed">{result.summary}</p>

          {/* Recommendation tiles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {result.recommendations.map((rec, i) => (
              <button
                key={rec.slug || rec.id || i}
                type="button"
                onClick={() => handleRecommendationClick(rec)}
                className={`text-left rounded-2xl border-2 p-4 transition-all group hover:shadow-md ${
                  BORDER_COLORS[rec.itemType] ?? "border-black/10 hover:border-black/20"
                }`}
              >
                {/* Icon + tag */}
                <div className="flex items-start justify-between gap-2 mb-2.5">
                  <span className="text-2xl leading-none">{rec.icon || (rec.itemType === "tool" ? "🔧" : "📖")}</span>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 ${
                    TAG_STYLES[rec.itemType] ?? "bg-black/5 text-foreground/50"
                  }`}>
                    {rec.itemType === "tool" ? "Nástroj" : "Inspirace"}
                  </span>
                </div>

                {/* Title */}
                <p className="text-sm font-bold text-foreground group-hover:text-accent transition-colors leading-snug mb-1.5">
                  {rec.title}
                </p>

                {/* Reason */}
                <p className="text-xs text-foreground/50 leading-relaxed line-clamp-3">
                  {rec.reason}
                </p>
              </button>
            ))}
          </div>

          {result.closingNote && (
            <p className="text-sm text-foreground/55 italic leading-relaxed">{result.closingNote}</p>
          )}
        </div>
      )}

      {/* Step: Initial input */}
      {step === "input" && !isBlocked && (
        <div className="space-y-3">
          <textarea
            ref={inputRef}
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, 2000))}
            placeholder={'Například: "Poslední dobou nemám na nic čas. Mám pocit, že za chvíli vyhořím."'}
            className="w-full px-4 py-3 border-2 border-black/10 rounded-xl bg-white/80 text-sm min-h-[80px] max-h-[160px] resize-y focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleInitialSubmit();
              }
            }}
          />
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-foreground/35">{message.length}/2000</span>
            <button
              type="button"
              onClick={handleInitialSubmit}
              disabled={!message.trim()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-white font-semibold hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
            >
              <Send size={16} />
              Odeslat
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

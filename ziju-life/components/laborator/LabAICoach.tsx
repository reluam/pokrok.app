"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles, Send, RotateCcw, AlertCircle, MessageCircle } from "lucide-react";

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
type Step = "input" | "reflecting" | "reflection" | "loading" | "results" | "cannot_help";

interface Props {
  onSelectTool?: (slug: string) => void;
}

export default function LabAICoach({ onSelectTool }: Props) {
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [reflection, setReflection] = useState<string | null>(null);
  const [result, setResult] = useState<AIResponse | null>(null);
  const [cannotHelpTopic, setCannotHelpTopic] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("input");
  const [error, setError] = useState<string | null>(null);
  const [reflectionCount, setReflectionCount] = useState(0);
  const [collapsed, setCollapsed] = useState(true);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Click outside → collapse (only if in input state with no text)
  useEffect(() => {
    if (collapsed) return;
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        if (step === "input" && !message.trim()) setCollapsed(true);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [collapsed, step, message]);

  const tryParseRecommendations = (text: string): AIResponse | null => {
    const t = (text ?? "").trim();
    const tryParse = (s: string) => { try { const p = JSON.parse(s); return p?.recommendations?.length > 0 ? p : null; } catch { return null; } };
    const direct = tryParse(t);
    if (direct) return direct;
    const match = t.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match) { const r = tryParse(match[1].trim()); if (r) return r; }
    const bs = t.indexOf("{"), be = t.lastIndexOf("}");
    if (bs !== -1 && be > bs) { const r = tryParse(t.slice(bs, be + 1)); if (r) return r; }
    return null;
  };

  const tryParseCannotHelp = (text: string): string | null => {
    const t = (text ?? "").trim();
    const tryParse = (s: string) => { try { const p = JSON.parse(s); return p?.cannot_help ? p.topic : null; } catch { return null; } };
    const direct = tryParse(t);
    if (direct) return direct;
    const bs = t.indexOf("{"), be = t.lastIndexOf("}");
    if (bs !== -1 && be > bs) return tryParse(t.slice(bs, be + 1));
    return null;
  };

  const callAPI = async (messages: ChatMessage[]) => {
    const res = await fetch("/api/laborator/ai-coach", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
    });
    const data = await res.json();
    if (res.status === 402) { setError("no_budget"); setStep("input"); return null; }
    if (!res.ok) throw new Error(data.error || "Chyba");
    return data;
  };

  const handleInitialSubmit = async () => {
    if (!message.trim()) return;
    setError(null);
    setStep("reflecting");

    const userMsg: ChatMessage = { role: "user", content: message.trim() };
    const newHistory = [userMsg];
    setChatHistory(newHistory);
    setMessage("");

    try {
      const data = await callAPI(newHistory);
      if (!data) return;

      if (data.type === "cannot_help") {
        setCannotHelpTopic(data.topic);
        setStep("cannot_help");
      } else if (data.type === "reflection") {
        const maybeJson = tryParseRecommendations(data.text);
        const maybeCH = tryParseCannotHelp(data.text);
        if (maybeJson) { setResult(maybeJson); setStep("results"); }
        else if (maybeCH) { setCannotHelpTopic(maybeCH); setStep("cannot_help"); }
        else {
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
      setError(e instanceof Error ? e.message : "Nepodařilo se získat odpověď.");
      setStep("input");
    }
  };

  const handleConfirm = async (additionalText?: string) => {
    setStep("loading");
    setError(null);

    const isConfirm = !additionalText?.trim();
    const forceRecommend = isConfirm || reflectionCount >= 2;
    const confirmMsg: ChatMessage = {
      role: "user",
      content: forceRecommend
        ? (additionalText?.trim() ? `${additionalText.trim()} Pomoz mi s tímhle a doporuč mi relevantní nástroje nebo inspirace.` : "Ano, chápeš to správně. Pomoz mi s tímhle a doporuč mi relevantní nástroje nebo inspirace.")
        : additionalText!.trim(),
    };
    const newHistory = [...chatHistory, confirmMsg];
    setChatHistory(newHistory);
    setMessage("");

    try {
      const data = await callAPI(newHistory);
      if (!data) return;

      if (data.type === "cannot_help") {
        setCannotHelpTopic(data.topic);
        setStep("cannot_help");
      } else if (data.type === "recommendations" && data.response) {
        setResult(data.response);
        setStep("results");
      } else {
        const maybeJson = tryParseRecommendations(data.text ?? "");
        const maybeCH = tryParseCannotHelp(data.text ?? "");
        if (maybeJson) { setResult(maybeJson); setStep("results"); }
        else if (maybeCH) { setCannotHelpTopic(maybeCH); setStep("cannot_help"); }
        else if (reflectionCount >= 2) { setStep("input"); setError("Zkus to prosím popsat jinak."); }
        else {
          setReflection(data.text);
          setReflectionCount((c) => c + 1);
          setChatHistory([...newHistory, { role: "assistant", content: data.text }]);
          setStep("reflection");
        }
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Nepodařilo se získat odpověď.");
      setStep("reflection");
    }
  };

  const handleReset = () => {
    setMessage(""); setChatHistory([]); setReflection(null); setReflectionCount(0);
    setResult(null); setCannotHelpTopic(null); setStep("input"); setError(null);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  // Expand on first interaction
  const expand = () => {
    if (collapsed) {
      setCollapsed(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  // Collapsed: just a fake input — same style as InspirationAIAssistant
  if (collapsed && step === "input") {
    return (
      <div
        className="paper-card rounded-[24px] px-6 py-4 border-2 border-accent/15 cursor-text"
        onClick={expand}
      >
        <div className="flex items-center gap-3 text-foreground/40">
          <MessageCircle size={18} className="text-accent/50" />
          <span className="text-sm">Potřebuješ s něčím pomoct?</span>
        </div>
      </div>
    );
  }

  return (
    <div ref={wrapperRef} className="paper-card rounded-[20px] px-5 py-5 md:px-6 md:py-6 space-y-4 border border-accent/10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
            <MessageCircle size={16} className="text-accent" />
          </div>
          <p className="text-sm font-bold text-foreground">Potřebuješ s něčím pomoct?</p>
        </div>
        {step !== "input" ? (
          <button onClick={handleReset} className="p-1.5 rounded-lg hover:bg-black/5 text-foreground/40 hover:text-foreground/70 transition-colors" title="Začít znovu">
            <RotateCcw size={14} />
          </button>
        ) : (
          <button onClick={() => setCollapsed(true)} className="p-1.5 rounded-lg hover:bg-black/5 text-foreground/40 hover:text-foreground/70 transition-colors" title="Minimalizovat">
            <span className="text-xs">✕</span>
          </button>
        )}
      </div>

      {/* Errors */}
      {error === "no_budget" && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
          AI rozpočet je vyčerpaný. Obnoví se s dalším předplatným.
        </div>
      )}
      {error && error !== "no_budget" && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700 flex items-start gap-2">
          <AlertCircle size={14} className="mt-0.5 flex-shrink-0" /><span>{error}</span>
        </div>
      )}

      {/* Reflecting spinner */}
      {step === "reflecting" && (
        <div className="flex items-center gap-2 py-2">
          <div className="w-4 h-4 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
          <p className="text-xs text-foreground/50">Čtu, co píšeš...</p>
        </div>
      )}

      {/* Reflection */}
      {step === "reflection" && reflection && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <div className="bg-accent/10 rounded-xl rounded-br-sm px-3 py-2 max-w-[85%]">
              <p className="text-xs text-foreground/80">{chatHistory[0]?.content}</p>
            </div>
          </div>
          <div className="flex justify-start">
            <div className="bg-black/[0.03] rounded-xl rounded-bl-sm px-3 py-2 max-w-[85%]">
              <p className="text-xs text-foreground/75 leading-relaxed">{reflection}</p>
            </div>
          </div>
          <div className="space-y-2">
            <textarea
              ref={inputRef}
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, 2000))}
              placeholder="Upřesni nebo potvrď..."
              className="w-full px-3 py-2 border border-black/10 rounded-lg bg-white/80 text-xs min-h-[48px] max-h-[80px] resize-y focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleConfirm(message || undefined); } }}
            />
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => handleConfirm()} className="px-4 py-2 rounded-lg bg-accent text-white font-semibold text-xs hover:bg-accent-hover transition-colors">
                Ano, pomoz mi →
              </button>
              {message.trim() && (
                <button type="button" onClick={() => handleConfirm(message)} className="px-4 py-2 rounded-lg border border-black/15 font-semibold text-xs text-foreground/70 hover:bg-black/5 transition-colors">
                  <Send size={12} className="inline mr-1" />Odeslat
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Loading */}
      {step === "loading" && (
        <div className="flex items-center gap-2 py-2">
          <div className="w-4 h-4 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
          <p className="text-xs text-foreground/50">Připravuji odpověď...</p>
        </div>
      )}

      {/* Cannot help */}
      {step === "cannot_help" && (
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 space-y-2">
          <p className="text-xs text-blue-800">
            Tohle téma zatím neumím pokrýt. Dal jsem Matějovi vědět — možná přidáme nový nástroj nebo inspiraci.
          </p>
          <button type="button" onClick={handleReset} className="text-xs text-accent font-medium hover:underline">
            Zkusit jiný dotaz
          </button>
        </div>
      )}

      {/* Results */}
      {step === "results" && result && (
        <div className="space-y-3">
          <p className="text-xs text-foreground/70 leading-relaxed">{result.summary}</p>
          {result.recommendations.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {result.recommendations.map((rec, i) => (
                <button
                  key={rec.slug || rec.id || i}
                  type="button"
                  onClick={() => rec.itemType === "tool" && rec.slug && onSelectTool?.(rec.slug)}
                  className={`text-left rounded-xl border p-3 transition-all group hover:shadow-sm ${
                    rec.itemType === "tool" ? "border-emerald-200 hover:border-emerald-300" : "border-accent/20 hover:border-accent/40"
                  }`}
                >
                  <div className="flex items-start gap-2 mb-1">
                    <span className="text-lg leading-none">{rec.icon || "📖"}</span>
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${
                      rec.itemType === "tool" ? "bg-emerald-50 text-emerald-700" : "bg-accent/10 text-accent"
                    }`}>
                      {rec.itemType === "tool" ? "Nástroj" : "Inspirace"}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-foreground group-hover:text-accent transition-colors leading-snug">{rec.title}</p>
                  <p className="text-[11px] text-foreground/50 mt-1 leading-relaxed line-clamp-2">{rec.reason}</p>
                </button>
              ))}
            </div>
          )}
          {result.closingNote && (
            <p className="text-[11px] text-foreground/45 italic">{result.closingNote}</p>
          )}
        </div>
      )}

      {/* Input */}
      {step === "input" && error !== "no_budget" && (
        <div className="flex items-start gap-2">
          <textarea
            ref={inputRef}
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, 2000))}
            placeholder="Popiš, co teď řešíš..."
            className="flex-1 px-3 py-2 border border-black/10 rounded-lg bg-white/80 text-xs min-h-[40px] max-h-[80px] resize-y focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleInitialSubmit(); } }}
          />
          <button
            type="button"
            onClick={handleInitialSubmit}
            disabled={!message.trim()}
            className="p-2.5 rounded-lg bg-accent text-white hover:bg-accent-hover disabled:opacity-40 transition-colors"
          >
            <Send size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

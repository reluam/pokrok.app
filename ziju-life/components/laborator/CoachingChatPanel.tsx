"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Send, CalendarPlus, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface BudgetInfo {
  remainingCzk: number;
  totalBudgetCzk: number;
  spentCzk: number;
}

const LS_EXPANDED_KEY = "coaching-panel-expanded";

const WELCOME_MESSAGE = `Ahoj! 👋 Jsem tvůj osobní AI kouč.

Funguju jako tvůj společník na cestě osobního rozvoje. Můžeš se mnou probírat cokoliv — své cíle, výzvy, nápady, pocity. Čím víc toho o tobě vím, tím lépe ti dokážu pomoct.

Co ode mě můžeš čekat:
• Naslouchám a kladu otázky, které ti pomůžou přemýšlet jinak
• Pamatuju si naši konverzaci a buduji tvůj profil
• Doporučuju nástroje a inspirace šité na míru tobě
• Pomáhám ti stanovit priority a udržet směr

Naše konverzace se ukládá — kdykoli se vrátíš, navážeme tam, kde jsme skončili.

Tak povídej — co právě řešíš? 🌱`;

export default function CoachingChatPanel() {
  const [expanded, setExpanded] = useState(() => {
    if (typeof window === "undefined") return false;
    try { return localStorage.getItem(LS_EXPANDED_KEY) === "1"; } catch { return false; }
  });
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [budget, setBudget] = useState<BudgetInfo | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Persist expanded state
  const toggleExpanded = () => {
    const next = !expanded;
    setExpanded(next);
    try { localStorage.setItem(LS_EXPANDED_KEY, next ? "1" : "0"); } catch {}
  };

  const loadBudget = useCallback(async () => {
    try {
      const res = await fetch("/api/laborator/ai-credits");
      if (res.ok) {
        const data = await res.json();
        setBudget({ remainingCzk: data.available, totalBudgetCzk: data.total, spentCzk: data.used });
      }
    } catch {}
  }, []);

  // Load history when expanded for the first time
  useEffect(() => {
    if (!expanded || loaded) return;
    setLoading(true);
    (async () => {
      try {
        const res = await fetch("/api/laborator/coaching-chat");
        if (res.ok) {
          const data = await res.json();
          if (data.messages && data.messages.length > 0) {
            setMessages(data.messages.map((m: { role: string; content: string }) => ({
              role: m.role as "user" | "assistant",
              content: m.content,
            })));
          } else {
            setMessages([{ role: "assistant", content: WELCOME_MESSAGE }]);
          }
        } else {
          setMessages([{ role: "assistant", content: WELCOME_MESSAGE }]);
        }
      } catch {
        setMessages([{ role: "assistant", content: "Ahoj! 👋 Jsem tvůj osobní AI kouč. Povídej mi o sobě — co řešíš, na čem pracuješ. 🌱" }]);
      }
      setLoaded(true);
      setLoading(false);
    })();
    loadBudget();
  }, [expanded, loaded, loadBudget]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, sending]);

  // Focus input when expanded
  useEffect(() => {
    if (expanded && loaded) setTimeout(() => inputRef.current?.focus(), 150);
  }, [expanded, loaded]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    setError(null);

    const userMsg: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setSending(true);

    try {
      const res = await fetch("/api/laborator/coaching-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();

      if (res.status === 402) {
        setError("no_budget");
        setSending(false);
        return;
      }
      if (!res.ok) throw new Error(data.error || "Chyba");

      if (data.budget) setBudget(data.budget);

      setMessages((prev) => [...prev, { role: "assistant", content: data.message }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Promiň, něco se pokazilo. Zkus to znovu." }]);
    }
    setSending(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const budgetPct = budget && budget.totalBudgetCzk > 0
    ? Math.min(100, Math.round((budget.spentCzk / budget.totalBudgetCzk) * 100))
    : null;

  return (
    <div className="paper-card rounded-[24px] border-2 border-accent/15 overflow-hidden">
      {/* Header — always visible, clickable to toggle */}
      <button
        onClick={toggleExpanded}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-accent/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
            <Sparkles size={16} className="text-accent" />
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-foreground">AI Kouč</p>
            <p className="text-xs text-foreground/45">Tvůj osobní průvodce s pamětí</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {budgetPct !== null && (
            <div className="flex items-center gap-1.5" title={`Spotřeba: ${budget!.spentCzk.toFixed(1)} / ${budget!.totalBudgetCzk} Kč`}>
              <div className="w-14 h-1.5 bg-black/10 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${budgetPct}%`,
                    background: budgetPct > 80 ? "#ef4444" : budgetPct > 50 ? "#f59e0b" : "#22c55e",
                  }}
                />
              </div>
            </div>
          )}
          {expanded ? (
            <ChevronUp size={18} className="text-foreground/30" />
          ) : (
            <ChevronDown size={18} className="text-foreground/30" />
          )}
        </div>
      </button>

      {/* Expanded chat area */}
      {expanded && (
        <div className="border-t border-black/5">
          {/* Loading state */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
            </div>
          )}

          {/* Messages */}
          {!loading && (
            <>
              <div className="max-h-[420px] overflow-y-auto px-4 py-3 space-y-2.5">
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 ${
                        m.role === "user"
                          ? "bg-accent/10 rounded-br-sm"
                          : "bg-black/[0.03] rounded-bl-sm"
                      }`}
                    >
                      <p className={`text-sm leading-relaxed whitespace-pre-wrap ${
                        m.role === "user" ? "text-foreground/80" : "text-foreground/75"
                      }`}>
                        {m.content}
                      </p>
                    </div>
                  </div>
                ))}

                {sending && (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
                    <p className="text-xs text-foreground/50">Kouč přemýšlí...</p>
                  </div>
                )}

                {error === "no_budget" && (
                  <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
                    AI rozpočet je vyčerpaný. Obnoví se s dalším předplatným.
                  </div>
                )}
                {error && error !== "no_budget" && (
                  <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700">
                    {error}
                  </div>
                )}

                <div ref={bottomRef} />
              </div>

              {/* Input */}
              {error !== "no_budget" && (
                <div className="flex items-end gap-2 px-4 py-3 border-t border-black/5">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value.slice(0, 2000))}
                    placeholder="Napiš zprávu..."
                    className="flex-1 px-3.5 py-2.5 border border-black/10 rounded-xl bg-white/80 text-sm min-h-[40px] max-h-[100px] resize-y focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
                    disabled={sending}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={!input.trim() || sending}
                    className="p-2.5 rounded-xl bg-accent text-white hover:bg-accent-hover disabled:opacity-40 transition-colors shrink-0"
                  >
                    <Send size={16} />
                  </button>
                </div>
              )}

              {/* Booking bar */}
              <Link
                href="/koucing#rezervace"
                className="flex items-center justify-center gap-2 px-4 py-2.5 border-t border-black/5 bg-white/50 hover:bg-accent/5 transition-colors"
              >
                <CalendarPlus size={14} className="text-accent" />
                <span className="text-xs font-semibold text-accent">Objednat koučovací sezení</span>
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}

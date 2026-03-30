"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Send, CalendarPlus, Sparkles, X, Check } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useBookingPopup } from "@/components/BookingPopup";

interface AIAction {
  type: string;
  [key: string]: unknown;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  actions?: AIAction[];
}

interface BudgetInfo {
  remainingCzk: number;
  totalBudgetCzk: number;
  spentCzk: number;
}

const WELCOME_MESSAGE = `Ahoj! 👋 Jsem tvůj chytrý průvodce životem.

Funguju jako tvůj společník a thinking parťák na cestě osobního rozvoje. Můžeš se mnou probírat cokoliv — své cíle, výzvy, nápady, pocity. Čím víc toho o tobě vím, tím lépe ti dokážu pomoct.

Co ode mě můžeš čekat:
• Naslouchám a kladu otázky, které ti pomůžou přemýšlet jinak
• Pamatuju si naši konverzaci a buduji tvůj profil
• Doporučuju nástroje a inspirace šité na míru tobě
• Pomáhám ti stanovit priority a udržet směr

Naše konverzace se ukládá — kdykoli se vrátíš, navážeme tam, kde jsme skončili.

Tak povídej — co právě řešíš? 🌱`;

export default function CoachingChatPanel() {
  const booking = useBookingPopup();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [budget, setBudget] = useState<BudgetInfo | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const loadBudget = useCallback(async () => {
    try {
      const res = await fetch("/api/laborator/ai-credits");
      if (res.ok) {
        const data = await res.json();
        setBudget({ remainingCzk: data.available, totalBudgetCzk: data.total, spentCzk: data.used });
      }
    } catch {}
  }, []);

  // Load history when modal opens for the first time
  useEffect(() => {
    if (!open || loaded) return;
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
        setMessages([{ role: "assistant", content: "Ahoj! 👋 Jsem tvůj chytrý průvodce životem. Povídej mi o sobě — co řešíš, na čem pracuješ. 🌱" }]);
      }
      setLoaded(true);
      setLoading(false);
    })();
    loadBudget();
  }, [open, loaded, loadBudget]);

  // Auto-scroll inside the chat container
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages.length, sending]);

  // Focus input when modal opens and loaded
  useEffect(() => {
    if (open && loaded) setTimeout(() => inputRef.current?.focus(), 200);
  }, [open, loaded]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

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

      const actions = Array.isArray(data.actions) && data.actions.length > 0 ? data.actions : undefined;
      setMessages((prev) => [...prev, { role: "assistant", content: data.message, actions }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Promiň, něco se pokazilo. Zkus to znovu." }]);
    }
    setSending(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const budgetPct = budget && budget.totalBudgetCzk > 0
    ? Math.min(100, Math.round((budget.spentCzk / budget.totalBudgetCzk) * 100))
    : null;

  const ACTION_LABELS: Record<string, string> = {
    add_todo: "Přidat do To-Do",
    set_priorities: "Nastavit priority",
    add_priority: "Přidat prioritu",
    set_focus_area: "Změnit focus area",
    update_compass: "Aktualizovat kompas",
    update_values: "Aktualizovat hodnoty",
    update_rituals: "Změnit rituály",
  };

  const ACTION_ICONS: Record<string, string> = {
    add_todo: "✅",
    set_priorities: "🎯",
    add_priority: "➕",
    set_focus_area: "🧭",
    update_compass: "📊",
    update_values: "⭐",
    update_rituals: "⏱️",
  };

  const confirmAction = async (action: AIAction, msgIndex: number) => {
    try {
      if (action.type === "add_todo") {
        // Load current todos, add new one, save
        const res = await fetch("/api/laborator/daily-todos");
        const d = await res.json();
        const isNice = !!action.nice;
        const todos = d.today?.todos ?? [];
        const niceTodos = d.today?.niceTodos ?? [];
        if (isNice) {
          niceTodos.push({ text: String(action.text), done: false });
        } else {
          todos.push({ text: String(action.text), done: false });
        }
        await fetch("/api/laborator/daily-todos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ todos, niceTodos }),
        });
      } else if (action.type === "set_priorities" || action.type === "add_priority") {
        const res = await fetch("/api/laborator/user-context");
        const d = await res.json();
        const current = d.context?.priorities ?? { weekly: [], monthly: [], yearly: [] };
        const scope = (action.scope as string) ?? "weekly";
        if (action.type === "set_priorities" && Array.isArray(action.items)) {
          current[scope] = (action.items as string[]).map((text: string) => ({ text, done: false }));
        } else if (action.type === "add_priority" && action.text) {
          current[scope] = [...(current[scope] ?? []), { text: action.text as string, done: false }];
        }
        await fetch("/api/laborator/user-context", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "priorities", data: current }),
        });
      } else if (action.type === "set_focus_area" || action.type === "update_compass") {
        const res = await fetch("/api/laborator/user-context");
        const d = await res.json();
        const current = d.context?.compass ?? [];
        if (action.type === "update_compass" && action.area) {
          const existing = current.find((c: { area: string }) => c.area === action.area);
          if (existing) {
            if (action.current !== undefined) existing.current = action.current;
            if (action.goal !== undefined) existing.goal = action.goal;
          }
        }
        await fetch("/api/laborator/user-context", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "compass", data: current }),
        });
      } else if (action.type === "update_values" && Array.isArray(action.values)) {
        await fetch("/api/laborator/user-context", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "values", data: action.values }),
        });
      } else if (action.type === "update_rituals" && Array.isArray(action.rituals)) {
        await fetch("/api/laborator/user-context", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "rituals", data: action.rituals }),
        });
      }

      // Remove confirmed action from message
      setMessages((prev) => prev.map((m, i) =>
        i === msgIndex ? { ...m, actions: m.actions?.filter((a) => a !== action) } : m
      ));
    } catch (e) {
      console.error("Failed to apply action:", e);
    }
  };

  const dismissAction = (action: AIAction, msgIndex: number) => {
    setMessages((prev) => prev.map((m, i) =>
      i === msgIndex ? { ...m, actions: m.actions?.filter((a) => a !== action) } : m
    ));
  };

  return (
    <>
      {/* Collapsed card — click to open modal */}
      <button
        onClick={() => setOpen(true)}
        className="w-full paper-card rounded-[24px] border-2 border-accent/15 px-6 py-4 flex items-center gap-4 hover:border-accent/30 hover:shadow-sm transition-all group text-left"
      >
        <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center shrink-0 group-hover:bg-accent/15 transition-colors">
          <Sparkles size={18} className="text-accent" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-foreground group-hover:text-accent transition-colors">AI Průvodce</p>
          <p className="text-xs text-foreground/45">Tvůj chytrý životní průvodce</p>
        </div>
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
      </button>

      {/* Modal overlay — rendered via portal to escape scroll wrappers */}
      {open && createPortal(
        <div
          className="fixed inset-0 flex items-center justify-center p-4"
          data-lenis-prevent
          style={{ zIndex: 9999, animation: "coachFadeIn 200ms ease-out" }}
        >
          <style>{`
            @keyframes coachFadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes coachScaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
          `}</style>
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/25"
            onClick={() => setOpen(false)}
          />

          {/* Modal panel */}
          <div
            className="relative z-10 w-full max-w-3xl bg-white rounded-[24px] shadow-2xl border border-black/10 flex flex-col max-h-[85vh] overflow-y-auto overscroll-contain"
            style={{ animation: "coachScaleIn 200ms ease-out" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-black/5 shrink-0">
              <div className="flex items-center gap-2.5">
                <Sparkles size={18} className="text-accent" />
                <div>
                  <p className="text-sm font-bold text-foreground">AI Průvodce</p>
                  <p className="text-[11px] text-foreground/40">Tvůj chytrý životní průvodce</p>
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
                <button
                  onClick={() => setOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-black/5 text-foreground/40 hover:text-foreground/70 transition-colors"
                  title="Zavřít"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Loading */}
            {loading && (
              <div className="flex items-center justify-center py-16">
                <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
              </div>
            )}

            {/* Chat content */}
            {!loading && (
              <>
                {/* Messages — scrollable area */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5 min-h-0">
                  {messages.map((m, i) => (
                    <div key={i}>
                      <div className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 ${
                            m.role === "user"
                              ? "bg-accent/10 rounded-br-sm"
                              : "bg-black/[0.03] rounded-bl-sm"
                          }`}
                        >
                          {m.role === "user" ? (
                            <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/80">
                              {m.content}
                            </p>
                          ) : (
                            <div className="text-sm leading-relaxed text-foreground/75 prose prose-sm prose-neutral max-w-none [&>p]:mb-2 [&>p:last-child]:mb-0 [&>ul]:mb-2 [&>ol]:mb-2 [&>li]:mb-0.5">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {m.content}
                              </ReactMarkdown>
                            </div>
                          )}
                        </div>
                      </div>
                      {/* Actions */}
                      {m.actions && m.actions.length > 0 && (
                        <div className="flex justify-start mt-1.5">
                          <div className="max-w-[85%] space-y-1.5">
                            {m.actions.map((action, j) => {
                              const label = ACTION_LABELS[action.type] ?? action.type;
                              const icon = ACTION_ICONS[action.type] ?? "⚡";
                              const detail = action.type === "add_todo" ? String(action.text ?? "")
                                : action.type === "add_priority" ? `${action.scope ?? "weekly"}: ${action.text ?? ""}`
                                : action.type === "set_priorities" && Array.isArray(action.items) ? (action.items as string[]).join(", ")
                                : action.type === "set_focus_area" ? String(action.area ?? "")
                                : "";
                              return (
                                <div key={j} className="rounded-xl border border-blue-200 bg-blue-50/50 px-3 py-2">
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <span className="text-sm leading-none">{icon}</span>
                                      <div className="min-w-0">
                                        <p className="text-xs font-semibold text-foreground">{label}</p>
                                        {detail && <p className="text-[11px] text-foreground/50 truncate">{detail}</p>}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                      <button onClick={() => confirmAction(action, i)} className="p-1 rounded-lg bg-accent text-white hover:bg-accent-hover transition-colors" title="Potvrdit">
                                        <Check size={12} />
                                      </button>
                                      <button onClick={() => dismissAction(action, i)} className="p-1 rounded-lg bg-black/5 text-foreground/40 hover:bg-black/10 transition-colors" title="Zrušit">
                                        <X size={12} />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {sending && (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
                      <p className="text-xs text-foreground/50">Průvodce přemýšlí...</p>
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
                </div>

                {/* Input */}
                {error !== "no_budget" && (
                  <div className="flex items-end gap-2 px-4 py-3 border-t border-black/5 shrink-0">
                    <textarea
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value.slice(0, 2000))}
                      placeholder="Napiš zprávu..."
                      className="flex-1 px-3.5 py-2.5 border border-black/10 rounded-xl bg-white/80 text-sm min-h-[40px] max-h-[100px] resize-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
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
                <button
                  type="button"
                  onClick={() => { setOpen(false); booking?.openBookingPopup(); }}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 border-t border-black/5 bg-white/50 hover:bg-accent/5 transition-colors shrink-0 w-full"
                >
                  <CalendarPlus size={14} className="text-accent" />
                  <span className="text-xs font-semibold text-accent">Objednat osobní sezení</span>
                </button>
              </>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

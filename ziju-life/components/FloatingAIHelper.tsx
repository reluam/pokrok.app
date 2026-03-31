"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import {
  MessageCircle,
  X,
  Send,
  RotateCcw,
  AlertCircle,
  Check,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

interface Recommendation {
  itemType: "tool" | "inspiration";
  slug?: string;
  id?: string;
  title: string;
  icon?: string;
  reason: string;
}

interface AIAction {
  type: string;
  [key: string]: unknown;
}

interface ChatBubble {
  role: "user" | "assistant";
  text?: string;
  recommendations?: Recommendation[];
  actions?: AIAction[];
  closingNote?: string;
}

interface BudgetInfo {
  remainingCzk: number;
  totalBudgetCzk: number;
  spentCzk: number;
}

const ACTION_LABELS: Record<string, string> = {
  set_priorities: "Nastavit priority",
  add_priority: "Přidat prioritu",
  set_focus_area: "Změnit focus area",
  update_compass: "Aktualizovat kompas",
  update_values: "Aktualizovat hodnoty",
  update_rituals: "Změnit rituály",
};

const ACTION_ICONS: Record<string, string> = {
  set_priorities: "🎯",
  add_priority: "➕",
  set_focus_area: "🧭",
  update_compass: "📊",
  update_values: "⭐",
  update_rituals: "⏱️",
};

const HIDDEN_PATHS = ["/form", "/links", "/admin"];

// ── Component ────────────────────────────────────────────────────────────────

export default function FloatingAIHelper() {
  const pathname = usePathname();

  const [open, setOpen] = useState(false);
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [message, setMessage] = useState("");
  const [bubbles, setBubbles] = useState<ChatBubble[]>([]);
  const [apiMessages, setApiMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [budget, setBudget] = useState<BudgetInfo | null>(null);
  const [guestRemaining, setGuestRemaining] = useState<number | null>(null);

  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Hide on certain paths
  const hidden = HIDDEN_PATHS.some((p) => pathname?.startsWith(p));

  // Auth check (lazy)
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth/me");
        setAuthed(res.ok);
      } catch {
        setAuthed(false);
      }
    })();
  }, []);

  // Load budget when panel opens
  const loadBudget = useCallback(async () => {
    try {
      const res = await fetch("/api/laborator/ai-credits");
      if (res.ok) {
        const data = await res.json();
        setBudget({ remainingCzk: data.available, totalBudgetCzk: data.total, spentCzk: data.used });
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (open && authed) loadBudget();
  }, [open, authed, loadBudget]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [bubbles.length, loading]);

  // Focus input when panel opens
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 150);
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

  const tryParseJson = (text: string) => {
    const t = (text ?? "").trim();
    const parse = (s: string) => {
      try { return JSON.parse(s); } catch { return null; }
    };
    let obj = parse(t);
    if (!obj) {
      const m = t.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (m) obj = parse(m[1].trim());
    }
    if (!obj) {
      const bs = t.indexOf("{"), be = t.lastIndexOf("}");
      if (bs !== -1 && be > bs) obj = parse(t.slice(bs, be + 1));
    }
    return obj;
  };

  const handleSubmit = async () => {
    if (!message.trim() || loading) return;
    setError(null);

    const userText = message.trim();
    setBubbles((prev) => [...prev, { role: "user", text: userText }]);

    const newApiMsgs = [...apiMessages, { role: "user" as const, content: userText }];
    setApiMessages(newApiMsgs);
    setMessage("");
    setLoading(true);

    try {
      const endpoint = authed ? "/api/laborator/ai-coach" : "/api/guest-chat";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newApiMsgs }),
      });
      const data = await res.json();

      if (res.status === 402) { setError("no_budget"); setLoading(false); return; }
      if (res.status === 429) { setError("guest_limit"); setLoading(false); return; }
      if (!res.ok) throw new Error(data.error || "Chyba");

      if (data.remaining !== undefined) setGuestRemaining(data.remaining);

      if (data.budget) setBudget(data.budget);

      let aiBubble: ChatBubble;
      let apiContent: string;

      if (data.type === "cannot_help") {
        aiBubble = { role: "assistant", text: "Tohle téma zatím neumím pokrýt. Dal jsem Matějovi vědět — možná přidáme nový nástroj nebo inspiraci." };
        apiContent = aiBubble.text!;
      } else if (data.type === "recommendations" && data.response) {
        const r = data.response;
        aiBubble = { role: "assistant", text: r.summary, recommendations: r.recommendations, actions: r.actions, closingNote: r.closingNote };
        apiContent = JSON.stringify(r);
      } else {
        const rawText = data.text ?? "";
        const parsed = tryParseJson(rawText);
        if (parsed?.recommendations?.length || parsed?.actions?.length || parsed?.summary) {
          aiBubble = { role: "assistant", text: parsed.summary, recommendations: parsed.recommendations, actions: parsed.actions, closingNote: parsed.closingNote };
          apiContent = JSON.stringify(parsed);
        } else if (parsed?.cannot_help) {
          aiBubble = { role: "assistant", text: "Tohle téma zatím neumím pokrýt. Dal jsem Matějovi vědět." };
          apiContent = aiBubble.text!;
        } else {
          aiBubble = { role: "assistant", text: rawText };
          apiContent = rawText;
        }
      }

      setBubbles((prev) => [...prev, aiBubble]);
      setApiMessages((prev) => [...prev, { role: "assistant", content: apiContent }]);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Chyba");
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const confirmAction = async (action: AIAction, bubbleIndex: number) => {
    try {
      if (action.type === "set_priorities" || action.type === "add_priority") {
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
      } else if (action.type === "update_compass") {
        const res = await fetch("/api/laborator/user-context");
        const d = await res.json();
        const current = d.context?.compass ?? [];
        if (action.area) {
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

      setBubbles((prev) =>
        prev.map((b, i) =>
          i === bubbleIndex ? { ...b, actions: b.actions?.filter((a) => a !== action) } : b
        )
      );
    } catch (e) {
      console.error("Failed to apply action:", e);
    }
  };

  const dismissAction = (action: AIAction, bubbleIndex: number) => {
    setBubbles((prev) =>
      prev.map((b, i) =>
        i === bubbleIndex ? { ...b, actions: b.actions?.filter((a) => a !== action) } : b
      )
    );
  };

  const handleReset = () => {
    setMessage("");
    setBubbles([]);
    setApiMessages([]);
    setError(null);
    setLoading(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleClose = () => {
    setOpen(false);
    setBubbles([]);
    setApiMessages([]);
    setMessage("");
    setError(null);
    setLoading(false);
  };

  // Don't render on hidden paths
  if (hidden) return null;
  // Still checking auth — don't show yet
  if (authed === null) return null;

  const budgetPct =
    budget && budget.totalBudgetCzk > 0
      ? Math.min(100, Math.round((budget.spentCzk / budget.totalBudgetCzk) * 100))
      : null;

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-accent text-white shadow-lg hover:bg-accent-hover hover:scale-105 transition-all flex items-center justify-center"
          title="AI Pomocník"
        >
          <MessageCircle size={24} />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <>
          {/* Backdrop on mobile */}
          <div
            className="fixed inset-0 bg-black/20 z-50 md:hidden"
            onClick={handleClose}
          />

          <div
            ref={panelRef}
            className="fixed z-50 bottom-0 right-0 w-full h-[85vh] md:bottom-6 md:right-6 md:w-[400px] md:h-[550px] md:rounded-2xl bg-white shadow-2xl border border-black/10 flex flex-col overflow-hidden md:max-h-[calc(100vh-48px)]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-black/5 bg-white shrink-0">
              <div className="flex items-center gap-2">
                <MessageCircle size={18} className="text-accent" />
                <span className="text-sm font-bold text-foreground">AI Pomocník</span>
              </div>
              <div className="flex items-center gap-1.5">
                {authed && budgetPct !== null && (
                  <div className="flex items-center gap-1.5" title={`Spotřeba: ${budget!.spentCzk.toFixed(1)} / ${budget!.totalBudgetCzk} Kč`}>
                    <div className="w-12 h-1.5 bg-black/10 rounded-full overflow-hidden">
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
                {!authed && guestRemaining !== null && (
                  <span className="text-[10px] text-foreground/40" title="Zbývající zprávy tento měsíc">
                    {guestRemaining}/{10}
                  </span>
                )}
                {bubbles.length > 0 && (
                  <button
                    onClick={handleReset}
                    className="p-1.5 rounded-lg hover:bg-black/5 text-foreground/40 hover:text-foreground/70 transition-colors"
                    title="Nová konverzace"
                  >
                    <RotateCcw size={14} />
                  </button>
                )}
                <button
                  onClick={handleClose}
                  className="p-1.5 rounded-lg hover:bg-black/5 text-foreground/40 hover:text-foreground/70 transition-colors"
                  title="Zavřít"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Chat bubbles */}
            <div className="flex-1 overflow-y-auto px-3.5 py-3 space-y-2.5">
              {bubbles.length === 0 && !loading && (
                <div className="text-center py-8">
                  <MessageCircle size={32} className="mx-auto text-foreground/15 mb-3" />
                  <p className="text-sm text-foreground/40">
                    {authed ? "Potřebuješ s něčím pomoct?" : "Zajímá tě osobní rozvoj?"}
                  </p>
                  <p className="text-xs text-foreground/25 mt-1">
                    {authed ? "Popiš, co teď řešíš..." : "Zeptej se mě na cokoliv..."}
                  </p>
                </div>
              )}

              {bubbles.map((b, i) => (
                <div key={i}>
                  {b.role === "user" ? (
                    <div className="flex justify-end">
                      <div className="bg-accent/10 rounded-2xl rounded-br-sm px-3.5 py-2 max-w-[85%]">
                        <p className="text-sm text-foreground/80">{b.text}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {b.text && (
                        <div className="flex justify-start">
                          <div className="bg-black/[0.03] rounded-2xl rounded-bl-sm px-3.5 py-2 max-w-[85%]">
                            <p className="text-sm text-foreground/75 leading-relaxed">{b.text}</p>
                          </div>
                        </div>
                      )}
                      {b.recommendations && b.recommendations.length > 0 && (
                        <div className="flex justify-start">
                          <div className="max-w-[90%] space-y-1">
                            <p className="text-[11px] text-foreground/40 ml-1">Mohlo by ti pomoct:</p>
                            {b.recommendations.map((rec, j) => (
                              <div
                                key={rec.slug || rec.id || j}
                                className={`w-full text-left rounded-xl border px-3 py-2 ${
                                  rec.itemType === "tool"
                                    ? "border-emerald-200 bg-emerald-50/30"
                                    : "border-accent/20 bg-accent/[0.03]"
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-sm leading-none">{rec.icon || "📖"}</span>
                                  <p className="text-xs font-semibold text-foreground">{rec.title}</p>
                                </div>
                                <p className="text-[11px] text-foreground/50 mt-0.5 leading-relaxed">{rec.reason}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {b.actions && b.actions.length > 0 && (
                        <div className="flex justify-start">
                          <div className="max-w-[90%] space-y-1">
                            <p className="text-[11px] text-foreground/40 ml-1">Navrhované změny:</p>
                            {b.actions.map((action, j) => (
                              <div key={j} className="rounded-xl border border-blue-200 bg-blue-50/50 px-3 py-2">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="text-sm leading-none">{ACTION_ICONS[action.type] ?? "⚡"}</span>
                                    <div className="min-w-0">
                                      <p className="text-[11px] font-semibold text-foreground">{ACTION_LABELS[action.type] ?? action.type}</p>
                                      <p className="text-[10px] text-foreground/50 truncate">
                                        {action.type === "set_priorities" && Array.isArray(action.items) ? (action.items as string[]).join(", ") : ""}
                                        {action.type === "add_priority" ? String(action.text ?? "") : ""}
                                        {action.type === "set_focus_area" ? String(action.area ?? "") : ""}
                                        {action.type === "update_compass" ? `${action.area}: ${action.current}→${action.goal}` : ""}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1 shrink-0">
                                    <button onClick={() => confirmAction(action, i)} className="p-1 rounded-lg bg-accent text-white hover:bg-accent-hover transition-colors" title="Potvrdit">
                                      <Check size={11} />
                                    </button>
                                    <button onClick={() => dismissAction(action, i)} className="p-1 rounded-lg bg-black/5 text-foreground/40 hover:bg-black/10 transition-colors" title="Zrušit">
                                      <X size={11} />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {b.closingNote && (
                        <div className="flex justify-start">
                          <p className="text-[11px] text-foreground/45 italic ml-1">{b.closingNote}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
                  <p className="text-xs text-foreground/50">Přemýšlím...</p>
                </div>
              )}

              {error === "no_budget" && (
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-2.5 text-xs text-amber-800">
                  AI rozpočet je vyčerpaný. Obnoví se s dalším předplatným.
                </div>
              )}
              {error === "guest_limit" && (
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-2.5 text-xs text-amber-800">
                  Dosáhl jsi měsíčního limitu zpráv.{" "}
                  <a href="/laborator" className="underline font-medium text-accent hover:text-accent-hover">
                    Zaregistruj se
                  </a>{" "}
                  pro neomezený přístup k AI průvodci.
                </div>
              )}
              {error && error !== "no_budget" && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-2.5 text-xs text-red-700 flex items-start gap-2">
                  <AlertCircle size={14} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Input */}
            {error !== "no_budget" && error !== "guest_limit" && (
              <div className="flex items-end gap-2 px-3.5 py-2.5 border-t border-black/5 bg-white shrink-0">
                <textarea
                  ref={inputRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value.slice(0, 2000))}
                  placeholder={bubbles.length === 0 ? "Popiš, co teď řešíš..." : "Pokračuj v konverzaci..."}
                  className="flex-1 px-3 py-2 border border-black/10 rounded-xl bg-white/80 text-sm min-h-[38px] max-h-[80px] resize-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
                  disabled={loading}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!message.trim() || loading}
                  className="p-2 rounded-xl bg-accent text-white hover:bg-accent-hover disabled:opacity-40 transition-colors shrink-0"
                >
                  <Send size={14} />
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}

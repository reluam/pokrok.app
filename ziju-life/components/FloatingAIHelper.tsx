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
  Sparkles,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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

type ChatMode = null | "pomocnik" | "pruvodce";

// ── Component ────────────────────────────────────────────────────────────────

export default function FloatingAIHelper() {
  const pathname = usePathname();

  const [open, setOpen] = useState(false);
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [hasLabAccess, setHasLabAccess] = useState(false);
  const [chatMode, setChatMode] = useState<ChatMode>(null);
  const [message, setMessage] = useState("");
  const [bubbles, setBubbles] = useState<ChatBubble[]>([]);
  const [apiMessages, setApiMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [pruvodceLoading, setPruvodceLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [budget, setBudget] = useState<BudgetInfo | null>(null);

  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Hide on certain paths
  const hidden = HIDDEN_PATHS.some((p) => pathname?.startsWith(p));

  // Auth + lab access check
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (res.ok && data.loggedIn) {
          setAuthed(true);
          // Check lab access via ai-credits endpoint
          try {
            const credRes = await fetch("/api/dilna/ai-credits");
            setHasLabAccess(credRes.ok);
          } catch {
            setHasLabAccess(false);
          }
        } else {
          setAuthed(false);
          setHasLabAccess(false);
        }
      } catch {
        setAuthed(false);
        setHasLabAccess(false);
      }
    })();
  }, []);

  // Load budget when panel opens
  const loadBudget = useCallback(async () => {
    try {
      const res = await fetch("/api/dilna/ai-credits");
      if (res.ok) {
        const data = await res.json();
        setBudget({ remainingCzk: data.available, totalBudgetCzk: data.total, spentCzk: data.used });
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (open && authed && chatMode) loadBudget();
  }, [open, authed, chatMode, loadBudget]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [bubbles.length, loading]);

  // Focus input when panel opens
  useEffect(() => {
    if (open && chatMode) setTimeout(() => inputRef.current?.focus(), 150);
  }, [open, chatMode]);

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
      const pageContext = pathname || "/";
      const endpoint = chatMode === "pruvodce"
        ? "/api/dilna/coaching-chat"
        : "/api/dilna/ai-coach";
      const body = chatMode === "pruvodce"
        ? JSON.stringify({ message: userText, pageContext })
        : JSON.stringify({ messages: newApiMsgs, pageContext });
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });
      const data = await res.json();

      if (res.status === 402) { setError("no_budget"); setLoading(false); return; }
      if (!res.ok) throw new Error(data.error || "Chyba");

      if (data.budget) setBudget(data.budget);

      let aiBubble: ChatBubble;
      let apiContent: string;

      if (chatMode === "pruvodce") {
        // Coaching chat returns { message, actions? }
        const actions = Array.isArray(data.actions) && data.actions.length > 0 ? data.actions : undefined;
        aiBubble = { role: "assistant", text: data.message, actions };
        apiContent = data.message;
      } else if (data.type === "cannot_help") {
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
        const res = await fetch("/api/dilna/user-context");
        const d = await res.json();
        const current = d.context?.priorities ?? { weekly: [], monthly: [], yearly: [] };
        const scope = (action.scope as string) ?? "weekly";
        if (action.type === "set_priorities" && Array.isArray(action.items)) {
          current[scope] = (action.items as string[]).map((text: string) => ({ text, done: false }));
        } else if (action.type === "add_priority" && action.text) {
          current[scope] = [...(current[scope] ?? []), { text: action.text as string, done: false }];
        }
        await fetch("/api/dilna/user-context", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "priorities", data: current }),
        });
      } else if (action.type === "update_compass") {
        const res = await fetch("/api/dilna/user-context");
        const d = await res.json();
        const current = d.context?.compass ?? [];
        if (action.area) {
          const existing = current.find((c: { area: string }) => c.area === action.area);
          if (existing) {
            if (action.current !== undefined) existing.current = action.current;
            if (action.goal !== undefined) existing.goal = action.goal;
          }
        }
        await fetch("/api/dilna/user-context", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "compass", data: current }),
        });
      } else if (action.type === "update_values" && Array.isArray(action.values)) {
        await fetch("/api/dilna/user-context", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "values", data: action.values }),
        });
      } else if (action.type === "update_rituals" && Array.isArray(action.rituals)) {
        await fetch("/api/dilna/user-context", {
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
    setChatMode(null);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleClose = () => {
    setOpen(false);
    setBubbles([]);
    setApiMessages([]);
    setMessage("");
    setError(null);
    setLoading(false);
    setChatMode(null);
  };

  const selectMode = async (mode: ChatMode) => {
    setChatMode(mode);
    if (mode === "pruvodce") {
      // Load coaching history
      setPruvodceLoading(true);
      try {
        const res = await fetch("/api/dilna/coaching-chat");
        if (res.ok) {
          const data = await res.json();
          if (data.messages && data.messages.length > 0) {
            const loaded = data.messages.map((m: { role: string; content: string }) => ({
              role: m.role as "user" | "assistant",
              text: m.content,
            }));
            setBubbles(loaded);
          }
        }
      } catch {}
      setPruvodceLoading(false);
    }
  };

  // Don't render on hidden paths
  if (hidden) return null;
  // Only show for logged-in users with lab access
  if (authed === null) return null;
  if (!authed || !hasLabAccess) return null;

  const budgetPct =
    budget && budget.totalBudgetCzk > 0
      ? Math.min(100, Math.round((budget.spentCzk / budget.totalBudgetCzk) * 100))
      : null;

  const modeLabel = chatMode === "pruvodce" ? "AI Průvodce" : "AI Pomocník";
  const ModeIcon = chatMode === "pruvodce" ? Sparkles : MessageCircle;

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-accent text-white shadow-lg hover:bg-accent-hover hover:scale-105 transition-all flex items-center justify-center"
          title="AI Chat"
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
            data-lenis-prevent
            className="fixed z-50 bottom-0 right-0 w-full h-[85vh] md:bottom-6 md:right-6 md:w-[400px] md:h-[550px] md:rounded-2xl bg-white shadow-2xl border border-black/10 flex flex-col overflow-hidden md:max-h-[calc(100vh-48px)]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-black/5 bg-white shrink-0">
              <div className="flex items-center gap-2">
                {chatMode ? (
                  <>
                    <ModeIcon size={18} className="text-accent" />
                    <span className="text-sm font-bold text-foreground">{modeLabel}</span>
                  </>
                ) : (
                  <>
                    <MessageCircle size={18} className="text-accent" />
                    <span className="text-sm font-bold text-foreground">AI Chat</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                {chatMode && budgetPct !== null && (
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
                {chatMode && bubbles.length > 0 && (
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

            {/* Mode selection */}
            {!chatMode && (
              <div className="flex-1 flex flex-col items-center justify-center px-5 gap-3">
                <p className="text-sm text-foreground/50">Co potřebuješ?</p>
                <div className="grid grid-cols-2 gap-3 w-full">
                  <button
                    onClick={() => selectMode("pruvodce")}
                    className="rounded-2xl border-2 border-black/8 p-4 flex flex-col items-center gap-2.5 hover:border-accent/30 hover:shadow-sm transition-all group text-center"
                  >
                    <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center shrink-0 group-hover:bg-accent/15 transition-colors">
                      <Sparkles size={18} className="text-accent" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground group-hover:text-accent transition-colors">AI Průvodce</p>
                      <p className="text-[11px] text-foreground/45 mt-0.5">Parťák pro osobní rozvoj</p>
                    </div>
                  </button>
                  <button
                    onClick={() => selectMode("pomocnik")}
                    className="rounded-2xl border-2 border-black/8 p-4 flex flex-col items-center gap-2.5 hover:border-accent/30 hover:shadow-sm transition-all group text-center"
                  >
                    <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center shrink-0 group-hover:bg-accent/15 transition-colors">
                      <MessageCircle size={18} className="text-accent" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground group-hover:text-accent transition-colors">AI Pomocník</p>
                      <p className="text-[11px] text-foreground/45 mt-0.5">Pomůže s webem a nástroji</p>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Chat content — only when mode is selected */}
            {chatMode && (
              <>
                {/* Chat bubbles */}
                <div className="flex-1 overflow-y-auto px-3.5 py-3 space-y-2.5">
                  {pruvodceLoading && (
                    <div className="flex items-center justify-center py-8">
                      <div className="w-5 h-5 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
                    </div>
                  )}
                  {bubbles.length === 0 && !loading && !pruvodceLoading && (
                    <div className="text-center py-8">
                      <ModeIcon size={32} className="mx-auto text-foreground/15 mb-3" />
                      <p className="text-sm text-foreground/40">
                        {chatMode === "pruvodce" ? "Co právě řešíš v životě?" : "Potřebuješ s něčím pomoct?"}
                      </p>
                      <p className="text-xs text-foreground/25 mt-1">
                        {chatMode === "pruvodce" ? "Povídej mi o svých cílech a výzvách..." : "Popiš, co teď řešíš..."}
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
                                <div className="text-sm text-foreground/75 leading-relaxed prose prose-sm prose-neutral max-w-none [&>p]:mb-2 [&>p:last-child]:mb-0 [&>ul]:mb-2 [&>ol]:mb-2 [&>li]:mb-0.5">
                                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{b.text}</ReactMarkdown>
                                </div>
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
                  {error && error !== "no_budget" && (
                    <div className="rounded-lg bg-red-50 border border-red-200 p-2.5 text-xs text-red-700 flex items-start gap-2">
                      <AlertCircle size={14} className="mt-0.5 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <div ref={bottomRef} />
                </div>

                {/* Input */}
                {error !== "no_budget" && (
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
              </>
            )}
          </div>
        </>
      )}
    </>
  );
}

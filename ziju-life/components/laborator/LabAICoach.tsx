"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Send, RotateCcw, AlertCircle, MessageCircle, Check, X } from "lucide-react";

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

interface BudgetInfo { remainingCzk: number; totalBudgetCzk: number; spentCzk: number }

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

interface Props {
  onSelectTool?: (slug: string) => void;
  onDataChanged?: () => void;
}

export default function LabAICoach({ onSelectTool, onDataChanged }: Props) {
  const [message, setMessage] = useState("");
  const [bubbles, setBubbles] = useState<ChatBubble[]>([]);
  const [apiMessages, setApiMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(true);
  const [budget, setBudget] = useState<BudgetInfo | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Load budget on mount
  const loadBudget = useCallback(async () => {
    try {
      const res = await fetch("/api/laborator/ai-credits");
      if (res.ok) {
        const data = await res.json();
        setBudget({ remainingCzk: data.available, totalBudgetCzk: data.total, spentCzk: data.used });
      }
    } catch {}
  }, []);

  useEffect(() => { loadBudget(); }, [loadBudget]);

  // Click outside → collapse
  useEffect(() => {
    if (collapsed) return;
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        if (bubbles.length === 0 && !message.trim()) setCollapsed(true);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [collapsed, bubbles.length, message]);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [bubbles.length, loading]);

  const tryParseJson = (text: string) => {
    const t = (text ?? "").trim();
    const parse = (s: string) => { try { return JSON.parse(s); } catch { return null; } };
    let obj = parse(t);
    if (!obj) { const m = t.match(/```(?:json)?\s*([\s\S]*?)\s*```/); if (m) obj = parse(m[1].trim()); }
    if (!obj) { const bs = t.indexOf("{"), be = t.lastIndexOf("}"); if (bs !== -1 && be > bs) obj = parse(t.slice(bs, be + 1)); }
    return obj;
  };

  const handleSubmit = async () => {
    if (!message.trim() || loading) return;
    setError(null);

    const userText = message.trim();
    const userBubble: ChatBubble = { role: "user", text: userText };
    setBubbles((prev) => [...prev, userBubble]);

    const newApiMsgs = [...apiMessages, { role: "user" as const, content: userText }];
    setApiMessages(newApiMsgs);
    setMessage("");
    setLoading(true);

    try {
      const res = await fetch("/api/laborator/ai-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newApiMsgs }),
      });
      const data = await res.json();

      if (res.status === 402) { setError("no_budget"); setLoading(false); return; }
      if (!res.ok) throw new Error(data.error || "Chyba");

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
      // Map action to user-context API call
      if (action.type === "set_priorities" || action.type === "add_priority") {
        // Load current priorities, apply action, save
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
        const ctxType = "compass";
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
          body: JSON.stringify({ type: ctxType, data: current }),
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

      // Remove action from bubble (mark as confirmed)
      setBubbles((prev) => prev.map((b, i) =>
        i === bubbleIndex
          ? { ...b, actions: b.actions?.filter((a) => a !== action) }
          : b
      ));

      onDataChanged?.();
    } catch (e) {
      console.error("Failed to apply action:", e);
    }
  };

  const dismissAction = (action: AIAction, bubbleIndex: number) => {
    setBubbles((prev) => prev.map((b, i) =>
      i === bubbleIndex
        ? { ...b, actions: b.actions?.filter((a) => a !== action) }
        : b
    ));
  };

  const handleReset = () => {
    setMessage(""); setBubbles([]); setApiMessages([]); setError(null); setLoading(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const expand = () => { setCollapsed(false); setTimeout(() => inputRef.current?.focus(), 100); };

  const budgetPct = budget && budget.totalBudgetCzk > 0
    ? Math.min(100, Math.round((budget.spentCzk / budget.totalBudgetCzk) * 100))
    : null;

  // Collapsed state
  if (collapsed && bubbles.length === 0) {
    return (
      <div className="paper-card rounded-[24px] px-6 py-4 border-2 border-accent/15 cursor-text" onClick={expand}>
        <div className="flex items-center gap-3 text-foreground/40">
          <MessageCircle size={18} className="text-accent/50" />
          <span className="text-sm">Potřebuješ s něčím pomoct?</span>
        </div>
      </div>
    );
  }

  return (
    <div ref={wrapperRef} className="paper-card rounded-[24px] px-5 py-5 md:px-6 md:py-6 border-2 border-accent/15">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <MessageCircle size={18} className="text-accent" />
          <p className="text-sm font-bold text-foreground">Potřebuješ s něčím pomoct?</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Budget progress bar */}
          {budgetPct !== null && (
            <div className="flex items-center gap-1.5" title={`Spotřeba: ${budget!.spentCzk.toFixed(1)} / ${budget!.totalBudgetCzk} Kč`}>
              <div className="w-16 h-1.5 bg-black/10 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${budgetPct}%`, background: budgetPct > 80 ? "#ef4444" : budgetPct > 50 ? "#f59e0b" : "#22c55e" }} />
              </div>
              <span className="text-[10px] text-foreground/35">{budgetPct}%</span>
            </div>
          )}
          {bubbles.length > 0 && (
            <button onClick={handleReset} className="p-1.5 rounded-lg hover:bg-black/5 text-foreground/40 hover:text-foreground/70 transition-colors" title="Nová konverzace">
              <RotateCcw size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Chat bubbles */}
      {bubbles.length > 0 && (
        <div className="space-y-3 mb-4 max-h-[400px] overflow-y-auto">
          {bubbles.map((b, i) => (
            <div key={i}>
              {b.role === "user" ? (
                <div className="flex justify-end">
                  <div className="bg-accent/10 rounded-2xl rounded-br-sm px-4 py-2.5 max-w-[85%]">
                    <p className="text-sm text-foreground/80">{b.text}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {b.text && (
                    <div className="flex justify-start">
                      <div className="bg-black/[0.03] rounded-2xl rounded-bl-sm px-4 py-2.5 max-w-[85%]">
                        <p className="text-sm text-foreground/75 leading-relaxed">{b.text}</p>
                      </div>
                    </div>
                  )}
                  {b.recommendations && b.recommendations.length > 0 && (
                    <div className="flex justify-start">
                      <div className="max-w-[90%] space-y-1.5">
                        <p className="text-[11px] text-foreground/40 ml-1">Mohlo by ti pomoct:</p>
                        {b.recommendations.map((rec, j) => (
                          <button
                            key={rec.slug || rec.id || j}
                            type="button"
                            onClick={() => rec.itemType === "tool" && rec.slug && onSelectTool?.(rec.slug)}
                            className={`w-full text-left rounded-xl border px-3.5 py-2.5 transition-all group hover:shadow-sm ${
                              rec.itemType === "tool" ? "border-emerald-200 hover:border-emerald-300 bg-emerald-50/30" : "border-accent/20 hover:border-accent/40 bg-accent/[0.03]"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-base leading-none">{rec.icon || "📖"}</span>
                              <p className="text-sm font-semibold text-foreground group-hover:text-accent transition-colors">{rec.title}</p>
                            </div>
                            <p className="text-xs text-foreground/50 mt-1 leading-relaxed">{rec.reason}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {b.actions && b.actions.length > 0 && (
                    <div className="flex justify-start">
                      <div className="max-w-[90%] space-y-1.5">
                        <p className="text-[11px] text-foreground/40 ml-1">Navrhované změny:</p>
                        {b.actions.map((action, j) => (
                          <div key={j} className="rounded-xl border border-blue-200 bg-blue-50/50 px-3.5 py-2.5">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-base leading-none">{ACTION_ICONS[action.type] ?? "⚡"}</span>
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold text-foreground">{ACTION_LABELS[action.type] ?? action.type}</p>
                                  <p className="text-[11px] text-foreground/50 truncate">
                                    {action.type === "set_priorities" && Array.isArray(action.items) ? (action.items as string[]).join(", ") : ""}
                                    {action.type === "add_priority" ? String(action.text ?? "") : ""}
                                    {action.type === "set_focus_area" ? String(action.area ?? "") : ""}
                                    {action.type === "update_compass" ? `${action.area}: ${action.current}→${action.goal}` : ""}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <button onClick={() => confirmAction(action, i)} className="p-1.5 rounded-lg bg-accent text-white hover:bg-accent-hover transition-colors" title="Potvrdit">
                                  <Check size={12} />
                                </button>
                                <button onClick={() => dismissAction(action, i)} className="p-1.5 rounded-lg bg-black/5 text-foreground/40 hover:bg-black/10 hover:text-foreground/70 transition-colors" title="Zrušit">
                                  <X size={12} />
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
                      <p className="text-xs text-foreground/45 italic ml-1">{b.closingNote}</p>
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
          <div ref={bottomRef} />
        </div>
      )}

      {/* Errors */}
      {error === "no_budget" && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800 mb-3">
          AI rozpočet je vyčerpaný. Obnoví se s dalším předplatným.
        </div>
      )}
      {error && error !== "no_budget" && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700 flex items-start gap-2 mb-3">
          <AlertCircle size={14} className="mt-0.5 flex-shrink-0" /><span>{error}</span>
        </div>
      )}

      {/* Input — always visible */}
      {error !== "no_budget" && (
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, 2000))}
            placeholder={bubbles.length === 0 ? "Popiš, co teď řešíš..." : "Pokračuj v konverzaci..."}
            className="flex-1 px-3.5 py-2.5 border border-black/10 rounded-xl bg-white/80 text-sm min-h-[40px] max-h-[100px] resize-y focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
            disabled={loading}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
          />
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!message.trim() || loading}
            className="p-2.5 rounded-xl bg-accent text-white hover:bg-accent-hover disabled:opacity-40 transition-colors shrink-0"
          >
            <Send size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, X, Check, ChevronDown, ChevronUp } from "lucide-react";

interface TodoItem { text: string; done: boolean }

const MAX_ITEMS = 3;

function TodoSection({
  label,
  items,
  onToggle,
  onAdd,
  onRemove,
  accent = false,
}: {
  label: string;
  items: TodoItem[];
  onToggle: (i: number) => void;
  onAdd: (text: string) => void;
  onRemove: (i: number) => void;
  accent?: boolean;
}) {
  const [adding, setAdding] = useState(false);
  const [text, setText] = useState("");

  const handleAdd = () => {
    if (text.trim()) { onAdd(text.trim()); setText(""); setAdding(false); }
  };

  return (
    <div>
      <p className={`text-[11px] font-semibold uppercase tracking-wider mb-2 ${accent ? "text-accent/60" : "text-foreground/40"}`}>
        {label} <span className="normal-case tracking-normal font-normal">({items.length}/{MAX_ITEMS})</span>
      </p>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 group">
            <button
              onClick={() => onToggle(i)}
              className={`mt-0.5 w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${
                item.done
                  ? accent ? "bg-accent border-accent text-white" : "bg-emerald-500 border-emerald-500 text-white"
                  : "border-black/20 hover:border-accent/50"
              }`}
            >
              {item.done && <Check size={10} />}
            </button>
            <span className={`text-sm flex-1 leading-snug ${item.done ? "line-through text-foreground/35" : "text-foreground/70"}`}>
              {item.text}
            </span>
            <button onClick={() => onRemove(i)} className="opacity-0 group-hover:opacity-100 p-0.5 text-foreground/30 hover:text-red-500 transition-all">
              <X size={12} />
            </button>
          </li>
        ))}
      </ul>
      {items.length < MAX_ITEMS && (
        adding ? (
          <div className="flex items-center gap-1.5 mt-1.5">
            <input
              autoFocus
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") { setAdding(false); setText(""); } }}
              placeholder="..."
              className="flex-1 text-sm px-2 py-1 border border-black/10 rounded-lg bg-white/80 focus:ring-1 focus:ring-accent/30 focus:border-accent"
            />
            <button onClick={handleAdd} className="p-1 text-accent"><Check size={14} /></button>
            <button onClick={() => { setAdding(false); setText(""); }} className="p-1 text-foreground/30"><X size={14} /></button>
          </div>
        ) : (
          <button onClick={() => setAdding(true)} className="flex items-center gap-1 text-xs text-foreground/35 hover:text-accent mt-1.5 transition-colors">
            <Plus size={12} /> Přidat
          </button>
        )
      )}
    </div>
  );
}

export default function DailyTodosWidget() {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [niceTodos, setNiceTodos] = useState<TodoItem[]>([]);
  const [yesterdayTodos, setYesterdayTodos] = useState<TodoItem[]>([]);
  const [yesterdayNice, setYesterdayNice] = useState<TodoItem[]>([]);
  const [showYesterday, setShowYesterday] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/laborator/daily-todos");
        if (res.ok) {
          const d = await res.json();
          setTodos(d.today?.todos ?? []);
          setNiceTodos(d.today?.niceTodos ?? []);
          setYesterdayTodos(d.yesterday?.todos ?? []);
          setYesterdayNice(d.yesterday?.niceTodos ?? []);
        }
      } catch {}
      setLoaded(true);
    })();
  }, []);

  const save = useCallback(async (newTodos: TodoItem[], newNice: TodoItem[]) => {
    setTodos(newTodos);
    setNiceTodos(newNice);
    try {
      await fetch("/api/laborator/daily-todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ todos: newTodos, niceTodos: newNice }),
      });
    } catch {}
  }, []);

  if (!loaded) return null;

  const hasYesterday = yesterdayTodos.length > 0 || yesterdayNice.length > 0;

  return (
    <div className="paper-card rounded-[20px] px-5 py-5 space-y-4">
      <h3 className="text-sm font-bold text-foreground">Dnešek</h3>

      <div className="space-y-4">
        <TodoSection
          label="To Do"
          items={todos}
          onToggle={(i) => save(todos.map((t, j) => j === i ? { ...t, done: !t.done } : t), niceTodos)}
          onAdd={(text) => save([...todos, { text, done: false }], niceTodos)}
          onRemove={(i) => save(todos.filter((_, j) => j !== i), niceTodos)}
        />
        <TodoSection
          label="Nice To Do"
          items={niceTodos}
          onToggle={(i) => save(todos, niceTodos.map((t, j) => j === i ? { ...t, done: !t.done } : t))}
          onAdd={(text) => save(todos, [...niceTodos, { text, done: false }])}
          onRemove={(i) => save(todos, niceTodos.filter((_, j) => j !== i))}
          accent
        />
      </div>

      {hasYesterday && (
        <div className="border-t border-black/5 pt-3">
          <button
            onClick={() => setShowYesterday(!showYesterday)}
            className="flex items-center gap-1.5 text-xs text-foreground/40 hover:text-foreground/60 transition-colors"
          >
            {showYesterday ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            Včera
          </button>
          {showYesterday && (
            <div className="space-y-2 mt-2 opacity-60">
              <div>
                {yesterdayTodos.map((t, i) => (
                  <p key={i} className={`text-xs leading-snug ${t.done ? "line-through text-foreground/30" : "text-foreground/50"}`}>
                    {t.done ? "✓" : "○"} {t.text}
                  </p>
                ))}
              </div>
              <div>
                {yesterdayNice.map((t, i) => (
                  <p key={i} className={`text-xs leading-snug ${t.done ? "line-through text-foreground/30" : "text-foreground/50"}`}>
                    {t.done ? "✓" : "○"} {t.text}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

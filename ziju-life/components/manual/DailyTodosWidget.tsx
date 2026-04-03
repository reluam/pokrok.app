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
}: {
  label: string;
  items: TodoItem[];
  onToggle: (i: number) => void;
  onAdd: (text: string) => void;
  onRemove: (i: number) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [text, setText] = useState("");

  const handleAdd = () => {
    if (text.trim()) { onAdd(text.trim()); setText(""); setAdding(false); }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-base font-bold text-foreground/60 uppercase tracking-wider">{label}</p>
        <span className="text-lg text-foreground/30 font-medium">{items.length}/{MAX_ITEMS}</span>
      </div>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-3 group">
            <button
              onClick={() => onToggle(i)}
              className={`w-6 h-6 rounded-lg border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                item.done
                  ? "bg-accent border-accent text-white"
                  : "border-black/15 hover:border-accent/50"
              }`}
            >
              {item.done && <Check size={14} strokeWidth={3} />}
            </button>
            <span className={`text-base flex-1 leading-snug ${item.done ? "line-through text-foreground/30" : "text-foreground/80"}`}>
              {item.text}
            </span>
            <button onClick={() => onRemove(i)} className="opacity-0 group-hover:opacity-100 p-1 text-foreground/25 hover:text-red-500 transition-all">
              <X size={14} />
            </button>
          </li>
        ))}
      </ul>
      {items.length < MAX_ITEMS && (
        adding ? (
          <div className="flex items-center gap-2">
            <input
              autoFocus
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") { setAdding(false); setText(""); } }}
              placeholder="..."
              className="flex-1 text-base px-4 py-2.5 border border-black/10 rounded-xl bg-white focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none"
            />
            <button onClick={handleAdd} className="p-2 text-accent"><Check size={18} /></button>
            <button onClick={() => { setAdding(false); setText(""); }} className="p-2 text-foreground/30"><X size={18} /></button>
          </div>
        ) : (
          <button onClick={() => setAdding(true)} className="flex items-center gap-2 text-base font-medium text-accent/60 hover:text-accent transition-colors py-1">
            <Plus size={16} /> Přidat
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

  const loadTodos = useCallback(async () => {
    try {
      const res = await fetch("/api/manual/daily-todos");
      if (res.ok) {
        const d = await res.json();
        setTodos(d.today?.todos ?? []);
        setNiceTodos(d.today?.niceTodos ?? []);
        setYesterdayTodos(d.yesterday?.todos ?? []);
        setYesterdayNice(d.yesterday?.niceTodos ?? []);
      }
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => { loadTodos(); }, [loadTodos]);

  useEffect(() => {
    const interval = setInterval(loadTodos, 3 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadTodos]);

  const save = useCallback(async (newTodos: TodoItem[], newNice: TodoItem[]) => {
    setTodos(newTodos);
    setNiceTodos(newNice);
    try {
      await fetch("/api/manual/daily-todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ todos: newTodos, niceTodos: newNice }),
      });
    } catch {}
  }, []);

  if (!loaded) return null;

  const hasYesterday = yesterdayTodos.length > 0 || yesterdayNice.length > 0;

  return (
    <div className="bg-white border border-black/8 rounded-[24px] px-7 py-7 space-y-6">
      <h3 className="text-xl font-extrabold text-foreground">Dnešek</h3>

      <div className="space-y-6 divide-y divide-black/5">
        <TodoSection
          label="To Do"
          items={todos}
          onToggle={(i) => save(todos.map((t, j) => j === i ? { ...t, done: !t.done } : t), niceTodos)}
          onAdd={(text) => save([...todos, { text, done: false }], niceTodos)}
          onRemove={(i) => save(todos.filter((_, j) => j !== i), niceTodos)}
        />
        <div className="pt-6">
          <TodoSection
            label="Nice To Do"
            items={niceTodos}
            onToggle={(i) => save(todos, niceTodos.map((t, j) => j === i ? { ...t, done: !t.done } : t))}
            onAdd={(text) => save(todos, [...niceTodos, { text, done: false }])}
            onRemove={(i) => save(todos, niceTodos.filter((_, j) => j !== i))}
          />
        </div>
      </div>

      {hasYesterday && (
        <div className="border-t border-black/5 pt-4">
          <button
            onClick={() => setShowYesterday(!showYesterday)}
            className="flex items-center gap-1.5 text-base text-foreground/40 hover:text-foreground/60 transition-colors"
          >
            {showYesterday ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            Včera
          </button>
          {showYesterday && (
            <div className="space-y-3 mt-3 opacity-60">
              <ul className="space-y-1">
                {yesterdayTodos.map((t, i) => (
                  <li key={i} className={`text-base leading-snug ${t.done ? "line-through text-foreground/30" : "text-foreground/50"}`}>
                    {t.done ? "✓" : "○"} {t.text}
                  </li>
                ))}
              </ul>
              <ul className="space-y-1">
                {yesterdayNice.map((t, i) => (
                  <li key={i} className={`text-base leading-snug ${t.done ? "line-through text-foreground/30" : "text-foreground/50"}`}>
                    {t.done ? "✓" : "○"} {t.text}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

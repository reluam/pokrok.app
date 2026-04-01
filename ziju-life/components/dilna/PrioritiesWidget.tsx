"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, X, Check, Pencil } from "lucide-react";

interface PriorityItem {
  text: string;
  done: boolean;
}

export interface PrioritiesData {
  weekly: PriorityItem[];
  monthly: PriorityItem[];
  yearly: PriorityItem[];
}

interface Props {
  data?: PrioritiesData | null;
  onChange?: (data: PrioritiesData) => void;
}

const EMPTY: PrioritiesData = { weekly: [], monthly: [], yearly: [] };

const SCOPE_CONFIG: Record<string, { label: string; max: number }> = {
  weekly: { label: "Tento týden", max: 3 },
  monthly: { label: "Tento měsíc", max: 4 },
  yearly: { label: "Tento rok", max: 5 },
};

function PrioritySection({
  scope,
  items,
  maxItems,
  onToggle,
  onAdd,
  onRemove,
  onEdit,
}: {
  scope: string;
  items: PriorityItem[];
  maxItems: number;
  onToggle: (index: number) => void;
  onAdd: (text: string) => void;
  onRemove: (index: number) => void;
  onEdit: (index: number, text: string) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [newText, setNewText] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const activeCount = items.filter(i => !i.done).length;
  const canAdd = activeCount < maxItems;

  const handleAdd = () => {
    if (newText.trim()) {
      onAdd(newText.trim());
      setNewText("");
      setAdding(false);
    }
  };

  const activeItems = items.filter(i => !i.done);
  const doneItems = items.filter(i => i.done);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-foreground/60 uppercase tracking-wider">
          {SCOPE_CONFIG[scope]?.label ?? scope}
        </p>
        <span className="text-xs text-foreground/30 font-medium">{activeCount}/{maxItems}</span>
      </div>

      {items.length === 0 && !adding && (
        <p className="text-base text-foreground/30 italic py-1">Na čem se chceš soustředit?</p>
      )}

      {/* Active priorities */}
      <ul className="space-y-2.5">
        {activeItems.map((item) => {
          const i = items.indexOf(item);
          const isEditing = editingIndex === i;
          return (
            <li key={i} className="flex items-center gap-3 group bg-accent/5 rounded-xl px-4 py-3 border border-accent/10">
              <button
                onClick={() => onToggle(i)}
                className="w-6 h-6 rounded-lg border-2 border-accent/30 flex-shrink-0 flex items-center justify-center hover:border-accent hover:bg-accent/10 transition-colors"
              >
              </button>
              {isEditing ? (
                <input
                  autoFocus
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && editText.trim()) { onEdit(i, editText.trim()); setEditingIndex(null); }
                    if (e.key === "Escape") setEditingIndex(null);
                  }}
                  onBlur={() => { if (editText.trim()) onEdit(i, editText.trim()); setEditingIndex(null); }}
                  className="text-base font-medium flex-1 bg-transparent outline-none border-b border-accent/30 focus:border-accent py-0"
                />
              ) : (
                <span
                  className="text-base font-medium flex-1 text-foreground cursor-pointer"
                  onDoubleClick={() => { setEditingIndex(i); setEditText(item.text); }}
                >
                  {item.text}
                </span>
              )}
              <button
                onClick={() => { setEditingIndex(i); setEditText(item.text); }}
                className="opacity-0 group-hover:opacity-100 p-1 text-foreground/25 hover:text-accent transition-all"
              >
                <Pencil size={13} />
              </button>
              <button
                onClick={() => onRemove(i)}
                className="opacity-0 group-hover:opacity-100 p-1 text-foreground/25 hover:text-red-500 transition-all"
              >
                <X size={14} />
              </button>
            </li>
          );
        })}
      </ul>

      {/* Done priorities */}
      {doneItems.length > 0 && (
        <ul className="space-y-1.5">
          {doneItems.map((item) => {
            const i = items.indexOf(item);
            return (
              <li key={i} className="flex items-center gap-3 group px-4 py-2">
                <button
                  onClick={() => onToggle(i)}
                  className="w-6 h-6 rounded-lg bg-accent border-2 border-accent flex-shrink-0 flex items-center justify-center"
                >
                  <Check size={14} strokeWidth={3} className="text-white" />
                </button>
                <span className="text-sm flex-1 line-through text-foreground/30">
                  {item.text}
                </span>
                <button
                  onClick={() => onRemove(i)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-foreground/25 hover:text-red-500 transition-all"
                >
                  <X size={14} />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {adding ? (
        <div className="flex items-center gap-2">
          <input
            autoFocus
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") { setAdding(false); setNewText(""); } }}
            placeholder="Na co se chci soustředit..."
            className="flex-1 text-base px-4 py-2.5 border border-black/10 rounded-xl bg-white focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none"
          />
          <button onClick={handleAdd} className="p-2 text-accent hover:text-accent-hover"><Check size={18} /></button>
          <button onClick={() => { setAdding(false); setNewText(""); }} className="p-2 text-foreground/30 hover:text-foreground/60"><X size={18} /></button>
        </div>
      ) : canAdd ? (
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-2 text-sm font-medium text-accent/60 hover:text-accent transition-colors py-1"
        >
          <Plus size={16} /> Přidat prioritu
        </button>
      ) : null}
    </div>
  );
}

export default function PrioritiesWidget({ data: externalData, onChange }: Props) {
  const [data, setData] = useState<PrioritiesData>(externalData ?? EMPTY);
  const [loaded, setLoaded] = useState(!!externalData);

  const loadPriorities = useCallback(async () => {
    if (externalData) { setData(externalData); setLoaded(true); return; }
    try {
      const res = await fetch("/api/dilna/user-context");
      if (res.ok) {
        const d = await res.json();
        if (d.context?.priorities) setData(d.context.priorities);
      }
    } catch {}
    setLoaded(true);
  }, [externalData]);

  useEffect(() => { loadPriorities(); }, [loadPriorities]);

  useEffect(() => {
    if (externalData) return;
    const interval = setInterval(loadPriorities, 3 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadPriorities, externalData]);

  const save = useCallback(async (newData: PrioritiesData) => {
    setData(newData);
    onChange?.(newData);
    try {
      await fetch("/api/dilna/user-context", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "priorities", data: newData }),
      });
    } catch {}
  }, [onChange]);

  const handleToggle = (scope: keyof PrioritiesData, index: number) => {
    const newData = { ...data, [scope]: data[scope].map((item, i) => i === index ? { ...item, done: !item.done } : item) };
    save(newData);
  };

  const handleAdd = (scope: keyof PrioritiesData, text: string) => {
    const activeCount = data[scope].filter(i => !i.done).length;
    if (activeCount >= SCOPE_CONFIG[scope].max) return;
    const newData = { ...data, [scope]: [...data[scope], { text, done: false }] };
    save(newData);
  };

  const handleRemove = (scope: keyof PrioritiesData, index: number) => {
    const newData = { ...data, [scope]: data[scope].filter((_, i) => i !== index) };
    save(newData);
  };

  const handleEdit = (scope: keyof PrioritiesData, index: number, text: string) => {
    const newData = { ...data, [scope]: data[scope].map((item, i) => i === index ? { ...item, text } : item) };
    save(newData);
  };

  if (!loaded) return null;

  return (
    <div className="bg-white border border-black/8 rounded-[24px] px-7 py-7 space-y-7">
      <div>
        <h3 className="text-xl font-extrabold text-foreground">Priority</h3>
        <p className="text-sm text-foreground/40 mt-0.5">Na co se soustředím</p>
      </div>
      <div className="space-y-7 divide-y divide-black/5">
        {(["weekly", "monthly", "yearly"] as const).map((scope) => (
          <div key={scope} className={scope !== "weekly" ? "pt-7" : ""}>
            <PrioritySection
              scope={scope}
              items={data[scope]}
              maxItems={SCOPE_CONFIG[scope].max}
              onToggle={(i) => handleToggle(scope, i)}
              onAdd={(text) => handleAdd(scope, text)}
              onRemove={(i) => handleRemove(scope, i)}
              onEdit={(i, text) => handleEdit(scope, i, text)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

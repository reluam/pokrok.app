"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, X, Check } from "lucide-react";

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

const SCOPE_LABELS: Record<string, string> = {
  weekly: "Tento týden",
  monthly: "Tento měsíc",
  yearly: "Tento rok",
};

function PrioritySection({
  scope,
  items,
  onToggle,
  onAdd,
  onRemove,
}: {
  scope: string;
  items: PriorityItem[];
  onToggle: (index: number) => void;
  onAdd: (text: string) => void;
  onRemove: (index: number) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [newText, setNewText] = useState("");

  const handleAdd = () => {
    if (newText.trim()) {
      onAdd(newText.trim());
      setNewText("");
      setAdding(false);
    }
  };

  return (
    <div>
      <p className="text-[11px] font-semibold text-foreground/40 uppercase tracking-wider mb-2">
        {SCOPE_LABELS[scope] ?? scope}
      </p>
      {items.length === 0 && !adding && (
        <p className="text-xs text-foreground/30 italic mb-1">Zatím žádné priority</p>
      )}
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 group">
            <button
              onClick={() => onToggle(i)}
              className={`mt-0.5 w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${
                item.done
                  ? "bg-accent border-accent text-white"
                  : "border-black/20 hover:border-accent/50"
              }`}
            >
              {item.done && <Check size={10} />}
            </button>
            <span className={`text-sm flex-1 leading-snug ${item.done ? "line-through text-foreground/35" : "text-foreground/70"}`}>
              {item.text}
            </span>
            <button
              onClick={() => onRemove(i)}
              className="opacity-0 group-hover:opacity-100 p-0.5 text-foreground/30 hover:text-red-500 transition-all"
            >
              <X size={12} />
            </button>
          </li>
        ))}
      </ul>
      {adding ? (
        <div className="flex items-center gap-1.5 mt-1.5">
          <input
            autoFocus
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") { setAdding(false); setNewText(""); } }}
            placeholder="Nová priorita..."
            className="flex-1 text-sm px-2 py-1 border border-black/10 rounded-lg bg-white/80 focus:ring-1 focus:ring-accent/30 focus:border-accent"
          />
          <button onClick={handleAdd} className="p-1 text-accent hover:text-accent-hover"><Check size={14} /></button>
          <button onClick={() => { setAdding(false); setNewText(""); }} className="p-1 text-foreground/30 hover:text-foreground/60"><X size={14} /></button>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1 text-xs text-foreground/35 hover:text-accent mt-1.5 transition-colors"
        >
          <Plus size={12} /> Přidat
        </button>
      )}
    </div>
  );
}

export default function PrioritiesWidget({ data: externalData, onChange }: Props) {
  const [data, setData] = useState<PrioritiesData>(externalData ?? EMPTY);
  const [loaded, setLoaded] = useState(!!externalData);

  // Load from API if no external data provided
  useEffect(() => {
    if (externalData) { setData(externalData); setLoaded(true); return; }
    (async () => {
      try {
        const res = await fetch("/api/laborator/user-context");
        if (res.ok) {
          const d = await res.json();
          if (d.context?.priorities) setData(d.context.priorities);
        }
      } catch {}
      setLoaded(true);
    })();
  }, [externalData]);

  const save = useCallback(async (newData: PrioritiesData) => {
    setData(newData);
    onChange?.(newData);
    try {
      await fetch("/api/laborator/user-context", {
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
    const newData = { ...data, [scope]: [...data[scope], { text, done: false }] };
    save(newData);
  };

  const handleRemove = (scope: keyof PrioritiesData, index: number) => {
    const newData = { ...data, [scope]: data[scope].filter((_, i) => i !== index) };
    save(newData);
  };

  if (!loaded) return null;

  return (
    <div className="paper-card rounded-[20px] px-5 py-5 space-y-4">
      <h3 className="text-sm font-bold text-foreground">Priority</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {(["weekly", "monthly", "yearly"] as const).map((scope) => (
          <PrioritySection
            key={scope}
            scope={scope}
            items={data[scope]}
            onToggle={(i) => handleToggle(scope, i)}
            onAdd={(text) => handleAdd(scope, text)}
            onRemove={(i) => handleRemove(scope, i)}
          />
        ))}
      </div>
    </div>
  );
}

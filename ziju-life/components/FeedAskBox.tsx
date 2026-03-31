"use client";

import { useState, useRef } from "react";
import { Search, ArrowRight, Loader2 } from "lucide-react";

interface FeedAskBoxProps {
  onAsk: (question: string) => void;
  loading?: boolean;
  initialValue?: string;
}

const EXAMPLE_QUESTIONS = [
  "Jak zlepšit kvalitu spánku?",
  "Jaké jsou nejdůležitější denní rituály?",
  "Jak se zbavit prokrastinace?",
];

export default function FeedAskBox({ onAsk, loading, initialValue = "" }: FeedAskBoxProps) {
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const q = value.trim();
    if (!q || loading) return;
    onAsk(q);
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex items-center gap-3 bg-white rounded-2xl border-2 border-black/10 px-5 py-4 shadow-sm focus-within:border-accent/50 focus-within:shadow-md transition-all">
          <Search size={20} className="text-foreground/30 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Zeptej se na cokoliv..."
            className="flex-1 bg-transparent text-foreground placeholder:text-foreground/40 text-base outline-none"
            disabled={loading}
            autoFocus
          />
          <button
            type="submit"
            disabled={!value.trim() || loading}
            className="shrink-0 w-9 h-9 flex items-center justify-center rounded-xl bg-accent text-white disabled:opacity-30 hover:bg-accent-hover transition-colors"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <ArrowRight size={18} />
            )}
          </button>
        </div>
      </form>

      {!initialValue && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {EXAMPLE_QUESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => {
                setValue(q);
                onAsk(q);
              }}
              disabled={loading}
              className="px-3 py-1.5 text-xs rounded-full border border-black/10 text-foreground/60 hover:border-accent/40 hover:text-accent transition-colors disabled:opacity-40"
            >
              {q}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

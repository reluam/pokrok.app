"use client";

import { useState, useCallback, createContext, useContext, type ReactNode } from "react";
import { Printer } from "lucide-react";

// Context to let edit content close itself
const DoneContext = createContext<(() => void) | null>(null);
export function useDashboardDone() {
  return useContext(DoneContext);
}

export function DashboardCard({
  emoji,
  title,
  children,
  editContent,
  isEmpty,
  emptyCta = "Začít cvičení →",
  emptyDescription,
  onPrint,
}: {
  emoji: string;
  title: string;
  children: ReactNode;
  editContent?: ReactNode;
  isEmpty?: boolean;
  emptyCta?: string;
  emptyDescription?: string;
  onPrint?: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const done = useCallback(() => setEditing(false), []);

  // If empty and has edit content, start in edit mode when CTA is clicked
  if (isEmpty && editContent) {
    return (
      <div className="rounded-[24px] border border-black/[0.08] bg-white/65 backdrop-blur-sm shadow-sm px-5 py-5">
        {editing ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">{emoji}</span>
                <h3 className="text-base font-bold text-foreground">{title}</h3>
              </div>
              <button
                onClick={() => setEditing(false)}
                className="text-sm text-foreground/40 hover:text-foreground/60 transition-colors"
              >
                Zavřít
              </button>
            </div>
            <DoneContext.Provider value={done}>
              {editContent}
            </DoneContext.Provider>
          </div>
        ) : (
          <div className="text-center py-4 space-y-2">
            <span className="text-2xl">{emoji}</span>
            <p className="text-base font-semibold text-foreground">{title}</p>
            {emptyDescription && (
              <p className="text-sm text-foreground/45 leading-relaxed max-w-xs mx-auto">{emptyDescription}</p>
            )}
            <button
              onClick={() => setEditing(true)}
              className="text-base text-accent font-semibold hover:opacity-80 transition-opacity"
            >
              {emptyCta}
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-[24px] border border-black/[0.08] bg-white/65 backdrop-blur-sm shadow-sm px-5 py-5">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{emoji}</span>
            <h3 className="text-base font-bold text-foreground">{title}</h3>
          </div>
          <div className="flex items-center gap-2">
            {onPrint && !editing && (
              <button
                onClick={onPrint}
                className="text-foreground/30 hover:text-foreground/60 transition-colors"
                title="Vytisknout"
              >
                <Printer size={14} />
              </button>
            )}
            {editContent && (
              <button
                onClick={() => setEditing(!editing)}
                className="text-sm text-foreground/40 hover:text-foreground/60 transition-colors"
              >
                {editing ? "Zavřít" : "Upravit"}
              </button>
            )}
          </div>
        </div>
        <DoneContext.Provider value={done}>
          {editing && editContent ? editContent : children}
        </DoneContext.Provider>
      </div>
    </div>
  );
}

export function DashboardSection({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="px-1">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground/35">
          {title}
        </h2>
        {description && (
          <p className="text-sm text-foreground/35 mt-0.5">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}

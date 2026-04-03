"use client";

import { useState, type ReactNode } from "react";

export function DashboardCard({
  emoji,
  title,
  children,
  editContent,
  isEmpty,
  emptyCta = "Začít cvičení →",
}: {
  emoji: string;
  title: string;
  children: ReactNode;
  editContent?: ReactNode;
  isEmpty?: boolean;
  emptyCta?: string;
}) {
  const [editing, setEditing] = useState(false);

  // If empty and has edit content, start in edit mode when CTA is clicked
  if (isEmpty && editContent) {
    return (
      <div className="rounded-[24px] border border-black/[0.08] bg-white/65 backdrop-blur-sm shadow-sm px-5 py-5">
        {editing ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">{emoji}</span>
                <h3 className="text-sm font-bold text-foreground">{title}</h3>
              </div>
              <button
                onClick={() => setEditing(false)}
                className="text-xs text-foreground/40 hover:text-foreground/60 transition-colors"
              >
                Zavřít
              </button>
            </div>
            {editContent}
          </div>
        ) : (
          <div className="text-center py-4 space-y-2">
            <span className="text-2xl">{emoji}</span>
            <p className="text-sm font-semibold text-foreground">{title}</p>
            <button
              onClick={() => setEditing(true)}
              className="text-sm text-accent font-semibold hover:opacity-80 transition-opacity"
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
            <h3 className="text-sm font-bold text-foreground">{title}</h3>
          </div>
          {editContent && (
            <button
              onClick={() => setEditing(!editing)}
              className="text-xs text-foreground/40 hover:text-foreground/60 transition-colors"
            >
              {editing ? "Zavřít" : "Upravit"}
            </button>
          )}
        </div>
        {editing && editContent ? editContent : children}
      </div>
    </div>
  );
}

export function DashboardSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-3">
      <h2 className="text-[11px] font-semibold uppercase tracking-wider text-foreground/35 px-1">
        {title}
      </h2>
      {children}
    </div>
  );
}

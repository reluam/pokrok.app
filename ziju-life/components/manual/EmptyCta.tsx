"use client";

import Link from "next/link";

export function EmptyCta({ emoji, title, description, buttonLabel, onClick, href }: {
  emoji: string; title: string; description: string;
  buttonLabel: string; onClick?: () => void; href?: string;
}) {
  const cls = "inline-flex items-center gap-2 px-5 py-2.5 bg-accent text-white rounded-full font-semibold text-sm hover:bg-accent-hover transition-colors";
  return (
    <div className="bg-white border border-black/8 rounded-[24px] px-6 py-8 text-center space-y-3">
      <p className="text-4xl">{emoji}</p>
      <div>
        <p className="font-bold text-foreground">{title}</p>
        <p className="text-sm text-foreground/55 mt-1">{description}</p>
      </div>
      {href ? <Link href={href} className={cls}>{buttonLabel}</Link>
        : <button onClick={onClick} className={cls}>{buttonLabel}</button>}
    </div>
  );
}

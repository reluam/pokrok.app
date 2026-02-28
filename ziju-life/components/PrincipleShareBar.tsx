"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

const X_ICON = (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

export default function PrincipleShareBar({
  title,
  shortDescription,
  slug,
}: {
  title: string;
  shortDescription: string;
  slug: string;
}) {
  const [copied, setCopied] = useState(false);

  const getShareUrl = () => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/principy/${slug}`;
  };

  const handleCopy = async () => {
    const url = getShareUrl();
    const text = [title, shortDescription, url].filter(Boolean).join("\n\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleShareX = () => {
    const url = getShareUrl();
    const text = `${title} @ziju_life`;
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(tweetUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="flex flex-wrap items-center gap-3 pt-2">
      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-black/10 bg-black/5 text-sm font-medium text-foreground/80 hover:bg-black/10 hover:text-foreground transition-colors"
      >
        {copied ? (
          <>
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Zkopírováno</span>
          </>
        ) : (
          <>
            <Copy className="w-4 h-4" />
            <span>Zkopírovat princip</span>
          </>
        )}
      </button>
      <button
        type="button"
        onClick={handleShareX}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-black/10 bg-black/5 text-sm font-medium text-foreground/80 hover:bg-black/10 hover:text-foreground transition-colors"
      >
        {X_ICON}
        <span>Sdílet na X</span>
      </button>
    </div>
  );
}

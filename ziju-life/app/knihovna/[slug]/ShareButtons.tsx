"use client";

import { useState } from "react";
import { Share2, Check, Link as LinkIcon } from "lucide-react";

export default function ShareButtons({ title, slug }: { title: string; slug: string }) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== "undefined" ? `${window.location.origin}/feed/${slug}` : `/feed/${slug}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleX = () => {
    const text = encodeURIComponent(`${title}\n\n${url}`);
    window.open(`https://twitter.com/intent/tweet?text=${text}`, "_blank", "width=600,height=400");
  };

  const handleNative = () => {
    if (navigator.share) {
      navigator.share({ title, url }).catch(() => {});
    }
  };

  const hasNativeShare = typeof navigator !== "undefined" && !!navigator.share;

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <span className="text-sm font-semibold text-foreground/40 flex items-center gap-1.5">
        <Share2 size={14} />
        Sdílet
      </span>

      <button
        onClick={handleCopy}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-black/10 text-sm font-medium text-foreground/70 hover:border-accent/40 hover:text-accent transition-colors"
      >
        {copied ? <Check size={14} className="text-green-500" /> : <LinkIcon size={14} />}
        {copied ? "Zkopírováno!" : "Kopírovat odkaz"}
      </button>

      <button
        onClick={handleX}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-black/10 text-sm font-medium text-foreground/70 hover:border-accent/40 hover:text-accent transition-colors"
      >
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.259 5.631 5.905-5.631zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
        Sdílet na X
      </button>

      {hasNativeShare && (
        <button
          onClick={handleNative}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-black/10 text-sm font-medium text-foreground/70 hover:border-accent/40 hover:text-accent transition-colors"
        >
          📤 Sdílet přes…
        </button>
      )}
    </div>
  );
}

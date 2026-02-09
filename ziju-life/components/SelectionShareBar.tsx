"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Copy, Check } from "lucide-react";
import { createPortal } from "react-dom";

type SelectionState = {
  text: string;
  rect: DOMRect;
} | null;

export function SelectionShareBar({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const [selection, setSelection] = useState<SelectionState>(null);
  const [copied, setCopied] = useState(false);

  const hideBar = useCallback(() => {
    setSelection(null);
    setCopied(false);
    if (typeof window !== "undefined") {
      const sel = window.getSelection();
      if (sel) sel.removeAllRanges();
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    if (typeof window === "undefined" || !containerRef.current) return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const text = sel.toString().trim();
    if (!text) {
      setSelection(null);
      return;
    }
    const range = sel.getRangeAt(0);
    if (!containerRef.current.contains(range.commonAncestorContainer)) {
      setSelection(null);
      return;
    }
    const rect = range.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) {
      setSelection(null);
      return;
    }
    setSelection({ text, rect });
  }, []);

  const handleDocumentPointerDown = useCallback(
    (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (barRef.current?.contains(target)) return;
      if (selection) hideBar();
    },
    [selection, hideBar]
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.addEventListener("mouseup", handleMouseUp);
    container.addEventListener("touchend", handleMouseUp, { passive: true });
    return () => {
      container.removeEventListener("mouseup", handleMouseUp);
      container.removeEventListener("touchend", handleMouseUp);
    };
  }, [handleMouseUp]);

  useEffect(() => {
    if (!selection) return;
    const onPointerDown = (e: MouseEvent | TouchEvent) =>
      handleDocumentPointerDown(e);
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown, { passive: true });
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
    };
  }, [selection, handleDocumentPointerDown]);

  const shareUrl =
    typeof window !== "undefined" ? window.location.href : "";

  /** Text + prázdný řádek + odkaz (pro kopírování i sdílení) */
  const copyPayload = selection?.text
    ? `${selection.text}\n\n${shareUrl}`
    : shareUrl;

  const copyText = useCallback(async () => {
    if (!copyPayload) return;
    try {
      await navigator.clipboard.writeText(copyPayload);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  }, [copyPayload]);

  const openShare = useCallback(
    (url: string) => {
      window.open(url, "_blank", "noopener,noreferrer,width=600,height=400");
    },
    []
  );

  /** Formát jako Tim Ferriss: citát + „z webu (odkaz) from @zijulife“ */
  const shareTweetText = selection?.text
    ? `${selection.text}\n\nz webu (${shareUrl}) from @zijulife`
    : `z webu (${shareUrl}) from @zijulife`;

  const shareTwitter = useCallback(() => {
    openShare(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTweetText)}`
    );
  }, [shareTweetText, openShare]);

  const BAR_HEIGHT = 52;
  const BAR_WIDTH = 180;
  const topSpace = selection ? selection.rect.top : 0;
  const showAbove = topSpace >= BAR_HEIGHT + 16;
  const barTop = selection
    ? showAbove
      ? selection.rect.top - BAR_HEIGHT - 8
      : selection.rect.bottom + 8
    : 0;
  const barLeft = selection
    ? Math.max(
        12,
        Math.min(
          selection.rect.left + selection.rect.width / 2 - BAR_WIDTH / 2,
          typeof window !== "undefined" ? window.innerWidth - BAR_WIDTH - 12 : 0
        )
      )
    : 0;

  const bar = selection && (
    <div
      ref={barRef}
      className="fixed z-50 flex items-center gap-1 p-1.5 bg-foreground text-background rounded-xl shadow-lg border border-black/10"
      style={{
        left: barLeft,
        top: barTop,
      }}
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={copyText}
        className="flex items-center gap-1.5 py-2 px-2.5 rounded-lg hover:bg-white/20 transition-colors"
        aria-label="Kopírovat označený text"
      >
        {copied ? (
          <Check className="w-5 h-5 text-green-300 shrink-0" />
        ) : (
          <Copy className="w-5 h-5 shrink-0" />
        )}
        <span className="text-xs text-white/90">Kopírovat</span>
      </button>
      <span className="w-px h-5 bg-white/30" aria-hidden />
      <button
        type="button"
        onClick={shareTwitter}
        className="flex items-center gap-1.5 py-2 px-2.5 rounded-lg hover:bg-white/20 transition-colors"
        aria-label="Sdílet na X (Twitter)"
      >
        <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
        <span className="text-xs text-white/90">Sdílet</span>
      </button>
    </div>
  );

  return (
    <>
      <div ref={containerRef} className={className}>
        {children}
      </div>
      {typeof document !== "undefined" && bar
        ? createPortal(bar, document.body)
        : null}
    </>
  );
}

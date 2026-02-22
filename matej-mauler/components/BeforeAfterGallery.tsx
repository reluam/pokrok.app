"use client";

import Image from "next/image";
import { useState, useCallback, useEffect } from "react";

type Slide = { src: string; alt: string; label: string };

export default function BeforeAfterGallery({
  before,
  after,
}: {
  before: Slide;
  after: Slide;
}) {
  const slides: Slide[] = [before, after];
  const [activeIndex, setActiveIndex] = useState(1); // defaultně "Po"
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const goPrev = () => setActiveIndex(0); // Před
  const goNext = () => setActiveIndex(1);   // Po

  const openLightbox = () => setLightboxOpen(true);
  const closeLightbox = useCallback(() => setLightboxOpen(false), []);

  useEffect(() => {
    if (!lightboxOpen) return;
    document.body.style.overflow = "hidden";
    const onEscape = (e: KeyboardEvent) => e.key === "Escape" && closeLightbox();
    window.addEventListener("keydown", onEscape);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onEscape);
    };
  }, [lightboxOpen, closeLightbox]);

  const current = slides[activeIndex];

  return (
    <>
      <div className="mb-6 flex items-center gap-2">
        <button
          type="button"
          onClick={goPrev}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-black/15 bg-white/80 text-[var(--fg)] shadow-sm transition hover:bg-black/5 hover:border-black/25"
          aria-label="Předchozí (Před)"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <div className="relative min-w-0 flex-1">
          <p className="mb-1.5 text-center text-xs font-600 uppercase tracking-wider text-[var(--fg-muted)]">
            {current.label}
          </p>
          <button
            type="button"
            onClick={openLightbox}
            className="relative block w-full overflow-hidden rounded-xl bg-black/5 aspect-video focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50"
            aria-label={`Zvětšit ${current.label}`}
          >
            <Image
              src={current.src}
              alt={current.alt}
              fill
              className="object-cover transition hover:opacity-95"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          </button>
        </div>
        <button
          type="button"
          onClick={goNext}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-black/15 bg-white/80 text-[var(--fg)] shadow-sm transition hover:bg-black/5 hover:border-black/25"
          aria-label="Další (Po)"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>

      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={closeLightbox}
          role="dialog"
          aria-modal="true"
          aria-label="Zvětšený náhled"
        >
          <button
            type="button"
            onClick={closeLightbox}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
            aria-label="Zavřít"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
          <div
            className="relative max-h-[90vh] max-w-4xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={current.src}
              alt={current.alt}
              className="max-h-[90vh] w-auto rounded-lg object-contain shadow-2xl"
            />
            <p className="mt-2 text-center text-sm text-white/80">{current.label}</p>
          </div>
        </div>
      )}
    </>
  );
}

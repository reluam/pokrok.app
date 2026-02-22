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

  const ArrowLeft = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
  const ArrowRight = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18l6-6-6-6" />
    </svg>
  );

  return (
    <>
      <div className="mb-6">
        <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black/5">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); goPrev(); }}
            className="absolute left-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[var(--fg)] shadow-md transition hover:bg-white hover:shadow-lg"
            aria-label="Před (před rekonstrukcí)"
          >
            <ArrowLeft />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); goNext(); }}
            className="absolute right-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[var(--fg)] shadow-md transition hover:bg-white hover:shadow-lg"
            aria-label="Po (po rekonstrukci)"
          >
            <ArrowRight />
          </button>
          <span className="absolute bottom-2 left-2 z-10 rounded bg-black/50 px-2 py-1 text-xs font-600 uppercase tracking-wider text-white">
            {current.label}
          </span>
          <button
            type="button"
            onClick={openLightbox}
            className="relative block h-full w-full focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 focus:ring-inset"
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

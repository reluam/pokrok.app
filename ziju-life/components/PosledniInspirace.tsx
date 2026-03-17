"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { InspirationData, InspirationItem } from "@/lib/inspiration";
import { getBookCoverObjectPosition } from "@/lib/book-cover-position";
import { Book, Video, ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";

// ── Scroll Row ────────────────────────────────────────────────────────────────

function ScrollRow({ title, href, children }: { title: string; href: string; children: React.ReactNode }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 2);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const t = setTimeout(updateScrollState, 80);
    window.addEventListener("resize", updateScrollState);
    el.addEventListener("scroll", updateScrollState, { passive: true });
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", updateScrollState);
      el.removeEventListener("scroll", updateScrollState);
    };
  }, [updateScrollState]);

  const scroll = (dir: "left" | "right") =>
    scrollRef.current?.scrollBy({ left: dir === "left" ? -340 : 340, behavior: "smooth" });

  return (
    <div className="space-y-3">
      <Link
        href={href}
        className="group inline-flex items-center gap-3 text-2xl font-bold text-foreground hover:text-accent transition-colors"
      >
        {title}
        <span className="text-accent text-sm font-normal opacity-0 group-hover:opacity-100 transition-opacity">
          zobrazit vše →
        </span>
      </Link>
      <div className="relative">
        {canScrollLeft && (
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 p-1.5 rounded-full bg-white/90 border border-white/60 shadow-md hover:shadow-lg hover:border-accent/30 transition-all backdrop-blur"
          >
            <ChevronLeft size={16} />
          </button>
        )}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-3 -mx-4 px-4 scroll-smooth [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: "none" }}
        >
          {children}
        </div>
        {canScrollRight && (
          <button
            onClick={() => scroll("right")}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 p-1.5 rounded-full bg-white/90 border border-white/60 shadow-md hover:shadow-lg hover:border-accent/30 transition-all backdrop-blur"
          >
            <ChevronRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

// ── Cards ─────────────────────────────────────────────────────────────────────

function BookCard({ item }: { item: InspirationItem }) {
  return (
    <Link href={`/inspirace/${item.id}`} className="flex-shrink-0 w-36 text-left group">
      <div className="w-36 h-52 rounded-xl overflow-hidden bg-gray-100 shadow-md group-hover:shadow-xl transition-all duration-200 group-hover:-translate-y-1 mb-2">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.title}
            className={`w-full h-full ${item.bookCoverFit === "contain" ? "object-contain" : "object-cover"}`}
            style={item.bookCoverFit !== "contain" ? { objectPosition: getBookCoverObjectPosition(item) } : undefined}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center">
            <Book className="text-accent/50" size={36} />
          </div>
        )}
      </div>
      <div className="min-h-[3.5rem]">
        <p className="text-sm font-semibold text-foreground line-clamp-2 leading-tight">{item.title}</p>
        {item.author && <p className="text-xs text-foreground/55 mt-0.5 line-clamp-1">{item.author}</p>}
      </div>
    </Link>
  );
}

function VideoCard({ item }: { item: InspirationItem }) {
  const getVideoThumbnail = (url: string) => {
    const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    if (m) return `https://img.youtube.com/vi/${m[1]}/mqdefault.jpg`;
    return null;
  };
  const thumb = item.thumbnail || getVideoThumbnail(item.url);

  return (
    <Link href={`/inspirace/${item.id}`} className="flex-shrink-0 w-56 text-left group">
      <div className="w-56 aspect-video rounded-xl overflow-hidden bg-gray-100 shadow-md group-hover:shadow-xl transition-all duration-200 group-hover:-translate-y-1 mb-2 relative">
        {thumb ? (
          <>
            <img src={thumb} alt={item.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="w-9 h-9 bg-white/90 rounded-full flex items-center justify-center">
                <Video className="w-4 h-4 text-accent ml-0.5" />
              </div>
            </div>
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center">
            <Video className="text-accent/50" size={32} />
          </div>
        )}
      </div>
      <div className="min-h-[3.5rem]">
        <p className="text-sm font-semibold text-foreground line-clamp-2 leading-tight">{item.title}</p>
        {item.author && <p className="text-xs text-foreground/55 mt-0.5 line-clamp-1">{item.author}</p>}
      </div>
    </Link>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function PosledniInspirace() {
  const [data, setData] = useState<InspirationData | null>(null);

  useEffect(() => {
    fetch("/api/inspiration")
      .then((r) => r.json())
      .then((d: InspirationData) => setData(d))
      .catch(() => {});
  }, []);

  if (!data) return null;

  const active = (item: InspirationItem) => item.isActive !== false;
  const books = data.books.filter(active);
  const videos = data.videos.filter(active);

  if (books.length === 0 && videos.length === 0) return null;

  return (
    <section className="relative py-16 md:py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-10">
        <div className="text-center space-y-3">
          <h2 className="text-3xl md:text-4xl lg:text-5xl text-foreground font-semibold">
            <span className="hand-drawn-underline">Z mé knihovny</span>
          </h2>
          <p className="text-lg md:text-xl text-foreground/80 max-w-2xl mx-auto">
            Knihy a videa, které mě formují.
          </p>
        </div>

        {books.length > 0 && (
          <ScrollRow title="Knihy" href="/inspirace">
            {books.map((item) => (
              <BookCard key={item.id} item={item} />
            ))}
          </ScrollRow>
        )}

        {videos.length > 0 && (
          <ScrollRow title="Videa" href="/inspirace">
            {videos.map((item) => (
              <VideoCard key={item.id} item={item} />
            ))}
          </ScrollRow>
        )}

        <div className="text-center">
          <Link
            href="/inspirace"
            className="btn-playful inline-flex items-center gap-2 px-8 py-4 bg-accent text-white rounded-full text-lg font-semibold hover:bg-accent-hover transition-colors shadow-lg hover:shadow-xl"
          >
            Celá knihovna
            <ArrowRight size={20} />
          </Link>
        </div>
      </div>
    </section>
  );
}

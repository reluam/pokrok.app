"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Book, Video, FileText, PenTool, Music, HelpCircle, Compass, Play } from "lucide-react";
import type { InspirationItem } from "@/lib/inspiration";
import { getBookCoverObjectPosition } from "@/lib/book-cover-position";

const LIMIT = 20;

const getVideoThumbnail = (url: string): string | null => {
  const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
  if (youtubeMatch) return `https://img.youtube.com/vi/${youtubeMatch[1]}/maxresdefault.jpg`;
  return null;
};

const TYPE_LABEL: Record<string, string> = {
  book: "Kniha",
  video: "Video",
  article: "Článek",
  blog: "Blog",
  reel: "Reel",
  music: "Hudba",
  other: "Ostatní",
  princip: "Princip",
};

const TYPE_ICON: Record<string, React.ElementType> = {
  book: Book,
  video: Video,
  article: FileText,
  blog: PenTool,
  reel: Play,
  music: Music,
  other: HelpCircle,
  princip: Compass,
};

function TypeBadge({ type }: { type: string }) {
  const Icon = TYPE_ICON[type] || HelpCircle;
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold">
      <Icon size={11} />
      {TYPE_LABEL[type] || type}
    </span>
  );
}

function FeedCard({ item }: { item: InspirationItem }) {
  const router = useRouter();
  const href = `/inspirace/${item.id}`;

  const handleClick = () => router.push(href);

  if (item.type === "book") {
    return (
      <button
        onClick={handleClick}
        className="group text-left w-full paper-card rounded-[24px] overflow-hidden hover:shadow-lg transition-all duration-200 flex flex-col"
      >
        <div className="w-full aspect-[2/3] bg-gradient-to-br from-accent/10 to-accent/5 overflow-hidden">
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt={item.title}
              className={`w-full h-full ${item.bookCoverFit === "contain" ? "object-contain" : "object-cover"} group-hover:scale-105 transition-transform duration-300`}
              style={item.bookCoverFit !== "contain" ? { objectPosition: getBookCoverObjectPosition(item) } : undefined}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Book className="text-accent/40" size={48} />
            </div>
          )}
        </div>
        <div className="p-4 flex flex-col gap-2 flex-1">
          <TypeBadge type={item.type} />
          <p className="font-semibold text-foreground line-clamp-2 text-sm leading-snug">{item.title}</p>
          {item.author && <p className="text-xs text-foreground/55 line-clamp-1">{item.author}</p>}
        </div>
      </button>
    );
  }

  if (item.type === "video") {
    const thumb = item.thumbnail || getVideoThumbnail(item.url);
    return (
      <button
        onClick={handleClick}
        className="group text-left w-full paper-card rounded-[24px] overflow-hidden hover:shadow-lg transition-all duration-200 flex flex-col"
      >
        <div className="w-full aspect-video bg-gray-100 overflow-hidden relative">
          {thumb ? (
            <>
              <img src={thumb} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                  <Play className="w-5 h-5 text-accent ml-0.5" />
                </div>
              </div>
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-accent/10 to-accent/5 flex items-center justify-center">
              <Video className="text-accent/40" size={48} />
            </div>
          )}
        </div>
        <div className="p-4 flex flex-col gap-2 flex-1">
          <TypeBadge type={item.type} />
          <p className="font-semibold text-foreground line-clamp-2 text-sm leading-snug">{item.title}</p>
        </div>
      </button>
    );
  }

  if (item.type === "reel") {
    return (
      <button
        onClick={handleClick}
        className="group text-left w-full paper-card rounded-[24px] overflow-hidden hover:shadow-lg transition-all duration-200 flex flex-col"
      >
        <div className="w-full aspect-[9/16] bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center overflow-hidden">
          <Play className="text-pink-400/60" size={48} />
        </div>
        <div className="p-4 flex flex-col gap-2 flex-1">
          <TypeBadge type={item.type} />
          <p className="font-semibold text-foreground line-clamp-2 text-sm leading-snug">{item.title}</p>
        </div>
      </button>
    );
  }

  // article, blog, other, music, princip — text cards
  return (
    <button
      onClick={handleClick}
      className="group text-left w-full paper-card rounded-[24px] p-5 hover:shadow-lg transition-all duration-200 flex flex-col gap-3 min-h-[160px]"
    >
      <TypeBadge type={item.type} />
      <p className="font-semibold text-foreground line-clamp-2 text-sm leading-snug">{item.title}</p>
      {item.description && (
        <p className="text-xs text-foreground/60 line-clamp-3 leading-relaxed">{item.description}</p>
      )}
      {item.author && <p className="text-xs text-foreground/45 mt-auto line-clamp-1">{item.author}</p>}
    </button>
  );
}

export default function InspiracePage() {
  const [items, setItems] = useState<InspirationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const fetchPage = useCallback(async (currentOffset: number) => {
    if (currentOffset === 0) setLoading(true);
    else setLoadingMore(true);

    try {
      const res = await fetch(`/api/inspiration?feed=true&offset=${currentOffset}&limit=${LIMIT}`);
      const data = await res.json();
      if (data.items) {
        setItems((prev) => (currentOffset === 0 ? data.items : [...prev, ...data.items]));
        setHasMore(data.hasMore);
        setOffset(currentOffset + LIMIT);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchPage(0);
  }, [fetchPage]);

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    if (!hasMore || loadingMore) return;
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          fetchPage(offset);
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, offset, fetchPage]);

  return (
    <main className="min-h-screen py-16 md:py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-10">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground">Inspirace</h1>
            <p className="text-lg md:text-xl text-foreground/65 max-w-xl">
              Knihy, videa, reelska, blogy a principy, které mě formují.
            </p>
          </div>
          <Link
            href="/inspirace/knihovna"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/85 border border-white/60 shadow-sm hover:shadow-md hover:border-accent/30 hover:text-accent backdrop-blur font-semibold text-sm transition-all whitespace-nowrap"
          >
            Knihovna →
          </Link>
        </div>

        {/* Feed grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="paper-card rounded-[24px] h-56 animate-pulse bg-white/60" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="text-foreground/50">Zatím žádné inspirace.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {items.map((item) => (
              <FeedCard key={item.id} item={item} />
            ))}
          </div>
        )}

        {/* Sentinel for infinite scroll */}
        {!loading && (
          <div ref={sentinelRef} className="h-1" />
        )}

        {/* Loading more indicator */}
        {loadingMore && (
          <div className="flex justify-center py-4">
            <div className="w-6 h-6 rounded-full border-2 border-accent border-t-transparent animate-spin" />
          </div>
        )}

        {/* End of list */}
        {!loading && !hasMore && items.length > 0 && (
          <p className="text-center text-sm text-foreground/40 py-4">To je vše</p>
        )}
      </div>
    </main>
  );
}

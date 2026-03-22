"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Script from "next/script";
import type { InspirationData, InspirationItem, InspirationCategory } from "@/lib/inspiration";
import { getBookCoverObjectPosition } from "@/lib/book-cover-position";
import { Book, Video, ChevronLeft, ChevronRight, Instagram, FileText, ArrowLeft } from "lucide-react";

const getVideoId = (url: string): string | null => {
  const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
  return youtubeMatch ? youtubeMatch[1] : null;
};

const getVideoThumbnail = (url: string): string | null => {
  const videoId = getVideoId(url);
  if (!videoId) return null;
  if (url.includes("youtube.com") || url.includes("youtu.be"))
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  return null;
};

type ReelPlatform = "instagram" | "tiktok" | "youtube";

interface ReelEmbed {
  platform: ReelPlatform;
  embedUrl: string;
  vertical: boolean;
}

const getReelEmbed = (url: string): ReelEmbed | null => {
  // Instagram
  const igMatch = url.match(/instagram\.com\/(?:reel|p)\/([A-Za-z0-9_-]+)/);
  if (igMatch) return { platform: "instagram", embedUrl: `https://www.instagram.com/reel/${igMatch[1]}/embed/`, vertical: true };

  // TikTok
  const ttMatch = url.match(/tiktok\.com\/@[^/]+\/video\/(\d+)/);
  if (ttMatch) return { platform: "tiktok", embedUrl: `https://www.tiktok.com/embed/v2/${ttMatch[1]}`, vertical: true };

  // YouTube Shorts – vertikální
  const ytShortsMatch = url.match(/youtube\.com\/shorts\/([A-Za-z0-9_-]+)/);
  if (ytShortsMatch) return { platform: "youtube", embedUrl: `https://www.youtube.com/embed/${ytShortsMatch[1]}`, vertical: true };

  // Klasické YouTube video – landscape
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]+)/);
  if (ytMatch) return { platform: "youtube", embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}`, vertical: false };

  return null;
};

const PLATFORM_ICON_COLOR: Record<ReelPlatform, string> = {
  instagram: "text-pink-500",
  tiktok: "text-foreground",
  youtube: "text-red-600",
};

interface DisplayItem {
  id: string;
  type: string;
  title: string;
  description: string;
  author?: string;
  thumbnail?: string;
  imageUrl?: string;
  bookCoverFit?: "cover" | "contain";
  bookCoverPosition?: string;
  bookCoverPositionX?: number;
  bookCoverPositionY?: number;
  url: string;
  href: string;
  createdAt: string;
  categoryId?: string;
  secondaryCategoryIds?: string[];
}

type ActiveSection = "vse" | "books" | "videos" | "reels" | "articles";

// ── Scroll Row ───────────────────────────────────────────────────────────────

function ScrollRow({
  title,
  onTitleClick,
  children,
  empty,
}: {
  title?: string;
  onTitleClick?: () => void;
  children?: React.ReactNode;
  empty?: boolean;
}) {
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
    // Small delay ensures content is rendered and measured
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
      {title && (
        onTitleClick ? (
          <button
            onClick={onTitleClick}
            className="group flex items-center gap-3 text-2xl font-bold text-foreground hover:text-accent transition-colors"
          >
            {title}
            <span className="text-accent text-sm font-normal opacity-0 group-hover:opacity-100 transition-opacity">
              zobrazit vše →
            </span>
          </button>
        ) : (
          <h3 className="text-base font-semibold text-foreground/55 uppercase tracking-wide">{title}</h3>
        )
      )}
      {empty ? (
        <p className="text-foreground/50 text-sm py-2">Zatím žádné položky.</p>
      ) : (
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
      )}
    </div>
  );
}

// ── Cards ────────────────────────────────────────────────────────────────────

function BookCard({ item, onClick }: { item: DisplayItem; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex-shrink-0 w-36 text-left cursor-pointer group">
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
    </button>
  );
}

function VideoCard({ item, onClick }: { item: DisplayItem; onClick: () => void }) {
  const thumb = item.thumbnail || getVideoThumbnail(item.url);
  return (
    <button onClick={onClick} className="flex-shrink-0 w-64 text-left cursor-pointer group">
      <div className="w-64 aspect-video rounded-xl overflow-hidden bg-gray-100 shadow-md group-hover:shadow-xl transition-all duration-200 group-hover:-translate-y-1 mb-2 relative">
        {thumb ? (
          <>
            <img src={thumb} alt={item.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center">
                <Video className="w-5 h-5 text-accent ml-0.5" />
              </div>
            </div>
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center">
            <Video className="text-accent/50" size={36} />
          </div>
        )}
      </div>
      <div className="min-h-[3.5rem]">
        <p className="text-sm font-semibold text-foreground line-clamp-2 leading-tight">{item.title}</p>
        {item.author && <p className="text-xs text-foreground/55 mt-0.5 line-clamp-1">{item.author}</p>}
      </div>
    </button>
  );
}

// Ikona platformy
function PlatformIcon({ platform, size = 24 }: { platform: ReelPlatform; size?: number }) {
  const cls = `${PLATFORM_ICON_COLOR[platform]} flex-shrink-0`;
  if (platform === "tiktok") {
    // TikTok SVG (lucide nemá)
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={cls}>
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.3 6.3 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.78a4.85 4.85 0 0 1-1.01-.09z"/>
      </svg>
    );
  }
  if (platform === "youtube") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={cls}>
        <path d="M23 7s-.3-2-1.2-2.8c-1.1-1.2-2.4-1.2-3-1.3C16.1 2.7 12 2.7 12 2.7s-4.1 0-6.8.2c-.6.1-1.9.1-3 1.3C1.3 5 1 7 1 7S.7 9.1.7 11.3v2c0 2.1.3 4.3.3 4.3s.3 2 1.2 2.8c1.1 1.2 2.6 1.1 3.3 1.2C7.5 21.8 12 21.8 12 21.8s4.1 0 6.8-.3c.6-.1 1.9-.1 3-1.2.9-.8 1.2-2.8 1.2-2.8s.3-2.1.3-4.3v-2C23.3 9.1 23 7 23 7zM9.7 15.5V8.2l8.1 3.7-8.1 3.6z"/>
      </svg>
    );
  }
  return <Instagram size={size} className={cls} />;
}

// Inline embedded reel – přímý embed bez náhledu
function ReelEmbedCard({ item }: { item: DisplayItem }) {
  const embed = getReelEmbed(item.url);
  if (!embed) {
    return (
      <div className="flex-shrink-0 w-[197px]">
        <a href={item.url} target="_blank" rel="noopener noreferrer"
          className="flex w-full h-[350px] rounded-xl bg-gray-100 flex-col items-center justify-center gap-3 hover:opacity-80 transition-opacity">
          <Instagram className="text-pink-500/70" size={40} />
          <span className="text-sm text-foreground/60">Otevřít</span>
        </a>
        <p className="mt-2 text-sm font-semibold text-foreground line-clamp-2">{item.title}</p>
      </div>
    );
  }
  const isVertical = embed.vertical;
  const w = isVertical ? 197 : 336;
  const h = isVertical ? 350 : 189;
  return (
    <div className="flex-shrink-0" style={{ width: w }}>
      <iframe
        src={embed.embedUrl}
        width={w}
        height={h}
        style={{ border: 0, borderRadius: 12, overflow: "hidden" }}
        scrolling="no"
        allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
        allowFullScreen
        title={item.title}
      />
      {item.title && (
        <p className="mt-2 text-sm font-semibold text-foreground line-clamp-2 px-1">{item.title}</p>
      )}
    </div>
  );
}

function ArticleCard({ item }: { item: DisplayItem }) {
  return (
    <a
      href={item.url || item.href}
      target={item.url ? "_blank" : undefined}
      rel={item.url ? "noopener noreferrer" : undefined}
      className="flex-shrink-0 w-64 text-left group"
    >
      <div className="w-64 h-36 rounded-xl overflow-hidden bg-gradient-to-br from-accent/10 to-accent/5 shadow-md group-hover:shadow-xl transition-all duration-200 group-hover:-translate-y-1 mb-2 flex items-center justify-center">
        {item.thumbnail ? (
          <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
        ) : (
          <FileText className="text-accent/40" size={36} />
        )}
      </div>
      <div className="min-h-[3.5rem]">
        <p className="text-sm font-semibold text-foreground line-clamp-2 leading-tight">{item.title}</p>
        {item.author && <p className="text-xs text-foreground/55 mt-0.5 line-clamp-1">{item.author}</p>}
      </div>
    </a>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const FILTERS: { value: ActiveSection; label: string }[] = [
  { value: "vse", label: "Vše" },
  { value: "books", label: "Knihy" },
  { value: "videos", label: "Videa" },
  { value: "reels", label: "Reelska" },
  { value: "articles", label: "Články" },
];

export default function InspiraceKnihovnaPage() {
  const router = useRouter();
  const [inspirationData, setInspirationData] = useState<InspirationData | null>(null);
  const [categories, setCategories] = useState<InspirationCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<ActiveSection>("vse");

  useEffect(() => {
    (async () => {
      try {
        const [inspRes, catRes] = await Promise.all([
          fetch("/api/inspiration"),
          fetch("/api/inspiration-categories"),
        ]);
        setInspirationData(await inspRes.json());
        const catData = await catRes.json();
        setCategories(Array.isArray(catData) ? catData : []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const active = (item: InspirationItem) => item.isActive !== false;

  const toDisplay = (item: InspirationItem): DisplayItem => ({
    id: item.id,
    type: item.type,
    title: item.title,
    description: item.description,
    author: item.author,
    thumbnail: item.thumbnail,
    imageUrl: item.imageUrl,
    bookCoverFit: item.bookCoverFit,
    bookCoverPosition: item.bookCoverPosition,
    bookCoverPositionX: item.bookCoverPositionX,
    bookCoverPositionY: item.bookCoverPositionY,
    url: item.url,
    href: `/inspirace/${item.id}?from=knihovna`,
    createdAt: item.createdAt,
    categoryId: item.categoryId,
    secondaryCategoryIds: item.secondaryCategoryIds,
  });

  const books = (inspirationData?.books || []).filter(active).map(toDisplay);
  const videos = (inspirationData?.videos || []).filter(active).map(toDisplay);
  const reels = (inspirationData?.reels || []).filter(active).map(toDisplay);
  const articles = [
    ...(inspirationData?.articles || []),
    ...(inspirationData?.blogs || []),
    ...(inspirationData?.other || []),
  ].filter(active).map(toDisplay);

  const groupByCategory = (items: DisplayItem[]) => {
    const groups: { id: string; label: string; items: DisplayItem[] }[] = [];
    for (const cat of categories) {
      const catItems = items.filter((i) => i.categoryId === cat.id);
      if (catItems.length > 0) groups.push({ id: cat.id, label: cat.name, items: catItems });
    }
    const uncategorized = items.filter(
      (i) => !i.categoryId || !categories.some((c) => c.id === i.categoryId)
    );
    if (uncategorized.length > 0) groups.push({ id: "none", label: "Ostatní", items: uncategorized });
    return groups;
  };

  if (loading) {
    return (
      <main className="min-h-screen py-16 md:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-foreground/60">Načítání...</p>
        </div>
      </main>
    );
  }

  const sectionItems = { books, videos, reels, articles };
  const sectionLabel = { books: "Knihy", videos: "Videa", reels: "Reelska", articles: "Články" };

  return (
    <main className="min-h-screen py-16 md:py-24 px-4 sm:px-6 lg:px-8">
      {/* Instagram embed script – načte se jen pokud jsou reelska */}
      {(activeSection === "reels" || (activeSection === "vse" && reels.length > 0)) && (
        <Script src="//www.instagram.com/embed.js" strategy="lazyOnload" />
      )}

      <div className="max-w-6xl mx-auto space-y-10">
        {/* Back link + Header */}
        <div className="space-y-3">
          <Link
            href="/inspirace"
            className="inline-flex items-center gap-2 text-foreground/70 hover:text-foreground transition-colors"
          >
            <ArrowLeft size={18} />
            <span>Zpět na Inspirace</span>
          </Link>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground">Inspirace — Knihovna</h1>
          <p className="text-lg md:text-xl text-foreground/65 max-w-xl">
            Knihy, videa, reelska a články, které mě formují.
          </p>
        </div>

        {/* Filtry */}
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setActiveSection(f.value)}
              className={`px-5 py-2.5 rounded-full font-semibold transition-colors ${
                activeSection === f.value
                  ? "bg-accent text-white"
                  : "bg-white/85 border border-white/60 shadow-sm hover:shadow-md hover:border-accent/30 hover:text-accent backdrop-blur"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {activeSection === "vse" ? (
          /* Hlavní knihovna: 4 řádky */
          <div className="space-y-10">
            <ScrollRow
              title="Knihy"
              onTitleClick={() => setActiveSection("books")}
              empty={books.length === 0}
            >
              {books.map((item) => (
                <BookCard key={item.id} item={item} onClick={() => router.push(item.href)} />
              ))}
            </ScrollRow>

            <ScrollRow
              title="Videa"
              onTitleClick={() => setActiveSection("videos")}
              empty={videos.length === 0}
            >
              {videos.map((item) => (
                <VideoCard key={item.id} item={item} onClick={() => router.push(item.href)} />
              ))}
            </ScrollRow>

            <ScrollRow
              title="Reelska"
              onTitleClick={() => setActiveSection("reels")}
              empty={reels.length === 0}
            >
              {reels.map((item) => (
                <ReelEmbedCard key={item.id} item={item} />
              ))}
            </ScrollRow>

            <ScrollRow
              title="Články"
              onTitleClick={() => setActiveSection("articles")}
              empty={articles.length === 0}
            >
              {articles.map((item) => (
                <ArticleCard key={item.id} item={item} />
              ))}
            </ScrollRow>
          </div>
        ) : activeSection === "reels" ? (
          /* Reelska – inline embedy skupinami podle kategorií */
          <div className="space-y-10">
            {reels.length === 0 ? (
              <p className="text-foreground/50">Zatím žádná reelska.</p>
            ) : (
              (() => {
                const reelGroups = groupByCategory(reels);
                return reelGroups.map((group) => (
                  <div key={group.id} className="space-y-4">
                    {(reelGroups.length > 1 || group.id !== "none") && (
                      <h3 className="text-base font-semibold text-foreground/55 uppercase tracking-wide">
                        {group.label}
                      </h3>
                    )}
                    <div
                      className="flex gap-4 overflow-x-auto pb-3 -mx-4 px-4 scroll-smooth [&::-webkit-scrollbar]:hidden"
                      style={{ scrollbarWidth: "none" }}
                    >
                      {group.items.map((item) => (
                        <ReelEmbedCard key={item.id} item={item} />
                      ))}
                    </div>
                  </div>
                ));
              })()
            )}
          </div>
        ) : activeSection === "articles" ? (
          /* Články – kategorie s horizontálním scrollem */
          <div className="space-y-8">
            {articles.length === 0 ? (
              <p className="text-foreground/50">Zatím žádné články.</p>
            ) : (
              groupByCategory(articles).map((group) => (
                <ScrollRow key={group.id} title={group.label}>
                  {group.items.map((item) => (
                    <ArticleCard key={item.id} item={item} />
                  ))}
                </ScrollRow>
              ))
            )}
          </div>
        ) : (
          /* Knihy nebo Videa – kategorie s horizontálním scrollem */
          <div className="space-y-8">
            {sectionItems[activeSection as "books" | "videos"].length === 0 ? (
              <p className="text-foreground/50">Zatím žádné položky.</p>
            ) : (
              groupByCategory(sectionItems[activeSection as "books" | "videos"]).map((group) => (
                <ScrollRow key={group.id} title={group.label}>
                  {group.items.map((item) =>
                    activeSection === "books" ? (
                      <BookCard key={item.id} item={item} onClick={() => router.push(item.href)} />
                    ) : (
                      <VideoCard key={item.id} item={item} onClick={() => router.push(item.href)} />
                    )
                  )}
                </ScrollRow>
              ))
            )}
          </div>
        )}
      </div>
    </main>
  );
}

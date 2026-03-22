"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import {
  Book,
  Video,
  FileText,
  PenTool,
  Music,
  HelpCircle,
  Compass,
  Play,
  Layers,
} from "lucide-react";
import type { InspirationItem, InspirationCategory } from "@/lib/inspiration";
import { getBookCoverObjectPosition } from "@/lib/book-cover-position";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const LIMIT = 20;

// ── Constants ────────────────────────────────────────────────────────────────

const TYPE_LABEL: Record<string, string> = {
  book: "Kniha",
  video: "Video",
  blog: "Článek",
  reel: "Reel",
  music: "Hudba",
  other: "Ostatní",
  princip: "Princip",
};

const TYPE_PLURAL: Record<string, string> = {
  book: "Knihy",
  video: "Videa",
  blog: "Články",
  reel: "Reelska",
  music: "Hudba",
  other: "Ostatní",
  princip: "Principy",
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

// Types to show in the type tab bar (in order)
const TYPE_TABS = ["book", "video", "blog", "reel", "music", "princip", "other"];

// ── Helpers ──────────────────────────────────────────────────────────────────

const getVideoId = (url: string): string | null => {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
  if (yt) return yt[1];
  const vm = url.match(/vimeo\.com\/(\d+)/);
  if (vm) return vm[1];
  return null;
};

const getVideoEmbedUrl = (url: string): string | null => {
  const id = getVideoId(url);
  if (!id) return null;
  if (url.includes("youtube.com") || url.includes("youtu.be"))
    return `https://www.youtube.com/embed/${id}`;
  if (url.includes("vimeo.com")) return `https://player.vimeo.com/video/${id}`;
  return null;
};

const getVideoThumbnail = (url: string): string | null => {
  const id = getVideoId(url);
  if (!id) return null;
  if (url.includes("youtube.com") || url.includes("youtu.be"))
    return `https://img.youtube.com/vi/${id}/maxresdefault.jpg`;
  return null;
};

// ── InlineCard ───────────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: string }) {
  const Icon = TYPE_ICON[type] || HelpCircle;
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold">
      <Icon size={11} />
      {TYPE_LABEL[type] || type}
    </span>
  );
}

function InlineCard({ item }: { item: InspirationItem }) {
  const videoEmbedUrl =
    item.type === "video" || item.type === "music" ? getVideoEmbedUrl(item.url) : null;
  const videoThumbnail =
    item.type === "video" && !videoEmbedUrl
      ? item.thumbnail || getVideoThumbnail(item.url)
      : null;

  return (
    <article className="paper-card rounded-[24px] px-6 py-7 md:px-8 md:py-8 space-y-5">
      {/* Header row */}
      <div className="flex items-center gap-3">
        <TypeBadge type={item.type} />
      </div>

      {/* Title */}
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-foreground leading-snug">
          {item.title}
        </h2>
        {item.author && (
          <p className="mt-1 text-sm text-foreground/55">
            {item.type === "blog" ? "Matěj Mauler" : item.author}
          </p>
        )}
        {item.type === "blog" && !item.author && (
          <p className="mt-1 text-sm text-foreground/55">Matěj Mauler</p>
        )}
      </div>

      {/* Description */}
      {item.description && item.type !== "blog" && (
        <p className="text-base text-foreground/75 leading-relaxed">{item.description}</p>
      )}
      {item.type === "blog" && item.description && (
        <p className="text-base text-foreground/75 leading-relaxed pb-5 border-b border-black/8">
          {item.description}
        </p>
      )}

      {/* Book cover */}
      {item.type === "book" && item.imageUrl && (
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-fit rounded-xl overflow-hidden border-2 border-black/10 hover:border-accent/50 transition-colors shadow-lg hover:shadow-xl"
        >
          <img
            src={item.imageUrl}
            alt={item.title}
            className={`w-36 sm:w-44 aspect-[2/3] ${
              item.bookCoverFit === "contain" ? "object-contain" : "object-cover"
            }`}
            style={
              item.bookCoverFit !== "contain"
                ? { objectPosition: getBookCoverObjectPosition(item) }
                : undefined
            }
          />
        </a>
      )}

      {/* Video / Music embed */}
      {(item.type === "video" || item.type === "music") && videoEmbedUrl && (
        <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black">
          <iframe
            src={videoEmbedUrl}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}

      {/* Video thumbnail fallback */}
      {item.type === "video" && !videoEmbedUrl && videoThumbnail && (
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block relative w-full aspect-video rounded-2xl overflow-hidden bg-black group"
        >
          <img
            src={videoThumbnail}
            alt={item.title}
            className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
            <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-accent ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        </a>
      )}

      {/* Reel placeholder */}
      {item.type === "reel" && (
        <div className="w-full max-w-xs aspect-[9/16] bg-gradient-to-br from-pink-50 to-purple-50 rounded-2xl flex items-center justify-center">
          <Play className="text-pink-400/60" size={48} />
        </div>
      )}

      {/* Blog content */}
      {item.type === "blog" && item.content && (
        <div className="blog-detail-content max-w-none prose prose-sm">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{item.content}</ReactMarkdown>
        </div>
      )}

      {/* Princip content */}
      {item.type === "princip" && item.content && (
        <div className="prose prose-sm max-w-none text-foreground/80 leading-relaxed">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{item.content}</ReactMarkdown>
        </div>
      )}
      {item.type === "princip" && !item.content && item.description && (
        <p className="text-base text-foreground/75 leading-relaxed">{item.description}</p>
      )}

      {/* External link */}
      {item.type !== "blog" &&
        item.type !== "video" &&
        item.type !== "music" &&
        item.type !== "princip" &&
        item.url &&
        item.url !== "#" && (
          <div>
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-white rounded-full font-semibold hover:bg-accent-hover transition-colors text-sm"
            >
              {item.type === "book" ? "Koupit / Zobrazit" : "Otevřít odkaz"} →
            </a>
          </div>
        )}
      {item.type === "music" && !videoEmbedUrl && item.url && (
        <div>
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-white rounded-full font-semibold hover:bg-accent-hover transition-colors text-sm"
          >
            Otevřít v přehrávači →
          </a>
        </div>
      )}
      {item.type === "video" && !videoEmbedUrl && !videoThumbnail && item.url && (
        <div>
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-white rounded-full font-semibold hover:bg-accent-hover transition-colors text-sm"
          >
            Otevřít video →
          </a>
        </div>
      )}

      {/* Date */}
      <p className="text-xs text-foreground/35 pt-1">
        {new Date(item.createdAt).toLocaleDateString("cs-CZ", { day: "numeric", month: "long", year: "numeric" })}
      </p>
    </article>
  );
}

// ── Sidebar ──────────────────────────────────────────────────────────────────

interface SidebarProps {
  activeType: string;
  categories: InspirationCategory[];
  allTypedItems: InspirationItem[]; // all active items of activeType
  activeCategory: string | null; // category id or null
  activeItemId: string | null;
  onCategoryClick: (catId: string | null) => void;
  onItemClick: (itemId: string) => void;
}

function Sidebar({
  activeType,
  categories,
  allTypedItems,
  activeCategory,
  activeItemId,
  onCategoryClick,
  onItemClick,
}: SidebarProps) {
  // Build category groups
  const catItems: { id: string | null; label: string; items: InspirationItem[] }[] = [];

  for (const cat of categories) {
    const items = allTypedItems.filter((i) => i.categoryId === cat.id);
    if (items.length > 0) catItems.push({ id: cat.id, label: cat.name, items });
  }
  const uncategorized = allTypedItems.filter(
    (i) => !i.categoryId || !categories.some((c) => c.id === i.categoryId)
  );
  if (uncategorized.length > 0) catItems.push({ id: null, label: "Ostatní", items: uncategorized });

  return (
    <aside className="w-full lg:w-64 xl:w-72 flex-shrink-0 lg:sticky lg:top-24 self-start">
      <div className="paper-card rounded-[24px] px-4 py-5 space-y-1">
        {/* All in type */}
        <button
          onClick={() => onCategoryClick(null)}
          className={`w-full text-left px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeCategory === null && activeItemId === null
              ? "bg-accent/10 text-accent"
              : "hover:bg-black/5 text-foreground/60 hover:text-foreground"
          }`}
        >
          Vše — {TYPE_PLURAL[activeType] || activeType}
        </button>

        {catItems.map(({ id, label, items }) => (
          <div key={id ?? "none"} className="pt-1">
            <button
              onClick={() => onCategoryClick(id)}
              className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                activeCategory === id && activeItemId === null
                  ? "text-accent bg-accent/5"
                  : "text-foreground/40 hover:text-foreground/70"
              }`}
            >
              {label}
            </button>
            <ul className="space-y-0.5 mt-0.5">
              {items.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => onItemClick(item.id)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-all ${
                      activeItemId === item.id
                        ? "bg-accent/10 text-accent font-semibold"
                        : "hover:bg-black/5 text-foreground/65 hover:text-foreground"
                    }`}
                  >
                    <span className="leading-snug line-clamp-2">{item.title}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </aside>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function InspiracePage() {
  // Filter state
  const [activeType, setActiveType] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);

  // Categories
  const [categories, setCategories] = useState<InspirationCategory[]>([]);

  // Feed state (for all-feed mode)
  const [feedItems, setFeedItems] = useState<InspirationItem[]>([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [feedLoadingMore, setFeedLoadingMore] = useState(false);
  const [feedHasMore, setFeedHasMore] = useState(true);
  const [feedOffset, setFeedOffset] = useState(0);

  // All items for selected type (for sidebar + type-filtered view)
  const [typeItems, setTypeItems] = useState<InspirationItem[]>([]);
  const [typeLoading, setTypeLoading] = useState(false);

  const sentinelRef = useRef<HTMLDivElement>(null);

  // Load categories once
  useEffect(() => {
    fetch("/api/inspiration-categories")
      .then((r) => r.json())
      .then((d) => setCategories(Array.isArray(d) ? d : []))
      .catch(console.error);
  }, []);

  // Load feed page
  const fetchFeedPage = useCallback(async (offset: number) => {
    if (offset === 0) setFeedLoading(true);
    else setFeedLoadingMore(true);
    try {
      const res = await fetch(`/api/inspiration?feed=true&offset=${offset}&limit=${LIMIT}`);
      const data = await res.json();
      if (data.items) {
        setFeedItems((prev) => (offset === 0 ? data.items : [...prev, ...data.items]));
        setFeedHasMore(data.hasMore);
        setFeedOffset(offset + LIMIT);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setFeedLoading(false);
      setFeedLoadingMore(false);
    }
  }, []);

  // Load all items of a given type (for sidebar + filtering)
  const fetchTypeItems = useCallback(async (type: string) => {
    setTypeLoading(true);
    try {
      const res = await fetch("/api/inspiration");
      const data = await res.json();
      const all: InspirationItem[] = [
        ...(data.blogs || []),
        ...(data.videos || []),
        ...(data.books || []),
        ...(data.articles || []),
        ...(data.other || []),
        ...(data.music || []),
        ...(data.reels || []),
        ...(data.princips || []),
      ].filter((i) => i.isActive !== false && i.type === type);
      all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setTypeItems(all);
    } catch (e) {
      console.error(e);
    } finally {
      setTypeLoading(false);
    }
  }, []);

  // Initial feed load
  useEffect(() => {
    fetchFeedPage(0);
  }, [fetchFeedPage]);

  // When type changes, fetch type items
  useEffect(() => {
    if (activeType) {
      fetchTypeItems(activeType);
    }
  }, [activeType, fetchTypeItems]);

  // Infinite scroll (only in feed mode = no type selected)
  useEffect(() => {
    if (activeType || !feedHasMore || feedLoadingMore) return;
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && feedHasMore && !feedLoadingMore) {
          fetchFeedPage(feedOffset);
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [activeType, feedHasMore, feedLoadingMore, feedOffset, fetchFeedPage]);

  // ── Derived ────────────────────────────────────────────────────────────────

  // Items to display in main feed area
  const displayItems: InspirationItem[] = (() => {
    if (!activeType) return feedItems;
    if (activeItemId) return typeItems.filter((i) => i.id === activeItemId);
    if (activeCategory !== null) return typeItems.filter((i) => i.categoryId === activeCategory);
    return typeItems;
  })();

  // Type tab click
  const handleTypeClick = (type: string) => {
    if (activeType === type) {
      // deselect
      setActiveType(null);
      setActiveCategory(null);
      setActiveItemId(null);
    } else {
      setActiveType(type);
      setActiveCategory(null);
      setActiveItemId(null);
    }
  };

  const handleCategoryClick = (catId: string | null) => {
    setActiveCategory(catId);
    setActiveItemId(null);
  };

  const handleItemClick = (itemId: string) => {
    setActiveItemId((prev) => (prev === itemId ? null : itemId));
  };

  // Which types have content (from feed items or typeItems)
  const typesWithContent = new Set(feedItems.map((i) => i.type));

  const isLoading = activeType ? typeLoading : feedLoading;

  return (
    <main className="min-h-screen py-16 md:py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">

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

        {/* Type filter tabs */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => { setActiveType(null); setActiveCategory(null); setActiveItemId(null); }}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              activeType === null
                ? "bg-accent text-white shadow-md"
                : "bg-white/85 border border-white/60 shadow-sm hover:shadow-md hover:border-accent/30 hover:text-accent backdrop-blur"
            }`}
          >
            <Layers size={13} />
            Vše
          </button>
          {TYPE_TABS.map((type) => {
            const Icon = TYPE_ICON[type];
            return (
              <button
                key={type}
                onClick={() => handleTypeClick(type)}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                  activeType === type
                    ? "bg-accent text-white shadow-md"
                    : "bg-white/85 border border-white/60 shadow-sm hover:shadow-md hover:border-accent/30 hover:text-accent backdrop-blur"
                }`}
              >
                <Icon size={13} />
                {TYPE_PLURAL[type]}
              </button>
            );
          })}
        </div>

        {/* Main content area */}
        <div className={`flex gap-6 items-start ${activeType ? "flex-col lg:flex-row" : ""}`}>

          {/* Sidebar — only when type is selected */}
          {activeType && !typeLoading && typeItems.length > 0 && (
            <Sidebar
              activeType={activeType}
              categories={categories}
              allTypedItems={typeItems}
              activeCategory={activeCategory}
              activeItemId={activeItemId}
              onCategoryClick={handleCategoryClick}
              onItemClick={handleItemClick}
            />
          )}

          {/* Feed */}
          <div className="flex-1 min-w-0 space-y-5">
            {isLoading ? (
              <>
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="paper-card rounded-[24px] h-48 animate-pulse bg-white/60" />
                ))}
              </>
            ) : displayItems.length === 0 ? (
              <p className="text-foreground/50">Zatím žádné inspirace.</p>
            ) : (
              displayItems.map((item) => <InlineCard key={item.id} item={item} />)
            )}

            {/* Infinite scroll sentinel (feed mode only) */}
            {!activeType && !feedLoading && <div ref={sentinelRef} className="h-1" />}

            {/* Loading more */}
            {!activeType && feedLoadingMore && (
              <div className="flex justify-center py-4">
                <div className="w-6 h-6 rounded-full border-2 border-accent border-t-transparent animate-spin" />
              </div>
            )}

            {/* End of feed */}
            {!activeType && !feedLoading && !feedHasMore && feedItems.length > 0 && (
              <p className="text-center text-sm text-foreground/40 py-4">To je vše</p>
            )}
          </div>
        </div>

      </div>
    </main>
  );
}

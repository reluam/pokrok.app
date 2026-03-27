"use client";

import { useEffect, useRef, useState, useCallback, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
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
  Share2,
  Check,
  Wrench,
} from "lucide-react";
import type { InspirationItem, InspirationCategory } from "@/lib/inspiration";
import { TOOLBOX_CATEGORIES } from "@/lib/toolbox";
import { getBookCoverObjectPosition } from "@/lib/book-cover-position";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import dynamicImport from "next/dynamic";

const ToolDetailModal = dynamicImport(() => import("@/components/laborator/ToolDetailModal"), { ssr: false });
const InspirationAIAssistant = dynamicImport(() => import("@/components/InspirationAIAssistant"), { ssr: false });

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
  tool: "Nástroj",
};

const TYPE_PLURAL: Record<string, string> = {
  book: "Knihy",
  video: "Videa",
  blog: "Články",
  reel: "Reelska",
  music: "Hudba",
  other: "Ostatní",
  princip: "Principy",
  tool: "Nástroje",
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
  tool: Wrench,
};

// Types to show in the type tab bar (in order)
const TYPE_TABS = ["book", "video", "blog", "tool", "reel", "music", "princip", "other"];

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

interface ReelEmbed { embedUrl: string; vertical: boolean }

const getReelEmbed = (url: string): ReelEmbed | null => {
  const igMatch = url.match(/instagram\.com\/(?:reel|p)\/([A-Za-z0-9_-]+)/);
  if (igMatch) return { embedUrl: `https://www.instagram.com/reel/${igMatch[1]}/embed/`, vertical: true };
  const ttMatch = url.match(/tiktok\.com\/@[^/]+\/video\/(\d+)/);
  if (ttMatch) return { embedUrl: `https://www.tiktok.com/embed/v2/${ttMatch[1]}`, vertical: true };
  const ytShortsMatch = url.match(/youtube\.com\/shorts\/([A-Za-z0-9_-]+)/);
  if (ytShortsMatch) return { embedUrl: `https://www.youtube.com/embed/${ytShortsMatch[1]}`, vertical: true };
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]+)/);
  if (ytMatch) return { embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}`, vertical: false };
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

// ── ShareDropdown ────────────────────────────────────────────────────────────

function ShareDropdown({ url, title, variant = "header" }: { url: string; title: string; variant?: "header" | "footer" }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const hasNativeShare = typeof navigator !== "undefined" && !!navigator.share;

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleCopy = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => { setCopied(false); setOpen(false); }, 1800);
    });
  };

  const handleX = () => {
    const text = encodeURIComponent(`${title}\n\n${url}`);
    window.open(`https://twitter.com/intent/tweet?text=${text}`, "_blank", "width=600,height=400");
    setOpen(false);
  };

  const handleNative = () => {
    navigator.share({ title, url }).catch(() => {});
    setOpen(false);
  };

  if (variant === "footer") {
    return (
      <div ref={ref} className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/85 border border-black/10 shadow-sm hover:shadow-md hover:border-accent/30 hover:text-accent backdrop-blur font-semibold text-sm transition-all"
        >
          <Share2 size={15} />
          Sdílet článek
        </button>
        {open && (
          <div className="absolute bottom-full mb-2 left-0 z-50 min-w-[220px] bg-white rounded-2xl shadow-xl border border-black/8 py-2 overflow-hidden">
            <button
              onClick={handleCopy}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-black/5 transition-colors text-left"
            >
              {copied ? <Check size={16} className="text-green-500 shrink-0" /> : <span className="text-lg leading-none shrink-0">🔗</span>}
              <span className="font-medium">{copied ? "Odkaz zkopírován!" : "Kopírovat odkaz"}</span>
            </button>
            <button
              onClick={handleX}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-black/5 transition-colors text-left"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.259 5.631 5.905-5.631zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              <span className="font-medium">Sdílet na X</span>
            </button>
            {hasNativeShare && (
              <button
                onClick={handleNative}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-black/5 transition-colors text-left"
              >
                <span className="text-lg leading-none shrink-0">📤</span>
                <span className="font-medium">Sdílet přes…</span>
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  // header variant
  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        title="Sdílet inspiraci"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all text-foreground/40 hover:text-accent hover:bg-accent/8"
      >
        <Share2 size={13} />
        Sdílet
      </button>
      {open && (
        <div className="absolute top-full mt-1.5 right-0 z-50 min-w-[210px] bg-white rounded-2xl shadow-xl border border-black/8 py-2 overflow-hidden">
          <button
            onClick={handleCopy}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-black/5 transition-colors text-left"
          >
            {copied ? <Check size={15} className="text-green-500 shrink-0" /> : <span className="text-base leading-none shrink-0">🔗</span>}
            <span className="font-medium">{copied ? "Zkopírováno!" : "Kopírovat odkaz"}</span>
          </button>
          <button
            onClick={handleX}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-black/5 transition-colors text-left"
          >
            <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.259 5.631 5.905-5.631zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            <span className="font-medium">Sdílet na X</span>
          </button>
          {hasNativeShare && (
            <button
              onClick={handleNative}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-black/5 transition-colors text-left"
            >
              <span className="text-base leading-none shrink-0">📤</span>
              <span className="font-medium">Sdílet přes…</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── InlineCard ───────────────────────────────────────────────────────────────

function InlineCard({ item, onToolClick }: { item: InspirationItem; onToolClick?: (slug: string) => void }) {
  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/inspirace?type=${item.type}&item=${item.id}`
    : `/inspirace?type=${item.type}&item=${item.id}`;
  const videoEmbedUrl =
    item.type === "video" || item.type === "music" ? getVideoEmbedUrl(item.url) : null;
  const videoThumbnail =
    item.type === "video" && !videoEmbedUrl
      ? item.thumbnail || getVideoThumbnail(item.url)
      : null;

  // Tool type — render as clickable card
  if (item.type === "tool" && item.toolSlug) {
    return (
      <article
        className="paper-card rounded-[24px] px-6 py-6 md:px-8 md:py-7 cursor-pointer hover:shadow-lg hover:border-accent/20 transition-all group"
        onClick={() => onToolClick?.(item.toolSlug!)}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2 flex-1 min-w-0">
            <TypeBadge type="tool" />
            <h2 className="text-xl md:text-2xl font-bold text-foreground leading-snug group-hover:text-accent transition-colors">
              {item.title}
            </h2>
            <p className="text-sm text-foreground/65 leading-relaxed">{item.description}</p>
          </div>
          <span className="shrink-0 mt-6 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-semibold group-hover:bg-accent group-hover:text-white transition-colors">
            Detail →
          </span>
        </div>
      </article>
    );
  }

  return (
    <article className="paper-card rounded-[24px] px-6 py-7 md:px-8 md:py-8 space-y-5">
      {/* Header row */}
      <div className="flex items-center justify-between gap-3">
        <TypeBadge type={item.type} />
        <ShareDropdown url={shareUrl} title={item.title} variant="header" />
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

      {/* Reel embed */}
      {item.type === "reel" && (() => {
        const embed = getReelEmbed(item.url);
        if (!embed) return (
          <a href={item.url} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-white rounded-full font-semibold hover:bg-accent-hover transition-colors text-sm">
            Otevřít →
          </a>
        );
        const w = embed.vertical ? 320 : 560;
        const h = embed.vertical ? 568 : 315;
        return (
          <iframe
            src={embed.embedUrl}
            width={w}
            height={h}
            style={{ border: 0, borderRadius: 16, maxWidth: "100%" }}
            scrolling="no"
            allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
            allowFullScreen
            title={item.title}
          />
        );
      })()}

      {/* Blog content */}
      {item.type === "blog" && item.content && (
        <>
          <div className="blog-detail-content max-w-none prose prose-sm">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{item.content}</ReactMarkdown>
          </div>
          <div className="pt-4 border-t border-black/8">
            <ShareDropdown url={shareUrl} title={item.title} variant="footer" />
          </div>
        </>
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
  categories: InspirationCategory[];
  allTypedItems: InspirationItem[]; // all active items of activeType
  activeCategory: string | null; // category id or null
  activeItemId: string | null;
  onCategoryClick: (catId: string | null) => void;
  onItemClick: (itemId: string) => void;
  collapsible?: boolean; // when true, categories are collapsed by default
}

function Sidebar({
  categories,
  allTypedItems,
  activeCategory,
  activeItemId,
  onCategoryClick,
  onItemClick,
  collapsible = false,
}: SidebarProps) {
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const catRefs = useRef<Record<string, HTMLDivElement | null>>({});

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

  const handleCatClick = (catId: string | null) => {
    if (collapsible) {
      const newExpanded = expandedCat === catId ? null : catId;
      setExpandedCat(newExpanded);
      // Scroll category into view
      if (newExpanded !== null) {
        const key = catId ?? "none";
        setTimeout(() => {
          catRefs.current[key]?.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }, 50);
      }
    }
    onCategoryClick(catId);
  };

  return (
    <aside className="w-full lg:w-64 xl:w-72 flex-shrink-0 lg:sticky lg:top-24 self-start">
      <div className="paper-card rounded-[24px] px-4 py-5 space-y-1 max-h-[calc(100vh-8rem)] overflow-y-auto">
        {catItems.map(({ id, label, items }) => {
          const key = id ?? "none";
          const isExpanded = !collapsible || expandedCat === id;
          const isActive = activeCategory === id && activeItemId === null;

          return (
            <div key={key} ref={(el) => { catRefs.current[key] = el; }} className="pt-1">
              <button
                onClick={() => handleCatClick(id)}
                className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-between gap-2 ${
                  isActive || (collapsible && expandedCat === id)
                    ? "text-accent bg-accent/5"
                    : "text-foreground/40 hover:text-foreground/70"
                }`}
              >
                <span>{label}</span>
                {collapsible && (
                  <span className={`text-[10px] transition-transform ${isExpanded ? "rotate-180" : ""}`}>▾</span>
                )}
              </button>
              {isExpanded && (
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
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

function InspiracePageInner() {
  const searchParams = useSearchParams();
  const initialType = useMemo(() => searchParams.get("type"), [searchParams]);
  const initialItemId = useMemo(() => searchParams.get("item"), [searchParams]);

  // Filter state
  const [activeType, setActiveType] = useState<string | null>(initialType);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeItemId, setActiveItemId] = useState<string | null>(initialItemId);

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

  // Available types (types that have at least 1 active item)
  const [availableTypes, setAvailableTypes] = useState<Set<string>>(new Set());

  // Tool detail modal
  const [openToolSlug, setOpenToolSlug] = useState<string | null>(null);

  const sentinelRef = useRef<HTMLDivElement>(null);

  // Load categories + available types once
  useEffect(() => {
    fetch("/api/inspiration-categories")
      .then((r) => r.json())
      .then((d) => setCategories(Array.isArray(d) ? d : []))
      .catch(console.error);

    fetch("/api/inspiration")
      .then((r) => r.json())
      .then(async (data) => {
        const all: InspirationItem[] = [
          ...(data.blogs || []),
          ...(data.videos || []),
          ...(data.books || []),
          ...(data.articles || []),
          ...(data.other || []),
          ...(data.music || []),
          ...(data.reels || []),
          ...(data.princips || []),
        ].filter((i) => i.isActive !== false);
        const types = new Set(all.map((i) => i.type));
        // Check if toolbox tools exist
        try {
          const toolRes = await fetch("/api/laborator/toolbox?limit=1");
          const toolData = await toolRes.json();
          if (toolData.total > 0) types.add("tool");
        } catch {}
        setAvailableTypes(types);
        // If initial type is set, pre-populate typeItems from this fetch
        if (initialType) {
          const filtered = all.filter((i) => i.type === initialType);
          filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setTypeItems(filtered);
        }
      })
      .catch(console.error);
  }, [initialType]);

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
      if (type === "tool") {
        // Tools come from the feed API with type filter
        const res = await fetch(`/api/inspiration?feed=true&type=tool&offset=0&limit=200`);
        const data = await res.json();
        setTypeItems(data.items || []);
      } else {
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
      }
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
    // Tool items: open detail modal instead of scrolling
    if (itemId.startsWith("tool_")) {
      const slug = itemId.replace("tool_", "");
      setOpenToolSlug(slug);
      return;
    }
    setActiveItemId((prev) => (prev === itemId ? null : itemId));
  };


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

        {/* AI Assistant */}
        <InspirationAIAssistant onSelectTool={setOpenToolSlug} />

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
          {TYPE_TABS.filter((type) => availableTypes.has(type)).map((type) => {
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
              categories={activeType === "tool" ? TOOLBOX_CATEGORIES.map((c) => ({ id: `toolcat_${c.id}`, name: `${c.icon} ${c.label}`, createdAt: "", updatedAt: "" })) : categories}
              allTypedItems={typeItems}
              activeCategory={activeCategory}
              activeItemId={activeItemId}
              onCategoryClick={handleCategoryClick}
              onItemClick={handleItemClick}
              collapsible={activeType === "tool"}
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
              displayItems.map((item) => <InlineCard key={item.id} item={item} onToolClick={setOpenToolSlug} />)
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

      {/* Tool Detail Modal */}
      {openToolSlug && (
        <ToolDetailModal
          slug={openToolSlug}
          onClose={() => setOpenToolSlug(null)}
          isSubscriber={false}
        />
      )}
    </main>
  );
}

export default function InspiracePage() {
  return (
    <Suspense fallback={<main className="min-h-screen py-16 md:py-24 px-4 sm:px-6 lg:px-8" />}>
      <InspiracePageInner />
    </Suspense>
  );
}

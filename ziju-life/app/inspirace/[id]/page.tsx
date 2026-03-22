"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Book, Video, FileText, PenTool, HelpCircle, Music, Compass } from "lucide-react";
import { SelectionShareBar } from "@/components/SelectionShareBar";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { InspirationItem, InspirationCategory, InspirationData } from "@/lib/inspiration";
import { getBookCoverObjectPosition } from "@/lib/book-cover-position";

// ── Helpers ───────────────────────────────────────────────────────────────────

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
  reel: Video,
  music: Music,
  other: HelpCircle,
  princip: Compass,
};

const TYPE_GROUP_LABEL: Record<string, string> = {
  book: "Knihy",
  video: "Videa",
  article: "Články",
  blog: "Blogy",
  reel: "Reelska",
  music: "Hudba",
  other: "Ostatní",
  princip: "Principy",
};

const getVideoId = (url: string): string | null => {
  const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
  if (youtubeMatch) return youtubeMatch[1];
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return vimeoMatch[1];
  return null;
};

const getVideoEmbedUrl = (url: string): string | null => {
  const videoId = getVideoId(url);
  if (!videoId) return null;
  if (url.includes("youtube.com") || url.includes("youtu.be")) return `https://www.youtube.com/embed/${videoId}`;
  if (url.includes("vimeo.com")) return `https://player.vimeo.com/video/${videoId}`;
  return null;
};

const getVideoThumbnail = (url: string): string | null => {
  const videoId = getVideoId(url);
  if (!videoId) return null;
  if (url.includes("youtube.com") || url.includes("youtu.be")) return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  return null;
};

// ── Types ─────────────────────────────────────────────────────────────────────

interface CategoryTab {
  id: string; // "none" for uncategorized
  label: string;
  items: InspirationItem[];
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function InspiraceDetailPage() {
  const params = useParams();
  const router = useRouter();

  const [allItems, setAllItems] = useState<InspirationItem[]>([]);
  const [categories, setCategories] = useState<InspirationCategory[]>([]);
  const [item, setItem] = useState<InspirationItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!params.id) return;
    (async () => {
      try {
        const [inspRes, catRes] = await Promise.all([
          fetch("/api/inspiration"),
          fetch("/api/inspiration-categories"),
        ]);
        const data: InspirationData & { princips?: InspirationItem[] } = await inspRes.json();
        const catData = await catRes.json();

        const active: InspirationItem[] = [
          ...(data.blogs || []),
          ...(data.videos || []),
          ...(data.books || []),
          ...(data.articles || []),
          ...(data.other || []),
          ...(data.music || []),
          ...(data.reels || []),
          ...(data.princips || []),
        ].filter((i) => i.isActive !== false);

        setAllItems(active);
        setCategories(Array.isArray(catData) ? catData : []);
        const found = active.find((i) => i.id === params.id) || null;
        setItem(found);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [params.id]);

  // ── Derived data ────────────────────────────────────────────────────────────

  // Build category tabs: only categories with ≥1 active inspiration
  const categoryTabs: CategoryTab[] = [];
  for (const cat of categories) {
    const catItems = allItems.filter((i) => i.categoryId === cat.id);
    if (catItems.length > 0) categoryTabs.push({ id: cat.id, label: cat.name, items: catItems });
  }
  const uncategorized = allItems.filter(
    (i) => !i.categoryId || !categories.some((c) => c.id === i.categoryId)
  );
  if (uncategorized.length > 0) categoryTabs.push({ id: "none", label: "Ostatní", items: uncategorized });

  // Active tab = category of the current item (or "none")
  const activeCategoryId = item?.categoryId && categories.some((c) => c.id === item.categoryId)
    ? item.categoryId
    : "none";
  const activeTab = categoryTabs.find((t) => t.id === activeCategoryId) ?? categoryTabs[0];

  // Sidebar items grouped by type, current item's type group first
  const sidebarGroups: { type: string; label: string; items: InspirationItem[] }[] = [];
  if (activeTab) {
    const byType: Record<string, InspirationItem[]> = {};
    for (const i of activeTab.items) {
      if (!byType[i.type]) byType[i.type] = [];
      byType[i.type].push(i);
    }
    const currentType = item?.type || "";
    const types = Object.keys(byType).sort((a, b) => {
      if (a === currentType) return -1;
      if (b === currentType) return 1;
      return 0;
    });
    for (const t of types) {
      sidebarGroups.push({ type: t, label: TYPE_GROUP_LABEL[t] || t, items: byType[t] });
    }
  }

  // ── Render helpers ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <main className="min-h-screen py-16 md:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-foreground/60">Načítání...</p>
        </div>
      </main>
    );
  }

  if (!item) {
    return (
      <main className="min-h-screen py-16 md:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-foreground/60 mb-4">Inspirace nenalezena</p>
          <button
            onClick={() => router.push("/inspirace")}
            className="px-6 py-3 bg-accent text-white rounded-full hover:bg-accent-hover transition-colors"
          >
            Zpět na inspirace
          </button>
        </div>
      </main>
    );
  }

  const Icon = TYPE_ICON[item.type] || HelpCircle;
  const videoEmbedUrl = (item.type === "video" || item.type === "music") ? getVideoEmbedUrl(item.url) : null;
  const videoThumbnail = item.type === "video" && !videoEmbedUrl ? (item.thumbnail || getVideoThumbnail(item.url)) : null;

  return (
    <main className="min-h-screen py-16 md:py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Category tabs */}
        {categoryTabs.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {categoryTabs.map((tab) => (
              <Link
                key={tab.id}
                href={`/inspirace/${tab.items[0]?.id ?? ""}`}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                  tab.id === activeCategoryId
                    ? "bg-accent text-white"
                    : "bg-white/85 border border-white/60 shadow-sm hover:shadow-md hover:border-accent/30 hover:text-accent backdrop-blur"
                }`}
              >
                {tab.label}
              </Link>
            ))}
          </div>
        )}

        {/* Two-column layout */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">

          {/* LEFT sidebar */}
          {sidebarGroups.length > 0 && (
            <aside className="w-full lg:w-72 flex-shrink-0 lg:sticky lg:top-24">
              <div className="paper-card rounded-[24px] px-4 py-5 space-y-4">
                {sidebarGroups.map((group) => {
                  const GroupIcon = TYPE_ICON[group.type] || HelpCircle;
                  return (
                    <div key={group.type}>
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-foreground/40 px-1 mb-2">
                        <GroupIcon size={12} />
                        {group.label}
                      </div>
                      <ul className="space-y-0.5">
                        {group.items.map((i) => {
                          const isActive = i.id === item.id;
                          return (
                            <li key={i.id}>
                              <Link
                                href={`/inspirace/${i.id}`}
                                className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-all flex items-start gap-2 ${
                                  isActive
                                    ? "bg-accent/10 text-accent font-semibold"
                                    : "hover:bg-black/5 text-foreground/65 hover:text-foreground"
                                }`}
                              >
                                <span className="leading-snug line-clamp-2">{i.title}</span>
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </aside>
          )}

          {/* RIGHT main */}
          <div className="flex-1 min-w-0">
            <div className="relative overflow-hidden rounded-[32px] border border-white/40 bg-white/80 shadow-xl backdrop-blur-xl backdrop-saturate-150 px-6 py-8 md:px-10 md:py-10">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <Icon className="text-accent" size={24} />
                  <span className="px-3 py-1 bg-accent/10 text-accent text-sm font-semibold rounded-full">
                    {TYPE_LABEL[item.type] || "Ostatní"}
                  </span>
                </div>

                <h1 className="text-4xl md:text-5xl font-bold text-foreground">{item.title}</h1>

                {(item.type === "blog" || item.author) && (
                  <p className="text-lg text-foreground/60">Autor: {item.type === "blog" ? "Matěj Mauler" : item.author}</p>
                )}

                {item.type !== "blog" && item.type !== "princip" && (
                  <p className="text-lg text-foreground/80 leading-relaxed">{item.description}</p>
                )}

                {/* Popisek – pro blog, nad obsahem */}
                {item.type === "blog" && item.description && (
                  <p className="text-lg text-foreground/80 leading-relaxed pb-6 border-b border-black/10">
                    {item.description}
                  </p>
                )}

                {/* Book Cover */}
                {item.type === "book" && item.imageUrl && item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-fit rounded-xl overflow-hidden border-2 border-black/10 hover:border-accent/50 transition-colors shadow-lg hover:shadow-xl"
                  >
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className={`w-40 sm:w-48 aspect-[2/3] ${item.bookCoverFit === "contain" ? "object-contain" : "object-cover"}`}
                      style={item.bookCoverFit !== "contain" ? { objectPosition: getBookCoverObjectPosition(item) } : undefined}
                    />
                  </a>
                )}

                {/* Music / Video – YouTube embed */}
                {(item.type === "music" || item.type === "video") && videoEmbedUrl && (
                  <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black">
                    <iframe
                      src={videoEmbedUrl}
                      className="absolute inset-0 w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                )}

                {/* Video Thumbnail Link */}
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

                {/* Video Direct Link */}
                {item.type === "video" && !videoEmbedUrl && !videoThumbnail && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block px-8 py-4 bg-accent text-white rounded-full font-semibold hover:bg-accent-hover transition-colors"
                  >
                    Otevřít video →
                  </a>
                )}

                {/* Blog Content */}
                {item.type === "blog" && item.content && (
                  <SelectionShareBar className="max-w-none">
                    <div className="blog-detail-content max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {item.content}
                      </ReactMarkdown>
                    </div>
                  </SelectionShareBar>
                )}

                {/* Princip Content */}
                {item.type === "princip" && item.content && (
                  <div className="prose prose-sm max-w-none text-foreground/80 leading-relaxed">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {item.content}
                    </ReactMarkdown>
                  </div>
                )}

                {/* Princip bez content – description */}
                {item.type === "princip" && !item.content && item.description && (
                  <p className="text-lg text-foreground/80 leading-relaxed">{item.description}</p>
                )}

                {/* Music bez YouTube – odkaz na přehrávač */}
                {item.type === "music" && !videoEmbedUrl && item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-8 py-4 bg-accent text-white rounded-full font-semibold hover:bg-accent-hover transition-colors"
                  >
                    Otevřít v přehrávači
                    <span aria-hidden>→</span>
                  </a>
                )}

                {/* External link for non-blog/video/music/princip */}
                {item.type !== "blog" && item.type !== "video" && item.type !== "music" && item.type !== "princip" && item.url && item.url !== "#" && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-8 py-4 bg-accent text-white rounded-full font-semibold hover:bg-accent-hover transition-colors"
                  >
                    {item.type === "book" ? "Koupit / Zobrazit na partnerské stránce" : "Otevřít odkaz"}
                    <span aria-hidden>→</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Back link */}
        <div className="pt-2">
          <Link
            href="/inspirace"
            className="text-sm text-foreground/55 hover:text-foreground transition-colors"
          >
            ← Zpět na Inspirace
          </Link>
        </div>

      </div>
    </main>
  );
}

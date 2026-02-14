"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { InspirationData, InspirationItem } from "@/lib/inspiration";
import type { NewsletterCampaign } from "@/lib/newsletter-campaigns-db";
import { Book, Video, FileText, PenTool, HelpCircle, Mail, Music } from "lucide-react";

type FilterType = "clanky" | "knihy" | "videa" | "ostatni" | "hudba";

const getTypeLabel = (type: string): string => {
  switch (type) {
    case "blog": return "Blog";
    case "video": return "Video";
    case "book": return "Kniha";
    case "article": return "Článek";
    case "other": return "Ostatní";
    case "music": return "Hudba";
    case "newsletter": return "Newsletter";
    default: return type;
  }
};

const getTypeIcon = (type: string) => {
  switch (type) {
    case "blog": return PenTool;
    case "video": return Video;
    case "book": return Book;
    case "article": return FileText;
    case "other": return HelpCircle;
    case "music": return Music;
    case "newsletter": return Mail;
    default: return FileText;
  }
};

const getVideoId = (url: string): string | null => {
  const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
  if (youtubeMatch) return youtubeMatch[1];
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return vimeoMatch[1];
  return null;
};

const getVideoThumbnail = (url: string): string | null => {
  const videoId = getVideoId(url);
  if (!videoId) return null;
  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  }
  return null;
};

const getYouTubeEmbedUrl = (url: string): string | null => {
  const videoId = getVideoId(url);
  if (!videoId || (!url.includes("youtube.com") && !url.includes("youtu.be"))) return null;
  return `https://www.youtube.com/embed/${videoId}`;
};

interface DisplayItem {
  id: string;
  type: string;
  title: string;
  description: string;
  author?: string;
  thumbnail?: string;
  imageUrl?: string;
  url: string;
  href: string;
  createdAt: string;
  sentAt?: string;
}

const TYPE_FILTERS: { value: FilterType; label: string }[] = [
  { value: "clanky", label: "Články" },
  { value: "knihy", label: "Knihy" },
  { value: "videa", label: "Videa" },
  { value: "hudba", label: "Hudba" },
  { value: "ostatni", label: "Ostatní" },
];

function renderItemCard(
  item: DisplayItem,
  index: number,
  router: ReturnType<typeof useRouter>
) {
  const Icon = getTypeIcon(item.type);
  const videoThumbnail =
    item.type === "video"
      ? (item.thumbnail || getVideoThumbnail(item.url))
      : null;

  return (
    <button
      key={`${item.type}-${item.id}`}
      onClick={() => router.push(item.href)}
      className="block text-left w-full cursor-pointer"
    >
      <article
        className="bg-white rounded-2xl p-6 border-2 border-black/5 hover:border-accent/50 transition-all hover:shadow-xl hover:-translate-y-1 space-y-4 h-full"
        style={{
          transform: `rotate(${index % 2 === 0 ? "-0.5deg" : "0.5deg"})`,
        }}
      >
        {item.type === "video" && videoThumbnail && (
          <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black mb-4">
            <img
              src={videoThumbnail}
              alt={item.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center">
                <Video className="w-6 h-6 text-accent ml-1" />
              </div>
            </div>
          </div>
        )}
        {item.type === "book" && item.imageUrl && (
          <div className="w-full aspect-[2/3] max-h-48 rounded-xl overflow-hidden bg-gray-100 mb-4">
            <img
              src={item.imageUrl}
              alt={item.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        {item.type === "music" && (item.thumbnail || getVideoThumbnail(item.url)) && (
          <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black mb-4">
            <img
              src={item.thumbnail || getVideoThumbnail(item.url)!}
              alt={item.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <Music className="w-12 h-12 text-white" />
            </div>
          </div>
        )}
        <div className="flex items-center gap-2">
          <Icon className="text-accent" size={18} />
          <span className="inline-block px-3 py-1 bg-accent/10 text-accent text-sm font-semibold rounded-full border border-accent/20">
            {getTypeLabel(item.type)}
          </span>
        </div>
        <h3 className="text-xl font-semibold text-foreground">{item.title}</h3>
        {item.author && (
          <p className="text-sm text-foreground/60">Autor: {item.author}</p>
        )}
        <p className="text-foreground/70 leading-relaxed line-clamp-2">
          {item.description}
        </p>
      </article>
    </button>
  );
}

export default function InspiracePage() {
  const router = useRouter();
  const [inspirationData, setInspirationData] = useState<InspirationData | null>(null);
  const [newsletters, setNewsletters] = useState<NewsletterCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType | "vse">("vse");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [inspirationRes, newslettersRes] = await Promise.all([
          fetch("/api/inspiration"),
          fetch("/api/newsletters"),
        ]);
        setInspirationData(await inspirationRes.json());
        setNewsletters(await newslettersRes.json());
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getMusicItems = (): DisplayItem[] => {
    const items: DisplayItem[] = [];
    if (!inspirationData?.music) return items;
    (inspirationData.music)
      .filter((i) => i.isActive !== false)
      .forEach((item) => {
        items.push({
          id: item.id,
          type: "music",
          title: item.title,
          description: item.description,
          author: item.author,
          thumbnail: item.thumbnail,
          imageUrl: (item as InspirationItem).imageUrl,
          url: item.url,
          href: `/inspirace/${item.id}`,
          createdAt: item.createdAt,
        });
      });
    return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  };

  const getCurrentListeningMusic = (): DisplayItem | null => {
    if (!inspirationData?.music) return null;
    const current = inspirationData.music.find(
      (i) => i.isActive !== false && (i as InspirationItem & { isCurrentListening?: boolean }).isCurrentListening === true
    );
    if (!current) return null;
    return {
      id: current.id,
      type: "music",
      title: current.title,
      description: current.description,
      author: current.author,
      thumbnail: current.thumbnail,
      imageUrl: (current as InspirationItem).imageUrl,
      url: current.url,
      href: `/inspirace/${current.id}`,
      createdAt: current.createdAt,
    };
  };

  const getInspiraceItems = (): DisplayItem[] => {
    const items: DisplayItem[] = [];
    if (!inspirationData) return items;

    // Doporučení: video, book, article, other – BEZ hudby
    const inspiraceTypes = ["video", "book", "article", "other"] as const;
    for (const type of inspiraceTypes) {
      const arr = inspirationData[type === "video" ? "videos" : type === "book" ? "books" : type === "article" ? "articles" : "other"];
      (arr || [])
        .filter((i) => i.isActive !== false)
        .forEach((item) => {
          items.push({
            id: item.id,
            type: item.type,
            title: item.title,
            description: item.description,
            author: item.author,
            thumbnail: item.thumbnail,
            imageUrl: (item as InspirationItem).imageUrl,
            url: item.url,
            href: `/inspirace/${item.id}`,
            createdAt: item.createdAt,
          });
        });
    }
    return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  };

  const getBlogItems = (): DisplayItem[] => {
    const items: DisplayItem[] = [];

    if (inspirationData) {
      (inspirationData.blogs || [])
        .filter((i) => i.isActive !== false)
        .forEach((item) => {
          items.push({
            id: item.id,
            type: "blog",
            title: item.title,
            description: item.description,
            author: "Matěj Mauler",
            url: "",
            href: `/inspirace/${item.id}`,
            createdAt: item.createdAt,
          });
        });
    }

    newsletters.forEach((n) => {
      const title = n.sentAt
        ? `Newsletter - ${new Date(n.sentAt).toLocaleDateString("cs-CZ", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}`
        : n.subject;
      items.push({
        id: n.id,
        type: "newsletter",
        title,
        description: (n.body || "").replace(/<[^>]+>/g, "").substring(0, 150) + "...",
        author: "Matěj Mauler",
        url: "",
        href: `/newsletter/${n.id}`,
        createdAt: typeof n.createdAt === "string" ? n.createdAt : n.createdAt?.toISOString?.() || "",
        sentAt: n.sentAt ? (typeof n.sentAt === "string" ? n.sentAt : n.sentAt?.toISOString?.()) : undefined,
      });
    });

    return items.sort((a, b) => {
      const dateA = a.sentAt || a.createdAt;
      const dateB = b.sentAt || b.createdAt;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });
  };

  const getFilteredItems = (): DisplayItem[] => {
    const inspirace = getInspiraceItems();
    const blog = getBlogItems();
    const music = getMusicItems();
    const all = [...inspirace, ...blog, ...music];
    if (filter === "vse" || filter === null) return all;
    if (filter === "clanky") return all.filter((i) => i.type === "blog" || i.type === "newsletter");
    if (filter === "knihy") return all.filter((i) => i.type === "book");
    if (filter === "videa") return all.filter((i) => i.type === "video");
    if (filter === "hudba") return music;
    if (filter === "ostatni") return all.filter((i) => i.type === "article" || i.type === "other");
    return all;
  };

  const inspiraceItems = getInspiraceItems();
  const blogItems = getBlogItems();
  const currentListening = getCurrentListeningMusic();
  const filteredItems = getFilteredItems();

  const handleFilterClick = (f: FilterType) => {
    setFilter((prev) => (prev === f ? "vse" : f));
  };

  const showSplitLayout = filter === "vse" || filter === null;

  if (loading) {
    return (
      <main className="min-h-screen py-16 md:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-foreground/60">Načítání...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen py-16 md:py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground">
            Inspirace
          </h1>
          <p className="text-lg md:text-xl text-foreground/80 max-w-2xl mx-auto">
            Inspiruj se články, knihami, videi a dalšími zdroji.
          </p>
        </div>

        {/* Filtry: Vše | Články Knihy Videa Hudba Ostatní */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            onClick={() => setFilter("vse")}
            className={`px-5 py-2.5 rounded-full font-semibold transition-colors ${
              filter === "vse" || filter === null
                ? "bg-accent text-white"
                : "bg-white border-2 border-black/10 hover:border-accent hover:text-accent"
            }`}
          >
            Vše
          </button>
          <span className="hidden sm:inline w-px h-6 bg-black/15" aria-hidden />
          {TYPE_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => handleFilterClick(f.value)}
              className={`px-5 py-2.5 rounded-full font-semibold transition-colors ${
                filter === f.value
                  ? "bg-accent text-white"
                  : "bg-white border-2 border-black/10 hover:border-accent hover:text-accent"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {showSplitLayout ? (
          /* Split layout: inspirace vlevo, články vpravo */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
            <div className="lg:col-span-2 space-y-6">
              <h2 className="text-2xl font-semibold text-foreground">Knihovna</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {inspiraceItems.length === 0 ? (
                  <p className="text-foreground/60 col-span-full">Zatím žádná doporučení.</p>
                ) : (
                  inspiraceItems.map((item, index) => renderItemCard(item, index, router))
                )}
              </div>
            </div>
            <div className="space-y-6">
              {/* Co právě poslouchám – jeden vybraný song s YouTube playerem */}
              {currentListening && (
                <div className="space-y-3">
                  <h2 className="text-2xl font-semibold text-foreground">Co právě poslouchám</h2>
                  <div className="rounded-2xl overflow-hidden border-2 border-black/5 bg-white">
                    {getYouTubeEmbedUrl(currentListening.url) ? (
                      <>
                        <div className="relative w-full aspect-video">
                          <iframe
                            src={getYouTubeEmbedUrl(currentListening.url)!}
                            className="absolute inset-0 w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            title={currentListening.title}
                          />
                        </div>
                        <div className="p-4 border-t border-black/5">
                          <h3 className="font-semibold text-foreground">{currentListening.title}</h3>
                          {currentListening.author && (
                            <p className="text-sm text-foreground/60">{currentListening.author}</p>
                          )}
                          <button
                            onClick={() => router.push(currentListening.href)}
                            className="mt-2 text-sm text-accent font-semibold hover:underline"
                          >
                            Detail →
                          </button>
                        </div>
                      </>
                    ) : (
                      <a
                        href={currentListening.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-4 hover:bg-black/5 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Music className="text-accent flex-shrink-0" size={28} />
                          <div>
                            <h3 className="font-semibold text-foreground">{currentListening.title}</h3>
                            {currentListening.author && (
                              <p className="text-sm text-foreground/60">{currentListening.author}</p>
                            )}
                            <span className="text-sm text-accent font-semibold">Otevřít v přehrávači →</span>
                          </div>
                        </div>
                      </a>
                    )}
                  </div>
                </div>
              )}
              <h2 className="text-2xl font-semibold text-foreground">Články</h2>
              <div className="flex flex-col gap-4">
                {blogItems.length === 0 ? (
                  <p className="text-foreground/60">Zatím žádné články.</p>
                ) : (
                  blogItems.map((item) => {
                    const Icon = getTypeIcon(item.type);
                    return (
                      <button
                        key={`${item.type}-${item.id}`}
                        onClick={() => router.push(item.href)}
                        className="block text-left w-full cursor-pointer"
                      >
                        <article className="bg-white rounded-xl p-4 border-2 border-black/5 hover:border-accent/50 transition-all hover:shadow-lg">
                          <div className="flex items-start gap-3">
                            <Icon className="text-accent flex-shrink-0 mt-0.5" size={18} />
                            <div className="min-w-0">
                              <h3 className="font-semibold text-foreground line-clamp-2">{item.title}</h3>
                              {item.author && (
                                <p className="text-sm text-foreground/60 mt-0.5">Autor: {item.author}</p>
                              )}
                              <p className="text-sm text-foreground/60 mt-1 line-clamp-2">{item.description}</p>
                            </div>
                          </div>
                        </article>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Full-width filtered grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredItems.length === 0 ? (
              <p className="col-span-full text-center text-foreground/60 py-12">
                Zatím žádné položky.
              </p>
            ) : (
              filteredItems.map((item, index) => renderItemCard(item, index, router))
            )}
          </div>
        )}
      </div>
    </main>
  );
}

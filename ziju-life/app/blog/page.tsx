"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { InspirationData, InspirationItem } from "@/lib/inspiration";
import type { NewsletterCampaign } from "@/lib/newsletter-campaigns-db";
import { Book, Video, FileText, PenTool, HelpCircle, Mail } from "lucide-react";

type FilterType = "all" | "blog" | "newsletter";

const getTypeLabel = (type: string): string => {
  switch (type) {
    case "blog": return "Blog";
    case "video": return "Video";
    case "book": return "Kniha";
    case "article": return "Článek";
    case "other": return "Ostatní";
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
    case "newsletter": return Mail;
    default: return FileText;
  }
};

const getVideoId = (url: string): string | null => {
  // YouTube
  const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
  if (youtubeMatch) return youtubeMatch[1];
  
  // Vimeo
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
  
  if (url.includes("vimeo.com")) {
    return null; // Vimeo requires API call for thumbnail
  }
  
  return null;
};

interface BlogItem {
  id: string;
  title: string;
  description: string;
  type: string;
  createdAt: string;
  sentAt?: string;
  author?: string;
  thumbnail?: string;
  url?: string;
}

export default function InspiracePage() {
  const router = useRouter();
  const [data, setData] = useState<InspirationData | null>(null);
  const [newsletters, setNewsletters] = useState<NewsletterCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [inspirationRes, newslettersRes] = await Promise.all([
        fetch("/api/inspiration"),
        fetch("/api/newsletters"),
      ]);
      
      const inspirationData = await inspirationRes.json();
      const newslettersData = await newslettersRes.json();
      
      setData(inspirationData);
      setNewsletters(newslettersData);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setLoading(false);
    }
  };

  const getAllItems = (): BlogItem[] => {
    const items: BlogItem[] = [];
    
    // Add inspiration items
    if (data) {
      data.blogs
        .filter(item => item.isActive !== false)
        .forEach(item => {
          items.push({
            id: item.id,
            title: item.title,
            description: item.description,
            type: item.type,
            createdAt: item.createdAt,
            author: item.author,
            thumbnail: item.thumbnail,
            url: item.url,
          });
        });
    }
    
    // Add newsletters
    newsletters.forEach(newsletter => {
      const newsletterTitle = newsletter.sentAt
        ? `Newsletter - ${new Date(newsletter.sentAt).toLocaleDateString("cs-CZ", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}`
        : newsletter.subject;
      
      // Extract text from HTML body for description
      const bodyText = newsletter.body 
        ? newsletter.body.replace(/<[^>]+>/g, '').substring(0, 200) + '...'
        : '';
      
      items.push({
        id: newsletter.id,
        title: newsletterTitle,
        description: bodyText,
        type: "newsletter",
        createdAt: typeof newsletter.createdAt === 'string' 
          ? newsletter.createdAt 
          : newsletter.createdAt.toISOString(),
        sentAt: newsletter.sentAt 
          ? (typeof newsletter.sentAt === 'string' 
              ? newsletter.sentAt 
              : newsletter.sentAt.toISOString())
          : undefined,
      });
    });
    
    return items.sort((a, b) => {
      const dateA = a.sentAt || a.createdAt;
      const dateB = b.sentAt || b.createdAt;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });
  };

  const getFilteredItems = (): BlogItem[] => {
    const allItems = getAllItems();
    if (filter === "all") return allItems;
    return allItems.filter(item => item.type === filter);
  };

  const filteredItems = getFilteredItems();

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
            Blog
          </h1>
          <p className="text-lg md:text-xl text-foreground/80 max-w-2xl mx-auto">
            Všechno, co jsem se naučil, testoval a prožil. Články, experimenty a myšlenky, které měnily můj život.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <button
            onClick={() => setFilter("all")}
            className={`px-6 py-2 rounded-full font-semibold transition-colors ${
              filter === "all"
                ? "bg-accent text-white"
                : "bg-white border-2 border-black/10 hover:border-accent hover:text-accent"
            }`}
          >
            Všechno
          </button>
          <button
            onClick={() => setFilter("blog")}
            className={`px-6 py-2 rounded-full font-semibold transition-colors ${
              filter === "blog"
                ? "bg-accent text-white"
                : "bg-white border-2 border-black/10 hover:border-accent hover:text-accent"
            }`}
          >
            Blog
          </button>
          <button
            onClick={() => setFilter("newsletter")}
            className={`px-6 py-2 rounded-full font-semibold transition-colors ${
              filter === "newsletter"
                ? "bg-accent text-white"
                : "bg-white border-2 border-black/10 hover:border-accent hover:text-accent"
            }`}
          >
            Newslettery
          </button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredItems.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-foreground/60">Zatím žádné inspirace.</p>
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const Icon = getTypeIcon(item.type);
              const videoThumbnail = item.type === "video" ? (item.thumbnail || (item.url ? getVideoThumbnail(item.url) : null)) : null;
              
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.type === "newsletter") {
                      router.push(`/newsletter/${item.id}`);
                    } else {
                      router.push(`/blog/${item.id}`);
                    }
                  }}
                  className="block text-left w-full cursor-pointer"
                >
                  <article
                    className="bg-white rounded-2xl p-6 md:p-8 border-2 border-black/5 hover:border-accent/50 transition-all hover:shadow-xl hover:-translate-y-1 space-y-4 transform h-full"
                    style={{ transform: `rotate(${index % 2 === 0 ? '-0.5deg' : '0.5deg'})` }}
                  >
                    {/* Video Thumbnail */}
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
                    
                    <div className="flex items-center gap-2">
                      <Icon className="text-accent" size={18} />
                      <span className="inline-block px-3 py-1 bg-accent/10 text-accent text-sm font-semibold rounded-full border border-accent/20">
                        {getTypeLabel(item.type)}
                      </span>
                    </div>
                    <h2 className="text-xl md:text-2xl text-foreground" style={{ fontWeight: 600 }}>
                      {item.title}
                    </h2>
                    {item.author && (
                      <p className="text-sm text-foreground/60">Autor: {item.author}</p>
                    )}
                    <p className="text-foreground/70 leading-relaxed">
                      {item.description}
                    </p>
                  </article>
                </button>
              );
            })
          )}
        </div>
      </div>
    </main>
  );
}

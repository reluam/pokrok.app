"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Book, Video, FileText, PenTool, HelpCircle } from "lucide-react";
import { SelectionShareBar } from "@/components/SelectionShareBar";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { InspirationItem } from "@/lib/inspiration";

const getTypeIcon = (type: string) => {
  switch (type) {
    case "blog": return PenTool;
    case "video": return Video;
    case "book": return Book;
    case "article": return FileText;
    case "other": return HelpCircle;
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

const getVideoEmbedUrl = (url: string): string | null => {
  const videoId = getVideoId(url);
  if (!videoId) return null;
  
  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    return `https://www.youtube.com/embed/${videoId}`;
  }
  
  if (url.includes("vimeo.com")) {
    return `https://player.vimeo.com/video/${videoId}`;
  }
  
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

export default function InspiraceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [item, setItem] = useState<InspirationItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchItem();
    }
  }, [params.id]);

  const fetchItem = async () => {
    try {
      const res = await fetch("/api/inspiration");
      const data = await res.json();
      
      const allItems = [
        ...data.blogs,
        ...data.videos,
        ...data.books,
        ...data.articles,
        ...data.other,
      ].filter((i: InspirationItem) => i.isActive !== false); // Only show active items
      
      const foundItem = allItems.find((i: InspirationItem) => i.id === params.id);
      setItem(foundItem || null);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching item:", error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen py-16 md:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-foreground/60">Načítání...</p>
        </div>
      </main>
    );
  }

  if (!item) {
    return (
      <main className="min-h-screen py-16 md:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
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

  const Icon = getTypeIcon(item.type);
  const videoEmbedUrl = item.type === "video" ? getVideoEmbedUrl(item.url) : null;
  const videoThumbnail = item.type === "video" && !videoEmbedUrl ? (item.thumbnail || getVideoThumbnail(item.url)) : null;

  return (
    <main className="min-h-screen py-16 md:py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <button
          onClick={() => router.push("/inspirace")}
          className="flex items-center gap-2 text-foreground/70 hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft size={20} />
          <span>Zpět na inspirace</span>
        </button>

        <div className="flex items-center gap-3 mb-4">
          <Icon className="text-accent" size={24} />
          <span className="px-3 py-1 bg-accent/10 text-accent text-sm font-semibold rounded-full">
            {item.type === "blog" ? "Blog" : 
             item.type === "video" ? "Video" : 
             item.type === "book" ? "Kniha" : 
             item.type === "article" ? "Článek" : "Ostatní"}
          </span>
        </div>

        <h1 className="text-4xl md:text-5xl font-bold text-foreground">{item.title}</h1>

        {(item.type === "blog" || item.author) && (
          <p className="text-lg text-foreground/60">Autor: {item.type === "blog" ? "Matěj Mauler" : item.author}</p>
        )}

        {item.type !== "blog" && (
          <p className="text-lg text-foreground/80 leading-relaxed">{item.description}</p>
        )}

        {/* Popisek - pro blog, nad obsahem */}
        {item.type === "blog" && item.description && (
          <p className="text-lg text-foreground/80 leading-relaxed pb-6 border-b border-black/10">
            {item.description}
          </p>
        )}

        {/* Book Cover – klik vede na partnerskou stránku */}
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
              className="w-40 sm:w-48 object-cover aspect-[2/3]"
            />
          </a>
        )}

        {/* Video Embed */}
        {item.type === "video" && videoEmbedUrl && (
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

        {/* Tlačítko pro otevření partnerské / externí stránky */}
        {item.type !== "blog" && item.type !== "video" && item.url && (
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
    </main>
  );
}

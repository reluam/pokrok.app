"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Book, Video, FileText, PenTool, HelpCircle } from "lucide-react";
import type { InspirationData, InspirationItem } from "@/lib/inspiration";

const getTypeLabel = (type: string): string => {
  switch (type) {
    case "blog": return "Blog";
    case "video": return "Video";
    case "book": return "Kniha";
    case "article": return "Článek";
    case "other": return "Ostatní";
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

export default function ContentGrid() {
  const router = useRouter();
  const [data, setData] = useState<InspirationData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/inspiration");
      const data = await res.json();
      setData(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setLoading(false);
    }
  };

  const getAllItems = (): InspirationItem[] => {
    if (!data) return [];
    return data.blogs
      .filter(item => item.isActive !== false) // Only show active items
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 6); // Show only first 6 items
  };

  const items = getAllItems();
  return (
    <section id="posbirane-myslenky" className="relative py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-white/50 paper-texture overflow-hidden">
      <div className="max-w-6xl mx-auto space-y-12 relative z-10">
        <div className="text-center space-y-4">
          <h2 className="text-3xl md:text-4xl lg:text-5xl text-foreground" style={{ fontWeight: 600 }}>
            <span className="hand-drawn-underline">Posbírané myšlenky</span>
          </h2>
          <p className="text-lg md:text-xl text-foreground/80 max-w-2xl mx-auto">
            Snažím se zjistit, jak náš svět vlastně funguje. Své postřehy a experimenty tu sdílím několikrát do měsíce – je to moje hledání způsobů, jak v tomhle chaosu neztratit sebe.
          </p>
        </div>
        
        {loading ? (
          <div className="text-center py-12">
            <p className="text-foreground/60">Načítání inspirací...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-foreground/60">Zatím žádné inspirace.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {items.map((item, index) => {
              const Icon = getTypeIcon(item.type);
              const videoThumbnail = item.type === "video" ? (item.thumbnail || getVideoThumbnail(item.url)) : null;
              
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    router.push(`/blog/${item.id}`);
                  }}
                  className="block text-left w-full cursor-pointer"
                >
                  <article
                    className="bg-white rounded-2xl p-6 md:p-8 border-2 border-black/5 hover:border-accent/50 transition-all hover:shadow-xl hover:-translate-y-1 space-y-4 h-full"
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
                    <h3 className="text-xl md:text-2xl text-foreground" style={{ fontWeight: 600 }}>
                      {item.title}
                    </h3>
                    <p className="text-foreground/70 leading-relaxed">
                      {item.description}
                    </p>
                  </article>
                </button>
              );
            })}
          </div>
        )}
        
        {items.length > 0 && (
          <div className="text-center">
            <Link
              href="/blog"
              className="btn-playful inline-block px-8 py-4 border-2 border-foreground/20 rounded-full text-lg font-semibold hover:border-accent hover:text-accent transition-colors shadow-md hover:shadow-lg"
            >
              Zobrazit všechny články
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

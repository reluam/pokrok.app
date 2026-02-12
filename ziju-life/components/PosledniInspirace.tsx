"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { InspirationData, InspirationItem } from "@/lib/inspiration";
import { Book, Video, FileText, HelpCircle, ArrowRight } from "lucide-react";

const getTypeLabel = (type: string): string => {
  switch (type) {
    case "video": return "Video";
    case "book": return "Kniha";
    case "article": return "Článek";
    case "other": return "Ostatní";
    default: return type;
  }
};

const getTypeIcon = (type: string) => {
  switch (type) {
    case "video": return Video;
    case "book": return Book;
    case "article": return FileText;
    case "other": return HelpCircle;
    default: return FileText;
  }
};

const LIMIT = 6;

export default function PosledniInspirace() {
  const [data, setData] = useState<InspirationData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/inspiration")
      .then((res) => res.json())
      .then((d: InspirationData) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const getLatestItems = (): InspirationItem[] => {
    if (!data) return [];
    const items = [
      ...data.videos,
      ...data.books,
      ...data.articles,
      ...data.other,
    ].filter((item) => item.isActive !== false);
    return items
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, LIMIT);
  };

  const items = getLatestItems();

  if (loading || items.length === 0) {
    return null;
  }

  return (
    <section className="relative py-16 md:py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-12 space-y-4">
          <h2 className="text-3xl md:text-4xl lg:text-5xl text-foreground" style={{ fontWeight: 600 }}>
            <span className="hand-drawn-underline">Poslední inspirace</span>
          </h2>
          <p className="text-lg md:text-xl text-foreground/80 leading-relaxed max-w-2xl mx-auto">
            Co mě v poslední době oslovilo – knihy, videa a články, které mohou pomoct i tobě.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item, index) => {
            const Icon = getTypeIcon(item.type);
            const getVideoThumbnail = (url: string) => {
              const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
              if (youtubeMatch) return `https://img.youtube.com/vi/${youtubeMatch[1]}/mqdefault.jpg`;
              return null;
            };
            const videoThumbnail =
              item.type === "video"
                ? (item.thumbnail || getVideoThumbnail(item.url))
                : null;

            return (
              <Link
                key={item.id}
                href={`/inspirace/${item.id}`}
                className="block text-left w-full"
              >
                <article
                  className="bg-white rounded-2xl p-6 border-2 border-black/5 hover:border-accent/50 transition-all hover:shadow-xl hover:-translate-y-1 h-full"
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
                    </div>
                  )}
                  {item.type === "book" && item.imageUrl && (
                    <div className="w-full aspect-[2/3] max-h-40 rounded-xl overflow-hidden bg-gray-100 mb-4">
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="text-accent" size={18} />
                    <span className="inline-block px-3 py-1 bg-accent/10 text-accent text-sm font-semibold rounded-full border border-accent/20">
                      {getTypeLabel(item.type)}
                    </span>
                  </div>
                  <h3 className="text-xl text-foreground font-semibold mb-1">
                    {item.title}
                  </h3>
                  {item.author && (
                    <p className="text-sm text-foreground/60 mb-2">{item.author}</p>
                  )}
                  <p className="text-foreground/70 text-sm line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                </article>
              </Link>
            );
          })}
        </div>

        <div className="text-center mt-10">
          <Link
            href="/inspirace"
            className="btn-playful inline-flex items-center gap-2 px-8 py-4 bg-accent text-white rounded-full text-lg font-semibold hover:bg-accent-hover transition-colors shadow-lg hover:shadow-xl"
          >
            Všechny inspirace
            <ArrowRight size={20} />
          </Link>
        </div>
      </div>
    </section>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { InspirationData } from "@/lib/inspiration";
import type { NewsletterCampaign } from "@/lib/newsletter-campaigns-db";
import { Book, Video, FileText, PenTool, HelpCircle, Mail } from "lucide-react";
import Link from "next/link";

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

const getVideoThumbnail = (url: string): string | null => {
  const youtubeMatch = url?.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
  if (youtubeMatch) return `https://img.youtube.com/vi/${youtubeMatch[1]}/maxresdefault.jpg`;
  return null;
};

export default function LatestBlogPosts() {
  const router = useRouter();
  const [items, setItems] = useState<BlogItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [inspirationRes, newslettersRes] = await Promise.all([
          fetch("/api/inspiration"),
          fetch("/api/newsletters"),
        ]);
        const inspirationData: InspirationData = await inspirationRes.json();
        const newslettersData: NewsletterCampaign[] = await newslettersRes.json();

        const allItems: BlogItem[] = [];

        (inspirationData?.blogs || [])
          .filter((item) => item.isActive !== false)
          .forEach((item) => {
            allItems.push({
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

        newslettersData.forEach((newsletter) => {
          const newsletterTitle = newsletter.sentAt
            ? `Newsletter - ${new Date(newsletter.sentAt).toLocaleDateString("cs-CZ", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}`
            : newsletter.subject;
          const bodyText = newsletter.body
            ? newsletter.body.replace(/<[^>]+>/g, "").substring(0, 200) + "..."
            : "";
          allItems.push({
            id: newsletter.id,
            title: newsletterTitle,
            description: bodyText,
            type: "newsletter",
            createdAt: typeof newsletter.createdAt === "string"
              ? newsletter.createdAt
              : newsletter.createdAt?.toISOString?.() ?? "",
            sentAt: newsletter.sentAt
              ? typeof newsletter.sentAt === "string"
                ? newsletter.sentAt
                : newsletter.sentAt?.toISOString?.()
              : undefined,
          });
        });

        allItems.sort((a, b) => {
          const dateA = a.sentAt || a.createdAt;
          const dateB = b.sentAt || b.createdAt;
          return new Date(dateB).getTime() - new Date(dateA).getTime();
        });

        setItems(allItems.slice(0, 3));
      } catch (error) {
        console.error("Error fetching latest posts:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <section className="relative py-16 md:py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-12 text-center">
            Nejnovější články
          </h2>
          <p className="text-center text-foreground/60">Načítání...</p>
        </div>
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section className="relative py-16 md:py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-12 text-center">
            Nejnovější články
          </h2>
          <p className="text-center text-foreground/60">Zatím žádné články.</p>
          <div className="text-center mt-6">
            <Link
              href="/blog"
              className="inline-block px-8 py-4 bg-accent text-white rounded-full font-semibold hover:bg-accent-hover transition-colors"
            >
              Přejít na blog
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative py-16 md:py-24 px-4 sm:px-6 lg:px-8 overflow-hidden bg-white/50 paper-texture">
      <div className="max-w-6xl mx-auto relative z-10 space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
            Nejnovější články
          </h2>
          <Link
            href="/blog"
            className="inline-block text-lg text-accent hover:text-accent-hover font-semibold transition-colors"
          >
            Všechny články →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {items.map((item, index) => {
            const Icon = getTypeIcon(item.type);
            const videoThumbnail =
              item.type === "video" && item.url ? getVideoThumbnail(item.url) : null;

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
                  style={{ transform: `rotate(${index % 2 === 0 ? "-0.5deg" : "0.5deg"})` }}
                >
                  {item.type === "video" && videoThumbnail && (
                    <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black mb-4">
                      <img
                        src={videoThumbnail}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <Video className="w-8 h-8 text-white ml-1" />
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
                  {item.author && (
                    <p className="text-sm text-foreground/60">Autor: {item.author}</p>
                  )}
                  <p className="text-foreground/70 leading-relaxed line-clamp-2">
                    {item.description}
                  </p>
                </article>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Book, Video, FileText, PenTool, HelpCircle, Mail } from "lucide-react";
import type { InspirationData, InspirationItem } from "@/lib/inspiration";
import LeadForm from "@/components/LeadForm";

interface MixedItem {
  id: string;
  title: string;
  description: string;
  type: string;
  date: string;
  href: string;
  author?: string;
  thumbnail?: string;
  imageUrl?: string;
  url?: string;
}

const getTypeLabel = (type: string): string => {
  switch (type) {
    case "blog": return "Blog";
    case "newsletter": return "Newsletter";
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
    case "newsletter": return Mail;
    case "video": return Video;
    case "book": return Book;
    case "article": return FileText;
    case "other": return HelpCircle;
    default: return FileText;
  }
};

const getVideoThumbnail = (url: string) => {
  const youtubeMatch = url?.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
  if (youtubeMatch) return `https://img.youtube.com/vi/${youtubeMatch[1]}/mqdefault.jpg`;
  return null;
};

export default function ChooseYourPath() {
  const router = useRouter();
  const [latestItems, setLatestItems] = useState<MixedItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);

  useEffect(() => {
    const fetchLatest = async () => {
      try {
        const inspirationRes = await fetch("/api/inspiration");
        const inspirationData: InspirationData = await inspirationRes.json();

        const items: MixedItem[] = [];

        // Inspirace: videos, books, articles, other
        const inspiraceItems = [
          ...inspirationData.videos,
          ...inspirationData.books,
          ...inspirationData.articles,
          ...inspirationData.other,
        ].filter((i) => i.isActive !== false);

        inspiraceItems.forEach((item) => {
          items.push({
            id: item.id,
            title: item.title,
            description: item.description,
            type: item.type,
            date: item.createdAt,
            href: `/inspirace/${item.id}`,
            author: item.author,
            thumbnail: item.thumbnail,
            imageUrl: (item as InspirationItem).imageUrl,
            url: item.url,
          });
        });

        // Blog inspirations
        (inspirationData.blogs || [])
          .filter((i) => i.isActive !== false)
          .forEach((item) => {
            items.push({
              id: item.id,
              title: item.title,
              description: item.description,
              type: "blog",
              date: item.createdAt,
              href: `/inspirace/${item.id}`,
              author: item.author,
            });
          });

        const sorted = items
          .filter((i) => i.date)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 3);

        setLatestItems(sorted);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingItems(false);
      }
    };
    fetchLatest();
  }, []);

  return (
    <section
      id="choose-your-path"
      className="relative py-20 md:py-28 px-4 sm:px-6 lg:px-8 overflow-hidden"
    >
      <div className="max-w-6xl mx-auto relative z-10 space-y-16">
        {/* Inspirace */}
        <div className="space-y-6">
          <h3 className="text-2xl md:text-3xl font-bold text-foreground text-center">
            Inspiruj se články, knihami, videi a dalšími zdroji.
          </h3>

          {loadingItems ? (
            <p className="text-center text-foreground/60">Načítání...</p>
          ) : latestItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {latestItems.map((item, index) => {
                const Icon = getTypeIcon(item.type);
                const videoThumbnail = item.type === "video" ? (item.thumbnail || getVideoThumbnail(item.url || "")) : null;

                return (
                  <motion.div
                    key={`${item.type}-${item.id}`}
                    initial={{ opacity: 0, y: 28 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.55, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <button
                      onClick={() => router.push(item.href)}
                      className="block text-left w-full cursor-pointer"
                    >
                      <article
                        className="bg-white rounded-2xl p-6 border-2 border-black/5 hover:border-accent/50 transition-all hover:shadow-xl hover:-translate-y-2 h-full"
                        style={{ transform: `rotate(${index % 2 === 0 ? "-0.5deg" : "0.5deg"})` }}
                      >
                      {item.type === "video" && videoThumbnail && (
                        <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black mb-4">
                          <img src={videoThumbnail} alt={item.title} className="w-full h-full object-cover" />
                        </div>
                      )}
                      {item.type === "book" && item.imageUrl && (
                        <div className="w-full aspect-[2/3] max-h-36 rounded-xl overflow-hidden bg-gray-100 mb-4">
                          <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className="text-accent" size={18} />
                        <span className="inline-block px-3 py-1 bg-accent/10 text-accent text-sm font-semibold rounded-full border border-accent/20">
                          {getTypeLabel(item.type)}
                        </span>
                      </div>
                      <h4 className="text-lg font-bold text-foreground mb-1 line-clamp-2">{item.title}</h4>
                      <p className="text-foreground/70 text-sm line-clamp-2 leading-relaxed">{item.description}</p>
                    </article>
                  </button>
                  </motion.div>
                );
              })}
            </div>
          ) : null}

          <div className="text-center">
            <Link
              href="/inspirace"
              className="btn-playful inline-block px-8 py-4 bg-accent text-white rounded-full text-lg font-semibold hover:bg-accent-hover transition-colors shadow-lg hover:shadow-xl"
            >
              Zobrazit více
            </Link>
          </div>
        </div>

        {/* Nebo */}
        <div className="flex items-center justify-center gap-4">
          <div className="flex-1 h-px bg-black/10" />
          <span className="text-xl md:text-2xl font-bold text-foreground px-4">
            Nebo
          </span>
          <div className="flex-1 h-px bg-black/10" />
        </div>

        {/* Koučink – box ve stylu hero sekce */}
        <div
          id="home-coaching"
          className="relative overflow-hidden rounded-[32px] border border-white/40 bg-white/60 shadow-xl backdrop-blur-xl backdrop-saturate-150 px-4 py-8 md:px-10 md:py-10 max-w-4xl mx-auto"
        >
          <div className="absolute inset-0 pointer-events-none opacity-[0.08]">
            {/* lehké dekorace mohou být doplněny později, zatím prázdné pozadí */}
          </div>
          <div className="relative space-y-4">
            <h3 className="text-2xl md:text-3xl font-bold text-foreground text-center">
              Nebo si zarezervuj 30 minutové koučovací sezení se mnou zdarma.
            </h3>
            <p className="text-lg md:text-xl text-foreground/70 leading-relaxed text-center max-w-3xl mx-auto">
              Kde probereme, jak ti můžu pomoct rozklíčovat tvé automatické reakce a pomoct vědomě
              přepsat programy, které tě doposud řídily.{" "}
              <Link href="/koucing" className="text-accent font-semibold hover:underline">
                Zjistit více
              </Link>
            </p>
            <div className="bg-white rounded-2xl p-4 md:p-6 border-2 border-black/5 w-full max-w-xl mx-auto">
              <LeadForm source="homepage" compact />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Book, Video, FileText, PenTool, HelpCircle, Mail } from "lucide-react";
import type { InspirationData, InspirationItem } from "@/lib/inspiration";
import { getBookCoverObjectPosition } from "@/lib/book-cover-position";
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
  bookCoverFit?: "cover" | "contain";
  bookCoverPosition?: string;
  bookCoverPositionX?: number;
  bookCoverPositionY?: number;
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
  const [pathChoice, setPathChoice] = useState<"audit" | "free" | null>(null);
  const [auditPromoRemaining, setAuditPromoRemaining] = useState<number | null>(null);
  const auditPromoTotal = 20;

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
            bookCoverFit: (item as InspirationItem).bookCoverFit,
            bookCoverPosition: (item as InspirationItem).bookCoverPosition,
            bookCoverPositionX: (item as InspirationItem).bookCoverPositionX,
            bookCoverPositionY: (item as InspirationItem).bookCoverPositionY,
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

  useEffect(() => {
    const fetchPromo = async () => {
      try {
        const res = await fetch("/api/booking/audit-promo-stats");
        if (!res.ok) return;
        const data = await res.json();
        if (typeof data.remaining === "number") {
          setAuditPromoRemaining(data.remaining);
        }
      } catch {
        // ignore, necháme null
      }
    };
    fetchPromo();
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
                        className="bg-white rounded-2xl p-6 border-2 border-black/5 shadow-sm hover:border-accent/50 transition-all hover:shadow-xl hover:-translate-y-2 h-full"
                        style={{ transform: `rotate(${index % 2 === 0 ? "-0.5deg" : "0.5deg"})` }}
                      >
                      {item.type === "video" && videoThumbnail && (
                        <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black mb-4">
                          <img src={videoThumbnail} alt={item.title} className="w-full h-full object-cover" />
                        </div>
                      )}
                      {item.type === "book" && item.imageUrl && (
                        <div className="w-full aspect-[2/3] max-h-36 rounded-xl overflow-hidden bg-gray-100 mb-4">
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            className={`w-full h-full ${item.bookCoverFit === "contain" ? "object-contain" : "object-cover"}`}
                            style={
                              item.bookCoverFit !== "contain"
                                ? { objectPosition: getBookCoverObjectPosition(item) }
                                : undefined
                            }
                          />
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

        {/* Koučink CTA – nadpis na pozadí + karty */}
        <div id="home-coaching" className="max-w-4xl mx-auto space-y-6 md:space-y-8">
          <h3 className="text-2xl md:text-3xl font-bold text-foreground text-center max-w-3xl mx-auto">
            Zarezervuj si koučingové sezení, kde projdeme, jak můžeš začít žít život více podle sebe.
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl mx-auto items-start">
            {/* Audit karta */}
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setPathChoice("audit")}
                className="group text-left rounded-2xl border border-white/40 bg-white/80 shadow-xl backdrop-blur-xl backdrop-saturate-150 hover:shadow-2xl hover:-translate-y-2 transition-all px-5 py-5 flex flex-col gap-4 cursor-pointer"
              >
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-lg md:text-xl font-semibold text-foreground">
                    Audit života (90 min)
                  </h4>
                </div>
                <ul className="space-y-2 text-sm md:text-base text-foreground/85">
                  <li className="flex gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-accent" />
                    <span>Jasná mapa tvojí situace</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-accent" />
                    <span>Priority, kam dávat energii</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-accent" />
                    <span>Konkrétní první kroky do praxe</span>
                  </li>
                </ul>
                <div className="pt-2">
                  <div className="w-full py-3 px-5 bg-accent text-white font-bold text-center text-sm md:text-base rounded-full group-hover:bg-accent-hover transition-colors">
                    Chci audit života
                  </div>
                </div>
              </button>
              <p className="text-xs md:text-sm text-foreground/70 px-1">
                Pro prvních {auditPromoTotal} lidí nabízím zvýhodněnou cenu{" "}
                <strong>900 Kč za 90 minut auditu života</strong>.
                <br />
                Zbývá:{" "}
                <strong>
                  {auditPromoRemaining !== null
                    ? Math.max(auditPromoRemaining, 0)
                    : auditPromoTotal}{" "}
                  / {auditPromoTotal}
                </strong>{" "}
                míst.
              </p>
            </div>

            {/* Free konzultace karta */}
            <button
              type="button"
              onClick={() => setPathChoice("free")}
              className="group text-left rounded-2xl border border-white/40 bg-white/80 shadow-xl backdrop-blur-xl backdrop-saturate-150 hover:shadow-2xl hover:-translate-y-2 transition-all px-5 py-5 flex flex-col gap-4 cursor-pointer"
            >
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-lg md:text-xl font-semibold text-foreground/80">
                  20min konzultace zdarma
                </h4>
              </div>
              <ul className="space-y-2 text-sm md:text-base text-foreground/70">
                <li className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-black/20" />
                  <span>Krátký 20min call, kde zjistíme, jestli ti můžu s koučingem reálně pomoct.</span>
                </li>
                <li className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-black/20" />
                  <span>Bez závazku – vyzkoušíš si, jak spolupráce se mnou vypadá v praxi.</span>
                </li>
                <li className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-black/20" />
                  <span>Domluvíme případné další kroky, jen pokud ti to bude dávat smysl.</span>
                </li>
              </ul>
              <div className="pt-2">
                <div className="w-full py-3 px-5 bg-black/[0.03] text-foreground font-semibold text-center text-sm md:text-base rounded-full border border-black/10 transition-colors group-hover:bg-black/10 group-hover:border-black/40">
                  Ještě se rozmýšlím
                </div>
              </div>
            </button>
          </div>

          {pathChoice && (
            <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4 py-8">
              <div className="w-full max-w-md md:max-w-lg bg-white rounded-3xl shadow-2xl border border-black/5 p-5 md:p-7 relative">
                <button
                  type="button"
                  onClick={() => setPathChoice(null)}
                  className="absolute right-4 top-4 text-foreground/50 hover:text-foreground text-sm"
                  aria-label="Zavřít"
                >
                  Zavřít
                </button>
                <div className="space-y-4 pt-2">
                  <h4 className="text-lg md:text-xl font-semibold text-foreground text-center">
                    {pathChoice === "audit"
                      ? "Nejprve vyplň své údaje"
                      : "Nejprve vyplň své údaje"}
                  </h4>
                  <p className="text-sm md:text-base text-foreground/75 text-center">
                    {pathChoice === "audit"
                      ? "Vyplň své údaje a vyber si termín 90min auditu života."
                      : "Vyplň své údaje a vyber si termín 20min konzultace zdarma."}
                  </p>
                  <LeadForm
                    source={pathChoice === "audit" ? "homepage_audit" : "homepage_free"}
                    compact
                    preferredKind={pathChoice === "audit" ? "paid" : "free"}
                    preferredMeetingTypeId={pathChoice === "audit" ? "coaching_paid" : "intro_free"}
                    lockMeetingType
                    onSuccess={() => setPathChoice(null)}
                  />
                  <div className="mt-4 pt-4 border-t border-black/5 flex items-center justify-center gap-5 md:gap-6 text-[11px] md:text-xs text-foreground/60">
                    <div className="flex items-center gap-2">
                      <span className="flex h-2.5 w-2.5 rounded-full bg-accent" />
                      <span>Krok 1: Údaje</span>
                    </div>
                    <div className="flex items-center gap-2 opacity-70">
                      <span className="flex h-2.5 w-2.5 rounded-full border border-accent/40" />
                      <span>Krok 2: Výběr termínu</span>
                    </div>
                    {pathChoice === "audit" && (
                      <div className="flex items-center gap-2 opacity-70">
                        <span className="flex h-2.5 w-2.5 rounded-full border border-accent/40" />
                        <span>Krok 3: Platba</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

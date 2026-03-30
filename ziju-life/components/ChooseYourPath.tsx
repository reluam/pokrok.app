"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface FeedItem {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  type: string;
  published_at: string;
  categories?: string[];
}

const CATEGORY_EMOJI: Record<string, string> = {
  psychology: "🧠",
  neuroscience: "⚡",
  health: "💪",
  productivity: "⏰",
  mindfulness: "🧘",
  relationships: "🤝",
};

export default function ChooseYourPath() {
  const [latestItems, setLatestItems] = useState<FeedItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);

  useEffect(() => {
    const fetchLatest = async () => {
      try {
        const res = await fetch("/api/feed?limit=3");
        const data = await res.json();
        setLatestItems(data.posts ?? []);
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
        <div className="space-y-6">
          <h3 className="text-2xl md:text-3xl font-bold text-foreground text-center">
            Nejnovější z feedu
          </h3>

          {loadingItems ? (
            <p className="text-center text-foreground/60">Načítání...</p>
          ) : latestItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {latestItems.map((item, index) => {
                const emoji = item.categories?.[0] ? CATEGORY_EMOJI[item.categories[0]] ?? "📝" : "📝";

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 28 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.55, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <Link
                      href={`/feed/${item.slug}`}
                      className="block text-left w-full"
                    >
                      <article
                        className="bg-white rounded-2xl p-6 border-2 border-black/5 shadow-sm hover:border-accent/50 transition-all hover:shadow-xl hover:-translate-y-2 h-full"
                        style={{ transform: `rotate(${index % 2 === 0 ? "-0.5deg" : "0.5deg"})` }}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">{emoji}</span>
                          <span className="inline-block px-3 py-1 bg-accent/10 text-accent text-sm font-semibold rounded-full border border-accent/20">
                            {item.type === "digest" ? "Digest" : "Tip"}
                          </span>
                        </div>
                        <h4 className="text-lg font-bold text-foreground mb-1 line-clamp-2">{item.title}</h4>
                        {item.subtitle && (
                          <p className="text-foreground/70 text-sm line-clamp-2 leading-relaxed">{item.subtitle}</p>
                        )}
                      </article>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          ) : null}

          <div className="text-center">
            <Link
              href="/feed"
              className="btn-playful inline-block px-8 py-4 bg-accent text-white rounded-full text-lg font-semibold hover:bg-accent-hover transition-colors shadow-lg hover:shadow-xl"
            >
              Zobrazit více
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

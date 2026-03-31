"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { FeedCard, type CuratedPost } from "@/components/FeedCards";

export default function ChooseYourPath() {
  const [items, setItems] = useState<CuratedPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/feed?limit=3")
      .then((r) => r.json())
      .then((d) => setItems(d.posts ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <section
      id="choose-your-path"
      className="relative py-20 md:py-28 px-4 sm:px-6 lg:px-8 overflow-hidden"
    >
      <div className="max-w-6xl mx-auto relative z-10 space-y-10">
        <div className="text-center space-y-3">
          <h3 className="text-3xl md:text-4xl font-extrabold text-foreground">
            Knihovna
          </h3>
          <p className="text-lg text-foreground/60 max-w-xl mx-auto">
            Knihy, videa, výzkumy a tipy o vědomém žití — vše na jednom místě.
          </p>
        </div>

        {loading ? (
          <p className="text-center text-foreground/40">Načítání...</p>
        ) : items.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 auto-rows-fr">
            {items.map((item, index) => (
              <motion.div
                key={item.id}
                className="h-full"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.5, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
              >
                <FeedCard post={item} />
              </motion.div>
            ))}
          </div>
        ) : null}

        <div className="text-center">
          <Link
            href="/feed"
            className="btn-playful inline-flex items-center gap-2 px-8 py-4 bg-accent text-white rounded-full text-lg font-semibold hover:bg-accent-hover transition-colors shadow-lg hover:shadow-xl"
          >
            Celá knihovna
            <ArrowRight size={20} />
          </Link>
        </div>
      </div>
    </section>
  );
}

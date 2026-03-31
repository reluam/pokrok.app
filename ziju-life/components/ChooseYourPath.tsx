"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FeedCard, type CuratedPost, getItemType } from "@/components/FeedCards";

export default function ChooseYourPath() {
  const [items, setItems] = useState<CuratedPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/feed?limit=8")
      .then((r) => r.json())
      .then((d) => setItems(d.posts ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <section
      id="choose-your-path"
      className="relative py-16 md:py-24 px-4 sm:px-6 lg:px-8 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto relative z-10">
        <h3 className="text-4xl md:text-5xl font-extrabold text-foreground mb-8 md:mb-10">
          Knihovna
        </h3>

        {loading ? (
          <p className="text-center text-foreground/40 py-12">Načítání...</p>
        ) : items.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 auto-rows-[160px] sm:auto-rows-[180px] gap-3">
            {items.map((item, i) => {
              const itemType = getItemType(item.tags);
              const isReel = itemType === "reel";
              return (
                <motion.div
                  key={item.id}
                  className={isReel ? "row-span-2" : "row-span-1"}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.1 }}
                  transition={{ duration: 0.4, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
                >
                  <FeedCard post={item} bento />
                </motion.div>
              );
            })}
          </div>
        ) : null}

        <div className="flex justify-center mt-10">
          <Link
            href="/knihovna"
            className="btn-playful inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-base font-bold bg-accent text-white hover:bg-accent-hover transition-colors shadow-md hover:shadow-lg"
          >
            Celá knihovna &rarr;
          </Link>
        </div>
      </div>
    </section>
  );
}

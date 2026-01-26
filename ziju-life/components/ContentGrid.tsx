"use client";

import { useEffect, useState } from "react";
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

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const months = [
    "Leden", "Únor", "Březen", "Duben", "Květen", "Červen",
    "Červenec", "Srpen", "Září", "Říjen", "Listopad", "Prosinec"
  ];
  return `${months[date.getMonth()]} ${date.getFullYear()}`;
};

export default function ContentGrid() {
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
    return [
      ...data.blogs,
      ...data.videos,
      ...data.books,
      ...data.articles,
      ...data.other,
    ]
      .filter(item => item.isActive !== false) // Only show active items
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 6); // Show only first 6 items
  };

  const items = getAllItems();
  return (
    <section className="relative py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-white/50 paper-texture overflow-hidden">
      <div className="max-w-6xl mx-auto space-y-12 relative z-10">
        <div className="text-center space-y-4">
          <h2 className="text-3xl md:text-4xl lg:text-5xl text-foreground" style={{ fontWeight: 600 }}>
            <span className="hand-drawn-underline">Posbíraná inspirace</span>
          </h2>
          <p className="text-lg md:text-xl text-foreground/80 max-w-2xl mx-auto">
            Články, tipy a experimenty, které mi pomáhají pochopit život. Občas něco napíšu i já.
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
              return (
                <Link
                  key={item.id}
                  href={`/inspirace/${item.id}`}
                  className="block"
                >
                  <article
                    className="bg-white rounded-2xl p-6 md:p-8 border-2 border-black/5 hover:border-accent/50 transition-all hover:shadow-xl hover:-translate-y-1 space-y-4 transform h-full"
                    style={{ transform: `rotate(${index % 2 === 0 ? '-0.5deg' : '0.5deg'})` }}
                  >
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
                    <p className="text-sm text-foreground/50">
                      {formatDate(item.createdAt)}
                    </p>
                  </article>
                </Link>
              );
            })}
          </div>
        )}
        
        {items.length > 0 && (
          <div className="text-center">
            <Link
              href="/inspirace"
              className="btn-playful inline-block px-8 py-4 border-2 border-foreground/20 rounded-full text-lg font-semibold hover:border-accent hover:text-accent transition-colors shadow-md hover:shadow-lg"
            >
              Zobrazit všechny inspirace
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

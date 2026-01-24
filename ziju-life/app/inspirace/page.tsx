"use client";

import { useEffect, useState } from "react";
import type { InspirationData, InspirationItem } from "@/lib/inspiration";
import { Book, Video, FileText, PenTool, HelpCircle } from "lucide-react";

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

export default function InspiracePage() {
  const [data, setData] = useState<InspirationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>("all");

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
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  };

  const filteredItems = selectedType === "all" 
    ? getAllItems()
    : getAllItems().filter(item => item.type === selectedType);

  if (loading) {
    return (
      <main className="min-h-screen py-16 md:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-foreground/60">Načítání...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen py-16 md:py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground">
            Inspirace
          </h1>
          <p className="text-lg md:text-xl text-foreground/80 max-w-2xl mx-auto">
            Všechno, co jsem se naučil, testoval a prožil. Články, experimenty, tipy na knihy a systémy, které měnily můj život.
          </p>
        </div>
        
        {/* Filter */}
        <div className="flex flex-wrap gap-2 justify-center">
          <button
            onClick={() => setSelectedType("all")}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
              selectedType === "all"
                ? "bg-accent text-white"
                : "bg-white border border-black/10 text-foreground/70 hover:border-accent/30"
            }`}
          >
            Vše
          </button>
          {["blog", "video", "book", "article", "other"].map((type) => {
            const Icon = getTypeIcon(type);
            return (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors flex items-center gap-2 ${
                  selectedType === type
                    ? "bg-accent text-white"
                    : "bg-white border border-black/10 text-foreground/70 hover:border-accent/30"
                }`}
              >
                <Icon size={16} />
                {getTypeLabel(type)}
              </button>
            );
          })}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredItems.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-foreground/60">Zatím žádné inspirace.</p>
            </div>
          ) : (
            filteredItems.map((item) => {
              const Icon = getTypeIcon(item.type);
              return (
            <article
                  key={item.id}
              className="bg-white rounded-2xl p-6 md:p-8 border border-black/5 hover:border-accent/30 transition-all hover:shadow-lg space-y-4"
            >
                  <div className="flex items-center gap-2">
                    <Icon className="text-accent" size={20} />
              <span className="inline-block px-3 py-1 bg-accent/10 text-accent text-sm font-semibold rounded-full">
                      {getTypeLabel(item.type)}
              </span>
                  </div>
              <h2 className="text-xl md:text-2xl font-bold text-foreground">
                {item.title}
              </h2>
                  {item.author && (
                    <p className="text-sm text-foreground/60">Autor: {item.author}</p>
                  )}
              <p className="text-foreground/70 leading-relaxed">
                {item.description}
              </p>
                  <a
                    href={`/inspirace/${item.id}`}
                    className="inline-block text-accent hover:text-accent-hover transition-colors text-sm font-semibold"
                  >
                    Zobrazit →
                  </a>
            </article>
              );
            })
          )}
        </div>
      </div>
    </main>
  );
}

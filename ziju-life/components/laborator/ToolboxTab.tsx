"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Search, X } from "lucide-react";
import type { ToolboxToolCard } from "@/lib/toolbox";
import { TOOLBOX_CATEGORIES } from "@/lib/toolbox";
import ToolDetailModal from "./ToolDetailModal";
import ToolboxAIAssistant from "./ToolboxAIAssistant";

function DifficultyDots({ level }: { level: number }) {
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          className={`w-1.5 h-1.5 rounded-full ${i <= level ? "bg-foreground/50" : "bg-foreground/15"}`}
        />
      ))}
    </span>
  );
}

function ToolCard({
  tool,
  onClick,
}: {
  tool: ToolboxToolCard;
  onClick: () => void;
}) {
  const category = tool.category
    ? TOOLBOX_CATEGORIES.find((c) => c.id === tool.category)
    : null;

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left paper-card rounded-[20px] p-5 space-y-3 hover:shadow-md hover:border-accent/20 transition-all group cursor-pointer"
    >
      {/* Top: category badge */}
      <div className="flex items-center justify-between">
        {category ? (
          <span className="text-[11px] font-medium text-foreground/45 inline-flex items-center gap-1">
            {category.icon} {category.label}
          </span>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-1.5">
          {tool.toolType === "interactive" && (
            <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200">
              Interaktivní
            </span>
          )}
          {tool.isFeatured && (
            <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-200">
              Doporučeno
            </span>
          )}
        </div>
      </div>

      {/* Title */}
      <h3 className="text-base font-bold text-foreground leading-snug group-hover:text-accent transition-colors">
        {tool.icon && <span className="mr-1.5">{tool.icon}</span>}
        {tool.title}
      </h3>

      {/* Description */}
      <p className="text-sm text-foreground/55 leading-relaxed line-clamp-2">
        {tool.shortDescription}
      </p>

      {/* Footer: difficulty + duration + tags */}
      <div className="flex items-center gap-2 flex-wrap text-xs text-foreground/40">
        {tool.difficulty && <DifficultyDots level={tool.difficulty} />}
        {tool.difficulty && tool.durationEstimate && <span>·</span>}
        {tool.durationEstimate && <span>{tool.durationEstimate}</span>}
      </div>

      {tool.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {tool.tags.slice(0, 4).map((tag) => (
            <span key={tag} className="text-[10px] text-foreground/35 font-medium">
              #{tag}
            </span>
          ))}
          {tool.tags.length > 4 && (
            <span className="text-[10px] text-foreground/30">+{tool.tags.length - 4}</span>
          )}
        </div>
      )}
    </button>
  );
}

// Skeleton card for loading state
function SkeletonCard() {
  return (
    <div className="paper-card rounded-[20px] p-5 space-y-3 animate-pulse">
      <div className="h-3 w-24 bg-black/5 rounded" />
      <div className="h-5 w-3/4 bg-black/8 rounded" />
      <div className="space-y-1.5">
        <div className="h-3 w-full bg-black/5 rounded" />
        <div className="h-3 w-2/3 bg-black/5 rounded" />
      </div>
      <div className="h-3 w-20 bg-black/5 rounded" />
    </div>
  );
}

const PAGE_SIZE = 24;

export default function ToolboxTab({ onNavigateTab }: { onNavigateTab?: (tabId: string) => void }) {
  const [tools, setTools] = useState<ToolboxToolCard[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const fetchTools = useCallback(
    async (opts: { append?: boolean; offset?: number } = {}) => {
      const { append = false, offset = 0 } = opts;
      if (append) setLoadingMore(true);
      else setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (activeCategory) params.set("category", activeCategory);
        if (search.trim()) params.set("q", search.trim());
        params.set("limit", String(PAGE_SIZE));
        params.set("offset", String(offset));

        const res = await fetch(`/api/laborator/toolbox?${params.toString()}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Chyba");

        if (append) {
          setTools((prev) => [...prev, ...(data.tools ?? [])]);
        } else {
          setTools(data.tools ?? []);
        }
        setTotal(data.total ?? 0);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Nepodařilo se načíst nástroje.");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [activeCategory, search]
  );

  // Initial load + reload on filter change
  useEffect(() => {
    fetchTools();
  }, [fetchTools]);

  // Debounced search
  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      // fetchTools will be called by the useEffect above when search changes
    }, 300);
  };

  const loadMore = () => {
    if (loadingMore || tools.length >= total) return;
    fetchTools({ append: true, offset: tools.length });
  };

  const hasMore = tools.length < total;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Nástrojárna</h2>
        <p className="text-sm text-foreground/50 mt-1">
          Sbírka nástrojů pro osobní rozvoj. Každý má popis, návod a zdroje pro hlubší práci.
        </p>
      </div>

      {/* AI Assistant */}
      <ToolboxAIAssistant onSelectTool={(slug) => setSelectedSlug(slug)} />

      {/* Search */}
      <div className="relative">
        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground/30" />
        <input
          type="text"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Hledej nástroj…"
          className="w-full pl-10 pr-10 py-2.5 border-2 border-black/10 rounded-2xl bg-white/80 text-sm focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-foreground/30 hover:text-foreground/60"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Category pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
        <button
          type="button"
          onClick={() => setActiveCategory(null)}
          className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
            !activeCategory
              ? "bg-foreground text-white"
              : "bg-black/5 text-foreground/60 hover:bg-black/10"
          }`}
        >
          Vše
        </button>
        {TOOLBOX_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
            className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
              activeCategory === cat.id
                ? "bg-foreground text-white"
                : "bg-black/5 text-foreground/60 hover:bg-black/10"
            }`}
          >
            {cat.icon} {cat.label}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Results info */}
      {!loading && (
        <p className="text-xs text-foreground/40">
          {total} {total === 1 ? "nástroj" : total >= 2 && total <= 4 ? "nástroje" : "nástrojů"}
          {activeCategory && (
            <> v kategorii <strong>{TOOLBOX_CATEGORIES.find((c) => c.id === activeCategory)?.label}</strong></>
          )}
          {search.trim() && <> pro „{search.trim()}"</>}
        </p>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : tools.length === 0 ? (
        <div className="py-12 text-center text-foreground/50">
          <p className="text-lg font-medium">Žádné nástroje nenalezeny</p>
          <p className="text-sm mt-1">Zkus změnit filtr nebo vyhledávání.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tools.map((tool) => (
              <ToolCard
                key={tool.id}
                tool={tool}
                onClick={() => setSelectedSlug(tool.slug)}
              />
            ))}
          </div>

          {/* Load more */}
          {hasMore && (
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={loadMore}
                disabled={loadingMore}
                className="px-6 py-2.5 rounded-2xl border border-black/10 bg-white text-sm font-medium text-foreground/60 hover:bg-black/5 disabled:opacity-50 transition-colors"
              >
                {loadingMore ? "Načítám…" : "Načíst další"}
              </button>
            </div>
          )}
        </>
      )}

      {/* Detail modal */}
      {selectedSlug && (
        <ToolDetailModal slug={selectedSlug} onClose={() => setSelectedSlug(null)} onNavigateTab={onNavigateTab} />
      )}
    </div>
  );
}

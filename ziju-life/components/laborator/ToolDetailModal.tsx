"use client";

import { useEffect, useState } from "react";
import { X, Book, Video, FileText, Microscope, Headphones, GraduationCap, ExternalLink } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Play } from "lucide-react";
import type { ToolboxTool, ToolSource, ToolSourceType } from "@/lib/toolbox";
import { TOOLBOX_CATEGORIES, INTERACTIVE_TOOL_TABS } from "@/lib/toolbox";
import { useScrollLock } from "@/hooks/useScrollLock";

const SOURCE_ICONS: Record<ToolSourceType, typeof Book> = {
  book: Book,
  video: Video,
  article: FileText,
  research: Microscope,
  podcast: Headphones,
  course: GraduationCap,
};

const SOURCE_LABELS: Record<ToolSourceType, string> = {
  book: "Kniha",
  video: "Video",
  article: "Článek",
  research: "Výzkum",
  podcast: "Podcast",
  course: "Kurz",
};

function DifficultyDots({ level }: { level: number }) {
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          className={`w-2 h-2 rounded-full ${i <= level ? "bg-foreground/60" : "bg-foreground/15"}`}
        />
      ))}
    </span>
  );
}

function SourceItem({ source }: { source: ToolSource }) {
  const Icon = SOURCE_ICONS[source.type] ?? FileText;
  return (
    <div className="flex items-start gap-3 py-2.5">
      <div className="mt-0.5 w-7 h-7 rounded-lg bg-black/5 flex items-center justify-center flex-shrink-0">
        <Icon size={14} className="text-foreground/50" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {source.url ? (
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-foreground hover:text-accent transition-colors inline-flex items-center gap-1"
            >
              {source.title}
              <ExternalLink size={12} className="text-foreground/30" />
            </a>
          ) : (
            <span className="text-sm font-semibold text-foreground">{source.title}</span>
          )}
          <span className="text-[10px] font-medium text-foreground/40 uppercase tracking-wider">
            {SOURCE_LABELS[source.type]}
          </span>
        </div>
        {source.author && (
          <p className="text-xs text-foreground/50">{source.author}</p>
        )}
        {source.note && (
          <p className="text-xs text-foreground/40 mt-0.5 italic">{source.note}</p>
        )}
      </div>
    </div>
  );
}

interface Props {
  slug: string;
  onClose: () => void;
  onNavigateTab?: (tabId: string) => void;
  isSubscriber?: boolean;
}

export default function ToolDetailModal({ slug, onClose, onNavigateTab, isSubscriber = true }: Props) {
  useScrollLock(true);
  const [tool, setTool] = useState<ToolboxTool | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/laborator/toolbox/${encodeURIComponent(slug)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Nepodařilo se načíst nástroj.");
        setTool(data.tool);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Chyba");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [slug]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const category = tool?.category
    ? TOOLBOX_CATEGORIES.find((c) => c.id === tool.category)
    : null;

  // Group sources by type
  const groupedSources = tool?.sources?.reduce<Record<string, ToolSource[]>>((acc, s) => {
    const key = s.type;
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {}) ?? {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" data-lenis-prevent>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-[#FDFDF7] rounded-3xl shadow-2xl border border-black/10">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-white border border-black/10 flex items-center justify-center text-foreground/50 hover:text-foreground/80 hover:border-black/20 transition-colors"
        >
          <X size={18} />
        </button>

        {loading && (
          <div className="py-20 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <div className="p-8">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>
          </div>
        )}

        {tool && !loading && (
          <div className="p-6 md:p-8 space-y-6">
            {/* Header */}
            <div className="space-y-3 pr-10">
              {/* Meta row */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {tool.toolType === "interactive" && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 font-semibold text-emerald-600 border border-emerald-200">
                    Interaktivní
                  </span>
                )}
                {category && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/5 font-medium text-foreground/60">
                    {category.icon} {category.label}
                  </span>
                )}
                {tool.difficulty && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/5 text-foreground/50">
                    <DifficultyDots level={tool.difficulty} />
                  </span>
                )}
                {tool.durationEstimate && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-black/5 text-foreground/50">
                    {tool.durationEstimate}
                  </span>
                )}
              </div>

              {/* Title */}
              <h2 className="text-2xl md:text-3xl font-bold text-foreground leading-tight">
                {tool.icon && <span className="mr-2">{tool.icon}</span>}
                {tool.title}
              </h2>

              {/* Tags */}
              {tool.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {tool.tags.map((tag) => (
                    <span key={tag} className="text-[11px] text-foreground/40 font-medium">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* CTA for interactive tools */}
            {tool.toolType === "interactive" && tool.componentId && (
              <a
                href={isSubscriber ? `/laborator/dashboard?tab=${INTERACTIVE_TOOL_TABS[tool.componentId] ?? "tvuj-kompas"}` : "/laborator"}
                className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-accent text-white font-semibold shadow-md hover:bg-accent-hover transition-colors text-base"
              >
                <Play size={20} />
                Otevřít interaktivní cvičení
              </a>
            )}

            {/* Description */}
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-foreground/50 uppercase tracking-wider">
                K čemu je dobrý
              </h3>
              <div className="prose prose-sm prose-slate max-w-none text-foreground/80 [&_p]:leading-relaxed [&_li]:leading-relaxed">
                <ReactMarkdown>{tool.descriptionMarkdown}</ReactMarkdown>
              </div>
            </div>

            {/* Application */}
            {tool.applicationMarkdown && (
              <div className="space-y-2 pt-2 border-t border-black/5">
                <h3 className="text-sm font-bold text-foreground/50 uppercase tracking-wider">
                  Jak na to
                </h3>
                <div className="prose prose-sm prose-slate max-w-none text-foreground/80 [&_p]:leading-relaxed [&_li]:leading-relaxed [&_ol]:list-decimal [&_ol]:pl-4">
                  <ReactMarkdown>{tool.applicationMarkdown}</ReactMarkdown>
                </div>
              </div>
            )}

            {/* Sources */}
            {Object.keys(groupedSources).length > 0 && (
              <div className="space-y-3 pt-2 border-t border-black/5">
                <h3 className="text-sm font-bold text-foreground/50 uppercase tracking-wider">
                  Zdroje pro hlubší práci
                </h3>
                <div className="space-y-1 divide-y divide-black/5">
                  {Object.entries(groupedSources).map(([, sources]) =>
                    sources.map((source, i) => (
                      <SourceItem key={`${source.type}-${i}`} source={source} />
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

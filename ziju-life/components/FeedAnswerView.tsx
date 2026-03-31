"use client";

import { useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowLeft, Loader2, Search, ArrowRight, ExternalLink } from "lucide-react";

const CATEGORY_COLORS: Record<string, string> = {
  psychology: "#a78bfa",
  neuroscience: "#f59e0b",
  health: "#10b981",
  productivity: "#f97316",
  mindfulness: "#3b82f6",
  relationships: "#ec4899",
};

const CATEGORY_EMOJI: Record<string, string> = {
  psychology: "🧠",
  neuroscience: "⚡",
  health: "💪",
  productivity: "⏰",
  mindfulness: "🧘",
  relationships: "🤝",
};

interface Source {
  id: number;
  title: string;
  slug: string;
  type: "post" | "principle";
}

interface FeedAnswerViewProps {
  question: string;
  answer: string;
  sources: Source[];
  followUps: string[];
  hasZijuContent: boolean;
  loading: boolean;
  onBack: () => void;
  onFollowUp: (question: string) => void;
}

export default function FeedAnswerView({
  question,
  answer,
  sources,
  followUps,
  loading,
  onBack,
  onFollowUp,
}: FeedAnswerViewProps) {
  const [followUpValue, setFollowUpValue] = useState("");

  const handleFollowUpSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const q = followUpValue.trim();
    if (!q || loading) return;
    onFollowUp(q);
    setFollowUpValue("");
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      {/* Back button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm text-foreground/50 hover:text-accent transition-colors mb-8"
      >
        <ArrowLeft size={16} />
        Zpět na feed
      </button>

      {/* Question */}
      <h1 className="text-2xl font-bold text-foreground mb-8">{question}</h1>

      {/* Loading state */}
      {loading && !answer && (
        <div className="space-y-4 py-8">
          <div className="flex items-center gap-3 text-foreground/50">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-sm">Hledám v knihovně žiju.life...</span>
          </div>
          <div className="space-y-3 animate-pulse">
            <div className="h-4 bg-black/5 rounded-full w-full" />
            <div className="h-4 bg-black/5 rounded-full w-5/6" />
            <div className="h-4 bg-black/5 rounded-full w-4/6" />
            <div className="h-4 bg-black/5 rounded-full w-full mt-6" />
            <div className="h-4 bg-black/5 rounded-full w-3/4" />
          </div>
        </div>
      )}

      {/* Answer */}
      {answer && (
        <>
          {/* Sources label */}
          {sources.length > 0 && (
            <div className="text-xs text-foreground/40 mb-4">
              Zdroje: {sources.map((s, i) => (
                <span key={s.id}>
                  {i > 0 && ", "}
                  <Link
                    href={s.type === "post" ? `/feed/${s.slug}` : `/feed`}
                    className="text-foreground/60 hover:text-accent transition-colors"
                  >
                    {s.title}
                  </Link>
                </span>
              ))}
            </div>
          )}

          {/* Markdown answer */}
          <div className="prose prose-sm max-w-none text-foreground/90 leading-relaxed
            prose-headings:text-foreground prose-headings:font-bold
            prose-h2:text-lg prose-h2:mt-6 prose-h2:mb-3
            prose-h3:text-base prose-h3:mt-4 prose-h3:mb-2
            prose-p:mb-3 prose-p:leading-relaxed
            prose-li:mb-1 prose-li:leading-relaxed
            prose-strong:text-foreground prose-strong:font-bold
            prose-a:text-accent prose-a:no-underline hover:prose-a:underline
            prose-blockquote:border-l-accent prose-blockquote:bg-accent/5 prose-blockquote:px-4 prose-blockquote:py-2 prose-blockquote:rounded-r-xl
          ">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                // Render citation numbers as superscript links
                a: ({ href, children, ...props }) => {
                  return (
                    <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
                      {children}
                    </a>
                  );
                },
              }}
            >
              {answer}
            </ReactMarkdown>
          </div>

          {/* Source cards */}
          {sources.length > 0 && (
            <div className="mt-8 space-y-2">
              <p className="text-xs font-bold text-foreground/40 uppercase tracking-wider mb-3">
                Z knihovny žiju.life
              </p>
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-2 px-2">
                {sources.map((source) => (
                  <Link
                    key={source.id}
                    href={source.type === "post" ? `/feed/${source.slug}` : `/feed`}
                    className="shrink-0 w-48 bg-white rounded-xl border-2 border-black/10 p-4 hover:border-accent/40 hover:shadow-md transition-all group"
                  >
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="text-xs font-semibold text-accent bg-accent/10 px-2 py-0.5 rounded-full">
                        [{source.id}]
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-foreground line-clamp-2 group-hover:text-accent transition-colors">
                      {source.title}
                    </p>
                    <span className="inline-flex items-center gap-1 text-xs text-foreground/40 mt-2">
                      <ExternalLink size={10} /> Číst více
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Follow-up questions */}
          {followUps.length > 0 && (
            <div className="mt-10 border-t border-black/10 pt-6">
              <p className="text-xs font-bold text-foreground/40 uppercase tracking-wider mb-3">
                Navazující otázky
              </p>
              <div className="space-y-2">
                {followUps.map((q) => (
                  <button
                    key={q}
                    onClick={() => onFollowUp(q)}
                    disabled={loading}
                    className="w-full text-left flex items-center gap-2 px-4 py-3 rounded-xl border border-black/10 text-sm text-foreground/80 hover:border-accent/40 hover:text-accent transition-colors disabled:opacity-40"
                  >
                    <ArrowRight size={14} className="shrink-0 text-foreground/30" />
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Follow-up input */}
          <div className="mt-8">
            <form onSubmit={handleFollowUpSubmit} className="relative">
              <div className="flex items-center gap-3 bg-white rounded-2xl border-2 border-black/10 px-4 py-3 focus-within:border-accent/50 transition-all">
                <Search size={16} className="text-foreground/30 shrink-0" />
                <input
                  type="text"
                  value={followUpValue}
                  onChange={(e) => setFollowUpValue(e.target.value)}
                  placeholder="Zeptej se na další..."
                  className="flex-1 bg-transparent text-foreground placeholder:text-foreground/40 text-sm outline-none"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={!followUpValue.trim() || loading}
                  className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-accent text-white disabled:opacity-30 hover:bg-accent-hover transition-colors"
                >
                  {loading ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <ArrowRight size={14} />
                  )}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}

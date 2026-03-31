"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowLeft, Loader2, Search, ArrowRight } from "lucide-react";
import { FeedCard, type CuratedPost } from "@/components/FeedCards";

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
  const [sourcePosts, setSourcePosts] = useState<CuratedPost[]>([]);

  // Load full post data for source cards
  useEffect(() => {
    if (sources.length === 0) return;
    const slugs = sources.filter(s => s.type === "post").map(s => s.slug);
    if (slugs.length === 0) return;
    fetch(`/api/feed?limit=50`)
      .then(r => r.json())
      .then(data => {
        const posts = (data.posts || []).filter((p: CuratedPost) => slugs.includes(p.slug));
        setSourcePosts(posts);
      })
      .catch(console.error);
  }, [sources]);

  const handleFollowUpSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const q = followUpValue.trim();
    if (!q || loading) return;
    onFollowUp(q);
    setFollowUpValue("");
  };

  return (
    <div className="max-w-4xl mx-auto px-6 sm:px-10 py-12 sm:py-16">
      {/* Back button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm text-foreground/50 hover:text-accent transition-colors mb-8"
      >
        <ArrowLeft size={16} />
        Zpět do knihovny
      </button>

      {/* Question */}
      <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-10 leading-tight">{question}</h1>

      {/* Loading state */}
      {loading && !answer && (
        <div className="space-y-4 py-8">
          <div className="flex items-center gap-3 text-foreground/50">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-sm">Hledám v knihovně žiju.life...</span>
          </div>
          <div className="space-y-3 animate-pulse">
            <div className="h-5 bg-black/5 rounded-full w-full" />
            <div className="h-5 bg-black/5 rounded-full w-5/6" />
            <div className="h-5 bg-black/5 rounded-full w-4/6" />
            <div className="h-5 bg-black/5 rounded-full w-full mt-8" />
            <div className="h-5 bg-black/5 rounded-full w-3/4" />
          </div>
        </div>
      )}

      {/* Answer */}
      {answer && (
        <>
          {/* Markdown answer — readable serif-like prose */}
          <div className="prose prose-xl max-w-none [&_*]:!font-[Georgia,_serif] [&_*]:!font-normal
            text-foreground/85
            prose-p:leading-[1.9] prose-p:mb-6
            prose-li:leading-[1.9] prose-li:mb-1.5
            prose-headings:text-foreground [&_h2]:!font-semibold [&_h3]:!font-semibold
            prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
            prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
            [&_strong]:!font-semibold
            prose-a:text-accent prose-a:no-underline hover:prose-a:underline
            prose-blockquote:border-l-accent prose-blockquote:bg-accent/5 prose-blockquote:px-5 prose-blockquote:py-3 prose-blockquote:rounded-r-xl prose-blockquote:my-6
            prose-ul:my-4 prose-ol:my-4
          ">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {answer}
            </ReactMarkdown>
          </div>

          {/* Source cards — same style as library */}
          {sourcePosts.length > 0 && (
            <div className="mt-12 pt-8 border-t border-black/10">
              <p className="text-xs font-bold text-foreground/40 uppercase tracking-wider mb-4">
                Z knihovny žiju.life
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {sourcePosts.map((post) => (
                  <FeedCard key={post.id} post={post} />
                ))}
              </div>
            </div>
          )}

          {/* Principle sources (no full post data) */}
          {sources.filter(s => s.type === "principle").length > 0 && (
            <div className={`${sourcePosts.length > 0 ? "mt-6" : "mt-12 pt-8 border-t border-black/10"}`}>
              {sourcePosts.length === 0 && (
                <p className="text-xs font-bold text-foreground/40 uppercase tracking-wider mb-4">
                  Z knihovny žiju.life
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                {sources.filter(s => s.type === "principle").map(s => (
                  <span key={s.id} className="text-sm px-3 py-1.5 rounded-full bg-accent/10 text-accent font-semibold">
                    {s.title}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Follow-up questions */}
          {followUps.length > 0 && (
            <div className="mt-10 pt-6 border-t border-black/10">
              <p className="text-xs font-bold text-foreground/40 uppercase tracking-wider mb-3">
                Navazující otázky
              </p>
              <div className="space-y-2">
                {followUps.map((q) => (
                  <button
                    key={q}
                    onClick={() => onFollowUp(q)}
                    disabled={loading}
                    className="w-full text-left flex items-center gap-3 px-5 py-3.5 rounded-xl border border-black/10 text-sm text-foreground/80 hover:border-accent/40 hover:text-accent transition-colors disabled:opacity-40"
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
            <form onSubmit={handleFollowUpSubmit}>
              <div className="flex items-center gap-3 bg-white rounded-2xl border-2 border-black/10 px-5 py-4 focus-within:border-accent/50 transition-all">
                <Search size={18} className="text-foreground/30 shrink-0" />
                <input
                  type="text"
                  value={followUpValue}
                  onChange={(e) => setFollowUpValue(e.target.value)}
                  placeholder="Zeptej se na další..."
                  className="flex-1 bg-transparent text-foreground placeholder:text-foreground/40 text-base outline-none"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={!followUpValue.trim() || loading}
                  className="shrink-0 w-9 h-9 flex items-center justify-center rounded-xl bg-accent text-white disabled:opacity-30 hover:bg-accent-hover transition-colors"
                >
                  {loading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <ArrowRight size={16} />
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

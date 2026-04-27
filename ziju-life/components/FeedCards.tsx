"use client";

import Link from "next/link";
import {
  Book, Video, PenTool, Music, Play, HelpCircle,
  ArrowRight, ExternalLink,
} from "lucide-react";

// ── Constants ────────────────────────────────────────────────────────────────

export const TYPE_LABEL: Record<string, string> = {
  kniha: "Kniha", video: "Video", blog: "Článek", reel: "Reel",
  hudba: "Hudba", "článek": "Článek", ostatní: "Ostatní",
  tip: "Tip", digest: "Přehled",
};

export const TYPE_ICON: Record<string, React.ElementType> = {
  kniha: Book, video: Video, blog: PenTool, reel: Play,
  hudba: Music, "článek": PenTool, ostatní: HelpCircle,
};

export const CATEGORY_COLORS: Record<string, string> = {
  psychology: "#a78bfa", neuroscience: "#f59e0b", health: "#10b981",
  productivity: "#f97316", mindfulness: "#3b82f6", relationships: "#ec4899",
};

export const CATEGORY_EMOJI: Record<string, string> = {
  psychology: "🧠", neuroscience: "⚡", health: "💪",
  productivity: "⏰", mindfulness: "🧘", relationships: "🤝",
};

// ── Types ────────────────────────────────────────────────────────────────────

export interface CuratedPost {
  id: string;
  slug: string;
  type: "tip" | "digest";
  title: string;
  subtitle: string | null;
  body_markdown: string;
  curator_note: string | null;
  categories: string[];
  tags: string[];
  published_at: string;
  cover_image_url: string | null;
  source_url?: string | null;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

export function getItemType(tags: string[]): string | null {
  const typeKeys = Object.keys(TYPE_LABEL);
  return tags?.find((t) => typeKeys.includes(t)) || null;
}

export function getVideoThumbnail(markdown: string): string | null {
  const ytMatch = markdown.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#)\]]+)/);
  if (ytMatch) return `https://img.youtube.com/vi/${ytMatch[1]}/mqdefault.jpg`;
  return null;
}

export function extractUrl(markdown: string): string | null {
  const match = markdown.match(/\[.*?\]\((https?:\/\/[^\s)]+)\)/);
  return match ? match[1] : null;
}

function getReelEmbed(url: string): { embedUrl: string; vertical: boolean } | null {
  const ig = url.match(/instagram\.com\/(?:reel|p)\/([A-Za-z0-9_-]+)/);
  if (ig) return { embedUrl: `https://www.instagram.com/reel/${ig[1]}/embed/`, vertical: true };
  const tt = url.match(/tiktok\.com\/@[^/]+\/video\/(\d+)/);
  if (tt) return { embedUrl: `https://www.tiktok.com/embed/v2/${tt[1]}`, vertical: true };
  const ytShorts = url.match(/youtube\.com\/shorts\/([A-Za-z0-9_-]+)/);
  if (ytShorts) return { embedUrl: `https://www.youtube.com/embed/${ytShorts[1]}`, vertical: true };
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]+)/);
  if (yt) return { embedUrl: `https://www.youtube.com/embed/${yt[1]}`, vertical: false };
  return null;
}

function getVideoEmbedUrl(url: string): string | null {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vm = url.match(/vimeo\.com\/(\d+)/);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
  return null;
}

// ── Components ───────────────────────────────────────────────────────────────

export function TypeBadge({ itemType }: { itemType: string }) {
  const Icon = TYPE_ICON[itemType] || HelpCircle;
  const label = TYPE_LABEL[itemType] || itemType;
  const colorClass = itemType === "kniha" ? "text-amber-700" : "text-accent";
  return (
    <span className={`inline-flex items-center gap-1.5 ${colorClass} text-xs font-semibold`}>
      <Icon size={12} />
      {label}
    </span>
  );
}

function ReelCard({ post, embedUrl, href }: {
  post: CuratedPost; embedUrl: string; vertical: boolean; href: string;
}) {
  return (
    <article className="relative rounded-2xl border-2 border-black/10 overflow-hidden h-full hover:shadow-xl hover:border-accent/30 hover:-translate-y-1 transition-all duration-200">
      <div className="w-full h-full">
        <iframe
          src={embedUrl}
          className="w-full h-full"
          style={{ border: 0 }}
          scrolling="no"
          allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
          allowFullScreen
          title={post.title}
        />
      </div>
      <Link href={href} className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent pt-10 pb-3 px-4 group">
        <p className="text-base font-bold text-white line-clamp-2 drop-shadow-md group-hover:text-accent transition-colors">{post.title}</p>
      </Link>
    </article>
  );
}

// ── Cover Keyword Graphic ─────────────────────────────────────────────────

const KEYWORD_COLORS = [
  { bg: "from-amber-100 to-orange-100", text: "text-amber-800/80" },
  { bg: "from-sky-100 to-indigo-100", text: "text-indigo-800/80" },
  { bg: "from-emerald-100 to-teal-100", text: "text-teal-800/80" },
  { bg: "from-rose-100 to-pink-100", text: "text-pink-800/80" },
  { bg: "from-violet-100 to-purple-100", text: "text-purple-800/80" },
];

function CoverKeyword({ keyword, seed }: { keyword: string; seed: string }) {
  const colorIdx = seed.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % KEYWORD_COLORS.length;
  const colors = KEYWORD_COLORS[colorIdx];
  return (
    <div className={`relative w-full aspect-[16/10] bg-gradient-to-br ${colors.bg} flex items-center justify-center overflow-hidden`}>
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 opacity-[0.08]" style={{
        backgroundImage: "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
        backgroundSize: "20px 20px",
      }} />
      <p className={`relative text-3xl sm:text-4xl font-black tracking-wider ${colors.text} select-none px-6 text-center leading-tight`}
         style={{ fontFamily: "'Courier New', Courier, monospace" }}>
        {keyword}
      </p>
    </div>
  );
}

export function getCoverKeyword(tags: string[]): string | null {
  const tag = tags?.find((t) => t.startsWith("cover:"));
  return tag ? tag.slice(6).toUpperCase() : null;
}

export function FeedCard({ post, featured = false, bento = false }: { post: CuratedPost; featured?: boolean; bento?: boolean }) {
  const itemType = getItemType(post.tags);
  const isMigrated = post.tags?.includes("migrated-inspiration");
  const mainCategory = post.categories?.[0];
  const externalUrl = extractUrl(post.body_markdown);
  const coverKeyword = getCoverKeyword(post.tags);

  const reelEmbed = itemType === "reel" && externalUrl ? getReelEmbed(externalUrl) : null;
  const videoEmbed = (itemType === "video" || itemType === "hudba") && externalUrl ? getVideoEmbedUrl(externalUrl) : null;

  let imageUrl = post.cover_image_url || null;
  if (!imageUrl && !videoEmbed && !reelEmbed && (itemType === "video" || post.tags?.includes("video"))) {
    imageUrl = getVideoThumbnail(post.body_markdown);
  }

  const href = post.source_url || `/feed/${post.slug}`;
  const isExternal = Boolean(post.source_url);

  const descText = post.body_markdown
    .split("\n")
    .filter((l) => l.trim() && !l.startsWith("**Autor") && !l.startsWith("**Zdroj") && !l.match(/^\[.*\]\(http/))
    .join(" ")
    .replace(/[#*[\]()]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .substring(0, 800) || "";

  const isVideo = !!videoEmbed || !!reelEmbed || itemType === "video" || itemType === "reel" || itemType === "hudba";
  const hasPlayButton = isVideo && !reelEmbed && !videoEmbed;
  const thumbnail = imageUrl || (isVideo ? getVideoThumbnail(post.body_markdown) : null);

  // ── Reel (embed) ──
  if (reelEmbed) {
    if (bento) {
      // Bento reel — iframe fills the tall card
      return (
        <article className="relative rounded-2xl overflow-hidden h-full bg-black">
          <iframe
            src={reelEmbed.embedUrl}
            className="w-full h-full"
            style={{ border: 0 }}
            scrolling="no"
            allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
            allowFullScreen
            title={post.title}
          />
        </article>
      );
    }
    return <ReelCard post={post} embedUrl={reelEmbed.embedUrl} vertical={reelEmbed.vertical} href={href} />;
  }

  // ── Bento mode (homepage) ──
  if (bento) {
    const bgImage = thumbnail || imageUrl;
    const BentoLink: React.ElementType = isExternal ? "a" : Link;
    const bentoLinkProps = isExternal
      ? { href, target: "_blank", rel: "noopener noreferrer" }
      : { href };

    return (
      <BentoLink {...bentoLinkProps} className="block group h-full">
        <article className="relative rounded-2xl overflow-hidden h-full bg-gray-100 hover:shadow-lg transition-all duration-200">
          {/* Background */}
          {bgImage ? (
            <img
              src={bgImage}
              alt={post.title}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : coverKeyword ? (
            <div className="absolute inset-0"><CoverKeyword keyword={coverKeyword} seed={post.id} /></div>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200" />
          )}

          {/* Play button */}
          {isVideo && (
            <div className="absolute top-3 right-3 z-10">
              <div className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center group-hover:bg-accent transition-colors">
                <Play size={14} className="text-white ml-0.5" fill="white" />
              </div>
            </div>
          )}

          {/* Text overlay */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent pt-10 pb-3 px-3">
            <h3 className="text-xs font-bold text-white leading-snug line-clamp-2 drop-shadow-sm">
              {post.title}
            </h3>
            <p className="text-[10px] text-white/60 mt-0.5">
              {itemType ? TYPE_LABEL[itemType] || "" : ""}
            </p>
          </div>
        </article>
      </BentoLink>
    );
  }

  // ── Standard mode (knihovna page) ──
  const isBook = itemType === "kniha";
  const dateStr = new Date(post.published_at).toLocaleDateString("cs-CZ", { day: "numeric", month: "numeric", year: "numeric" });

  // Deterministic variant based on post slug (stable across renders)
  const variantIdx = (post.slug?.charCodeAt(0) ?? 0) % 3;
  const rotationClass = ["rotate-[-0.6deg]", "rotate-[0.4deg]", "rotate-[-0.3deg]"][variantIdx];
  const borderPaths = [
    "M 14 10 Q 150 8 288 12 Q 294 100 290 190 Q 150 194 12 190 Q 8 100 14 10 Z",
    "M 10 12 Q 160 10 294 10 Q 292 102 296 188 Q 150 192 14 192 Q 10 102 10 12 Z",
    "M 12 9 Q 170 12 290 10 Q 294 106 292 190 Q 148 192 10 191 Q 12 104 12 9 Z",
  ];
  const path = borderPaths[variantIdx];

  const linkClass = `block group h-full relative ${rotationClass} hover:rotate-0 hover:-translate-y-0.5 transition-all duration-200`;
  const LinkTag: React.ElementType = isExternal ? "a" : Link;
  const linkProps = isExternal
    ? { href, target: "_blank", rel: "noopener noreferrer" }
    : { href };

  return (
    <LinkTag {...linkProps} className={linkClass}>
      {/* Hand-drawn shadow — visible only on hover */}
      <svg
        aria-hidden="true"
        className="absolute inset-0 w-full h-full pointer-events-none translate-x-1.5 translate-y-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        viewBox="0 0 300 200"
        preserveAspectRatio="none"
      >
        <path d={path} fill="rgba(23,23,23,0.9)" />
      </svg>
      {/* Hand-drawn fill */}
      <svg
        aria-hidden="true"
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 300 200"
        preserveAspectRatio="none"
      >
        <path d={path} fill="#FDFBF7" />
      </svg>

      <article className="relative h-full flex flex-col pt-5 px-5 pb-8">
        {/* Image area */}
        <div className={`relative w-full aspect-[4/3] overflow-hidden rounded-xl flex items-center justify-center ${
          isBook
            ? "bg-gradient-to-b from-amber-50/80 via-orange-50/40 to-amber-100/70"
            : "bg-gray-50"
        }`}>
          {/* Subtle shelf line — only for books */}
          {isBook && (
            <div
              aria-hidden="true"
              className="absolute left-0 right-0 bottom-[10%] h-px bg-amber-900/15"
            />
          )}

          {(thumbnail || (videoEmbed && imageUrl)) ? (
            <img
              src={thumbnail || imageUrl || ""}
              alt={post.title}
              className={`relative group-hover:scale-105 transition-transform duration-300 ${
                isBook ? "h-[82%] w-auto object-contain" : "w-full h-full object-cover"
              }`}
              style={isBook ? {
                boxShadow:
                  "3px 0 0 0 #f5e6d3, 4px 0 0 0 #c9a878, 5px 7px 14px -2px rgba(60,40,20,0.35), 1px 2px 4px -1px rgba(60,40,20,0.25)",
              } : undefined}
            />
          ) : coverKeyword ? (
            <CoverKeyword keyword={coverKeyword} seed={post.id} />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              {itemType && (() => { const Icon = TYPE_ICON[itemType] || HelpCircle; return <Icon size={32} className="text-foreground/15" />; })()}
            </div>
          )}

          {/* Play button for video */}
          {isVideo && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <Play size={20} className="text-white ml-0.5" fill="white" />
              </div>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="pt-3 flex-1 flex flex-col gap-1.5">
          {itemType && <TypeBadge itemType={itemType} />}

          <h3 className="text-base font-bold text-foreground leading-snug group-hover:text-accent transition-colors line-clamp-2">
            {post.title}
          </h3>

          {post.subtitle && (
            <p className="text-sm text-foreground/50">{post.subtitle}</p>
          )}

          {descText && (
            <p className="text-sm text-foreground/55 leading-relaxed line-clamp-3">
              {descText}
            </p>
          )}

          <div className="flex items-center justify-between text-[11px] text-foreground/40 mt-auto pt-2">
            <span>{dateStr}</span>
            {externalUrl && isMigrated ? (
              <span className="flex items-center gap-1 text-accent font-semibold"><ExternalLink size={10} /> Zdroj</span>
            ) : (
              <span className="flex items-center gap-1 text-accent font-semibold group-hover:gap-2 transition-all">Číst <ArrowRight size={11} /></span>
            )}
          </div>
        </div>
      </article>

      {/* Hand-drawn border on top */}
      <svg
        aria-hidden="true"
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 300 200"
        preserveAspectRatio="none"
      >
        <path
          d={path}
          fill="none"
          stroke="#171717"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    </LinkTag>
  );
}

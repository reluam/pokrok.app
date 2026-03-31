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
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold">
      <Icon size={11} />
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

export function FeedCard({ post }: { post: CuratedPost }) {
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

  const href = `/feed/${post.slug}`;

  const descText = post.body_markdown
    .split("\n")
    .filter((l) => l.trim() && !l.startsWith("**Autor") && !l.startsWith("**Zdroj") && !l.match(/^\[.*\]\(http/))
    .join(" ")
    .replace(/[#*[\]()]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .substring(0, 800) || "";

  // ── Reel ──
  if (reelEmbed) {
    return <ReelCard post={post} embedUrl={reelEmbed.embedUrl} vertical={reelEmbed.vertical} href={href} />;
  }

  // ── Video / Hudba ──
  if (videoEmbed) {
    return (
      <article className="bg-white rounded-2xl border-2 border-black/10 overflow-hidden h-full flex flex-col hover:shadow-xl hover:border-accent/30 hover:-translate-y-1 transition-all duration-200">
        <div className="relative w-full aspect-video bg-black">
          <iframe
            src={videoEmbed}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        <Link href={href} className="p-5 flex-1 flex flex-col gap-2 group">
          <div className="flex items-center gap-2 flex-wrap">
            <TypeBadge itemType={itemType || "video"} />
          </div>
          <h3 className="text-base font-bold text-foreground leading-snug line-clamp-2 group-hover:text-accent transition-colors">{post.title}</h3>
          {post.subtitle && <p className="text-sm text-foreground/50">{post.subtitle}</p>}
          {descText && <p className="text-sm text-foreground/60 leading-relaxed line-clamp-2">{descText}</p>}
        </Link>
      </article>
    );
  }

  // ── Standard (books, articles, tips, digests) ──
  return (
    <Link href={href} className="block group">
      <article className="bg-white rounded-2xl border-2 border-black/10 overflow-hidden hover:shadow-xl hover:border-accent/30 hover:-translate-y-1 transition-all duration-200 h-full flex flex-col">
        {imageUrl ? (
          <div className={`relative w-full overflow-hidden flex items-center justify-center ${itemType === "kniha" ? "pt-4 pb-2 aspect-[16/10]" : "bg-gray-100 aspect-[16/10]"}`}>
            <img
              src={imageUrl}
              alt={post.title}
              className={`group-hover:scale-105 transition-transform duration-300 ${itemType === "kniha" ? "h-full object-contain drop-shadow-md" : "w-full h-full object-cover"}`}
            />
          </div>
        ) : coverKeyword ? (
          <CoverKeyword keyword={coverKeyword} seed={post.id} />
        ) : null}
        <div className="p-5 flex-1 flex flex-col gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            {itemType && <TypeBadge itemType={itemType} />}
            {!isMigrated && post.type === "digest" && (
              <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-accent/10 text-accent">Týdenní přehled</span>
            )}
            {mainCategory && !isMigrated && (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: `${CATEGORY_COLORS[mainCategory]}15`, color: CATEGORY_COLORS[mainCategory] }}>
                {CATEGORY_EMOJI[mainCategory]} {mainCategory}
              </span>
            )}
          </div>
          <h3 className="text-base font-bold text-foreground leading-snug group-hover:text-accent transition-colors line-clamp-2">{post.title}</h3>
          {post.subtitle && <p className="text-sm text-foreground/50">{post.subtitle}</p>}
          {descText && <p className="text-sm text-foreground/60 leading-relaxed line-clamp-3">{descText}</p>}
          <div className="flex items-center justify-between mt-auto pt-2">
            <span className="text-xs text-foreground/35">
              {new Date(post.published_at).toLocaleDateString("cs-CZ", { day: "numeric", month: "short", year: "numeric" })}
            </span>
            {externalUrl && isMigrated ? (
              <span className="text-xs text-accent font-semibold flex items-center gap-1"><ExternalLink size={10} /> Zdroj</span>
            ) : (
              <span className="text-xs text-accent font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">Číst <ArrowRight size={12} /></span>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}

import { notFound } from 'next/navigation'
import { getCuratedPost } from '@/lib/curated-posts-db'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import Link from 'next/link'
import {
  ArrowLeft, Calendar, Clock, ExternalLink, Share2,
  Book, Video, PenTool, Music, Play, HelpCircle,
} from 'lucide-react'
import ShareButtons from './ShareButtons'

// ── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  psychology: '#a78bfa', neuroscience: '#f59e0b', health: '#10b981',
  productivity: '#f97316', mindfulness: '#3b82f6', relationships: '#ec4899',
}
const CATEGORY_EMOJI: Record<string, string> = {
  psychology: '🧠', neuroscience: '⚡', health: '💪',
  productivity: '⏰', mindfulness: '🧘', relationships: '🤝',
}
const TYPE_LABEL: Record<string, string> = {
  kniha: 'Kniha', video: 'Video', blog: 'Článek', reel: 'Reel',
  hudba: 'Hudba', 'článek': 'Článek', ostatní: 'Ostatní',
}
const TYPE_ICON: Record<string, React.ElementType> = {
  kniha: Book, video: Video, blog: PenTool, reel: Play,
  hudba: Music, 'článek': PenTool, ostatní: HelpCircle,
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getItemType(tags: string[]): string | null {
  return tags?.find(t => Object.keys(TYPE_LABEL).includes(t)) || null
}

function extractUrl(markdown: string): string | null {
  const match = markdown.match(/\[.*?\]\((https?:\/\/[^\s)]+)\)/)
  return match ? match[1] : null
}

function getVideoEmbedUrl(url: string): string | null {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`
  const vm = url.match(/vimeo\.com\/(\d+)/)
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`
  return null
}

function getReelEmbed(url: string): { embedUrl: string; vertical: boolean } | null {
  const ig = url.match(/instagram\.com\/(?:reel|p)\/([A-Za-z0-9_-]+)/)
  if (ig) return { embedUrl: `https://www.instagram.com/reel/${ig[1]}/embed/`, vertical: true }
  const tt = url.match(/tiktok\.com\/@[^/]+\/video\/(\d+)/)
  if (tt) return { embedUrl: `https://www.tiktok.com/embed/v2/${tt[1]}`, vertical: true }
  const ytShorts = url.match(/youtube\.com\/shorts\/([A-Za-z0-9_-]+)/)
  if (ytShorts) return { embedUrl: `https://www.youtube.com/embed/${ytShorts[1]}`, vertical: true }
  return null
}

// ── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getCuratedPost(slug)
  if (!post) return { title: 'Nenalezeno — žiju life' }
  return {
    title: `${post.title} — žiju life`,
    description: post.subtitle || post.body_markdown?.substring(0, 160),
    openGraph: {
      title: post.title,
      description: post.subtitle || post.body_markdown?.substring(0, 160),
      type: 'article',
      publishedTime: post.published_at,
      ...(post.cover_image_url ? { images: [post.cover_image_url] } : {}),
    },
  }
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function FeedPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getCuratedPost(slug)

  if (!post || post.status !== 'published') {
    notFound()
  }

  const isMigrated = post.tags?.includes('migrated-inspiration')
  const itemType = isMigrated ? getItemType(post.tags) : null
  const Icon = itemType ? TYPE_ICON[itemType] || HelpCircle : null
  const externalUrl = extractUrl(post.body_markdown)
  const videoEmbed = externalUrl ? getVideoEmbedUrl(externalUrl) : null
  const reelEmbed = externalUrl ? getReelEmbed(externalUrl) : null

  const wordCount = post.body_markdown?.split(/\s+/).length || 0
  const readTime = Math.max(1, Math.round(wordCount / 200))
  const publishDate = new Date(post.published_at).toLocaleDateString('cs-CZ', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  // Extract description lines (skip author line and link line)
  const descriptionLines = post.body_markdown
    .split('\n')
    .filter((l: string) => l.trim() && !l.startsWith('**Autor') && !l.match(/^\[.*\]\(http/))
    .join('\n')

  // Preserve line breaks: single \n → \n\n (new paragraph in markdown)
  function preserveBreaks(text: string): string {
    return text.replace(/(?<!\n)\n(?!\n)/g, '\n\n')
  }

  return (
    <article className="max-w-3xl mx-auto px-6 sm:px-10 py-12 sm:py-16">
      {/* Back link */}
      <Link href="/knihovna" className="inline-flex items-center gap-1.5 text-sm text-foreground/50 hover:text-accent transition-colors mb-8">
        <ArrowLeft size={15} />
        Zpět do knihovny
      </Link>

      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {itemType && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold">
              {Icon && <Icon size={11} />}
              {TYPE_LABEL[itemType]}
            </span>
          )}
          {!isMigrated && post.type === 'digest' && (
            <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-accent/10 text-accent">
              Týdenní přehled
            </span>
          )}
          {post.categories?.map((cat: string) => (
            <span key={cat} className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: `${CATEGORY_COLORS[cat]}15`, color: CATEGORY_COLORS[cat] }}>
              {CATEGORY_EMOJI[cat]} {cat}
            </span>
          ))}
        </div>

        <h1 className="text-3xl font-extrabold text-foreground leading-tight">{post.title}</h1>
        {post.subtitle && (
          <p className="text-lg text-foreground/60 mt-2">{post.subtitle}</p>
        )}

        <div className="flex items-center gap-4 mt-4 text-sm text-foreground/40">
          <span className="flex items-center gap-1"><Calendar size={14} /> {publishDate}</span>
          {!isMigrated && (
            <span className="flex items-center gap-1"><Clock size={14} /> {readTime} min čtení</span>
          )}
        </div>
      </header>

      {/* Cover image (book cover) */}
      {post.cover_image_url && itemType === 'kniha' && (
        <div className="mb-8">
          {externalUrl ? (
            <a href={externalUrl} target="_blank" rel="noopener noreferrer"
              className="block w-fit rounded-xl overflow-hidden border-2 border-black/10 hover:border-accent/50 transition-colors shadow-lg hover:shadow-xl">
              <img src={post.cover_image_url} alt={post.title} className="w-36 sm:w-44 aspect-[2/3] object-cover" />
            </a>
          ) : (
            <div className="w-fit rounded-xl overflow-hidden border-2 border-black/10 shadow-lg">
              <img src={post.cover_image_url} alt={post.title} className="w-36 sm:w-44 aspect-[2/3] object-cover" />
            </div>
          )}
        </div>
      )}

      {/* Cover image (non-book) */}
      {post.cover_image_url && itemType !== 'kniha' && !videoEmbed && (
        <div className="mb-8 rounded-2xl overflow-hidden border-2 border-black/10">
          <img src={post.cover_image_url} alt={post.title} className="w-full aspect-video object-cover" />
        </div>
      )}

      {/* Video embed */}
      {(itemType === 'video' || itemType === 'hudba') && videoEmbed && (
        <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black mb-8">
          <iframe
            src={videoEmbed}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}

      {/* Reel embed */}
      {itemType === 'reel' && externalUrl && reelEmbed && (
        <div className="mb-8 flex justify-center">
          <iframe
            src={reelEmbed.embedUrl}
            width={reelEmbed.vertical ? 320 : 560}
            height={reelEmbed.vertical ? 568 : 315}
            style={{ border: 0, borderRadius: 16, maxWidth: '100%' }}
            scrolling="no"
            allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
            allowFullScreen
            title={post.title}
          />
        </div>
      )}

      {/* Curator note */}
      {post.curator_note && (
        <div className="bg-accent/5 border-l-4 border-accent rounded-r-xl p-4 mb-8">
          <p className="text-sm text-foreground/70 italic">{post.curator_note}</p>
        </div>
      )}

      {/* Body */}
      {isMigrated ? (
        <div className="prose prose-xl max-w-none [&_*]:!font-[Georgia,_serif] [&_*]:!font-normal text-foreground/85 prose-p:leading-[1.9] prose-p:mb-6 prose-li:leading-[1.9] [&_h2]:text-foreground [&_h2]:!font-semibold [&_h2]:text-2xl [&_h2]:mt-10 [&_h2]:mb-4 [&_h3]:text-foreground [&_h3]:!font-semibold [&_h3]:text-xl [&_h3]:mt-8 [&_h3]:mb-3 [&_strong]:!font-semibold [&_a]:text-accent [&_a]:no-underline [&_a:hover]:underline [&_blockquote]:border-accent/30 [&_blockquote]:bg-accent/5 [&_blockquote]:px-5 [&_blockquote]:py-3 [&_blockquote]:rounded-r-xl [&_blockquote]:my-6">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {preserveBreaks(descriptionLines)}
          </ReactMarkdown>
        </div>
      ) : (
        <div className="prose prose-xl max-w-none [&_*]:!font-[Georgia,_serif] [&_*]:!font-normal text-foreground/85 prose-p:leading-[1.9] prose-p:mb-6 prose-li:leading-[1.9] [&_h2]:text-foreground [&_h2]:!font-semibold [&_h2]:text-2xl [&_h2]:mt-10 [&_h2]:mb-4 [&_h3]:text-foreground [&_h3]:!font-semibold [&_h3]:text-xl [&_h3]:mt-8 [&_h3]:mb-3 [&_strong]:!font-semibold [&_a]:text-accent [&_a]:no-underline [&_a:hover]:underline [&_blockquote]:border-accent/30 [&_blockquote]:bg-accent/5 [&_blockquote]:px-5 [&_blockquote]:py-3 [&_blockquote]:rounded-r-xl [&_blockquote]:my-6">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {preserveBreaks(post.body_markdown)}
          </ReactMarkdown>
        </div>
      )}

      {/* External link button */}
      {externalUrl && isMigrated && (
        <div className="mt-8">
          <a
            href={externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-white rounded-full font-semibold hover:bg-accent-hover transition-colors text-sm"
          >
            <ExternalLink size={16} />
            {itemType === 'kniha' ? 'Koupit / Zobrazit knihu' :
             itemType === 'video' ? 'Otevřít video' :
             itemType === 'hudba' ? 'Otevřít v přehrávači' :
             itemType === 'reel' ? 'Otevřít reel' :
             'Otevřít odkaz'}
          </a>
        </div>
      )}

      {/* Video script */}
      {post.video_script && (
        <details className="mt-10 bg-black/[0.02] rounded-2xl border-2 border-black/10">
          <summary className="cursor-pointer px-6 py-4 text-sm font-bold text-foreground/60 hover:text-foreground transition-colors">
            🎬 Video script
          </summary>
          <div className="px-6 pb-6 text-sm text-foreground/60 whitespace-pre-wrap leading-relaxed">
            {post.video_script}
          </div>
        </details>
      )}

      {/* Tags */}
      {post.tags?.filter((t: string) => t !== 'migrated-inspiration').length > 0 && (
        <div className="flex flex-wrap gap-2 mt-8">
          {post.tags.filter((t: string) => t !== 'migrated-inspiration').map((tag: string) => (
            <span key={tag} className="text-xs px-2.5 py-1 rounded-xl bg-black/5 text-foreground/50 font-medium">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Share */}
      <div className="mt-12 pt-8 border-t border-black/10">
        <ShareButtons title={post.title} slug={post.slug} />
      </div>

      {/* CTA */}
      <div className="mt-10 bg-accent/5 rounded-3xl p-10 sm:p-12 text-center">
        <p className="font-bold text-foreground text-2xl">Chceš objevovat další?</p>
        <p className="text-foreground/60 mt-2 text-base">Prozkoumej knihovnu plnou knih, videí a tipů o vědomém žití.</p>
        <Link href="/knihovna" className="inline-block mt-6 px-8 py-4 rounded-full bg-accent text-white font-bold text-base hover:bg-accent-hover transition-colors shadow-md">
          Prozkoumat knihovnu
        </Link>
      </div>
    </article>
  )
}

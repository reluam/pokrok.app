import { notFound } from 'next/navigation'
import { getCuratedPost } from '@/lib/curated-posts-db'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import Link from 'next/link'
import { ArrowLeft, Calendar, Clock } from 'lucide-react'

const CATEGORY_COLORS: Record<string, string> = {
  psychology: '#a78bfa', neuroscience: '#f59e0b', health: '#10b981',
  productivity: '#f97316', mindfulness: '#3b82f6', relationships: '#ec4899',
}
const CATEGORY_EMOJI: Record<string, string> = {
  psychology: '🧠', neuroscience: '⚡', health: '💪',
  productivity: '⏰', mindfulness: '🧘', relationships: '🤝',
}

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
    },
  }
}

export default async function FeedPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getCuratedPost(slug)

  if (!post || post.status !== 'published') {
    notFound()
  }

  const wordCount = post.body_markdown?.split(/\s+/).length || 0
  const readTime = Math.max(1, Math.round(wordCount / 200))
  const publishDate = new Date(post.published_at).toLocaleDateString('cs-CZ', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <article className="max-w-2xl mx-auto px-6 py-12">
      {/* Back link */}
      <Link href="/feed" className="inline-flex items-center gap-1.5 text-sm text-foreground/50 hover:text-accent transition-colors mb-8">
        <ArrowLeft size={15} />
        Zpět na feed
      </Link>

      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          {post.type === 'digest' && (
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
          <span className="flex items-center gap-1"><Clock size={14} /> {readTime} min čtení</span>
        </div>
      </header>

      {/* Curator note */}
      {post.curator_note && (
        <div className="bg-accent/5 border-l-4 border-accent rounded-r-xl p-4 mb-8">
          <p className="text-sm text-foreground/70 italic">{post.curator_note}</p>
        </div>
      )}

      {/* Body */}
      <div className="prose prose-lg max-w-none text-foreground/80 [&_h2]:text-foreground [&_h2]:font-bold [&_h2]:mt-8 [&_h2]:mb-3 [&_h3]:text-foreground [&_h3]:font-bold [&_a]:text-accent [&_a]:no-underline [&_a:hover]:underline [&_blockquote]:border-accent/30 [&_blockquote]:text-foreground/60">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {post.body_markdown}
        </ReactMarkdown>
      </div>

      {/* Video script (collapsible) */}
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
      {post.tags?.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-8">
          {post.tags.map((tag: string) => (
            <span key={tag} className="text-xs px-2.5 py-1 rounded-xl bg-black/5 text-foreground/50 font-medium">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* CTA */}
      <div className="mt-12 bg-accent/5 rounded-2xl p-8 text-center">
        <p className="font-bold text-foreground text-lg">Chceš dostávat tipy pravidelně?</p>
        <p className="text-foreground/60 mt-1 text-sm">Sleduj žiju.life pro další výzkumy a tipy o vědomém žití.</p>
        <Link href="/inspirace" className="inline-block mt-4 px-6 py-3 rounded-full bg-accent text-white font-bold text-sm hover:bg-accent-hover transition-colors">
          Prozkoumat knihovnu
        </Link>
      </div>
    </article>
  )
}

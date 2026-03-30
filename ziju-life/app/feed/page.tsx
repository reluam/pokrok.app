'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Calendar, Clock, ArrowRight, Loader2 } from 'lucide-react'

const CATEGORY_COLORS: Record<string, string> = {
  psychology: '#a78bfa',
  neuroscience: '#f59e0b',
  health: '#10b981',
  productivity: '#f97316',
  mindfulness: '#3b82f6',
  relationships: '#ec4899',
}

const CATEGORY_EMOJI: Record<string, string> = {
  psychology: '🧠',
  neuroscience: '⚡',
  health: '💪',
  productivity: '⏰',
  mindfulness: '🧘',
  relationships: '🤝',
}

interface CuratedPost {
  id: string
  slug: string
  type: 'tip' | 'digest'
  title: string
  subtitle: string | null
  body_markdown: string
  curator_note: string | null
  categories: string[]
  tags: string[]
  published_at: string
  cover_image_url: string | null
}

export default function FeedPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-16"><Loader2 className="animate-spin text-foreground/30" size={28} /></div>}>
      <FeedContent />
    </Suspense>
  )
}

function FeedContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const typeFilter = searchParams.get('type') || ''
  const [posts, setPosts] = useState<CuratedPost[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  const loadPosts = useCallback(async (reset = false) => {
    const p = reset ? 1 : page
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(p), limit: '20' })
      if (typeFilter) params.set('type', typeFilter)
      const res = await fetch(`/api/feed?${params}`)
      const data = await res.json()
      if (reset) {
        setPosts(data.posts || [])
      } else {
        setPosts((prev) => [...prev, ...(data.posts || [])])
      }
      setHasMore(p < (data.totalPages || 1))
    } catch (e) { console.error(e) }
    setLoading(false)
  }, [page, typeFilter])

  useEffect(() => {
    setPage(1)
    loadPosts(true)
  }, [typeFilter])

  useEffect(() => {
    if (page > 1) loadPosts()
  }, [page])

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('cs-CZ', {
      day: 'numeric', month: 'long', year: 'numeric',
    })
  }

  function estimateReadTime(markdown: string) {
    const words = markdown.split(/\s+/).length
    return Math.max(1, Math.round(words / 200))
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      {/* Hero */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-foreground mb-3">
          Co je nového
        </h1>
        <p className="text-lg text-foreground/60 max-w-xl mx-auto">
          Kurátorovaný přehled výzkumů, tipů a postřehů o tom, jak žít vědoměji.
        </p>
      </div>

      {/* Type filter tabs */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {[
          { value: '', label: 'Vše' },
          { value: 'tip', label: 'Tipy' },
          { value: 'digest', label: 'Týdenní přehledy' },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => router.push(tab.value ? `/feed?type=${tab.value}` : '/feed')}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
              typeFilter === tab.value
                ? 'bg-accent text-white'
                : 'bg-black/5 text-foreground/60 hover:bg-black/10'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Posts */}
      {loading && posts.length === 0 ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-foreground/30" size={28} /></div>
      ) : posts.length === 0 ? (
        <p className="text-center py-16 text-foreground/40">Zatím žádné příspěvky.</p>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => {
            const mainCategory = post.categories?.[0]
            const color = CATEGORY_COLORS[mainCategory] || '#888'
            const emoji = CATEGORY_EMOJI[mainCategory] || ''

            if (post.type === 'digest') {
              // Digest card — larger
              return (
                <Link key={post.id} href={`/feed/${post.slug}`} className="block group">
                  <div className="bg-white rounded-2xl border-2 border-black/10 p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-accent/10 text-accent">
                        Týdenní přehled
                      </span>
                      <span className="text-xs text-foreground/40 flex items-center gap-1">
                        <Calendar size={12} /> {formatDate(post.published_at)}
                      </span>
                      <span className="text-xs text-foreground/40 flex items-center gap-1">
                        <Clock size={12} /> {estimateReadTime(post.body_markdown)} min čtení
                      </span>
                    </div>
                    <h2 className="text-xl font-bold text-foreground group-hover:text-accent transition-colors">
                      {post.title}
                    </h2>
                    {post.subtitle && (
                      <p className="text-foreground/60 mt-1">{post.subtitle}</p>
                    )}
                    <div className="flex items-center gap-1.5 mt-3">
                      {post.categories?.slice(0, 4).map((cat) => (
                        <span key={cat} className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: `${CATEGORY_COLORS[cat]}15`, color: CATEGORY_COLORS[cat] }}>
                          {CATEGORY_EMOJI[cat]} {cat}
                        </span>
                      ))}
                      <span className="ml-auto text-accent text-sm font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
                        Číst <ArrowRight size={14} />
                      </span>
                    </div>
                  </div>
                </Link>
              )
            }

            // Tip card — compact
            return (
              <div key={post.id} className="bg-white rounded-2xl border-2 border-black/10 p-5">
                <div className="flex items-center gap-2 mb-2">
                  {mainCategory && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: `${color}15`, color }}>
                      {emoji} {mainCategory}
                    </span>
                  )}
                  <span className="text-xs text-foreground/40">
                    {formatDate(post.published_at)}
                  </span>
                </div>
                <h3 className="font-bold text-foreground text-sm">{post.title}</h3>
                <p className="text-sm text-foreground/60 mt-1.5 leading-relaxed">
                  {post.body_markdown.split('\n')[0]?.replace(/[#*[\]()]/g, '').substring(0, 200)}
                </p>
                {post.curator_note && (
                  <p className="text-sm text-foreground/70 mt-2 pl-3 border-l-2 border-accent/30 italic">
                    {post.curator_note}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Load more */}
      {hasMore && posts.length > 0 && (
        <div className="flex justify-center mt-8">
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={loading}
            className="px-6 py-3 rounded-full text-sm font-semibold border-2 border-black/10 hover:border-accent hover:text-accent transition-colors disabled:opacity-40"
          >
            {loading ? 'Načítám...' : 'Načíst další'}
          </button>
        </div>
      )}
    </div>
  )
}

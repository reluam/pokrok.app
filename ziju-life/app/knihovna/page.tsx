'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import FeedAskBox from '@/components/FeedAskBox'
import FeedAnswerView from '@/components/FeedAnswerView'
import { FeedCard, type CuratedPost } from '@/components/FeedCards'

interface Source {
  id: number; title: string; slug: string; type: 'post' | 'principle'
}

interface AnswerState {
  question: string; answer: string; sources: Source[];
  followUps: string[]; hasZijuContent: boolean
}

// ── Main ─────────────────────────────────────────────────────────────────────

export default function FeedPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-16"><Loader2 className="animate-spin text-muted" size={28} /></div>}>
      <FeedContent />
    </Suspense>
  )
}

function FeedContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tagFilter = searchParams.get('tag') || ''
  const askParam = searchParams.get('ask') || ''

  // Feed state
  const [posts, setPosts] = useState<CuratedPost[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  // AI Q&A state
  const [askLoading, setAskLoading] = useState(false)
  const [answerState, setAnswerState] = useState<AnswerState | null>(null)
  const [conversationHistory, setConversationHistory] = useState<{ role: 'user' | 'assistant'; content: string }[]>([])
  const [lastProcessedAsk, setLastProcessedAsk] = useState('')

  const loadPosts = useCallback(async (reset = false) => {
    const p = reset ? 1 : page
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(p), limit: '12' })
      if (tagFilter) params.set('tag', tagFilter)
      const res = await fetch(`/api/feed?${params}`)
      const data = await res.json()
      if (reset) { setPosts(data.posts || []) }
      else { setPosts(prev => [...prev, ...(data.posts || [])]) }
      setHasMore(p < (data.totalPages || 1))
    } catch (e) { console.error(e) }
    setLoading(false)
  }, [page, tagFilter])

  useEffect(() => { setPage(1); loadPosts(true) }, [tagFilter])
  useEffect(() => { if (page > 1) loadPosts() }, [page])

  // Handle ask param from URL
  useEffect(() => {
    if (askParam && askParam !== lastProcessedAsk) {
      setLastProcessedAsk(askParam)
      doAsk(askParam, [])
    }
    if (!askParam) {
      setAnswerState(null)
      setConversationHistory([])
      setLastProcessedAsk('')
    }
  }, [askParam])

  const doAsk = async (question: string, history: { role: 'user' | 'assistant'; content: string }[]) => {
    setAskLoading(true)
    setAnswerState({ question, answer: '', sources: [], followUps: [], hasZijuContent: false })
    try {
      const res = await fetch('/api/feed/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, history }),
      })
      const data = await res.json()
      if (!res.ok) {
        setAnswerState({ question, answer: data.error || 'Nepodařilo se získat odpověď.', sources: [], followUps: [], hasZijuContent: false })
        return
      }
      setConversationHistory([...history, { role: 'user', content: question }, { role: 'assistant', content: data.answer }])
      setAnswerState({ question, answer: data.answer, sources: data.sources, followUps: data.followUps, hasZijuContent: data.hasZijuContent })
    } catch {
      setAnswerState({ question, answer: 'Nepodařilo se získat odpověď. Zkus to znovu.', sources: [], followUps: [], hasZijuContent: false })
    } finally { setAskLoading(false) }
  }

  const handleAsk = (question: string) => {
    router.push(`/knihovna?ask=${encodeURIComponent(question)}`)
  }

  const handleFollowUp = (question: string) => {
    setLastProcessedAsk(question)
    router.push(`/knihovna?ask=${encodeURIComponent(question)}`, { scroll: false })
    doAsk(question, conversationHistory)
  }

  // Answer mode
  if (askParam && answerState) {
    return (
      <FeedAnswerView
        question={answerState.question}
        answer={answerState.answer}
        sources={answerState.sources}
        followUps={answerState.followUps}
        hasZijuContent={answerState.hasZijuContent}
        loading={askLoading}
        onBack={() => router.push('/knihovna')}
        onFollowUp={handleFollowUp}
      />
    )
  }

  const tabs = [
    { value: '', label: 'Vše' },
    { value: 'kniha', label: 'Knihy' },
    { value: 'video', label: 'Videa' },
    { value: 'článek', label: 'Články' },
    { value: 'ostatní', label: 'Ostatní' },
  ]

  // Browse mode
  return (
    <div className="max-w-5xl mx-auto px-6 pt-28 md:pt-32 pb-16 md:pb-20">
      {/* Header */}
      <div className="text-center mb-12 space-y-5 animate-fade-up">
        <p className="font-display text-xs uppercase tracking-[0.18em] text-primary font-bold">
          Články & myšlenky
        </p>
        <h1 className="font-display text-4xl md:text-5xl font-extrabold tracking-tight">
          <span className="underline-playful">Knihovna</span>
        </h1>
        <p className="text-lg text-muted max-w-xl mx-auto">
          Knihy, videa, výzkumy a tipy o tom, jak žít vědoměji.
        </p>

        <div className="max-w-xl mx-auto">
          <FeedAskBox onAsk={handleAsk} loading={askLoading} />
        </div>

        {/* Filter tabs */}
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => router.push(tab.value ? `/knihovna?tag=${tab.value}` : '/knihovna')}
              className={`px-5 py-2 rounded-full text-sm font-display font-bold transition-all ${
                tagFilter === tab.value
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-surface-low text-muted hover:bg-surface-mid hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading && posts.length === 0 ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-muted" size={28} /></div>
      ) : posts.length === 0 ? (
        <p className="text-center py-16 text-muted">Zatím žádné příspěvky.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 animate-fade-up" style={{ animationDelay: '100ms' }}>
          {posts.map((post) => (
            <FeedCard key={post.id} post={post} />
          ))}
        </div>
      )}

      {/* Load more */}
      {hasMore && posts.length > 0 && (
        <div className="flex justify-center mt-10">
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={loading}
            className="btn-playful disabled:opacity-40"
          >
            {loading ? 'Načítám...' : 'Načíst další'}
          </button>
        </div>
      )}

      {/* Substack CTA */}
      <section className="mt-16 animate-fade-up" style={{ animationDelay: '200ms' }}>
        <div className="paper-card p-8 md:p-12 text-center space-y-5">
          <svg className="w-10 h-10 text-primary mx-auto" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.539 8.242H1.46V5.406h21.08v2.836zM1.46 10.812V24l9.56-5.26L20.539 24V10.812H1.46zM22.54 0H1.46v2.836h21.08V0z"/>
          </svg>
          <h2 className="font-display text-3xl md:text-4xl font-extrabold tracking-tight">
            Čti více na <span className="underline-playful">Substacku</span>
          </h2>
          <p className="text-lg text-muted leading-relaxed max-w-2xl mx-auto">
            Pravidelné úvahy, postřehy a věci, které mě napadnou cestou. Bez spamu, bez prodeje — jen upřímné psaní o tom, jak se snažím žít podle sebe.
          </p>
          <a
            href="https://zijulife.substack.com/?r=86mho4&utm_campaign=pub-share-checklist"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-playful"
          >
            Přihlásit se k odběru &rarr;
          </a>
        </div>
      </section>
    </div>
  )
}

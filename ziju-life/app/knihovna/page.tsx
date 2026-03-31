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
    <Suspense fallback={<div className="flex justify-center py-16"><Loader2 className="animate-spin text-foreground/30" size={28} /></div>}>
      <FeedContent />
    </Suspense>
  )
}

function FeedContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const typeFilter = searchParams.get('type') || ''

  // Feed state
  const [posts, setPosts] = useState<CuratedPost[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  // AI Q&A state
  const [mode, setMode] = useState<'browse' | 'answer'>('browse')
  const [askLoading, setAskLoading] = useState(false)
  const [answerState, setAnswerState] = useState<AnswerState | null>(null)
  const [conversationHistory, setConversationHistory] = useState<{ role: 'user' | 'assistant'; content: string }[]>([])

  const loadPosts = useCallback(async (reset = false) => {
    const p = reset ? 1 : page
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(p), limit: '12' })
      if (typeFilter) params.set('type', typeFilter)
      const res = await fetch(`/api/feed?${params}`)
      const data = await res.json()
      if (reset) { setPosts(data.posts || []) }
      else { setPosts(prev => [...prev, ...(data.posts || [])]) }
      setHasMore(p < (data.totalPages || 1))
    } catch (e) { console.error(e) }
    setLoading(false)
  }, [page, typeFilter])

  useEffect(() => { setPage(1); loadPosts(true) }, [typeFilter])
  useEffect(() => { if (page > 1) loadPosts() }, [page])

  const handleAsk = async (question: string, history: { role: 'user' | 'assistant'; content: string }[] = []) => {
    setMode('answer')
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

  // Answer mode
  if (mode === 'answer' && answerState) {
    return (
      <FeedAnswerView
        question={answerState.question}
        answer={answerState.answer}
        sources={answerState.sources}
        followUps={answerState.followUps}
        hasZijuContent={answerState.hasZijuContent}
        loading={askLoading}
        onBack={() => { setMode('browse'); setAnswerState(null); setConversationHistory([]) }}
        onFollowUp={(q) => handleAsk(q, conversationHistory)}
      />
    )
  }

  // Browse mode
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Header */}
      <div className="text-center mb-10 space-y-5">
        <h1 className="text-4xl md:text-5xl font-extrabold text-foreground">Knihovna</h1>
        <p className="text-lg text-foreground/60 max-w-xl mx-auto">
          Knihy, videa, výzkumy a tipy o tom, jak žít vědoměji.
        </p>

        <div className="max-w-xl mx-auto">
          <FeedAskBox onAsk={(q) => handleAsk(q)} loading={askLoading} />
        </div>

        {/* Filter tabs */}
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {[
            { value: '', label: 'Vše' },
            { value: 'tip', label: 'Tipy' },
            { value: 'digest', label: 'Týdenní přehledy' },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => router.push(tab.value ? `/knihovna?type=${tab.value}` : '/knihovna')}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors ${
                typeFilter === tab.value
                  ? 'bg-accent text-white'
                  : 'bg-black/5 text-foreground/60 hover:bg-black/10'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Masonry grid */}
      {loading && posts.length === 0 ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-foreground/30" size={28} /></div>
      ) : posts.length === 0 ? (
        <p className="text-center py-16 text-foreground/40">Zatím žádné příspěvky.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
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
            className="px-8 py-3 rounded-full text-sm font-semibold bg-accent text-white hover:bg-accent-hover transition-colors disabled:opacity-40"
          >
            {loading ? 'Načítám...' : 'Načíst další'}
          </button>
        </div>
      )}
    </div>
  )
}

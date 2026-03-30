'use client'

import { useEffect, useState, useCallback } from 'react'
import { CATEGORY_CONFIG, PIPELINE_STATUSES, relevanceBadgeClass } from '@/components/pipeline/constants'
import { Search, Loader2, Bookmark, PenLine, Archive, ChevronLeft, ChevronRight } from 'lucide-react'

interface Article {
  brief_id: number
  article_id: number
  title: string
  url: string
  summary_cs: string
  relevance_score: number
  primary_category: string
  content_angle: string
  key_insight: string
  tags: string[]
  pipeline_status: string
  source_name: string
  published_at: string
}

interface Pagination { page: number; limit: number; total: number; totalPages: number }

export default function FeedPage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 })
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ category: '', minRelevance: '1', status: 'inbox', search: '' })
  const [page, setPage] = useState(1)

  const loadArticles = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: '20' })
    if (filters.category) params.set('category', filters.category)
    if (filters.minRelevance !== '1') params.set('minRelevance', filters.minRelevance)
    if (filters.status) params.set('status', filters.status)
    if (filters.search) params.set('search', filters.search)
    try {
      const res = await fetch(`/api/admin/pipeline/articles?${params}`)
      const data = await res.json()
      setArticles(data.articles || [])
      setPagination(data.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 })
    } catch (e) { console.error(e) }
    setLoading(false)
  }, [page, filters])

  useEffect(() => { loadArticles() }, [loadArticles])

  async function updateStatus(briefId: number, status: string) {
    await fetch('/api/admin/pipeline/articles/status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ briefId, status }),
    })
    setArticles((prev) => prev.filter((a) => a.brief_id !== briefId))
    setPagination((prev) => ({ ...prev, total: prev.total - 1 }))
  }

  const inputClass = 'px-3 py-2 rounded-xl text-sm border-2 border-black/10 bg-white focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-colors'

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Feed</h1>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 bg-white rounded-2xl p-4 border-2 border-black/10">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/30" />
          <input
            type="text"
            placeholder="Hledat v článcích..."
            value={filters.search}
            onChange={(e) => { setFilters((f) => ({ ...f, search: e.target.value })); setPage(1) }}
            className={`${inputClass} w-full pl-9`}
          />
        </div>
        <select value={filters.category} onChange={(e) => { setFilters((f) => ({ ...f, category: e.target.value })); setPage(1) }} className={inputClass}>
          <option value="">Všechny kategorie</option>
          {Object.entries(CATEGORY_CONFIG).map(([key, { emoji, label }]) => (
            <option key={key} value={key}>{emoji} {label}</option>
          ))}
        </select>
        <select value={filters.minRelevance} onChange={(e) => { setFilters((f) => ({ ...f, minRelevance: e.target.value })); setPage(1) }} className={inputClass}>
          {[1, 3, 5, 7, 9].map((v) => (
            <option key={v} value={v}>Relevance ≥ {v}</option>
          ))}
        </select>
        <select value={filters.status} onChange={(e) => { setFilters((f) => ({ ...f, status: e.target.value })); setPage(1) }} className={inputClass}>
          <option value="">Všechny stavy</option>
          {PIPELINE_STATUSES.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        {(filters.category || filters.search || filters.status || filters.minRelevance !== '1') && (
          <button onClick={() => { setFilters({ category: '', minRelevance: '1', status: '', search: '' }); setPage(1) }} className="text-xs font-semibold text-foreground/50 hover:text-accent transition-colors">
            Resetovat
          </button>
        )}
      </div>

      <p className="text-xs text-foreground/40 font-medium">{pagination.total} článků</p>

      {/* Article list */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-foreground/30" size={24} /></div>
      ) : articles.length === 0 ? (
        <p className="text-center py-12 text-sm text-foreground/40">Žádné články nenalezeny.</p>
      ) : (
        <div className="space-y-3">
          {articles.map((article) => {
            const cat = CATEGORY_CONFIG[article.primary_category]
            return (
              <div key={article.brief_id} className="bg-white rounded-2xl p-5 border-2 border-black/10 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ background: `${cat?.color}15`, color: cat?.color }}>
                        {cat?.emoji} {cat?.label}
                      </span>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-bold font-mono ${relevanceBadgeClass(article.relevance_score)}`}>
                        {article.relevance_score}/10
                      </span>
                      <span className="text-xs text-foreground/40 font-medium">
                        {article.source_name} · {new Date(article.published_at).toLocaleDateString('cs-CZ')}
                      </span>
                      {article.pipeline_status !== 'inbox' && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-black/5 text-foreground/50 font-semibold">
                          {PIPELINE_STATUSES.find((s) => s.value === article.pipeline_status)?.label}
                        </span>
                      )}
                    </div>
                    <a href={article.url} target="_blank" rel="noopener noreferrer" className="font-bold text-foreground hover:text-accent transition-colors">
                      {article.title}
                    </a>
                    <p className="text-sm text-foreground/60 mt-1.5 leading-relaxed">{article.summary_cs}</p>
                    {article.content_angle && (
                      <p className="text-xs text-foreground/40 mt-2 leading-relaxed">💡 {article.content_angle}</p>
                    )}
                    {article.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {article.tags.map((tag) => (
                          <span key={tag} className="text-xs px-2 py-0.5 rounded-lg bg-black/5 text-foreground/50 font-medium">{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5 shrink-0">
                    <button onClick={() => updateStatus(article.brief_id, 'saved')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border-2 border-black/10 text-blue-600 hover:border-blue-300 hover:bg-blue-50 transition-colors">
                      <Bookmark size={12} /> Uložit
                    </button>
                    <button onClick={() => updateStatus(article.brief_id, 'in_progress')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border-2 border-black/10 text-emerald-600 hover:border-emerald-300 hover:bg-emerald-50 transition-colors">
                      <PenLine size={12} /> Tvořit
                    </button>
                    <button onClick={() => updateStatus(article.brief_id, 'archived')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border-2 border-black/10 text-foreground/40 hover:border-black/20 hover:bg-black/5 transition-colors">
                      <Archive size={12} /> Archiv
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-2">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-xl border-2 border-black/10 disabled:opacity-30 hover:border-accent transition-colors">
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-semibold text-foreground/60">{page} / {pagination.totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))} disabled={page === pagination.totalPages} className="p-2 rounded-xl border-2 border-black/10 disabled:opacity-30 hover:border-accent transition-colors">
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  )
}

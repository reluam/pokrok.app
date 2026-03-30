'use client'

import { useEffect, useState, useCallback } from 'react'
import { CATEGORY_CONFIG, PIPELINE_STATUSES, relevanceBadgeStyle, cardStyle, inputStyle } from '@/components/pipeline/constants'
import { Search, Loader2, Bookmark, PenLine, Archive, ChevronLeft, ChevronRight } from 'lucide-react'

interface Article {
  brief_id: number
  article_id: number
  title: string
  url: string
  summary_cs: string
  relevance_score: number
  primary_category: string
  categories: string[]
  content_angle: string
  key_insight: string
  tags: string[]
  pipeline_status: string
  pipeline_notes: string | null
  source_name: string
  published_at: string
  content_type: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function FeedPage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 })
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    category: '',
    minRelevance: '1',
    status: '',
    search: '',
  })
  const [page, setPage] = useState(1)

  const loadArticles = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    params.set('page', String(page))
    params.set('limit', '20')
    if (filters.category) params.set('category', filters.category)
    if (filters.minRelevance !== '1') params.set('minRelevance', filters.minRelevance)
    if (filters.status) params.set('status', filters.status)
    if (filters.search) params.set('search', filters.search)

    try {
      const res = await fetch(`/api/admin/pipeline/articles?${params}`)
      const data = await res.json()
      setArticles(data.articles || [])
      setPagination(data.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 })
    } catch (e) {
      console.error('Failed to load articles:', e)
    }
    setLoading(false)
  }, [page, filters])

  useEffect(() => {
    loadArticles()
  }, [loadArticles])

  async function updateStatus(briefId: number, status: string) {
    await fetch('/api/admin/pipeline/articles/status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ briefId, status }),
    })
    setArticles((prev) => prev.map((a) => (a.brief_id === briefId ? { ...a, pipeline_status: status } : a)))
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Feed</h1>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 p-3 rounded-lg border" style={cardStyle}>
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#555' }} />
          <input
            type="text"
            placeholder="Hledat..."
            value={filters.search}
            onChange={(e) => { setFilters((f) => ({ ...f, search: e.target.value })); setPage(1) }}
            className="w-full pl-9 pr-3 py-2 rounded-md text-sm border"
            style={inputStyle}
          />
        </div>

        {/* Category */}
        <select
          value={filters.category}
          onChange={(e) => { setFilters((f) => ({ ...f, category: e.target.value })); setPage(1) }}
          className="px-3 py-2 rounded-md text-sm border"
          style={inputStyle}
        >
          <option value="">Všechny kategorie</option>
          {Object.entries(CATEGORY_CONFIG).map(([key, { emoji, label }]) => (
            <option key={key} value={key}>{emoji} {label}</option>
          ))}
        </select>

        {/* Min relevance */}
        <select
          value={filters.minRelevance}
          onChange={(e) => { setFilters((f) => ({ ...f, minRelevance: e.target.value })); setPage(1) }}
          className="px-3 py-2 rounded-md text-sm border"
          style={inputStyle}
        >
          {[1, 3, 5, 7, 9].map((v) => (
            <option key={v} value={v}>Relevance ≥ {v}</option>
          ))}
        </select>

        {/* Status */}
        <select
          value={filters.status}
          onChange={(e) => { setFilters((f) => ({ ...f, status: e.target.value })); setPage(1) }}
          className="px-3 py-2 rounded-md text-sm border"
          style={inputStyle}
        >
          <option value="">Všechny stavy</option>
          {PIPELINE_STATUSES.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>

        {(filters.category || filters.search || filters.status || filters.minRelevance !== '1') && (
          <button
            onClick={() => { setFilters({ category: '', minRelevance: '1', status: '', search: '' }); setPage(1) }}
            className="text-xs px-2 py-1 rounded"
            style={{ color: '#888' }}
          >
            Resetovat
          </button>
        )}
      </div>

      {/* Count */}
      <p className="text-xs" style={{ color: '#555' }}>{pagination.total} článků nalezeno</p>

      {/* Article list */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin" size={24} style={{ color: '#888' }} /></div>
      ) : articles.length === 0 ? (
        <p className="text-center py-12 text-sm" style={{ color: '#555' }}>Žádné články nenalezeny.</p>
      ) : (
        <div className="space-y-3">
          {articles.map((article) => {
            const cat = CATEGORY_CONFIG[article.primary_category]
            const badge = relevanceBadgeStyle(article.relevance_score)
            return (
              <div key={article.brief_id} className="rounded-lg p-4 border" style={cardStyle}>
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Meta row */}
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: `${cat?.color}20`, color: cat?.color }}>
                        {cat?.emoji} {cat?.label}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-mono font-bold" style={badge}>
                        {article.relevance_score}/10
                      </span>
                      <span className="text-xs" style={{ color: '#555' }}>
                        {article.source_name} · {new Date(article.published_at).toLocaleDateString('cs-CZ')}
                      </span>
                      {article.pipeline_status !== 'inbox' && (
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#222', color: '#888' }}>
                          {PIPELINE_STATUSES.find((s) => s.value === article.pipeline_status)?.label}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <a href={article.url} target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline text-sm leading-snug">
                      {article.title}
                    </a>

                    {/* Summary */}
                    <p className="text-sm mt-1.5 leading-relaxed" style={{ color: '#aaa' }}>{article.summary_cs}</p>

                    {/* Content angle */}
                    {article.content_angle && (
                      <p className="text-xs mt-2 leading-relaxed" style={{ color: '#666' }}>
                        💡 {article.content_angle}
                      </p>
                    )}

                    {/* Tags */}
                    {article.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {article.tags.map((tag) => (
                          <span key={tag} className="text-xs px-1.5 py-0.5 rounded" style={{ background: '#222', color: '#777' }}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-1.5 shrink-0">
                    <button
                      onClick={() => updateStatus(article.brief_id, 'saved')}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium border transition-colors"
                      style={{ borderColor: '#2a2a2a', color: '#38bdf8' }}
                      title="Uložit"
                    >
                      <Bookmark size={13} /> Uložit
                    </button>
                    <button
                      onClick={() => updateStatus(article.brief_id, 'in_progress')}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium border transition-colors"
                      style={{ borderColor: '#2a2a2a', color: '#34d399' }}
                      title="Tvořit obsah"
                    >
                      <PenLine size={13} /> Tvořit
                    </button>
                    <button
                      onClick={() => updateStatus(article.brief_id, 'archived')}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium border transition-colors"
                      style={{ borderColor: '#2a2a2a', color: '#555' }}
                      title="Archivovat"
                    >
                      <Archive size={13} /> Archiv
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
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 rounded border disabled:opacity-30"
            style={{ borderColor: '#2a2a2a' }}
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm" style={{ color: '#888' }}>
            {page} / {pagination.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
            disabled={page === pagination.totalPages}
            className="p-2 rounded border disabled:opacity-30"
            style={{ borderColor: '#2a2a2a' }}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  )
}

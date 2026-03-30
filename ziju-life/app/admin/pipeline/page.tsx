'use client'

import { useEffect, useState } from 'react'
import { CATEGORY_CONFIG, relevanceBadgeClass } from '@/components/pipeline/constants'
import { Play, RefreshCw, Loader2, Bookmark, PenLine, Archive, Share2 } from 'lucide-react'
import ShareModal from '@/components/pipeline/ShareModal'

interface PipelineCount { pipeline_status: string; count: number }
interface Article {
  brief_id: number
  title: string
  url: string
  summary_cs: string
  relevance_score: number
  primary_category: string
  content_angle: string
  source_name: string
}

export default function PipelineDashboard() {
  const [pipelineCounts, setPipelineCounts] = useState<PipelineCount[]>([])
  const [topArticles, setTopArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [triggering, setTriggering] = useState<string | null>(null)
  const [shareArticle, setShareArticle] = useState<Article | null>(null)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [statsRes, articlesRes] = await Promise.all([
        fetch('/api/admin/pipeline/stats'),
        fetch('/api/admin/pipeline/articles?limit=5&minRelevance=7&status=inbox'),
      ])
      const stats = await statsRes.json()
      const articles = await articlesRes.json()
      setPipelineCounts(stats.pipeline || [])
      setTopArticles(articles.articles || [])
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  async function triggerStep(step: string) {
    setTriggering(step)
    try {
      await fetch('/api/admin/pipeline/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step }),
      })
      await loadData()
    } catch (e) { console.error(e) }
    setTriggering(null)
  }

  async function updateStatus(briefId: number, status: string) {
    setTopArticles((prev) => prev.filter((a) => a.brief_id !== briefId))
    await fetch('/api/admin/pipeline/articles/status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ briefId, status }),
    })
  }

  const getCount = (status: string) => pipelineCounts.find((p) => p.pipeline_status === status)?.count || 0

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-foreground/30" size={24} /></div>
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-foreground/60 mt-1">Přehled pipeline a dnešní top články</p>
        </div>
        <div className="flex items-center gap-2">
          {[
            { step: 'fetch', label: 'Fetch RSS', icon: RefreshCw },
            { step: 'process', label: 'Process AI', icon: Play },
            { step: 'brief', label: 'Odeslat brief', icon: Play },
          ].map(({ step, label, icon: Icon }) => (
            <button
              key={step}
              onClick={() => triggerStep(step)}
              disabled={triggering !== null}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border-2 border-black/10 hover:border-accent hover:text-accent transition-colors disabled:opacity-40"
            >
              {triggering === step ? <Loader2 size={14} className="animate-spin" /> : <Icon size={14} />}
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Pipeline counts */}
      <div className="grid grid-cols-5 gap-4">
        {[
          { key: 'inbox', label: 'Inbox', color: 'text-foreground' },
          { key: 'saved', label: 'Uložené', color: 'text-blue-600' },
          { key: 'in_progress', label: 'Rozpracované', color: 'text-amber-600' },
          { key: 'drafted', label: 'Drafty', color: 'text-purple-600' },
          { key: 'published', label: 'Publikované', color: 'text-emerald-600' },
        ].map(({ key, label, color }) => (
          <div key={key} className="bg-white rounded-2xl p-5 border-2 border-black/10">
            <p className="text-sm font-semibold text-foreground/60">{label}</p>
            <p className={`text-3xl font-bold mt-1 ${color}`}>{getCount(key)}</p>
          </div>
        ))}
      </div>

      {/* Top articles */}
      <div>
        <h2 className="text-xl font-bold text-foreground mb-4">Top články (relevance 7+)</h2>
        {topArticles.length === 0 ? (
          <p className="text-foreground/40 text-sm">Zatím žádné zpracované články.</p>
        ) : (
          <div className="space-y-3">
            {topArticles.map((article) => {
              const cat = CATEGORY_CONFIG[article.primary_category]
              return (
                <div key={article.brief_id} className="bg-white rounded-2xl p-5 border-2 border-black/10 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className="text-xs px-2.5 py-1 rounded-full font-semibold"
                          style={{ background: `${cat?.color}15`, color: cat?.color }}
                        >
                          {cat?.emoji} {cat?.label}
                        </span>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-bold font-mono ${relevanceBadgeClass(article.relevance_score)}`}>
                          {article.relevance_score}/10
                        </span>
                      </div>
                      <a href={article.url} target="_blank" rel="noopener noreferrer" className="font-bold text-foreground hover:text-accent transition-colors">
                        {article.title}
                      </a>
                      <p className="text-sm text-foreground/60 mt-1.5 leading-relaxed">{article.summary_cs}</p>
                      {article.content_angle && (
                        <p className="text-xs text-foreground/40 mt-2 leading-relaxed">
                          💡 {article.content_angle}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col gap-1.5 shrink-0">
                      <span className="text-xs text-foreground/40 font-medium mb-1">{article.source_name}</span>
                      <button onClick={() => setShareArticle(article)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border-2 border-accent/30 text-accent hover:bg-accent hover:text-white transition-colors">
                        <Share2 size={12} /> Sdílet
                      </button>
                      <button onClick={() => updateStatus(article.brief_id, 'saved')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border-2 border-black/10 text-blue-600 hover:border-blue-300 hover:bg-blue-50 transition-colors">
                        <Bookmark size={12} /> Uložit
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
      </div>

      {shareArticle && (
        <ShareModal
          briefId={shareArticle.brief_id}
          title={shareArticle.title}
          summary={shareArticle.summary_cs}
          onClose={() => setShareArticle(null)}
          onShared={() => {
            setTopArticles((prev) => prev.filter((a) => a.brief_id !== shareArticle.brief_id))
            setShareArticle(null)
          }}
        />
      )}
    </div>
  )
}

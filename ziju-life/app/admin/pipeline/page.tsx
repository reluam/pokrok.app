'use client'

import { useEffect, useState } from 'react'
import { CATEGORY_CONFIG, relevanceBadgeStyle, cardStyle } from '@/components/pipeline/constants'
import { Play, RefreshCw, Loader2 } from 'lucide-react'

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
  published_at: string
}

export default function PipelineDashboard() {
  const [pipelineCounts, setPipelineCounts] = useState<PipelineCount[]>([])
  const [topArticles, setTopArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [triggering, setTriggering] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [statsRes, articlesRes] = await Promise.all([
        fetch('/api/admin/pipeline/stats'),
        fetch('/api/admin/pipeline/articles?limit=5&minRelevance=7'),
      ])
      const stats = await statsRes.json()
      const articles = await articlesRes.json()
      setPipelineCounts(stats.pipeline || [])
      setTopArticles(articles.articles || [])
    } catch (e) {
      console.error('Failed to load dashboard:', e)
    }
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
    } catch (e) {
      console.error('Trigger failed:', e)
    }
    setTriggering(null)
  }

  function getCount(status: string) {
    return pipelineCounts.find((p) => p.pipeline_status === status)?.count || 0
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin" size={24} style={{ color: '#888' }} /></div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Knowledge Pipeline</h1>
          <p className="text-sm mt-1" style={{ color: '#888' }}>Přehled dnešního briefu a stav pipeline</p>
        </div>
        <div className="flex items-center gap-2">
          {['fetch', 'process', 'brief'].map((step) => (
            <button
              key={step}
              onClick={() => triggerStep(step)}
              disabled={triggering !== null}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
              style={{ background: '#1a1a1a', borderColor: '#2a2a2a', border: '1px solid #2a2a2a', color: '#e5e5e5', opacity: triggering ? 0.5 : 1 }}
            >
              {triggering === step ? <Loader2 size={14} className="animate-spin" /> : step === 'fetch' ? <RefreshCw size={14} /> : <Play size={14} />}
              {step === 'fetch' ? 'Fetch RSS' : step === 'process' ? 'Process AI' : 'Odeslat brief'}
            </button>
          ))}
        </div>
      </div>

      {/* Pipeline counts */}
      <div className="grid grid-cols-5 gap-4">
        {[
          { key: 'inbox', label: 'Inbox' },
          { key: 'saved', label: 'Uložené' },
          { key: 'in_progress', label: 'Rozpracované' },
          { key: 'drafted', label: 'Drafty' },
          { key: 'published', label: 'Publikované' },
        ].map(({ key, label }) => (
          <div key={key} className="rounded-lg p-4 border" style={cardStyle}>
            <p className="text-sm font-medium" style={{ color: '#888' }}>{label}</p>
            <p className="text-3xl font-bold mt-1">{getCount(key)}</p>
          </div>
        ))}
      </div>

      {/* Top articles today */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Top články (relevance 7+)</h2>
        <div className="space-y-3">
          {topArticles.length === 0 && (
            <p className="text-sm" style={{ color: '#555' }}>Zatím žádné zpracované články.</p>
          )}
          {topArticles.map((article) => {
            const cat = CATEGORY_CONFIG[article.primary_category]
            const badge = relevanceBadgeStyle(article.relevance_score)
            return (
              <div key={article.brief_id} className="rounded-lg p-4 border" style={cardStyle}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: `${cat?.color}20`, color: cat?.color }}>
                        {cat?.emoji} {cat?.label}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-mono font-bold" style={badge}>
                        {article.relevance_score}/10
                      </span>
                    </div>
                    <a href={article.url} target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline text-sm">
                      {article.title}
                    </a>
                    <p className="text-sm mt-1" style={{ color: '#888' }}>{article.summary_cs}</p>
                    {article.content_angle && (
                      <p className="text-xs mt-2" style={{ color: '#666' }}>
                        💡 {article.content_angle}
                      </p>
                    )}
                  </div>
                  <span className="text-xs whitespace-nowrap" style={{ color: '#555' }}>{article.source_name}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

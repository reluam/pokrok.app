'use client'

import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts'
import { CATEGORY_CONFIG, cardStyle } from '@/components/pipeline/constants'
import { Loader2 } from 'lucide-react'

interface CategoryStat {
  primary_category: string
  total: number
  inbox: number
  saved: number
  in_progress: number
  published: number
  avg_relevance: number
}

interface DailyStat { date: string; article_count: number; avg_relevance: number }
interface TagStat { tag: string; count: number }
interface PipelineStat { pipeline_status: string; count: number }
interface SourceStat { name: string; category: string; article_count: number; avg_relevance: number; high_relevance_count: number }

export default function StatsPage() {
  const [data, setData] = useState<{
    categories: CategoryStat[]
    daily: DailyStat[]
    topTags: TagStat[]
    pipeline: PipelineStat[]
    sources: SourceStat[]
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/pipeline/stats')
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading || !data) {
    return <div className="flex justify-center py-12"><Loader2 className="animate-spin" size={24} style={{ color: '#888' }} /></div>
  }

  // Pipeline funnel
  const totalAll = data.pipeline.reduce((s, p) => s + p.count, 0)
  const getCount = (status: string) => data.pipeline.find((p) => p.pipeline_status === status)?.count || 0

  // Daily chart data (reverse for chronological order)
  const dailyChart = [...data.daily].reverse().map((d) => ({
    date: new Date(d.date).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric' }),
    articles: d.article_count,
    relevance: Number(d.avg_relevance),
  }))

  // Category chart data
  const categoryChart = data.categories.map((c) => ({
    name: CATEGORY_CONFIG[c.primary_category]?.emoji + ' ' + (CATEGORY_CONFIG[c.primary_category]?.label || c.primary_category),
    total: c.total,
    avgRelevance: Number(c.avg_relevance),
  }))

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Statistiky</h1>

      {/* Pipeline funnel */}
      <div className="rounded-lg p-4 border" style={cardStyle}>
        <h2 className="text-sm font-semibold mb-3">Pipeline konverze</h2>
        <div className="flex items-center gap-2">
          {[
            { label: 'Inbox', count: getCount('inbox'), color: '#888' },
            { label: 'Uložené', count: getCount('saved'), color: '#38bdf8' },
            { label: 'Rozpracované', count: getCount('in_progress'), color: '#fbbf24' },
            { label: 'Drafty', count: getCount('drafted'), color: '#f97316' },
            { label: 'Publikované', count: getCount('published'), color: '#34d399' },
          ].map((step, i) => (
            <div key={step.label} className="flex items-center gap-2">
              {i > 0 && <span style={{ color: '#444' }}>→</span>}
              <div className="text-center">
                <p className="text-2xl font-bold" style={{ color: step.color }}>{step.count}</p>
                <p className="text-xs" style={{ color: '#666' }}>
                  {step.label}
                  {totalAll > 0 && <span className="ml-1">({Math.round((step.count / totalAll) * 100)}%)</span>}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Daily volume */}
        <div className="rounded-lg p-4 border" style={cardStyle}>
          <h2 className="text-sm font-semibold mb-3">Denní objem (30 dní)</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={dailyChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis dataKey="date" tick={{ fill: '#666', fontSize: 10 }} />
              <YAxis tick={{ fill: '#666', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, color: '#e5e5e5', fontSize: 12 }} />
              <Line type="monotone" dataKey="articles" stroke="#38bdf8" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="relevance" stroke="#34d399" strokeWidth={1} dot={false} strokeDasharray="4 4" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Categories */}
        <div className="rounded-lg p-4 border" style={cardStyle}>
          <h2 className="text-sm font-semibold mb-3">Kategorie</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={categoryChart} layout="vertical">
              <XAxis type="number" tick={{ fill: '#666', fontSize: 10 }} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#888', fontSize: 11 }} width={120} />
              <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, color: '#e5e5e5', fontSize: 12 }} />
              <Bar dataKey="total" fill="#38bdf8" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top tags + Source performance */}
      <div className="grid grid-cols-2 gap-4">
        {/* Tags */}
        <div className="rounded-lg p-4 border" style={cardStyle}>
          <h2 className="text-sm font-semibold mb-3">Top tagy (30 dní)</h2>
          <div className="flex flex-wrap gap-1.5">
            {data.topTags.slice(0, 25).map((t) => (
              <span key={t.tag} className="text-xs px-2 py-1 rounded-md" style={{ background: '#222', color: '#aaa' }}>
                {t.tag} <span className="font-mono" style={{ color: '#666' }}>×{t.count}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Source performance */}
        <div className="rounded-lg p-4 border overflow-auto" style={cardStyle}>
          <h2 className="text-sm font-semibold mb-3">Výkon zdrojů</h2>
          <table className="w-full text-xs">
            <thead>
              <tr style={{ color: '#666' }}>
                <th className="text-left pb-2">Zdroj</th>
                <th className="text-right pb-2">Články</th>
                <th className="text-right pb-2">Ø Rel.</th>
                <th className="text-right pb-2">7+</th>
              </tr>
            </thead>
            <tbody>
              {data.sources.map((s) => {
                const cat = CATEGORY_CONFIG[s.category]
                return (
                  <tr key={s.name} className="border-t" style={{ borderColor: '#1f1f1f' }}>
                    <td className="py-1.5">
                      <span style={{ color: cat?.color }}>{cat?.emoji}</span> {s.name}
                    </td>
                    <td className="text-right font-mono" style={{ color: '#888' }}>{s.article_count}</td>
                    <td className="text-right font-mono" style={{ color: '#888' }}>{s.avg_relevance}</td>
                    <td className="text-right font-mono" style={{ color: '#34d399' }}>{s.high_relevance_count}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts'
import { CATEGORY_CONFIG } from '@/components/pipeline/constants'
import { Loader2 } from 'lucide-react'

interface CategoryStat { primary_category: string; total: number; inbox: number; saved: number; in_progress: number; published: number; avg_relevance: number }
interface DailyStat { date: string; article_count: number; avg_relevance: number }
interface TagStat { tag: string; count: number }
interface PipelineStat { pipeline_status: string; count: number }
interface SourceStat { name: string; category: string; article_count: number; avg_relevance: number; high_relevance_count: number }

export default function StatsPage() {
  const [data, setData] = useState<{
    categories: CategoryStat[]; daily: DailyStat[]; topTags: TagStat[]; pipeline: PipelineStat[]; sources: SourceStat[]
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/pipeline/stats').then((r) => r.json()).then(setData).catch(console.error).finally(() => setLoading(false))
  }, [])

  if (loading || !data) {
    return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-foreground/30" size={24} /></div>
  }

  const totalAll = data.pipeline.reduce((s, p) => s + p.count, 0)
  const getCount = (status: string) => data.pipeline.find((p) => p.pipeline_status === status)?.count || 0

  const dailyChart = [...data.daily].reverse().map((d) => ({
    date: new Date(d.date).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric' }),
    articles: d.article_count,
    relevance: Number(d.avg_relevance),
  }))

  const categoryChart = data.categories.map((c) => ({
    name: CATEGORY_CONFIG[c.primary_category]?.emoji + ' ' + (CATEGORY_CONFIG[c.primary_category]?.label || c.primary_category),
    total: c.total,
  }))

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Statistiky</h1>

      {/* Pipeline funnel */}
      <div className="bg-white rounded-2xl p-6 border-2 border-black/10">
        <h2 className="text-sm font-bold text-foreground/60 mb-4">Pipeline konverze</h2>
        <div className="flex items-center gap-3">
          {[
            { label: 'Inbox', count: getCount('inbox'), color: 'text-foreground' },
            { label: 'Uložené', count: getCount('saved'), color: 'text-blue-600' },
            { label: 'Rozpracované', count: getCount('in_progress'), color: 'text-amber-600' },
            { label: 'Drafty', count: getCount('drafted'), color: 'text-purple-600' },
            { label: 'Publikované', count: getCount('published'), color: 'text-emerald-600' },
          ].map((step, i) => (
            <div key={step.label} className="flex items-center gap-3">
              {i > 0 && <span className="text-foreground/20 text-xl">→</span>}
              <div className="text-center">
                <p className={`text-2xl font-bold ${step.color}`}>{step.count}</p>
                <p className="text-xs text-foreground/50 font-medium">
                  {step.label}
                  {totalAll > 0 && <span className="ml-1">({Math.round((step.count / totalAll) * 100)}%)</span>}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-6 border-2 border-black/10">
          <h2 className="text-sm font-bold text-foreground/60 mb-4">Denní objem (30 dní)</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={dailyChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
              <XAxis dataKey="date" tick={{ fill: '#999', fontSize: 10 }} />
              <YAxis tick={{ fill: '#999', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: '#fff', border: '2px solid rgba(0,0,0,0.1)', borderRadius: 12, fontSize: 12 }} />
              <Line type="monotone" dataKey="articles" stroke="#FF8C42" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="relevance" stroke="#4ECDC4" strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl p-6 border-2 border-black/10">
          <h2 className="text-sm font-bold text-foreground/60 mb-4">Kategorie</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={categoryChart} layout="vertical">
              <XAxis type="number" tick={{ fill: '#999', fontSize: 10 }} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#666', fontSize: 11 }} width={120} />
              <Tooltip contentStyle={{ background: '#fff', border: '2px solid rgba(0,0,0,0.1)', borderRadius: 12, fontSize: 12 }} />
              <Bar dataKey="total" fill="#FF8C42" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tags + Source performance */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-6 border-2 border-black/10">
          <h2 className="text-sm font-bold text-foreground/60 mb-4">Top tagy (30 dní)</h2>
          <div className="flex flex-wrap gap-2">
            {data.topTags.slice(0, 25).map((t) => (
              <span key={t.tag} className="text-xs px-2.5 py-1 rounded-xl bg-black/5 text-foreground/60 font-medium">
                {t.tag} <span className="font-mono text-foreground/30">×{t.count}</span>
              </span>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border-2 border-black/10 overflow-auto">
          <h2 className="text-sm font-bold text-foreground/60 mb-4">Výkon zdrojů</h2>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-foreground/40">
                <th className="text-left pb-2 font-semibold">Zdroj</th>
                <th className="text-right pb-2 font-semibold">Články</th>
                <th className="text-right pb-2 font-semibold">Ø Rel.</th>
                <th className="text-right pb-2 font-semibold">7+</th>
              </tr>
            </thead>
            <tbody>
              {data.sources.map((s) => {
                const cat = CATEGORY_CONFIG[s.category]
                return (
                  <tr key={s.name} className="border-t border-black/5">
                    <td className="py-2 font-medium text-foreground/70">
                      <span style={{ color: cat?.color }}>{cat?.emoji}</span> {s.name}
                    </td>
                    <td className="text-right font-mono text-foreground/50">{s.article_count}</td>
                    <td className="text-right font-mono text-foreground/50">{s.avg_relevance}</td>
                    <td className="text-right font-mono text-emerald-600 font-bold">{s.high_relevance_count}</td>
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

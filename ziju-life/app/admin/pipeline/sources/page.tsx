'use client'

import { useEffect, useState } from 'react'
import { CATEGORY_CONFIG } from '@/components/pipeline/constants'
import { Loader2, Plus, Power, X } from 'lucide-react'

interface Source {
  id: number; name: string; url: string; type: string; category: string; priority: string
  is_active: boolean; last_fetched_at: string | null; article_count: number; avg_relevance: number | null
}

export default function SourcesPage() {
  const [sources, setSources] = useState<Source[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [newSource, setNewSource] = useState({ name: '', url: '', type: 'rss', category: 'psychology', priority: 'medium' })
  const [adding, setAdding] = useState(false)

  useEffect(() => { loadSources() }, [])

  async function loadSources() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/pipeline/sources')
      const data = await res.json()
      setSources(data.sources || [])
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  async function toggleActive(id: number, currentActive: boolean) {
    await fetch('/api/admin/pipeline/sources', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_active: !currentActive }),
    })
    setSources((prev) => prev.map((s) => (s.id === id ? { ...s, is_active: !currentActive } : s)))
  }

  async function addSource() {
    if (!newSource.name || !newSource.url) return
    setAdding(true)
    try {
      await fetch('/api/admin/pipeline/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSource),
      })
      setNewSource({ name: '', url: '', type: 'rss', category: 'psychology', priority: 'medium' })
      setShowAdd(false)
      await loadSources()
    } catch (e) { console.error(e) }
    setAdding(false)
  }

  const inputClass = 'px-3 py-2 rounded-xl text-sm border-2 border-black/10 bg-white focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-colors'

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-foreground/30" size={24} /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Zdroje</h1>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border-2 border-black/10 hover:border-accent hover:text-accent transition-colors"
        >
          {showAdd ? <X size={14} /> : <Plus size={14} />}
          {showAdd ? 'Zrušit' : 'Přidat zdroj'}
        </button>
      </div>

      {showAdd && (
        <div className="bg-white rounded-2xl p-6 border-2 border-black/10 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Název" value={newSource.name} onChange={(e) => setNewSource((s) => ({ ...s, name: e.target.value }))} className={inputClass} />
            <input placeholder="RSS URL" value={newSource.url} onChange={(e) => setNewSource((s) => ({ ...s, url: e.target.value }))} className={inputClass} />
            <select value={newSource.category} onChange={(e) => setNewSource((s) => ({ ...s, category: e.target.value }))} className={inputClass}>
              {Object.entries(CATEGORY_CONFIG).map(([key, { emoji, label }]) => (
                <option key={key} value={key}>{emoji} {label}</option>
              ))}
            </select>
            <div className="flex gap-3">
              <select value={newSource.type} onChange={(e) => setNewSource((s) => ({ ...s, type: e.target.value }))} className={`${inputClass} flex-1`}>
                <option value="rss">RSS</option>
                <option value="podcast_rss">Podcast RSS</option>
              </select>
              <select value={newSource.priority} onChange={(e) => setNewSource((s) => ({ ...s, priority: e.target.value }))} className={`${inputClass} flex-1`}>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
          <button
            onClick={addSource}
            disabled={adding || !newSource.name || !newSource.url}
            className="px-6 py-2.5 rounded-xl text-sm font-bold bg-accent text-white hover:bg-accent-hover transition-colors disabled:opacity-40"
          >
            {adding ? 'Přidávám...' : 'Přidat zdroj'}
          </button>
        </div>
      )}

      <div className="bg-white rounded-2xl border-2 border-black/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-black/[0.02] border-b-2 border-black/10 text-foreground/50">
              <th className="text-left px-5 py-3 font-semibold">Název</th>
              <th className="text-left px-5 py-3 font-semibold">Kategorie</th>
              <th className="text-center px-5 py-3 font-semibold">Priorita</th>
              <th className="text-right px-5 py-3 font-semibold">Články</th>
              <th className="text-right px-5 py-3 font-semibold">Ø Rel.</th>
              <th className="text-right px-5 py-3 font-semibold">Poslední fetch</th>
              <th className="text-center px-5 py-3 font-semibold">Stav</th>
            </tr>
          </thead>
          <tbody>
            {sources.map((source) => {
              const cat = CATEGORY_CONFIG[source.category]
              return (
                <tr key={source.id} className={`border-b border-black/5 hover:bg-black/[0.01] transition-colors ${!source.is_active ? 'opacity-40' : ''}`}>
                  <td className="px-5 py-3">
                    <span className="font-semibold text-foreground">{source.name}</span>
                    <br />
                    <span className="text-xs text-foreground/40">{source.type}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ background: `${cat?.color}15`, color: cat?.color }}>
                      {cat?.emoji} {cat?.label}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-center">
                    <span className={`text-xs font-bold font-mono ${source.priority === 'high' ? 'text-emerald-600' : 'text-foreground/40'}`}>
                      {source.priority}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right font-mono text-foreground/50">{source.article_count}</td>
                  <td className="px-5 py-3 text-right font-mono text-foreground/50">{source.avg_relevance || '—'}</td>
                  <td className="px-5 py-3 text-right text-xs text-foreground/40">
                    {source.last_fetched_at ? new Date(source.last_fetched_at).toLocaleDateString('cs-CZ') : '—'}
                  </td>
                  <td className="px-5 py-3 text-center">
                    <button onClick={() => toggleActive(source.id, source.is_active)} title={source.is_active ? 'Deaktivovat' : 'Aktivovat'} className="hover:scale-110 transition-transform">
                      <Power size={16} className={source.is_active ? 'text-emerald-500' : 'text-foreground/20'} />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

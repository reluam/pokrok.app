'use client'

import { useEffect, useState } from 'react'
import { CATEGORY_CONFIG, cardStyle, inputStyle } from '@/components/pipeline/constants'
import { Loader2, Plus, Power, X } from 'lucide-react'

interface Source {
  id: number
  name: string
  url: string
  type: string
  category: string
  priority: string
  is_active: boolean
  last_fetched_at: string | null
  article_count: number
  avg_relevance: number | null
}

export default function SourcesPage() {
  const [sources, setSources] = useState<Source[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [newSource, setNewSource] = useState({ name: '', url: '', type: 'rss', category: 'psychology', priority: 'medium' })
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    loadSources()
  }, [])

  async function loadSources() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/pipeline/sources')
      const data = await res.json()
      setSources(data.sources || [])
    } catch (e) {
      console.error('Failed to load sources:', e)
    }
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
    } catch (e) {
      console.error('Failed to add source:', e)
    }
    setAdding(false)
  }

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="animate-spin" size={24} style={{ color: '#888' }} /></div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Zdroje</h1>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium border transition-colors"
          style={{ borderColor: '#2a2a2a', background: showAdd ? '#2a2a2a' : '#1a1a1a' }}
        >
          {showAdd ? <X size={14} /> : <Plus size={14} />}
          {showAdd ? 'Zrušit' : 'Přidat zdroj'}
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="rounded-lg p-4 border space-y-3" style={cardStyle}>
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Název" value={newSource.name} onChange={(e) => setNewSource((s) => ({ ...s, name: e.target.value }))} className="px-3 py-2 rounded-md text-sm border" style={inputStyle} />
            <input placeholder="RSS URL" value={newSource.url} onChange={(e) => setNewSource((s) => ({ ...s, url: e.target.value }))} className="px-3 py-2 rounded-md text-sm border" style={inputStyle} />
            <select value={newSource.category} onChange={(e) => setNewSource((s) => ({ ...s, category: e.target.value }))} className="px-3 py-2 rounded-md text-sm border" style={inputStyle}>
              {Object.entries(CATEGORY_CONFIG).map(([key, { emoji, label }]) => (
                <option key={key} value={key}>{emoji} {label}</option>
              ))}
            </select>
            <div className="flex gap-3">
              <select value={newSource.type} onChange={(e) => setNewSource((s) => ({ ...s, type: e.target.value }))} className="flex-1 px-3 py-2 rounded-md text-sm border" style={inputStyle}>
                <option value="rss">RSS</option>
                <option value="podcast_rss">Podcast RSS</option>
              </select>
              <select value={newSource.priority} onChange={(e) => setNewSource((s) => ({ ...s, priority: e.target.value }))} className="flex-1 px-3 py-2 rounded-md text-sm border" style={inputStyle}>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
          <button
            onClick={addSource}
            disabled={adding || !newSource.name || !newSource.url}
            className="px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
            style={{ background: '#38bdf8', color: '#000' }}
          >
            {adding ? 'Přidávám...' : 'Přidat'}
          </button>
        </div>
      )}

      {/* Sources table */}
      <div className="rounded-lg border overflow-hidden" style={cardStyle}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: '#141414', color: '#666' }}>
              <th className="text-left px-4 py-3 font-medium">Název</th>
              <th className="text-left px-4 py-3 font-medium">Kategorie</th>
              <th className="text-center px-4 py-3 font-medium">Priorita</th>
              <th className="text-right px-4 py-3 font-medium">Články</th>
              <th className="text-right px-4 py-3 font-medium">Ø Rel.</th>
              <th className="text-right px-4 py-3 font-medium">Poslední fetch</th>
              <th className="text-center px-4 py-3 font-medium">Stav</th>
            </tr>
          </thead>
          <tbody>
            {sources.map((source) => {
              const cat = CATEGORY_CONFIG[source.category]
              return (
                <tr key={source.id} className="border-t" style={{ borderColor: '#2a2a2a', opacity: source.is_active ? 1 : 0.4 }}>
                  <td className="px-4 py-3">
                    <span className="font-medium">{source.name}</span>
                    <br />
                    <span className="text-xs" style={{ color: '#555' }}>{source.type}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${cat?.color}20`, color: cat?.color }}>
                      {cat?.emoji} {cat?.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-xs font-mono" style={{ color: source.priority === 'high' ? '#34d399' : '#888' }}>
                      {source.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono" style={{ color: '#888' }}>{source.article_count}</td>
                  <td className="px-4 py-3 text-right font-mono" style={{ color: '#888' }}>{source.avg_relevance || '—'}</td>
                  <td className="px-4 py-3 text-right text-xs" style={{ color: '#555' }}>
                    {source.last_fetched_at ? new Date(source.last_fetched_at).toLocaleDateString('cs-CZ') : '—'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => toggleActive(source.id, source.is_active)} title={source.is_active ? 'Deaktivovat' : 'Aktivovat'}>
                      <Power size={16} style={{ color: source.is_active ? '#34d399' : '#555' }} />
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

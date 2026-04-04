'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Plus, Edit2, Trash2, ExternalLink, Save, X, Eye, EyeOff,
  Loader2, Search, BookOpen, Video, PenTool, Music, Play,
  HelpCircle, Rss, RefreshCw, Sparkles, ArrowRight,
  Bookmark,
} from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────────────

interface CuratedPost {
  id: string; slug: string; type: string; title: string; subtitle: string | null
  body_markdown: string; cover_image_url: string | null; curator_note: string | null
  categories: string[]; tags: string[]; status: string
  published_at: string | null; created_at: string
}

interface PipelineBrief {
  brief_id: number; summary_cs: string; relevance_score: number
  primary_category: string; categories: string[]; key_insight: string
  content_angle: string; tags: string[]; pipeline_status: string
  title: string; url: string; source_name: string
  published_at: string | null; processed_at: string
}

interface RssSource {
  id: number; name: string; url: string; type: string; category: string
  priority: string; is_active: boolean; article_count: number; last_fetched_at: string | null
}

type Tab = 'posts' | 'pipeline' | 'new' | 'drafts' | 'digest' | 'sources'

const TYPE_OPTIONS = [
  { value: 'tip', label: 'Tip / Článek', icon: PenTool },
  { value: 'news', label: 'News (z pipeline)', icon: Rss },
  { value: 'kniha', label: 'Kniha', icon: BookOpen },
  { value: 'video', label: 'Video', icon: Video },
  { value: 'reel', label: 'Reel', icon: Play },
  { value: 'hudba', label: 'Hudba', icon: Music },
]

const CATEGORY_EMOJI: Record<string, string> = {
  psychology: '🧠', neuroscience: '⚡', health: '💪',
  productivity: '⏰', mindfulness: '🧘', relationships: '🤝',
}

// ── Main CMS Page ────────────────────────────────────────────────────────────

export default function PipelineCMS() {
  const [tab, setTab] = useState<Tab>('posts')

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'posts', label: 'Příspěvky', icon: PenTool },
    { id: 'pipeline', label: 'Pipeline Inbox', icon: Rss },
    { id: 'new', label: 'Nový příspěvek', icon: Plus },
    { id: 'drafts', label: 'Rozpracované', icon: Edit2 },
    { id: 'digest', label: 'Týdenní digest', icon: Sparkles },
    { id: 'sources', label: 'Zdroje', icon: Rss },
  ]

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="shrink-0">
        <h1 className="text-3xl font-bold text-foreground">Správa obsahu</h1>
        <p className="text-foreground/60 mt-1">CMS pro knihovnu — příspěvky, pipeline a zdroje.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b-2 border-black/10 -mx-8 px-8 mt-6 shrink-0">
        {tabs.map(t => {
          const Icon = t.icon
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 -mb-[2px] transition-colors ${
                tab === t.id
                  ? 'border-accent text-accent'
                  : 'border-transparent text-foreground/50 hover:text-foreground/80'
              }`}
            >
              <Icon size={15} />
              {t.label}
            </button>
          )
        })}
      </div>

      <div className="flex-1 min-h-0 mt-4">
        {tab === 'posts' && <PostsTab />}
        {tab === 'pipeline' && <PipelineTab />}
        {tab === 'new' && <NewPostTab onCreated={() => setTab('posts')} />}
        {tab === 'drafts' && <DraftsTab />}
        {tab === 'digest' && <DigestTab />}
        {tab === 'sources' && <SourcesTab />}
      </div>
    </div>
  )
}

// ── Posts Tab ─────────────────────────────────────────────────────────────────

function PostsTab() {
  const [posts, setPosts] = useState<CuratedPost[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'published' | 'draft' | 'archived'>('all')
  const [search, setSearch] = useState('')
  const [editingPost, setEditingPost] = useState<CuratedPost | null>(null)

  const loadPosts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: '100' })
      if (filter !== 'all') params.set('status', filter)
      const res = await fetch(`/api/admin/curated-posts?${params}`)
      const data = await res.json()
      setPosts(data.posts || [])
    } catch (e) { console.error(e) }
    setLoading(false)
  }, [filter])

  useEffect(() => { loadPosts() }, [loadPosts])

  const filteredPosts = search
    ? posts.filter(p => p.title.toLowerCase().includes(search.toLowerCase()))
    : posts

  const handleDelete = async (id: string) => {
    if (!confirm('Smazat příspěvek?')) return
    await fetch(`/api/admin/curated-posts?id=${id}`, { method: 'DELETE' })
    loadPosts()
  }

  const handleToggleStatus = async (post: CuratedPost) => {
    const newStatus = post.status === 'published' ? 'draft' : 'published'
    await fetch('/api/admin/curated-posts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: post.id, status: newStatus }),
    })
    loadPosts()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/30" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Hledat..."
            className="w-full pl-9 pr-4 py-2 border-2 border-black/10 rounded-xl text-sm focus:border-accent outline-none" />
        </div>
        {(['all', 'published', 'draft', 'archived'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
              filter === f ? 'bg-accent text-white' : 'bg-black/5 text-foreground/60 hover:bg-black/10'
            }`}>
            {f === 'all' ? 'Vše' : f === 'published' ? 'Publikované' : f === 'draft' ? 'Koncepty' : 'Archiv'}
          </button>
        ))}
        <span className="text-xs text-foreground/40 ml-auto">{filteredPosts.length} příspěvků</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-foreground/30" size={24} /></div>
      ) : filteredPosts.length === 0 ? (
        <p className="text-center text-foreground/40 py-12">Žádné příspěvky.</p>
      ) : (
        <div className="bg-white rounded-2xl border-2 border-black/10 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b-2 border-black/10 bg-black/[0.02]">
                <th className="px-4 py-3 font-semibold">Název</th>
                <th className="px-4 py-3 font-semibold w-24">Typ</th>
                <th className="px-4 py-3 font-semibold w-28">Status</th>
                <th className="px-4 py-3 font-semibold w-28">Datum</th>
                <th className="px-4 py-3 font-semibold w-32">Akce</th>
              </tr>
            </thead>
            <tbody>
              {filteredPosts.map(post => {
                const typeTag = post.tags?.find(t => ['kniha', 'video', 'blog', 'reel', 'hudba', 'článek'].includes(t))
                return (
                  <tr key={post.id} className="border-b border-black/5 hover:bg-black/[0.02]">
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground line-clamp-1">{post.title}</div>
                      {post.subtitle && <div className="text-xs text-foreground/50">{post.subtitle}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent font-semibold">
                        {typeTag || post.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                        post.status === 'published' ? 'bg-emerald-50 text-emerald-700' :
                        post.status === 'draft' ? 'bg-yellow-50 text-yellow-700' :
                        'bg-black/5 text-foreground/50'
                      }`}>
                        {post.status === 'published' ? 'Publikováno' : post.status === 'draft' ? 'Koncept' : 'Archiv'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-foreground/50">
                      {post.published_at
                        ? new Date(post.published_at).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'short' })
                        : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleToggleStatus(post)} title={post.status === 'published' ? 'Skrýt' : 'Publikovat'}
                          className="p-1.5 rounded-lg hover:bg-black/5 text-foreground/50 hover:text-foreground">
                          {post.status === 'published' ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                        <button onClick={() => setEditingPost(post)} title="Upravit"
                          className="p-1.5 rounded-lg hover:bg-black/5 text-foreground/50 hover:text-foreground">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => handleDelete(post.id)} title="Smazat"
                          className="p-1.5 rounded-lg hover:bg-red-50 text-foreground/50 hover:text-red-600">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {editingPost && (
        <EditPostModal post={editingPost} onClose={() => setEditingPost(null)} onSaved={() => { setEditingPost(null); loadPosts() }} />
      )}
    </div>
  )
}

// ── Edit Post Modal ──────────────────────────────────────────────────────────

function EditPostModal({ post, onClose, onSaved }: { post: CuratedPost; onClose: () => void; onSaved: () => void }) {
  const existingKeywordTag = post.tags?.find(t => t.startsWith('cover:'))
  const [title, setTitle] = useState(post.title)
  const [subtitle, setSubtitle] = useState(post.subtitle || '')
  const [body, setBody] = useState(post.body_markdown)
  const [coverUrl, setCoverUrl] = useState(post.cover_image_url || '')
  const [coverKeyword, setCoverKeyword] = useState(existingKeywordTag ? existingKeywordTag.slice(6) : '')
  const [tags, setTags] = useState(post.tags?.filter(t => !t.startsWith('cover:')).join(', ') || '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    const allTags = [
      ...tags.split(',').map(t => t.trim()).filter(Boolean),
      ...(coverKeyword.trim() ? [`cover:${coverKeyword.trim().toUpperCase()}`] : []),
    ]
    await fetch('/api/admin/curated-posts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: post.id, title, subtitle: subtitle || null,
        body_markdown: body, cover_image_url: coverUrl || null,
        tags: allTags,
      }),
    })
    setSaving(false)
    onSaved()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl border-2 border-black/10 max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">Upravit příspěvek</h3>
          <button onClick={onClose} className="p-1 hover:bg-black/5 rounded-lg"><X size={18} /></button>
        </div>
        <div className="space-y-3">
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Název"
            className="w-full px-4 py-2.5 border-2 border-black/10 rounded-xl text-sm focus:border-accent outline-none" />
          <input value={subtitle} onChange={e => setSubtitle(e.target.value)} placeholder="Autor / podtitulek"
            className="w-full px-4 py-2.5 border-2 border-black/10 rounded-xl text-sm focus:border-accent outline-none" />
          <input value={coverUrl} onChange={e => setCoverUrl(e.target.value)} placeholder="URL obrázku (volitelné)"
            className="w-full px-4 py-2.5 border-2 border-black/10 rounded-xl text-sm focus:border-accent outline-none" />
          <input value={coverKeyword} onChange={e => setCoverKeyword(e.target.value)} placeholder="Cover keyword — MBTI, NÁVYKY... (místo obrázku)"
            className="w-full px-4 py-2.5 border-2 border-black/10 rounded-xl text-sm focus:border-accent outline-none uppercase tracking-wider font-mono" />
          <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Obsah (Markdown)"
            className="w-full px-4 py-2.5 border-2 border-black/10 rounded-xl text-sm focus:border-accent outline-none min-h-[200px] font-mono" />
          <input value={tags} onChange={e => setTags(e.target.value)} placeholder="Tagy (čárkou oddělené)"
            className="w-full px-4 py-2.5 border-2 border-black/10 rounded-xl text-sm focus:border-accent outline-none" />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-black/10 text-sm font-semibold">Zrušit</button>
          <button onClick={handleSave} disabled={saving}
            className="px-4 py-2 rounded-xl bg-accent text-white text-sm font-semibold hover:bg-accent-hover disabled:opacity-50">
            {saving ? 'Ukládám...' : 'Uložit'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Pipeline Tab ─────────────────────────────────────────────────────────────

function PipelineTab() {
  const [briefs, setBriefs] = useState<PipelineBrief[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('inbox')
  const [minRelevance, setMinRelevance] = useState(5)
  const [triggering, setTriggering] = useState<string | null>(null)
  const [selectedBrief, setSelectedBrief] = useState<PipelineBrief | null>(null)

  const loadBriefs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ status: statusFilter, minRelevance: String(minRelevance), limit: '50' })
      const res = await fetch(`/api/admin/pipeline/articles?${params}`)
      const data = await res.json()
      setBriefs(data.articles || [])
    } catch (e) { console.error(e) }
    setLoading(false)
  }, [statusFilter, minRelevance])

  useEffect(() => { loadBriefs() }, [loadBriefs])

  const handleTrigger = async (step: string) => {
    setTriggering(step)
    try {
      await fetch('/api/admin/pipeline/trigger', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step }),
      })
      if (step === 'process') setTimeout(loadBriefs, 2000)
    } catch (e) { console.error(e) }
    setTriggering(null)
  }

  const handleStatusChange = async (briefId: number, status: string) => {
    await fetch('/api/admin/pipeline/articles/status', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ briefId, status }),
    })
    loadBriefs()
  }

  const handleDelete = async (briefId: number) => {
    await fetch('/api/admin/pipeline/articles', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ briefId }),
    })
    loadBriefs()
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 flex-wrap shrink-0 mb-4">
        {['inbox', 'saved'].map(s => (
          <button key={s} onClick={() => { setStatusFilter(s); setSelectedBrief(null) }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
              statusFilter === s ? 'bg-accent text-white' : 'bg-black/5 text-foreground/60 hover:bg-black/10'
            }`}>
            {s === 'inbox' ? 'Inbox' : 'Uložené'}
          </button>
        ))}
        <select value={minRelevance} onChange={e => setMinRelevance(Number(e.target.value))}
          className="px-3 py-1.5 border-2 border-black/10 rounded-lg text-xs font-semibold outline-none">
          {[1, 3, 5, 7, 8, 9].map(n => <option key={n} value={n}>Relevance ≥ {n}</option>)}
        </select>
        <div className="ml-auto flex gap-2">
          <button onClick={() => handleTrigger('fetch')} disabled={!!triggering}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/5 text-xs font-semibold hover:bg-black/10 disabled:opacity-50">
            {triggering === 'fetch' ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />} Fetch RSS
          </button>
          <button onClick={() => handleTrigger('process')} disabled={!!triggering}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/5 text-xs font-semibold hover:bg-black/10 disabled:opacity-50">
            {triggering === 'process' ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />} Zpracovat AI
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-foreground/30" size={24} /></div>
      ) : briefs.length === 0 ? (
        <p className="text-center text-foreground/40 py-12">Žádné články v tomto filtru.</p>
      ) : statusFilter === 'inbox' ? (
        /* Inbox: jednoduché karty */
        <div className="space-y-3 flex-1 min-h-0 overflow-y-auto">
          {briefs.map(brief => (
            <div key={brief.brief_id} className="bg-white rounded-xl border-2 border-black/10 p-4">
              <div className="flex items-center gap-4">
                <p className="flex-1 text-base text-foreground leading-relaxed">{brief.summary_cs}</p>
                <div className="flex flex-col gap-1 shrink-0">
                  <button onClick={() => handleStatusChange(brief.brief_id, 'saved')}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-black/10 text-xs font-semibold hover:bg-black/5">
                    <Bookmark size={12} /> Uložit
                  </button>
                  <button onClick={() => handleDelete(brief.brief_id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-200 text-xs font-semibold text-red-400 hover:bg-red-50">
                    <Trash2 size={12} /> Odstranit
                  </button>
                  <a href={brief.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-black/10 text-xs font-semibold text-foreground/50 hover:bg-black/5">
                    <ExternalLink size={12} /> Zdroj
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Uložené: split-panel, plná výška */
        <div className="flex gap-6 flex-1 min-h-0 overflow-hidden">
          {/* Left: list */}
          <div className="w-80 shrink-0 flex flex-col min-h-0 overflow-hidden">
            <p className="text-xs text-foreground/40 mb-2 shrink-0">{briefs.length} článků</p>
            <div className="space-y-1 overflow-y-auto flex-1 min-h-0 pr-1">
              {briefs.map(brief => (
                <button key={brief.brief_id} onClick={() => setSelectedBrief(brief)}
                  className={`w-full text-left p-3 rounded-xl transition-colors ${
                    selectedBrief?.brief_id === brief.brief_id
                      ? 'bg-accent/10 border-2 border-accent'
                      : 'bg-white border-2 border-black/10 hover:border-accent/30'
                  }`}>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-accent/10 text-accent">
                      {CATEGORY_EMOJI[brief.primary_category] || ''} {brief.primary_category}
                    </span>
                    <span className={`text-[10px] font-bold px-1 py-0.5 rounded ${
                      brief.relevance_score >= 8 ? 'bg-emerald-100 text-emerald-700' :
                      brief.relevance_score >= 6 ? 'bg-yellow-100 text-yellow-700' : 'bg-black/5 text-foreground/50'
                    }`}>{brief.relevance_score}/10</span>
                  </div>
                  <p className="text-sm font-semibold text-foreground line-clamp-2">{brief.title}</p>
                  <p className="text-xs text-foreground/40 mt-0.5 line-clamp-1">{brief.source_name}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Right: article detail + iframe */}
          <div className="flex-1 min-w-0 flex flex-col">
            {!selectedBrief ? (
              <div className="flex items-center justify-center flex-1 border-2 border-dashed border-black/10 rounded-2xl">
                <div className="text-center">
                  <BookOpen size={28} className="mx-auto text-foreground/20 mb-2" />
                  <p className="text-sm text-foreground/40">Vyber článek vlevo</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col flex-1 min-h-0">
                {/* Header bar */}
                <div className="bg-white rounded-t-2xl border-2 border-black/10 border-b-0 px-5 py-3 flex items-center gap-3 flex-wrap shrink-0">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-accent/10 text-accent">
                    {CATEGORY_EMOJI[selectedBrief.primary_category] || ''} {selectedBrief.primary_category}
                  </span>
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                    selectedBrief.relevance_score >= 8 ? 'bg-emerald-100 text-emerald-700' :
                    selectedBrief.relevance_score >= 6 ? 'bg-yellow-100 text-yellow-700' : 'bg-black/5 text-foreground/50'
                  }`}>{selectedBrief.relevance_score}/10</span>
                  <h3 className="text-sm font-bold text-foreground truncate flex-1">{selectedBrief.title}</h3>
                  <a href={selectedBrief.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-black/10 text-xs font-semibold hover:bg-black/5">
                    <ExternalLink size={12} /> Nová karta
                  </a>
                  <button onClick={() => { handleDelete(selectedBrief.brief_id); setSelectedBrief(null) }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-200 text-xs font-semibold text-red-400 hover:bg-red-50">
                    <Trash2 size={12} /> Odstranit
                  </button>
                </div>
                {/* Article iframe */}
                <div className="flex-1 min-h-0 border-2 border-black/10 border-t rounded-b-2xl overflow-hidden bg-white">
                  <iframe
                    key={selectedBrief.brief_id}
                    src={selectedBrief.url}
                    title={selectedBrief.title}
                    className="w-full h-full border-0"
                    sandbox="allow-scripts allow-same-origin allow-popups"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── New Post Tab ─────────────────────────────────────────────────────────────

function NewPostTab({ onCreated }: { onCreated: () => void }) {
  const [postType, setPostType] = useState('tip')
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [body, setBody] = useState('')
  const [url, setUrl] = useState('')
  const [coverUrl, setCoverUrl] = useState('')
  const [coverKeyword, setCoverKeyword] = useState('')
  const [tags, setTags] = useState('')
  const [saving, setSaving] = useState(false)

  // News type: pick from saved pipeline briefs
  const [savedBriefs, setSavedBriefs] = useState<PipelineBrief[]>([])
  const [loadingBriefs, setLoadingBriefs] = useState(false)
  const [selectedBriefId, setSelectedBriefId] = useState<number | null>(null)

  const isInspirationType = ['kniha', 'video', 'reel', 'hudba'].includes(postType)
  const isNews = postType === 'news'

  // Load saved briefs when news type selected
  useEffect(() => {
    if (!isNews) return
    setLoadingBriefs(true)
    fetch('/api/admin/pipeline/articles?status=saved&minRelevance=1&limit=50')
      .then(r => r.json())
      .then(d => setSavedBriefs(d.articles || []))
      .catch(console.error)
      .finally(() => setLoadingBriefs(false))
  }, [isNews])

  const [rewriting, setRewriting] = useState(false)

  const handleSelectBrief = async (brief: PipelineBrief) => {
    setSelectedBriefId(brief.brief_id)
    setTitle(brief.title)
    setSubtitle(brief.source_name)
    setUrl(brief.url)
    setTags(brief.tags?.join(', ') || '')
    setCoverUrl('')

    // Rewrite body in žiju.life tone via AI
    const rawBody = brief.summary_cs + (brief.key_insight ? `\n\n💡 ${brief.key_insight}` : '')
    setBody(rawBody)
    setRewriting(true)
    try {
      const res = await fetch('/api/admin/rewrite-tone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: rawBody, title: brief.title }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.text) setBody(data.text)
      }
    } catch { /* fallback to raw */ }
    setRewriting(false)

    // Fetch OG image
    try {
      const res = await fetch(`/api/admin/og-image?url=${encodeURIComponent(brief.url)}`)
      if (res.ok) {
        const data = await res.json()
        if (data.image) setCoverUrl(data.image)
      }
    } catch { /* ignore */ }
  }

  const handleSave = async (status: 'draft' | 'published') => {
    if (!title.trim()) { alert('Vyplň název'); return }
    setSaving(true)

    let fullBody = body
    if ((isInspirationType || isNews) && url) {
      const linkLabel = postType === 'kniha' ? '📚 Kniha' : postType === 'video' ? '🎬 Video' :
                        postType === 'hudba' ? '🎵 Poslechnout' : postType === 'reel' ? '📱 Reel' :
                        isNews ? '🔗 Zdroj' : '🔗 Odkaz'
      fullBody = [subtitle ? `**Zdroj:** ${subtitle}` : '', body, `[${linkLabel}](${url})`].filter(Boolean).join('\n\n')
    }

    const allTags = [
      ...tags.split(',').map(t => t.trim()).filter(Boolean),
      ...(isInspirationType ? [postType, 'migrated-inspiration'] : []),
      ...(isNews ? ['news'] : []),
      ...(coverKeyword.trim() ? [`cover:${coverKeyword.trim().toUpperCase()}`] : []),
    ]

    try {
      await fetch('/api/admin/curated-posts/save', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'tip', title,
          subtitle: (isInspirationType || isNews) ? subtitle : (subtitle || null),
          body_markdown: fullBody || title,
          cover_image_url: coverUrl || null,
          pipeline_brief_ids: selectedBriefId ? [selectedBriefId] : [],
          tags: allTags, categories: [], status,
        }),
      })
      // Mark pipeline brief as published
      if (selectedBriefId && status === 'published') {
        await fetch('/api/admin/pipeline/articles/status', {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ briefId: selectedBriefId, status: 'published' }),
        })
      }
      onCreated()
    } catch (e) { console.error(e); alert('Chyba při ukládání') }
    setSaving(false)
  }

  return (
    <div className="max-w-2xl space-y-5">
      {/* Type selector */}
      <div>
        <label className="block text-sm font-semibold text-foreground mb-2">Typ příspěvku</label>
        <div className="flex gap-2 flex-wrap">
          {TYPE_OPTIONS.map(opt => {
            const Icon = opt.icon
            return (
              <button key={opt.value} onClick={() => { setPostType(opt.value); setSelectedBriefId(null); setTitle(''); setBody(''); setUrl(''); setSubtitle(''); setTags('') }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                  postType === opt.value ? 'bg-accent text-white' : 'bg-white border-2 border-black/10 hover:border-accent/30'
                }`}>
                <Icon size={14} /> {opt.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* News: pipeline brief picker */}
      {isNews && (
        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">Vyber článek z pipeline</label>
          {loadingBriefs ? (
            <div className="flex justify-center py-4"><Loader2 className="animate-spin text-foreground/30" size={20} /></div>
          ) : savedBriefs.length === 0 ? (
            <p className="text-sm text-foreground/40 py-4">Žádné uložené články v pipeline. Nejdřív ulož články v Pipeline Inbox.</p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto border-2 border-black/10 rounded-xl p-2">
              {savedBriefs.map(b => (
                <button key={b.brief_id} onClick={() => handleSelectBrief(b)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedBriefId === b.brief_id ? 'bg-accent/10 border-2 border-accent' : 'hover:bg-black/5 border-2 border-transparent'
                  }`}>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-accent/10 text-accent">
                      {CATEGORY_EMOJI[b.primary_category] || ''} {b.primary_category}
                    </span>
                    <span className="text-[10px] font-bold text-foreground/40">{b.relevance_score}/10</span>
                    <span className="text-[10px] text-foreground/40">{b.source_name}</span>
                  </div>
                  <p className="text-sm font-semibold text-foreground">{b.title}</p>
                  <p className="text-xs text-foreground/50 line-clamp-1 mt-0.5">{b.summary_cs}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Title */}
      <div>
        <label className="block text-sm font-semibold text-foreground mb-1">Název</label>
        <input value={title} onChange={e => setTitle(e.target.value)}
          placeholder={isInspirationType ? 'Název knihy / videa / reelska...' : isNews ? 'Nadpis příspěvku (předvyplněno z pipeline)' : 'Nadpis příspěvku'}
          className="w-full px-4 py-2.5 border-2 border-black/10 rounded-xl text-sm focus:border-accent outline-none" />
      </div>

      <div>
        <label className="block text-sm font-semibold text-foreground mb-1">{isInspirationType ? 'Autor' : isNews ? 'Zdroj' : 'Podtitulek (volitelné)'}</label>
        <input value={subtitle} onChange={e => setSubtitle(e.target.value)}
          placeholder={isInspirationType ? 'Jméno autora' : isNews ? 'Název zdroje' : 'Krátký podtitulek'}
          className="w-full px-4 py-2.5 border-2 border-black/10 rounded-xl text-sm focus:border-accent outline-none" />
      </div>

      {(isInspirationType || isNews || postType === 'tip') && (
        <div>
          <label className="block text-sm font-semibold text-foreground mb-1">URL {isInspirationType ? '(odkaz na zdroj)' : '(volitelné)'}</label>
          <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..."
            className="w-full px-4 py-2.5 border-2 border-black/10 rounded-xl text-sm focus:border-accent outline-none" />
        </div>
      )}

      <div>
        <label className="block text-sm font-semibold text-foreground mb-1">Obrázek (URL)</label>
        <input value={coverUrl} onChange={e => setCoverUrl(e.target.value)} placeholder="https://... (obálka knihy, thumbnail...)"
          className="w-full px-4 py-2.5 border-2 border-black/10 rounded-xl text-sm focus:border-accent outline-none" />
        {coverUrl && <img src={coverUrl} alt="Preview" className="mt-2 h-24 rounded-lg object-contain border border-black/10" />}
      </div>

      {!isInspirationType && !coverUrl && (
        <div>
          <label className="block text-sm font-semibold text-foreground mb-1">Cover keyword (místo obrázku)</label>
          <input value={coverKeyword} onChange={e => setCoverKeyword(e.target.value)} placeholder="MBTI, NÁVYKY, SPÁNEK..."
            className="w-full px-4 py-2.5 border-2 border-black/10 rounded-xl text-sm focus:border-accent outline-none uppercase tracking-wider font-mono" />
          <p className="text-xs text-foreground/40 mt-1">Velké slovo zobrazené jako grafika na kartě. Jen pro články bez obrázku.</p>
        </div>
      )}

      <div>
        <div className="flex items-center gap-2 mb-1">
          <label className="text-sm font-semibold text-foreground">{isInspirationType ? 'Popis / poznámka' : 'Obsah (Markdown)'}</label>
          {rewriting && <span className="flex items-center gap-1 text-xs text-accent"><Loader2 size={12} className="animate-spin" /> Přepisuji do stylu žiju.life...</span>}
        </div>
        <textarea value={body} onChange={e => setBody(e.target.value)}
          placeholder={isInspirationType ? 'Proč doporučuji, co mě zaujalo...' : 'Text příspěvku v Markdownu...'}
          className="w-full px-4 py-2.5 border-2 border-black/10 rounded-xl text-sm focus:border-accent outline-none min-h-[120px] font-mono" />
      </div>

      <div>
        <label className="block text-sm font-semibold text-foreground mb-1">Tagy (volitelné)</label>
        <input value={tags} onChange={e => setTags(e.target.value)} placeholder="spánek, produktivita, návyky..."
          className="w-full px-4 py-2.5 border-2 border-black/10 rounded-xl text-sm focus:border-accent outline-none" />
      </div>

      <div className="flex gap-3 pt-2">
        <button onClick={() => handleSave('draft')} disabled={saving}
          className="px-5 py-2.5 rounded-xl border-2 border-black/10 text-sm font-semibold hover:bg-black/5 disabled:opacity-50">
          Uložit jako koncept
        </button>
        <button onClick={() => handleSave('published')} disabled={saving}
          className="px-5 py-2.5 rounded-xl bg-accent text-white text-sm font-semibold hover:bg-accent-hover disabled:opacity-50">
          {saving ? 'Ukládám...' : 'Publikovat'}
        </button>
      </div>
    </div>
  )
}

// ── Drafts Tab (Rozpracované) ────────────────────────────────────────────────

function DraftsTab() {
  const [drafts, setDrafts] = useState<CuratedPost[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDraft, setSelectedDraft] = useState<CuratedPost | null>(null)

  // Edit form state
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [body, setBody] = useState('')
  const [coverUrl, setCoverUrl] = useState('')
  const [coverKeyword, setCoverKeyword] = useState('')
  const [tags, setTags] = useState('')
  const [saving, setSaving] = useState(false)

  const loadDrafts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/curated-posts?status=draft&limit=100')
      const data = await res.json()
      setDrafts(data.posts || [])
    } catch (e) { console.error(e) }
    setLoading(false)
  }, [])

  useEffect(() => { loadDrafts() }, [loadDrafts])

  const selectDraft = (post: CuratedPost) => {
    setSelectedDraft(post)
    const existingKeywordTag = post.tags?.find(t => t.startsWith('cover:'))
    setTitle(post.title)
    setSubtitle(post.subtitle || '')
    setBody(post.body_markdown)
    setCoverUrl(post.cover_image_url || '')
    setCoverKeyword(existingKeywordTag ? existingKeywordTag.slice(6) : '')
    setTags(post.tags?.filter(t => !t.startsWith('cover:')).join(', ') || '')
  }

  const handleSave = async (status: 'draft' | 'published') => {
    if (!selectedDraft) return
    setSaving(true)
    const allTags = [
      ...tags.split(',').map(t => t.trim()).filter(Boolean),
      ...(coverKeyword.trim() ? [`cover:${coverKeyword.trim().toUpperCase()}`] : []),
    ]
    await fetch('/api/admin/curated-posts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: selectedDraft.id, title, subtitle: subtitle || null,
        body_markdown: body, cover_image_url: coverUrl || null,
        tags: allTags, status,
      }),
    })
    setSaving(false)
    if (status === 'published') setSelectedDraft(null)
    loadDrafts()
  }

  const handleDelete = async () => {
    if (!selectedDraft || !confirm('Smazat rozpracovaný příspěvek?')) return
    await fetch(`/api/admin/curated-posts?id=${selectedDraft.id}`, { method: 'DELETE' })
    setSelectedDraft(null)
    loadDrafts()
  }

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-foreground/30" size={24} /></div>

  return (
    <div className="flex gap-6 h-full">
      {/* Left: drafts list */}
      <div className="w-72 shrink-0 flex flex-col min-h-0">
        <p className="text-xs text-foreground/40 mb-2 shrink-0">{drafts.length} konceptů</p>
        {drafts.length === 0 ? (
          <p className="text-sm text-foreground/40 py-8 text-center">Žádné rozpracované příspěvky.</p>
        ) : (
          <div className="space-y-1 overflow-y-auto flex-1 min-h-0 pr-1">
            {drafts.map(d => (
              <button key={d.id} onClick={() => selectDraft(d)}
                className={`w-full text-left p-3 rounded-xl transition-colors ${
                  selectedDraft?.id === d.id
                    ? 'bg-accent/10 border-2 border-accent'
                    : 'bg-white border-2 border-black/10 hover:border-accent/30'
                }`}>
                <p className="text-sm font-semibold text-foreground line-clamp-2">{d.title}</p>
                {d.subtitle && <p className="text-xs text-foreground/40 mt-0.5 line-clamp-1">{d.subtitle}</p>}
                <p className="text-[10px] text-foreground/30 mt-1">
                  {new Date(d.created_at).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'short' })}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right: edit form */}
      <div className="flex-1 min-w-0 overflow-y-auto">
        {!selectedDraft ? (
          <div className="flex items-center justify-center h-full border-2 border-dashed border-black/10 rounded-2xl">
            <div className="text-center">
              <Edit2 size={28} className="mx-auto text-foreground/20 mb-2" />
              <p className="text-sm text-foreground/40">Vyber rozpracovaný příspěvek vlevo</p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border-2 border-black/10 p-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1">Název</label>
              <input value={title} onChange={e => setTitle(e.target.value)}
                className="w-full px-4 py-2.5 border-2 border-black/10 rounded-xl text-sm focus:border-accent outline-none" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1">Podtitulek / zdroj</label>
              <input value={subtitle} onChange={e => setSubtitle(e.target.value)}
                className="w-full px-4 py-2.5 border-2 border-black/10 rounded-xl text-sm focus:border-accent outline-none" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1">Obrázek (URL)</label>
              <input value={coverUrl} onChange={e => setCoverUrl(e.target.value)} placeholder="https://..."
                className="w-full px-4 py-2.5 border-2 border-black/10 rounded-xl text-sm focus:border-accent outline-none" />
              {coverUrl && <img src={coverUrl} alt="Preview" className="mt-2 h-24 rounded-lg object-contain border border-black/10" />}
            </div>
            {!coverUrl && (
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1">Cover keyword (místo obrázku)</label>
                <input value={coverKeyword} onChange={e => setCoverKeyword(e.target.value)} placeholder="MBTI, NÁVYKY..."
                  className="w-full px-4 py-2.5 border-2 border-black/10 rounded-xl text-sm focus:border-accent outline-none uppercase tracking-wider font-mono" />
              </div>
            )}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1">Obsah (Markdown)</label>
              <textarea value={body} onChange={e => setBody(e.target.value)}
                className="w-full px-4 py-2.5 border-2 border-black/10 rounded-xl text-sm focus:border-accent outline-none min-h-[200px] font-mono" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1">Tagy</label>
              <input value={tags} onChange={e => setTags(e.target.value)} placeholder="spánek, produktivita..."
                className="w-full px-4 py-2.5 border-2 border-black/10 rounded-xl text-sm focus:border-accent outline-none" />
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button onClick={() => handleSave('draft')} disabled={saving}
                className="px-5 py-2.5 rounded-xl border-2 border-black/10 text-sm font-semibold hover:bg-black/5 disabled:opacity-50">
                Uložit koncept
              </button>
              <button onClick={() => handleSave('published')} disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-accent text-white text-sm font-semibold hover:bg-accent-hover disabled:opacity-50">
                {saving ? 'Ukládám...' : 'Publikovat'}
              </button>
              <button onClick={handleDelete}
                className="ml-auto p-2 rounded-lg hover:bg-red-50 text-foreground/40 hover:text-red-600">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Digest Tab ───────────────────────────────────────────────────────────────

function DigestTab() {
  const [recentPosts, setRecentPosts] = useState<CuratedPost[]>([])
  const [savedBriefs, setSavedBriefs] = useState<PipelineBrief[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPostIds, setSelectedPostIds] = useState<Set<string>>(new Set())
  const [selectedBriefIds, setSelectedBriefIds] = useState<Set<number>>(new Set())
  const [personalNote, setPersonalNote] = useState('')
  const [generating, setGenerating] = useState(false)
  const [generatedTitle, setGeneratedTitle] = useState('')
  const [generatedBody, setGeneratedBody] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/curated-posts?status=published&limit=20').then(r => r.json()),
      fetch('/api/admin/pipeline/articles?status=saved&minRelevance=1&limit=30').then(r => r.json()),
    ]).then(([postsData, briefsData]) => {
      // Filter posts from last 7 days
      const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7)
      const recent = (postsData.posts || []).filter((p: CuratedPost) =>
        p.published_at && new Date(p.published_at) >= weekAgo
      )
      setRecentPosts(recent)
      setSavedBriefs(briefsData.articles || [])
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  const togglePost = (id: string) => {
    setSelectedPostIds(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next })
  }
  const toggleBrief = (id: number) => {
    setSelectedBriefIds(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next })
  }

  const totalSelected = selectedPostIds.size + selectedBriefIds.size

  const handleGenerate = async () => {
    if (totalSelected === 0) { alert('Vyber alespoň jednu položku'); return }
    setGenerating(true)
    try {
      const res = await fetch('/api/admin/curated-posts/generate-digest', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          briefIds: Array.from(selectedBriefIds),
          extraItems: recentPosts
            .filter(p => selectedPostIds.has(p.id))
            .map(p => ({ title: p.title, description: p.body_markdown.substring(0, 300) })),
          personalNote,
        }),
      })
      const data = await res.json()
      if (data.title) setGeneratedTitle(data.title)
      if (data.body_markdown) setGeneratedBody(data.body_markdown)
    } catch (e) { console.error(e); alert('Chyba při generování') }
    setGenerating(false)
  }

  const handleSave = async (status: 'draft' | 'published') => {
    if (!generatedTitle || !generatedBody) { alert('Nejdřív vygeneruj digest'); return }
    setSaving(true)
    try {
      const now = new Date()
      const weekNumber = Math.ceil((((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / 86400000) + new Date(now.getFullYear(), 0, 1).getDay() + 1) / 7)
      await fetch('/api/admin/curated-posts/save', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'digest', title: generatedTitle,
          body_markdown: generatedBody,
          pipeline_brief_ids: Array.from(selectedBriefIds),
          tags: ['digest', 'týdenní-přehled'],
          categories: [], status,
          week_number: weekNumber, week_year: now.getFullYear(),
        }),
      })
      alert(status === 'published' ? 'Digest publikován!' : 'Digest uložen jako koncept.')
      setGeneratedTitle(''); setGeneratedBody('')
      setSelectedPostIds(new Set()); setSelectedBriefIds(new Set())
    } catch (e) { console.error(e); alert('Chyba') }
    setSaving(false)
  }

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-foreground/30" size={24} /></div>

  return (
    <div className="space-y-6">
      <p className="text-sm text-foreground/60">
        Vyber příspěvky z tohoto týdne a uložené články z pipeline. Claude vygeneruje týdenní přehled.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: items to pick */}
        <div className="space-y-4">
          {/* Recent posts */}
          <div>
            <h3 className="text-sm font-bold text-foreground mb-2">Publikované tento týden ({recentPosts.length})</h3>
            {recentPosts.length === 0 ? (
              <p className="text-xs text-foreground/40 py-3">Žádné příspěvky z tohoto týdne.</p>
            ) : (
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {recentPosts.map(p => (
                  <label key={p.id} className={`flex items-start gap-2 p-2 rounded-lg cursor-pointer ${selectedPostIds.has(p.id) ? 'bg-accent/10' : 'hover:bg-black/5'}`}>
                    <input type="checkbox" checked={selectedPostIds.has(p.id)} onChange={() => togglePost(p.id)}
                      className="mt-0.5 rounded border-black/20 text-accent" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{p.title}</p>
                      <p className="text-[10px] text-foreground/40">{p.tags?.find(t => ['kniha', 'video', 'reel', 'news', 'tip'].includes(t)) || p.type}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Saved pipeline briefs */}
          <div>
            <h3 className="text-sm font-bold text-foreground mb-2">Uložené z pipeline ({savedBriefs.length})</h3>
            {savedBriefs.length === 0 ? (
              <p className="text-xs text-foreground/40 py-3">Žádné uložené články.</p>
            ) : (
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {savedBriefs.map(b => (
                  <label key={b.brief_id} className={`flex items-start gap-2 p-2 rounded-lg cursor-pointer ${selectedBriefIds.has(b.brief_id) ? 'bg-accent/10' : 'hover:bg-black/5'}`}>
                    <input type="checkbox" checked={selectedBriefIds.has(b.brief_id)} onChange={() => toggleBrief(b.brief_id)}
                      className="mt-0.5 rounded border-black/20 text-accent" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{b.title}</p>
                      <p className="text-[10px] text-foreground/40">{CATEGORY_EMOJI[b.primary_category] || ''} {b.source_name} · {b.relevance_score}/10</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Personal note */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1">Osobní poznámka (volitelné)</label>
            <textarea value={personalNote} onChange={e => setPersonalNote(e.target.value)}
              placeholder="Co tě tento týden zaujalo? Kontext pro Claude..."
              className="w-full px-3 py-2 border-2 border-black/10 rounded-xl text-sm focus:border-accent outline-none min-h-[80px]" />
          </div>

          <button onClick={handleGenerate} disabled={generating || totalSelected === 0}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-accent text-white font-semibold hover:bg-accent-hover disabled:opacity-50">
            {generating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            Generovat digest ({totalSelected} položek)
          </button>
        </div>

        {/* Right: generated output */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-foreground">Vygenerovaný digest</h3>
          {!generatedTitle && !generatedBody ? (
            <div className="border-2 border-dashed border-black/10 rounded-xl p-8 text-center">
              <Sparkles size={28} className="mx-auto text-foreground/20 mb-2" />
              <p className="text-sm text-foreground/40">Vyber položky vlevo a klikni &quot;Generovat digest&quot;</p>
            </div>
          ) : (
            <>
              <input value={generatedTitle} onChange={e => setGeneratedTitle(e.target.value)}
                className="w-full px-4 py-2.5 border-2 border-black/10 rounded-xl text-sm font-bold focus:border-accent outline-none" />
              <textarea value={generatedBody} onChange={e => setGeneratedBody(e.target.value)}
                className="w-full px-4 py-2.5 border-2 border-black/10 rounded-xl text-sm focus:border-accent outline-none min-h-[300px] font-mono" />
              <div className="flex gap-2">
                <button onClick={() => handleSave('draft')} disabled={saving}
                  className="px-4 py-2 rounded-xl border-2 border-black/10 text-sm font-semibold hover:bg-black/5 disabled:opacity-50">
                  Uložit koncept
                </button>
                <button onClick={() => handleSave('published')} disabled={saving}
                  className="px-4 py-2 rounded-xl bg-accent text-white text-sm font-semibold hover:bg-accent-hover disabled:opacity-50">
                  {saving ? 'Ukládám...' : 'Publikovat'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Sources Tab ──────────────────────────────────────────────────────────────

function SourcesTab() {
  const [sources, setSources] = useState<RssSource[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [newUrl, setNewUrl] = useState('')
  const [newCategory, setNewCategory] = useState('psychology')
  const [newPriority, setNewPriority] = useState('medium')

  const loadSources = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/pipeline/sources')
      const data = await res.json()
      setSources(data.sources || [])
    } catch (e) { console.error(e) }
    setLoading(false)
  }, [])

  useEffect(() => { loadSources() }, [loadSources])

  const handleToggle = async (id: number, active: boolean) => {
    await fetch('/api/admin/pipeline/sources', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_active: active }),
    })
    loadSources()
  }

  const handleAdd = async () => {
    if (!newName || !newUrl) return
    await fetch('/api/admin/pipeline/sources', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName, url: newUrl, type: 'rss', category: newCategory, priority: newPriority }),
    })
    setNewName(''); setNewUrl(''); setShowAdd(false)
    loadSources()
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-sm text-foreground/50">{sources.length} zdrojů</span>
        <button onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-white text-xs font-semibold hover:bg-accent-hover">
          <Plus size={14} /> Přidat zdroj
        </button>
      </div>

      {showAdd && (
        <div className="bg-white rounded-xl border-2 border-black/10 p-4 space-y-3">
          <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Název zdroje"
            className="w-full px-3 py-2 border-2 border-black/10 rounded-lg text-sm outline-none focus:border-accent" />
          <input value={newUrl} onChange={e => setNewUrl(e.target.value)} placeholder="RSS URL"
            className="w-full px-3 py-2 border-2 border-black/10 rounded-lg text-sm outline-none focus:border-accent" />
          <div className="flex gap-2">
            <select value={newCategory} onChange={e => setNewCategory(e.target.value)}
              className="px-3 py-2 border-2 border-black/10 rounded-lg text-sm outline-none">
              {Object.keys(CATEGORY_EMOJI).map(c => <option key={c} value={c}>{CATEGORY_EMOJI[c]} {c}</option>)}
            </select>
            <select value={newPriority} onChange={e => setNewPriority(e.target.value)}
              className="px-3 py-2 border-2 border-black/10 rounded-lg text-sm outline-none">
              <option value="high">Vysoká</option>
              <option value="medium">Střední</option>
              <option value="low">Nízká</option>
            </select>
            <button onClick={handleAdd} className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-semibold hover:bg-accent-hover">Přidat</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-foreground/30" size={24} /></div>
      ) : (
        <div className="bg-white rounded-2xl border-2 border-black/10 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b-2 border-black/10 bg-black/[0.02]">
                <th className="px-4 py-3 font-semibold">Název</th>
                <th className="px-4 py-3 font-semibold w-28">Kategorie</th>
                <th className="px-4 py-3 font-semibold w-24">Priorita</th>
                <th className="px-4 py-3 font-semibold w-24">Články</th>
                <th className="px-4 py-3 font-semibold w-20">Aktivní</th>
              </tr>
            </thead>
            <tbody>
              {sources.map(s => (
                <tr key={s.id} className="border-b border-black/5 hover:bg-black/[0.02]">
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground">{s.name}</div>
                    <div className="text-xs text-foreground/40 truncate max-w-[300px]">{s.url}</div>
                  </td>
                  <td className="px-4 py-3 text-xs">{CATEGORY_EMOJI[s.category] || ''} {s.category}</td>
                  <td className="px-4 py-3 text-xs">{s.priority}</td>
                  <td className="px-4 py-3 text-xs">{s.article_count || '—'}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleToggle(s.id, !s.is_active)}
                      className={`w-10 h-6 rounded-full transition-colors ${s.is_active ? 'bg-accent' : 'bg-black/10'}`}>
                      <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${s.is_active ? 'translate-x-5' : 'translate-x-1'}`} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

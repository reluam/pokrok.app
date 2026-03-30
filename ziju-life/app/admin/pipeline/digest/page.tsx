'use client'

import { useEffect, useState, useCallback } from 'react'
import { CATEGORY_CONFIG, relevanceBadgeClass } from '@/components/pipeline/constants'
import { Loader2, Sparkles, Save, Send, Plus, Trash2, Eye, EyeOff } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface SavedArticle {
  brief_id: number
  title: string
  url: string
  summary_cs: string
  key_insight: string
  relevance_score: number
  primary_category: string
  source_name: string
  tags: string[]
}

interface ExtraItem {
  id: string
  title: string
  description: string
}

export default function DigestPage() {
  // Left column: available items
  const [savedArticles, setSavedArticles] = useState<SavedArticle[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)

  // Extra items (books, podcasts, etc.)
  const [extraItems, setExtraItems] = useState<ExtraItem[]>([])
  const [personalNote, setPersonalNote] = useState('')

  // Generated content
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [bodyMarkdown, setBodyMarkdown] = useState('')
  const [videoScript, setVideoScript] = useState('')
  const [generatedMeta, setGeneratedMeta] = useState<{ pipeline_brief_ids: number[]; categories: string[]; tags: string[]; week_number: number; week_year: number } | null>(null)

  // UI state
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [showVideoScript, setShowVideoScript] = useState(false)

  const loadSaved = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/pipeline/articles?status=saved&limit=50')
      const data = await res.json()
      setSavedArticles(data.articles || [])
    } catch (e) { console.error(e) }
    setLoading(false)
  }, [])

  useEffect(() => { loadSaved() }, [loadSaved])

  function toggleSelect(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function addExtraItem() {
    setExtraItems((prev) => [...prev, { id: Date.now().toString(), title: '', description: '' }])
  }

  function updateExtraItem(id: string, field: 'title' | 'description', value: string) {
    setExtraItems((prev) => prev.map((item) => item.id === id ? { ...item, [field]: value } : item))
  }

  function removeExtraItem(id: string) {
    setExtraItems((prev) => prev.filter((item) => item.id !== id))
  }

  async function handleGenerate() {
    if (selectedIds.size === 0) return
    setGenerating(true)
    try {
      const res = await fetch('/api/admin/curated-posts/generate-digest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          briefIds: Array.from(selectedIds),
          extraItems: extraItems.filter((i) => i.title.trim()),
          personalNote: personalNote.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (data.error) {
        alert('Generování selhalo: ' + data.details)
      } else {
        setTitle(data.title)
        setSubtitle(data.subtitle || '')
        setBodyMarkdown(data.body_markdown)
        setVideoScript(data.video_script || '')
        setGeneratedMeta({
          pipeline_brief_ids: data.pipeline_brief_ids,
          categories: data.categories,
          tags: data.tags,
          week_number: data.week_number,
          week_year: data.week_year,
        })
      }
    } catch (e) {
      console.error(e)
      alert('Generování selhalo')
    }
    setGenerating(false)
  }

  async function handleSave(publish: boolean) {
    if (!title || !bodyMarkdown) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/curated-posts/route', { method: 'GET' }) // dummy, we use createCuratedPost via a dedicated endpoint
      // Actually use the admin curated-posts API
      const body = {
        type: 'digest',
        title,
        subtitle: subtitle || undefined,
        body_markdown: bodyMarkdown,
        video_script: videoScript || undefined,
        pipeline_brief_ids: generatedMeta?.pipeline_brief_ids || Array.from(selectedIds),
        categories: generatedMeta?.categories || [],
        tags: generatedMeta?.tags || [],
        status: publish ? 'published' : 'draft',
        week_number: generatedMeta?.week_number,
        week_year: generatedMeta?.week_year,
      }

      const createRes = await fetch('/api/admin/curated-posts/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (createRes.ok) {
        const result = await createRes.json()
        alert(publish ? `Publikováno! /feed/${result.post?.slug}` : 'Draft uložen.')
        if (publish) {
          // Reset form
          setTitle('')
          setSubtitle('')
          setBodyMarkdown('')
          setVideoScript('')
          setSelectedIds(new Set())
          setExtraItems([])
          setPersonalNote('')
          setGeneratedMeta(null)
          await loadSaved()
        }
      } else {
        const err = await createRes.json()
        alert('Uložení selhalo: ' + (err.details || err.error))
      }
    } catch (e) {
      console.error(e)
      alert('Uložení selhalo')
    }
    setSaving(false)
  }

  const inputClass = 'w-full px-3 py-2 rounded-xl text-sm border-2 border-black/10 bg-white focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-colors'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Týdenní digest</h1>
          <p className="text-foreground/60 mt-1">Vyber položky, přidej kontext a nech Claude vygenerovat článek</p>
        </div>
        {bodyMarkdown && (
          <div className="flex items-center gap-2">
            <button onClick={() => handleSave(false)} disabled={saving} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border-2 border-black/10 hover:border-accent transition-colors disabled:opacity-40">
              <Save size={14} /> Uložit draft
            </button>
            <button onClick={() => handleSave(true)} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-accent text-white hover:bg-accent-hover transition-colors disabled:opacity-50">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              Publikovat
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-[1fr_1.5fr] gap-6">
        {/* LEFT: Item selection */}
        <div className="space-y-4">
          {/* Saved articles */}
          <div className="bg-white rounded-2xl border-2 border-black/10 p-4">
            <h2 className="text-sm font-bold text-foreground/60 mb-3">
              Uložené články ({savedArticles.length})
            </h2>
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="animate-spin text-foreground/30" size={20} /></div>
            ) : savedArticles.length === 0 ? (
              <p className="text-xs text-foreground/40 py-4">Žádné uložené články. Nejdřív ulož články z feedu.</p>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {savedArticles.map((article) => {
                  const selected = selectedIds.has(article.brief_id)
                  const cat = CATEGORY_CONFIG[article.primary_category]
                  return (
                    <label
                      key={article.brief_id}
                      className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
                        selected ? 'bg-accent/5 border-2 border-accent/30' : 'border-2 border-transparent hover:bg-black/[0.02]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleSelect(article.brief_id)}
                        className="mt-1 accent-accent"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-xs px-1.5 py-0.5 rounded-full font-medium" style={{ background: `${cat?.color}15`, color: cat?.color }}>
                            {cat?.emoji}
                          </span>
                          <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold font-mono ${relevanceBadgeClass(article.relevance_score)}`}>
                            {article.relevance_score}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-foreground leading-snug">{article.title}</p>
                        <p className="text-xs text-foreground/40 mt-0.5">{article.source_name}</p>
                      </div>
                    </label>
                  )
                })}
              </div>
            )}
          </div>

          {/* Extra items */}
          <div className="bg-white rounded-2xl border-2 border-black/10 p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-foreground/60">Další položky</h2>
              <button onClick={addExtraItem} className="flex items-center gap-1 text-xs font-semibold text-accent hover:text-accent-hover transition-colors">
                <Plus size={12} /> Přidat
              </button>
            </div>
            <p className="text-xs text-foreground/40 mb-3">Knihy, podcasty, osobní doporučení...</p>
            <div className="space-y-2">
              {extraItems.map((item) => (
                <div key={item.id} className="flex gap-2">
                  <div className="flex-1 space-y-1">
                    <input placeholder="Název" value={item.title} onChange={(e) => updateExtraItem(item.id, 'title', e.target.value)} className={`${inputClass} text-xs`} />
                    <input placeholder="Popis" value={item.description} onChange={(e) => updateExtraItem(item.id, 'description', e.target.value)} className={`${inputClass} text-xs`} />
                  </div>
                  <button onClick={() => removeExtraItem(item.id)} className="text-foreground/20 hover:text-red-500 transition-colors self-start mt-2">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Personal note */}
          <div className="bg-white rounded-2xl border-2 border-black/10 p-4">
            <h2 className="text-sm font-bold text-foreground/60 mb-2">Osobní poznámka</h2>
            <textarea
              value={personalNote}
              onChange={(e) => setPersonalNote(e.target.value)}
              placeholder="Co tě tento týden zaujalo? Osobní kontext pro Claude..."
              rows={3}
              className={`${inputClass} resize-none text-xs`}
            />
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={selectedIds.size === 0 || generating}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold bg-accent text-white hover:bg-accent-hover transition-colors disabled:opacity-40"
          >
            {generating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {generating ? 'Generuji článek...' : `Generovat digest (${selectedIds.size} položek)`}
          </button>
        </div>

        {/* RIGHT: Editor / Preview */}
        <div className="space-y-4">
          {!bodyMarkdown && !generating ? (
            <div className="bg-white rounded-2xl border-2 border-black/10 p-12 text-center">
              <Sparkles size={32} className="mx-auto text-foreground/20 mb-3" />
              <p className="text-foreground/40 text-sm">Vyber položky vlevo a klikni "Generovat digest"</p>
            </div>
          ) : generating ? (
            <div className="bg-white rounded-2xl border-2 border-black/10 p-12 text-center">
              <Loader2 size={32} className="mx-auto text-accent animate-spin mb-3" />
              <p className="text-foreground/60 text-sm font-semibold">Claude generuje článek + video script...</p>
              <p className="text-foreground/40 text-xs mt-1">Může to trvat 10-20 sekund</p>
            </div>
          ) : (
            <>
              {/* Title + subtitle */}
              <div className="bg-white rounded-2xl border-2 border-black/10 p-4 space-y-2">
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Nadpis"
                  className={`${inputClass} font-bold text-lg`}
                />
                <input
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="Podtitulek (volitelné)"
                  className={inputClass}
                />
              </div>

              {/* Toggle */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowPreview(false)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${!showPreview ? 'bg-accent text-white' : 'text-foreground/50'}`}
                >
                  Editor
                </button>
                <button
                  onClick={() => setShowPreview(true)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${showPreview ? 'bg-accent text-white' : 'text-foreground/50'}`}
                >
                  <Eye size={12} /> Preview
                </button>
              </div>

              {/* Body editor / preview */}
              <div className="bg-white rounded-2xl border-2 border-black/10 min-h-[400px]">
                {showPreview ? (
                  <div className="p-6 prose prose-sm max-w-none text-foreground/80 [&_h2]:text-foreground [&_h2]:font-bold [&_a]:text-accent">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{bodyMarkdown}</ReactMarkdown>
                  </div>
                ) : (
                  <textarea
                    value={bodyMarkdown}
                    onChange={(e) => setBodyMarkdown(e.target.value)}
                    className="w-full h-[400px] p-4 text-sm font-mono bg-transparent outline-none resize-none"
                    placeholder="Markdown obsah článku..."
                  />
                )}
              </div>

              {/* Video script */}
              <div className="bg-white rounded-2xl border-2 border-black/10">
                <button
                  onClick={() => setShowVideoScript(!showVideoScript)}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm font-bold text-foreground/60 hover:text-foreground transition-colors"
                >
                  <span>🎬 Video script</span>
                  {showVideoScript ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                {showVideoScript && (
                  <textarea
                    value={videoScript}
                    onChange={(e) => setVideoScript(e.target.value)}
                    className="w-full h-[250px] px-4 pb-4 text-sm bg-transparent outline-none resize-none border-t-2 border-black/5"
                    placeholder="Video script..."
                  />
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

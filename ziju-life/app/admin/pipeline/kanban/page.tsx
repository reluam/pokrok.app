'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useDroppable } from '@dnd-kit/core'
import { CATEGORY_CONFIG, relevanceBadgeClass } from '@/components/pipeline/constants'
import { Loader2, ExternalLink, StickyNote } from 'lucide-react'

interface Article {
  brief_id: number
  title: string
  url: string
  summary_cs: string
  relevance_score: number
  primary_category: string
  content_angle: string
  key_insight: string
  pipeline_status: string
  pipeline_notes: string | null
  source_name: string
  published_at: string
}

const COLUMNS = [
  { id: 'saved', label: 'Uložené', color: 'text-blue-600' },
  { id: 'in_progress', label: 'Rozpracované', color: 'text-amber-600' },
  { id: 'drafted', label: 'Draft', color: 'text-purple-600' },
  { id: 'published', label: 'Publikované', color: 'text-emerald-600' },
] as const

function DroppableColumn({ id, label, color, children, count }: { id: string; label: string; color: string; children: React.ReactNode; count: number }) {
  const { setNodeRef, isOver } = useDroppable({ id })
  return (
    <div className="flex-1 min-w-[260px]">
      <div className="flex items-center gap-2 mb-3">
        <h3 className={`text-sm font-bold ${color}`}>{label}</h3>
        <span className="text-xs px-2 py-0.5 rounded-full bg-black/5 text-foreground/50 font-mono font-bold">{count}</span>
      </div>
      <div
        ref={setNodeRef}
        className={`space-y-2 min-h-[200px] p-2 rounded-2xl transition-colors ${isOver ? 'bg-accent/5' : 'bg-black/[0.02]'}`}
      >
        {children}
      </div>
    </div>
  )
}

function KanbanCard({ article, overlay }: { article: Article; overlay?: boolean }) {
  const cat = CATEGORY_CONFIG[article.primary_category]
  return (
    <div className={`bg-white rounded-xl p-3.5 border-2 border-black/10 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow ${overlay ? 'shadow-lg rotate-1' : ''}`}>
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: `${cat?.color}15`, color: cat?.color }}>
          {cat?.emoji}
        </span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-bold font-mono ${relevanceBadgeClass(article.relevance_score)}`}>
          {article.relevance_score}
        </span>
      </div>
      <p className="text-xs font-bold text-foreground leading-snug mb-1">{article.title}</p>
      <p className="text-xs text-foreground/50 leading-relaxed line-clamp-2">{article.key_insight || article.summary_cs}</p>
      {article.pipeline_notes && (
        <div className="flex items-center gap-1 mt-1.5 text-xs text-foreground/40">
          <StickyNote size={10} />
          <span className="truncate">{article.pipeline_notes}</span>
        </div>
      )}
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-foreground/30 font-medium">{article.source_name}</span>
        <a href={article.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-foreground/30 hover:text-accent transition-colors">
          <ExternalLink size={11} />
        </a>
      </div>
    </div>
  )
}

function SortableCard({ article }: { article: Article }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `card-${article.brief_id}`,
    data: { article },
  })
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.3 : 1 }} {...attributes} {...listeners}>
      <KanbanCard article={article} />
    </div>
  )
}

export default function KanbanPage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [activeArticle, setActiveArticle] = useState<Article | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  )

  const loadArticles = useCallback(async () => {
    setLoading(true)
    try {
      const all: Article[] = []
      for (const status of ['saved', 'in_progress', 'drafted', 'published']) {
        const res = await fetch(`/api/admin/pipeline/articles?status=${status}&limit=50`)
        const data = await res.json()
        all.push(...(data.articles || []))
      }
      setArticles(all)
    } catch (e) { console.error(e) }
    setLoading(false)
  }, [])

  useEffect(() => { loadArticles() }, [loadArticles])

  function getColumnArticles(status: string) {
    const filtered = articles.filter((a) => a.pipeline_status === status)
    if (status === 'saved') return filtered.sort((a, b) => b.relevance_score - a.relevance_score)
    return filtered.sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime())
  }

  function handleDragStart(event: DragStartEvent) {
    const article = (event.active.data.current as { article: Article })?.article
    if (article) setActiveArticle(article)
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveArticle(null)
    const { active, over } = event
    if (!over) return
    const article = (active.data.current as { article: Article })?.article
    if (!article) return
    const targetStatus = COLUMNS.find((c) => c.id === over.id)?.id
    if (!targetStatus || targetStatus === article.pipeline_status) return
    setArticles((prev) => prev.map((a) => (a.brief_id === article.brief_id ? { ...a, pipeline_status: targetStatus } : a)))
    await fetch('/api/admin/pipeline/articles/status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ briefId: article.brief_id, status: targetStatus }),
    })
  }

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-foreground/30" size={24} /></div>
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Content Pipeline</h1>
      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {COLUMNS.map((col) => {
            const colArticles = getColumnArticles(col.id)
            return (
              <DroppableColumn key={col.id} id={col.id} label={col.label} color={col.color} count={colArticles.length}>
                <SortableContext items={colArticles.map((a) => `card-${a.brief_id}`)} strategy={verticalListSortingStrategy}>
                  {colArticles.map((article) => (
                    <SortableCard key={article.brief_id} article={article} />
                  ))}
                </SortableContext>
                {colArticles.length === 0 && (
                  <p className="text-xs text-center py-8 text-foreground/20">Prázdný</p>
                )}
              </DroppableColumn>
            )
          })}
        </div>
        <DragOverlay>{activeArticle && <KanbanCard article={activeArticle} overlay />}</DragOverlay>
      </DndContext>
    </div>
  )
}

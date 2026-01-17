'use client'

import { useEffect, useState } from 'react'
import { getInspirationData } from '@/lib/inspiration'
import { FileText, Video, Book, Filter } from 'lucide-react'
import Link from 'next/link'
import type { InspirationItem } from '@/lib/inspiration'

type ItemType = 'article' | 'video' | 'book' | 'all'

interface ItemUsage {
  articles: Array<{ id: string; title: string; slug: string }>
  smallThings: Array<{ id: string; title: string }>
  questions: Array<{ id: string; title: string }>
}

export default function KnihovnaPage() {
  const [inspirationData, setInspirationData] = useState<any>(null)
  const [filterType, setFilterType] = useState<ItemType>('all')
  const [itemUsages, setItemUsages] = useState<Record<string, ItemUsage>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [inspirationRes, articlesRes, smallThingsRes, questionsRes] = await Promise.all([
        fetch('/api/inspiration'),
        fetch('/api/articles'),
        fetch('/api/small-things'),
        fetch('/api/questions'),
      ])

      if (inspirationRes.ok) {
        const data = await inspirationRes.json()
        setInspirationData(data)
      }

      // Load usage data
      if (articlesRes.ok && smallThingsRes.ok && questionsRes.ok) {
        const articles = await articlesRes.json()
        const smallThings = await smallThingsRes.json()
        const questions = await questionsRes.json()

        // Build usage map
        const usages: Record<string, ItemUsage> = {}

        // Find articles that use each inspiration item
        articles.articles?.forEach((article: any) => {
          article.inspirationIds?.forEach((inspId: string) => {
            if (!usages[inspId]) {
              usages[inspId] = { articles: [], smallThings: [], questions: [] }
            }
            usages[inspId].articles.push({
              id: article.id,
              title: article.title,
              slug: article.slug,
            })
          })
        })

        // Find small things that use each inspiration item
        smallThings.things?.forEach((thing: any) => {
          if (thing.inspirationId || thing.inspiration_id) {
            const inspId = thing.inspirationId || thing.inspiration_id
            if (!usages[inspId]) {
              usages[inspId] = { articles: [], smallThings: [], questions: [] }
            }
            usages[inspId].smallThings.push({
              id: thing.id,
              title: thing.title,
            })
          }
        })

        // Find questions that use each inspiration item
        questions.questions?.forEach((question: any) => {
          if (question.inspirationId || question.inspiration_id) {
            const inspId = question.inspirationId || question.inspiration_id
            if (!usages[inspId]) {
              usages[inspId] = { articles: [], smallThings: [], questions: [] }
            }
            usages[inspId].questions.push({
              id: question.id,
              title: question.question || question.title,
            })
          }
        })

        setItemUsages(usages)
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getAllItems = (): Array<InspirationItem & { category: string }> => {
    if (!inspirationData) return []
    
    const items: Array<InspirationItem & { category: string }> = []
    
    if (inspirationData.articles) {
      items.push(...inspirationData.articles.map((item: InspirationItem) => ({ ...item, category: 'articles' })))
    }
    if (inspirationData.videos) {
      items.push(...inspirationData.videos.map((item: InspirationItem) => ({ ...item, category: 'videos' })))
    }
    if (inspirationData.books) {
      items.push(...inspirationData.books.map((item: InspirationItem) => ({ ...item, category: 'books' })))
    }
    
    return items
  }

  const getFilteredItems = () => {
    const allItems = getAllItems()
    if (filterType === 'all') return allItems
    return allItems.filter(item => item.type === filterType)
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'article': return FileText
      case 'video': return Video
      case 'book': return Book
      default: return FileText
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'article': return 'Článek'
      case 'video': return 'Video'
      case 'book': return 'Kniha'
      default: return type
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="text-text-primary text-xl">Načítání...</div>
      </div>
    )
  }

  const filteredItems = getFilteredItems()

  return (
    <article className="min-h-screen bg-background pt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <header className="mb-12">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-text-primary mb-6">
            Knihovna
          </h1>
          <p className="text-lg md:text-xl text-text-secondary max-w-3xl leading-relaxed">
            Všechny zdroje inspirace - články, videa a knihy, které ti mohou pomoci na cestě ke smysluplnému životu.
          </p>
        </header>

        {/* Filter */}
        <div className="mb-8 flex items-center gap-4">
          <Filter className="text-text-secondary" size={20} />
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilterType('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterType === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-text-primary border border-primary-200 hover:bg-primary-50'
              }`}
            >
              Vše
            </button>
            <button
              onClick={() => setFilterType('article')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterType === 'article'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-text-primary border border-primary-200 hover:bg-primary-50'
              }`}
            >
              Články
            </button>
            <button
              onClick={() => setFilterType('video')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterType === 'video'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-text-primary border border-primary-200 hover:bg-primary-50'
              }`}
            >
              Videa
            </button>
            <button
              onClick={() => setFilterType('book')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterType === 'book'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-text-primary border border-primary-200 hover:bg-primary-50'
              }`}
            >
              Knihy
            </button>
          </div>
        </div>

        {/* Items Grid */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-text-secondary text-lg">
              Zatím nejsou žádné položky v knihovně.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => {
              const Icon = getTypeIcon(item.type)
              const usage = itemUsages[item.id] || { articles: [], smallThings: [], questions: [] }
              const hasUsage = usage.articles.length > 0 || usage.smallThings.length > 0 || usage.questions.length > 0

              return (
                <div
                  key={item.id}
                  id={`item-${item.id}`}
                  className="bg-white rounded-lg border-2 border-primary-100 p-6 hover:border-primary-300 transition-all duration-300"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                        <Icon className="text-primary-600" size={24} />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-semibold text-primary-600 bg-primary-50 px-2 py-1 rounded">
                          {getTypeLabel(item.type)}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-text-primary mb-2 line-clamp-2">
                        {item.title}
                      </h3>
                      {item.author && (
                        <p className="text-sm text-text-secondary mb-2">
                          {item.author}
                        </p>
                      )}
                    </div>
                  </div>

                  {item.description && (
                    <p className="text-sm text-text-secondary mb-4 line-clamp-3">
                      {item.description}
                    </p>
                  )}

                  {item.link && (
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 transition-colors mb-4"
                    >
                      <span>Otevřít zdroj</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  )}

                  {/* Tags */}
                  {hasUsage && (
                    <div className="mt-4 pt-4 border-t border-primary-100">
                      <p className="text-xs font-semibold text-text-secondary mb-2">Používá se v:</p>
                      <div className="flex flex-wrap gap-2">
                        {usage.articles.map((article) => (
                          <Link
                            key={article.id}
                            href={`/clanky/${article.slug}`}
                            className="text-xs px-2 py-1 bg-primary-50 text-primary-700 rounded hover:bg-primary-100 transition-colors"
                          >
                            📄 {article.title}
                          </Link>
                        ))}
                        {usage.smallThings.map((thing) => (
                          <Link
                            key={thing.id}
                            href={`/clanky/male-veci#vec-${thing.id}`}
                            className="text-xs px-2 py-1 bg-primary-50 text-primary-700 rounded hover:bg-primary-100 transition-colors"
                          >
                            ✨ {thing.title}
                          </Link>
                        ))}
                        {usage.questions.map((question) => (
                          <Link
                            key={question.id}
                            href={`/clanky/otazky#otazka-${question.id}`}
                            className="text-xs px-2 py-1 bg-primary-50 text-primary-700 rounded hover:bg-primary-100 transition-colors"
                          >
                            ❓ {question.title}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </article>
  )
}

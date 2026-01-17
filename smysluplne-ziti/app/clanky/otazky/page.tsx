'use client'

import { useEffect, useState } from 'react'
import { getCategories } from '@/lib/categories'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import Image from 'next/image'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { Question } from '@/lib/questions'
import type { Category } from '@/lib/categories'

export default function OtazkyPage() {
  const [questionsByCategory, setQuestionsByCategory] = useState<Record<string, Question[]>>({})
  const [pageContent, setPageContent] = useState<any>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [openItems, setOpenItems] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [questionsRes, pageRes, categoriesRes] = await Promise.all([
        fetch('/api/questions'),
        fetch('/api/questions?type=page'),
        fetch('/api/categories'),
      ])

      if (questionsRes.ok) {
        const data = await questionsRes.json()
        // Group by category
        const grouped: Record<string, Question[]> = {}
        for (const q of data.questions || []) {
          const cat = q.category || 'obecne'
          if (!grouped[cat]) grouped[cat] = []
          grouped[cat].push(q)
        }
        setQuestionsByCategory(grouped)
      }

      if (pageRes.ok) {
        const page = await pageRes.json()
        setPageContent(page)
      }

      if (categoriesRes.ok) {
        const data = await categoriesRes.json()
        setCategories(data.categories || [])
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleItem = (id: string) => {
    setOpenItems(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="text-text-primary text-xl">Načítání...</div>
      </div>
    )
  }

  // Create category map for quick lookup
  const categoryMap = new Map(categories.map(cat => [cat.id, cat.name]))
  
  // Sort categories by displayOrder, then by name
  const sortedCategoryIds = categories
    .filter(cat => questionsByCategory[cat.id] && questionsByCategory[cat.id].length > 0)
    .sort((a, b) => {
      if (a.displayOrder !== b.displayOrder) {
        return a.displayOrder - b.displayOrder
      }
      return a.name.localeCompare(b.name)
    })
    .map(cat => cat.id)

  return (
    <article className="min-h-screen bg-background pt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Table of Contents - Left Sidebar */}
          <aside className="lg:col-span-1">
            <div className="sticky top-24">
              <div className="bg-white rounded-lg p-6 border border-primary-100">
                <h2 className="text-lg font-bold text-text-primary mb-4">Obsah</h2>
                <nav className="space-y-2">
                  {sortedCategoryIds.map((categoryId) => {
                    const questions = questionsByCategory[categoryId] || []
                    const categoryName = categoryMap.get(categoryId) || categoryId
                    return (
                      <div key={categoryId} className="mb-4">
                        <a
                          href={`#kategorie-${categoryId}`}
                          className="block text-sm font-semibold text-primary-600 hover:text-primary-700 mb-2"
                        >
                          {categoryName}
                        </a>
                        <ul className="ml-4 space-y-1">
                          {questions.map((question) => (
                            <li key={question.id}>
                              <a
                                href={`#otazka-${question.id}`}
                                className="block text-xs text-text-secondary hover:text-primary-600 transition-colors"
                              >
                                {question.question}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )
                  })}
                </nav>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Header */}
            <header className="mb-12">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-text-primary mb-6">
                Otázky ke smysluplnému životu
              </h1>
              {pageContent?.introText && (
                <div className="prose prose-lg max-w-none text-text-secondary leading-relaxed">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {pageContent.introText}
                  </ReactMarkdown>
                </div>
              )}
            </header>

            {/* Questions List by Category */}
            {sortedCategoryIds.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-text-secondary text-lg">
                  Zatím nejsou žádné otázky. Zkus to později.
                </p>
              </div>
            ) : (
              <div className="space-y-12">
                {sortedCategoryIds.map((categoryId) => {
                  const questions = questionsByCategory[categoryId] || []
                  const categoryName = categoryMap.get(categoryId) || categoryId
                  return (
                    <section key={categoryId} id={`kategorie-${categoryId}`} className="scroll-mt-24">
                      <h2 className="text-lg md:text-xl font-semibold text-text-primary mb-3">
                        {categoryName}
                      </h2>
                      <div className="space-y-1">
                        {questions.map((question) => {
                          const isOpen = openItems.has(question.id)
                          return (
                            <div
                              key={question.id}
                              id={`otazka-${question.id}`}
                              className="scroll-mt-24"
                            >
                              <button
                                onClick={() => toggleItem(question.id)}
                                className="w-full py-2 px-2 text-left flex items-center justify-between gap-3 hover:text-primary-600 transition-colors cursor-pointer"
                              >
                                <span className="text-base font-medium text-text-primary flex-1 font-handwriting text-lg">
                                  {question.question}
                                </span>
                                {isOpen ? (
                                  <ChevronUp className="flex-shrink-0 text-primary-600" size={16} />
                                ) : (
                                  <ChevronDown className="flex-shrink-0 text-text-secondary" size={16} />
                                )}
                              </button>
                              {isOpen && question.description && (
                                <div className="px-2 pb-3 pt-1">
                                  <div className="prose prose-sm max-w-none text-text-secondary leading-relaxed">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                      {question.description}
                                    </ReactMarkdown>
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </section>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}

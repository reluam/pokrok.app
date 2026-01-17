'use client'

import { useEffect, useState } from 'react'
import { Book, Video, FileText, ExternalLink, Calendar, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import type { InspirationData, InspirationItem } from '@/lib/inspiration'
import type { Article } from '@/lib/articles'

const getIcon = (type: string) => {
  switch (type) {
    case 'article':
      return FileText
    case 'video':
      return Video
    case 'book':
      return Book
    default:
      return FileText
  }
}

export default function InspirationPage() {
  const [inspirationData, setInspirationData] = useState<InspirationData | null>(null)
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Načíst inspirace
    fetch('/api/inspiration')
      .then(res => res.json())
      .then(data => {
        setInspirationData(data)
      })
      .catch(err => {
        console.error('Error fetching inspiration:', err)
      })

    // Načíst články
    fetch('/api/articles?published=true')
      .then(res => res.json())
      .then(data => {
        setArticles(data.articles || [])
        setLoading(false)
      })
      .catch(err => {
        console.error('Error fetching articles:', err)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="text-text-primary text-xl">Načítání...</div>
      </div>
    )
  }

  // Zkombinovat všechny inspirace do jednoho pole
  const allInspirations: Array<InspirationItem & { type: string }> = []
  if (inspirationData) {
    inspirationData.articles.forEach(item => {
      allInspirations.push({ ...item, type: 'article' })
    })
    inspirationData.videos.forEach(item => {
      allInspirations.push({ ...item, type: 'video' })
    })
    inspirationData.books.forEach(item => {
      allInspirations.push({ ...item, type: 'book' })
    })
  }

  return (
    <section className="section-padding relative overflow-hidden pt-20">
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          {/* Two column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 lg:gap-12">
            {/* Left column - Articles (Blog) */}
            <div className="lg:col-span-2">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-text-primary mb-6 md:mb-8 text-center lg:text-left">
                <span className="gradient-text">Články</span>
              </h1>

              {articles.length === 0 ? (
                <div className="text-center py-12 md:py-16">
                  <FileText className="mx-auto text-primary-200 mb-4" size={64} />
                  <h2 className="text-xl md:text-2xl font-bold text-text-primary mb-2">Zatím žádné články</h2>
                  <p className="text-text-secondary">Články se připravují.</p>
                </div>
              ) : (
                <div className="space-y-6 md:space-y-8">
                  {articles.map((article) => (
                    <Link
                      key={article.id}
                      href={`/clanky/${article.slug}`}
                      className="group block p-4 md:p-6 lg:p-8 transition-all duration-300"
                    >
                      {/* Content */}
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2 mb-3 md:mb-4">
                          <FileText className="text-primary-600" size={18} />
                          <span className="text-xs md:text-sm text-primary-600 font-semibold">Článek</span>
                        </div>
                        <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-text-primary mb-3 md:mb-4 group-hover:text-primary-600 transition-colors">
                          {article.title}
                        </h2>
                        <p className="text-text-secondary mb-4 text-base md:text-lg leading-relaxed">
                          {article.excerpt}
                        </p>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs md:text-sm text-text-light mt-auto">
                          <div className="flex items-center gap-2">
                            <Calendar size={14} />
                            <span>{new Date(article.createdAt).toLocaleDateString('cs-CZ')}</span>
                          </div>
                          <span className="text-primary-600 group-hover:text-primary-700 font-semibold flex items-center gap-1">
                            Číst více
                            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Right column - Knihovna (Sidebar) */}
            <div className="lg:col-span-1">
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-text-primary mb-6 md:mb-8 text-center lg:text-left">
                <span className="gradient-text">Knihovna</span>
              </h2>

              {allInspirations.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-text-secondary">Zatím žádné inspirace.</p>
                </div>
              ) : (
                <div className="space-y-3 md:space-y-4">
                  {allInspirations.map((item) => {
                    const Icon = getIcon(item.type)
                    return (
                      <a
                        key={item.id}
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group block p-4 md:p-5 border-2 border-primary-100 hover:border-primary-300 transition-all duration-300"
                      >
                        <div className="flex items-start justify-between mb-2 md:mb-3">
                          <div className="p-2 bg-primary-100 group-hover:bg-primary-200 transition-colors">
                            <Icon className="text-primary-600" size={16} />
                          </div>
                          <ExternalLink className="text-text-light group-hover:text-primary-600 transition-colors" size={14} />
                        </div>
                        <h3 className="text-base md:text-lg font-bold text-text-primary mb-2 group-hover:text-primary-600 transition-colors line-clamp-2">
                          {item.title}
                        </h3>
                        {item.author && (
                          <p className="text-xs md:text-sm text-primary-600 mb-2 font-semibold">{item.author}</p>
                        )}
                        <p className="text-xs md:text-sm text-text-secondary line-clamp-3 leading-relaxed">
                          {item.description}
                        </p>
                      </a>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
    </section>
  )
}

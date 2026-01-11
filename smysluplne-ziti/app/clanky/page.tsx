'use client'

import { useEffect, useState } from 'react'
import { FileText, Calendar, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import type { Article } from '@/lib/articles'

export default function ClankyPage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchArticles()
  }, [])

  const fetchArticles = async () => {
    try {
      const res = await fetch('/api/articles?published=true')
      const data = await res.json()
      setArticles(data.articles || [])
      setLoading(false)
    } catch (error) {
      console.error('Error fetching articles:', error)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="text-text-primary text-xl">Načítání...</div>
      </div>
    )
  }

  return (
    <section className="section-padding relative overflow-hidden pt-20">
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-8 md:mb-12">
            <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-text-primary mb-4 md:mb-6">
              <span className="gradient-text">Články</span>
            </h1>
            <p className="text-base md:text-lg lg:text-xl xl:text-2xl text-text-secondary max-w-3xl mx-auto leading-relaxed">
              Vlastní články o smysluplném žití, osobním rozvoji a dosahování cílů.
            </p>
          </div>

          {articles.length === 0 ? (
            <div className="text-center py-12 md:py-16">
              <FileText className="mx-auto text-primary-200 mb-4" size={64} />
              <h2 className="text-xl md:text-2xl font-bold text-text-primary mb-2">Zatím žádné články</h2>
              <p className="text-text-secondary">Články se připravují.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {articles.map((article) => (
                <Link
                  key={article.id}
                  href={`/clanky/${article.slug}`}
                  className="group p-4 md:p-6 border-2 border-primary-100 hover:border-primary-300 transition-all duration-300"
                >
                  <div className="flex items-center gap-2 mb-3 md:mb-4">
                    <FileText className="text-primary-600" size={18} />
                    <span className="text-xs md:text-sm text-primary-600 font-semibold">Článek</span>
                  </div>
                  <h2 className="text-xl md:text-2xl font-bold text-text-primary mb-2 md:mb-3 group-hover:text-primary-600 transition-colors">
                    {article.title}
                  </h2>
                  <p className="text-text-secondary mb-3 md:mb-4 line-clamp-3 text-sm md:text-base">
                    {article.excerpt}
                  </p>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs md:text-sm text-text-light">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} />
                      <span>{new Date(article.createdAt).toLocaleDateString('cs-CZ')}</span>
                    </div>
                    <span className="text-primary-600 group-hover:text-primary-700 font-semibold flex items-center gap-1">
                      Číst více
                      <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
    </section>
  )
}


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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-text-primary text-xl">Načítání...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <section className="section-padding relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-playful-purple-light rounded-full mix-blend-multiply filter blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-playful-pink-light rounded-full mix-blend-multiply filter blur-3xl opacity-20 translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="max-w-7xl mx-auto container-padding relative">
          {/* Back button */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-text-secondary hover:text-primary-600 mb-8 transition-colors"
          >
            <ArrowRight className="rotate-180" size={20} />
            <span>Zpět na hlavní stránku</span>
          </Link>

          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-text-primary mb-6">
              <span className="gradient-text">Články</span>
            </h1>
            <p className="text-xl md:text-2xl text-text-secondary max-w-3xl mx-auto leading-relaxed">
              Vlastní články o smysluplném žití, osobním rozvoji a dosahování cílů.
            </p>
          </div>

          {articles.length === 0 ? (
            <div className="text-center py-16">
              <FileText className="mx-auto text-primary-200 mb-4" size={64} />
              <h2 className="text-2xl font-bold text-text-primary mb-2">Zatím žádné články</h2>
              <p className="text-text-secondary">Články se připravují.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map((article) => (
                <Link
                  key={article.id}
                  href={`/clanky/${article.slug}`}
                  className="group bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg p-6 border border-primary-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <FileText className="text-primary-600" size={20} />
                    <span className="text-sm text-primary-600 font-semibold">Článek</span>
                  </div>
                  <h2 className="text-2xl font-bold text-text-primary mb-3 group-hover:text-primary-600 transition-colors">
                    {article.title}
                  </h2>
                  <p className="text-text-secondary mb-4 line-clamp-3">
                    {article.excerpt}
                  </p>
                  <div className="flex items-center justify-between text-sm text-text-light">
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
    </div>
  )
}


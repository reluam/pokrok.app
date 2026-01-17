'use client'

import { useEffect, useState } from 'react'
import { FileText, Calendar, ArrowRight, Book, Video, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import type { Article } from '@/lib/articles'
import type { InspirationData, InspirationItem } from '@/lib/inspiration'

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

export default function ClankyPage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [smallThingsPage, setSmallThingsPage] = useState<any>(null)
  const [questionsPage, setQuestionsPage] = useState<any>(null)
  const [inspirationData, setInspirationData] = useState<InspirationData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [articlesRes, smallThingsRes, questionsRes, inspirationRes] = await Promise.all([
        fetch('/api/articles?published=true'),
        fetch('/api/small-things?type=page'),
        fetch('/api/questions?type=page'),
        fetch('/api/inspiration'),
      ])
      
      const articlesData = await articlesRes.json()
      setArticles(articlesData.articles || [])
      
      if (smallThingsRes.ok) {
        const page = await smallThingsRes.json()
        setSmallThingsPage(page)
      }
      
      if (questionsRes.ok) {
        const page = await questionsRes.json()
        setQuestionsPage(page)
      }

      if (inspirationRes.ok) {
        const data = await inspirationRes.json()
        setInspirationData(data)
      }
      
      setLoading(false)
    } catch (error) {
      console.error('Error fetching data:', error)
      setLoading(false)
    }
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
              <span className="gradient-text">Články a inspirace</span>
            </h1>
          </div>

          {/* Two column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 lg:gap-12">
            {/* Left column - Articles (2/3) */}
            <div className="lg:col-span-2">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-text-primary mb-6 md:mb-8 text-center lg:text-left">
                <span className="gradient-text">Články</span>
              </h2>

              {articles.length === 0 ? (
                <div className="text-center py-12 md:py-16">
                  <FileText className="mx-auto text-primary-200 mb-4" size={64} />
                  <h3 className="text-xl md:text-2xl font-bold text-text-primary mb-2">Zatím žádné články</h3>
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
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2 mb-3 md:mb-4">
                          <FileText className="text-primary-600" size={18} />
                          <span className="text-xs md:text-sm text-primary-600 font-semibold">Článek</span>
                        </div>
                        <h3 className="text-xl md:text-2xl lg:text-3xl font-bold text-text-primary mb-3 md:mb-4 group-hover:text-primary-600 transition-colors">
                          {article.title}
                        </h3>
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

            {/* Right column - Inspirace + Knihovna (1/3) */}
            <div className="lg:col-span-1">
              {/* Inspirace */}
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-text-primary mb-6 md:mb-8 text-center lg:text-left">
                <span className="gradient-text">Inspirace</span>
              </h2>

              <div className="space-y-4 md:space-y-6 mb-12">
                {/* Otázky card */}
                {questionsPage && (
                  <Link
                    href="/clanky/otazky"
                    className="group bg-white rounded-lg overflow-hidden border border-primary-100 hover:border-primary-300 hover:shadow-xl transition-all duration-300 block"
                  >
                    {questionsPage.image ? (
                      <div className="relative h-48 overflow-hidden">
                        <Image
                          src={questionsPage.image}
                          alt="Otázky ke smysluplnému životu"
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ) : (
                      <div className="relative h-48 bg-gradient-to-br from-primary-100 to-primary-200">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-6xl">❓</span>
                        </div>
                      </div>
                    )}
                    <div className="p-6">
                      <span className="inline-block px-3 py-1 text-xs font-semibold text-primary-600 bg-primary-50 rounded-full mb-3">
                        Reflexe
                      </span>
                      <h3 className="text-xl font-bold text-text-primary mb-3 group-hover:text-primary-600 transition-colors">
                        Otázky ke smysluplnému životu
                      </h3>
                      <p className="text-text-secondary leading-relaxed mb-4">
                        Otázky pro reflexi a seberozvoj, které ti pomohou najít smysl.
                      </p>
                      <div className="inline-flex items-center gap-2 text-primary-600 font-semibold group-hover:gap-3 transition-all">
                        <span>Zobrazit otázky</span>
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </Link>
                )}

                {/* Malé věci card */}
                {smallThingsPage && (
                  <Link
                    href="/clanky/male-veci"
                    className="group bg-white rounded-lg overflow-hidden border border-primary-100 hover:border-primary-300 hover:shadow-xl transition-all duration-300 block"
                  >
                    {smallThingsPage.image ? (
                      <div className="relative h-48 overflow-hidden">
                        <Image
                          src={smallThingsPage.image}
                          alt="Malé věci s velkým dopadem"
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ) : (
                      <div className="relative h-48 bg-gradient-to-br from-primary-100 to-primary-200">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-6xl">✨</span>
                        </div>
                      </div>
                    )}
                    <div className="p-6">
                      <span className="inline-block px-3 py-1 text-xs font-semibold text-primary-600 bg-primary-50 rounded-full mb-3">
                        Tipy
                      </span>
                      <h3 className="text-xl font-bold text-text-primary mb-3 group-hover:text-primary-600 transition-colors">
                        Malé věci s velkým dopadem
                      </h3>
                      <p className="text-text-secondary leading-relaxed mb-4">
                        Malé tipy pro kvalitnější život, které můžeš začít používat hned teď.
                      </p>
                      <div className="inline-flex items-center gap-2 text-primary-600 font-semibold group-hover:gap-3 transition-all">
                        <span>Zobrazit tipy</span>
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </Link>
                )}
              </div>

              {/* Knihovna */}
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-text-primary mb-6 md:mb-8 text-center lg:text-left">
                <span className="gradient-text">Knihovna</span>
              </h2>

              {allInspirations.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-text-secondary">Zatím žádné položky v knihovně.</p>
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


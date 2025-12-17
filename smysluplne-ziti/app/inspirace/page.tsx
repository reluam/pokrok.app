'use client'

import { useEffect, useState } from 'react'
import { Book, Video, FileText, ExternalLink, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
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

export default function InspirationPage() {
  const [data, setData] = useState<InspirationData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/inspiration')
      .then(res => res.json())
      .then(data => {
        setData(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Error fetching inspiration:', err)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-text-primary text-xl">Načítání...</div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-text-primary text-xl">Chyba při načítání dat</div>
      </div>
    )
  }

  const renderSection = (title: string, items: InspirationItem[], icon: typeof FileText) => {
    if (items.length === 0) return null

    const Icon = icon
    return (
      <div className="mb-16">
        <h3 className="text-3xl md:text-4xl font-bold text-text-primary mb-10 flex items-center">
          <Icon className="mr-3 text-primary-600" size={32} />
          {title}
        </h3>
        <div className={`grid grid-cols-1 md:grid-cols-2 ${title === 'Knihy' ? 'lg:grid-cols-3' : ''} gap-6`}>
          {items.map((item) => {
            const ItemIcon = getIcon(item.type)
            return (
              <a
                key={item.id}
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="group block bg-white/80 backdrop-blur-sm rounded-2xl p-6 md:p-8 hover:shadow-xl transition-all duration-300 border-2 border-primary-100 hover:border-primary-400 hover:-translate-y-1 transform"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-xl bg-primary-100 group-hover:bg-primary-200 transition-colors">
                    <ItemIcon className="text-primary-600" size={24} />
                  </div>
                  <ExternalLink className="text-text-light group-hover:text-primary-600 transition-colors" size={18} />
                </div>
                <h4 className="text-xl font-bold text-text-primary mb-3 group-hover:text-primary-600 transition-colors">
                  {item.title}
                </h4>
                {item.author && (
                  <p className="text-sm text-primary-600 mb-2 font-semibold">{item.author}</p>
                )}
                <p className="text-text-secondary text-base leading-relaxed">{item.description}</p>
              </a>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <section className="section-padding relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-playful-pink-light rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-playful-yellowGreen-light rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
        
        <div className="max-w-7xl mx-auto container-padding relative">
          {/* Back button */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-text-secondary hover:text-primary-600 mb-8 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Zpět na hlavní stránku</span>
          </Link>

          <div className="text-center mb-16">
            <div className="inline-block px-4 py-2 rounded-full bg-primary-100 text-primary-700 text-sm font-semibold mb-6">
              Inspirace
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-text-primary mb-6">
              Najděte{' '}
              <span className="gradient-text">inspiraci</span>
            </h1>
            <p className="text-xl md:text-2xl text-text-secondary max-w-3xl mx-auto leading-relaxed">
              Články, videa a knihy, které vás mohou inspirovat na cestě k smysluplnějšímu životu.
            </p>
          </div>

          {renderSection('Články', data.articles, FileText)}
          {renderSection('Videa', data.videos, Video)}
          {renderSection('Knihy', data.books, Book)}
        </div>
      </section>
    </div>
  )
}

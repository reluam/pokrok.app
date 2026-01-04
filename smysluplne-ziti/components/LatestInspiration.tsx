'use client'

import { useEffect, useState } from 'react'
import { Book, Video, FileText, ExternalLink, ArrowRight } from 'lucide-react'
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

export default function LatestInspiration() {
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

  if (loading || !data) {
    return null
  }

  // Získat všechny inspirace a seřadit je (poslední přidané první)
  const allItems: Array<InspirationItem & { type: string }> = []
  
  data.articles.forEach(item => {
    allItems.push({ ...item, type: 'article' })
  })
  data.videos.forEach(item => {
    allItems.push({ ...item, type: 'video' })
  })
  data.books.forEach(item => {
    allItems.push({ ...item, type: 'book' })
  })

  // Vzít poslední 4-6 položek (co se vejde na jeden řádek)
  const latestItems = allItems.slice(-6).reverse()

  if (latestItems.length === 0) {
    return null
  }

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-primary-50 via-background via-60% to-playful-yellow-light/30">
      {/* Animated background blobs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-playful-pink-light rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
      <div className="absolute top-40 right-10 w-72 h-72 bg-playful-yellow-light rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-playful-purple-light rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
      
      <div className="max-w-7xl mx-auto container-padding relative z-10 w-full">
        <div className="text-center mb-12 animate-fade-in-up">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-text-primary mb-4">
            <span className="gradient-text">Poslední inspirace</span>
          </h2>
          <Link
            href="/inspirace"
            className="text-primary-600 hover:text-primary-700 font-semibold flex items-center justify-center gap-2 transition-colors text-lg"
          >
            Zobrazit všechny
            <ArrowRight size={20} />
          </Link>
        </div>
        
        <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide px-2 animate-fade-in-up animation-delay-2000">
          {latestItems.map((item) => {
            const Icon = getIcon(item.type)
            return (
              <a
                key={item.id}
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex-shrink-0 bg-white/90 backdrop-blur-md rounded-3xl p-6 border-2 border-primary-100 hover:border-primary-300 hover:shadow-2xl transition-all duration-300 min-w-[300px] max-w-[350px] shadow-lg"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-xl bg-primary-100 group-hover:bg-primary-200 transition-colors">
                    <Icon className="text-primary-600" size={24} />
                  </div>
                  <ExternalLink className="text-text-light group-hover:text-primary-600 transition-colors" size={18} />
                </div>
                <h3 className="text-xl font-bold text-text-primary mb-3 group-hover:text-primary-600 transition-colors line-clamp-2">
                  {item.title}
                </h3>
                {item.author && (
                  <p className="text-sm text-primary-600 mb-3 font-semibold">{item.author}</p>
                )}
                <p className="text-sm text-text-secondary line-clamp-3 leading-relaxed">
                  {item.description}
                </p>
              </a>
            )
          })}
        </div>
      </div>
    </section>
  )
}

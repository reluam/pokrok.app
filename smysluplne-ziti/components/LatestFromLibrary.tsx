'use client'

import { useEffect, useState } from 'react'
import { BookOpen, HelpCircle, Sparkles, Book, FileText, Video, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import type { Article } from '@/lib/articles'
import type { Question } from '@/lib/questions'
import type { SmallThing } from '@/lib/small-things'
import type { InspirationItem } from '@/lib/inspiration'

type FilterType = 'blog' | 'questions' | 'small-things' | 'books' | 'inspiration-articles' | 'videos'

interface LibraryItem {
  id: string
  title: string
  description?: string
  author?: string
  link?: string
  image?: string
  type: FilterType
  slug?: string
  createdAt: string
}

export default function LatestFromLibrary() {
  const [items, setItems] = useState<LibraryItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [articlesRes, questionsRes, smallThingsRes, inspirationRes] = await Promise.all([
        fetch('/api/articles?published=true'),
        fetch('/api/questions'),
        fetch('/api/small-things'),
        fetch('/api/inspiration'),
      ])

      const allItems: LibraryItem[] = []

      // Blog articles
      if (articlesRes.ok) {
        const data = await articlesRes.json()
        const articles: Article[] = data.articles || []
        articles.forEach((article) => {
          allItems.push({
            id: article.id,
            title: article.title,
            description: article.excerpt,
            type: 'blog',
            slug: article.slug,
            createdAt: article.createdAt,
            image: article.image,
          })
        })
      }


      // Inspiration items
      if (inspirationRes.ok) {
        const data = await inspirationRes.json()
        
        // Books
        if (data.books) {
          data.books.forEach((item: any) => {
            allItems.push({
              id: item.id,
              title: item.title,
              description: item.description,
              author: item.author,
              link: item.link,
              type: 'books',
              createdAt: item.createdAt || item.created_at || new Date().toISOString(),
            })
          })
        }

        // Inspiration articles
        if (data.articles) {
          data.articles.forEach((item: any) => {
            allItems.push({
              id: item.id,
              title: item.title,
              description: item.description,
              author: item.author,
              link: item.link,
              type: 'inspiration-articles',
              createdAt: item.createdAt || item.created_at || new Date().toISOString(),
            })
          })
        }

        // Videos
        if (data.videos) {
          data.videos.forEach((item: any) => {
            allItems.push({
              id: item.id,
              title: item.title,
              description: item.description,
              author: item.author,
              link: item.link,
              type: 'videos',
              createdAt: item.createdAt || item.created_at || new Date().toISOString(),
            })
          })
        }
      }

      // Sort by createdAt (newest first) and take top 3
      const sortedItems = allItems
        .filter(item => item.createdAt)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 3)

      setItems(sortedItems)
    } catch (error) {
      console.error('Error loading library items:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTypeIcon = (type: FilterType) => {
    switch (type) {
      case 'blog': return BookOpen
      case 'questions': return HelpCircle
      case 'small-things': return Sparkles
      case 'books': return Book
      case 'inspiration-articles': return FileText
      case 'videos': return Video
      default: return FileText
    }
  }

  const getTypeLabel = (type: FilterType) => {
    switch (type) {
      case 'blog': return 'Blog'
      case 'questions': return 'Otázky'
      case 'small-things': return 'Malé věci'
      case 'books': return 'Knihy'
      case 'inspiration-articles': return 'Články'
      case 'videos': return 'Videa'
      default: return type
    }
  }

  const getItemHref = (item: LibraryItem): string => {
    switch (item.type) {
      case 'blog':
        return `/clanky/${item.slug}`
      default:
        return '/knihovna'
    }
  }

  if (loading) {
    return null
  }

  if (items.length === 0) {
    return null
  }

  return (
    <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-text-primary mb-6">
            Inspirace pro tvou <span className="gradient-text">cestu</span>
          </h2>
          <p className="text-lg md:text-xl text-text-secondary max-w-3xl mx-auto leading-relaxed">
            Každý týden sem přidávám nové podněty, které mi pomáhají žít život, který mi dává smysl. Najdeš tu tipy na knihy, zajímavá videa a jednou měsíčně i hlubší autorský článek. Je to prostor pro tvoji reflexi a nové úhly pohledu na každodenní realitu.
          </p>
        </div>

        <div className="mb-12">
          <h3 className="text-2xl md:text-3xl font-bold text-text-primary mb-8 text-center">
            Nejnovější příspěvky
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {items.map((item) => {
            const Icon = getTypeIcon(item.type)
            const href = getItemHref(item)
            const isBlog = item.type === 'blog'

            return (
              <div
                key={item.id}
                className="group bg-white rounded-lg border-2 border-primary-100 hover:border-primary-300 hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col"
              >
                {item.image && (
                  <div className="relative w-full h-48 overflow-hidden">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                        <Icon className="text-primary-600" size={20} />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-semibold text-primary-600 bg-primary-50 px-2 py-1 rounded">
                        {getTypeLabel(item.type)}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-text-primary mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors">
                    {item.title}
                  </h3>

                  {item.author && (
                    <p className="text-sm text-text-secondary mb-2">
                      {item.author}
                    </p>
                  )}

                  {item.description && (
                    <p className="text-sm text-text-secondary mb-4 line-clamp-3 flex-1">
                      {item.description}
                    </p>
                  )}

                  <div className="mt-auto">
                    {isBlog ? (
                      <Link
                        href={href}
                        className="inline-flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 transition-colors font-semibold"
                      >
                        <span>Přečíst</span>
                        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                      </Link>
                    ) : (
                      <Link
                        href="/knihovna"
                        className="inline-flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 transition-colors font-semibold"
                      >
                        <span>Zobrazit</span>
                        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/knihovna"
            className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-semibold transition-colors"
          >
            <span>Zobrazit všechny příspěvky</span>
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </section>
  )
}

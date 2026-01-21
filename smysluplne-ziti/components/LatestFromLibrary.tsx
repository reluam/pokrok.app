'use client'

import { useEffect, useState } from 'react'
import { BookOpen, HelpCircle, Sparkles, Book, FileText, Video, ArrowRight, PlayCircle, X, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Article } from '@/lib/articles'
import type { Question } from '@/lib/questions'
import type { SmallThing } from '@/lib/small-things'
import type { InspirationItem } from '@/lib/inspiration'
import { getVideoInfo, getUrlImage } from '@/lib/video-utils'

type FilterType = 'blog' | 'questions' | 'small-things' | 'books' | 'inspiration-articles' | 'videos'

function ItemImage({ src, alt, type, videoInfo }: { src: string; alt: string; type: FilterType; videoInfo: any }) {
  const [imageError, setImageError] = useState(false)

  if (imageError && type === 'books') {
    return (
      <div className="w-full h-48 rounded-lg bg-primary-100 flex items-center justify-center">
        <Book className="text-primary-600" size={64} />
      </div>
    )
  }

  if (imageError) {
    return null
  }

  return (
    <div className="relative w-full h-48 overflow-hidden">
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover group-hover:scale-105 transition-transform duration-300"
        onError={() => setImageError(true)}
      />
      {type === 'videos' && videoInfo && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center">
            <PlayCircle className="text-primary-600 ml-1" size={32} fill="currentColor" />
          </div>
        </div>
      )}
    </div>
  )
}

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
  // Full data for modal
  inspirationItem?: InspirationItem
}

export default function LatestFromLibrary() {
  const [items, setItems] = useState<LibraryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [modalItem, setModalItem] = useState<LibraryItem | null>(null)

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
              inspirationItem: item,
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
              inspirationItem: item,
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
              inspirationItem: item,
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

  const handleItemClick = (item: LibraryItem, e: React.MouseEvent) => {
    // Blog articles still navigate to full page
    if (item.type === 'blog') {
      return // Let Link handle it
    }
    
    // Other items open modal
    e.preventDefault()
    setModalItem(item)
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

            // Get video thumbnail or URL image
            const videoInfo = item.type === 'videos' && item.link ? getVideoInfo(item.link) : null
            const displayImage = item.image || 
              (videoInfo?.thumbnailUrl) || 
              (item.type === 'books' || item.type === 'inspiration-articles' ? (item.link ? getUrlImage(item.link) : null) : null)

            return (
              <div
                key={item.id}
                className={isBlog ? '' : 'cursor-pointer'}
              >
                {isBlog ? (
                  <Link href={href}>
                    <div className="group bg-white rounded-lg border-2 border-primary-100 hover:border-primary-300 hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col">
                      {displayImage ? (
                        <ItemImage 
                          src={displayImage}
                          alt={item.title}
                          type={item.type}
                          videoInfo={videoInfo}
                        />
                      ) : (
                        item.type === 'books' && (
                          <div className="w-full h-48 bg-primary-100 flex items-center justify-center">
                            <Book className="text-primary-600" size={64} />
                          </div>
                        )
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
                          <span className="inline-flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 transition-colors font-semibold">
                            <span>Přečíst</span>
                            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ) : (
                  <div
                    className="group bg-white rounded-lg border-2 border-primary-100 hover:border-primary-300 hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col"
                    onClick={(e) => handleItemClick(item, e)}
                  >
                    {displayImage ? (
                      <ItemImage 
                        src={displayImage}
                        alt={item.title}
                        type={item.type}
                        videoInfo={videoInfo}
                      />
                    ) : (
                      item.type === 'books' && (
                        <div className="w-full h-48 bg-primary-100 flex items-center justify-center">
                          <Book className="text-primary-600" size={64} />
                        </div>
                      )
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
                        <span className="inline-flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 transition-colors font-semibold">
                          <span>Zobrazit</span>
                          <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </span>
                      </div>
                    </div>
                  </div>
                )}
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

      {/* Modal */}
      {modalItem && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setModalItem(null)}
        >
          <div 
            className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-primary-100 p-6 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  {(() => {
                    const Icon = getTypeIcon(modalItem.type)
                    return <Icon className="text-primary-600" size={20} />
                  })()}
                </div>
                <div>
                  <span className="text-xs font-semibold text-primary-600 bg-primary-50 px-2 py-1 rounded">
                    {getTypeLabel(modalItem.type)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setModalItem(null)}
                className="text-text-secondary hover:text-text-primary transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6">
              <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-4">
                {modalItem.title}
              </h2>

              {modalItem.author && (
                <p className="text-sm text-primary-600 mb-4 font-semibold">
                  {modalItem.author}
                </p>
              )}

              {/* Videos */}
              {modalItem.type === 'videos' && modalItem.link && (
                <div>
                  {modalItem.description && (
                    <div className="prose prose-sm max-w-none text-text-secondary leading-relaxed mb-6">
                      <p>{modalItem.description}</p>
                    </div>
                  )}
                  {(() => {
                    const videoInfo = getVideoInfo(modalItem.link)
                    if (videoInfo) {
                      return (
                        <div className="mb-6">
                          <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black">
                            <iframe
                              src={videoInfo.embedUrl}
                              className="absolute inset-0 w-full h-full"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            ></iframe>
                          </div>
                        </div>
                      )
                    }
                    return (
                      <a
                        href={modalItem.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-semibold rounded-full hover:bg-primary-700 transition-all duration-300"
                      >
                        <span>Otevřít odkaz</span>
                        <ExternalLink size={18} />
                      </a>
                    )
                  })()}
                </div>
              )}

              {/* Books and articles */}
              {(modalItem.type === 'books' || modalItem.type === 'inspiration-articles') && (
                <div>
                  {modalItem.description && (
                    <div className="prose prose-sm max-w-none text-text-secondary leading-relaxed mb-6">
                      <p>{modalItem.description}</p>
                    </div>
                  )}
                  {modalItem.link && (
                    <a
                      href={modalItem.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-semibold rounded-full hover:bg-primary-700 transition-all duration-300"
                    >
                      <span>Otevřít odkaz</span>
                      <ExternalLink size={18} />
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

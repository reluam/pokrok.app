'use client'

import { useEffect, useState } from 'react'
import { FileText, Video, Book, Filter, BookOpen, HelpCircle, Sparkles, ExternalLink, X, PlayCircle } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { InspirationItem } from '@/lib/inspiration'
import type { Article } from '@/lib/articles'
import type { SmallThing } from '@/lib/small-things'
import type { Question } from '@/lib/questions'
import { getVideoInfo, getUrlImage } from '@/lib/video-utils'

type FilterType = 'all' | 'blog' | 'questions' | 'small-things' | 'books' | 'inspiration-articles' | 'videos'

function ItemImage({ src, alt, type, videoInfo }: { src: string; alt: string; type: FilterType; videoInfo: any }) {
  const [imageError, setImageError] = useState(false)

  if (imageError && type === 'books') {
    return (
      <div className="w-full h-48 mb-4 rounded-lg bg-primary-100 flex items-center justify-center">
        <Book className="text-primary-600" size={64} />
      </div>
    )
  }

  if (imageError) {
    return null
  }

  return (
    <div className="relative w-full h-48 mb-4 rounded-lg overflow-hidden">
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover"
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
  slug?: string // For blog articles
  createdAt?: string
  // Full data for modal
  questionData?: Question
  smallThingData?: SmallThing
  inspirationItem?: InspirationItem
}

export default function KnihovnaPage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [smallThings, setSmallThings] = useState<SmallThing[]>([])
  const [inspirationData, setInspirationData] = useState<any>(null)
  const [filterType, setFilterType] = useState<FilterType>('all')
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

      if (articlesRes.ok) {
        const data = await articlesRes.json()
        setArticles(data.articles || [])
      }

      if (questionsRes.ok) {
        const data = await questionsRes.json()
        setQuestions(data.questions || [])
      }

      if (smallThingsRes.ok) {
        const data = await smallThingsRes.json()
        setSmallThings(data.things || [])
      }

      if (inspirationRes.ok) {
        const data = await inspirationRes.json()
        setInspirationData(data)
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getAllItems = (): LibraryItem[] => {
    const items: LibraryItem[] = []

    // Blog articles
    articles.forEach((article) => {
      items.push({
        id: article.id,
        title: article.title,
        description: article.excerpt,
        type: 'blog',
        slug: article.slug,
        createdAt: article.createdAt,
        image: article.image,
      })
    })


    // Inspiration items
    if (inspirationData) {
      // Books
      if (inspirationData.books) {
        inspirationData.books.forEach((item: InspirationItem) => {
          items.push({
            id: item.id,
            title: item.title,
            description: item.description,
            author: item.author,
            link: item.link,
            type: 'books',
            inspirationItem: item,
          })
        })
      }

      // Inspiration articles
      if (inspirationData.articles) {
        inspirationData.articles.forEach((item: InspirationItem) => {
          items.push({
            id: item.id,
            title: item.title,
            description: item.description,
            author: item.author,
            link: item.link,
            type: 'inspiration-articles',
            inspirationItem: item,
          })
        })
      }

      // Videos
      if (inspirationData.videos) {
        inspirationData.videos.forEach((item: InspirationItem) => {
          items.push({
            id: item.id,
            title: item.title,
            description: item.description,
            author: item.author,
            link: item.link,
            type: 'videos',
            inspirationItem: item,
          })
        })
      }
    }

    return items
  }

  const getFilteredItems = (): LibraryItem[] => {
    const allItems = getAllItems()
    if (filterType === 'all') return allItems
    return allItems.filter(item => item.type === filterType)
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

  const handleItemClick = (item: LibraryItem, e: React.MouseEvent) => {
    // Blog articles still navigate to full page
    if (item.type === 'blog') {
      return // Let Link handle it
    }
    
    // Questions, small things, and inspiration items open modal
    e.preventDefault()
    setModalItem(item)
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
    <>
      <article className="min-h-screen bg-background pt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <header className="mb-12">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-text-primary mb-6">
              Inspirace
            </h1>
            <p className="text-lg md:text-xl text-text-secondary max-w-3xl leading-relaxed">
              Všechny zdroje inspirace - blog, knihy, články a videa, které ti mohou pomoci na cestě ke smysluplnému životu.
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
                onClick={() => setFilterType('blog')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterType === 'blog'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-text-primary border border-primary-200 hover:bg-primary-50'
                }`}
              >
                Blog
              </button>
              <button
                onClick={() => setFilterType('books')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterType === 'books'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-text-primary border border-primary-200 hover:bg-primary-50'
                }`}
              >
                Knihy
              </button>
              <button
                onClick={() => setFilterType('inspiration-articles')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterType === 'inspiration-articles'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-text-primary border border-primary-200 hover:bg-primary-50'
                }`}
              >
                Články
              </button>
              <button
                onClick={() => setFilterType('videos')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterType === 'videos'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-text-primary border border-primary-200 hover:bg-primary-50'
                }`}
              >
                Videa
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
                const isBlog = item.type === 'blog'
                const href = isBlog ? `/clanky/${item.slug}` : '#'

                // Get video thumbnail or URL image
                const videoInfo = item.type === 'videos' && item.link ? getVideoInfo(item.link) : null
                const displayImage = item.image || 
                  (videoInfo?.thumbnailUrl) || 
                  (item.type === 'books' || item.type === 'inspiration-articles' ? (item.link ? getUrlImage(item.link) : null) : null)

                const content = (
                  <div className="bg-white rounded-lg border-2 border-primary-100 p-6 hover:border-primary-300 transition-all duration-300 h-full flex flex-col cursor-pointer">
                    {displayImage ? (
                      <ItemImage 
                        src={displayImage}
                        alt={item.title}
                        type={item.type}
                        videoInfo={videoInfo}
                      />
                    ) : (
                      item.type === 'books' && (
                        <div className="w-full h-48 mb-4 rounded-lg bg-primary-100 flex items-center justify-center">
                          <Book className="text-primary-600" size={64} />
                        </div>
                      )
                    )}
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
                        {item.createdAt && (
                          <p className="text-xs text-text-light mb-2">
                            {new Date(item.createdAt).toLocaleDateString('cs-CZ')}
                          </p>
                        )}
                      </div>
                    </div>

                    {item.description && (
                      <p className="text-sm text-text-secondary mb-4 line-clamp-3 flex-1">
                        {item.description}
                      </p>
                    )}

                    <div className="mt-auto">
                      <span className="inline-flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 transition-colors">
                        <span>Zobrazit</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    </div>
                  </div>
                )

                return (
                  <div key={item.id} id={`item-${item.id}`}>
                    {isBlog ? (
                      <Link href={href}>
                        {content}
                      </Link>
                    ) : (
                      <div onClick={(e) => handleItemClick(item, e)}>
                        {content}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </article>

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

              {/* Question content */}
              {modalItem.type === 'questions' && modalItem.questionData && (
                <div className="prose prose-sm max-w-none text-text-secondary leading-relaxed">
                  {modalItem.questionData.description && (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {modalItem.questionData.description}
                    </ReactMarkdown>
                  )}
                </div>
              )}

              {/* Small thing content */}
              {modalItem.type === 'small-things' && modalItem.smallThingData && (
                <div className="space-y-4">
                  {modalItem.smallThingData.how && (
                    <div>
                      <p className="text-base md:text-lg font-semibold text-text-primary mb-2">Jak?</p>
                      <div className="text-sm text-text-secondary leading-relaxed prose prose-sm max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {modalItem.smallThingData.how}
                        </ReactMarkdown>
                      </div>
                    </div>
                  )}
                  {modalItem.smallThingData.why && (
                    <div>
                      <p className="text-base md:text-lg font-semibold text-text-primary mb-2">Proč?</p>
                      <div className="text-sm text-text-secondary leading-relaxed prose prose-sm max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {modalItem.smallThingData.why}
                        </ReactMarkdown>
                      </div>
                    </div>
                  )}
                </div>
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
    </>
  )
}

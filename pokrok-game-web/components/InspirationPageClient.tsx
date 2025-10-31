'use client'

import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { Article, Category, InspirationIcon } from '@/lib/cms'
import InspirationIconComponent from '@/components/InspirationIcon'
import { useState, useEffect } from 'react'

interface InspirationPageProps {
  articles: Article[]
  categories: Category[]
}

export default function InspirationPageClient({ articles, categories }: InspirationPageProps) {
  const [filteredArticles, setFilteredArticles] = useState(articles)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<InspirationIcon | 'all'>('all')

  // Icon types for filtering
  const iconTypes = [
    { value: 'all', label: 'Všechny typy' },
    { value: 'book', label: 'Knihy' },
    { value: 'video', label: 'Videa' },
    { value: 'article', label: 'Články' },
    { value: 'webpage', label: 'Webové stránky' },
    { value: 'application', label: 'Aplikace' },
    { value: 'thought', label: 'Myšlenky' }
  ]

  // Filter articles based on selected category and type
  const filterArticles = () => {
    let filtered = articles

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(article => 
        article.categories.includes(selectedCategory)
      )
    }

    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter(article => article.icon === selectedType)
    }

    setFilteredArticles(filtered)
  }

  // Update filtered articles when filters change
  useEffect(() => {
    filterArticles()
  }, [selectedCategory, selectedType, articles])

  // Dynamic styling functions
  const getHoverTextColor = (icon: InspirationIcon) => {
    switch (icon) {
      case 'book':
        return 'group-hover:text-orange-700'
      case 'video':
        return 'group-hover:text-red-700'
      case 'article':
        return 'group-hover:text-amber-700'
      case 'webpage':
        return 'group-hover:text-purple-700'
      case 'application':
        return 'group-hover:text-indigo-700'
      case 'downloadable':
        return 'group-hover:text-green-700'
      case 'thought':
        return 'group-hover:text-gray-700'
      default:
        return 'group-hover:text-gray-700'
    }
  }

  const getCategoryHoverColor = (icon: InspirationIcon) => {
    switch (icon) {
      case 'book':
        return 'group-hover:text-orange-600'
      case 'video':
        return 'group-hover:text-red-600'
      case 'article':
        return 'group-hover:text-amber-600'
      case 'webpage':
        return 'group-hover:text-purple-600'
      case 'application':
        return 'group-hover:text-indigo-700'
      case 'downloadable':
        return 'group-hover:text-green-600'
      case 'thought':
        return 'group-hover:text-gray-600'
      default:
        return 'group-hover:text-gray-600'
    }
  }

  const getCardBackground = (icon: InspirationIcon) => {
    switch (icon) {
      case 'book':
        return 'bg-[#FFFAF5] group-hover:from-orange-50 group-hover:to-orange-100/50'
      case 'video':
        return 'bg-[#FFFAF5] group-hover:from-red-50 group-hover:to-red-100/50'
      case 'article':
        return 'bg-[#FFFAF5] group-hover:from-amber-50 group-hover:to-amber-100/50'
      case 'webpage':
        return 'bg-[#FFFAF5] group-hover:from-purple-50 group-hover:to-purple-100/50'
      case 'application':
        return 'bg-[#FFFAF5] group-hover:from-indigo-50 group-hover:to-indigo-100/50'
      case 'thought':
        return 'bg-[#FFFAF5] group-hover:from-gray-50 group-hover:to-gray-100/50'
      default:
        return 'bg-[#FFFAF5] group-hover:from-gray-50 group-hover:to-gray-100/50'
    }
  }

  const getCardBorder = (icon: InspirationIcon) => {
    switch (icon) {
      case 'book':
        return 'border border-transparent group-hover:border-orange-300'
      case 'video':
        return 'border border-transparent group-hover:border-red-300'
      case 'article':
        return 'border border-transparent group-hover:border-amber-300'
      case 'webpage':
        return 'border border-transparent group-hover:border-purple-300'
      case 'application':
        return 'border border-transparent group-hover:border-indigo-300'
      case 'thought':
        return 'border border-transparent group-hover:border-gray-300'
      default:
        return 'border border-transparent group-hover:border-gray-300'
    }
  }

  const getHoverOverlay = (icon: InspirationIcon) => {
    switch (icon) {
      case 'book':
        return 'from-orange-200/10 to-orange-300/10'
      case 'video':
        return 'from-red-200/10 to-red-300/10'
      case 'article':
        return 'from-amber-200/10 to-amber-300/10'
      case 'webpage':
        return 'from-purple-200/10 to-purple-300/10'
      case 'application':
        return 'from-indigo-200/10 to-indigo-300/10'
      case 'thought':
        return 'from-gray-200/10 to-gray-300/10'
      default:
        return 'from-gray-200/10 to-gray-300/10'
    }
  }

  const getIconContainer = (icon: InspirationIcon) => {
    switch (icon) {
      case 'book':
        return 'bg-orange-100/50 group-hover:bg-orange-200/70 border border-orange-200 group-hover:border-orange-300'
      case 'video':
        return 'bg-red-100/50 group-hover:bg-red-200/70 border border-red-200 group-hover:border-red-300'
      case 'article':
        return 'bg-amber-100/50 group-hover:bg-amber-200/70 border border-amber-200 group-hover:border-amber-300'
      case 'webpage':
        return 'bg-purple-100/50 group-hover:bg-purple-200/70 border border-purple-200 group-hover:border-purple-300'
      case 'application':
        return 'bg-indigo-100/50 group-hover:bg-indigo-200/70 border border-indigo-200 group-hover:border-indigo-300'
      case 'thought':
        return 'bg-gray-100/50 group-hover:bg-gray-200/70 border border-gray-200 group-hover:border-gray-300'
      default:
        return 'bg-gray-100/50 group-hover:bg-gray-200/70 border border-gray-200 group-hover:border-gray-300'
    }
  }

  const getCardShape = (icon: InspirationIcon) => {
    return 'rounded-xl'
  }

  const getCardElements = (icon: InspirationIcon) => {
    switch (icon) {
      case 'book':
        return {
          progressBar: 'absolute bottom-0 left-0 right-0 h-1 bg-orange-200 rounded-b-xl group-hover:bg-orange-300 transition-colors duration-300'
        }
      case 'video':
        return {
          progressBar: 'absolute bottom-0 left-0 right-0 h-1 bg-red-200 rounded-b-xl group-hover:bg-red-300 transition-colors duration-300'
        }
      case 'article':
        return {
          progressBar: 'absolute bottom-0 left-0 right-0 h-1 bg-amber-200 rounded-b-xl group-hover:bg-amber-300 transition-colors duration-300'
        }
      case 'webpage':
        return {
          progressBar: 'absolute bottom-0 left-0 right-0 h-1 bg-purple-200 rounded-b-xl group-hover:bg-purple-300 transition-colors duration-300'
        }
      case 'application':
        return {
          progressBar: 'absolute bottom-0 left-0 right-0 h-1 bg-indigo-200 rounded-b-xl group-hover:bg-indigo-300 transition-colors duration-300'
        }
      case 'thought':
        return {
          progressBar: 'absolute bottom-0 left-0 right-0 h-1 bg-gray-200 rounded-b-xl group-hover:bg-gray-300 transition-colors duration-300'
        }
      default:
        return {
          progressBar: 'absolute bottom-0 left-0 right-0 h-1 bg-gray-200 rounded-b-xl group-hover:bg-gray-300 transition-colors duration-300'
        }
    }
  }

  return (
    <main className="min-h-screen bg-[#FFFAF5]" style={{
      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.15'/%3E%3C/svg%3E")`,
      backgroundRepeat: 'repeat',
      backgroundSize: '100px 100px'
    }}>
      <Header />
      
      {/* Minimal Header */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-text-primary mb-4">
              Inspirace
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Knihy, články, videa a další zdroje inspirace
            </p>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 justify-center">
            {/* Category Filter */}
            <div className="flex flex-col sm:flex-row gap-2">
              <label className="text-sm font-medium text-gray-700 self-center">Kategorie:</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
              >
                <option value="all">Všechny kategorie</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Type Filter */}
            <div className="flex flex-col sm:flex-row gap-2">
              <label className="text-sm font-medium text-gray-700 self-center">Typ:</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as InspirationIcon | 'all')}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
              >
                {iconTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Inspirations Grid */}
      <section className="pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {filteredArticles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredArticles.map((article: Article) => (
                <Link
                  key={article.id}
                  href={`/inspirace/${article.slug}`}
                  className="group"
                >
                  <div className={`${getCardBackground(article.icon)} ${getCardShape(article.icon)} p-6 border-2 ${getCardBorder(article.icon)} relative overflow-hidden`}>
                    {/* Icon-based overlay on hover */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${getHoverOverlay(article.icon)} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                    
                    {/* Card-specific visual elements */}
                    <div className={(getCardElements(article.icon) as any).progressBar}></div>
                    
                    <div className="relative z-10">
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0 mt-1">
                          <div className={`p-3 rounded-xl bg-gradient-to-br ${getIconContainer(article.icon)} shadow-sm group-hover:shadow-lg group-hover:scale-105 transition-all duration-300 video-animation`}>
                            <InspirationIconComponent type={article.icon} size="md" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className={`text-h4 text-text-primary transition-colors line-clamp-2 group-hover:text-gray-900 ${getHoverTextColor(article.icon)}`}>
                            {article.title}
                          </h3>
                          <p className="text-sm text-gray-600 mt-2 line-clamp-3 leading-relaxed">
                            {article.detail}
                          </p>
                          <div className="flex items-center justify-between mt-4">
                            <div className="flex flex-wrap gap-2">
                              <span className={`text-xs font-medium text-gray-500 ${getCategoryHoverColor(article.icon)} transition-colors duration-200`}>
                                {article.categories.map((categoryId, index) => {
                                  const category = categories.find(cat => cat.id === categoryId)
                                  return (category?.name || categoryId) + (index < article.categories.length - 1 ? ', ' : '')
                                }).join('')}
                              </span>
                            </div>
                            {article.resource && (
                              <span className="text-sm font-medium text-primary-600 group-hover:text-primary-700 flex items-center gap-1 transition-colors duration-200">
                                <svg className="w-4 h-4 transform group-hover:translate-x-0.5 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <h3 className="text-xl font-semibold text-text-primary mb-2">Žádné inspirace nenalezeny</h3>
              <p className="text-gray-600">Zkuste změnit filtry nebo se vraťte později.</p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  )
}

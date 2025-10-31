'use client'

import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { Article, Category, InspirationIcon, ExperienceLevel } from '@/lib/cms'
import InspirationIconComponent from '@/components/InspirationIcon'
import { useState, useEffect } from 'react'
import { Book, Video, FileText, Lightbulb, Smartphone, Download, MoreHorizontal } from 'lucide-react'

interface MaterialyPageProps {
  articles: Article[]
  categories: Category[]
}

export default function MaterialyPageClient({ articles, categories }: MaterialyPageProps) {
  const [filteredArticles, setFilteredArticles] = useState(articles)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<InspirationIcon | 'all'>('all')
  const [selectedExperienceLevel, setSelectedExperienceLevel] = useState<ExperienceLevel | 'all'>('all')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Experience levels for filtering
  const experienceLevels = [
    { value: 'all', label: 'Všechny úrovně', icon: '🎯', color: 'gray' },
    { value: 'beginner', label: 'Začátečník', icon: '🟢', color: 'green' },
    { value: 'intermediate', label: 'Pokročilý', icon: '🟡', color: 'yellow' }
  ]

  // Icon types for filtering
  const iconTypes = [
    { value: 'all', label: 'Všechny typy', icon: null, color: null },
    { value: 'book', label: 'Knihy', icon: Book, color: 'text-primary-500' },
    { value: 'article', label: 'Články', icon: FileText, color: 'text-amber-600' },
    { value: 'video', label: 'Videa', icon: Video, color: 'text-red-600' },
    { value: 'application', label: 'Aplikace', icon: Smartphone, color: 'text-indigo-600' },
    { value: 'thought', label: 'Myšlenky', icon: Lightbulb, color: 'text-slate-600' },
    { value: 'downloadable', label: 'Ke stažení', icon: Download, color: 'text-green-600' }
  ]

  // Quick filter options
  const quickFilters = [
    { value: 'all', label: 'Všechny materiály', icon: '📚' },
    { value: 'downloadable', label: 'Ke stažení', icon: '📥' },
    { value: 'external', label: 'Externí zdroje', icon: '🌐' },
    { value: 'inspiration', label: 'Inspirace', icon: '💡' },
    { value: 'featured', label: 'Doporučené', icon: '⭐' }
  ]

  // Filter articles based on selected filters
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
      if (selectedType === 'downloadable') {
        // Filter for downloadable materials
        filtered = filtered.filter(article => article.isDownloadable || ['pdf', 'workbook', 'template', 'checklist', 'guide'].includes(article.icon))
      } else {
        filtered = filtered.filter(article => article.icon === selectedType)
      }
    }

    // Filter by experience level
    if (selectedExperienceLevel !== 'all') {
      filtered = filtered.filter(article => article.experienceLevel === selectedExperienceLevel)
    }

    setFilteredArticles(filtered)
  }

  // Update filtered articles when filters change
  useEffect(() => {
    filterArticles()
  }, [selectedCategory, selectedType, selectedExperienceLevel, articles])

  // Dynamic styling functions
  const getHoverTextColor = (icon: InspirationIcon) => {
    switch (icon) {
      case 'book':
        return 'group-hover:text-orange-700'
      case 'video':
        return 'group-hover:text-red-700'
      case 'article':
        return 'group-hover:text-amber-700'
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
      case 'application':
        return 'bg-[#FFFAF5] group-hover:from-indigo-50 group-hover:to-indigo-100/50'
      case 'downloadable':
        return 'bg-[#FFFAF5] group-hover:from-green-50 group-hover:to-green-100/50'
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
      case 'application':
        return 'border border-transparent group-hover:border-indigo-300'
      case 'downloadable':
        return 'border border-transparent group-hover:border-green-300'
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
      case 'application':
        return 'from-indigo-200/10 to-indigo-300/10'
      case 'downloadable':
        return 'from-green-200/10 to-green-300/10'
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
      case 'application':
        return 'bg-indigo-100/50 group-hover:bg-indigo-200/70 border border-indigo-200 group-hover:border-indigo-300'
      case 'downloadable':
        return 'bg-green-100/50 group-hover:bg-green-200/70 border border-green-200 group-hover:border-green-300'
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
      case 'application':
        return {
          progressBar: 'absolute bottom-0 left-0 right-0 h-1 bg-indigo-200 rounded-b-xl group-hover:bg-indigo-300 transition-colors duration-300'
        }
      case 'downloadable':
        return {
          progressBar: 'absolute bottom-0 left-0 right-0 h-1 bg-green-200 rounded-b-xl group-hover:bg-green-300 transition-colors duration-300'
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
      
      {/* Header */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-text-primary mb-4">
              Inspirace a materiály
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Inspirace, průvodci, PDF dokumenty a další zdroje pro váš osobní rozvoj
            </p>
          </div>
        </div>
      </section>

      {/* Mobile Filter Toggle */}
      <section className="lg:hidden pb-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full bg-white border border-primary-200 rounded-lg px-4 py-3 text-left flex items-center justify-between hover:bg-primary-50 transition-colors"
          >
            <span className="font-medium text-primary-900">Filtry</span>
            <svg className={`w-5 h-5 transform transition-transform text-primary-600 ${sidebarOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </section>

      {/* Main Content with Sidebar */}
      <section className="pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-8">
            {/* Left Sidebar - Filters */}
            <div className={`w-64 flex-shrink-0 ${sidebarOpen ? 'block' : 'hidden'} lg:block`}>
              <div className="bg-[#FFFAF5] rounded-lg shadow-sm border border-gray-200 p-4 sticky top-24">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Filtry</h3>
                
                {/* Experience Level Filter */}
                <div className="mb-6">
                  <h4 className="text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide">Úroveň</h4>
                  <div className="space-y-1">
                    {/* All levels option - full width */}
                    <button
                      onClick={() => setSelectedExperienceLevel('all')}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                        selectedExperienceLevel === 'all'
                          ? 'bg-primary-100 text-primary-800 border border-primary-300'
                          : 'text-gray-600 hover:bg-primary-50'
                      }`}
                    >
                      Všechny úrovně
                    </button>
                    {/* Specific levels - 2 columns */}
                    <div className="grid grid-cols-2 gap-1">
                      {experienceLevels.slice(1).map((level) => (
                        <button
                          key={level.value}
                          onClick={() => setSelectedExperienceLevel(level.value as ExperienceLevel | 'all')}
                          className={`text-center px-2 py-2 rounded-md text-xs transition-colors ${
                            selectedExperienceLevel === level.value
                              ? 'bg-primary-100 text-primary-800 border border-primary-300'
                              : 'text-gray-600 hover:bg-primary-50'
                          }`}
                        >
                          <div className="text-sm mb-1">{level.icon}</div>
                          <div className="text-xs leading-tight">{level.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Type Filter */}
                <div className="mb-6">
                  <h4 className="text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide">Typ</h4>
                  <div className="space-y-1">
                    {/* All types option - full width */}
                    <button
                      onClick={() => setSelectedType('all')}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                        selectedType === 'all'
                          ? 'bg-primary-100 text-primary-800 border border-primary-300'
                          : 'text-gray-600 hover:bg-primary-50'
                      }`}
                    >
                      Všechny typy
                    </button>
                    {/* Specific types - 2 columns */}
                    <div className="grid grid-cols-2 gap-1">
                      {iconTypes.slice(1).map((type) => {
                        const IconComponent = type.icon
                        return (
                          <button
                            key={type.value}
                            onClick={() => setSelectedType(type.value as InspirationIcon | 'all')}
                            className={`text-center px-2 py-2 rounded-md text-xs transition-colors ${
                              selectedType === type.value
                                ? 'bg-primary-100 text-primary-800 border border-primary-300'
                                : 'text-gray-600 hover:bg-primary-50'
                            }`}
                          >
                            <div className="flex justify-center mb-1">
                              {IconComponent && <IconComponent className={`w-4 h-4 ${type.color}`} />}
                            </div>
                            <div className="text-xs leading-tight">{type.label}</div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* Category Filter */}
                <div className="mb-4">
                  <h4 className="text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide">Kategorie</h4>
                  <div className="space-y-1">
                    <button
                      onClick={() => setSelectedCategory('all')}
                        className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                          selectedCategory === 'all'
                            ? 'bg-primary-100 text-primary-800 border border-primary-300'
                            : 'text-gray-600 hover:bg-primary-50'
                        }`}
                    >
                      Všechny
                    </button>
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                          selectedCategory === category.id
                            ? 'bg-primary-100 text-primary-800 border border-primary-300'
                            : 'text-gray-600 hover:bg-primary-50'
                        }`}
                      >
                        {category.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Reset Filters */}
                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setSelectedCategory('all')
                      setSelectedType('all')
                      setSelectedExperienceLevel('all')
                    }}
                    className="w-full text-center text-xs text-gray-500 hover:text-gray-700 py-2"
                  >
                    Vymazat filtry
                  </button>
                </div>
              </div>
            </div>

            {/* Main Content - Materials Grid */}
            <div className="flex-1 min-w-0">
              {/* Results Counter */}
              <div className="mb-6">
                <p className="text-sm text-gray-600">
                  {filteredArticles.length === articles.length 
                    ? `Zobrazeno ${filteredArticles.length} materiálů`
                    : `Nalezeno ${filteredArticles.length} z ${articles.length} materiálů`
                  }
                </p>
              </div>
              
          {filteredArticles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredArticles.map((article: Article) => (
                <Link
                  key={article.id}
                  href={`/materialy/${article.slug}`}
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
                            <div className="flex items-center gap-2">
                              {/* Experience Level Indicator */}
                              {article.experienceLevel && (
                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                  article.experienceLevel === 'beginner' 
                                    ? 'bg-green-100 text-green-800' 
                                    : article.experienceLevel === 'intermediate'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {article.experienceLevel === 'beginner' ? '🟢 Začátečník' :
                                   article.experienceLevel === 'intermediate' ? '🟡 Pokročilý' : '🔴 Expert'}
                                </span>
                              )}
                              {article.isDownloadable && (
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                  Ke stažení
                                </span>
                              )}
                              {(article.resource || article.downloadUrl) && (
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
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <h3 className="text-xl font-semibold text-text-primary mb-2">Žádné materiály nenalezeny</h3>
              <p className="text-gray-600">Zkuste změnit filtry nebo se vraťte později.</p>
            </div>
          )}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}

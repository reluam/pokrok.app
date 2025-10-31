'use client'

import { ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import { Article, Category, InspirationIcon } from '@/lib/cms'
import InspirationIconComponent from '@/components/InspirationIcon'

interface InspirationProps {
  articles: Article[]
  categories: Category[]
}

export default function Inspiration({ articles, categories }: InspirationProps) {

  // Function to get hover text color based on icon type
  const getHoverTextColor = (icon: InspirationIcon) => {
    const colorMap = {
      book: 'group-hover:text-primary-700',
      video: 'group-hover:text-red-600',
      article: 'group-hover:text-amber-700',
      thought: 'group-hover:text-slate-700',
      webpage: 'group-hover:text-purple-600',
      application: 'group-hover:text-indigo-700',
      downloadable: 'group-hover:text-green-600',
      other: 'group-hover:text-gray-600'
    }
    return colorMap[icon] || 'group-hover:text-primary-600'
  }

  // Function to get category hover color based on icon type
  const getCategoryHoverColor = (icon: InspirationIcon) => {
    const colorMap = {
      book: 'group-hover:text-primary-600',
      video: 'group-hover:text-red-600',
      article: 'group-hover:text-amber-600',
      thought: 'group-hover:text-slate-600',
      webpage: 'group-hover:text-purple-600',
      application: 'group-hover:text-indigo-700',
      downloadable: 'group-hover:text-green-600',
      other: 'group-hover:text-gray-600'
    }
    return colorMap[icon] || 'group-hover:text-primary-600'
  }

  // Function to get card background colors based on icon type
  const getCardBackground = (icon: InspirationIcon) => {
    const colorMap = {
      book: 'bg-[#FFFAF5] group-hover:from-orange-50 group-hover:to-orange-100/50',
      video: 'bg-[#FFFAF5] group-hover:from-red-50 group-hover:to-red-100/50',
      article: 'bg-[#FFFAF5] group-hover:from-amber-50 group-hover:to-amber-100/50',
      thought: 'bg-[#FFFAF5] group-hover:from-slate-100 group-hover:to-slate-200',
      webpage: 'bg-[#FFFAF5] group-hover:from-purple-50 group-hover:to-purple-100/50',
      application: 'bg-[#FFFAF5] group-hover:from-indigo-50 group-hover:to-indigo-100/50',
      downloadable: 'bg-[#FFFAF5] group-hover:from-green-50 group-hover:to-green-100/50',
      other: 'bg-[#FFFAF5] group-hover:from-gray-50 group-hover:to-gray-100/50'
    }
    return colorMap[icon] || 'bg-[#FFFAF5] group-hover:from-orange-50 group-hover:to-amber-100/50'
  }

  // Function to get card border colors based on icon type
  const getCardBorder = (icon: InspirationIcon) => {
    const colorMap = {
      book: 'border border-transparent group-hover:border-orange-300',
      video: 'border border-transparent group-hover:border-red-300',
      article: 'border border-transparent group-hover:border-amber-300',
      thought: 'border border-transparent group-hover:border-slate-300',
      webpage: 'border border-transparent group-hover:border-purple-300',
      application: 'border border-transparent group-hover:border-indigo-300',
      downloadable: 'border border-transparent group-hover:border-green-300',
      other: 'border border-transparent group-hover:border-gray-300'
    }
    return colorMap[icon] || 'border border-transparent group-hover:border-orange-300'
  }

  // Function to get hover overlay colors based on icon type
  const getHoverOverlay = (icon: InspirationIcon) => {
    const colorMap = {
      book: 'from-orange-200/10 to-orange-300/10',
      video: 'from-red-200/10 to-red-300/10',
      article: 'from-amber-200/10 to-amber-300/10',
      thought: 'from-slate-200/10 to-slate-300/10',
      webpage: 'from-purple-200/10 to-purple-300/10',
      application: 'from-indigo-200/10 to-indigo-300/10',
      downloadable: 'from-green-200/10 to-green-300/10',
      other: 'from-gray-200/10 to-gray-300/10'
    }
    return colorMap[icon] || 'from-orange-200/10 to-amber-300/10'
  }

  // Function to get icon container colors based on icon type
  const getIconContainer = (icon: InspirationIcon) => {
    const colorMap = {
      book: 'bg-orange-100/50 group-hover:bg-orange-200/70 border border-orange-200 group-hover:border-orange-300',
      video: 'bg-red-100/50 group-hover:bg-red-200/70 border border-red-200 group-hover:border-red-300',
      article: 'bg-amber-100/50 group-hover:bg-amber-200/70 border border-amber-200 group-hover:border-amber-300',
      thought: 'bg-slate-100/50 group-hover:bg-slate-200/70 border border-slate-200 group-hover:border-slate-300',
      webpage: 'bg-purple-100/50 group-hover:bg-purple-200/70 border border-purple-200 group-hover:border-purple-300',
      application: 'bg-indigo-100/50 group-hover:bg-indigo-200/70 border border-indigo-200 group-hover:border-indigo-300',
      downloadable: 'bg-green-100/50 group-hover:bg-green-200/70 border border-green-200 group-hover:border-green-300',
      other: 'bg-gray-100/50 group-hover:bg-gray-200/70 border border-gray-200 group-hover:border-gray-300'
    }
    return colorMap[icon] || 'bg-orange-100/50 group-hover:bg-orange-200/70 border border-orange-200 group-hover:border-orange-300'
  }

  // Function to get category tag colors based on icon type
  const getCategoryColors = (icon: InspirationIcon) => {
    const colorMap = {
      book: 'bg-orange-100/70 group-hover:bg-orange-200/90 group-hover:text-orange-900 border border-orange-200 group-hover:border-orange-300',
      video: 'bg-red-100/70 group-hover:bg-red-200/90 group-hover:text-red-900 border border-red-200 group-hover:border-red-300',
      article: 'bg-amber-100/70 group-hover:bg-amber-200/90 group-hover:text-amber-900 border border-amber-200 group-hover:border-amber-300',
      thought: 'bg-slate-100/70 group-hover:bg-slate-200/90 group-hover:text-slate-900 border border-slate-200 group-hover:border-slate-300',
      webpage: 'bg-purple-100/70 group-hover:bg-purple-200/90 group-hover:text-purple-900 border border-purple-200 group-hover:border-purple-300',
      application: 'bg-indigo-100/70 group-hover:bg-indigo-200/90 group-hover:text-indigo-900 border border-indigo-200 group-hover:border-indigo-300',
      downloadable: 'bg-green-100/70 group-hover:bg-green-200/90 group-hover:text-green-900 border border-green-200 group-hover:border-green-300',
      other: 'bg-gray-100/70 group-hover:bg-gray-200/90 group-hover:text-gray-900 border border-gray-200 group-hover:border-gray-300'
    }
    return colorMap[icon] || 'bg-orange-100/70 group-hover:bg-orange-200/90 group-hover:text-orange-900 border border-orange-200 group-hover:border-orange-300'
  }

  // Function to get card shape and styling based on icon type
  const getCardShape = (icon: InspirationIcon) => {
    const shapeMap = {
      book: 'rounded-xl shadow-sm hover:shadow-md transform hover:scale-102 transition-all duration-300',
      video: 'rounded-xl shadow-sm hover:shadow-md transform hover:scale-102 transition-all duration-300',
      article: 'rounded-xl shadow-sm hover:shadow-md transform hover:scale-102 transition-all duration-300',
      thought: 'rounded-xl shadow-sm hover:shadow-md transform hover:scale-102 transition-all duration-300',
      webpage: 'rounded-xl shadow-sm hover:shadow-md transform hover:scale-102 transition-all duration-300',
      application: 'rounded-xl shadow-sm hover:shadow-md transform hover:scale-102 transition-all duration-300',
      downloadable: 'rounded-xl shadow-sm hover:shadow-md transform hover:scale-102 transition-all duration-300',
      other: 'rounded-xl shadow-sm hover:shadow-md transform hover:scale-102 transition-all duration-300'
    }
    return shapeMap[icon] || 'rounded-xl shadow-sm hover:shadow-md transform hover:scale-102 transition-all duration-300'
  }

  // Function to get card-specific visual elements
  const getCardElements = (icon: InspirationIcon) => {
    const elementsMap = {
      book: {
        progressBar: 'absolute bottom-0 left-0 right-0 h-1 bg-orange-200 rounded-b-xl group-hover:bg-orange-300 transition-colors duration-300'
      },
      video: {
        progressBar: 'absolute bottom-0 left-0 right-0 h-1 bg-red-200 rounded-b-xl group-hover:bg-red-300 transition-colors duration-300'
      },
      article: {
        progressBar: 'absolute bottom-0 left-0 right-0 h-1 bg-amber-200 rounded-b-xl group-hover:bg-amber-300 transition-colors duration-300'
      },
      thought: {
        progressBar: 'absolute bottom-0 left-0 right-0 h-1 bg-slate-200 rounded-b-xl group-hover:bg-slate-300 transition-colors duration-300'
      },
      webpage: {
        progressBar: 'absolute bottom-0 left-0 right-0 h-1 bg-purple-200 rounded-b-xl group-hover:bg-purple-300 transition-colors duration-300'
      },
      application: {
        progressBar: 'absolute bottom-0 left-0 right-0 h-1 bg-indigo-200 rounded-b-xl group-hover:bg-indigo-300 transition-colors duration-300'
      },
      downloadable: {
        progressBar: 'absolute bottom-0 left-0 right-0 h-1 bg-green-200 rounded-b-xl group-hover:bg-green-300 transition-colors duration-300'
      },
      other: {
        progressBar: 'absolute bottom-0 left-0 right-0 h-1 bg-gray-200 rounded-b-xl group-hover:bg-gray-300 transition-colors duration-300'
      }
    }
    return elementsMap[icon] || {}
  }

  return (
    <section id="inspirace" className="py-20">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-12">
          <div className="mb-8 lg:mb-0">
                <h2 className="text-h2 text-text-primary mb-4">
                  Inspirace
                </h2>
                <p className="text-p18 text-gray-600 max-w-2xl">
                  Explore practical advice and empowering stories to support your personal growth.
                </p>
          </div>
          
          <div>
            <Link
              href="/materialy"
              className="inline-flex items-center space-x-2 bg-primary-500 text-white px-6 py-3 rounded-lg hover:bg-primary-600 transition-colors"
            >
              <span>Zobrazit více</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Featured Inspirations Bibliothèque */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {articles.slice(0, 4).map((article: Article) => (
            <Link
              key={article.id}
              href={`/materialy/${article.slug}`}
              className="group"
            >
               <div className={`${getCardBackground(article.icon)} ${getCardShape(article.icon)} p-6 ${getCardBorder(article.icon)} relative overflow-hidden group`}>
                 {/* Icon-based overlay on hover */}
                 <div className={`absolute inset-0 bg-gradient-to-br ${getHoverOverlay(article.icon)} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                 
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
      </div>
    </section>
  )
}

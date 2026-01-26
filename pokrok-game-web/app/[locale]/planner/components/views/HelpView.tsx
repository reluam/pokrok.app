'use client'

import { useState, useEffect } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { HelpCircle, Target, Footprints, CheckSquare, Plus, ArrowRight, Menu, Rocket, Calendar, Eye, Sparkles, TrendingUp, Clock, Star, Zap, BookOpen, AlertTriangle, Settings, Check, ChevronLeft, ChevronRight, X, LayoutDashboard, Heart, ListTodo, Flame, BarChart3, Edit, Trash2, Briefcase, Smartphone, TrendingUp as TrendingUpIcon, CalendarDays, Navigation, Mail } from 'lucide-react'
import { ContactModal } from '../modals/ContactModal'

interface HelpSection {
  id: string
  title: { cs: string; en: string }
  content: { cs: string; en: string } | null
  component_key: string | null
  sort_order: number
}

interface HelpViewProps {
  onAddGoal?: () => void
  onAddStep?: () => void
  onAddHabit?: () => void
  onNavigateToGoals?: () => void
  onNavigateToHabits?: () => void
  onNavigateToSteps?: () => void
  onNavigateToManagement?: () => void
  onOpenAreasManagement?: () => void
  realGoals?: any[]
  realHabits?: any[]
  realSteps?: any[]
}

type HelpCategory = 'getting-started' | 'overview' | 'navigation' | 'areas' | 'milestones' | 'steps' | 'habits'

// Compact Step Component
function Step({ number, text }: { number: number; text: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 font-playful">{number}</span>
      <span className="text-sm text-black font-playful">{text}</span>
    </div>
  )
}

// Compact Tip Component
function Tip({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-2 text-sm text-gray-600 font-playful font-playful">
      <span className="text-primary-600 mt-0.5">•</span>
      <span>{text}</span>
    </li>
  )
}

// Function to parse Markdown and render it
function renderMarkdownContent(content: string) {
  if (!content) return null
  
  const lines = content.split('\n')
  const elements: JSX.Element[] = []
  let listItems: string[] = []
  let listType: 'ul' | 'ol' | null = null
  let key = 0

  const flushList = () => {
    if (listItems.length > 0 && listType) {
      const ListTag = listType === 'ul' ? 'ul' : 'ol'
      elements.push(
        <ListTag key={key++} className="list-disc list-inside space-y-1 my-2 ml-4">
          {listItems.map((item, i) => (
            <li key={i} className="text-sm text-gray-600 font-playful">
              {parseInlineMarkdown(item)}
            </li>
          ))}
        </ListTag>
      )
      listItems = []
      listType = null
    }
  }

  const parseInlineMarkdown = (text: string) => {
    // Parse bold **text**
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-black">$1</strong>')
    // Parse italic *text*
    text = text.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
    return <span dangerouslySetInnerHTML={{ __html: text }} />
  }

  lines.forEach((line, i) => {
    const trimmed = line.trim()
    
    // Headings
    if (trimmed.startsWith('### ')) {
      flushList()
      elements.push(
        <h3 key={key++} className="font-semibold text-black font-playful mb-2 mt-4 text-base">
          {parseInlineMarkdown(trimmed.substring(4))}
        </h3>
      )
    } else if (trimmed.startsWith('## ')) {
      flushList()
      elements.push(
        <h2 key={key++} className="font-semibold text-black font-playful mb-3 mt-5 text-lg">
          {parseInlineMarkdown(trimmed.substring(3))}
        </h2>
      )
    } else if (trimmed.startsWith('# ')) {
      flushList()
      elements.push(
        <h1 key={key++} className="font-semibold text-black font-playful mb-4 mt-6 text-xl">
          {parseInlineMarkdown(trimmed.substring(2))}
        </h1>
      )
    }
    // Unordered list
    else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      if (listType !== 'ul') {
        flushList()
        listType = 'ul'
      }
      listItems.push(trimmed.substring(2))
    }
    // Ordered list
    else if (/^\d+\.\s/.test(trimmed)) {
      if (listType !== 'ol') {
        flushList()
        listType = 'ol'
      }
      listItems.push(trimmed.replace(/^\d+\.\s/, ''))
    }
    // Empty line
    else if (trimmed === '') {
      flushList()
      if (i > 0 && i < lines.length - 1) {
        elements.push(<br key={key++} />)
      }
    }
    // Regular paragraph
    else {
      flushList()
      elements.push(
        <p key={key++} className="text-sm text-gray-600 font-playful leading-relaxed my-2">
          {parseInlineMarkdown(trimmed)}
        </p>
      )
    }
  })
  
  flushList()
  return elements
}

export function HelpView({
  onAddGoal,
  onAddStep,
  onAddHabit,
  onNavigateToGoals,
  onNavigateToHabits,
  onNavigateToSteps,
  onNavigateToManagement,
  onOpenAreasManagement,
}: HelpViewProps) {
  const t = useTranslations('help')
  const tCommon = useTranslations()
  const tHomepage = useTranslations('homepage')
  const locale = useLocale()
  const [selectedCategory, setSelectedCategory] = useState<HelpCategory>('getting-started')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showContactModal, setShowContactModal] = useState(false)
  const [sections, setSections] = useState<HelpSection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load sections from API when category changes
  useEffect(() => {
    const loadSections = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch(`/api/help/sections?category=${selectedCategory}`)
        if (!response.ok) {
          throw new Error('Failed to load sections')
        }
        const data = await response.json()
        setSections(data)
      } catch (err: any) {
        console.error('Error loading help sections:', err)
        setError(err?.message || 'Failed to load help content')
        setSections([])
      } finally {
        setLoading(false)
      }
    }

    loadSections()
  }, [selectedCategory])

  const categories = [
    { id: 'getting-started' as HelpCategory, label: t('categories.gettingStarted'), icon: Rocket },
    { id: 'overview' as HelpCategory, label: t('categories.views'), icon: Eye },
    { id: 'navigation' as HelpCategory, label: t('categories.navigation'), icon: Navigation },
    { id: 'areas' as HelpCategory, label: t('categories.areas'), icon: LayoutDashboard },
    { id: 'milestones' as HelpCategory, label: t('categories.milestones'), icon: Target },
    { id: 'steps' as HelpCategory, label: t('categories.steps'), icon: Footprints },
    { id: 'habits' as HelpCategory, label: t('categories.habits'), icon: CheckSquare },
  ]

  const days = [
    t('days.mon'), t('days.tue'), t('days.wed'), t('days.thu'), t('days.fri'), t('days.sat'), t('days.sun')
  ]

  const renderContent = () => {
    // If we have sections from API, render them
    if (sections.length > 0) {
      return (
        <div className="space-y-6">
          {sections.map((section) => {
            const title = section.title[locale as 'cs' | 'en'] || section.title.cs || section.title.en
            const content = section.content?.[locale as 'cs' | 'en'] || section.content?.cs || section.content?.en || ''
            
            return (
              <div key={section.id} className="box-playful-highlight p-6">
                <h3 className="font-semibold text-black font-playful mb-4 text-lg">
                  {title}
                </h3>
                {content && (
                  <div className="text-sm text-gray-600 font-playful leading-relaxed">
                    {renderMarkdownContent(content)}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )
    }

    // Fallback to hardcoded content if no sections loaded
    if (loading) {
      return (
        <div className="space-y-6">
          <div className="box-playful-highlight p-6 text-center">
            <p className="text-gray-600">Načítání...</p>
          </div>
        </div>
      )
    }

    if (error) {
      return (
        <div className="space-y-6">
          <div className="box-playful-highlight p-6">
            <p className="text-red-600">Chyba při načítání obsahu: {error}</p>
            <p className="text-sm text-gray-600 mt-2">Obsah se snažíme načíst z databáze. Pokud problém přetrvává, kontaktujte podporu.</p>
          </div>
        </div>
      )
    }

    // Original hardcoded content as fallback
    switch (selectedCategory) {
      case 'getting-started':
        return (
          <div className="space-y-6">
            {/* Hero */}
            <div className="box-playful-highlight-primary p-6">
              <div className="flex items-center gap-3 mb-3">
                <Target className="w-8 h-8 text-primary-600" />
                <h2 className="text-2xl font-bold text-black font-playful text-black font-playful">
                  {tHomepage('hero.title') || 'Životní plánovač pro lidi, kteří chtějí dosáhnout svých cílů'}
                </h2>
              </div>
              <p className="text-gray-600 font-playful text-base leading-relaxed font-playful">
                {tHomepage('hero.description') || 'Pokrok vám pomůže získat jasnost a smysluplnost v tom, jak dosáhnout toho, co v životě chcete. Organizujte své kroky a návyky do oblastí, vytvářejte milníky a sledujte svůj pokrok.'}
              </p>
            </div>

            {/* Getting Started - Practical Steps */}
            <div className="box-playful-highlight p-6">
              <div className="flex items-center gap-3 mb-4">
                <Rocket className="w-6 h-6 text-primary-600" />
                <h3 className="text-2xl font-bold text-black font-playful text-black font-playful">
                  {t('gettingStarted.stepsToSuccess') || '4 kroky k úspěchu'}
                </h3>
              </div>
              <p className="text-gray-600 font-playful mb-6 text-sm font-playful">
                {tHomepage('features.clarity.description') || 'Začněte s praktickými kroky. Vytvořte si oblasti, přidejte kroky a návyky, vytvářejte milníky. Pokrok vám ukáže, na co se soustředit dnes.'}
              </p>
            </div>

            {/* 4 Steps */}
            <div className="space-y-8 mt-6">
              {/* Step 0 - Areas */}
              <div className="box-playful-highlight p-6">
                <div className="mb-4">
                  <h4 className="font-semibold text-black font-playful flex items-center gap-2 mb-4">
                    <LayoutDashboard className="w-5 h-5 text-primary-600" /> {t('gettingStarted.step0.title')}
                  </h4>
                  <div className="text-sm text-gray-600 font-playful leading-relaxed space-y-2 font-playful">
                    {t.rich('gettingStarted.step0.subtitle', {
                      strong: (chunks) => <strong className="text-black font-semibold">{chunks}</strong>
                    })}
                  </div>
                </div>

                {/* Example Areas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {/* Example Area 1 - Health */}
                  <div className="box-playful-highlight p-4 hover:bg-primary-50 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span 
                          className="w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0"
                          style={{ backgroundColor: '#10b981' }}
                        >
                          <Flame className="w-4 h-4 text-white" />
                        </span>
                        <h3 className="text-lg font-semibold text-black font-playful">{locale === 'cs' ? 'Zdraví' : 'Health'}</h3>
                      </div>
                      <div className="flex items-center gap-1">
                        <button className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors text-gray-500 hover:text-gray-600 font-playful font-playful opacity-50 cursor-not-allowed">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 rounded-lg hover:bg-red-100 transition-colors text-gray-500 hover:text-red-600 opacity-50 cursor-not-allowed">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 font-playful mb-3 font-playful">{locale === 'cs' ? 'Zdravotní milníky a návyky' : 'Health milestones and habits'}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-600 font-playful font-playful">
                      <span>2 {locale === 'cs' ? 'MILNÍKY' : 'MILESTONES'}</span>
                      <span>5 {locale === 'cs' ? 'KROKY' : 'STEPS'}</span>
                      <span>3 {tCommon('habits.title') || 'HABITS'}</span>
                    </div>
                  </div>

                  {/* Example Area 2 - Career */}
                  <div className="box-playful-highlight p-4 hover:bg-primary-50 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span 
                          className="w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0"
                          style={{ backgroundColor: '#ea580c' }}
                        >
                          <Briefcase className="w-4 h-4 text-white" />
                        </span>
                        <h3 className="text-lg font-semibold text-black font-playful">{locale === 'cs' ? 'Kariéra' : 'Career'}</h3>
                      </div>
                      <div className="flex items-center gap-1">
                        <button className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors text-gray-500 hover:text-gray-600 font-playful font-playful opacity-50 cursor-not-allowed">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 rounded-lg hover:bg-red-100 transition-colors text-gray-500 hover:text-red-600 opacity-50 cursor-not-allowed">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>3 {locale === 'cs' ? 'MILNÍKY' : 'MILESTONES'}</span>
                      <span>8 {locale === 'cs' ? 'KROKY' : 'STEPS'}</span>
                      <span>1 {tCommon('habits.title') || 'HABITS'}</span>
                    </div>
                  </div>

                  {/* Example Area 3 - Relationships */}
                  <div className="box-playful-highlight p-4 hover:bg-primary-50 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span 
                          className="w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0"
                          style={{ backgroundColor: '#3b82f6' }}
                        >
                          <Heart className="w-4 h-4 text-white" />
                        </span>
                        <h3 className="text-lg font-semibold text-black font-playful">{locale === 'cs' ? 'Vztahy' : 'Relationships'}</h3>
                      </div>
                      <div className="flex items-center gap-1">
                        <button className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors text-gray-500 hover:text-gray-600 font-playful font-playful opacity-50 cursor-not-allowed">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 rounded-lg hover:bg-red-100 transition-colors text-gray-500 hover:text-red-600 opacity-50 cursor-not-allowed">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 font-playful mb-3">{locale === 'cs' ? 'Vztahy s rodinou a přáteli' : 'Family and friends'}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>1 {locale === 'cs' ? 'MILNÍKY' : 'MILESTONES'}</span>
                      <span>2 {locale === 'cs' ? 'KROKY' : 'STEPS'}</span>
                      <span>2 {tCommon('habits.title') || 'HABITS'}</span>
                    </div>
                  </div>

                  {/* Example Area 4 - Personal Growth */}
                  <div className="box-playful-highlight p-4 hover:bg-primary-50 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span 
                          className="w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0"
                          style={{ backgroundColor: '#8b5cf6' }}
                        >
                          <TrendingUpIcon className="w-4 h-4 text-white" />
                        </span>
                        <h3 className="text-lg font-semibold text-black font-playful">{locale === 'cs' ? 'Osobní růst' : 'Personal Growth'}</h3>
                      </div>
                      <div className="flex items-center gap-1">
                        <button className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors text-gray-500 hover:text-gray-600 font-playful font-playful opacity-50 cursor-not-allowed">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 rounded-lg hover:bg-red-100 transition-colors text-gray-500 hover:text-red-600 opacity-50 cursor-not-allowed">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>2 {locale === 'cs' ? 'MILNÍKY' : 'MILESTONES'}</span>
                      <span>4 {locale === 'cs' ? 'KROKY' : 'STEPS'}</span>
                      <span>0 {tCommon('habits.title') || 'HABITS'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  {onOpenAreasManagement && (
                    <button onClick={onOpenAreasManagement} className="btn-playful-base flex-1 flex items-center justify-center gap-1 px-3 py-2 text-primary-600 bg-white hover:bg-primary-50 text-sm font-medium">
                      <Plus className="w-4 h-4" /> {t('gettingStarted.step0.button') || 'Vytvořit oblast'}
                    </button>
                  )}
                  {onNavigateToManagement && (
                    <button onClick={onNavigateToManagement} className="btn-playful-base px-3 py-2 text-primary-600 bg-white hover:bg-primary-50 text-sm">
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Step 2 - Steps */}
              <div className="box-playful-highlight p-6">
                <div className="mb-4">
                  <h4 className="font-semibold text-black font-playful flex items-center gap-2 mb-4">
                    <Footprints className="w-5 h-5 text-primary-600" /> {t('gettingStarted.step2.title')}
                  </h4>
                  <div className="text-sm text-gray-600 font-playful leading-relaxed space-y-2 font-playful">
                    {t.rich('gettingStarted.step2.subtitle', {
                      strong: (chunks) => <strong className="text-black font-semibold">{chunks}</strong>
                    })}
                  </div>
                </div>

                {/* Example Step Cards */}
                <div className="space-y-2 mb-4">
                  <div className="box-playful-highlight flex items-center gap-3 p-3 bg-primary-100">
                    <div className="w-6 h-6 rounded-playful-sm border-2 border-primary-500 bg-primary-500 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                    </div>
                    <span className="flex-1 text-sm font-medium text-primary-600 font-playful">
                      {t('gettingStarted.step2.example1')}
                    </span>
                    <span className="hidden sm:block w-20 text-xs text-center text-primary-600 capitalize font-playful">{t('gettingStarted.step2.today')}</span>
                    <span className="hidden sm:block w-14 text-xs text-gray-600 font-playful text-center font-playful">{t('gettingStarted.step2.example1Time')}</span>
                  </div>
                  <div className="box-playful-highlight flex items-center gap-3 p-3 bg-white">
                    <div className="w-6 h-6 rounded-playful-sm border-2 border-primary-500 flex items-center justify-center flex-shrink-0">
                    </div>
                    <span className="flex-1 text-sm font-medium text-black font-playful">
                      {t('gettingStarted.step2.example2')}
                    </span>
                    <span className="hidden sm:block w-20 text-xs text-center text-gray-600 font-playful capitalize font-playful">{t('gettingStarted.step2.tomorrow')}</span>
                    <span className="hidden sm:block w-14 text-xs text-gray-600 font-playful text-center font-playful">{t('gettingStarted.step2.example2Time')}</span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  {onAddStep && (
                    <button onClick={onAddStep} className="btn-playful-base flex-1 flex items-center justify-center gap-1 px-3 py-2 text-primary-600 bg-white hover:bg-primary-50 text-sm font-medium">
                      <Plus className="w-4 h-4" /> {t('gettingStarted.step2.button')}
                    </button>
                  )}
                  {onNavigateToSteps && (
                    <button onClick={onNavigateToSteps} className="btn-playful-base px-3 py-2 text-primary-600 bg-white hover:bg-primary-50 text-sm">
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Step 3 - Habits */}
              <div className="box-playful-highlight p-6">
                <div className="mb-4">
                  <h4 className="font-semibold text-black font-playful flex items-center gap-2 mb-4">
                    <CheckSquare className="w-5 h-5 text-primary-600" /> {t('gettingStarted.step3.title')}
                  </h4>
                  <div className="text-sm text-gray-600 font-playful leading-relaxed space-y-2 font-playful">
                    {t.rich('gettingStarted.step3.subtitle', {
                      strong: (chunks) => <strong className="text-black font-semibold">{chunks}</strong>
                    })}
                  </div>
                </div>
                
                {/* Example Habit Timeline */}
                <div className="box-playful-highlight p-4 mb-4">
                  {/* Header with day names */}
                  <div className="flex items-center gap-1 mb-2 sm:pl-[100px]">
                    {(() => {
                      const days = [
                        t('days.mon'),
                        t('days.tue'),
                        t('days.wed'),
                        t('days.thu'),
                        t('days.fri'),
                        t('days.sat'),
                        t('days.sun')
                      ]
                      const startDate = 15 // Fixed start date for example
                      return days.map((day, idx) => (
                        <div key={idx} className="w-7 h-7 flex flex-col items-center justify-center text-[9px] rounded text-gray-400 flex-shrink-0">
                          <span className="uppercase leading-none">{day}</span>
                          <span className="text-[8px] leading-none">{startDate + idx}</span>
                        </div>
                      ))
                    })()}
                  </div>
                  
                  {/* Habits with boxes */}
                  <div className="space-y-3 sm:space-y-1">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-1">
                      <button className="text-left text-[11px] font-medium text-gray-600 font-playful hover:text-primary-600 transition-colors font-playful sm:w-[100px] sm:flex-shrink-0">
                        {t('gettingStarted.step3.example1')}
                      </button>
                      <div className="flex gap-1">
                        <div className="w-7 h-7 rounded-playful-sm bg-primary-500 border-2 border-primary-500 flex items-center justify-center flex-shrink-0">
                          <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                        </div>
                        <div className="w-7 h-7 rounded-playful-sm bg-primary-500 border-2 border-primary-500 flex items-center justify-center flex-shrink-0">
                          <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                        </div>
                        <div className="w-7 h-7 rounded-playful-sm bg-primary-100 border-2 border-primary-500 flex-shrink-0"></div>
                        <div className="w-7 h-7 rounded-playful-sm bg-primary-100 border-2 border-primary-500 flex-shrink-0"></div>
                        <div className="w-7 h-7 rounded-playful-sm bg-primary-100 border-2 border-primary-500 flex-shrink-0"></div>
                        <div className="w-7 h-7 rounded-playful-sm bg-primary-100 border-2 border-primary-500 flex-shrink-0"></div>
                        <div className="w-7 h-7 rounded-playful-sm bg-primary-100 border-2 border-primary-500 flex-shrink-0"></div>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-1">
                      <button className="text-left text-[11px] font-medium text-gray-600 font-playful hover:text-primary-600 transition-colors font-playful sm:w-[100px] sm:flex-shrink-0">
                        {t('gettingStarted.step3.example2')}
                      </button>
                      <div className="flex gap-1">
                        <div className="w-7 h-7 rounded-playful-sm bg-primary-500 border-2 border-primary-500 flex items-center justify-center flex-shrink-0">
                          <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                        </div>
                        <div className="w-7 h-7 rounded-playful-sm bg-primary-100 border-2 border-primary-500 flex-shrink-0"></div>
                        <div className="w-7 h-7 rounded-playful-sm bg-primary-100 border-2 border-primary-500 flex-shrink-0"></div>
                        <div className="w-7 h-7 rounded-playful-sm bg-primary-100 border-2 border-primary-500 flex-shrink-0"></div>
                        <div className="w-7 h-7 rounded-playful-sm bg-primary-100 border-2 border-primary-500 flex-shrink-0"></div>
                        <div className="w-7 h-7 rounded-playful-sm bg-primary-100 border-2 border-primary-500 flex-shrink-0"></div>
                        <div className="w-7 h-7 rounded-playful-sm bg-primary-100 border-2 border-primary-500 flex-shrink-0"></div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  {onAddHabit && (
                    <button onClick={onAddHabit} className="btn-playful-base flex-1 flex items-center justify-center gap-1 px-3 py-2 text-primary-600 bg-white hover:bg-primary-50 text-sm font-medium">
                      <Plus className="w-4 h-4" /> {t('gettingStarted.step3.button')}
                    </button>
                  )}
                  {onNavigateToHabits && (
                    <button onClick={onNavigateToHabits} className="btn-playful-base px-3 py-2 text-primary-600 bg-white hover:bg-primary-50 text-sm">
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* What's Next */}
            <div className="box-playful-highlight p-4 mt-6">
              <h4 className="font-semibold text-black font-playful flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-primary-600" /> {t('gettingStarted.whatsNext')}
              </h4>
              <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 font-playful font-playful">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary-600" />
                  <span>{t('gettingStarted.nextItems.dailyOverview')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-primary-600" />
                  <span>{t('gettingStarted.nextItems.completeSteps')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-primary-600" />
                  <span>{t('gettingStarted.nextItems.focusImportant')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary-600" />
                  <span>{t('gettingStarted.nextItems.trackProgress')}</span>
                </div>
              </div>
            </div>
          </div>
        )

      case 'overview':
        return (
          <div className="space-y-6">
            <div className="box-playful-highlight-primary p-6">
              <h2 className="text-2xl font-bold text-black font-playful mb-2">{t('viewsHelp.title') || (locale === 'cs' ? 'Zobrazení' : 'Views')}</h2>
              <p className="text-gray-600 font-playful">{t('viewsHelp.subtitle') || (locale === 'cs' ? 'Čtyři hlavní zobrazení pro různé účely' : 'Four main views for different purposes')}</p>
              </div>

            {/* Upcoming View */}
            <div className="box-playful-highlight p-6">
              <h3 className="font-semibold text-black font-playful mb-4 flex items-center gap-2">
                <ListTodo className="w-5 h-5 text-primary-600" />
                {locale === 'cs' ? '1. Upcoming (Nadcházející)' : '1. Upcoming'}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                {locale === 'cs' 
                  ? 'Zobrazuje všechny nadcházející kroky a návyky. Ideální pro přehled toho, co vás čeká.'
                  : 'Displays all upcoming steps and habits. Ideal for an overview of what\'s ahead.'}
              </p>
              
              {/* View Mode Switcher */}
              <div className="mb-4 p-4 bg-white border-2 border-primary-300 rounded-playful-md">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-semibold text-black">{locale === 'cs' ? 'Přepínač zobrazení:' : 'View mode:'}</span>
                  <div className="flex items-center gap-2 bg-white border-2 border-primary-300 rounded-playful-md p-1">
                    <button className="px-3 py-1 text-sm font-semibold bg-primary-500 text-white rounded-playful-sm">
                      {locale === 'cs' ? 'Feed' : 'Feed'}
                  </button>
                    <button className="px-3 py-1 text-sm font-semibold text-gray-600 rounded-playful-sm">
                      {locale === 'cs' ? 'Oblasti' : 'Areas'}
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-600">
                  {locale === 'cs' 
                    ? 'Feed: kroky seřazené podle data. Oblasti: kroky skupované podle oblastí.'
                    : 'Feed: steps sorted by date. Areas: steps grouped by areas.'}
                </p>
              </div>

              {/* Feed View Example */}
              <div className="space-y-2 mb-4">
                {/* Today's Habits */}
                <div className="p-3 bg-white rounded-playful-md">
                  <p className="text-xs font-medium text-gray-600 mb-2">{locale === 'cs' ? 'Dnešní návyky' : "Today's habits"}</p>
                  <div className="flex flex-wrap gap-2">
                    <div className="flex items-center gap-2 p-2 bg-white rounded-playful-md hover:outline-2 hover:outline hover:outline-primary-500">
                      <div className="w-5 h-5 rounded-playful-sm border-2 border-primary-500 bg-primary-500 flex items-center justify-center">
                                  <Check className="w-3 h-3 text-white" strokeWidth={3} />
                      </div>
                      <span className="text-xs">{locale === 'cs' ? 'Ranní cvičení' : 'Morning exercise'}</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-white rounded-playful-md hover:outline-2 hover:outline hover:outline-primary-500">
                      <div className="w-5 h-5 rounded-playful-sm border-2 border-primary-500"></div>
                      <span className="text-xs">{locale === 'cs' ? 'Čtení' : 'Reading'}</span>
                    </div>
                  </div>
                              </div>
                              
                {/* Steps */}
                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-3 bg-red-50 rounded-playful-md hover:outline-2 hover:outline hover:outline-red-300">
                    <div className="w-6 h-6 rounded-playful-sm border-2 border-primary-500"></div>
                    <div className="flex-1">
                      <span className="text-sm font-medium text-red-600">{locale === 'cs' ? 'Dokončit projekt' : 'Finish project'}</span>
                    </div>
                    <button className="hidden sm:block w-28 text-xs text-center border-2 border-red-300 text-red-600 rounded-playful-sm px-1 py-0.5">
                      ❗{locale === 'cs' ? 'Včera' : 'Yesterday'}
                            </button>
                      </div>
                  <div className="flex items-center gap-3 p-3 bg-white rounded-playful-md hover:outline-2 hover:outline hover:outline-primary-500">
                    <div className="w-6 h-6 rounded-playful-sm border-2 border-primary-500 bg-primary-500 flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                    </div>
                    <div className="flex-1">
                      <span className="text-sm font-medium text-black">{locale === 'cs' ? 'Napsat email' : 'Write email'}</span>
                  </div>
                    <button className="hidden sm:block w-28 text-xs text-center border-2 border-primary-500 text-primary-600 rounded-playful-sm px-1 py-0.5">
                      {locale === 'cs' ? 'Dnes' : 'Today'}
                  </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Overview View */}
            <div className="box-playful-highlight p-6">
              <h3 className="font-semibold text-black font-playful mb-4 flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-primary-600" />
                {locale === 'cs' ? '2. Overview (Přehled)' : '2. Overview'}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                {locale === 'cs' 
                  ? 'Měsíční kalendářní přehled všech kroků a návyků. Slouží pro větší přehled a plánování dopředu.'
                  : 'Monthly calendar overview of all steps and habits. Serves for a larger overview and planning ahead.'}
              </p>
              
              {/* Calendar Example */}
              <div className="p-4 bg-white border-2 border-primary-300 rounded-playful-md">
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'].map((day, i) => (
                    <div key={i} className="text-xs text-center text-gray-500 font-semibold py-1">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: 28 }).map((_, i) => (
                    <div key={i} className={`aspect-square rounded-playful-sm border-2 flex items-center justify-center text-xs ${
                      i === 14 ? 'bg-primary-100 border-primary-500' : 'bg-white border-gray-200'
                    }`}>
                      {i + 1}
                        </div>
                      ))}
                    </div>
                <p className="text-xs text-gray-600 mt-2">
                  {locale === 'cs' 
                    ? 'Kliknutím na den zobrazíte detailní přehled kroků a návyků pro daný den.'
                    : 'Click on a day to view detailed overview of steps and habits for that day.'}
                </p>
                          </div>
                          </div>

            {/* Statistics View */}
            <div className="box-playful-highlight p-6">
              <h3 className="font-semibold text-black font-playful mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary-600" />
                {locale === 'cs' ? '3. Statistics (Statistiky)' : '3. Statistics'}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                {locale === 'cs' 
                  ? 'Roční přehled pokroku. Zobrazuje časovou osu s aktivitami.'
                  : 'Yearly overview of progress. Displays a timeline with activities.'}
              </p>
              
              {/* Statistics Example */}
              <div className="p-4 bg-white border-2 border-primary-300 rounded-playful-md">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Target className="w-5 h-5 text-primary-600" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-black">{locale === 'cs' ? 'Naučit se React' : 'Learn React'}</span>
                        <span className="text-xs text-gray-500">40%</span>
                        </div>
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-primary-500 rounded-full" style={{ width: '40%' }} />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Target className="w-5 h-5 text-primary-600" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-black">{locale === 'cs' ? 'Pravidelně cvičit' : 'Exercise regularly'}</span>
                        <span className="text-xs text-gray-500">75%</span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-primary-500 rounded-full" style={{ width: '75%' }} />
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-600 mt-3">
                  {locale === 'cs' 
                  ? 'Zobrazuje pokrok s vizualizací dokončených kroků.'
                  : 'Shows progress with visualization of completed steps.'}
                </p>
                    </div>
              </div>

            {/* Areas View */}
            <div className="box-playful-highlight p-6">
              <h3 className="font-semibold text-black font-playful mb-4 flex items-center gap-2">
                <LayoutDashboard className="w-5 h-5 text-primary-600" />
                {locale === 'cs' ? '4. Areas (Oblasti)' : '4. Areas'}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                {locale === 'cs' 
                  ? 'Zobrazuje všechny kroky, milníky a návyky, které jsou přiřazené k dané oblasti.'
                  : 'Displays all steps, milestones, and habits that are assigned to a given area.'}
              </p>
              
              {/* Areas Example */}
              <div className="p-4 bg-white border-2 border-primary-300 rounded-playful-md">
                <div className="space-y-3">
                  <div className="p-4 bg-white rounded-playful-md border-2 border-primary-500">
                    <div className="flex items-center gap-2 mb-3">
                      <Target className="w-5 h-5 text-primary-600" />
                      <h5 className="font-semibold text-black">{locale === 'cs' ? 'Kariéra' : 'Career'}</h5>
                </div>
                    <div className="mb-2">
                      <h6 className="text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                        <Target className="w-3 h-3 text-primary-600" />
                        {locale === 'cs' ? 'Povýšení' : 'Promotion'}
                      </h6>
                      <div className="flex items-center gap-3 p-3 bg-white rounded-playful-md">
                        <div className="w-6 h-6 rounded-playful-sm border-2 border-primary-500"></div>
                        <span className="text-sm font-medium text-black">{locale === 'cs' ? 'Dokončit projekt' : 'Finish project'}</span>
                  </div>
                          </div>
                </div>
              </div>
                <p className="text-xs text-gray-600 mt-3">
                  {locale === 'cs' 
                    ? 'Každá oblast má vlastní sekci s milníky a kroky. Kliknutím na oblast v levém menu zobrazíte její obsah.'
                    : 'Each area has its own section with milestones and steps. Click on an area in the left menu to view its content.'}
                </p>
              </div>
            </div>
          </div>
        )

      case 'navigation':
        return (
          <div className="space-y-6">
            <div className="box-playful-highlight-primary p-6">
              <h2 className="text-2xl font-bold text-black font-playful mb-2">{t('navigationHelp.title') || (locale === 'cs' ? 'Navigace' : 'Navigation')}</h2>
              <p className="text-gray-600 font-playful">{t('navigationHelp.subtitle') || (locale === 'cs' ? 'Jak se orientovat v aplikaci a najít potřebné funkce' : 'How to navigate the app and find the features you need')}</p>
            </div>

            {/* Top Menu */}
            <div className="box-playful-highlight p-6">
              <h3 className="font-semibold text-black font-playful mb-4 flex items-center gap-2">
                <Menu className="w-5 h-5 text-primary-600" />
                {locale === 'cs' ? 'Horní menu' : 'Top Menu'}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                {locale === 'cs' 
                  ? 'Horní menu poskytuje rychlý přístup k hlavním sekcím aplikace. Vždy je viditelné v horní části obrazovky.'
                  : 'The top menu provides quick access to main app sections. It\'s always visible at the top of the screen.'}
              </p>
              
              {/* Top Menu Items */}
              <div className="space-y-3 mb-4">
                <div className="p-4 bg-white border-2 border-primary-300 rounded-playful-md">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-primary-100 rounded-playful-md flex items-center justify-center">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                        <polyline points="9,22 9,12 15,12 15,22"/>
                      </svg>
                    </div>
                      <div>
                      <h4 className="font-semibold text-black">{locale === 'cs' ? 'Hlavní panel' : 'Main Panel'}</h4>
                      <p className="text-xs text-gray-600">{locale === 'cs' ? 'Zpět na hlavní přehled s různými zobrazeními' : 'Back to main overview with different views'}</p>
                        </div>
                          </div>
                </div>
                
                <div className="p-4 bg-white border-2 border-primary-300 rounded-playful-md">
                  <div className="flex items-center gap-3 mb-2">
                    <Target className="w-5 h-5 text-primary-600" />
                    <div>
                      <h4 className="font-semibold text-black">{locale === 'cs' ? 'Milníky' : 'Milestones'}</h4>
                      <p className="text-xs text-gray-600">{locale === 'cs' ? 'Důležité body na vaší cestě v rámci oblastí' : 'Important points on your journey within areas'}</p>
                    </div>
                        </div>
                      </div>
                      
                <div className="p-4 bg-white border-2 border-primary-300 rounded-playful-md">
                  <div className="flex items-center gap-3 mb-2">
                    <CheckSquare className="w-5 h-5 text-primary-600" />
                      <div>
                      <h4 className="font-semibold text-black">{locale === 'cs' ? 'Návyky' : 'Habits'}</h4>
                      <p className="text-xs text-gray-600">{locale === 'cs' ? 'Správa a sledování vašich návyků' : 'Manage and track your habits'}</p>
                        </div>
                          </div>
                        </div>
                
                <div className="p-4 bg-white border-2 border-primary-300 rounded-playful-md">
                  <div className="flex items-center gap-3 mb-2">
                    <Footprints className="w-5 h-5 text-primary-600" />
                    <div>
                      <h4 className="font-semibold text-black">{locale === 'cs' ? 'Kroky' : 'Steps'}</h4>
                      <p className="text-xs text-gray-600">{locale === 'cs' ? 'Přehled a správa všech kroků' : 'Overview and management of all steps'}</p>
                      </div>
                    </div>
                  </div>
                
                <div className="p-4 bg-white border-2 border-primary-300 rounded-playful-md">
                  <div className="flex items-center gap-3 mb-2">
                    <BookOpen className="w-5 h-5 text-primary-600" />
                    <div>
                      <h4 className="font-semibold text-black">{locale === 'cs' ? 'Nápověda' : 'Help'}</h4>
                      <p className="text-xs text-gray-600">{locale === 'cs' ? 'Dokumentace a návody k použití' : 'Documentation and usage guides'}</p>
                </div>
                    </div>
                      </div>
                
                <div className="p-4 bg-white border-2 border-primary-300 rounded-playful-md">
                  <div className="flex items-center gap-3 mb-2">
                    <Settings className="w-5 h-5 text-primary-600" />
                    <div>
                      <h4 className="font-semibold text-black">{locale === 'cs' ? 'Nastavení' : 'Settings'}</h4>
                      <p className="text-xs text-gray-600">{locale === 'cs' ? 'Nastavení aplikace a účtu' : 'App and account settings'}</p>
                    </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
            {/* Left Navigation Menu */}
            <div className="box-playful-highlight p-6">
              <h3 className="font-semibold text-black font-playful mb-4 flex items-center gap-2">
                <LayoutDashboard className="w-5 h-5 text-primary-600" />
                {locale === 'cs' ? 'Levé navigační menu' : 'Left Navigation Menu'}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                {locale === 'cs' 
                  ? 'Levé menu se mění podle kontextu stránky. Na hlavním panelu obsahuje hlavní zobrazení a sekce pro správu.'
                  : 'The left menu changes based on page context. On the main panel, it contains main views and management sections.'}
              </p>
              
              {/* Main Panel Navigation */}
              <div className="mb-6">
                <h4 className="font-semibold text-black mb-3">{locale === 'cs' ? 'Na hlavním panelu:' : 'On the main panel:'}</h4>
                    <div className="space-y-2">
                  <div className="flex items-center gap-3 p-3 bg-white rounded-playful-md">
                    <ListTodo className="w-5 h-5 text-primary-600" />
                    <div>
                      <h5 className="font-semibold text-black text-sm">{locale === 'cs' ? 'Upcoming (Nadcházející)' : 'Upcoming'}</h5>
                      <p className="text-xs text-gray-600">{locale === 'cs' ? 'Přehled nadcházejících kroků a návyků' : 'Overview of upcoming steps and habits'}</p>
                        </div>
                      </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-white rounded-playful-md">
                    <CalendarDays className="w-5 h-5 text-primary-600" />
                    <div>
                      <h5 className="font-semibold text-black text-sm">{locale === 'cs' ? 'Overview (Přehled)' : 'Overview'}</h5>
                      <p className="text-xs text-gray-600">{locale === 'cs' ? 'Měsíční kalendářní přehled' : 'Monthly calendar overview'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-white rounded-playful-md">
                    <BarChart3 className="w-5 h-5 text-primary-600" />
                    <div>
                      <h5 className="font-semibold text-black text-sm">{locale === 'cs' ? 'Statistics (Statistiky)' : 'Statistics'}</h5>
                      <p className="text-xs text-gray-600">{locale === 'cs' ? 'Roční přehled pokroku' : 'Yearly overview of progress'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-white rounded-playful-md">
                    <LayoutDashboard className="w-5 h-5 text-primary-600" />
                    <div>
                      <h5 className="font-semibold text-black text-sm">{locale === 'cs' ? 'Areas (Oblasti)' : 'Areas'}</h5>
                      <p className="text-xs text-gray-600">{locale === 'cs' ? 'Zobrazení podle oblastí' : 'View by areas'}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Areas and Goals in Navigation */}
              <div className="mb-4">
                <h4 className="font-semibold text-black mb-3">{locale === 'cs' ? 'Oblasti:' : 'Areas:'}</h4>
                <p className="text-sm text-gray-600 mb-3">
                  {locale === 'cs' 
                    ? 'Pod hlavními zobrazeními najdete seznam oblastí. Kliknutím na oblast se otevře detail oblasti s milníky a kroky.'
                    : 'Below the main views, you\'ll find a list of areas. Click on an area to open the area detail with milestones and steps.'}
                </p>
                <div className="p-4 bg-white border-2 border-primary-300 rounded-playful-md">
                  <div className="space-y-2">
                        <div className="flex items-center gap-2">
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-black">{locale === 'cs' ? 'Kariéra' : 'Career'}</span>
                        </div>
                    <div className="ml-6 space-y-1">
                        <div className="flex items-center gap-2">
                        <Target className="w-3 h-3 text-primary-600" />
                        <span className="text-xs text-gray-600">{locale === 'cs' ? 'Povýšení' : 'Promotion'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                        <Target className="w-3 h-3 text-primary-600" />
                        <span className="text-xs text-gray-600">{locale === 'cs' ? 'Naučit se React' : 'Learn React'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
              </div>
              
              {/* Add Button */}
              <div className="mb-4">
                <h4 className="font-semibold text-black mb-3">{locale === 'cs' ? 'Tlačítko Přidat:' : 'Add Button:'}</h4>
                <p className="text-sm text-gray-600 mb-3">
                  {locale === 'cs' 
                    ? 'V dolní části levého menu je tlačítko s ikonou plus. Kliknutím na něj můžete přidat novou oblast, krok nebo návyk.'
                    : 'At the bottom of the left menu is a button with a plus icon. Clicking it allows you to add a new area, step, or habit.'}
                </p>
                <div className="p-4 bg-white border-2 border-primary-300 rounded-playful-md flex items-center justify-center">
                  <button className="w-10 h-10 bg-primary-500 rounded-playful-md flex items-center justify-center">
                    <Plus className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>
              
              {/* Other Pages */}
              <div className="mt-6 p-4 bg-primary-50 rounded-playful-md border-2 border-primary-200">
                <p className="text-xs text-gray-700">
                  <span className="font-semibold">{locale === 'cs' ? 'Tip: ' : 'Tip: '}</span>
                  {locale === 'cs' 
                    ? 'Na jiných stránkách (Návyky, Kroky) slouží levé menu jako kategorie a filtry pro zobrazení obsahu.'
                    : 'On other pages (Habits, Steps), the left menu serves as categories and filters for displaying content.'}
                </p>
              </div>
            </div>
          </div>
        )

      case 'areas':
        return (
          <div className="space-y-6">
            <div className="box-playful-highlight-primary p-6">
              <h2 className="text-2xl font-bold text-black font-playful mb-2">{t('areasHelp.title') || (locale === 'cs' ? 'Oblasti' : 'Areas')}</h2>
              <p className="text-gray-600 font-playful">{t('areasHelp.subtitle') || (locale === 'cs' ? 'Organizujte své kroky, milníky a návyky do logických skupin' : 'Organize your steps, milestones, and habits into logical groups')}</p>
            </div>

            {/* What are areas */}
            <div className="box-playful-highlight p-6">
              <h3 className="font-semibold text-black font-playful mb-4 flex items-center gap-2">
                <LayoutDashboard className="w-5 h-5 text-primary-600" />
                {locale === 'cs' ? 'Co jsou oblasti?' : 'What are areas?'}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                {locale === 'cs' 
                  ? 'Oblasti jsou způsob, jak organizovat své kroky, milníky a návyky do logických skupin. Ideálně by měly představovat větší životní oblasti nebo projekty.'
                  : 'Areas are a way to organize your steps, milestones, and habits into logical groups. Ideally, they should represent larger life areas or projects.'}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-white rounded-playful-md border-2 border-primary-300">
                  <div className="flex items-center gap-3 mb-2">
                    <span 
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0"
                      style={{ backgroundColor: '#10b981' }}
                    >
                      <Flame className="w-4 h-4 text-white" />
                    </span>
                    <h4 className="font-semibold text-black">{locale === 'cs' ? 'Zdraví' : 'Health'}</h4>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">{locale === 'cs' ? 'Zdravotní milníky a návyky' : 'Health milestones and habits'}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>2 {locale === 'cs' ? 'Milníky' : 'Milestones'}</span>
                    <span>5 {locale === 'cs' ? 'Kroky' : 'Steps'}</span>
                    <span>3 {locale === 'cs' ? 'Návyky' : 'Habits'}</span>
                  </div>
                </div>
                <div className="p-4 bg-white rounded-playful-md border-2 border-primary-300">
                  <div className="flex items-center gap-3 mb-2">
                    <span 
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0"
                      style={{ backgroundColor: '#ea580c' }}
                    >
                      <Briefcase className="w-4 h-4 text-white" />
                    </span>
                    <h4 className="font-semibold text-black">{locale === 'cs' ? 'Kariéra' : 'Career'}</h4>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">{locale === 'cs' ? 'Profesní milníky a kroky' : 'Professional milestones and steps'}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>3 {locale === 'cs' ? 'Milníky' : 'Milestones'}</span>
                    <span>8 {locale === 'cs' ? 'Kroky' : 'Steps'}</span>
                    <span>1 {locale === 'cs' ? 'Návyk' : 'Habit'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* How to create */}
            <div className="box-playful-highlight p-6">
              <h3 className="font-semibold text-black font-playful mb-4">{locale === 'cs' ? 'Jak vytvořit oblast?' : 'How to create an area?'}</h3>
              <div className="space-y-3">
                <Step number={1} text={locale === 'cs' ? 'Přejděte do Nastavení (ikona ozubeného kola v horním menu)' : 'Go to Settings (gear icon in the top menu)'} />
                <Step number={2} text={locale === 'cs' ? 'Vyberte záložku "Životní oblasti"' : 'Select the "Life Areas" tab'} />
                <Step number={3} text={locale === 'cs' ? 'Klikněte na tlačítko "Přidat oblast"' : 'Click the "Add Area" button'} />
                <Step number={4} text={locale === 'cs' ? 'Vyplňte název oblasti (např. "Zdraví", "Kariéra")' : 'Fill in the area name (e.g., "Health", "Career")'} />
                <Step number={5} text={locale === 'cs' ? 'Volitelně přidejte popis, barvu a ikonu' : 'Optionally add description, color, and icon'} />
                <Step number={6} text={locale === 'cs' ? 'Klikněte na "Uložit"' : 'Click "Save"'} />
              </div>
              <div className="mt-4 p-4 bg-primary-50 rounded-playful-md border-2 border-primary-200">
                <p className="text-xs text-gray-700">
                  <span className="font-semibold">{locale === 'cs' ? 'Tip: ' : 'Tip: '}</span>
                  {locale === 'cs' 
                    ? 'Oblasti můžete také vytvořit pomocí tlačítka Přidat v levém navigačním menu na hlavním panelu.'
                    : 'You can also create areas using the Add button in the left navigation menu on the main panel.'}
                </p>
              </div>
            </div>

            {/* How to work with areas */}
            <div className="box-playful-highlight p-6">
              <h3 className="font-semibold text-black font-playful mb-4">{locale === 'cs' ? 'Jak pracovat s oblastmi?' : 'How to work with areas?'}</h3>
              <div className="space-y-4">
                    <div>
                  <h4 className="font-semibold text-black mb-2">{locale === 'cs' ? 'Přiřazení k oblasti' : 'Assigning to an area'}</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    {locale === 'cs' 
                      ? 'Při vytváření nebo úpravě kroku nebo návyku můžete vybrat oblast, ke které patří. Kroky a návyky mohou být také bez oblasti. Milníky jsou vždy vázané na oblast.'
                      : 'When creating or editing a step or habit, you can select the area it belongs to. Steps and habits can also be without an area. Milestones are always linked to an area.'}
                  </p>
                    </div>
                
                <div>
                  <h4 className="font-semibold text-black mb-2">{locale === 'cs' ? 'Zobrazení podle oblastí' : 'Viewing by areas'}</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    {locale === 'cs' 
                      ? 'V levém navigačním menu můžete kliknout na oblast a zobrazit všechny milníky, kroky a návyky v této oblasti.'
                      : 'In the left navigation menu, you can click on an area to view all milestones, steps, and habits in that area.'}
                  </p>
                  </div>
                
                <div>
                  <h4 className="font-semibold text-black mb-2">{locale === 'cs' ? 'Úprava a mazání oblastí' : 'Editing and deleting areas'}</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    {locale === 'cs' 
                      ? 'Oblasti můžete upravit nebo smazat v Nastavení → Životní oblasti. Při mazání oblasti se kroky a návyky v této oblasti nezmazou, pouze se odebere přiřazení k oblasti. Milníky se také nezmazou, ale zůstanou vázané na smazanou oblast.'
                      : 'You can edit or delete areas in Settings → Life Areas. When deleting an area, steps and habits in that area are not deleted, only the area assignment is removed. Milestones are also not deleted but remain linked to the deleted area.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="box-playful-highlight p-6">
              <h3 className="font-semibold text-black font-playful mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary-600" /> {locale === 'cs' ? 'Tipy' : 'Tips'}
              </h3>
              <ul className="space-y-2">
                <Tip text={locale === 'cs' ? 'Vytvářejte oblasti pro větší životní oblasti (Zdraví, Kariéra, Vztahy) nebo pro větší projekty' : 'Create areas for larger life areas (Health, Career, Relationships) or for larger projects'} />
                <Tip text={locale === 'cs' ? 'Není nutné přiřazovat vše k oblasti - kroky a návyky mohou existovat i bez oblasti. Milníky jsou vždy vázané na oblast.' : 'You don\'t have to assign everything to an area - steps and habits can exist without an area. Milestones are always linked to an area.'} />
                <Tip text={locale === 'cs' ? 'Používejte barvy a ikony pro lepší vizuální rozlišení oblastí' : 'Use colors and icons for better visual distinction of areas'} />
                <Tip text={locale === 'cs' ? 'Oblasti pomáhají s filtrováním a organizací, zejména když máte mnoho kroků a milníků' : 'Areas help with filtering and organization, especially when you have many steps and milestones'} />
              </ul>
            </div>
          </div>
        )

      case 'milestones':
        return (
          <div className="space-y-6">
            <div className="box-playful-highlight-primary p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-black font-playful flex items-center gap-2">
                  <Target className="w-7 h-7" /> {locale === 'cs' ? 'Milníky' : 'Milestones'}
                </h2>
                <p className="text-gray-600 font-playful font-playful text-sm mt-1">
                  {locale === 'cs' 
                    ? 'Důležité body na vaší cestě v rámci oblasti'
                    : 'Important points on your journey within an area'}
                </p>
              </div>
            </div>

            {/* What are milestones */}
            <div className="box-playful-highlight p-4">
              <h4 className="font-semibold text-black font-playful mb-2">
                {locale === 'cs' ? 'Co jsou milníky?' : 'What are milestones?'}
              </h4>
              <p className="text-sm text-gray-600 font-playful mb-3">
                {locale === 'cs'
                  ? 'Milníky jsou důležité body na vaší cestě v rámci oblasti. Označují významné úspěchy nebo události, které chcete dosáhnout. Milníky mají název, popis, datum a můžete sledovat jejich pokrok. Když dosáhnete milníku, můžete ho dokončit.'
                  : 'Milestones are important points on your journey within an area. They mark significant achievements or events you want to reach. Milestones have a title, description, date, and you can track their progress. When you reach a milestone, you can complete it.'}
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs bg-primary-100 text-primary-600 px-2 py-1 rounded-full flex items-center gap-1">
                  <Target className="w-3 h-3" /> {locale === 'cs' ? 'S pokrokem' : 'With progress'}
                </span>
                <span className="text-xs bg-primary-100 text-primary-600 px-2 py-1 rounded-full flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> {locale === 'cs' ? 'S datem' : 'With date'}
                </span>
                <span className="text-xs bg-primary-100 text-primary-600 px-2 py-1 rounded-full flex items-center gap-1">
                  <Check className="w-3 h-3" /> {locale === 'cs' ? 'Dokončitelné' : 'Completable'}
                </span>
              </div>
            </div>

            {/* How to create */}
            <div className="box-playful-highlight p-4">
              <h4 className="font-semibold text-black font-playful mb-3">
                {locale === 'cs' ? 'Jak vytvořit milník?' : 'How to create a milestone?'}
              </h4>
              <div className="space-y-2">
                <Step number={1} text={locale === 'cs' 
                  ? 'Přejděte do detailu oblasti (klikněte na oblast v levém menu)'
                  : 'Go to area detail (click on an area in the left menu)'} />
                <Step number={2} text={locale === 'cs'
                  ? 'Klikněte na tlačítko "Přidat milník"'
                  : 'Click the "Add Milestone" button'} />
                <Step number={3} text={locale === 'cs'
                  ? 'Vyplňte název, popis a datum milníku'
                  : 'Fill in the milestone title, description, and date'} />
                <Step number={4} text={locale === 'cs'
                  ? 'Klikněte na ikony pokroku pro nastavení pokroku (0-100%)'
                  : 'Click on progress icons to set progress (0-100%)'} />
                <Step number={5} text={locale === 'cs'
                  ? 'Když dosáhnete milníku, klikněte na ikonu dokončení pro jeho dokončení'
                  : 'When you reach the milestone, click the completion icon to complete it'} />
              </div>
            </div>

            {/* Tips */}
            <div className="box-playful-highlight p-4">
              <h4 className="font-semibold text-black font-playful mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary-600" /> {locale === 'cs' ? 'Tipy' : 'Tips'}
              </h4>
              <ul className="space-y-1.5">
                <Tip text={locale === 'cs'
                  ? 'Milníky jsou vázané na oblasti - každý milník patří k jedné oblasti'
                  : 'Milestones are linked to areas - each milestone belongs to one area'} />
                <Tip text={locale === 'cs'
                  ? 'Používejte milníky pro označení významných úspěchů nebo událostí'
                  : 'Use milestones to mark significant achievements or events'} />
                <Tip text={locale === 'cs'
                  ? 'Pokrok můžete upravit kliknutím na ikony pokroku v časové ose'
                  : 'You can adjust progress by clicking on progress icons in the timeline'} />
                <Tip text={locale === 'cs'
                  ? 'Dokončené milníky se odstraní z časové osy'
                  : 'Completed milestones are removed from the timeline'} />
              </ul>
            </div>
          </div>
        )

      case 'steps':
        return (
          <div className="space-y-6">
            <div className="box-playful-highlight-primary p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-black font-playful flex items-center gap-2">
                  <Footprints className="w-7 h-7" /> {t('stepsHelp.title')}
                </h2>
                <p className="text-gray-600 font-playful font-playful text-sm mt-1">{t('stepsHelp.subtitle')}</p>
              </div>
                {onAddStep && (
                <button onClick={onAddStep} className="flex items-center gap-1 px-4 py-2 bg-white text-primary-600 font-playful font-medium rounded-lg hover:bg-primary-50">
                  <Plus className="w-4 h-4" /> {t('stepsHelp.add')}
                  </button>
                )}
            </div>

            {/* What are steps */}
            <div className="box-playful-highlight p-4">
              <h4 className="font-semibold text-black font-playful mb-2">{t('stepsHelp.whatAreSteps')}</h4>
              <p className="text-sm text-gray-600 font-playful mb-3">{t('stepsHelp.whatAreStepsDesc')}</p>
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="text-xs bg-primary-100 text-primary-600 px-2 py-1 rounded-full flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> {t('stepsHelp.scheduled')}
                </span>
                <span className="text-xs bg-primary-100 text-primary-600 px-2 py-1 rounded-full flex items-center gap-1">
                  <Target className="w-3 h-3" /> {t('stepsHelp.toGoal')}
                </span>
                <span className="text-xs bg-primary-100 text-primary-600 px-2 py-1 rounded-full flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {t('stepsHelp.timeEstimate')}
                </span>
                <span className="text-xs bg-primary-100 text-primary-600 px-2 py-1 rounded-full flex items-center gap-1">
                  <Zap className="w-3 h-3" /> {locale === 'cs' ? 'Opakující se' : 'Recurring'}
                </span>
              </div>
              <div className="mt-3 p-3 bg-primary-50 rounded-playful-md border border-primary-200">
                <p className="text-xs text-gray-700 font-medium mb-1">{locale === 'cs' ? 'Opakující se kroky' : 'Recurring Steps'}</p>
                <p className="text-xs text-gray-600">{locale === 'cs' 
                  ? 'Kroky můžete nastavit jako opakující se (denně, týdně, měsíčně). V Upcoming view se zobrazí vždy další nehotový výskyt.'
                  : 'Steps can be set as recurring (daily, weekly, monthly). In Upcoming view, always shows the next uncompleted occurrence.'}</p>
              </div>
              </div>

            {/* Example Step Card */}
            <div className="box-playful-highlight p-4">
              <h4 className="font-semibold text-black font-playful mb-3 flex items-center gap-2">
                <Eye className="w-4 h-4 text-primary-600" /> {t('stepsHelp.exampleTitle')}
              </h4>
              <div className="box-playful-highlight p-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 border-2 border-primary-400 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckSquare className="w-4 h-4 text-primary-400" />
                </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h5 className="font-semibold text-black font-playful">{t('stepsHelp.exampleName')}</h5>
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> {t('stepsHelp.important')}
                      </span>
                  </div>
                    <p className="text-sm text-gray-500 mt-1">{t('stepsHelp.exampleDesc')}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {t('stepsHelp.today')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> 30 min
                      </span>
                      <span className="flex items-center gap-1">
                        <Target className="w-3 h-3" /> {t('goalsHelp.tableExample1')}
                      </span>
                </div>
                  </div>
                </div>
              </div>
              <div className="mt-3 text-xs text-gray-500 space-y-1">
                <p><strong className="text-red-600">{t('stepsHelp.important')}</strong> = {t('stepsHelp.importantExplanation').split(' = ')[1]}</p>
                <p><strong className="text-primary-600 font-playful">{t('stepsHelp.timeEstimate')}</strong> = {t('stepsHelp.timeExplanation').split(' = ')[1]}</p>
                <p><strong className="text-gray-600 font-playful">{t('stepsHelp.tableGoal')}</strong> = {t('stepsHelp.goalExplanation').split(' = ')[1]}</p>
                </div>
              </div>

            {/* Steps Table Example */}
            <div className="box-playful-highlight p-4">
              <h4 className="font-semibold text-black font-playful mb-3 flex items-center gap-2">
                <Eye className="w-4 h-4 text-primary-600" /> {t('stepsHelp.tableTitle')}
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-primary-100">
                      <th className="text-left py-2 px-2 text-xs font-medium text-gray-500 w-8"></th>
                      <th className="text-left py-2 px-2 text-xs font-medium text-gray-500">{t('stepsHelp.tableName')}</th>
                      <th className="text-left py-2 px-2 text-xs font-medium text-gray-500">{t('stepsHelp.tableDate')}</th>
                      <th className="text-left py-2 px-2 text-xs font-medium text-gray-500">{t('stepsHelp.tableTime')}</th>
                      <th className="text-left py-2 px-2 text-xs font-medium text-gray-500">{t('stepsHelp.tableGoal')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-primary-50 hover:bg-primary-50 cursor-pointer">
                      <td className="py-2 px-2">
                        <div className="w-5 h-5 border-2 border-primary-400 rounded flex items-center justify-center">
                          <CheckSquare className="w-3 h-3 text-primary-400" />
                        </div>
                      </td>
                      <td className="py-2 px-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-800">{t('stepsHelp.tableExample1')}</span>
                          <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded">!</span>
                        </div>
                      </td>
                      <td className="py-2 px-2 text-gray-500">{t('stepsHelp.today')}</td>
                      <td className="py-2 px-2 text-gray-500">30 min</td>
                      <td className="py-2 px-2 text-xs text-primary-600 font-playful">React</td>
                    </tr>
                    <tr className="border-b border-primary-50 hover:bg-primary-50 cursor-pointer">
                      <td className="py-2 px-2">
                        <div className="w-5 h-5 border-2 border-primary-400 rounded flex items-center justify-center">
                          <CheckSquare className="w-3 h-3 text-primary-400" />
                        </div>
                      </td>
                      <td className="py-2 px-2">
                        <span className="font-medium text-gray-800">{t('stepsHelp.tableExample2')}</span>
                      </td>
                      <td className="py-2 px-2 text-gray-500">{t('stepsHelp.tomorrow')}</td>
                      <td className="py-2 px-2 text-gray-500">2 h</td>
                      <td className="py-2 px-2 text-xs text-primary-600 font-playful">React</td>
                    </tr>
                    <tr className="hover:bg-primary-50 cursor-pointer opacity-60">
                      <td className="py-2 px-2">
                        <div className="w-5 h-5 bg-primary-500 rounded flex items-center justify-center">
                          <CheckSquare className="w-3 h-3 text-white" />
                        </div>
                      </td>
                      <td className="py-2 px-2">
                        <span className="font-medium text-gray-500 line-through">{t('stepsHelp.tableExample3')}</span>
                      </td>
                      <td className="py-2 px-2 text-gray-400">{t('stepsHelp.yesterday')}</td>
                      <td className="py-2 px-2 text-gray-400">1 h</td>
                      <td className="py-2 px-2 text-xs text-gray-400">Exercise</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="mt-3 text-xs text-gray-500 space-y-1">
                <p>{t('stepsHelp.tableCheckboxHint')}</p>
                <p>{t('stepsHelp.tableImportantHint')}</p>
                <p>{t('stepsHelp.tableClickHint')}</p>
              </div>
              </div>

            {/* How to create */}
            <div className="box-playful-highlight p-4">
              <h4 className="font-semibold text-black font-playful mb-3">{t('stepsHelp.howToCreate')}</h4>
              <div className="space-y-2">
                <Step number={1} text={t('stepsHelp.howToStep1')} />
                <Step number={2} text={t('stepsHelp.howToStep2')} />
                <Step number={3} text={t('stepsHelp.howToStep3')} />
                <Step number={4} text={t('stepsHelp.howToStep4')} />
                <Step number={5} text={t('stepsHelp.howToStep5')} />
              </div>
              <div className="mt-4 flex gap-2">
                {onAddStep && (
                  <button onClick={onAddStep} className="flex items-center gap-1 px-4 py-2 btn-playful-base text-primary-600 bg-white hover:bg-primary-50 text-sm font-medium">
                    <Plus className="w-4 h-4" /> {t('stepsHelp.createStep')}
                  </button>
                )}
                {onNavigateToSteps && (
                  <button onClick={onNavigateToSteps} className="flex items-center gap-1 px-4 py-2 border border-primary-200 text-primary-600 font-playful text-sm rounded-lg hover:bg-primary-50">
                    <ArrowRight className="w-4 h-4" /> {t('stepsHelp.goToSteps')}
                  </button>
                )}
              </div>
            </div>

            {/* Tips */}
            <div className="box-playful-highlight p-4">
              <h4 className="font-semibold text-black font-playful mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary-600" /> {t('stepsHelp.tips')}
              </h4>
              <ul className="space-y-1.5">
                <Tip text={t('stepsHelp.tip1')} />
                <Tip text={t('stepsHelp.tip2')} />
                <Tip text={t('stepsHelp.tip3')} />
                <Tip text={t('stepsHelp.tip4')} />
              </ul>
            </div>
          </div>
        )

      case 'habits':
        return (
          <div className="space-y-6">
            <div className="box-playful-highlight-primary p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-black font-playful flex items-center gap-2">
                  <CheckSquare className="w-7 h-7" /> {t('habitsHelp.title')}
                </h2>
                <p className="text-gray-600 font-playful font-playful text-sm mt-1">{t('habitsHelp.subtitle')}</p>
              </div>
                {onAddHabit && (
                <button onClick={onAddHabit} className="flex items-center gap-1 px-4 py-2 bg-white text-primary-600 font-playful font-medium rounded-lg hover:bg-primary-50">
                  <Plus className="w-4 h-4" /> {t('habitsHelp.add')}
                  </button>
                )}
            </div>

            {/* What are habits */}
            <div className="box-playful-highlight p-4">
              <h4 className="font-semibold text-black font-playful mb-2">{t('habitsHelp.whatAreHabits')}</h4>
              <p className="text-sm text-gray-600 font-playful mb-3">{t('habitsHelp.whatAreHabitsDesc')}</p>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs bg-primary-100 text-primary-600 px-2 py-1 rounded-full flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> {t('habitsHelp.daily')}
                </span>
                <span className="text-xs bg-primary-100 text-primary-600 px-2 py-1 rounded-full flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> {t('habitsHelp.weekly')}
                </span>
                <span className="text-xs bg-primary-100 text-primary-600 px-2 py-1 rounded-full flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {t('habitsHelp.reminder')}
                </span>
              </div>
            </div>

            {/* Example Habit Card */}
            <div className="box-playful-highlight p-4">
              <h4 className="font-semibold text-black font-playful mb-3 flex items-center gap-2">
                <Eye className="w-4 h-4 text-primary-600" /> {t('habitsHelp.exampleTitle')}
              </h4>
              <div className="box-playful-highlight p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h5 className="font-semibold text-black font-playful">{t('habitsHelp.exampleName')}</h5>
                      <span className="text-xs bg-primary-200 text-primary-600 px-2 py-0.5 rounded-full">{t('habitsHelp.daily')}</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{t('habitsHelp.exampleDesc')}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> 07:00
                      </span>
              </div>
                    <div className="flex gap-1 mt-2">
                      {days.map((day, i) => (
                        <span key={day} className={`w-6 h-6 rounded text-[10px] flex items-center justify-center font-medium ${i < 5 ? 'bg-primary-200 text-primary-600' : 'bg-gray-100 text-gray-400'}`}>
                          {day}
                        </span>
                      ))}
                </div>
                  </div>
                </div>
              </div>
              <div className="mt-3 text-xs text-gray-500 space-y-1">
                <p><strong className="text-primary-600 font-playful">{t('habitsHelp.daily')}</strong> = {t('habitsHelp.dailyExplanation').split(' = ')[1]}</p>
                <p><strong className="text-primary-600 font-playful">{t('habitsHelp.reminder')}</strong> = {t('habitsHelp.reminderExplanation').split(' = ')[1]}</p>
                <p><strong className="text-gray-600 font-playful">{t('days.mon')}-{t('days.sun')}</strong> = {t('habitsHelp.daysExplanation').split(' = ')[1]}</p>
              </div>
              </div>

            {/* Habits Timeline Example */}
            <div className="box-playful-highlight p-4">
              <h4 className="font-semibold text-black font-playful mb-3 flex items-center gap-2">
                <Eye className="w-4 h-4 text-primary-600" /> {t('habitsHelp.timelineTitle')}
              </h4>
              
              {/* Statistics example */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary-600" />
                  <div>
                    <div className="text-xs text-gray-500">Plánováno</div>
                    <div className="text-sm font-semibold text-black font-playful">21</div>
                </div>
                </div>
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-green-500" />
                  <div>
                    <div className="text-xs text-gray-500">Splněno</div>
                    <div className="text-sm font-semibold text-black font-playful">15</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-blue-500" />
                  <div>
                    <div className="text-xs text-gray-500">Mimo plán</div>
                    <div className="text-sm font-semibold text-black font-playful">2</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-purple-500" />
                  <div>
                    <div className="text-xs text-gray-500">Streak</div>
                    <div className="text-sm font-semibold text-black font-playful">5</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <div>
                    <div className="text-xs text-gray-500">Max streak</div>
                    <div className="text-sm font-semibold text-black font-playful">12</div>
                  </div>
                </div>
              </div>

              {/* Timeline example */}
              <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                <div className="space-y-3">
                  {/* Habit 1 */}
                  <div className="flex items-start gap-2">
                    <div className="w-[150px] flex items-center gap-2 flex-shrink-0">
                      <span className="text-sm font-medium text-gray-800">{t('habitsHelp.tableExample1')}</span>
                      <button className="p-1 hover:bg-gray-200 rounded" title={t('habitsHelp.settingsIcon')}>
                        <Settings className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                    <div className="flex gap-1 flex-1">
                      {[true, true, true, false, false, false, false].map((done, i) => (
                        <div key={i} className={`w-8 h-8 rounded flex items-center justify-center ${done ? 'bg-primary-500' : 'bg-gray-200'}`}>
                          {done && <CheckSquare className="w-4 h-4 text-white" />}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Habit 2 */}
                  <div className="flex items-start gap-2">
                    <div className="w-[150px] flex items-center gap-2 flex-shrink-0">
                      <span className="text-sm font-medium text-gray-800">{t('habitsHelp.tableExample2')}</span>
                      <button className="p-1 hover:bg-gray-200 rounded" title={t('habitsHelp.settingsIcon')}>
                        <Settings className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                    <div className="flex gap-1 flex-1">
                      {[true, false, true, false, false, false, false].map((done, i) => (
                        <div key={i} className={`w-8 h-8 rounded flex items-center justify-center ${done ? 'bg-primary-500' : 'bg-gray-200'}`}>
                          {done && <CheckSquare className="w-4 h-4 text-white" />}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-3 text-xs text-gray-500 space-y-1">
                <p>{t('habitsHelp.timelineOrangeHint')}</p>
                <p>{t('habitsHelp.timelineGrayHint')}</p>
                <p>{t('habitsHelp.timelineSettingsHint')}</p>
                <p>{t('habitsHelp.timelineClickHint')}</p>
              </div>
            </div>

            {/* How to create */}
            <div className="box-playful-highlight p-4">
              <h4 className="font-semibold text-black font-playful mb-3">{t('habitsHelp.howToCreate')}</h4>
              <div className="space-y-2">
                <Step number={1} text={t('habitsHelp.howToStep1')} />
                <Step number={2} text={t('habitsHelp.howToStep2')} />
                <Step number={3} text={t('habitsHelp.howToStep3')} />
                <Step number={4} text={t('habitsHelp.howToStep4')} />
                <Step number={5} text={t('habitsHelp.howToStep5')} />
              </div>
              <div className="mt-4 flex gap-2">
                {onAddHabit && (
                  <button onClick={onAddHabit} className="flex items-center gap-1 px-4 py-2 btn-playful-base text-primary-600 bg-white hover:bg-primary-50 text-sm font-medium">
                    <Plus className="w-4 h-4" /> {t('habitsHelp.createHabit')}
                  </button>
                )}
                {onNavigateToHabits && (
                  <button onClick={onNavigateToHabits} className="flex items-center gap-1 px-4 py-2 border border-primary-200 text-primary-600 font-playful text-sm rounded-lg hover:bg-primary-50">
                    <ArrowRight className="w-4 h-4" /> {t('habitsHelp.goToHabits')}
                  </button>
                )}
              </div>
              </div>

            {/* Tips */}
            <div className="box-playful-highlight p-4">
              <h4 className="font-semibold text-black font-playful mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary-600" /> {t('habitsHelp.tips')}
              </h4>
              <ul className="space-y-1.5">
                <Tip text={t('habitsHelp.tip1')} />
                <Tip text={t('habitsHelp.tip2')} />
                <Tip text={t('habitsHelp.tip3')} />
                <Tip text={t('habitsHelp.tip4')} />
              </ul>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="w-full h-full flex bg-background overflow-hidden">
      {/* Sidebar */}
      <div className="hidden md:flex w-64 border-r-2 border-primary-500 bg-white flex-shrink-0 flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b-2 border-primary-500 flex-shrink-0">
          <h2 className="text-sm font-bold text-black font-playful mb-3 flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-primary-600" />
            {t('title')}
          </h2>
        </div>
        
        {/* Navigation */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <nav className="p-2 space-y-1">
            {categories.map((category) => {
              const Icon = category.icon
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-playful-md transition-all text-left text-sm font-playful ${
                    selectedCategory === category.id
                      ? 'bg-primary-500 text-black font-semibold'
                      : 'text-black hover:bg-primary-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium">{category.label}</span>
                </button>
              )
            })}
          </nav>
        </div>
        
        {/* Contact button at bottom */}
        <div className="p-4 border-t-2 border-primary-500 flex-shrink-0">
          <button
            onClick={() => setShowContactModal(true)}
            className="btn-playful-base w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-primary-600 bg-white hover:bg-primary-50"
          >
            <Mail className="w-5 h-5" />
            {t('contact')}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Mobile menu */}
        <div className="md:hidden sticky top-0 z-10 bg-white border-b-2 border-primary-500 p-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-black font-playful flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-primary-600" />
              {t('title')}
            </h2>
            <div className="relative">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="btn-playful-base p-2"
              >
                <Menu className="w-4 h-4 text-black" />
              </button>
              {mobileMenuOpen && (
                <>
                  <div className="fixed inset-0 z-[100]" onClick={() => setMobileMenuOpen(false)} />
                  <div className="absolute right-0 top-10 box-playful-highlight bg-white z-[101] min-w-[180px] overflow-hidden flex flex-col">
                    <nav className="py-1 flex-1">
                      {categories.map((category) => {
                        const Icon = category.icon
                        return (
                          <button
                            key={category.id}
                            onClick={() => {
                              setSelectedCategory(category.id)
                              setMobileMenuOpen(false)
                            }}
                            className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left font-playful ${
                              selectedCategory === category.id
                                ? 'bg-primary-500 text-black font-semibold'
                                : 'text-black hover:bg-primary-50'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                            <span className="font-medium">{category.label}</span>
                          </button>
                        )
                      })}
                    </nav>
                    {/* Contact button at bottom */}
                    <div className="p-4 border-t-2 border-primary-500">
                      <button
                        onClick={() => {
                          setShowContactModal(true)
                          setMobileMenuOpen(false)
                        }}
                        className="btn-playful-base w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-primary-600 bg-white hover:bg-primary-50"
                      >
                        <Mail className="w-5 h-5" />
                        {t('contact')}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className="max-w-2xl mx-auto p-4 md:p-6">
          {renderContent()}
        </div>
      </div>

      {/* Contact Modal */}
      <ContactModal
        show={showContactModal}
        onClose={() => setShowContactModal(false)}
      />
    </div>
  )
}


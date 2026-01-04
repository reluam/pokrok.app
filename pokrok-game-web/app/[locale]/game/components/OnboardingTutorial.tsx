'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslations, useLocale } from 'next-intl'
import { X, ArrowRight, ArrowLeft, Target, Footprints, CheckSquare, LayoutDashboard, Calendar, TrendingUp, CheckCircle2, Plus, CalendarDays, CalendarRange, CalendarCheck, ChevronDown, ListTodo, BarChart3, Menu, HelpCircle, Settings, Check, Languages } from 'lucide-react'
import { getIconComponent } from '@/lib/icon-utils'
import { locales, type Locale } from '@/i18n/config'

interface OnboardingTutorialProps {
  isActive: boolean
  onComplete: () => void
  onSkip: () => void
}

// Mock data functions - returns localized data based on locale
const getMockAreas = (locale: string) => {
  if (locale === 'en') {
    return [
      { id: '1', name: 'Health', color: '#10b981', icon: 'Heart', description: 'Physical and mental health care' },
      { id: '2', name: 'Career', color: '#3b82f6', icon: 'Briefcase', description: 'Professional growth and development' },
      { id: '3', name: 'Finance', color: '#f59e0b', icon: 'Wallet', description: 'Financial planning and management' }
    ]
  }
  return [
    { id: '1', name: 'Zdraví', color: '#10b981', icon: 'Heart', description: 'Péče o fyzické a duševní zdraví' },
    { id: '2', name: 'Kariéra', color: '#3b82f6', icon: 'Briefcase', description: 'Profesní růst a rozvoj' },
    { id: '3', name: 'Finance', color: '#f59e0b', icon: 'Wallet', description: 'Finanční plánování a správa' }
  ]
}

const getMockGoals = (locale: string) => {
  if (locale === 'en') {
    return [
      { id: '1', title: 'Learn React', description: 'Master the basics of React framework', area_id: '2', status: 'active', progress_percentage: 45, icon: 'Code' },
      { id: '2', title: 'Exercise regularly', description: 'Exercise 3x a week for 3 months', area_id: '1', status: 'active', progress_percentage: 67, icon: 'Dumbbell' },
      { id: '3', title: 'Save $2,000', description: 'Gradually save for a new computer', area_id: '3', status: 'active', progress_percentage: 30, icon: 'PiggyBank' }
    ]
  }
  return [
    { id: '1', title: 'Naučit se React', description: 'Zvládnout základy React frameworku', area_id: '2', status: 'active', progress_percentage: 45, icon: 'Code' },
    { id: '2', title: 'Pravidelně cvičit', description: 'Cvičit 3x týdně po dobu 3 měsíců', area_id: '1', status: 'active', progress_percentage: 67, icon: 'Dumbbell' },
    { id: '3', title: 'Ušetřit 50 000 Kč', description: 'Postupně ušetřit na nový počítač', area_id: '3', status: 'active', progress_percentage: 30, icon: 'PiggyBank' }
  ]
}

const getMockSteps = (locale: string) => {
  if (locale === 'en') {
    return [
      { id: '1', title: 'Complete React tutorial', date: '2025-01-15', completed: true, estimated_time: 60, goal_id: '1' },
      { id: '2', title: 'Create first component', date: '2025-01-16', completed: false, estimated_time: 45, goal_id: '1' },
      { id: '3', title: 'Go to the gym', date: '2025-01-15', completed: true, estimated_time: 90, goal_id: '2' },
      { id: '4', title: 'Set up automatic transfer', date: '2025-01-20', completed: false, estimated_time: 15, goal_id: '3' }
    ]
  }
  return [
    { id: '1', title: 'Projít React tutorial', date: '2025-01-15', completed: true, estimated_time: 60, goal_id: '1' },
    { id: '2', title: 'Vytvořit první komponentu', date: '2025-01-16', completed: false, estimated_time: 45, goal_id: '1' },
    { id: '3', title: 'Jít do posilovny', date: '2025-01-15', completed: true, estimated_time: 90, goal_id: '2' },
    { id: '4', title: 'Nastavit automatický převod', date: '2025-01-20', completed: false, estimated_time: 15, goal_id: '3' }
  ]
}

const getMockHabits = (locale: string) => {
  if (locale === 'en') {
    return [
      { id: '1', name: 'Morning workout', frequency: 'daily', area_id: '1', icon: 'Dumbbell', habit_completions: { '2025-01-15': true, '2025-01-14': true, '2025-01-13': false } },
      { id: '2', name: 'Read 30 minutes', frequency: 'daily', area_id: '1', icon: 'BookOpen', habit_completions: { '2025-01-15': true, '2025-01-14': true, '2025-01-13': true } },
      { id: '3', name: 'Meditation', frequency: 'daily', area_id: '1', icon: 'Heart', habit_completions: { '2025-01-15': false, '2025-01-14': true, '2025-01-13': true } }
    ]
  }
  return [
    { id: '1', name: 'Ranní cvičení', frequency: 'daily', area_id: '1', icon: 'Dumbbell', habit_completions: { '2025-01-15': true, '2025-01-14': true, '2025-01-13': false } },
    { id: '2', name: 'Čtení 30 minut', frequency: 'daily', area_id: '1', icon: 'BookOpen', habit_completions: { '2025-01-15': true, '2025-01-14': true, '2025-01-13': true } },
    { id: '3', name: 'Meditace', frequency: 'daily', area_id: '1', icon: 'Heart', habit_completions: { '2025-01-15': false, '2025-01-14': true, '2025-01-13': true } }
  ]
}

export function OnboardingTutorial({
  isActive,
  onComplete,
  onSkip
}: OnboardingTutorialProps) {
  const t = useTranslations()
  const locale = useLocale()
  const [currentSlide, setCurrentSlide] = useState(0)
  const [selectedLocale, setSelectedLocale] = useState<Locale>(locale as Locale)
  const [isSavingLocale, setIsSavingLocale] = useState(false)
  
  // Get localized mock data
  const mockAreas = getMockAreas(locale)
  const mockGoals = getMockGoals(locale)
  const mockSteps = getMockSteps(locale)
  const mockHabits = getMockHabits(locale)

  const slides = [
    {
      title: locale === 'cs' ? 'Vyberte jazyk' : 'Choose language',
      description: locale === 'cs' ? 'Zvolte si jazyk, ve kterém chcete používat aplikaci.' : 'Choose the language you want to use the app in.',
      icon: Languages,
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
            <button
              onClick={() => setSelectedLocale('cs')}
              disabled={isSavingLocale}
              className={`p-6 rounded-lg border-2 transition-all font-playful ${
                selectedLocale === 'cs'
                  ? 'bg-primary-500 text-white border-primary-600 shadow-lg scale-105'
                  : 'bg-white text-black border-primary-300 hover:bg-primary-50 hover:border-primary-500'
              } ${isSavingLocale ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="text-4xl mb-2">🇨🇿</div>
              <div className="text-lg font-semibold">Čeština</div>
            </button>
            <button
              onClick={() => setSelectedLocale('en')}
              disabled={isSavingLocale}
              className={`p-6 rounded-lg border-2 transition-all font-playful ${
                selectedLocale === 'en'
                  ? 'bg-primary-500 text-white border-primary-600 shadow-lg scale-105'
                  : 'bg-white text-black border-primary-300 hover:bg-primary-50 hover:border-primary-500'
              } ${isSavingLocale ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="text-4xl mb-2">🇬🇧</div>
              <div className="text-lg font-semibold">English</div>
            </button>
          </div>
        </div>
      )
    },
    {
      title: t('onboarding.intro.title') || 'Co je Pokrok?',
      description: t('onboarding.intro.description') || 'Nástroj pro organizaci života a dosahování smysluplných cílů.',
      icon: Target,
      content: (
        <div className="space-y-4">
          <p className="text-gray-700 text-base leading-relaxed">
            {t('onboarding.intro.detailed') || (locale === 'cs' 
              ? 'Umožňuje vám organizovat vaše cíle, rozdělit je na dosažitelné kroky a sledovat, jak se posouváte směrem k životu, který chcete žít.'
              : 'It allows you to organize your goals, break them down into achievable steps, and track how you are moving towards the life you want to live.')}
          </p>
        </div>
      )
    },
    {
      title: locale === 'cs' ? 'Kde najdu nápovědu?' : 'Where can I find help?',
      description: locale === 'cs' 
        ? 'Pokud potřebujete pomoc, můžete najít nápovědu v aplikaci.'
        : 'If you need help, you can find help in the app.',
      icon: HelpCircle,
      content: (
        <div className="space-y-4">
          <p className="text-gray-700 text-base leading-relaxed">
            {locale === 'cs' 
              ? 'V aplikaci najdete sekci "Nápověda" v navigačním menu, kde se dozvíte více o tom, jak používat všechny funkce Pokroku.'
              : 'In the app, you can find the "Help" section in the navigation menu, where you can learn more about how to use all Pokrok features.'}
          </p>
          <div className="p-4 bg-primary-50 rounded-lg border-2 border-primary-200">
            <div className="flex items-start gap-3">
              <HelpCircle className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-1">
                  {locale === 'cs' ? 'Tip:' : 'Tip:'}
                </p>
                <p className="text-sm text-gray-700">
                  {locale === 'cs' 
                    ? 'V hlavním panelu najdete kroky s dnešním datumem, které vás provedou základy používání aplikace.'
                    : 'In the main panel, you will find steps with today\'s date that will guide you through the basics of using the app.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    }
  ]

  const handleNext = async () => {
    // If we're on the first slide (language selection), save the locale first
    if (currentSlide === 0) {
      if (selectedLocale !== locale) {
        setIsSavingLocale(true)
        try {
          const response = await fetch('/api/user/locale', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ locale: selectedLocale })
          })

          if (response.ok) {
            // Redirect to the new locale - use window.location for immediate redirect
            const currentPath = window.location.pathname
            
            // Handle locale switching with 'as-needed' prefix strategy
            // Extract path without locale prefix (e.g., /cs/game -> /game)
            let pathWithoutLocale = currentPath
            for (const loc of locales) {
              if (currentPath.startsWith(`/${loc}/`)) {
                pathWithoutLocale = currentPath.substring(loc.length + 1) // Remove /cs or /en, keep the rest including /
                break
              } else if (currentPath === `/${loc}`) {
                pathWithoutLocale = '/'
                break
              }
            }
            
            // Build new path - en is default (no prefix), cs needs prefix
            const newPath = selectedLocale === 'en' 
              ? pathWithoutLocale 
              : `/${selectedLocale}${pathWithoutLocale}`
            
            // Use window.location.href for immediate navigation with full page reload
            // This ensures the new locale is properly loaded and onboarding continues
            window.location.href = newPath
            return // Don't continue with slide change, page will reload
          } else {
            console.error('Failed to update locale')
            setIsSavingLocale(false)
            // Continue to next slide even if locale update failed
          }
        } catch (error) {
          console.error('Error updating locale:', error)
          setIsSavingLocale(false)
          // Continue to next slide even if locale update failed
        }
      }
    }
    
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1)
    } else {
      handleComplete()
    }
  }

  const handlePrevious = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1)
    }
  }

  const handleComplete = async () => {
    try {
      const response = await fetch('/api/user/onboarding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      })
      if (response.ok) {
        onComplete()
      } else {
        onComplete()
      }
    } catch (error) {
      console.error('Error completing onboarding:', error)
      onComplete()
    }
  }

  const handleSkip = () => {
    handleComplete()
  }

  if (!isActive) return null

  const currentSlideData = slides[currentSlide]
  const Icon = currentSlideData.icon
  const isLastSlide = currentSlide === slides.length - 1

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-60 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b-2 border-primary-200 bg-gradient-to-r from-primary-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
              <Icon className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 font-playful">{currentSlideData.title}</h2>
              <p className="text-sm text-gray-500 font-playful">
                {t('onboarding.step') || 'Krok'} {currentSlide + 1} {t('common.of') || 'z'} {slides.length}
              </p>
            </div>
          </div>
          <button
            onClick={handleSkip}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title={t('onboarding.skip') || 'Přeskočit'}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <p className="text-gray-700 text-lg mb-6 font-playful">{currentSlideData.description}</p>
          
          {/* Mock component preview */}
          <div>
            {currentSlideData.content}
          </div>
        </div>

        {/* Footer with navigation */}
        <div className="flex items-center justify-between p-6 border-t-2 border-primary-200 bg-white">
          <button
            onClick={handlePrevious}
            disabled={currentSlide === 0}
            className={`px-4 py-2 rounded-lg font-medium transition-colors font-playful ${
              currentSlide === 0
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-700 hover:bg-gray-200 border-2 border-gray-300'
            }`}
          >
            <ArrowLeft className="w-4 h-4 inline mr-1" />
            {t('common.previous') || 'Zpět'}
          </button>

          {/* Progress dots */}
          <div className="flex items-center gap-2">
            {slides.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all ${
                  index === currentSlide ? 'bg-primary-500 w-8' : 'bg-gray-300 w-2'
                }`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg transition-colors flex items-center gap-2 font-playful border-2 border-primary-600"
          >
            {isLastSlide ? (
              <>
                {t('onboarding.complete.button') || 'Dokončit'}
                <CheckCircle2 className="w-4 h-4" />
              </>
            ) : (
              <>
                {t('common.next') || 'Další'}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

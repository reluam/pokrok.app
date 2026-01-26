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

const getMockSteps = (locale: string) => {
  if (locale === 'en') {
    return [
      { id: '1', title: 'Complete React tutorial', date: '2025-01-15', completed: true, estimated_time: 60, area_id: '2' },
      { id: '2', title: 'Create first component', date: '2025-01-16', completed: false, estimated_time: 45, area_id: '2' },
      { id: '3', title: 'Go to the gym', date: '2025-01-15', completed: true, estimated_time: 90, area_id: '1' },
      { id: '4', title: 'Set up automatic transfer', date: '2025-01-20', completed: false, estimated_time: 15, area_id: '3' }
    ]
  }
  return [
    { id: '1', title: 'Projít React tutorial', date: '2025-01-15', completed: true, estimated_time: 60, area_id: '2' },
    { id: '2', title: 'Vytvořit první komponentu', date: '2025-01-16', completed: false, estimated_time: 45, area_id: '2' },
    { id: '3', title: 'Jít do posilovny', date: '2025-01-15', completed: true, estimated_time: 90, area_id: '1' },
    { id: '4', title: 'Nastavit automatický převod', date: '2025-01-20', completed: false, estimated_time: 15, area_id: '3' }
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
      title: locale === 'cs' ? 'Základní prvky' : 'Basic elements',
      description: locale === 'cs' 
        ? 'V Pokroku jsou čtyři základní prvky, které vám pomohou organizovat váš život.'
        : 'In Progress there are four basic elements that will help you organize your life.',
      icon: Target,
      content: (
        <div className="space-y-4">
          <p className="text-gray-700 text-base leading-relaxed mb-4">
            {locale === 'cs'
              ? 'Zaměřujeme se na smysluplnost, ne jen na produktivitu. Každý krok, milník a návyk by měl mít svůj důvod a přispívat k životu, jaký chcete mít.'
              : 'We focus on meaningfulness, not just productivity. Every step, milestone, and habit should have its reason and contribute to the life you want to have.'}
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-white rounded-lg border-2 border-orange-500 shadow-sm">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-3 mx-auto">
                <LayoutDashboard className="w-6 h-6 text-orange-600" />
              </div>
              <h4 className="font-bold text-sm mb-1 text-center">{locale === 'cs' ? 'Oblasti' : 'Areas'}</h4>
              <p className="text-xs text-gray-600 text-center">{locale === 'cs' ? 'Organizujte své kroky, milníky a návyky do oblastí' : 'Organize your steps, milestones, and habits into areas'}</p>
            </div>
            <div className="p-4 bg-white rounded-lg border-2 border-orange-500 shadow-sm">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-3 mx-auto">
                <Footprints className="w-6 h-6 text-orange-600" />
              </div>
              <h4 className="font-bold text-sm mb-1 text-center">{locale === 'cs' ? 'Kroky' : 'Steps'}</h4>
              <p className="text-xs text-gray-600 text-center">{locale === 'cs' ? 'Konkrétní akce, které můžete přiřadit k oblasti nebo ponechat bez oblasti' : 'Concrete actions that you can assign to an area or leave without an area'}</p>
            </div>
            <div className="p-4 bg-white rounded-lg border-2 border-orange-500 shadow-sm">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-3 mx-auto">
                <Target className="w-6 h-6 text-orange-600" />
              </div>
              <h4 className="font-bold text-sm mb-1 text-center">{locale === 'cs' ? 'Milníky' : 'Milestones'}</h4>
              <p className="text-xs text-gray-600 text-center">{locale === 'cs' ? 'Důležité body na vaší cestě v rámci oblasti' : 'Important points on your journey within an area'}</p>
            </div>
            <div className="p-4 bg-white rounded-lg border-2 border-orange-500 shadow-sm">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-3 mx-auto">
                <CheckSquare className="w-6 h-6 text-orange-600" />
              </div>
              <h4 className="font-bold text-sm mb-1 text-center">{locale === 'cs' ? 'Návyky' : 'Habits'}</h4>
              <p className="text-xs text-gray-600 text-center">{locale === 'cs' ? 'Opakující se rutiny, které budujete dlouhodobě' : 'Recurring routines you build long-term'}</p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: locale === 'cs' ? 'Kde najdu nápovědu?' : 'Where can I find help?',
      description: locale === 'cs' 
        ? 'Pokud potřebujete pomoc, můžete najít nápovědu v aplikaci.'
        : 'If you need help, you can find help in the application.',
      icon: HelpCircle,
      content: (
        <div className="space-y-4">
          <p className="text-gray-700 text-base leading-relaxed">
            {locale === 'cs'
              ? 'V navigačním menu najdete sekci "Nápověda", kde se dozvíte o všech funkcích Pokroku. Po dokončení tohoto tutoriálu se vám zobrazí kroky, které vás provedou aplikací a pomohou vám naučit se všechny funkce.'
              : 'In the navigation menu you will find a "Help" section where you can learn about all features of Progress. After completing this tutorial, steps will appear to guide you through the application and help you learn all functions.'}
          </p>
          <div className="p-4 bg-orange-100 border-2 border-orange-300 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                <HelpCircle className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-1">
                  {locale === 'cs' ? 'Tip:' : 'Tip:'}
                </p>
                <p className="text-sm text-gray-700">
                  {locale === 'cs'
                    ? 'V hlavním panelu najdete kroky s dnešním datumem, které vás provedou základy používání aplikace.'
                    : 'In the main panel, you will find steps with today\'s date that will guide you through the basics of using the application.'}
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
            // Redirect to the same path (no locale in URL anymore)
            // Just reload the page to apply the new locale from cookie
            window.location.reload()
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hasCompletedOnboarding: true })
      })
      if (response.ok) {
        // Wait a bit to ensure the database update is processed
        await new Promise(resolve => setTimeout(resolve, 100))
        onComplete()
      } else {
        console.error('Failed to update onboarding status:', await response.text())
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

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
      title: t('onboarding.creating.title') || 'Stavební bloky',
      description: t('onboarding.creating.description') || 'Čtyři typy prvků pro organizaci života.',
      icon: Plus,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-white rounded-lg border-2 border-primary-500 shadow-sm">
              <LayoutDashboard className="w-8 h-8 text-primary-600 mb-2" />
              <h4 className="font-bold text-sm mb-1">{t('onboarding.creating.areas') || 'Oblasti'}</h4>
              <p className="text-xs text-gray-600">{t('onboarding.creating.areasDesc') || 'Organizujte své cíle, kroky a návyky do oblastí'}</p>
            </div>
            <div className="p-4 bg-white rounded-lg border-2 border-primary-500 shadow-sm">
              <Target className="w-8 h-8 text-primary-600 mb-2" />
              <h4 className="font-bold text-sm mb-1">{t('onboarding.creating.goals') || 'Cíle'}</h4>
              <p className="text-xs text-gray-600">{t('onboarding.creating.goalsDesc') || 'Dlouhodobé cíle, kterých chcete dosáhnout'}</p>
            </div>
            <div className="p-4 bg-white rounded-lg border-2 border-primary-500 shadow-sm">
              <Footprints className="w-8 h-8 text-primary-600 mb-2" />
              <h4 className="font-bold text-sm mb-1">{t('onboarding.creating.steps') || 'Kroky'}</h4>
              <p className="text-xs text-gray-600">{t('onboarding.creating.stepsDesc') || 'Konkrétní akce vedoucí k vašim cílům'}</p>
            </div>
            <div className="p-4 bg-white rounded-lg border-2 border-primary-500 shadow-sm">
              <CheckSquare className="w-8 h-8 text-primary-600 mb-2" />
              <h4 className="font-bold text-sm mb-1">{t('onboarding.creating.habits') || 'Návyky'}</h4>
              <p className="text-xs text-gray-600">{t('onboarding.creating.habitsDesc') || 'Opakující se rutiny, které budujete dlouhodobě'}</p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: t('onboarding.areas.title') || 'Oblasti',
      description: t('onboarding.areas.description') || 'Větší životní oblasti nebo projekty. Shlukují cíle, kroky a návyky.',
      icon: LayoutDashboard,
      content: (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            {mockAreas.map((area) => {
              const IconComponent = getIconComponent(area.icon)
              return (
                <div key={area.id} className="p-4 bg-white rounded-lg border-2 border-primary-500 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: `${area.color}20` }}>
                      {IconComponent && <IconComponent className="w-5 h-5" style={{ color: area.color }} />}
                    </div>
                    <h4 className="font-bold text-sm">{area.name}</h4>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">{area.description}</p>
                  <div className="text-xs text-gray-500">
                    {t('onboarding.areas.contains') || 'Obsahuje cíle, kroky a návyky'}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )
    },
    {
      title: t('onboarding.goals.title') || 'Cíle',
      description: locale === 'cs' 
        ? 'Cíle jsou smysluplné výsledky, které chcete dosáhnout. Pro každý cíl můžete přidat kroky a metriky, což vám umožní vidět, jak se blížíte k dosažení.'
        : 'Goals are meaningful outcomes you want to achieve. For each goal, you can add steps and metrics, allowing you to see how you\'re approaching achievement.',
      icon: Target,
      content: (
        <div className="space-y-4">
          {/* Mock Goal Detail Page */}
          <div className="p-4 bg-white rounded-lg border-2 border-primary-500 shadow-sm">
            {(() => {
              const goal = mockGoals[0]
              const IconComponent = getIconComponent(goal.icon)
              const area = mockAreas.find(a => a.id === goal.area_id)
              const areaColor = area?.color || '#ea580c'
              
              return (
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      {IconComponent && (
                        <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${areaColor}20` }}>
                          <IconComponent className="w-7 h-7" style={{ color: areaColor }} />
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-black font-playful mb-1">{goal.title}</h3>
                        <p className="text-sm text-gray-600 font-playful">{goal.description}</p>
                      </div>
                    </div>
                    
                    {/* Area and Status buttons */}
                    <div className="flex items-center gap-2">
                      <button className="btn-playful-base flex items-center gap-1.5 px-2.5 py-1 text-xs text-primary-600 bg-white hover:bg-primary-50">
                        {IconComponent && <IconComponent className="w-3.5 h-3.5" style={{ color: areaColor }} />}
                        <span className="font-medium">{area?.name || 'Oblast'}</span>
                        <ChevronDown className="w-2.5 h-2.5" />
                      </button>
                      <button className="btn-playful-base flex items-center gap-1.5 px-2.5 py-1 text-xs bg-primary-100 text-primary-600">
                        <Target className="w-3.5 h-3.5" />
                        <span className="font-medium">{t('goals.status.active') || 'Aktivní'}</span>
                        <ChevronDown className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Dates */}
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex flex-col">
                      <span className="text-gray-500 font-playful mb-0.5">{t('goals.startDate') || 'Datum začátku'}</span>
                      <span className="text-gray-600 font-medium font-playful">
                        {locale === 'en' ? 'January 15, 2025' : '15. ledna 2025'}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-500 font-playful mb-0.5">{t('common.endDate') || 'Cílové datum'}</span>
                      <span className="text-gray-600 font-medium font-playful">
                        {locale === 'en' ? 'June 30, 2025' : '30. června 2025'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Progress bar */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-black font-playful">{t('details.goal.progress') || 'Pokrok'}</span>
                      <span className="text-xl font-bold text-primary-600 font-playful">
                        {goal.progress_percentage}%
                      </span>
                    </div>
                    <div className="w-full bg-white border-2 border-primary-500 rounded-playful-sm h-2.5 overflow-hidden">
                      <div 
                        className="bg-primary-500 h-full rounded-playful-sm transition-all"
                        style={{ width: `${goal.progress_percentage}%` }}
                      />
                    </div>
                  </div>
                  
                  {/* Steps statistics */}
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm text-gray-600 font-medium font-playful">{t('details.goal.totalSteps') || 'Celkem kroků'}:</span>
                      <span className="text-xl font-bold text-black font-playful">10</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm text-gray-600 font-medium font-playful">{t('details.goal.completedSteps') || 'Dokončeno'}:</span>
                      <span className="text-xl font-bold text-primary-600 font-playful">5</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm text-gray-600 font-medium font-playful">{t('details.goal.remainingSteps') || 'Zbývá'}:</span>
                      <span className="text-xl font-bold text-primary-600 font-playful">5</span>
                    </div>
                  </div>
                  
                  {/* Info text */}
                  <p className="text-xs text-gray-600 pt-2 border-t border-gray-200">
                    {t('onboarding.goals.detail') || 'Přidávejte kroky a sledujte pokrok v čase.'}
                  </p>
                </div>
              )
            })()}
          </div>
        </div>
      )
    },
    {
      title: t('onboarding.steps.title') || 'Kroky',
      description: t('onboarding.steps.description') || 'Konkrétní akce vedoucí k cílům. Můžete je naplánovat na datum nebo nastavit jako opakující se.',
      icon: Footprints,
      content: (
        <div className="space-y-3">
          {mockSteps.map((step) => (
            <div key={step.id} className={`flex items-center gap-3 p-3 rounded-playful-md ${
              step.completed ? 'opacity-50 bg-white' : 'bg-white'
            }`}>
              {/* Checkbox */}
              <button
                className={`w-6 h-6 rounded-playful-sm border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
                  step.completed 
                    ? 'bg-primary-500 border-primary-500' 
                    : 'border-primary-500 hover:bg-primary-100'
                }`}
              >
                {step.completed && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
              </button>
              
              {/* Step info */}
              <div className="flex-1 min-w-0">
                <span className={`text-sm ${
                  step.completed 
                    ? 'line-through text-gray-400' 
                    : 'text-black'
                } font-medium`}>
                  {step.title}
                </span>
              </div>
              
              {/* Date and time */}
              <button className="hidden sm:block w-28 text-xs text-center capitalize flex-shrink-0 rounded-playful-sm px-1 py-0.5 transition-colors border-2 text-gray-600 hover:bg-gray-100 border-gray-300">
                {step.date}
              </button>
              <button className="hidden sm:block w-20 text-xs text-center flex-shrink-0 rounded-playful-sm px-1 py-0.5 transition-colors border-2 text-gray-600 hover:bg-gray-100 border-gray-300">
                {step.estimated_time} min
              </button>
            </div>
          ))}
          <div className="mt-4 p-3 bg-primary-50 border-2 border-primary-200 rounded-playful-md">
            <p className="text-xs text-gray-700">
              <span className="font-semibold">{locale === 'cs' ? 'Tip: ' : 'Tip: '}</span>
              {locale === 'cs' 
                ? 'Můžete je naplánovat na datum nebo nastavit jako opakující se.'
                : 'You can schedule them for a date or set them as recurring.'}
            </p>
          </div>
        </div>
      )
    },
    {
      title: t('onboarding.habits.title') || 'Návyky',
      description: t('onboarding.habits.description') || 'Opakovatelné akce. Nastavte frekvenci a sledujte plnění.',
      icon: CheckSquare,
      content: (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-3">
            {mockHabits.slice(0, 3).map((habit) => {
              const isCompleted = habit.habit_completions && (habit.habit_completions as Record<string, boolean>)['2025-01-15'] === true
              const IconComponent = habit.icon ? getIconComponent(habit.icon) : null
              
              return (
                <div
                  key={habit.id}
                  className={`flex items-center gap-2 p-3 rounded-playful-md cursor-pointer transition-all flex-shrink-0 ${
                    isCompleted
                      ? 'bg-primary-100 opacity-75'
                      : 'bg-white'
                  }`}
                >
                  <button
                    className={`flex-shrink-0 w-6 h-6 rounded-playful-sm border-2 flex items-center justify-center transition-colors ${
                      isCompleted
                        ? 'bg-primary-500 border-primary-500'
                        : 'border-primary-500 hover:bg-primary-50'
                    }`}
                  >
                    {isCompleted && <Check className="w-4 h-4 text-white" />}
                  </button>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {IconComponent && (
                      <div className="flex-shrink-0">
                        <IconComponent className="w-5 h-5 text-primary-600" />
                      </div>
                    )}
                    <span className={`text-sm font-medium text-black whitespace-nowrap ${
                      isCompleted ? 'line-through' : ''
                    }`}>
                      {habit.name}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="mt-4 p-3 bg-primary-50 border-2 border-primary-200 rounded-playful-md">
            <p className="text-xs text-gray-700">
              <span className="font-semibold">{locale === 'cs' ? 'Tip: ' : 'Tip: '}</span>
              {t('onboarding.habits.function') || 'Nastavte frekvenci: denně, týdně nebo vlastní dny v týdnu/měsíci.'}
            </p>
          </div>
        </div>
      )
    },
    {
      title: locale === 'cs' ? 'Horní menu' : 'Top Menu',
      description: locale === 'cs' ? 'Hlavní navigace v horní části obrazovky' : 'Main navigation at the top of the screen',
      icon: Menu,
      content: (
        <div className="space-y-4">
          <div className="flex items-center gap-2 p-3 bg-white rounded border-2 border-primary-200">
            <button className="flex items-center gap-2 px-3 py-2 text-sm font-semibold bg-white border-2 border-primary-500 rounded-playful-md">
              <LayoutDashboard className="w-5 h-5 text-primary-600" />
              <span>{locale === 'cs' ? 'Hlavní panel' : 'Main Panel'}</span>
            </button>
            <button className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-white rounded-playful-md">
              <Target className="w-5 h-5" />
              <span>{locale === 'cs' ? 'Cíle' : 'Goals'}</span>
            </button>
            <button className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-white rounded-playful-md">
              <CheckSquare className="w-5 h-5" />
              <span>{locale === 'cs' ? 'Návyky' : 'Habits'}</span>
            </button>
            <button className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-white rounded-playful-md">
              <Footprints className="w-5 h-5" />
              <span>{locale === 'cs' ? 'Kroky' : 'Steps'}</span>
            </button>
            <button className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-white rounded-playful-md">
              <HelpCircle className="w-5 h-5" />
              <span>{locale === 'cs' ? 'Nápověda' : 'Help'}</span>
            </button>
            <button className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-white rounded-playful-md">
              <Settings className="w-5 h-5" />
              <span>{locale === 'cs' ? 'Nastavení' : 'Settings'}</span>
            </button>
          </div>
          <div className="mt-4 p-3 bg-primary-50 border-2 border-primary-200 rounded-playful-md">
            <p className="text-xs text-gray-700">
              <span className="font-semibold">{locale === 'cs' ? 'Tip: ' : 'Tip: '}</span>
              {locale === 'cs' 
                ? 'Horní menu umožňuje rychlý přístup k hlavním sekcím aplikace: Hlavní panel, Cíle, Návyky, Kroky, Nápověda a Nastavení.'
                : 'Top menu provides quick access to main app sections: Main Panel, Goals, Habits, Steps, Help, and Settings.'}
            </p>
          </div>
        </div>
      )
    },
    {
      title: locale === 'cs' ? 'Levé navigační menu' : 'Left Navigation Menu',
      description: locale === 'cs' ? 'Menu, které se mění podle kontextu stránky' : 'Menu that changes based on page context',
      icon: Menu,
      content: (
        <div className="space-y-4">
          <div className="w-64 bg-white border-r-4 border-primary-500 flex flex-col" style={{ minHeight: '200px' }}>
            <div className="p-4 flex-1">
              <h5 className="text-xs font-semibold text-gray-500 mb-2 uppercase">{locale === 'cs' ? 'Hlavní' : 'Main'}</h5>
              <div className="space-y-1">
                <div className="px-3 py-2 text-sm text-primary-600 bg-white border-l-2 border-primary-500">
                  <ListTodo className="w-4 h-4 inline mr-2" />
                  {locale === 'cs' ? 'Nadcházející' : 'Upcoming'}
                </div>
                <div className="px-3 py-2 text-sm text-gray-600 border-l-2 border-transparent">
                  <CalendarDays className="w-4 h-4 inline mr-2" />
                  {locale === 'cs' ? 'Přehled' : 'Overview'}
                </div>
                <div className="px-3 py-2 text-sm text-gray-600 border-l-2 border-transparent">
                  <BarChart3 className="w-4 h-4 inline mr-2" />
                  {locale === 'cs' ? 'Statistiky' : 'Statistics'}
                </div>
              </div>
              <h5 className="text-xs font-semibold text-gray-500 mb-2 mt-4 uppercase">{locale === 'cs' ? 'Správa' : 'Management'}</h5>
              <div className="space-y-1">
                <div className="px-3 py-2 text-sm text-gray-600 border-l-2 border-transparent">
                  <Target className="w-4 h-4 inline mr-2" />
                  {locale === 'cs' ? 'Cíle' : 'Goals'}
                </div>
                <div className="px-3 py-2 text-sm text-gray-600 border-l-2 border-transparent">
                  <CheckSquare className="w-4 h-4 inline mr-2" />
                  {locale === 'cs' ? 'Návyky' : 'Habits'}
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 p-3 bg-primary-50 border-2 border-primary-200 rounded-playful-md">
            <p className="text-xs text-gray-700">
              <span className="font-semibold">{locale === 'cs' ? 'Tip: ' : 'Tip: '}</span>
              {locale === 'cs' 
                ? 'Levé menu se mění podle kontextu stránky. Na hlavním panelu obsahuje hlavní zobrazení (Nadcházející, Přehled, Statistiky) a sekce pro správu (Cíle, Návyky). V jiných stránkách slouží jako kategorie a filtry pro zobrazení obsahu.'
                : 'Left menu changes based on page context. On the main panel, it contains main views (Upcoming, Overview, Statistics) and management sections (Goals, Habits). On other pages, it serves as categories and filters for displaying content.'}
            </p>
          </div>
        </div>
      )
    },
    {
      title: t('onboarding.plusButton.title') || 'Tlačítko Add',
      description: t('onboarding.plusButton.description') || 'Vytvářejte nové prvky přes tlačítko Add v navigaci.',
      icon: Plus,
      content: (
        <div className="space-y-4">
          {/* Mock sidebar */}
          <div className="flex gap-4">
            {/* Sidebar mock */}
            <div className="w-64 bg-white border-r-4 border-primary-500 flex flex-col" style={{ minHeight: '400px' }}>
              {/* Navigation items */}
              <div className="p-4 flex-1">
                <h2 className="text-lg font-bold text-black mb-4 font-playful">{t('navigation.title') || 'Navigace'}</h2>
                <div className="space-y-1.5">
                  <div className="px-3 py-2 text-sm text-gray-600 border-l-2 border-transparent">
                    <ListTodo className="w-4 h-4 inline mr-2" />
                    {locale === 'cs' ? 'Nadcházející' : 'Upcoming'}
                  </div>
                  <div className="px-3 py-2 text-sm text-gray-600 border-l-2 border-transparent">
                    <CalendarDays className="w-4 h-4 inline mr-2" />
                    {locale === 'cs' ? 'Přehled' : 'Overview'}
                  </div>
                  <div className="px-3 py-2 text-sm text-gray-600 border-l-2 border-transparent">
                    <BarChart3 className="w-4 h-4 inline mr-2" />
                    {locale === 'cs' ? 'Statistiky' : 'Statistics'}
                  </div>
                </div>
              </div>
              
              {/* Plus button at bottom */}
              <div className="p-4 border-t-2 border-primary-500 relative">
                {/* Dropdown menu (shown as open) - positioned above button */}
                <div className="absolute left-4 bottom-full mb-2 z-50 bg-white border-2 border-primary-500 rounded-playful-md min-w-[160px] shadow-lg">
                  <button className="w-full text-left px-4 py-2.5 text-sm hover:bg-primary-50 flex items-center gap-2 border-b border-primary-200">
                    <LayoutDashboard className="w-4 h-4 text-primary-600" />
                    <span>{t('onboarding.plusButton.createArea') || 'Vytvořit oblast'}</span>
                  </button>
                  <button className="w-full text-left px-4 py-2.5 text-sm hover:bg-primary-50 flex items-center gap-2 border-b border-primary-200">
                    <Target className="w-4 h-4 text-primary-600" />
                    <span>{t('onboarding.plusButton.createGoal') || 'Vytvořit cíl'}</span>
                  </button>
                  <button className="w-full text-left px-4 py-2.5 text-sm hover:bg-primary-50 flex items-center gap-2 border-b border-primary-200">
                    <Footprints className="w-4 h-4 text-primary-600" />
                    <span>{t('onboarding.plusButton.createStep') || 'Vytvořit krok'}</span>
                  </button>
                  <button className="w-full text-left px-4 py-2.5 text-sm hover:bg-primary-50 flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-primary-600" />
                    <span>{t('onboarding.plusButton.createHabit') || 'Vytvořit návyk'}</span>
                  </button>
                </div>
                
                <button className="w-full px-4 py-2.5 flex items-center justify-center gap-2 bg-white text-primary-600 rounded-playful-md hover:bg-primary-50 transition-colors border-2 border-primary-500 font-semibold">
                  <Plus className="w-5 h-5" strokeWidth={2} />
                  <span>{t('common.add') || 'Vytvořit'}</span>
                </button>
              </div>
            </div>
            
            {/* Main content area mock */}
            <div className="flex-1 bg-white p-6">
              <p className="text-sm text-gray-600">
                {t('onboarding.plusButton.mainContent') || 'Hlavní panel aplikace'}
              </p>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-primary-50 border-2 border-primary-200 rounded-playful-md">
            <p className="text-xs text-gray-700">
              {locale === 'cs' 
                ? 'Tlačítko Add je v dolní části levého navigačního menu. Kliknutím otevřete menu pro vytvoření všech čtyř stavebních bloků.'
                : 'The Add button is at the bottom of the left navigation menu. Click to open the menu for creating all four building blocks.'}
            </p>
          </div>
        </div>
      )
    },
    {
      title: t('onboarding.views.title') || 'Zobrazení',
      description: t('onboarding.views.description') || 'Čtyři hlavní zobrazení pro různé účely.',
      icon: Calendar,
      content: (
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3">
            <div className="p-4 bg-white rounded-lg border-2 border-primary-500 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <ListTodo className="w-5 h-5 text-primary-600" />
                <h4 className="font-bold text-sm">{locale === 'cs' ? 'Nadcházející' : 'Upcoming'}</h4>
              </div>
              <p className="text-xs text-gray-600">
                {locale === 'cs' 
                  ? 'Feed nebo Oblasti zobrazení. Zobrazuje dnešní návyky a nadcházející kroky seřazené podle data.'
                  : 'Feed or Areas view. Shows today\'s habits and upcoming steps sorted by date.'}
              </p>
            </div>
            <div className="p-4 bg-white rounded-lg border-2 border-primary-500 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <CalendarDays className="w-5 h-5 text-primary-600" />
                <h4 className="font-bold text-sm">{locale === 'cs' ? 'Přehled' : 'Overview'}</h4>
              </div>
              <p className="text-xs text-gray-600">
                {locale === 'cs' 
                  ? 'Měsíční kalendář s kroky a návyky.'
                  : 'Monthly calendar with steps and habits.'}
              </p>
            </div>
            <div className="p-4 bg-white rounded-lg border-2 border-primary-500 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-5 h-5 text-primary-600" />
                <h4 className="font-bold text-sm">{locale === 'cs' ? 'Statistiky' : 'Statistics'}</h4>
              </div>
              <p className="text-xs text-gray-600">
                {locale === 'cs' 
                  ? 'Roční přehled pokroku v cílech a návycích.'
                  : 'Yearly overview of progress in goals and habits.'}
              </p>
            </div>
            <div className="p-4 bg-white rounded-lg border-2 border-primary-500 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <LayoutDashboard className="w-5 h-5 text-primary-600" />
                <h4 className="font-bold text-sm">{locale === 'cs' ? 'Oblasti' : 'Areas'}</h4>
              </div>
              <p className="text-xs text-gray-600">
                {locale === 'cs' 
                  ? 'Zobrazuje všechny kroky a cíle, které jsou přiřazené k dané oblasti.'
                  : 'Shows all steps and goals assigned to a specific area.'}
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: t('onboarding.complete.title') || 'Hotovo!',
      description: t('onboarding.complete.description') || 'Začněte vytvářet oblasti, cíle, kroky a návyky.',
      icon: CheckCircle2,
      content: (
        <div className="text-center py-8">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <p className="text-gray-700 text-lg mb-4">
            {t('onboarding.complete.message') || 'Vše je připraveno! Můžete začít používat aplikaci.'}
          </p>
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

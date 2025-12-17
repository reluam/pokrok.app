'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslations, useLocale } from 'next-intl'
import { X, ArrowRight, ArrowLeft, Target, Footprints, CheckSquare, LayoutDashboard, Calendar, TrendingUp, CheckCircle2, Plus, CalendarDays, CalendarRange, CalendarCheck, ChevronDown } from 'lucide-react'
import { getIconComponent } from '@/lib/icon-utils'

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
      { id: '1', name: 'Morning workout', frequency: 'daily', area_id: '1', habit_completions: { '2025-01-15': true, '2025-01-14': true, '2025-01-13': false } },
      { id: '2', name: 'Read 30 minutes', frequency: 'daily', area_id: '1', habit_completions: { '2025-01-15': true, '2025-01-14': true, '2025-01-13': true } },
      { id: '3', name: 'Meditation', frequency: 'daily', area_id: '1', habit_completions: { '2025-01-15': false, '2025-01-14': true, '2025-01-13': true } }
    ]
  }
  return [
    { id: '1', name: 'Ranní cvičení', frequency: 'daily', area_id: '1', habit_completions: { '2025-01-15': true, '2025-01-14': true, '2025-01-13': false } },
    { id: '2', name: 'Čtení 30 minut', frequency: 'daily', area_id: '1', habit_completions: { '2025-01-15': true, '2025-01-14': true, '2025-01-13': true } },
    { id: '3', name: 'Meditace', frequency: 'daily', area_id: '1', habit_completions: { '2025-01-15': false, '2025-01-14': true, '2025-01-13': true } }
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
  
  // Get localized mock data
  const mockAreas = getMockAreas(locale)
  const mockGoals = getMockGoals(locale)
  const mockSteps = getMockSteps(locale)
  const mockHabits = getMockHabits(locale)

  const slides = [
    {
      title: t('onboarding.intro.title') || 'Co je Pokrok?',
      description: t('onboarding.intro.description') || 'Pokrok není jen další aplikace pro produktivitu. Je to nástroj pro organizaci vašeho života a dosahování smysluplných cílů, které vám přinášejí skutečnou hodnotu a naplnění.',
      icon: Target,
      content: (
        <div className="space-y-4">
          <div className="p-6 bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg border-2 border-primary-300">
            <p className="text-gray-700 text-base leading-relaxed mb-4">
              {t('onboarding.intro.detailed') || 'Pokrok vám pomáhá získat jasnost v tom, co je pro vás v životě skutečně důležité. Umožňuje vám organizovat vaše cíle, rozdělit je na dosažitelné kroky a sledovat, jak se posouváte směrem k životu, jaký chcete žít.'}
            </p>
            <div className="mt-4 p-4 bg-white rounded-lg border border-primary-200">
              <p className="text-sm text-gray-700 font-medium">
                {t('onboarding.intro.philosophy') || 'Zaměřujeme se na smysluplnost, ne jen na produktivitu. Každý cíl, krok a návyk by měl mít svůj důvod a přispívat k životu, jaký chcete mít.'}
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: t('onboarding.creating.title') || 'Co vše se dá tvořit?',
      description: t('onboarding.creating.description') || 'V Pokroku můžete vytvářet čtyři hlavní typy stavebních prvků, které vám pomohou organizovat váš život.',
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
              <p className="text-xs text-gray-600">{t('onboarding.creating.goalsDesc') || 'Dlouhodobé cíle, které chcete dosáhnout'}</p>
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
      title: t('onboarding.plusButton.title') || 'Plus tlačítko v navigaci',
      description: t('onboarding.plusButton.description') || 'Na levé straně hlavního panelu najdete Plus tlačítko. Přes něj můžete každý den vytvářet nové building blocky - oblasti, cíle, kroky a návyky.',
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
                    <CalendarDays className="w-4 h-4 inline mr-2" />
                    {t('navigation.focusDay') || 'Den'}
                  </div>
                  <div className="px-3 py-2 text-sm text-gray-600 border-l-2 border-transparent">
                    <CalendarRange className="w-4 h-4 inline mr-2" />
                    {t('navigation.focusWeek') || 'Týden'}
                  </div>
                  <div className="px-3 py-2 text-sm text-gray-600 border-l-2 border-transparent">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    {t('navigation.focusMonth') || 'Měsíc'}
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
            <div className="flex-1 bg-primary-50 p-6">
              <p className="text-sm text-gray-600">
                {t('onboarding.plusButton.mainContent') || 'Hlavní panel aplikace'}
              </p>
            </div>
          </div>
          
          <div className="p-3 bg-primary-50 rounded-lg border border-primary-200">
            <p className="text-xs text-gray-700">
              {t('onboarding.plusButton.hint') || 'Plus tlačítko najdete na spodku levého navigačního panelu. Po kliknutí se zobrazí menu s možnostmi pro vytváření.'}
            </p>
          </div>
        </div>
      )
    },
    {
      title: t('onboarding.areas.title') || 'Oblasti',
      description: t('onboarding.areas.description') || 'Oblasti si vytváříte sami a ideálně to mají být větší životní oblasti nebo rozsáhlejší projekty. Shlukují cíle, kroky a návyky do logických skupin. Každá oblast má vlastní zobrazení a filtry, které vám pomohou soustředit se na konkrétní část vašeho života.',
      icon: LayoutDashboard,
      content: (
        <div className="space-y-3">
          <div className="p-3 bg-primary-50 rounded-lg border border-primary-200 mb-3">
            <p className="text-xs text-gray-700 font-medium mb-1">
              {t('onboarding.areas.createYourself') || 'Oblasti si vytváříte sami'}
            </p>
            <p className="text-xs text-gray-600">
              {t('onboarding.areas.examples') || 'Ideálně to mají být větší životní oblasti (např. Zdraví, Kariéra, Vztahy) nebo rozsáhlejší projekty (např. Nový byt, Vlastní firma).'}
            </p>
          </div>
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
          <div className="p-3 bg-primary-50 rounded-lg border border-primary-200">
            <p className="text-xs text-gray-700">
              {t('onboarding.areas.function') || 'Oblasti umožňují filtrovat a zobrazit pouze relevantní obsah pro danou oblast vašeho života.'}
            </p>
          </div>
        </div>
      )
    },
    {
      title: t('onboarding.goals.title') || 'Cíle',
      description: t('onboarding.goals.description') || 'Cíle jsou smysluplné výsledky, které chcete dosáhnout. Nejsou to jen úkoly - jsou to cesty k životu, jaký chcete žít. Ke každému cíli můžete přidat kroky a metriky, díky čemuž vidíte, jak se blížíte k jeho dosažení.',
      icon: Target,
      content: (
        <div className="space-y-4">
          {/* Mock Goal Detail Page - scaled down */}
          <div className="p-4 bg-white rounded-lg border-2 border-primary-500 shadow-sm scale-90 origin-top">
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
                    {t('onboarding.goals.detail') || 'V detailu cíle můžete přidávat kroky, nastavovat metriky a sledovat pokrok v čase. Každý krok vás přibližuje k životu, jaký chcete žít.'}
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
      description: t('onboarding.steps.description') || 'Kroky slouží dvojímu účelu: jsou to jednotlivé kroky vedoucí k dosažení cíle, ale zároveň také To-Do úkoly, které můžete plánovat na konkrétní dny.',
      icon: Footprints,
      content: (
        <div className="space-y-3">
          <div className="p-3 bg-primary-50 rounded-lg border border-primary-200">
            <p className="text-xs text-gray-700 mb-2">
              {t('onboarding.steps.function') || 'Kroky můžete přiřadit k cílům a naplánovat je na konkrétní datum. Každý krok může mít odhadovaný čas a může být označen jako splněný.'}
            </p>
          </div>
          {mockSteps.map((step) => (
            <div key={step.id} className={`p-3 bg-white rounded-lg border-2 ${step.completed ? 'border-green-500 bg-green-50' : 'border-primary-500'} shadow-sm`}>
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${step.completed ? 'bg-green-500 border-green-500' : 'border-primary-500'}`}>
                  {step.completed && <CheckCircle2 className="w-3 h-3 text-white" />}
                </div>
                <div className="flex-1">
                  <span className={`text-sm font-medium ${step.completed ? 'line-through text-gray-500' : 'text-black'}`}>
                    {step.title}
                  </span>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {t('onboarding.steps.date') || 'Datum:'} {step.date}
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  {step.estimated_time} min
                </div>
              </div>
            </div>
          ))}
        </div>
      )
    },
    {
      title: t('onboarding.habits.title') || 'Návyky',
      description: t('onboarding.habits.description') || 'Návyky jsou opakovatelné akce, které můžete vázat k oblasti. V tabulce plnění vidíte, jak často jste návyk dodržovali.',
      icon: CheckSquare,
      content: (
        <div className="space-y-4">
          <div className="p-4 bg-white rounded-lg border-2 border-primary-500 shadow-sm">
            <div className="mb-3">
              <h4 className="text-sm font-bold mb-2">{t('onboarding.habits.tableTitle') || 'Tabulka plnění návyků'}</h4>
              <div className="flex items-center gap-2 mb-2 text-xs text-gray-600">
                <span className="w-24">{t('onboarding.habits.habitName') || 'Návyk'}</span>
                <div className="flex gap-1">
                  {(locale === 'en' 
                    ? ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU']
                    : ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne']
                  ).map((day) => (
                    <div key={day} className="w-8 h-8 flex items-center justify-center text-xs font-medium text-gray-500">
                      {day}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {mockHabits.slice(0, 2).map((habit) => (
              <div key={habit.id} className="flex items-center gap-2 mb-2">
                <span className="w-24 text-sm font-medium text-gray-700 truncate">{habit.name}</span>
                <div className="flex gap-1">
                  {['2025-01-13', '2025-01-14', '2025-01-15', '2025-01-16', '2025-01-17', '2025-01-18', '2025-01-19'].map((date) => {
                    const isCompleted = (habit.habit_completions as Record<string, boolean>)[date] === true
                    return (
                      <div
                        key={date}
                        className={`w-8 h-8 rounded border-2 flex items-center justify-center ${
                          isCompleted ? 'bg-primary-500 border-primary-500' : 'bg-gray-100 border-gray-300'
                        }`}
                      >
                        {isCompleted && <CheckCircle2 className="w-4 h-4 text-white" />}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
          <div className="p-3 bg-primary-50 rounded-lg border border-primary-200">
            <p className="text-xs text-gray-700">
              {t('onboarding.habits.function') || 'Návyky můžete vázat k oblasti a nastavit jejich frekvenci (denně, týdně, nebo vlastní dny).'}
            </p>
          </div>
        </div>
      )
    },
    {
      title: t('onboarding.views.title') || 'Úrovně zobrazení',
      description: t('onboarding.views.description') || 'Pokrok nabízí čtyři různé úrovně zobrazení, každá vhodná pro jiný účel. Jednotlivé views najdete v navigation menu vlevo na hlavním panelu.',
      icon: Calendar,
      content: (
        <div className="space-y-3">
          <div className="p-3 bg-primary-50 rounded-lg border border-primary-200 mb-3">
            <p className="text-xs text-gray-700">
              {t('onboarding.views.location') || 'Jednotlivé views najdete v navigation menu vlevo na hlavním panelu.'}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 bg-white rounded-lg border-2 border-primary-500 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <CalendarDays className="w-5 h-5 text-primary-600" />
                <h4 className="font-bold text-sm">{t('onboarding.views.daily') || 'Denní'}</h4>
              </div>
              <p className="text-xs text-gray-600">
                {t('onboarding.views.dailyDesc') || 'Ideální pro každodenní práci a rutiny. Zobrazuje kroky a návyky pro konkrétní den.'}
              </p>
            </div>
            <div className="p-4 bg-white rounded-lg border-2 border-primary-500 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <CalendarRange className="w-5 h-5 text-primary-600" />
                <h4 className="font-bold text-sm">{t('onboarding.views.weekly') || 'Týdenní'}</h4>
              </div>
              <p className="text-xs text-gray-600">
                {t('onboarding.views.weeklyDesc') || 'Přehled jednotlivých kroků v týdnu. Umožňuje plánovat a organizovat úkoly na celý týden.'}
              </p>
            </div>
            <div className="p-4 bg-white rounded-lg border-2 border-primary-500 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-primary-600" />
                <h4 className="font-bold text-sm">{t('onboarding.views.monthly') || 'Měsíční'}</h4>
              </div>
              <p className="text-xs text-gray-600">
                {t('onboarding.views.monthlyDesc') || 'Slouží k většímu overview. Zobrazuje kalendář s kroky a návyky pro celý měsíc.'}
              </p>
            </div>
            <div className="p-4 bg-white rounded-lg border-2 border-primary-500 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <CalendarCheck className="w-5 h-5 text-primary-600" />
                <h4 className="font-bold text-sm">{t('onboarding.views.yearly') || 'Roční'}</h4>
              </div>
              <p className="text-xs text-gray-600">
                {t('onboarding.views.yearlyDesc') || 'Přehled posunu v jednotlivých cílech. Zobrazuje timeline s progress bary pro všechny cíle.'}
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: t('onboarding.complete.title') || 'Tutoriál dokončen!',
      description: t('onboarding.complete.description') || 'Nyní víte, jak používat Pokrok. Začněte vytvářet své oblasti, cíle, kroky a návyky a posouvejte se směrem k životu plnému smyslu a naplnění!',
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

  const handleNext = () => {
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
          <div className="bg-gray-50 rounded-lg p-6 border-2 border-gray-200">
            {currentSlideData.content}
          </div>
        </div>

        {/* Footer with navigation */}
        <div className="flex items-center justify-between p-6 border-t-2 border-primary-200 bg-gray-50">
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

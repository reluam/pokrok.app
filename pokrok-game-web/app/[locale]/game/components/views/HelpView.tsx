'use client'

import { useState, useMemo, useCallback } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { HelpCircle, Target, Footprints, CheckSquare, Plus, ArrowRight, Menu, Rocket, Calendar, Eye, Sparkles, TrendingUp, Clock, Star, Zap, BookOpen, AlertTriangle, Settings, Check, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { getLocalDateString } from '../utils/dateHelpers'

interface HelpViewProps {
  onAddGoal?: () => void
  onAddStep?: () => void
  onAddHabit?: () => void
  onNavigateToGoals?: () => void
  onNavigateToHabits?: () => void
  onNavigateToSteps?: () => void
  onNavigateToManagement?: () => void
  realGoals?: any[]
  realHabits?: any[]
  realSteps?: any[]
}

type HelpCategory = 'getting-started' | 'overview' | 'goals' | 'steps' | 'habits'

// Compact Step Component
function Step({ number, text }: { number: number; text: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{number}</span>
      <span className="text-sm text-gray-700">{text}</span>
    </div>
  )
}

// Compact Tip Component
function Tip({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-2 text-sm text-gray-600">
      <span className="text-orange-500 mt-0.5">•</span>
      <span>{text}</span>
    </li>
  )
}

export function HelpView({
  onAddGoal,
  onAddStep,
  onAddHabit,
  onNavigateToGoals,
  onNavigateToHabits,
  onNavigateToSteps,
}: HelpViewProps) {
  const t = useTranslations('help')
  const tCommon = useTranslations()
  const locale = useLocale()
  const localeCode = locale === 'cs' ? 'cs-CZ' : 'en-US'
  const [selectedCategory, setSelectedCategory] = useState<HelpCategory>('getting-started')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  // State for Focus section - week/day view
  const getWeekStart = (date: Date): Date => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    const weekStart = new Date(d)
    weekStart.setDate(diff)
    weekStart.setHours(0, 0, 0, 0)
    return weekStart
  }
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const [focusWeekStart, setFocusWeekStart] = useState<Date>(() => getWeekStart(new Date()))
  const [focusSelectedDay, setFocusSelectedDay] = useState<Date | null>(null)
  
  // Week days for focus
  const focusWeekDays = useMemo(() => {
    const days: Date[] = []
    const start = new Date(focusWeekStart)
    for (let i = 0; i < 7; i++) {
      const day = new Date(start)
      day.setDate(start.getDate() + i)
      days.push(day)
    }
    return days
  }, [focusWeekStart])
  
  const dayNamesShort = localeCode === 'cs-CZ' 
    ? ['Ne', 'Po', 'Út', 'St', 'Čt', 'Pá', 'So']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  
  const handleFocusDayClick = useCallback((day: Date) => {
    const dateStr = getLocalDateString(day)
    const currentSelectedStr = focusSelectedDay ? getLocalDateString(focusSelectedDay) : null
    
    if (currentSelectedStr === dateStr) {
      // Click on same day = back to week view
      setFocusSelectedDay(null)
    } else {
      setFocusSelectedDay(day)
    }
  }, [focusSelectedDay])
  
  const handleFocusPrevWeek = useCallback(() => {
    const newStart = new Date(focusWeekStart)
    newStart.setDate(newStart.getDate() - 7)
    setFocusWeekStart(newStart)
    setFocusSelectedDay(null)
  }, [focusWeekStart])
  
  const handleFocusNextWeek = useCallback(() => {
    const newStart = new Date(focusWeekStart)
    newStart.setDate(newStart.getDate() + 7)
    setFocusWeekStart(newStart)
    setFocusSelectedDay(null)
  }, [focusWeekStart])

  const categories = [
    { id: 'getting-started' as HelpCategory, label: t('categories.gettingStarted'), icon: Rocket },
    { id: 'overview' as HelpCategory, label: t('categories.focus'), icon: HelpCircle },
    { id: 'goals' as HelpCategory, label: t('categories.goals'), icon: Target },
    { id: 'steps' as HelpCategory, label: t('categories.steps'), icon: Footprints },
    { id: 'habits' as HelpCategory, label: t('categories.habits'), icon: CheckSquare },
  ]

  const days = [
    t('days.mon'), t('days.tue'), t('days.wed'), t('days.thu'), t('days.fri'), t('days.sat'), t('days.sun')
  ]

  const renderContent = () => {
    switch (selectedCategory) {
      case 'getting-started':
        return (
          <div className="space-y-6">
            {/* Hero */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-6 text-white">
              <div className="flex items-center gap-3 mb-3">
                <Rocket className="w-8 h-8" />
                <h2 className="text-2xl font-bold">{t('gettingStarted.welcome')}</h2>
              </div>
              <p className="text-orange-100">
                {t.rich('gettingStarted.tagline', {
                  strong: (chunks) => <strong>{chunks}</strong>
                })}
              </p>
            </div>

            {/* 3 Steps */}
            <div className="space-y-8 mt-6">
              {/* Step 1 - Goals */}
              <div className="bg-white rounded-xl border border-orange-200 p-6">
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
                    <Target className="w-5 h-5 text-orange-500" /> {t('gettingStarted.step1.title')}
                  </h4>
                  <div className="text-sm text-gray-700 leading-relaxed space-y-2">
                    {t.rich('gettingStarted.step1.subtitle', {
                      strong: (chunks) => <strong className="text-gray-900 font-semibold">{chunks}</strong>
                    })}
                  </div>
                </div>
                
                {/* Example Goal Card */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-4 overflow-hidden">
                  <div className="p-5 border-b border-gray-100">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex-shrink-0">
                          <Target className="w-6 h-6 text-orange-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {t('gettingStarted.step1.example')}
                        </h3>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      {t('gettingStarted.step1.exampleDesc')}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-green-100 text-green-700">
                        <Target className="w-3.5 h-3.5" />
                        {tCommon('goals.status.active')}
                      </span>
                      <span className="text-xs text-gray-500">{t('gettingStarted.step1.exampleDeadline')}</span>
                    </div>
                  </div>
                  <div className="px-5 py-3 bg-gray-50">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-600">{t('gettingStarted.step1.exampleProgress')}</span>
                      <span className="text-xs font-medium text-gray-700">{t('gettingStarted.step1.exampleStepsCount')}</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-orange-500 rounded-full" style={{ width: '40%' }} />
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  {onAddGoal && (
                    <button onClick={onAddGoal} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600">
                      <Plus className="w-4 h-4" /> {t('gettingStarted.step1.button')}
                    </button>
                  )}
                  {onNavigateToGoals && (
                    <button onClick={onNavigateToGoals} className="px-3 py-2 border border-orange-200 text-orange-600 text-sm rounded-lg hover:bg-orange-50">
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Step 2 - Steps */}
              <div className="bg-white rounded-xl border border-orange-200 p-6">
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
                    <Footprints className="w-5 h-5 text-orange-500" /> {t('gettingStarted.step2.title')}
                  </h4>
                  <div className="text-sm text-gray-700 leading-relaxed space-y-2">
                    {t.rich('gettingStarted.step2.subtitle', {
                      strong: (chunks) => <strong className="text-gray-900 font-semibold">{chunks}</strong>
                    })}
                  </div>
                </div>
                
                {/* Example Step Cards */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-3 p-3 rounded-xl border-2 border-orange-400 bg-orange-50/30">
                    <div className="w-6 h-6 rounded-lg border-2 border-orange-400 bg-orange-500 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                    </div>
                    <span className="flex-1 text-sm font-medium text-orange-600">
                      {t('gettingStarted.step2.example1')}
                    </span>
                    <span className="hidden sm:block w-20 text-xs text-center text-orange-600 capitalize">{t('gettingStarted.step2.today')}</span>
                    <span className="hidden sm:block w-14 text-xs text-gray-400 text-center">{t('gettingStarted.step2.example1Time')}</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl border-2 border-gray-200 bg-white">
                    <div className="w-6 h-6 rounded-lg border-2 border-gray-300 flex items-center justify-center flex-shrink-0">
                    </div>
                    <span className="flex-1 text-sm font-medium text-gray-500">
                      {t('gettingStarted.step2.example2')}
                    </span>
                    <span className="hidden sm:block w-20 text-xs text-center text-gray-500 capitalize">{t('gettingStarted.step2.tomorrow')}</span>
                    <span className="hidden sm:block w-14 text-xs text-gray-400 text-center">{t('gettingStarted.step2.example2Time')}</span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  {onAddStep && (
                    <button onClick={onAddStep} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600">
                      <Plus className="w-4 h-4" /> {t('gettingStarted.step2.button')}
                    </button>
                  )}
                  {onNavigateToSteps && (
                    <button onClick={onNavigateToSteps} className="px-3 py-2 border border-orange-200 text-orange-600 text-sm rounded-lg hover:bg-orange-50">
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Step 3 - Habits */}
              <div className="bg-white rounded-xl border border-orange-200 p-6">
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
                    <CheckSquare className="w-5 h-5 text-orange-500" /> {t('gettingStarted.step3.title')}
                  </h4>
                  <div className="text-sm text-gray-700 leading-relaxed space-y-2">
                    {t.rich('gettingStarted.step3.subtitle', {
                      strong: (chunks) => <strong className="text-gray-900 font-semibold">{chunks}</strong>
                    })}
                  </div>
                </div>
                
                {/* Example Habit Timeline */}
                <div className="bg-white rounded-xl border-2 border-gray-200 p-4 mb-4">
                  {/* Header with day names */}
                  <div className="flex items-center gap-1 mb-2 pl-[100px]">
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
                        <div key={idx} className="w-7 h-7 flex flex-col items-center justify-center text-[9px] rounded text-gray-400">
                          <span className="uppercase leading-none">{day}</span>
                          <span className="text-[8px] leading-none">{startDate + idx}</span>
                        </div>
                      ))
                    })()}
                  </div>
                  
                  {/* Habits with boxes */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      <button className="w-[100px] text-left text-[11px] font-medium text-gray-600 hover:text-orange-600 transition-colors truncate flex-shrink-0">
                        {t('gettingStarted.step3.example1')}
                      </button>
                      <div className="flex gap-1">
                        <div className="w-7 h-7 rounded bg-orange-500 flex items-center justify-center shadow-sm">
                          <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                        </div>
                        <div className="w-7 h-7 rounded bg-orange-500 flex items-center justify-center shadow-sm">
                          <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                        </div>
                        <div className="w-7 h-7 rounded bg-orange-100"></div>
                        <div className="w-7 h-7 rounded bg-orange-100"></div>
                        <div className="w-7 h-7 rounded bg-orange-100"></div>
                        <div className="w-7 h-7 rounded bg-orange-100"></div>
                        <div className="w-7 h-7 rounded bg-orange-100"></div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button className="w-[100px] text-left text-[11px] font-medium text-gray-600 hover:text-orange-600 transition-colors truncate flex-shrink-0">
                        {t('gettingStarted.step3.example2')}
                      </button>
                      <div className="flex gap-1">
                        <div className="w-7 h-7 rounded bg-orange-500 flex items-center justify-center shadow-sm">
                          <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                        </div>
                        <div className="w-7 h-7 rounded bg-orange-100"></div>
                        <div className="w-7 h-7 rounded bg-orange-100"></div>
                        <div className="w-7 h-7 rounded bg-orange-100"></div>
                        <div className="w-7 h-7 rounded bg-orange-100"></div>
                        <div className="w-7 h-7 rounded bg-orange-100"></div>
                        <div className="w-7 h-7 rounded bg-orange-100"></div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  {onAddHabit && (
                    <button onClick={onAddHabit} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600">
                      <Plus className="w-4 h-4" /> {t('gettingStarted.step3.button')}
                    </button>
                  )}
                  {onNavigateToHabits && (
                    <button onClick={onNavigateToHabits} className="px-3 py-2 border border-orange-200 text-orange-600 text-sm rounded-lg hover:bg-orange-50">
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* What's Next */}
            <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-orange-500" /> {t('gettingStarted.whatsNext')}
              </h4>
              <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-orange-400" />
                  <span>{t('gettingStarted.nextItems.dailyOverview')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-orange-400" />
                  <span>{t('gettingStarted.nextItems.completeSteps')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-orange-400" />
                  <span>{t('gettingStarted.nextItems.focusImportant')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-orange-400" />
                  <span>{t('gettingStarted.nextItems.trackProgress')}</span>
                </div>
              </div>
            </div>
          </div>
        )

      case 'overview':
        const isWeekView = !focusSelectedDay
        const displayDate = focusSelectedDay || focusWeekStart
        const todayStr = getLocalDateString(today)
        
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-6 text-white">
              <h2 className="text-2xl font-bold mb-2">{t('focusHelp.title')}</h2>
              <p className="text-orange-100">{t('focusHelp.subtitle')}</p>
            </div>

            {/* Weekly Focus - Interactive Timeline */}
            <div className="bg-white rounded-xl border border-orange-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-orange-500" />
                {isWeekView ? t('focusHelp.weeklyFocus') : t('focusHelp.dailyFocus')}
              </h3>
              
              {/* Timeline */}
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-orange-100 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={handleFocusPrevWeek}
                    className="p-2 hover:bg-orange-100 rounded-lg transition-colors text-gray-500 hover:text-orange-600"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  
                  <div className="flex items-center gap-2 flex-1 justify-center">
                    <div className="relative flex items-center w-full max-w-xl">
                      <div className="absolute left-4 right-4 h-0.5 bg-gray-200 top-3" />
                      
                      <div className="relative flex justify-between w-full">
                        {focusWeekDays.map((day) => {
                          const dateStr = getLocalDateString(day)
                          const isToday = dateStr === todayStr
                          const isSelected = focusSelectedDay && getLocalDateString(focusSelectedDay) === dateStr
                          const isPast = day < today
                          const isFuture = day > today
                          
                          // Example stats for help
                          let completionPercentage = 0
                          if (isPast) {
                            completionPercentage = day.getDate() % 3 === 0 ? 100 : day.getDate() % 3 === 1 ? 75 : 0
                          }
                          
                          let dotColor = 'bg-gray-200'
                          if (isToday) {
                            dotColor = isSelected ? 'bg-orange-500 ring-4 ring-orange-200' : 'bg-orange-500'
                          } else if (isPast) {
                            if (completionPercentage === 100) {
                              dotColor = isSelected ? 'bg-orange-600 ring-4 ring-orange-200' : 'bg-orange-600'
                            } else if (completionPercentage === 0) {
                              dotColor = isSelected ? 'bg-white ring-4 ring-orange-200' : 'bg-white'
                            } else {
                              dotColor = 'bg-transparent'
                            }
                          }
                          
                          return (
                            <button
                              key={dateStr}
                              onClick={() => handleFocusDayClick(day)}
                              className="flex flex-col items-center group"
                            >
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all relative z-10 ${dotColor === 'bg-transparent' ? 'bg-white' : dotColor}`}>
                                {isPast && completionPercentage === 100 && (
                                  <Check className="w-3 h-3 text-white" strokeWidth={3} />
                                )}
                                {isPast && completionPercentage === 0 && (
                                  <X className="w-6 h-6 text-orange-600" strokeWidth={2.5} />
                                )}
                                {isPast && completionPercentage > 0 && completionPercentage < 100 && (
                                  <svg className="w-6 h-6 absolute inset-0" viewBox="0 0 24 24">
                                    <circle cx="12" cy="12" r="10" fill="none" stroke="#e5e7eb" strokeWidth="2" />
                                    <circle
                                      cx="12"
                                      cy="12"
                                      r="10"
                                      fill="none"
                                      stroke="#ea580c"
                                      strokeWidth="4"
                                      strokeDasharray={`${2 * Math.PI * 10 * (completionPercentage / 100)} ${2 * Math.PI * 10 * (1 - completionPercentage / 100)}`}
                                      strokeDashoffset={0}
                                      transform="rotate(-90 12 12)"
                                      strokeLinecap="round"
                                    />
                                  </svg>
                                )}
                              </div>
                              
                              <span className={`text-xs font-semibold mt-1 uppercase ${isSelected ? 'text-orange-600' : 'text-gray-500'}`}>
                                {dayNamesShort[day.getDay()]}
                              </span>
                              
                              <span className={`text-lg font-bold ${isSelected ? 'text-orange-600' : 'text-gray-900'}`}>
                                {day.getDate()}
                              </span>
                              
                              <span className={`text-[10px] ${isSelected ? 'text-orange-600' : 'text-gray-400'}`}>
                                {isPast ? `${completionPercentage === 100 ? 5 : completionPercentage === 75 ? 3 : 0}/5` : '—'}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleFocusNextWeek}
                    disabled={focusWeekStart >= getWeekStart(today)}
                    className={`p-2 rounded-lg transition-colors ${
                      focusWeekStart >= getWeekStart(today)
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:bg-orange-100 text-gray-500 hover:text-orange-600'
                    }`}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              {/* Focus Content - Week or Day View */}
              {isWeekView ? (
                <div className="space-y-4">
                  {/* Habits Section */}
                  <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">1</span>
                      <h4 className="font-semibold text-gray-900">{t('focusHelp.habits')}</h4>
                    </div>
                    <div className="flex items-center gap-1 mb-2 pl-[100px]">
                      {focusWeekDays.map((day) => (
                        <div key={getLocalDateString(day)} className="w-7 h-7 flex flex-col items-center justify-center text-[9px] rounded text-gray-400">
                          <span className="uppercase leading-none">{dayNamesShort[day.getDay()]}</span>
                          <span className="text-[8px] leading-none">{day.getDate()}</span>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <span className="w-[100px] text-left text-[11px] font-medium text-gray-600 flex-shrink-0">
                          {t('gettingStarted.step3.example1')}
                        </span>
                        <div className="flex gap-1">
                          <div className="w-7 h-7 rounded bg-orange-500 flex items-center justify-center shadow-sm">
                            <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                          </div>
                          <div className="w-7 h-7 rounded bg-orange-500 flex items-center justify-center shadow-sm">
                            <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                          </div>
                          <div className="w-7 h-7 rounded bg-orange-100"></div>
                          <div className="w-7 h-7 rounded bg-orange-100"></div>
                          <div className="w-7 h-7 rounded bg-orange-100"></div>
                          <div className="w-7 h-7 rounded bg-orange-100"></div>
                          <div className="w-7 h-7 rounded bg-orange-100"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Steps Section */}
                  <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">2</span>
                      <h4 className="font-semibold text-gray-900">{t('focusHelp.steps')}</h4>
                    </div>
                    <div className="space-y-2">
                      {/* Today's Steps */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="w-5 h-5 bg-orange-400 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">2a</span>
                          <span className="text-xs font-medium text-gray-700">{t('focusHelp.todaySteps')}</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-xl border-2 border-orange-400 bg-orange-50/30 ml-7">
                          <div className="w-6 h-6 rounded-lg border-2 border-orange-400 bg-orange-500 flex items-center justify-center flex-shrink-0">
                            <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                          </div>
                          <span className="flex-1 text-sm font-medium text-orange-600">
                            {t('gettingStarted.step2.example1')}
                          </span>
                        </div>
                      </div>
                      
                      {/* Overdue Steps */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">2b</span>
                          <span className="text-xs font-medium text-gray-700">{t('focusHelp.overdueSteps')}</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-xl border-2 border-red-300 bg-red-50/30 ml-7">
                          <div className="w-6 h-6 rounded-lg border-2 border-red-400 flex items-center justify-center flex-shrink-0">
                          </div>
                          <span className="flex-1 text-sm font-medium text-red-600">
                            {t('focusHelp.exampleOverdueStep')}
                          </span>
                        </div>
                      </div>
                      
                      {/* Future Steps */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="w-5 h-5 bg-gray-400 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">2c</span>
                          <span className="text-xs font-medium text-gray-700">{t('focusHelp.futureSteps')}</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-xl border-2 border-gray-200 bg-white ml-7">
                          <div className="w-6 h-6 rounded-lg border-2 border-gray-300 flex items-center justify-center flex-shrink-0">
                          </div>
                          <span className="flex-1 text-sm font-medium text-gray-500">
                            {t('gettingStarted.step2.example2')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Day View - Habits */}
                  <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">1</span>
                      <h4 className="font-semibold text-gray-900">{t('focusHelp.habits')}</h4>
                    </div>
                    <div className="flex items-center gap-1 mb-1">
                      <div className="w-[100px] flex-shrink-0" />
                      <div className="w-7 h-7 flex flex-col items-center justify-center text-[9px] rounded bg-orange-100 text-orange-700 font-semibold">
                        <span className="uppercase leading-none">{dayNamesShort[focusSelectedDay!.getDay()]}</span>
                        <span className="text-[8px] leading-none">{focusSelectedDay!.getDate()}</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <span className="w-[100px] text-left text-[11px] font-medium text-gray-600 flex-shrink-0">
                          {t('gettingStarted.step3.example1')}
                        </span>
                        <div className="w-7 h-7 rounded bg-orange-500 flex items-center justify-center shadow-sm">
                          <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Day View - Steps */}
                  <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">2</span>
                      <h4 className="font-semibold text-gray-900">{t('focusHelp.steps')}</h4>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 p-3 rounded-xl border-2 border-orange-400 bg-orange-50/30">
                        <div className="w-6 h-6 rounded-lg border-2 border-orange-400 bg-orange-500 flex items-center justify-center flex-shrink-0">
                          <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                        </div>
                        <span className="flex-1 text-sm font-medium text-orange-600">
                          {t('gettingStarted.step2.example1')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Description below focus */}
              <div className="mt-6 bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-3">{t('focusHelp.descriptionTitle')}</h4>
                <div className="space-y-3 text-sm text-gray-700">
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</span>
                    <div>
                      <p className="font-medium text-gray-900 mb-1">{t('focusHelp.habits')}</p>
                      <p>{t('focusHelp.habitsDescription')}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</span>
                    <div>
                      <p className="font-medium text-gray-900 mb-1">{t('focusHelp.steps')}</p>
                      <p className="mb-2">{t('focusHelp.stepsDescription')}</p>
                      <div className="ml-4 space-y-1.5 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 bg-orange-400 text-white rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0">2a</span>
                          <span>{t('focusHelp.todayStepsDescription')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0">2b</span>
                          <span>{t('focusHelp.overdueStepsDescription')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 bg-gray-400 text-white rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0">2c</span>
                          <span>{t('focusHelp.futureStepsDescription')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</span>
                    <div>
                      <p className="font-medium text-gray-900 mb-1">{t('focusHelp.timeline')}</p>
                      <p>{t('focusHelp.timelineDescription')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case 'goals':
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-6 text-white flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Target className="w-7 h-7" /> {t('goalsHelp.title')}
                </h2>
                <p className="text-orange-100 text-sm mt-1">{t('goalsHelp.subtitle')}</p>
              </div>
                {onAddGoal && (
                <button onClick={onAddGoal} className="flex items-center gap-1 px-4 py-2 bg-white text-orange-600 font-medium rounded-lg hover:bg-orange-50">
                  <Plus className="w-4 h-4" /> {t('goalsHelp.add')}
                  </button>
                )}
            </div>

            {/* What are goals */}
            <div className="bg-white rounded-xl border border-orange-200 p-4">
              <h4 className="font-semibold text-gray-900 mb-2">{t('goalsHelp.whatAreGoals')}</h4>
              <p className="text-sm text-gray-600 mb-3">{t('goalsHelp.whatAreGoalsDesc')}</p>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full flex items-center gap-1">
                  <Target className="w-3 h-3" /> {t('goalsHelp.measurable')}
                </span>
                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> {t('goalsHelp.withDeadline')}
                </span>
                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full flex items-center gap-1">
                  <Star className="w-3 h-3" /> {t('goalsHelp.inFocus')}
                </span>
              </div>
            </div>

            {/* Example Goal Card */}
            <div className="bg-white rounded-xl border border-orange-200 p-4">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Eye className="w-4 h-4 text-orange-500" /> {t('goalsHelp.exampleTitle')}
              </h4>
              <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Target className="w-5 h-5 text-orange-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h5 className="font-semibold text-gray-900">{t('goalsHelp.exampleName')}</h5>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{t('goalsHelp.active')}</span>
              </div>
                    <p className="text-sm text-gray-500 mt-1">{t('goalsHelp.exampleDesc')}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {t('goalsHelp.exampleDeadline')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Footprints className="w-3 h-3" /> {t('goalsHelp.exampleSteps')}
                      </span>
                </div>
                  </div>
                </div>
              </div>
              <div className="mt-3 text-xs text-gray-500 space-y-1">
                <p><strong className="text-green-600">{t('goalsHelp.active')}</strong> = {t('goalsHelp.activeExplanation').split(' = ')[1]}</p>
                <p><strong className="text-gray-600">{t('goalsHelp.tableDeadline')}</strong> = {t('goalsHelp.deadlineExplanation').split(' = ')[1]}</p>
              </div>
            </div>

            {/* Goals Cards Example */}
            <div className="bg-white rounded-xl border border-orange-200 p-4">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Eye className="w-4 h-4 text-orange-500" /> {t('goalsHelp.cardsTitle')}
              </h4>
              <div className="space-y-3">
                {/* Filter checkboxes example */}
                <div className="flex gap-3 pb-2 border-b border-gray-100">
                  <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                    <input type="checkbox" checked className="w-4 h-4 text-orange-600 border-gray-300 rounded" readOnly />
                    <span className="text-gray-700">{t('goalsHelp.active')}</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 text-orange-600 border-gray-300 rounded" readOnly />
                    <span className="text-gray-500">{t('goalsHelp.postponed')}</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 text-orange-600 border-gray-300 rounded" readOnly />
                    <span className="text-gray-500">{t('goalsHelp.completed')}</span>
                  </label>
                </div>
                
                {/* Goal cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Active goal card */}
                  <div className="bg-white border border-orange-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Target className="w-5 h-5 text-orange-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h5 className="font-semibold text-gray-900">{t('goalsHelp.tableExample1')}</h5>
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{t('goalsHelp.active')}</span>
                        </div>
                        <p className="text-xs text-gray-500 mb-2">Chci vytvořit vlastní webovou aplikaci</p>
                        <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                          <span>15.3.2025</span>
                          <span>3 kroky</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div className="bg-orange-600 h-1.5 rounded-full" style={{ width: '33%' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Active goal card 2 */}
                  <div className="bg-white border border-orange-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Target className="w-5 h-5 text-orange-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h5 className="font-semibold text-gray-900">{t('goalsHelp.tableExample2')}</h5>
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{t('goalsHelp.active')}</span>
                        </div>
                        <p className="text-xs text-gray-500 mb-2">Pravidelné cvičení pro zdraví</p>
                        <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                          <span>—</span>
                          <span>5 kroků</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div className="bg-orange-600 h-1.5 rounded-full" style={{ width: '60%' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Paused goal card */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 opacity-60 cursor-pointer">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Target className="w-5 h-5 text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h5 className="font-semibold text-gray-500">{t('goalsHelp.tableExample3')}</h5>
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{t('goalsHelp.postponed')}</span>
                        </div>
                        <p className="text-xs text-gray-400 mb-2">Přečíst 12 knih tento rok</p>
                        <div className="flex items-center justify-between text-xs text-gray-300 mb-2">
                          <span>31.12.2025</span>
                          <span>0 kroků</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div className="bg-gray-400 h-1.5 rounded-full" style={{ width: '0%' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-3 text-xs text-gray-500 space-y-1">
                <p>{t('goalsHelp.cardsClickHint')}</p>
                <p>{t('goalsHelp.cardsFiltersHint')}</p>
                <p>{t('goalsHelp.cardsStatusHint')}</p>
              </div>
            </div>

            {/* How to create */}
            <div className="bg-white rounded-xl border border-orange-200 p-4">
              <h4 className="font-semibold text-gray-900 mb-3">{t('goalsHelp.howToCreate')}</h4>
              <div className="space-y-2">
                <Step number={1} text={t('goalsHelp.howToStep1')} />
                <Step number={2} text={t('goalsHelp.howToStep2')} />
                <Step number={3} text={t('goalsHelp.howToStep3')} />
                <Step number={4} text={t('goalsHelp.howToStep4')} />
                <Step number={5} text={t('goalsHelp.howToStep5')} />
              </div>
              <div className="mt-4 flex gap-2">
                {onAddGoal && (
                  <button onClick={onAddGoal} className="flex items-center gap-1 px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600">
                    <Plus className="w-4 h-4" /> {t('goalsHelp.createGoal')}
                  </button>
                )}
                {onNavigateToGoals && (
                  <button onClick={onNavigateToGoals} className="flex items-center gap-1 px-4 py-2 border border-orange-200 text-orange-600 text-sm rounded-lg hover:bg-orange-50">
                    <ArrowRight className="w-4 h-4" /> {t('goalsHelp.goToGoals')}
                  </button>
                )}
              </div>
              </div>

            {/* Tips */}
            <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
              <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-orange-500" /> {t('goalsHelp.tips')}
              </h4>
              <ul className="space-y-1.5">
                <Tip text={t('goalsHelp.tip1')} />
                <Tip text={t('goalsHelp.tip2')} />
                <Tip text={t('goalsHelp.tip3')} />
                <Tip text={t('goalsHelp.tip4')} />
              </ul>
            </div>
          </div>
        )

      case 'steps':
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-6 text-white flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Footprints className="w-7 h-7" /> {t('stepsHelp.title')}
                </h2>
                <p className="text-orange-100 text-sm mt-1">{t('stepsHelp.subtitle')}</p>
              </div>
                {onAddStep && (
                <button onClick={onAddStep} className="flex items-center gap-1 px-4 py-2 bg-white text-orange-600 font-medium rounded-lg hover:bg-orange-50">
                  <Plus className="w-4 h-4" /> {t('stepsHelp.add')}
                  </button>
                )}
            </div>

            {/* What are steps */}
            <div className="bg-white rounded-xl border border-orange-200 p-4">
              <h4 className="font-semibold text-gray-900 mb-2">{t('stepsHelp.whatAreSteps')}</h4>
              <p className="text-sm text-gray-600 mb-3">{t('stepsHelp.whatAreStepsDesc')}</p>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> {t('stepsHelp.scheduled')}
                </span>
                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full flex items-center gap-1">
                  <Target className="w-3 h-3" /> {t('stepsHelp.toGoal')}
                </span>
                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {t('stepsHelp.timeEstimate')}
                </span>
              </div>
            </div>

            {/* Example Step Card */}
            <div className="bg-white rounded-xl border border-orange-200 p-4">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Eye className="w-4 h-4 text-orange-500" /> {t('stepsHelp.exampleTitle')}
              </h4>
              <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 border-2 border-orange-400 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckSquare className="w-4 h-4 text-orange-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h5 className="font-semibold text-gray-900">{t('stepsHelp.exampleName')}</h5>
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
                <p><strong className="text-orange-600">{t('stepsHelp.timeEstimate')}</strong> = {t('stepsHelp.timeExplanation').split(' = ')[1]}</p>
                <p><strong className="text-gray-600">{t('stepsHelp.tableGoal')}</strong> = {t('stepsHelp.goalExplanation').split(' = ')[1]}</p>
                </div>
              </div>

            {/* Steps Table Example */}
            <div className="bg-white rounded-xl border border-orange-200 p-4">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Eye className="w-4 h-4 text-orange-500" /> {t('stepsHelp.tableTitle')}
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-orange-100">
                      <th className="text-left py-2 px-2 text-xs font-medium text-gray-500 w-8"></th>
                      <th className="text-left py-2 px-2 text-xs font-medium text-gray-500">{t('stepsHelp.tableName')}</th>
                      <th className="text-left py-2 px-2 text-xs font-medium text-gray-500">{t('stepsHelp.tableDate')}</th>
                      <th className="text-left py-2 px-2 text-xs font-medium text-gray-500">{t('stepsHelp.tableTime')}</th>
                      <th className="text-left py-2 px-2 text-xs font-medium text-gray-500">{t('stepsHelp.tableGoal')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-orange-50 hover:bg-orange-50 cursor-pointer">
                      <td className="py-2 px-2">
                        <div className="w-5 h-5 border-2 border-orange-400 rounded flex items-center justify-center">
                          <CheckSquare className="w-3 h-3 text-orange-400" />
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
                      <td className="py-2 px-2 text-xs text-orange-600">React</td>
                    </tr>
                    <tr className="border-b border-orange-50 hover:bg-orange-50 cursor-pointer">
                      <td className="py-2 px-2">
                        <div className="w-5 h-5 border-2 border-orange-400 rounded flex items-center justify-center">
                          <CheckSquare className="w-3 h-3 text-orange-400" />
                        </div>
                      </td>
                      <td className="py-2 px-2">
                        <span className="font-medium text-gray-800">{t('stepsHelp.tableExample2')}</span>
                      </td>
                      <td className="py-2 px-2 text-gray-500">{t('stepsHelp.tomorrow')}</td>
                      <td className="py-2 px-2 text-gray-500">2 h</td>
                      <td className="py-2 px-2 text-xs text-orange-600">React</td>
                    </tr>
                    <tr className="hover:bg-orange-50 cursor-pointer opacity-60">
                      <td className="py-2 px-2">
                        <div className="w-5 h-5 bg-orange-500 rounded flex items-center justify-center">
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
            <div className="bg-white rounded-xl border border-orange-200 p-4">
              <h4 className="font-semibold text-gray-900 mb-3">{t('stepsHelp.howToCreate')}</h4>
              <div className="space-y-2">
                <Step number={1} text={t('stepsHelp.howToStep1')} />
                <Step number={2} text={t('stepsHelp.howToStep2')} />
                <Step number={3} text={t('stepsHelp.howToStep3')} />
                <Step number={4} text={t('stepsHelp.howToStep4')} />
                <Step number={5} text={t('stepsHelp.howToStep5')} />
              </div>
              <div className="mt-4 flex gap-2">
                {onAddStep && (
                  <button onClick={onAddStep} className="flex items-center gap-1 px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600">
                    <Plus className="w-4 h-4" /> {t('stepsHelp.createStep')}
                  </button>
                )}
                {onNavigateToSteps && (
                  <button onClick={onNavigateToSteps} className="flex items-center gap-1 px-4 py-2 border border-orange-200 text-orange-600 text-sm rounded-lg hover:bg-orange-50">
                    <ArrowRight className="w-4 h-4" /> {t('stepsHelp.goToSteps')}
                  </button>
                )}
              </div>
            </div>

            {/* Tips */}
            <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
              <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-orange-500" /> {t('stepsHelp.tips')}
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
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-6 text-white flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <CheckSquare className="w-7 h-7" /> {t('habitsHelp.title')}
                </h2>
                <p className="text-orange-100 text-sm mt-1">{t('habitsHelp.subtitle')}</p>
              </div>
                {onAddHabit && (
                <button onClick={onAddHabit} className="flex items-center gap-1 px-4 py-2 bg-white text-orange-600 font-medium rounded-lg hover:bg-orange-50">
                  <Plus className="w-4 h-4" /> {t('habitsHelp.add')}
                  </button>
                )}
            </div>

            {/* What are habits */}
            <div className="bg-white rounded-xl border border-orange-200 p-4">
              <h4 className="font-semibold text-gray-900 mb-2">{t('habitsHelp.whatAreHabits')}</h4>
              <p className="text-sm text-gray-600 mb-3">{t('habitsHelp.whatAreHabitsDesc')}</p>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> {t('habitsHelp.daily')}
                </span>
                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> {t('habitsHelp.weekly')}
                </span>
                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {t('habitsHelp.reminder')}
                </span>
              </div>
            </div>

            {/* Example Habit Card */}
            <div className="bg-white rounded-xl border border-orange-200 p-4">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Eye className="w-4 h-4 text-orange-500" /> {t('habitsHelp.exampleTitle')}
              </h4>
              <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h5 className="font-semibold text-gray-900">{t('habitsHelp.exampleName')}</h5>
                      <span className="text-xs bg-orange-200 text-orange-700 px-2 py-0.5 rounded-full">{t('habitsHelp.daily')}</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{t('habitsHelp.exampleDesc')}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> 07:00
                      </span>
              </div>
                    <div className="flex gap-1 mt-2">
                      {days.map((day, i) => (
                        <span key={day} className={`w-6 h-6 rounded text-[10px] flex items-center justify-center font-medium ${i < 5 ? 'bg-orange-200 text-orange-700' : 'bg-gray-100 text-gray-400'}`}>
                          {day}
                        </span>
                      ))}
                </div>
                  </div>
                </div>
              </div>
              <div className="mt-3 text-xs text-gray-500 space-y-1">
                <p><strong className="text-orange-600">{t('habitsHelp.daily')}</strong> = {t('habitsHelp.dailyExplanation').split(' = ')[1]}</p>
                <p><strong className="text-orange-600">{t('habitsHelp.reminder')}</strong> = {t('habitsHelp.reminderExplanation').split(' = ')[1]}</p>
                <p><strong className="text-gray-600">{t('days.mon')}-{t('days.sun')}</strong> = {t('habitsHelp.daysExplanation').split(' = ')[1]}</p>
              </div>
            </div>

            {/* Habits Timeline Example */}
            <div className="bg-white rounded-xl border border-orange-200 p-4">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Eye className="w-4 h-4 text-orange-500" /> {t('habitsHelp.timelineTitle')}
              </h4>
              
              {/* Statistics example */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-orange-500" />
                  <div>
                    <div className="text-xs text-gray-500">Plánováno</div>
                    <div className="text-sm font-semibold text-gray-900">21</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-green-500" />
                  <div>
                    <div className="text-xs text-gray-500">Splněno</div>
                    <div className="text-sm font-semibold text-gray-900">15</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-blue-500" />
                  <div>
                    <div className="text-xs text-gray-500">Mimo plán</div>
                    <div className="text-sm font-semibold text-gray-900">2</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-purple-500" />
                  <div>
                    <div className="text-xs text-gray-500">Streak</div>
                    <div className="text-sm font-semibold text-gray-900">5</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <div>
                    <div className="text-xs text-gray-500">Max streak</div>
                    <div className="text-sm font-semibold text-gray-900">12</div>
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
                        <div key={i} className={`w-8 h-8 rounded flex items-center justify-center ${done ? 'bg-orange-500' : 'bg-gray-200'}`}>
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
                        <div key={i} className={`w-8 h-8 rounded flex items-center justify-center ${done ? 'bg-orange-500' : 'bg-gray-200'}`}>
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
            <div className="bg-white rounded-xl border border-orange-200 p-4">
              <h4 className="font-semibold text-gray-900 mb-3">{t('habitsHelp.howToCreate')}</h4>
              <div className="space-y-2">
                <Step number={1} text={t('habitsHelp.howToStep1')} />
                <Step number={2} text={t('habitsHelp.howToStep2')} />
                <Step number={3} text={t('habitsHelp.howToStep3')} />
                <Step number={4} text={t('habitsHelp.howToStep4')} />
                <Step number={5} text={t('habitsHelp.howToStep5')} />
              </div>
              <div className="mt-4 flex gap-2">
                {onAddHabit && (
                  <button onClick={onAddHabit} className="flex items-center gap-1 px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600">
                    <Plus className="w-4 h-4" /> {t('habitsHelp.createHabit')}
                  </button>
                )}
                {onNavigateToHabits && (
                  <button onClick={onNavigateToHabits} className="flex items-center gap-1 px-4 py-2 border border-orange-200 text-orange-600 text-sm rounded-lg hover:bg-orange-50">
                    <ArrowRight className="w-4 h-4" /> {t('habitsHelp.goToHabits')}
                  </button>
                )}
              </div>
              </div>

            {/* Tips */}
            <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
              <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-orange-500" /> {t('habitsHelp.tips')}
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
    <div className="w-full h-full flex bg-gray-50">
      {/* Sidebar */}
      <div className="hidden md:block w-56 border-r border-gray-200 bg-white flex-shrink-0">
        <div className="p-4">
          <h2 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-orange-500" />
            {t('title')}
          </h2>
          <nav className="space-y-1">
            {categories.map((category) => {
              const Icon = category.icon
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-left text-sm ${
                    selectedCategory === category.id
                      ? 'bg-orange-500 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium">{category.label}</span>
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Mobile menu */}
        <div className="md:hidden sticky top-0 z-10 bg-white border-b border-gray-200 p-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-orange-500" />
              {t('title')}
            </h2>
            <div className="relative">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg hover:bg-gray-100 border border-gray-200"
              >
                <Menu className="w-4 h-4 text-gray-600" />
              </button>
              {mobileMenuOpen && (
                <>
                  <div className="fixed inset-0 z-[100]" onClick={() => setMobileMenuOpen(false)} />
                  <div className="absolute right-0 top-10 bg-white border border-gray-200 rounded-xl shadow-xl z-[101] min-w-[180px] overflow-hidden">
                    <nav className="py-1">
                      {categories.map((category) => {
                        const Icon = category.icon
                        return (
                          <button
                            key={category.id}
                            onClick={() => {
                              setSelectedCategory(category.id)
                              setMobileMenuOpen(false)
                            }}
                            className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left ${
                              selectedCategory === category.id
                                ? 'bg-orange-500 text-white'
                                : 'text-gray-600 hover:bg-gray-100'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                            <span className="font-medium">{category.label}</span>
                          </button>
                        )
                      })}
                    </nav>
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
    </div>
  )
}


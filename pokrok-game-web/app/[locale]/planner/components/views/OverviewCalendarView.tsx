'use client'

import { useState, useMemo, useCallback } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { ChevronLeft, ChevronRight, CheckSquare, Footprints, Check } from 'lucide-react'
import { getLocalDateString, normalizeDate } from '../utils/dateHelpers'
import { isHabitScheduledForDay } from '../utils/habitHelpers'
import { isStepScheduledForDay } from '../utils/stepHelpers'
import { getIconComponent } from '@/lib/icon-utils'

interface OverviewCalendarViewProps {
  habits?: any[]
  dailySteps?: any[]
  handleItemClick?: (item: any, type: 'step' | 'habit') => void
  handleHabitToggle?: (habitId: string, date?: string) => Promise<void>
  handleStepToggle?: (stepId: string, completed: boolean, completionDate?: string) => Promise<void>
  loadingHabits?: Set<string>
  loadingSteps?: Set<string>
  animatingSteps?: Set<string>
  onOpenStepModal?: (step?: any) => void
  onOpenHabitModal?: (habit?: any) => void
}

type ViewType = 'week' | 'month'

export function OverviewCalendarView({
  habits = [],
  dailySteps = [],
  handleItemClick,
  handleHabitToggle,
  handleStepToggle,
  loadingHabits = new Set(),
  loadingSteps = new Set(),
  animatingSteps = new Set(),
  onOpenStepModal,
  onOpenHabitModal
}: OverviewCalendarViewProps) {
  const t = useTranslations()
  const locale = useLocale()
  const localeCode = locale === 'cs' ? 'cs-CZ' : 'en-US'
  
  const [viewType, setViewType] = useState<ViewType>('week')
  const [showSteps, setShowSteps] = useState(true)
  const [showHabits, setShowHabits] = useState(true)
  
  const today = useMemo(() => {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    return date
  }, [])
  
  // Week view state
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const d = new Date()
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Monday
    const weekStart = new Date(d)
    weekStart.setDate(diff)
    weekStart.setHours(0, 0, 0, 0)
    return weekStart
  })
  
  // Month view state
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    const date = new Date()
    date.setDate(1)
    date.setHours(0, 0, 0, 0)
    return date
  })
  
  // Get week days
  const getWeekDays = useCallback(() => {
    const days: Date[] = []
    for (let i = 0; i < 7; i++) {
      const day = new Date(currentWeekStart)
      day.setDate(currentWeekStart.getDate() + i)
      days.push(day)
    }
    return days
  }, [currentWeekStart])
  
  // Get month days
  const getMonthDays = useCallback(() => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    
    const firstDayOfWeek = firstDay.getDay()
    const adjustedFirstDay = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1
    
    const days: (Date | null)[] = []
    
    // Empty cells before month starts
    for (let i = 0; i < adjustedFirstDay; i++) {
      days.push(null)
    }
    
    // Days in month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i))
    }
    
    return days
  }, [currentMonth])
  
  // Get items for a day - habits first, then steps
  const getDayItems = useCallback((date: Date) => {
    const dateStr = getLocalDateString(date)
    const items: Array<{ type: 'step' | 'habit'; item: any }> = []
    
    // Add habits first
    if (showHabits) {
      const dayHabits = habits.filter(habit => isHabitScheduledForDay(habit, date))
      dayHabits.forEach(habit => items.push({ type: 'habit', item: habit }))
    }
    
    // Add steps after habits
    if (showSteps) {
      const daySteps = dailySteps.filter(step => {
        if (!step.date) return false
        const stepDate = normalizeDate(step.date)
        return stepDate === dateStr
      })
      daySteps.forEach(step => items.push({ type: 'step', item: step }))
    }
    
    return items
  }, [dailySteps, habits, showSteps, showHabits])
  
  // Navigate week
  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeekStart = new Date(currentWeekStart)
    newWeekStart.setDate(currentWeekStart.getDate() + (direction === 'next' ? 7 : -7))
    setCurrentWeekStart(newWeekStart)
  }
  
  // Navigate month
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth)
    newMonth.setMonth(currentMonth.getMonth() + (direction === 'next' ? 1 : -1))
    setCurrentMonth(newMonth)
  }
  
  const dayNamesShort = [
    t('daysShort.mon'), t('daysShort.tue'), t('daysShort.wed'),
    t('daysShort.thu'), t('daysShort.fri'), t('daysShort.sat'), t('daysShort.sun')
  ]
  
  const monthNames = [
    t('months.january'), t('months.february'), t('months.march'),
    t('months.april'), t('months.may'), t('months.june'),
    t('months.july'), t('months.august'), t('months.september'),
    t('months.october'), t('months.november'), t('months.december')
  ]
  
  return (
    <div className="w-full h-full flex flex-col bg-primary-50">
      {/* Header with controls */}
      <div className="flex-shrink-0 p-4 border-b-2 border-primary-300 bg-white">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* View type toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewType('week')}
              className={`px-4 py-2 rounded-lg font-playful transition-colors ${
                viewType === 'week'
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {t('calendar.week') || 'Týden'}
            </button>
            <button
              onClick={() => setViewType('month')}
              className={`px-4 py-2 rounded-lg font-playful transition-colors ${
                viewType === 'month'
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {t('calendar.month') || 'Měsíc'}
            </button>
          </div>
          
          {/* Checkboxes for steps and habits */}
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showSteps}
                onChange={(e) => setShowSteps(e.target.checked)}
                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
              />
              <Footprints className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-playful text-gray-700">
                {t('navigation.steps') || 'Kroky'}
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showHabits}
                onChange={(e) => setShowHabits(e.target.checked)}
                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
              />
              <CheckSquare className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-playful text-gray-700">
                {t('habits.title') || 'Návyky'}
              </span>
            </label>
          </div>
          
          {/* Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => viewType === 'week' ? navigateWeek('prev') : navigateMonth('prev')}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-700" />
            </button>
            <div className="text-lg font-bold font-playful min-w-[200px] text-center">
              {viewType === 'week' ? (
                <>
                  {getLocalDateString(currentWeekStart)} - {getLocalDateString(new Date(currentWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000))}
                </>
              ) : (
                `${monthNames[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`
              )}
            </div>
            <button
              onClick={() => viewType === 'week' ? navigateWeek('next') : navigateMonth('next')}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-700" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Calendar content */}
      <div className="flex-1 overflow-hidden p-4">
        {viewType === 'week' ? (
          <div className="grid grid-cols-7 gap-4 h-full">
            {getWeekDays().map((day, index) => {
              const dayStr = getLocalDateString(day)
              const isToday = dayStr === getLocalDateString(today)
              const items = getDayItems(day)
              
              return (
                <div
                  key={index}
                  className={`flex flex-col border-2 rounded-lg p-3 min-h-0 ${
                    isToday ? 'border-primary-500 bg-primary-50' : 'border-gray-200 bg-white'
                  }`}
                >
                  {/* Day header */}
                  <div className="mb-2 pb-2 border-b border-gray-200 flex-shrink-0">
                    <div className="text-xs font-playful text-gray-500 uppercase">
                      {dayNamesShort[index]}
                    </div>
                    <div className={`text-lg font-bold font-playful ${isToday ? 'text-primary-600' : 'text-gray-800'}`}>
                      {day.getDate()}
                    </div>
                  </div>
                  
                  {/* Items list */}
                  <div 
                    className="flex-1 overflow-y-auto space-y-2 min-h-0 calendar-day-scroll"
                    style={{
                      scrollbarWidth: 'thin',
                      scrollbarColor: 'var(--color-primary-500, #E8871E) transparent'
                    }}
                  >
                    {items.map((item, itemIndex) => {
                      if (item.type === 'habit') {
                        const habit = item.item
                        const isCompleted = habit.habit_completions?.[dayStr] === true
                        const loadingKey = `${habit.id}-${dayStr}`
                        const isLoading = loadingHabits.has(loadingKey)
                        
                        return (
                          <div
                            key={itemIndex}
                            onClick={() => {
                              if (onOpenHabitModal) {
                                onOpenHabitModal(habit)
                              } else if (handleItemClick) {
                                handleItemClick(habit, 'habit')
                              }
                            }}
                            className={`flex items-center gap-2 p-2 rounded-playful-md cursor-pointer transition-all ${
                              isCompleted
                                ? 'bg-primary-100 opacity-75 hover:outline-2 hover:outline hover:outline-primary-300 hover:outline-offset-[-2px]'
                                : 'bg-white hover:bg-primary-50 hover:outline-2 hover:outline hover:outline-primary-500 hover:outline-offset-[-2px]'
                            } ${isLoading ? 'opacity-50' : ''}`}
                            style={{
                              border: 'none'
                            }}
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                if (handleHabitToggle) {
                                  handleHabitToggle(habit.id, dayStr)
                                }
                              }}
                              disabled={isLoading}
                              className={`flex-shrink-0 w-5 h-5 rounded-playful-sm border-2 flex items-center justify-center transition-colors ${
                                isLoading
                                  ? 'border-primary-500 bg-white'
                                  : isCompleted
                                    ? 'bg-primary-500 border-primary-500'
                                    : 'border-primary-500 hover:bg-primary-50'
                              } ${isLoading ? 'cursor-not-allowed' : ''}`}
                            >
                              {isLoading ? (
                                <div className="animate-spin h-3 w-3 border-2 border-primary-500 border-t-transparent rounded-full"></div>
                              ) : isCompleted ? (
                                <Check className="w-3 h-3 text-white" />
                              ) : null}
                            </button>
                            <div className="flex items-center gap-2 flex-shrink-0 flex-1 min-w-0">
                              {habit.icon && (
                                <div className="flex-shrink-0">
                                  {(() => {
                                    const IconComponent = getIconComponent(habit.icon)
                                    return <IconComponent className="w-4 h-4 text-primary-600" />
                                  })()}
                                </div>
                              )}
                              <span className={`text-xs font-medium text-black truncate ${
                                isCompleted ? 'line-through' : ''
                              }`}>
                                {habit.name || t('habits.habit')}
                              </span>
                            </div>
                          </div>
                        )
                      } else {
                        // Step
                        const step = item.item
                        const isCompleted = step.completed === true
                        const isLoading = loadingSteps.has(step.id)
                        const isAnimating = animatingSteps.has(step.id)
                        
                        return (
                          <div
                            key={itemIndex}
                            onClick={() => {
                              if (onOpenStepModal) {
                                onOpenStepModal(step)
                              } else if (handleItemClick) {
                                handleItemClick(step, 'step')
                              }
                            }}
                            className={`flex items-center gap-2 p-2 rounded-playful-md cursor-pointer transition-all border-2 ${
                              isCompleted
                                ? 'bg-primary-100 opacity-75 border-primary-300 hover:border-primary-400'
                                : 'bg-white border-primary-500 hover:bg-primary-50 hover:border-primary-600'
                            } ${isLoading ? 'opacity-50' : ''} ${isAnimating ? 'animate-pulse' : ''}`}
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                if (handleStepToggle) {
                                  handleStepToggle(step.id, !isCompleted, dayStr)
                                }
                              }}
                              disabled={isLoading}
                              className={`flex-shrink-0 w-5 h-5 rounded-playful-sm border-2 flex items-center justify-center transition-colors ${
                                isLoading
                                  ? 'border-primary-500 bg-white'
                                  : isCompleted
                                    ? 'bg-primary-500 border-primary-500'
                                    : 'border-primary-500 hover:bg-primary-50'
                              } ${isLoading ? 'cursor-not-allowed' : ''}`}
                            >
                              {isLoading ? (
                                <div className="animate-spin h-3 w-3 border-2 border-primary-500 border-t-transparent rounded-full"></div>
                              ) : isCompleted ? (
                                <Check className="w-3 h-3 text-white" />
                              ) : null}
                            </button>
                            <div className="flex items-center gap-2 flex-shrink-0 flex-1 min-w-0">
                              <Footprints className="w-4 h-4 text-primary-600 flex-shrink-0" />
                              <span className={`text-xs font-medium text-black truncate ${
                                isCompleted ? 'line-through' : ''
                              }`}>
                                {step.title || t('steps.step')}
                              </span>
                            </div>
                          </div>
                        )
                      }
                    })}
                    {items.length === 0 && (
                      <div className="text-xs text-gray-400 text-center py-4">
                        {t('calendar.noItems') || 'Žádné položky'}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-2 h-full auto-rows-fr">
            {/* Day headers */}
            {dayNamesShort.map((dayName, index) => (
              <div key={index} className="text-center text-sm font-bold font-playful text-gray-700 py-2 flex-shrink-0">
                {dayName}
              </div>
            ))}
            
            {/* Month days */}
            {getMonthDays().map((day, index) => {
              if (!day) {
                return <div key={index} className="min-h-0" />
              }
              
              const dayStr = getLocalDateString(day)
              const isToday = dayStr === getLocalDateString(today)
              const items = getDayItems(day)
              
              return (
                <div
                  key={index}
                  className={`border-2 rounded-lg p-1.5 flex flex-col min-h-0 ${
                    isToday ? 'border-primary-500 bg-primary-50' : 'border-gray-200 bg-white'
                  }`}
                >
                  {/* Day number */}
                  <div className={`text-xs font-bold font-playful mb-1 flex-shrink-0 ${isToday ? 'text-primary-600' : 'text-gray-800'}`}>
                    {day.getDate()}
                  </div>
                  
                  {/* Items */}
                  <div 
                    className="flex-1 overflow-y-auto space-y-1 min-h-0 calendar-day-scroll"
                    style={{
                      scrollbarWidth: 'thin',
                      scrollbarColor: 'var(--color-primary-500, #E8871E) transparent'
                    }}
                  >
                    {items.map((item, itemIndex) => {
                      if (item.type === 'habit') {
                        const habit = item.item
                        const isCompleted = habit.habit_completions?.[dayStr] === true
                        const loadingKey = `${habit.id}-${dayStr}`
                        const isLoading = loadingHabits.has(loadingKey)
                        
                        return (
                          <div
                            key={itemIndex}
                            onClick={() => {
                              if (onOpenHabitModal) {
                                onOpenHabitModal(habit)
                              } else if (handleItemClick) {
                                handleItemClick(habit, 'habit')
                              }
                            }}
                            className={`flex items-center gap-1 p-1 rounded-playful-sm cursor-pointer transition-all ${
                              isCompleted
                                ? 'bg-primary-100 opacity-75'
                                : 'bg-white hover:bg-primary-50'
                            } ${isLoading ? 'opacity-50' : ''}`}
                            title={habit.name || t('habits.habit')}
                            style={{
                              border: 'none'
                            }}
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                if (handleHabitToggle) {
                                  handleHabitToggle(habit.id, dayStr)
                                }
                              }}
                              disabled={isLoading}
                              className={`flex-shrink-0 w-3 h-3 rounded-playful-sm border border-primary-500 flex items-center justify-center transition-colors ${
                                isLoading
                                  ? 'border-primary-500 bg-white'
                                  : isCompleted
                                    ? 'bg-primary-500 border-primary-500'
                                    : 'border-primary-500 hover:bg-primary-50'
                              } ${isLoading ? 'cursor-not-allowed' : ''}`}
                            >
                              {isLoading ? (
                                <div className="animate-spin h-2 w-2 border border-primary-500 border-t-transparent rounded-full"></div>
                              ) : isCompleted ? (
                                <Check className="w-2 h-2 text-white" />
                              ) : null}
                            </button>
                            {habit.icon && (
                              <div className="flex-shrink-0">
                                {(() => {
                                  const IconComponent = getIconComponent(habit.icon)
                                  return <IconComponent className="w-2.5 h-2.5 text-primary-600" />
                                })()}
                              </div>
                            )}
                            <span className={`text-[10px] font-medium text-black truncate flex-1 ${
                              isCompleted ? 'line-through' : ''
                            }`}>
                              {habit.name || t('habits.habit')}
                            </span>
                          </div>
                        )
                      } else {
                        // Step
                        const step = item.item
                        const isCompleted = step.completed === true
                        const isLoading = loadingSteps.has(step.id)
                        const isAnimating = animatingSteps.has(step.id)
                        
                        return (
                          <div
                            key={itemIndex}
                            onClick={() => {
                              if (onOpenStepModal) {
                                onOpenStepModal(step)
                              } else if (handleItemClick) {
                                handleItemClick(step, 'step')
                              }
                            }}
                            className={`flex items-center gap-1 p-1 rounded-playful-sm cursor-pointer transition-all border ${
                              isCompleted
                                ? 'bg-primary-100 opacity-75 border-primary-300'
                                : 'bg-white border-primary-500 hover:bg-primary-50 hover:border-primary-600'
                            } ${isLoading ? 'opacity-50' : ''} ${isAnimating ? 'animate-pulse' : ''}`}
                            title={step.title || t('steps.step')}
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                if (handleStepToggle) {
                                  handleStepToggle(step.id, !isCompleted, dayStr)
                                }
                              }}
                              disabled={isLoading}
                              className={`flex-shrink-0 w-3 h-3 rounded-playful-sm border border-primary-500 flex items-center justify-center transition-colors ${
                                isLoading
                                  ? 'border-primary-500 bg-white'
                                  : isCompleted
                                    ? 'bg-primary-500 border-primary-500'
                                    : 'border-primary-500 hover:bg-primary-50'
                              } ${isLoading ? 'cursor-not-allowed' : ''}`}
                            >
                              {isLoading ? (
                                <div className="animate-spin h-2 w-2 border border-primary-500 border-t-transparent rounded-full"></div>
                              ) : isCompleted ? (
                                <Check className="w-2 h-2 text-white" />
                              ) : null}
                            </button>
                            <Footprints className="w-2.5 h-2.5 text-primary-600 flex-shrink-0" />
                            <span className={`text-[10px] font-medium text-black truncate flex-1 ${
                              isCompleted ? 'line-through' : ''
                            }`}>
                              {step.title || t('steps.step')}
                            </span>
                          </div>
                        )
                      }
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

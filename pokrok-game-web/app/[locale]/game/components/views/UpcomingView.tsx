'use client'

import { useState, useMemo, useEffect } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { getLocalDateString, normalizeDate } from '../utils/dateHelpers'
import { isHabitScheduledForDay } from '../utils/habitHelpers'
import { isStepScheduledForDay } from '../utils/stepHelpers'
import { Check, Plus, Footprints, Trash2 } from 'lucide-react'
import { getIconComponent } from '@/lib/icon-utils'

interface UpcomingViewProps {
  goals?: any[]
  habits: any[]
  dailySteps: any[]
  areas?: any[]
  selectedDayDate: Date
  setSelectedDayDate: (date: Date) => void
  handleItemClick: (item: any, type: 'step' | 'habit' | 'goal' | 'stat') => void
  handleHabitToggle: (habitId: string, date?: string) => Promise<void>
  handleStepToggle: (stepId: string, completed: boolean) => Promise<void>
  setSelectedItem: (item: any) => void
  setSelectedItemType: (type: 'step' | 'habit' | 'goal' | 'stat' | null) => void
  onOpenStepModal?: (date?: string) => void
  loadingHabits: Set<string>
  loadingSteps: Set<string>
  player?: any
  userId?: string | null
  maxUpcomingSteps?: number // Max number of upcoming steps to show (default: 5)
}

export function UpcomingView({
  goals = [],
  habits,
  dailySteps,
  areas = [],
  selectedDayDate,
  setSelectedDayDate,
  handleItemClick,
  handleHabitToggle,
  handleStepToggle,
  setSelectedItem,
  setSelectedItemType,
  onOpenStepModal,
  loadingHabits,
  loadingSteps,
  player,
  userId,
  maxUpcomingSteps = 5
}: UpcomingViewProps) {
  const t = useTranslations()
  const locale = useLocale()
  
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = getLocalDateString(today)
  
  // Get today's habits
  const todaysHabits = useMemo(() => {
    return habits.filter(habit => {
      return isHabitScheduledForDay(habit, today)
    })
  }, [habits, today])
  
  // Helper function to check if a repeating step is completed for a specific date
  const isStepCompletedForDate = (step: any, date: Date): boolean => {
    if (!step.completed) return false
    
    // If step has completed_at, check if it matches the date
    if (step.completed_at) {
      const completedDate = new Date(step.completed_at)
      completedDate.setHours(0, 0, 0, 0)
      const checkDate = new Date(date)
      checkDate.setHours(0, 0, 0, 0)
      return completedDate.getTime() === checkDate.getTime()
    }
    
    // For repeating steps, if completed flag is true but no completed_at, 
    // we can't determine which date it was completed for
    // So we'll assume it's not completed for this specific date
    return false
  }
  
  // Helper function to get the next occurrence date for a repeating step
  const getNextOccurrenceDate = (step: any, fromDate: Date = today): Date | null => {
    if (!step.frequency || step.frequency === null) {
      // Non-repeating step - return its date if it's in the future
      if (step.date) {
        const stepDate = new Date(normalizeDate(step.date))
        stepDate.setHours(0, 0, 0, 0)
        return stepDate >= fromDate ? stepDate : null
      }
      return null
    }
    
    // For repeating steps, find the next occurrence that is NOT completed
    let checkDate = new Date(fromDate)
    checkDate.setHours(0, 0, 0, 0)
    
    // Check up to 365 days ahead
    for (let i = 0; i < 365; i++) {
      if (isStepScheduledForDay(step, checkDate)) {
        // Check if this step is completed for this specific date
        if (!isStepCompletedForDate(step, checkDate)) {
          return checkDate
        }
      }
      checkDate.setDate(checkDate.getDate() + 1)
    }
    
    return null
  }
  
  // Calculate one month from today
  const oneMonthFromToday = useMemo(() => {
    const date = new Date(today)
    date.setMonth(date.getMonth() + 1)
    return date
  }, [today])

  // Create maps for quick lookup
  const goalMap = useMemo(() => {
    const map = new Map<string, any>()
    goals.forEach(goal => {
      map.set(goal.id, goal)
    })
    return map
  }, [goals])

  const areaMap = useMemo(() => {
    const map = new Map<string, any>()
    areas.forEach(area => {
      map.set(area.id, area)
    })
    return map
  }, [areas])

  // Get upcoming steps - sorted by date, with overdue first, then important first within each day
  // Limited to 15 steps total and max one month ahead
  const upcomingSteps = useMemo(() => {
    const stepsWithDates: Array<{ step: any; date: Date; isImportant: boolean; isOverdue: boolean; goal: any; area: any }> = []
    
    // Process non-repeating steps
    dailySteps
      .filter(step => !step.frequency || step.frequency === null)
      .forEach(step => {
        if (!step.date || step.completed) return
        
        const stepDate = new Date(normalizeDate(step.date))
        stepDate.setHours(0, 0, 0, 0)
        
        // Filter out steps more than one month ahead
        if (stepDate > oneMonthFromToday) return
        
        const isOverdue = stepDate < today
        const goal = step.goal_id ? goalMap.get(step.goal_id) : null
        // Get area from goal if exists, otherwise from step directly
        const area = goal?.area_id 
          ? areaMap.get(goal.area_id) 
          : (step.area_id ? areaMap.get(step.area_id) : null)
        
        stepsWithDates.push({
          step,
          date: stepDate,
          isImportant: step.is_important || false,
          isOverdue,
          goal,
          area
        })
      })
    
    // Process repeating steps - find next occurrence that is NOT completed
    dailySteps
      .filter(step => step.frequency && step.frequency !== null)
      .forEach(step => {
        const nextDate = getNextOccurrenceDate(step, today)
        if (nextDate && nextDate <= oneMonthFromToday) {
          const goal = step.goal_id ? goalMap.get(step.goal_id) : null
          // Get area from goal if exists, otherwise from step directly
          const area = goal?.area_id 
            ? areaMap.get(goal.area_id) 
            : (step.area_id ? areaMap.get(step.area_id) : null)
          
          stepsWithDates.push({
            step: {
              ...step,
              date: getLocalDateString(nextDate), // Add the calculated date for display
              completed: false // Reset completed flag for the specific occurrence
            },
            date: nextDate,
            isImportant: step.is_important || false,
            isOverdue: false, // Repeating steps are never overdue
            goal,
            area
          })
        }
      })
    
    // Sort: overdue first, then by date, then by importance within same date
    stepsWithDates.sort((a, b) => {
      // Overdue steps first
      if (a.isOverdue && !b.isOverdue) return -1
      if (!a.isOverdue && b.isOverdue) return 1
      
      // Same overdue status - sort by date
      const dateDiff = a.date.getTime() - b.date.getTime()
      if (dateDiff !== 0) return dateDiff
      
      // Same date - important first
      if (a.isImportant && !b.isImportant) return -1
      if (!a.isImportant && b.isImportant) return 1
      return 0
    })
    
    // Limit to 15 steps total
    const limitedSteps = stepsWithDates.slice(0, 15)
    
    // Return steps with additional metadata
    return limitedSteps.map(item => ({
      ...item.step,
      _isOverdue: item.isOverdue,
      _goal: item.goal,
      _area: item.area
    }))
  }, [dailySteps, today, oneMonthFromToday, goalMap, areaMap])
  
  // Group steps by area, then by goal
  const stepsByArea = useMemo(() => {
    const grouped: Record<string, Record<string, Array<{ step: any; goal: any }>>> = {}
    const noAreaSteps: Array<{ step: any; goal: any }> = []
    
    upcomingSteps.forEach(step => {
      const area = (step as any)._area
      const goal = (step as any)._goal
      
      if (area) {
        if (!grouped[area.id]) {
          grouped[area.id] = {}
        }
        const goalId = goal?.id || 'no-goal'
        if (!grouped[area.id][goalId]) {
          grouped[area.id][goalId] = []
        }
        grouped[area.id][goalId].push({ step, goal })
      } else {
        noAreaSteps.push({ step, goal })
      }
    })
    
    return { grouped, noAreaSteps }
  }, [upcomingSteps])
  
  // Helper function to check if a date is in the current or next week (Monday to Sunday)
  const isDateInCurrentOrNextWeek = (date: Date): boolean => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // Get Monday of current week
    const dayOfWeek = today.getDay()
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek // If Sunday, go back 6 days, otherwise go to Monday
    const monday = new Date(today)
    monday.setDate(today.getDate() + diff)
    monday.setHours(0, 0, 0, 0)
    
    // Get Sunday of next week (14 days from Monday of current week)
    const sundayNextWeek = new Date(monday)
    sundayNextWeek.setDate(monday.getDate() + 13) // 7 days for current week + 6 days for next week
    sundayNextWeek.setHours(0, 0, 0, 0)
    
    const checkDate = new Date(date)
    checkDate.setHours(0, 0, 0, 0)
    
    return checkDate.getTime() >= monday.getTime() && checkDate.getTime() <= sundayNextWeek.getTime()
  }
  
  const formatStepDate = (dateStr: string | null) => {
    if (!dateStr) return ''
    const date = new Date(normalizeDate(dateStr))
    const dateObj = new Date(date)
    dateObj.setHours(0, 0, 0, 0)
    
    // Check if date is today
    const isToday = dateObj.getTime() === today.getTime()
    if (isToday) {
      return t('focus.today') || 'Dnes'
    }
    
    // Check if date is in current or next week
    if (isDateInCurrentOrNextWeek(dateObj)) {
      // Show weekday name
      return dateObj.toLocaleDateString(locale === 'cs' ? 'cs-CZ' : 'en-US', { weekday: 'long' })
    }
    
    // Show formatted date with year if outside current and next week
    return date.toLocaleDateString(locale === 'cs' ? 'cs-CZ' : 'en-US', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric'
    })
  }
  
  return (
    <div className="w-full h-full flex flex-col bg-primary-50">
      {/* Header */}
      <div className="flex-shrink-0 bg-primary-50 pb-2 pt-4 px-6">
        <h1 className="text-2xl font-bold text-black font-playful">
          {t('views.upcoming.title') || 'Nadcházející'}
        </h1>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pt-2 space-y-6">
        {/* Today's Habits - only show if there are habits */}
        {todaysHabits.length > 0 && (
          <div>
            <div className="flex flex-wrap gap-3">
              {todaysHabits.map((habit) => {
                const isCompleted = habit.habit_completions && habit.habit_completions[todayStr] === true
                const isLoading = loadingHabits.has(habit.id)
                
                return (
                  <div
                    key={habit.id}
                    onClick={() => handleItemClick(habit, 'habit')}
                    className={`flex items-center gap-2 p-3 rounded-playful-md border-2 cursor-pointer transition-all flex-shrink-0 ${
                      isCompleted
                        ? 'bg-primary-100 border-primary-300 opacity-75'
                        : 'bg-white border-primary-500 hover:bg-primary-50'
                    } ${isLoading ? 'opacity-50' : ''}`}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleHabitToggle(habit.id, todayStr)
                      }}
                      disabled={isLoading}
                      className={`flex-shrink-0 w-6 h-6 rounded-playful-sm border-2 flex items-center justify-center transition-colors ${
                        isCompleted
                          ? 'bg-primary-500 border-primary-500'
                          : 'border-primary-500 hover:bg-primary-50'
                      }`}
                    >
                      {isCompleted && (
                        <Check className="w-4 h-4 text-white" />
                      )}
                    </button>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {habit.icon && (
                        <div className="flex-shrink-0">
                          {(() => {
                            const IconComponent = getIconComponent(habit.icon)
                            return <IconComponent className="w-5 h-5 text-primary-600" />
                          })()}
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
          </div>
        )}
        
        {/* Steps by Area */}
        {upcomingSteps.length === 0 ? (
          <div className="card-playful-base">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Footprints className="w-5 h-5 text-primary-600" />
                <h2 className="text-lg font-bold text-black font-playful">
                  {t('views.upcomingSteps') || 'Nadcházející kroky'}
                </h2>
              </div>
              {onOpenStepModal && (
                <button
                  onClick={() => onOpenStepModal()}
                  className="btn-playful-base px-3 py-1.5 text-sm font-semibold text-black bg-white hover:bg-primary-50 flex items-center gap-2"
                  title={t('steps.addStep') || 'Přidat krok'}
                >
                  <Plus className="w-4 h-4" />
                  <span>{t('steps.addStep') || 'Přidat krok'}</span>
                </button>
              )}
            </div>
            <p className="text-sm text-gray-600">{t('views.noSteps') || 'Žádné nadcházející kroky'}</p>
          </div>
        ) : (
          <>
            {/* Render steps grouped by area, then by goal */}
            {Object.entries(stepsByArea.grouped).map(([areaId, goalsMap]) => {
              const area = areaMap.get(areaId)
              if (!area) return null
              
              const isFirstArea = Object.keys(stepsByArea.grouped).indexOf(areaId) === 0
              
              return (
                <div key={areaId} className="card-playful-base">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      {area.icon && (() => {
                        const IconComponent = getIconComponent(area.icon)
                        return <IconComponent className="w-5 h-5" style={{ color: area.color || '#E8871E' }} />
                      })()}
                      <h2 className="text-lg font-bold text-black font-playful">
                        {area.name}
                      </h2>
                    </div>
                    {onOpenStepModal && isFirstArea && (
                      <button
                        onClick={() => onOpenStepModal()}
                        className="btn-playful-base px-3 py-1.5 text-sm font-semibold text-black bg-white hover:bg-primary-50 flex items-center gap-2"
                        title={t('steps.addStep') || 'Přidat krok'}
                      >
                        <Plus className="w-4 h-4" />
                        <span>{t('steps.addStep') || 'Přidat krok'}</span>
                      </button>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    {Object.entries(goalsMap).map(([goalId, steps]) => {
                      const goal = goalId !== 'no-goal' ? goalMap.get(goalId) : null
                      
                      return (
                        <div key={goalId} className="space-y-2">
                          {/* Goal title */}
                          {goal && (
                            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                              {goal.icon && (() => {
                                const GoalIconComponent = getIconComponent(goal.icon)
                                return <GoalIconComponent className="w-4 h-4 text-primary-600" />
                              })()}
                              {goal.title}
                            </h3>
                          )}
                          
                          {/* Steps for this goal */}
                          {steps.map(({ step }) => {
                            const isLoading = loadingSteps.has(step.id)
                            const stepDate = step.date ? normalizeDate(step.date) : null
                            const stepDateObj = stepDate ? new Date(stepDate) : null
                            if (stepDateObj) stepDateObj.setHours(0, 0, 0, 0)
                            const isToday = stepDateObj && stepDateObj.getTime() === today.getTime()
                            const isOverdue = (step as any)._isOverdue || false
                            const stepDateFormatted = stepDate ? formatStepDate(stepDate) : null
                            
                            return (
                              <div
                                key={step.id}
                                onClick={() => handleItemClick(step, 'step')}
                                className={`box-playful-pressed flex items-center gap-3 p-3 cursor-pointer ${
                                  step.completed
                                    ? 'border-primary-500 bg-white opacity-50'
                                    : isOverdue
                                      ? 'border-red-500 bg-red-50 hover:bg-red-100'
                                      : isToday
                                        ? 'border-primary-500 bg-white hover:bg-primary-50'
                                        : 'border-primary-500 bg-white hover:bg-primary-50'
                                } ${isLoading ? 'opacity-50' : ''}`}
                              >
                                {/* Checkbox */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleStepToggle(step.id, !step.completed)
                                  }}
                                  disabled={isLoading}
                                  className={`w-6 h-6 rounded-playful-sm border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
                                    step.completed 
                                      ? 'bg-white border-primary-500' 
                                      : 'border-primary-500 hover:bg-primary-100'
                                  }`}
                                >
                                  {isLoading ? (
                                    <svg className="animate-spin h-3 w-3 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                  ) : step.completed ? (
                                    <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                                  ) : null}
                                </button>
                                
                                {/* Title */}
                                <div className="flex-1 min-w-0">
                                  <span className={`text-sm truncate flex items-center gap-2 ${
                                    step.completed 
                                      ? 'line-through text-gray-400' 
                                      : isOverdue
                                        ? 'text-red-600'
                                        : 'text-black'
                                  } ${step.is_important && !step.completed ? 'font-bold' : 'font-medium'}`}>
                                    {step.title}
                                    {step.checklist && step.checklist.length > 0 && (
                                      <span className={`text-[10px] px-1.5 py-0.5 rounded-playful-sm flex-shrink-0 border-2 ${
                                        step.checklist.filter((c: any) => c.completed).length === step.checklist.length
                                          ? 'bg-primary-100 text-primary-600 border-primary-500'
                                          : 'bg-gray-100 text-gray-500 border-gray-300'
                                      }`}>
                                        {step.checklist.filter((c: any) => c.completed).length}/{step.checklist.length}
                                      </span>
                                    )}
                                  </span>
                                </div>
                                
                                {/* Meta info - hidden on mobile */}
                                <button
                                  className={`hidden sm:block w-28 text-xs text-center capitalize flex-shrink-0 rounded-playful-sm px-1 py-0.5 transition-colors border-2 ${
                                    isOverdue
                                      ? 'text-red-600 hover:bg-red-100 border-red-300'
                                      : isToday
                                        ? 'text-primary-600 hover:bg-primary-100 border-primary-500' 
                                        : 'text-gray-600 hover:bg-gray-100 border-gray-300'
                                  }`}
                                >
                                  {isOverdue ? '❗' : ''}{stepDateFormatted || '-'}
                                </button>
                                <button 
                                  className={`hidden sm:block w-20 text-xs text-center flex-shrink-0 rounded-playful-sm px-1 py-0.5 transition-colors border-2 ${
                                    isOverdue
                                      ? 'text-red-600 hover:bg-red-100 border-red-300'
                                      : 'text-gray-600 hover:bg-gray-100 border-gray-300'
                                  }`}
                                >
                                  {step.estimated_time ? `${step.estimated_time} min` : '-'}
                                </button>
                              </div>
                            )
                          })}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
            
            {/* Steps without area - grouped by goal */}
            {stepsByArea.noAreaSteps.length > 0 && (() => {
              // Group no-area steps by goal
              const noAreaStepsByGoal: Record<string, Array<{ step: any; goal: any }>> = {}
              stepsByArea.noAreaSteps.forEach(({ step, goal }) => {
                const goalId = goal?.id || 'no-goal'
                if (!noAreaStepsByGoal[goalId]) {
                  noAreaStepsByGoal[goalId] = []
                }
                noAreaStepsByGoal[goalId].push({ step, goal })
              })
              
              return (
                <div className="card-playful-base">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Footprints className="w-5 h-5 text-primary-600" />
                      <h2 className="text-lg font-bold text-black font-playful">
                        {t('views.otherSteps') || 'Ostatní kroky'}
                      </h2>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {Object.entries(noAreaStepsByGoal).map(([goalId, steps]) => {
                      const goal = goalId !== 'no-goal' ? goalMap.get(goalId) : null
                      
                      return (
                        <div key={goalId} className="space-y-2">
                          {/* Goal title */}
                          {goal && (
                            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                              {goal.icon && (() => {
                                const GoalIconComponent = getIconComponent(goal.icon)
                                return <GoalIconComponent className="w-4 h-4 text-primary-600" />
                              })()}
                              {goal.title}
                            </h3>
                          )}
                          
                          {/* Steps for this goal */}
                          {steps.map(({ step }) => {
                    const isLoading = loadingSteps.has(step.id)
                    const stepDate = step.date ? normalizeDate(step.date) : null
                    const stepDateObj = stepDate ? new Date(stepDate) : null
                    if (stepDateObj) stepDateObj.setHours(0, 0, 0, 0)
                    const isToday = stepDateObj && stepDateObj.getTime() === today.getTime()
                    const isOverdue = (step as any)._isOverdue || false
                    const stepDateFormatted = stepDate ? formatStepDate(stepDate) : null
                    
                    return (
                      <div
                        key={step.id}
                        onClick={() => handleItemClick(step, 'step')}
                        className={`box-playful-pressed flex items-center gap-3 p-3 cursor-pointer ${
                          step.completed
                            ? 'border-primary-500 bg-white opacity-50'
                            : isOverdue
                              ? 'border-red-500 bg-red-50 hover:bg-red-100'
                              : isToday
                                ? 'border-primary-500 bg-white hover:bg-primary-50'
                                : 'border-primary-500 bg-white hover:bg-primary-50'
                        } ${isLoading ? 'opacity-50' : ''}`}
                      >
                        {/* Checkbox */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleStepToggle(step.id, !step.completed)
                          }}
                          disabled={isLoading}
                          className={`w-6 h-6 rounded-playful-sm border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
                            step.completed 
                              ? 'bg-white border-primary-500' 
                              : 'border-primary-500 hover:bg-primary-100'
                          }`}
                        >
                          {isLoading ? (
                            <svg className="animate-spin h-3 w-3 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : step.completed ? (
                            <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                          ) : null}
                        </button>
                        
                        {/* Title */}
                        <div className="flex-1 min-w-0">
                          <span className={`text-sm truncate flex items-center gap-2 ${
                            step.completed 
                              ? 'line-through text-gray-400' 
                              : isOverdue
                                ? 'text-red-600'
                                : 'text-black'
                          } ${step.is_important && !step.completed ? 'font-bold' : 'font-medium'}`}>
                            {step.title}
                            {step.checklist && step.checklist.length > 0 && (
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-playful-sm flex-shrink-0 border-2 ${
                                step.checklist.filter((c: any) => c.completed).length === step.checklist.length
                                  ? 'bg-primary-100 text-primary-600 border-primary-500'
                                  : 'bg-gray-100 text-gray-500 border-gray-300'
                              }`}>
                                {step.checklist.filter((c: any) => c.completed).length}/{step.checklist.length}
                              </span>
                            )}
                          </span>
                        </div>
                        
                        {/* Meta info - hidden on mobile */}
                        <button
                          className={`hidden sm:block w-28 text-xs text-center capitalize flex-shrink-0 rounded-playful-sm px-1 py-0.5 transition-colors border-2 ${
                            isOverdue
                              ? 'text-red-600 hover:bg-red-100 border-red-300'
                              : isToday
                                ? 'text-primary-600 hover:bg-primary-100 border-primary-500' 
                                : 'text-gray-600 hover:bg-gray-100 border-gray-300'
                          }`}
                        >
                          {isOverdue ? '❗' : ''}{stepDateFormatted || '-'}
                        </button>
                        <button 
                          className={`hidden sm:block w-20 text-xs text-center flex-shrink-0 rounded-playful-sm px-1 py-0.5 transition-colors border-2 ${
                            isOverdue
                              ? 'text-red-600 hover:bg-red-100 border-red-300'
                              : 'text-gray-600 hover:bg-gray-100 border-gray-300'
                          }`}
                        >
                          {step.estimated_time ? `${step.estimated_time} min` : '-'}
                        </button>
                      </div>
                    )
                  })}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })()}
          </>
        )}
      </div>
    </div>
  )
}

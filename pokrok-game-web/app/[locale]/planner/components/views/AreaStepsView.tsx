'use client'

import { useMemo, useState, useEffect } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { getLocalDateString, normalizeDate } from '../utils/dateHelpers'
import { isStepScheduledForDay } from '../utils/stepHelpers'
import { isHabitScheduledForDay } from '../utils/habitHelpers'
import { Check, Plus, Footprints } from 'lucide-react'
import { getIconComponent } from '@/lib/icon-utils'

interface AreaStepsViewProps {
  goals?: any[]
  dailySteps: any[]
  habits?: any[]
  handleItemClick: (item: any, type: 'step' | 'habit' | 'goal' | 'stat') => void
  handleStepToggle: (stepId: string, completed: boolean) => Promise<void>
  handleHabitToggle?: (habitId: string, date?: string) => Promise<void>
  loadingSteps: Set<string>
  loadingHabits?: Set<string>
  onOpenStepModal?: (date?: string) => void
  maxUpcomingSteps?: number // Max number of upcoming steps to show (default: 15)
}

export function AreaStepsView({
  goals = [],
  dailySteps,
  habits = [],
  handleItemClick,
  handleStepToggle,
  handleHabitToggle,
  loadingSteps,
  loadingHabits = new Set(),
  onOpenStepModal,
  maxUpcomingSteps = 15
}: AreaStepsViewProps) {
  const t = useTranslations()
  const locale = useLocale()
  
  // Local state for optimistic updates - prevents full reload
  const [localSteps, setLocalSteps] = useState<any[]>(dailySteps)
  
  // Sync localSteps with dailySteps prop when it changes externally (but not on every update)
  useEffect(() => {
    // Only sync if the arrays are significantly different (e.g., new step added, not just toggle)
    const localIds = new Set(localSteps.map(s => s.id))
    const propIds = new Set(dailySteps.map(s => s.id))
    const idsMatch = localIds.size === propIds.size && 
                     Array.from(localIds).every(id => propIds.has(id))
    
    if (!idsMatch) {
      // External change (new step, deleted step, etc.) - sync
      setLocalSteps(dailySteps)
    } else {
      // Same steps, just update individual step states optimistically
      setLocalSteps(prevSteps => {
        const updated = prevSteps.map(localStep => {
          const propStep = dailySteps.find(s => s.id === localStep.id)
          if (propStep && propStep.completed !== localStep.completed) {
            // Step completion changed - update it
            return propStep
          }
          return localStep
        })
        return updated
      })
    }
  }, [dailySteps])
  
  const today = useMemo(() => {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    return date
  }, [])

  const todayStr = useMemo(() => getLocalDateString(today), [today])

  // Get today's habits for this area
  const todaysHabits = useMemo(() => {
    return habits.filter(habit => {
      return isHabitScheduledForDay(habit, today)
    })
  }, [habits, today])
  
  // Calculate one month from today
  const oneMonthFromToday = useMemo(() => {
    const date = new Date(today)
    date.setMonth(date.getMonth() + 1)
    return date
  }, [today])

  // Create map for quick lookup
  const goalMap = useMemo(() => {
    const map = new Map<string, any>()
    goals.forEach(goal => {
      map.set(goal.id, goal)
    })
    return map
  }, [goals])

  // Helper function to check if a repeating step is completed for a specific date
  const isStepCompletedForDate = (step: any, date: Date): boolean => {
    if (!step.completed) return false
    
    // For recurring steps, check if current_instance_date matches the date
    if (step.frequency && step.frequency !== null && step.current_instance_date) {
      const instanceDate = new Date(normalizeDate(step.current_instance_date))
      instanceDate.setHours(0, 0, 0, 0)
      const checkDate = new Date(date)
      checkDate.setHours(0, 0, 0, 0)
      // If current_instance_date matches and step is completed, it's completed for this date
      if (instanceDate.getTime() === checkDate.getTime()) {
        return step.completed === true
      }
      // If current_instance_date is different, this date is not completed
      return false
    }
    
    // For non-recurring or old recurring steps, check completed_at
    if (step.completed_at) {
      const completedDate = new Date(step.completed_at)
      completedDate.setHours(0, 0, 0, 0)
      const checkDate = new Date(date)
      checkDate.setHours(0, 0, 0, 0)
      return completedDate.getTime() === checkDate.getTime()
    }
    
    return false
  }

  // Helper function to get the next occurrence date for a repeating step
  const getNextOccurrenceDate = (step: any, fromDate: Date = today): Date | null => {
    if (!step.frequency || step.frequency === null) {
      if (step.date) {
        const stepDate = new Date(normalizeDate(step.date))
        stepDate.setHours(0, 0, 0, 0)
        return stepDate >= fromDate ? stepDate : null
      }
      return null
    }
    
    // For recurring steps with current_instance_date, use that if it's in the future
    if (step.current_instance_date) {
      const instanceDate = new Date(normalizeDate(step.current_instance_date))
      instanceDate.setHours(0, 0, 0, 0)
      const fromDateNormalized = new Date(fromDate)
      fromDateNormalized.setHours(0, 0, 0, 0)
      
      // If current_instance_date is today or in the future and not completed, return it
      if (instanceDate >= fromDateNormalized && !step.completed) {
        return instanceDate
      }
      
      // If current_instance_date is completed, find the next occurrence
      if (step.completed && instanceDate.getTime() === fromDateNormalized.getTime()) {
        // Start searching from the day after current_instance_date
        fromDate = new Date(instanceDate)
        fromDate.setDate(fromDate.getDate() + 1)
      } else if (instanceDate < fromDateNormalized) {
        // If current_instance_date is in the past, start searching from fromDate
        fromDate = fromDateNormalized
      }
    }
    
    let checkDate = new Date(fromDate)
    checkDate.setHours(0, 0, 0, 0)
    
    for (let i = 0; i < 365; i++) {
      if (isStepScheduledForDay(step, checkDate)) {
        if (!isStepCompletedForDate(step, checkDate)) {
          return checkDate
        }
      }
      checkDate.setDate(checkDate.getDate() + 1)
    }
    
    return null
  }

  // Helper function to check if a date is in the current or next week
  const isDateInCurrentOrNextWeek = (date: Date): boolean => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const dayOfWeek = today.getDay()
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    const monday = new Date(today)
    monday.setDate(today.getDate() + diff)
    monday.setHours(0, 0, 0, 0)
    
    const sundayNextWeek = new Date(monday)
    sundayNextWeek.setDate(monday.getDate() + 13)
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
    
    const isToday = dateObj.getTime() === today.getTime()
    if (isToday) {
      return t('focus.today') || 'Dnes'
    }
    
    if (isDateInCurrentOrNextWeek(dateObj)) {
      return dateObj.toLocaleDateString(locale === 'cs' ? 'cs-CZ' : 'en-US', { weekday: 'long' })
    }
    
    return date.toLocaleDateString(locale === 'cs' ? 'cs-CZ' : 'en-US', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric'
    })
  }

  // Get all steps - sorted by date, with overdue first, then important first within each day
  // Limited to one month ahead
  // Note: Completed steps are kept in the list but sorted to the end
  // Use localSteps for optimistic updates
  const allSteps = useMemo(() => {
    const stepsWithDates: Array<{ step: any; date: Date; isImportant: boolean; isOverdue: boolean; goal: any; isCompleted: boolean }> = []
    
    // Process non-repeating steps
    localSteps
      .filter(step => !step.frequency || step.frequency === null)
      .forEach(step => {
        if (!step.date) return
        
        const stepDate = new Date(normalizeDate(step.date))
        stepDate.setHours(0, 0, 0, 0)
        
        // Filter out steps more than one month ahead
        if (stepDate > oneMonthFromToday) return
        
        const isOverdue = stepDate < today
        const goal = step.goal_id ? goalMap.get(step.goal_id) : null
        
        stepsWithDates.push({
          step,
          date: stepDate,
          isImportant: step.is_important || false,
          isOverdue,
          goal,
          isCompleted: step.completed || false
        })
      })
    
    // Process repeating steps
    localSteps
      .filter(step => step.frequency && step.frequency !== null)
      .forEach(step => {
        const nextDate = getNextOccurrenceDate(step, today)
        if (nextDate && nextDate <= oneMonthFromToday) {
          const goal = step.goal_id ? goalMap.get(step.goal_id) : null
          
          stepsWithDates.push({
            step: {
              ...step,
              date: getLocalDateString(nextDate),
              completed: false
            },
            date: nextDate,
            isImportant: step.is_important || false,
            isOverdue: false,
            goal,
            isCompleted: false
          })
        }
      })
    
    // Sort: completed steps last, then overdue first, then by date, then by importance within same date
    stepsWithDates.sort((a, b) => {
      // Completed steps go to the end
      if (a.isCompleted && !b.isCompleted) return 1
      if (!a.isCompleted && b.isCompleted) return -1
      
      if (a.isOverdue && !b.isOverdue) return -1
      if (!a.isOverdue && b.isOverdue) return 1
      
      const dateDiff = a.date.getTime() - b.date.getTime()
      if (dateDiff !== 0) return dateDiff
      
      if (a.isImportant && !b.isImportant) return -1
      if (!a.isImportant && b.isImportant) return 1
      return 0
    })
    
    return stepsWithDates.map(item => ({
      ...item.step,
      _isOverdue: item.isOverdue,
      _goal: item.goal
    }))
  }, [localSteps, today, oneMonthFromToday, goalMap])

  // Split into upcoming (first 15) and future (rest)
  const upcomingSteps = useMemo(() => {
    return allSteps.slice(0, maxUpcomingSteps)
  }, [allSteps, maxUpcomingSteps])

  const futureSteps = useMemo(() => {
    return allSteps.slice(maxUpcomingSteps)
  }, [allSteps, maxUpcomingSteps])

  const renderStep = (step: any) => {
    const isLoading = loadingSteps.has(step.id)
    const stepDate = step.date ? normalizeDate(step.date) : null
    const stepDateObj = stepDate ? new Date(stepDate) : null
    if (stepDateObj) stepDateObj.setHours(0, 0, 0, 0)
    const isToday = stepDateObj && stepDateObj.getTime() === today.getTime()
    const isOverdue = (step as any)._isOverdue || false
    const goal = (step as any)._goal
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
            // Optimistic update - update locally first
            setLocalSteps(prevSteps => 
              prevSteps.map(s => 
                s.id === step.id 
                  ? { ...s, completed: !s.completed }
                  : s
              )
            )
            // Then call API
            handleStepToggle(step.id, !step.completed).catch(() => {
              // Revert on error
              setLocalSteps(prevSteps => 
                prevSteps.map(s => 
                  s.id === step.id 
                    ? { ...s, completed: step.completed }
                    : s
                )
              )
            })
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
        
        {/* Title and Goal */}
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
          {goal && (
            <div className="text-xs text-gray-500 mt-0.5 truncate">
              {goal.title}
            </div>
          )}
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
  }

  return (
    <div className="w-full flex flex-col p-6 space-y-6">
      {/* Today's Habits - always show if available */}
      {todaysHabits.length > 0 && handleHabitToggle && (
        <div className="flex flex-wrap gap-3 mb-4">
          {todaysHabits.map((habit) => {
            const isCompleted = habit.habit_completions && habit.habit_completions[todayStr] === true
            const isLoading = loadingHabits.has(habit.id)
            
            return (
              <div
                key={habit.id}
                onClick={() => handleItemClick(habit, 'habit')}
                className={`flex items-center gap-2 p-3 rounded-playful-md cursor-pointer transition-all flex-shrink-0 ${
                  isCompleted
                    ? 'bg-primary-100 opacity-75 hover:outline-2 hover:outline hover:outline-primary-300 hover:outline-offset-[-2px]'
                    : 'bg-white hover:bg-primary-50 hover:outline-2 hover:outline hover:outline-primary-500 hover:outline-offset-[-2px]'
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
                  {isLoading ? (
                    <svg className="animate-spin h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : isCompleted ? (
                    <Check className="w-4 h-4 text-white" />
                  ) : null}
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
      )}

      {/* Upcoming Steps */}
      {upcomingSteps.length === 0 && futureSteps.length === 0 ? (
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
          {/* Upcoming Steps */}
          {upcomingSteps.length > 0 && (
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
              
              <div className="space-y-2">
                {upcomingSteps.map(step => renderStep(step))}
              </div>
            </div>
          )}

          {/* Future Steps */}
          {futureSteps.length > 0 && (
            <div className="card-playful-base">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Footprints className="w-5 h-5 text-primary-600" />
                  <h2 className="text-lg font-bold text-black font-playful">
                    {t('views.futureSteps') || 'Budoucí kroky'}
                  </h2>
                </div>
              </div>
              
              <div className="space-y-2">
                {futureSteps.map(step => renderStep(step))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}


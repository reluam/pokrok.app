'use client'

import { useState, useMemo, useEffect } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { getLocalDateString, normalizeDate } from '../utils/dateHelpers'
import { Check, Plus, Filter, ChevronDown, ChevronUp, Repeat, Star } from 'lucide-react'
import { getIconComponent } from '@/lib/icon-utils'

interface StepsManagementViewProps {
  dailySteps: any[]
  goals: any[]
  areas?: any[]
  onDailyStepsUpdate?: (steps: any[]) => void
  userId?: string | null
  player?: any
  onOpenStepModal?: (step?: any) => void
  hideHeader?: boolean
  showCompleted?: boolean
  goalFilter?: string | null
  areaFilter?: string | null
  dateFilter?: string | null
  onStepImportantChange?: (stepId: string, isImportant: boolean) => Promise<void>
  handleStepToggle?: (stepId: string, completed: boolean, completionDate?: string) => Promise<void>
  loadingSteps?: Set<string>
}

export function StepsManagementView({
  dailySteps = [],
  goals = [],
  areas = [],
  onDailyStepsUpdate,
  userId,
  player,
  onOpenStepModal,
  hideHeader = false,
  showCompleted: showCompletedProp,
  goalFilter: goalFilterProp,
  areaFilter: areaFilterProp,
  dateFilter: dateFilterProp,
  onStepImportantChange,
  handleStepToggle,
  loadingSteps: loadingStepsProp
}: StepsManagementViewProps) {
  const t = useTranslations()
  const locale = useLocale()
  const localeCode = locale === 'cs' ? 'cs-CZ' : 'en-US'
  
  // Local state for filters
  const [showCompleted, setShowCompleted] = useState(false)
  const [stepsGoalFilter, setStepsGoalFilter] = useState<string | null>(null)
  const [stepsAreaFilter, setStepsAreaFilter] = useState<string | null>(null)
  const [stepsDateFilter, setStepsDateFilter] = useState<string | null>(null)
  const [filtersExpanded, setFiltersExpanded] = useState(false)
  const [displayedStepsCount, setDisplayedStepsCount] = useState(50)
  const [loadingSteps, setLoadingSteps] = useState<Set<string>>(new Set())
  
  // Use props if provided, otherwise use local state
  const effectiveShowCompleted = showCompletedProp !== undefined ? showCompletedProp : showCompleted
  const effectiveGoalFilter = goalFilterProp !== undefined ? goalFilterProp : stepsGoalFilter
  const effectiveAreaFilter = areaFilterProp !== undefined ? areaFilterProp : stepsAreaFilter
  const effectiveDateFilter = dateFilterProp !== undefined ? dateFilterProp : stepsDateFilter
  const effectiveLoadingSteps = loadingStepsProp || loadingSteps

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = getLocalDateString(today)

  // Create maps for quick lookup (same as UpcomingView)
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

  // Format date for display - same logic as UpcomingView
  const formatStepDate = (dateStr: string | null, isCompleted: boolean = false) => {
    if (!dateStr) return ''
    const date = new Date(normalizeDate(dateStr))
    const dateObj = new Date(date)
    dateObj.setHours(0, 0, 0, 0)
    
    // For completed steps, always show the date (not "Today" or weekday name)
    if (isCompleted) {
      return date.toLocaleDateString(locale === 'cs' ? 'cs-CZ' : 'en-US', {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric'
      })
    }
    
    // For non-completed steps, show "Today" if it's today's date
    const isToday = dateObj.getTime() === today.getTime()
    if (isToday) {
      return t('focus.today') || 'Dnes'
    }
    
    // Calculate days difference
    const diffTime = dateObj.getTime() - today.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    
    // For overdue steps (in the past): use weekday name only if within 6 days
    if (diffDays < 0 && diffDays >= -6) {
      return dateObj.toLocaleDateString(locale === 'cs' ? 'cs-CZ' : 'en-US', { weekday: 'long' })
    }
    
    // For future steps: use weekday name only if within 6 days
    if (diffDays > 0 && diffDays <= 6) {
      return dateObj.toLocaleDateString(locale === 'cs' ? 'cs-CZ' : 'en-US', { weekday: 'long' })
    }
    
    // For dates outside the 6-day range (both past and future), always show date
    return date.toLocaleDateString(locale === 'cs' ? 'cs-CZ' : 'en-US', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric'
    })
  }

  // Filter and sort steps - BASED ON UpcomingView's allFeedSteps logic
  const allSteps = useMemo(() => {
    const stepsWithDates: Array<{ step: any; date: Date; isImportant: boolean; isUrgent: boolean; isOverdue: boolean; goal: any; area: any }> = []
    
    // Ensure dailySteps is an array
    if (!Array.isArray(dailySteps)) {
      console.error('dailySteps is not an array:', dailySteps)
      return []
    }
    
    // Process non-repeating steps (EXACTLY like UpcomingView)
    dailySteps
      .filter(step => {
        // Exclude hidden steps (recurring step templates) - only if explicitly set to true
        if (step.is_hidden === true) return false
        // Include only non-recurring steps that are NOT instances of recurring steps
        // Instances have parent_recurring_step_id set (link to template)
        return (!step.frequency || step.frequency === null) && !step.parent_recurring_step_id
      })
      .forEach(step => {
        // Skip completed steps if showCompleted is false (EXACTLY like UpcomingView line 276)
        if (!effectiveShowCompleted) {
          if (step.completed) return
        }
        
        // If step has no date, skip it (we need date for display)
        if (!step.date) return
      
        const stepDate = new Date(normalizeDate(step.date))
        stepDate.setHours(0, 0, 0, 0)
        const isOverdue = stepDate < today && !step.completed
        
        // Filter by goal
        if (effectiveGoalFilter) {
          if (effectiveGoalFilter === 'none') {
            if (step.goal_id || step.goalId) return
        } else {
            if ((step.goal_id || step.goalId) !== effectiveGoalFilter) return
          }
        }

        // Filter by area
        if (effectiveAreaFilter) {
          const stepGoalId = step.goal_id || step.goalId
          const stepAreaId = step.area_id || step.areaId
          
          if (effectiveAreaFilter === 'none') {
            // Show steps without area
            if (stepAreaId) return
            if (stepGoalId) {
              const stepGoal = goalMap.get(stepGoalId)
              if (stepGoal && (stepGoal.area_id || stepGoal.areaId)) return
            }
      } else {
            // Show steps with specific area
            if (stepAreaId === effectiveAreaFilter) {
              // Step is directly assigned to the area
            } else if (stepGoalId) {
              const stepGoal = goalMap.get(stepGoalId)
              if (stepGoal && (stepGoal.area_id || stepGoal.areaId) === effectiveAreaFilter) {
                // Goal belongs to the area
              } else {
                return
              }
            } else {
              return
            }
          }
        }

        // Filter by date
        if (effectiveDateFilter) {
          let stepDateField: string | null = null
          if (step.completed && step.completed_at) {
            stepDateField = step.completed_at.includes('T') ? step.completed_at.split('T')[0] : step.completed_at
        } else {
            stepDateField = step.date
          }
          const stepDateStr = stepDateField ? (stepDateField.includes('T') ? stepDateField.split('T')[0] : stepDateField) : null
          if (stepDateStr !== effectiveDateFilter) return
        }
        
        const goal = step.goal_id ? goalMap.get(step.goal_id) : null
        // Get area from goal if exists, otherwise from step directly
        const area = goal?.area_id 
          ? areaMap.get(goal.area_id) 
          : (step.area_id ? areaMap.get(step.area_id) : null)
        
        stepsWithDates.push({
          step,
          date: stepDate,
          isImportant: step.is_important || false,
          isUrgent: step.is_urgent || false,
          isOverdue,
          goal,
          area
        })
      })
    
    // Process recurring steps (EXACTLY like UpcomingView)
    dailySteps
      .filter(step => {
        const isRecurringStep = step.frequency && step.frequency !== null
        if (!isRecurringStep) return false
        // Exclude hidden steps
        if (step.is_hidden === true) return false
        // Skip completed recurring steps if showCompleted is false
        if (!effectiveShowCompleted) {
          if (step.completed) return false
              }
              return true
            })
      .forEach(step => {
        // For recurring steps, use current_instance_date
        const stepDateField = step.current_instance_date || step.date
        if (!stepDateField) return
        
        const stepDate = new Date(normalizeDate(stepDateField))
        stepDate.setHours(0, 0, 0, 0)
        const isOverdue = stepDate < today && !step.completed
        
        // Filter by goal
        if (effectiveGoalFilter) {
          if (effectiveGoalFilter === 'none') {
            if (step.goal_id || step.goalId) return
        } else {
            if ((step.goal_id || step.goalId) !== effectiveGoalFilter) return
          }
        }

        // Filter by area
        if (effectiveAreaFilter) {
          const stepGoalId = step.goal_id || step.goalId
          const stepAreaId = step.area_id || step.areaId
          
          if (effectiveAreaFilter === 'none') {
            // Show steps without area
            if (stepAreaId) return
            if (stepGoalId) {
              const stepGoal = goalMap.get(stepGoalId)
              if (stepGoal && (stepGoal.area_id || stepGoal.areaId)) return
            }
          } else {
            // Show steps with specific area
            if (stepAreaId === effectiveAreaFilter) {
              // Step is directly assigned to the area
            } else if (stepGoalId) {
              const stepGoal = goalMap.get(stepGoalId)
              if (stepGoal && (stepGoal.area_id || stepGoal.areaId) === effectiveAreaFilter) {
                // Goal belongs to the area
              } else {
      return
    }
      } else {
              return
            }
          }
        }

        // Filter by date
        if (effectiveDateFilter) {
          const stepDateStr = stepDateField ? (stepDateField.includes('T') ? stepDateField.split('T')[0] : stepDateField) : null
          if (stepDateStr !== effectiveDateFilter) return
        }
        
        const goal = step.goal_id ? goalMap.get(step.goal_id) : null
        // Get area from goal if exists, otherwise from step directly
        const area = goal?.area_id 
          ? areaMap.get(goal.area_id) 
          : (step.area_id ? areaMap.get(step.area_id) : null)
        
        stepsWithDates.push({
          step,
          date: stepDate,
          isImportant: step.is_important || false,
          isUrgent: step.is_urgent || false,
          isOverdue,
          goal,
          area
        })
      })
    
    // Sort: completed steps by completed_at (newest first), non-completed by date (newest first)
    stepsWithDates.sort((a, b) => {
      // Completed steps first (if showCompleted is true)
      if (a.step.completed && !b.step.completed) return -1
      if (!a.step.completed && b.step.completed) return 1

      // For completed steps, sort by completed_at (newest first)
      if (a.step.completed && b.step.completed) {
        const aCompleted = a.step.completed_at ? new Date(normalizeDate(a.step.completed_at)).getTime() : 0
        const bCompleted = b.step.completed_at ? new Date(normalizeDate(b.step.completed_at)).getTime() : 0
        return bCompleted - aCompleted
      }

      // For non-completed steps, sort by date (newest first)
      return b.date.getTime() - a.date.getTime()
    })
    
    // Return all steps with additional metadata (same format as UpcomingView)
    return stepsWithDates.map(item => ({
      ...item.step,
      _isOverdue: item.isOverdue,
      _goal: item.goal,
      _area: item.area,
      _date: item.date
    }))
  }, [dailySteps, effectiveShowCompleted, effectiveGoalFilter, effectiveAreaFilter, effectiveDateFilter, goalMap, areaMap, today])

  // Paginated steps
  const paginatedSteps = useMemo(() => {
    return allSteps.slice(0, displayedStepsCount)
  }, [allSteps, displayedStepsCount])

  // Reset pagination when filters change
  useEffect(() => {
    setDisplayedStepsCount(50)
  }, [effectiveShowCompleted, effectiveGoalFilter, effectiveAreaFilter, effectiveDateFilter])

  const hasMoreSteps = allSteps.length > displayedStepsCount

  // Internal step toggle handler - same approach as UpcomingView
  const handleInternalStepToggle = async (stepId: string, completed: boolean, completionDate?: string) => {
    // Use handleStepToggle from props if available
    if (handleStepToggle) {
      return handleStepToggle(stepId, completed, completionDate)
    }
    
    // Otherwise use internal handler
    setLoadingSteps(prev => new Set(prev).add(stepId))
    
    try {
      const step = dailySteps.find((s: any) => s.id === stepId)
      if (!step) {
        setLoadingSteps(prev => {
          const newSet = new Set(prev)
          newSet.delete(stepId)
          return newSet
        })
        return
      }

      const isRecurringStep = step?.frequency && step.frequency !== null
      // Use provided completionDate, or calculate it for recurring steps
      let finalCompletionDate: string | undefined = completionDate
      if (!finalCompletionDate && isRecurringStep && completed && step.current_instance_date) {
        finalCompletionDate = step.current_instance_date
      }

      const response = await fetch('/api/daily-steps', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stepId,
          completed,
          completedAt: completed ? new Date().toISOString() : null,
          completionDate: finalCompletionDate || undefined
        }),
      })

      if (response.ok) {
        // Refresh steps list
        const currentUserId = userId || player?.user_id
        if (currentUserId) {
          const stepsResponse = await fetch(`/api/daily-steps?userId=${currentUserId}`)
          if (stepsResponse.ok) {
            const stepsData = await stepsResponse.json()
            const stepsArray = Array.isArray(stepsData) ? stepsData : (stepsData.steps || stepsData.dailySteps || [])
            if (onDailyStepsUpdate) {
              onDailyStepsUpdate(stepsArray)
            }
          }
          }
        } else {
        console.error('Failed to update step')
      }
    } catch (error) {
      console.error('Error toggling step:', error)
    } finally {
      setLoadingSteps(prev => {
        const newSet = new Set(prev)
        newSet.delete(stepId)
        return newSet
      })
    }
  }

  return (
    <div className="w-full h-full flex flex-col bg-primary-50">
      {!hideHeader && (
        <>
          {/* Filters Row */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4 px-4 py-3 bg-white border-b-2 border-primary-500">
        {/* Mobile: Collapsible filters */}
        <div className="md:hidden flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={() => setFiltersExpanded(!filtersExpanded)}
              className="btn-playful-base flex items-center gap-2 px-3 py-2 text-sm font-medium text-black font-playful bg-white hover:bg-primary-50"
            >
              <Filter className="w-4 h-4" />
              <span>Filtry</span>
              {filtersExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
            
                {onOpenStepModal && (
            <button
                    onClick={() => onOpenStepModal()}
              className="btn-playful-base flex items-center justify-center gap-2 px-4 py-2 text-primary-600 bg-white hover:bg-primary-50 text-sm font-medium flex-1"
            >
              <Plus className="w-4 h-4" />
              {t('steps.add')}
            </button>
                )}
          </div>
          
          {filtersExpanded && (
            <div className="flex flex-col gap-2 pt-2 border-t-2 border-primary-500">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={effectiveShowCompleted}
              onChange={(e) => setShowCompleted(e.target.checked)}
              className="w-4 h-4 text-primary-600 border-2 border-primary-500 rounded-playful-sm focus:ring-primary-500"
            />
            <span className="text-sm text-black font-playful">{t('steps.filters.showCompleted')}</span>
          </label>
          
          <select
            value={effectiveGoalFilter || ''}
            onChange={(e) => setStepsGoalFilter(e.target.value || null)}
                className="w-full px-3 py-1.5 text-sm border-2 border-primary-500 rounded-playful-md font-playful focus:ring-2 focus:ring-primary-500 bg-white"
          >
            <option value="">{t('steps.filters.goal.all')}</option>
            <option value="none">{t('steps.filters.goal.withoutGoal') || 'Bez cíle'}</option>
            {goals.map((goal: any) => (
              <option key={goal.id} value={goal.id}>{goal.title}</option>
            ))}
          </select>
          
                  {areas && areas.length > 0 && (
                    <select
                      value={effectiveAreaFilter || ''}
                      onChange={(e) => setStepsAreaFilter(e.target.value || null)}
                      className="w-full px-3 py-1.5 text-sm border-2 border-primary-500 rounded-playful-md font-playful focus:ring-2 focus:ring-primary-500 bg-white"
                    >
                      <option value="">{t('steps.filters.area.all')}</option>
                      <option value="none">{t('steps.filters.area.withoutArea')}</option>
                      {areas.map((area: any) => (
                        <option key={area.id} value={area.id}>{area.name}</option>
                      ))}
                    </select>
                  )}
                  
              <div className="flex items-center gap-2">
          <input
            type="date"
            value={effectiveDateFilter || ''}
            onChange={(e) => setStepsDateFilter(e.target.value || null)}
                  className="flex-1 px-3 py-1.5 text-sm border-2 border-primary-500 rounded-playful-md font-playful focus:ring-2 focus:ring-primary-500 bg-white"
                />
                {stepsDateFilter && (
                  <button
                    onClick={() => setStepsDateFilter(null)}
                    className="btn-playful-base px-2 py-1.5 text-xs text-gray-600 hover:text-primary-600 bg-white hover:bg-primary-50"
                  >
                    {t('common.clear')}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Desktop: Always visible filters */}
        <div className="hidden md:flex md:items-center gap-3 flex-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={effectiveShowCompleted}
              onChange={(e) => setShowCompleted(e.target.checked)}
              className="w-4 h-4 text-primary-600 border-2 border-primary-500 rounded-playful-sm focus:ring-primary-500"
            />
            <span className="text-sm text-black font-playful">{t('steps.filters.showCompleted')}</span>
          </label>
          
          <select
            value={effectiveGoalFilter || ''}
            onChange={(e) => setStepsGoalFilter(e.target.value || null)}
            className="px-3 py-1.5 text-sm border-2 border-primary-500 rounded-playful-md font-playful focus:ring-2 focus:ring-primary-500 bg-white min-w-[150px]"
          >
            <option value="">{t('steps.filters.goal.all')}</option>
            <option value="none">{t('steps.filters.goal.withoutGoal') || 'Bez cíle'}</option>
            {goals.map((goal: any) => (
              <option key={goal.id} value={goal.id}>{goal.title}</option>
            ))}
          </select>
          
              {areas && areas.length > 0 && (
                <select
                  value={effectiveAreaFilter || ''}
                  onChange={(e) => setStepsAreaFilter(e.target.value || null)}
                  className="px-3 py-1.5 text-sm border-2 border-primary-500 rounded-playful-md font-playful focus:ring-2 focus:ring-primary-500 bg-white min-w-[150px]"
                >
                  <option value="">{t('steps.filters.area.all')}</option>
                  <option value="none">{t('steps.filters.area.withoutArea')}</option>
                  {areas.map((area: any) => (
                    <option key={area.id} value={area.id}>{area.name}</option>
                  ))}
                </select>
              )}
              
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={effectiveDateFilter || ''}
              onChange={(e) => setStepsDateFilter(e.target.value || null)}
              className="px-3 py-1.5 text-sm border-2 border-primary-500 rounded-playful-md font-playful focus:ring-2 focus:ring-primary-500 bg-white"
            />
          {stepsDateFilter && (
            <button
              onClick={() => setStepsDateFilter(null)}
              className="px-2 py-1.5 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {t('common.clear')}
            </button>
          )}
          </div>
        </div>
        
            {onOpenStepModal && (
        <button
                onClick={() => onOpenStepModal()}
          className="btn-playful-base hidden md:flex items-center gap-2 px-4 py-2 text-primary-600 bg-white hover:bg-primary-50 text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          {t('steps.add')}
        </button>
            )}
      </div>
        </>
      )}
      
      {/* Steps List - using same design as UpcomingView feed */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pt-2 space-y-2">
        {paginatedSteps.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-gray-600">{t('views.noSteps') || 'Žádné kroky'}</p>
          </div>
        ) : (
          <>
            {paginatedSteps.map((step) => {
              const isLoading = effectiveLoadingSteps.has(step.id)
              const stepDateObj = (step as any)._date as Date | undefined
              if (stepDateObj) stepDateObj.setHours(0, 0, 0, 0)
              const stepDateStr = stepDateObj ? getLocalDateString(stepDateObj) : null
              const isToday = stepDateObj && stepDateObj.getTime() === today.getTime()
              const isOverdue = (step as any)._isOverdue || false
              const isFuture = stepDateObj && stepDateObj > today && !isOverdue && !isToday
              const stepDateFormatted = stepDateStr ? formatStepDate(stepDateStr, step.completed) : null
              const goal = (step as any)._goal
              const area = (step as any)._area
                  const isRecurringStep = step.frequency && step.frequency !== null
                  
                  return (
                <div
                      key={step.id}
                  onClick={() => {
                    if (onOpenStepModal) {
                      onOpenStepModal(step)
                    }
                  }}
                  className={`flex items-center gap-3 p-3 cursor-pointer transition-[background-color,opacity,outline] rounded-playful-md ${
                    step.completed
                      ? 'opacity-50'
                      : isOverdue
                        ? 'bg-red-50 hover:bg-red-100 hover:outline-2 hover:outline hover:outline-red-300 hover:outline-offset-[-2px]'
                        : isToday
                          ? 'bg-white hover:bg-primary-50 hover:outline-2 hover:outline hover:outline-primary-500 hover:outline-offset-[-2px]'
                          : isFuture
                            ? 'bg-white/70 backdrop-blur-sm opacity-75 hover:bg-white/85 hover:opacity-85 hover:outline-2 hover:outline hover:outline-gray-200/50 hover:outline-offset-[-2px] group'
                            : 'bg-white hover:bg-primary-50 hover:outline-2 hover:outline hover:outline-gray-300 hover:outline-offset-[-2px]'
                  } ${isLoading ? 'opacity-50' : ''}`}
                >
                  {/* Checkbox */}
                          <button
                    onClick={(e) => {
                              e.stopPropagation()
                      // For recurring steps, pass the date of this occurrence
                      const stepDate = (step as any)._date as Date | undefined
                      const completionDate = stepDate ? getLocalDateString(stepDate) : undefined
                      handleInternalStepToggle(step.id, !step.completed, completionDate)
                    }}
                    disabled={isLoading}
                    className={`w-6 h-6 rounded-playful-sm border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
                      step.completed
                        ? 'bg-primary-500 border-primary-500' 
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
                  
                  {/* Goal icon in area color */}
                  {goal && goal.icon && (
                    <div className="flex-shrink-0">
                      {(() => {
                        const GoalIconComponent = getIconComponent(goal.icon)
                        return (
                          <GoalIconComponent 
                            className={`w-5 h-5 transition-opacity ${isFuture ? 'opacity-60 group-hover:opacity-80' : ''}`}
                            style={{ color: area?.color || '#E8871E' }} 
                          />
                        )
                      })()}
                        </div>
                  )}
                  
                  {/* Step info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {isRecurringStep && (
                            <div className="flex items-center gap-1 flex-shrink-0">
                          <Repeat className={`w-3.5 h-3.5 transition-colors ${isFuture ? 'text-primary-400 group-hover:text-primary-500' : 'text-primary-600'}`} />
                              {step.completion_count > 0 && (
                            <span className={`text-[10px] font-semibold transition-colors ${isFuture ? 'text-primary-400 group-hover:text-primary-500' : 'text-primary-600'}`}>
                                  {step.completion_count}
                                </span>
                              )}
                            </div>
                          )}
                      <span className={`text-sm truncate transition-colors ${
                        step.completed 
                          ? 'line-through text-gray-400' 
                          : isOverdue
                            ? 'text-red-600'
                            : isFuture
                              ? 'text-gray-500 group-hover:text-gray-700'
                              : 'text-black'
                      } ${step.is_important && !step.completed && !isFuture ? 'font-bold' : 'font-medium'}`}>
                            {step.title}
                          </span>
                      {step.checklist && step.checklist.length > 0 && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-playful-sm flex-shrink-0 border-2 ${
                          step.checklist.filter((c: any) => c.completed).length === step.checklist.length
                            ? 'bg-primary-100 text-primary-600 border-primary-500'
                            : 'bg-gray-100 text-gray-500 border-gray-300'
                        }`}>
                          {step.checklist.filter((c: any) => c.completed).length}/{step.checklist.length}
                          </span>
                        )}
          </div>
                    {/* Goal name */}
                    {goal && (
                      <div className={`flex items-center gap-1 text-xs transition-colors ${isFuture ? 'text-gray-400 group-hover:text-gray-500' : 'text-gray-500'}`}>
                        <span>{goal.title}</span>
                  </div>
                )}
              </div>

                  {/* Date and time */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`hidden sm:block w-28 text-xs text-center capitalize flex-shrink-0 rounded-playful-sm px-1 py-0.5 border-2 ${
                      isOverdue
                        ? 'text-red-600 border-red-300'
                                      : isToday
                          ? 'text-primary-600 border-primary-500' 
                          : 'text-gray-600 border-gray-300'
                    }`}>
                      {isOverdue && '❗'}
                      {stepDateFormatted || '-'}
                        </span>
                    <span className={`hidden sm:block w-20 text-xs text-center flex-shrink-0 rounded-playful-sm px-1 py-0.5 border-2 text-gray-600 border-gray-300`}>
                      {step.estimated_time ? `${step.estimated_time} min` : '-'}
                    </span>
                    {onStepImportantChange && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                          if (onStepImportantChange) {
                            onStepImportantChange(step.id, !(step.is_important === true))
                          }
                        }}
                        disabled={effectiveLoadingSteps.has(step.id)}
                        className={`flex items-center justify-center w-5 h-5 rounded-playful-sm transition-all flex-shrink-0 ${
                          step.is_important
                            ? 'text-primary-600 hover:text-primary-700 hover:scale-110'
                            : 'text-gray-400 hover:text-primary-500 hover:scale-110'
                        } ${effectiveLoadingSteps.has(step.id) ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title={step.is_important ? (t('steps.unmarkImportant') || 'Označit jako nedůležité') : (t('steps.markImportant') || 'Označit jako důležité')}
                      >
                        {effectiveLoadingSteps.has(step.id) ? (
                          <div className="animate-spin h-3 w-3 border-2 border-primary-500 border-t-transparent rounded-full"></div>
                        ) : (
                          <Star className={`w-4 h-4 ${step.is_important ? 'fill-current' : ''}`} strokeWidth={step.is_important ? 0 : 2} />
                        )}
                        </button>
                    )}
                      </div>
                    </div>
              )
            })}
            
            {/* Load More button */}
            {hasMoreSteps && (
              <div className="text-center py-4">
                      <button
                  onClick={() => setDisplayedStepsCount(prev => prev + 50)}
                  className="btn-playful-base px-6 py-2 text-sm font-medium text-black font-playful bg-white hover:bg-primary-50 border-2 border-primary-500"
                >
                  {t('steps.loadMore') || 'Načíst více'} ({allSteps.length - displayedStepsCount} {t('steps.remainingSteps') || 'zbývá'})
                      </button>
                    </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

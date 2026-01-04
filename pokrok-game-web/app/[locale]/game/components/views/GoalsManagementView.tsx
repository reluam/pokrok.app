'use client'

import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useTranslations, useLocale } from 'next-intl'
import { getLocalDateString } from '../../../main/components/utils/dateHelpers'
import { Plus, Target, Calendar, CheckCircle, Moon, ArrowRight, ChevronLeft } from 'lucide-react'
import { getIconComponent } from '@/lib/icon-utils'
import { GoalDetailWrapper } from './GoalDetailWrapper'

interface GoalsManagementViewProps {
  goals: any[]
  onGoalsUpdate?: (goals: any[]) => void
  userId?: string | null
  player?: any
  onOpenStepModal?: (step?: any, goalId?: string) => void
  onGoalClick?: (goalId: string) => void
  onCreateGoal?: () => void
  onGoalDateClick?: (goalId: string, e: React.MouseEvent) => void
  onGoalStatusClick?: (goalId: string, e: React.MouseEvent) => void
  dailySteps?: any[] // Add dailySteps prop to update cache when steps change
  hideHeader?: boolean // If true, don't render header and filters
  statusFilters?: Set<string> // External status filters (if provided, use these instead of internal state)
  selectedGoalId?: string | null // Selected goal ID to show detail
  onSelectedGoalChange?: (goalId: string | null) => void // Callback when selected goal changes
  onDailyStepsUpdate?: (steps: any[]) => void // Callback to update daily steps
}

export function GoalsManagementView({
  goals = [],
  onGoalsUpdate,
  userId,
  player,
  onOpenStepModal,
  onGoalClick,
  onCreateGoal,
  onGoalDateClick,
  onGoalStatusClick,
  dailySteps = [],
  hideHeader = false,
  statusFilters: externalStatusFilters,
  selectedGoalId: externalSelectedGoalId,
  onSelectedGoalChange,
  onDailyStepsUpdate
}: GoalsManagementViewProps) {
  const t = useTranslations()
  const localeCode = useLocale()
  
  // Status filters - defaultně pouze 'active' zaškrtnutý
  // Use external filters if provided, otherwise use internal state
  const [internalStatusFilters, setInternalStatusFilters] = useState<Set<string>>(new Set(['active']))
  const statusFilters = externalStatusFilters || internalStatusFilters
  
  // Handle status filter toggle
  const handleStatusFilterToggle = (status: string) => {
    if (externalStatusFilters) {
      // If external filters are provided, don't handle toggle here
      // The parent component should handle it
      return
    }
    setInternalStatusFilters(prev => {
      const newSet = new Set(prev)
      if (newSet.has(status)) {
        newSet.delete(status)
      } else {
        newSet.add(status)
      }
      return newSet
    })
  }

  // Goal steps cache
  const [goalStepsCache, setGoalStepsCache] = useState<Record<string, any[]>>({})
  const [loadingSteps, setLoadingSteps] = useState<Set<string>>(new Set())

  // Load steps for all goals
  useEffect(() => {
    const loadAllSteps = async () => {
      const loadingSet = new Set<string>()
      goals.forEach(goal => loadingSet.add(goal.id))
      setLoadingSteps(loadingSet)
      
      try {
        // ✅ PERFORMANCE: Load all steps in one batch request
        const goalIds = goals.map(goal => goal.id).filter(Boolean)
        
        if (goalIds.length > 0) {
          const batchResponse = await fetch('/api/daily-steps/batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ goalIds })
          })
          
          if (batchResponse.ok) {
            const { stepsByGoal } = await batchResponse.json()
            setGoalStepsCache(stepsByGoal || {})
          } else {
            // Fallback to individual requests if batch fails
            const stepPromises = goals.map(async (goal) => {
              try {
                const response = await fetch(`/api/daily-steps?goalId=${goal.id}`)
                if (response.ok) {
                  const steps = await response.json()
                  return { goalId: goal.id, steps: Array.isArray(steps) ? steps : [] }
                }
                return { goalId: goal.id, steps: [] }
              } catch (error) {
                console.error(`Error loading steps for goal ${goal.id}:`, error)
                return { goalId: goal.id, steps: [] }
              }
            })
            
            const results = await Promise.all(stepPromises)
            const stepsMap: Record<string, any[]> = {}
            results.forEach(({ goalId, steps }) => {
              stepsMap[goalId] = steps
            })
            setGoalStepsCache(stepsMap)
          }
        } else {
          setGoalStepsCache({})
        }
        
        setLoadingSteps(new Set())
      } catch (error) {
        console.error('Error loading steps:', error)
        setLoadingSteps(new Set())
      }
    }
    
    if (goals.length > 0) {
      loadAllSteps()
      } else {
      setGoalStepsCache({})
      setLoadingSteps(new Set())
    }
  }, [goals])

  // Update cache when dailySteps prop changes (e.g., when checklist is updated)
  useEffect(() => {
    // Group steps by goal_id
    const stepsByGoal: Record<string, any[]> = {}
    dailySteps.forEach(step => {
      if (step.goal_id) {
        if (!stepsByGoal[step.goal_id]) {
          stepsByGoal[step.goal_id] = []
        }
        stepsByGoal[step.goal_id].push(step)
      }
    })
    
    // Update cache for goals that have steps in dailySteps
    // Merge with existing cache to preserve steps that might not be in dailySteps
    setGoalStepsCache(prev => {
      const updated = { ...prev }
      Object.keys(stepsByGoal).forEach(goalId => {
        // Merge with existing cache to avoid losing steps
        const existingSteps = prev[goalId] || []
        const newSteps = stepsByGoal[goalId]
        // Create a map to deduplicate by id
        const stepsMap = new Map()
        existingSteps.forEach((s: any) => stepsMap.set(s.id, s))
        newSteps.forEach((s: any) => stepsMap.set(s.id, s))
        updated[goalId] = Array.from(stepsMap.values())
      })
      return updated
    })
  }, [dailySteps])

  // Filter recurring step instances to show only the nearest instance
  // This matches the logic in GoalDetailPage.tsx
  const filterRecurringStepInstances = (steps: any[]): any[] => {
    // Find all recurring step instances (non-recurring steps with parent_recurring_step_id)
    const recurringStepInstances = steps.filter(step => 
      !step.frequency && step.parent_recurring_step_id && step.is_hidden !== true
    )
    
    // Group instances by original recurring step
    const instancesByRecurringStep = new Map<string, any[]>()
    recurringStepInstances.forEach(step => {
      if (!step.parent_recurring_step_id) return
      const originalStep = steps.find(s => 
        s.id === step.parent_recurring_step_id &&
        s.frequency !== null &&
        s.is_hidden === true
      )
      
      if (originalStep) {
        const key = originalStep.id
        if (!instancesByRecurringStep.has(key)) {
          instancesByRecurringStep.set(key, [])
        }
        instancesByRecurringStep.get(key)!.push(step)
      }
    })
    
    // Get only the nearest non-completed instance for each recurring step
    // For completed instances, we count all of them (they represent historical data)
    const nearestInstancesForRemaining = new Set<string>()
    
    instancesByRecurringStep.forEach((instances) => {
      // Sort instances by date (oldest first, instances without date go to end)
      instances.sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : Number.MAX_SAFE_INTEGER
        const dateB = b.date ? new Date(b.date).getTime() : Number.MAX_SAFE_INTEGER
        return dateA - dateB
      })
      
      // For "Remaining steps": get the nearest non-completed instance
      const nonCompletedInstances = instances.filter((inst: any) => !inst.completed)
      if (nonCompletedInstances.length > 0) {
        nearestInstancesForRemaining.add(nonCompletedInstances[0].id)
      }
    })
    
    // Filter steps: exclude hidden templates
    // For recurring step instances:
    // - For non-completed instances: show only the nearest one
    // - For completed instances: show all (they represent historical data)
    return steps.filter(step => {
      // Exclude hidden recurring step templates
      if (step.is_hidden === true && step.frequency !== null) {
        return false
      }
      
      // For recurring step instances, apply different logic
      if (!step.frequency && step.parent_recurring_step_id) {
        // For non-completed instances: show only the nearest one
        if (!step.completed) {
          return nearestInstancesForRemaining.has(step.id)
        }
        // For completed instances: show all
        return true
      }
      
      // Include all other steps
      return true
    })
  }

  // Calculate progress for a goal
  const calculateProgress = (goalId: string) => {
    const steps = goalStepsCache[goalId] || []
    // Filter recurring step instances to count only nearest instances
    const filteredSteps = filterRecurringStepInstances(steps)
    const totalSteps = filteredSteps.length
    const completedSteps = filteredSteps.filter(s => s.completed).length
    const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0
    return { progress, completedSteps, totalSteps }
  }

  // Filter and sort goals
  const filteredAndSortedGoals = useMemo(() => {
    // First filter by status
    // Normalize status - if status is null/undefined, treat as 'active'
    const filtered = goals.filter(goal => {
      const goalStatus = goal.status || 'active'
      return statusFilters.has(goalStatus)
    })
        
    // Then sort
    return filtered.sort((a, b) => {
      const dateA = a.target_date ? new Date(a.target_date).getTime() : (a.created_at ? new Date(a.created_at).getTime() : 0)
      const dateB = b.target_date ? new Date(b.target_date).getTime() : (b.created_at ? new Date(b.created_at).getTime() : 0)
      
      // Active goals first, then by date
      const statusA = a.status || 'active'
      const statusB = b.status || 'active'
      if (statusA === 'active' && statusB !== 'active') return -1
      if (statusA !== 'active' && statusB === 'active') return 1
      
      // Then by date (earliest first)
      if (dateA !== dateB) {
        return dateA - dateB
    }

      // Finally by title
      return (a.title || '').localeCompare(b.title || '')
    })
  }, [goals, statusFilters])

  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return null
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString(localeCode === 'cs' ? 'cs-CZ' : 'en-US', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
          })
    } catch {
      return null
    }
  }

  // Internal state for selected goal if not provided externally
  const [internalSelectedGoalId, setInternalSelectedGoalId] = useState<string | null>(null)
  const selectedGoalId = externalSelectedGoalId !== undefined ? externalSelectedGoalId : internalSelectedGoalId
  
  // Handle goal click - navigate to goal detail
  const handleGoalClick = (goalId: string) => {
    const newSelectedId = selectedGoalId === goalId ? null : goalId
    
    if (onSelectedGoalChange) {
      onSelectedGoalChange(newSelectedId)
    } else {
      setInternalSelectedGoalId(newSelectedId)
    }
    
    if (onGoalClick) {
      onGoalClick(goalId)
    }
  }
  
  // Find selected goal
  const selectedGoal = selectedGoalId ? goals.find(g => g.id === selectedGoalId) : null

  // Handle create goal
  const handleCreateGoal = () => {
    if (onCreateGoal) {
      onCreateGoal()
    }
  }

  return (
    <div className="w-full h-full flex flex-col bg-primary-50">
      {!hideHeader ? (
        <div className="flex flex-1 overflow-hidden min-h-0">
          {/* Left Panel - Filters and Add button - hidden on mobile */}
          <div className="hidden md:flex w-64 border-r-2 border-primary-500 bg-white flex flex-col h-full">
            {/* Filters at top */}
            <div className="p-4 border-b-2 border-primary-500 overflow-y-auto flex-shrink-0">
              <button
                onClick={() => {
                  if (onSelectedGoalChange) {
                    onSelectedGoalChange(null)
                  } else {
                    setInternalSelectedGoalId(null)
                  }
                }}
                className="text-sm font-bold text-black font-playful mb-4 hover:text-primary-600 transition-colors cursor-pointer text-left w-full"
              >
                {t('navigation.goals')}
              </button>
              <p className="text-xs text-gray-600 mb-4">
                {filteredAndSortedGoals.length} {filteredAndSortedGoals.length === 1 ? (localeCode === 'cs' ? 'cíl' : 'goal') : (localeCode === 'cs' ? 'cílů' : 'goals')}
              </p>
              
              {/* Status Filters - Vertical */}
              <div className="space-y-2 mb-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={statusFilters.has('active')}
                    onChange={() => handleStatusFilterToggle('active')}
                    className="w-4 h-4 text-primary-600 border-2 border-primary-500 rounded-playful-sm focus:ring-primary-500"
                  />
                  <span className="text-xs font-medium text-black font-playful flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-primary-600" />
                    {t('goals.status.active')}
                  </span>
                </label>
                
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={statusFilters.has('paused')}
                    onChange={() => handleStatusFilterToggle('paused')}
                    className="w-4 h-4 text-primary-600 border-2 border-primary-500 rounded-playful-sm focus:ring-primary-500"
                  />
                  <span className="text-xs font-medium text-black font-playful flex items-center gap-1.5">
                    <Moon className="w-3.5 h-3.5 text-primary-600" />
                    {t('goals.status.paused')}
                  </span>
                </label>
                
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={statusFilters.has('completed')}
                    onChange={() => handleStatusFilterToggle('completed')}
                    className="w-4 h-4 text-primary-600 border-2 border-primary-500 rounded-playful-sm focus:ring-primary-500"
                  />
                  <span className="text-xs font-medium text-black font-playful flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-primary-600" />
                    {t('goals.status.completed')}
                  </span>
                </label>
              </div>
            </div>
            
            {/* Divider */}
            <div className="border-t border-primary-500 flex-shrink-0" style={{ borderTopWidth: '0.4px' }}></div>
            
            {/* Goals list container */}
            <div className="flex-1 overflow-y-auto min-h-0 p-2">
              {/* Goals list */}
              <div className="space-y-1">
                {filteredAndSortedGoals.length === 0 ? (
                  <div className="p-4 text-xs text-gray-500 text-center">
                    {t('goals.noGoals') || 'Žádné cíle'}
                  </div>
                ) : (
                  filteredAndSortedGoals.map((goal: any) => {
                    const IconComponent = getIconComponent(goal.icon)
                    const isSelected = selectedGoalId === goal.id
                    const { progress } = calculateProgress(goal.id)
                    const progressPercentage = Math.round(progress)
                    return (
                      <button
                        key={goal.id}
                        onClick={() => handleGoalClick(goal.id)}
                        className={`w-full text-left px-3 py-2 rounded-playful-sm text-sm font-playful transition-colors flex items-center gap-2 border-2 ${
                          isSelected
                            ? 'bg-primary-50 border-primary-500 text-primary-600'
                            : 'bg-white text-black hover:bg-primary-50 border-transparent hover:border-primary-500'
                        }`}
                      >
                        <IconComponent className="w-4 h-4 flex-shrink-0" />
                        <span className="text-xs font-bold flex-shrink-0 min-w-[2.5rem] text-right text-primary-600">
                          {progressPercentage}%
                        </span>
                        <span className="truncate flex-1">{goal.title}</span>
                      </button>
                    )
                  })
                )}
              </div>
            </div>

            {/* Add button at bottom */}
            <div className="mt-auto p-4 border-t-2 border-primary-500 flex-shrink-0">
              <button
                onClick={handleCreateGoal}
                className="btn-playful-base w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-primary-600 bg-white hover:bg-primary-50"
              >
                <Plus className="w-5 h-5" />
                {t('goals.add')}
              </button>
            </div>
          </div>
          
          {/* Main Content */}
          <div className="flex-1 overflow-y-auto flex flex-col">
            {selectedGoal && selectedGoalId ? (
              <GoalDetailWrapper
                goal={selectedGoal}
                goalId={selectedGoalId}
                goals={goals}
                dailySteps={dailySteps}
                onGoalsUpdate={onGoalsUpdate}
                onSelectedGoalChange={() => {
                  if (onSelectedGoalChange) {
                    onSelectedGoalChange(null)
                  } else {
                    setInternalSelectedGoalId(null)
                  }
                }}
                areas={[]}
                onDailyStepsUpdate={onDailyStepsUpdate}
                player={player}
                userId={userId}
              />
            ) : (
              /* Goals Grid */
              <div className="flex-1 overflow-y-auto px-6 py-6">
        {filteredAndSortedGoals.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-16">
            <div className="box-playful-highlight-primary p-8 max-w-md">
              <Target className="w-16 h-16 text-primary-600 mb-4 mx-auto" />
              <h3 className="text-xl font-semibold text-black mb-2 font-playful">Žádné cíle</h3>
              <p className="text-gray-600 mb-6 font-playful">Začněte přidáním svého prvního cíle</p>
              <button
                onClick={handleCreateGoal}
                className="btn-playful-base flex items-center justify-center gap-2 px-6 py-3 text-primary-600 bg-white hover:bg-primary-50 mx-auto"
              >
                <Plus className="w-5 h-5" />
                {t('goals.add')}
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedGoals.map((goal) => {
              const { progress, completedSteps, totalSteps } = calculateProgress(goal.id)
              const IconComponent = getIconComponent(goal.icon)
              const statusConfig = {
                active: { label: t('goals.status.active'), icon: Target },
                paused: { label: t('goals.status.paused'), icon: Moon },
                completed: { label: t('goals.status.completed'), icon: CheckCircle }
              }
              // Normalize status - if status is null/undefined, treat as 'active'
              const goalStatus = goal.status || 'active'
              const status = statusConfig[goalStatus as keyof typeof statusConfig] || statusConfig.active

              // Determine styling based on status
              const isPaused = goalStatus === 'paused'
              const isCompleted = goalStatus === 'completed'
              
                return (
                <div
                  key={goal.id}
                  onClick={() => handleGoalClick(goal.id)}
                  className={`box-playful-highlight bg-white cursor-pointer overflow-hidden group transition-all ${
                    isPaused
                      ? 'opacity-60 hover:opacity-80'
                      : ''
                  }`}
                      >
                  {/* Goal Header */}
                  <div className={`p-5 border-b-2 ${
                    isPaused
                      ? 'border-gray-300'
                      : isCompleted
                      ? 'border-primary-500'
                      : 'border-primary-500'
                  }`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex-shrink-0">
                          <IconComponent className={`w-6 h-6 ${
                            isPaused
                              ? 'text-gray-400'
                              : isCompleted
                              ? 'text-primary-600'
                              : 'text-primary-600'
                          }`} />
                    </div>
                        <h3 className={`text-lg font-semibold truncate transition-colors font-playful ${
                          isPaused
                            ? 'text-gray-500'
                            : isCompleted
                            ? 'text-black group-hover:text-primary-600'
                            : 'text-black group-hover:text-primary-600'
                        }`}>
                          {goal.title}
                    </h3>
                          </div>
                      </div>
                    
                    {goal.description && (
                      <p className={`text-sm line-clamp-2 mb-3 font-playful ${
                        isPaused
                          ? 'text-gray-400'
                          : isCompleted
                          ? 'text-gray-600'
                          : 'text-gray-600'
                      }`}>
                        {goal.description}
                      </p>
                    )}

                    {/* Status Badge */}
                    <div className="flex items-center gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                          if (onGoalStatusClick) {
                            onGoalStatusClick(goal.id, e)
                          }
                                  }}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-playful-sm text-xs font-medium font-playful border-2 border-primary-500 ${
                          isPaused
                            ? 'bg-white text-gray-600'
                            : isCompleted
                            ? 'bg-primary-100 text-primary-600'
                            : 'bg-white text-primary-600'
                        } hover:bg-primary-50 transition-colors cursor-pointer`}
                                >
                        <status.icon className="w-3.5 h-3.5" />
                        {status.label}
                                </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                          if (onGoalDateClick) {
                            onGoalDateClick(goal.id, e)
                          }
                          }}
                        className={`text-xs flex items-center gap-1 hover:text-primary-600 transition-colors cursor-pointer font-playful ${
                          isPaused
                            ? 'text-gray-400'
                            : isCompleted
                            ? 'text-gray-600'
                            : goal.target_date
                            ? 'text-gray-600'
                            : 'text-gray-400 italic'
                        }`}
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        {goal.target_date ? formatDate(goal.target_date) : (t('goals.addDate') || 'Přidat datum')}
                        </button>
                      </div>
                    </div>

                  {/* Progress Section */}
                  <div className="p-5">
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-sm font-medium font-playful ${
                          isPaused
                            ? 'text-gray-400'
                            : isCompleted
                            ? 'text-gray-600'
                            : 'text-black'
                        }`}>
                          Pokrok
                        </span>
                        <span className={`text-sm font-semibold font-playful ${
                          isPaused
                            ? 'text-gray-500'
                            : isCompleted
                            ? 'text-primary-600'
                            : 'text-primary-600'
                        }`}>
                          {Math.round(progress)}%
                        </span>
          </div>
                      <div className={`w-full rounded-playful-sm h-2.5 overflow-hidden border-2 border-primary-500 ${
                        isPaused
                          ? 'bg-gray-200'
                          : isCompleted
                          ? 'bg-primary-100'
                          : 'bg-white'
                      }`}>
                        <div
                          className={`h-full transition-all duration-300 rounded-playful-sm ${
                            isPaused
                              ? 'bg-gray-400'
                              : isCompleted
                              ? 'bg-primary-500'
                              : 'bg-primary-500'
                    }`}
                          style={{ width: `${progress}%` }}
                  />
                </div>
                </div>

                    <div className={`flex items-center justify-between text-xs font-playful ${
                      isPaused
                        ? 'text-gray-400'
                        : isCompleted
                        ? 'text-gray-600'
                        : 'text-gray-600'
                    }`}>
                      <span>
                        {completedSteps} / {totalSteps} kroků
                    </span>
                      {goalStatus === 'active' && (
                    <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                            handleGoalClick(goal.id)
                                    }}
                          className="flex items-center gap-1 text-primary-600 hover:text-primary-700 font-medium transition-colors"
                                  >
                          Zobrazit
                          <ArrowRight className="w-3.5 h-3.5" />
                                  </button>
                            )}
                          </div>
                    </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
              </div>
            )}
          </div>
        </div>
      ) : (
          <div className="flex-1 overflow-y-auto px-6 py-6">
            {filteredAndSortedGoals.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-16">
                <div className="box-playful-highlight-primary p-8 max-w-md">
                  <Target className="w-16 h-16 text-primary-600 mb-4 mx-auto" />
                  <h3 className="text-xl font-semibold text-black mb-2 font-playful">Žádné cíle</h3>
                  <p className="text-gray-600 mb-6 font-playful">Začněte přidáním svého prvního cíle</p>
                  <button
                    onClick={handleCreateGoal}
                    className="btn-playful-base flex items-center justify-center gap-2 px-6 py-3 text-primary-600 bg-white hover:bg-primary-50 mx-auto"
                  >
                    <Plus className="w-5 h-5" />
                    {t('goals.add')}
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAndSortedGoals.map((goal) => {
                  const { progress, completedSteps, totalSteps } = calculateProgress(goal.id)
                  const IconComponent = getIconComponent(goal.icon)
                  const statusConfig = {
                    active: { label: t('goals.status.active'), icon: Target },
                    paused: { label: t('goals.status.paused'), icon: Moon },
                    completed: { label: t('goals.status.completed'), icon: CheckCircle }
                  }
                  const goalStatus = goal.status || 'active'
                  const status = statusConfig[goalStatus as keyof typeof statusConfig] || statusConfig.active
                  const isPaused = goalStatus === 'paused'
                  const isCompleted = goalStatus === 'completed'
                  
                  return (
                    <div
                      key={goal.id}
                      onClick={() => handleGoalClick(goal.id)}
                      className={`box-playful-highlight bg-white cursor-pointer overflow-hidden group transition-all ${
                        isPaused ? 'opacity-60 hover:opacity-80' : ''
                      }`}
                    >
                      {/* Goal content - same as above but simplified for hideHeader case */}
                      <div className={`p-5 border-b-2 ${
                        isPaused ? 'border-gray-300' : 'border-primary-500'
                      }`}>
                        <div className="flex items-center gap-3 mb-3">
                          <IconComponent className={`w-6 h-6 ${
                            isPaused ? 'text-gray-400' : 'text-primary-600'
                          }`} />
                          <h3 className={`text-lg font-semibold font-playful ${
                            isPaused ? 'text-gray-500' : 'text-black'
                          }`}>
                            {goal.title}
                          </h3>
                        </div>
                        {goal.description && (
                          <p className={`text-sm line-clamp-2 mb-3 font-playful ${
                            isPaused ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            {goal.description}
                          </p>
                        )}
                      </div>
                      <div className="p-5">
                        <div className="mb-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className={`text-sm font-medium font-playful ${
                              isPaused ? 'text-gray-400' : 'text-black'
                            }`}>
                              Pokrok
                            </span>
                            <span className={`text-sm font-semibold font-playful ${
                              isPaused ? 'text-gray-500' : 'text-primary-600'
                            }`}>
                              {Math.round(progress)}%
                            </span>
                          </div>
                          <div className={`w-full rounded-playful-sm h-2.5 overflow-hidden border-2 border-primary-500 ${
                            isPaused ? 'bg-gray-200' : 'bg-white'
                          }`}>
                            <div
                              className={`h-full transition-all duration-300 rounded-playful-sm ${
                                isPaused ? 'bg-gray-400' : 'bg-primary-500'
                              }`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                        <div className={`text-xs font-playful ${
                          isPaused ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {completedSteps} / {totalSteps} kroků
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
    </div>
  )
}

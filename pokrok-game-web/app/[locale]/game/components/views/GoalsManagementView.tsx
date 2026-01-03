'use client'

import { useState, useMemo, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useTranslations, useLocale } from 'next-intl'
import { getLocalDateString } from '../../../main/components/utils/dateHelpers'
import { Plus, Target, Calendar, CheckCircle, Moon, ArrowRight } from 'lucide-react'
import { getIconComponent } from '@/lib/icon-utils'

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
  hideHeader = false
}: GoalsManagementViewProps) {
  const t = useTranslations()
  const localeCode = useLocale()
  
  // Status filters - defaultně pouze 'active' zaškrtnutý
  const [statusFilters, setStatusFilters] = useState<Set<string>>(new Set(['active']))

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
    if (dailySteps.length > 0) {
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
      setGoalStepsCache(prev => {
        const updated = { ...prev }
        Object.keys(stepsByGoal).forEach(goalId => {
          updated[goalId] = stepsByGoal[goalId]
        })
        return updated
      })
    }
  }, [dailySteps])

  // Calculate progress for a goal
  const calculateProgress = (goalId: string) => {
    const steps = goalStepsCache[goalId] || []
    const totalSteps = steps.length
    const completedSteps = steps.filter(s => s.completed).length
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
  
  // Handle status filter toggle
  const handleStatusFilterToggle = (status: string) => {
    setStatusFilters(prev => {
      const newSet = new Set(prev)
      if (newSet.has(status)) {
        newSet.delete(status)
      } else {
        newSet.add(status)
      }
      return newSet
    })
  }

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

  // Handle goal click - navigate to goal detail
  const handleGoalClick = (goalId: string) => {
    if (onGoalClick) {
      onGoalClick(goalId)
    }
  }

  // Handle create goal
  const handleCreateGoal = () => {
    if (onCreateGoal) {
      onCreateGoal()
    }
  }

  return (
    <div className="w-full h-full flex flex-col bg-primary-50">
      {!hideHeader && (
        <>
          {/* Header */}
          <div className="bg-white border-b-2 border-primary-500 px-6 py-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-black font-playful">{t('navigation.goals')}</h1>
                <p className="text-sm text-gray-600 mt-1 font-playful">
                  {filteredAndSortedGoals.length} {filteredAndSortedGoals.length === 1 ? (localeCode === 'cs' ? 'cíl' : 'goal') : (localeCode === 'cs' ? 'cílů' : 'goals')}
                </p>
            </div>
            <button
                onClick={handleCreateGoal}
                className="btn-playful-base flex items-center gap-2 px-4 py-2.5 text-primary-600 bg-white hover:bg-primary-50"
            >
                <Plus className="w-5 h-5" />
              {t('goals.add')}
            </button>
          </div>
          
            {/* Status Filters */}
            <div className="flex items-center gap-4 mt-4 px-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={statusFilters.has('active')}
                  onChange={() => handleStatusFilterToggle('active')}
                  className="w-5 h-5 text-primary-600 border-2 border-primary-500 rounded-playful-sm focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-black font-playful flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-primary-600" />
                  {t('goals.status.active')}
                            </span>
              </label>
              
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={statusFilters.has('paused')}
                  onChange={() => handleStatusFilterToggle('paused')}
                  className="w-5 h-5 text-primary-600 border-2 border-primary-500 rounded-playful-sm focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-black font-playful flex items-center gap-1.5">
                  <Moon className="w-4 h-4 text-primary-600" />
                  {t('goals.status.paused')}
                                  </span>
              </label>
              
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={statusFilters.has('completed')}
                  onChange={() => handleStatusFilterToggle('completed')}
                  className="w-5 h-5 text-primary-600 border-2 border-primary-500 rounded-playful-sm focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-black font-playful flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-primary-600" />
                            {t('goals.status.completed')}
                </span>
              </label>
            </div>
          </div>
          </>
        )}

      {/* Goals Grid */}
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
    </div>
  )
}

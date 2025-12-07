'use client'

import { useState, useMemo, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useTranslations, useLocale } from 'next-intl'
import { getLocalDateString } from '../utils/dateHelpers'
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
    const filtered = goals.filter(goal => statusFilters.has(goal.status))
        
    // Then sort
    return filtered.sort((a, b) => {
      const dateA = a.target_date ? new Date(a.target_date).getTime() : (a.created_at ? new Date(a.created_at).getTime() : 0)
      const dateB = b.target_date ? new Date(b.target_date).getTime() : (b.created_at ? new Date(b.created_at).getTime() : 0)
      
      // Active goals first, then by date
      if (a.status === 'active' && b.status !== 'active') return -1
      if (a.status !== 'active' && b.status === 'active') return 1
      
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
    <div className="w-full h-full flex flex-col bg-orange-50">
      {!hideHeader && (
        <>
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{t('navigation.goals')}</h1>
                <p className="text-sm text-gray-600 mt-1">
                  {filteredAndSortedGoals.length} {filteredAndSortedGoals.length === 1 ? (localeCode === 'cs' ? 'cíl' : 'goal') : (localeCode === 'cs' ? 'cílů' : 'goals')}
                </p>
            </div>
            <button
                onClick={handleCreateGoal}
                className="flex items-center gap-2 px-4 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium shadow-sm"
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
                  className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                />
                <span className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-green-600" />
                  {t('goals.status.active')}
                            </span>
              </label>
              
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={statusFilters.has('paused')}
                  onChange={() => handleStatusFilterToggle('paused')}
                  className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                />
                <span className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                  <Moon className="w-4 h-4 text-yellow-600" />
                  {t('goals.status.paused')}
                                  </span>
              </label>
              
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={statusFilters.has('completed')}
                  onChange={() => handleStatusFilterToggle('completed')}
                  className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                />
                <span className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-blue-600" />
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
            <Target className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Žádné cíle</h3>
            <p className="text-gray-500 mb-6">Začněte přidáním svého prvního cíle</p>
                      <button
              onClick={handleCreateGoal}
              className="flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
            >
              <Plus className="w-5 h-5" />
              {t('goals.add')}
                      </button>
                    </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedGoals.map((goal) => {
              const { progress, completedSteps, totalSteps } = calculateProgress(goal.id)
              const IconComponent = getIconComponent(goal.icon)
              const statusConfig = {
                active: { label: t('goals.status.active'), color: 'bg-green-100 text-green-700', icon: Target },
                paused: { label: t('goals.status.paused'), color: 'bg-yellow-100 text-yellow-700', icon: Moon },
                completed: { label: t('goals.status.completed'), color: 'bg-blue-100 text-blue-700', icon: CheckCircle }
              }
              const status = statusConfig[goal.status as keyof typeof statusConfig] || statusConfig.active

              // Determine styling based on status
              const isPaused = goal.status === 'paused'
              const isCompleted = goal.status === 'completed'
              
                return (
                <div
                  key={goal.id}
                  onClick={() => handleGoalClick(goal.id)}
                  className={`rounded-xl shadow-sm border transition-all duration-200 cursor-pointer overflow-hidden group ${
                    isPaused
                      ? 'bg-gray-50 border-gray-300 opacity-60 hover:opacity-80'
                      : isCompleted
                      ? 'bg-green-50 border-green-200 hover:shadow-md'
                      : 'bg-white border-gray-200 hover:shadow-md'
                        }`}
                      >
                  {/* Goal Header */}
                  <div className={`p-5 border-b ${
                    isPaused
                      ? 'border-gray-200'
                      : isCompleted
                      ? 'border-green-200'
                      : 'border-gray-100'
                  }`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex-shrink-0">
                          <IconComponent className={`w-6 h-6 ${
                            isPaused
                              ? 'text-gray-400'
                              : isCompleted
                              ? 'text-green-600'
                              : 'text-orange-600'
                          }`} />
                    </div>
                        <h3 className={`text-lg font-semibold truncate transition-colors ${
                          isPaused
                            ? 'text-gray-500'
                            : isCompleted
                            ? 'text-green-800 group-hover:text-green-900'
                            : 'text-gray-900 group-hover:text-orange-600'
                        }`}>
                          {goal.title}
                    </h3>
                          </div>
                      </div>
                    
                    {goal.description && (
                      <p className={`text-sm line-clamp-2 mb-3 ${
                        isPaused
                          ? 'text-gray-400'
                          : isCompleted
                          ? 'text-green-700'
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
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${status.color} hover:opacity-80 transition-opacity cursor-pointer`}
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
                        className={`text-xs flex items-center gap-1 hover:opacity-80 transition-opacity cursor-pointer ${
                          isPaused
                            ? 'text-gray-400'
                            : isCompleted
                            ? 'text-green-700'
                            : goal.target_date
                            ? 'text-gray-500'
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
                        <span className={`text-sm font-medium ${
                          isPaused
                            ? 'text-gray-400'
                            : isCompleted
                            ? 'text-green-700'
                            : 'text-gray-700'
                        }`}>
                          Pokrok
                        </span>
                        <span className={`text-sm font-semibold ${
                          isPaused
                            ? 'text-gray-500'
                            : isCompleted
                            ? 'text-green-800'
                            : 'text-gray-900'
                        }`}>
                          {Math.round(progress)}%
                        </span>
          </div>
                      <div className={`w-full rounded-full h-2.5 overflow-hidden ${
                        isPaused
                          ? 'bg-gray-300'
                          : isCompleted
                          ? 'bg-green-200'
                          : 'bg-gray-200'
                      }`}>
                        <div
                          className={`h-full transition-all duration-300 rounded-full ${
                            isPaused
                              ? 'bg-gray-400'
                              : isCompleted
                              ? 'bg-green-600'
                              : 'bg-orange-600'
                    }`}
                          style={{ width: `${progress}%` }}
                  />
                </div>
                </div>

                    <div className={`flex items-center justify-between text-xs ${
                      isPaused
                        ? 'text-gray-400'
                        : isCompleted
                        ? 'text-green-700'
                        : 'text-gray-600'
                    }`}>
                      <span>
                        {completedSteps} / {totalSteps} kroků
                    </span>
                      {goal.status === 'active' && (
                    <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                            handleGoalClick(goal.id)
                                    }}
                          className="flex items-center gap-1 text-orange-600 hover:text-orange-700 font-medium transition-colors"
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

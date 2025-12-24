'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { ImportantStepsPlanningView } from '../workflows/ImportantStepsPlanningView'
import { CheckCircle, Target, ListTodo, Calendar, Loader2 } from 'lucide-react'
import { getLocalDateString } from '../utils/dateHelpers'

interface DailyStep {
  id: string
  title: string
  description?: string
  date: string
  completed: boolean
  goal_id?: string
  planning_id?: string
  order_index?: number
  checklist?: Array<{ id: string; title: string; completed: boolean }>
}

interface PlanningData {
  important_steps: DailyStep[]
  other_steps: DailyStep[]
  backlog_steps: DailyStep[]
  available_steps: DailyStep[]
  settings: {
    important_steps_count: number
  }
  date: string
}

interface OnlyTheImportantViewProps {
  userId: string
  goals: any[]
  habits: any[]
  dailySteps: any[]
  handleStepToggle: (stepId: string) => Promise<void>
  handleHabitToggle: (habitId: string) => Promise<void>
  handleItemClick: (item: any, type: string) => void
  loadingSteps: Set<string>
  animatingSteps: Set<string>
  player: any
  onDailyStepsUpdate?: (steps: any[]) => void
  onOpenStepModal?: (step?: any, goalId?: string) => void
  setMainPanelSection?: (section: string) => void
}

export function OnlyTheImportantView({
  userId,
  goals,
  habits,
  dailySteps,
  handleStepToggle,
  handleHabitToggle,
  handleItemClick,
  loadingSteps,
  animatingSteps,
  player,
  onDailyStepsUpdate,
  onOpenStepModal,
  setMainPanelSection
}: OnlyTheImportantViewProps) {
  const t = useTranslations()
  
  const [needsPlanning, setNeedsPlanning] = useState<boolean | null>(null)
  const [planningData, setPlanningData] = useState<PlanningData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showPlanningForTomorrow, setShowPlanningForTomorrow] = useState(false)
  const [tomorrowDate, setTomorrowDate] = useState<string>('')
  const [checklistUpdating, setChecklistUpdating] = useState<Set<string>>(new Set()) // Track which checklist items are being updated
  const [localSteps, setLocalSteps] = useState<any[]>(dailySteps) // Local copy for immediate updates
  const dailyStepsRef = useRef<string>('') // Track dailySteps serialized to detect changes
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set()) // Track recently completed steps for animation

  useEffect(() => {
    checkPlanningStatus()
  }, [userId])

  useEffect(() => {
    if (!needsPlanning && !planningData && !loading) {
      loadPlanningData()
    }
  }, [needsPlanning, userId, loading])

  // Sync localSteps with dailySteps prop when it changes from parent
  // Use serialization to detect deep changes in the array
  useEffect(() => {
    const serialized = JSON.stringify(dailySteps)
    if (serialized !== dailyStepsRef.current) {
      dailyStepsRef.current = serialized
      setLocalSteps(dailySteps)
    }
  }, [dailySteps])

  const checkPlanningStatus = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/workflows/only-the-important/check')
      if (response.ok) {
        const data = await response.json()
        setNeedsPlanning(data.needs_planning || false)
        if (!data.needs_planning) {
          // Load planning data if planning exists
          await loadPlanningData()
        }
      } else {
        setNeedsPlanning(false)
      }
    } catch (error) {
      console.error('Error checking planning status:', error)
      setNeedsPlanning(false)
    } finally {
      setLoading(false)
    }
  }

  const loadPlanningData = async () => {
    try {
      // Use getLocalDateString to avoid timezone issues
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayStr = getLocalDateString(today)
      
      const response = await fetch(`/api/workflows/only-the-important/planning?date=${todayStr}`)
      if (response.ok) {
        const data = await response.json()
        setPlanningData(data)
      }
    } catch (error) {
      console.error('Error loading planning data:', error)
    }
  }

  const handlePlanningComplete = async () => {
    // First, reload planning status to check if planning is now complete
    await checkPlanningStatus()
    // Then load planning data to show the daily view
    await loadPlanningData()
    // Update daily steps
    if (onDailyStepsUpdate) {
      const stepsResponse = await fetch('/api/daily-steps')
      if (stepsResponse.ok) {
        const steps = await stepsResponse.json()
        onDailyStepsUpdate(steps)
      }
    }
    // Explicitly set needsPlanning to false since we just completed planning
    setNeedsPlanning(false)
    // Navigate to the Only the important view after completing planning
    if (setMainPanelSection) {
      setMainPanelSection('focus-only_the_important')
      // Also save to localStorage for persistence
      if (typeof window !== 'undefined') {
        localStorage.setItem('journeyGame_mainPanelSection', 'focus-only_the_important')
      }
    }
  }

  const handleStepToggleWithUpdate = async (stepId: string) => {
    const step = localSteps.find((s: any) => s.id === stepId)
    if (!step) {
      console.error('Step not found:', stepId)
      return
    }

    const wasCompleted = step.completed
    const newCompleted = !wasCompleted

    // Optimistic update - update local state immediately
    setLocalSteps(prevSteps => 
      prevSteps.map((s: any) => 
        s.id === stepId 
          ? { ...s, completed: newCompleted }
          : s
      )
    )

    // If step is being completed, add to completedSteps for animation
    if (newCompleted && !wasCompleted) {
      setCompletedSteps(prev => new Set(prev).add(stepId))
      // Remove from completedSteps after animation completes
      setTimeout(() => {
        setCompletedSteps(prev => {
          const newSet = new Set(prev)
          newSet.delete(stepId)
          return newSet
        })
      }, 500) // Animation duration
    }

    try {
      // Call API directly to update step completion
      const response = await fetch('/api/daily-steps', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stepId: stepId,
          completed: newCompleted,
          completedAt: newCompleted ? new Date().toISOString() : null
        }),
      })

      if (response.ok) {
        const responseData = await response.json()
        const updatedStep = responseData.step || responseData
        
        // Update localSteps with the updated step from server
        setLocalSteps(prevSteps => 
          prevSteps.map((s: any) => 
            s.id === stepId ? { 
              ...s, 
              ...updatedStep, 
              completed: updatedStep.completed !== undefined ? updatedStep.completed : newCompleted,
              checklist: updatedStep.checklist || s.checklist
            } : s
          )
        )
        
        // Update parent's dailySteps
        if (onDailyStepsUpdate) {
          const stepsResponse = await fetch('/api/daily-steps')
          if (stepsResponse.ok) {
            const steps = await stepsResponse.json()
            setLocalSteps(steps)
            onDailyStepsUpdate(steps)
          }
        }
        
        // Also call handleStepToggle to update parent's state (for consistency)
        // This ensures the parent component is aware of the change
        try {
          await handleStepToggle(stepId)
        } catch (toggleError) {
          console.warn('handleStepToggle failed, but step was already updated:', toggleError)
        }
      } else {
        const errorText = await response.text()
        console.error('Failed to update step:', response.status, errorText)
        // Revert optimistic update on error
        setLocalSteps(prevSteps => 
          prevSteps.map((s: any) => 
            s.id === stepId ? { ...s, completed: wasCompleted } : s
          )
        )
        if (onDailyStepsUpdate) {
          const stepsResponse = await fetch('/api/daily-steps')
          if (stepsResponse.ok) {
            const steps = await stepsResponse.json()
            setLocalSteps(steps)
            onDailyStepsUpdate(steps)
          }
        }
      }
    } catch (error) {
      console.error('Error toggling step:', error)
      // Revert optimistic update on error
      setLocalSteps(prevSteps => 
        prevSteps.map((s: any) => 
          s.id === stepId ? { ...s, completed: wasCompleted } : s
        )
      )
      if (onDailyStepsUpdate) {
        const stepsResponse = await fetch('/api/daily-steps')
        if (stepsResponse.ok) {
          const steps = await stepsResponse.json()
          setLocalSteps(steps)
          onDailyStepsUpdate(steps)
        }
      }
    }
  }

  const handleChecklistItemToggle = async (stepId: string, checklistIndex: number) => {
    const step = localSteps.find((s: any) => s.id === stepId)
    if (!step) {
      console.error('Step not found:', stepId)
      return
    }
    
    if (!step.checklist || step.checklist.length <= checklistIndex) {
      console.error('Checklist item not found:', { stepId, checklistIndex, checklistLength: step.checklist?.length })
      return
    }

    const checklistItemKey = `${stepId}-${checklistIndex}`
    setChecklistUpdating(prev => new Set(prev).add(checklistItemKey))

    // Optimistic update - update local state immediately
    const updatedChecklist = [...step.checklist]
    updatedChecklist[checklistIndex] = {
      ...updatedChecklist[checklistIndex],
      completed: !updatedChecklist[checklistIndex].completed
    }

    // Update localSteps immediately for instant UI feedback
    setLocalSteps(prevSteps => 
      prevSteps.map((s: any) => 
        s.id === stepId 
          ? { ...s, checklist: updatedChecklist }
          : s
      )
    )
    
    // Also update parent's dailySteps
    if (onDailyStepsUpdate) {
      const updatedSteps = localSteps.map((s: any) => 
        s.id === stepId 
          ? { ...s, checklist: updatedChecklist }
          : s
      )
      onDailyStepsUpdate(updatedSteps)
    }

    try {
      const response = await fetch('/api/daily-steps', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stepId,
          checklist: updatedChecklist
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Error updating checklist:', response.status, errorText)
        // Revert optimistic update on error
        setLocalSteps(prevSteps => 
          prevSteps.map((s: any) => 
            s.id === stepId ? { ...s, checklist: step.checklist } : s
          )
        )
        if (onDailyStepsUpdate) {
          const stepsResponse = await fetch('/api/daily-steps')
          if (stepsResponse.ok) {
            const steps = await stepsResponse.json()
            setLocalSteps(steps)
            onDailyStepsUpdate(steps)
          }
        }
        return
      }

      const responseData = await response.json()
      const updatedStep = responseData.step || responseData
      
      // Update localSteps with the updated step from server
      setLocalSteps(prevSteps => 
        prevSteps.map((s: any) => 
          s.id === stepId ? { ...s, checklist: updatedStep.checklist || updatedChecklist } : s
        )
      )

      // Final update from server to ensure consistency
      if (onDailyStepsUpdate) {
        const stepsResponse = await fetch('/api/daily-steps')
        if (stepsResponse.ok) {
          const steps = await stepsResponse.json()
          setLocalSteps(steps)
          onDailyStepsUpdate(steps)
        } else {
          console.error('Error fetching updated steps')
        }
      }
    } catch (error) {
      console.error('Error toggling checklist item:', error)
      // Revert optimistic update on error
      if (onDailyStepsUpdate) {
        const stepsResponse = await fetch('/api/daily-steps')
        if (stepsResponse.ok) {
          const steps = await stepsResponse.json()
          onDailyStepsUpdate(steps)
        }
      }
    } finally {
      setChecklistUpdating(prev => {
        const newSet = new Set(prev)
        newSet.delete(checklistItemKey)
        return newSet
      })
    }
  }

  const handlePlanForTomorrow = () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)
    // Use getLocalDateString to avoid timezone issues
    const tomorrowStr = getLocalDateString(tomorrow)
    console.log('handlePlanForTomorrow: Calculated tomorrow date:', tomorrowStr, 'from Date:', tomorrow)
    // Set both state values together to ensure they update atomically
    setTomorrowDate(tomorrowStr)
    setShowPlanningForTomorrow(true)
  }

  const handleTomorrowPlanningComplete = async () => {
    setShowPlanningForTomorrow(false)
    await loadPlanningData()
  }

  // Show daily view with important steps, other steps, and backlog
  // Merge planning data with current localSteps (local copy for immediate updates) to get up-to-date completed status and checklist
  // Use useMemo to recalculate when localSteps or planningData changes
  // IMPORTANT: These hooks must be called before any conditional returns to follow Rules of Hooks
  const importantSteps = useMemo(() => {
    if (!planningData) return []
    return (planningData.important_steps || []).map(planStep => {
      const currentStep = localSteps.find((s: any) => s.id === planStep.id)
      return currentStep 
        ? { ...planStep, completed: currentStep.completed, checklist: currentStep.checklist || [] }
        : { ...planStep, checklist: planStep.checklist || [] }
    })
  }, [planningData, localSteps])
  
  const otherSteps = useMemo(() => {
    if (!planningData) return []
    return (planningData.other_steps || []).map(planStep => {
      const currentStep = localSteps.find((s: any) => s.id === planStep.id)
      return currentStep 
        ? { ...planStep, completed: currentStep.completed, checklist: currentStep.checklist || [] }
        : { ...planStep, checklist: planStep.checklist || [] }
    })
  }, [planningData, localSteps])
  
  const backlogSteps = useMemo(() => {
    if (!planningData) return []
    return (planningData.backlog_steps || []).map(planStep => {
      const currentStep = localSteps.find((s: any) => s.id === planStep.id)
      return currentStep 
        ? { ...planStep, completed: currentStep.completed, checklist: currentStep.checklist || [] }
        : { ...planStep, checklist: planStep.checklist || [] }
    })
  }, [planningData, localSteps])

  // Check if all important steps are completed
  const allImportantCompleted = useMemo(() => {
    return importantSteps.length > 0 && importantSteps.every(step => step.completed)
  }, [importantSteps])
  
  // Check if all other steps are completed
  const allOtherCompleted = useMemo(() => {
    return otherSteps.length > 0 && otherSteps.every(step => step.completed)
  }, [otherSteps])
  
  // Check if all steps (important + other) are completed
  const allStepsCompleted = useMemo(() => {
    return allImportantCompleted && 
      (otherSteps.length === 0 || allOtherCompleted)
  }, [allImportantCompleted, allOtherCompleted, otherSteps.length])

  if (loading) {
    return (
      <div className="w-full min-h-full flex items-center justify-center bg-primary-50">
        <div className="text-center">
          <p className="text-gray-500 font-playful">{t('common.loading')}</p>
        </div>
      </div>
    )
  }

  // If planning is needed, show planning view
  if (needsPlanning || showPlanningForTomorrow) {
    // Calculate tomorrow date if needed - always calculate fresh for tomorrow planning
    let planningDate: string | undefined = undefined
    if (showPlanningForTomorrow) {
      // Always calculate tomorrow date fresh when planning for tomorrow
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(0, 0, 0, 0)
      // Use getLocalDateString to avoid timezone issues
      planningDate = getLocalDateString(tomorrow)
      console.log('OnlyTheImportantView: Planning for tomorrow, date:', planningDate, 'showPlanningForTomorrow:', showPlanningForTomorrow)
    } else {
      console.log('OnlyTheImportantView: Planning for today, needsPlanning:', needsPlanning)
    }
    
    return (
      <div className="w-full flex flex-col bg-primary-50" style={{ height: '100%' }}>
        <div className="flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
          <ImportantStepsPlanningView
            key={`planning-${planningDate || 'today'}`} // Force re-render when date changes
            userId={userId}
            date={planningDate}
            onComplete={showPlanningForTomorrow ? handleTomorrowPlanningComplete : handlePlanningComplete}
            onOpenStepModal={onOpenStepModal}
          />
        </div>
      </div>
    )
  }

  // If no planning data, show planning view
  if (!planningData) {
    return (
      <div className="w-full flex flex-col bg-primary-50" style={{ height: '100%' }}>
        <div className="flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
          <ImportantStepsPlanningView
            userId={userId}
            onComplete={handlePlanningComplete}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="w-full flex flex-col bg-primary-50" style={{ height: '100%' }}>
      <div className="flex-1 overflow-y-auto p-6" style={{ minHeight: 0 }}>
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Habits section */}
          <div className="bg-white border-2 border-primary-500 rounded-playful-md p-4">
            <h2 className="text-lg font-bold font-playful mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-primary-600" />
              {t('habits.title') || 'Návyky'}
            </h2>
            <div className="space-y-2">
              {habits.filter((h: any) => {
                // Show habits that are due today
                const today = new Date()
                today.setHours(0, 0, 0, 0)
                const todayStr = today.toISOString().split('T')[0]
                // Simple check - show all active habits for now
                return h.status === 'active'
              }).map((habit: any) => {
                const isCompleted = habit.habit_completions?.[todayStr] === true
                const isLoading = loadingSteps.has(habit.id)
                
                return (
                  <div
                    key={habit.id}
                    className={`flex items-center gap-3 p-3 rounded-playful-sm border-2 ${
                      isCompleted ? 'bg-green-50 border-green-300' : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <button
                      onClick={() => handleHabitToggle(habit.id)}
                      disabled={isLoading}
                      className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        isCompleted
                          ? 'bg-green-500 border-green-600'
                          : 'bg-white border-gray-300 hover:border-primary-500'
                      } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      {isCompleted && <CheckCircle className="w-4 h-4 text-white" />}
                    </button>
                    <span
                      onClick={() => handleItemClick(habit, 'habit')}
                      className={`flex-1 font-playful cursor-pointer hover:text-primary-600 ${
                        isCompleted ? 'line-through text-gray-500' : 'text-gray-900'
                      }`}
                    >
                      {habit.name}
                    </span>
                  </div>
                )
              })}
              {habits.filter((h: any) => h.status === 'active').length === 0 && (
                <p className="text-sm text-gray-500 font-playful">{t('habits.noHabits') || 'Žádné návyky'}</p>
              )}
            </div>
          </div>

          {/* Important steps - hide when all are completed */}
          {importantSteps.length > 0 && !allImportantCompleted && (
            <div className="bg-white border-2 border-primary-500 rounded-playful-md p-4">
              <h2 className="text-lg font-bold font-playful mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-primary-600" />
                {t('workflows.onlyTheImportant.planning.importantSteps') || 'Důležité kroky'}
              </h2>
              <div className="space-y-2">
                {importantSteps.map((step) => {
                  const isLoading = loadingSteps.has(step.id)
                  const isAnimating = animatingSteps.has(step.id)
                  
                  return (
                    <div
                      key={step.id}
                      className={`p-3 rounded-playful-sm border-2 transition-all duration-500 ${
                        step.completed
                          ? 'bg-primary-50 border-primary-300'
                          : 'bg-orange-50 border-orange-300'
                      } ${isAnimating ? 'animate-pulse' : ''} ${
                        completedSteps.has(step.id) ? 'opacity-0 transform scale-95 -translate-y-2' : 'opacity-100 transform scale-100'
                      }`}
                    >
                      {/* Title with checkbox */}
                      <div className="flex items-center gap-2 mb-1">
                        <button
                          onClick={() => handleStepToggleWithUpdate(step.id)}
                          disabled={isLoading}
                          className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                            step.completed
                              ? 'bg-primary-500 border-primary-600'
                              : 'bg-white border-orange-500 hover:border-orange-600'
                          } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                          {step.completed && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                        </button>
                        <span
                          onClick={() => handleItemClick(step, 'step')}
                          className={`font-playful font-bold cursor-pointer hover:text-primary-600 flex-1 ${
                            step.completed ? 'line-through text-gray-500' : 'text-gray-900'
                          }`}
                        >
                          {step.title}
                        </span>
                      </div>
                      {/* Description */}
                      {step.description && (
                        <p
                          onClick={() => handleItemClick(step, 'step')}
                          className="text-sm text-gray-600 mt-1 mb-2 cursor-pointer hover:text-primary-600"
                        >
                          {step.description}
                        </p>
                      )}
                      {/* Checklist items */}
                      {step.checklist && step.checklist.length > 0 && (
                        <div className="mt-2 space-y-1.5 ml-7">
                          {step.checklist.map((item: any, itemIndex: number) => {
                            const checklistItemKey = `${step.id}-${itemIndex}`
                            const isUpdating = checklistUpdating.has(checklistItemKey)
                            
                            return (
                              <div
                                key={item.id || itemIndex}
                                className="flex items-center gap-2"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  if (!isUpdating) {
                                    handleChecklistItemToggle(step.id, itemIndex)
                                  }
                                }}
                              >
                                <button
                                  disabled={isUpdating}
                                  className={`flex-shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                                    item.completed
                                      ? 'bg-primary-500 border-primary-600'
                                      : 'bg-white border-gray-300 hover:border-primary-500'
                                  } ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    if (!isUpdating) {
                                      handleChecklistItemToggle(step.id, itemIndex)
                                    }
                                  }}
                                >
                                  {isUpdating ? (
                                    <Loader2 className="w-3 h-3 text-gray-400 animate-spin" />
                                  ) : item.completed ? (
                                    <CheckCircle className="w-3 h-3 text-white" />
                                  ) : null}
                                </button>
                                <span className={`text-sm font-playful ${item.completed ? 'line-through text-gray-500' : 'text-gray-700'}`}>
                                  {item.title}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Other steps - only show after important steps are completed, hide when all are completed */}
          {allImportantCompleted && otherSteps.length > 0 && !allOtherCompleted && (
            <div className="bg-white border-2 border-primary-500 rounded-playful-md p-4">
              <h2 className="text-lg font-bold font-playful mb-4 flex items-center gap-2">
                <ListTodo className="w-5 h-5 text-primary-600" />
                {t('workflows.onlyTheImportant.planning.otherSteps') || 'Ostatní kroky'}
              </h2>
              <div className="space-y-2">
                {otherSteps.map((step) => {
                  const isLoading = loadingSteps.has(step.id)
                  const isAnimating = animatingSteps.has(step.id)
                  const isCompleting = completedSteps.has(step.id)
                  
                  return (
                    <div
                      key={step.id}
                      className={`p-3 rounded-playful-sm border-2 transition-all duration-500 ${
                        step.completed
                          ? 'bg-primary-50 border-primary-300'
                          : 'bg-gray-50 border-gray-200'
                      } ${isAnimating ? 'animate-pulse' : ''} ${
                        isCompleting ? 'opacity-0 transform scale-95 -translate-y-2' : 'opacity-100 transform scale-100'
                      }`}
                    >
                      {/* Title with checkbox */}
                      <div className="flex items-center gap-2 mb-1">
                        <button
                          onClick={() => handleStepToggleWithUpdate(step.id)}
                          disabled={isLoading}
                          className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                            step.completed
                              ? 'bg-primary-500 border-primary-600'
                              : 'bg-white border-gray-300 hover:border-primary-500'
                          } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                          {step.completed && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                        </button>
                        <span
                          onClick={() => handleItemClick(step, 'step')}
                          className={`font-playful font-bold cursor-pointer hover:text-primary-600 flex-1 ${
                            step.completed ? 'line-through text-gray-500' : 'text-gray-900'
                          }`}
                        >
                          {step.title}
                        </span>
                      </div>
                      {/* Description */}
                      {step.description && (
                        <p
                          onClick={() => handleItemClick(step, 'step')}
                          className="text-sm text-gray-600 mt-1 mb-2 cursor-pointer hover:text-primary-600"
                        >
                          {step.description}
                        </p>
                      )}
                      {/* Checklist items */}
                      {step.checklist && step.checklist.length > 0 && (
                        <div className="mt-2 space-y-1.5 ml-7">
                          {step.checklist.map((item: any, itemIndex: number) => {
                            const checklistItemKey = `${step.id}-${itemIndex}`
                            const isUpdating = checklistUpdating.has(checklistItemKey)
                            
                            return (
                              <div
                                key={item.id || itemIndex}
                                className="flex items-center gap-2"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  if (!isUpdating) {
                                    handleChecklistItemToggle(step.id, itemIndex)
                                  }
                                }}
                              >
                                <button
                                  disabled={isUpdating}
                                  className={`flex-shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                                    item.completed
                                      ? 'bg-primary-500 border-primary-600'
                                      : 'bg-white border-gray-300 hover:border-primary-500'
                                  } ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    if (!isUpdating) {
                                      handleChecklistItemToggle(step.id, itemIndex)
                                    }
                                  }}
                                >
                                  {isUpdating ? (
                                    <Loader2 className="w-3 h-3 text-gray-400 animate-spin" />
                                  ) : item.completed ? (
                                    <CheckCircle className="w-3 h-3 text-white" />
                                  ) : null}
                                </button>
                                <span className={`text-sm font-playful ${item.completed ? 'line-through text-gray-500' : 'text-gray-700'}`}>
                                  {item.title}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Backlog - only show after all important steps are completed */}
          {backlogSteps.length > 0 && allImportantCompleted && (
            <div className="bg-white border-2 border-primary-200 rounded-playful-md p-4">
              <h2 className="text-lg font-bold font-playful mb-4 flex items-center gap-2">
                <ListTodo className="w-5 h-5 text-gray-600" />
                {t('workflows.onlyTheImportant.planning.backlog') || 'Backlog'}
              </h2>
              <div className="space-y-2">
                {backlogSteps.map((step) => (
                  <div
                    key={step.id}
                    className="flex items-center gap-3 p-3 rounded-playful-sm border-2 bg-gray-50 border-gray-200 opacity-60"
                  >
                    <div className="flex-shrink-0 w-6 h-6 rounded-full border-2 border-gray-300 bg-white" />
                    <div
                      onClick={() => handleItemClick(step, 'step')}
                      className="flex-1 cursor-pointer hover:text-primary-600"
                    >
                      <span className="font-playful text-gray-600 block">{step.title}</span>
                      {step.description && (
                        <span className="text-sm text-gray-500 mt-1 block">{step.description}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All done message and plan for tomorrow */}
          {allStepsCompleted && (
            <div className="bg-primary-50 border-2 border-primary-500 rounded-playful-md p-6 text-center">
              <CheckCircle className="w-12 h-12 text-primary-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold font-playful mb-2 text-primary-800">
                {t('workflows.onlyTheImportant.dailyView.allDone') || 'Máte vše splněno!'}
              </h3>
              <p className="text-sm text-primary-700 font-playful mb-4">
                {t('workflows.onlyTheImportant.dailyView.planTomorrow') || 'Nastavit kroky na zítřek'}
              </p>
              <button
                onClick={handlePlanForTomorrow}
                className="btn-playful-primary px-6 py-2 flex items-center gap-2 mx-auto"
              >
                <Calendar className="w-4 h-4" />
                {t('workflows.onlyTheImportant.dailyView.planTomorrow') || 'Plánovat na zítřek'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


'use client'

import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useTranslations, useLocale } from 'next-intl'
import { Edit, X, Plus, Calendar, Target, Check, Filter, ChevronDown, ChevronUp, Repeat } from 'lucide-react'
import { getLocalDateString } from '../utils/dateHelpers'

interface StepsManagementViewProps {
  dailySteps: any[]
  goals: any[]
  onDailyStepsUpdate?: (steps: any[]) => void
  userId?: string | null
  player?: any
  onOpenStepModal?: (step?: any) => void
  hideHeader?: boolean
  showCompleted?: boolean
  showRepeatingSteps?: boolean
  goalFilter?: string | null
  dateFilter?: string | null
}

export function StepsManagementView({
  dailySteps = [],
  goals = [],
  onDailyStepsUpdate,
  userId,
  player,
  onOpenStepModal,
  hideHeader = false,
  showCompleted: showCompletedProp,
  showRepeatingSteps: showRepeatingStepsProp,
  goalFilter: goalFilterProp,
  dateFilter: dateFilterProp
}: StepsManagementViewProps) {
  const t = useTranslations()
  const localeCode = useLocale()
  
  // Ref to track if we're doing an optimistic update to prevent reloadSteps from overwriting it
  const isOptimisticUpdateRef = useRef(false)
  
  // Ref to track completed steps that should be hidden (to prevent them from reappearing after reload)
  const completedStepsSetRef = useRef<Set<string>>(new Set())
  
  // No local state - work directly with dailySteps prop like TodayFocusSection does
  
  // Filters - use props if provided, otherwise use local state
  const [showCompleted, setShowCompleted] = useState(false)
  const [showRepeatingSteps, setShowRepeatingSteps] = useState(false)
  const [stepsGoalFilter, setStepsGoalFilter] = useState<string | null>(null)
  const [stepsDateFilter, setStepsDateFilter] = useState<string | null>(null)
  const [loadingSteps, setLoadingSteps] = useState<Set<string>>(new Set())
  const [filtersExpanded, setFiltersExpanded] = useState(false)
  
  // Use props if provided
  const effectiveShowCompleted = showCompletedProp !== undefined ? showCompletedProp : showCompleted
  const effectiveShowRepeatingSteps = showRepeatingStepsProp !== undefined ? showRepeatingStepsProp : showRepeatingSteps
  const effectiveGoalFilter = goalFilterProp !== undefined ? goalFilterProp : stepsGoalFilter
  const effectiveDateFilter = dateFilterProp !== undefined ? dateFilterProp : stepsDateFilter

  // Quick edit modals for steps
  const [quickEditStepId, setQuickEditStepId] = useState<string | null>(null)
  const [quickEditStepField, setQuickEditStepField] = useState<'date' | 'goal' | null>(null)
  const [quickEditStepPosition, setQuickEditStepPosition] = useState<{ top: number; left: number } | null>(null)
  const [selectedDateForStep, setSelectedDateForStep] = useState<Date>(new Date())

  // Edit modal
  const [editingStep, setEditingStep] = useState<any | null>(null)
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    date: '',
    goalId: '',
    completed: false
  })

  // Initialize edit form when editing step
  useEffect(() => {
    if (editingStep) {
      setEditFormData({
        title: editingStep.title || '',
        description: editingStep.description || '',
        date: editingStep.date ? (editingStep.date.includes('T') ? editingStep.date.split('T')[0] : editingStep.date) : '',
        goalId: editingStep.goal_id || editingStep.goalId || '',
        completed: editingStep.completed || false
      })
    }
  }, [editingStep])

  // Initialize date value when date modal opens
  useEffect(() => {
    if (quickEditStepField === 'date' && quickEditStepId) {
      const step = dailySteps.find((s: any) => s.id === quickEditStepId)
      if (step) {
        const initialDate = step.date ? new Date(step.date) : new Date()
        setSelectedDateForStep(initialDate)
      }
    }
  }, [quickEditStepField, quickEditStepId, dailySteps])

  // Handlers
  const handleOpenEditModal = (step: any) => {
    if (onOpenStepModal) {
      onOpenStepModal(step)
    } else {
    setEditingStep({
      ...step,
      goalId: step.goal_id || null
    })
    }
  }

  const handleUpdateStep = async () => {
    if (!editFormData.title.trim()) {
      alert(t('table.stepNameRequired'))
      return
    }

    if (!editingStep) return

    const currentUserId = userId || player?.user_id
    if (!currentUserId) {
      alert('Chyba: Uživatel není nalezen')
      return
    }

    try {
      const response = await fetch('/api/daily-steps', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stepId: editingStep.id,
          title: editFormData.title,
          description: editFormData.description,
          date: editFormData.date || null,
          goalId: editFormData.goalId || null,
          completed: editFormData.completed
        }),
      })

      if (response.ok) {
        const updatedStep = await response.json()
        // Reload all steps
        await reloadSteps()
        setEditingStep(null)
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Neznámá chyba' }))
        alert(`Chyba při aktualizaci kroku: ${errorData.error || 'Nepodařilo se aktualizovat krok'}`)
      }
    } catch (error) {
      console.error('Error updating step:', error)
      alert('Chyba při aktualizaci kroku')
    }
  }

  const handleToggleStepCompleted = async (stepId: string, completed: boolean) => {
    // Add to loading set
    setLoadingSteps(prev => new Set(prev).add(stepId))
    
    // Save current state for potential revert
    const previousSteps = dailySteps
    const step = dailySteps.find((s: any) => s.id === stepId)
    
    if (!step) {
      setLoadingSteps(prev => {
        const newSet = new Set(prev)
        newSet.delete(stepId)
        return newSet
      })
      return
    }
    
    // Optimistically update parent state immediately (like JourneyGameView does)
    const optimisticStep = { ...step, completed: !step.completed }
    let optimisticallyUpdatedSteps = dailySteps.map((s: any) => 
      s.id === stepId ? optimisticStep : s
    )
    
    // If marking as completed and showCompleted is false, remove it from the list immediately
    if (optimisticStep.completed && !effectiveShowCompleted) {
      optimisticallyUpdatedSteps = optimisticallyUpdatedSteps.filter((s: any) => s.id !== stepId)
    }
    
    // If marking as completed, add to completed steps set to prevent it from reappearing
    if (optimisticStep.completed) {
      completedStepsSetRef.current.add(stepId)
    } else {
      // If unmarking as completed, remove from set so it can be shown again
      completedStepsSetRef.current.delete(stepId)
    }
    
    // Mark that we're doing an optimistic update
    isOptimisticUpdateRef.current = true
    
    // CRITICAL: Update parent state immediately and synchronously
    if (onDailyStepsUpdate) {
      onDailyStepsUpdate(optimisticallyUpdatedSteps)
    }
    
    try {
      // Check if this is a recurring step
      const isRecurringStep = step?.frequency && step.frequency !== null
      
      // For recurring steps, pass the current_instance_date as completionDate
      let completionDate: string | undefined
      if (isRecurringStep && completed && step.current_instance_date) {
        completionDate = step.current_instance_date
      }
      
      const response = await fetch('/api/daily-steps', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stepId: stepId,
          completed: completed,
          completedAt: completed ? new Date().toISOString() : null,
          completionDate: completionDate || undefined
        }),
      })

      if (response.ok) {
        const responseData = await response.json()
        const updatedStep = responseData.goal ? responseData : responseData
        
        // For recurring steps, reload all steps to get updated current_instance_date
        if (isRecurringStep && completed) {
          // Reload all steps to get the updated current_instance_date
          const currentUserId = userId || player?.user_id
          if (currentUserId && onDailyStepsUpdate) {
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            const veryOldDate = new Date(today)
            veryOldDate.setFullYear(veryOldDate.getFullYear() - 10)
            const endDate = new Date(today)
            endDate.setDate(endDate.getDate() + 30)
            
            const reloadResponse = await fetch(
              `/api/daily-steps?userId=${currentUserId}&startDate=${veryOldDate.toISOString().split('T')[0]}&endDate=${endDate.toISOString().split('T')[0]}`
            )
            if (reloadResponse.ok) {
              const reloadedSteps = await reloadResponse.json()
              onDailyStepsUpdate(Array.isArray(reloadedSteps) ? reloadedSteps : [])
            }
          }
        } else {
          // For non-recurring steps, update the step in dailySteps array
          if (onDailyStepsUpdate) {
            // If step is completed and showCompleted is false, it should already be removed
            // from optimisticallyUpdatedSteps, so just use that
            if (updatedStep.completed && !effectiveShowCompleted) {
              // Step should already be removed from optimisticallyUpdatedSteps
              // Just confirm it's not there
              onDailyStepsUpdate(optimisticallyUpdatedSteps.filter((s: any) => s.id !== stepId))
            } else {
              // Step is not completed or showCompleted is true, update it normally
              // Use optimisticallyUpdatedSteps as base, but update with server response
              const currentSteps = optimisticallyUpdatedSteps.map((s: any) => 
                s.id === stepId ? updatedStep : s
              )
              onDailyStepsUpdate(currentSteps)
            }
          }
        }
        
        // Ensure completed step stays in the set (in case server response confirms completion)
        // But not for recurring steps - they should remain visible
        if (updatedStep.completed && !isRecurringStep) {
          completedStepsSetRef.current.add(stepId)
        } else if (isRecurringStep) {
          // For recurring steps, remove from completed set so they remain visible
          completedStepsSetRef.current.delete(stepId)
        }
        
        // Reset flag after server confirms (with delay to allow state to propagate)
        setTimeout(() => {
          isOptimisticUpdateRef.current = false
        }, 500) // Increased delay to prevent reload from showing completed step again
      } else {
        // Revert optimistic update on error
        // Also remove from completed steps set if we were marking as completed
        if (optimisticStep.completed) {
          completedStepsSetRef.current.delete(stepId)
        }
        if (onDailyStepsUpdate) {
          onDailyStepsUpdate(previousSteps)
        }
        setTimeout(() => {
          isOptimisticUpdateRef.current = false
        }, 100)
        const errorData = await response.json().catch(() => ({ error: 'Neznámá chyba' }))
        alert(`Chyba při aktualizaci kroku: ${errorData.error || 'Nepodařilo se aktualizovat krok'}`)
      }
    } catch (error) {
      // Revert optimistic update on error
      // Also remove from completed steps set if we were marking as completed
      if (optimisticStep.completed) {
        completedStepsSetRef.current.delete(stepId)
      }
      if (onDailyStepsUpdate) {
        onDailyStepsUpdate(previousSteps)
      }
      setTimeout(() => {
        isOptimisticUpdateRef.current = false
      }, 100)
      console.error('Error toggling step:', error)
      alert('Chyba při aktualizaci kroku')
    } finally {
      // Remove from loading set
      setLoadingSteps(prev => {
        const newSet = new Set(prev)
        newSet.delete(stepId)
        return newSet
      })
    }
  }

  const handleDeleteStep = async (deleteAll: boolean = false) => {
    if (!editingStep) return

    // Check if this is a recurring step instance
    const isRecurringInstance = editingStep.parent_recurring_step_id && !editingStep.frequency
    const isRecurringTemplate = editingStep.is_hidden === true && editingStep.frequency !== null

    if (deleteAll && isRecurringInstance) {
      // Delete all - need to find and delete the template
      const templateId = editingStep.parent_recurring_step_id
      const confirmMessage = localeCode === 'cs'
        ? 'Opravdu chcete smazat všechny nesplněné výskyty tohoto kroku a samotný opakující se krok? Tato akce je nevratná.'
        : 'Are you sure you want to delete all incomplete instances of this step and the recurring step itself? This action cannot be undone.'
      
      if (!confirm(confirmMessage)) {
        return
      }

      try {
        const response = await fetch(`/api/daily-steps?stepId=${templateId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (response.ok) {
          // Reload steps to get updated list
          await reloadSteps()
          setEditingStep(null)
        } else {
          const errorData = await response.json().catch(() => ({ error: 'Neznámá chyba' }))
          alert(`Chyba při mazání kroku: ${errorData.error || 'Nepodařilo se smazat krok'}`)
        }
      } catch (error) {
        console.error('Error deleting step:', error)
        alert('Chyba při mazání kroku')
      }
    } else {
      // Delete single occurrence or regular step
      const confirmMessage = localeCode === 'cs'
        ? 'Opravdu chcete smazat tento krok? Tato akce je nevratná.'
        : 'Are you sure you want to delete this step? This action cannot be undone.'
      
      if (!confirm(confirmMessage)) {
        return
      }

      try {
        const response = await fetch(`/api/daily-steps?stepId=${editingStep.id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (response.ok) {
          // Update local state by removing deleted step
          // Also handle recurring step template deletion - remove all non-completed instances
          let updatedSteps = dailySteps.filter((s: any) => s.id !== editingStep.id)
          
          // If this was a recurring step template, also remove all non-completed instances
          if (isRecurringTemplate) {
            const titlePrefix = editingStep.title
            updatedSteps = updatedSteps.filter((s: any) => {
              // Keep completed instances, remove non-completed instances
              if (s.title && s.title.startsWith(titlePrefix + ' - ')) {
                return s.completed === true
              }
              return true
            })
          }
          
          if (onDailyStepsUpdate) {
            onDailyStepsUpdate(updatedSteps)
          }
          
          setEditingStep(null)
        } else {
          const errorData = await response.json().catch(() => ({ error: 'Neznámá chyba' }))
          alert(`Chyba při mazání kroku: ${errorData.error || 'Nepodařilo se smazat krok'}`)
        }
      } catch (error) {
        console.error('Error deleting step:', error)
        alert('Chyba při mazání kroku')
      }
    }
  }

  const handleCreateStep = async () => {
    if (!editFormData.title.trim()) {
      alert(t('table.stepNameRequired'))
      return
    }

    const currentUserId = userId || player?.user_id
    if (!currentUserId) {
      alert('Chyba: Uživatel není nalezen')
      return
    }

    try {
      const response = await fetch('/api/daily-steps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: currentUserId,
          goalId: editFormData.goalId || null,
          title: editFormData.title,
          description: editFormData.description || '',
          date: editFormData.date || null
        }),
      })

      if (response.ok) {
        await reloadSteps()
        setEditingStep(null)
        setEditFormData({
          title: '',
          description: '',
          date: '',
          goalId: '',
          completed: false
        })
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Neznámá chyba' }))
        alert(`Chyba při vytváření kroku: ${errorData.error || 'Nepodařilo se vytvořit krok'}`)
      }
    } catch (error) {
      console.error('Error creating step:', error)
      alert('Chyba při vytváření kroku')
    }
  }

  const reloadSteps = useCallback(async () => {
    // Don't reload if we're doing an optimistic update
    if (isOptimisticUpdateRef.current) {
      return
    }
    
    const currentUserId = userId || player?.user_id
    if (!currentUserId) return

    try {
      // Load steps with date range: 30 days ago to 60 days ahead (optimized)
      // This reduces data transfer significantly compared to loading ALL steps
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const startDate = new Date(today)
      startDate.setDate(startDate.getDate() - 30) // 30 days ago
      const endDate = new Date(today)
      endDate.setDate(endDate.getDate() + 60) // 60 days ahead
      
      const response = await fetch(
        `/api/daily-steps?userId=${currentUserId}&startDate=${startDate.toISOString().split('T')[0]}&endDate=${endDate.toISOString().split('T')[0]}`
      )
      if (response.ok) {
        const steps = await response.json()
        // Filter out steps that are in completedStepsSetRef (they should stay hidden)
        const filteredSteps = steps.filter((step: any) => {
          // If step is in completedStepsSetRef and showCompleted is false, don't include it
          if (!effectiveShowCompleted && completedStepsSetRef.current.has(step.id)) {
            return false
          }
          return true
        })
        onDailyStepsUpdate?.(filteredSteps)
      }
    } catch (error) {
      console.error('Error reloading steps:', error)
    }
  }, [userId, player?.user_id, effectiveShowCompleted]) // Removed onDailyStepsUpdate from dependencies to prevent infinite loops

  // Load steps on mount and when userId changes - use stable dependencies
  useEffect(() => {
    reloadSteps()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, player?.user_id]) // Only reload when userId changes, not when reloadSteps function changes

  // Sort and filter steps - work directly with dailySteps prop
  const sortedSteps = useMemo(() => {
    return [...dailySteps].sort((a, b) => {
      // Sort by date (newest first), then by completed status
      if (a.date && b.date) {
        const dateA = new Date(a.date).getTime()
        const dateB = new Date(b.date).getTime()
        if (dateA !== dateB) {
          return dateB - dateA // Newest first
        }
      }
      if (a.completed && !b.completed) return 1
      if (!a.completed && b.completed) return -1
      return 0
    })
  }, [dailySteps])

  const filteredSteps = useMemo(() => {
    let steps = sortedSteps.filter((step: any) => {
      // Always show recurring step templates (is_hidden === true AND frequency !== null)
      // These are the templates where users configure recurring settings
      const isRecurringTemplate = step.is_hidden === true && step.frequency !== null
      if (isRecurringTemplate) {
        // Always show recurring templates, but still apply other filters
        // Skip the hidden check for recurring templates
      } else if (step.is_hidden === true) {
        // Filter out other hidden steps (non-recurring templates)
        return false
      }
      
      // NEW SIMPLIFIED LOGIC: Recurring steps use current_instance_date instead of date
      // Recurring steps are never truly completed - they just move to next occurrence
      // So we should always show them, even if they appear "completed" temporarily
      const isRecurringStep = step.frequency && step.frequency !== null
      // Don't filter out recurring steps even if they appear completed
      // They will be updated with new current_instance_date after completion
      
      // OLD LOGIC REMOVED: No more instances - recurring steps are handled directly
      // Filter out old instances if they still exist (only if they're not the main recurring step)
      // But allow them for now if they don't have parent_recurring_step_id set correctly
      const isOldInstance = !step.frequency && step.parent_recurring_step_id && step.is_hidden !== true
      // Temporarily allow old instances to be displayed until migration is complete
      // if (isOldInstance) {
      //   return false // Hide old instances
      // }
      
      if (!effectiveShowCompleted && step.completed) {
        return false
      }
      if (effectiveGoalFilter) {
        if (effectiveGoalFilter === 'none') {
          // Filter for steps without a goal
          if (step.goal_id || step.goalId) {
            return false
          }
        } else {
          // Filter for steps with a specific goal
          if ((step.goal_id || step.goalId) !== effectiveGoalFilter) {
            return false
          }
        }
      }
      if (effectiveDateFilter) {
        // For recurring steps, use current_instance_date instead of date
        const isRecurringStep = step.frequency && step.frequency !== null
        const stepDateField = isRecurringStep ? (step.current_instance_date || step.date) : step.date
        const stepDate = stepDateField ? (stepDateField.includes('T') ? stepDateField.split('T')[0] : stepDateField) : null
        if (stepDate !== effectiveDateFilter) {
          return false
        }
      }
      return true
    })
    
    // OLD LOGIC REMOVED: No more instances - recurring steps are handled directly with current_instance_date
    // Recurring steps are already filtered above (they use current_instance_date for date matching)
    
    return steps
  }, [sortedSteps, effectiveShowCompleted, effectiveShowRepeatingSteps, effectiveGoalFilter, effectiveDateFilter])

  return (
    <div className="w-full h-full flex flex-col bg-primary-50">
      {!hideHeader && (
        <>
      {/* Filters Row - Mobile: collapsible, Desktop: always visible */}
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
            
            {/* Add Step Button - Mobile */}
            <button
              onClick={() => {
                if (onOpenStepModal) {
                  onOpenStepModal()
                } else {
                  setEditingStep({ id: null, title: '', description: '', date: '', goalId: '', completed: false })
                  setEditFormData({
                    title: '',
                    description: '',
                    date: '',
                    goalId: '',
                    completed: false
                  })
                }
              }}
              className="btn-playful-base flex items-center justify-center gap-2 px-4 py-2 text-primary-600 bg-white hover:bg-primary-50 text-sm font-medium flex-1"
            >
              <Plus className="w-4 h-4" />
              {t('steps.add')}
            </button>
          </div>
          
          {/* Collapsible filters content */}
          {filtersExpanded && (
            <div className="flex flex-col gap-2 pt-2 border-t-2 border-primary-500">
          {/* Show Completed Checkbox */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={effectiveShowCompleted}
              onChange={(e) => setShowCompleted(e.target.checked)}
              className="w-4 h-4 text-primary-600 border-2 border-primary-500 rounded-playful-sm focus:ring-primary-500"
            />
            <span className="text-sm text-black font-playful">{t('steps.filters.showCompleted')}</span>
          </label>
          
          {/* Show Repeating Steps Checkbox */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={effectiveShowRepeatingSteps}
              onChange={(e) => {
                if (showRepeatingStepsProp === undefined) {
                  setShowRepeatingSteps(e.target.checked)
                }
              }}
              disabled={showRepeatingStepsProp !== undefined}
              className="w-4 h-4 text-primary-600 border-2 border-primary-500 rounded-playful-sm focus:ring-primary-500"
            />
            <span className="text-sm text-black font-playful">{t('steps.filters.showRepeatingSteps') || 'Opakující se kroky'}</span>
          </label>
          
          {/* Goal Filter */}
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
          
          {/* Date Filter */}
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
          {/* Show Completed Checkbox */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={effectiveShowCompleted}
              onChange={(e) => setShowCompleted(e.target.checked)}
              className="w-4 h-4 text-primary-600 border-2 border-primary-500 rounded-playful-sm focus:ring-primary-500"
            />
            <span className="text-sm text-black font-playful">{t('steps.filters.showCompleted')}</span>
          </label>
          
          {/* Show Repeating Steps Checkbox */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={effectiveShowRepeatingSteps}
              onChange={(e) => {
                if (showRepeatingStepsProp === undefined) {
                  setShowRepeatingSteps(e.target.checked)
                }
              }}
              disabled={showRepeatingStepsProp !== undefined}
              className="w-4 h-4 text-primary-600 border-2 border-primary-500 rounded-playful-sm focus:ring-primary-500"
            />
            <span className="text-sm text-black font-playful">{t('steps.filters.showRepeatingSteps') || 'Opakující se kroky'}</span>
          </label>
          
          {/* Goal Filter */}
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
          
          {/* Date Filter */}
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
        
        {/* Add Step Button - Desktop */}
        <button
          onClick={() => {
            if (onOpenStepModal) {
              onOpenStepModal()
            } else {
            setEditingStep({ id: null, title: '', description: '', date: '', goalId: '', completed: false })
            setEditFormData({
              title: '',
              description: '',
              date: '',
              goalId: '',
              completed: false
            })
            }
          }}
          className="btn-playful-base hidden md:flex items-center gap-2 px-4 py-2 text-primary-600 bg-white hover:bg-primary-50 text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          {t('steps.add')}
        </button>
      </div>
        </>
      )}
      
      {/* Steps Table */}
      <div className="flex-1 overflow-y-auto">
        <div className="w-full overflow-x-auto">
          <div className="box-playful-highlight overflow-hidden m-4">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-white border-b-2 border-primary-500">
                  <th className="px-4 py-2 text-left text-xs font-semibold text-black font-playful first:pl-6 w-12"></th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-black font-playful">{t('table.name')}</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-black font-playful w-40 last:pr-6">{t('table.date')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredSteps.map((step: any) => {
                  const stepGoal = step.goal_id || step.goalId ? goals.find((g: any) => g.id === (step.goal_id || step.goalId)) : null
                  // For recurring steps, use current_instance_date instead of date
                  const isRecurringStep = step.frequency && step.frequency !== null
                  const displayDate = isRecurringStep ? (step.current_instance_date || step.date) : step.date
                  const stepDate = displayDate ? (displayDate.includes('T') ? displayDate.split('T')[0] : displayDate) : null
                  
                  return (
                    <tr
                      key={step.id}
                      onClick={() => handleOpenEditModal(step)}
                      className={`border-b-2 border-primary-500 hover:bg-primary-50 transition-all duration-200 last:border-b-0 cursor-pointer ${
                        step.completed ? 'bg-primary-100 hover:bg-primary-200' : 'bg-white'
                      }`}
                    >
                      <td className="px-4 py-2 first:pl-6">
                        <div className="flex items-center justify-center">
                          <button
                            onClick={async (e) => {
                              e.stopPropagation()
                              if (!loadingSteps.has(step.id)) {
                                await handleToggleStepCompleted(step.id, !step.completed)
                              }
                            }}
                            disabled={loadingSteps.has(step.id)}
                            className="flex items-center justify-center transition-all duration-200 cursor-pointer hover:scale-110"
                          >
                            {loadingSteps.has(step.id) ? (
                              <svg className="animate-spin h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            ) : step.completed ? (
                              <Check className="w-5 h-5 text-primary-600" strokeWidth={3} />
                            ) : (
                              <div className="w-5 h-5 border-2 border-primary-500 rounded-playful-sm"></div>
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          {step.frequency && step.frequency !== null && (
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <Repeat className="w-4 h-4 text-primary-600" />
                              {step.completion_count > 0 && (
                                <span className="text-[10px] text-primary-600 font-semibold">
                                  {step.completion_count}
                                </span>
                              )}
                            </div>
                          )}
                          <span className={`font-semibold text-sm font-playful ${step.completed ? 'line-through text-gray-500' : 'text-black'}`}>
                            {step.title}
                          </span>
                        </div>
                        {step.description && (
                          <p className="text-xs text-gray-600 mt-0.5 line-clamp-1 font-playful">{step.description}</p>
                        )}
                      </td>
                      <td className="px-4 py-2 last:pr-6">
                        {step.frequency && step.frequency !== null ? (
                          // Recurring step - show current_instance_date (not editable)
                          <span className="text-xs text-gray-600 font-playful flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {(() => {
                              // For recurring steps, use current_instance_date instead of date
                              const isRecurringStep = step.frequency && step.frequency !== null
                              const displayDate = isRecurringStep ? (step.current_instance_date || step.date) : step.date
                              const stepDate = displayDate ? (displayDate.includes('T') ? displayDate.split('T')[0] : displayDate) : null
                              
                              if (!stepDate) return '-'
                              
                              const dateObj = new Date(stepDate)
                              const today = new Date()
                              today.setHours(0, 0, 0, 0)
                              const dateObjNormalized = new Date(dateObj)
                              dateObjNormalized.setHours(0, 0, 0, 0)
                              
                              if (dateObjNormalized.getTime() === today.getTime()) {
                                return t('focus.today') || 'Today'
                              }
                              
                              return dateObj.toLocaleDateString(localeCode === 'cs' ? 'cs-CZ' : 'en-US', { 
                                day: 'numeric', 
                                month: 'numeric', 
                                year: 'numeric' 
                              })
                            })()}
                          </span>
                        ) : (
                          <span
                            onClick={(e) => {
                              e.stopPropagation()
                              const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                              setQuickEditStepPosition({ top: rect.bottom + 4, left: rect.left })
                              setQuickEditStepId(step.id)
                              setQuickEditStepField('date')
                            }}
                            className="text-xs text-gray-600 font-playful cursor-pointer hover:text-primary-600 transition-colors flex items-center gap-1"
                          >
                            <Calendar className="w-3 h-3" />
                            {(() => {
                              // For non-recurring steps, use date
                              const displayDate = isRecurringStep ? (step.current_instance_date || step.date) : step.date
                              const stepDate = displayDate ? (displayDate.includes('T') ? displayDate.split('T')[0] : displayDate) : null
                              if (stepDate) {
                                try {
                                  const dateParts = stepDate.split('-')
                                  if (dateParts.length === 3) {
                                    return new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2])).toLocaleDateString(localeCode, { day: '2-digit', month: '2-digit', year: 'numeric' })
                                  }
                                  return stepDate
                                } catch {
                                  return stepDate
                                }
                              }
                              return <span className="text-gray-400">Bez data</span>
                            })()}
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
                {filteredSteps.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-gray-600">
                      <p className="text-lg font-playful">Žádné kroky nejsou nastavené</p>
                      <p className="text-sm font-playful">Klikněte na tlačítko výše pro přidání nového kroku</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit/Create Step Modal */}
      {editingStep && typeof window !== 'undefined' && createPortal(
        <>
          <div 
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={() => {
              setEditingStep(null)
              setEditFormData({
                title: '',
                description: '',
                date: '',
                goalId: '',
                completed: false
              })
            }}
          >
            <div 
              className="box-playful-highlight max-w-2xl w-full max-h-[90vh] overflow-y-auto bg-white"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b-2 border-primary-500">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-black font-playful">
                    {editingStep.id ? t('steps.edit') : t('steps.create')}
                  </h2>
                  <button
                    onClick={() => {
                      setEditingStep(null)
                      setEditFormData({
                        title: '',
                        description: '',
                        date: '',
                        goalId: '',
                        completed: false
                      })
                    }}
                    className="btn-playful-base p-1.5"
                  >
                    <X className="w-5 h-5 text-black" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-black font-playful mb-2">
                    {t('steps.title')} <span className="text-primary-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={editFormData.title}
                    onChange={(e) => setEditFormData({...editFormData, title: e.target.value})}
                    className="w-full px-4 py-2.5 text-sm border-2 border-primary-500 rounded-playful-md font-playful focus:ring-2 focus:ring-primary-500 transition-all bg-white"
                    placeholder={t('steps.titlePlaceholder')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black font-playful mb-2">
                    {t('steps.description')}
                  </label>
                  <textarea
                    value={editFormData.description}
                    onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
                    className="w-full px-4 py-2.5 text-sm border-2 border-primary-500 rounded-playful-md font-playful focus:ring-2 focus:ring-primary-500 transition-all bg-white resize-none"
                    rows={4}
                    placeholder={t('steps.descriptionPlaceholder')}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-black font-playful mb-2">
                      {t('steps.date')}
                    </label>
                    <input
                      type="date"
                      value={editFormData.date}
                      onChange={(e) => setEditFormData({...editFormData, date: e.target.value})}
                      className="w-full px-4 py-2.5 text-sm border-2 border-primary-500 rounded-playful-md font-playful focus:ring-2 focus:ring-primary-500 transition-all bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-black font-playful mb-2">
                      {t('steps.goal')}
                    </label>
                    <select
                      value={editFormData.goalId}
                      onChange={(e) => setEditFormData({...editFormData, goalId: e.target.value})}
                      className="w-full px-4 py-2.5 text-sm border-2 border-primary-500 rounded-playful-md font-playful focus:ring-2 focus:ring-primary-500 transition-all bg-white"
                    >
                      <option value="">{t('steps.noGoal')}</option>
                      {goals.map((goal: any) => (
                        <option key={goal.id} value={goal.id}>{goal.title}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {editingStep.id && (
                  <div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editFormData.completed}
                        onChange={(e) => setEditFormData({...editFormData, completed: e.target.checked})}
                        className="w-4 h-4 text-primary-600 border-2 border-primary-500 rounded-playful-sm focus:ring-primary-500"
                      />
                      <span className="text-sm font-semibold text-black font-playful">
                        {t('steps.completed')}
                      </span>
                    </label>
                  </div>
                )}
              </div>

              <div className="p-6 border-t-2 border-primary-500 flex items-center justify-between">
                {editingStep.id && (() => {
                  const isRecurringInstance = editingStep.parent_recurring_step_id && !editingStep.frequency
                  
                  if (isRecurringInstance) {
                    return (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDeleteStep(false)}
                          className="btn-playful-danger px-4 py-2 text-sm font-medium"
                        >
                          {localeCode === 'cs' ? 'Smazat výskyt' : 'Delete occurrence'}
                        </button>
                        <button
                          onClick={() => handleDeleteStep(true)}
                          className="btn-playful-danger px-4 py-2 text-sm font-medium"
                        >
                          {localeCode === 'cs' ? 'Smazat vše' : 'Delete all'}
                        </button>
                      </div>
                    )
                  }
                  
                  return (
                    <button
                      onClick={() => handleDeleteStep(false)}
                      className="btn-playful-danger px-4 py-2 text-sm font-medium"
                    >
                      {t('common.delete')}
                    </button>
                  )
                })()}
                <div className="flex gap-3 ml-auto">
                  <button
                    onClick={() => {
                      setEditingStep(null)
                      setEditFormData({
                        title: '',
                        description: '',
                        date: '',
                        goalId: '',
                        completed: false
                      })
                    }}
                    className="btn-playful-base px-4 py-2 text-gray-600 bg-white hover:bg-primary-50 text-sm font-medium"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    onClick={editingStep.id ? handleUpdateStep : handleCreateStep}
                    className="btn-playful-base px-4 py-2 text-primary-600 bg-white hover:bg-primary-50 text-sm font-medium"
                  >
                    {t('common.save')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>,
        document.body
      )}

      {/* Quick Edit Modals for Steps */}
      {quickEditStepId && quickEditStepPosition && typeof window !== 'undefined' && createPortal(
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={(e) => {
              e.stopPropagation()
              setQuickEditStepId(null)
              setQuickEditStepField(null)
              setQuickEditStepPosition(null)
            }}
          />
          <div 
            className="fixed z-50 box-playful-highlight p-4 min-w-[250px] max-w-[90vw]"
            style={(() => {
              if (typeof window === 'undefined') {
                return {
                  top: `${quickEditStepPosition.top}px`,
                  left: `${quickEditStepPosition.left}px`
                }
              }
              
              // Calculate adjusted position to keep modal on screen
              const modalWidth = 250 // min-w-[250px]
              const modalHeight = 200 // estimated height
              const padding = 10 // padding from screen edges
              
              let adjustedTop = quickEditStepPosition.top
              let adjustedLeft = quickEditStepPosition.left
              
              // Adjust horizontal position
              if (adjustedLeft + modalWidth > window.innerWidth - padding) {
                adjustedLeft = window.innerWidth - modalWidth - padding
              }
              if (adjustedLeft < padding) {
                adjustedLeft = padding
              }
              
              // Adjust vertical position
              if (adjustedTop + modalHeight > window.innerHeight - padding) {
                adjustedTop = quickEditStepPosition.top - modalHeight - 40 // Position above the element
                // If still off screen, position at top
                if (adjustedTop < padding) {
                  adjustedTop = padding
                }
              }
              if (adjustedTop < padding) {
                adjustedTop = padding
              }
              
              return {
                top: `${adjustedTop}px`,
                left: `${adjustedLeft}px`
              }
            })()}
            onClick={(e) => e.stopPropagation()}
          >
            {(() => {
              const step = filteredSteps.find((s: any) => s.id === quickEditStepId)
              if (!step) return null
              
              if (quickEditStepField === 'date') {
                return (
                  <>
                    <h3 className="text-sm font-semibold text-black font-playful mb-2">
                      {t('steps.stepDate') || 'Vyberte datum'}
                    </h3>
                    <div className="space-y-2">
                      <div className="grid grid-cols-7 gap-1 mb-1">
                        {['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'].map(day => (
                          <div key={day} className="text-center text-xs font-semibold text-gray-600 py-1">
                            {day}
                          </div>
                        ))}
                      </div>
                      {(() => {
                        const today = new Date()
                        const currentMonth = selectedDateForStep.getMonth()
                        const currentYear = selectedDateForStep.getFullYear()
                        const firstDay = new Date(currentYear, currentMonth, 1)
                        const lastDay = new Date(currentYear, currentMonth + 1, 0)
                        const daysInMonth = lastDay.getDate()
                        const startingDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1
                        const todayStr = getLocalDateString()
                        
                        const days = []
                        for (let i = 0; i < startingDayOfWeek; i++) {
                          days.push(null)
                        }
                        for (let day = 1; day <= daysInMonth; day++) {
                          const date = new Date(currentYear, currentMonth, day)
                          days.push(date)
                        }

                        return (
                          <div className="grid grid-cols-7 gap-1">
                            {days.map((date, index) => {
                              if (!date) {
                                return <div key={`empty-${index}`} className="h-7"></div>
                              }
                              
                              const dateStr = getLocalDateString(date)
                              const isSelected = dateStr === getLocalDateString(selectedDateForStep)
                              const isToday = dateStr === todayStr
                              
                              return (
                                <button
                                  key={dateStr}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setSelectedDateForStep(date)
                                  }}
                                  className={`h-7 rounded-playful-sm transition-all text-xs font-playful border-2 ${
                                    isSelected 
                                      ? 'bg-primary-500 text-white font-bold border-primary-500' 
                                      : isToday
                                        ? 'bg-primary-100 text-primary-600 font-semibold border-primary-500'
                                        : 'bg-white text-gray-600 hover:bg-primary-50 border-transparent hover:border-primary-500'
                                  }`}
                                >
                                  {date.getDate()}
                                </button>
                              )
                            })}
                          </div>
                        )
                      })()}
                      
                      <div className="flex items-center justify-between mt-2 pt-2 border-t-2 border-primary-500">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            const prevMonth = new Date(selectedDateForStep)
                            prevMonth.setMonth(prevMonth.getMonth() - 1)
                            setSelectedDateForStep(prevMonth)
                          }}
                          className="btn-playful-base p-1 text-gray-600"
                        >
                          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <span className="text-xs font-semibold text-black font-playful">
                          {selectedDateForStep.toLocaleDateString(localeCode, { month: 'long', year: 'numeric' })}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            const nextMonth = new Date(selectedDateForStep)
                            nextMonth.setMonth(nextMonth.getMonth() + 1)
                            setSelectedDateForStep(nextMonth)
                          }}
                          className="btn-playful-base p-1 text-gray-600"
                        >
                          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                      
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={async (e) => {
                            e.stopPropagation()
                            const dateStr = getLocalDateString(selectedDateForStep)
                            try {
                              const response = await fetch('/api/daily-steps', {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ stepId: step.id, date: dateStr })
                              })
                              if (response.ok) {
                                await reloadSteps()
                                setQuickEditStepId(null)
                                setQuickEditStepField(null)
                                setQuickEditStepPosition(null)
                              }
                            } catch (error) {
                              console.error('Error updating step date:', error)
                            }
                          }}
                          className="btn-playful-base flex-1 px-3 py-1.5 text-primary-600 bg-white hover:bg-primary-50 text-xs"
                        >
                          {t('common.save') || 'Uložit'}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setQuickEditStepId(null)
                            setQuickEditStepField(null)
                            setQuickEditStepPosition(null)
                          }}
                          className="btn-playful-base px-3 py-1.5 text-gray-600 bg-white hover:bg-primary-50 text-xs"
                        >
                          {t('common.cancel') || 'Zrušit'}
                        </button>
                      </div>
                    </div>
                  </>
                )
              }
              
              if (quickEditStepField === 'goal') {
                return (
                  <>
                    <div className="max-h-[300px] overflow-y-auto">
                      <button
                        onClick={async (e) => {
                          e.stopPropagation()
                          try {
                            const response = await fetch('/api/daily-steps', {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ stepId: step.id, goalId: null })
                            })
                            if (response.ok) {
                              await reloadSteps()
                              setQuickEditStepId(null)
                              setQuickEditStepField(null)
                              setQuickEditStepPosition(null)
                            }
                          } catch (error) {
                            console.error('Error updating step goal:', error)
                          }
                        }}
                        className={`w-full text-left px-4 py-3 text-sm hover:bg-primary-50 transition-colors font-playful ${
                          !step.goal_id && !step.goalId ? 'bg-primary-100 text-primary-600 font-semibold' : 'text-black'
                        }`}
                      >
                        {t('steps.noGoal') || 'Bez cíle'}
                      </button>
                      {goals.map((goal: any) => (
                        <button
                          key={goal.id}
                          onClick={async (e) => {
                            e.stopPropagation()
                            try {
                              const response = await fetch('/api/daily-steps', {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ stepId: step.id, goalId: goal.id })
                              })
                              if (response.ok) {
                                await reloadSteps()
                                setQuickEditStepId(null)
                                setQuickEditStepField(null)
                                setQuickEditStepPosition(null)
                              }
                            } catch (error) {
                              console.error('Error updating step goal:', error)
                            }
                          }}
                          className={`w-full text-left px-4 py-3 text-sm hover:bg-primary-50 transition-colors font-playful ${
                            (step.goal_id || step.goalId) === goal.id ? 'bg-primary-100 text-primary-600 font-semibold' : 'text-black'
                          }`}
                        >
                          {goal.title}
                        </button>
                      ))}
                    </div>
                  </>
                )
              }
              
              return null
            })()}
          </div>
        </>,
        document.body
      )}
    </div>
  )
}


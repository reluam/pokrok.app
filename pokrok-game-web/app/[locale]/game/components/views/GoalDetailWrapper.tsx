'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { GoalDetailPage } from './GoalDetailPage'
import { StepModal } from '../../../main/components/modals/StepModal'
import { getLocalDateString } from '../../../main/components/utils/dateHelpers'

interface GoalDetailWrapperProps {
  goal: any
  goalId: string
  goals: any[]
  dailySteps: any[]
  onGoalsUpdate?: (goals: any[]) => void
  onSelectedGoalChange: () => void
  areas: any[]
  onDailyStepsUpdate?: (steps: any[]) => void
  player?: any
  userId?: string | null
}

export function GoalDetailWrapper({
  goal,
  goalId,
  goals,
  dailySteps,
  onGoalsUpdate,
  onSelectedGoalChange,
  areas: initialAreas,
  onDailyStepsUpdate,
  player,
  userId
}: GoalDetailWrapperProps) {
  const localeCode = useLocale()
  const [localGoal, setLocalGoal] = useState(goal)
  const [areasState, setAreasState] = useState(initialAreas)
  
  // Get userId from player
  const currentUserId = player?.user_id || userId || null
  
  // Update localGoal when goal or goalId changes
  useEffect(() => {
    if (goal && goal.id === goalId) {
      setLocalGoal(goal)
      setGoalDetailTitleValue(goal.title || '')
      setGoalDetailDescriptionValue(goal.description || '')
      setSelectedGoalDate(goal.target_date ? new Date(goal.target_date) : null)
      setSelectedGoalStartDate(goal.start_date ? new Date(goal.start_date) : null)
    }
  }, [goal, goalId])
  
  // All the states needed for GoalDetailPage
  const [metrics, setMetrics] = useState<Record<string, any[]>>({})
  const [loadingMetrics, setLoadingMetrics] = useState<Set<string>>(new Set())
  const [showMetricModal, setShowMetricModal] = useState(false)
  const [metricModalData, setMetricModalData] = useState<any>({ id: null, name: '', targetValue: 0, incrementalValue: 1, unit: '' })
  const [editingMetricName, setEditingMetricName] = useState('')
  const [editingMetricType, setEditingMetricType] = useState<'number' | 'currency' | 'percentage' | 'distance' | 'time' | 'weight' | 'custom'>('number')
  const [editingMetricCurrentValue, setEditingMetricCurrentValue] = useState(0)
  const [editingMetricTargetValue, setEditingMetricTargetValue] = useState(0)
  const [editingMetricInitialValue, setEditingMetricInitialValue] = useState(0)
  const [editingMetricIncrementalValue, setEditingMetricIncrementalValue] = useState(1)
  const [editingMetricUnit, setEditingMetricUnit] = useState('')
  
  // Goal detail editing states
  const [goalDetailTitleValue, setGoalDetailTitleValue] = useState(goal.title || '')
  const [editingGoalDetailTitle, setEditingGoalDetailTitle] = useState(false)
  const [goalDetailDescriptionValue, setGoalDetailDescriptionValue] = useState(goal.description || '')
  const [editingGoalDetailDescription, setEditingGoalDetailDescription] = useState(false)
  
  // Date picker states
  const [showGoalDetailDatePicker, setShowGoalDetailDatePicker] = useState(false)
  const [goalDetailDatePickerPosition, setGoalDetailDatePickerPosition] = useState<{ top: number; left: number } | null>(null)
  const [goalDetailDatePickerMonth, setGoalDetailDatePickerMonth] = useState(new Date())
  const [selectedGoalDate, setSelectedGoalDate] = useState<Date | null>(goal.target_date ? new Date(goal.target_date) : null)
  
  // Start date picker states
  const [showGoalDetailStartDatePicker, setShowGoalDetailStartDatePicker] = useState(false)
  const [goalDetailStartDatePickerPosition, setGoalDetailStartDatePickerPosition] = useState<{ top: number; left: number } | null>(null)
  const [goalDetailStartDatePickerMonth, setGoalDetailStartDatePickerMonth] = useState(new Date())
  const [selectedGoalStartDate, setSelectedGoalStartDate] = useState<Date | null>(goal.start_date ? new Date(goal.start_date) : null)
  
  // Status picker states
  const [showGoalDetailStatusPicker, setShowGoalDetailStatusPicker] = useState(false)
  const [goalDetailStatusPickerPosition, setGoalDetailStatusPickerPosition] = useState<{ top: number; left: number } | null>(null)
  
  // Area picker states
  const [showGoalDetailAreaPicker, setShowGoalDetailAreaPicker] = useState(false)
  const [goalDetailAreaPickerPosition, setGoalDetailAreaPickerPosition] = useState<{ top: number; left: number } | null>(null)
  
  // Icon picker states
  const [showGoalDetailIconPicker, setShowGoalDetailIconPicker] = useState(false)
  const [goalDetailIconPickerPosition, setGoalDetailIconPickerPosition] = useState<{ top: number; left: number } | null>(null)
  const [iconSearchQuery, setIconSearchQuery] = useState('')
  
  // Delete modal states
  const [showDeleteGoalModal, setShowDeleteGoalModal] = useState(false)
  const [deleteGoalWithSteps, setDeleteGoalWithSteps] = useState(false)
  const [isDeletingGoal, setIsDeletingGoal] = useState(false)
  
  // Refs
  const goalIconRef = useRef<HTMLSpanElement>(null)
  const goalTitleRef = useRef<HTMLInputElement | HTMLHeadingElement>(null)
  const goalDescriptionRef = useRef<HTMLTextAreaElement | HTMLParagraphElement>(null)
  const goalDateRef = useRef<HTMLSpanElement>(null)
  const goalStartDateRef = useRef<HTMLSpanElement>(null)
  const goalStatusRef = useRef<HTMLButtonElement>(null)
  const goalAreaRef = useRef<HTMLButtonElement>(null)
  
  // Steps cache
  const stepsCacheRef = useRef<Record<string, { data: any[], loaded: boolean }>>({})
  const [stepsCacheVersion, setStepsCacheVersion] = useState<Record<string, number>>({})
  const [animatingSteps, setAnimatingSteps] = useState<Set<string>>(new Set())
  const [loadingSteps, setLoadingSteps] = useState<Set<string>>(new Set())
  
  // Step modal states
  const [stepModalData, setStepModalData] = useState<any>({
    id: null,
    title: '',
    description: '',
    date: '',
    goalId: '',
    areaId: '',
    completed: false,
    is_important: false,
    is_urgent: false,
    deadline: '',
    estimated_time: 0,
    checklist: [],
    require_checklist_complete: false,
    isRepeating: false,
    frequency: null,
    selected_days: [],
    recurring_start_date: null,
    recurring_end_date: null,
    recurring_display_mode: 'next_only'
  })
  // Ref to always have the latest stepModalData value
  const stepModalDataRef = useRef(stepModalData)
  useEffect(() => {
    stepModalDataRef.current = stepModalData
  }, [stepModalData])
  const [showStepModal, setShowStepModal] = useState(false)
  const [stepModalSaving, setStepModalSaving] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [checklistSaving, setChecklistSaving] = useState(false)
  const checklistSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [lastAddedChecklistItemId, setLastAddedChecklistItemId] = useState<string | null>(null)
  
  // Selected day date
  const [selectedDayDate, setSelectedDayDate] = useState(new Date())
  
  
  // Load metrics for the goal
  useEffect(() => {
    const loadMetrics = async () => {
      try {
        const response = await fetch(`/api/goal-metrics?goalId=${goalId}`)
        if (response.ok) {
          const data = await response.json()
          setMetrics({ [goalId]: data.metrics || [] })
        }
      } catch (error) {
        console.error('Error loading metrics:', error)
      }
    }
    loadMetrics()
  }, [goalId])
  
  // Metric functions
  const handleMetricIncrement = useCallback(async (metricId: string, goalId: string) => {
    setLoadingMetrics(prev => new Set(prev).add(metricId))
    try {
      const response = await fetch('/api/goal-metrics', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metricId, goalId })
      })
      if (response.ok) {
        const data = await response.json()
        setMetrics(prev => ({
          ...prev,
          [goalId]: (prev[goalId] || []).map(m => m.id === metricId ? data.metric : m)
        }))
        if (data.goal && onGoalsUpdate) {
          const updatedGoals = goals.map((g: any) => g.id === goalId ? data.goal : g)
          onGoalsUpdate(updatedGoals)
        }
      }
    } catch (error) {
      console.error('Error incrementing metric:', error)
    } finally {
      setLoadingMetrics(prev => {
        const newSet = new Set(prev)
        newSet.delete(metricId)
        return newSet
      })
    }
  }, [goals, onGoalsUpdate])
  
  const handleMetricCreate = useCallback(async (goalId: string, metricData: any) => {
    try {
      const response = await fetch('/api/goal-metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goalId,
          name: metricData.name,
          type: metricData.type || 'number',
          unit: metricData.unit,
          targetValue: metricData.targetValue,
          currentValue: metricData.currentValue || 0,
          initialValue: metricData.initialValue ?? 0,
          incrementalValue: metricData.incrementalValue
        })
      })
      if (response.ok) {
        const data = await response.json()
        setMetrics(prev => ({
          ...prev,
          [goalId]: [...(prev[goalId] || []), data.metric]
        }))
        if (data.goal && onGoalsUpdate) {
          const updatedGoals = goals.map((g: any) => g.id === goalId ? data.goal : g)
          onGoalsUpdate(updatedGoals)
        }
      }
    } catch (error) {
      console.error('Error creating metric:', error)
    }
  }, [goals, onGoalsUpdate])
  
  const handleMetricUpdate = useCallback(async (metricId: string, goalId: string, metricData: any) => {
    try {
      const response = await fetch('/api/goal-metrics', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metricId,
          goalId,
          name: metricData.name,
          type: metricData.type || 'number',
          unit: metricData.unit,
          currentValue: metricData.currentValue,
          targetValue: metricData.targetValue,
          initialValue: metricData.initialValue ?? 0,
          incrementalValue: metricData.incrementalValue
        })
      })
      if (response.ok) {
        const data = await response.json()
        setMetrics(prev => ({
          ...prev,
          [goalId]: (prev[goalId] || []).map(m => m.id === metricId ? data.metric : m)
        }))
        if (data.goal && onGoalsUpdate) {
          const updatedGoals = goals.map((g: any) => g.id === goalId ? data.goal : g)
          onGoalsUpdate(updatedGoals)
        }
      }
    } catch (error) {
      console.error('Error updating metric:', error)
    }
  }, [goals, onGoalsUpdate])
  
  const handleMetricDelete = useCallback(async (metricId: string, goalId: string) => {
    try {
      const response = await fetch(`/api/goal-metrics?metricId=${metricId}&goalId=${goalId}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        setMetrics(prev => ({
          ...prev,
          [goalId]: (prev[goalId] || []).filter(m => m.id !== metricId)
        }))
      }
    } catch (error) {
      console.error('Error deleting metric:', error)
    }
  }, [])
  
  // Goal update and delete functions
  const handleUpdateGoalForDetail = useCallback(async (goalId: string, updates: any) => {
    try {
      const response = await fetch('/api/goals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goalId,
          ...updates
        })
      })
      if (response.ok) {
        const updatedGoal = await response.json()
        if (onGoalsUpdate) {
          const updatedGoals = goals.map((g: any) => g.id === goalId ? updatedGoal : g)
          onGoalsUpdate(updatedGoals)
        }
        // Update local goal state
        if (updatedGoal) {
          setLocalGoal(updatedGoal)
          setGoalDetailTitleValue(updatedGoal.title || '')
          setGoalDetailDescriptionValue(updatedGoal.description || '')
          setSelectedGoalDate(updatedGoal.target_date ? new Date(updatedGoal.target_date) : null)
          setSelectedGoalStartDate(updatedGoal.start_date ? new Date(updatedGoal.start_date) : null)
        }
      }
    } catch (error) {
      console.error('Error updating goal:', error)
    }
  }, [goals, onGoalsUpdate])
  
  const handleDeleteGoalForDetail = useCallback(async (goalId: string, deleteWithSteps: boolean) => {
    setIsDeletingGoal(true)
    try {
      const response = await fetch('/api/goals', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goalId,
          deleteSteps: deleteWithSteps
        })
      })
      if (response.ok) {
        if (onGoalsUpdate) {
          const updatedGoals = goals.filter((g: any) => g.id !== goalId)
          onGoalsUpdate(updatedGoals)
        }
        onSelectedGoalChange()
      }
    } catch (error) {
      console.error('Error deleting goal:', error)
    } finally {
      setIsDeletingGoal(false)
    }
  }, [goals, onGoalsUpdate, onSelectedGoalChange])
  
  // Step functions
  const handleStepToggle = useCallback(async (stepId: string, completed: boolean) => {
    try {
      const response = await fetch(`/api/daily-steps/${stepId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed })
      })
      if (response.ok) {
        const updatedStep = await response.json()
        if (onDailyStepsUpdate) {
          const updatedSteps = dailySteps.map((s: any) => s.id === stepId ? updatedStep : s)
          onDailyStepsUpdate(updatedSteps)
        }
      }
    } catch (error) {
      console.error('Error toggling step:', error)
    }
  }, [dailySteps, onDailyStepsUpdate])
  
  const handleItemClick = useCallback((item: any, type: string) => {
    if (type === 'step') {
      setStepModalData(item)
      setShowStepModal(true)
    }
  }, [])
  
  // Handle save step modal
  const handleSaveStepModal = useCallback(async () => {
    // Get current stepModalData from ref to ensure we have the latest value
    const currentStepData = stepModalDataRef.current
    
    if (!currentStepData.title || !currentStepData.title.trim()) {
      alert('Název kroku je povinný')
      return
    }

    if (!currentUserId) {
      alert('Uživatel není nalezen')
      return
    }

    setStepModalSaving(true)
    try {
      const isNewStep = !currentStepData.id
      
      // Determine goalId and areaId
      let finalGoalId = (currentStepData.goalId && currentStepData.goalId.trim() !== '') ? currentStepData.goalId : goalId
      let finalAreaId = (currentStepData.areaId && currentStepData.areaId.trim() !== '') ? currentStepData.areaId : null
      
      // If goal is selected, get area from goal
      if (finalGoalId) {
        const selectedGoal = goals.find((g: any) => g.id === finalGoalId)
        if (selectedGoal?.area_id) {
          finalAreaId = selectedGoal.area_id
        }
      }
      
      // Ensure date is always a string (YYYY-MM-DD) or null
      let dateValue: string | null = null
      if (!currentStepData.isRepeating) {
        if (currentStepData.date) {
          if (currentStepData.date && typeof currentStepData.date === 'string') {
            dateValue = currentStepData.date
          } else {
            dateValue = getLocalDateString(new Date())
          }
        } else {
          dateValue = getLocalDateString(new Date())
        }
      }
      
      const requestBody = {
        ...(isNewStep ? {} : { stepId: currentStepData.id }),
        userId: currentUserId,
        goalId: finalGoalId,
        areaId: finalAreaId,
        title: currentStepData.title,
        description: currentStepData.description || '',
        date: dateValue,
        isImportant: currentStepData.is_important,
        isUrgent: currentStepData.is_urgent,
        estimatedTime: currentStepData.estimated_time,
        checklist: currentStepData.checklist,
        requireChecklistComplete: currentStepData.require_checklist_complete,
        frequency: currentStepData.isRepeating ? (currentStepData.frequency || null) : null,
        selectedDays: currentStepData.isRepeating ? (currentStepData.selected_days || []) : [],
        recurringStartDate: currentStepData.isRepeating ? (currentStepData.recurring_start_date || null) : null,
        recurringEndDate: currentStepData.isRepeating ? (currentStepData.recurring_end_date || null) : null,
        recurringDisplayMode: currentStepData.isRepeating ? (currentStepData.recurring_display_mode || 'all') : 'all'
      }
      
      const response = await fetch('/api/daily-steps', {
        method: isNewStep ? 'POST' : 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      if (response.ok) {
        const updatedStep = await response.json()
        
        // Update daily steps
        if (onDailyStepsUpdate) {
          if (isNewStep) {
            // Reload all steps for new steps
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
              const allSteps = await reloadResponse.json()
              onDailyStepsUpdate(Array.isArray(allSteps) ? allSteps : [])
            } else {
              onDailyStepsUpdate([...dailySteps, updatedStep])
            }
          } else {
            const updatedSteps = dailySteps.map((s: any) => s.id === updatedStep.id ? updatedStep : s)
            onDailyStepsUpdate(updatedSteps)
          }
        }
        
        // Update cache for the goal
        if (updatedStep.goal_id === goalId) {
          if (stepsCacheRef.current[goalId]) {
            if (isNewStep) {
              stepsCacheRef.current[goalId].data = [...stepsCacheRef.current[goalId].data, updatedStep]
            } else {
              stepsCacheRef.current[goalId].data = stepsCacheRef.current[goalId].data.map(
                (s: any) => s.id === updatedStep.id ? updatedStep : s
              )
            }
          }
          setStepsCacheVersion(prev => ({
            ...prev,
            [goalId]: (prev[goalId] || 0) + 1
          }))
        }
        
        // Close modal after successful save
        setShowStepModal(false)
        setStepModalData({
          id: null,
          title: '',
          description: '',
          date: '',
          goalId: '',
          areaId: '',
          completed: false,
          is_important: false,
          is_urgent: false,
          deadline: '',
          estimated_time: 0,
          checklist: [],
          require_checklist_complete: false,
          isRepeating: false,
          frequency: null,
          selected_days: [],
          recurring_start_date: null,
          recurring_end_date: null,
          recurring_display_mode: 'next_only'
        })
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Neznámá chyba' }))
        alert(`Chyba při ${isNewStep ? 'vytváření' : 'aktualizaci'} kroku: ${errorData.error || 'Nepodařilo se uložit krok'}`)
      }
    } catch (error) {
      console.error('Error saving step:', error)
      alert(`Chyba při ${currentStepData.id ? 'aktualizaci' : 'vytváření'} kroku`)
    } finally {
      setStepModalSaving(false)
    }
  }, [stepModalData, currentUserId, goalId, goals, dailySteps, onDailyStepsUpdate, stepsCacheRef, setStepsCacheVersion])
  
  // Handle delete step
  const handleDeleteStep = useCallback(async (stepId: string) => {
    try {
      const response = await fetch(`/api/daily-steps/${stepId}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        if (onDailyStepsUpdate) {
          const updatedSteps = dailySteps.filter((s: any) => s.id !== stepId)
          onDailyStepsUpdate(updatedSteps)
        }
        // Update cache
        if (stepsCacheRef.current[goalId]) {
          stepsCacheRef.current[goalId].data = stepsCacheRef.current[goalId].data.filter((s: any) => s.id !== stepId)
        }
        setStepsCacheVersion(prev => ({
          ...prev,
          [goalId]: (prev[goalId] || 0) + 1
        }))
        setShowStepModal(false)
      }
    } catch (error) {
      console.error('Error deleting step:', error)
    }
  }, [dailySteps, onDailyStepsUpdate, goalId, stepsCacheRef, setStepsCacheVersion])
  
  return (
    <div className="flex-1 overflow-y-auto px-6 py-6">
      <GoalDetailPage
        goal={localGoal}
        goalId={goalId}
        areas={areasState}
        dailySteps={dailySteps}
        stepsCacheRef={stepsCacheRef}
        stepsCacheVersion={stepsCacheVersion}
        animatingSteps={animatingSteps}
        loadingSteps={loadingSteps}
        handleItemClick={handleItemClick}
        handleStepToggle={handleStepToggle}
        handleUpdateGoalForDetail={handleUpdateGoalForDetail}
        handleDeleteGoalForDetail={handleDeleteGoalForDetail}
        setMainPanelSection={() => {}}
        localeCode={localeCode}
        selectedDayDate={selectedDayDate}
        setStepModalData={setStepModalData}
        setShowStepModal={setShowStepModal}
        metrics={metrics[goalId] || []}
        loadingMetrics={loadingMetrics}
        handleMetricIncrement={handleMetricIncrement}
        handleMetricCreate={handleMetricCreate}
        handleMetricUpdate={handleMetricUpdate}
        handleMetricDelete={handleMetricDelete}
        showMetricModal={showMetricModal}
        setShowMetricModal={setShowMetricModal}
        metricModalData={metricModalData}
        setMetricModalData={setMetricModalData}
        editingMetricName={editingMetricName}
        setEditingMetricName={setEditingMetricName}
        editingMetricType={editingMetricType}
        setEditingMetricType={setEditingMetricType}
        editingMetricCurrentValue={editingMetricCurrentValue}
        setEditingMetricCurrentValue={setEditingMetricCurrentValue}
        editingMetricTargetValue={editingMetricTargetValue}
        setEditingMetricTargetValue={setEditingMetricTargetValue}
        editingMetricInitialValue={editingMetricInitialValue}
        setEditingMetricInitialValue={setEditingMetricInitialValue}
        editingMetricIncrementalValue={editingMetricIncrementalValue}
        setEditingMetricIncrementalValue={setEditingMetricIncrementalValue}
        editingMetricUnit={editingMetricUnit}
        setEditingMetricUnit={setEditingMetricUnit}
        goalDetailTitleValue={goalDetailTitleValue}
        setGoalDetailTitleValue={setGoalDetailTitleValue}
        editingGoalDetailTitle={editingGoalDetailTitle}
        setEditingGoalDetailTitle={setEditingGoalDetailTitle}
        goalDetailDescriptionValue={goalDetailDescriptionValue}
        setGoalDetailDescriptionValue={setGoalDetailDescriptionValue}
        editingGoalDetailDescription={editingGoalDetailDescription}
        setEditingGoalDetailDescription={setEditingGoalDetailDescription}
        showGoalDetailDatePicker={showGoalDetailDatePicker}
        setShowGoalDetailDatePicker={setShowGoalDetailDatePicker}
        goalDetailDatePickerPosition={goalDetailDatePickerPosition}
        setGoalDetailDatePickerPosition={setGoalDetailDatePickerPosition}
        goalDetailDatePickerMonth={goalDetailDatePickerMonth}
        setGoalDetailDatePickerMonth={setGoalDetailDatePickerMonth}
        selectedGoalDate={selectedGoalDate}
        setSelectedGoalDate={setSelectedGoalDate}
        showGoalDetailStartDatePicker={showGoalDetailStartDatePicker}
        setShowGoalDetailStartDatePicker={setShowGoalDetailStartDatePicker}
        goalDetailStartDatePickerPosition={goalDetailStartDatePickerPosition}
        setGoalDetailStartDatePickerPosition={setGoalDetailStartDatePickerPosition}
        goalDetailStartDatePickerMonth={goalDetailStartDatePickerMonth}
        setGoalDetailStartDatePickerMonth={setGoalDetailStartDatePickerMonth}
        selectedGoalStartDate={selectedGoalStartDate}
        setSelectedGoalStartDate={setSelectedGoalStartDate}
        showGoalDetailStatusPicker={showGoalDetailStatusPicker}
        setShowGoalDetailStatusPicker={setShowGoalDetailStatusPicker}
        goalDetailStatusPickerPosition={goalDetailStatusPickerPosition}
        setGoalDetailStatusPickerPosition={setGoalDetailStatusPickerPosition}
        showGoalDetailAreaPicker={showGoalDetailAreaPicker}
        setShowGoalDetailAreaPicker={setShowGoalDetailAreaPicker}
        goalDetailAreaPickerPosition={goalDetailAreaPickerPosition}
        setGoalDetailAreaPickerPosition={setGoalDetailAreaPickerPosition}
        showGoalDetailIconPicker={showGoalDetailIconPicker}
        setShowGoalDetailIconPicker={setShowGoalDetailIconPicker}
        goalDetailIconPickerPosition={goalDetailIconPickerPosition}
        setGoalDetailIconPickerPosition={setGoalDetailIconPickerPosition}
        iconSearchQuery={iconSearchQuery}
        setIconSearchQuery={setIconSearchQuery}
        showDeleteGoalModal={showDeleteGoalModal}
        setShowDeleteGoalModal={setShowDeleteGoalModal}
        deleteGoalWithSteps={deleteGoalWithSteps}
        setDeleteGoalWithSteps={setDeleteGoalWithSteps}
        isDeletingGoal={isDeletingGoal}
        setIsDeletingGoal={setIsDeletingGoal}
        goalIconRef={goalIconRef}
        goalTitleRef={goalTitleRef}
        goalDescriptionRef={goalDescriptionRef}
        goalDateRef={goalDateRef}
        goalStartDateRef={goalStartDateRef}
        goalStatusRef={goalStatusRef}
        goalAreaRef={goalAreaRef}
      />
      
      {/* Step Modal */}
      <StepModal
        show={showStepModal}
        stepModalData={stepModalData}
        onClose={() => {
          setShowStepModal(false)
          setStepModalData({
            id: null,
            title: '',
            description: '',
            date: '',
            goalId: '',
            areaId: '',
            completed: false,
            is_important: false,
            is_urgent: false,
            deadline: '',
            estimated_time: 0,
            checklist: [],
            require_checklist_complete: false,
            isRepeating: false,
            frequency: null,
            selected_days: [],
            recurring_start_date: null,
            recurring_end_date: null,
            recurring_display_mode: 'next_only'
          })
        }}
        onSave={handleSaveStepModal}
        onDelete={async () => {
          if (stepModalData.id) {
            await handleDeleteStep(stepModalData.id)
          }
        }}
        isSaving={stepModalSaving}
        goals={goals}
        areas={areasState}
        userId={currentUserId}
        player={player}
        dailySteps={dailySteps}
        onDailyStepsUpdate={onDailyStepsUpdate}
        selectedItem={selectedItem}
        setSelectedItem={setSelectedItem}
        selectedGoalId={goalId}
        stepsCacheRef={stepsCacheRef}
        setStepsCacheVersion={setStepsCacheVersion}
        checklistSaving={checklistSaving}
        setChecklistSaving={setChecklistSaving}
        checklistSaveTimeoutRef={checklistSaveTimeoutRef}
        lastAddedChecklistItemId={lastAddedChecklistItemId}
        setLastAddedChecklistItemId={setLastAddedChecklistItemId}
        setStepModalData={setStepModalData}
      />
    </div>
  )
}


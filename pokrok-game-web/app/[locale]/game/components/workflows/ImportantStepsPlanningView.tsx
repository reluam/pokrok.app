'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { DndContext, DragEndEvent, DragStartEvent, DragOverlay, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { X, Calendar, Plus } from 'lucide-react'
import { ImportantStepColumn } from './ImportantStepColumn'
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

interface ImportantStepsPlanningViewProps {
  userId: string
  date?: string
  onComplete: () => void
  onOpenStepModal?: (step?: any, goalId?: string) => void
}

export function ImportantStepsPlanningView({ 
  userId, 
  date: initialDate, 
  onComplete,
  onOpenStepModal
}: ImportantStepsPlanningViewProps) {
  const t = useTranslations()
  const locale = useLocale()
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  // Use getLocalDateString to avoid timezone issues
  const todayStr = getLocalDateString(today)
  
  // Initialize with initialDate if provided, otherwise use today
  // Use a function to ensure we get the latest initialDate value on mount
  const [selectedDate, setSelectedDate] = useState(() => {
    const date = initialDate || todayStr
    console.log('ImportantStepsPlanningView: Initializing selectedDate with', date, 'initialDate prop:', initialDate, 'todayStr:', todayStr)
    return date
  })
  const [planningData, setPlanningData] = useState<PlanningData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [showAddStepModal, setShowAddStepModal] = useState(false)
  const [addStepCategory, setAddStepCategory] = useState<'important' | 'other' | 'backlog' | null>(null)
  const [newStepTitle, setNewStepTitle] = useState('')
  const [newStepDescription, setNewStepDescription] = useState('')
  const [pendingStepCategory, setPendingStepCategory] = useState<'important' | 'other' | 'backlog' | null>(null) // Category for step created via standard modal

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  // Update selectedDate when initialDate prop changes
  useEffect(() => {
    if (initialDate) {
      console.log('ImportantStepsPlanningView: Setting selectedDate to', initialDate)
      setSelectedDate(initialDate)
    } else {
      // If no initialDate, use today
      console.log('ImportantStepsPlanningView: No initialDate, using today', todayStr)
      setSelectedDate(todayStr)
    }
  }, [initialDate, todayStr])

  // Load planning data
  useEffect(() => {
    loadPlanningData()
  }, [selectedDate, userId])

  const loadPlanningData = async () => {
    setLoading(true)
    try {
      console.log('ImportantStepsPlanningView: Loading planning data for date:', selectedDate)
      const response = await fetch(`/api/workflows/only-the-important/planning?date=${selectedDate}`)
      if (response.ok) {
        const data = await response.json()
        console.log('ImportantStepsPlanningView: Planning data loaded, date in response:', data.date)
        setPlanningData(data)
      } else {
        console.error('Failed to load planning data', response.status)
      }
    } catch (error) {
      console.error('Error loading planning data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Function to move a step to a category after creation
  const moveStepToCategory = useCallback(async (stepId: string, category: 'important' | 'other' | 'backlog') => {
    try {
      const moveResponse = await fetch('/api/workflows/only-the-important/move-step', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step_id: stepId,
          date: selectedDate,
          from_category: null,
          to_category: category,
          order_index: 0
        })
      })

      if (moveResponse.ok) {
        // Reload planning data to show the step in the correct category
        setLoading(true)
        try {
          const response = await fetch(`/api/workflows/only-the-important/planning?date=${selectedDate}`)
          if (response.ok) {
            const data = await response.json()
            setPlanningData(data)
          }
        } catch (error) {
          console.error('Error reloading planning data:', error)
        } finally {
          setLoading(false)
        }
        setPendingStepCategory(null)
      } else {
        console.error('Failed to move step to category:', await moveResponse.text())
        setPendingStepCategory(null)
      }
    } catch (error) {
      console.error('Error moving step to category:', error)
      setPendingStepCategory(null)
    }
  }, [selectedDate])

  // Listen for step creation event
  useEffect(() => {
    if (!pendingStepCategory) return

    const handleStepCreated = async (event: Event) => {
      const customEvent = event as CustomEvent
      const { stepId, date } = customEvent.detail
      
      // Check if the step is for the current planning date
      if (date === selectedDate) {
        // Move the step to the correct category
        await moveStepToCategory(stepId, pendingStepCategory)
      }
    }

    window.addEventListener('stepCreated', handleStepCreated)
    
    return () => {
      window.removeEventListener('stepCreated', handleStepCreated)
    }
  }, [pendingStepCategory, selectedDate, moveStepToCategory])

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over || !planningData) return

    const activeId = active.id as string
    const overId = over?.id as string

    if (!over) {
      setActiveId(null)
      return
    }

    // Find step being dragged
    let draggedStep: DailyStep | undefined
    let fromCategory: 'important' | 'other' | 'backlog' | null = null

    if (planningData.important_steps.find(s => s.id === activeId)) {
      draggedStep = planningData.important_steps.find(s => s.id === activeId)
      fromCategory = 'important'
    } else if (planningData.other_steps.find(s => s.id === activeId)) {
      draggedStep = planningData.other_steps.find(s => s.id === activeId)
      fromCategory = 'other'
    } else if (planningData.backlog_steps.find(s => s.id === activeId)) {
      draggedStep = planningData.backlog_steps.find(s => s.id === activeId)
      fromCategory = 'backlog'
    } else if (planningData.available_steps.find(s => s.id === activeId)) {
      draggedStep = planningData.available_steps.find(s => s.id === activeId)
      fromCategory = null // from available (not yet in planning)
    }

    if (!draggedStep) {
      setActiveId(null)
      return
    }

    // Determine target category from overId
    let toCategory: 'important' | 'other' | 'backlog' = 'backlog'
    if (overId === 'important-column') {
      toCategory = 'important'
    } else if (overId === 'other-column') {
      toCategory = 'other'
    } else if (overId === 'backlog-column') {
      toCategory = 'backlog'
    } else {
      // Check if overId is a step in one of the categories
      if (planningData.important_steps.find(s => s.id === overId)) {
        toCategory = 'important'
      } else if (planningData.other_steps.find(s => s.id === overId)) {
        toCategory = 'other'
      } else if (planningData.backlog_steps.find(s => s.id === overId)) {
        toCategory = 'backlog'
      }
    }

    // Validate important steps count
    if (toCategory === 'important') {
      const currentImportantCount = planningData.important_steps.filter(s => s.id !== activeId).length
      if (currentImportantCount >= planningData.settings.important_steps_count) {
        alert(t('workflows.onlyTheImportant.planning.maxSteps', { count: planningData.settings.important_steps_count }))
        return
      }
    }

    // Update local state optimistically
    updateLocalState(draggedStep, fromCategory, toCategory)

    // Update via API
    try {
      const response = await fetch('/api/workflows/only-the-important/move-step', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step_id: activeId,
          date: selectedDate,
          from_category: fromCategory,
          to_category: toCategory,
          order_index: 0
        })
      })

      if (!response.ok) {
        // Revert on error
        loadPlanningData()
      }
    } catch (error) {
      console.error('Error moving step:', error)
      loadPlanningData()
    }
  }

  const updateLocalState = (
    step: DailyStep,
    fromCategory: 'important' | 'other' | 'backlog' | null,
    toCategory: 'important' | 'other' | 'backlog'
  ) => {
    if (!planningData) return

    const newData = { ...planningData }

    // Remove from old category
    if (fromCategory === 'important') {
      newData.important_steps = newData.important_steps.filter(s => s.id !== step.id)
    } else if (fromCategory === 'other') {
      newData.other_steps = newData.other_steps.filter(s => s.id !== step.id)
    } else if (fromCategory === 'backlog') {
      newData.backlog_steps = newData.backlog_steps.filter(s => s.id !== step.id)
    } else {
      newData.available_steps = newData.available_steps.filter(s => s.id !== step.id)
    }

    // Add to new category
    if (toCategory === 'important') {
      newData.important_steps = [...newData.important_steps, step]
    } else if (toCategory === 'other') {
      newData.other_steps = [...newData.other_steps, step]
    } else {
      newData.backlog_steps = [...newData.backlog_steps, step]
    }

    setPlanningData(newData)
  }

  const handleDeleteStep = async (stepId: string) => {
    if (!confirm(t('workflows.onlyTheImportant.planning.deleteConfirm'))) return

    try {
      const response = await fetch(`/api/workflows/only-the-important/step?step_id=${stepId}&date=${selectedDate}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        loadPlanningData()
      }
    } catch (error) {
      console.error('Error deleting step:', error)
    }
  }

  const handleSavePlanning = async () => {
    if (!planningData) return

    setSaving(true)
    try {
      const allSteps = [
        ...planningData.important_steps.map((step, index) => ({
          step_id: step.id,
          category: 'important' as const,
          order_index: index
        })),
        ...planningData.other_steps.map((step, index) => ({
          step_id: step.id,
          category: 'other' as const,
          order_index: index
        })),
        ...planningData.backlog_steps.map((step, index) => ({
          step_id: step.id,
          category: 'backlog' as const,
          order_index: index
        }))
      ]

      const response = await fetch('/api/workflows/only-the-important/planning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate,
          steps: allSteps
        })
      })

      if (response.ok) {
        // If today, complete planning
        if (selectedDate === todayStr) {
          onComplete()
        } else {
          // Reload to show updated state
          loadPlanningData()
        }
      }
    } catch (error) {
      console.error('Error saving planning:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleAddNewStep = async () => {
    if (!newStepTitle.trim() || !addStepCategory) return

    try {
      // First create the step
      const createResponse = await fetch('/api/daily-steps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newStepTitle,
          description: newStepDescription || null,
          date: selectedDate
        })
      })

      if (createResponse.ok) {
        const newStep = await createResponse.json()
        
        // Then add it to the planning with the specified category
        const planningResponse = await fetch('/api/workflows/only-the-important/move-step', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            step_id: newStep.id,
            date: selectedDate,
            from_category: null,
            to_category: addStepCategory,
            order_index: 0
          })
        })

        if (planningResponse.ok) {
          setNewStepTitle('')
          setNewStepDescription('')
          setShowAddStepModal(false)
          setAddStepCategory(null)
          loadPlanningData()
        } else {
          // If planning fails, reload to sync state
          loadPlanningData()
        }
      }
    } catch (error) {
      console.error('Error adding new step:', error)
    }
  }

  const handleOpenAddStepModal = (category: 'important' | 'other' | 'backlog') => {
    // Validate important steps count
    if (category === 'important' && planningData) {
      if (planningData.important_steps.length >= planningData.settings.important_steps_count) {
        alert(t('workflows.onlyTheImportant.planning.maxSteps', { count: planningData.settings.important_steps_count }))
        return
      }
    }
    
    // If onOpenStepModal is provided, use the standard step modal
    if (onOpenStepModal) {
      // Store the category so we can move the step after creation
      setPendingStepCategory(category)
      // Call the standard step modal with selectedDate pre-filled
      onOpenStepModal(selectedDate, undefined)
      return
    }
    
    // Fallback to custom modal if onOpenStepModal is not provided
    setAddStepCategory(category)
    setShowAddStepModal(true)
  }

  const handleDateChange = (daysOffset: number) => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + daysOffset)
    setSelectedDate(newDate.toISOString().split('T')[0])
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-gray-600 font-playful">{t('common.loading')}</p>
        </div>
      </div>
    )
  }

  if (!planningData) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-red-600 font-playful">{t('workflows.onlyTheImportant.planning.error')}</p>
        </div>
      </div>
    )
  }

  const activeStep = activeId 
    ? [...planningData.important_steps, ...planningData.other_steps, ...planningData.backlog_steps, ...planningData.available_steps]
        .find(s => s.id === activeId)
    : null

  const allStepIds = [
    ...planningData.important_steps.map(s => s.id),
    ...planningData.other_steps.map(s => s.id),
    ...planningData.backlog_steps.map(s => s.id)
  ]

  return (
    <div className="w-full h-full flex flex-col bg-primary-50">
      {/* Header */}
      <div className="box-playful-highlight border-2 border-primary-500 p-4 mb-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4 flex-wrap">
          <h1 className="text-2xl font-bold text-black font-playful">
            {t('workflows.onlyTheImportant.planning.title')}
          </h1>
          
          {/* Date Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleDateChange(-1)}
              className="btn-playful-base p-2"
              title={t('workflows.onlyTheImportant.planning.previousDay')}
            >
              <Calendar className="w-4 h-4" />
            </button>
            <span className="text-sm font-bold font-playful text-primary-800 px-3 py-1.5 bg-primary-100 border-2 border-primary-500 rounded-playful-md">
              {(() => {
                const isToday = selectedDate === todayStr
                const displayText = isToday 
                  ? t('workflows.onlyTheImportant.planning.today')
                  : new Date(selectedDate).toLocaleDateString(locale)
                console.log('ImportantStepsPlanningView: Displaying date - selectedDate:', selectedDate, 'todayStr:', todayStr, 'isToday:', isToday, 'displayText:', displayText)
                return displayText
              })()}
            </span>
            <button
              onClick={() => handleDateChange(1)}
              className="btn-playful-base p-2"
              title={t('workflows.onlyTheImportant.planning.nextDay')}
            >
              <Calendar className="w-4 h-4 rotate-180" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleSavePlanning}
            disabled={saving}
            className="btn-playful-primary px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? t('common.loading') : t('workflows.onlyTheImportant.planning.completePlanning')}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto md:overflow-hidden px-4 pb-4 min-h-0 max-h-full">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="h-full max-h-full grid grid-cols-1 md:grid-cols-3 gap-4 pb-4 md:pb-0">
            {/* Left column with Important and Other */}
            <div className="md:col-span-2 flex flex-col gap-4 h-full max-h-full">
              {/* Important Steps Column - Top */}
              <div className="flex-1 min-h-0 max-h-full">
            <ImportantStepColumn
              id="important-column"
              title={t('workflows.onlyTheImportant.planning.importantSteps')}
              steps={planningData.important_steps}
              category="important"
              maxCount={planningData.settings.important_steps_count}
              onDeleteStep={handleDeleteStep}
              allStepIds={allStepIds}
              onAddStep={() => handleOpenAddStepModal('important')}
            />
              </div>

              {/* Other Steps Column - Bottom */}
              <div className="flex-1 min-h-0 max-h-full">
              <ImportantStepColumn
                id="other-column"
                title={t('workflows.onlyTheImportant.planning.otherSteps')}
                steps={planningData.other_steps}
                category="other"
                onDeleteStep={handleDeleteStep}
                allStepIds={allStepIds}
                onAddStep={() => handleOpenAddStepModal('other')}
              />
              </div>
            </div>

            {/* Right column with Backlog - Full height */}
            <div className="md:col-span-1 h-full max-h-full">
              <ImportantStepColumn
                id="backlog-column"
                title={t('workflows.onlyTheImportant.planning.backlog')}
                steps={planningData.backlog_steps}
                category="backlog"
                onDeleteStep={handleDeleteStep}
                allStepIds={allStepIds}
                availableSteps={planningData.available_steps}
                onAddStep={() => handleOpenAddStepModal('backlog')}
              />
            </div>
          </div>

          <DragOverlay>
            {activeStep ? (
              <div className="p-3 bg-white rounded-playful-md border-2 border-primary-500 shadow-lg box-playful-highlight">
                <p className="font-bold text-black font-playful">{activeStep.title}</p>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Add Step Modal */}
      {showAddStepModal && addStepCategory && (
        <div className="fixed inset-0 bg-black/50 z-[400] flex items-center justify-center p-4">
          <div className="box-playful-highlight bg-white border-2 border-primary-500 shadow-2xl max-w-md w-full p-6 rounded-playful-md">
            <h3 className="text-xl font-bold text-black font-playful mb-4">
              {t('workflows.onlyTheImportant.planning.addNewStep')} - {
                addStepCategory === 'important' 
                  ? t('workflows.onlyTheImportant.planning.importantSteps')
                  : addStepCategory === 'other'
                  ? t('workflows.onlyTheImportant.planning.otherSteps')
                  : t('workflows.onlyTheImportant.planning.backlog')
              }
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-black font-playful mb-1">
                  {t('common.title')}
                </label>
                <input
                  type="text"
                  value={newStepTitle}
                  onChange={(e) => setNewStepTitle(e.target.value)}
                  className="w-full p-2 border-2 border-primary-500 rounded-playful-md font-playful bg-white"
                  placeholder={t('workflows.onlyTheImportant.planning.stepTitlePlaceholder')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAddNewStep()
                    }
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-black font-playful mb-1">
                  {t('common.description')}
                </label>
                <textarea
                  value={newStepDescription}
                  onChange={(e) => setNewStepDescription(e.target.value)}
                  className="w-full p-2 border-2 border-primary-500 rounded-playful-md font-playful bg-white"
                  rows={3}
                  placeholder={t('workflows.onlyTheImportant.planning.stepDescriptionPlaceholder')}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6 justify-end">
              <button
                onClick={() => {
                  setShowAddStepModal(false)
                  setAddStepCategory(null)
                  setNewStepTitle('')
                  setNewStepDescription('')
                }}
                className="btn-playful-base px-4 py-2"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleAddNewStep}
                disabled={!newStepTitle.trim()}
                className="btn-playful-primary px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('common.add')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


'use client'

import { useState, useEffect, useMemo, useCallback, useRef, memo } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useTranslations, useLocale } from 'next-intl'
import { Footprints, Calendar, ChevronUp, ChevronDown } from 'lucide-react'
import { GoalEditingForm } from './GoalEditingForm'

interface SortableGoalProps {
  goal: any
  index: number
  isEditing: boolean
  editingGoal: any
  setEditingGoal: (goal: any) => void
  handleUpdateGoal: (goalId: string, updates: any) => Promise<void>
  getStatusColor: (status: string) => string
  initializeEditingGoal: (goal: any, options?: { autoAddStep?: boolean }) => void
  userId: string | null
  player: any
  stepsCacheVersion: Record<string, number>
  setStepsCacheVersion: (version: Record<string, number> | ((prev: Record<string, number>) => Record<string, number>)) => void
  stepsCacheRef: React.MutableRefObject<Record<string, { data: any[], loaded: boolean }>>
  handleDeleteGoal: (goalId: string) => Promise<void>
}

export const SortableGoal = memo(function SortableGoalComponent({
  goal,
  index,
  isEditing,
  editingGoal,
  setEditingGoal,
  handleUpdateGoal,
  getStatusColor,
  initializeEditingGoal,
  userId,
  player,
  stepsCacheVersion,
  setStepsCacheVersion,
  stepsCacheRef,
  handleDeleteGoal,
}: SortableGoalProps) {
  const t = useTranslations()
  const locale = useLocale()
  const localeCode = locale === 'cs' ? 'cs-CZ' : 'en-US'

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: goal.id,
    disabled: isEditing
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const [steps, setSteps] = useState<any[]>([])
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showStepForm, setShowStepForm] = useState(false)
  const [isSavingStep, setIsSavingStep] = useState(false)
  const [datePickerPosition, setDatePickerPosition] = useState<{ top: number; left: number } | null>(null)
  const [stepFormPosition, setStepFormPosition] = useState<{ top: number; left: number } | null>(null)
  const dateRef = useRef<HTMLDivElement>(null)
  const stepsRef = useRef<HTMLDivElement>(null)
  const [newStepTitle, setNewStepTitle] = useState('')

  // Initialize from cache if available and watch for cache updates
  // Extract version values using useMemo to ensure React detects changes
  const stepsCacheVersionValue = useMemo(() => {
    return stepsCacheVersion?.[goal.id] || 0
  }, [stepsCacheVersion, goal.id])
  
  useEffect(() => {
    if (goal.id && stepsCacheRef.current[goal.id]?.loaded) {
      const cachedSteps = stepsCacheRef.current[goal.id].data
      setSteps(cachedSteps)
      console.log('SortableGoal: Steps updated from cache', { goalId: goal.id, stepsCount: cachedSteps.length, cacheVersion: stepsCacheVersionValue })
    }
  }, [goal.id, stepsCacheVersionValue, stepsCacheRef])

  // Load steps for this goal - only once per goal using global cache
  useEffect(() => {
    const loadSteps = async () => {
      if (!goal.id) return
      
      // Check cache first
      if (stepsCacheRef.current[goal.id]?.loaded) {
        setSteps(stepsCacheRef.current[goal.id].data)
        return
      }
      
      try {
        const response = await fetch(`/api/daily-steps?goalId=${goal.id}`)
        if (response.ok) {
          const stepsData = await response.json()
          const stepsArray = Array.isArray(stepsData) ? stepsData : []
          setSteps(stepsArray)
          // Store in global cache
          stepsCacheRef.current[goal.id] = { data: stepsArray, loaded: true }
          // Trigger reactivity
          setStepsCacheVersion((prev: Record<string, number>) => ({ ...prev, [goal.id]: (prev[goal.id] || 0) + 1 }))
        }
      } catch (error) {
        console.error('Error loading steps:', error)
      }
    }
    loadSteps()
  }, [goal.id, stepsCacheRef, setStepsCacheVersion])

  // Function to refresh steps (called when step is added/removed/completed)
  const refreshSteps = useCallback(async () => {
    if (!goal.id) return
    try {
      const response = await fetch(`/api/daily-steps?goalId=${goal.id}`)
      if (response.ok) {
        const stepsData = await response.json()
        const stepsArray = Array.isArray(stepsData) ? stepsData : []
        setSteps(stepsArray)
        // Update cache
        stepsCacheRef.current[goal.id] = { data: stepsArray, loaded: true }
        // Trigger reactivity
        setStepsCacheVersion((prev: Record<string, number>) => ({ ...prev, [goal.id]: (prev[goal.id] || 0) + 1 }))
      }
    } catch (error) {
      console.error('Error refreshing steps:', error)
    }
  }, [goal.id, stepsCacheRef, setStepsCacheVersion])

  const stepsCount = steps.length
  const targetDate = goal.target_date ? new Date(goal.target_date).toLocaleDateString(localeCode) : t('common.noDeadline');

  // Handle click vs drag detection
  const [dragStartPosition, setDragStartPosition] = useState({ x: 0, y: 0 })
  const [isDragStarted, setIsDragStarted] = useState(false)

  const handleMouseDown = (e: any) => {
    setDragStartPosition({ x: e.clientX, y: e.clientY })
    setIsDragStarted(false)
  }

  const handleMouseMove = (e: any) => {
    if (!isDragStarted) {
      const dragDistance = Math.sqrt(
        Math.pow(e.clientX - dragStartPosition.x, 2) + 
        Math.pow(e.clientY - dragStartPosition.y, 2)
      )
      
      if (dragDistance > 5) {
        setIsDragStarted(true)
      }
    }
  }

  const handleMouseUp = (e: any) => {
    // Don't close if clicking on editing form, buttons, dropdowns, or clickable info badges
    if (e.target.closest('.editing-form') !== null || 
        e.target.closest('button') !== null ||
        e.target.closest('.date-picker') !== null ||
        e.target.closest('.step-form') !== null ||
        e.target.closest('[ref="dateRef"]') !== null ||
        e.target.closest('[ref="stepsRef"]') !== null ||
        dateRef.current?.contains(e.target) ||
        stepsRef.current?.contains(e.target)) {
      return
    }
    
    if (!isDragStarted) {
      // Treat as click - open/close editing
      if (isEditing) {
        setEditingGoal(null)
      } else {
        initializeEditingGoal(goal)
      }
    }
    setIsDragStarted(false)
  }

  const handleDateClick = (e: any) => {
    e.stopPropagation()
    if (dateRef.current) {
      const rect = dateRef.current.getBoundingClientRect()
      setDatePickerPosition({ top: rect.bottom + 5, left: rect.left })
      setShowDatePicker(true)
    }
  }

  const handleStepsClick = (e: any) => {
    e.stopPropagation()
    if (stepsRef.current) {
      const rect = stepsRef.current.getBoundingClientRect()
      setStepFormPosition({ top: rect.bottom + 5, left: rect.left })
      setShowStepForm(true)
      setNewStepTitle('')
    }
  }

  const handleSaveStep = async () => {
    if (!newStepTitle.trim() || isSavingStep) {
      console.log('handleSaveStep: Skipping - no title or already saving', { newStepTitle: newStepTitle.trim(), isSavingStep })
      return
    }
    
    // Use userId from prop or fallback to player?.user_id
    const currentUserId = userId || player?.user_id
    if (!currentUserId) {
      console.error('Cannot create step: userId not available', { userId, player: player?.user_id })
      return
    }
    
    console.log('handleSaveStep: Starting save', { currentUserId, goalId: goal.id, title: newStepTitle.trim() })
    
    setIsSavingStep(true)
    try {
      const requestBody = {
        userId: currentUserId,
        goalId: goal.id,
        title: newStepTitle.trim(),
        description: '',
        date: null
      }
      console.log('handleSaveStep: Sending request', requestBody)
      
      const response = await fetch('/api/daily-steps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })
      
      console.log('handleSaveStep: Response received', { status: response.status, ok: response.ok })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('handleSaveStep: Error response', { status: response.status, error: errorText })
        alert(`Chyba při ukládání kroku: ${errorText}`)
        return
      }
      
      const savedStep = await response.json()
      console.log('handleSaveStep: Step saved successfully', savedStep)
      
      // Update cache first, then refresh steps
      if (goal.id) {
        const stepsResponse = await fetch(`/api/daily-steps?goalId=${goal.id}`)
        if (stepsResponse.ok) {
          const stepsData = await stepsResponse.json()
          stepsCacheRef.current[goal.id] = { data: Array.isArray(stepsData) ? stepsData : [], loaded: true }
          // Trigger reactivity - update stepsCacheVersion to force re-render
          setStepsCacheVersion((prev: Record<string, number>) => ({ ...prev, [goal.id]: (prev[goal.id] || 0) + 1 }))
          // Also update local steps state directly for immediate UI update
          setSteps(Array.isArray(stepsData) ? stepsData : [])
          console.log('handleSaveStep: Cache updated', { goalId: goal.id, stepsCount: stepsData.length })
        }
      }
      // Also refresh steps count (this updates the steps state)
      await refreshSteps()
      // Close form only after everything is done
      setShowStepForm(false)
      setNewStepTitle('')
    } catch (error) {
      console.error('handleSaveStep: Exception caught', error)
      alert(`Chyba při ukládání kroku: ${error}`)
    } finally {
      setIsSavingStep(false)
    }
  }

  const handleToggleModal = (e: any) => {
    e.stopPropagation()
    if (isEditing) {
      setEditingGoal(null)
    } else {
      initializeEditingGoal(goal)
    }
  }

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className="rounded-xl border bg-gray-50 border-gray-200 hover:shadow-md transition-all duration-300 cursor-grab active:cursor-grabbing"
    >
      <div className={`p-3 ${isEditing ? 'border-b border-gray-200' : ''}`}>
        <div className="flex items-center justify-between gap-4">
          {/* Left side - Title and info */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <span className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold text-xs flex-shrink-0">
              {index + 1}
            </span>
            <h3 className="text-base font-semibold text-gray-800 truncate flex-1">
              {goal.title}
            </h3>
          </div>

          {/* Center - Info badges (clickable) */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Steps count - clickable */}
            <div 
              ref={stepsRef}
              onClick={handleStepsClick}
              className="flex items-center gap-1 text-sm text-gray-600 cursor-pointer hover:text-orange-600 hover:bg-orange-50 px-2 py-1 rounded transition-colors"
              title={t('goals.addStep')}
            >
              <Footprints className="w-4 h-4" />
              <span>{stepsCount}</span>
            </div>

            {/* Date - clickable */}
            <div 
              ref={dateRef}
              onClick={handleDateClick}
              className="flex items-center gap-1 text-sm text-gray-600 cursor-pointer hover:text-orange-600 hover:bg-orange-50 px-2 py-1 rounded transition-colors"
              title={t('common.endDate')}
            >
              <Calendar className="w-4 h-4" />
              <span>{targetDate}</span>
            </div>
          </div>

          {/* Right side - Toggle edit button */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={handleToggleModal}
              className="p-1.5 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors"
              title={isEditing ? t('common.close') : t('common.edit')}
            >
              {isEditing ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      
        {/* Date picker dropdown */}
        {showDatePicker && datePickerPosition && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setShowDatePicker(false)}
            />
            <div 
              className="fixed z-50 bg-white border-2 border-gray-200 rounded-xl shadow-2xl p-4 date-picker"
              style={{ 
                top: `${datePickerPosition.top}px`,
                left: `${datePickerPosition.left}px`
              }}
            >
              <input
                type="date"
                value={goal.target_date ? new Date(goal.target_date).toISOString().split('T')[0] : ''}
                onChange={async (e) => {
                  const newDate = e.target.value ? new Date(e.target.value).toISOString() : null
                  await handleUpdateGoal(goal.id, { target_date: newDate })
                  setShowDatePicker(false)
                }}
                className="text-base px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-600 focus:border-orange-600"
                autoFocus
              />
            </div>
          </>
        )}

        {/* Step form dropdown */}
        {showStepForm && stepFormPosition && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={(e) => {
                if (!isSavingStep) {
                  setShowStepForm(false)
                }
              }}
            />
            <div 
              className="fixed z-50 bg-white border-2 border-gray-200 rounded-xl shadow-2xl p-4 step-form"
              onClick={(e) => e.stopPropagation()}
              style={{
                top: `${stepFormPosition.top}px`,
                left: `${stepFormPosition.left}px`,
                minWidth: '250px'
              }}
            >
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  {t('goals.stepNumber')} {stepsCount + 1}
                </label>
                <input
                  type="text"
                  value={newStepTitle}
                  onChange={(e) => setNewStepTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSaveStep()
                    } else if (e.key === 'Escape') {
                      setShowStepForm(false)
                    }
                  }}
                  placeholder={`${t('goals.stepNumber')} ${stepsCount + 1}`}
                  className="w-full text-base px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-600 focus:border-orange-600"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveStep}
                    disabled={!newStepTitle.trim() || isSavingStep}
                    className="flex-1 px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    {isSavingStep ? 'Ukládám...' : t('common.save')}
                  </button>
                  <button
                    onClick={() => {
                      if (!isSavingStep) {
                        setShowStepForm(false)
                      }
                    }}
                    disabled={isSavingStep}
                    className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      
      {isEditing && (
        <GoalEditingForm 
          goal={editingGoal}
          userId={userId || player?.user_id}
          player={player}
          onUpdate={async (goalId: string, updates: any) => {
            await handleUpdateGoal(goalId, updates)
            // Refresh steps count after update
            await refreshSteps()
          }}
          onCancel={() => setEditingGoal(null)}
          onDelete={handleDeleteGoal}
          setStepsCacheVersion={setStepsCacheVersion}
          stepsCacheRef={stepsCacheRef}
        />
      )}
    </div>
  )
}, (prevProps, nextProps) => {
  // Only re-render if goal.id, isEditing, goal itself, or cache versions changed
  const prevStepsVersion = prevProps.stepsCacheVersion?.[prevProps.goal.id] || 0
  const nextStepsVersion = nextProps.stepsCacheVersion?.[nextProps.goal.id] || 0
  
  return prevProps.goal.id === nextProps.goal.id &&
         prevProps.isEditing === nextProps.isEditing &&
         prevProps.goal === nextProps.goal &&
         prevStepsVersion === nextStepsVersion
})


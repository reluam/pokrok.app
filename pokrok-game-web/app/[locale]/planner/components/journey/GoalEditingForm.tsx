'use client'

import { useState, useEffect, useLayoutEffect, useRef, useMemo } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Calendar, Target, CheckCircle, Moon, ChevronDown, Edit, X, Trash2 } from 'lucide-react'
import { normalizeDate } from '../utils/dateHelpers'

interface GoalEditingFormProps {
  goal: any
  userId: string | null
  player?: any
  onUpdate: (goalId: string, updates: any) => Promise<void>
  onCancel: () => void
  onDelete: (goalId: string) => void
  setStepsCacheVersion: React.Dispatch<React.SetStateAction<Record<string, number>>>
  stepsCacheRef: React.MutableRefObject<Record<string, { data: any[], loaded: boolean }>>
}

export function GoalEditingForm({ 
  goal, 
  userId, 
  player, 
  onUpdate, 
  onCancel, 
  onDelete, 
  setStepsCacheVersion,
  stepsCacheRef
}: GoalEditingFormProps) {
  const t = useTranslations()
  const locale = useLocale()
  const localeCode = locale === 'cs' ? 'cs-CZ' : 'en-US'
  
  // Store original goal data to detect changes
  const originalGoalRef = useRef({
    title: goal.title,
    description: goal.description || '',
    target_date: goal.target_date ? normalizeDate(goal.target_date) : '',
    start_date: goal.start_date ? normalizeDate(goal.start_date) : '',
    status: goal.status || 'active'
  })
  
  const [formData, setFormData] = useState({
    title: goal.title,
    description: goal.description || '',
    target_date: goal.target_date ? normalizeDate(goal.target_date) : '',
    start_date: goal.start_date ? normalizeDate(goal.start_date) : '',
    status: goal.status || 'active',
    steps: [] as Array<{ id: string; title: string; description?: string; date?: string; completed?: boolean; isEditing?: boolean }>
  })
  
  // Check if there are unsaved changes
  // Note: Steps are saved directly in the modal, so we only check goal properties
  const hasUnsavedChanges = useMemo(() => {
    const original = originalGoalRef.current
    return (
      formData.title !== original.title ||
      formData.description !== original.description ||
      formData.target_date !== original.target_date ||
      formData.start_date !== original.start_date ||
      formData.status !== original.status
    )
  }, [formData])
  
  const [showGoalDatePicker, setShowGoalDatePicker] = useState(false)
  const [showStatusPicker, setShowStatusPicker] = useState(false)
  const [datePickerButtonRef, setDatePickerButtonRef] = useState<HTMLButtonElement | null>(null)
  const [statusPickerButtonRef, setStatusPickerButtonRef] = useState<HTMLButtonElement | null>(null)
  const [datePickerPosition, setDatePickerPosition] = useState<{ top: number; left: number } | null>(null)
  const [statusPickerPosition, setStatusPickerPosition] = useState<{ top: number; left: number } | null>(null)

  // Calculate dropdown positions when they open
  useLayoutEffect(() => {
    if (showGoalDatePicker && datePickerButtonRef) {
      const rect = datePickerButtonRef.getBoundingClientRect()
      setDatePickerPosition({
        top: rect.bottom - 2,
        left: rect.left
      })
    } else {
      setDatePickerPosition(null)
    }
  }, [showGoalDatePicker, datePickerButtonRef])

  useLayoutEffect(() => {
    if (showStatusPicker && statusPickerButtonRef) {
      const rect = statusPickerButtonRef.getBoundingClientRect()
      setStatusPickerPosition({
        top: rect.bottom - 2,
        left: rect.left
      })
    } else {
      setStatusPickerPosition(null)
    }
  }, [showStatusPicker, statusPickerButtonRef])

  // Load steps for this goal - only once per goal using global cache
  useEffect(() => {
    const loadSteps = async () => {
      // Load steps for this goal - check cache first
      if (goal.id) {
        if (stepsCacheRef.current[goal.id]?.loaded) {
          // Use cached data
          const cachedSteps = stepsCacheRef.current[goal.id].data.map((step: any) => ({
              id: step.id,
              title: step.title,
              description: step.description || '',
              date: step.date ? new Date(step.date).toISOString().split('T')[0] : '',
              completed: step.completed || false,
              isEditing: false
            }))
          setFormData(prev => {
            // Only update if steps have changed (to preserve editing state)
            const currentStepIds = prev.steps.map(s => s.id).sort().join(',')
            const newStepIds = cachedSteps.map(s => s.id).sort().join(',')
            if (currentStepIds !== newStepIds) {
              // Merge: keep existing steps that are being edited, add new ones from cache
              const existingStepIds = new Set(prev.steps.map(s => s.id))
              const newSteps = cachedSteps.filter(s => !existingStepIds.has(s.id))
              const mergedSteps = [
                ...prev.steps.map(s => {
                  const cached = cachedSteps.find(cs => cs.id === s.id)
                  if (cached && !s.isEditing) {
                    return cached
                  }
                  return s
                }),
                ...newSteps
              ]
              return { ...prev, steps: mergedSteps }
            }
            return prev
          })
        } else {
          // Load from API
          try {
            const stepsResponse = await fetch(`/api/daily-steps?goalId=${goal.id}`)
            if (stepsResponse.ok) {
              const steps = await stepsResponse.json()
              const stepsArray = Array.isArray(steps) ? steps : []
              setFormData(prev => ({
                ...prev,
                steps: stepsArray.map((step: any) => ({
                  id: step.id,
                  title: step.title,
                  description: step.description || '',
                  date: step.date ? new Date(step.date).toISOString().split('T')[0] : '',
                  completed: step.completed || false,
                  isEditing: false
                }))
              }))
              // Store in cache
              stepsCacheRef.current[goal.id] = { data: stepsArray, loaded: true }
              // Trigger reactivity
              setStepsCacheVersion((prev: Record<string, number>) => ({ ...prev, [goal.id]: (prev[goal.id] || 0) + 1 }))
            }
          } catch (error) {
            console.error('Error loading steps:', error)
          }
        }
      }
    }

    loadSteps()
  }, [goal.id, stepsCacheRef, setStepsCacheVersion])

  // Watch for cache updates and sync formData.steps
  // Use stepsCacheVersion state to trigger updates reactively
  useEffect(() => {
    if (!goal.id || !stepsCacheRef.current[goal.id]?.loaded) return
    
    const cachedSteps = stepsCacheRef.current[goal.id].data.map((step: any) => ({
      id: step.id,
      title: step.title,
      description: step.description || '',
      date: step.date ? new Date(step.date).toISOString().split('T')[0] : '',
      completed: step.completed || false,
      isEditing: false
    }))
    
    setFormData(prev => {
      // Check if there are new steps in cache that aren't in formData
      const currentStepIds = new Set(prev.steps.map(s => s.id))
      const cachedStepIds = new Set(cachedSteps.map(s => s.id))
      
      // Find new steps that were added (exclude temp steps)
      const newSteps = cachedSteps.filter(s => !currentStepIds.has(s.id) && !s.id.startsWith('temp-'))
      
      // Update existing steps if they changed (but preserve editing state and temp steps)
      const updatedSteps = prev.steps.map(prevStep => {
        // Don't update steps that are being edited or are temp steps
        if (prevStep.isEditing || prevStep.id.startsWith('temp-')) {
          return prevStep
        }
        const cached = cachedSteps.find(cs => cs.id === prevStep.id)
        return cached || prevStep
      })
      
      // Combine updated steps with new steps, removing duplicates
      // But preserve temp steps and editing steps
      const allSteps = [...updatedSteps, ...newSteps]
      const seenIds = new Set<string>()
      const uniqueSteps = allSteps.filter(step => {
        // Always keep temp steps and editing steps
        if (step.id.startsWith('temp-') || step.isEditing) {
          if (seenIds.has(step.id)) {
            return false
          }
          seenIds.add(step.id)
          return true
        }
        if (seenIds.has(step.id)) {
          return false
        }
        seenIds.add(step.id)
        return true
      })
      
      // Check if any steps were removed from cache
      const removedStepIds = prev.steps
        .filter(s => !cachedStepIds.has(s.id) && !s.id.startsWith('temp-'))
        .map(s => s.id)
      
      if (removedStepIds.length > 0) {
        return {
          ...prev,
          steps: uniqueSteps.filter(s => !removedStepIds.includes(s.id))
        }
      }
      
      // Only update if there are actual changes (to avoid unnecessary re-renders)
      // But always preserve temp steps and editing steps
      const prevStepIds = prev.steps.map(s => s.id).sort().join(',')
      const newStepIds = uniqueSteps.map(s => s.id).sort().join(',')
      
      // Check if there are temp steps or editing steps that should be preserved
      const hasTempOrEditingSteps = prev.steps.some(s => s.id.startsWith('temp-') || s.isEditing)
      
      if (prevStepIds !== newStepIds || newSteps.length > 0 || hasTempOrEditingSteps) {
        // Make sure we preserve all temp and editing steps
        const finalSteps = uniqueSteps.map(step => {
          const prevStep = prev.steps.find(s => s.id === step.id)
          if (prevStep && (prevStep.id.startsWith('temp-') || prevStep.isEditing)) {
            return prevStep
          }
          return step
        })
        
        // Add any temp/editing steps that might have been lost
        const missingTempSteps = prev.steps.filter(s => 
          (s.id.startsWith('temp-') || s.isEditing) && 
          !finalSteps.find(fs => fs.id === s.id)
        )
        
        return { ...prev, steps: [...finalSteps, ...missingTempSteps] }
      }
      
      return prev
    })
  }, [goal.id, stepsCacheRef, setStepsCacheVersion])

  // Auto-add step if requested
  useEffect(() => {
    if (goal.autoAddStep) {
      // Wait a bit for steps to load, then add new step
      const timeoutId = setTimeout(() => {
        setFormData(prev => ({
          ...prev,
          steps: [...prev.steps, { id: crypto.randomUUID(), title: '', description: '', date: '', isEditing: true }]
        }))
        // Scroll to steps section
        setTimeout(() => {
          const stepsSection = document.querySelector('[data-steps-section]')
          if (stepsSection) {
            stepsSection.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }
        }, 100)
      }, 500)
      return () => clearTimeout(timeoutId)
    }
  }, [goal.autoAddStep])

  // Handle click outside to close editing forms
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      // Don't close if clicking on:
      // - Step editing forms
      // - Step form dropdowns (the small modals for adding)
      // - Any button or input
      if (
        target.closest('[data-step-id]') || 
        target.closest('.step-form') ||
        target.closest('button') ||
        target.closest('input') ||
        target.closest('textarea') ||
        target.closest('select')
      ) {
        return
      }
        setFormData(prev => ({
          ...prev,
          steps: prev.steps.map(s => ({ ...s, isEditing: false }))
        }))
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSubmit = async () => {
    if (!hasUnsavedChanges) return
    
    // Use normalizeDate helper to ensure consistent YYYY-MM-DD format
    const updates = {
      title: formData.title,
      description: formData.description,
      target_date: formData.target_date ? normalizeDate(formData.target_date) : null,
      start_date: formData.start_date ? normalizeDate(formData.start_date) : null,
      status: formData.status
    }
    await onUpdate(goal.id, updates)
    
    // Update original goal ref after successful save
    originalGoalRef.current = {
      title: formData.title,
      description: formData.description,
      target_date: formData.target_date,
      start_date: formData.start_date,
      status: formData.status
    }
    
    // Refresh cache after saving steps
    if (goal.id) {
      // Refresh steps cache
      try {
        const stepsResponse = await fetch(`/api/daily-steps?goalId=${goal.id}`)
        if (stepsResponse.ok) {
          const stepsData = await stepsResponse.json()
          stepsCacheRef.current[goal.id] = { data: Array.isArray(stepsData) ? stepsData : [], loaded: true }
        // Trigger reactivity
        setStepsCacheVersion((prev: Record<string, number>) => ({ ...prev, [goal.id]: (prev[goal.id] || 0) + 1 }))
        }
      } catch (error) {
        console.error('Error refreshing steps cache:', error)
      }
    }

    // Save steps - only save if they have a title
    // Note: New steps are already saved directly in the modal, so we only need to update/delete existing steps
    let stepsChanged = false
    for (const step of formData.steps) {
      if (!step.title || !step.title.trim()) {
        // Delete step if it exists and has no title
        if (step.id && !step.id.startsWith('temp-')) {
          try {
            const response = await fetch(`/api/daily-steps?stepId=${step.id}`, {
              method: 'DELETE'
            })
            if (response.ok) {
              stepsChanged = true
            }
          } catch (error) {
            console.error('Error deleting empty step:', error)
          }
        }
        continue
      }
      
      // Skip temp steps - they are already saved in the modal
      if (step.id && step.id.startsWith('temp-')) {
        continue
      }
      
      if (step.id) {
        // Existing step - update it
        try {
          const response = await fetch('/api/daily-steps', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              stepId: step.id,
              title: step.title.trim(),
              description: step.description || '',
              date: step.date || null,
              completed: step.completed || false
            })
          })
          if (response.ok) {
            stepsChanged = true
          } else {
            console.error('Error updating step:', await response.text())
          }
        } catch (error) {
          console.error('Error updating step:', error)
        }
      }
    }
    
    // Update cache if steps were changed
    if (stepsChanged && goal.id) {
      try {
        const stepsResponse = await fetch(`/api/daily-steps?goalId=${goal.id}`)
        if (stepsResponse.ok) {
          const stepsData = await stepsResponse.json()
          const stepsArray = Array.isArray(stepsData) ? stepsData : []
          stepsCacheRef.current[goal.id] = { data: stepsArray, loaded: true }
          // Trigger reactivity - update stepsCacheVersion to force re-render in SortableGoal
          setStepsCacheVersion((prev: Record<string, number>) => {
            const newVersion = (prev[goal.id] || 0) + 1
            console.log('GoalEditingForm: Updating stepsCacheVersion (handleSubmit)', { goalId: goal.id, newVersion, stepsCount: stepsArray.length })
            return { ...prev, [goal.id]: newVersion }
          })
        }
      } catch (error) {
        console.error('Error refreshing steps cache:', error)
      }
    }

  }

  return (
    <div 
      className="editing-form p-6 h-full flex flex-col"
      onMouseDown={(e) => e.stopPropagation()}
      onMouseMove={(e) => e.stopPropagation()}
      onMouseUp={(e) => e.stopPropagation()}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 min-h-0">
        {/* Left Column - Text Fields */}
      <div className="space-y-4 flex flex-col">
        <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              {t('goals.goalTitle')} <span className="text-orange-500">*</span>
            </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full px-4 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-600 focus:border-orange-600 transition-all bg-white shadow-sm hover:shadow-md"
              placeholder={t('goals.goalTitlePlaceholder')}
          />
        </div>
        
        <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              {t('goals.goalDescription')}
            </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-4 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-600 focus:border-orange-600 transition-all bg-white shadow-sm hover:shadow-md resize-none"
              rows={4}
              placeholder={t('goals.goalDescriptionPlaceholder')}
          />
        </div>
        
          {/* Compact Icon-based Controls */}
        <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              {t('goals.settings')}
            </label>
            <div className="flex items-center gap-3 flex-wrap">
              {/* Start Date Picker */}
              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    const input = document.createElement('input')
                    input.type = 'date'
                    input.value = formData.start_date || ''
                    input.onchange = (e: any) => {
                      setFormData({...formData, start_date: e.target.value})
                    }
                    input.click()
                  }}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm border-2 rounded-xl transition-all shadow-sm hover:shadow-md ${
                    formData.start_date 
                      ? 'border-blue-300 bg-blue-50 text-blue-700' 
                      : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300'
                  }`}
                  title={t('goals.startDate') || 'Datum startu'}
                >
                  <Calendar className="w-4 h-4" />
                  <span className="font-medium">
                    {formData.start_date 
                      ? new Date(formData.start_date).toLocaleDateString(localeCode, { day: '2-digit', month: '2-digit', year: 'numeric' })
                      : (t('goals.startDate') || 'Datum startu')}
                  </span>
                </button>
              </div>
              
              {/* Target Date Picker Icon */}
              <div className="relative">
                <button
                  ref={setDatePickerButtonRef}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowGoalDatePicker(!showGoalDatePicker)
                    setShowStatusPicker(false)
                  }}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm border-2 rounded-xl transition-all shadow-sm hover:shadow-md ${
                    formData.target_date 
                      ? 'border-orange-300 bg-orange-50 text-orange-700' 
                      : 'border-gray-200 bg-white text-gray-700 hover:border-orange-300'
                  }`}
                  title={t('common.endDate')}
                >
                  <Calendar className="w-4 h-4" />
                  <span className="font-medium">
                    {formData.target_date 
                      ? new Date(formData.target_date).toLocaleDateString(localeCode, { day: '2-digit', month: '2-digit', year: 'numeric' })
                      : t('common.endDate')}
                  </span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${showGoalDatePicker ? 'rotate-180' : ''}`} />
                </button>
                {showGoalDatePicker && datePickerPosition && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowGoalDatePicker(false)}
                    />
                    <div 
                      className="fixed z-50 bg-white border-2 border-gray-200 rounded-xl shadow-2xl p-4"
                      style={{
                        top: `${datePickerPosition.top}px`,
                        left: `${datePickerPosition.left}px`
                      }}
                    >
          <input
            type="date"
            value={formData.target_date}
                        onChange={(e) => {
                          setFormData({...formData, target_date: e.target.value})
                          setShowGoalDatePicker(false)
                        }}
                        className="text-base px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-600 focus:border-orange-600"
                        autoFocus
                      />
                    </div>
                  </>
                )}
        </div>
        
              {/* Status Picker Icon */}
              <div className="relative">
                <button
                  ref={setStatusPickerButtonRef}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowStatusPicker(!showStatusPicker)
                    setShowGoalDatePicker(false)
                  }}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm border-2 rounded-xl transition-all shadow-sm hover:shadow-md ${
                    formData.status === 'active' 
                      ? 'border-green-300 bg-green-50 text-green-700' 
                      : formData.status === 'completed'
                      ? 'border-blue-300 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-orange-300'
                  }`}
                  title="Status"
                >
                  {formData.status === 'active' ? (
                    <Target className="w-4 h-4" />
                  ) : formData.status === 'completed' ? (
                  <CheckCircle className="w-4 h-4" />
                  ) : (
                    <Moon className="w-4 h-4" />
                  )}
                  <span className="font-medium">
                    {formData.status === 'active' ? t('goals.status.active') : 
                     formData.status === 'completed' ? t('goals.status.completed') : t('goals.status.paused')}
                  </span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${showStatusPicker ? 'rotate-180' : ''}`} />
                </button>
                {showStatusPicker && statusPickerPosition && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowStatusPicker(false)}
                    />
                    <div 
                      className="fixed z-50 bg-white border-2 border-gray-200 rounded-xl shadow-2xl min-w-[160px]"
                      style={{
                        top: `${statusPickerPosition.top}px`,
                        left: `${statusPickerPosition.left}px`
                      }}
                    >
                      {['active', 'paused', 'completed'].map((status) => (
                        <button
                          key={status}
                          type="button"
                          onClick={() => {
                            setFormData({...formData, status: status as any})
                            setShowStatusPicker(false)
                          }}
                          className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors font-medium ${
                            formData.status === status 
                              ? status === 'active' 
                                ? 'bg-green-50 text-green-700 font-semibold' 
                                : status === 'completed'
                                ? 'bg-blue-50 text-blue-700 font-semibold'
                                : 'bg-orange-50 text-orange-700 font-semibold'
                              : 'text-gray-700'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {status === 'active' ? (
                              <>
                                <Target className="w-4 h-4" />
                                <span>{t('goals.status.active')}</span>
                              </>
                            ) : status === 'completed' ? (
                              <>
                                <CheckCircle className="w-4 h-4" />
                                <span>{t('goals.status.completed')}</span>
                              </>
                            ) : (
                              <>
                                <Moon className="w-4 h-4" />
                                <span>{t('goals.status.paused')}</span>
                              </>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Right Column - Steps */}
        <div className="space-y-5 flex flex-col min-h-0">
          {/* Steps Section */}
          <div className="bg-white rounded-xl p-4 border-2 border-gray-100 shadow-sm flex flex-col flex-1 min-h-0" data-steps-section>
            <div className="flex items-center justify-between mb-3 flex-shrink-0">
              <label className="block text-sm font-semibold text-gray-800">{t('goals.steps')}</label>
              <button
                type="button"
                data-add-step-button
                onClick={() => {
                  setFormData({
                    ...formData,
                    steps: [...formData.steps, { id: `temp-${crypto.randomUUID()}`, title: '', description: '', date: '', completed: false, isEditing: true }]
                  })
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                {t('goals.addStep')}
              </button>
            </div>
            {formData.steps.length === 0 ? (
              <div className="text-center py-6 text-gray-400 flex-shrink-0">
                <svg className="w-8 h-8 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-xs">{t('steps.noSteps')}</p>
              </div>
            ) : (
              <div className="space-y-2 flex-1 overflow-y-auto pr-1 min-h-0">
                {formData.steps.map((step, index) => {
                  const isEditingStep = step.isEditing
                  
                  return (
                    <div 
                      key={step.id} 
                      data-step-id={step.id}
                      className="bg-gray-50 p-3 rounded-lg border border-gray-200 hover:border-orange-300 transition-colors"
                    >
                      {isEditingStep ? (
                        <>
                          <div className="flex items-start justify-between mb-2">
                            <span className="text-xs font-semibold text-gray-600 bg-white px-2 py-0.5 rounded">{t('goals.stepNumber')} {index + 1}</span>
                            <button
                              type="button"
                              onClick={() => {
                                setFormData({
                                  ...formData,
                                  steps: formData.steps.filter(s => s.id !== step.id)
                                })
                              }}
                              className="text-red-400 hover:text-red-600 hover:bg-red-50 rounded p-1 transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <input
                            type="text"
                            value={step.title}
                            onChange={(e) => {
                              const updatedSteps = formData.steps.map(s =>
                                s.id === step.id ? { ...s, title: e.target.value } : s
                              )
                              setFormData({ ...formData, steps: updatedSteps })
                            }}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg mb-2 focus:ring-2 focus:ring-orange-600 focus:border-orange-600 bg-white"
                            placeholder={t('steps.stepTitle')}
                            autoFocus
                          />
                          <input
                            type="date"
                            value={step.date || ''}
                            onChange={(e) => {
                              const updatedSteps = formData.steps.map(s =>
                                s.id === step.id ? { ...s, date: e.target.value } : s
                              )
                              setFormData({ ...formData, steps: updatedSteps })
                            }}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg mb-2 focus:ring-2 focus:ring-orange-600 focus:border-orange-600 bg-white"
                            placeholder={t('steps.dateOptional')}
                          />
                          <textarea
                            value={step.description || ''}
                            onChange={(e) => {
                              const updatedSteps = formData.steps.map(s =>
                                s.id === step.id ? { ...s, description: e.target.value } : s
                              )
                              setFormData({ ...formData, steps: updatedSteps })
                            }}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg mb-2 focus:ring-2 focus:ring-orange-600 focus:border-orange-600 bg-white resize-none"
                            rows={2}
                            placeholder={t('steps.descriptionOptional')}
                          />
                          <div className="flex items-center gap-2 mt-2">
                            <button
                              type="button"
                              onClick={async () => {
                                if (!step.title || !step.title.trim()) {
                                  // Remove step if no title
                                  setFormData({
                                    ...formData,
                                    steps: formData.steps.filter(s => s.id !== step.id)
                                  })
                                  return
                                }
                                
                                // Use userId from prop or fallback to player?.user_id
                                const currentUserId = userId || player?.user_id
                                if (!currentUserId) {
                                  console.error('Cannot save step: userId not available')
                                  alert('Chyba: Uživatel není načten. Zkuste to prosím znovu.')
                                  return
                                }
                                
                                // If it's a temp step, create it in the database
                                if (step.id.startsWith('temp-')) {
                                  try {
                                    const response = await fetch('/api/daily-steps', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({
                                        userId: currentUserId,
                                        goalId: goal.id,
                                        title: step.title.trim(),
                                        description: step.description || '',
                                        date: step.date || null
                                      })
                                    })
                                    
                                    if (response.ok) {
                                      const savedStep = await response.json()
                                      // Replace temp step with saved step
                                      const updatedSteps = formData.steps.map(s =>
                                        s.id === step.id ? { ...s, id: savedStep.id, isEditing: false } : s
                                      )
                                      setFormData({ ...formData, steps: updatedSteps })
                                      
                                      // Update cache and refresh steps count in SortableGoal
                                      if (goal.id) {
                                        const stepsResponse = await fetch(`/api/daily-steps?goalId=${goal.id}`)
                                        if (stepsResponse.ok) {
                                          const stepsData = await stepsResponse.json()
                                          const stepsArray = Array.isArray(stepsData) ? stepsData : []
                                          stepsCacheRef.current[goal.id] = { data: stepsArray, loaded: true }
                                          // Trigger reactivity - update stepsCacheVersion to force re-render in SortableGoal
                                          setStepsCacheVersion((prev: Record<string, number>) => {
                                            const newVersion = (prev[goal.id] || 0) + 1
                                            console.log('GoalEditingForm: Updating stepsCacheVersion (create)', { goalId: goal.id, newVersion, stepsCount: stepsArray.length })
                                            return { ...prev, [goal.id]: newVersion }
                                          })
                                        }
                                      }
                                    } else {
                                      const errorText = await response.text()
                                      console.error('Error saving step:', errorText)
                                      alert(`Chyba při ukládání kroku: ${errorText}`)
                                    }
                                  } catch (error) {
                                    console.error('Error saving step:', error)
                                    alert(`Chyba při ukládání kroku: ${error}`)
                                  }
                                } else {
                                  // Existing step - update it in the database
                                  try {
                                    const response = await fetch('/api/daily-steps', {
                                      method: 'PUT',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({
                                        stepId: step.id,
                                        title: step.title.trim(),
                                        description: step.description || '',
                                        date: step.date || null,
                                        completed: step.completed || false
                                      })
                                    })
                                    
                                    if (response.ok) {
                                      // Update step in formData
                                const updatedSteps = formData.steps.map(s =>
                                  s.id === step.id ? { ...s, isEditing: false } : s
                                )
                                setFormData({ ...formData, steps: updatedSteps })
                                      
                                      // Update cache and refresh steps count in SortableGoal
                                      if (goal.id) {
                                        const stepsResponse = await fetch(`/api/daily-steps?goalId=${goal.id}`)
                                        if (stepsResponse.ok) {
                                          const stepsData = await stepsResponse.json()
                                          const stepsArray = Array.isArray(stepsData) ? stepsData : []
                                          stepsCacheRef.current[goal.id] = { data: stepsArray, loaded: true }
                                          // Trigger reactivity - update stepsCacheVersion to force re-render in SortableGoal
                                          setStepsCacheVersion((prev: Record<string, number>) => {
                                            const newVersion = (prev[goal.id] || 0) + 1
                                            console.log('GoalEditingForm: Updating stepsCacheVersion (update)', { goalId: goal.id, newVersion, stepsCount: stepsArray.length })
                                            return { ...prev, [goal.id]: newVersion }
                                          })
                                        }
                                      }
                                    } else {
                                      const errorText = await response.text()
                                      console.error('Error updating step:', errorText)
                                      alert(`Chyba při aktualizaci kroku: ${errorText}`)
                                    }
                                  } catch (error) {
                                    console.error('Error updating step:', error)
                                    alert(`Chyba při aktualizaci kroku: ${error}`)
                                  }
                                }
                              }}
                              className="px-3 py-1.5 text-xs font-medium bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                            >
                              {t('common.save')}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setFormData({
                                  ...formData,
                                  steps: formData.steps.filter(s => s.id !== step.id)
                                })
                              }}
                              className="px-3 py-1.5 text-xs font-medium bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                            >
                              {t('common.cancel')}
                            </button>
                          </div>
                        </>
                      ) : (
                        <div 
                          className="flex items-center justify-between cursor-pointer group"
                          onClick={() => {
                            const updatedSteps = formData.steps.map(s =>
                              s.id === step.id ? { ...s, isEditing: true } : s
                            )
                            setFormData({ ...formData, steps: updatedSteps })
                          }}
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <input
                              type="checkbox"
                              checked={step.completed || false}
                              onChange={async (e) => {
                                e.stopPropagation()
                                const updatedSteps = formData.steps.map(s =>
                                  s.id === step.id ? { ...s, completed: e.target.checked } : s
                                )
                                setFormData({ ...formData, steps: updatedSteps })
                                
                                // Save completion status immediately
                                if (step.id && !step.id.startsWith('temp-')) {
                                  try {
                                    await fetch('/api/daily-steps', {
                                      method: 'PUT',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({
                                        stepId: step.id,
                                        completed: e.target.checked,
                                        completedAt: e.target.checked ? new Date().toISOString() : null
                                      })
                                    })
                                  } catch (error) {
                                    console.error('Error updating step completion:', error)
                                  }
                                }
                              }}
                              className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500 cursor-pointer"
                            />
                            <span className="text-xs font-semibold text-gray-500 w-12">#{index + 1}</span>
                            <div className="flex-1">
                              <div className={`font-medium text-sm ${step.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                                {step.title || t('common.noTitle')}
                              </div>
                              {step.date && (
                                <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {new Date(step.date).toLocaleDateString(localeCode, { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                const updatedSteps = formData.steps.map(s =>
                                  s.id === step.id ? { ...s, isEditing: true } : s
                                )
                                setFormData({ ...formData, steps: updatedSteps })
                              }}
                              className="text-gray-400 hover:text-orange-600 p-1"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={async (e) => {
                                e.stopPropagation()
                                // Delete from database if it exists
                                if (step.id && !step.id.startsWith('temp-')) {
                                  try {
                                    const response = await fetch(`/api/daily-steps?stepId=${step.id}`, {
                                      method: 'DELETE'
                                    })
                                    if (response.ok && goal.id) {
                                      // Update cache after deletion
                                      const stepsResponse = await fetch(`/api/daily-steps?goalId=${goal.id}`)
                                      if (stepsResponse.ok) {
                                        const stepsData = await stepsResponse.json()
                                        const stepsArray = Array.isArray(stepsData) ? stepsData : []
                                        stepsCacheRef.current[goal.id] = { data: stepsArray, loaded: true }
                                        // Trigger reactivity - update stepsCacheVersion to force re-render in SortableGoal
                                        setStepsCacheVersion((prev: Record<string, number>) => {
                                          const newVersion = (prev[goal.id] || 0) + 1
                                          console.log('GoalEditingForm: Updating stepsCacheVersion (delete)', { goalId: goal.id, newVersion, stepsCount: stepsArray.length })
                                          return { ...prev, [goal.id]: newVersion }
                                        })
                                      }
                                    }
                                  } catch (error) {
                                    console.error('Error deleting step:', error)
                                  }
                                }
                                setFormData({
                                  ...formData,
                                  steps: formData.steps.filter(s => s.id !== step.id)
                                })
                              }}
                              className="text-gray-400 hover:text-red-600 p-1"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
            </div>
      </div>
      
      <div className="flex gap-3 mt-6 pt-6 border-t-2 border-gray-200 flex-shrink-0">
          <button
            onClick={handleSubmit}
            disabled={!hasUnsavedChanges}
            className={`flex-1 px-6 py-3 text-sm font-semibold rounded-xl transition-all ${
              hasUnsavedChanges
                ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 cursor-pointer'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
            title={hasUnsavedChanges ? t('goals.saveChanges') : 'Žádné změny k uložení'}
          >
          {t('goals.saveChanges')}
          </button>
          <button
            onClick={onCancel}
          className="px-6 py-3 bg-gray-100 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-200 transition-all"
            title={t('common.cancel')}
          >
          {t('common.cancel')}
          </button>
          <button
            onClick={() => onDelete(goal.id)}
          className="px-6 py-3 bg-red-500 text-white text-sm font-medium rounded-xl hover:bg-red-600 transition-all"
            title={t('goals.delete')}
          >
          <Trash2 className="w-4 h-4 inline mr-1" />
          {t('goals.delete')}
          </button>
      </div>
    </div>
  )
}


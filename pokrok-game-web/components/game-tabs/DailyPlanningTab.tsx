'use client'

import React, { useState, useEffect, memo, useRef, useCallback } from 'react'
import { DailyStep, Event, Goal, Value, DailyPlanning, Area } from '@/lib/cesta-db'
import { Calendar, Target, MapPin, Plus, Check, X, ArrowLeft, Footprints, RotateCcw } from 'lucide-react'
import { useTranslations } from '@/lib/use-translations'

interface DailyPlanningTabProps {
  dailySteps: DailyStep[]
  events: Event[]
  goals: Goal[]
  values: Value[]
  dailyPlanning: DailyPlanning | null
  plannedStepIds: string[]
  onPlannedStepsChange?: (stepIds: string[]) => void
  onStepAdd?: (step: Partial<DailyStep>) => Promise<DailyStep> | DailyStep | void
  onStepUpdate?: (stepId: string, updates: Partial<DailyStep>) => void
  onStepDelete?: (stepId: string) => void
  onStepComplete?: (stepId: string) => void
  onStepRemoveFromPlan?: (stepId: string) => void
}

const DailyPlanningTab = memo(function DailyPlanningTab({
  dailySteps,
  events,
  goals,
  values,
  dailyPlanning,
  plannedStepIds,
  onPlannedStepsChange,
  onStepAdd,
  onStepUpdate,
  onStepDelete,
  onStepComplete,
  onStepRemoveFromPlan
}: DailyPlanningTabProps) {
  const { translations } = useTranslations()
  const [editingStep, setEditingStep] = useState<DailyStep | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [draggedStepId, setDraggedStepId] = useState<string | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [areas, setAreas] = useState<Area[]>([])
  const [isDirty, setIsDirty] = useState(false)
  const lastSavedRef = useRef<string>('')
  const editingStepRef = useRef<DailyStep | null>(null)
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Update ref when editingStep changes
  useEffect(() => {
    editingStepRef.current = editingStep
  }, [editingStep])

  // Get today's date
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Get planned steps from props for immediate UI reflect
  // All steps that are currently part of the plan (including completed ones)
  const plannedAllSteps = plannedStepIds
    .map(stepId => dailySteps.find(step => step.id === stepId))
    .filter((s): s is DailyStep => Boolean(s))

  // Only incompleted planned steps are rendered in the list
  const plannedSteps = plannedAllSteps.filter(s => !s.completed)

  // Sort planned steps by priority
  const sortedPlannedSteps = plannedSteps.sort((a, b) => {
    // Overdue steps first
    const aOverdue = new Date(a.date) < today
    const bOverdue = new Date(b.date) < today
    if (aOverdue && !bOverdue) return -1
    if (!aOverdue && bOverdue) return 1

    // Then by priority (important + urgent = highest)
    const aPriority = (a.is_important ? 2 : 0) + (a.is_urgent ? 1 : 0)
    const bPriority = (b.is_important ? 2 : 0) + (b.is_urgent ? 1 : 0)
    if (aPriority !== bPriority) return bPriority - aPriority

    // Finally by date
    return new Date(a.date).getTime() - new Date(b.date).getTime()
  })

  // Auto-save function
  const performAutoSave = useCallback(async () => {
    const currentStep = editingStepRef.current
    if (!currentStep) return

    console.log('⏰ Autosave timeout executing:', { 
      stepId: currentStep.id, 
      title: currentStep.title 
    })
    
    setIsSaving(true)
    setSaveStatus('saving')
    
    try {
      if (currentStep.id === 'new-step') {
        // Auto-save new step only if it has a title
        if (!onStepAdd || !currentStep.title?.trim()) {
          console.log('❌ New step autosave skipped:', { 
            hasOnStepAdd: !!onStepAdd, 
            hasTitle: !!currentStep.title?.trim() 
          })
          return
        }

        console.log('✅ Saving new step:', currentStep.title)

        const newStep: Partial<DailyStep> = {
          title: currentStep.title,
          description: currentStep.description,
          date: currentStep.date,
          goal_id: currentStep.goal_id,
          is_important: currentStep.is_important,
          is_urgent: currentStep.is_urgent
        }

        const created = await onStepAdd(newStep) as DailyStep | void

        if (created && (created as DailyStep).id) {
          console.log('✅ New step created and added to plan automatically')
        }
        
        console.log('✅ New step saved, closing editor')
        setEditingStep(null)
        setIsDirty(false)
      } else {
        // Auto-save existing step
        if (!onStepUpdate) return
        await onStepUpdate(currentStep.id, currentStep)
        lastSavedRef.current = JSON.stringify(currentStep)
        setIsDirty(false)
      }
      
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch (error) {
      console.error('Error auto-saving step:', error)
    } finally {
      setIsSaving(false)
    }
  }, [onStepAdd, onStepUpdate])

  // Auto-save for existing steps, manual save for new steps
  useEffect(() => {
    if (!editingStep || !isDirty || editingStep.id === 'new-step') return

    console.log('🔄 Autosave triggered for existing step:', { 
      stepId: editingStep.id, 
      title: editingStep.title, 
      isDirty 
    })

    // Clear existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }

    // Set new timeout
    debounceTimeoutRef.current = setTimeout(() => {
      performAutoSave()
    }, 1000)

    // Cleanup timeout on unmount
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [editingStep, performAutoSave])

  const handleStepClick = (step: DailyStep) => {
    setEditingStep(step)
    lastSavedRef.current = JSON.stringify(step)
    setIsDirty(false)
  }

  const handleStepFieldChange = useCallback((field: keyof DailyStep, value: any) => {
    if (!editingStep) return
    
    console.log('📝 Field change:', { field, value, stepId: editingStep.id })
    
    setEditingStep({
      ...editingStep,
      [field]: value
    })
    setIsDirty(true)
    console.log('✅ Set isDirty to true')
  }, [editingStep])

  const handleSaveNewStep = async () => {
    if (!editingStep || !onStepAdd) return

    const newStep: Partial<DailyStep> = {
      title: editingStep.title,
      description: editingStep.description,
      date: editingStep.date,
      goal_id: editingStep.goal_id,
      is_important: editingStep.is_important,
      is_urgent: editingStep.is_urgent
    }

    try {
      setIsSaving(true)
      setSaveStatus('saving')
      
      // New step created inside DailyPlanningTab SHOULD be added to plan immediately
      const created = await onStepAdd(newStep) as DailyStep | void

      if (created && (created as DailyStep).id) {
        const createdId = (created as DailyStep).id
        const newPlanned = [...plannedStepIds, createdId]
        onPlannedStepsChange?.(newPlanned)
        try {
          await fetch('/api/cesta/daily-planning', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              date: today.toISOString().split('T')[0],
              planned_steps: newPlanned
            })
          })
        } catch (e) {
          console.error('Error updating daily planning after create:', e)
        }
      }
      setEditingStep(null)
      setIsDirty(false)
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch (error) {
      console.error('Error creating step:', error)
    } finally {
      setIsSaving(false)
    }
  }


  const handleAddStepToPlan = async (stepId: string) => {
    const newPlannedSteps = [...plannedStepIds, stepId]
    onPlannedStepsChange?.(newPlannedSteps)
    
    // Update daily planning via API
    try {
      await fetch('/api/cesta/daily-planning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: today.toISOString().split('T')[0],
          planned_steps: newPlannedSteps
        })
      })
    } catch (error) {
      console.error('Error updating daily planning:', error)
    }
  }

  const handleRemoveFromPlan = async (stepId: string) => {
    const newPlannedSteps = plannedStepIds.filter(id => id !== stepId)
    onPlannedStepsChange?.(newPlannedSteps)
    
    // Update daily planning via API
    try {
      await fetch('/api/cesta/daily-planning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: today.toISOString().split('T')[0],
          planned_steps: newPlannedSteps
        })
      })
    } catch (error) {
      console.error('Error updating daily planning:', error)
    }
  }

  const handleComplete = (stepId: string) => {
    onStepComplete?.(stepId)
    handleRemoveFromPlan(stepId)
  }

  const handleDragStart = (e: React.DragEvent, stepId: string) => {
    setDraggedStepId(stepId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverIndex(index)
  }

  const handleDragLeave = () => {
    setDragOverIndex(null)
  }

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    
    if (!draggedStepId) return
    
    // If step is not already in plan, add it
    if (!plannedStepIds.includes(draggedStepId)) {
      await handleAddStepToPlan(draggedStepId)
    }
    
    setDraggedStepId(null)
    setDragOverIndex(null)
  }

  const handleDragEnd = () => {
    setDraggedStepId(null)
    setDragOverIndex(null)
  }

  // Fetch areas for area selection
  useEffect(() => {
    const loadAreas = async () => {
      try {
        const res = await fetch('/api/cesta/areas')
        if (res.ok) {
          const data = await res.json()
          setAreas(data.areas || [])
        }
      } catch (e) {
        console.error('Error loading areas:', e)
      }
    }
    loadAreas()
  }, [])

  // Close editor when clicking outside
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('.step-card')) {
        setEditingStep(null)
        setIsDirty(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  const getStepColor = (step: DailyStep) => {
    const stepDate = new Date(step.date)
    stepDate.setHours(0, 0, 0, 0)
    
    if (stepDate < today) {
      return 'bg-red-50 border-red-200 text-red-800'
    }
    
    return 'bg-primary-50 border-primary-200 text-primary-800'
  }

  const renderStep = (step: DailyStep, index: number, isEditing: boolean = false) => {
    const isOverdue = new Date(step.date) < today
    const stepColor = getStepColor(step)
    const isDragging = draggedStepId === step.id
    const isDragOver = dragOverIndex === index
    
    if (isEditing) {
      return (
        <div className={`step-card rounded-lg p-4 border ${stepColor} shadow-sm transition-all duration-300`}>
          <div className="space-y-3">
            <input
              type="text"
              value={editingStep?.title || ''}
              onChange={(e) => handleStepFieldChange('title', e.target.value)}
              placeholder="Název kroku"
              className="w-full text-xl font-semibold text-gray-900 bg-transparent border-b border-gray-200 focus:border-primary-500 outline-none pb-2"
            />
            
            <div className="pt-3">
              <textarea
                value={editingStep?.description || ''}
                onChange={(e) => handleStepFieldChange('description', e.target.value)}
                placeholder="Popis kroku"
                className="w-full bg-transparent border-b border-gray-200 focus:border-primary-500 outline-none resize-none pb-2 text-[15px] text-gray-700"
                rows={3}
              />
            </div>

            {/* Save status */}
            <div className="flex items-center justify-end">
              {saveStatus === 'saving' && (
                <div className="text-sm opacity-70">Ukládám...</div>
              )}
              {saveStatus === 'saved' && (
                <div className="text-sm opacity-70">Uloženo</div>
              )}
              
              {step.id === 'new-step' && (
                <button
                  onClick={handleSaveNewStep}
                  disabled={isSaving || !editingStep?.title?.trim()}
                  title="Uložit krok"
                  aria-label="Uložit krok"
                  className="inline-flex items-center justify-center px-3 py-1 bg-primary-600 text-white text-sm rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Uložit
                </button>
              )}
            </div>

            {/* Editable controls */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 opacity-70" />
                <input
                  type="date"
                  value={editingStep ? new Date(editingStep.date).toISOString().split('T')[0] : ''}
                  onChange={(e) => handleStepFieldChange('date', new Date(e.target.value))}
                  className="px-2 py-1 text-sm border border-gray-300 rounded bg-white"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Target className="w-4 h-4 opacity-70" />
                <select
                  value={editingStep?.goal_id || ''}
                  onChange={(e) => handleStepFieldChange('goal_id', e.target.value)}
                  className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded bg-white"
                >
                  <option value="">Vybrat cíl</option>
                  {goals.map(g => (
                    <option key={g.id} value={g.id}>{g.title}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 opacity-70" />
                <select
                  value={(editingStep as any)?.area_id || ''}
                  onChange={(e) => handleStepFieldChange('area_id' as any, e.target.value)}
                  className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded bg-white"
                >
                  <option value="">Bez oblasti</option>
                  {areas.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => handleStepFieldChange('is_important', !editingStep?.is_important)}
                  className={`px-2 py-1 text-xs rounded border ${editingStep?.is_important ? 'bg-yellow-100 border-yellow-300 text-yellow-800' : 'bg-white border-gray-300 text-gray-700'}`}
                >
                  Důležité
                </button>
                <button
                  type="button"
                  onClick={() => handleStepFieldChange('is_urgent', !editingStep?.is_urgent)}
                  className={`px-2 py-1 text-xs rounded border ${editingStep?.is_urgent ? 'bg-red-100 border-red-300 text-red-800' : 'bg-white border-gray-300 text-gray-700'}`}
                >
                  Urgentní
                </button>
              </div>
            </div>

            {/* Action buttons for existing steps - moved to bottom */}
            {step.id !== 'new-step' && (
              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-gray-100">
                <button
                  onClick={() => handleComplete(step.id)}
                  title="Dokončit"
                  aria-label="Dokončit"
                  className="inline-flex items-center justify-center w-8 h-8 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleRemoveFromPlan(step.id)}
                  title="Odstranit z plánu"
                  aria-label="Odstranit z plánu"
                  className="inline-flex items-center justify-center w-8 h-8 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )
    }

    return (
      <div
        key={step.id}
        className={`relative rounded-lg p-4 border cursor-pointer transition-all duration-300 hover:shadow-md ${
          isDragging ? 'opacity-50' : ''
        } ${isDragOver ? 'border-primary-300' : ''} ${stepColor}`}
        onClick={() => handleStepClick(step)}
        draggable
        onDragStart={(e) => handleDragStart(e, step.id)}
        onDragOver={(e) => handleDragOver(e, index)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, index)}
        onDragEnd={handleDragEnd}
      >
        {/* Left decorative icon */}
        <div className={`absolute -left-2 top-1/2 -translate-y-1/2 opacity-80 ${isOverdue ? 'text-red-500' : 'text-primary-300'}`}>
          <Footprints className="w-5 h-5" />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3">
              <div className="font-semibold text-[17px] text-gray-900">{step.title}</div>
              {/* Status chips */}
              {isOverdue && (
                <span className="text-xs font-medium text-red-700 bg-red-100 rounded-full px-2 py-0.5">
                  {Math.ceil((today.getTime() - new Date(step.date).getTime()) / (1000*60*60*24))} dní zpožděno
                </span>
              )}
              {!isOverdue && (
                <span className="text-xs font-medium text-primary-700 bg-primary-100 rounded-full px-2 py-0.5">
                  {(() => { const d=new Date(step.date); d.setHours(0,0,0,0); return d.getTime()===today.getTime() ? 'Dnes' : 'Budoucí' })()}
                </span>
              )}
            </div>
            {step.description && (
              <div className="text-[13px] text-gray-600 mt-1">{step.description}</div>
            )}
            {/* Meta row with small icons */}
            <div className="mt-2 flex items-center space-x-4 text-[12px] text-gray-500">
              <span className="inline-flex items-center space-x-1">
                <Calendar className="w-3 h-3" />
                <span>
                  {(() => {
                    const sDate = new Date(step.date); sDate.setHours(0,0,0,0)
                    const diff = Math.ceil((sDate.getTime() - today.getTime())/(1000*60*60*24))
                    if (diff < 0) return `${Math.abs(diff)} dní zpožděno`
                    if (diff === 0) return 'Dnes'
                    if (diff === 1) return 'Zítra'
                    return `Za ${diff} dní`
                  })()}
                </span>
              </span>
              {goals.find(g => g.id === step.goal_id) && (
                <span className="inline-flex items-center space-x-1">
                  <Target className="w-3 h-3" />
                  <span>{goals.find(g => g.id === step.goal_id)?.title}</span>
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2 ml-3">
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleComplete(step.id)
              }}
              title="Dokončit"
              aria-label="Dokončit"
              className="inline-flex items-center justify-center w-8 h-8 bg-primary-600 text-white rounded-md hover:bg-primary-700"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleRemoveFromPlan(step.id)
              }}
              title="Odstranit z plánu"
              aria-label="Odstranit z plánu"
              className="inline-flex items-center justify-center w-8 h-8 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Header stats
  const plannedOverdue = sortedPlannedSteps.filter(s => new Date(s.date) < today).length
  const plannedToday = sortedPlannedSteps.filter(s => {
    const d = new Date(s.date); d.setHours(0,0,0,0); return d.getTime() === today.getTime()
  }).length
  const plannedFuture = sortedPlannedSteps.length - plannedOverdue - plannedToday
  // Progress is based on planned steps only (completed vs total planned)
  const plannedCompleted = plannedAllSteps.filter(s => s.completed).length
  const plannedTotal = plannedAllSteps.length || 1
  const plannedProgress = Math.round((plannedCompleted / plannedTotal) * 100)

  const clearPlan = async () => {
    onPlannedStepsChange?.([])
    try {
      await fetch('/api/cesta/daily-planning', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: today.toISOString().split('T')[0], planned_steps: [] })
      })
    } catch (e) {
      console.error('Error clearing daily plan:', e)
    }
  }

  return (
    <div className="flex-1 bg-background">
      <div className="px-6 py-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Denní plán</h3>
            <div className="mt-2 flex items-center space-x-2">
              <div className="text-xs text-gray-500">{sortedPlannedSteps.length} kroků</div>
              <div className="h-2 w-40 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-2 bg-primary-500 rounded-full transition-all" style={{ width: `${plannedProgress}%` }} />
              </div>
              <div className="text-xs text-gray-500">{plannedProgress}%</div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setEditingStep({
                id: 'new-step',
                user_id: '',
                title: '',
                description: '',
                date: new Date(),
                goal_id: '',
                is_important: false,
                is_urgent: false,
                completed: false,
                created_at: new Date(),
                step_type: 'custom'
              } as DailyStep)}
              title="Přidat krok"
              className="inline-flex items-center justify-center w-8 h-8 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="mt-2 text-xs text-gray-400">Tip: Přetáhněte kroky z pravé strany do plánu</div>
      </div>

      <div className="p-6 space-y-4">
        {/* New step modal */}
        {editingStep?.id === 'new-step' && (
          <div className="mb-4">
            {renderStep(editingStep, -1, true)}
          </div>
        )}

        {/* Planned steps */}
        {sortedPlannedSteps.length > 0 ? (
          <div className="space-y-3">
            {sortedPlannedSteps.map((step, index) => 
              renderStep(step, index, editingStep?.id === step.id)
            )}
          </div>
        ) : (
          <div className="text-center text-gray-600 py-14">
            <div className="text-2xl font-semibold text-primary-700 mb-2">Dobrá práce!</div>
            <p className="text-sm mb-4">Splnili jste všechny dnešní kroky.</p>
            <div className="inline-flex items-center space-x-2 text-sm text-gray-600 bg-white rounded-md border px-3 py-2">
              <Footprints className="w-4 h-4 text-primary-500" />
              <span>Tip pro zbytek dne: krátká procházka, přečíst 5 stran, nebo pár minut reflexe.</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
})

export default DailyPlanningTab
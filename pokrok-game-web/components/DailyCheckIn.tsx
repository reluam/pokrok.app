'use client'

import React, { useState, useEffect, memo, useRef } from 'react'
import { DailyStep, Event, Goal, Value } from '@/lib/cesta-db'
import { Calendar, Target, MapPin, Plus, Check, X, ArrowLeft, Footprints } from 'lucide-react'
import { useTranslations } from '@/lib/use-translations'

interface DailyCheckInProps {
  dailySteps: DailyStep[]
  events: Event[]
  goals: Goal[]
  values: Value[]
  plannedStepIds: string[]
  onStepAdd?: (step: Partial<DailyStep>) => void
  onStepUpdate?: (stepId: string, updates: Partial<DailyStep>) => void
  onStepDelete?: (stepId: string) => void
  onStepComplete?: (stepId: string) => void
  onStepAddToDailyPlan?: (stepId: string) => void
  showAddStepModal?: boolean
  onAddStepModalClose?: () => void
}

const DailyCheckIn = memo(function DailyCheckIn({
  dailySteps,
  events,
  goals,
  values,
  plannedStepIds,
  onStepAdd,
  onStepUpdate,
  onStepDelete,
  onStepComplete,
  onStepAddToDailyPlan,
  showAddStepModal = false,
  onAddStepModalClose
}: DailyCheckInProps) {
  const { translations } = useTranslations()
  const [editingStep, setEditingStep] = useState<DailyStep | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [isDirty, setIsDirty] = useState(false)
  const lastSavedRef = useRef<string>('')

  // Get today's date
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Filter out steps that are already in daily plan
  const availableSteps = dailySteps.filter(step => 
    !step.completed && !plannedStepIds.includes(step.id)
  )

  // Categorize available steps
  const todaySteps = availableSteps.filter(step => {
    const stepDate = new Date(step.date)
    stepDate.setHours(0, 0, 0, 0)
    return stepDate.getTime() === today.getTime()
  })

  const futureSteps = availableSteps.filter(step => {
    const stepDate = new Date(step.date)
    stepDate.setHours(0, 0, 0, 0)
    return stepDate.getTime() > today.getTime()
  })

  const overdueSteps = availableSteps.filter(step => {
    const stepDate = new Date(step.date)
    stepDate.setHours(0, 0, 0, 0)
    return stepDate.getTime() < today.getTime()
  })

  // Sort steps by priority
  const sortSteps = (steps: DailyStep[]) => {
    return steps.sort((a, b) => {
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
  }

  const sortedTodaySteps = sortSteps(todaySteps)
  const sortedFutureSteps = sortSteps(futureSteps)
  const sortedOverdueSteps = sortSteps(overdueSteps)

  // Auto-save functionality
  useEffect(() => {
    if (!editingStep || editingStep.id === 'new-step') return

    const timeoutId = setTimeout(async () => {
      if (onStepUpdate && isDirty) {
        setIsSaving(true)
        setSaveStatus('saving')
        
        try {
          await onStepUpdate(editingStep.id, editingStep)
          setSaveStatus('saved')
          setTimeout(() => setSaveStatus('idle'), 2000)
          lastSavedRef.current = JSON.stringify(editingStep)
          setIsDirty(false)
        } catch (error) {
          console.error('Error saving step:', error)
        } finally {
          setIsSaving(false)
        }
      }
    }, 1000)

    return () => clearTimeout(timeoutId)
  }, [editingStep, onStepUpdate, isDirty])

  const handleStepClick = (step: DailyStep) => {
    setEditingStep(step)
    lastSavedRef.current = JSON.stringify(step)
    setIsDirty(false)
  }

  const handleStepFieldChange = (field: keyof DailyStep, value: any) => {
    if (!editingStep) return
    
    setEditingStep({
      ...editingStep,
      [field]: value
    })
    setIsDirty(true)
  }

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
      
      // Saving from DailyCheckIn should NOT add to daily plan automatically
      await onStepAdd(newStep)
      setEditingStep(null)
      setIsDirty(false)
      onAddStepModalClose?.()
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch (error) {
      console.error('Error creating step:', error)
    } finally {
      setIsSaving(false)
    }
  }


  // Initialize inline add modal with a writable step model
  useEffect(() => {
    if (showAddStepModal) {
      setEditingStep(prev => prev && prev.id === 'new-step' ? prev : {
        id: 'new-step' as any,
        user_id: '' as any,
        title: '',
        description: '',
        date: new Date(),
        goal_id: goals[0]?.id || '',
        is_important: false,
        is_urgent: false,
        completed: false,
        created_at: new Date(),
        step_type: 'custom'
      } as DailyStep)
    }
  }, [showAddStepModal, goals])

  // Auto-save for existing steps, manual save for new steps
  useEffect(() => {
    if (!editingStep || !isDirty || editingStep.id === 'new-step') return

    const timeoutId = setTimeout(async () => {
      setIsSaving(true)
      setSaveStatus('saving')
      
      try {
        // Auto-save existing step
        if (!onStepUpdate) return
        await onStepUpdate(editingStep.id, editingStep)
        setIsDirty(false)
        setSaveStatus('saved')
        setTimeout(() => setSaveStatus('idle'), 2000)
      } catch (error) {
        console.error('Error auto-saving step:', error)
      } finally {
        setIsSaving(false)
      }
    }, 1000)

    return () => clearTimeout(timeoutId)
  }, [editingStep, onStepUpdate, isDirty])

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

  const handleAddToDailyPlan = (stepId: string) => {
    onStepAddToDailyPlan?.(stepId)
  }

  const handleComplete = (stepId: string) => {
    onStepComplete?.(stepId)
  }

  const handleDelete = (stepId: string) => {
    onStepDelete?.(stepId)
  }

  const getStepColor = (step: DailyStep) => {
    const stepDate = new Date(step.date)
    stepDate.setHours(0, 0, 0, 0)
    
    if (stepDate < today) {
      return 'bg-red-50 border-red-200 text-red-800'
    }
    
    return 'bg-primary-50 border-primary-200 text-primary-800'
  }

  const renderStep = (step: DailyStep, isEditing: boolean = false) => {
    const isOverdue = new Date(step.date) < today
    const stepColor = getStepColor(step)
    
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

            {/* Editable controls - properly organized */}
            <div className="space-y-3 pt-3">
              {/* Date */}
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 opacity-70" />
                <input
                  type="date"
                  value={editingStep ? new Date(editingStep.date).toISOString().split('T')[0] : ''}
                  onChange={(e) => handleStepFieldChange('date', new Date(e.target.value))}
                  className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded bg-white"
                />
              </div>
              
              {/* Goal */}
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
              
              {/* Area when no goal selected */}
              {!editingStep?.goal_id && (
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 opacity-70" />
                  <select
                    value={(editingStep as any)?.area_id || ''}
                    onChange={(e) => handleStepFieldChange('area_id' as any, e.target.value)}
                    className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded bg-white"
                  >
                    <option value="">Bez oblasti</option>
                    {(values as any)?.areas?.map?.((a: any) => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
              )}
              
              {/* Importance and Urgency toggles */}
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => handleStepFieldChange('is_important', !editingStep?.is_important)}
                  className={`px-3 py-1 text-xs rounded border ${editingStep?.is_important ? 'bg-yellow-100 border-yellow-300 text-yellow-800' : 'bg-white border-gray-300 text-gray-700'}`}
                >
                  Důležité
                </button>
                <button
                  type="button"
                  onClick={() => handleStepFieldChange('is_urgent', !editingStep?.is_urgent)}
                  className={`px-3 py-1 text-xs rounded border ${editingStep?.is_urgent ? 'bg-red-100 border-red-300 text-red-800' : 'bg-white border-gray-300 text-gray-700'}`}
                >
                  Urgentní
                </button>
              </div>
            </div>

            {/* Action buttons for existing steps - moved to bottom */}
            {step.id !== 'new-step' && (
              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-gray-100">
                <button
                  onClick={() => handleAddToDailyPlan(step.id)}
                  title="Do plánu"
                  aria-label="Do plánu"
                  className="inline-flex items-center justify-center w-8 h-8 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleComplete(step.id)}
                  title="Dokončit"
                  aria-label="Dokončit"
                  className="inline-flex items-center justify-center w-8 h-8 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                >
                  <Check className="w-4 h-4" />
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
        className={`relative rounded-lg p-4 border cursor-pointer transition-all duration-300 hover:shadow-md ${stepColor}`}
        onClick={() => handleStepClick(step)}
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
              {(() => {
                const sDate = new Date(step.date); sDate.setHours(0,0,0,0)
                const isToday = sDate.getTime() === today.getTime()
                if (sDate < today) {
                  return (
                    <span className="text-xs font-medium text-red-700 bg-red-100 rounded-full px-2 py-0.5">
                      Zpožděné
                    </span>
                  )
                }
                return (
                  <span className="text-xs font-medium text-primary-700 bg-primary-100 rounded-full px-2 py-0.5">
                    {isToday ? 'Dnes' : 'Budoucí'}
                  </span>
                )
              })()}
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
                handleAddToDailyPlan(step.id)
              }}
              title="Do plánu"
              aria-label="Do plánu"
              className="inline-flex items-center justify-center w-8 h-8 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
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
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      {/* New step modal */}
      {showAddStepModal && (
        <div className="mb-4">
          {renderStep({
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
          } as DailyStep, true)}
        </div>
      )}

      {/* All steps without section headers */}
      <div className="space-y-2">
        {sortedOverdueSteps.map(step => 
          renderStep(step, editingStep?.id === step.id)
        )}
        {sortedTodaySteps.map(step => 
          renderStep(step, editingStep?.id === step.id)
        )}
        {sortedFutureSteps.map(step => 
          renderStep(step, editingStep?.id === step.id)
        )}
      </div>

      {/* No steps message */}
      {availableSteps.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          <Footprints className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>Žádné další kroky</p>
        </div>
      )}
    </div>
  )
})

export default DailyCheckIn
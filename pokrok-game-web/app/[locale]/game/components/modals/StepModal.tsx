'use client'

import { createPortal } from 'react-dom'
import { useTranslations } from 'next-intl'
import { X, Trash2 } from 'lucide-react'
import { getLocalDateString } from '../utils/dateHelpers'

interface StepModalProps {
  show: boolean
  stepModalData: any
  onClose: () => void
  onSave: () => Promise<void>
  onDelete?: () => Promise<void>
  isSaving: boolean
  goals: any[]
  areas: any[]
  userId: string | null
  player: any
  dailySteps: any[]
  onDailyStepsUpdate?: (steps: any[]) => void
  selectedItem: any
  setSelectedItem: (item: any) => void
  selectedGoalId: string | null
  stepsCacheRef: React.MutableRefObject<Record<string, { data: any[], loaded: boolean }>>
  setStepsCacheVersion: (version: Record<string, number> | ((prev: Record<string, number>) => Record<string, number>)) => void
  checklistSaving: boolean
  setChecklistSaving: (saving: boolean) => void
  checklistSaveTimeoutRef: React.MutableRefObject<NodeJS.Timeout | null>
  lastAddedChecklistItemId: string | null
  setLastAddedChecklistItemId: (id: string | null) => void
  setStepModalData: (data: any) => void
}

export function StepModal({
  show,
  stepModalData,
  onClose,
  onSave,
  onDelete,
  isSaving,
  goals,
  areas,
  userId,
  player,
  dailySteps,
  onDailyStepsUpdate,
  selectedItem,
  setSelectedItem,
  selectedGoalId,
  stepsCacheRef,
  setStepsCacheVersion,
  checklistSaving,
  setChecklistSaving,
  checklistSaveTimeoutRef,
  lastAddedChecklistItemId,
  setLastAddedChecklistItemId,
  setStepModalData,
}: StepModalProps) {
  const t = useTranslations()

  if (!show || typeof window === 'undefined') return null

  const defaultStepData = {
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
    require_checklist_complete: false
  }

  return createPortal(
    <>
      <div 
        className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
        onClick={() => {
          onClose()
          setStepModalData(defaultStepData)
        }}
      >
        <div 
          className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                {stepModalData.id ? t('steps.edit') : t('steps.create')}
              </h2>
              <button
                onClick={() => {
                  onClose()
                  setStepModalData(defaultStepData)
                }}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-1.5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Step Details */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    {t('steps.title')} <span className="text-orange-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={stepModalData.title}
                    onChange={(e) => setStepModalData({...stepModalData, title: e.target.value})}
                    className="w-full px-4 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-600 focus:border-orange-600 transition-all bg-white"
                    placeholder={t('steps.titlePlaceholder')}
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    {t('steps.description')}
                  </label>
                  <textarea
                    value={stepModalData.description}
                    onChange={(e) => setStepModalData({...stepModalData, description: e.target.value})}
                    className="w-full px-4 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-600 focus:border-orange-600 transition-all bg-white resize-none"
                    rows={3}
                    placeholder={t('steps.descriptionPlaceholder')}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      {t('steps.date')}
                    </label>
                    <input
                      type="date"
                      value={stepModalData.date}
                      onChange={(e) => setStepModalData({...stepModalData, date: e.target.value})}
                      className="w-full px-4 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-600 focus:border-orange-600 transition-all bg-white"
                    />
                  </div>

                  {/* Goal selection - only show if no area is selected */}
                  {!stepModalData.areaId && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-2">
                        {t('steps.goal')}
                      </label>
                      <select
                        value={stepModalData.goalId}
                        onChange={(e) => {
                          const newGoalId = e.target.value
                          setStepModalData({
                            ...stepModalData, 
                            goalId: newGoalId,
                            areaId: newGoalId ? '' : stepModalData.areaId // Clear area if goal is selected
                          })
                        }}
                        className="w-full px-4 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-600 focus:border-orange-600 transition-all bg-white"
                      >
                        <option value="">{t('steps.noGoal')}</option>
                        {goals.map((goal: any) => (
                          <option key={goal.id} value={goal.id}>{goal.title}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Area selection - only show if no goal is selected */}
                  {!stepModalData.goalId && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-2">
                        {t('details.goal.area') || 'Oblast'}
                      </label>
                      <select
                        value={stepModalData.areaId || ''}
                        onChange={(e) => {
                          const newAreaId = e.target.value
                          setStepModalData({
                            ...stepModalData, 
                            areaId: newAreaId,
                            goalId: newAreaId ? '' : stepModalData.goalId // Clear goal if area is selected
                          })
                        }}
                        className="w-full px-4 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-600 focus:border-orange-600 transition-all bg-white"
                      >
                        <option value="">{t('details.goal.noArea') || 'Bez oblasti'}</option>
                        {areas.map((area) => (
                          <option key={area.id} value={area.id}>{area.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      {t('steps.estimatedTimeLabel') || 'Estimated time (min)'}
                    </label>
                    <input
                      type="number"
                      value={stepModalData.estimated_time}
                      onChange={(e) => setStepModalData({...stepModalData, estimated_time: parseInt(e.target.value) || 0})}
                      className="w-full px-4 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-600 focus:border-orange-600 transition-all bg-white"
                      min="0"
                    />
                  </div>

                  <div className="flex items-end pb-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={stepModalData.is_important}
                        onChange={(e) => setStepModalData({...stepModalData, is_important: e.target.checked})}
                        className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                      />
                      <span className="text-sm text-gray-700">{t('steps.importantLabel') || '⭐ Important'}</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Right Column - Checklist */}
              <div className="lg:border-l lg:pl-6 border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-semibold text-gray-800 flex items-center gap-2">
                    {t('steps.checklistTitle') || 'Checklist'}
                    {checklistSaving && (
                      <svg className="animate-spin h-4 w-4 text-orange-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    )}
                  </label>
                  <span className="text-xs text-gray-500">
                    {stepModalData.checklist.filter(item => item.completed).length}/{stepModalData.checklist.length} {t('steps.checklistCompleted') || 'completed'}
                  </span>
                </div>
                
                {/* Checklist Items */}
                <div className="space-y-2 max-h-[280px] overflow-y-auto mb-3">
                  {stepModalData.checklist.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <svg className="w-10 h-10 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                      <p className="text-sm">{t('steps.checklistNoItems') || 'No items yet'}</p>
                      <p className="text-xs mt-1">{t('steps.checklistNoItemsDescription') || 'Add sub-tasks for this step'}</p>
                    </div>
                  ) : (
                    stepModalData.checklist.map((item: any, index: number) => (
                      <div 
                        key={item.id} 
                        className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
                          item.completed 
                            ? 'bg-orange-50 border-orange-200' 
                            : 'bg-gray-50 border-gray-200 hover:border-orange-300'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={async () => {
                            const updatedChecklist = [...stepModalData.checklist]
                            updatedChecklist[index] = { ...item, completed: !item.completed }
                            const updatedStepModalData = {...stepModalData, checklist: updatedChecklist}
                            setStepModalData(updatedStepModalData)
                            
                            // Update selectedItem if it's the same step
                            if (selectedItem && selectedItem.id === stepModalData.id) {
                              setSelectedItem({...selectedItem, checklist: updatedChecklist})
                            }
                            
                            // Auto-save if step already exists
                            if (stepModalData.id) {
                              try {
                                const response = await fetch('/api/daily-steps', {
                                  method: 'PUT',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    stepId: stepModalData.id,
                                    checklist: updatedChecklist
                                  })
                                })
                                
                                if (response.ok) {
                                  const updatedStep = await response.json()
                                  
                                  // Update selectedItem with full response
                                  if (selectedItem && selectedItem.id === stepModalData.id) {
                                    setSelectedItem(updatedStep)
                                  }
                                  
                                  // Update dailySteps prop by replacing the updated step
                                  if (dailySteps && onDailyStepsUpdate) {
                                    const updatedDailySteps = dailySteps.map(step => 
                                      step.id === stepModalData.id ? updatedStep : step
                                    )
                                    onDailyStepsUpdate(updatedDailySteps)
                                  } else {
                                    // Fallback: Refresh all steps if dailySteps prop is not available
                                    const currentUserId = userId || player?.user_id
                                    if (currentUserId) {
                                      const stepsResponse = await fetch(`/api/daily-steps?userId=${currentUserId}`)
                                      if (stepsResponse.ok) {
                                        const steps = await stepsResponse.json()
                                        onDailyStepsUpdate?.(steps)
                                      }
                                    }
                                  }
                                  
                                  // Update cache for the goal to force re-render (if on goal detail page)
                                  if (updatedStep.goal_id && selectedGoalId === updatedStep.goal_id) {
                                    // Update cache directly
                                    if (stepsCacheRef.current[updatedStep.goal_id]) {
                                      stepsCacheRef.current[updatedStep.goal_id].data = stepsCacheRef.current[updatedStep.goal_id].data.map(
                                        (s: any) => s.id === stepModalData.id ? updatedStep : s
                                      )
                                    }
                                    // Invalidate cache version to trigger re-render
                                    setStepsCacheVersion((prev: Record<string, number>) => ({
                                      ...prev,
                                      [updatedStep.goal_id]: (prev[updatedStep.goal_id] || 0) + 1
                                    }))
                                  }
                                }
                              } catch (error) {
                                console.error('Error auto-saving checklist:', error)
                              }
                            }
                          }}
                          className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                            item.completed 
                              ? 'bg-orange-500 border-orange-500 text-white' 
                              : 'border-gray-300 hover:border-orange-500'
                          }`}
                        >
                          {item.completed && (
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                        <textarea
                          ref={(el) => {
                            if (el) {
                              // Auto-resize on mount
                              el.style.height = 'auto'
                              el.style.height = `${el.scrollHeight}px`
                              
                              // Focus if this is the newly added item
                              if (item.id === lastAddedChecklistItemId) {
                                el.focus()
                                setLastAddedChecklistItemId(null)
                              }
                            }
                          }}
                          value={item.title}
                          onChange={(e) => {
                            const updatedChecklist = [...stepModalData.checklist]
                            updatedChecklist[index] = { ...item, title: e.target.value }
                            const updatedStepModalData = {...stepModalData, checklist: updatedChecklist}
                            setStepModalData(updatedStepModalData)
                            
                            // Update selectedItem if it's the same step
                            if (selectedItem && selectedItem.id === stepModalData.id) {
                              setSelectedItem({...selectedItem, checklist: updatedChecklist})
                            }
                            
                            // Auto-resize textarea
                            e.target.style.height = 'auto'
                            e.target.style.height = `${Math.max(e.target.scrollHeight, 24)}px`
                            
                            // Debounced auto-save for text changes
                            if (stepModalData.id) {
                              if (checklistSaveTimeoutRef.current) {
                                clearTimeout(checklistSaveTimeoutRef.current)
                              }
                              checklistSaveTimeoutRef.current = setTimeout(async () => {
                                setChecklistSaving(true)
                                try {
                                  const response = await fetch('/api/daily-steps', {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      stepId: stepModalData.id,
                                      checklist: updatedChecklist
                                    })
                                  })
                                  
                                  if (response.ok) {
                                    const updatedStep = await response.json()
                                    
                                    // Update selectedItem with full response
                                    if (selectedItem && selectedItem.id === stepModalData.id) {
                                      setSelectedItem(updatedStep)
                                    }
                                    
                                    // Update dailySteps prop by replacing the updated step
                                    if (dailySteps && onDailyStepsUpdate) {
                                      const updatedDailySteps = dailySteps.map(step => 
                                        step.id === stepModalData.id ? updatedStep : step
                                      )
                                      onDailyStepsUpdate(updatedDailySteps)
                                    } else {
                                      // Fallback: Refresh all steps if dailySteps prop is not available
                                      const currentUserId = userId || player?.user_id
                                      if (currentUserId) {
                                        const stepsResponse = await fetch(`/api/daily-steps?userId=${currentUserId}`)
                                        if (stepsResponse.ok) {
                                          const steps = await stepsResponse.json()
                                          onDailyStepsUpdate?.(steps)
                                        }
                                      }
                                    }
                                    
                                    // Update cache for the goal to force re-render (if on goal detail page)
                                    if (updatedStep.goal_id && selectedGoalId === updatedStep.goal_id) {
                                      // Update cache directly
                                      if (stepsCacheRef.current[updatedStep.goal_id]) {
                                        stepsCacheRef.current[updatedStep.goal_id].data = stepsCacheRef.current[updatedStep.goal_id].data.map(
                                          (s: any) => s.id === stepModalData.id ? updatedStep : s
                                        )
                                      }
                                      // Invalidate cache version to trigger re-render
                                      setStepsCacheVersion((prev: Record<string, number>) => ({
                                        ...prev,
                                        [updatedStep.goal_id]: (prev[updatedStep.goal_id] || 0) + 1
                                      }))
                                    }
                                  }
                                } catch (error) {
                                  console.error('Error auto-saving checklist:', error)
                                } finally {
                                  setChecklistSaving(false)
                                }
                              }, 500)
                            }
                          }}
                          onKeyDown={(e) => {
                            // Prevent Enter from submitting the form
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault()
                            }
                          }}
                          rows={1}
                          className={`flex-1 bg-transparent text-sm border-none focus:ring-0 p-0 resize-none overflow-hidden min-h-[24px] ${
                            item.completed ? 'line-through text-gray-500' : 'text-gray-800'
                          }`}
                          placeholder={t('steps.checklistItemPlaceholder') || 'Item name...'}
                          style={{ height: 'auto', minHeight: '24px' }}
                        />
                        <button
                          type="button"
                          onClick={async () => {
                            const updatedChecklist = stepModalData.checklist.filter((_: any, i: number) => i !== index)
                            setStepModalData({...stepModalData, checklist: updatedChecklist})
                            
                            // Auto-save deletion if step already exists
                            if (stepModalData.id) {
                              setChecklistSaving(true)
                              try {
                                await fetch('/api/daily-steps', {
                                  method: 'PUT',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    stepId: stepModalData.id,
                                    checklist: updatedChecklist
                                  })
                                })
                                const currentUserId = userId || player?.user_id
                                if (currentUserId) {
                                  const stepsResponse = await fetch(`/api/daily-steps?userId=${currentUserId}`)
                                  if (stepsResponse.ok) {
                                    const steps = await stepsResponse.json()
                                    onDailyStepsUpdate?.(steps)
                                  }
                                }
                              } catch (error) {
                                console.error('Error auto-saving checklist:', error)
                              } finally {
                                setChecklistSaving(false)
                              }
                            }
                          }}
                          className="flex-shrink-0 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
                
                {/* Add New Checklist Item */}
                <button
                  type="button"
                  onClick={() => {
                    const newItem = {
                      id: crypto.randomUUID(),
                      title: '',
                      completed: false
                    }
                    setLastAddedChecklistItemId(newItem.id)
                    setStepModalData({
                      ...stepModalData, 
                      checklist: [...stepModalData.checklist, newItem]
                    })
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-xl transition-colors border-2 border-dashed border-orange-200"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  {t('steps.checklistAddItem') || 'Add item'}
                </button>
                
                {/* Require checklist complete option */}
                {stepModalData.checklist.length > 0 && (
                  <label className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={stepModalData.require_checklist_complete}
                      onChange={(e) => setStepModalData({...stepModalData, require_checklist_complete: e.target.checked})}
                      className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                    />
                    <span className="text-xs text-gray-600">{t('steps.checklistRequireComplete') || 'Require all items to be completed before finishing the step'}</span>
                  </label>
                )}
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-gray-200 flex items-center justify-between gap-3">
            {stepModalData.id && onDelete && (
              <button
                onClick={onDelete}
                disabled={isSaving}
                className="px-4 py-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4" />
                {t('common.delete') || 'Smazat'}
              </button>
            )}
            <div className="flex items-center gap-3 ml-auto">
              <button
                onClick={() => {
                  onClose()
                  setStepModalData(defaultStepData)
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                disabled={isSaving}
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={onSave}
                disabled={isSaving || (!userId && !player?.user_id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  isSaving || (!userId && !player?.user_id)
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-orange-600 text-white hover:bg-orange-700'
                }`}
              >
                {isSaving ? (
                  <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {t('common.saving')}
                  </>
                ) : t('common.save')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body
  )
}


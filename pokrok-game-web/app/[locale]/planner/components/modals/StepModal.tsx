'use client'

import { createPortal } from 'react-dom'
import { useTranslations, useLocale } from 'next-intl'
import { useState, useEffect } from 'react'
import { X, Trash2, ChevronDown, Copy } from 'lucide-react'
import { getLocalDateString } from '../utils/dateHelpers'
import { PlayfulButton } from '@/components/design-system/Button/PlayfulButton'

interface StepModalProps {
  show: boolean
  stepModalData: any
  onClose: () => void
  onSave: () => Promise<void>
  onDelete?: () => Promise<void>
  onFinishRecurring?: () => Promise<void>
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
  onFinishRecurring,
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
  const locale = useLocale()
  const localeCode = locale === 'cs' ? 'cs-CZ' : 'en-US'
  
  
  // State for date pickers
  const [startDatePickerOpen, setStartDatePickerOpen] = useState(false)
  const [startDatePickerPosition, setStartDatePickerPosition] = useState<{ top: number; left: number } | null>(null)
  const [startDatePickerMonth, setStartDatePickerMonth] = useState(new Date())
  const [selectedStartDate, setSelectedStartDate] = useState<Date | null>(null)
  
  const [endDatePickerOpen, setEndDatePickerOpen] = useState(false)
  const [endDatePickerPosition, setEndDatePickerPosition] = useState<{ top: number; left: number } | null>(null)
  const [endDatePickerMonth, setEndDatePickerMonth] = useState(new Date())
  const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(null)

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
    require_checklist_complete: false,
    isRepeating: false,
    frequency: null,
    selected_days: [],
    recurring_start_date: null,
    recurring_end_date: null,
    recurring_display_mode: 'next_only'
  }

  return createPortal(
    <>
      <div 
        className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4"
        onClick={() => {
          onClose()
          setStepModalData(defaultStepData)
        }}
      >
        <div 
          className="box-playful-highlight bg-white max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 border-b-2 border-primary-500">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-black font-playful">
                {stepModalData.id ? t('steps.edit') : t('steps.create')}
              </h2>
              <div className="flex items-center gap-2">
                {stepModalData.id && (
                  <button
                    onClick={() => {
                      // Duplicate the step - copy all properties but reset id and completion
                      const duplicatedData = {
                        ...stepModalData,
                        id: null, // New step - this is critical for creating new step
                        title: `${stepModalData.title} - duplicate`,
                        completed: false, // Reset completion status
                        date: stepModalData.date || getLocalDateString(new Date()), // Use current date if no date set
                        // Reset recurring step properties if it was a recurring step
                        isRepeating: false, // Don't duplicate as recurring step
                        frequency: null,
                        selected_days: [],
                        recurring_start_date: null,
                        recurring_end_date: null,
                        recurring_display_mode: 'next_only'
                      }
                      setStepModalData(duplicatedData)
                      // Modal stays open with duplicated data for editing
                    }}
                    className="btn-playful-base p-1.5 w-8 h-8 flex items-center justify-center"
                    title={t('steps.duplicate') || 'Duplikovat krok'}
                  >
                    <Copy className="w-5 h-5 text-black" />
                  </button>
                )}
              <button
                onClick={() => {
                  onClose()
                  setStepModalData(defaultStepData)
                }}
                className="btn-playful-base p-1.5 w-8 h-8 flex items-center justify-center"
              >
                <X className="w-5 h-5 text-black" />
              </button>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Step Details */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-black mb-2 font-playful">
                    {t('steps.title')} <span className="text-primary-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={stepModalData.title}
                    onChange={(e) => setStepModalData({...stepModalData, title: e.target.value})}
                    className="w-full px-4 py-2.5 text-sm border-2 border-primary-500 rounded-playful-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white text-black"
                    placeholder={t('steps.titlePlaceholder')}
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black mb-2 font-playful">
                    {t('steps.description')}
                  </label>
                  <textarea
                    value={stepModalData.description}
                    onChange={(e) => setStepModalData({...stepModalData, description: e.target.value})}
                    className="w-full px-4 py-2.5 text-sm border-2 border-primary-500 rounded-playful-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white resize-none text-black"
                    rows={3}
                    placeholder={t('steps.descriptionPlaceholder')}
                  />
                </div>

                {/* Goal and Area - side by side, always visible */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Area selection - left side */}
                  <div>
                    <label className="block text-sm font-semibold text-black mb-2 font-playful">
                      {t('details.goal.area') || 'Oblast'}
                    </label>
                    {stepModalData.goalId ? (
                      // If goal is selected, show area as read-only (locked)
                      <div className="w-full px-4 py-2.5 text-sm border-2 border-primary-300 rounded-playful-md bg-gray-100 text-gray-600">
                        {(() => {
                          const selectedGoal = goals.find((g: any) => g.id === stepModalData.goalId)
                          const goalArea = selectedGoal?.area_id ? areas.find((a: any) => a.id === selectedGoal.area_id) : null
                          return goalArea ? goalArea.name : (t('details.goal.noArea') || 'Bez oblasti')
                        })()}
                      </div>
                    ) : (
                      // If no goal is selected, allow area selection
                      <select
                        value={stepModalData.areaId || ''}
                        onChange={(e) => {
                          const newAreaId = e.target.value
                          setStepModalData({
                            ...stepModalData, 
                            areaId: newAreaId
                          })
                        }}
                      className="w-full px-4 py-2.5 text-sm border-2 border-primary-500 rounded-playful-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white text-black"
                      >
                        <option value="">{t('details.goal.noArea') || 'Bez oblasti'}</option>
                        {areas.map((area) => (
                          <option key={area.id} value={area.id}>{area.name}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Goal selection - right side */}
                    <div>
                      <label className="block text-sm font-semibold text-black mb-2 font-playful">
                        {t('steps.goal')}
                      </label>
                      <select
                      value={stepModalData.goalId || ''}
                        onChange={(e) => {
                          const newGoalId = e.target.value
                        const selectedGoal = goals.find((g: any) => g.id === newGoalId)
                          setStepModalData({
                            ...stepModalData, 
                            goalId: newGoalId,
                          // Automatically set area from goal if goal is selected
                          // If goal is cleared, keep area only if it was manually selected (not from previous goal)
                          areaId: selectedGoal?.area_id || (newGoalId === '' ? stepModalData.areaId : '')
                          })
                        }}
                        className="w-full px-4 py-2.5 text-sm border-2 border-primary-500 rounded-playful-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white text-black"
                      >
                        <option value="">{t('steps.noGoal')}</option>
                      {/* Show all goals (not filtered by area) when goal is selected, filter when no goal */}
                      {(stepModalData.goalId || !stepModalData.areaId
                        ? goals
                        : goals.filter((goal: any) => goal.area_id === stepModalData.areaId)
                      ).map((goal: any) => (
                          <option key={goal.id} value={goal.id}>{goal.title}</option>
                        ))}
                      </select>
                    </div>
                </div>

                {/* Date and Repeating - with background box */}
                <div className="bg-primary-50 rounded-playful-md p-4 border-2 border-primary-200">
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <label className="block text-sm font-semibold text-black mb-2 font-playful">
                        {t('steps.repeating')}
                      </label>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={stepModalData.isRepeating || false}
                        onClick={() => {
                          const isRepeating = !stepModalData.isRepeating
                          setStepModalData({
                            ...stepModalData,
                            isRepeating,
                            frequency: isRepeating ? (stepModalData.frequency || 'daily') : null,
                            selected_days: isRepeating ? (stepModalData.selected_days || []) : []
                          })
                        }}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                          stepModalData.isRepeating ? 'bg-primary-500' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            stepModalData.isRepeating ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-semibold text-black mb-2 font-playful">
                        {t('steps.date')}
                      </label>
                      {!stepModalData.isRepeating ? (
                        <input
                          type="date"
                          value={stepModalData.date}
                          onChange={(e) => setStepModalData({...stepModalData, date: e.target.value})}
                          className="w-full px-4 py-2.5 text-sm border-2 border-primary-500 rounded-playful-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white text-black"
                        />
                      ) : (
                      <select
                          value={stepModalData.frequency || 'daily'}
                        onChange={(e) => {
                            const frequency = e.target.value as 'daily' | 'weekly' | 'monthly'
                          setStepModalData({
                            ...stepModalData, 
                              frequency,
                              selected_days: frequency === 'daily' ? [] : (stepModalData.selected_days || [])
                          })
                        }}
                        className="w-full px-4 py-2.5 text-sm border-2 border-primary-500 rounded-playful-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white text-black"
                      >
                          <option value="daily">{t('habits.frequency.daily') || 'Denně'}</option>
                          <option value="weekly">{t('habits.frequency.weekly') || 'Týdně'}</option>
                          <option value="monthly">{t('habits.frequency.monthly') || 'Měsíčně'}</option>
                      </select>
                      )}
                    </div>
                  </div>
                  
                  {/* Selected days for weekly - shown below when frequency is weekly */}
                  {stepModalData.isRepeating && stepModalData.frequency === 'weekly' && (
                    <div className="mt-3 pt-3 border-t-2 border-primary-200">
                      <label className="block text-xs font-semibold text-black mb-2 font-playful">
                        {t('habits.selectDaysOfWeek') || 'Vyberte dny v týdnu'}
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => {
                          const dayLabels: { [key: string]: string } = {
                            monday: 'Po',
                            tuesday: 'Út',
                            wednesday: 'St',
                            thursday: 'Čt',
                            friday: 'Pá',
                            saturday: 'So',
                            sunday: 'Ne'
                          }
                          const selectedDays = stepModalData.selected_days || []
                          const isSelected = selectedDays.includes(day)
                          return (
                            <button
                              key={day}
                              type="button"
                              onClick={() => {
                                const newDays = isSelected
                                  ? selectedDays.filter((d: string) => d !== day)
                                  : [...selectedDays, day]
                                setStepModalData({
                                  ...stepModalData,
                                  selected_days: newDays
                                })
                              }}
                              className={`px-3 py-1.5 rounded-playful-sm font-medium transition-colors border-2 ${
                                isSelected
                                  ? 'bg-primary-500 text-white border-primary-500'
                                  : 'bg-white text-black border-primary-500 hover:bg-primary-50'
                              }`}
                            >
                              {dayLabels[day]}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                  
                  {/* Selected days for monthly - shown below when frequency is monthly */}
                  {stepModalData.isRepeating && stepModalData.frequency === 'monthly' && (
                    <div className="mt-3 pt-3 border-t-2 border-primary-200">
                      <label className="block text-xs font-semibold text-black mb-2 font-playful">
                        {t('habits.selectDaysOfMonth') || 'Vyberte dny v měsíci'}
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {Array.from({ length: 31 }, (_, i) => i + 1).map(day => {
                          const dayStr = day.toString()
                          const selectedDays = stepModalData.selected_days || []
                          const isSelected = selectedDays.includes(dayStr)
                          return (
                            <button
                              key={day}
                              type="button"
                              onClick={() => {
                                const newDays = isSelected
                                  ? selectedDays.filter((d: string) => d !== dayStr)
                                  : [...selectedDays, dayStr]
                                setStepModalData({
                                  ...stepModalData,
                                  selected_days: newDays
                                })
                              }}
                              className={`px-2 py-1 text-xs rounded-playful-sm border-2 transition-all ${
                                isSelected
                                  ? 'bg-primary-500 text-black border-primary-500'
                                  : 'bg-white text-black border-primary-500 hover:bg-primary-50'
                              }`}
                            >
                              {day}.
                            </button>
                          )
                        })}
                </div>
                    </div>
                  )}
                  
                  {/* Recurring options - Start date, End date, Display mode */}
                  {stepModalData.isRepeating && (
                    <div className="mt-4 pt-4 border-t-2 border-primary-200 space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        {/* Start Date */}
                        <div>
                          <label className="block text-xs font-semibold text-black mb-2 font-playful">
                            {t('steps.recurring.startDate') || 'Začátek opakování'}
                          </label>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              const rect = (e.target as HTMLElement).getBoundingClientRect()
                              const top = Math.min(rect.bottom + 5, window.innerHeight - 380)
                              const left = Math.min(rect.left, window.innerWidth - 250)
                              setStartDatePickerPosition({ top, left })
                              setStartDatePickerOpen(true)
                              const currentDate = stepModalData.recurring_start_date 
                                ? new Date(stepModalData.recurring_start_date)
                                : new Date()
                              setSelectedStartDate(currentDate)
                              setStartDatePickerMonth(new Date(currentDate))
                            }}
                            className="w-full px-3 py-2 text-sm border-2 border-primary-500 rounded-playful-md bg-white text-black text-left hover:bg-primary-50"
                          >
                            {stepModalData.recurring_start_date 
                              ? new Date(stepModalData.recurring_start_date).toLocaleDateString(localeCode, { day: 'numeric', month: 'numeric', year: 'numeric' })
                              : new Date().toLocaleDateString(localeCode, { day: 'numeric', month: 'numeric', year: 'numeric' })
                            }
                          </button>
                        </div>
                        
                        {/* End Date */}
                        <div>
                          <label className="block text-xs font-semibold text-black mb-2 font-playful">
                            {t('steps.recurring.endDate') || 'Konec opakování'}
                          </label>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              const rect = (e.target as HTMLElement).getBoundingClientRect()
                              const top = Math.min(rect.bottom + 5, window.innerHeight - 380)
                              const left = Math.min(rect.left, window.innerWidth - 250)
                              setEndDatePickerPosition({ top, left })
                              setEndDatePickerOpen(true)
                              const currentDate = stepModalData.recurring_end_date 
                                ? new Date(stepModalData.recurring_end_date)
                                : new Date()
                              setSelectedEndDate(stepModalData.recurring_end_date ? currentDate : null)
                              setEndDatePickerMonth(stepModalData.recurring_end_date ? new Date(currentDate) : new Date())
                            }}
                            className="w-full px-3 py-2 text-sm border-2 border-primary-500 rounded-playful-md bg-white text-black text-left hover:bg-primary-50"
                          >
                            {stepModalData.recurring_end_date 
                              ? new Date(stepModalData.recurring_end_date).toLocaleDateString(localeCode, { day: 'numeric', month: 'numeric', year: 'numeric' })
                              : (t('steps.recurring.never') || 'Nikdy')
                            }
                          </button>
                        </div>
                      </div>
                      
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-black mb-2 font-playful">
                      {t('steps.estimatedTimeLabel') || 'Estimated time (min)'}
                    </label>
                    <input
                      type="number"
                      value={stepModalData.estimated_time}
                      onChange={(e) => setStepModalData({...stepModalData, estimated_time: parseInt(e.target.value) || 0})}
                      className="w-full px-4 py-2.5 text-sm border-2 border-primary-500 rounded-playful-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white text-black"
                      min="0"
                    />
                  </div>

                  <div className="flex items-end pb-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={stepModalData.is_important}
                        onChange={(e) => setStepModalData({...stepModalData, is_important: e.target.checked})}
                        className="w-5 h-5 text-primary-600 border-2 border-primary-500 rounded-playful-sm focus:ring-primary-500"
                      />
                      <span className="text-sm text-black font-semibold">{t('steps.importantLabel') || '⭐ Important'}</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Right Column - Checklist */}
              <div className="lg:border-l-2 lg:pl-6 border-primary-500">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-semibold text-black flex items-center gap-2 font-playful">
                    {t('steps.checklistTitle') || 'Checklist'}
                    {checklistSaving && (
                      <svg className="animate-spin h-4 w-4 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    )}
                  </label>
                  <span className="text-xs text-gray-600 font-semibold">
                    {stepModalData.checklist.filter((item: any) => item.completed).length}/{stepModalData.checklist.length} {t('steps.checklistCompleted') || 'completed'}
                  </span>
                </div>
                
                {/* Checklist Items */}
                <div className="space-y-2 max-h-[280px] overflow-y-auto mb-3 pr-2 pb-2">
                  {stepModalData.checklist.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <svg className="w-10 h-10 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                      <p className="text-sm font-semibold">{t('steps.checklistNoItems') || 'No items yet'}</p>
                      <p className="text-xs mt-1">{t('steps.checklistNoItemsDescription') || 'Add sub-tasks for this step'}</p>
                    </div>
                  ) : (
                    stepModalData.checklist.map((item: any, index: number) => (
                      <div 
                        key={item.id} 
                        className={`box-playful-highlight flex items-start gap-3 p-3 ${
                          item.completed ? 'opacity-60' : ''
                        }`}
                        style={{ marginRight: '4px', marginBottom: '4px' }}
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
                          className={`flex-shrink-0 w-5 h-5 rounded-playful-sm border-2 flex items-center justify-center transition-colors ${
                            item.completed 
                              ? 'bg-white border-primary-500 text-black' 
                              : 'border-primary-500 hover:bg-primary-50'
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
                            item.completed ? 'line-through text-gray-500' : 'text-black'
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
                          className="flex-shrink-0 text-gray-500 hover:text-red-600 transition-colors btn-playful-base p-1 w-6 h-6 flex items-center justify-center"
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
                  className="btn-playful-base w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-primary-600 bg-white hover:bg-primary-50"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  {t('steps.checklistAddItem') || 'Add item'}
                </button>
                
                {/* Require checklist complete option */}
                {stepModalData.checklist.length > 0 && (
                  <label className="flex items-center gap-2 mt-3 pt-3 border-t-2 border-primary-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={stepModalData.require_checklist_complete}
                      onChange={(e) => setStepModalData({...stepModalData, require_checklist_complete: e.target.checked})}
                      className="w-5 h-5 text-primary-600 border-2 border-primary-500 rounded-playful-sm focus:ring-primary-500"
                    />
                    <span className="text-xs text-black font-semibold">{t('steps.checklistRequireComplete') || 'Require all items to be completed before finishing the step'}</span>
                  </label>
                )}
              </div>
            </div>
          </div>

          <div className="p-6 border-t-2 border-primary-500 flex items-center justify-between gap-3">
            {stepModalData.id && onDelete ? (
              <button
                onClick={onDelete}
                disabled={isSaving}
                className="btn-playful-danger px-4 py-2 text-sm font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4" />
                {t('common.delete') || 'Smazat'}
              </button>
            ) : (
              <div></div>
            )}
            <div className="flex items-center gap-3 ml-auto">
              {/* Finish Recurring button - show for recurring steps, between Save and Cancel */}
              {stepModalData.id && stepModalData.frequency && stepModalData.frequency !== null && onFinishRecurring && (
                <button
                  onClick={onFinishRecurring}
                  disabled={isSaving}
                  className="btn-playful-base px-4 py-2 text-sm font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed bg-primary-500 text-white hover:bg-primary-600 border-2 border-primary-600"
                >
                  <X className="w-4 h-4" />
                  {t('steps.finishRecurring')}
                </button>
              )}
              <button
                onClick={() => {
                  onClose()
                  setStepModalData(defaultStepData)
                }}
                className="btn-playful-base px-4 py-2 bg-white text-primary-600 hover:bg-primary-50 text-sm font-semibold"
                disabled={isSaving}
              >
                {t('common.cancel')}
              </button>
              <PlayfulButton
                onClick={() => {
                  // Validate title before saving
                  if (!stepModalData.title || !stepModalData.title.trim()) {
                    alert(t('steps.titleRequired') || 'Název kroku je povinný')
                    return
                  }
                  
                  onSave()
                }}
                disabled={(() => {
                  const isSavingDisabled = isSaving
                  // Check if we have userId from either prop or player (player has 'id' property, not 'user_id')
                  const effectiveUserId = userId || player?.id || player?.user_id
                  const isUserIdDisabled = !effectiveUserId
                  const titleValue = stepModalData.title
                  const titleTrimmed = titleValue?.trim()
                  const isTitleDisabled = !titleTrimmed
                  const isDisabled = isSavingDisabled || isUserIdDisabled || isTitleDisabled
                  
                  return isDisabled
                })()}
                variant="primary"
                size="md"
                loading={isSaving}
                loadingText={t('common.saving')}
              >
                {t('common.save')}
              </PlayfulButton>
            </div>
          </div>
        </div>
      </div>
      
      {/* Start Date Picker Modal */}
      {startDatePickerOpen && startDatePickerPosition && (
        <>
          <div 
            className="fixed inset-0 z-40"
            onClick={() => {
              setStartDatePickerOpen(false)
              setStartDatePickerPosition(null)
            }}
          />
          <div 
            className="fixed z-50 box-playful-highlight p-4 bg-white"
            style={{
              top: `${Math.min(startDatePickerPosition.top, window.innerHeight - 380)}px`,
              left: `${Math.min(Math.max(startDatePickerPosition.left - 100, 10), window.innerWidth - 250)}px`,
              width: '230px'
            }}
          >
            <div className="text-sm font-bold text-black mb-3 font-playful">{t('steps.recurring.startDate') || 'Začátek opakování'}</div>
            
            {/* Day names */}
            <div className="grid grid-cols-7 gap-0.5 mb-1">
              {locale === 'cs' 
                ? ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'].map(day => (
                    <div key={day} className="text-center text-xs text-gray-600 font-medium py-1">
                      {day}
                </div>
                  ))
                : ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(day => (
                    <div key={day} className="text-center text-xs text-gray-600 font-medium py-1">
                      {day}
            </div>
                  ))
              }
          </div>
            
            {/* Calendar days */}
            <div className="grid grid-cols-7 gap-0.5 mb-3">
              {(() => {
                const year = startDatePickerMonth.getFullYear()
                const month = startDatePickerMonth.getMonth()
                const firstDay = new Date(year, month, 1)
                const lastDay = new Date(year, month + 1, 0)
                const startDay = (firstDay.getDay() + 6) % 7 // Monday = 0
                const days: (Date | null)[] = []
                
                // Empty cells before first day
                for (let i = 0; i < startDay; i++) {
                  days.push(null)
                }
                
                // Days of month
                for (let d = 1; d <= lastDay.getDate(); d++) {
                  days.push(new Date(year, month, d))
                }
                
                const today = new Date()
                today.setHours(0, 0, 0, 0)
                const selectedDate = selectedStartDate ? new Date(selectedStartDate) : null
                if (selectedDate) selectedDate.setHours(0, 0, 0, 0)
                
                return days.map((day, i) => {
                  if (!day) {
                    return <div key={`empty-${i}`} className="w-7 h-7" />
                  }
                  
                  const isToday = day.getTime() === today.getTime()
                  const isSelected = selectedDate && day.getTime() === selectedDate.getTime()
                  
                  return (
                    <button
                      key={day.getTime()}
                      onClick={() => setSelectedStartDate(day)}
                      className={`w-7 h-7 rounded-playful-sm text-xs font-medium transition-colors border-2 ${
                        isSelected
                          ? 'bg-white text-black font-bold border-primary-500'
                          : isToday
                            ? 'bg-primary-100 text-primary-600 font-bold border-primary-500'
                            : 'hover:bg-primary-50 text-black border-gray-300'
                      }`}
                    >
                      {day.getDate()}
                    </button>
                  )
                })
              })()}
            </div>
            
            {/* Month navigation */}
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() => {
                  const newMonth = new Date(startDatePickerMonth)
                  newMonth.setMonth(newMonth.getMonth() - 1)
                  setStartDatePickerMonth(newMonth)
                }}
                className="p-1 hover:bg-primary-50 rounded-playful-sm border-2 border-primary-500 transition-colors"
              >
                <ChevronDown className="w-4 h-4 rotate-90 text-black" />
              </button>
              <span className="text-xs font-semibold text-black">
                {startDatePickerMonth.toLocaleDateString(localeCode, { month: 'long', year: 'numeric' })}
              </span>
              <button
                onClick={() => {
                  const newMonth = new Date(startDatePickerMonth)
                  newMonth.setMonth(newMonth.getMonth() + 1)
                  setStartDatePickerMonth(newMonth)
                }}
                className="p-1 hover:bg-primary-50 rounded-playful-sm border-2 border-primary-500 transition-colors"
              >
                <ChevronDown className="w-4 h-4 -rotate-90 text-black" />
              </button>
            </div>
            
            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (selectedStartDate) {
                    setStepModalData({
                      ...stepModalData,
                      recurring_start_date: getLocalDateString(selectedStartDate)
                    })
                  }
                  setStartDatePickerOpen(false)
                  setStartDatePickerPosition(null)
                }}
                className="btn-playful-base flex-1 px-3 py-1.5 bg-white text-black text-xs font-semibold hover:bg-primary-50"
              >
                {t('common.save') || 'Uložit'}
              </button>
              <button
                onClick={() => {
                  setStartDatePickerOpen(false)
                  setStartDatePickerPosition(null)
                }}
                className="btn-playful-base px-3 py-1.5 bg-white text-black text-xs font-semibold hover:bg-primary-50"
              >
                {t('common.cancel') || 'Zrušit'}
              </button>
            </div>
          </div>
        </>
      )}
      
      {/* End Date Picker Modal */}
      {endDatePickerOpen && endDatePickerPosition && (
        <>
          <div 
            className="fixed inset-0 z-40"
            onClick={() => {
              setEndDatePickerOpen(false)
              setEndDatePickerPosition(null)
            }}
          />
          <div 
            className="fixed z-50 box-playful-highlight p-4 bg-white"
            style={{
              top: `${Math.min(endDatePickerPosition.top, window.innerHeight - 380)}px`,
              left: `${Math.min(Math.max(endDatePickerPosition.left - 100, 10), window.innerWidth - 250)}px`,
              width: '230px'
            }}
          >
            <div className="text-sm font-bold text-black mb-3 font-playful">{t('steps.recurring.endDate') || 'Konec opakování'}</div>
            
            {/* Day names */}
            <div className="grid grid-cols-7 gap-0.5 mb-1">
              {locale === 'cs' 
                ? ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'].map(day => (
                    <div key={day} className="text-center text-xs text-gray-600 font-medium py-1">
                      {day}
                </div>
                  ))
                : ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(day => (
                    <div key={day} className="text-center text-xs text-gray-600 font-medium py-1">
                      {day}
            </div>
                  ))
              }
          </div>
            
            {/* Calendar days */}
            <div className="grid grid-cols-7 gap-0.5 mb-3">
              {(() => {
                const year = endDatePickerMonth.getFullYear()
                const month = endDatePickerMonth.getMonth()
                const firstDay = new Date(year, month, 1)
                const lastDay = new Date(year, month + 1, 0)
                const startDay = (firstDay.getDay() + 6) % 7 // Monday = 0
                const days: (Date | null)[] = []
                
                // Empty cells before first day
                for (let i = 0; i < startDay; i++) {
                  days.push(null)
                }
                
                // Days of month
                for (let d = 1; d <= lastDay.getDate(); d++) {
                  days.push(new Date(year, month, d))
                }
                
                const today = new Date()
                today.setHours(0, 0, 0, 0)
                const selectedDate = selectedEndDate ? new Date(selectedEndDate) : null
                if (selectedDate) selectedDate.setHours(0, 0, 0, 0)
                
                return days.map((day, i) => {
                  if (!day) {
                    return <div key={`empty-${i}`} className="w-7 h-7" />
                  }
                  
                  const isToday = day.getTime() === today.getTime()
                  const isSelected = selectedDate && day.getTime() === selectedDate.getTime()
                  
                  return (
                    <button
                      key={day.getTime()}
                      onClick={() => setSelectedEndDate(day)}
                      className={`w-7 h-7 rounded-playful-sm text-xs font-medium transition-colors border-2 ${
                        isSelected
                          ? 'bg-white text-black font-bold border-primary-500'
                          : isToday
                            ? 'bg-primary-100 text-primary-600 font-bold border-primary-500'
                            : 'hover:bg-primary-50 text-black border-gray-300'
                      }`}
                    >
                      {day.getDate()}
                    </button>
                  )
                })
              })()}
            </div>
            
            {/* Month navigation */}
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() => {
                  const newMonth = new Date(endDatePickerMonth)
                  newMonth.setMonth(newMonth.getMonth() - 1)
                  setEndDatePickerMonth(newMonth)
                }}
                className="p-1 hover:bg-primary-50 rounded-playful-sm border-2 border-primary-500 transition-colors"
              >
                <ChevronDown className="w-4 h-4 rotate-90 text-black" />
              </button>
              <span className="text-xs font-semibold text-black">
                {endDatePickerMonth.toLocaleDateString(localeCode, { month: 'long', year: 'numeric' })}
              </span>
              <button
                onClick={() => {
                  const newMonth = new Date(endDatePickerMonth)
                  newMonth.setMonth(newMonth.getMonth() + 1)
                  setEndDatePickerMonth(newMonth)
                }}
                className="p-1 hover:bg-primary-50 rounded-playful-sm border-2 border-primary-500 transition-colors"
              >
                <ChevronDown className="w-4 h-4 -rotate-90 text-black" />
              </button>
            </div>
            
            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (selectedEndDate) {
                    setStepModalData({
                      ...stepModalData,
                      recurring_end_date: getLocalDateString(selectedEndDate)
                    })
                  }
                  setEndDatePickerOpen(false)
                  setEndDatePickerPosition(null)
                }}
                className="btn-playful-base flex-1 px-3 py-1.5 bg-white text-black text-xs font-semibold hover:bg-primary-50"
              >
                {t('common.save') || 'Uložit'}
              </button>
              <button
                onClick={() => {
                  setEndDatePickerOpen(false)
                  setEndDatePickerPosition(null)
                }}
                className="btn-playful-base px-3 py-1.5 bg-white text-black text-xs font-semibold hover:bg-primary-50"
              >
                {t('common.cancel') || 'Zrušit'}
              </button>
              <button
                onClick={() => {
                  setStepModalData({
                    ...stepModalData,
                    recurring_end_date: null
                  })
                  setEndDatePickerOpen(false)
                  setEndDatePickerPosition(null)
                }}
                className="btn-playful-base px-3 py-1.5 bg-white text-black text-xs font-semibold hover:bg-primary-50"
              >
                {t('steps.recurring.never') || 'Nikdy'}
              </button>
            </div>
          </div>
        </>
      )}
    </>,
    document.body
  )
}


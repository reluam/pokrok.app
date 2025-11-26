'use client'

import { useState, useMemo, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useTranslations, useLocale } from 'next-intl'
import { Edit, X, Plus, Calendar, Target, Check, Filter, ChevronDown, ChevronUp } from 'lucide-react'
import { getLocalDateString } from '../utils/dateHelpers'

interface StepsManagementViewProps {
  dailySteps: any[]
  goals: any[]
  onDailyStepsUpdate?: (steps: any[]) => void
  userId?: string | null
  player?: any
}

export function StepsManagementView({
  dailySteps = [],
  goals = [],
  onDailyStepsUpdate,
  userId,
  player
}: StepsManagementViewProps) {
  const t = useTranslations()
  const localeCode = useLocale()
  
  // Filters
  const [showCompleted, setShowCompleted] = useState(false)
  const [stepsGoalFilter, setStepsGoalFilter] = useState<string | null>(null)
  const [stepsDateFilter, setStepsDateFilter] = useState<string | null>(null)
  const [loadingSteps, setLoadingSteps] = useState<Set<string>>(new Set())
  const [filtersExpanded, setFiltersExpanded] = useState(false)

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
    setEditingStep({
      ...step,
      goalId: step.goal_id || null
    })
  }

  const handleUpdateStep = async () => {
    if (!editFormData.title.trim()) {
      alert('Název kroku je povinný')
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
    
    try {
      const response = await fetch('/api/daily-steps', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stepId,
          completed,
          completedAt: completed ? new Date().toISOString() : null
        }),
      })

      if (response.ok) {
        await reloadSteps()
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Neznámá chyba' }))
        alert(`Chyba při aktualizaci kroku: ${errorData.error || 'Nepodařilo se aktualizovat krok'}`)
      }
    } catch (error) {
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

  const handleDeleteStep = async () => {
    if (!editingStep) return

    if (!confirm('Opravdu chcete smazat tento krok? Tato akce je nevratná.')) {
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
  }

  const handleCreateStep = async () => {
    if (!editFormData.title.trim()) {
      alert('Název kroku je povinný')
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

  const reloadSteps = async () => {
    const currentUserId = userId || player?.user_id
    if (!currentUserId) return

    try {
      // Load ALL steps (no date filter) to include overdue steps
      const response = await fetch(`/api/daily-steps?userId=${currentUserId}`)
      if (response.ok) {
        const steps = await response.json()
        onDailyStepsUpdate?.(steps)
      }
    } catch (error) {
      console.error('Error reloading steps:', error)
    }
  }

  // Load steps on mount - always reload to get all steps including overdue
  useEffect(() => {
    reloadSteps()
  }, [userId, player?.user_id])

  // Sort and filter steps
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
    return sortedSteps.filter((step: any) => {
      if (!showCompleted && step.completed) {
        return false
      }
      if (stepsGoalFilter && (step.goal_id || step.goalId) !== stepsGoalFilter) {
        return false
      }
      if (stepsDateFilter) {
        const stepDate = step.date ? (step.date.includes('T') ? step.date.split('T')[0] : step.date) : null
        if (stepDate !== stepsDateFilter) {
          return false
        }
      }
      return true
    })
  }, [sortedSteps, showCompleted, stepsGoalFilter, stepsDateFilter])

  return (
    <div className="w-full h-full flex flex-col">
      {/* Filters Row - Mobile: collapsible, Desktop: always visible */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4 px-4 py-3 bg-white border-b border-gray-200">
        {/* Mobile: Collapsible filters */}
        <div className="md:hidden flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={() => setFiltersExpanded(!filtersExpanded)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
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
                setEditingStep({ id: null, title: '', description: '', date: '', goalId: '', completed: false })
                setEditFormData({
                  title: '',
                  description: '',
                  date: '',
                  goalId: '',
                  completed: false
                })
              }}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium flex-1"
            >
              <Plus className="w-4 h-4" />
              {t('steps.add')}
            </button>
          </div>
          
          {/* Collapsible filters content */}
          {filtersExpanded && (
            <div className="flex flex-col gap-2 pt-2 border-t border-gray-200">
          {/* Show Completed Checkbox */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showCompleted}
              onChange={(e) => setShowCompleted(e.target.checked)}
              className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
            />
            <span className="text-sm text-gray-700">{t('steps.filters.showCompleted')}</span>
          </label>
          
          {/* Goal Filter */}
          <select
            value={stepsGoalFilter || ''}
            onChange={(e) => setStepsGoalFilter(e.target.value || null)}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-600 focus:border-orange-600 bg-white"
          >
            <option value="">{t('steps.filters.goal.all')}</option>
            {goals.map((goal: any) => (
              <option key={goal.id} value={goal.id}>{goal.title}</option>
            ))}
          </select>
          
          {/* Date Filter */}
              <div className="flex items-center gap-2">
          <input
            type="date"
            value={stepsDateFilter || ''}
            onChange={(e) => setStepsDateFilter(e.target.value || null)}
                  className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-600 focus:border-orange-600 bg-white"
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
          )}
        </div>
        
        {/* Desktop: Always visible filters */}
        <div className="hidden md:flex md:items-center gap-3 flex-1">
          {/* Show Completed Checkbox */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showCompleted}
              onChange={(e) => setShowCompleted(e.target.checked)}
              className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
            />
            <span className="text-sm text-gray-700">{t('steps.filters.showCompleted')}</span>
          </label>
          
          {/* Goal Filter */}
          <select
            value={stepsGoalFilter || ''}
            onChange={(e) => setStepsGoalFilter(e.target.value || null)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-600 focus:border-orange-600 bg-white min-w-[150px]"
          >
            <option value="">{t('steps.filters.goal.all')}</option>
            {goals.map((goal: any) => (
              <option key={goal.id} value={goal.id}>{goal.title}</option>
            ))}
          </select>
          
          {/* Date Filter */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={stepsDateFilter || ''}
              onChange={(e) => setStepsDateFilter(e.target.value || null)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-600 focus:border-orange-600 bg-white"
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
            setEditingStep({ id: null, title: '', description: '', date: '', goalId: '', completed: false })
            setEditFormData({
              title: '',
              description: '',
              date: '',
              goalId: '',
              completed: false
            })
          }}
          className="hidden md:flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          {t('steps.add')}
        </button>
      </div>
      
      {/* Steps Table */}
      <div className="flex-1 overflow-y-auto">
        <div className="w-full overflow-x-auto">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden m-4">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 first:pl-6 w-12"></th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Název</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 w-40 last:pr-6">Datum</th>
                </tr>
              </thead>
              <tbody>
                {filteredSteps.map((step: any) => {
                  const stepGoal = step.goal_id || step.goalId ? goals.find((g: any) => g.id === (step.goal_id || step.goalId)) : null
                  const stepDate = step.date ? (step.date.includes('T') ? step.date.split('T')[0] : step.date) : null
                  
                  return (
                    <tr
                      key={step.id}
                      onClick={() => handleOpenEditModal(step)}
                      className={`border-b border-gray-100 hover:bg-orange-50/30 transition-all duration-200 last:border-b-0 cursor-pointer ${
                        step.completed ? 'bg-orange-50/30 hover:bg-orange-50/50' : 'bg-white'
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
                              <Check className="w-5 h-5 text-orange-600" strokeWidth={3} />
                            ) : (
                              <Check className="w-5 h-5 text-gray-400" strokeWidth={2.5} fill="none" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <span className={`font-semibold text-sm ${step.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                          {step.title}
                        </span>
                        {step.description && (
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{step.description}</p>
                        )}
                      </td>
                      <td className="px-4 py-2 last:pr-6">
                        <span
                          onClick={(e) => {
                            e.stopPropagation()
                            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                            setQuickEditStepPosition({ top: rect.bottom + 4, left: rect.left })
                            setQuickEditStepId(step.id)
                            setQuickEditStepField('date')
                          }}
                          className="text-xs text-gray-700 cursor-pointer hover:text-orange-600 transition-colors flex items-center gap-1"
                        >
                          <Calendar className="w-3 h-3" />
                          {stepDate ? (
                            (() => {
                              try {
                                const dateParts = stepDate.split('-')
                                if (dateParts.length === 3) {
                                  return new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2])).toLocaleDateString(localeCode, { day: '2-digit', month: '2-digit', year: 'numeric' })
                                }
                                return stepDate
                              } catch {
                                return stepDate
                              }
                            })()
                          ) : (
                            <span className="text-gray-400">Bez data</span>
                          )}
                        </span>
                      </td>
                    </tr>
                  )
                })}
                {filteredSteps.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                      <p className="text-lg">Žádné kroky nejsou nastavené</p>
                      <p className="text-sm">Klikněte na tlačítko výše pro přidání nového kroku</p>
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
              className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">
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
                    className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-1.5 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    {t('steps.title')} <span className="text-orange-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editFormData.title}
                    onChange={(e) => setEditFormData({...editFormData, title: e.target.value})}
                    className="w-full px-4 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-600 focus:border-orange-600 transition-all bg-white"
                    placeholder={t('steps.titlePlaceholder')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    {t('steps.description')}
                  </label>
                  <textarea
                    value={editFormData.description}
                    onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
                    className="w-full px-4 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-600 focus:border-orange-600 transition-all bg-white resize-none"
                    rows={4}
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
                      value={editFormData.date}
                      onChange={(e) => setEditFormData({...editFormData, date: e.target.value})}
                      className="w-full px-4 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-600 focus:border-orange-600 transition-all bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      {t('steps.goal')}
                    </label>
                    <select
                      value={editFormData.goalId}
                      onChange={(e) => setEditFormData({...editFormData, goalId: e.target.value})}
                      className="w-full px-4 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-600 focus:border-orange-600 transition-all bg-white"
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
                        className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                      />
                      <span className="text-sm font-semibold text-gray-800">
                        {t('steps.completed')}
                      </span>
                    </label>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-gray-200 flex items-center justify-between">
                {editingStep.id && (
                  <button
                    onClick={handleDeleteStep}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
                  >
                    {t('common.delete')}
                  </button>
                )}
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
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    onClick={editingStep.id ? handleUpdateStep : handleCreateStep}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
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
            className="fixed z-50 bg-white border-2 border-gray-200 rounded-xl shadow-2xl p-4 min-w-[250px] max-w-[90vw]"
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
                    <h3 className="text-sm font-semibold text-gray-800 mb-2">
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
                                  className={`h-7 rounded transition-all text-xs ${
                                    isSelected 
                                      ? 'bg-orange-600 text-white font-bold' 
                                      : isToday
                                        ? 'bg-orange-100 text-orange-700 font-semibold'
                                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                                  }`}
                                >
                                  {date.getDate()}
                                </button>
                              )
                            })}
                          </div>
                        )
                      })()}
                      
                      <div className="flex items-center justify-between mt-2 pt-2 border-t">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            const prevMonth = new Date(selectedDateForStep)
                            prevMonth.setMonth(prevMonth.getMonth() - 1)
                            setSelectedDateForStep(prevMonth)
                          }}
                          className="p-1 hover:bg-gray-100 rounded-lg"
                        >
                          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <span className="text-xs font-semibold text-gray-800">
                          {selectedDateForStep.toLocaleDateString(localeCode, { month: 'long', year: 'numeric' })}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            const nextMonth = new Date(selectedDateForStep)
                            nextMonth.setMonth(nextMonth.getMonth() + 1)
                            setSelectedDateForStep(nextMonth)
                          }}
                          className="p-1 hover:bg-gray-100 rounded-lg"
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
                          className="flex-1 px-3 py-1.5 bg-orange-600 text-white text-xs rounded-lg hover:bg-orange-700 transition-colors"
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
                          className="px-3 py-1.5 bg-gray-200 text-gray-700 text-xs rounded-lg hover:bg-gray-300 transition-colors"
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
                        className={`w-full text-left px-4 py-3 text-sm hover:bg-purple-50 transition-colors ${
                          !step.goal_id && !step.goalId ? 'bg-purple-50 text-purple-700 font-semibold' : 'text-gray-700'
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
                          className={`w-full text-left px-4 py-3 text-sm hover:bg-purple-50 transition-colors ${
                            (step.goal_id || step.goalId) === goal.id ? 'bg-purple-50 text-purple-700 font-semibold' : 'text-gray-700'
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


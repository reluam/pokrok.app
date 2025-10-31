'use client'

import { useState, memo } from 'react'
import { Goal, Value, DailyStep, Event } from '@/lib/cesta-db'
import { CheckCircle, Clock, Target, BookOpen, Lightbulb, Calendar, Zap, Footprints, Plus, Circle } from 'lucide-react'
import { getToday, getTodayString, formatDateForInput } from '@/lib/utils'
import { UnifiedStepModal } from '../UnifiedStepModal'
import { useTranslations } from '@/lib/use-translations'

interface WorkspaceTabProps {
  goals: Goal[]
  values: Value[]
  dailySteps: DailyStep[]
  events: Event[]
  selectedStep?: DailyStep | null
  selectedEvent?: Event | null
  onValueUpdate?: (value: Value) => void
  onGoalUpdate?: (goal: Goal) => void
  onStepUpdate?: (step: DailyStep) => void
  onEventComplete?: (eventId: string) => void
  onEventPostpone?: (eventId: string) => void
}

export const WorkspaceTab = memo(function WorkspaceTab({ 
  goals, 
  values, 
  dailySteps, 
  events, 
  selectedStep, 
  selectedEvent, 
  onValueUpdate, 
  onGoalUpdate, 
  onStepUpdate, 
  onEventComplete, 
  onEventPostpone
}: WorkspaceTabProps) {
  const { translations } = useTranslations()
  const [showAddStepModal, setShowAddStepModal] = useState(false)
  const [selectedStepForDetails, setSelectedStepForDetails] = useState<DailyStep | null>(null)
  const [editingStep, setEditingStep] = useState<DailyStep | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Calculate today's date for filtering (local time)
  const getToday = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return today
  }

  const today = getToday()

  // Get today's steps and overdue steps (not completed)
  const todaySteps = dailySteps.filter(step => {
    const stepDate = new Date(step.date)
    stepDate.setHours(0, 0, 0, 0)
    return stepDate.getTime() === today.getTime()
  })

  // Get overdue steps (not completed and date is before today)
  const overdueSteps = dailySteps.filter(step => {
    if (step.completed) return false
    const stepDate = new Date(step.date)
    stepDate.setHours(0, 0, 0, 0)
    return stepDate < today
  })

  // Combine today's incomplete steps and overdue steps
  const allRelevantSteps = [
    ...todaySteps.filter(step => !step.completed),
    ...overdueSteps
  ]

  // Sort steps: overdue first, then today's steps
  const sortedTodaySteps = allRelevantSteps.sort((a, b) => {
    const aDate = new Date(a.date)
    const bDate = new Date(b.date)
    aDate.setHours(0, 0, 0, 0)
    bDate.setHours(0, 0, 0, 0)
    
    // Overdue steps first
    const aIsOverdue = aDate < today
    const bIsOverdue = bDate < today
    
    if (aIsOverdue && !bIsOverdue) return -1
    if (!aIsOverdue && bIsOverdue) return 1
    
    // If both are overdue or both are today, sort by date
    return aDate.getTime() - bDate.getTime()
  })

  const handleAddStep = async (stepData: any) => {
    try {
      const response = await fetch('/api/cesta/daily-steps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goalId: stepData.goalId,
          title: stepData.title.trim(),
          description: stepData.description.trim() || undefined,
          date: stepData.date
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (onStepUpdate) {
          onStepUpdate(data.step)
        }
      } else {
        const error = await response.json()
        console.error('Error adding step:', error)
        alert(`Chyba při přidávání kroku: ${error.error || 'Neznámá chyba'}`)
      }
    } catch (error) {
      console.error('Error adding step:', error)
      alert('Chyba při přidávání kroku')
    }
  }

  const handleStepComplete = async (stepId: string) => {
    try {
      // Set loading state for this specific step
      if (onStepUpdate) {
        onStepUpdate({ id: stepId, isCompleting: true } as any)
      }
      
      const response = await fetch(`/api/cesta/daily-steps/${stepId}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: true })
      })

      if (response.ok) {
        const data = await response.json()
        if (onStepUpdate) {
          onStepUpdate({ ...data.step, isCompleting: false })
        }
      }
    } catch (error) {
      console.error('Error completing step:', error)
      // Remove loading state on error
      if (onStepUpdate) {
        onStepUpdate({ id: stepId, isCompleting: false } as any)
      }
    }
  }

  const handleStepSave = async () => {
    if (!editingStep || isSaving) return

    setIsSaving(true)
    try {
      const response = await fetch(`/api/cesta/daily-steps/${editingStep.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editingStep.title,
          description: editingStep.description,
          date: editingStep.date
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (onStepUpdate) {
          onStepUpdate(data.step)
        }
        setSelectedStepForDetails(null)
        setEditingStep(null)
      } else {
        console.error('Error saving step:', await response.text())
      }
    } catch (error) {
      console.error('Error saving step:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleStepEdit = (step: DailyStep) => {
    setSelectedStepForDetails(step)
    setEditingStep({ ...step })
  }

  const handleStepDelete = async () => {
    if (!editingStep || !confirm('Opravdu chcete smazat tento krok?')) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/cesta/daily-steps/${editingStep.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setSelectedStepForDetails(null)
        setEditingStep(null)
        // Force parent to refresh data
        window.location.reload()
      } else {
        console.error('Error deleting step:', await response.text())
        alert('Chyba při mazání kroku')
      }
    } catch (error) {
      console.error('Error deleting step:', error)
      alert('Chyba při mazání kroku')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-primary-100">
            <span className="text-lg">📝</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{translations?.app.whatNeedsToBeDoneToday || 'Co je třeba dnes udělat'}</h2>
            <p className="text-sm text-gray-600">{translations?.app.addStepsForToday || 'Přidejte kroky pro dnešek'}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Add New Step Button */}
          <div className="relative">
            <button
              onClick={() => setShowAddStepModal(true)}
              className="w-full px-4 py-2 rounded-full bg-gray-50 border border-gray-200 hover:bg-white hover:border-primary-300 hover:ring-2 hover:ring-primary-500 hover:border-transparent transition-all duration-200 subtle-cursor text-left"
            >
              <span className="text-gray-500">{translations?.app.addNewStep || 'Přidat nový krok'}</span>
            </button>
          </div>

          {/* Today's Steps */}
          <div className="space-y-3">
            {sortedTodaySteps.length === 0 ? (
              <div className="text-center py-6">
                <h3 className="text-lg font-medium text-gray-700 mb-6">
                  {translations?.app.allStepsDone || 'Všechny kroky jsou hotové! ✨'}
                </h3>
                
                <div className="max-w-sm mx-auto">
                  <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl p-5 border border-green-200">
                    <div className="text-center">
                      <div className="w-10 h-10 mx-auto mb-3 bg-green-100 rounded-lg flex items-center justify-center">
                        <span className="text-lg">☕</span>
                      </div>
                      <h4 className="text-base font-medium text-gray-800 mb-1">{translations?.app.haveCoffeeOrTea || 'Dejte si kávu nebo čaj'}</h4>
                      <p className="text-sm text-gray-600 mb-3">{translations?.app.momentOfPeace || 'Chvilka klidu pro sebe'}</p>
                      <div className="flex justify-center space-x-2 text-xs text-gray-500">
                        <span className="px-2 py-1 bg-green-100 rounded-full">🧘</span>
                        <span className="px-2 py-1 bg-green-100 rounded-full">🚶</span>
                        <span className="px-2 py-1 bg-green-100 rounded-full">💬</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-5 p-3 bg-green-50 rounded-lg max-w-sm mx-auto border border-green-100">
                  <p className="text-xs text-green-700 italic">
                    "{translations?.app.restIsPartOfWork || 'Odpočinek je součást práce.'}"
                  </p>
                </div>
              </div>
            ) : (
              <>
                <h3 className="text-lg font-semibold text-gray-900">
                  Dnešní kroky ({sortedTodaySteps.length} zbývá)
                </h3>
                <div className="space-y-3">
                {sortedTodaySteps.map((step) => {
                  const stepDate = new Date(step.date)
                  stepDate.setHours(0, 0, 0, 0)
                  const isOverdue = stepDate < today
                  
                  return (
                    <div
                      key={step.id}
                      className={`p-4 rounded-lg border transition-colors cursor-pointer hover:shadow-md ${
                        isOverdue
                          ? 'bg-red-50 border-red-200'
                          : 'bg-primary-50 border-primary-200'
                      }`}
                      onClick={() => handleStepEdit(step)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <Footprints className={`w-5 h-5 ${isOverdue ? 'text-red-500' : 'text-primary-500'}`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-medium text-gray-900">
                              {step.title}
                            </h4>
                            {isOverdue && (
                              <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full font-medium">
                                Zpožděno
                              </span>
                            )}
                          </div>
                          {step.description && (
                            <p className="text-sm text-gray-600">
                              {step.description}
                            </p>
                          )}
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <span className={`flex items-center ${isOverdue ? 'text-red-600' : ''}`}>
                              <Calendar className="w-3 h-3 mr-1" />
                              {new Date(step.date).toLocaleDateString('cs-CZ')}
                              {isOverdue && (
                                <span className="ml-1 font-medium">(zpožděno)</span>
                              )}
                            </span>
                            {step.goal_id && (
                              <span className="flex items-center">
                                <Target className="w-3 h-3 mr-1" />
                                {goals.find(g => g.id === step.goal_id)?.title || 'Nepřiřazený cíl'}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleStepComplete(step.id)
                            }}
                            disabled={step.isCompleting}
                            className={`px-3 py-1 rounded-lg text-white text-sm font-medium transition-colors ${
                              step.isCompleting 
                                ? 'bg-gray-400 cursor-not-allowed' 
                                : isOverdue 
                                  ? 'bg-red-500 hover:bg-red-600' 
                                  : 'bg-primary-500 hover:bg-primary-600'
                            }`}
                          >
                            {step.isCompleting ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              'Hotovo'
                            )}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleStepEdit(step)
                            }}
                            className="px-3 py-1 rounded-lg bg-gray-500 hover:bg-gray-600 text-white text-sm font-medium transition-colors"
                          >
                            <Clock className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Unified Step Modal */}
      <UnifiedStepModal
        isOpen={showAddStepModal}
        onClose={() => setShowAddStepModal(false)}
        onSave={handleAddStep}
        goals={goals}
        width="medium"
      />
      
      {/* Step Edit Modal */}
      {editingStep && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Upravit krok</h3>
              <button
                onClick={() => {
                  setSelectedStepForDetails(null)
                  setEditingStep(null)
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault()
              handleStepSave()
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Název</label>
                <input
                  type="text"
                  value={editingStep.title}
                  onChange={(e) => setEditingStep(prev => prev ? { ...prev, title: e.target.value } : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Název kroku"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Popis</label>
                <textarea
                  value={editingStep.description || ''}
                  onChange={(e) => setEditingStep(prev => prev ? { ...prev, description: e.target.value } : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  rows={3}
                  placeholder="Popis kroku (volitelné)"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Datum</label>
                <input
                  type="date"
                  value={new Date(editingStep.date).toISOString().split('T')[0]}
                  onChange={(e) => setEditingStep(prev => prev ? { ...prev, date: new Date(e.target.value) } : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              
              {editingStep.goal_id && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cíl</label>
                  <p className="text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                    {goals.find(g => g.id === editingStep.goal_id)?.title || 'Nepřiřazený cíl'}
                  </p>
                </div>
              )}
              
              <div className="flex items-center space-x-2 pt-2">
                <div className="flex items-center space-x-2">
                  {editingStep.completed ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-green-600 font-medium">Dokončeno</span>
                    </>
                  ) : (
                    <>
                      <Circle className="w-5 h-5 text-gray-300" />
                      <span className="text-gray-600">Nedokončeno</span>
                    </>
                  )}
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 bg-primary-500 text-white py-2 px-4 rounded-lg hover:bg-primary-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center space-x-2"
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Ukládám...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>Uložit</span>
                    </>
                  )}
                </button>
                
                <button
                  type="button"
                  onClick={handleStepDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium flex items-center space-x-2"
                >
                  {isDeleting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Mažu...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span>Smazat</span>
                    </>
                  )}
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                    setSelectedStepForDetails(null)
                    setEditingStep(null)
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Zrušit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
})

export default WorkspaceTab
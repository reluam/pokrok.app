'use client'

import { useState, memo, useEffect } from 'react'
import { Goal, DailyStep, GoalMetric, Note, Area } from '@/lib/cesta-db'
import { X, Calendar, Target, Settings, CheckCircle, Circle, AlertCircle, Info, Gauge, Plus, Edit, Trash2, DollarSign, Percent, Ruler, Clock as ClockIcon, Type, FileText, Palette } from 'lucide-react'
import { Tooltip } from './Tooltip'
import { getIconComponent, getIconEmoji } from '@/lib/icon-utils'
import { UnifiedStepModal } from './UnifiedStepModal'
import { useTranslations } from '@/lib/use-translations'

interface GoalDetailModalProps {
  goal: Goal
  steps: DailyStep[]
  onClose: () => void
  onStepClick?: (step: DailyStep) => void
  onStepComplete?: (stepId: string) => void
  onStepEdit?: (step: DailyStep) => void
  onStepAdd?: (goalId: string) => void
  onEdit?: (goal: Goal) => void
  onDelete?: (goalId: string) => void
}

export const GoalDetailModal = memo(function GoalDetailModal({ 
  goal, 
  steps, 
  onClose, 
  onStepClick, 
  onStepComplete,
  onStepEdit,
  onStepAdd,
  onEdit, 
  onDelete 
}: GoalDetailModalProps) {
  const { translations } = useTranslations()
  const [activeTab, setActiveTab] = useState<'overview' | 'steps' | 'metrics' | 'notes'>('overview')
  const [isEditing, setIsEditing] = useState(false)
  const [editedGoal, setEditedGoal] = useState<Goal>(goal)
  const [metrics, setMetrics] = useState<GoalMetric[]>([])
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(false)
  const [showAddMetricModal, setShowAddMetricModal] = useState(false)
  const [showAddStepModal, setShowAddStepModal] = useState(false)
  const [isSubmittingStep, setIsSubmittingStep] = useState(false)
  const [notes, setNotes] = useState<Note[]>([])
  const [isLoadingNotes, setIsLoadingNotes] = useState(false)
  const [showAddNoteModal, setShowAddNoteModal] = useState(false)
  const [isSubmittingNote, setIsSubmittingNote] = useState(false)
  const [areas, setAreas] = useState<Area[]>([])
  const [isLoadingAreas, setIsLoadingAreas] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Load metrics when metrics tab is opened
  useEffect(() => {
    if (activeTab === 'metrics') {
      loadMetrics()
    }
  }, [activeTab, goal.id])

  // Load notes when notes tab is opened
  useEffect(() => {
    if (activeTab === 'notes') {
      loadNotes()
    }
  }, [activeTab, goal.id])

  // Load areas on mount
  useEffect(() => {
    loadAreas()
  }, [])

  const loadMetrics = async () => {
    setIsLoadingMetrics(true)
    try {
      const response = await fetch(`/api/cesta/goal-metrics?goalId=${goal.id}`)
      if (response.ok) {
        const data = await response.json()
        console.log('GoalDetailModal: API response:', data)
        const metricsData = data.metrics || data
        console.log('GoalDetailModal: Extracted metrics:', metricsData)
        setMetrics(Array.isArray(metricsData) ? metricsData : [])
      } else {
        console.log('GoalDetailModal: API error:', response.status)
        setMetrics([])
      }
    } catch (error) {
      console.error('Error loading metrics:', error)
      setMetrics([])
    } finally {
      setIsLoadingMetrics(false)
    }
  }

  const loadNotes = async () => {
    setIsLoadingNotes(true)
    try {
      const response = await fetch(`/api/cesta/notes?goalId=${goal.id}`)
      if (response.ok) {
        const data = await response.json()
        setNotes(data.notes || [])
      } else {
        console.log('GoalDetailModal: API error:', response.status)
        setNotes([])
      }
    } catch (error) {
      console.error('Error loading notes:', error)
      setNotes([])
    } finally {
      setIsLoadingNotes(false)
    }
  }

  const loadAreas = async () => {
    setIsLoadingAreas(true)
    try {
      const response = await fetch('/api/cesta/areas')
      if (response.ok) {
        const data = await response.json()
        setAreas(data.areas || [])
      }
    } catch (error) {
      console.error('Error loading areas:', error)
    } finally {
      setIsLoadingAreas(false)
    }
  }

  const handleSave = async () => {
    console.log('🎯 GoalDetailModal: handleSave called')
    console.log('🎯 GoalDetailModal: editedGoal:', editedGoal)
    setIsSaving(true)
    try {
      const url = `${window.location.origin}/api/cesta/goals/${goal.id}`
      console.log('🎯 GoalDetailModal: Current location:', window.location.href)
      console.log('🎯 GoalDetailModal: Current origin:', window.location.origin)
      const payload = {
        title: editedGoal.title,
        description: editedGoal.description,
        target_date: editedGoal.target_date,
        area_id: editedGoal.area_id
      }
      
      console.log('🎯 GoalDetailModal: Making PATCH request to:', url)
      console.log('🎯 GoalDetailModal: Payload:', payload)
      
      const response = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      console.log('🎯 GoalDetailModal: save response status:', response.status)
      console.log('🎯 GoalDetailModal: save response headers:', Object.fromEntries(response.headers.entries()))
      let bodyText = ''
      try {
        bodyText = await response.text()
        console.log('🎯 GoalDetailModal: save response body:', bodyText)
      } catch (e) {
        console.warn('🎯 GoalDetailModal: failed to read response text')
      }

      if (response.ok) {
        let updated
        try {
          updated = bodyText ? JSON.parse(bodyText) : null
        } catch (e) {
          console.warn('🎯 GoalDetailModal: failed to parse JSON, using editedGoal')
        }

        const serverGoal = updated?.goal ?? editedGoal

        // Call the parent's onEdit callback to refresh data with server goal
        if (onEdit) {
          onEdit(serverGoal as any)
        }
        // Update local goal state from server
        Object.assign(goal, serverGoal)
        // Close the modal after successful save
        onClose()
      } else {
        let errorMsg = 'Unknown error'
        try {
          const parsed = bodyText ? JSON.parse(bodyText) : null
          errorMsg = parsed?.error || errorMsg
        } catch {}
        console.error('Error saving goal:', errorMsg)
        alert(`${translations?.app.errorSavingGoal || 'Chyba při ukládání cíle'}: ${errorMsg || (translations?.common.unknownError || 'Neznámá chyba')}`)
      }
    } catch (error) {
      console.error('Error saving goal:', error)
      alert(translations?.app.errorSavingGoal || 'Chyba při ukládání cíle')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setEditedGoal(goal)
    setIsEditing(false)
  }

  const handleFieldChange = (field: keyof Goal, value: any) => {
    console.log('🎯 GoalDetailModal: handleFieldChange called:', { field, value })
    setEditedGoal(prev => {
      const newGoal = { ...prev, [field]: value }
      console.log('🎯 GoalDetailModal: new editedGoal:', newGoal)
      return newGoal
    })
  }

  const handleAddMetric = async (metricData: any) => {
    try {
      const response = await fetch('/api/cesta/goal-metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goalId: goal.id,
          ...metricData
        })
      })
      
      if (response.ok) {
        await loadMetrics() // Reload metrics
        setShowAddMetricModal(false)
      }
    } catch (error) {
      console.error('Error adding metric:', error)
    }
  }

  const handleUpdateMetric = async (metricId: string, updates: any) => {
    try {
      const response = await fetch('/api/cesta/goal-metrics', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metricId: metricId,
          goalId: goal.id,
          ...updates
        })
      })
      
      if (response.ok) {
        await loadMetrics() // Reload metrics
      }
    } catch (error) {
      console.error('Error updating metric:', error)
    }
  }

  const handleDeleteMetric = async (metricId: string) => {
    try {
      const response = await fetch(`/api/cesta/goal-metrics?metricId=${metricId}&goalId=${goal.id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        await loadMetrics() // Reload metrics
      }
    } catch (error) {
      console.error('Error deleting metric:', error)
    }
  }

  const handleAddStep = async (stepData: any) => {
    setIsSubmittingStep(true)
    try {
      const response = await fetch('/api/cesta/daily-steps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goalId: goal.id,
          title: stepData.title.trim(),
          description: stepData.description.trim() || undefined,
          date: stepData.date
        })
      })

      if (response.ok) {
        // Call the parent's onStepAdd callback to refresh data
        if (onStepAdd) {
          onStepAdd(goal.id)
        }
        setShowAddStepModal(false)
        // Refresh the steps tab by reloading the component
        window.location.reload()
      } else {
        const error = await response.json()
        console.error('Error adding step:', error)
        alert(`${translations?.app.errorAddingStep || 'Chyba při přidávání kroku'}: ${error.error || (translations?.common.unknownError || 'Neznámá chyba')}`)
      }
    } catch (error) {
      console.error('Error adding step:', error)
      alert(translations?.app.errorAddingStep || 'Chyba při přidávání kroku')
    } finally {
      setIsSubmittingStep(false)
    }
  }

  const handleAddNote = async (noteData: any) => {
    setIsSubmittingNote(true)
    try {
      const response = await fetch('/api/cesta/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goalId: goal.id,
          title: noteData.title.trim(),
          content: noteData.content.trim()
        })
      })

      if (response.ok) {
        const result = await response.json()
        setNotes(prev => [result.note, ...prev])
        setShowAddNoteModal(false)
      } else {
        const error = await response.json()
        console.error('Error adding note:', error)
        alert(`${translations?.app.errorAddingNote || 'Chyba při přidávání poznámky'}: ${error.error || (translations?.common.unknownError || 'Neznámá chyba')}`)
      }
    } catch (error) {
      console.error('Error adding note:', error)
      alert(translations?.app.errorAddingNote || 'Chyba při přidávání poznámky')
    } finally {
      setIsSubmittingNote(false)
    }
  }

  const getGoalTypeInfo = (goalType: string) => {
    switch (goalType) {
      case 'outcome':
        return {
          label: translations?.modals.goalDetail.outcomeGoal || 'Výsledkový cíl',
          description: translations?.modals.goalDetail.outcomeDescription || 'Konkrétní, měřitelný výsledek, který chcete dosáhnout',
          icon: '🎯',
          color: 'text-blue-600 bg-blue-100'
        }
      case 'process':
        return {
          label: translations?.modals.goalDetail.processGoal || 'Procesní cíl',
          description: translations?.modals.goalDetail.processDescription || 'Zaměřený na pravidelné aktivity a návyky',
          icon: '🔄',
          color: 'text-green-600 bg-green-100'
        }
      default:
        return {
          label: translations?.modals.goalDetail.unknownType || 'Neznámý typ',
          description: translations?.modals.goalDetail.unknownTypeDescription || 'Typ cíle není definován',
          icon: '❓',
          color: 'text-gray-600 bg-gray-100'
        }
    }
  }

  const getProgressTypeInfo = (progressType: string) => {
    switch (progressType) {
      case 'percentage':
        return {
          label: translations?.modals.goalDetail.percentage || 'Procentuální',
          description: translations?.modals.goalDetail.percentageDescription || 'Pokrok se měří v procentech (0-100%)',
          icon: '📊'
        }
      case 'count':
        return {
          label: translations?.modals.goalDetail.count || 'Počet',
          description: translations?.modals.goalDetail.countDescription || 'Pokrok se měří počtem dokončených akcí',
          icon: '🔢'
        }
      case 'amount':
        return {
          label: translations?.modals.goalDetail.amount || 'Částka',
          description: translations?.modals.goalDetail.amountDescription || 'Pokrok se měří v peněžních jednotkách',
          icon: '💰'
        }
      case 'steps':
        return {
          label: translations?.app.steps || 'Kroky',
          description: translations?.modals.goalDetail.stepsDescription || 'Pokrok se měří počtem dokončených kroků',
          icon: '👣'
        }
      default:
        return {
          label: translations?.modals.goalDetail.unknown || 'Neznámý',
          description: translations?.modals.goalDetail.unknownDescription || 'Typ měření není definován',
          icon: '❓'
        }
    }
  }

  const getCategoryInfo = (category: string) => {
    switch (category) {
      case 'short-term':
        return {
          label: translations?.modals.goalDetail.shortTerm || 'Krátkodobý',
          description: translations?.modals.goalDetail.shortTermDescription || 'Cíl na nejbližší období (obvykle do 3 měsíců)',
          icon: '⚡',
          color: 'text-orange-600 bg-orange-100'
        }
      case 'medium-term':
        return {
          label: translations?.modals.goalDetail.mediumTerm || 'Střednědobý',
          description: translations?.modals.goalDetail.mediumTermDescription || 'Cíl na střední období (obvykle 3-12 měsíců)',
          icon: '📅',
          color: 'text-blue-600 bg-blue-100'
        }
      case 'long-term':
        return {
          label: translations?.modals.goalDetail.longTerm || 'Dlouhodobý',
          description: translations?.modals.goalDetail.longTermDescription || 'Cíl na dlouhé období (obvykle více než 1 rok)',
          icon: '🏆',
          color: 'text-purple-600 bg-purple-100'
        }
      default:
        return {
          label: translations?.modals.goalDetail.unknownCategory || 'Neznámý',
          description: translations?.modals.goalDetail.unknownCategoryDescription || 'Kategorie není definována',
          icon: '❓',
          color: 'text-gray-600 bg-gray-100'
        }
    }
  }

  const goalTypeInfo = getGoalTypeInfo(goal.goal_type || 'outcome')
  const progressTypeInfo = getProgressTypeInfo(goal.progress_type || 'percentage')
  const categoryInfo = getCategoryInfo(goal.category || 'short-term')

  // Show all steps (is_automated field doesn't exist in DailyStep interface)
  const userSteps = steps
  const completedSteps = userSteps.filter(s => s.completed).length
  const totalSteps = userSteps.length

  const tabs = [
    { id: 'overview', label: translations?.modals.goalDetail.overview || 'Přehled', icon: Info },
    { id: 'steps', label: translations?.app.steps || 'Kroky', icon: CheckCircle },
    { id: 'metrics', label: translations?.modals.goalDetail.metrics || 'Metriky', icon: Gauge },
    { id: 'notes', label: translations?.app.notes || 'Poznámky', icon: FileText }
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-3">
                <input
                  type="text"
                  value={editedGoal.title}
                  onChange={(e) => handleFieldChange('title', e.target.value)}
                  className="text-2xl font-bold text-gray-900 bg-transparent border-b border-gray-300 focus:border-primary-500 focus:outline-none hover:border-gray-400 transition-colors"
                  placeholder={translations?.modals.goalDetail.goalTitlePlaceholder || "Název cíle..."}
                />
                {goal.icon && (
                  <span className="text-2xl">{getIconEmoji(goal.icon)}</span>
                )}
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${categoryInfo.color}`}>
                  {categoryInfo.icon} {categoryInfo.label}
                </span>
              </div>
              
              <div className="flex items-center space-x-4 mb-3">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">{translations?.modals.goalDetail.targetDate || 'Cílové datum'}:</span>
                  <input
                    type="date"
                    value={editedGoal.target_date ? new Date(editedGoal.target_date).toISOString().split('T')[0] : ''}
                    onChange={(e) => handleFieldChange('target_date', e.target.value ? new Date(e.target.value) : null)}
                    className="px-2 py-1 text-sm border border-gray-300 rounded focus:border-primary-500 focus:outline-none hover:border-gray-400 transition-colors"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-4 mb-3">
                <div className="flex items-center space-x-2">
                  <Palette className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Životní oblast:</span>
                  <select
                    value={editedGoal.area_id || ''}
                    onChange={(e) => handleFieldChange('area_id', e.target.value || null)}
                    className="px-2 py-1 text-sm border border-gray-300 rounded focus:border-primary-500 focus:outline-none hover:border-gray-400 transition-colors"
                  >
                    <option value="">Bez oblasti</option>
                    {areas.map((area) => (
                      <option key={area.id} value={area.id}>
                        {area.name}
                      </option>
                    ))}
                  </select>
                  {editedGoal.area_id && areas.find(a => a.id === editedGoal.area_id) && (
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: areas.find(a => a.id === editedGoal.area_id)?.color }}
                    />
                  )}
                </div>
              </div>

            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-96">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Main Progress Card */}
              <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl p-6 border border-primary-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-primary-900">{translations?.modals.goalDetail.totalProgress || 'Celkový pokrok'}</h3>
                    <p className="text-sm text-primary-700">{translations?.modals.goalDetail.combinedProgress || 'Kombinovaný pokrok z kroků a metrik'}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-primary-900">{goal.progress_percentage || 0}%</div>
                    <div className="text-sm text-primary-700">
                      {goal.progress_percentage >= 80 ? (translations?.modals.goalDetail.excellent || 'Skvěle!') : 
                       goal.progress_percentage >= 60 ? (translations?.modals.goalDetail.good || 'Dobře!') : 
                       goal.progress_percentage >= 40 ? (translations?.modals.goalDetail.continue || 'Pokračuj!') : 
                       goal.progress_percentage >= 20 ? (translations?.modals.goalDetail.start || 'Začni!') : (translations?.modals.goalDetail.startNow || 'Začni hned!')}
                    </div>
                  </div>
                </div>
                
                <div className="w-full bg-white/50 rounded-full h-3 mb-4">
                  <div 
                    className="bg-gradient-to-r from-primary-500 to-primary-600 h-3 rounded-full transition-all duration-700 shadow-sm"
                    style={{ width: `${goal.progress_percentage || 0}%` }}
                  />
                </div>

                <div className="flex justify-between text-sm text-primary-700">
                  <span>{translations?.modals.goalDetail.start || 'Začátek'}</span>
                  <span>{translations?.modals.goalDetail.completed || 'Dokončeno'}</span>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                {/* Steps Stats */}
                <div className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Target className="w-5 h-5 text-blue-600" />
                      <span className="font-medium text-gray-900">{translations?.app.steps || 'Kroky'}</span>
                    </div>
                    <span className="text-xs text-gray-500">{completedSteps}/{totalSteps}</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">{translations?.app.completed || 'Dokončené'}</span>
                      <span className="font-medium text-blue-600">{completedSteps}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">{translations?.modals.goalDetail.remaining || 'Zbývá'}</span>
                      <span className="font-medium text-gray-900">{totalSteps - completedSteps}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Metrics Stats */}
                <div className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Gauge className="w-5 h-5 text-green-600" />
                      <span className="font-medium text-gray-900">{translations?.modals.goalDetail.metrics || 'Metriky'}</span>
                    </div>
                    <span className="text-xs text-gray-500">{metrics.length}</span>
                  </div>
                  <div className="space-y-2">
                    {metrics.length > 0 ? (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">{translations?.modals.goalDetail.active || 'Aktivní'}</span>
                          <span className="font-medium text-green-600">{metrics.length}</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {translations?.modals.goalDetail.averageProgress || 'Průměrný pokrok'}: {Math.round(metrics.reduce((acc, m) => acc + ((m.current_value / m.target_value) * 100), 0) / metrics.length)}%
                        </div>
                      </>
                    ) : (
                      <div className="text-sm text-gray-500">{translations?.modals.goalDetail.noMetrics || 'Žádné metriky'}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Key Insights */}
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                  <Info className="w-4 h-4 mr-2 text-blue-600" />
                  {translations?.modals.goalDetail.keyInsights || 'Klíčové poznatky'}
                </h4>
                <div className="space-y-2 text-sm">
                  {(() => {
                    const insights = []
                    const today = new Date()
                    const targetDate = goal.target_date ? new Date(goal.target_date) : null
                    
                    // Progress insight
                    if (goal.progress_percentage < 20) {
                      insights.push({ type: 'warning', text: 'Pokrok je nízký - zaměřte se na první kroky' })
                    } else if (goal.progress_percentage > 80) {
                      insights.push({ type: 'success', text: 'Skvělý pokrok! Jste téměř u cíle' })
                    }
                    
                    // Deadline insight
                    if (targetDate) {
                      const daysLeft = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                      if (daysLeft < 0) {
                        insights.push({ type: 'error', text: 'Cíl je po termínu - zvažte prodloužení' })
                      } else if (daysLeft < 7) {
                        insights.push({ type: 'warning', text: `Zbývá ${daysLeft} dní do cíle` })
                      } else if (daysLeft < 30) {
                        insights.push({ type: 'info', text: `Zbývá ${daysLeft} dní do cíle` })
                      }
                    }
                    
                    // Steps insight
                    if (totalSteps > 0) {
                      const completionRate = (completedSteps / totalSteps) * 100
                      if (completionRate < 30) {
                        insights.push({ type: 'warning', text: 'Dokončeno málo kroků - zaměřte se na akci' })
                      } else if (completionRate > 70) {
                        insights.push({ type: 'success', text: 'Většina kroků je dokončena' })
                      }
                    }
                    
                    if (insights.length === 0) {
                      insights.push({ type: 'info', text: 'Pokračujte v dobré práci!' })
                    }
                    
                    return insights.map((insight, index) => (
                      <div key={index} className={`flex items-center space-x-2 p-2 rounded-lg ${
                        insight.type === 'success' ? 'bg-green-50 text-green-800' :
                        insight.type === 'warning' ? 'bg-yellow-50 text-yellow-800' :
                        insight.type === 'error' ? 'bg-red-50 text-red-800' :
                        'bg-blue-50 text-blue-800'
                      }`}>
                        <div className={`w-2 h-2 rounded-full ${
                          insight.type === 'success' ? 'bg-green-500' :
                          insight.type === 'warning' ? 'bg-yellow-500' :
                          insight.type === 'error' ? 'bg-red-500' :
                          'bg-blue-500'
                        }`} />
                        <span>{insight.text}</span>
                      </div>
                    ))
                  })()}
                </div>
              </div>


              {/* Timeline */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Časová osa
                </h3>
                
                {(() => {
                  const startDate = new Date(goal.created_at)
                  const endDate = goal.target_date ? new Date(goal.target_date) : null
                  const today = new Date()
                  
                  // Sort steps by date
                  const sortedSteps = [...userSteps].sort((a, b) => 
                    new Date(a.date).getTime() - new Date(b.date).getTime()
                  )
                  
                  // Calculate timeline positions
                  const calculatePosition = (date: Date) => {
                    if (!endDate) return 0
                    const startTime = startDate.getTime()
                    const endTime = endDate.getTime()
                    const currentTime = date.getTime()
                    const totalDuration = endTime - startTime
                    const currentDuration = currentTime - startTime
                    return Math.max(0, Math.min(100, (currentDuration / totalDuration) * 100))
                  }
                  
                  return (
                    <div className="relative px-8">
                      {/* Compact timeline with progress bar */}
                      <div className="space-y-3">
                        
                        {/* Top row - Descriptions */}
                        <div className="relative flex items-center h-8">
                          {/* Start description */}
                          <div className="absolute left-0 transform -translate-x-1/2">
                            <div className="bg-white px-2 py-1 rounded-full shadow-sm border border-gray-100">
                              <h4 className="text-xs font-semibold text-gray-900 text-center whitespace-nowrap">Začátek</h4>
                            </div>
                          </div>
                          
                          {/* Step descriptions */}
                          {sortedSteps.map((step, index) => {
                            const stepDate = new Date(step.date)
                            const isCompleted = step.completed
                            const isOverdue = stepDate < today && !isCompleted
                            const isToday = stepDate.toDateString() === today.toDateString()
                            const position = calculatePosition(stepDate)
                            
                            return (
                              <div 
                                key={step.id} 
                                className="absolute transform -translate-x-1/2"
                                style={{ left: `${position}%` }}
                              >
                                <div className={`px-2 py-1 rounded-full shadow-sm border ${
                                  isCompleted ? 'bg-green-50 border-green-200' :
                                  isOverdue ? 'bg-red-50 border-red-200' :
                                  isToday ? 'bg-yellow-50 border-yellow-200' :
                                  'bg-blue-50 border-blue-200'
                                }`}>
                                  <h4 className={`text-xs font-semibold text-center whitespace-nowrap ${
                                    isCompleted ? 'text-green-900' :
                                    isOverdue ? 'text-red-900' :
                                    isToday ? 'text-yellow-900' :
                                    'text-blue-900'
                                  }`}>
                                    {step.title.length > 12 ? step.title.substring(0, 12) + '...' : step.title}
                                  </h4>
                                </div>
                              </div>
                            )
                          })}
                          
                          {/* End description */}
                          {endDate && (
                            <div className="absolute right-0 transform translate-x-1/2">
                              <div className="bg-white px-2 py-1 rounded-full shadow-sm border border-gray-100">
                                <h4 className="text-xs font-semibold text-gray-900 text-center whitespace-nowrap">Cíl</h4>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* Middle row - Dates */}
                        <div className="relative flex items-center h-6">
                          {/* Start date */}
                          <div className="absolute left-0 transform -translate-x-1/2">
                            <div className="bg-gray-50 px-2 py-1 rounded-md">
                              <p className="text-xs text-gray-600 text-center whitespace-nowrap">
                                {startDate.toLocaleDateString('cs-CZ')}
                              </p>
                            </div>
                          </div>
                          
                          {/* Step dates */}
                          {sortedSteps.map((step, index) => {
                            const stepDate = new Date(step.date)
                            const position = calculatePosition(stepDate)
                            
                            return (
                              <div 
                                key={step.id} 
                                className="absolute transform -translate-x-1/2"
                                style={{ left: `${position}%` }}
                              >
                                <div className="bg-gray-50 px-2 py-1 rounded-md">
                                  <p className="text-xs text-gray-600 text-center whitespace-nowrap">
                                    {stepDate.toLocaleDateString('cs-CZ')}
                                  </p>
                                </div>
                              </div>
                            )
                          })}
                          
                          {/* End date */}
                          {endDate && (
                            <div className="absolute right-0 transform translate-x-1/2">
                              <div className="bg-gray-50 px-2 py-1 rounded-md">
                                <p className="text-xs text-gray-600 text-center whitespace-nowrap">
                                  {endDate.toLocaleDateString('cs-CZ')}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* Timeline line and points */}
                        <div className="relative flex items-center h-6">
                          {/* Timeline line */}
                          <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-full"></div>
                          
                          {/* Start point */}
                          <div className="absolute left-0 transform -translate-x-1/2">
                            <div className="w-3 h-3 bg-gradient-to-br from-green-400 to-green-600 rounded-full border-2 border-white shadow-md"></div>
                          </div>
                          
                          {/* Step points */}
                          {sortedSteps.map((step, index) => {
                            const stepDate = new Date(step.date)
                            const isCompleted = step.completed
                            const isOverdue = stepDate < today && !isCompleted
                            const isToday = stepDate.toDateString() === today.toDateString()
                            const position = calculatePosition(stepDate)
                            
                            return (
                              <div 
                                key={step.id} 
                                className="absolute transform -translate-x-1/2"
                                style={{ left: `${position}%` }}
                              >
                                <div className={`w-3 h-3 rounded-full border-2 border-white shadow-md ${
                                  isCompleted ? 'bg-gradient-to-br from-green-400 to-green-600' :
                                  isOverdue ? 'bg-gradient-to-br from-red-400 to-red-600' :
                                  isToday ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' :
                                  'bg-gradient-to-br from-blue-400 to-blue-600'
                                }`}></div>
                              </div>
                            )
                          })}
                          
                          {/* End point */}
                          {endDate && (
                            <div className="absolute right-0 transform translate-x-1/2">
                              <div className="w-3 h-3 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full border-2 border-white shadow-md"></div>
                            </div>
                          )}
                        </div>

                        {/* Simple status indicator */}
                        <div className="mt-4">
                          {(() => {
                            const todayPosition = calculatePosition(today)
                            const progressPosition = goal.progress_percentage || 0
                            const deviation = progressPosition - todayPosition
                            
                            let status = 'on-track'
                            let statusText = 'Podle plánu'
                            let statusColor = 'primary'
                            let statusIcon = '✅'
                            
                            if (deviation > 10) {
                              status = 'ahead'
                              statusText = 'Před plánem'
                              statusColor = 'primary'
                              statusIcon = '🚀'
                            } else if (deviation < -10) {
                              status = 'behind'
                              statusText = 'Za plánem'
                              statusColor = 'red'
                              statusIcon = '⚠️'
                            } else if (deviation < -5) {
                              status = 'slightly-behind'
                              statusText = 'Mírně za plánem'
                              statusColor = 'red'
                              statusIcon = '⏰'
                            }
                            
                            return (
                              <div className={`p-4 rounded-lg border-2 ${
                                statusColor === 'primary' ? 'bg-primary-50 border-primary-200' :
                                'bg-red-50 border-red-200'
                              }`}>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-3">
                                    <span className="text-2xl">{statusIcon}</span>
                                    <div>
                                      <h4 className={`text-lg font-semibold ${
                                        statusColor === 'primary' ? 'text-primary-900' :
                                        'text-red-900'
                                      }`}>
                                        {statusText}
                                      </h4>
                                      <p className={`text-sm ${
                                        statusColor === 'primary' ? 'text-primary-700' :
                                        'text-red-700'
                                      }`}>
                                        {deviation > 0 ? `+${Math.round(deviation)}% před plánem` : 
                                         deviation < 0 ? `${Math.round(deviation)}% za plánem` : 
                                         'Přesně podle plánu'}
                                      </p>
                                    </div>
                                  </div>
                                  
                                  <div className="text-right">
                                    <div className={`text-2xl font-bold ${
                                      statusColor === 'primary' ? 'text-primary-600' :
                                      'text-red-600'
                                    }`}>
                                      {Math.round(progressPosition)}%
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      z {Math.round(todayPosition)}% očekávaných
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Simple progress bar */}
                                <div className="mt-3">
                                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                                    <span>Pokrok</span>
                                    <span>Očekávaný pokrok</span>
                                  </div>
                                  <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                                    {/* Expected progress */}
                                    <div 
                                      className="absolute top-0 h-full bg-gray-400 rounded-full"
                                      style={{ width: `${todayPosition}%` }}
                                    ></div>
                                    
                                    {/* Actual progress */}
                                    <div 
                                      className={`absolute top-0 h-full rounded-full ${
                                        statusColor === 'primary' ? 'bg-primary-500' :
                                        'bg-red-500'
                                      }`}
                                      style={{ width: `${Math.min(progressPosition, 100)}%` }}
                                    ></div>
                                  </div>
                                </div>
                              </div>
                            )
                          })()}
                        </div>
                      </div>
                    </div>
                  )
                })()}
              </div>
            </div>
          )}

          {activeTab === 'steps' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Kroky ({completedSteps}/{totalSteps})
                </h3>
                <button 
                  onClick={() => setShowAddStepModal(true)}
                  className="flex items-center space-x-2 bg-primary-500 text-white px-3 py-2 rounded-lg hover:bg-primary-600 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>{translations?.modals.goalDetail.addStep || 'Přidat krok'}</span>
                </button>
              </div>

              {totalSteps === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Target className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-lg font-medium">{translations?.modals.goalDetail.noSteps || 'Žádné kroky'}</p>
                  <p className="text-sm">{translations?.modals.goalDetail.noStepsDescription || 'K tomuto cíli nejsou přiřazeny žádné kroky.'}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {userSteps.map((step) => (
                    <div
                      key={step.id}
                      onClick={() => onStepEdit?.(step)}
                      className={`p-4 rounded-lg border transition-colors cursor-pointer hover:shadow-md ${
                        step.completed
                          ? 'bg-green-50 border-green-200 hover:bg-green-100'
                          : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onStepComplete?.(step.id)
                          }}
                          disabled={step.isCompleting}
                          className="flex-shrink-0"
                        >
                          {step.isCompleting ? (
                            <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                          ) : step.completed ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : (
                            <Circle className="w-5 h-5 text-gray-300 hover:text-green-500 transition-colors" />
                          )}
                        </button>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-medium text-gray-900">{step.title}</h4>
                            <span className="text-xs text-gray-400">(klikněte pro úpravu)</span>
                          </div>
                          {step.description && (
                            <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                          )}
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <span className="flex items-center">
                              <Calendar className="w-3 h-3 mr-1" />
                              {new Date(step.date).toLocaleDateString('cs-CZ')}
                            </span>
                            {step.step_type === 'custom' && step.custom_type_name && (
                              <span className="flex items-center">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                Deadline: {new Date(step.custom_type_name).toLocaleDateString('cs-CZ')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'metrics' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Metriky cíle
                </h3>
                <button 
                  onClick={() => setShowAddMetricModal(true)}
                  className="flex items-center space-x-2 bg-primary-500 text-white px-3 py-2 rounded-lg hover:bg-primary-600 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>{translations?.modals.goalDetail.addMetric || 'Přidat metriku'}</span>
                </button>
              </div>

              {isLoadingMetrics ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
                  <p className="text-gray-500 mt-2">Načítání metrik...</p>
                </div>
              ) : !Array.isArray(metrics) || metrics.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Gauge className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-lg font-medium">{translations?.modals.goalDetail.noMetrics || 'Žádné metriky'}</p>
                  <p className="text-sm">{translations?.modals.goalDetail.noMetricsDescription || 'Pro tento cíl nejsou nastaveny žádné metriky.'}</p>
                </div>
              ) : Array.isArray(metrics) && metrics.length > 0 ? (
                <div className="space-y-3">
                  {metrics.map((metric) => (
                    <div 
                      key={metric.id} 
                      onClick={() => {
                        // TODO: Open metric edit modal
                        console.log('Edit metric:', metric)
                      }}
                      className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center space-x-1">
                            {metric.type === 'currency' && <DollarSign className="w-4 h-4 text-green-600" />}
                            {metric.type === 'percentage' && <Percent className="w-4 h-4 text-blue-600" />}
                            {metric.type === 'distance' && <Ruler className="w-4 h-4 text-purple-600" />}
                            {metric.type === 'time' && <ClockIcon className="w-4 h-4 text-orange-600" />}
                            {(metric.type === 'number' || metric.type === 'custom') && <Type className="w-4 h-4 text-gray-600" />}
                          </div>
                          <h4 className="font-medium text-gray-900">{metric.name}</h4>
                          <span className="text-xs text-gray-400">(klikněte pro úpravu)</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteMetric(metric.id)
                            }}
                            className="text-red-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        {metric.description && (
                          <p className="text-sm text-gray-600">{metric.description}</p>
                        )}
                        
                        {/* Progress Bar - Larger */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">Pokrok</span>
                            <span className="text-sm font-medium">
                              {metric.current_value} {metric.unit} / {metric.target_value} {metric.unit}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div 
                              className={`h-3 rounded-full transition-all duration-300 ${
                                metric.type === 'currency' ? 'bg-green-500' :
                                metric.type === 'percentage' ? 'bg-blue-500' :
                                metric.type === 'distance' ? 'bg-purple-500' :
                                metric.type === 'time' ? 'bg-orange-500' :
                                'bg-gray-500'
                              }`}
                              style={{ 
                                width: `${Math.min((metric.current_value / metric.target_value) * 100, 100)}%` 
                              }}
                            ></div>
                          </div>
                          <div className="text-right">
                            <span className="text-xs text-gray-500">
                              {Math.round((metric.current_value / metric.target_value) * 100)}%
                            </span>
                          </div>
                        </div>
                        
                        {/* Update Field - Smaller */}
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-500 w-20">Aktualizovat:</span>
                          <input
                            type="number"
                            value={metric.current_value}
                            onChange={(e) => handleUpdateMetric(metric.id, { currentValue: Number(e.target.value) })}
                            className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="Hodnota"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <span className="text-sm text-gray-500">{metric.unit}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Gauge className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-lg font-medium">{translations?.modals.goalDetail.errorLoadingMetrics || 'Chyba při načítání metrik'}</p>
                  <p className="text-sm">{translations?.modals.goalDetail.errorLoadingMetricsDescription || 'Nepodařilo se načíst metriky pro tento cíl.'}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Poznámky ({notes.length})
                </h3>
                <button 
                  onClick={() => setShowAddNoteModal(true)}
                  className="flex items-center space-x-2 bg-primary-500 text-white px-3 py-2 rounded-lg hover:bg-primary-600 transition-colors text-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>{translations?.app.add || 'Přidat'}</span>
                </button>
              </div>

              {isLoadingNotes ? (
                <div className="text-center py-6">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500 mx-auto"></div>
                  <p className="text-gray-500 mt-2 text-sm">Načítání poznámek...</p>
                </div>
              ) : notes.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  <FileText className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm font-medium">{translations?.modals.goalDetail.noNotes || 'Žádné poznámky'}</p>
                  <p className="text-xs">{translations?.modals.goalDetail.noNotesDescription || 'Pro tento cíl nejsou nastaveny žádné poznámky.'}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {notes.map((note) => (
                    <div 
                      key={note.id} 
                      onClick={() => {
                        // TODO: Implement note edit functionality
                        console.log('Edit note:', note)
                      }}
                      className="group relative bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 cursor-pointer"
                      style={{ minHeight: '120px' }}
                    >
                      {/* Compact Modern Note Content */}
                      <div className="p-3 h-full flex flex-col">
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-gray-900 text-sm line-clamp-1 flex-1">
                              {note.title}
                            </h4>
                            <div className="flex items-center space-x-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  // TODO: Implement note delete functionality
                                  console.log('Delete note:', note)
                                }}
                                className="p-1 bg-gray-100 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                title={translations?.modals.goalDetail.deleteNote || "Smazat poznámku"}
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          <p className="text-gray-700 text-xs line-clamp-4 whitespace-pre-wrap">
                            {note.content}
                          </p>
                        </div>
                        
                        {/* Compact Metadata */}
                        <div className="mt-2 pt-2 border-t border-gray-100">
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-3 h-3" />
                              <span>{new Date(note.created_at).toLocaleDateString('cs-CZ')}</span>
                            </div>
                            {note.updated_at !== note.created_at && (
                              <span className="text-xs">Upraveno</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Subtle accent line */}
                      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-500 to-blue-500 rounded-t-lg"></div>
                      
                      {/* Click hint */}
                      <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <span className="text-xs text-gray-400">(klikněte)</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}


        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {translations?.common.close || 'Zavřít'}
          </button>
          <button
            onClick={() => {
              console.log('🎯 GoalDetailModal: Save button clicked')
              handleSave()
            }}
            disabled={isSaving}
            className="px-4 py-2 text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isSaving && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            )}
            <span>{translations?.common.save || 'Uložit'}</span>
          </button>
          {onDelete && (
            <button
              onClick={() => onDelete(goal.id)}
              className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
            >
              {translations?.common.delete || 'Smazat'}
            </button>
          )}
        </div>
      </div>
      
      {/* Add Metric Modal */}
      {showAddMetricModal && (
        <AddMetricModal
          goalId={goal.id}
          onClose={() => setShowAddMetricModal(false)}
          onSave={handleAddMetric}
        />
      )}

      {/* Unified Step Modal */}
      <UnifiedStepModal
        isOpen={showAddStepModal}
        onClose={() => setShowAddStepModal(false)}
        onSave={handleAddStep}
        goals={[goal]} // Only show the current goal
        preselectedGoalId={goal.id}
        width="medium"
        disableGoalSelection={true}
      />

      {/* Add Note Modal */}
      {showAddNoteModal && (
        <AddNoteModal
          goalId={goal.id}
          onClose={() => setShowAddNoteModal(false)}
          onSave={handleAddNote}
        />
      )}
    </div>
  )
})

// Add Note Modal Component
interface AddNoteModalProps {
  goalId: string
  onClose: () => void
  onSave: (noteData: any) => void
}

const AddNoteModal = memo(function AddNoteModal({ goalId, onClose, onSave }: AddNoteModalProps) {
  const { translations } = useTranslations()
  const [formData, setFormData] = useState({
    title: '',
    content: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim() || !formData.content.trim()) return

    setIsSubmitting(true)
    try {
      await onSave(formData)
    } catch (error) {
      console.error('Error saving note:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Nová poznámka</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Název poznámky
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Zadejte název poznámky..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Obsah poznámky
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              rows={6}
              placeholder="Zadejte obsah poznámky..."
              required
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              {translations?.common.cancel || 'Zrušit'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? (translations?.common.saving || 'Ukládám...') : (translations?.modals.goalDetail.createNote || 'Vytvořit poznámku')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
})

const AddMetricModal = memo(function AddMetricModal({ goalId, onClose, onSave }: { goalId: string, onClose: () => void, onSave: (metricData: any) => void }) {
  const { translations } = useTranslations()
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'number' as const,
    unit: 'ks',
    targetValue: 0,
    currentValue: 0
  })

  const metricTypes = [
    { id: 'number', name: 'Počet', icon: Type, defaultUnit: 'ks' },
    { id: 'currency', name: 'Měna', icon: DollarSign, defaultUnit: 'Kč' },
    { id: 'percentage', name: 'Procento', icon: Percent, defaultUnit: '%' },
    { id: 'distance', name: 'Vzdálenost', icon: Ruler, defaultUnit: 'km' },
    { id: 'time', name: 'Čas', icon: ClockIcon, defaultUnit: 'hod' },
    { id: 'custom', name: 'Vlastní', icon: Type, defaultUnit: '' },
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.name.trim() && formData.unit.trim() && formData.targetValue > 0) {
      onSave(formData)
    }
  }

  const handleTypeChange = (type: string) => {
    const selectedType = metricTypes.find(t => t.id === type)
    setFormData(prev => ({
      ...prev,
      type: type as any,
      unit: selectedType?.defaultUnit || ''
    }))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Přidat metriku</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Název metriky *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Např. Ušetřená částka"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Popis (volitelné)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                rows={2}
                placeholder="Popište metriku podrobněji..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Typ metriky *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => handleTypeChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                >
                  {metricTypes.map(type => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Jednotka *
                </label>
                <input
                  type="text"
                  value={formData.unit}
                  onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Kč, km, %"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cílová hodnota *
                </label>
                <input
                  type="number"
                  value={formData.targetValue}
                  onChange={(e) => setFormData(prev => ({ ...prev, targetValue: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="1000000"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Aktuální stav
                </label>
                <input
                  type="number"
                  value={formData.currentValue}
                  onChange={(e) => setFormData(prev => ({ ...prev, currentValue: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="0"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                {translations?.common.cancel || 'Zrušit'}
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
              >
                Přidat metriku
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
})

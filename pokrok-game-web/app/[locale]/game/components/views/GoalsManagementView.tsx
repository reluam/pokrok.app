'use client'

import { useState, useMemo, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useTranslations, useLocale } from 'next-intl'
import { getLocalDateString } from '../utils/dateHelpers'
import { Edit, X, Plus, Target, Calendar } from 'lucide-react'

interface GoalsManagementViewProps {
  goals: any[]
  aspirations: any[]
  areas: any[]
  onGoalsUpdate?: (goals: any[]) => void
  setOverviewBalances?: (setter: (prev: Record<string, any>) => Record<string, any>) => void
  userId?: string | null
  player?: any
}

export function GoalsManagementView({
  goals = [],
  aspirations = [],
  areas = [],
  onGoalsUpdate,
  setOverviewBalances,
  userId,
  player
}: GoalsManagementViewProps) {
  const t = useTranslations()
  const localeCode = useLocale()
  
  // Filters
  const [goalsStatusFilter, setGoalsStatusFilter] = useState<'all' | 'active' | 'completed' | 'considering'>('all')
  const [goalsAreaFilter, setGoalsAreaFilter] = useState<string | null>(null)
  const [goalsAspirationFilter, setGoalsAspirationFilter] = useState<string | null>(null)

  // Counters for steps and milestones per goal
  const [goalCounts, setGoalCounts] = useState<Record<string, { steps: number; milestones: number }>>({})

  // Quick edit modals for goals
  const [quickEditGoalId, setQuickEditGoalId] = useState<string | null>(null)
  const [quickEditGoalField, setQuickEditGoalField] = useState<'status' | 'area' | 'aspiration' | 'date' | null>(null)
  const [quickEditGoalPosition, setQuickEditGoalPosition] = useState<{ top: number; left: number } | null>(null)
  const [selectedDateForGoal, setSelectedDateForGoal] = useState<Date>(new Date())

  // Edit modal
  const [editingGoal, setEditingGoal] = useState<any | null>(null)
  const [activeTab, setActiveTab] = useState<'general' | 'milestones' | 'steps'>('general')
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    target_date: '',
    areaId: '',
    aspirationId: '',
    status: 'active',
    is_focused: false,
    steps: [] as Array<{ 
      id: string; 
      title: string; 
      description?: string; 
      date?: string; 
      completed?: boolean; 
      isEditing?: boolean;
      target_value?: number | null;
      current_value?: number;
      update_value?: number | null;
      update_frequency?: 'daily' | 'weekly' | 'monthly' | null;
      update_day_of_week?: number | null;
      update_day_of_month?: number | null;
    }>,
    milestones: [] as Array<{ 
      id: string; 
      title: string; 
      description?: string; 
      completed?: boolean; 
      isEditing?: boolean;
      target_value?: number | null;
      current_value?: number;
      update_value?: number | null;
      update_frequency?: 'daily' | 'weekly' | 'monthly' | null;
      update_day_of_week?: number | null;
      update_day_of_month?: number | null;
    }>
  })

  // Initialize date value when date modal opens
  useEffect(() => {
    if (quickEditGoalField === 'date' && quickEditGoalId) {
      const goal = goals.find((g: any) => g.id === quickEditGoalId)
      if (goal) {
        const initialDate = goal.target_date ? new Date(goal.target_date) : new Date()
        setSelectedDateForGoal(initialDate)
      }
    }
  }, [quickEditGoalField, quickEditGoalId, goals])

  // Auto-open modal if flag is set
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const autoOpen = localStorage.getItem('autoOpenGoalModal')
      if (autoOpen === 'true') {
        localStorage.removeItem('autoOpenGoalModal')
        setEditingGoal({ id: null, title: '', description: '', target_date: '', areaId: '', aspirationId: '', status: 'active' })
        setEditFormData({
          title: '',
          description: '',
          target_date: '',
          areaId: '',
          aspirationId: '',
          status: 'active',
          is_focused: false,
          steps: [],
          milestones: []
        })
      }
    }
  }, [])

  // Initialize edit form when editing goal
  useEffect(() => {
    if (editingGoal) {
      setEditFormData({
        title: editingGoal.title || '',
        description: editingGoal.description || '',
        target_date: editingGoal.target_date ? new Date(editingGoal.target_date).toISOString().split('T')[0] : '',
        areaId: editingGoal.area_id || editingGoal.areaId || '',
        aspirationId: editingGoal.aspiration_id || editingGoal.aspirationId || '',
        status: editingGoal.status || 'active',
        is_focused: editingGoal.is_focused || false,
        steps: [],
        milestones: []
      })

      // Load steps and milestones
      const loadStepsAndMilestones = async () => {
        if (editingGoal.id) {
          // Load steps
          try {
            const stepsResponse = await fetch(`/api/daily-steps?goalId=${editingGoal.id}`)
            if (stepsResponse.ok) {
              const steps = await stepsResponse.json()
              const stepsArray = Array.isArray(steps) ? steps : []
              setEditFormData(prev => ({
                ...prev,
                steps: stepsArray.map((step: any) => ({
                  id: step.id,
                  title: step.title,
                  description: step.description || '',
                  date: step.date ? (step.date.includes('T') ? step.date.split('T')[0] : step.date) : '',
                  completed: step.completed || false,
                  isEditing: false
                }))
              }))
            }
          } catch (error) {
            console.error('Error loading steps:', error)
          }

          // Load milestones
          try {
            const milestonesResponse = await fetch(`/api/cesta/goal-milestones?goalId=${editingGoal.id}`)
            if (milestonesResponse.ok) {
              const data = await milestonesResponse.json()
              const milestonesArray = data.milestones || []
              setEditFormData(prev => ({
                ...prev,
                milestones: milestonesArray.map((milestone: any) => ({
                  id: milestone.id,
                  title: milestone.title,
                  description: milestone.description || '',
                  completed: milestone.completed || false,
                  isEditing: false
                }))
              }))
            }
          } catch (error) {
            console.error('Error loading milestones:', error)
          }
        }
      }

      loadStepsAndMilestones()
    }
  }, [editingGoal])

  // Handlers
  const handleOpenEditModal = (goal: any) => {
    setEditingGoal({
      ...goal,
      areaId: goal.area_id || null,
      aspirationId: goal.aspiration_id || goal.aspirationId || null
    })
  }

  const handleCreateGoal = async () => {
    if (!editFormData.title.trim()) {
      alert('Název cíle je povinný')
      return
    }

    const currentUserId = userId || player?.user_id
    if (!currentUserId) {
      alert('Chyba: Uživatel není nalezen')
      return
    }

    try {
      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: currentUserId,
          title: editFormData.title,
          description: editFormData.description,
          targetDate: editFormData.target_date || null,
          areaId: editFormData.areaId || null,
          aspirationId: editFormData.aspirationId || null,
          status: editFormData.status,
          isFocused: editFormData.is_focused
        }),
      })

      if (response.ok) {
        const newGoal = await response.json()
        const updatedGoals = [...goals, newGoal]
        onGoalsUpdate?.(updatedGoals)
        
        // Update overview balance if goal has aspiration
        if (newGoal.aspiration_id && setOverviewBalances) {
          try {
            const balanceResponse = await fetch(`/api/aspirations/balance?aspirationId=${newGoal.aspiration_id}`)
            if (balanceResponse.ok) {
              const balance = await balanceResponse.json()
              setOverviewBalances((prev: Record<string, any>) => ({
                ...prev,
                [newGoal.aspiration_id]: balance
              }))
            }
          } catch (error) {
            console.error('Error updating aspiration balance:', error)
          }
        }
        
        // Reset form and close modal
        setEditingGoal(null)
        setEditFormData({
          title: '',
          description: '',
          target_date: '',
          areaId: '',
          aspirationId: '',
          status: 'active',
          is_focused: false,
          steps: [],
          milestones: []
        })
      } else {
        alert('Nepodařilo se vytvořit cíl')
      }
    } catch (error) {
      console.error('Error creating goal:', error)
      alert('Chyba při vytváření cíle')
    }
  }

  const handleUpdateGoal = async () => {
    if (!editFormData.title.trim()) {
      alert('Název cíle je povinný')
      return
    }

    if (!editingGoal) return

    try {
      const response = await fetch('/api/goals', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          goalId: editingGoal.id,
          title: editFormData.title,
          description: editFormData.description,
          target_date: editFormData.target_date || null,
          areaId: editFormData.areaId || null,
          aspirationId: editFormData.aspirationId || null,
          status: editFormData.status,
          isFocused: editFormData.is_focused
        }),
      })

      if (response.ok) {
        const updatedGoal = await response.json()
        const updatedGoals = goals.map((g: any) => g.id === updatedGoal.id ? updatedGoal : g)
        onGoalsUpdate?.(updatedGoals)
        setEditingGoal(null)
      } else {
        alert('Nepodařilo se aktualizovat cíl')
      }
    } catch (error) {
      console.error('Error updating goal:', error)
      alert('Chyba při aktualizaci cíle')
    }
  }

  const handleDeleteGoal = async () => {
    if (!editingGoal) return

    if (!confirm('Opravdu chcete smazat tento cíl? Tato akce je nevratná.')) {
      return
    }

    try {
      const response = await fetch('/api/goals', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ goalId: editingGoal.id }),
      })

      if (response.ok) {
        const updatedGoals = goals.filter((g: any) => g.id !== editingGoal.id)
        onGoalsUpdate?.(updatedGoals)
        setEditingGoal(null)
      } else {
        alert('Nepodařilo se smazat cíl')
      }
    } catch (error) {
      console.error('Error deleting goal:', error)
      alert('Chyba při mazání cíle')
    }
  }

  // Step handlers
  const handleAddStep = () => {
    setEditFormData({
      ...editFormData,
      steps: [...editFormData.steps, { id: `temp-${crypto.randomUUID()}`, title: '', description: '', date: '', isEditing: true }]
    })
  }

  const handleSaveStep = async (stepId: string) => {
    const step = editFormData.steps.find(s => s.id === stepId)
    if (!step || !step.title.trim() || !editingGoal) {
      if (!step?.title.trim()) {
        alert('Název kroku je povinný')
      }
      return
    }

    const currentUserId = userId || player?.user_id
    if (!currentUserId) {
      alert('Chyba: Uživatel není nalezen')
      return
    }

    try {
      if (step.id.startsWith('temp-')) {
        // New step - create
        const response = await fetch('/api/daily-steps', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: currentUserId,
            goalId: editingGoal.id,
            title: step.title.trim(),
            description: step.description || '',
            date: step.date || null
          })
        })
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Neznámá chyba' }))
          alert(`Chyba při ukládání kroku: ${errorData.error || 'Nepodařilo se uložit krok'}`)
          return
        }

        const savedStep = await response.json()
        
        // Reload all steps to ensure consistency
        try {
          const stepsResponse = await fetch(`/api/daily-steps?goalId=${editingGoal.id}`)
          if (stepsResponse.ok) {
            const steps = await stepsResponse.json()
            const stepsArray = Array.isArray(steps) ? steps : []
            setEditFormData(prev => ({
              ...prev,
              steps: stepsArray.map((s: any) => ({
                id: s.id,
                title: s.title,
                description: s.description || '',
                date: s.date ? (s.date.includes('T') ? s.date.split('T')[0] : s.date) : '',
                completed: s.completed || false,
                isEditing: false
              }))
            }))
            // Update counts - reload goal counts if needed
            // Note: goalCounts are updated automatically when goals are reloaded
          }
        } catch (reloadError) {
          console.error('Error reloading steps:', reloadError)
          // Fallback: update just the saved step
          setEditFormData(prev => ({
            ...prev,
            steps: prev.steps.map(s => 
              s.id === stepId 
                ? { 
                    ...savedStep, 
                    isEditing: false, 
                    date: savedStep.date ? (savedStep.date.includes('T') ? savedStep.date.split('T')[0] : savedStep.date) : '' 
                  } 
                : s
            )
          }))
          // Update counts even on error - reload goal counts if needed
          // Note: goalCounts are updated automatically when goals are reloaded
        }
      } else {
        // Existing step - update
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
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Neznámá chyba' }))
          alert(`Chyba při aktualizaci kroku: ${errorData.error || 'Nepodařilo se aktualizovat krok'}`)
          return
        }

        const updatedStep = await response.json()
        
        // Reload all steps to ensure consistency
        try {
          const stepsResponse = await fetch(`/api/daily-steps?goalId=${editingGoal.id}`)
          if (stepsResponse.ok) {
            const steps = await stepsResponse.json()
            const stepsArray = Array.isArray(steps) ? steps : []
            setEditFormData(prev => ({
              ...prev,
              steps: stepsArray.map((s: any) => ({
                id: s.id,
                title: s.title,
                description: s.description || '',
                date: s.date ? (s.date.includes('T') ? s.date.split('T')[0] : s.date) : '',
                completed: s.completed || false,
                isEditing: false
              }))
            }))
            // Update counts - reload goal counts if needed
            // Note: goalCounts are updated automatically when goals are reloaded
          }
        } catch (reloadError) {
          console.error('Error reloading steps:', reloadError)
          // Fallback: update just the updated step
          setEditFormData(prev => ({
            ...prev,
            steps: prev.steps.map(s => 
              s.id === stepId 
                ? { 
                    ...updatedStep, 
                    isEditing: false,
                    date: updatedStep.date ? (updatedStep.date.includes('T') ? updatedStep.date.split('T')[0] : updatedStep.date) : ''
                  } 
                : s
            )
          }))
          // Update counts even on error - reload goal counts if needed
          // Note: goalCounts are updated automatically when goals are reloaded
        }
      }
    } catch (error) {
      console.error('Error saving step:', error)
      alert('Chyba při ukládání kroku: ' + (error instanceof Error ? error.message : 'Neznámá chyba'))
    }
  }

  const handleDeleteStep = async (stepId: string) => {
    const step = editFormData.steps.find(s => s.id === stepId)
    if (!step) return

    // If it's a new step (not saved yet), just remove it
    if (step.id.startsWith('temp-')) {
      setEditFormData(prev => ({
        ...prev,
        steps: prev.steps.filter(s => s.id !== stepId)
      }))
      return
    }

    // Confirm deletion
    if (!confirm('Opravdu chcete smazat tento krok?')) {
      return
    }

    // Delete from API
    try {
      const response = await fetch(`/api/daily-steps?stepId=${stepId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Neznámá chyba' }))
        alert(`Chyba při mazání kroku: ${errorData.error || 'Nepodařilo se smazat krok'}`)
        return
      }

      // Reload all steps to ensure consistency
      if (editingGoal?.id) {
        try {
          const stepsResponse = await fetch(`/api/daily-steps?goalId=${editingGoal.id}`)
          if (stepsResponse.ok) {
            const steps = await stepsResponse.json()
            const stepsArray = Array.isArray(steps) ? steps : []
            setEditFormData(prev => ({
              ...prev,
              steps: stepsArray.map((s: any) => ({
                id: s.id,
                title: s.title,
                description: s.description || '',
                date: s.date ? (s.date.includes('T') ? s.date.split('T')[0] : s.date) : '',
                completed: s.completed || false,
                isEditing: false
              }))
            }))
            // Update counts - reload goal counts if needed
            // Note: goalCounts are updated automatically when goals are reloaded
          }
        } catch (reloadError) {
          console.error('Error reloading steps:', reloadError)
          // Fallback: just remove from local state
          setEditFormData(prev => ({
            ...prev,
            steps: prev.steps.filter(s => s.id !== stepId)
          }))
          // Update counts even on error - reload goal counts if needed
          // Note: goalCounts are updated automatically when goals are reloaded
        }
      } else {
        // Fallback: just remove from local state
        setEditFormData(prev => ({
          ...prev,
          steps: prev.steps.filter(s => s.id !== stepId)
        }))
      }
    } catch (error) {
      console.error('Error deleting step:', error)
      alert('Chyba při mazání kroku: ' + (error instanceof Error ? error.message : 'Neznámá chyba'))
    }
  }

  // Milestone handlers
  const handleAddMilestone = () => {
    setEditFormData({
      ...editFormData,
      milestones: [...editFormData.milestones, { 
        id: `temp-${crypto.randomUUID()}`, 
        title: '', 
        description: '', 
        isEditing: true,
        target_value: null,
        current_value: 0,
        update_value: null,
        update_frequency: null,
        update_day_of_week: null,
        update_day_of_month: null
      }]
    })
  }

  const handleSaveMilestone = async (milestoneId: string) => {
    const milestone = editFormData.milestones.find(m => m.id === milestoneId)
    if (!milestone || !milestone.title.trim() || !editingGoal) return

    try {
      if (milestone.id.startsWith('temp-')) {
        // New milestone - create
        const response = await fetch('/api/cesta/goal-milestones', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            goalId: editingGoal.id,
            title: milestone.title.trim(),
            description: milestone.description || '',
            order: editFormData.milestones.length
          })
        })
        if (response.ok) {
          const data = await response.json()
          const savedMilestone = data.milestone || data
          setEditFormData(prev => ({
            ...prev,
            milestones: prev.milestones.map(m => m.id === milestoneId ? { 
              ...savedMilestone, 
              isEditing: false,
              target_value: savedMilestone.target_value || null,
              current_value: savedMilestone.current_value || 0,
              update_value: savedMilestone.update_value || null,
              update_frequency: savedMilestone.update_frequency || null,
              update_day_of_week: savedMilestone.update_day_of_week || null,
              update_day_of_month: savedMilestone.update_day_of_month || null
            } : m)
          }))
          // Update counts - reload goal counts if needed
          // Note: goalCounts are updated automatically when goals are reloaded
        }
      } else {
        // Existing milestone - update
        const response = await fetch('/api/cesta/goal-milestones', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            milestoneId: milestone.id,
            title: milestone.title.trim(),
            description: milestone.description || '',
            completed: milestone.completed || false,
            order: editFormData.milestones.indexOf(milestone)
          })
        })
        if (response.ok) {
          setEditFormData(prev => ({
            ...prev,
            milestones: prev.milestones.map(m => m.id === milestoneId ? { ...m, isEditing: false } : m)
          }))
          // Update counts - reload goal counts if needed
          // Note: goalCounts are updated automatically when goals are reloaded
        }
      }
    } catch (error) {
      console.error('Error saving milestone:', error)
      alert('Chyba při ukládání milníku')
    }
  }

  const handleDeleteMilestone = async (milestoneId: string) => {
    const milestone = editFormData.milestones.find(m => m.id === milestoneId)
    if (!milestone) return

    // If it's a new milestone (not saved yet), just remove it
    if (milestone.id.startsWith('temp-')) {
      setEditFormData(prev => ({
        ...prev,
        milestones: prev.milestones.filter(m => m.id !== milestoneId)
      }))
      return
    }

    // Delete from API
    try {
      const response = await fetch(`/api/cesta/goal-milestones?milestoneId=${milestoneId}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        setEditFormData(prev => ({
          ...prev,
          milestones: prev.milestones.filter(m => m.id !== milestoneId)
        }))
        // Update counts - reload goal counts if needed
        // Note: goalCounts are updated automatically when goals are reloaded
      }
    } catch (error) {
      console.error('Error deleting milestone:', error)
      alert('Chyba při mazání milníku')
    }
  }

  // Sort goals
  const sortedGoals = useMemo(() => {
    return [...goals].sort((a, b) => {
      if (a.status === 'completed' && b.status !== 'completed') return 1
      if (a.status !== 'completed' && b.status === 'completed') return -1
      return 0
    })
  }, [goals])

  // Filter goals
  const filteredGoals = useMemo(() => {
    return sortedGoals.filter((goal: any) => {
      if (goalsStatusFilter !== 'all' && goal.status !== goalsStatusFilter) {
        return false
      }
      if (goalsAreaFilter && goal.area_id !== goalsAreaFilter) {
        return false
      }
      if (goalsAspirationFilter && (goal.aspiration_id || goal.aspirationId) !== goalsAspirationFilter) {
        return false
      }
      return true
    })
  }, [sortedGoals, goalsStatusFilter, goalsAreaFilter, goalsAspirationFilter])

  return (
    <div className="w-full h-full flex flex-col">
      {/* Filters Row */}
      <div className="flex items-center justify-between gap-4 px-4 py-2 bg-white border-b border-gray-200">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Status Filter */}
          <select
            value={goalsStatusFilter}
            onChange={(e) => setGoalsStatusFilter(e.target.value as any)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
          >
            <option value="all">{t('goals.filters.status.all')}</option>
            <option value="active">{t('goals.filters.status.active')}</option>
            <option value="completed">{t('goals.filters.status.completed')}</option>
            <option value="considering">{t('goals.filters.status.considering')}</option>
          </select>
          
          {/* Area Filter */}
          <select
            value={goalsAreaFilter || ''}
            onChange={(e) => setGoalsAreaFilter(e.target.value || null)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white min-w-[150px]"
          >
            <option value="">{t('goals.filters.area.all')}</option>
            {areas.map((area: any) => (
              <option key={area.id} value={area.id}>{area.name}</option>
            ))}
          </select>
          
          {/* Aspiration Filter */}
          <select
            value={goalsAspirationFilter || ''}
            onChange={(e) => setGoalsAspirationFilter(e.target.value || null)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white min-w-[150px]"
          >
            <option value="">{t('goals.filters.aspiration.all')}</option>
            {aspirations.map((aspiration: any) => (
              <option key={aspiration.id} value={aspiration.id}>{aspiration.title}</option>
            ))}
          </select>
        </div>
        
        {/* Add Goal Button */}
        <button
          onClick={() => {
            setEditingGoal({ id: null, title: '', description: '', target_date: '', areaId: '', aspirationId: '', status: 'active' })
            setEditFormData({
              title: '',
              description: '',
              target_date: '',
              areaId: '',
              aspirationId: '',
              status: 'active',
              is_focused: false,
              steps: [],
              milestones: []
            })
          }}
          className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          {t('goals.add')}
        </button>
      </div>
      
      {/* Goals Table */}
      <div className="flex-1 overflow-y-auto">
        <div className="w-full overflow-x-auto">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden m-4">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 first:pl-6">Název</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 w-32">Status</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 w-40">Datum</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 w-40">Oblast</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 w-40">Aspirace</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 w-32">Kroky / Milníky</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700 w-12 last:pr-6"></th>
                </tr>
              </thead>
              <tbody>
                {filteredGoals.map((goal: any) => {
                  const goalArea = goal.area_id ? areas.find((a: any) => a.id === goal.area_id) : null
                  const goalAspiration = goal.aspiration_id || goal.aspirationId ? aspirations.find((a: any) => a.id === (goal.aspiration_id || goal.aspirationId)) : null
                  
                  return (
                    <tr
                      key={goal.id}
                      onClick={() => handleOpenEditModal(goal)}
                      className={`border-b border-gray-100 hover:bg-orange-50/30 transition-all duration-200 last:border-b-0 cursor-pointer ${
                        goal.status === 'completed' ? 'bg-orange-50/30 hover:bg-orange-50/50' : 'bg-white'
                      }`}
                    >
                      <td className="px-4 py-2 first:pl-6">
                        <span className={`font-semibold text-sm ${goal.status === 'completed' ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                          {goal.title}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        {goal.status === 'completed' ? (
                          <span className="text-xs px-2.5 py-1.5 rounded-lg font-medium bg-blue-100 text-blue-700">
                            {t('goals.status.completed')}
                          </span>
                        ) : (
                          <button
                            onClick={async (e) => {
                              e.stopPropagation()
                              const newStatus = goal.status === 'active' ? 'considering' : 'active'
                              try {
                                const response = await fetch('/api/goals', {
                                  method: 'PUT',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ goalId: goal.id, status: newStatus })
                                })
                                if (response.ok) {
                                  const updatedGoal = await response.json()
                                  const updatedGoals = goals.map((g: any) => g.id === goal.id ? updatedGoal : g)
                                  onGoalsUpdate?.(updatedGoals)
                                }
                              } catch (error) {
                                console.error('Error updating goal status:', error)
                              }
                            }}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${
                              goal.status === 'active' ? 'bg-orange-600' : 'bg-gray-300'
                            }`}
                            title={goal.status === 'active' ? 'Aktivní - klikněte pro odložení' : 'Odložené - klikněte pro aktivaci'}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                goal.status === 'active' ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        <span
                          onClick={(e) => {
                            e.stopPropagation()
                            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                            setQuickEditGoalPosition({ top: rect.bottom + 4, left: rect.left })
                            setQuickEditGoalId(goal.id)
                            setQuickEditGoalField('date')
                          }}
                          className="text-xs text-gray-700 cursor-pointer hover:text-orange-600 transition-colors"
                        >
                          {goal.target_date ? (
                            new Date(goal.target_date).toLocaleDateString(localeCode)
                          ) : (
                            <span className="text-gray-400">Bez data</span>
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <span
                          onClick={(e) => {
                            e.stopPropagation()
                            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                            setQuickEditGoalPosition({ top: rect.bottom + 4, left: rect.left })
                            setQuickEditGoalId(goal.id)
                            setQuickEditGoalField('area')
                          }}
                          className="cursor-pointer hover:opacity-80 transition-opacity"
                        >
                          {goalArea ? (
                            <span className="text-xs px-2.5 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-700 font-medium">
                              {goalArea.name}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">Bez oblasti</span>
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-2 last:pr-6">
                        <div
                          onClick={(e) => {
                            e.stopPropagation()
                            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                            setQuickEditGoalPosition({ top: rect.bottom + 4, left: rect.left })
                            setQuickEditGoalId(goal.id)
                            setQuickEditGoalField('aspiration')
                          }}
                          className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity"
                        >
                          {goalAspiration ? (
                            <>
                              <div 
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: goalAspiration.color || '#9333EA' }}
                              />
                              <span className="text-xs text-gray-700 truncate max-w-[150px]">
                                {goalAspiration.title}
                              </span>
                            </>
                          ) : (
                            <span className="text-xs text-gray-400">Bez aspirace</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-600 flex items-center gap-1">
                            <Target className="w-3 h-3" />
                            {goalCounts[goal.id]?.steps || 0}
                          </span>
                          <span className="text-xs text-gray-400">/</span>
                          <span className="text-xs text-gray-600 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {goalCounts[goal.id]?.milestones || 0}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2 last:pr-6">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleOpenEditModal(goal)
                          }}
                          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                          title={t('common.edit') || 'Upravit'}
                        >
                          <Edit className="w-4 h-4 text-gray-600" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
                {filteredGoals.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      <p className="text-lg">Žádné cíle nejsou nastavené</p>
                      <p className="text-sm">Klikněte na tlačítko výše pro přidání nového cíle</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Quick Edit Modals for Goals */}
      {quickEditGoalId && quickEditGoalPosition && typeof window !== 'undefined' && createPortal(
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={(e) => {
              e.stopPropagation()
              setQuickEditGoalId(null)
              setQuickEditGoalField(null)
              setQuickEditGoalPosition(null)
            }}
          />
          <div 
            className="fixed z-50 bg-white border-2 border-gray-200 rounded-xl shadow-2xl p-4 min-w-[250px] max-w-[90vw]"
            style={(() => {
              if (typeof window === 'undefined') {
                return {
                  top: `${quickEditGoalPosition.top}px`,
                  left: `${quickEditGoalPosition.left}px`
                }
              }
              
              // Calculate adjusted position to keep modal on screen
              const modalWidth = 250 // min-w-[250px]
              const modalHeight = 200 // estimated height
              const padding = 10 // padding from screen edges
              
              let adjustedTop = quickEditGoalPosition.top
              let adjustedLeft = quickEditGoalPosition.left
              
              // Adjust horizontal position
              if (adjustedLeft + modalWidth > window.innerWidth - padding) {
                adjustedLeft = window.innerWidth - modalWidth - padding
              }
              if (adjustedLeft < padding) {
                adjustedLeft = padding
              }
              
              // Adjust vertical position
              if (adjustedTop + modalHeight > window.innerHeight - padding) {
                adjustedTop = quickEditGoalPosition.top - modalHeight - 40 // Position above the element
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
              const goal = filteredGoals.find((g: any) => g.id === quickEditGoalId)
              if (!goal) return null
              
              if (quickEditGoalField === 'status') {
                return (
                  <>
                    <div className="max-h-[300px] overflow-y-auto">
                      <button
                        onClick={async (e) => {
                          e.stopPropagation()
                          try {
                            const response = await fetch('/api/goals', {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ goalId: goal.id, status: 'active' })
                            })
                            if (response.ok) {
                              const updatedGoal = await response.json()
                              const updatedGoals = goals.map((g: any) => g.id === goal.id ? updatedGoal : g)
                              onGoalsUpdate?.(updatedGoals)
                              setQuickEditGoalId(null)
                              setQuickEditGoalField(null)
                              setQuickEditGoalPosition(null)
                            }
                          } catch (error) {
                            console.error('Error updating goal status:', error)
                          }
                        }}
                        className={`w-full text-left px-4 py-3 text-sm hover:bg-purple-50 transition-colors ${
                          goal.status === 'active' ? 'bg-purple-50 text-purple-700 font-semibold' : 'text-gray-700'
                        }`}
                      >
                        {t('goals.status.active')}
                      </button>
                      <button
                        onClick={async (e) => {
                          e.stopPropagation()
                          try {
                            const response = await fetch('/api/goals', {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ goalId: goal.id, status: 'completed' })
                            })
                            if (response.ok) {
                              const updatedGoal = await response.json()
                              const updatedGoals = goals.map((g: any) => g.id === goal.id ? updatedGoal : g)
                              onGoalsUpdate?.(updatedGoals)
                              setQuickEditGoalId(null)
                              setQuickEditGoalField(null)
                              setQuickEditGoalPosition(null)
                            }
                          } catch (error) {
                            console.error('Error updating goal status:', error)
                          }
                        }}
                        className={`w-full text-left px-4 py-3 text-sm hover:bg-purple-50 transition-colors ${
                          goal.status === 'completed' ? 'bg-purple-50 text-purple-700 font-semibold' : 'text-gray-700'
                        }`}
                      >
                        {t('goals.status.completed')}
                      </button>
                      <button
                        onClick={async (e) => {
                          e.stopPropagation()
                          try {
                            const response = await fetch('/api/goals', {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ goalId: goal.id, status: 'considering' })
                            })
                            if (response.ok) {
                              const updatedGoal = await response.json()
                              const updatedGoals = goals.map((g: any) => g.id === goal.id ? updatedGoal : g)
                              onGoalsUpdate?.(updatedGoals)
                              setQuickEditGoalId(null)
                              setQuickEditGoalField(null)
                              setQuickEditGoalPosition(null)
                            }
                          } catch (error) {
                            console.error('Error updating goal status:', error)
                          }
                        }}
                        className={`w-full text-left px-4 py-3 text-sm hover:bg-purple-50 transition-colors ${
                          goal.status === 'considering' ? 'bg-purple-50 text-purple-700 font-semibold' : 'text-gray-700'
                        }`}
                      >
                        {t('goals.status.considering')}
                      </button>
                    </div>
                  </>
                )
              }
              
              if (quickEditGoalField === 'area') {
                return (
                  <>
                    <div className="max-h-[300px] overflow-y-auto">
                      <button
                        onClick={async (e) => {
                          e.stopPropagation()
                          try {
                            const response = await fetch('/api/goals', {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ goalId: goal.id, areaId: null })
                            })
                            if (response.ok) {
                              const updatedGoal = await response.json()
                              const updatedGoals = goals.map((g: any) => g.id === goal.id ? updatedGoal : g)
                              onGoalsUpdate?.(updatedGoals)
                              setQuickEditGoalId(null)
                              setQuickEditGoalField(null)
                              setQuickEditGoalPosition(null)
                            }
                          } catch (error) {
                            console.error('Error updating goal area:', error)
                          }
                        }}
                        className={`w-full text-left px-4 py-3 text-sm hover:bg-purple-50 transition-colors ${
                          !goal.area_id ? 'bg-purple-50 text-purple-700 font-semibold' : 'text-gray-700'
                        }`}
                      >
                        {t('goals.noArea') || 'Bez oblasti'}
                      </button>
                      {areas.map((area: any) => (
                        <button
                          key={area.id}
                          onClick={async (e) => {
                            e.stopPropagation()
                            try {
                              const response = await fetch('/api/goals', {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ goalId: goal.id, areaId: area.id })
                              })
                              if (response.ok) {
                                const updatedGoal = await response.json()
                                const updatedGoals = goals.map((g: any) => g.id === goal.id ? updatedGoal : g)
                                onGoalsUpdate?.(updatedGoals)
                                setQuickEditGoalId(null)
                                setQuickEditGoalField(null)
                                setQuickEditGoalPosition(null)
                              }
                            } catch (error) {
                              console.error('Error updating goal area:', error)
                            }
                          }}
                          className={`w-full text-left px-4 py-3 text-sm hover:bg-purple-50 transition-colors flex items-center gap-2 ${
                            goal.area_id === area.id ? 'bg-purple-50 text-purple-700 font-semibold' : 'text-gray-700'
                          }`}
                        >
                          {area.icon && <span className="text-sm">{area.icon}</span>}
                          <span className="truncate">{area.name}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )
              }
              
              if (quickEditGoalField === 'aspiration') {
                return (
                  <>
                    <div className="max-h-[300px] overflow-y-auto">
                      <button
                        onClick={async (e) => {
                          e.stopPropagation()
                          try {
                            const response = await fetch('/api/goals', {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ goalId: goal.id, aspirationId: null })
                            })
                            if (response.ok) {
                              const updatedGoal = await response.json()
                              const updatedGoals = goals.map((g: any) => g.id === goal.id ? updatedGoal : g)
                              onGoalsUpdate?.(updatedGoals)
                              setQuickEditGoalId(null)
                              setQuickEditGoalField(null)
                              setQuickEditGoalPosition(null)
                            }
                          } catch (error) {
                            console.error('Error updating goal aspiration:', error)
                          }
                        }}
                        className={`w-full text-left px-4 py-3 text-sm hover:bg-purple-50 transition-colors ${
                          !goal.aspiration_id && !goal.aspirationId ? 'bg-purple-50 text-purple-700 font-semibold' : 'text-gray-700'
                        }`}
                      >
                        {t('goals.noAspiration') || 'Bez aspirace'}
                      </button>
                      {aspirations.map((aspiration: any) => (
                        <button
                          key={aspiration.id}
                          onClick={async (e) => {
                            e.stopPropagation()
                            try {
                              const response = await fetch('/api/goals', {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ goalId: goal.id, aspirationId: aspiration.id })
                              })
                              if (response.ok) {
                                const updatedGoal = await response.json()
                                const updatedGoals = goals.map((g: any) => g.id === goal.id ? updatedGoal : g)
                                onGoalsUpdate?.(updatedGoals)
                                setQuickEditGoalId(null)
                                setQuickEditGoalField(null)
                                setQuickEditGoalPosition(null)
                              }
                            } catch (error) {
                              console.error('Error updating goal aspiration:', error)
                            }
                          }}
                          className={`w-full text-left px-4 py-3 text-sm hover:bg-purple-50 transition-colors flex items-center gap-2 ${
                            (goal.aspiration_id || goal.aspirationId) === aspiration.id ? 'bg-purple-50 text-purple-700 font-semibold' : 'text-gray-700'
                          }`}
                        >
                          <div 
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: aspiration.color || '#9333EA' }}
                          ></div>
                          <span className="truncate">{aspiration.title}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )
              }
              
              if (quickEditGoalField === 'date') {
                return (
                  <>
                    <h3 className="text-sm font-semibold text-gray-800 mb-2">
                      {t('details.step.newDate') || 'Vyberte datum'}
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
                        const currentMonth = selectedDateForGoal.getMonth()
                        const currentYear = selectedDateForGoal.getFullYear()
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
                              const isSelected = dateStr === getLocalDateString(selectedDateForGoal)
                              const isToday = dateStr === todayStr
                              
                              return (
                                <button
                                  key={dateStr}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setSelectedDateForGoal(date)
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
                            const prevMonth = new Date(selectedDateForGoal)
                            prevMonth.setMonth(prevMonth.getMonth() - 1)
                            setSelectedDateForGoal(prevMonth)
                          }}
                          className="p-1 hover:bg-gray-100 rounded-lg"
                        >
                          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <span className="text-xs font-semibold text-gray-800">
                          {selectedDateForGoal.toLocaleDateString(localeCode, { month: 'long', year: 'numeric' })}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            const nextMonth = new Date(selectedDateForGoal)
                            nextMonth.setMonth(nextMonth.getMonth() + 1)
                            setSelectedDateForGoal(nextMonth)
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
                            const dateStr = getLocalDateString(selectedDateForGoal)
                            try {
                              const response = await fetch('/api/goals', {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ goalId: goal.id, target_date: dateStr })
                              })
                              if (response.ok) {
                                const updatedGoal = await response.json()
                                const updatedGoals = goals.map((g: any) => g.id === goal.id ? updatedGoal : g)
                                onGoalsUpdate?.(updatedGoals)
                                setQuickEditGoalId(null)
                                setQuickEditGoalField(null)
                                setQuickEditGoalPosition(null)
                              }
                            } catch (error) {
                              console.error('Error updating goal date:', error)
                            }
                          }}
                          className="flex-1 px-3 py-1.5 bg-orange-600 text-white text-xs rounded-lg hover:bg-orange-700 transition-colors"
                        >
                          {t('details.step.confirm') || 'Uložit'}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setQuickEditGoalId(null)
                            setQuickEditGoalField(null)
                            setQuickEditGoalPosition(null)
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
              
              return null
            })()}
          </div>
        </>,
        document.body
      )}

      {/* Edit Goal Modal */}
      {editingGoal && typeof window !== 'undefined' && createPortal(
        <>
          <div 
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={() => setEditingGoal(null)}
          >
            <div 
              className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {editingGoal?.id ? t('goals.edit') : t('goals.create')}
                  </h2>
                  <button
                    onClick={() => setEditingGoal(null)}
                    className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-1.5 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                {/* Tabs */}
                <div className="flex gap-2 mt-4 border-b border-gray-200">
                  <button
                    onClick={() => setActiveTab('general')}
                    className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                      activeTab === 'general'
                        ? 'border-orange-500 text-orange-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Obecné informace
                  </button>
                  <button
                    onClick={() => setActiveTab('milestones')}
                    className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                      activeTab === 'milestones'
                        ? 'border-orange-500 text-orange-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Milníky
                  </button>
                  <button
                    onClick={() => setActiveTab('steps')}
                    className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                      activeTab === 'steps'
                        ? 'border-orange-500 text-orange-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Kroky
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                {activeTab === 'general' && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-2">
                        {t('goals.goalTitle')} <span className="text-orange-500">*</span>
                      </label>
                  <input
                    type="text"
                    value={editFormData.title}
                    onChange={(e) => setEditFormData({...editFormData, title: e.target.value})}
                    className="w-full px-4 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all bg-white"
                    placeholder={t('goals.goalTitlePlaceholder')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    {t('goals.goalDescription')}
                  </label>
                  <textarea
                    value={editFormData.description}
                    onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
                    className="w-full px-4 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all bg-white resize-none"
                    rows={4}
                    placeholder={t('goals.goalDescriptionPlaceholder')}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      {t('common.endDate')}
                    </label>
                    <input
                      type="date"
                      value={editFormData.target_date}
                      onChange={(e) => setEditFormData({...editFormData, target_date: e.target.value})}
                      className="w-full px-4 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      Status
                    </label>
                    <select
                      value={editFormData.status}
                      onChange={(e) => setEditFormData({...editFormData, status: e.target.value})}
                      className="w-full px-4 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all bg-white"
                    >
                      <option value="active">{t('goals.status.active')}</option>
                      <option value="completed">{t('goals.status.completed')}</option>
                      <option value="considering">{t('goals.status.considering')}</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      {t('goals.area')}
                    </label>
                    <select
                      value={editFormData.areaId}
                      onChange={(e) => setEditFormData({...editFormData, areaId: e.target.value})}
                      className="w-full px-4 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all bg-white"
                    >
                      <option value="">{t('goals.noArea') || 'Bez oblasti'}</option>
                      {areas.map((area: any) => (
                        <option key={area.id} value={area.id}>{area.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      {t('goals.aspiration')}
                    </label>
                    <select
                      value={editFormData.aspirationId}
                      onChange={(e) => setEditFormData({...editFormData, aspirationId: e.target.value})}
                      className="w-full px-4 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all bg-white"
                    >
                      <option value="">{t('goals.noAspiration') || 'Bez aspirace'}</option>
                      {aspirations.map((aspiration: any) => (
                        <option key={aspiration.id} value={aspiration.id}>{aspiration.title}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="pt-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editFormData.is_focused}
                      onChange={(e) => setEditFormData({...editFormData, is_focused: e.target.checked})}
                      className="w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                    />
                    <span className="text-sm font-semibold text-gray-800">
                      Přidat do fokusu
                    </span>
                  </label>
                  <p className="text-xs text-gray-500 mt-1 ml-8">
                    Cíle ve fokusu budou zvýrazněny a zobrazí se na hlavním panelu
                  </p>
                </div>
                  </>
                )}

                {activeTab === 'steps' && (
                  <>
                {/* Steps Section */}
                <div className="bg-white rounded-xl p-4 border-2 border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-semibold text-gray-800">{t('goals.steps')}</label>
                    <button
                      type="button"
                      onClick={handleAddStep}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      {t('goals.addStep')}
                    </button>
                  </div>
                  {editFormData.steps.length === 0 ? (
                    <div className="text-center py-6 text-gray-400">
                      <svg className="w-8 h-8 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <p className="text-xs">{t('steps.noSteps')}</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {editFormData.steps.map((step, index) => {
                        const isEditing = step.isEditing || (!step.title && step.id === editFormData.steps[editFormData.steps.length - 1]?.id)
                        
                        return (
                          <div 
                            key={step.id} 
                            data-step-id={step.id}
                            className="bg-gray-50 p-3 rounded-lg border border-gray-200 hover:border-orange-300 transition-colors"
                          >
                            {isEditing ? (
                              <>
                                <div className="flex items-start justify-between mb-2">
                                  <span className="text-xs font-semibold text-gray-600 bg-white px-2 py-0.5 rounded">{t('goals.stepNumber')} {index + 1}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteStep(step.id)}
                                    className="text-red-400 hover:text-red-600 hover:bg-red-50 rounded p-1 transition-colors"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                                <input
                                  type="text"
                                  value={step.title}
                                  onChange={(e) => {
                                    const updatedSteps = editFormData.steps.map(s =>
                                      s.id === step.id ? { ...s, title: e.target.value } : s
                                    )
                                    setEditFormData({ ...editFormData, steps: updatedSteps })
                                  }}
                                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg mb-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
                                  placeholder={t('steps.stepTitle')}
                                  autoFocus
                                />
                                <input
                                  type="date"
                                  value={step.date || ''}
                                  onChange={(e) => {
                                    const updatedSteps = editFormData.steps.map(s =>
                                      s.id === step.id ? { ...s, date: e.target.value } : s
                                    )
                                    setEditFormData({ ...editFormData, steps: updatedSteps })
                                  }}
                                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg mb-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
                                  placeholder={t('steps.dateOptional')}
                                />
                                <textarea
                                  value={step.description || ''}
                                  onChange={(e) => {
                                    const updatedSteps = editFormData.steps.map(s =>
                                      s.id === step.id ? { ...s, description: e.target.value } : s
                                    )
                                    setEditFormData({ ...editFormData, steps: updatedSteps })
                                  }}
                                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg mb-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white resize-none"
                                  rows={2}
                                  placeholder={t('steps.descriptionOptional')}
                                />
                                <div className="flex items-center gap-2 mt-2">
                                  <button
                                    type="button"
                                    onClick={() => handleSaveStep(step.id)}
                                    className="px-3 py-1.5 text-xs font-medium bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                                  >
                                    {t('common.save')}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteStep(step.id)}
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
                                  const updatedSteps = editFormData.steps.map(s =>
                                    s.id === step.id ? { ...s, isEditing: true } : s
                                  )
                                  setEditFormData({ ...editFormData, steps: updatedSteps })
                                }}
                              >
                                <div className="flex items-center gap-3 flex-1">
                                  <span className="text-xs font-semibold text-gray-500 w-12">#{index + 1}</span>
                                  <div className="flex-1">
                                    <div className="font-medium text-sm text-gray-900">{step.title || t('common.noTitle')}</div>
                                    {step.date && (
                                      <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {(() => {
                                          try {
                                            const dateStr = step.date.includes('T') ? step.date.split('T')[0] : step.date
                                            const dateParts = dateStr.split('-')
                                            if (dateParts.length === 3) {
                                              return new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2])).toLocaleDateString(localeCode, { day: '2-digit', month: '2-digit' })
                                            }
                                            return dateStr
                                          } catch {
                                            return step.date
                                          }
                                        })()}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      const updatedSteps = editFormData.steps.map(s =>
                                        s.id === step.id ? { ...s, isEditing: true } : s
                                      )
                                      setEditFormData({ ...editFormData, steps: updatedSteps })
                                    }}
                                    className="text-gray-400 hover:text-orange-600 p-1"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleDeleteStep(step.id)
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
                  </>
                )}

                {activeTab === 'milestones' && (
                  <>
                {/* Milestones Section */}
                <div className="bg-white rounded-xl p-4 border-2 border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-semibold text-gray-800">{t('goals.milestones')}</label>
                    <button
                      type="button"
                      onClick={handleAddMilestone}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      {t('goals.addMilestone')}
                    </button>
                  </div>
                  {editFormData.milestones.length === 0 ? (
                    <div className="text-center py-6 text-gray-400">
                      <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-xs">{t('goals.noMilestones')}</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {editFormData.milestones.map((milestone, index) => {
                        const isEditing = milestone.isEditing || (!milestone.title && milestone.id === editFormData.milestones[editFormData.milestones.length - 1]?.id)
                        
                        return (
                          <div 
                            key={milestone.id} 
                            data-milestone-id={milestone.id}
                            className="bg-gray-50 p-3 rounded-lg border border-gray-200 hover:border-orange-300 transition-colors"
                          >
                            {isEditing ? (
                              <>
                                <div className="flex items-start justify-between mb-2">
                                  <span className="text-xs font-semibold text-gray-600 bg-white px-2 py-0.5 rounded">{t('goals.milestoneNumber')} {index + 1}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteMilestone(milestone.id)}
                                    className="text-red-400 hover:text-red-600 hover:bg-red-50 rounded p-1 transition-colors"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                                <input
                                  type="text"
                                  value={milestone.title}
                                  onChange={(e) => {
                                    const updatedMilestones = editFormData.milestones.map(m =>
                                      m.id === milestone.id ? { ...m, title: e.target.value } : m
                                    )
                                    setEditFormData({ ...editFormData, milestones: updatedMilestones })
                                  }}
                                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg mb-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
                                  placeholder={t('goals.milestoneTitle')}
                                  autoFocus
                                />
                                <textarea
                                  value={milestone.description || ''}
                                  onChange={(e) => {
                                    const updatedMilestones = editFormData.milestones.map(m =>
                                      m.id === milestone.id ? { ...m, description: e.target.value } : m
                                    )
                                    setEditFormData({ ...editFormData, milestones: updatedMilestones })
                                  }}
                                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg mb-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white resize-none"
                                  rows={2}
                                  placeholder="Popis (volitelné)"
                                />
                                
                                <div className="flex items-center gap-2 mt-2">
                                  <button
                                    type="button"
                                    onClick={() => handleSaveMilestone(milestone.id)}
                                    className="px-3 py-1.5 text-xs font-medium bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                                  >
                                    {t('common.save')}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteMilestone(milestone.id)}
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
                                  const updatedMilestones = editFormData.milestones.map(m =>
                                    m.id === milestone.id ? { ...m, isEditing: true } : m
                                  )
                                  setEditFormData({ ...editFormData, milestones: updatedMilestones })
                                }}
                              >
                                <div className="flex items-center gap-3 flex-1">
                                  <Target className="w-4 h-4 text-orange-500" />
                                  <div className="flex-1">
                                    <div className="font-medium text-sm text-gray-900">{milestone.title || t('common.noTitle')}</div>
                                    {milestone.description && (
                                      <div className="text-xs text-gray-500 mt-0.5">{milestone.description}</div>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      const updatedMilestones = editFormData.milestones.map(m =>
                                        m.id === milestone.id ? { ...m, isEditing: true } : m
                                      )
                                      setEditFormData({ ...editFormData, milestones: updatedMilestones })
                                    }}
                                    className="text-gray-400 hover:text-orange-600 p-1"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleDeleteMilestone(milestone.id)
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
                  </>
                )}
              </div>

              <div className="p-6 border-t border-gray-200 flex items-center justify-between">
                {editingGoal?.id && (
                  <button
                    onClick={handleDeleteGoal}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
                  >
                    {t('common.delete') || 'Smazat'}
                  </button>
                )}
                <div className={`flex gap-3 ${editingGoal?.id ? '' : 'ml-auto'}`}>
                  <button
                    onClick={() => setEditingGoal(null)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                  >
                    {t('common.cancel') || 'Zrušit'}
                  </button>
                  <button
                    onClick={editingGoal?.id ? handleUpdateGoal : handleCreateGoal}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
                  >
                    {t('common.save') || 'Uložit'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  )
}


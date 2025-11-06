'use client'

import { useState, useMemo } from 'react'
import { ChevronDown, ChevronRight, Plus, Edit, Trash2, Target } from 'lucide-react'

interface GoalsManagementViewProps {
  player: any
  goals: any[]
  onGoalsUpdate: (goals: any[]) => void
  onBack?: () => void
}

type GoalLevel = 'main' | 'area' | 'sub'

interface Goal {
  id: string
  title: string
  description?: string
  target_date?: string | Date
  status: 'active' | 'completed' | 'paused' | 'cancelled'
  priority: 'meaningful' | 'nice-to-have'
  category: 'short-term' | 'medium-term' | 'long-term'
  goal_type: 'process' | 'outcome'
  progress_percentage: number
  progress_type: 'percentage' | 'count' | 'amount' | 'steps'
  progress_target?: number
  progress_current?: number
  progress_unit?: string
  icon?: string
  area_id?: string
  parent_goal_id?: string | null
  goal_level: GoalLevel
  created_at: string | Date
  updated_at: string | Date
}

export function GoalsManagementView({ player, goals, onGoalsUpdate, onBack }: GoalsManagementViewProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [expandedGoals, setExpandedGoals] = useState<Set<string>>(new Set())
  const [goalTitle, setGoalTitle] = useState('')
  const [goalDescription, setGoalDescription] = useState('')
  const [goalDeadline, setGoalDeadline] = useState('')
  const [goalLevel, setGoalLevel] = useState<GoalLevel>('sub')
  const [parentGoalId, setParentGoalId] = useState<string | null>(null)

  // Organize goals into hierarchy
  const goalHierarchy = useMemo(() => {
    const mainGoal = goals.find(g => g.goal_level === 'main')
    const areaGoals = goals.filter(g => g.goal_level === 'area')
    const subGoals = goals.filter(g => g.goal_level === 'sub')
    
    // Build hierarchy: main -> area -> sub
    const hierarchy: {
      main: Goal | null
      areas: Array<Goal & { children: Goal[] }>
    } = {
      main: mainGoal || null,
      areas: areaGoals.map(areaGoal => ({
        ...areaGoal,
        children: subGoals.filter(sub => sub.parent_goal_id === areaGoal.id)
      }))
    }
    
    return hierarchy
  }, [goals])

  const toggleExpand = (goalId: string) => {
    const newExpanded = new Set(expandedGoals)
    if (newExpanded.has(goalId)) {
      newExpanded.delete(goalId)
    } else {
      newExpanded.add(goalId)
    }
    setExpandedGoals(newExpanded)
  }

  const handleAddGoal = async () => {
    if (!goalTitle.trim()) return

    try {
      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: player?.user_id,
          title: goalTitle.trim(),
          description: goalDescription.trim() || undefined,
          targetDate: goalDeadline || undefined,
          goalLevel,
          parentGoalId: parentGoalId || null,
          status: 'active',
          priority: 'meaningful',
          category: 'medium-term',
          goalType: 'outcome',
          progressPercentage: 0,
          progressType: 'percentage'
        })
      })

      if (response.ok) {
        const newGoal = await response.json()
        onGoalsUpdate([...goals, newGoal])
        resetForm()
      } else {
        const error = await response.json()
        alert(`Chyba při vytváření cíle: ${error.error}`)
      }
    } catch (error) {
      console.error('Error creating goal:', error)
      alert('Chyba při vytváření cíle')
    }
  }

  const handleUpdateGoal = async (goalId: string, updates: Partial<Goal>) => {
    try {
      const response = await fetch('/api/goals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goalId,
          ...updates
        })
      })

      if (response.ok) {
        const updatedGoal = await response.json()
        onGoalsUpdate(goals.map(g => g.id === goalId ? updatedGoal : g))
        setEditingGoal(null)
      } else {
        const error = await response.json()
        alert(`Chyba při aktualizaci cíle: ${error.error}`)
      }
    } catch (error) {
      console.error('Error updating goal:', error)
      alert('Chyba při aktualizaci cíle')
    }
  }

  const handleDeleteGoal = async (goalId: string) => {
    if (!confirm('Opravdu chcete smazat tento cíl?')) return

    try {
      const response = await fetch('/api/goals', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goalId })
      })

      if (response.ok) {
        onGoalsUpdate(goals.filter(g => g.id !== goalId))
      } else {
        const error = await response.json()
        alert(`Chyba při mazání cíle: ${error.error}`)
      }
    } catch (error) {
      console.error('Error deleting goal:', error)
      alert('Chyba při mazání cíle')
    }
  }

  const handleToggleComplete = (goal: Goal) => {
    const newStatus = goal.status === 'completed' ? 'active' : 'completed'
    handleUpdateGoal(goal.id, { status: newStatus })
  }

  const resetForm = () => {
    setGoalTitle('')
    setGoalDescription('')
    setGoalDeadline('')
    setGoalLevel('sub')
    setParentGoalId(null)
    setShowAddForm(false)
    setEditingGoal(null)
  }

  const startEditing = (goal: Goal) => {
    setEditingGoal(goal)
    setGoalTitle(goal.title)
    setGoalDescription(goal.description || '')
    setGoalDeadline(goal.target_date ? (typeof goal.target_date === 'string' ? goal.target_date.split('T')[0] : new Date(goal.target_date).toISOString().split('T')[0]) : '')
    setGoalLevel(goal.goal_level)
    setParentGoalId(goal.parent_goal_id || null)
    setShowAddForm(true)
  }

  const availableParentsForLevel = (level: GoalLevel): Goal[] => {
    if (level === 'main') return []
    if (level === 'area') {
      return goals.filter(g => g.goal_level === 'main')
    }
    // level === 'sub'
    return goals.filter(g => g.goal_level === 'area')
  }

  const canAddMainGoal = !goalHierarchy.main
  const canAddAreaGoal = !!goalHierarchy.main

  return (
    <div className="bg-white bg-opacity-95 rounded-2xl p-8 border border-orange-200 shadow-xl backdrop-blur-sm" style={{
      boxShadow: '0 12px 24px rgba(251, 146, 60, 0.15), 0 4px 8px rgba(0, 0, 0, 0.05)'
    }}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-orange-800" style={{ letterSpacing: '1px' }}>CÍLE</h1>
        <div className="flex gap-2">
          {onBack && (
            <button
              onClick={onBack}
              className="px-4 py-2 rounded-lg bg-gray-500 text-white hover:bg-gray-600 transition-colors"
            >
              ← Zpět
            </button>
          )}
          <button
            onClick={() => {
              resetForm()
              setShowAddForm(!showAddForm)
            }}
            className="p-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            title={showAddForm ? 'Zrušit' : 'Přidat cíl'}
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Add/Edit Goal Form */}
      {showAddForm && (
        <div className="mb-6 p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border-2 border-orange-300">
          <h2 className="text-xl font-bold text-orange-900 mb-4">
            {editingGoal ? 'UPRAVIT CÍL' : 'PŘIDAT NOVÝ CÍL'}
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">ÚROVEŇ CÍLE *</label>
              <select
                value={goalLevel}
                onChange={(e) => {
                  setGoalLevel(e.target.value as GoalLevel)
                  setParentGoalId(null)
                }}
                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none"
                disabled={editingGoal !== null}
              >
                <option value="main" disabled={!canAddMainGoal && !editingGoal}>
                  Hlavní cíl (motto na hrob)
                </option>
                <option value="area" disabled={!canAddAreaGoal && !editingGoal}>
                  Hlavní cíl pro oblast
                </option>
                <option value="sub">Dílčí cíl</option>
              </select>
              {goalLevel === 'main' && !canAddMainGoal && !editingGoal && (
                <p className="text-xs text-red-600 mt-1">Hlavní cíl již existuje. Můžete mít pouze jeden hlavní cíl.</p>
              )}
              {goalLevel === 'area' && !canAddAreaGoal && !editingGoal && (
                <p className="text-xs text-red-600 mt-1">Nejprve musíte vytvořit hlavní cíl.</p>
              )}
            </div>

            {goalLevel !== 'main' && availableParentsForLevel(goalLevel).length > 0 && (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  {goalLevel === 'area' ? 'NADŘAZENÝ CÍL (hlavní cíl)' : 'NADŘAZENÝ CÍL (oblast)'}
                </label>
                <select
                  value={parentGoalId || ''}
                  onChange={(e) => setParentGoalId(e.target.value || null)}
                  className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none"
                >
                  <option value="">Vyberte nadřazený cíl...</option>
                  {availableParentsForLevel(goalLevel).map((parent) => (
                    <option key={parent.id} value={parent.id}>
                      {parent.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">NÁZEV CÍLE *</label>
              <input
                type="text"
                value={goalTitle}
                onChange={(e) => setGoalTitle(e.target.value)}
                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none"
                placeholder={goalLevel === 'main' ? 'Např. Žít plnohodnotný a smysluplný život' : 'Např. Rozvíjet kariéru'}
                maxLength={200}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">POPIS (volitelné)</label>
              <textarea
                value={goalDescription}
                onChange={(e) => setGoalDescription(e.target.value)}
                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none resize-none"
                rows={3}
                placeholder="Podrobnější popis cíle..."
                maxLength={1000}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">DEADLINE (volitelné)</label>
              <input
                type="date"
                value={goalDeadline}
                onChange={(e) => setGoalDeadline(e.target.value)}
                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="flex gap-4">
              <button
                onClick={editingGoal ? () => handleUpdateGoal(editingGoal.id, {
                  title: goalTitle.trim(),
                  description: goalDescription.trim() || undefined,
                  target_date: goalDeadline || undefined,
                  goal_level: goalLevel,
                  parent_goal_id: parentGoalId
                }) : handleAddGoal}
                disabled={!goalTitle.trim() || (goalLevel === 'area' && !canAddAreaGoal && !editingGoal) || (goalLevel === 'main' && !canAddMainGoal && !editingGoal) || (goalLevel !== 'main' && !parentGoalId)}
                className="px-6 py-3 rounded-xl font-bold bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingGoal ? 'ULOŽIT ZMĚNY' : 'PŘIDAT CÍL'}
              </button>
              <button
                onClick={resetForm}
                className="px-6 py-3 rounded-xl font-bold bg-gradient-to-r from-gray-500 to-gray-600 text-white hover:from-gray-600 hover:to-gray-700 shadow-lg transition-all duration-300"
              >
                ZRUŠIT
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Goals Hierarchy */}
      <div className="space-y-6">
        {/* Main Goal */}
        {goalHierarchy.main && (
          <div className="border-2 border-orange-400 rounded-xl p-6 bg-gradient-to-br from-orange-50 to-orange-100 shadow-lg">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <Target className="w-8 h-8 text-orange-600" />
                <div>
                  <div className="text-xs font-semibold text-orange-700 uppercase tracking-wide mb-1">
                    Hlavní cíl
                  </div>
                  <h2 className="text-2xl font-bold text-orange-900">{goalHierarchy.main.title}</h2>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleToggleComplete(goalHierarchy.main!)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                    goalHierarchy.main.status === 'completed'
                      ? 'bg-green-500 text-white hover:bg-green-600'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {goalHierarchy.main.status === 'completed' ? '✓ Hotovo' : 'Označit jako hotovo'}
                </button>
                <button
                  onClick={() => startEditing(goalHierarchy.main!)}
                  className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  title="Upravit"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteGoal(goalHierarchy.main!.id)}
                  className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  title="Smazat"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {goalHierarchy.main.description && (
              <p className="text-gray-700 mb-4">{goalHierarchy.main.description}</p>
            )}
            
            <div className="flex items-center gap-4 text-sm text-gray-600">
              {goalHierarchy.main.target_date && (
                <span>📅 {typeof goalHierarchy.main.target_date === 'string' ? new Date(goalHierarchy.main.target_date).toLocaleDateString('cs-CZ') : goalHierarchy.main.target_date.toLocaleDateString('cs-CZ')}</span>
              )}
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                goalHierarchy.main.status === 'completed' ? 'bg-green-200 text-green-800' :
                goalHierarchy.main.status === 'paused' ? 'bg-yellow-200 text-yellow-800' :
                'bg-blue-200 text-blue-800'
              }`}>
                {goalHierarchy.main.status === 'completed' ? 'Dokončeno' :
                 goalHierarchy.main.status === 'paused' ? 'Pozastaveno' :
                 'Aktivní'}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Pokrok</span>
                <span>{goalHierarchy.main.progress_percentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-orange-500 to-orange-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${goalHierarchy.main.progress_percentage}%` }}
                />
              </div>
            </div>

            {/* Area Goals */}
            {goalHierarchy.areas.length > 0 && (
              <div className="mt-6 pl-6 border-l-4 border-orange-300">
                <div className="flex items-center gap-2 mb-4">
                  <button
                    onClick={() => toggleExpand('main')}
                    className="p-1 hover:bg-orange-200 rounded transition-colors"
                  >
                    {expandedGoals.has('main') ? (
                      <ChevronDown className="w-5 h-5 text-orange-700" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-orange-700" />
                    )}
                  </button>
                  <h3 className="text-lg font-bold text-orange-800">
                    Hlavní cíle pro oblasti ({goalHierarchy.areas.length})
                  </h3>
                </div>

                {expandedGoals.has('main') && (
                  <div className="space-y-4">
                    {goalHierarchy.areas.map((areaGoal) => (
                      <div key={areaGoal.id} className="bg-white rounded-lg p-4 border-2 border-orange-200 shadow-md">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="text-lg font-semibold text-gray-900">{areaGoal.title}</h4>
                            {areaGoal.description && (
                              <p className="text-sm text-gray-600 mt-1">{areaGoal.description}</p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleToggleComplete(areaGoal)}
                              className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                                areaGoal.status === 'completed'
                                  ? 'bg-green-500 text-white hover:bg-green-600'
                                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                              }`}
                            >
                              {areaGoal.status === 'completed' ? '✓' : '○'}
                            </button>
                            <button
                              onClick={() => startEditing(areaGoal)}
                              className="p-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                              title="Upravit"
                            >
                              <Edit className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteGoal(areaGoal.id)}
                              className="p-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                              title="Smazat"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mt-2">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-orange-400 to-orange-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${areaGoal.progress_percentage}%` }}
                            />
                          </div>
                        </div>

                        {/* Sub Goals */}
                        {areaGoal.children.length > 0 && (
                          <div className="mt-4 pl-4 border-l-2 border-gray-300">
                            <div className="flex items-center gap-2 mb-2">
                              <button
                                onClick={() => toggleExpand(areaGoal.id)}
                                className="p-1 hover:bg-gray-100 rounded transition-colors"
                              >
                                {expandedGoals.has(areaGoal.id) ? (
                                  <ChevronDown className="w-4 h-4 text-gray-600" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 text-gray-600" />
                                )}
                              </button>
                              <span className="text-sm font-semibold text-gray-600">
                                Dílčí cíle ({areaGoal.children.length})
                              </span>
                            </div>

                            {expandedGoals.has(areaGoal.id) && (
                              <div className="space-y-2">
                                {areaGoal.children.map((subGoal) => (
                                  <div key={subGoal.id} className="bg-gray-50 rounded p-3 border border-gray-200">
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <h5 className="text-sm font-medium text-gray-800">{subGoal.title}</h5>
                                        {subGoal.description && (
                                          <p className="text-xs text-gray-600 mt-1">{subGoal.description}</p>
                                        )}
                                      </div>
                                      <div className="flex gap-1">
                                        <button
                                          onClick={() => handleToggleComplete(subGoal)}
                                          className={`px-2 py-1 rounded text-xs transition-colors ${
                                            subGoal.status === 'completed'
                                              ? 'bg-green-500 text-white hover:bg-green-600'
                                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                          }`}
                                        >
                                          {subGoal.status === 'completed' ? '✓' : '○'}
                                        </button>
                                        <button
                                          onClick={() => startEditing(subGoal)}
                                          className="p-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                                          title="Upravit"
                                        >
                                          <Edit className="w-3 h-3" />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteGoal(subGoal.id)}
                                          className="p-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                                          title="Smazat"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      </div>
                                    </div>
                                    <div className="mt-2">
                                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                                        <div
                                          className="bg-gradient-to-r from-gray-400 to-gray-500 h-1.5 rounded-full transition-all duration-300"
                                          style={{ width: `${subGoal.progress_percentage}%` }}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Add Sub Goal Button */}
                        <button
                          onClick={() => {
                            resetForm()
                            setGoalLevel('sub')
                            setParentGoalId(areaGoal.id)
                            setShowAddForm(true)
                          }}
                          className="mt-3 text-sm text-orange-600 hover:text-orange-700 font-semibold flex items-center gap-1"
                        >
                          <Plus className="w-4 h-4" />
                          Přidat dílčí cíl
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Add Area Goal Button */}
            {canAddAreaGoal && (
              <button
                onClick={() => {
                  resetForm()
                  setGoalLevel('area')
                  setParentGoalId(goalHierarchy.main!.id)
                  setShowAddForm(true)
                }}
                className="mt-4 text-sm text-orange-600 hover:text-orange-700 font-semibold flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Přidat hlavní cíl pro oblast
              </button>
            )}
          </div>
        )}

        {/* No Main Goal State */}
        {!goalHierarchy.main && (
          <div className="text-center py-12 border-2 border-dashed border-orange-300 rounded-xl bg-orange-50">
            <Target className="w-16 h-16 text-orange-400 mx-auto mb-4" />
            <p className="text-lg font-bold text-gray-700 mb-2">Začněte vytvořením hlavního cíle</p>
            <p className="text-sm text-gray-500 mb-4">Hlavní cíl je vaše motto - něco, co byste si nechali napsat na hrob</p>
            <button
              onClick={() => {
                resetForm()
                setGoalLevel('main')
                setShowAddForm(true)
              }}
              className="px-6 py-3 rounded-xl font-bold bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 shadow-lg transition-all duration-300"
            >
              Vytvořit hlavní cíl
            </button>
          </div>
        )}

        {/* Empty State - No Goals at All */}
        {goals.length === 0 && !showAddForm && (
          <div className="text-center py-12">
            <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-bold text-gray-700 mb-2">Žádné cíle nejsou nastavené</p>
            <p className="text-sm text-gray-500">Začněte vytvořením hlavního cíle</p>
          </div>
        )}
      </div>
    </div>
  )
}

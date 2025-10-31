'use client'

import { useState, memo } from 'react'
import { Goal, Value } from '@/lib/cesta-db'
import { Edit2, Trash2, Save, X } from 'lucide-react'

interface JourneyMapProps {
  goals: Goal[]
  values: Value[]
  completedSteps: number
  totalSteps: number
  onGoalUpdate?: (goal: Goal) => void
  onGoalDelete?: (goalId: string) => void
}

export const JourneyMap = memo(function JourneyMap({ goals, values, completedSteps, totalSteps, onGoalUpdate, onGoalDelete }: JourneyMapProps) {
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [editedGoal, setEditedGoal] = useState<{
    title?: string
    description?: string
    target_date?: string
    priority?: 'low' | 'medium' | 'high'
    status?: 'active' | 'completed' | 'paused' | 'cancelled'
  }>({})
  const [showAddGoal, setShowAddGoal] = useState(false)
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    target_date: '',
    priority: 'medium' as 'low' | 'medium' | 'high'
  })
  const progressPercentage = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0

  const handleGoalClick = (goal: Goal) => {
    setEditingGoal(goal)
    setEditedGoal({
      title: goal.title,
      description: goal.description || '',
      target_date: goal.target_date ? 
        (typeof goal.target_date === 'string' ? goal.target_date.split('T')[0] : goal.target_date.toISOString().split('T')[0]) : '',
      priority: goal.priority === 'meaningful' ? 'high' : 'low',
      status: goal.status
    })
  }

  const handleSaveGoal = async () => {
    if (!editingGoal || !onGoalUpdate) return
    
    try {
      const response = await fetch(`/api/cesta/goals/${editingGoal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editedGoal.title,
          description: editedGoal.description,
          targetDate: editedGoal.target_date,
          priority: editedGoal.priority,
          status: editedGoal.status
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        onGoalUpdate(data.goal)
        setEditingGoal(null)
        setEditedGoal({})
      }
    } catch (error) {
      console.error('Error updating goal:', error)
    }
  }

  const handleDeleteGoal = async () => {
    if (!editingGoal || !onGoalDelete) return
    
    try {
      const response = await fetch(`/api/cesta/goals/${editingGoal.id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        onGoalDelete(editingGoal.id)
        setEditingGoal(null)
        setEditedGoal({})
      }
    } catch (error) {
      console.error('Error deleting goal:', error)
    }
  }

  const handleCreateGoal = async () => {
    if (!newGoal.title.trim()) return
    
    try {
      const response = await fetch('/api/cesta/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newGoal.title,
          description: newGoal.description,
          targetDate: newGoal.target_date ? new Date(newGoal.target_date) : null,
          priority: newGoal.priority
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        if (onGoalUpdate) {
          onGoalUpdate(data.goal)
        }
        setNewGoal({ title: '', description: '', target_date: '', priority: 'medium' })
        setShowAddGoal(false)
      }
    } catch (error) {
      console.error('Error creating goal:', error)
    }
  }

  return (
    <div className="flex-1 bg-white rounded-2xl shadow-lg overflow-hidden m-4">

      {/* Journey Map Container - Isometric Style */}
      <div className="relative bg-gradient-to-b from-sky-100 via-sky-50 to-amber-50 h-full min-h-[700px] overflow-hidden">
        {/* Sky with subtle clouds */}
        <div className="absolute inset-0">
          {/* Distant clouds */}
          <div className="absolute top-8 left-1/4 w-20 h-10 bg-white/30 rounded-full blur-sm"></div>
          <div className="absolute top-12 right-1/3 w-16 h-8 bg-white/25 rounded-full blur-sm"></div>
          <div className="absolute top-6 right-1/4 w-12 h-6 bg-white/20 rounded-full blur-sm"></div>
        </div>

        {/* Winding Road from bottom to top 2/3 */}
        <div className="absolute inset-0">
          <svg viewBox="0 0 800 600" className="w-full h-full">
            {/* Road shadow */}
            <path
              d="M 400 550 Q 300 450 200 350 Q 150 250 200 150 Q 300 100 400 80 Q 500 60 600 50"
              stroke="#d1d5db"
              strokeWidth="40"
              fill="none"
              className="drop-shadow-lg"
            />
            {/* Main road */}
            <path
              d="M 400 550 Q 300 450 200 350 Q 150 250 200 150 Q 300 100 400 80 Q 500 60 600 50"
              stroke="#f5f5f4"
              strokeWidth="32"
              fill="none"
            />
            {/* Road highlight */}
            <path
              d="M 400 550 Q 300 450 200 350 Q 150 250 200 150 Q 300 100 400 80 Q 500 60 600 50"
              stroke="#ffffff"
              strokeWidth="28"
              fill="none"
            />
            {/* Road center line */}
            <path
              d="M 400 550 Q 300 450 200 350 Q 150 250 200 150 Q 300 100 400 80 Q 500 60 600 50"
              stroke="#e5e7eb"
              strokeWidth="3"
              fill="none"
              strokeDasharray="8,8"
            />
          </svg>
        </div>

        {/* Current Position Marker - Bottom of road */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <div className="relative">
            <div className="w-12 h-12 bg-white border-4 border-primary-500 rounded-full shadow-xl flex items-center justify-center">
              <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">👤</span>
              </div>
            </div>
            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-sm text-primary-800 px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap shadow-lg">
              Start
            </div>
          </div>
        </div>

        {/* Goals as Milestones along the Path */}
        {goals
          .sort((a, b) => {
            if (a.target_date && b.target_date) {
              const dateA = new Date(a.target_date)
              const dateB = new Date(b.target_date)
              return dateA.getTime() - dateB.getTime()
            }
            if (a.target_date && !b.target_date) return -1
            if (!a.target_date && b.target_date) return 1
            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          })
          .map((goal, index) => {
            // Position goals along the winding road from bottom to top
            const totalGoals = goals.length
            const progress = totalGoals > 1 ? index / (totalGoals - 1) : 0
            const roadProgress = 0.1 + (progress * 0.7) // Use 10% to 80% of the road
            
            // Calculate position along the curved path
            const t = roadProgress
            const x = 400 + (200 * Math.sin(t * Math.PI * 2)) * (1 - t) + (200 * Math.sin(t * Math.PI)) * t
            const y = 550 - (t * 500) // From bottom (550) to top (50)
            
            const isCompleted = goal.status === 'completed'
            const isActive = goal.status === 'active'
            
            return (
              <div
                key={goal.id}
                id={`goal-${goal.id}`}
                className="absolute transform -translate-x-1/2 -translate-y-1/2"
                style={{ 
                  left: `${(x / 800) * 100}%`,
                  top: `${(y / 600) * 100}%`
                }}
              >
                  <div
                    onClick={() => handleGoalClick(goal)}
                    className={`relative cursor-pointer transition-all hover:scale-110 ${
                      isCompleted ? 'animate-pulse' : ''
                    }`}
                  >
                    {/* Goal marker */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg border-2 border-white ${
                      isCompleted 
                        ? 'bg-green-500 text-white' 
                        : isActive
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-400 text-white'
                    }`}>
                      {isCompleted ? '✓' : index + 1}
                    </div>
                    
                    {/* Goal title */}
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-white/95 backdrop-blur-sm px-2 py-1 rounded-full shadow-lg text-xs font-medium whitespace-nowrap max-w-24 truncate border border-gray-200">
                      {goal.title}
                    </div>
                    
                    {/* Progress indicator for active goals */}
                    {isActive && (
                      <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2">
                        <div className="w-16 h-1 bg-gray-200 rounded-full">
                          <div 
                            className="h-1 bg-primary-500 rounded-full transition-all duration-500"
                            style={{ width: `${goal.progress_percentage}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
              </div>
            )
          })}

        {/* Subtle landscape elements */}
        <div className="absolute bottom-4 left-8">
          <div className="w-6 h-6 bg-green-500/60 rounded-full flex items-center justify-center text-white text-xs">🌳</div>
        </div>
        <div className="absolute bottom-6 right-12">
          <div className="w-5 h-5 bg-green-400/60 rounded-full flex items-center justify-center text-white text-xs">🌲</div>
        </div>
        <div className="absolute top-1/3 left-16">
          <div className="w-4 h-4 bg-green-500/50 rounded-full flex items-center justify-center text-white text-xs">🌲</div>
        </div>
        <div className="absolute top-1/2 right-20">
          <div className="w-5 h-5 bg-green-400/50 rounded-full flex items-center justify-center text-white text-xs">🌳</div>
        </div>


      </div>

      {/* Motivational Message */}
      <div className="px-8 py-6 bg-gradient-to-r from-amber-50 to-orange-50 border-t border-amber-200">
        <p className="text-center text-gray-600 italic">
          {completedSteps === totalSteps && totalSteps > 0
            ? "🎉 Skvělá práce! Dnes jste splnili všechny své kroky!"
            : totalSteps === 0
            ? "Začněte svou cestu přidáním prvního kroku"
            : `Pokračujte vpřed! Zbývá ${totalSteps - completedSteps} kroků do dokončení dnešních cílů.`
          }
        </p>
      </div>

      {/* Goal Edit Modal */}
      {editingGoal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Upravit cíl</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Název</label>
                <input
                  type="text"
                  value={editedGoal.title || ''}
                  onChange={(e) => setEditedGoal({...editedGoal, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Popis</label>
                <textarea
                  value={editedGoal.description || ''}
                  onChange={(e) => setEditedGoal({...editedGoal, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  rows={3}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cílové datum</label>
                <input
                  type="date"
                  value={editedGoal.target_date || ''}
                  onChange={(e) => setEditedGoal({...editedGoal, target_date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priorita</label>
                <select
                  value={editedGoal.priority || 'medium'}
                  onChange={(e) => setEditedGoal({...editedGoal, priority: e.target.value as 'low' | 'medium' | 'high'})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="low">Nízká</option>
                  <option value="medium">Střední</option>
                  <option value="high">Vysoká</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stav</label>
                <select
                  value={editedGoal.status || 'active'}
                  onChange={(e) => setEditedGoal({...editedGoal, status: e.target.value as 'active' | 'completed' | 'paused' | 'cancelled'})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="active">Aktivní</option>
                  <option value="completed">Dokončen</option>
                  <option value="paused">Pozastaven</option>
                  <option value="cancelled">Zrušen</option>
                </select>
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleSaveGoal}
                className="flex-1 bg-primary-500 text-white py-2 px-4 rounded-lg hover:bg-primary-600 transition-colors flex items-center justify-center"
              >
                <Save className="w-4 h-4 mr-2" />
                Uložit
              </button>
              <button
                onClick={handleDeleteGoal}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Smazat
              </button>
              <button
                onClick={() => {
                  setEditingGoal(null)
                  setEditedGoal({})
                }}
                className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center"
              >
                <X className="w-4 h-4 mr-2" />
                Zrušit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Goal Modal */}
      {showAddGoal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Nový cíl</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Název</label>
                <input
                  type="text"
                  value={newGoal.title}
                  onChange={(e) => setNewGoal({...newGoal, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Zadejte název cíle"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Popis</label>
                <textarea
                  value={newGoal.description}
                  onChange={(e) => setNewGoal({...newGoal, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  rows={3}
                  placeholder="Popište svůj cíl"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cílové datum</label>
                <input
                  type="date"
                  value={newGoal.target_date}
                  onChange={(e) => setNewGoal({...newGoal, target_date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priorita</label>
                <select
                  value={newGoal.priority}
                  onChange={(e) => setNewGoal({...newGoal, priority: e.target.value as 'low' | 'medium' | 'high'})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="low">Nízká</option>
                  <option value="medium">Střední</option>
                  <option value="high">Vysoká</option>
                </select>
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleCreateGoal}
                className="flex-1 bg-primary-500 text-white py-2 px-4 rounded-lg hover:bg-primary-600 transition-colors flex items-center justify-center"
              >
                <Save className="w-4 h-4 mr-2" />
                Vytvořit cíl
              </button>
              <button
                onClick={() => {
                  setShowAddGoal(false)
                  setNewGoal({ title: '', description: '', target_date: '', priority: 'medium' })
                }}
                className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center"
              >
                <X className="w-4 h-4 mr-2" />
                Zrušit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
})
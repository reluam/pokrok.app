'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Plus } from 'lucide-react'
import { AddAspirationModal } from '../components/AddAspirationModal'

interface AspiraceViewProps {
  overviewAspirations: any[]
  overviewBalances: Record<string, any>
  aspirations: any[]
  setAspirations: (aspirations: any[]) => void
  goals: any[]
  habits: any[]
  onGoalsUpdate?: (goals: any[]) => void
  onHabitsUpdate?: (habits: any[]) => void
  isLoadingOverview: boolean
  showAddAspirationModal: boolean
  setShowAddAspirationModal: (show: boolean) => void
  editingAspiration: any | null
  setEditingAspiration: (aspiration: any | null) => void
  setOverviewAspirations: (aspirations: any[]) => void
  setOverviewBalances: (setter: (prev: Record<string, any>) => Record<string, any>) => void
}

export function AspiraceView({
  overviewAspirations,
  overviewBalances,
  aspirations,
  setAspirations,
  goals,
  habits,
  onGoalsUpdate,
  onHabitsUpdate,
  isLoadingOverview,
  showAddAspirationModal,
  setShowAddAspirationModal,
  editingAspiration,
  setEditingAspiration,
  setOverviewAspirations,
  setOverviewBalances
}: AspiraceViewProps) {
  const t = useTranslations()

  const calculateInsights = () => {
    const easy: string[] = []
    const hard: string[] = []
    
    overviewAspirations.forEach(aspiration => {
      const balance = overviewBalances[aspiration.id]
      if (balance) {
        const rate = balance.completion_rate_recent
        if (rate >= 80) {
          easy.push(aspiration.title)
        } else if (rate < 30) {
          hard.push(aspiration.title)
        }
      }
    })
    
    return { easy, hard }
  }

  const handleAddAspiration = async (title: string, description: string, color: string, selectedGoalIds: string[] = [], selectedHabitIds: string[] = []) => {
    try {
      const response = await fetch('/api/aspirations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, color })
      })

      if (response.ok) {
        const newAspiration = await response.json()
        setOverviewAspirations([...overviewAspirations, newAspiration])
        setAspirations([...aspirations, newAspiration])
        setShowAddAspirationModal(false)
        
        // Update aspiration_id for selected goals
        for (const goalId of selectedGoalIds) {
          try {
            await fetch('/api/goals', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ goalId, aspirationId: newAspiration.id })
            })
          } catch (error) {
            console.error(`Error updating goal ${goalId}:`, error)
          }
        }
        
        // Update aspiration_id for selected habits
        for (const habitId of selectedHabitIds) {
          try {
            await fetch('/api/habits', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ habitId, aspirationId: newAspiration.id })
            })
          } catch (error) {
            console.error(`Error updating habit ${habitId}:`, error)
          }
        }
        
        // Refresh goals and habits if we updated any
        if (selectedGoalIds.length > 0 || selectedHabitIds.length > 0) {
          onGoalsUpdate?.(goals.map(g => 
            selectedGoalIds.includes(g.id) ? { ...g, aspiration_id: newAspiration.id } : g
          ))
          onHabitsUpdate?.(habits.map(h => 
            selectedHabitIds.includes(h.id) ? { ...h, aspiration_id: newAspiration.id } : h
          ))
        }
        
        // Load balance for new aspiration
        try {
          const balanceResponse = await fetch(`/api/aspirations/balance?aspirationId=${newAspiration.id}`)
          if (balanceResponse.ok) {
            const balance = await balanceResponse.json()
            setOverviewBalances((prev: Record<string, any>) => ({
              ...prev,
              [newAspiration.id]: balance
            }))
          }
        } catch (error) {
          console.error('Error loading aspiration balance:', error)
        }
      } else {
        const errorData = await response.json()
        alert(`Chyba: ${errorData.error || t('aspirace.error.create')}`)
      }
    } catch (error) {
      console.error('Error creating aspiration:', error)
      alert(t('aspirace.error.create'))
    }
  }

  const handleUpdateAspiration = async (title: string, description: string, color: string, selectedGoalIds: string[] = [], selectedHabitIds: string[] = []) => {
    if (!editingAspiration) return
    
    try {
      const response = await fetch('/api/aspirations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          aspirationId: editingAspiration.id,
          title, 
          description, 
          color 
        })
      })

      if (response.ok) {
        const updatedAspiration = await response.json()
        setOverviewAspirations(overviewAspirations.map(a => 
          a.id === updatedAspiration.id ? updatedAspiration : a
        ))
        setAspirations(aspirations.map(a => 
          a.id === updatedAspiration.id ? updatedAspiration : a
        ))
        
        // Get current goals and habits assigned to this aspiration
        const currentGoalIds = goals.filter(g => g.aspiration_id === editingAspiration.id).map(g => g.id)
        const currentHabitIds = habits.filter(h => h.aspiration_id === editingAspiration.id).map(h => h.id)
        
        // Remove aspiration_id from goals that were unselected
        const goalsToRemove = currentGoalIds.filter(id => !selectedGoalIds.includes(id))
        for (const goalId of goalsToRemove) {
          try {
            await fetch('/api/goals', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ goalId, aspirationId: null })
            })
          } catch (error) {
            console.error(`Error removing aspiration from goal ${goalId}:`, error)
          }
        }
        
        // Add aspiration_id to newly selected goals
        const goalsToAdd = selectedGoalIds.filter(id => !currentGoalIds.includes(id))
        for (const goalId of goalsToAdd) {
          try {
            await fetch('/api/goals', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ goalId, aspirationId: editingAspiration.id })
            })
          } catch (error) {
            console.error(`Error adding aspiration to goal ${goalId}:`, error)
          }
        }
        
        // Remove aspiration_id from habits that were unselected
        const habitsToRemove = currentHabitIds.filter(id => !selectedHabitIds.includes(id))
        for (const habitId of habitsToRemove) {
          try {
            await fetch('/api/habits', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ habitId, aspirationId: null })
            })
          } catch (error) {
            console.error(`Error removing aspiration from habit ${habitId}:`, error)
          }
        }
        
        // Add aspiration_id to newly selected habits
        const habitsToAdd = selectedHabitIds.filter(id => !currentHabitIds.includes(id))
        for (const habitId of habitsToAdd) {
          try {
            await fetch('/api/habits', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ habitId, aspirationId: editingAspiration.id })
            })
          } catch (error) {
            console.error(`Error adding aspiration to habit ${habitId}:`, error)
          }
        }
        
        // Refresh goals and habits
        if (goalsToRemove.length > 0 || goalsToAdd.length > 0 || habitsToRemove.length > 0 || habitsToAdd.length > 0) {
          onGoalsUpdate?.(goals.map(g => {
            if (goalsToRemove.includes(g.id)) return { ...g, aspiration_id: null }
            if (goalsToAdd.includes(g.id)) return { ...g, aspiration_id: editingAspiration.id }
            return g
          }))
          onHabitsUpdate?.(habits.map(h => {
            if (habitsToRemove.includes(h.id)) return { ...h, aspiration_id: null }
            if (habitsToAdd.includes(h.id)) return { ...h, aspiration_id: editingAspiration.id }
            return h
          }))
        }
        
        // Update balance for this aspiration
        try {
          const balanceResponse = await fetch(`/api/aspirations/balance?aspirationId=${editingAspiration.id}`)
          if (balanceResponse.ok) {
            const balance = await balanceResponse.json()
            setOverviewBalances((prev: Record<string, any>) => ({
              ...prev,
              [editingAspiration.id]: balance
            }))
          }
        } catch (error) {
          console.error('Error loading aspiration balance:', error)
        }
        
        setEditingAspiration(null)
      } else {
        const errorData = await response.json()
        alert(`Chyba: ${errorData.error || t('aspirace.error.update')}`)
      }
    } catch (error) {
      console.error('Error updating aspiration:', error)
      alert(t('aspirace.error.update'))
    }
  }

  if (isLoadingOverview) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('aspirace.loading')}</p>
        </div>
      </div>
    )
  }

  const insights = calculateInsights()

  return (
    <div className="w-full h-full flex flex-col">
      {/* Filters Row */}
      <div className="flex items-center justify-between gap-4 px-4 py-2 bg-white border-b border-gray-200">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Filters can be added here in the future if needed */}
        </div>
        
        {/* Add Aspiration Button */}
        <button
          onClick={() => setShowAddAspirationModal(true)}
          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2 text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          {t('aspirace.addAspirace')}
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-6">

        {/* Aspirations List */}
        {overviewAspirations.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
          <div className="text-4xl mb-4">✨</div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">{t('aspirace.noAspirace')}</h3>
          <p className="text-sm text-gray-600 mb-4">{t('aspirace.noAspiraceDescription')}</p>
          <button
            onClick={() => setShowAddAspirationModal(true)}
            className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
          >
            {t('aspirace.addAspirace')}
          </button>
        </div>
      ) : (
        <div className="space-y-4 mb-6">
          {overviewAspirations.map((aspiration: any) => {
            const balance = overviewBalances[aspiration.id]
            return (
              <div key={aspiration.id} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                {/* Header */}
                <div className="flex items-start gap-3 mb-4">
                  <div 
                    className="w-3 h-3 rounded-full flex-shrink-0 mt-1"
                    style={{ backgroundColor: aspiration.color || '#3B82F6' }}
                  ></div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{aspiration.title}</h3>
                    {aspiration.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">{aspiration.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => setEditingAspiration(aspiration)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 hover:text-gray-900"
                    title={t('aspirace.editAspirace')}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                </div>

                {/* Balance */}
                {balance ? (
                  (() => {
                    return balance.total_planned_steps === 0 && balance.total_planned_habits === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <div className="text-gray-400 mb-2">
                          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                          </svg>
                        </div>
                        <p className="text-sm text-gray-500 mb-1">{t('aspirace.noGoalsHabits')}</p>
                        <p className="text-xs text-gray-400">{t('aspirace.noGoalsHabitsDescription')}</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* XP Summary */}
                        <div className="flex items-center gap-6">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Celkem XP</p>
                            <p className="text-xl font-semibold text-gray-900">{balance.total_xp}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Posledních 90 dní</p>
                            <p className="text-xl font-semibold text-gray-900">{balance.recent_xp}</p>
                          </div>
                          <div className="ml-auto">
                            {balance.trend === 'positive' && (
                              <div className="flex items-center text-green-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                              </div>
                            )}
                            {balance.trend === 'negative' && (
                              <div className="flex items-center text-red-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17l5-5m0 0l-5-5m5 5H6" />
                                </svg>
                              </div>
                            )}
                            {balance.trend === 'neutral' && (
                              <div className="flex items-center text-gray-500">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
                                </svg>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Activity Breakdown */}
                        <div className="flex items-center gap-6 text-sm">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Kroky</p>
                            <p className="font-medium text-gray-900">
                              {balance.recent_completed_steps}/{balance.recent_planned_steps}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Návyky</p>
                            <p className="font-medium text-gray-900">
                              {balance.recent_completed_habits}/{balance.recent_planned_habits}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })()
                ) : (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Insights Section */}
      {(insights.easy.length > 0 || insights.hard.length > 0) && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">{t('aspirace.insights.title')}</h3>
          
          {insights.easy.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-green-800 mb-2">{t('aspirace.insights.easy')}</h4>
              <ul className="space-y-1">
                {insights.easy.map((title: string) => (
                  <li key={title} className="flex items-center gap-2 text-sm text-gray-700">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-600"></div>
                    {title}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {insights.hard.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-red-800 mb-2">{t('aspirace.insights.hard')}</h4>
              <ul className="space-y-1">
                {insights.hard.map((title: string) => (
                  <li key={title} className="flex items-center gap-2 text-sm text-gray-700">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-600"></div>
                    {title}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        )}

        {/* Add Aspiration Modal */}
        {showAddAspirationModal && (
          <AddAspirationModal
            goals={goals}
            habits={habits}
            onClose={() => setShowAddAspirationModal(false)}
            onAspirationAdded={handleAddAspiration}
          />
        )}

        {/* Edit Aspiration Modal */}
        {editingAspiration && (
          <AddAspirationModal
            aspiration={editingAspiration}
            goals={goals}
            habits={habits}
            onClose={() => setEditingAspiration(null)}
            onAspirationAdded={handleUpdateAspiration}
          />
        )}
      </div>
    </div>
  )
}


'use client'

import { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'

interface GoalsManagementViewProps {
  player: any
  goals: any[]
  onGoalsUpdate: (goals: any[]) => void
  onBack?: () => void
}

export function GoalsManagementView({ player, goals, onGoalsUpdate, onBack }: GoalsManagementViewProps) {
  const t = useTranslations()
  const locale = useLocale()
  const [showAddForm, setShowAddForm] = useState(false)
  const [goalTitle, setGoalTitle] = useState('')
  const [goalDescription, setGoalDescription] = useState('')
  const [goalDeadline, setGoalDeadline] = useState('')
  const [goalCategory, setGoalCategory] = useState('osobní')

  const categories = [
    { value: 'osobní', label: t('goals.categories.personal') },
    { value: 'kariéra', label: t('goals.categories.career') },
    { value: 'zdraví', label: t('goals.categories.health') },
    { value: 'vzdělání', label: t('goals.categories.education') },
    { value: 'vztahy', label: t('goals.categories.relationships') },
    { value: 'koníčky', label: t('goals.categories.hobbies') },
    { value: 'jiné', label: t('goals.categories.other') }
  ]

  const handleAddGoal = () => {
    if (!goalTitle.trim()) return

    const newGoal = {
      id: `goal_${Date.now()}`,
      title: goalTitle.trim(),
      description: goalDescription.trim() || undefined,
      deadline: goalDeadline ? new Date(goalDeadline) : undefined,
      category: goalCategory,
      priority: 'medium',
      status: 'active',
      completed: false,
      createdAt: new Date()
    }

    onGoalsUpdate([...goals, newGoal])

    // Reset form
    setGoalTitle('')
    setGoalDescription('')
    setGoalDeadline('')
    setGoalCategory('osobní')
    setShowAddForm(false)
  }

  const handleDeleteGoal = (goalId: string) => {
    onGoalsUpdate(goals.filter(goal => goal.id !== goalId))
  }

  const handleToggleComplete = (goalId: string) => {
    onGoalsUpdate(goals.map(goal => 
      goal.id === goalId 
        ? { ...goal, completed: !goal.completed, completedAt: !goal.completed ? new Date() : undefined }
        : goal
    ))
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString(locale === 'cs' ? 'cs-CZ' : 'en-US')
  }

  return (
    <div className="bg-white bg-opacity-95 rounded-2xl p-8 border border-orange-200 shadow-xl backdrop-blur-sm max-h-[calc(100vh-200px)] overflow-y-auto" style={{
      boxShadow: '0 12px 24px rgba(251, 146, 60, 0.15), 0 4px 8px rgba(0, 0, 0, 0.05)'
    }}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-orange-800" style={{ letterSpacing: '1px' }}>{t('goals.title')}</h1>
        <div className="flex gap-2">
          {onBack && (
            <button
              onClick={onBack}
              className="px-4 py-2 rounded-lg bg-gray-500 text-white hover:bg-gray-600 transition-colors"
            >
              ← {t('common.back')}
            </button>
          )}
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="p-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            title={showAddForm ? t('goals.cancelAdd') : t('goals.addGoal')}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showAddForm ? "M6 18L18 6M6 6l12 12" : "M12 6v6m0 0v6m0-6h6m-6 0H6"} />
            </svg>
          </button>
        </div>
      </div>

      {/* Add Goal Form */}
      {showAddForm && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h2 className="text-lg font-bold text-gray-900 mb-4">{t('goals.addNewGoal')}</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">{t('goals.goalTitle')}</label>
              <input
                type="text"
                value={goalTitle}
                onChange={(e) => setGoalTitle(e.target.value)}
                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                placeholder={t('goals.goalTitlePlaceholder')}
                maxLength={100}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">{t('goals.goalDescription')}</label>
              <textarea
                value={goalDescription}
                onChange={(e) => setGoalDescription(e.target.value)}
                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none resize-none"
                rows={3}
                placeholder={t('goals.goalDescriptionPlaceholder')}
                maxLength={500}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">{t('goals.category')}</label>
                <select
                  value={goalCategory}
                  onChange={(e) => setGoalCategory(e.target.value)}
                  className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                >
                  {categories.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">{t('goals.deadline')}</label>
                <input
                  type="date"
                  value={goalDeadline}
                  onChange={(e) => setGoalDeadline(e.target.value)}
                  className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleAddGoal}
                disabled={!goalTitle.trim()}
                className="px-6 py-3 rounded-xl font-bold bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('goals.addGoalButton')}
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="px-6 py-3 rounded-xl font-bold bg-gradient-to-r from-gray-500 to-gray-600 text-white hover:from-gray-600 hover:to-gray-700 shadow-lg transition-all duration-300"
              >
                {t('goals.cancelButton')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Goals List */}
      <div>
        {goals.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg font-bold text-gray-700 mb-2">{t('goals.noGoals')}</p>
            <p className="text-sm text-gray-500">{t('goals.noGoalsDescription')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {goals.map((goal) => (
              <div
                key={goal.id}
                className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                  goal.completed 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-300 bg-gray-50 hover:border-purple-500'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <button
                        onClick={() => handleToggleComplete(goal.id)}
                        className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                          goal.completed 
                            ? 'border-green-500 bg-green-500 text-white' 
                            : 'border-gray-300 hover:border-green-500'
                        }`}
                      >
                        {goal.completed && '✓'}
                      </button>
                      <h3 className={`font-bold ${goal.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                        {goal.title}
                      </h3>
                    </div>
                    
                    {goal.description && (
                      <p className="text-sm text-gray-600 mb-2">{goal.description}</p>
                    )}
                    
                    <div className="text-xs text-gray-500">
                      {t('goals.categoryLabel')}: {goal.category} • 
                      {t('goals.deadlineLabel')}: {goal.deadline ? formatDate(goal.deadline) : t('goals.noDeadline')} •
                      {t('goals.createdAt')}: {formatDate(goal.createdAt)}
                      {goal.completed && goal.completedAt && (
                        <span className="text-green-600 ml-2">
                          • {t('goals.completedAt')}: {formatDate(goal.completedAt)}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleDeleteGoal(goal.id)}
                    className="ml-4 px-3 py-1 rounded bg-red-500 text-white hover:bg-red-600 transition-colors text-sm"
                  >
                    {t('goals.delete')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

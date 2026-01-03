'use client'

import { useState } from 'react'
import { X, CheckCircle, Target } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface DailyReviewWorkflowProps {
  workflow: any
  goals: any[]
  player: any
  onComplete: (workflowId: string, xp: number) => void
  onSkip: (workflowId: string) => void
  onGoalProgressUpdate: (goalId: string, progress: number) => Promise<void>
}

export function DailyReviewWorkflow({
  workflow,
  goals,
  player,
  onComplete,
  onSkip,
  onGoalProgressUpdate
}: DailyReviewWorkflowProps) {
  const t = useTranslations()
  const [whatWentWell, setWhatWentWell] = useState('')
  const [whatWentWrong, setWhatWentWrong] = useState('')
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null)
  const [goalProgress, setGoalProgress] = useState<Record<string, number>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showGoalSelector, setShowGoalSelector] = useState(false)

  const activeGoals = goals.filter(g => g.status === 'active')

  const handleComplete = async () => {
    setIsSubmitting(true)
    try {
      // Update goal progress if any was changed
      for (const [goalId, progress] of Object.entries(goalProgress)) {
        await onGoalProgressUpdate(goalId, progress as number)
      }

      // Save workflow responses
      const today = new Date().toISOString().split('T')[0]
      await fetch('/api/workflows/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: player?.user_id,
          workflowId: workflow.id,
          workflowType: workflow.type,
          date: today,
          responses: {
            whatWentWell,
            whatWentWrong,
            goalUpdates: Object.entries(goalProgress).map(([goalId, progress]) => ({
              goalId,
              progress
            }))
          }
        })
      })

      // Mark workflow as completed
      await fetch(`/api/workflows/${workflow.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed_at: new Date() })
      })

      onComplete(workflow.id, 10)
    } catch (error) {
      console.error('Error completing workflow:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSkip = async () => {
    await onSkip(workflow.id)
  }

  const handleGoalSelect = (goalId: string) => {
    setSelectedGoal(goalId)
    if (!goalProgress[goalId]) {
      const goal = goals.find(g => g.id === goalId)
      setGoalProgress(prev => ({
        ...prev,
        [goalId]: goal?.progress || 0
      }))
    }
    setShowGoalSelector(false)
  }

  const handleProgressChange = (goalId: string, value: number) => {
    setGoalProgress(prev => ({
      ...prev,
      [goalId]: Math.max(0, Math.min(100, value))
    }))
  }

  const selectedGoalData = selectedGoal ? goals.find(g => g.id === selectedGoal) : null

  return (
    <div className="bg-white bg-opacity-95 rounded-2xl p-8 border border-orange-200 shadow-xl backdrop-blur-sm w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-orange-800">🌅 {t('dailyReview.title')}</h2>
            <p className="text-gray-600 mt-1">{t('dailyReview.description')}</p>
          </div>
          <button
            onClick={handleSkip}
            className="text-gray-500 hover:text-gray-700 rounded-lg p-2 transition-colors"
            title={t('dailyReview.skip')}
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {/* Co se dnes povedlo */}
        <div>
          <label className="block text-lg font-bold text-gray-900 mb-2">
            1. {t('dailyReview.whatWentWell.label')}
          </label>
          <textarea
            value={whatWentWell}
            onChange={(e) => setWhatWentWell(e.target.value)}
            placeholder={t('dailyReview.whatWentWell.placeholder')}
            className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Co se nepovedlo */}
        <div>
          <label className="block text-lg font-bold text-gray-900 mb-2">
            2. {t('dailyReview.whatWentWrong.label')}
          </label>
          <textarea
            value={whatWentWrong}
            onChange={(e) => setWhatWentWrong(e.target.value)}
            placeholder={t('dailyReview.whatWentWrong.placeholder')}
            className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Úprava progressu cílů */}
        <div>
          <label className="block text-lg font-bold text-gray-900 mb-2">
            3. {t('dailyReview.updateGoalProgress.label')}
          </label>
          
          {selectedGoal ? (
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-orange-500" />
                  <span className="font-semibold text-gray-900">{selectedGoalData?.name}</span>
                </div>
                <button
                  onClick={() => {
                    setSelectedGoal(null)
                    setShowGoalSelector(true)
                  }}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  {t('dailyReview.updateGoalProgress.change')}
                </button>
              </div>
              
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-700">{t('dailyReview.updateGoalProgress.progress')}</span>
                    <span className="text-sm font-semibold text-orange-600">
                      {goalProgress[selectedGoal]}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={goalProgress[selectedGoal] || 0}
                    onChange={(e) => handleProgressChange(selectedGoal, parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                  />
                  <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                    <span>0%</span>
                    <span>50%</span>
                    <span>100%</span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => handleProgressChange(selectedGoal, Math.max(0, (goalProgress[selectedGoal] || 0) - 10))}
                    className="flex-1 px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                  >
                    -10%
                  </button>
                  <button
                    onClick={() => handleProgressChange(selectedGoal, Math.min(100, (goalProgress[selectedGoal] || 0) + 10))}
                    className="flex-1 px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                  >
                    +10%
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div>
              {activeGoals.length === 0 ? (
                <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-500">
                  {t('dailyReview.updateGoalProgress.noGoals')}
                </div>
              ) : (
                <>
                  {showGoalSelector ? (
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 max-h-60 overflow-y-auto">
                      <div className="space-y-2">
                        {activeGoals.map(goal => (
                          <button
                            key={goal.id}
                            onClick={() => handleGoalSelect(goal.id)}
                            className="w-full text-left px-4 py-3 bg-white rounded-lg border border-gray-200 hover:border-orange-500 hover:bg-orange-50 transition-colors"
                          >
                            <div className="font-semibold text-gray-900">{goal.name}</div>
                            <div className="text-sm text-gray-500 mt-1">
                              {t('dailyReview.updateGoalProgress.progress')}: {goal.progress || 0}%
                            </div>
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={() => setShowGoalSelector(false)}
                        className="mt-3 w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                      >
                        {t('common.cancel')}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowGoalSelector(true)}
                      className="w-full px-4 py-3 bg-orange-100 text-orange-700 rounded-lg border border-orange-300 hover:bg-orange-200 transition-colors flex items-center justify-center gap-2"
                    >
                      <Target className="w-5 h-5" />
                      {t('dailyReview.updateGoalProgress.selectGoal')}
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <button
              onClick={handleSkip}
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              disabled={isSubmitting}
            >
            {t('dailyReview.skip')}
          </button>
          <button
            onClick={handleComplete}
            disabled={isSubmitting}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              t('dailyReview.saving')
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                {t('dailyReview.complete')} (+10 XP)
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}


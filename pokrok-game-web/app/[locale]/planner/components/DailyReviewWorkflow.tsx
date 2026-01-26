'use client'

import { useState } from 'react'
import { X, CheckCircle, Target } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface DailyReviewWorkflowProps {
  workflow: any
  player: any
  onComplete: (workflowId: string, xp: number) => void
  onSkip: (workflowId: string) => void
}

export function DailyReviewWorkflow({
  workflow,
  player,
  onComplete,
  onSkip,
}: DailyReviewWorkflowProps) {
  const t = useTranslations()
  const [whatWentWell, setWhatWentWell] = useState('')
  const [whatWentWrong, setWhatWentWrong] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  // Goals removed - no goal progress tracking

  const handleComplete = async () => {
    setIsSubmitting(true)
    try {
      // Goals removed - no goal progress to update

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
            goalUpdates: [] // Goals removed
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

  // Goals removed - no goal selection or progress tracking

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

        {/* Goals removed - no goal progress section */}

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


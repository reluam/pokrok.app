'use client'

import { useState, useEffect } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { CheckCircle } from 'lucide-react'
import { Chart } from './Chart'
import { ContributionGraph } from './ContributionGraph'

interface OverviewStatisticsProps {
}

interface StatisticsData {
  period: string
  startDate: string
  endDate: string
  steps: {
    total: number
    completed: number
    planned: number
    completionRate: number
  }
  habits: {
    total: number
    completed: number
    completionRate: number
  }
  goals: {
    total: number
    completed: number
    completionRate: number
  }
  dailyData: Array<{
    date: string
    completed_steps: number
    total_steps: number
    completed_habits: number
    total_habits: number
    planned_steps?: number
    planned_habits?: number
  }>
  weeklyData?: Array<{
    week: string
    completed_steps: number
    total_steps: number
    completed_habits: number
    total_habits?: number
  }>
}

export function OverviewStatistics({}: OverviewStatisticsProps) {
  const t = useTranslations()
  const locale = useLocale()
  const [allTimeStats, setAllTimeStats] = useState<StatisticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      setIsLoading(true)
      try {
        const response = await fetch('/api/statistics?period=all')
        if (response.ok) {
          const data = await response.json()
          setAllTimeStats(data)
        }
      } catch (error) {
        console.error('Error loading statistics:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadStats()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent mb-4"></div>
          <p className="text-gray-600">{t('common.loading') || 'Načítání...'}</p>
        </div>
      </div>
    )
  }

  if (!allTimeStats) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        {t('statistics.noData') || 'Žádná data'}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Work in Progress Notice */}
      <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-yellow-800 mb-1">
              {t('statistics.wip.title') || 'Work in Progress'}
            </p>
            <p className="text-sm text-yellow-700">
              {t('statistics.wip.message') || 'Statistiky jsou momentálně ve vývoji a budou se ještě upravovat.'}
            </p>
          </div>
        </div>
      </div>

      <h2 className="text-2xl font-bold font-playful text-text-primary mb-6">
        {t('statistics.overview.title') || 'Přehled'}
      </h2>

      {/* Contribution Graph */}
      <div className="mb-8">
        <ContributionGraph dailyData={allTimeStats.dailyData} />
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Steps Card */}
        <div className="card-playful-white p-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-5 h-5 text-primary-600" />
            <h3 className="text-lg font-bold font-playful text-text-primary">
              {t('statistics.steps.title') || 'Kroky'}
            </h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">{t('statistics.steps.completed') || 'Dokončeno'}:</span>
              <span className="font-bold text-text-primary">{allTimeStats.steps.completed}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">{t('statistics.steps.planned') || 'Naplánováno'}:</span>
              <span className="font-bold text-text-primary">{allTimeStats.steps.planned}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-gray-200">
              <span className="text-text-secondary font-semibold">{t('statistics.steps.completionRate') || 'Úspěšnost'}:</span>
              <span className="font-bold text-primary-600">{allTimeStats.steps.completionRate}%</span>
            </div>
          </div>
        </div>

        {/* Habits Card */}
        <div className="card-playful-white p-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-bold font-playful text-text-primary">
              {t('statistics.habits.title') || 'Návyky'}
            </h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">{t('statistics.habits.completed') || 'Dokončeno'}:</span>
              <span className="font-bold text-text-primary">{allTimeStats.habits.completed}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">{t('statistics.habits.total') || 'Celkem'}:</span>
              <span className="font-bold text-text-primary">{allTimeStats.habits.total}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-gray-200">
              <span className="text-text-secondary font-semibold">{t('statistics.habits.completionRate') || 'Úspěšnost'}:</span>
              <span className="font-bold text-primary-600">{allTimeStats.habits.completionRate}%</span>
            </div>
          </div>
        </div>

        {/* Goals Card */}
        <div className="card-playful-white p-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-bold font-playful text-text-primary">
              {t('statistics.goals.title') || 'Cíle'}
            </h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">{t('statistics.goals.completed') || 'Dokončeno'}:</span>
              <span className="font-bold text-text-primary">{allTimeStats.goals.completed}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">{t('statistics.goals.total') || 'Celkem'}:</span>
              <span className="font-bold text-text-primary">{allTimeStats.goals.total}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-gray-200">
              <span className="text-text-secondary font-semibold">{t('statistics.goals.completionRate') || 'Úspěšnost'}:</span>
              <span className="font-bold text-primary-600">{allTimeStats.goals.completionRate}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


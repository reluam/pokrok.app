'use client'

import { useState, useEffect, useMemo } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { TrendingUp, TrendingDown, Minus, CheckCircle } from 'lucide-react'
import { Chart } from './Chart'

interface PeriodStatisticsProps {
  period: 'week' | 'month' | 'year'
  title: string
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
  }>
  weeklyData?: Array<{
    week: string
    completed_steps: number
    total_steps: number
    completed_habits: number
  }>
  monthlyData?: Array<{
    month: string
    completed_steps: number
    total_steps: number
    completed_habits: number
  }>
}

export function PeriodStatistics({ period, title }: PeriodStatisticsProps) {
  const t = useTranslations()
  const locale = useLocale()
  const [currentStats, setCurrentStats] = useState<StatisticsData | null>(null)
  const [previousStats, setPreviousStats] = useState<StatisticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load current period statistics
  useEffect(() => {
    const loadStats = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/statistics?period=${period}`)
        if (response.ok) {
          const data = await response.json()
          setCurrentStats(data)
        }
      } catch (error) {
        console.error('Error loading statistics:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadStats()
  }, [period])

  // Load previous period statistics
  useEffect(() => {
    const loadPreviousStats = async () => {
      try {
        const response = await fetch(`/api/statistics?period=${period}&previousPeriod=true`)
        if (response.ok) {
          const data = await response.json()
          setPreviousStats(data)
        }
      } catch (error) {
        console.error('Error loading previous statistics:', error)
      }
    }

    loadPreviousStats()
  }, [period])

  // Calculate comparison metrics
  const comparison = useMemo(() => {
    if (!currentStats || !previousStats) return null

    const calculateChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? { value: 100, trend: 'up' as const } : { value: 0, trend: 'flat' as const }
      const change = ((current - previous) / previous) * 100
      return {
        value: Math.round(change),
        trend: change > 0 ? 'up' as const : change < 0 ? 'down' as const : 'flat' as const
      }
    }

    return {
      steps: {
        completed: calculateChange(currentStats.steps.completed, previousStats.steps.completed),
        planned: calculateChange(currentStats.steps.planned, previousStats.steps.planned),
        completionRate: calculateChange(currentStats.steps.completionRate, previousStats.steps.completionRate)
      },
      habits: {
        completed: calculateChange(currentStats.habits.completed, previousStats.habits.completed),
        completionRate: calculateChange(currentStats.habits.completionRate, previousStats.habits.completionRate)
      },
      goals: {
        completed: calculateChange(currentStats.goals.completed, previousStats.goals.completed),
        completionRate: calculateChange(currentStats.goals.completionRate, previousStats.goals.completionRate)
      }
    }
  }, [currentStats, previousStats])

  const getTrendIcon = (trend: 'up' | 'down' | 'flat') => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4 text-green-600" />
    if (trend === 'down') return <TrendingDown className="w-4 h-4 text-red-600" />
    return <Minus className="w-4 h-4 text-gray-400" />
  }

  const getTrendColor = (trend: 'up' | 'down' | 'flat') => {
    if (trend === 'up') return 'text-green-600'
    if (trend === 'down') return 'text-red-600'
    return 'text-gray-400'
  }

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

  if (!currentStats) {
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

      <h2 className="text-2xl font-bold font-playful text-text-primary">{title}</h2>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Steps Card */}
        <div className="card-playful-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold font-playful text-text-primary flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-primary-600" />
              {t('statistics.steps.title') || 'Kroky'}
            </h3>
            {comparison && (
              <div className="flex items-center gap-1">
                {getTrendIcon(comparison.steps.completionRate.trend)}
                <span className={`text-sm font-semibold ${getTrendColor(comparison.steps.completionRate.trend)}`}>
                  {comparison.steps.completionRate.value > 0 ? '+' : ''}
                  {comparison.steps.completionRate.value}%
                </span>
              </div>
            )}
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">{t('statistics.steps.completed') || 'Dokončeno'}:</span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-text-primary">{currentStats.steps.completed}</span>
                {comparison && (
                  <span className={`text-xs ${getTrendColor(comparison.steps.completed.trend)}`}>
                    ({comparison.steps.completed.value > 0 ? '+' : ''}{comparison.steps.completed.value}%)
                  </span>
                )}
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">{t('statistics.steps.planned') || 'Naplánováno'}:</span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-text-primary">{currentStats.steps.planned}</span>
                {comparison && (
                  <span className={`text-xs ${getTrendColor(comparison.steps.planned.trend)}`}>
                    ({comparison.steps.planned.value > 0 ? '+' : ''}{comparison.steps.planned.value}%)
                  </span>
                )}
              </div>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-gray-200">
              <span className="text-text-secondary font-semibold">{t('statistics.steps.completionRate') || 'Úspěšnost'}:</span>
              <span className="font-bold text-primary-600">{currentStats.steps.completionRate}%</span>
            </div>
          </div>
        </div>

        {/* Habits Card */}
        <div className="card-playful-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold font-playful text-text-primary flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              {t('statistics.habits.title') || 'Návyky'}
            </h3>
            {comparison && (
              <div className="flex items-center gap-1">
                {getTrendIcon(comparison.habits.completionRate.trend)}
                <span className={`text-sm font-semibold ${getTrendColor(comparison.habits.completionRate.trend)}`}>
                  {comparison.habits.completionRate.value > 0 ? '+' : ''}
                  {comparison.habits.completionRate.value}%
                </span>
              </div>
            )}
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">{t('statistics.habits.completed') || 'Dokončeno'}:</span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-text-primary">{currentStats.habits.completed}</span>
                {comparison && (
                  <span className={`text-xs ${getTrendColor(comparison.habits.completed.trend)}`}>
                    ({comparison.habits.completed.value > 0 ? '+' : ''}{comparison.habits.completed.value}%)
                  </span>
                )}
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">{t('statistics.habits.total') || 'Celkem'}:</span>
              <span className="font-bold text-text-primary">{currentStats.habits.total}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-gray-200">
              <span className="text-text-secondary font-semibold">{t('statistics.habits.completionRate') || 'Úspěšnost'}:</span>
              <span className="font-bold text-primary-600">{currentStats.habits.completionRate}%</span>
            </div>
          </div>
        </div>

        {/* Goals Card */}
        <div className="card-playful-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold font-playful text-text-primary flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-purple-600" />
              {t('statistics.goals.title') || 'Cíle'}
            </h3>
            {comparison && (
              <div className="flex items-center gap-1">
                {getTrendIcon(comparison.goals.completionRate.trend)}
                <span className={`text-sm font-semibold ${getTrendColor(comparison.goals.completionRate.trend)}`}>
                  {comparison.goals.completionRate.value > 0 ? '+' : ''}
                  {comparison.goals.completionRate.value}%
                </span>
              </div>
            )}
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">{t('statistics.goals.completed') || 'Dokončeno'}:</span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-text-primary">{currentStats.goals.completed}</span>
                {comparison && (
                  <span className={`text-xs ${getTrendColor(comparison.goals.completed.trend)}`}>
                    ({comparison.goals.completed.value > 0 ? '+' : ''}{comparison.goals.completed.value}%)
                  </span>
                )}
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">{t('statistics.goals.total') || 'Celkem'}:</span>
              <span className="font-bold text-text-primary">{currentStats.goals.total}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-gray-200">
              <span className="text-text-secondary font-semibold">{t('statistics.goals.completionRate') || 'Úspěšnost'}:</span>
              <span className="font-bold text-primary-600">{currentStats.goals.completionRate}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Comparison Summary */}
      {comparison && (
        <div className="card-playful-white p-6">
          <h3 className="text-lg font-bold font-playful text-text-primary mb-4">
            {t('statistics.comparison') || 'Srovnání s předchozím obdobím'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-primary-50 rounded-lg">
              <div className="text-sm text-text-secondary mb-1">{t('statistics.steps.title') || 'Kroky'}</div>
              <div className={`text-2xl font-bold ${getTrendColor(comparison.steps.completionRate.trend)}`}>
                {comparison.steps.completionRate.value > 0 ? '+' : ''}
                {comparison.steps.completionRate.value}%
              </div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-sm text-text-secondary mb-1">{t('statistics.habits.title') || 'Návyky'}</div>
              <div className={`text-2xl font-bold ${getTrendColor(comparison.habits.completionRate.trend)}`}>
                {comparison.habits.completionRate.value > 0 ? '+' : ''}
                {comparison.habits.completionRate.value}%
              </div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-sm text-text-secondary mb-1">{t('statistics.goals.title') || 'Cíle'}</div>
              <div className={`text-2xl font-bold ${getTrendColor(comparison.goals.completionRate.trend)}`}>
                {comparison.goals.completionRate.value > 0 ? '+' : ''}
                {comparison.goals.completionRate.value}%
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="card-playful-white p-6">
        <h3 className="text-lg font-bold font-playful text-text-primary mb-4">
          {period === 'week' && (t('statistics.charts.dailyProgress') || 'Denní pokrok')}
          {period === 'month' && (t('statistics.charts.dailyProgress') || 'Denní pokrok')}
          {period === 'year' && (t('statistics.charts.monthlyProgress') || 'Měsíční pokrok')}
        </h3>
        {period === 'year' && currentStats.monthlyData && currentStats.monthlyData.length > 0 ? (
          <>
            <Chart 
              data={currentStats.monthlyData} 
              type="monthly" 
              locale={locale}
            />
            <div className="flex items-center gap-4 mt-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-primary-500 rounded"></div>
                <span>{t('statistics.charts.completed') || 'Dokončeno'}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-300 rounded"></div>
                <span>{t('statistics.charts.planned') || 'Naplánováno'}</span>
              </div>
            </div>
          </>
        ) : currentStats.dailyData && currentStats.dailyData.length > 0 ? (
          <>
            <Chart 
              data={currentStats.dailyData} 
              type="daily" 
              locale={locale}
            />
            <div className="flex items-center gap-4 mt-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-primary-500 rounded"></div>
                <span>{t('statistics.charts.completed') || 'Dokončeno'}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-300 rounded"></div>
                <span>{t('statistics.charts.planned') || 'Naplánováno'}</span>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-500">
            {t('statistics.noData') || 'Žádná data'}
          </div>
        )}
      </div>
    </div>
  )
}


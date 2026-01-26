'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { BarChart3, CalendarDays, CalendarRange, ListTodo } from 'lucide-react'
import { OverviewStatistics } from './statistics/OverviewStatistics'
import { PeriodStatistics } from './statistics/PeriodStatistics'

interface StatisticsViewProps {
  player: any
  habits: any[]
  dailySteps?: any[]
  onBack?: () => void
}

type StatisticsSection = 'overview' | 'week' | 'month' | 'year'

export function StatisticsView({ 
  player, 
  habits,
  dailySteps = [],
  onBack
}: StatisticsViewProps) {
  const t = useTranslations()
  const [activeSection, setActiveSection] = useState<StatisticsSection>('overview')

  const menuItems = [
    { id: 'overview' as StatisticsSection, label: t('statistics.overview.title') || 'Přehled', icon: BarChart3 },
    { id: 'week' as StatisticsSection, label: t('statistics.period.week') || 'Týdenní', icon: CalendarRange },
    { id: 'month' as StatisticsSection, label: t('statistics.period.month') || 'Měsíční', icon: CalendarDays },
    { id: 'year' as StatisticsSection, label: t('statistics.period.year') || 'Roční', icon: ListTodo },
  ]

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return <OverviewStatistics />
      case 'week':
        return <PeriodStatistics period="week" title={t('statistics.period.week') || 'Týdenní statistiky'} />
      case 'month':
        return <PeriodStatistics period="month" title={t('statistics.period.month') || 'Měsíční statistiky'} />
      case 'year':
        return <PeriodStatistics period="year" title={t('statistics.period.year') || 'Roční statistiky'} />
      default:
        return <OverviewStatistics />
    }
  }

  return (
    <div className="min-h-screen bg-primary-50">
      <div className="flex">
        {/* Left Navigation Menu */}
        <div className="w-64 bg-white border-r-4 border-primary-500 min-h-screen p-4">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-black font-playful">{t('statistics.title') || 'Statistiky'}</h2>
          </div>

          <nav className="space-y-1.5">
            {menuItems.map((item) => {
              const IconComponent = item.icon
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`btn-playful-nav w-full flex items-center gap-3 px-3 py-2 text-left ${
                    activeSection === item.id ? 'active' : ''
                  }`}
                >
                  <IconComponent className="w-4 h-4 flex-shrink-0" />
                  <span className="font-medium text-sm">{item.label}</span>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  )
}

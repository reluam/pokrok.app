'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { useTranslations } from 'next-intl'

interface ContributionGraphProps {
  dailyData: Array<{
    date: string
    completed_steps: number
    total_steps: number
    completed_habits: number
    total_habits: number
    planned_steps?: number
    planned_habits?: number
  }>
  selectedYear?: number
}

interface DayData {
  date: Date
  dateStr: string
  completedSteps: number
  completedHabits: number
  plannedSteps: number
  plannedHabits: number
  total: number
  level: number // 0-4 for color intensity
  isPlanned: boolean // true if date is in the future
}

export function ContributionGraph({ dailyData, selectedYear }: ContributionGraphProps) {
  const t = useTranslations()
  const [hoveredDay, setHoveredDay] = useState<DayData | null>(null)

  // Create a map of date -> data for quick lookup
  const dataMap = useMemo(() => {
    const map = new Map<string, DayData>()
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    dailyData.forEach((day) => {
      const dayDate = new Date(day.date)
      dayDate.setHours(0, 0, 0, 0)
      const isPlanned = dayDate > today
      
      const completedTotal = (day.completed_steps || 0) + (day.completed_habits || 0)
      const plannedTotal = (day.planned_steps || 0) + (day.planned_habits || 0)
      const total = completedTotal + plannedTotal
      
      // Calculate intensity level (0-4) based on total
      // For planned items, use gray levels
      let level = 0
      if (total > 0) {
        if (isPlanned) {
          // Gray levels for planned items
          if (total >= 1) level = 1
          if (total >= 3) level = 2
          if (total >= 5) level = 3
          if (total >= 10) level = 4
        } else {
          // Primary color levels for completed items
          if (total >= 1) level = 1
          if (total >= 3) level = 2
          if (total >= 5) level = 3
          if (total >= 10) level = 4
        }
      }

      map.set(day.date, {
        date: dayDate,
        dateStr: day.date,
        completedSteps: day.completed_steps || 0,
        completedHabits: day.completed_habits || 0,
        plannedSteps: day.planned_steps || 0,
        plannedHabits: day.planned_habits || 0,
        total,
        level,
        isPlanned
      })
    })
    return map
  }, [dailyData])

  // Generate all days for the selected year (or last year if not specified)
  const days = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    let yearStart: Date
    let yearEnd: Date
    
    if (selectedYear) {
      // Use selected year
      yearStart = new Date(selectedYear, 0, 1)
      yearEnd = new Date(selectedYear, 11, 31, 23, 59, 59)
    } else {
      // Use last year from today
      yearStart = new Date(today)
      yearStart.setFullYear(yearStart.getFullYear() - 1)
      yearEnd = today
    }
    
    const allDays: DayData[] = []
    const current = new Date(yearStart)
    
    while (current <= yearEnd) {
      const dateStr = current.toISOString().split('T')[0]
      const existing = dataMap.get(dateStr)
      
      if (existing) {
        allDays.push(existing)
      } else {
        const dayDate = new Date(current)
        dayDate.setHours(0, 0, 0, 0)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const isPlanned = dayDate > today
        
        allDays.push({
          date: dayDate,
          dateStr,
          completedSteps: 0,
          completedHabits: 0,
          plannedSteps: 0,
          plannedHabits: 0,
          total: 0,
          level: 0,
          isPlanned
        })
      }
      
      current.setDate(current.getDate() + 1)
    }
    
    return allDays
  }, [dataMap, selectedYear])

  // Group days by week (starting from Sunday)
  const weeks = useMemo(() => {
    const weekGroups: DayData[][] = []
    let currentWeek: DayData[] = []
    
    // Find the first Sunday before or on the first day
    const firstDay = days[0]
    if (!firstDay) return []
    
    const firstDate = new Date(firstDay.date)
    const dayOfWeek = firstDate.getDay() // 0 = Sunday, 1 = Monday, etc.
    
    // Add empty days at the start to align with Sunday
    for (let i = 0; i < dayOfWeek; i++) {
      currentWeek.push({
        date: new Date(firstDate),
        dateStr: '',
        completedSteps: 0,
        completedHabits: 0,
        plannedSteps: 0,
        plannedHabits: 0,
        total: 0,
        level: 0,
        isPlanned: false
      })
      firstDate.setDate(firstDate.getDate() - 1)
    }
    currentWeek.reverse()
    
    days.forEach((day) => {
      const dayOfWeek = day.date.getDay()
      
      if (dayOfWeek === 0 && currentWeek.length > 0) {
        // Start new week on Sunday
        weekGroups.push(currentWeek)
        currentWeek = [day]
      } else {
        currentWeek.push(day)
      }
    })
    
    if (currentWeek.length > 0) {
      weekGroups.push(currentWeek)
    }
    
    return weekGroups
  }, [days])

  // Get month labels
  const monthLabels = useMemo(() => {
    const labels: { month: string; weekIndex: number }[] = []
    const seenMonths = new Set<string>()
    
    weeks.forEach((week, weekIndex) => {
      if (week.length > 0) {
        const firstDay = week.find(d => d.dateStr)
        if (firstDay) {
          const month = firstDay.date.toLocaleDateString('cs-CZ', { month: 'short' })
          if (!seenMonths.has(month)) {
            seenMonths.add(month)
            labels.push({ month, weekIndex })
          }
        }
      }
    })
    
    return labels
  }, [weeks])

  const getColorClass = (level: number, isPlanned: boolean) => {
    if (isPlanned) {
      // Gray levels for planned items
      switch (level) {
        case 0: return 'bg-gray-100 dark:bg-gray-800'
        case 1: return 'bg-gray-300 dark:bg-gray-700'
        case 2: return 'bg-gray-400 dark:bg-gray-600'
        case 3: return 'bg-gray-500 dark:bg-gray-500'
        case 4: return 'bg-gray-600 dark:bg-gray-400'
        default: return 'bg-gray-100 dark:bg-gray-800'
      }
    } else {
      // Primary color levels for completed items
      switch (level) {
        case 0: return 'bg-gray-100 dark:bg-gray-800'
        case 1: return 'bg-primary-200 dark:bg-primary-900'
        case 2: return 'bg-primary-400 dark:bg-primary-700'
        case 3: return 'bg-primary-600 dark:bg-primary-500'
        case 4: return 'bg-primary-800 dark:bg-primary-300'
        default: return 'bg-gray-100 dark:bg-gray-800'
      }
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('cs-CZ', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }
  
  const formatDateShort = (date: Date) => {
    return date.toLocaleDateString('cs-CZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const handleDayHover = (day: DayData) => {
    if (day.total === 0) return
    setHoveredDay(day)
  }

  const totalContributions = days.reduce((sum, day) => sum + day.total, 0)
  const totalSteps = days.reduce((sum, day) => sum + day.completedSteps + day.plannedSteps, 0)
  const totalHabits = days.reduce((sum, day) => sum + day.completedHabits + day.plannedHabits, 0)

  return (
    <div className="w-full">
      <div className="mb-4">
        <h3 className="text-lg font-bold font-playful text-text-primary mb-1">
          {totalSteps} {totalSteps === 1 ? 'krok' : totalSteps < 5 ? 'kroky' : 'kroků'} • {totalHabits} {totalHabits === 1 ? 'návyk' : totalHabits < 5 ? 'návyky' : 'návyků'} {selectedYear ? `v roce ${selectedYear}` : 'v posledním roce'}
        </h3>
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <span>{t('statistics.less') || 'Méně'}</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded bg-gray-100"></div>
            <div className="w-3 h-3 rounded bg-primary-200"></div>
            <div className="w-3 h-3 rounded bg-primary-400"></div>
            <div className="w-3 h-3 rounded bg-primary-600"></div>
            <div className="w-3 h-3 rounded bg-primary-800"></div>
          </div>
          <span>{t('statistics.more') || 'Více'}</span>
        </div>
      </div>

      <div className="relative">
        <div className="overflow-x-auto">
          <div className="inline-flex gap-1">
            {/* Day labels */}
            <div className="flex flex-col gap-1 pr-2">
              <div className="h-3"></div>
              {['Po', 'St', 'Pá'].map((day, i) => (
                <div key={i} className="h-3 text-xs text-text-secondary flex items-center">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="flex gap-1">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-1">
                  {/* Month label */}
                  {monthLabels.find(m => m.weekIndex === weekIndex) && (
                    <div className="h-3 text-xs text-text-secondary">
                      {monthLabels.find(m => m.weekIndex === weekIndex)?.month}
                    </div>
                  )}
                  {!monthLabels.find(m => m.weekIndex === weekIndex) && (
                    <div className="h-3"></div>
                  )}
                  
                  {/* Days */}
                  {week.map((day, dayIndex) => {
                    if (!day.dateStr) {
                      return <div key={dayIndex} className="w-3 h-3"></div>
                    }
                    
                    return (
                      <div
                        key={day.dateStr}
                        data-day={day.dateStr}
                        className="relative group"
                        onMouseEnter={() => handleDayHover(day)}
                        onMouseLeave={() => setHoveredDay(null)}
                      >
                        <div
                          className={`w-3 h-3 rounded-sm cursor-pointer transition-all ${getColorClass(day.level, day.isPlanned)} ${
                            day.total > 0 ? 'hover:ring-2 hover:ring-primary-500 hover:ring-offset-1' : ''
                          }`}
                          title={day.total > 0 ? `${day.total} ${t('statistics.contributions') || 'příspěvků'} ${formatDate(day.date)}` : formatDate(day.date)}
                        />
                        {hoveredDay?.dateStr === day.dateStr && day.total > 0 && (
                          <TooltipComponent day={day} parentSelector={`[data-day="${day.dateStr}"]`} />
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

// Tooltip component with smart positioning
function TooltipComponent({ day, parentSelector }: { day: DayData; parentSelector: string }) {
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const t = useTranslations()

  useEffect(() => {
    // Find parent element (the day square)
    const parent = document.querySelector(parentSelector) as HTMLElement
    if (!parent || !tooltipRef.current) return

    // Use requestAnimationFrame to ensure DOM is updated
    requestAnimationFrame(() => {
      if (!tooltipRef.current || !parent) return

      const tooltip = tooltipRef.current
      const parentRect = parent.getBoundingClientRect()
      const tooltipRect = tooltip.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      const padding = 8

      // Default: show above the square, centered
      let top = parentRect.top - tooltipRect.height - 8
      let left = parentRect.left + (parentRect.width / 2) - (tooltipRect.width / 2)

      // Check if tooltip would overflow on top (show below instead)
      if (top < padding) {
        top = parentRect.bottom + 8
      }

      // Check if tooltip would overflow on the right
      if (left + tooltipRect.width > viewportWidth - padding) {
        left = viewportWidth - tooltipRect.width - padding
      }

      // Check if tooltip would overflow on the left
      if (left < padding) {
        left = padding
      }

      setPosition({ top, left })
    })
  }, [day, parentSelector])

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('cs-CZ', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div
      ref={tooltipRef}
      className={`fixed z-[9999] text-xs rounded px-3 py-2 shadow-lg pointer-events-none ${
        day.isPlanned 
          ? 'bg-gray-600 text-white' 
          : 'bg-primary-600 text-white'
      }`}
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        minWidth: '200px',
        whiteSpace: 'normal'
      }}
    >
      <div className={`font-semibold mb-2 border-b ${day.isPlanned ? 'border-gray-400' : 'border-primary-400'} pb-1`}>
        {formatDate(day.date)}
        {day.isPlanned && (
          <span className="ml-2 text-xs opacity-75">(naplánováno)</span>
        )}
      </div>
      <div className="text-white space-y-1">
        {day.completedSteps > 0 && (
          <div>{day.completedSteps} {day.completedSteps === 1 ? 'krok' : day.completedSteps < 5 ? 'kroky' : 'kroků'}</div>
        )}
        {day.plannedSteps > 0 && (
          <div className="opacity-75">{day.plannedSteps} {day.plannedSteps === 1 ? 'krok' : day.plannedSteps < 5 ? 'kroky' : 'kroků'} (naplánováno)</div>
        )}
        {day.completedHabits > 0 && (
          <div>{day.completedHabits} {day.completedHabits === 1 ? 'návyk' : day.completedHabits < 5 ? 'návyky' : 'návyků'}</div>
        )}
        {day.plannedHabits > 0 && (
          <div className="opacity-75">{day.plannedHabits} {day.plannedHabits === 1 ? 'návyk' : day.plannedHabits < 5 ? 'návyky' : 'návyků'} (naplánováno)</div>
        )}
      </div>
    </div>
  )
}


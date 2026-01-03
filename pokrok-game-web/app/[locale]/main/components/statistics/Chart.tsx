'use client'

import { useEffect, useState } from 'react'

interface ChartProps {
  data: Array<{
    date?: string
    week?: string
    month?: string
    completed_steps: number
    total_steps: number
    completed_habits: number
    total_habits?: number
  }>
  type: 'daily' | 'weekly' | 'monthly'
  locale?: string
}

export function Chart({ data, type, locale = 'en' }: ChartProps) {
  const [primaryColor, setPrimaryColor] = useState('#ea580c')

  useEffect(() => {
    // Get primary color from CSS custom property
    const root = getComputedStyle(document.documentElement)
    const color = root.getPropertyValue('--color-primary-500').trim() || '#ea580c'
    setPrimaryColor(color)
  }, [])

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        Žádná data
      </div>
    )
  }

  const maxValue = Math.max(
    ...data.map(d => Math.max(
      (d.total_steps || 0) + (d.total_habits || 0), 
      (d.completed_steps || 0) + (d.completed_habits || 0)
    )),
    1
  )

  // Get week number from date
  const getWeekNumber = (date: Date): number => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
    const dayNum = d.getUTCDay() || 7
    d.setUTCDate(d.getUTCDate() + 4 - dayNum)
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  }

  // Group dates by month for month labels
  const getMonthGroups = () => {
    const groups: { [key: string]: number[] } = {}
    data.forEach((item, index) => {
      let date: Date
      if (type === 'daily' && item.date) {
        date = new Date(item.date)
      } else if (type === 'weekly' && item.week) {
        date = new Date(item.week)
      } else {
        return
      }
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`
      if (!groups[monthKey]) {
        groups[monthKey] = []
      }
      groups[monthKey].push(index)
    })
    return groups
  }

  const monthGroups = getMonthGroups()

  const padding = 40
  const baseWidth = 800
  const chartHeight = 300
  const barWidth = Math.max((baseWidth - padding * 2) / data.length - 4, 4)
  const maxBarHeight = chartHeight - padding * 2

  return (
    <div className="w-full">
      <svg 
        width="100%" 
        height={chartHeight} 
        viewBox={`0 0 ${baseWidth} ${chartHeight}`} 
        preserveAspectRatio="xMidYMid meet"
        className="w-full"
      >
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = padding + (1 - ratio) * maxBarHeight
          return (
            <g key={ratio}>
              <line
                x1={padding}
                y1={y}
                x2={baseWidth - padding}
                y2={y}
                stroke="#e5e7eb"
                strokeWidth="1"
                strokeDasharray="4,4"
              />
              <text
                x={padding - 10}
                y={y + 4}
                textAnchor="end"
                className="text-xs fill-gray-500"
              >
                {Math.round(maxValue * ratio)}
              </text>
            </g>
          )
        })}

        {/* Bars */}
        {data.map((item, i) => {
          const x = padding + i * ((baseWidth - padding * 2) / data.length)
          const planned = (item.total_steps || 0) + (item.total_habits || 0)
          const completed = (item.completed_steps || 0) + (item.completed_habits || 0)
          
          const plannedHeight = (planned / maxValue) * maxBarHeight
          const completedHeight = Math.min((completed / maxValue) * maxBarHeight, plannedHeight)
          const missingHeight = plannedHeight - completedHeight
          
          const baseY = padding + maxBarHeight

          return (
            <g key={i}>
              {/* Planned (total steps + total habits) - gray background - full height */}
              <rect
                x={x + 2}
                y={baseY - plannedHeight}
                width={barWidth}
                height={plannedHeight}
                fill="#e5e7eb"
                rx="2"
              />
              {/* Completed (steps + habits) - primary color - stacked on bottom */}
              <rect
                x={x + 2}
                y={baseY - completedHeight}
                width={barWidth}
                height={completedHeight}
                fill={primaryColor}
                rx="2"
              />
            </g>
          )
        })}

        {/* Labels */}
        {data.map((item, i) => {
          const x = padding + i * ((baseWidth - padding * 2) / data.length)
          const baseY = padding + maxBarHeight
          
          if (type === 'weekly' && item.week) {
            // Overview: Week number and year
            const date = new Date(item.week)
            const weekNum = getWeekNumber(date)
            const year = date.getFullYear()
            return (
              <g key={`label-${i}`}>
                <text
                  x={x + barWidth / 2 + 2}
                  y={baseY + 15}
                  textAnchor="middle"
                  className="text-xs fill-gray-600"
                >
                  {weekNum}
                </text>
                <text
                  x={x + barWidth / 2 + 2}
                  y={baseY + 28}
                  textAnchor="middle"
                  className="text-xs fill-gray-500"
                >
                  {year}
                </text>
              </g>
            )
          } else if (type === 'daily' && item.date) {
            // Daily: Day number
            const date = new Date(item.date)
            const day = date.getDate()
            const currentMonth = date.getMonth()
            const currentYear = date.getFullYear()
            
            // Check if this is the first day of the month in the dataset
            const isFirstOfMonth = i === 0 || (() => {
              const prevItem = data[i - 1]
              if (!prevItem?.date) return false
              const prevDate = new Date(prevItem.date)
              return prevDate.getMonth() !== currentMonth || prevDate.getFullYear() !== currentYear
            })()
            
            // Check if this is the last day of the month in the dataset
            const isLastOfMonth = i === data.length - 1 || (() => {
              const nextItem = data[i + 1]
              if (!nextItem?.date) return true
              const nextDate = new Date(nextItem.date)
              return nextDate.getMonth() !== currentMonth || nextDate.getFullYear() !== currentYear
            })()
            
            return (
              <g key={`label-${i}`}>
                <text
                  x={x + barWidth / 2 + 2}
                  y={baseY + 15}
                  textAnchor="middle"
                  className="text-xs fill-gray-600"
                >
                  {day}
                </text>
                {(isFirstOfMonth || isLastOfMonth) && (
                  <text
                    x={x + barWidth / 2 + 2}
                    y={baseY + 28}
                    textAnchor="middle"
                    className="text-xs fill-gray-500"
                  >
                    {date.toLocaleDateString(locale === 'cs' ? 'cs-CZ' : 'en-US', { month: 'short' })}
                  </text>
                )}
              </g>
            )
          } else if (type === 'monthly' && item.month) {
            // Monthly: Month name
            const [year, month] = item.month.split('-')
            const date = new Date(parseInt(year), parseInt(month) - 1)
            return (
              <g key={`label-${i}`}>
                <text
                  x={x + barWidth / 2 + 2}
                  y={baseY + 15}
                  textAnchor="middle"
                  className="text-xs fill-gray-600"
                >
                  {date.toLocaleDateString(locale === 'cs' ? 'cs-CZ' : 'en-US', { month: 'short' })}
                </text>
                <text
                  x={x + barWidth / 2 + 2}
                  y={baseY + 28}
                  textAnchor="middle"
                  className="text-xs fill-gray-500"
                >
                  {year}
                </text>
              </g>
            )
          }
          return null
        })}
      </svg>
    </div>
  )
}


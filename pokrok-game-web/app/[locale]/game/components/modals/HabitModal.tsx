'use client'

import React from 'react'
import { createPortal } from 'react-dom'
import { useTranslations } from 'next-intl'
import { X, Trash2, Plus } from 'lucide-react'
import { getIconComponent } from '@/lib/icon-utils'

interface HabitModalProps {
  show: boolean
  habitModalData: any
  onClose: () => void
  onSave: () => Promise<void>
  onDelete: () => void
  isSaving: boolean
  areas: any[]
  // Editing state
  editingHabitName: string
  setEditingHabitName: (name: string) => void
  editingHabitDescription: string
  setEditingHabitDescription: (description: string) => void
  editingHabitFrequency: 'daily' | 'weekly' | 'monthly'
  setEditingHabitFrequency: (frequency: 'daily' | 'weekly' | 'monthly') => void
  editingHabitSelectedDays: string[]
  setEditingHabitSelectedDays: (days: string[]) => void
  editingHabitMonthlyType: 'specificDays' | 'weekdayInMonth'
  setEditingHabitMonthlyType: (type: 'specificDays' | 'weekdayInMonth') => void
  editingHabitWeekdayInMonthSelections: Array<{week: string, day: string}>
  setEditingHabitWeekdayInMonthSelections: (selections: Array<{week: string, day: string}>) => void
  editingHabitAutoAdjust31: boolean
  setEditingHabitAutoAdjust31: (adjust: boolean) => void
  editingHabitAlwaysShow: boolean
  setEditingHabitAlwaysShow: (show: boolean) => void
  editingHabitReminderTime: string
  setEditingHabitReminderTime: React.Dispatch<React.SetStateAction<string>>
  editingHabitNotificationEnabled: boolean
  setEditingHabitNotificationEnabled: (enabled: boolean) => void
  editingHabitAreaId: string | null
  setEditingHabitAreaId: (areaId: string | null) => void
  editingHabitMonthWeek: string
  setEditingHabitMonthWeek: (week: string) => void
  editingHabitMonthDay: string
  setEditingHabitMonthDay: (day: string) => void
}

export function HabitModal({
  show,
  habitModalData,
  onClose,
  onSave,
  onDelete,
  isSaving,
  areas,
  editingHabitName,
  setEditingHabitName,
  editingHabitDescription,
  setEditingHabitDescription,
  editingHabitFrequency,
  setEditingHabitFrequency,
  editingHabitSelectedDays,
  setEditingHabitSelectedDays,
  editingHabitMonthlyType,
  setEditingHabitMonthlyType,
  editingHabitWeekdayInMonthSelections,
  setEditingHabitWeekdayInMonthSelections,
  editingHabitAutoAdjust31,
  setEditingHabitAutoAdjust31,
  editingHabitAlwaysShow,
  setEditingHabitAlwaysShow,
  editingHabitReminderTime,
  setEditingHabitReminderTime,
  editingHabitNotificationEnabled,
  setEditingHabitNotificationEnabled,
  editingHabitAreaId,
  setEditingHabitAreaId,
  editingHabitMonthWeek,
  setEditingHabitMonthWeek,
  editingHabitMonthDay,
  setEditingHabitMonthDay,
}: HabitModalProps) {
  const t = useTranslations()

  if (!show || typeof window === 'undefined') return null

  return createPortal(
    <>
      <div 
        className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div 
          className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                {habitModalData?.name || (t('habits.add') || 'Přidat návyk')}
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-1.5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Settings - Two Column Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Name, Description, Area */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    {t('habits.nameLabel') || 'Name'} <span className="text-orange-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editingHabitName}
                    onChange={(e) => setEditingHabitName(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-600 focus:border-orange-600 transition-all bg-white"
                    placeholder={t('habits.namePlaceholder') || 'Habit name'}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    {t('habits.descriptionLabel') || 'Description'}
                  </label>
                  <textarea
                    value={editingHabitDescription}
                    onChange={(e) => setEditingHabitDescription(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-600 focus:border-orange-600 transition-all bg-white resize-none"
                    rows={3}
                    placeholder={t('habits.descriptionPlaceholder') || 'Habit description'}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    {t('details.goal.area') || 'Oblast'}
                  </label>
                  <select
                    value={editingHabitAreaId || ''}
                    onChange={(e) => setEditingHabitAreaId(e.target.value || null)}
                    className="w-full px-4 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-600 focus:border-orange-600 transition-all bg-white"
                  >
                    <option value="">{t('details.goal.noArea') || 'Bez oblasti'}</option>
                    {areas.map((area) => {
                      const IconComponent = getIconComponent(area.icon || 'LayoutDashboard')
                      return (
                        <option key={area.id} value={area.id}>
                          {area.name}
                        </option>
                      )
                    })}
                  </select>
                </div>
              </div>

              {/* Right Column: Time, Frequency */}
              <div className="space-y-4">
                {/* Habit Time and Notification Section */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    {t('habits.habitTime') || 'Čas návyku'}
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="time"
                      value={editingHabitReminderTime || '09:00'}
                      onChange={(e) => setEditingHabitReminderTime(e.target.value)}
                      className="flex-1 px-4 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-600 focus:border-orange-600 transition-all bg-white"
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="habitNotificationEnabled"
                        checked={editingHabitNotificationEnabled}
                        onChange={(e) => {
                          setEditingHabitNotificationEnabled(e.target.checked)
                          // Request notification permission when enabling
                          if (e.target.checked && typeof window !== 'undefined' && 'Notification' in window) {
                            if (Notification.permission === 'default') {
                              Notification.requestPermission()
                            }
                          }
                        }}
                        className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                      />
                      <label htmlFor="habitNotificationEnabled" className="text-sm font-medium text-gray-700 cursor-pointer whitespace-nowrap">
                        {t('habits.notificationEnabled') || 'Upozornění'}
                      </label>
                    </div>
                  </div>
                  {editingHabitNotificationEnabled && (
                    <p className="text-xs text-gray-500 mt-1">
                      {t('habits.notificationHint') || 'Zobrazí se browserové upozornění v zadaný čas'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    {t('habits.frequencyLabel') || 'Frequency'}
                  </label>
                  <select
                    value={editingHabitFrequency}
                    onChange={(e) => setEditingHabitFrequency(e.target.value as 'daily' | 'weekly' | 'monthly')}
                    className="w-full px-4 py-2.5 text-sm border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-600 focus:border-orange-600 transition-all bg-white"
                  >
                    <option value="daily">{t('habits.frequencyDaily') || 'Daily'}</option>
                    <option value="weekly">{t('habits.frequencyWeekly') || 'Weekly'}</option>
                    <option value="monthly">{t('habits.frequencyMonthly') || 'Monthly'}</option>
                  </select>
                </div>

                {(editingHabitFrequency === 'weekly' || editingHabitFrequency === 'monthly') && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      {editingHabitFrequency === 'weekly' 
                        ? (t('habits.selectDaysOfWeek') || 'Vyberte dny v týdnu')
                        : editingHabitFrequency === 'monthly'
                        ? (t('habits.selectDaysOfMonth') || 'Vyberte dny v měsíci')
                        : (t('habits.selectDays') || 'Vyberte dny')}
                    </label>
                    {editingHabitFrequency === 'monthly' ? (
                      <div className="space-y-3">
                        {/* Toggle between specific days and weekday in month */}
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingHabitMonthlyType('specificDays')
                              // Clear weekday selections when switching
                              const dayNumbers = editingHabitSelectedDays?.filter((d: string) => /^\d+$/.test(d)) || []
                              setEditingHabitSelectedDays(dayNumbers)
                              setEditingHabitMonthWeek('')
                              setEditingHabitMonthDay('')
                            }}
                            className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                              editingHabitMonthlyType === 'specificDays'
                                ? 'bg-orange-600 text-white shadow-md'
                                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {t('habits.monthlyType.specificDays')}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingHabitMonthlyType('weekdayInMonth')
                              // Clear specific day numbers when switching
                              const weekDays = editingHabitSelectedDays?.filter((d: string) => /^[a-z]+_[a-z]+$/.test(d)) || []
                              setEditingHabitSelectedDays(weekDays)
                              // Initialize with one empty selection if empty
                              if (editingHabitWeekdayInMonthSelections.length === 0) {
                                setEditingHabitWeekdayInMonthSelections([{ week: '', day: '' }])
                              }
                            }}
                            className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                              editingHabitMonthlyType === 'weekdayInMonth'
                                ? 'bg-orange-600 text-white shadow-md'
                                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {t('habits.monthlyType.weekdayInMonth')}
                          </button>
                        </div>

                        {editingHabitMonthlyType === 'specificDays' ? (
                          /* Day of month selection (1-31) */
                          <div>
                            <label className="block text-sm font-semibold text-gray-800 mb-2">
                              {t('habits.dayOfMonth')}
                            </label>
                            <div className="flex flex-wrap gap-1.5 mb-3">
                              {Array.from({ length: 31 }, (_, i) => i + 1).map(day => {
                                const dayStr = day.toString()
                                const isSelected = editingHabitSelectedDays?.some((d: string) => /^\d+$/.test(d) && d === dayStr)
                                return (
                                  <button
                                    key={day}
                                    type="button"
                                    onClick={() => {
                                      const otherDays = editingHabitSelectedDays?.filter((d: string) => !/^\d+$/.test(d)) || []
                                      const dayNumbers = editingHabitSelectedDays?.filter((d: string) => /^\d+$/.test(d)) || []
                                      if (isSelected) {
                                        setEditingHabitSelectedDays([...otherDays, ...dayNumbers.filter(d => d !== dayStr)])
                                      } else {
                                        setEditingHabitSelectedDays([...otherDays, ...dayNumbers, dayStr])
                                      }
                                    }}
                                    className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-all ${
                                      isSelected
                                        ? 'bg-orange-600 text-white shadow-sm'
                                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                    }`}
                                  >
                                    {day}.
                                  </button>
                                )
                              })}
                            </div>
                            <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editingHabitAutoAdjust31}
                                onChange={(e) => setEditingHabitAutoAdjust31(e.target.checked)}
                                className="w-3.5 h-3.5 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                              />
                              <span>{t('habits.autoAdjust31') || 'Automaticky upravit 31. den na 30. pro měsíce s 30 dny'}</span>
                            </label>
                          </div>
                        ) : (
                          /* Day of week in month selection (e.g., first Monday, last Friday) */
                          <div>
                            <label className="block text-sm font-semibold text-gray-800 mb-2">
                              {t('habits.dayOfWeekInMonth')}
                            </label>
                            <div className="space-y-3">
                              {editingHabitWeekdayInMonthSelections.map((selection, index) => {
                                // Parse selected weeks and days from selection (comma-separated)
                                const selectedWeeks = selection.week ? selection.week.split(',').filter(w => w) : []
                                const selectedDays = selection.day ? selection.day.split(',').filter(d => d) : []
                                
                                return (
                                  <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                    <div className="space-y-3">
                                      {/* Week buttons */}
                                      <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1.5">
                                          {t('habits.week') || 'Week'}:
                                        </label>
                                        <div className="flex flex-wrap gap-1.5">
                                          {['first', 'second', 'third', 'fourth', 'last'].map(week => {
                                            const weekLabels: Record<string, string> = {
                                              first: t('habits.first'),
                                              second: t('habits.second'),
                                              third: t('habits.third'),
                                              fourth: t('habits.fourth'),
                                              last: t('habits.last')
                                            }
                                            const isSelected = selectedWeeks.includes(week)
                                            return (
                                              <button
                                                key={week}
                                                type="button"
                                                onClick={() => {
                                                  const newWeeks = isSelected
                                                    ? selectedWeeks.filter(w => w !== week)
                                                    : [...selectedWeeks, week]
                                                  const newSelections = [...editingHabitWeekdayInMonthSelections]
                                                  newSelections[index] = { 
                                                    week: newWeeks.join(','), 
                                                    day: selectedDays.join(',') 
                                                  }
                                                  setEditingHabitWeekdayInMonthSelections(newSelections)
                                                  // Update selectedDays - create all combinations
                                                  const otherDays = editingHabitSelectedDays?.filter((d: string) => !/^[a-z]+_[a-z]+$/.test(d)) || []
                                                  const dayNumbers = editingHabitSelectedDays?.filter((d: string) => /^\d+$/.test(d)) || []
                                                  const weekDaySelections: string[] = []
                                                  newWeeks.forEach(w => {
                                                    selectedDays.forEach(d => {
                                                      weekDaySelections.push(`${w}_${d}`)
                                                    })
                                                  })
                                                  setEditingHabitSelectedDays([...otherDays, ...dayNumbers, ...weekDaySelections])
                                                }}
                                                className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-all ${
                                                  isSelected
                                                    ? 'bg-orange-600 text-white shadow-sm'
                                                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                                }`}
                                              >
                                                {weekLabels[week]}
                                              </button>
                                            )
                                          })}
                                        </div>
                                      </div>
                                      
                                      {/* Day buttons */}
                                      <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1.5">
                                          {t('habits.day') || 'Day'}:
                                        </label>
                                        <div className="flex flex-wrap gap-1.5">
                                          {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => {
                                            const dayLabels: Record<string, string> = {
                                              monday: t('daysShort.mon'),
                                              tuesday: t('daysShort.tue'),
                                              wednesday: t('daysShort.wed'),
                                              thursday: t('daysShort.thu'),
                                              friday: t('daysShort.fri'),
                                              saturday: t('daysShort.sat'),
                                              sunday: t('daysShort.sun')
                                            }
                                            const isSelected = selectedDays.includes(day)
                                            return (
                                              <button
                                                key={day}
                                                type="button"
                                                onClick={() => {
                                                  const newDays = isSelected
                                                    ? selectedDays.filter(d => d !== day)
                                                    : [...selectedDays, day]
                                                  const newSelections = [...editingHabitWeekdayInMonthSelections]
                                                  newSelections[index] = { 
                                                    week: selectedWeeks.join(','), 
                                                    day: newDays.join(',') 
                                                  }
                                                  setEditingHabitWeekdayInMonthSelections(newSelections)
                                                  // Update selectedDays - create all combinations
                                                  const otherDays = editingHabitSelectedDays?.filter((d: string) => !/^[a-z]+_[a-z]+$/.test(d)) || []
                                                  const dayNumbers = editingHabitSelectedDays?.filter((d: string) => /^\d+$/.test(d)) || []
                                                  const weekDaySelections: string[] = []
                                                  selectedWeeks.forEach(w => {
                                                    newDays.forEach(d => {
                                                      weekDaySelections.push(`${w}_${d}`)
                                                    })
                                                  })
                                                  setEditingHabitSelectedDays([...otherDays, ...dayNumbers, ...weekDaySelections])
                                                }}
                                                className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-all ${
                                                  isSelected
                                                    ? 'bg-orange-600 text-white shadow-sm'
                                                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                                                }`}
                                              >
                                                {dayLabels[day]}
                                              </button>
                                            )
                                          })}
                                        </div>
                                      </div>
                                    </div>
                                    
                                    {/* Delete button */}
                                    <div className="mt-2 flex justify-end">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const newSelections = editingHabitWeekdayInMonthSelections.filter((_, i) => i !== index)
                                          setEditingHabitWeekdayInMonthSelections(newSelections)
                                          // Update selectedDays
                                          const otherDays = editingHabitSelectedDays?.filter((d: string) => !/^[a-z]+_[a-z]+$/.test(d)) || []
                                          const dayNumbers = editingHabitSelectedDays?.filter((d: string) => /^\d+$/.test(d)) || []
                                          const weekDaySelections: string[] = []
                                          newSelections.forEach(s => {
                                            const weeks = s.week ? s.week.split(',') : []
                                            const days = s.day ? s.day.split(',') : []
                                            weeks.forEach(w => {
                                              days.forEach(d => {
                                                weekDaySelections.push(`${w}_${d}`)
                                              })
                                            })
                                          })
                                          setEditingHabitSelectedDays([...otherDays, ...dayNumbers, ...weekDaySelections])
                                        }}
                                        className="px-2 py-1 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                                        title={t('common.delete') || 'Delete'}
                                      >
                                        {t('common.delete') || 'Smazat'}
                                      </button>
                                    </div>
                                  </div>
                                )
                              })}
                              <button
                                type="button"
                                onClick={() => {
                                  const newSelections = editingHabitWeekdayInMonthSelections.length === 0 
                                    ? [{ week: '', day: '' }]
                                    : [...editingHabitWeekdayInMonthSelections, { week: '', day: '' }]
                                  setEditingHabitWeekdayInMonthSelections(newSelections)
                                }}
                                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-orange-600 hover:text-orange-700 font-medium border border-orange-300 rounded-md hover:bg-orange-50 transition-colors w-full justify-center"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                {t('habits.addAnother') || 'Add another'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => {
                          const dayLabels: { [key: string]: string } = {
                            monday: t('daysShort.mon') || 'Po',
                            tuesday: t('daysShort.tue') || 'Út',
                            wednesday: t('daysShort.wed') || 'St',
                            thursday: t('daysShort.thu') || 'Čt',
                            friday: t('daysShort.fri') || 'Pá',
                            saturday: t('daysShort.sat') || 'So',
                            sunday: t('daysShort.sun') || 'Ne'
                          }
                          return (
                            <button
                              key={day}
                              type="button"
                              onClick={() => {
                                if (editingHabitSelectedDays?.includes(day)) {
                                  setEditingHabitSelectedDays(editingHabitSelectedDays.filter((d: string) => d !== day))
                                } else {
                                  setEditingHabitSelectedDays([...(editingHabitSelectedDays || []), day])
                                }
                              }}
                              className={`px-3 py-2 text-sm rounded-lg border transition-all duration-200 ${
                                editingHabitSelectedDays?.includes(day)
                                  ? 'bg-orange-600 text-white border-orange-600 shadow-md'
                                  : 'bg-white text-gray-700 border-gray-300 hover:border-orange-600 hover:bg-orange-50'
                              }`}
                            >
                              {dayLabels[day]}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingHabitAlwaysShow}
                    onChange={(e) => setEditingHabitAlwaysShow(e.target.checked)}
                    className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                  />
                  <label className="text-sm text-gray-700">
                    Vždy zobrazovat (i když není naplánováno)
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-gray-200 flex items-center justify-between">
            {/* Delete button - only show for existing habits */}
            {habitModalData?.id && (
              <button
                onClick={onDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                {t('common.delete') || 'Smazat'}
              </button>
            )}
            {!habitModalData?.id && <div></div>}
            
            {/* Action buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={onSave}
                disabled={isSaving}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  isSaving
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-orange-600 text-white hover:bg-orange-700'
                }`}
              >
                {isSaving ? (
                  <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {t('common.saving')}
                  </>
                ) : t('common.save')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body
  )
}


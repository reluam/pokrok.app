'use client'

import React from 'react'
import { createPortal } from 'react-dom'
import { useTranslations } from 'next-intl'
import { X, Trash2, Plus, Loader2 } from 'lucide-react'
import { getIconComponent, AVAILABLE_ICONS } from '@/lib/icon-utils'
import { PlayfulButton } from '@/components/design-system/Button/PlayfulButton'

interface HabitModalProps {
  show: boolean
  habitModalData: any
  onClose: () => void
  onSave: () => Promise<void>
  onDelete?: () => void
  isSaving: boolean
  areas: any[]
  asPageComponent?: boolean // If true, render as page component instead of modal
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
  editingHabitIcon: string
  setEditingHabitIcon: (icon: string) => void
}

export function HabitModal({
  show,
  habitModalData,
  onClose,
  onSave,
  onDelete,
  isSaving,
  areas,
  asPageComponent = false,
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
  editingHabitIcon,
  setEditingHabitIcon,
}: HabitModalProps) {
  const t = useTranslations()
  const [showIconPicker, setShowIconPicker] = React.useState(false)

  if (!show || typeof window === 'undefined') return null

  const content = (
    <div 
      className={`box-playful-highlight bg-background w-full ${asPageComponent ? 'pb-6' : 'max-w-4xl max-h-[90vh] overflow-y-auto'}`}
      onClick={(e) => e.stopPropagation()}
    >
      {!asPageComponent && (
        <div className="p-4 border-b-2 border-primary-500">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-black font-playful">
              {habitModalData?.id ? (habitModalData?.name || t('habits.edit')) : (t('habits.add') || 'Přidat návyk')}
            </h2>
            <button
              onClick={onClose}
              className="btn-playful-base p-2"
            >
              <X className="w-5 h-5 text-black" />
            </button>
          </div>
        </div>
      )}

      {asPageComponent && (
        <div className="p-4 border-b-2 border-primary-500">
          <h2 className="text-lg font-semibold text-black font-playful">{t('habits.settings') || 'Nastavení'}</h2>
        </div>
      )}

      <div className={`${asPageComponent ? 'p-4' : 'p-4'} bg-background`}>
        {/* Settings - Two Column Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column: Name, Description, Area */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-black mb-1.5 font-playful">
                {t('habits.nameLabel') || 'Name'} <span className="text-primary-600">*</span>
              </label>
              <input
                type="text"
                value={editingHabitName}
                onChange={(e) => setEditingHabitName(e.target.value)}
                className="w-full px-2 py-1.5 text-sm border-2 border-primary-500 rounded-playful-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                placeholder={t('habits.namePlaceholder') || 'Habit name'}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-black mb-1.5 font-playful">
                {t('habits.descriptionLabel') || 'Description'}
              </label>
              <textarea
                value={editingHabitDescription}
                onChange={(e) => setEditingHabitDescription(e.target.value)}
                className="w-full px-2 py-1.5 text-sm border-2 border-primary-500 rounded-playful-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white resize-none"
                rows={3}
                placeholder={t('habits.descriptionPlaceholder') || 'Habit description'}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-black mb-1.5 font-playful">
                {t('habits.iconLabel') || 'Ikona'} <span className="text-primary-600">*</span>
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowIconPicker(!showIconPicker)}
                  className="w-full px-2 py-1.5 text-sm border-2 border-primary-500 rounded-playful-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    {(() => {
                      const IconComponent = getIconComponent(editingHabitIcon)
                      return <IconComponent className="w-4 h-4 text-primary-600" />
                    })()}
                    <span>{editingHabitIcon || t('habits.selectIcon') || 'Vyberte ikonu'}</span>
                  </div>
                  <span className="text-gray-400">{showIconPicker ? '▲' : '▼'}</span>
                </button>
                {showIconPicker && (
                  <div className="absolute z-10 mt-1 p-3 border-2 border-primary-500 rounded-playful-sm bg-white max-h-64 overflow-y-auto shadow-lg">
                    <div className="grid grid-cols-6 gap-2">
                      {AVAILABLE_ICONS.map((icon) => {
                        const IconComp = getIconComponent(icon.name)
                        return (
                          <button
                            key={icon.name}
                            type="button"
                            onClick={() => {
                              setEditingHabitIcon(icon.name)
                              setShowIconPicker(false)
                            }}
                            className={`p-2 rounded-playful-sm hover:bg-primary-50 transition-colors border-2 ${
                              editingHabitIcon === icon.name 
                                ? 'bg-primary-100 border-primary-500' 
                                : 'border-transparent hover:border-primary-500'
                            }`}
                            title={icon.label}
                          >
                            <IconComp className={`w-5 h-5 mx-auto ${editingHabitIcon === icon.name ? 'text-primary-600' : 'text-black'}`} />
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-black mb-1.5 font-playful">
                {t('details.goal.area') || 'Oblast'}
              </label>
              <select
                value={editingHabitAreaId || ''}
                onChange={(e) => setEditingHabitAreaId(e.target.value || null)}
                className="w-full px-2 py-1.5 text-sm border-2 border-primary-500 rounded-playful-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
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
              <label className="block text-xs font-semibold text-black mb-1.5 font-playful">
                {t('habits.habitTime') || 'Čas návyku'}
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="time"
                  value={editingHabitReminderTime || '09:00'}
                  onChange={(e) => setEditingHabitReminderTime(e.target.value)}
                  className="flex-1 px-2 py-1.5 text-sm border-2 border-primary-500 rounded-playful-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
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
                    className="w-4 h-4 text-primary-600 border-primary-500 rounded-playful-sm focus:ring-primary-500"
                  />
                  <label htmlFor="habitNotificationEnabled" className="text-xs font-semibold text-black cursor-pointer whitespace-nowrap font-playful">
                    {t('habits.notificationEnabled') || 'Upozornění'}
                  </label>
                </div>
              </div>
              {editingHabitNotificationEnabled && (
                <p className="text-xs text-gray-600 mt-1">
                  {t('habits.notificationHint') || 'Zobrazí se browserové upozornění v zadaný čas'}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-black mb-1.5 font-playful">
                {t('habits.frequencyLabel') || 'Frequency'}
              </label>
              <select
                value={editingHabitFrequency}
                onChange={(e) => setEditingHabitFrequency(e.target.value as 'daily' | 'weekly' | 'monthly')}
                className="w-full px-2 py-1.5 text-sm border-2 border-primary-500 rounded-playful-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
              >
                <option value="daily">{t('habits.frequency.daily') || 'Daily'}</option>
                <option value="weekly">{t('habits.frequency.weekly') || 'Weekly'}</option>
                <option value="monthly">{t('habits.frequency.monthly') || 'Monthly'}</option>
              </select>
            </div>

                {(editingHabitFrequency === 'weekly' || editingHabitFrequency === 'monthly') && (
                  <div>
                    <label className="block text-xs font-semibold text-black mb-1.5 font-playful">
                      {editingHabitFrequency === 'weekly' 
                        ? (t('habits.selectDaysOfWeek') || 'Vyberte dny v týdnu')
                        : editingHabitFrequency === 'monthly'
                        ? (t('habits.selectDaysOfMonth') || 'Vyberte dny v měsíci')
                        : (t('habits.selectDays') || 'Vyberte dny')}
                    </label>
                    {editingHabitFrequency === 'monthly' ? (
                      <div className="space-y-3">
                        {/* Toggle between specific days and weekday in month */}
                        <div className="flex items-center gap-2">
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
                            className={`flex-1 px-2 py-1 text-xs rounded-playful-sm border-2 transition-all font-playful ${
                              editingHabitMonthlyType === 'specificDays'
                                ? 'bg-primary-500 text-black border-primary-500 box-playful-highlight'
                                : 'bg-white text-black border-primary-500 hover:bg-primary-50'
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
                            className={`flex-1 px-2 py-1 text-xs rounded-playful-sm border-2 transition-all font-playful ${
                              editingHabitMonthlyType === 'weekdayInMonth'
                                ? 'bg-primary-500 text-black border-primary-500 box-playful-highlight'
                                : 'bg-white text-black border-primary-500 hover:bg-primary-50'
                            }`}
                          >
                            {t('habits.monthlyType.weekdayInMonth')}
                          </button>
                        </div>

                        {editingHabitMonthlyType === 'specificDays' ? (
                          /* Day of month selection (1-31) */
                          <div>
                            <label className="block text-xs font-semibold text-black mb-1.5 font-playful">
                              {t('habits.dayOfMonth')}
                            </label>
                            <div className="flex flex-wrap gap-1.5 mb-2">
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
                                    className={`px-2 py-1 text-xs rounded-playful-sm border-2 transition-all ${
                                      isSelected
                                        ? 'bg-primary-500 text-black border-primary-500 box-playful-highlight'
                                        : 'bg-white text-black border-primary-500 hover:bg-primary-50'
                                    }`}
                                  >
                                    {day}.
                                  </button>
                                )
                              })}
                            </div>
                            <label className="flex items-center gap-2 text-xs text-black cursor-pointer font-playful">
                              <input
                                type="checkbox"
                                checked={editingHabitAutoAdjust31}
                                onChange={(e) => setEditingHabitAutoAdjust31(e.target.checked)}
                                className="w-4 h-4 text-primary-600 border-primary-500 rounded-playful-sm focus:ring-primary-500"
                              />
                              <span>{t('habits.autoAdjust31') || 'Automaticky upravit 31. den na 30. pro měsíce s 30 dny'}</span>
                            </label>
                          </div>
                        ) : (
                          /* Day of week in month selection (e.g., first Monday, last Friday) */
                          <div>
                            <label className="block text-xs font-semibold text-black mb-1.5 font-playful">
                              {t('habits.dayOfWeekInMonth')}
                            </label>
                            <div className="space-y-3">
                              {editingHabitWeekdayInMonthSelections.map((selection, index) => {
                                // Parse selected weeks and days from selection (comma-separated)
                                const selectedWeeks = selection.week ? selection.week.split(',').filter(w => w) : []
                                const selectedDays = selection.day ? selection.day.split(',').filter(d => d) : []
                                
                                return (
                                  <div key={index} className="p-2 bg-white border-2 border-primary-500 rounded-playful-sm">
                                    <div className="space-y-2">
                                      {/* Week buttons */}
                                      <div>
                                        <label className="block text-xs font-semibold text-black mb-1 font-playful">
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
                                                className={`px-2 py-1 text-xs rounded-playful-sm border-2 transition-all ${
                                                  isSelected
                                                    ? 'bg-primary-500 text-black border-primary-500 box-playful-highlight'
                                                    : 'bg-white text-black border-primary-500 hover:bg-primary-50'
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
                                        <label className="block text-xs font-semibold text-black mb-1 font-playful">
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
                                                className={`px-2 py-1 text-xs rounded-playful-sm border-2 transition-all ${
                                                  isSelected
                                                    ? 'bg-primary-500 text-black border-primary-500 box-playful-highlight'
                                                    : 'bg-white text-black border-primary-500 hover:bg-primary-50'
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
                                    {editingHabitWeekdayInMonthSelections.length > 1 && (
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
                                          className="px-2 py-1 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 rounded-playful-sm transition-colors"
                                          title={t('common.delete') || 'Delete'}
                                        >
                                          {t('common.delete') || 'Smazat'}
                                        </button>
                                      </div>
                                    )}
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
                                className="w-full px-2 py-1 text-xs text-primary-600 hover:text-primary-700 hover:bg-primary-50 border-2 border-primary-500 rounded-playful-sm transition-colors font-playful flex items-center justify-center gap-1.5"
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
                          const isSelected = editingHabitSelectedDays?.includes(day)
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
                              className={`px-2 py-1 text-xs rounded-playful-sm border-2 transition-all ${
                                isSelected
                                  ? 'bg-primary-500 text-black border-primary-500 box-playful-highlight'
                                  : 'bg-white text-black border-primary-500 hover:bg-primary-50'
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
                    className="w-4 h-4 text-primary-600 border-primary-500 rounded-playful-sm focus:ring-primary-500"
                  />
                  <label className="text-xs font-semibold text-black cursor-pointer font-playful">
                    Vždy zobrazovat (i když není naplánováno)
                  </label>
                </div>
              </div>
            </div>
          </div>

      <div className={`${asPageComponent ? 'p-4' : 'p-4'} border-t-2 border-primary-500 bg-background flex items-center justify-between`}>
        {/* Delete button - only show for existing habits */}
        {habitModalData?.id && onDelete && (
          <button
            onClick={onDelete}
            className="btn-playful-danger flex items-center gap-2 px-4 py-2 text-sm font-semibold"
          >
            <Trash2 className="w-4 h-4" />
            {t('common.delete') || 'Smazat'}
          </button>
        )}
        {!habitModalData?.id && <div></div>}
        
        {/* Action buttons */}
        <div className="flex items-center gap-3">
          {!asPageComponent && (
            <button
              onClick={onClose}
              className="btn-playful-base px-4 py-2 text-sm font-semibold text-primary-600 bg-white"
            >
              {t('common.cancel')}
            </button>
          )}
          <PlayfulButton
            onClick={onSave}
            disabled={isSaving}
            loading={isSaving}
            loadingText={t('common.saving')}
            variant="primary"
            className="px-4 py-2 text-sm font-semibold"
          >
            {t('common.save')}
          </PlayfulButton>
        </div>
      </div>
    </div>
  )

  if (asPageComponent) {
    return content
  }

  return createPortal(
    <>
      <div 
        className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {content}
      </div>
    </>,
    document.body
  )
}


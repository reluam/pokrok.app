'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'

interface ViewTypeSettingsProps {
  viewType: 'upcoming' | 'month' | 'year' | 'areas'
  userId: string
}

interface ViewSection {
  key: string
  labelKey: string
  defaultVisible: boolean
}

const VIEW_SECTIONS: Record<string, ViewSection[]> = {
  upcoming: [
    { key: 'habits', labelKey: '', defaultVisible: true },
    { key: 'upcomingSteps', labelKey: '', defaultVisible: true },
    { key: 'overdueSteps', labelKey: '', defaultVisible: true }
  ],
  month: [
    { key: 'calendar', labelKey: '', defaultVisible: true },
    { key: 'statistics', labelKey: '', defaultVisible: true },
    { key: 'habits', labelKey: '', defaultVisible: true },
    { key: 'futureSteps', labelKey: '', defaultVisible: true },
    { key: 'overdueSteps', labelKey: '', defaultVisible: true }
  ],
  year: [
    { key: 'calendar', labelKey: '', defaultVisible: true },
    { key: 'goals', labelKey: '', defaultVisible: true },
    { key: 'insights', labelKey: '', defaultVisible: true }
  ],
  areas: [
    { key: 'statistics', labelKey: '', defaultVisible: true },
    { key: 'goals', labelKey: '', defaultVisible: true },
    { key: 'steps', labelKey: '', defaultVisible: true },
    { key: 'habits', labelKey: '', defaultVisible: true },
    { key: 'todayFocus', labelKey: '', defaultVisible: true },
    { key: 'futureSteps', labelKey: '', defaultVisible: true },
    { key: 'overdueSteps', labelKey: '', defaultVisible: true }
  ]
}

export function ViewTypeSettings({ viewType, userId }: ViewTypeSettingsProps) {
  const t = useTranslations()
  const [visibleSections, setVisibleSections] = useState<Record<string, boolean>>({})
  const [settings, setSettings] = useState<Record<string, any>>({}) // For numeric settings like maxUpcomingSteps
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const sections = VIEW_SECTIONS[viewType] || []

  useEffect(() => {
    loadSettings()
  }, [viewType, userId])

  const loadSettings = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/view-settings?view_type=${viewType}`)
      if (response.ok) {
        const data = await response.json()
        // API returns the settings object directly, with visible_sections property
        if (data && data.visible_sections) {
          setVisibleSections(data.visible_sections)
        } else {
          // Use defaults if no settings found
          const defaults: Record<string, boolean> = {}
          sections.forEach(section => {
            defaults[section.key] = section.defaultVisible
          })
          setVisibleSections(defaults)
        }
        // Load other settings (like maxUpcomingSteps)
        if (data && data.settings) {
          setSettings(data.settings)
        } else {
          // Defaults for upcoming view
          if (viewType === 'upcoming') {
            setSettings({ maxUpcomingSteps: 5 })
          } else {
            setSettings({})
          }
        }
      } else {
        // Use defaults
        const defaults: Record<string, boolean> = {}
        sections.forEach(section => {
          defaults[section.key] = section.defaultVisible
        })
        setVisibleSections(defaults)
        if (viewType === 'upcoming') {
          setSettings({ maxUpcomingSteps: 5 })
        } else {
          setSettings({})
        }
      }
    } catch (error) {
      console.error('Error loading view settings:', error)
      // Use defaults on error
      const defaults: Record<string, boolean> = {}
      sections.forEach(section => {
        defaults[section.key] = section.defaultVisible
      })
      setVisibleSections(defaults)
      if (viewType === 'upcoming') {
        setSettings({ maxUpcomingSteps: 5 })
      } else {
        setSettings({})
      }
    } finally {
      setLoading(false)
    }
  }

  const toggleSection = async (sectionKey: string) => {
    const newValue = !visibleSections[sectionKey]
    const updated = { ...visibleSections, [sectionKey]: newValue }
    setVisibleSections(updated)

    try {
      setSaving(true)
      const response = await fetch('/api/view-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          view_type: viewType,
          visible_sections: updated,
          settings: settings
        })
      })

      if (!response.ok) {
        // Revert on error
        setVisibleSections(visibleSections)
        console.error('Error saving view settings')
      }
    } catch (error) {
      console.error('Error saving view settings:', error)
      // Revert on error
      setVisibleSections(visibleSections)
    } finally {
      setSaving(false)
    }
  }
  
  const updateSetting = async (settingKey: string, value: any) => {
    const updated = { ...settings, [settingKey]: value }
    setSettings(updated)

    try {
      setSaving(true)
      const response = await fetch('/api/view-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          view_type: viewType,
          visible_sections: visibleSections,
          settings: updated
        })
      })

      if (!response.ok) {
        // Revert on error
        setSettings(settings)
        console.error('Error saving view settings')
      }
    } catch (error) {
      console.error('Error saving view settings:', error)
      // Revert on error
      setSettings(settings)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-4">
        <p className="text-sm text-gray-600 font-playful">{t('common.loading')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-bold text-black font-playful mb-3">
        {t('views.viewSettings.title')}
      </h4>
      <p className="text-xs text-gray-600 font-playful mb-4">
        {t('views.viewSettings.description')}
      </p>
      
      <div className="space-y-2">
        {sections.map(section => {
          const isVisible = visibleSections[section.key] ?? section.defaultVisible
          
          return (
            <div
              key={section.key}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-playful-sm border border-gray-200"
            >
              <span className="text-sm font-playful text-gray-700">
                {t(`views.viewSettings.sections.${section.key}`) || section.key}
              </span>
              
              <button
                onClick={() => toggleSection(section.key)}
                disabled={saving}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${
                  isVisible ? 'bg-primary-500' : 'bg-gray-300'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                title={isVisible ? t('views.viewSettings.hide') : t('views.viewSettings.show')}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isVisible ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          )
        })}
        
        {/* Max upcoming steps setting for upcoming view */}
        {viewType === 'upcoming' && (
          <div className="p-3 bg-gray-50 rounded-playful-sm border border-gray-200">
            <label className="block text-sm font-playful text-gray-700 mb-2">
              {t('views.maxSteps') || 'Maximální počet nadcházejících kroků'}
            </label>
            <input
              type="number"
              min="1"
              max="20"
              value={settings.maxUpcomingSteps || 5}
              onChange={(e) => updateSetting('maxUpcomingSteps', parseInt(e.target.value) || 5)}
              disabled={saving}
              className="w-full px-3 py-2 text-sm border-2 border-primary-500 rounded-playful-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-black disabled:opacity-50"
            />
          </div>
        )}
      </div>
    </div>
  )
}


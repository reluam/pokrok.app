'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useUser } from '@clerk/nextjs'
import { CheckCircle, Circle, Settings } from 'lucide-react'
import { ViewTypeSettings } from '../views/settings/ViewTypeSettings'

type ViewType = 'upcoming' | 'month' | 'year' | 'areas'

interface ViewConfiguration {
  id: string
  user_id: string
  view_type: string
  visible_sections: Record<string, boolean>
  visible_in_navigation: boolean
  order_index: number | null
  created_at: string
  updated_at: string
}

interface AvailableView {
  key: string
  nameKey: string
  descriptionKey: string
  requiresPremium: boolean
  icon: string
}

export function ViewsSettingsView() {
  const t = useTranslations()
  const { user } = useUser()
  const [loading, setLoading] = useState(true)
  const [configurations, setConfigurations] = useState<ViewConfiguration[]>([])
  const [availableViews, setAvailableViews] = useState<Record<string, AvailableView>>({})
  const [isUpdating, setIsUpdating] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState<string | null>(null)

  const isPremium = user?.publicMetadata?.plan === 'premium'

  useEffect(() => {
    if (user?.id) {
      loadData()
    }
  }, [user?.id])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Load available views
      const viewsResponse = await fetch('/api/view-configurations/available')
      if (viewsResponse.ok) {
        const views = await viewsResponse.json()
        const viewsMap: Record<string, AvailableView> = {}
        views.forEach((view: AvailableView) => {
          viewsMap[view.key] = view
        })
        setAvailableViews(viewsMap)
      }

      // Load view settings for each view type
      const viewTypes: ViewType[] = ['upcoming', 'month', 'year', 'areas']
      const configs: ViewConfiguration[] = []
      
      for (const viewType of viewTypes) {
        const configResponse = await fetch(`/api/view-settings?view_type=${viewType}`)
        if (configResponse.ok) {
          const config = await configResponse.json()
          if (config) {
            configs.push({
              id: `${viewType}_settings`,
              user_id: user?.id || '',
              view_type: viewType,
              visible_sections: config.visible_sections || {},
              visible_in_navigation: config.visible_sections?._visible_in_navigation ?? true,
              order_index: config.order_index || null,
              created_at: config.created_at || new Date().toISOString(),
              updated_at: config.updated_at || new Date().toISOString()
            })
          }
        }
      }
      
      setConfigurations(configs)
    } catch (error) {
      console.error('Error loading views data:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleNavigationVisibility = async (viewType: string, currentVisible: boolean) => {
    setIsUpdating(viewType)

    try {
      const config = configurations.find(c => c.view_type === viewType)
      const updatedSections = {
        ...(config?.visible_sections || {}),
        _visible_in_navigation: !currentVisible
      }

      const response = await fetch('/api/view-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          view_type: viewType,
          visible_sections: updatedSections
        })
      })

      if (response.ok) {
        loadData()
      } else {
        console.error('Error toggling navigation visibility')
      }
    } catch (error) {
      console.error('Error toggling navigation visibility:', error)
    } finally {
      setIsUpdating(null)
    }
  }

  const getViewConfig = (viewKey: string): ViewConfiguration | undefined => {
    return configurations.find(c => c.view_type === viewKey)
  }

  if (loading) {
    return (
      <div className="p-8 text-center">
        <p className="font-playful">{t('common.loading')}</p>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold font-playful mb-2">
          {t('views.title')}
        </h2>
        <p className="text-gray-600 font-playful">
          {t('views.description')}
        </p>
      </div>

      <div className="space-y-4">
        {Object.values(availableViews).map(view => {
          const config = getViewConfig(view.key)
          const isVisibleInNav = config?.visible_in_navigation ?? true
          const isUpdatingThis = isUpdating === view.key
          const showThisSettings = showSettings === view.key

          return (
            <div key={view.key} className="bg-white border-2 border-primary-500 rounded-playful-md p-4">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-lg font-playful">
                      {t(view.nameKey)}
                    </h3>
                    {view.requiresPremium && (
                      <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded font-playful">
                        Premium
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 font-playful">
                    {t(view.descriptionKey)}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  {isVisibleInNav ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-sm font-bold text-black font-playful">
                        {t('views.showInNavigation')}
                      </span>
                    </>
                  ) : (
                    <>
                      <Circle className="w-5 h-5 text-gray-400" />
                      <span className="text-sm font-bold text-gray-600 font-playful">
                        {t('views.hide')}
                      </span>
                    </>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setShowSettings(showThisSettings ? null : view.key)}
                    className="btn-playful-secondary px-3 py-1 text-sm"
                  >
                    <Settings className="w-4 h-4 inline mr-1" />
                    {t('views.configure')}
                  </button>
                  <button
                    onClick={() => toggleNavigationVisibility(view.key, isVisibleInNav)}
                    disabled={isUpdatingThis}
                    className="btn-playful-primary px-3 py-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUpdatingThis ? (
                      t('common.loading')
                    ) : isVisibleInNav ? (
                      t('views.hide')
                    ) : (
                      t('views.show')
                    )}
                  </button>
                </div>
              </div>

              {/* Settings Panel */}
              {showThisSettings && (
                <div className="mt-4 pt-4 border-t-2 border-primary-200">
                  <ViewTypeSettings viewType={view.key as ViewType} userId={user?.id || ''} />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useUser } from '@clerk/nextjs'
import { Protect } from '@clerk/nextjs'
import { CheckCircle, Circle, Settings, CheckSquare } from 'lucide-react'
import { OnlyTheImportantSettings } from '../views/settings/OnlyTheImportantSettings'

type ViewType = 'day' | 'week' | 'month' | 'year'

interface ViewConfiguration {
  id: string
  user_id: string
  workflow_key: string
  enabled: boolean
  settings: {
    enabledViewTypes?: ViewType[]
    workflowSettings?: any
  } | null
  order_index: number
  created_at: string
  updated_at: string
}

interface AvailableWorkflow {
  key: string
  nameKey: string
  descriptionKey: string
  supportedViewTypes: ViewType[]
  defaultViewTypes: ViewType[]
  requiresPremium: boolean
}

export function ViewsSettingsView() {
  const t = useTranslations()
  const { user } = useUser()
  const [loading, setLoading] = useState(true)
  const [configurations, setConfigurations] = useState<ViewConfiguration[]>([])
  const [availableWorkflows, setAvailableWorkflows] = useState<Record<string, AvailableWorkflow>>({})
  const [isUpdating, setIsUpdating] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState<string | null>(null)

  const isPremium = user?.publicMetadata?.plan === 'premium'

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Load available workflows
      const workflowsResponse = await fetch('/api/view-configurations/available')
      if (workflowsResponse.ok) {
        const workflows = await workflowsResponse.json()
        const workflowsMap: Record<string, AvailableWorkflow> = {}
        workflows.forEach((workflow: AvailableWorkflow) => {
          workflowsMap[workflow.key] = workflow
        })
        setAvailableWorkflows(workflowsMap)
      }

      // Load ALL configurations (not just enabled ones) for settings page
      const configResponse = await fetch('/api/view-configurations')
      if (configResponse.ok) {
        const configs = await configResponse.json()
        setConfigurations(configs)
      }
    } catch (error) {
      console.error('Error loading workflows data:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleWorkflow = async (workflowKey: string, currentEnabled: boolean) => {
    const config = configurations.find(c => c.workflow_key === workflowKey)
    const workflow = availableWorkflows[workflowKey]

    setIsUpdating(workflowKey)

    try {
      if (config) {
        // Update existing configuration
        const response = await fetch(`/api/view-configurations/${config.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ enabled: !currentEnabled })
        })

        if (response.ok) {
          loadData()
        } else {
          console.error('Error toggling workflow')
        }
      } else {
        // Create new configuration with default settings
        const defaultSettings = {
          enabledViewTypes: workflow?.defaultViewTypes || ['day'],
          workflowSettings: workflow?.key === 'only_the_important' ? { important_steps_count: 3 } : null
        }

        const response = await fetch('/api/view-configurations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workflow_key: workflowKey,
            enabled: true,
            settings: defaultSettings
          })
        })

        if (response.ok) {
          loadData()
        } else {
          console.error('Error creating workflow configuration')
        }
      }
    } catch (error) {
      console.error('Error toggling workflow:', error)
    } finally {
      setIsUpdating(null)
    }
  }

  const handleSaveSettings = async (configId: string, newSettings: any) => {
    setIsUpdating(configId)
    try {
      const config = configurations.find(c => c.id === configId)
      if (!config) return

      const updatedSettings = {
        ...config.settings,
        ...newSettings
      }

      const response = await fetch(`/api/view-configurations/${configId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: updatedSettings })
      })

      if (response.ok) {
        setShowSettings(null)
        loadData()
      } else {
        console.error('Error saving settings')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
    } finally {
      setIsUpdating(null)
    }
  }

  const handleToggleViewType = async (configId: string, viewType: ViewType) => {
    const config = configurations.find(c => c.id === configId)
    if (!config) return

    const currentViewTypes = config.settings?.enabledViewTypes || []
    const newViewTypes = currentViewTypes.includes(viewType)
      ? currentViewTypes.filter(vt => vt !== viewType)
      : [...currentViewTypes, viewType]

    await handleSaveSettings(configId, { enabledViewTypes: newViewTypes })
  }

  const getWorkflowConfig = (workflowKey: string): ViewConfiguration | undefined => {
    return configurations.find(c => c.workflow_key === workflowKey)
  }

  const viewTypeLabels: Record<ViewType, string> = {
    day: t('views.day'),
    week: t('views.week'),
    month: t('views.month'),
    year: t('views.year')
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
        {Object.values(availableWorkflows).map(workflow => {
          const config = getWorkflowConfig(workflow.key)
          const isEnabled = config?.enabled || false
          const enabledViewTypes = config?.settings?.enabledViewTypes || workflow.defaultViewTypes
          const isUpdatingThis = isUpdating === workflow.key || isUpdating === config?.id
          const showThisSettings = showSettings === config?.id

          const workflowContent = (
            <div key={workflow.key} className="bg-white border-2 border-primary-500 rounded-playful-md p-4">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-lg font-playful">
                      {t(workflow.nameKey)}
                    </h3>
                    {workflow.requiresPremium && (
                      <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded font-playful">
                        Premium
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 font-playful">
                    {t(workflow.descriptionKey)}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  {isEnabled ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-sm font-bold text-black font-playful">
                        {t('workflows.active')}
                      </span>
                    </>
                  ) : (
                    <>
                      <Circle className="w-5 h-5 text-gray-400" />
                      <span className="text-sm font-bold text-gray-600 font-playful">
                        {t('workflows.inactive')}
                      </span>
                    </>
                  )}
                </div>

                <div className="flex gap-2">
                  {isEnabled && config && (
                    <button
                      onClick={() => setShowSettings(showThisSettings ? null : config.id)}
                      className="btn-playful-secondary px-3 py-1 text-sm"
                    >
                      <Settings className="w-4 h-4 inline mr-1" />
                      {t('views.configure')}
                    </button>
                  )}
                  <button
                    onClick={() => toggleWorkflow(workflow.key, isEnabled)}
                    disabled={isUpdatingThis || (workflow.requiresPremium && !isPremium)}
                    className="btn-playful-primary px-3 py-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUpdatingThis ? (
                      t('common.loading')
                    ) : isEnabled ? (
                      t('views.deactivate')
                    ) : (
                      t('views.activate')
                    )}
                  </button>
                </div>
              </div>

              {/* Settings Panel */}
              {showThisSettings && config && isEnabled && (
                <div className="mt-4 pt-4 border-t-2 border-primary-200 space-y-4">
                  {/* View Types Selection */}
                  <div>
                    <label className="block text-sm font-bold text-black font-playful mb-2">
                      {t('views.enabledViewTypes')}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {workflow.supportedViewTypes.map(viewType => (
                        <button
                          key={viewType}
                          onClick={() => handleToggleViewType(config.id, viewType)}
                          disabled={isUpdating === config.id}
                          className={`flex items-center gap-2 px-3 py-2 rounded-playful-md border-2 font-playful text-sm transition-all ${
                            enabledViewTypes.includes(viewType)
                              ? 'border-primary-500 bg-primary-50 text-primary-700'
                              : 'border-gray-300 bg-white text-gray-600 hover:border-primary-300'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          <CheckSquare className={`w-4 h-4 ${enabledViewTypes.includes(viewType) ? 'text-primary-600' : 'text-gray-400'}`} />
                          {viewTypeLabels[viewType]}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-gray-600 mt-2 font-playful">
                      {t('views.enabledViewTypesDescription')}
                    </p>
                  </div>

                  {/* Workflow-specific Settings */}
                  {workflow.key === 'only_the_important' && (
                    <div>
                      <h4 className="text-sm font-bold text-black font-playful mb-2">
                        {t('workflows.onlyTheImportant.settings.title')}
                      </h4>
                      <OnlyTheImportantSettings
                        importantStepsCount={config.settings?.workflowSettings?.important_steps_count || 3}
                        onSave={(workflowSettings) => handleSaveSettings(config.id, { workflowSettings })}
                        onCancel={() => setShowSettings(null)}
                        isSaving={isUpdating === config.id}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )

          // Wrap in Protect if requires premium
          if (workflow.requiresPremium) {
            return (
              <Protect key={workflow.key} plan="premium" fallback={
                <div className="bg-gray-100 border-2 border-gray-300 rounded-playful-md p-4 opacity-60">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-lg font-playful">
                          {t(workflow.nameKey)}
                        </h3>
                        <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded font-playful">
                          Premium
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 font-playful">
                        {t(workflow.descriptionKey)}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 font-playful mt-2">
                    {t('settings.subscription.upgradePrompt')}
                  </p>
                </div>
              }>
                {workflowContent}
              </Protect>
            )
          }

          return workflowContent
        })}
      </div>
    </div>
  )
}

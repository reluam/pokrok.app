'use client'

import { useState, useEffect } from 'react'
import { useUser, useClerk } from '@clerk/nextjs'
import { useTranslations, useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { locales, type Locale } from '@/i18n/config'
import { User, Target, Footprints, BarChart3, Workflow, Eye, UserCircle, Menu } from 'lucide-react'

interface SettingsViewProps {
  player: any
  onPlayerUpdate: (player: any) => void
  onBack?: () => void
}

type SettingsTab = 'user' | 'goals' | 'steps' | 'statistics' | 'workflows' | 'display' | 'danger'

export function SettingsView({ player, onPlayerUpdate, onBack }: SettingsViewProps) {
  const { user } = useUser()
  const { signOut } = useClerk()
  const t = useTranslations()
  const locale = useLocale()
  const router = useRouter()
  
  // Mobile menu state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  // Load active tab from localStorage on mount
  const [activeTab, setActiveTab] = useState<SettingsTab>(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedTab = localStorage.getItem('settingsView_activeTab')
        if (savedTab && ['user', 'goals', 'steps', 'statistics', 'workflows', 'display', 'danger'].includes(savedTab)) {
          return savedTab as SettingsTab
        }
      } catch (error) {
        console.error('Error loading active tab:', error)
      }
    }
    return 'user'
  })

  // Save active tab to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('settingsView_activeTab', activeTab)
    } catch (error) {
      console.error('Error saving settings state:', error)
    }
  }, [activeTab])
  const [preferredLocale, setPreferredLocale] = useState<Locale | null>(null)
  const [isSavingLocale, setIsSavingLocale] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [playerName, setPlayerName] = useState(player?.name || '')
  const [hairColor, setHairColor] = useState(player?.appearance?.hairColor || '#8B4513')
  const [skinColor, setSkinColor] = useState(player?.appearance?.skinColor || '#FDBCB4')
  const [eyeColor, setEyeColor] = useState(player?.appearance?.eyeColor || '#4A90E2')
  const [isSaving, setIsSaving] = useState(false)
  
  // Goals settings state
  const [goalsSettings, setGoalsSettings] = useState({
    defaultStatus: 'active',
    autoComplete: false,
    reminderDays: 7
  })
  
  // Steps settings state
  const [stepsSettings, setStepsSettings] = useState({
    defaultXpReward: 1,
    autoAddToDaily: false,
    estimatedTimeDefault: 30
  })
  
  // Statistics settings state
  const [statisticsSettings, setStatisticsSettings] = useState({
    showStreaks: true,
    showProgress: true,
    showAchievements: true,
    dataRetentionDays: 365
  })
  
  // Workflows state
  const [workflows, setWorkflows] = useState<any[]>([])
  const [loadingWorkflows, setLoadingWorkflows] = useState(false)
  
  // Display settings state
  const [displaySettings, setDisplaySettings] = useState({
    defaultView: 'day' as 'day' | 'week' | 'month' | 'year'
  })
  const [isSavingDisplay, setIsSavingDisplay] = useState(false)

  // Load workflows on component mount
  useEffect(() => {
    const loadWorkflows = async () => {
      if (!player?.user_id) return
      setLoadingWorkflows(true)
      try {
        const response = await fetch(`/api/workflows?userId=${player.user_id}`)
        if (response.ok) {
          const workflowsData = await response.json()
          setWorkflows(workflowsData)
        }
      } catch (error) {
        console.error('Error loading workflows:', error)
      } finally {
        setLoadingWorkflows(false)
      }
    }
    loadWorkflows()
  }, [player])

  // Load user's preferred locale
  useEffect(() => {
    const loadUserLocale = async () => {
      try {
        const response = await fetch('/api/game/init')
        if (response.ok) {
          const gameData = await response.json()
          if (gameData.user?.preferred_locale) {
            setPreferredLocale(gameData.user.preferred_locale as Locale)
          }
        }
      } catch (error) {
        console.error('Error loading user locale:', error)
      }
    }
    loadUserLocale()
  }, [])

  // Load display settings
  useEffect(() => {
    const loadDisplaySettings = async () => {
      if (!player?.user_id) return
      try {
        const response = await fetch('/api/cesta/user-settings')
        if (response.ok) {
          const data = await response.json()
          if (data.settings?.default_view) {
            setDisplaySettings({ defaultView: data.settings.default_view })
          }
        }
      } catch (error) {
        console.error('Error loading display settings:', error)
      }
    }
    loadDisplaySettings()
  }, [player?.user_id])

  // Handler for saving display settings
  const handleSaveDisplaySettings = async (newView: 'day' | 'week' | 'month' | 'year') => {
    if (!player?.user_id) return
    setIsSavingDisplay(true)
    try {
      const response = await fetch('/api/cesta/user-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          default_view: newView
        })
      })
      if (response.ok) {
        // Success - settings saved
      } else {
        console.error('Failed to save display settings')
      }
    } catch (error) {
      console.error('Error saving display settings:', error)
    } finally {
      setIsSavingDisplay(false)
    }
  }

  // Handler for changing language
  const handleLocaleChange = async (newLocale: Locale) => {
    setIsSavingLocale(true)
    try {
      const response = await fetch('/api/user/locale', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale: newLocale })
      })

      if (response.ok) {
        setPreferredLocale(newLocale)
        // Redirect to the new locale - use window.location for immediate redirect
        const currentPath = window.location.pathname
        
        // Handle locale switching with 'as-needed' prefix strategy
        // Extract path without locale prefix (e.g., /cs/game -> /game)
        let pathWithoutLocale = currentPath
        for (const loc of locales) {
          if (currentPath.startsWith(`/${loc}/`)) {
            pathWithoutLocale = currentPath.substring(loc.length + 1) // Remove /cs or /en, keep the rest including /
            break
          } else if (currentPath === `/${loc}`) {
            pathWithoutLocale = '/'
            break
          }
        }
        
        // Build new path - en is default (no prefix), cs needs prefix
        const newPath = newLocale === 'en' 
          ? pathWithoutLocale 
          : `/${newLocale}${pathWithoutLocale}`
        
        // Use window.location.href for immediate navigation with full page reload
        // This ensures the new locale is properly loaded
        window.location.href = newPath
      } else {
        console.error('Failed to update locale')
        setIsSavingLocale(false)
      }
    } catch (error) {
      console.error('Error updating locale:', error)
      setIsSavingLocale(false)
    }
  }

  // Workflows handlers
  const handleToggleWorkflow = async (workflowId: string, enabled: boolean) => {
    try {
      const response = await fetch(`/api/workflows/${workflowId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled })
      })
      if (response.ok) {
        setWorkflows(prev => prev.map(w => 
          w.id === workflowId ? { ...w, enabled } : w
        ))
      }
    } catch (error) {
      console.error('Error toggling workflow:', error)
    }
  }

  const handleToggleBuiltInWorkflow = async (type: string) => {
    const existing = workflows.find(w => w.type === type)
    const enabled = existing ? !existing.enabled : true
    
    try {
      if (existing) {
        await handleToggleWorkflow(existing.id, enabled)
      } else {
        // Create new workflow
        const response = await fetch('/api/workflows', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: player?.user_id,
            type,
            name: type === 'daily_review' ? 'Pohled za dneškem' : 'Workflow',
            description: type === 'daily_review' 
              ? 'Reflexe nad uplynulým dnem'
              : 'Workflow description',
            trigger_time: '18:00',
            enabled
          })
        })
        if (response.ok) {
          const newWorkflow = await response.json()
          setWorkflows(prev => [...prev, newWorkflow])
        }
      }
    } catch (error) {
      console.error('Error toggling built-in workflow:', error)
    }
  }

  const handleWorkflowTimeChange = async (type: string, time: string) => {
    const workflow = workflows.find(w => w.type === type)
    if (!workflow) return
    
    try {
      const response = await fetch(`/api/workflows/${workflow.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trigger_time: time })
      })
      if (response.ok) {
        setWorkflows(prev => prev.map(w => 
          w.id === workflow.id ? { ...w, trigger_time: time } : w
        ))
      }
    } catch (error) {
      console.error('Error updating workflow time:', error)
    }
  }

  const handleConfigureWorkflow = (workflow: any) => {
    // TODO: Open configuration modal
    console.log('Configure workflow:', workflow)
  }

  const handleSaveChanges = async () => {
    if (!player?.id) return

    setIsSaving(true)
    try {
      const updatedPlayer = {
        ...player,
        name: playerName,
        appearance: {
          ...player.appearance,
          hairColor,
          skinColor,
          eyeColor
        }
      }

      const response = await fetch('/api/player', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: player.id,
          name: playerName,
          appearance: {
            hairColor,
            skinColor,
            eyeColor
          }
        })
      })

      if (response.ok) {
        onPlayerUpdate(updatedPlayer)
        setIsEditing(false)
      } else {
        console.error('Failed to update player')
      }
    } catch (error) {
      console.error('Error updating player:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleLogout = async () => {
    try {
      await signOut()
      // Redirect to homepage after sign-out
      router.push('/')
    } catch (error) {
      console.error('Error signing out:', error)
      // Fallback: redirect anyway
      router.push('/')
    }
  }

  const tabs = [
    { id: 'user' as SettingsTab, label: t('settings.tabs.user'), icon: User },
    { id: 'goals' as SettingsTab, label: t('settings.tabs.goals'), icon: Target },
    { id: 'steps' as SettingsTab, label: t('settings.tabs.steps'), icon: Footprints },
    { id: 'statistics' as SettingsTab, label: t('settings.tabs.statistics'), icon: BarChart3 },
    { id: 'workflows' as SettingsTab, label: t('settings.tabs.workflows'), icon: Workflow },
    { id: 'display' as SettingsTab, label: 'Zobrazení', icon: Eye },
    { id: 'danger' as SettingsTab, label: t('settings.tabs.danger'), icon: UserCircle }
  ]

  const renderTabContent = () => {
    switch (activeTab) {
      case 'user':
        return (
          <div>
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-lg font-bold text-gray-800 mb-4">📧 {t('settings.user.contactInfo')}</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-bold text-gray-600 mb-1">Email</label>
                      <p className="text-sm text-gray-800 bg-white p-2 rounded border">
                        {user?.emailAddresses[0]?.emailAddress || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-600 mb-1">Jméno</label>
                      <p className="text-sm text-gray-800 bg-white p-2 rounded border">
                        {user?.firstName || ''} {user?.lastName || ''}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-lg font-bold text-gray-800 mb-4">📅 {t('settings.user.account')}</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-bold text-gray-600 mb-1">{t('settings.user.registered')}</label>
                      <p className="text-sm text-gray-800 bg-white p-2 rounded border">
                        {user?.createdAt ? new Date(user.createdAt).toLocaleDateString(locale) : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-600 mb-1">{t('settings.user.lastLogin')}</label>
                      <p className="text-sm text-gray-800 bg-white p-2 rounded border">
                        {user?.lastSignInAt ? new Date(user.lastSignInAt).toLocaleDateString(locale) : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-600 mb-1">{t('settings.user.accountStatus')}</label>
                      <p className="text-sm text-gray-800 bg-white p-2 rounded border">
                        {user?.emailAddresses[0]?.verification?.status || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Language Settings */}
              <div className="mt-6">
                <h4 className="text-lg font-bold text-gray-800 mb-4">🌐 {t('settings.user.language.title')}</h4>
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    {t('settings.user.language.label')}
                  </label>
                  <select
                    value={preferredLocale || locale}
                    onChange={(e) => handleLocaleChange(e.target.value as Locale)}
                    disabled={isSavingLocale}
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none disabled:opacity-50"
                  >
                    {locales.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc === 'cs' ? 'Čeština' : 'English'}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-2">
                    {t('settings.user.language.description')}
                  </p>
                  {isSavingLocale && (
                    <p className="text-sm text-gray-600 mt-2">{t('common.loading')}</p>
                  )}
                      </div>
                        </div>
            </div>
          </div>
        )

      case 'goals':
        return (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-lg font-bold text-gray-800 mb-4">📊 {t('settings.goals.basicSettings')}</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-600 mb-2">{t('settings.goals.defaultStatus')}</label>
                    <select 
                      value={goalsSettings.defaultStatus}
                      onChange={(e) => setGoalsSettings((prev: any) => ({ ...prev, defaultStatus: e.target.value }))}
                      className="w-full p-2 border border-gray-300 rounded-lg bg-white"
                    >
                      <option value="active">{t('settings.goals.active')}</option>
                      <option value="completed">{t('settings.goals.completed')}</option>
                      <option value="considering">Ke zvážení</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-600 mb-2">{t('settings.goals.reminderDays')}</label>
                    <input
                      type="number"
                      value={goalsSettings.reminderDays}
                      onChange={(e) => setGoalsSettings((prev: any) => ({ ...prev, reminderDays: parseInt(e.target.value) }))}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                      min="1"
                      max="30"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-bold text-gray-800 mb-4">⚙️ {t('settings.goals.automation')}</h4>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      checked={goalsSettings.autoComplete}
                      onChange={(e) => setGoalsSettings((prev: any) => ({ ...prev, autoComplete: e.target.checked }))}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-600">{t('settings.goals.autoComplete')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case 'steps':
        return (
          <div>
            <div>
              <h4 className="text-lg font-bold text-gray-800 mb-4">👣 {t('settings.steps.gameSettings')}</h4>
                <div className="space-y-4">
                  <div>
                  <label className="block text-sm font-bold text-gray-600 mb-2">{t('settings.steps.estimatedTimeDefault')}</label>
                    <input
                      type="number"
                      value={stepsSettings.estimatedTimeDefault}
                      onChange={(e) => setStepsSettings((prev: any) => ({ ...prev, estimatedTimeDefault: parseInt(e.target.value) }))}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                      min="5"
                      max="480"
                    />
                </div>
              </div>
            </div>
          </div>
        )

      case 'statistics':
        return (
          <div>
                  <div>
              <h4 className="text-lg font-bold text-gray-800 mb-4">📈 {t('settings.statistics.display')}</h4>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      checked={statisticsSettings.showStreaks}
                      onChange={(e) => setStatisticsSettings((prev: any) => ({ ...prev, showStreaks: e.target.checked }))}
                      className="rounded"
                    />
                  <span className="text-sm text-gray-600">{t('settings.statistics.showStreaks')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      checked={statisticsSettings.showProgress}
                      onChange={(e) => setStatisticsSettings((prev: any) => ({ ...prev, showProgress: e.target.checked }))}
                      className="rounded"
                    />
                  <span className="text-sm text-gray-600">{t('settings.statistics.showProgress')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      checked={statisticsSettings.showAchievements}
                      onChange={(e) => setStatisticsSettings((prev: any) => ({ ...prev, showAchievements: e.target.checked }))}
                      className="rounded"
                    />
                  <span className="text-sm text-gray-600">{t('settings.statistics.showAchievements')}</span>
                </div>
              </div>
            </div>
          </div>
        )

      case 'workflows':
        return (
          <div>
            <p className="text-gray-600 mb-6">
              {t('settings.workflows.description')}
            </p>
            
            <div className="space-y-4">
              {loadingWorkflows ? (
                <div className="text-center py-8">
                  <div className="text-gray-500">{t('settings.workflows.loading')}</div>
                </div>
              ) : workflows.length === 0 ? (
                <div className="bg-gray-50 rounded-lg p-6 text-center">
                  <p className="text-gray-600 mb-4">{t('settings.workflows.noWorkflows')}</p>
                </div>
              ) : (
                workflows.map((workflow) => (
                  <div
                    key={workflow.id}
                    className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-lg font-bold text-gray-900 mb-2">{workflow.name}</h4>
                        <p className="text-gray-600 text-sm mb-4">{workflow.description}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>🕐 {t('settings.workflows.time')}: {workflow.trigger_time || t('settings.workflows.notSet')}</span>
                          <span className={`px-2 py-1 rounded ${
                            workflow.enabled 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {workflow.enabled ? t('settings.workflows.active') : t('settings.workflows.inactive')}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleWorkflow(workflow.id, !workflow.enabled)}
                          className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                            workflow.enabled
                              ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                              : 'bg-green-500 text-white hover:bg-green-600'
                          }`}
                        >
                          {workflow.enabled ? t('settings.workflows.stop') : t('settings.workflows.start')}
                        </button>
                        <button
                          onClick={() => handleConfigureWorkflow(workflow)}
                          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                        >
                          {t('settings.workflows.configure')}
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
              
              {/* Built-in Workflows */}
              <div className="mt-8">
                <h4 className="text-lg font-bold text-gray-900 mb-4">{t('settings.workflows.availableWorkflows')}</h4>
                
                {/* Pohled za dneškem */}
                <div className="bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h5 className="text-lg font-bold text-orange-900 mb-2">🌅 {t('settings.workflows.dailyReview.name')}</h5>
                      <p className="text-gray-700 text-sm mb-4">
                        {t('settings.workflows.dailyReview.description')}
                      </p>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <label className="text-gray-700">{t('settings.workflows.time')}:</label>
                          <input
                            type="time"
                            value={workflows.find(w => w.type === 'daily_review')?.trigger_time || '18:00'}
                            onChange={(e) => handleWorkflowTimeChange('daily_review', e.target.value)}
                            className="px-3 py-1 border border-gray-300 rounded-lg"
                          />
                        </div>
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                          +10 XP za dokončení
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggleBuiltInWorkflow('daily_review')}
                      className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                        workflows.find(w => w.type === 'daily_review')?.enabled
                          ? 'bg-orange-600 text-white hover:bg-orange-600'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {workflows.find(w => w.type === 'daily_review')?.enabled ? t('settings.workflows.deactivate') : t('settings.workflows.activate')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case 'display':
        return (
          <div>
            <div className="text-center text-gray-500 py-8">
              <p>Žádná nastavení zobrazení k dispozici</p>
            </div>
          </div>
        )

      case 'danger':
        return (
          <div>
            <div>
              <div className="space-y-4">
                <div className="bg-white rounded-lg p-4 border border-red-200">
                  <h5 className="font-bold text-red-700 mb-2">🚪 {t('settings.danger.logout.title')}</h5>
                  <p className="text-sm text-gray-600 mb-3">
                    {t('settings.danger.logout.description')}
                  </p>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    {t('settings.danger.logout.button')}
                  </button>
                </div>

                <div className="bg-white rounded-lg p-4 border border-red-200">
                  <h5 className="font-bold text-red-700 mb-2">🗑️ {t('settings.danger.deleteAccount.title')}</h5>
                  <p className="text-sm text-gray-600 mb-3">
                    {t('settings.danger.deleteAccount.description')}
                  </p>
                  <button
                    disabled
                    className="px-4 py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed"
                  >
                    {t('settings.danger.deleteAccount.button')}
                  </button>
                </div>

                <div className="bg-white rounded-lg p-4 border border-red-200">
                  <h5 className="font-bold text-red-700 mb-2">🔄 {t('settings.danger.resetData.title')}</h5>
                  <p className="text-sm text-gray-600 mb-3">
                    {t('settings.danger.resetData.description')}
                  </p>
                  <button
                    disabled
                    className="px-4 py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed"
                  >
                    {t('settings.danger.resetData.button')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="w-full h-full flex bg-white">
      {/* Left sidebar - Navigation - Hidden on mobile */}
      <div className="hidden md:flex w-64 border-r border-gray-200 bg-gray-50 flex-shrink-0">
        <div className="p-4">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Nastavení</h2>
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-orange-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Right content area */}
      <div className="flex-1 overflow-y-auto relative">
        {/* Mobile hamburger menu */}
        <div className="md:hidden sticky top-0 z-10 bg-white border-b border-gray-200 p-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">
              {tabs.find(tab => tab.id === activeTab)?.label || 'Nastavení'}
            </h2>
            <div className="relative">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title="Menu"
              >
                <Menu className="w-5 h-5 text-gray-700" />
              </button>
              
              {/* Mobile menu dropdown */}
              {mobileMenuOpen && (
                <>
                  {/* Backdrop */}
                  <div 
                    className="fixed inset-0 z-[100]" 
                    onClick={() => setMobileMenuOpen(false)}
                  />
                  <div className="fixed right-4 top-16 bg-white border border-gray-200 rounded-lg shadow-lg z-[101] min-w-[200px]">
                    <nav className="py-2">
                      {tabs.map((tab) => {
                        const Icon = tab.icon
                        return (
                          <button
                            key={tab.id}
                            onClick={() => {
                              setActiveTab(tab.id)
                              setMobileMenuOpen(false)
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-3 transition-colors text-left ${
                              activeTab === tab.id
                                ? 'bg-orange-600 text-white'
                                : 'text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            <Icon className="w-5 h-5 flex-shrink-0" />
                            <span className="font-medium">{tab.label}</span>
                          </button>
                        )
                      })}
                    </nav>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className="max-w-4xl mx-auto p-4 md:p-8">
          {renderTabContent()}
        </div>
      </div>
    </div>
  )
}
'use client'

import { useState, useEffect } from 'react'
import { useUser, useClerk } from '@clerk/nextjs'
import { useTranslations, useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { locales, type Locale } from '@/i18n/config'
import { User, Target, Footprints, BarChart3, Eye, UserCircle, Menu } from 'lucide-react'
import { colorPalettes, applyColorTheme } from '@/lib/color-utils'

interface SettingsViewProps {
  player: any
  onPlayerUpdate: (player: any) => void
  onBack?: () => void
  onNavigateToMain?: () => void
}

type SettingsTab = 'user' | 'goals' | 'steps' | 'statistics' | 'display' | 'danger'

export function SettingsView({ player, onPlayerUpdate, onBack, onNavigateToMain }: SettingsViewProps) {
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
        if (savedTab && ['user', 'goals', 'steps', 'statistics', 'display', 'danger'].includes(savedTab)) {
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
  
  // Display settings state
  const [displaySettings, setDisplaySettings] = useState({
    defaultView: 'day' as 'day' | 'week' | 'month' | 'year',
    dateFormat: 'DD.MM.YYYY' as 'DD.MM.YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD' | 'DD MMM YYYY',
    primaryColor: '#E8871E' as string
  })
  const [isSavingDisplay, setIsSavingDisplay] = useState(false)

  // Reset data and delete account state
  const [showResetDataDialog, setShowResetDataDialog] = useState(false)
  const [showDeleteAccountDialog, setShowDeleteAccountDialog] = useState(false)
  const [resetDataConfirmation, setResetDataConfirmation] = useState('')
  const [deleteAccountConfirmation, setDeleteAccountConfirmation] = useState('')
  const [isResetting, setIsResetting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isResettingOnboarding, setIsResettingOnboarding] = useState(false)

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
          const primaryColor = data.settings?.primary_color || '#E8871E'
          setDisplaySettings({
            defaultView: data.settings?.default_view || 'day',
            dateFormat: data.settings?.date_format || 'DD.MM.YYYY',
            primaryColor
          })
          // Apply color theme on load
          applyColorTheme(primaryColor)
        }
      } catch (error) {
        console.error('Error loading display settings:', error)
      }
    }
    loadDisplaySettings()
  }, [player?.user_id])

  // Handler for saving display settings
  const handleSaveDisplaySettings = async (newView?: 'day' | 'week' | 'month' | 'year', newDateFormat?: 'DD.MM.YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD' | 'DD MMM YYYY', newPrimaryColor?: string) => {
    if (!player?.user_id) return
    setIsSavingDisplay(true)
    try {
      const requestBody: any = {}
      if (newView) requestBody.default_view = newView
      if (newDateFormat) requestBody.date_format = newDateFormat
      if (newPrimaryColor) requestBody.primary_color = newPrimaryColor
      
      const response = await fetch('/api/cesta/user-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })
      
      if (response.ok) {
        const data = await response.json()
        if (newView) {
          setDisplaySettings(prev => ({ ...prev, defaultView: newView }))
        }
        if (newDateFormat) {
          setDisplaySettings(prev => ({ ...prev, dateFormat: newDateFormat }))
        }
        if (newPrimaryColor) {
          setDisplaySettings(prev => ({ ...prev, primaryColor: newPrimaryColor }))
          // Apply color theme immediately
          applyColorTheme(newPrimaryColor)
          // Also save to localStorage as backup
          localStorage.setItem('app-primary-color', newPrimaryColor)
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('Failed to save display settings:', errorData)
        alert(`Chyba při ukládání nastavení: ${errorData.error || 'Neznámá chyba'}`)
      }
    } catch (error) {
      console.error('Error saving display settings:', error)
      alert(`Chyba při ukládání nastavení: ${error instanceof Error ? error.message : 'Neznámá chyba'}`)
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

  const handleResetData = async () => {
    if (resetDataConfirmation !== t('settings.danger.resetData.confirmText')) {
      return
    }

    setIsResetting(true)
    try {
      const response = await fetch('/api/account/reset-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (response.ok) {
        setShowResetDataDialog(false)
        setResetDataConfirmation('')
        // Reload page to reflect changes
        window.location.reload()
      } else {
        const error = await response.json()
        alert(error.error || t('settings.danger.resetData.error'))
      }
    } catch (error) {
      console.error('Error resetting data:', error)
      alert(t('settings.danger.resetData.error'))
    } finally {
      setIsResetting(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteAccountConfirmation !== t('settings.danger.deleteAccount.confirmText')) {
      return
    }

    setIsDeleting(true)
    try {
      const response = await fetch('/api/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (response.ok) {
        // Sign out and redirect to homepage
        await signOut()
        router.push('/')
      } else {
        const error = await response.json()
        alert(error.error || t('settings.danger.deleteAccount.error'))
        setIsDeleting(false)
      }
    } catch (error) {
      console.error('Error deleting account:', error)
      alert(t('settings.danger.deleteAccount.error'))
      setIsDeleting(false)
    }
  }

  const handleResetOnboarding = async () => {
    setIsResettingOnboarding(true)
    try {
      const response = await fetch('/api/user/onboarding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hasCompletedOnboarding: false })
      })

      if (response.ok) {
        // Redirect to main panel to show onboarding
        if (onNavigateToMain) {
          onNavigateToMain()
          // Reload page to refresh onboarding status
          setTimeout(() => {
            window.location.reload()
          }, 200)
        } else {
          // Fallback: use router if onNavigateToMain is not available
          router.push(`/${locale}/game`)
        }
      } else {
        const error = await response.json()
        alert(error.error || t('settings.user.onboarding.error'))
      }
    } catch (error) {
      console.error('Error resetting onboarding:', error)
      alert(t('settings.user.onboarding.error'))
    } finally {
      setIsResettingOnboarding(false)
    }
  }

  const tabs = [
    { id: 'user' as SettingsTab, label: t('settings.tabs.user'), icon: User },
    { id: 'goals' as SettingsTab, label: t('settings.tabs.goals'), icon: Target },
    { id: 'steps' as SettingsTab, label: t('settings.tabs.steps'), icon: Footprints },
    { id: 'statistics' as SettingsTab, label: t('settings.tabs.statistics'), icon: BarChart3 },
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
                  <h4 className="text-lg font-bold text-black font-playful mb-4">📧 {t('settings.user.contactInfo')}</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-bold text-black font-playful mb-1">Email</label>
                      <p className="text-sm text-black bg-white p-2 rounded-playful-md border-2 border-primary-500 font-playful">
                        {user?.emailAddresses[0]?.emailAddress || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-black font-playful mb-1">Jméno</label>
                      <p className="text-sm text-black bg-white p-2 rounded-playful-md border-2 border-primary-500 font-playful">
                        {user?.firstName || ''} {user?.lastName || ''}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-lg font-bold text-black font-playful mb-4">📅 {t('settings.user.account')}</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-bold text-black font-playful mb-1">{t('settings.user.registered')}</label>
                      <p className="text-sm text-black bg-white p-2 rounded-playful-md border-2 border-primary-500 font-playful">
                        {user?.createdAt ? new Date(user.createdAt).toLocaleDateString(locale) : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-black font-playful mb-1">{t('settings.user.lastLogin')}</label>
                      <p className="text-sm text-black bg-white p-2 rounded-playful-md border-2 border-primary-500 font-playful">
                        {user?.lastSignInAt ? new Date(user.lastSignInAt).toLocaleDateString(locale) : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-black font-playful mb-1">{t('settings.user.accountStatus')}</label>
                      <p className="text-sm text-black bg-white p-2 rounded-playful-md border-2 border-primary-500 font-playful">
                        {user?.emailAddresses[0]?.verification?.status || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Language Settings */}
              <div className="mt-6">
                <h4 className="text-lg font-bold text-black font-playful mb-4">🌐 {t('settings.user.language.title')}</h4>
                <div className="box-playful-highlight p-4">
                  <label className="block text-sm font-bold text-black font-playful mb-2">
                    {t('settings.user.language.label')}
                  </label>
                  <select
                    value={preferredLocale || locale}
                    onChange={(e) => handleLocaleChange(e.target.value as Locale)}
                    disabled={isSavingLocale}
                    className="w-full p-3 border-2 border-primary-500 rounded-playful-md font-playful focus:ring-2 focus:ring-primary-500 focus:outline-none disabled:opacity-50 bg-white"
                  >
                    {locales.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc === 'cs' ? 'Čeština' : 'English'}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-600 mt-2 font-playful">
                    {t('settings.user.language.description')}
                  </p>
                  {isSavingLocale && (
                    <p className="text-sm text-primary-600 mt-2 font-playful">{t('common.loading')}</p>
                  )}
                      </div>
                      
                      {/* Onboarding Reset */}
                      <div className="mt-6">
                        <h4 className="text-lg font-bold text-black font-playful mb-4">🎓 {t('settings.user.onboarding.title')}</h4>
                        <div className="box-playful-highlight p-4 border-2 border-primary-500">
                          <p className="text-sm text-gray-600 mb-3 font-playful">
                            {t('settings.user.onboarding.description')}
                          </p>
                          <button
                            onClick={handleResetOnboarding}
                            disabled={isResettingOnboarding}
                            className="btn-playful-primary px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isResettingOnboarding ? t('common.loading') : t('settings.user.onboarding.button')}
                          </button>
                        </div>
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
                <h4 className="text-lg font-bold text-black font-playful mb-4">📊 {t('settings.goals.basicSettings')}</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-black font-playful mb-2">{t('settings.goals.defaultStatus')}</label>
                    <select 
                      value={goalsSettings.defaultStatus}
                      onChange={(e) => setGoalsSettings((prev: any) => ({ ...prev, defaultStatus: e.target.value }))}
                      className="w-full p-2 border-2 border-primary-500 rounded-playful-md font-playful bg-white"
                    >
                      <option value="active">{t('settings.goals.active')}</option>
                      <option value="completed">{t('settings.goals.completed')}</option>
                      <option value="considering">Ke zvážení</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-black font-playful mb-2">{t('settings.goals.reminderDays')}</label>
                    <input
                      type="number"
                      value={goalsSettings.reminderDays}
                      onChange={(e) => setGoalsSettings((prev: any) => ({ ...prev, reminderDays: parseInt(e.target.value) }))}
                      className="w-full p-2 border-2 border-primary-500 rounded-playful-md font-playful bg-white"
                      min="1"
                      max="30"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-bold text-black font-playful mb-4">⚙️ {t('settings.goals.automation')}</h4>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      checked={goalsSettings.autoComplete}
                      onChange={(e) => setGoalsSettings((prev: any) => ({ ...prev, autoComplete: e.target.checked }))}
                      className="w-4 h-4 text-primary-600 border-2 border-primary-500 rounded-playful-sm focus:ring-primary-500"
                    />
                    <span className="text-sm text-black font-playful">{t('settings.goals.autoComplete')}</span>
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
              <h4 className="text-lg font-bold text-black font-playful mb-4">👣 {t('settings.steps.gameSettings')}</h4>
                <div className="space-y-4">
                  <div>
                  <label className="block text-sm font-bold text-black font-playful mb-2">{t('settings.steps.estimatedTimeDefault')}</label>
                    <input
                      type="number"
                      value={stepsSettings.estimatedTimeDefault}
                      onChange={(e) => setStepsSettings((prev: any) => ({ ...prev, estimatedTimeDefault: parseInt(e.target.value) }))}
                      className="w-full p-2 border-2 border-primary-500 rounded-playful-md font-playful bg-white"
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
              <h4 className="text-lg font-bold text-black font-playful mb-4">📈 {t('settings.statistics.display')}</h4>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      checked={statisticsSettings.showStreaks}
                      onChange={(e) => setStatisticsSettings((prev: any) => ({ ...prev, showStreaks: e.target.checked }))}
                      className="w-4 h-4 text-primary-600 border-2 border-primary-500 rounded-playful-sm focus:ring-primary-500"
                    />
                  <span className="text-sm text-black font-playful">{t('settings.statistics.showStreaks')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      checked={statisticsSettings.showProgress}
                      onChange={(e) => setStatisticsSettings((prev: any) => ({ ...prev, showProgress: e.target.checked }))}
                      className="w-4 h-4 text-primary-600 border-2 border-primary-500 rounded-playful-sm focus:ring-primary-500"
                    />
                  <span className="text-sm text-black font-playful">{t('settings.statistics.showProgress')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      checked={statisticsSettings.showAchievements}
                      onChange={(e) => setStatisticsSettings((prev: any) => ({ ...prev, showAchievements: e.target.checked }))}
                      className="w-4 h-4 text-primary-600 border-2 border-primary-500 rounded-playful-sm focus:ring-primary-500"
                    />
                  <span className="text-sm text-black font-playful">{t('settings.statistics.showAchievements')}</span>
                </div>
              </div>
            </div>
          </div>
        )

      case 'display':
        return (
          <div>
            <div className="space-y-6">
              {/* Primary Color */}
              <div>
                <h4 className="text-lg font-bold text-black mb-4 font-playful">🎨 Hlavní barva</h4>
                <div className="box-playful-highlight p-4">
                  <label className="block text-sm font-bold text-black mb-3 font-playful">
                    Vyberte si hlavní barvu aplikace
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {colorPalettes.map((palette) => (
                        <button
                        key={palette.value}
                        onClick={() => handleSaveDisplaySettings(undefined, undefined, palette.value)}
                        disabled={isSavingDisplay}
                        className={`flex flex-col items-center gap-1.5 px-3 py-2 rounded-playful-md border-2 transition-all flex-1 min-w-0 ${
                          displaySettings.primaryColor === palette.value
                            ? 'border-primary-500 ring-2 ring-primary-200 bg-primary-50'
                            : 'border-gray-300 hover:border-primary-300 bg-white'
                        } disabled:opacity-50`}
                        >
                        <div
                          className="w-full h-8 rounded-playful-sm"
                          style={{ backgroundColor: palette.value }}
                        />
                        <p className="text-[10px] font-medium text-gray-700 font-playful text-center leading-tight">{palette.name}</p>
                        </button>
                    ))}
                      </div>
                  <p className="text-xs text-gray-600 mt-3 font-playful">
                    Hlavní barva se použije pro tlačítka, akcenty a zvýraznění v aplikaci
                  </p>
                        </div>
                      </div>
              
              {/* Date Format */}
            <div>
                <h4 className="text-lg font-bold text-black mb-4 font-playful">📅 Formát data</h4>
              <div className="box-playful-highlight p-4">
                <label className="block text-sm font-bold text-black mb-2 font-playful">
                    Formát zobrazení data
                </label>
                <select
                    value={displaySettings.dateFormat}
                    onChange={(e) => handleSaveDisplaySettings(undefined, e.target.value as 'DD.MM.YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD' | 'DD MMM YYYY')}
                  disabled={isSavingDisplay}
                    className="w-full p-3 border-2 border-primary-500 rounded-playful-md font-playful focus:ring-2 focus:ring-primary-500 focus:outline-none disabled:opacity-50 bg-white"
                >
                    <option value="DD.MM.YYYY">DD.MM.YYYY (např. 15.01.2025)</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY (např. 01/15/2025)</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD (např. 2025-01-15)</option>
                    <option value="DD MMM YYYY">DD MMM YYYY (např. 15 led 2025)</option>
                </select>
                <p className="text-xs text-gray-600 mt-2 font-playful">
                    Tento formát se použije pro zobrazení dat mimo aktuální týden
                </p>
                </div>
              </div>
            </div>
          </div>
        )

      case 'danger':
        return (
          <div>
            <div>
              <div className="space-y-4">
                <div className="box-playful-highlight p-4 border-2 border-red-500">
                  <h5 className="font-bold text-red-600 mb-2 font-playful">🚪 {t('settings.danger.logout.title')}</h5>
                  <p className="text-sm text-gray-600 mb-3 font-playful">
                    {t('settings.danger.logout.description')}
                  </p>
                  <button
                    onClick={handleLogout}
                    className="btn-playful-danger px-4 py-2"
                  >
                    {t('settings.danger.logout.button')}
                  </button>
                </div>

                <div className="box-playful-highlight p-4 border-2 border-red-500">
                  <h5 className="font-bold text-red-600 mb-2 font-playful">🔄 {t('settings.danger.resetData.title')}</h5>
                  <p className="text-sm text-gray-600 mb-3 font-playful">
                    {t('settings.danger.resetData.description')}
                  </p>
                  <button
                    onClick={() => setShowResetDataDialog(true)}
                    className="btn-playful-danger px-4 py-2"
                  >
                    {t('settings.danger.resetData.button')}
                  </button>
                </div>

                <div className="box-playful-highlight p-4 border-2 border-red-500">
                  <h5 className="font-bold text-red-600 mb-2 font-playful">🗑️ {t('settings.danger.deleteAccount.title')}</h5>
                  <p className="text-sm text-gray-600 mb-3 font-playful">
                    {t('settings.danger.deleteAccount.description')}
                  </p>
                  <button
                    onClick={() => setShowDeleteAccountDialog(true)}
                    className="btn-playful-danger px-4 py-2"
                  >
                    {t('settings.danger.deleteAccount.button')}
                  </button>
                </div>
              </div>
                </div>

            {/* Reset Data Confirmation Dialog */}
            {showResetDataDialog && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                <div className="bg-white p-6 max-w-md w-full mx-4 border-2 border-red-500 rounded-playful-md">
                  <h3 className="text-xl font-bold text-red-600 mb-4 font-playful">
                    {t('settings.danger.resetData.dialogTitle')}
                  </h3>
                  <p className="text-sm text-gray-700 mb-4 font-playful">
                    {t('settings.danger.resetData.dialogWarning')}
                  </p>
                  <p className="text-sm font-bold text-gray-800 mb-2 font-playful">
                    {t('settings.danger.resetData.confirmPrompt')}
                  </p>
                  <input
                    type="text"
                    value={resetDataConfirmation}
                    onChange={(e) => setResetDataConfirmation(e.target.value)}
                    placeholder={t('settings.danger.resetData.confirmPlaceholder')}
                    className="w-full p-3 border-2 border-primary-500 rounded-playful-md font-playful mb-4 bg-white"
                  />
                  <div className="flex gap-3">
                  <button
                      onClick={() => {
                        setShowResetDataDialog(false)
                        setResetDataConfirmation('')
                      }}
                      className="btn-playful-base px-4 py-2 flex-1"
                      disabled={isResetting}
                    >
                      {t('common.cancel')}
                    </button>
                    <button
                      onClick={handleResetData}
                      disabled={resetDataConfirmation !== t('settings.danger.resetData.confirmText') || isResetting}
                      className="btn-playful-danger px-4 py-2 flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                      {isResetting ? t('common.loading') : t('settings.danger.resetData.button')}
                  </button>
                </div>
              </div>
            </div>
            )}

            {/* Delete Account Confirmation Dialog */}
            {showDeleteAccountDialog && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                <div className="bg-white p-6 max-w-md w-full mx-4 border-2 border-red-500 rounded-playful-md">
                  <h3 className="text-xl font-bold text-red-600 mb-4 font-playful">
                    {t('settings.danger.deleteAccount.dialogTitle')}
                  </h3>
                  <p className="text-sm text-gray-700 mb-4 font-playful">
                    {t('settings.danger.deleteAccount.dialogWarning')}
                  </p>
                  <p className="text-sm font-bold text-gray-800 mb-2 font-playful">
                    {t('settings.danger.deleteAccount.confirmPrompt')}
                  </p>
                  <input
                    type="text"
                    value={deleteAccountConfirmation}
                    onChange={(e) => setDeleteAccountConfirmation(e.target.value)}
                    placeholder={t('settings.danger.deleteAccount.confirmPlaceholder')}
                    className="w-full p-3 border-2 border-primary-500 rounded-playful-md font-playful mb-4 bg-white"
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowDeleteAccountDialog(false)
                        setDeleteAccountConfirmation('')
                      }}
                      className="btn-playful-base px-4 py-2 flex-1"
                      disabled={isDeleting}
                    >
                      {t('common.cancel')}
                    </button>
                    <button
                      onClick={handleDeleteAccount}
                      disabled={deleteAccountConfirmation !== t('settings.danger.deleteAccount.confirmText') || isDeleting}
                      className="btn-playful-danger px-4 py-2 flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isDeleting ? t('common.loading') : t('settings.danger.deleteAccount.button')}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="w-full h-full flex bg-background">
      {/* Left sidebar - Navigation - Hidden on mobile */}
      <div className="hidden md:flex w-64 border-r-2 border-primary-500 bg-white flex-shrink-0">
        <div className="p-4">
          <h2 className="text-lg font-bold text-black font-playful mb-4">Nastavení</h2>
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-playful-md transition-colors font-playful ${
                    activeTab === tab.id
                      ? 'bg-primary-500 text-black font-semibold'
                      : 'text-black hover:bg-primary-50'
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
        <div className="md:hidden sticky top-0 z-10 bg-white border-b-2 border-primary-500 p-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-black font-playful">
              {tabs.find(tab => tab.id === activeTab)?.label || 'Nastavení'}
            </h2>
            <div className="relative">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="btn-playful-base p-2"
                title="Menu"
              >
                <Menu className="w-5 h-5 text-black" />
              </button>
              
              {/* Mobile menu dropdown */}
              {mobileMenuOpen && (
                <>
                  {/* Backdrop */}
                  <div 
                    className="fixed inset-0 z-[100]" 
                    onClick={() => setMobileMenuOpen(false)}
                  />
                  <div className="fixed right-4 top-16 box-playful-highlight bg-white z-[101] min-w-[200px]">
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
                            className={`w-full flex items-center gap-3 px-4 py-3 transition-colors text-left font-playful ${
                              activeTab === tab.id
                                ? 'bg-primary-500 text-black font-semibold'
                                : 'text-black hover:bg-primary-50'
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
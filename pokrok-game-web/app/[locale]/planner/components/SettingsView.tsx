'use client'

import { useState, useEffect } from 'react'
import { useUser, useClerk } from '@clerk/nextjs'
import { useTranslations, useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { locales, type Locale } from '@/i18n/config'
import { User, Target, Footprints, BarChart3, Eye, UserCircle, Menu, CreditCard, Sparkles } from 'lucide-react'
import { UserProfile, PricingTable, Protect } from '@clerk/nextjs'
import { colorPalettes, applyColorTheme } from '@/lib/color-utils'
import { getDefaultCurrencyByLocale } from '@/lib/metric-units'

interface SettingsViewProps {
  player: any
  onPlayerUpdate: (player: any) => void
  onBack?: () => void
  onNavigateToMain?: () => void
}

type SettingsTab = 'user' | 'goals' | 'steps' | 'statistics' | 'display' | 'views' | 'assistant' | 'subscription' | 'danger'

export function SettingsView({ player, onPlayerUpdate, onBack, onNavigateToMain }: SettingsViewProps) {
  const { user } = useUser()
  const { signOut } = useClerk()
  const t = useTranslations()
  const locale = useLocale()
  const router = useRouter()
  
  // Mobile menu state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  // Billing modal state
  const [showBillingModal, setShowBillingModal] = useState(false)
  
  // Load active tab from localStorage on mount
  const [activeTab, setActiveTab] = useState<SettingsTab>(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedTab = localStorage.getItem('settingsView_activeTab')
        if (savedTab && ['user', 'goals', 'steps', 'statistics', 'display', 'assistant', 'subscription', 'danger'].includes(savedTab)) {
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
  
  // Metric settings state
  const [metricSettings, setMetricSettings] = useState({
    defaultCurrency: 'USD' as string,
    weightUnitPreference: 'kg' as 'kg' | 'lbs'
  })
  const [isSavingMetric, setIsSavingMetric] = useState(false)

  // Assistant settings state - load from localStorage
  const [assistantEnabled, setAssistantEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('assistantEnabled')
      return saved !== 'false' // Default to true if not set
    }
    return true
  })
  const [assistantShowTips, setAssistantShowTips] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('assistantShowTips')
      return saved !== 'false' // Default to true if not set
    }
    return true
  })
  const [isLoadingAssistant, setIsLoadingAssistant] = useState(false)
  const [isSavingAssistant, setIsSavingAssistant] = useState(false)

  // Reset data and delete account state
  const [showResetDataDialog, setShowResetDataDialog] = useState(false)
  const [showDeleteAccountDialog, setShowDeleteAccountDialog] = useState(false)
  const [resetDataConfirmation, setResetDataConfirmation] = useState('')
  const [deleteAccountConfirmation, setDeleteAccountConfirmation] = useState('')
  const [isResetting, setIsResetting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isResettingOnboarding, setIsResettingOnboarding] = useState(false)
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null)

  // Load user's preferred locale and onboarding status
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const response = await fetch('/api/game/init')
        if (response.ok) {
          const gameData = await response.json()
          if (gameData.user?.preferred_locale) {
            setPreferredLocale(gameData.user.preferred_locale as Locale)
          }
          if (gameData.user?.has_completed_onboarding !== undefined) {
            setHasCompletedOnboarding(gameData.user.has_completed_onboarding)
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error)
      }
    }
    loadUserData()
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
          
          // Load metric settings
          const localeCode = locale === 'cs' ? 'cs-CZ' : 'en-US'
          const defaultCurrency = data.settings?.default_currency || getDefaultCurrencyByLocale(localeCode)
          const weightUnitPreference = data.settings?.weight_unit_preference || 'kg'
          setMetricSettings({
            defaultCurrency,
            weightUnitPreference
          })
        }
      } catch (error) {
        console.error('Error loading display settings:', error)
      }
    }
    loadDisplaySettings()
  }, [player?.user_id, locale])

  // Handler for saving metric settings
  const handleSaveMetricSettings = async (newCurrency?: string, newWeightUnit?: 'kg' | 'lbs') => {
    setIsSavingMetric(true)
    try {
      const requestBody: any = {}
      if (newCurrency !== undefined) requestBody.default_currency = newCurrency
      if (newWeightUnit !== undefined) requestBody.weight_unit_preference = newWeightUnit
      
      const response = await fetch('/api/cesta/user-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })
      
      if (response.ok) {
        if (newCurrency !== undefined) {
          setMetricSettings(prev => ({ ...prev, defaultCurrency: newCurrency }))
        }
        if (newWeightUnit !== undefined) {
          setMetricSettings(prev => ({ ...prev, weightUnitPreference: newWeightUnit }))
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('Failed to save metric settings:', errorData)
        alert(`Chyba při ukládání nastavení: ${errorData.error || 'Neznámá chyba'}`)
      }
    } catch (error) {
      console.error('Error saving metric settings:', error)
      alert(`Chyba při ukládání nastavení: ${error instanceof Error ? error.message : 'Neznámá chyba'}`)
    } finally {
      setIsSavingMetric(false)
    }
  }

  // Handler for saving assistant settings
  const handleSaveAssistantSettings = (enabled: boolean) => {
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('assistantEnabled', String(enabled))
    }
    setAssistantEnabled(enabled)
    // Notify AssistantPanel about the change
    window.dispatchEvent(new CustomEvent('assistantSettingsChanged'))
  }

  // Handler for saving assistant show tips setting
  const handleSaveAssistantShowTips = (showTips: boolean) => {
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('assistantShowTips', String(showTips))
    }
    setAssistantShowTips(showTips)
    // Notify AssistantPanel about the change
    window.dispatchEvent(new CustomEvent('assistantSettingsChanged'))
  }

  // Handler for saving display settings
  const handleSaveDisplaySettings = async (newView?: 'day' | 'week' | 'month' | 'year', newDateFormat?: 'DD.MM.YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD' | 'DD MMM YYYY', newPrimaryColor?: string) => {
    console.log('handleSaveDisplaySettings called', { newView, newDateFormat, newPrimaryColor, player: player?.id || player?.user_id, hasPlayer: !!player, user: user?.id })
    
    // API endpoint uses Clerk auth, so we don't need to check player.user_id
    // The API will get the user ID from the auth token
    setIsSavingDisplay(true)
    try {
      const requestBody: any = {}
      if (newView) requestBody.default_view = newView
      if (newDateFormat) requestBody.date_format = newDateFormat
      if (newPrimaryColor) requestBody.primary_color = newPrimaryColor
      
      console.log('Saving display settings:', requestBody)
      
      const response = await fetch('/api/cesta/user-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
        })
      
      console.log('Response status:', response.status, response.ok)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Settings saved successfully:', data)
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
        console.error('Failed to save display settings:', errorData, response.status)
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
        // Extract path without locale prefix (e.g., /cs/planner -> /planner)
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
    if (!hasCompletedOnboarding) return // Don't allow reset if onboarding is not completed
    
    setIsResettingOnboarding(true)
    try {
      // Clear read onboarding tips from localStorage
      if (typeof window !== 'undefined') {
        const readTips = localStorage.getItem('assistantReadTips')
        if (readTips) {
          try {
            const tipsArray = JSON.parse(readTips)
            // Filter out onboarding tips (they start with 'onboarding-')
            const filteredTips = tipsArray.filter((tipId: string) => !tipId.startsWith('onboarding-'))
            localStorage.setItem('assistantReadTips', JSON.stringify(filteredTips))
          } catch (error) {
            console.error('Error filtering onboarding tips:', error)
          }
        }
      }
      
      // Reset onboarding status in database
      const response = await fetch('/api/user/onboarding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hasCompletedOnboarding: false })
      })
      
      if (response.ok) {
        // Update local state
        setHasCompletedOnboarding(false)
        
        // Notify AssistantPanel to reload tips
        window.dispatchEvent(new CustomEvent('assistantSettingsChanged'))
        window.dispatchEvent(new CustomEvent('onboardingReset'))
        
        // Show success message
        alert(t('settings.user.onboarding.resetSuccess') || 'Onboarding tipy byly obnoveny. Zkontrolujte asistenta.')
      } else {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }))
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
    { id: 'display' as SettingsTab, label: t('settings.tabs.display'), icon: Eye },
    { id: 'assistant' as SettingsTab, label: t('settings.tabs.assistant'), icon: Sparkles },
    { id: 'subscription' as SettingsTab, label: t('settings.tabs.subscription'), icon: CreditCard },
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
              </div>
              
              {/* Currency Settings */}
              <div className="mt-6">
                <h4 className="text-lg font-bold text-black font-playful mb-4">💵 {t('settings.user.currency.title') || 'Výchozí měna'}</h4>
                <div className="box-playful-highlight p-4">
                  <label className="block text-sm font-bold text-black font-playful mb-2">
                    {t('settings.user.currency.label') || 'Výchozí měna pro metriky'}
                  </label>
                  <select
                    value={metricSettings.defaultCurrency}
                    onChange={(e) => handleSaveMetricSettings(e.target.value, undefined)}
                    disabled={isSavingMetric}
                    className="w-full p-3 border-2 border-primary-500 rounded-playful-md font-playful focus:ring-2 focus:ring-primary-500 focus:outline-none disabled:opacity-50 bg-white"
                  >
                    <option value="CZK">CZK (Kč)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="PLN">PLN (zł)</option>
                    <option value="JPY">JPY (¥)</option>
                    <option value="CHF">CHF (Fr)</option>
                    <option value="AUD">AUD (A$)</option>
                    <option value="CAD">CAD (C$)</option>
                  </select>
                  <p className="text-xs text-gray-600 mt-2 font-playful">
                    {t('settings.user.currency.description') || 'Tato měna bude použita jako výchozí při vytváření nových měnových metrik.'}
                  </p>
                  {isSavingMetric && (
                    <p className="text-sm text-primary-600 mt-2 font-playful">{t('common.loading')}</p>
                  )}
                </div>
              </div>
              
              {/* Weight Unit Preference */}
              <div className="mt-6">
                <h4 className="text-lg font-bold text-black font-playful mb-4">⚖️ {t('settings.user.weightUnit.title') || 'Jednotky hmotnosti'}</h4>
                <div className="box-playful-highlight p-4">
                  <label className="block text-sm font-bold text-black font-playful mb-2">
                    {t('settings.user.weightUnit.label') || 'Preferované jednotky hmotnosti'}
                  </label>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleSaveMetricSettings(undefined, 'kg')}
                      disabled={isSavingMetric}
                      className={`px-4 py-2 rounded-playful-md border-2 font-playful transition-all ${
                        metricSettings.weightUnitPreference === 'kg'
                          ? 'bg-primary-500 text-black border-primary-500 font-semibold'
                          : 'bg-white text-black border-primary-500 hover:bg-primary-50'
                      } disabled:opacity-50`}
                    >
                      kg (kilogramy)
                    </button>
                    <button
                      onClick={() => handleSaveMetricSettings(undefined, 'lbs')}
                      disabled={isSavingMetric}
                      className={`px-4 py-2 rounded-playful-md border-2 font-playful transition-all ${
                        metricSettings.weightUnitPreference === 'lbs'
                          ? 'bg-primary-500 text-black border-primary-500 font-semibold'
                          : 'bg-white text-black border-primary-500 hover:bg-primary-50'
                      } disabled:opacity-50`}
                    >
                      lbs (libry)
                    </button>
                  </div>
                  <p className="text-xs text-gray-600 mt-2 font-playful">
                    {t('settings.user.weightUnit.description') || 'Tato jednotka bude použita jako výchozí při vytváření nových metrik hmotnosti.'}
                  </p>
                  {isSavingMetric && (
                    <p className="text-sm text-primary-600 mt-2 font-playful">{t('common.loading')}</p>
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
                <h4 className="text-lg font-bold text-black mb-4 font-playful">📅 {t('settings.display.dateFormat')}</h4>
              <div className="box-playful-highlight p-4">
                <label className="block text-sm font-bold text-black mb-2 font-playful">
                    {t('settings.display.dateDisplayFormat')}
                </label>
                <select
                    value={displaySettings.dateFormat}
                    onChange={(e) => handleSaveDisplaySettings(undefined, e.target.value as 'DD.MM.YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD' | 'DD MMM YYYY')}
                  disabled={isSavingDisplay}
                    className="w-full p-3 border-2 border-primary-500 rounded-playful-md font-playful focus:ring-2 focus:ring-primary-500 focus:outline-none disabled:opacity-50 bg-white"
                >
                    <option value="DD.MM.YYYY">{t('settings.display.dateFormatOptions.DD_MM_YYYY')}</option>
                    <option value="MM/DD/YYYY">{t('settings.display.dateFormatOptions.MM_DD_YYYY')}</option>
                    <option value="YYYY-MM-DD">{t('settings.display.dateFormatOptions.YYYY_MM_DD')}</option>
                    <option value="DD MMM YYYY">{t('settings.display.dateFormatOptions.DD_MMM_YYYY')}</option>
                </select>
                <p className="text-xs text-gray-600 mt-2 font-playful">
                    {t('settings.display.dateFormatDescription')}
                </p>
                </div>
              </div>
            </div>
          </div>
        )

      case 'assistant':
        return (
          <div>
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-bold text-black font-playful">
                    ✨ {t('settings.assistant.title')}
                  </h4>
                  <button
                    onClick={() => handleSaveAssistantSettings(!assistantEnabled)}
                    disabled={isSavingAssistant}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      assistantEnabled ? 'bg-primary-500' : 'bg-gray-300'
                    } ${isLoadingAssistant || isSavingAssistant ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    role="switch"
                    aria-checked={assistantEnabled}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        assistantEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                
                {!assistantEnabled ? (
                  <div className="box-playful-highlight p-4">
                    <p className="text-sm text-gray-700 font-playful">
                      {t('settings.assistant.description')}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="box-playful-highlight p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <label className="block text-sm font-bold text-black font-playful mb-1">
                            {t('settings.assistant.showTips')}
                          </label>
                          <p className="text-xs text-gray-600 font-playful">
                            {t('settings.assistant.showTipsDescription')}
                          </p>
                        </div>
                        <button
                          onClick={() => handleSaveAssistantShowTips(!assistantShowTips)}
                          disabled={isSavingAssistant}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            assistantShowTips ? 'bg-primary-500' : 'bg-gray-300'
                          } ${isSavingAssistant ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                          role="switch"
                          aria-checked={assistantShowTips}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              assistantShowTips ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                    
                    <div className="box-playful-highlight p-4 border-2 border-primary-500">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <label className="block text-sm font-bold text-black font-playful mb-1">
                            {t('settings.assistant.resetTutorial')}
                          </label>
                          <p className="text-xs text-gray-600 font-playful">
                            {t('settings.assistant.resetTutorialDescription')}
                          </p>
                        </div>
                        <button
                          onClick={handleResetOnboarding}
                          disabled={isResettingOnboarding || !hasCompletedOnboarding}
                          className="btn-playful-primary px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isResettingOnboarding ? t('common.loading') : t('settings.assistant.resetTutorialButton')}
                        </button>
                      </div>
                      {hasCompletedOnboarding === false && (
                        <p className="text-xs text-gray-500 mt-2 font-playful">
                          {t('settings.user.onboarding.notCompleted') || 'Dokončete onboarding, abyste mohli obnovit tutorial.'}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )

      case 'subscription':
        return (
          <>
            <div>
              <div className="space-y-6">
              {/* Current Subscription Status */}
              <div>
                <h4 className="text-lg font-bold text-black font-playful mb-4">
                  💳 {t('settings.subscription.currentPlan')}
                </h4>
                <div className="box-playful-highlight p-4 border-2 border-primary-500">
                  <Protect
                    plan="premium"
                    fallback={
                      <div>
                        <p className="text-sm font-bold text-black font-playful mb-1">
                          {t('settings.subscription.plan')}
                        </p>
                        <p className="text-lg font-bold text-primary-600 font-playful">
                          {t('settings.subscription.free')}
                        </p>
                      </div>
                    }
                  >
                    <div>
                      <p className="text-sm font-bold text-black font-playful mb-1">
                        {t('settings.subscription.plan')}
                      </p>
                      <p className="text-lg font-bold text-primary-600 font-playful">
                        {t('settings.subscription.premium')}
                      </p>
                    </div>
                  </Protect>
                </div>
              </div>

              {/* Pricing Table */}
              <div>
                <h4 className="text-lg font-bold text-black font-playful mb-4">
                  💎 {t('settings.subscription.choosePlan')}
                </h4>
                <div className="box-playful-highlight p-4">
                  <PricingTable />
                </div>
              </div>

              {/* Billing Management */}
              <div>
                <h4 className="text-lg font-bold text-black font-playful mb-4">
                  📋 {t('settings.subscription.billing')}
                </h4>
                <div className="box-playful-highlight p-4 border-2 border-primary-500">
                  <p className="text-sm text-gray-700 font-playful mb-4">
                    {t('settings.subscription.billingDescription')}
                  </p>
                  <button
                    onClick={() => setShowBillingModal(true)}
                    className="btn-playful-primary px-4 py-2"
                  >
                    {t('settings.subscription.openBilling')}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Billing Modal */}
          {showBillingModal && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4">
              <div className="bg-white rounded-xl shadow-2xl w-auto max-w-[95vw] sm:max-w-3xl md:max-w-4xl lg:max-w-5xl max-h-[90vh] overflow-hidden border-2 border-primary-500 flex flex-col">
                {/* Custom Header */}
                <div className="flex items-center justify-between p-4 flex-shrink-0 border-b-2 border-primary-500 bg-white">
                  <h3 className="text-xl font-bold text-black font-playful">
                    {t('settings.subscription.billing')}
                  </h3>
                  <button
                    onClick={() => setShowBillingModal(false)}
                    className="btn-playful-base p-2"
                    title={t('common.close')}
                  >
                    <span className="text-2xl">×</span>
                  </button>
                </div>
                
                {/* Clerk UserProfile - standardní zobrazení */}
                <div className="flex-1 overflow-hidden">
                  <UserProfile routing="hash" />
                </div>
              </div>
            </div>
          )}
        </>
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
      <div className="hidden md:flex w-64 border-r-2 border-primary-500 bg-white flex-shrink-0 flex flex-col">
        <div className="p-4 flex-1">
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
        
        {/* Language flags */}
        <div className="p-4 border-t-2 border-primary-500">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-semibold text-black font-playful">🌐</span>
            <span className="text-xs font-semibold text-gray-600 font-playful">{t('settings.user.language.title')}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleLocaleChange('cs')}
              disabled={isSavingLocale}
              className={`flex-1 px-3 py-2 rounded-playful-md border-2 transition-all font-playful text-lg ${
                (preferredLocale || locale) === 'cs'
                  ? 'bg-primary-500 text-black border-primary-500 font-semibold'
                  : 'bg-white text-black border-primary-300 hover:bg-primary-50 hover:border-primary-500'
              } ${isSavingLocale ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="Čeština"
            >
              🇨🇿
            </button>
            <button
              onClick={() => handleLocaleChange('en')}
              disabled={isSavingLocale}
              className={`flex-1 px-3 py-2 rounded-playful-md border-2 transition-all font-playful text-lg ${
                (preferredLocale || locale) === 'en'
                  ? 'bg-primary-500 text-black border-primary-500 font-semibold'
                  : 'bg-white text-black border-primary-300 hover:bg-primary-50 hover:border-primary-500'
              } ${isSavingLocale ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="English"
            >
              🇬🇧
            </button>
          </div>
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
                  <div className="fixed right-4 top-16 box-playful-highlight bg-white z-[101] min-w-[200px] flex flex-col">
                    <nav className="py-2 flex-1">
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
                    
                    {/* Language flags */}
                    <div className="p-4 border-t-2 border-primary-500">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-semibold text-black font-playful">🌐</span>
                        <span className="text-xs font-semibold text-gray-600 font-playful">{t('settings.user.language.title')}</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            handleLocaleChange('cs')
                            setMobileMenuOpen(false)
                          }}
                          disabled={isSavingLocale}
                          className={`flex-1 px-3 py-2 rounded-playful-md border-2 transition-all font-playful text-lg ${
                            (preferredLocale || locale) === 'cs'
                              ? 'bg-primary-500 text-black border-primary-500 font-semibold'
                              : 'bg-white text-black border-primary-300 hover:bg-primary-50 hover:border-primary-500'
                          } ${isSavingLocale ? 'opacity-50 cursor-not-allowed' : ''}`}
                          title="Čeština"
                        >
                          🇨🇿
                        </button>
                        <button
                          onClick={() => {
                            handleLocaleChange('en')
                            setMobileMenuOpen(false)
                          }}
                          disabled={isSavingLocale}
                          className={`flex-1 px-3 py-2 rounded-playful-md border-2 transition-all font-playful text-lg ${
                            (preferredLocale || locale) === 'en'
                              ? 'bg-primary-500 text-black border-primary-500 font-semibold'
                              : 'bg-white text-black border-primary-300 hover:bg-primary-50 hover:border-primary-500'
                          } ${isSavingLocale ? 'opacity-50 cursor-not-allowed' : ''}`}
                          title="English"
                        >
                          🇬🇧
                        </button>
                      </div>
                    </div>
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
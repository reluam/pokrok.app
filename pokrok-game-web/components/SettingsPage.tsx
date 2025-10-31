'use client'

import { useState, useEffect, memo } from 'react'
import { Save, Globe, Edit2, Plus, Trash2, Palette } from 'lucide-react'
import { usePageContext } from './PageContext'
import { useTranslations, useLocale, type Locale } from '@/lib/use-translations'
import { colorPalettes, applyColorTheme } from '@/lib/color-utils'
import { useRouter, usePathname } from 'next/navigation'
import { Area } from '@/lib/cesta-db'

interface CategorySettings {
  id: string
  user_id: string
  short_term_days: number
  long_term_days: number
  created_at: Date
  updated_at: Date
}

interface SettingsPageProps {}

export const SettingsPage = memo(function SettingsPage({}: SettingsPageProps = {}) {
  const { setTitle, setSubtitle } = usePageContext()
  const { translations, locale } = useTranslations()
  const currentLocale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'categories' | 'language' | 'appearance' | 'main-panel' | 'steps' | 'areas'>('language')
  
  // Category settings state
  const [categorySettings, setCategorySettings] = useState<CategorySettings | null>(null)
  const [editingCategorySettings, setEditingCategorySettings] = useState(false)
  const [newCategorySettings, setNewCategorySettings] = useState({ shortTermDays: 90, longTermDays: 365 })
  const [isUpdatingGoals, setIsUpdatingGoals] = useState(false)

  // Language settings state
  const [selectedLanguage, setSelectedLanguage] = useState<Locale>(currentLocale)

  // Appearance settings state
  const [primaryColor, setPrimaryColor] = useState('#E8871E') // Default orange
  const [isSavingAppearance, setIsSavingAppearance] = useState(false)

  // Main panel settings state
  const [userSettings, setUserSettings] = useState<{ daily_steps_count: number, daily_reset_hour: number } | null>(null)
  const [newDailyStepsCount, setNewDailyStepsCount] = useState(3)
  const [isSavingWorkflow, setIsSavingWorkflow] = useState(false)

  // Areas settings state
  const [areas, setAreas] = useState<Area[]>([])
  const [editingArea, setEditingArea] = useState<Area | null>(null)
  const [newArea, setNewArea] = useState({ name: '', description: '', color: '#3B82F6', icon: '' })
  const [showNewAreaForm, setShowNewAreaForm] = useState(false)
  const [isSavingArea, setIsSavingArea] = useState(false)
  const [isDeletingArea, setIsDeletingArea] = useState<string | null>(null)

  const colorOptions = colorPalettes

  useEffect(() => {
    if (translations) {
      loadData()
    }
  }, [translations])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Load category settings
      const categoryRes = await fetch('/api/cesta/category-settings')
      if (categoryRes.ok) {
        const categoryData = await categoryRes.json()
        setCategorySettings(categoryData.settings)
        if (categoryData.settings) {
          setNewCategorySettings({
            shortTermDays: categoryData.settings.short_term_days,
            longTermDays: categoryData.settings.long_term_days
          })
        }
      }

      // Load user settings
      const userSettingsRes = await fetch('/api/cesta/user-settings')
      if (userSettingsRes.ok) {
        const userData = await userSettingsRes.json()
        setUserSettings(userData.settings)
        setNewDailyStepsCount(userData.settings?.daily_steps_count || 3)
      }
      
      // Load appearance settings
      const savedPrimaryColor = localStorage.getItem('app-primary-color')
      if (savedPrimaryColor) {
        setPrimaryColor(savedPrimaryColor)
        applyColorTheme(savedPrimaryColor)
      }

      // Load language settings from current locale
      if (currentLocale && (currentLocale === 'cs' || currentLocale === 'en')) {
        setSelectedLanguage(currentLocale)
      }

      // Load areas
      await loadAreas()
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCategorySettingsSave = async () => {
    try {
      const response = await fetch('/api/cesta/category-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          short_term_days: newCategorySettings.shortTermDays,
          long_term_days: newCategorySettings.longTermDays
        })
      })

      if (response.ok) {
        const data = await response.json()
        setCategorySettings(data.settings)
        setEditingCategorySettings(false)
        alert(translations?.settings.settingsSaved || 'Nastavení bylo uloženo!')
      } else {
        const error = await response.json()
        alert(`Chyba při ukládání nastavení: ${error.error || 'Neznámá chyba'}`)
      }
    } catch (error) {
      console.error('Error saving category settings:', error)
      alert(translations?.settings.errorSavingSettings || 'Chyba při ukládání nastavení')
    }
  }

  const handleSettingChange = async (field: string, value: any) => {
    if (!userSettings) return
    
    // Don't allow changing daily_reset_hour as it's now fixed at 4 AM
    if (field === 'daily_reset_hour') {
      return
    }
    
    try {
      const response = await fetch('/api/cesta/user-settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          [field]: value
        })
      })

      if (response.ok) {
        const data = await response.json()
        setUserSettings(data.settings)
        alert('Nastavení bylo uloženo!')
      } else {
        const error = await response.json()
        alert(`Chyba při ukládání nastavení: ${error.error || 'Neznámá chyba'}`)
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Chyba při ukládání nastavení')
    } finally {
      setIsSavingWorkflow(false)
    }
  }

  const handleSaveWorkflowSettings = async () => {
    setIsSavingWorkflow(true)
    try {
      const response = await fetch('/api/cesta/user-settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          daily_steps_count: newDailyStepsCount
        })
      })

      if (response.ok) {
        const data = await response.json()
        setUserSettings(data.settings)
        alert('Nastavení bylo uloženo!')
      } else {
        const error = await response.json()
        alert(`Chyba při ukládání nastavení: ${error.error || 'Neznámá chyba'}`)
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Chyba při ukládání nastavení')
    } finally {
      setIsSavingWorkflow(false)
    }
  }

  const handleLanguageChange = async (newLocale: Locale) => {
    setSelectedLanguage(newLocale)
    
    // Save language preference to localStorage
    localStorage.setItem('app-language', newLocale)
    
    // Change the language by navigating to the same page with new locale
    // Check if path starts with a known locale (cs, en)
    const knownLocales = ['cs', 'en']
    const currentLocale = knownLocales.find(locale => pathname.startsWith(`/${locale}/`))
    
    let currentPath
    if (currentLocale) {
      // Path has known locale, remove it
      currentPath = pathname.substring(`/${currentLocale}`.length)
    } else {
      // Path doesn't have known locale, use as is
      currentPath = pathname
    }
    
    const newPath = `/${newLocale}${currentPath}`
    
    console.log('Current pathname:', pathname)
    console.log('Current locale found:', currentLocale)
    console.log('Current path after removing locale:', currentPath)
    console.log('New path:', newPath)
    
    // Navigate to the new path with the selected language
    router.push(newPath)
  }

  const handleColorChange = async (color: string) => {
    setPrimaryColor(color)
    applyColorTheme(color)
    localStorage.setItem('app-primary-color', color)
    
    setIsSavingAppearance(true)
    try {
      // Here you would typically save the color preference to the server
      // For now, we'll just simulate a delay
      await new Promise(resolve => setTimeout(resolve, 500))
    } catch (error) {
      console.error('Error saving color preference:', error)
    } finally {
      setIsSavingAppearance(false)
    }
  }

  // Areas management functions
  const loadAreas = async () => {
    try {
      const response = await fetch('/api/cesta/areas')
      if (response.ok) {
        const data = await response.json()
        setAreas(data.areas || [])
      }
    } catch (error) {
      console.error('Error loading areas:', error)
    }
  }

  const handleCreateArea = async () => {
    if (!newArea.name.trim()) return

    setIsSavingArea(true)
    try {
      const response = await fetch('/api/cesta/areas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newArea)
      })

      if (response.ok) {
        const data = await response.json()
        setAreas(prev => [...prev, data.area])
        setNewArea({ name: '', description: '', color: '#3B82F6', icon: '' })
        setShowNewAreaForm(false)
      } else {
        console.error('Failed to create area')
      }
    } catch (error) {
      console.error('Error creating area:', error)
    } finally {
      setIsSavingArea(false)
    }
  }

  const handleUpdateArea = async (areaId: string, updates: Partial<Area>) => {
    try {
      const response = await fetch(`/api/cesta/areas/${areaId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates)
      })

      if (response.ok) {
        const data = await response.json()
        setAreas(prev => prev.map(area => area.id === areaId ? data.area : area))
        setEditingArea(null)
      } else {
        console.error('Failed to update area')
      }
    } catch (error) {
      console.error('Error updating area:', error)
    }
  }

  const handleDeleteArea = async (areaId: string) => {
    setIsDeletingArea(areaId)
    try {
      const response = await fetch(`/api/cesta/areas/${areaId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setAreas(prev => prev.filter(area => area.id !== areaId))
      } else {
        console.error('Failed to delete area')
      }
    } catch (error) {
      console.error('Error deleting area:', error)
    } finally {
      setIsDeletingArea(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">{translations?.settings.loadingSettings || 'Načítám nastavení...'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex">
      {/* Left Sidebar */}
      <div className="w-64 bg-gray-50 border-r border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Nastavení</h2>
        <nav className="space-y-2">
          <button
            onClick={() => setActiveTab('categories')}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'categories'
                ? 'bg-primary-100 text-primary-700'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            {translations?.settings.categories || 'Kategorie'}
          </button>
          <button
            onClick={() => setActiveTab('language')}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'language'
                ? 'bg-primary-100 text-primary-700'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            {translations?.settings.language || 'Jazyk'}
          </button>
          <button
            onClick={() => setActiveTab('appearance')}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'appearance'
                ? 'bg-primary-100 text-primary-700'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            {translations?.settings.appearance || 'Zobrazení'}
          </button>
          <button
            onClick={() => setActiveTab('main-panel')}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'main-panel'
                ? 'bg-primary-100 text-primary-700'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            Hlavní panel
          </button>
          <button
            onClick={() => setActiveTab('steps')}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'steps'
                ? 'bg-primary-100 text-primary-700'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            Kroky
          </button>
          <button
            onClick={() => setActiveTab('areas')}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'areas'
                ? 'bg-primary-100 text-primary-700'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            Životní oblasti
          </button>
        </nav>
      </div>

      {/* Right Content Area */}
      <div className="flex-1 p-8">
        <div className="max-w-4xl">
          <div className="space-y-6">
            {activeTab === 'categories' && (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">{translations?.settings.categorySettings || 'Nastavení kategorií'}</h2>
                </div>

                <div className="space-y-6">
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Časové rozmezí kategorií</h3>
                    <p className="text-gray-600 mb-6">
                      Nastavte, jak dlouho se mají cíle považovat za krátkodobé a dlouhodobé.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Krátkodobé cíle (dny)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="365"
                          value={newCategorySettings.shortTermDays}
                          onChange={(e) => setNewCategorySettings(prev => ({ ...prev, shortTermDays: parseInt(e.target.value) || 90 }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Dlouhodobé cíle (dny)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="3650"
                          value={newCategorySettings.longTermDays}
                          onChange={(e) => setNewCategorySettings(prev => ({ ...prev, longTermDays: parseInt(e.target.value) || 365 }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-end mt-6">
                      <button
                        onClick={handleCategorySettingsSave}
                        className="flex items-center space-x-2 bg-primary-500 text-white px-6 py-3 rounded-lg hover:bg-primary-600 transition-colors"
                      >
                        <Save className="w-4 h-4" />
                        <span>Uložit nastavení</span>
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'language' && (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">{translations?.settings.languageSettings || 'Nastavení jazyka'}</h2>
                </div>

                <div className="space-y-6">
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Vyberte jazyk</h3>
                    <p className="text-gray-600 mb-6">
                      Zvolte si jazyk, ve kterém chcete používat aplikaci.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <button
                        onClick={() => handleLanguageChange('cs')}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          selectedLanguage === 'cs'
                            ? 'border-primary-500 ring-2 ring-primary-200 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">🇨🇿</span>
                          <div className="text-left">
                            <p className="font-medium text-gray-900">Čeština</p>
                            <p className="text-sm text-gray-600">Czech</p>
                          </div>
                          {selectedLanguage === 'cs' && (
                            <div className="ml-auto">
                              <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            </div>
                          )}
                        </div>
                      </button>
                      
                      <button
                        onClick={() => handleLanguageChange('en')}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          selectedLanguage === 'en'
                            ? 'border-primary-500 ring-2 ring-primary-200 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">🇺🇸</span>
                          <div className="text-left">
                            <p className="font-medium text-gray-900">English</p>
                            <p className="text-sm text-gray-600">English</p>
                          </div>
                          {selectedLanguage === 'en' && (
                            <div className="ml-auto">
                              <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            </div>
                          )}
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'appearance' && (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">{translations?.settings.appAppearance || 'Zobrazení aplikace'}</h2>
                </div>

                <div className="space-y-6">
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Hlavní barva</h3>
                    <p className="text-gray-600 mb-6">
                      Vyberte si hlavní barvu aplikace, která se bude používat pro tlačítka a akcenty.
                    </p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {colorOptions.map((color) => (
                        <button
                          key={color.name}
                          onClick={() => handleColorChange(color.value)}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            primaryColor === color.value
                              ? 'border-primary-500 ring-2 ring-primary-200'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div
                            className="w-full h-8 rounded mb-2"
                            style={{ backgroundColor: color.value }}
                          />
                          <p className="text-sm font-medium text-gray-700">{color.name}</p>
                        </button>
                      ))}
                    </div>
                    
                    {isSavingAppearance && (
                      <div className="mt-4 flex items-center space-x-2 text-primary-600">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-500"></div>
                        <span className="text-sm">Ukládám...</span>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {activeTab === 'main-panel' && (
              <>
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Hlavní panel</h2>
                  <p className="text-gray-600">
                    Nastavení pro hlavní pracovní plochu a denní plánování.
                  </p>
                </div>

                <div className="space-y-8">
                  {/* Description */}
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <span className="text-2xl">📅</span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-blue-900 mb-2">Denní plánování</h3>
                        <p className="text-blue-800 mb-4">
                          Každý den si naplánujete 3-5 kroků a postupně je plníte. Aplikace vás bude vybízet k doplnění plánu, pokud nebude mít dostatek kroků na dnešek.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Settings */}
                  <div className="bg-gray-50 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-gray-900">Nastavení</h3>
                    </div>

                    <div className="space-y-6">
                      {/* Počet denních kroků - inline editace */}
                      <div className="bg-white rounded-lg p-6 border border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="font-medium text-gray-900">Počet denních kroků</h4>
                            <p className="text-sm text-gray-600">
                              Kolik kroků chcete plánovat každý den
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          <input
                            type="number"
                            min="1"
                            max="10"
                            value={newDailyStepsCount}
                            onChange={(e) => setNewDailyStepsCount(parseInt(e.target.value) || 3)}
                            className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-center text-lg font-semibold"
                          />
                          <span className="text-gray-600">kroků denně</span>
                        </div>
                      </div>

                      {/* Čas resetu denního plánu */}
                      <div className="bg-white rounded-lg p-6 border border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="font-medium text-gray-900">Čas resetu denního plánu</h4>
                            <p className="text-sm text-gray-600">
                              Denní plán se resetuje automaticky ve 4:00 ráno
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              ⚠️ Možnost změny času se připravuje
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          <input
                            type="number"
                            min="0"
                            max="23"
                            value={4}
                            disabled
                            className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center text-lg font-semibold bg-gray-100 text-gray-500 cursor-not-allowed"
                          />
                          <span className="text-gray-500">hodin (04:00 = 4:00 ráno)</span>
                        </div>
                      </div>

                      {/* Uložit tlačítko */}
                      <div className="flex justify-end">
                        <button
                          onClick={handleSaveWorkflowSettings}
                          disabled={isSavingWorkflow}
                          className="flex items-center space-x-2 bg-primary-500 text-white px-6 py-3 rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50"
                        >
                          {isSavingWorkflow ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              <span>Ukládám...</span>
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4" />
                              <span>Uložit nastavení</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'steps' && (
              <>
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Kroky</h2>
                  <p className="text-gray-600">
                    Nastavení pro zobrazení a správu kroků.
                  </p>
                </div>

                {/* View Settings */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Zobrazení kroků</h3>
                  <p className="text-gray-600 mb-6">
                    Nastavte, jak se mají kroky zobrazovat na stránce Kroky.
                  </p>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Výchozí zobrazení
                      </label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                        <option value="list">Seznam</option>
                        <option value="kanban">Kanban</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Výchozí řazení v kanban zobrazení
                      </label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                        <option value="date">Podle data</option>
                        <option value="status">Podle stavu</option>
                        <option value="area">Podle oblasti</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Filter Settings */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Výchozí filtry</h3>
                  <p className="text-gray-600 mb-6">
                    Nastavte, které kroky se mají zobrazovat ve výchozím nastavení.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-900">Datum</h4>
                      <div className="space-y-3">
                        <label className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            defaultChecked
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                          <span className="text-sm text-gray-700">Dnešní kroky</span>
                        </label>
                        <label className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            defaultChecked
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                          <span className="text-sm text-gray-700">Zpožděné kroky</span>
                        </label>
                        <label className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                          <span className="text-sm text-gray-700">Budoucí kroky</span>
                        </label>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-900">Stav</h4>
                      <div className="space-y-3">
                        <label className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                          <span className="text-sm text-gray-700">Dokončené kroky</span>
                        </label>
                        <label className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            defaultChecked
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                          <span className="text-sm text-gray-700">Kroky s cílem</span>
                        </label>
                        <label className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            defaultChecked
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                          <span className="text-sm text-gray-700">Kroky bez cíle</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-end mt-6">
                    <button
                      onClick={() => {
                        // TODO: Implement save functionality for steps settings
                        alert('Nastavení kroků bude implementováno v budoucí verzi')
                      }}
                      className="flex items-center space-x-2 bg-primary-500 text-white px-6 py-3 rounded-lg hover:bg-primary-600 transition-colors"
                    >
                      <Save className="w-4 h-4" />
                      <span>Uložit nastavení</span>
                    </button>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'areas' && (
              <>
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Životní oblasti</h2>
                  <p className="text-gray-600">
                    Spravujte své životní oblasti - přidávejte, upravujte nebo odstraňujte oblasti podle svých potřeb.
                  </p>
                </div>

                {/* Areas List */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Vaše oblasti</h3>
                    <button
                      onClick={() => setShowNewAreaForm(true)}
                      className="flex items-center space-x-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Přidat oblast</span>
                    </button>
                  </div>

                  {/* Add New Area Form */}
                  {showNewAreaForm && (
                    <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                      <h4 className="text-md font-medium text-gray-900 mb-3">Nová oblast</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Název oblasti
                          </label>
                          <input
                            type="text"
                            value={newArea.name}
                            onChange={(e) => setNewArea(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Např. Zdraví, Kariéra, Vztahy..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Popis (volitelný)
                          </label>
                          <input
                            type="text"
                            value={newArea.description}
                            onChange={(e) => setNewArea(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Krátký popis oblasti..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Barva
                          </label>
                          <div className="flex items-center space-x-2">
                            <input
                              type="color"
                              value={newArea.color}
                              onChange={(e) => setNewArea(prev => ({ ...prev, color: e.target.value }))}
                              className="w-10 h-10 border border-gray-300 rounded cursor-pointer"
                            />
                            <span className="text-sm text-gray-600">{newArea.color}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-end space-x-3 mt-4">
                        <button
                          onClick={() => {
                            setShowNewAreaForm(false)
                            setNewArea({ name: '', description: '', color: '#3B82F6', icon: '' })
                          }}
                          className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                        >
                          Zrušit
                        </button>
                        <button
                          onClick={handleCreateArea}
                          disabled={!newArea.name.trim() || isSavingArea}
                          className="flex items-center space-x-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Plus className="w-4 h-4" />
                          <span>{isSavingArea ? 'Přidávám...' : 'Přidat oblast'}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {areas.length === 0 ? (
                    <div className="text-center py-8">
                      <Palette className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">Zatím nemáte žádné oblasti</p>
                      <p className="text-sm text-gray-500 mt-1">Klikněte na "Přidat oblast" výše</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {areas.map((area) => (
                        <div key={area.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: area.color }}
                            />
                            <div>
                              <h4 className="font-medium text-gray-900">{area.name}</h4>
                              {area.description && (
                                <p className="text-sm text-gray-600">{area.description}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => setEditingArea(area)}
                              className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteArea(area.id)}
                              disabled={isDeletingArea === area.id}
                              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Edit Area Modal */}
                {editingArea && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Upravit oblast</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Název oblasti
                          </label>
                          <input
                            type="text"
                            value={editingArea.name}
                            onChange={(e) => setEditingArea(prev => prev ? { ...prev, name: e.target.value } : null)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Popis
                          </label>
                          <input
                            type="text"
                            value={editingArea.description || ''}
                            onChange={(e) => setEditingArea(prev => prev ? { ...prev, description: e.target.value } : null)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Barva
                          </label>
                          <div className="flex items-center space-x-2">
                            <input
                              type="color"
                              value={editingArea.color}
                              onChange={(e) => setEditingArea(prev => prev ? { ...prev, color: e.target.value } : null)}
                              className="w-10 h-10 border border-gray-300 rounded cursor-pointer"
                            />
                            <span className="text-sm text-gray-600">{editingArea.color}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-end space-x-3 mt-6">
                        <button
                          onClick={() => setEditingArea(null)}
                          className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                        >
                          Zrušit
                        </button>
                        <button
                          onClick={() => handleUpdateArea(editingArea.id, editingArea)}
                          className="flex items-center space-x-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
                        >
                          <Save className="w-4 h-4" />
                          <span>Uložit</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
})
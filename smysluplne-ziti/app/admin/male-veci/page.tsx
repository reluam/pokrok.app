'use client'

import { useEffect, useState } from 'react'
import { Plus, Edit2, Trash2, X, ArrowLeft, Loader2, Save, ArrowUp, ArrowDown, FileText, Tags, Upload, Image as ImageIcon } from 'lucide-react'
import Link from 'next/link'
import type { SmallThing, SmallThingsPage } from '@/lib/small-things'
import type { Category } from '@/lib/categories'

export default function AdminMaleVeciPage() {
  const [things, setThings] = useState<SmallThing[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [pageContent, setPageContent] = useState<SmallThingsPage | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [showPageModal, setShowPageModal] = useState(false)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [editingThing, setEditingThing] = useState<SmallThing | null>(null)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    why: '',
    how: '',
    inspirationId: '',
    category: 'bez-kategorie',
    displayOrder: 0,
  })
  const [inspirationItems, setInspirationItems] = useState<any[]>([])
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    displayOrder: 0,
  })
  const [pageFormData, setPageFormData] = useState({
    introText: '',
    image: '',
  })
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadingPageImage, setUploadingPageImage] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    checkAuth()
    loadData()
  }, [])

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/login')
      const data = await res.json()
      setIsAuthenticated(data.authenticated)
    } catch {
      setIsAuthenticated(false)
    }
  }

  const loadData = async () => {
    try {
      const [thingsRes, pageRes, categoriesRes, inspirationRes] = await Promise.all([
        fetch('/api/small-things'),
        fetch('/api/small-things?type=page'),
        fetch('/api/categories'),
        fetch('/api/inspiration'),
      ])

      if (thingsRes.ok) {
        const data = await thingsRes.json()
        setThings(data.things || [])
      }

      if (pageRes.ok) {
        const page = await pageRes.json()
        setPageContent(page)
        // Handle both camelCase and snake_case from API
        setPageFormData({ 
          introText: page.introText || page.intro_text || '', 
          image: page.image || '' 
        })
      }

      if (categoriesRes.ok) {
        const data = await categoriesRes.json()
        setCategories(data.categories || [])
        // Set default category if formData.category doesn't exist
        if (data.categories && data.categories.length > 0) {
          const defaultCat = data.categories.find((c: Category) => c.id === formData.category) || data.categories[0]
          if (!data.categories.find((c: Category) => c.id === formData.category)) {
            setFormData(prev => ({ ...prev, category: defaultCat.id }))
          }
        }
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const url = editingThing ? '/api/small-things' : '/api/small-things'
      const method = editingThing ? 'PUT' : 'POST'
      const body = editingThing
        ? { id: editingThing.id, ...formData }
        : formData

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        setShowModal(false)
        setEditingThing(null)
        const defaultCategory = categories.length > 0 ? categories[0].id : 'bez-kategorie'
        setFormData({ title: '', description: '', why: '', how: '', inspirationId: '', category: defaultCategory, displayOrder: 0 })
        loadData()
      } else {
        const error = await res.json()
        alert(error.error || 'Chyba při ukládání')
      }
    } catch (error) {
      console.error('Error saving:', error)
      alert('Chyba při ukládání')
    } finally {
      setSaving(false)
    }
  }

  const handlePageSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const payload = { 
        type: 'page', 
        introText: pageFormData.introText || '', 
        image: pageFormData.image || null 
      }
      
      console.log('Sending page data:', payload)
      
      const res = await fetch('/api/small-things', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const responseData = await res.json()
      console.log('Response:', responseData)

      if (res.ok) {
        // Reload data to get fresh state
        await loadData()
        // Update pageFormData with saved data from response
        if (responseData.page) {
          const savedPage = responseData.page
          setPageFormData({ 
            introText: savedPage.introText || savedPage.intro_text || '', 
            image: savedPage.image || '' 
          })
          setPageContent(savedPage)
        }
        setShowPageModal(false)
      } else {
        alert(responseData.error || 'Chyba při ukládání')
      }
    } catch (error) {
      console.error('Error saving page:', error)
      alert('Chyba při ukládání: ' + (error instanceof Error ? error.message : 'Neznámá chyba'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Opravdu chcete smazat tuto malou věc?')) return

    try {
      const res = await fetch(`/api/small-things?id=${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        loadData()
      } else {
        const error = await res.json()
        alert(error.error || 'Chyba při mazání')
      }
    } catch (error) {
      console.error('Error deleting:', error)
      alert('Chyba při mazání')
    }
  }

  const handlePageImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingPageImage(true)
    try {
      const uploadFormData = new FormData()
      uploadFormData.append('file', file)

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      })

      if (res.ok) {
        const data = await res.json()
        setPageFormData((prev) => ({ ...prev, image: data.url }))
      } else {
        const error = await res.json()
        alert(error.error || 'Chyba při nahrávání obrázku')
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('Chyba při nahrávání obrázku')
    } finally {
      setUploadingPageImage(false)
    }
  }

  const handleEdit = (thing: SmallThing) => {
    setEditingThing(thing)
    const defaultCategory = categories.length > 0 ? categories[0].id : 'bez-kategorie'
    setFormData({
      title: thing.title,
      description: thing.description,
      why: thing.why || '',
      how: thing.how || '',
      inspirationId: thing.inspirationId || '',
      category: thing.category || defaultCategory,
      displayOrder: thing.displayOrder,
    })
    setShowModal(true)
  }

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const url = '/api/categories'
      const method = editingCategory ? 'PUT' : 'POST'
      const body = editingCategory
        ? { id: editingCategory.id, ...categoryFormData }
        : categoryFormData

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        setShowCategoryModal(false)
        setEditingCategory(null)
        setCategoryFormData({ name: '', displayOrder: 0 })
        loadData()
      } else {
        const error = await res.json()
        alert(error.error || 'Chyba při ukládání')
      }
    } catch (error) {
      console.error('Error saving category:', error)
      alert('Chyba při ukládání')
    } finally {
      setSaving(false)
    }
  }

  const handleCategoryDelete = async (id: string) => {
    if (id === 'bez-kategorie') {
      alert('Nelze smazat výchozí kategorii "Bez kategorie"')
      return
    }

    if (!confirm('Opravdu chcete smazat tuto kategorii? Všechny věci v této kategorii budou přesunuty do kategorie "Bez kategorie".')) return

    try {
      const res = await fetch(`/api/categories?id=${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        loadData()
      } else {
        const error = await res.json()
        alert(error.error || 'Chyba při mazání')
      }
    } catch (error) {
      console.error('Error deleting category:', error)
      alert('Chyba při mazání')
    }
  }

  const handleCategoryEdit = (category: Category) => {
    setEditingCategory(category)
    setCategoryFormData({
      name: category.name,
      displayOrder: category.displayOrder,
    })
  }

  const handleMove = async (id: string, direction: 'up' | 'down') => {
    const index = things.findIndex((t) => t.id === id)
    if (index === -1) return

    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= things.length) return

    const updatedThings = [...things]
    const [moved] = updatedThings.splice(index, 1)
    updatedThings.splice(newIndex, 0, moved)

    // Update display orders
    const updates = updatedThings.map((t, i) => ({
      id: t.id,
      displayOrder: i + 1,
    }))

    try {
      await Promise.all(
        updates.map((update) =>
          fetch('/api/small-things', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(update),
          })
        )
      )
      loadData()
    } catch (error) {
      console.error('Error moving:', error)
      alert('Chyba při přesouvání')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-primary-600" size={32} />
      </div>
    )
  }

  if (isAuthenticated === false) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg mb-4">Neautorizováno</p>
          <Link href="/admin/login" className="text-primary-600 hover:underline">
            Přihlásit se
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pt-24 pb-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary mb-4"
          >
            <ArrowLeft size={20} />
            <span>Zpět do administrace</span>
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-text-primary">Malé věci s velkým dopadem</h1>
              <p className="text-text-secondary mt-2">
                Spravujte malé tipy pro kvalitnější život
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setPageFormData({ 
                    introText: pageContent?.introText || '', 
                    image: pageContent?.image || '' 
                  })
                  setShowPageModal(true)
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-colors"
              >
                <FileText size={20} />
                <span>Upravit úvodní text</span>
              </button>
              <button
                onClick={() => {
                  setShowCategoryModal(true)
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-colors"
              >
                <Tags size={20} />
                <span>Spravovat kategorie</span>
              </button>
              <button
                onClick={() => {
                  setEditingThing(null)
                  const defaultCategory = categories.length > 0 ? categories[0].id : 'bez-kategorie'
                  setFormData({ title: '', description: '', why: '', how: '', inspirationId: '', category: defaultCategory, displayOrder: things.length + 1 })
                  setShowModal(true)
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Plus size={20} />
                <span>Přidat malou věc</span>
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-primary-100 overflow-hidden">
          {things.length === 0 ? (
            <div className="p-12 text-center text-text-secondary">
              <p>Zatím nejsou žádné malé věci. Přidejte první!</p>
            </div>
          ) : (
            <div className="divide-y divide-primary-100">
              {things.map((thing, index) => (
                <div
                  key={thing.id}
                  className="p-6 hover:bg-primary-50/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-sm text-text-secondary font-medium">
                          #{thing.displayOrder}
                        </span>
                        <span className="px-2 py-1 text-xs font-semibold text-primary-600 bg-primary-50 rounded">
                          {categories.find(c => c.id === thing.category)?.name || thing.category}
                        </span>
                        <h3 className="text-lg font-bold text-text-primary">
                          {thing.title}
                        </h3>
                      </div>
                      {thing.how && (
                        <div className="mb-2">
                          <p className="text-sm font-semibold text-text-primary mb-1">Jak?</p>
                          <p className="text-text-secondary text-sm">{thing.how}</p>
                        </div>
                      )}
                      {thing.why && (
                        <div className="mb-2">
                          <p className="text-sm font-semibold text-text-primary mb-1">Proč?</p>
                          <p className="text-text-secondary text-sm">{thing.why}</p>
                        </div>
                      )}
                      {thing.description && (
                        <p className="text-text-secondary mb-2 text-sm italic">{thing.description}</p>
                      )}
                      {thing.inspirationId && (
                        <div className="text-sm text-primary-600">
                          Knihovna: {inspirationItems.find(i => i.id === thing.inspirationId)?.title || thing.inspirationId}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleMove(thing.id, 'up')}
                        disabled={index === 0}
                        className="p-2 text-text-secondary hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Přesunout nahoru"
                      >
                        <ArrowUp size={18} />
                      </button>
                      <button
                        onClick={() => handleMove(thing.id, 'down')}
                        disabled={index === things.length - 1}
                        className="p-2 text-text-secondary hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Přesunout dolů"
                      >
                        <ArrowDown size={18} />
                      </button>
                      <button
                        onClick={() => handleEdit(thing)}
                        className="p-2 text-primary-600 hover:text-primary-700"
                        title="Upravit"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(thing.id)}
                        className="p-2 text-red-600 hover:text-red-700"
                        title="Smazat"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-primary-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-text-primary">
                {editingThing ? 'Upravit malou věc' : 'Přidat malou věc'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false)
                  setEditingThing(null)
                  const defaultCategory = categories.length > 0 ? categories[0].id : 'bez-kategorie'
                  setFormData({ title: '', description: '', why: '', how: '', inspirationId: '', category: defaultCategory, displayOrder: 0 })
                }}
                className="text-text-secondary hover:text-text-primary"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Název *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Např. Klasický budík místo telefonu"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Jak? (volitelné, podporuje Markdown)
                </label>
                <textarea
                  value={formData.how}
                  onChange={(e) => setFormData({ ...formData, how: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-mono text-sm"
                  placeholder="Jak na to? Konkrétní kroky... (Můžeš použít **tučné**, *kurzívu*, seznamy, atd.)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Proč? (volitelné, podporuje Markdown)
                </label>
                <textarea
                  value={formData.why}
                  onChange={(e) => setFormData({ ...formData, why: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-mono text-sm"
                  placeholder="Proč je tato malá věc důležitá? (Můžeš použít **tučné**, *kurzívu*, seznamy, atd.)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Item z knihovny (volitelné)
                </label>
                <select
                  value={formData.inspirationId}
                  onChange={(e) => setFormData({ ...formData, inspirationId: e.target.value })}
                  className="w-full px-4 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">-- Vyber item z knihovny --</option>
                  {inspirationItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      [{item.type === 'article' ? 'Článek' : item.type === 'video' ? 'Video' : 'Kniha'}] {item.title}
                      {item.author && ` - ${item.author}`}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Kategorie *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Pořadí
                </label>
                <input
                  type="number"
                  value={formData.displayOrder}
                  onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                  min="1"
                  className="w-full px-4 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      <span>Ukládám...</span>
                    </>
                  ) : (
                    <>
                      <Save size={20} />
                      <span>Uložit</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setEditingThing(null)
                    const defaultCategory = categories.length > 0 ? categories[0].id : 'bez-kategorie'
                    setFormData({ title: '', description: '', why: '', how: '', inspirationId: '', category: defaultCategory, displayOrder: 0 })
                  }}
                  className="px-4 py-2 border border-primary-200 text-text-primary rounded-lg hover:bg-primary-50"
                >
                  Zrušit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Management Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-primary-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-text-primary">Spravovat kategorie</h2>
              <button
                onClick={() => {
                  setShowCategoryModal(false)
                  setEditingCategory(null)
                  setCategoryFormData({ name: '', displayOrder: 0 })
                }}
                className="text-text-secondary hover:text-text-primary"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6">
              {/* Add/Edit Category Form */}
              <form onSubmit={handleCategorySubmit} className="mb-8 p-4 bg-primary-50 rounded-lg">
                <h3 className="text-lg font-bold text-text-primary mb-4">
                  {editingCategory ? 'Upravit kategorii' : 'Přidat kategorii'}
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Název kategorie *
                    </label>
                    <input
                      type="text"
                      value={categoryFormData.name}
                      onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                      required
                      disabled={editingCategory?.id === 'bez-kategorie'}
                      className="w-full px-4 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50"
                      placeholder="Např. Zdraví"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Pořadí
                    </label>
                    <input
                      type="number"
                      value={categoryFormData.displayOrder}
                      onChange={(e) => setCategoryFormData({ ...categoryFormData, displayOrder: parseInt(e.target.value) || 0 })}
                      min="0"
                      className="w-full px-4 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                    >
                      {saving ? (
                        <>
                          <Loader2 size={20} className="animate-spin" />
                          <span>Ukládám...</span>
                        </>
                      ) : (
                        <>
                          <Save size={20} />
                          <span>Uložit</span>
                        </>
                      )}
                    </button>
                    {editingCategory && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCategory(null)
                          setCategoryFormData({ name: '', displayOrder: 0 })
                        }}
                        className="px-4 py-2 border border-primary-200 text-text-primary rounded-lg hover:bg-primary-50"
                      >
                        Zrušit úpravu
                      </button>
                    )}
                  </div>
                </div>
              </form>

              {/* Categories List */}
              <div>
                <h3 className="text-lg font-bold text-text-primary mb-4">Seznam kategorií</h3>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <div
                      key={category.id}
                      className="flex items-center justify-between p-4 bg-white border border-primary-100 rounded-lg hover:bg-primary-50/50"
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-text-secondary font-medium">
                          #{category.displayOrder}
                        </span>
                        <span className="font-semibold text-text-primary">{category.name}</span>
                        {category.id === 'bez-kategorie' && (
                          <span className="text-xs text-text-secondary">(výchozí)</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleCategoryEdit(category)}
                          disabled={category.id === 'bez-kategorie'}
                          className="p-2 text-primary-600 hover:text-primary-700 disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Upravit"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleCategoryDelete(category.id)}
                          disabled={category.id === 'bez-kategorie'}
                          className="p-2 text-red-600 hover:text-red-700 disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Smazat"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Page Content Modal */}
      {showPageModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-primary-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-text-primary">Upravit úvodní text</h2>
              <button
                onClick={() => setShowPageModal(false)}
                className="text-text-secondary hover:text-text-primary"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handlePageSubmit} className="p-6 space-y-4" noValidate>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Obrázek (volitelné)
                </label>
                <div className="mb-3">
                  <label className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg cursor-pointer hover:bg-primary-700 transition-colors">
                    {uploadingPageImage ? (
                      <>
                        <Loader2 className="animate-spin" size={18} />
                        <span>Nahrávání...</span>
                      </>
                    ) : (
                      <>
                        <Upload size={18} />
                        <span>Nahrát obrázek</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                      onChange={handlePageImageUpload}
                      className="hidden"
                      disabled={uploadingPageImage}
                    />
                  </label>
                  <p className="text-xs text-text-light mt-2">
                    Nebo zadejte URL obrázku níže
                  </p>
                </div>
                <input
                  type="text"
                  value={pageFormData.image || ''}
                  onChange={(e) => setPageFormData({ ...pageFormData, image: e.target.value })}
                  className="w-full px-4 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="https://example.com/image.jpg nebo použijte tlačítko výše"
                />
                {pageFormData.image && (
                  <div className="mt-3">
                    <img 
                      src={pageFormData.image} 
                      alt="Preview" 
                      className="max-w-full h-32 object-cover rounded-lg border-2 border-primary-200"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none'
                      }}
                    />
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Úvodní text (Markdown)
                </label>
                <textarea
                  value={pageFormData.introText || ''}
                  onChange={(e) => setPageFormData({ ...pageFormData, introText: e.target.value })}
                  rows={12}
                  className="w-full px-4 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-mono text-sm"
                  placeholder="Zadejte úvodní text stránky v Markdown formátu..."
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      <span>Ukládám...</span>
                    </>
                  ) : (
                    <>
                      <Save size={20} />
                      <span>Uložit</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowPageModal(false)}
                  className="px-4 py-2 border border-primary-200 text-text-primary rounded-lg hover:bg-primary-50"
                >
                  Zrušit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

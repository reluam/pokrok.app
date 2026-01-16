'use client'

import { useEffect, useState } from 'react'
import { Plus, Edit2, Trash2, X, ArrowLeft, Loader2, Save, ArrowUp, ArrowDown, FileText, Upload, HelpCircle } from 'lucide-react'
import Link from 'next/link'
import type { Question, QuestionsPage } from '@/lib/questions'
import type { Category } from '@/lib/categories'

export default function AdminOtazkyPage() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [pageContent, setPageContent] = useState<QuestionsPage | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [showPageModal, setShowPageModal] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [formData, setFormData] = useState({
    question: '',
    description: '',
    category: 'obecne',
    displayOrder: 0,
  })
  const [pageFormData, setPageFormData] = useState({
    introText: '',
    image: '',
  })
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
      const [questionsRes, pageRes, categoriesRes] = await Promise.all([
        fetch('/api/questions'),
        fetch('/api/questions?type=page'),
        fetch('/api/categories'),
      ])

      if (questionsRes.ok) {
        const data = await questionsRes.json()
        setQuestions(data.questions || [])
      }

      if (pageRes.ok) {
        const page = await pageRes.json()
        setPageContent(page)
        setPageFormData({ 
          introText: page.introText || page.intro_text || '', 
          image: page.image || '' 
        })
      }

      if (categoriesRes.ok) {
        const data = await categoriesRes.json()
        setCategories(data.categories || [])
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
      const url = editingQuestion ? '/api/questions' : '/api/questions'
      const method = editingQuestion ? 'PUT' : 'POST'
      const body = editingQuestion
        ? { id: editingQuestion.id, ...formData }
        : formData

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        setShowModal(false)
        setEditingQuestion(null)
        const defaultCategory = categories.length > 0 ? categories[0].id : 'obecne'
        setFormData({ question: '', description: '', category: defaultCategory, displayOrder: 0 })
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
      
      const res = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const responseData = await res.json()

      if (res.ok) {
        await loadData()
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
    if (!confirm('Opravdu chcete smazat tuto otázku?')) return

    try {
      const res = await fetch(`/api/questions?id=${id}`, {
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

  const handleEdit = (question: Question) => {
    setEditingQuestion(question)
    const defaultCategory = categories.length > 0 ? categories[0].id : 'obecne'
    setFormData({
      question: question.question,
      description: question.description || '',
      category: question.category || defaultCategory,
      displayOrder: question.displayOrder,
    })
    setShowModal(true)
  }

  const handleMove = async (id: string, direction: 'up' | 'down') => {
    const index = questions.findIndex((q) => q.id === id)
    if (index === -1) return

    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= questions.length) return

    const updatedQuestions = [...questions]
    const [moved] = updatedQuestions.splice(index, 1)
    updatedQuestions.splice(newIndex, 0, moved)

    // Update display orders
    const updates = updatedQuestions.map((q, i) => ({
      id: q.id,
      displayOrder: i + 1,
    }))

    try {
      await Promise.all(
        updates.map((update) =>
          fetch('/api/questions', {
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
              <h1 className="text-3xl font-bold text-text-primary">Otázky ke smysluplnému životu</h1>
              <p className="text-text-secondary mt-2">
                Spravujte otázky pro reflexi a seberozvoj
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  if (pageContent) {
                    setPageFormData({ 
                      introText: pageContent.introText || '', 
                      image: pageContent.image || '' 
                    })
                  }
                  setShowPageModal(true)
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-colors"
              >
                <FileText size={20} />
                <span>Upravit úvodní text</span>
              </button>
              <button
                onClick={() => {
                  setEditingQuestion(null)
                  const defaultCategory = categories.length > 0 ? categories[0].id : 'obecne'
                  setFormData({ question: '', description: '', category: defaultCategory, displayOrder: questions.length + 1 })
                  setShowModal(true)
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Plus size={20} />
                <span>Přidat otázku</span>
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-primary-100 overflow-hidden">
          {questions.length === 0 ? (
            <div className="p-12 text-center text-text-secondary">
              <p>Zatím nejsou žádné otázky. Přidejte první!</p>
            </div>
          ) : (
            <div className="divide-y divide-primary-100">
              {questions.map((question, index) => (
                <div
                  key={question.id}
                  className="p-6 hover:bg-primary-50/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-sm text-text-secondary font-medium">
                          #{question.displayOrder}
                        </span>
                        <span className="px-2 py-1 text-xs font-semibold text-primary-600 bg-primary-50 rounded">
                          {categories.find(c => c.id === question.category)?.name || question.category}
                        </span>
                        <h3 className="text-lg font-bold text-text-primary">
                          {question.question}
                        </h3>
                      </div>
                      {question.description && (
                        <p className="text-text-secondary mb-2 line-clamp-2">{question.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleMove(question.id, 'up')}
                        disabled={index === 0}
                        className="p-2 text-text-secondary hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Přesunout nahoru"
                      >
                        <ArrowUp size={18} />
                      </button>
                      <button
                        onClick={() => handleMove(question.id, 'down')}
                        disabled={index === questions.length - 1}
                        className="p-2 text-text-secondary hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Přesunout dolů"
                      >
                        <ArrowDown size={18} />
                      </button>
                      <button
                        onClick={() => handleEdit(question)}
                        className="p-2 text-primary-600 hover:text-primary-700"
                        title="Upravit"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(question.id)}
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
                {editingQuestion ? 'Upravit otázku' : 'Přidat otázku'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false)
                  setEditingQuestion(null)
                  const defaultCategory = categories.length > 0 ? categories[0].id : 'obecne'
                  setFormData({ question: '', description: '', category: defaultCategory, displayOrder: 0 })
                }}
                className="text-text-secondary hover:text-text-primary"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Otázka *
                </label>
                <input
                  type="text"
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Např. Co pro mě znamená smysluplný život?"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Popis (volitelné)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={6}
                  className="w-full px-4 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Rozšířený popis nebo kontext k otázce..."
                />
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
                    setEditingQuestion(null)
                    const defaultCategory = categories.length > 0 ? categories[0].id : 'obecne'
                    setFormData({ question: '', description: '', category: defaultCategory, displayOrder: 0 })
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

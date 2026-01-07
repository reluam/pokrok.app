'use client'

import { useEffect, useMemo, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Loader2, Plus, Save, Trash2, X, Eye, Edit } from 'lucide-react'

type JsonI18n = Record<string, string>

// Function to parse Markdown and render it like HelpView does
function renderMarkdown(content: string, currentLocale: string) {
  if (!content) return null
  
  const lines = content.split('\n')
  const elements: JSX.Element[] = []
  let listItems: string[] = []
  let listType: 'ul' | 'ol' | null = null
  let key = 0

  const flushList = () => {
    if (listItems.length > 0 && listType) {
      const ListTag = listType === 'ul' ? 'ul' : 'ol'
      elements.push(
        <ListTag key={key++} className="list-disc list-inside space-y-1 my-2 ml-4">
          {listItems.map((item, i) => (
            <li key={i} className="text-sm text-gray-600 font-playful">
              {parseInlineMarkdown(item)}
            </li>
          ))}
        </ListTag>
      )
      listItems = []
      listType = null
    }
  }

  const parseInlineMarkdown = (text: string) => {
    // Parse bold **text**
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-black">$1</strong>')
    // Parse italic *text*
    text = text.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
    return <span dangerouslySetInnerHTML={{ __html: text }} />
  }

  lines.forEach((line, i) => {
    const trimmed = line.trim()
    
    // Headings
    if (trimmed.startsWith('### ')) {
      flushList()
      elements.push(
        <h3 key={key++} className="font-semibold text-black font-playful mb-2 mt-4 text-base">
          {parseInlineMarkdown(trimmed.substring(4))}
        </h3>
      )
    } else if (trimmed.startsWith('## ')) {
      flushList()
      elements.push(
        <h2 key={key++} className="font-semibold text-black font-playful mb-3 mt-5 text-lg">
          {parseInlineMarkdown(trimmed.substring(3))}
        </h2>
      )
    } else if (trimmed.startsWith('# ')) {
      flushList()
      elements.push(
        <h1 key={key++} className="font-semibold text-black font-playful mb-4 mt-6 text-xl">
          {parseInlineMarkdown(trimmed.substring(2))}
        </h1>
      )
    }
    // Unordered list
    else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      if (listType !== 'ul') {
        flushList()
        listType = 'ul'
      }
      listItems.push(trimmed.substring(2))
    }
    // Ordered list
    else if (/^\d+\.\s/.test(trimmed)) {
      if (listType !== 'ol') {
        flushList()
        listType = 'ol'
      }
      listItems.push(trimmed.replace(/^\d+\.\s/, ''))
    }
    // Empty line
    else if (trimmed === '') {
      flushList()
      if (i > 0 && i < lines.length - 1) {
        elements.push(<br key={key++} />)
      }
    }
    // Regular paragraph
    else {
      flushList()
      elements.push(
        <p key={key++} className="text-sm text-gray-600 font-playful leading-relaxed my-2">
          {parseInlineMarkdown(trimmed)}
        </p>
      )
    }
  })
  
  flushList()
  return elements
}

interface HelpCategory {
  id: string
  title: JsonI18n
  description?: JsonI18n | null
  slug?: string | null
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

interface HelpSection {
  id: string
  category_id: string
  title: JsonI18n
  content?: JsonI18n | null
  component_key?: string | null
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export function AdminHelpView() {
  const t = useTranslations()
  const locale = useLocale()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)

  const [categories, setCategories] = useState<HelpCategory[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [sections, setSections] = useState<HelpSection[]>([])
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null)
  const [previewMode, setPreviewMode] = useState<Record<string, boolean>>({})

  const selectedCategory = useMemo(
    () => categories.find(c => c.id === selectedCategoryId) || null,
    [categories, selectedCategoryId]
  )

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch('/api/admin/help/categories')
        if (res.status === 403) {
          setIsAdmin(false)
          setLoading(false)
          return
        }
        if (!res.ok) throw new Error('Failed to load categories')
        const data = await res.json()
        setIsAdmin(true)
        setCategories(data)
        // preselect first
        if (data.length > 0 && !selectedCategoryId) {
          setSelectedCategoryId(data[0].id)
        }
      } catch (e: any) {
        setError(e?.message || 'Failed to load')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    const loadSections = async () => {
      if (!selectedCategoryId) {
        setSections([])
        return
      }
      try {
        const res = await fetch(`/api/admin/help/sections?category_id=${selectedCategoryId}`)
        if (!res.ok) throw new Error('Failed to load sections')
        const data = await res.json()
        setSections(data)
      } catch (e: any) {
        setError(e?.message || 'Failed to load sections')
      }
    }
    loadSections()
  }, [selectedCategoryId])

  const handleCreateCategory = async () => {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/help/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: { cs: 'Nová kategorie', en: 'New category' },
          description: { cs: '', en: '' },
          sort_order: categories.length
        })
      })
      if (!res.ok) throw new Error('Failed to create category')
      const created = await res.json()
      setCategories(prev => [...prev, created])
      setSelectedCategoryId(created.id)
    } catch (e: any) {
      setError(e?.message || 'Failed to create category')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateCategory = async (cat: HelpCategory) => {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/help/categories/${cat.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: cat.title,
          description: cat.description,
          slug: cat.slug,
          sort_order: cat.sort_order,
          is_active: cat.is_active
        })
      })
      if (!res.ok) throw new Error('Failed to update category')
      const updated = await res.json()
      setCategories(prev => prev.map(c => (c.id === updated.id ? updated : c)))
    } catch (e: any) {
      setError(e?.message || 'Failed to update category')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Delete category including all its sections?')) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/help/categories/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete category')
      setCategories(prev => prev.filter(c => c.id !== id))
      if (selectedCategoryId === id) setSelectedCategoryId(null)
      setSections([])
    } catch (e: any) {
      setError(e?.message || 'Failed to delete category')
    } finally {
      setSaving(false)
    }
  }

  const handleCreateSection = async () => {
    if (!selectedCategoryId) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/help/sections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category_id: selectedCategoryId,
          title: { cs: 'Nová sekce', en: 'New section' },
          content: { cs: '', en: '' },
          sort_order: sections.length
        })
      })
      if (!res.ok) throw new Error('Failed to create section')
      const created = await res.json()
      setSections(prev => [...prev, created])
    } catch (e: any) {
      setError(e?.message || 'Failed to create section')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateSection = async (section: HelpSection) => {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/help/sections/${section.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: section.title,
          content: section.content,
          component_key: section.component_key,
          sort_order: section.sort_order,
          is_active: section.is_active,
          category_id: section.category_id
        })
      })
      if (!res.ok) throw new Error('Failed to update section')
      const updated = await res.json()
      setSections(prev => prev.map(s => (s.id === updated.id ? updated : s)))
    } catch (e: any) {
      setError(e?.message || 'Failed to update section')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteSection = async (id: string) => {
    if (!confirm('Delete section?')) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/help/sections/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete section')
      setSections(prev => prev.filter(s => s.id !== id))
    } catch (e: any) {
      setError(e?.message || 'Failed to delete section')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (isAdmin === false) {
    return (
      <div className="flex items-center justify-center h-full text-red-600">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-black mb-2">Access Denied</h2>
          <p className="text-gray-600">You do not have permission to access this page.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full bg-white p-6">
      <div className="max-w-7xl mx-auto h-full flex gap-6">
        {/* Categories panel */}
        <div className="w-72 flex-shrink-0 bg-white border-2 border-primary-500 rounded-playful-md flex flex-col">
          <div className="p-3 border-b-2 border-primary-500 flex items-center justify-between">
            <div className="text-sm font-bold text-black">Help Categories</div>
            <button
              onClick={handleCreateCategory}
              className="btn-playful-base px-2 py-1 text-xs bg-primary-500 text-white hover:bg-primary-600"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`w-full text-left px-3 py-2 border-b border-primary-200 hover:bg-primary-50 ${
                  selectedCategoryId === cat.id ? 'bg-primary-100' : ''
                }`}
              >
                <div className="text-sm font-semibold text-black">{cat.title[locale] || cat.title.cs || cat.title.en}</div>
                {cat.slug && <div className="text-xs text-gray-500">{cat.slug}</div>}
              </button>
            ))}
          </div>
        </div>

        {/* Editor panel */}
        <div className="flex-1 min-w-0 bg-white border-2 border-primary-500 rounded-playful-md flex flex-col overflow-hidden">
          {error && (
            <div className="m-4 p-3 bg-red-100 border-2 border-red-500 rounded-playful-md text-red-700">{error}</div>
          )}

          {!selectedCategory ? (
            <div className="flex-1 flex items-center justify-center text-gray-600">Select or create a category</div>
          ) : (
            <>
              {/* Category form */}
              <div className="p-4 border-b-2 border-primary-500">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-black mb-1">Title (Czech)</label>
                    <input
                      type="text"
                      value={selectedCategory.title.cs || ''}
                      onChange={e =>
                        setCategories(prev =>
                          prev.map(c =>
                            c.id === selectedCategory.id ? { ...c, title: { ...c.title, cs: e.target.value } } : c
                          )
                        )
                      }
                      className="w-full px-3 py-2 border-2 border-primary-500 rounded-playful-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-black mb-1">Title (English)</label>
                    <input
                      type="text"
                      value={selectedCategory.title.en || ''}
                      onChange={e =>
                        setCategories(prev =>
                          prev.map(c =>
                            c.id === selectedCategory.id ? { ...c, title: { ...c.title, en: e.target.value } } : c
                          )
                        )
                      }
                      className="w-full px-3 py-2 border-2 border-primary-500 rounded-playful-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-black mb-1">Slug (optional)</label>
                    <input
                      type="text"
                      value={selectedCategory.slug || ''}
                      onChange={e =>
                        setCategories(prev =>
                          prev.map(c => (c.id === selectedCategory.id ? { ...c, slug: e.target.value } : c))
                        )
                      }
                      className="w-full px-3 py-2 border-2 border-primary-500 rounded-playful-sm"
                      placeholder="e.g., getting-started"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-black mb-1">Active</label>
                    <input
                      type="checkbox"
                      checked={selectedCategory.is_active}
                      onChange={e =>
                        setCategories(prev =>
                          prev.map(c => (c.id === selectedCategory.id ? { ...c, is_active: e.target.checked } : c))
                        )
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div>
                    <label className="block text-sm font-semibold text-black mb-1">Description (Czech)</label>
                    <textarea
                      value={selectedCategory.description?.cs || ''}
                      onChange={e =>
                        setCategories(prev =>
                          prev.map(c =>
                            c.id === selectedCategory.id
                              ? { ...c, description: { ...(c.description || {}), cs: e.target.value } }
                              : c
                          )
                        )
                      }
                      className="w-full px-3 py-2 border-2 border-primary-500 rounded-playful-sm min-h-[80px]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-black mb-1">Description (English)</label>
                    <textarea
                      value={selectedCategory.description?.en || ''}
                      onChange={e =>
                        setCategories(prev =>
                          prev.map(c =>
                            c.id === selectedCategory.id
                              ? { ...c, description: { ...(c.description || {}), en: e.target.value } }
                              : c
                          )
                        )
                      }
                      className="w-full px-3 py-2 border-2 border-primary-500 rounded-playful-sm min-h-[80px]"
                    />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={() => handleUpdateCategory(selectedCategory)}
                    disabled={saving}
                    className="btn-playful-base flex items-center gap-2 px-3 py-2 bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    Save category
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(selectedCategory.id)}
                    disabled={saving}
                    className="btn-playful-base flex items-center gap-2 px-3 py-2 bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>

              {/* Sections list - Feed view */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-4 flex items-center justify-between border-b-2 border-primary-500">
                  <div className="text-sm font-bold text-black">Sections</div>
                  <button
                    onClick={handleCreateSection}
                    className="btn-playful-base px-2 py-1 text-xs bg-primary-500 text-white hover:bg-primary-600"
                  >
                    <Plus className="w-4 h-4" />
                    Add section
                  </button>
                </div>
                <div className="p-4 space-y-6">
                  {sections.map(section => {
                    const isExpanded = editingSectionId === section.id
                    const currentContent = section.content?.[locale as 'cs' | 'en'] || section.content?.cs || section.content?.en || ''
                    const currentTitle = section.title[locale as 'cs' | 'en'] || section.title.cs || section.title.en
                    
                    return (
                      <div key={section.id} className="border-2 border-primary-500 rounded-playful-md overflow-hidden">
                        {/* Preview - always visible */}
                        <div 
                          className="cursor-pointer hover:bg-primary-50 transition-colors"
                          onClick={() => setEditingSectionId(isExpanded ? null : section.id)}
                        >
                          <div className="p-6">
                            <div className="box-playful-highlight p-6">
                              <h3 className="font-semibold text-black font-playful mb-4 text-lg">
                                {currentTitle}
                              </h3>
                              <div className="text-sm text-gray-600 font-playful leading-relaxed">
                                {renderMarkdown(currentContent, locale)}
                              </div>
                              {section.component_key && (
                                <div className="mt-4 p-3 bg-primary-100 border-2 border-primary-300 rounded-playful-sm">
                                  <div className="text-xs font-semibold text-primary-700 mb-1">Component:</div>
                                  <div className="text-sm text-primary-600 font-mono">{section.component_key}</div>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="px-6 pb-4 flex items-center justify-between text-xs text-gray-500">
                            <div className="flex items-center gap-4">
                              <span>Order: {section.sort_order}</span>
                              <span className={section.is_active ? 'text-green-600' : 'text-gray-400'}>
                                {section.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                            <div className="text-primary-600 font-semibold">
                              {isExpanded ? 'Click to collapse' : 'Click to edit'}
                            </div>
                          </div>
                        </div>

                        {/* Edit form - expandable */}
                        {isExpanded && (
                          <div className="border-t-2 border-primary-500 bg-white p-6">
                      {/* Header with title and metadata */}
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-semibold text-black mb-1">Title (Czech)</label>
                          <input
                            type="text"
                            value={section.title.cs || ''}
                            onChange={e =>
                              setSections(prev =>
                                prev.map(s =>
                                  s.id === section.id
                                    ? { ...s, title: { ...s.title, cs: e.target.value } }
                                    : s
                                )
                              )
                            }
                            className="w-full px-3 py-2 border-2 border-primary-500 rounded-playful-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-black mb-1">Title (English)</label>
                          <input
                            type="text"
                            value={section.title.en || ''}
                            onChange={e =>
                              setSections(prev =>
                                prev.map(s =>
                                  s.id === section.id
                                    ? { ...s, title: { ...s.title, en: e.target.value } }
                                    : s
                                )
                              )
                            }
                            className="w-full px-3 py-2 border-2 border-primary-500 rounded-playful-sm"
                          />
                        </div>
                      </div>
                      
                      {/* Metadata row */}
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div>
                          <label className="block text-xs font-semibold text-black mb-1">Component key (optional)</label>
                          <input
                            type="text"
                            value={section.component_key || ''}
                            onChange={e =>
                              setSections(prev =>
                                prev.map(s =>
                                  s.id === section.id ? { ...s, component_key: e.target.value } : s
                                )
                              )
                            }
                            className="w-full px-3 py-2 border-2 border-primary-500 rounded-playful-sm"
                            placeholder="e.g., ContactForm, DemoWidget"
                          />
                        </div>
                        <div className="flex items-end gap-4">
                          <div className="flex items-center gap-2">
                            <label className="text-xs font-semibold text-black">Active</label>
                            <input
                              type="checkbox"
                              checked={section.is_active}
                              onChange={e =>
                                setSections(prev =>
                                  prev.map(s =>
                                    s.id === section.id ? { ...s, is_active: e.target.checked } : s
                                  )
                                )
                              }
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="text-xs font-semibold text-black">Order</label>
                            <input
                              type="number"
                              value={section.sort_order}
                              onChange={e =>
                                setSections(prev =>
                                  prev.map(s =>
                                    s.id === section.id
                                      ? { ...s, sort_order: parseInt(e.target.value) || 0 }
                                      : s
                                  )
                                )
                              }
                              className="w-24 px-2 py-1 border-2 border-primary-500 rounded-playful-sm"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Content editors with preview */}
                      <div className="space-y-4 mb-4">
                        {/* Czech content */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-semibold text-black">Content (Czech)</label>
                            <button
                              type="button"
                              onClick={() => setPreviewMode(prev => ({ ...prev, [`${section.id}-cs`]: !prev[`${section.id}-cs`] }))}
                              className="btn-playful-base flex items-center gap-1 px-2 py-1 text-xs bg-primary-100 text-primary-700 hover:bg-primary-200"
                            >
                              {previewMode[`${section.id}-cs`] ? (
                                <>
                                  <Edit className="w-3 h-3" />
                                  Edit
                                </>
                              ) : (
                                <>
                                  <Eye className="w-3 h-3" />
                                  Preview
                                </>
                              )}
                            </button>
                          </div>
                          {previewMode[`${section.id}-cs`] ? (
                            <div className="border-2 border-primary-500 rounded-playful-sm min-h-[300px] p-6 bg-white">
                              <div className="box-playful-highlight p-6">
                                <h3 className="font-semibold text-black font-playful mb-4 text-lg">
                                  {section.title.cs || 'Název sekce'}
                                </h3>
                                <div className="text-sm text-gray-600 font-playful leading-relaxed">
                                  {renderMarkdown(section.content?.cs || '', 'cs')}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <textarea
                              value={section.content?.cs || ''}
                              onChange={e =>
                                setSections(prev =>
                                  prev.map(s =>
                                    s.id === section.id
                                      ? { ...s, content: { ...(s.content || {}), cs: e.target.value } }
                                      : s
                                  )
                                )
                              }
                              className="w-full px-4 py-3 border-2 border-primary-500 rounded-playful-sm min-h-[300px] font-mono text-sm leading-relaxed resize-y bg-white text-black focus:outline-none focus:ring-2 focus:ring-primary-300"
                              placeholder="Napište obsah sekce zde. Můžete použít Markdown formátování:

# Nadpis 1
## Nadpis 2
### Nadpis 3

**Tučný text**
*Kurzíva*

- Seznam položka 1
- Seznam položka 2

1. Číslovaná položka 1
2. Číslovaná položka 2"
                            />
                          )}
                          <p className="mt-1 text-xs text-gray-500">
                            Podporuje Markdown formátování (nadpisy, tučný text, seznamy)
                          </p>
                        </div>
                        
                        {/* English content */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-semibold text-black">Content (English)</label>
                            <button
                              type="button"
                              onClick={() => setPreviewMode(prev => ({ ...prev, [`${section.id}-en`]: !prev[`${section.id}-en`] }))}
                              className="btn-playful-base flex items-center gap-1 px-2 py-1 text-xs bg-primary-100 text-primary-700 hover:bg-primary-200"
                            >
                              {previewMode[`${section.id}-en`] ? (
                                <>
                                  <Edit className="w-3 h-3" />
                                  Edit
                                </>
                              ) : (
                                <>
                                  <Eye className="w-3 h-3" />
                                  Preview
                                </>
                              )}
                            </button>
                          </div>
                          {previewMode[`${section.id}-en`] ? (
                            <div className="border-2 border-primary-500 rounded-playful-sm min-h-[300px] p-6 bg-white">
                              <div className="box-playful-highlight p-6">
                                <h3 className="font-semibold text-black font-playful mb-4 text-lg">
                                  {section.title.en || 'Section title'}
                                </h3>
                                <div className="text-sm text-gray-600 font-playful leading-relaxed">
                                  {renderMarkdown(section.content?.en || '', 'en')}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <textarea
                              value={section.content?.en || ''}
                              onChange={e =>
                                setSections(prev =>
                                  prev.map(s =>
                                    s.id === section.id
                                      ? { ...s, content: { ...(s.content || {}), en: e.target.value } }
                                      : s
                                  )
                                )
                              }
                              className="w-full px-4 py-3 border-2 border-primary-500 rounded-playful-sm min-h-[300px] font-mono text-sm leading-relaxed resize-y bg-white text-black focus:outline-none focus:ring-2 focus:ring-primary-300"
                              placeholder="Write section content here. You can use Markdown formatting:

# Heading 1
## Heading 2
### Heading 3

**Bold text**
*Italic text*

- List item 1
- List item 2

1. Numbered item 1
2. Numbered item 2"
                            />
                          )}
                          <p className="mt-1 text-xs text-gray-500">
                            Supports Markdown formatting (headings, bold text, lists)
                          </p>
                        </div>
                      </div>

                            {/* Action buttons */}
                            <div className="flex items-center gap-2 pt-4 border-t border-primary-200">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleUpdateSection(section)
                                  setEditingSectionId(null)
                                }}
                                disabled={saving}
                                className="btn-playful-base flex items-center gap-2 px-4 py-2 bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50"
                              >
                                <Save className="w-4 h-4" />
                                Save section
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setEditingSectionId(null)
                                }}
                                className="btn-playful-base flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200"
                              >
                                <X className="w-4 h-4" />
                                Cancel
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  if (confirm('Delete section?')) {
                                    handleDeleteSection(section.id)
                                    setEditingSectionId(null)
                                  }
                                }}
                                disabled={saving}
                                className="btn-playful-base flex items-center gap-2 px-3 py-2 bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50 ml-auto"
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                  {sections.length === 0 && (
                    <div className="p-8 text-center text-gray-500">No sections yet. Create the first one.</div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}



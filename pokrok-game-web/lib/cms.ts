import fs from 'fs'
import path from 'path'

export type InspirationIcon = 'book' | 'video' | 'article' | 'thought' | 'webpage' | 'application' | 'downloadable' | 'other'

export type ExperienceLevel = 'beginner' | 'intermediate'

export interface Article {
  id: string
  title: string
  slug: string
  content: string
  image?: string
  categories: string[] // Changed from single category to array
  publishedAt: string
  featured: boolean
  // New inspiration fields
  icon: InspirationIcon
  detail: string
  resource?: string // URL for external resource
  resourceTitle?: string // Display title for the resource
  // New fields for downloadable materials
  downloadUrl?: string // URL for downloadable file
  fileSize?: string // Human readable file size (e.g., "2.5 MB")
  isDownloadable?: boolean // Whether this material can be downloaded
  // Experience level field
  experienceLevel?: ExperienceLevel // Beginner, intermediate, or expert level
}

export interface Category {
  id: string
  name: string
  slug: string
  color?: string
}

const articlesDir = path.join(process.cwd(), 'data', 'articles')
const categoriesDir = path.join(process.cwd(), 'data', 'categories')

// Ensure directories exist
if (!fs.existsSync(articlesDir)) {
  fs.mkdirSync(articlesDir, { recursive: true })
}
if (!fs.existsSync(categoriesDir)) {
  fs.mkdirSync(categoriesDir, { recursive: true })
}

export function getAllArticles(): Article[] {
  try {
    if (!fs.existsSync(articlesDir)) {
      return []
    }
    
    const files = fs.readdirSync(articlesDir)
    const articles = files
      .filter(file => file.endsWith('.json'))
      .map(file => {
        const filePath = path.join(articlesDir, file)
        const content = fs.readFileSync(filePath, 'utf8')
        return JSON.parse(content) as Article
      })
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    
    return articles
  } catch (error) {
    console.error('Error reading articles:', error)
    return []
  }
}

export function getArticleBySlug(slug: string): Article | null {
  try {
    const articles = getAllArticles()
    return articles.find(article => article.slug === slug) || null
  } catch (error) {
    console.error('Error getting article:', error)
    return null
  }
}

export function getArticleById(id: string): Article | null {
  try {
    const articles = getAllArticles()
    return articles.find(article => article.id === id) || null
  } catch (error) {
    console.error('Error getting article:', error)
    return null
  }
}

export function getFeaturedArticles(limit: number = 2): Article[] {
  const articles = getAllArticles()
  return articles.filter(article => article.featured).slice(0, limit)
}

export function saveArticle(article: Article): void {
  try {
    const filePath = path.join(articlesDir, `${article.id}.json`)
    fs.writeFileSync(filePath, JSON.stringify(article, null, 2))
  } catch (error) {
    console.error('Error saving article:', error)
    throw error
  }
}

export function deleteArticle(id: string): void {
  try {
    const filePath = path.join(articlesDir, `${id}.json`)
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }
  } catch (error) {
    console.error('Error deleting article:', error)
    throw error
  }
}

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// Category management functions
export function getAllCategories(): Category[] {
  try {
    if (!fs.existsSync(categoriesDir)) {
      return getDefaultCategories()
    }
    
    const files = fs.readdirSync(categoriesDir)
    const categories = files
      .filter(file => file.endsWith('.json'))
      .map(file => {
        const filePath = path.join(categoriesDir, file)
        const content = fs.readFileSync(filePath, 'utf8')
        return JSON.parse(content) as Category
      })
      .sort((a, b) => a.name.localeCompare(b.name))
    
    return categories.length > 0 ? categories : getDefaultCategories()
  } catch (error) {
    console.error('Error reading categories:', error)
    return getDefaultCategories()
  }
}

export function getDefaultCategories(): Category[] {
  return [
    { id: 'cile', name: 'Cíle', slug: 'cile', color: '#3B82F6' },
    { id: 'planovani', name: 'Plánování', slug: 'planovani', color: '#10B981' },
    { id: 'aktualni-stav', name: 'Aktuální stav', slug: 'aktualni-stav', color: '#F59E0B' },
    { id: 'revize', name: 'Revize', slug: 'revize', color: '#EF4444' },
    { id: 'jine', name: 'Jiné', slug: 'jine', color: '#6B7280' }
  ]
}

export function saveCategory(category: Category): void {
  try {
    const filePath = path.join(categoriesDir, `${category.id}.json`)
    fs.writeFileSync(filePath, JSON.stringify(category, null, 2))
  } catch (error) {
    console.error('Error saving category:', error)
    throw error
  }
}

export function deleteCategory(id: string): void {
  try {
    const filePath = path.join(categoriesDir, `${id}.json`)
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }
  } catch (error) {
    console.error('Error deleting category:', error)
    throw error
  }
}

export function getCategoryBySlug(slug: string): Category | null {
  try {
    const categories = getAllCategories()
    return categories.find(category => category.slug === slug) || null
  } catch (error) {
    console.error('Error getting category:', error)
    return null
  }
}

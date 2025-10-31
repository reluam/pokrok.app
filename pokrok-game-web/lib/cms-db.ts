import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL || 'postgresql://dummy:dummy@dummy/dummy')
import { Article, Category, InspirationIcon } from './cms'

// Database-based CMS functions
export async function getAllArticles(): Promise<Article[]> {
  try {
    const result = await sql`
      SELECT 
        id, title, slug, content, image, categories, 
        published_at as "publishedAt", featured, icon, detail, resource, resource_title as "resourceTitle"
      FROM articles 
      ORDER BY published_at DESC
    `
    return result as Article[]
  } catch (error) {
    console.error('Error fetching articles from database:', error)
    return []
  }
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  try {
    const result = await sql`
      SELECT 
        id, title, slug, content, image, categories, 
        published_at as "publishedAt", featured, icon, detail, resource, resource_title as "resourceTitle"
      FROM articles 
      WHERE slug = ${slug}
      LIMIT 1
    `
    return result[0] as Article || null
  } catch (error) {
    console.error('Error getting article by slug:', error)
    return null
  }
}

export async function getArticleById(id: string): Promise<Article | null> {
  try {
    const result = await sql`
      SELECT 
        id, title, slug, content, image, categories, 
        published_at as "publishedAt", featured, icon, detail, resource, resource_title as "resourceTitle"
      FROM articles 
      WHERE id = ${id}
      LIMIT 1
    `
    return result[0] as Article || null
  } catch (error) {
    console.error('Error getting article by id:', error)
    return null
  }
}

export async function getFeaturedArticles(limit: number = 2): Promise<Article[]> {
  try {
    const result = await sql`
      SELECT 
        id, title, slug, content, image, categories, 
        published_at as "publishedAt", featured, icon, detail, resource, resource_title as "resourceTitle"
      FROM articles 
      WHERE featured = true
      ORDER BY published_at DESC
      LIMIT ${limit}
    `
    return result as Article[]
  } catch (error) {
    console.error('Error fetching featured articles:', error)
    return []
  }
}

export async function saveArticle(article: Article): Promise<void> {
  try {
    await sql`
      INSERT INTO articles (
        id, title, slug, content, image, categories, 
        published_at, featured, icon, detail, resource, resource_title
      ) VALUES (
        ${article.id}, ${article.title}, ${article.slug}, ${article.content}, 
        ${article.image || null}, ${JSON.stringify(article.categories)}, 
        ${article.publishedAt}, ${article.featured}, ${article.icon}, 
        ${article.detail}, ${article.resource || null}, ${article.resourceTitle || null}
      )
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        slug = EXCLUDED.slug,
        content = EXCLUDED.content,
        image = EXCLUDED.image,
        categories = EXCLUDED.categories,
        published_at = EXCLUDED.published_at,
        featured = EXCLUDED.featured,
        icon = EXCLUDED.icon,
        detail = EXCLUDED.detail,
        resource = EXCLUDED.resource,
        resource_title = EXCLUDED.resource_title,
        updated_at = NOW()
    `
  } catch (error) {
    console.error('Error saving article to database:', error)
    throw error
  }
}

export async function deleteArticle(id: string): Promise<void> {
  try {
    await sql`DELETE FROM articles WHERE id = ${id}`
  } catch (error) {
    console.error('Error deleting article from database:', error)
    throw error
  }
}

export async function getAllCategories(): Promise<Category[]> {
  try {
    const result = await sql`
      SELECT id, name, slug, color
      FROM categories 
      ORDER BY name ASC
    `
    return result as Category[]
  } catch (error) {
    console.error('Error fetching categories from database:', error)
    return getDefaultCategories()
  }
}

export async function saveCategory(category: Category): Promise<void> {
  try {
    await sql`
      INSERT INTO categories (id, name, slug, color)
      VALUES (${category.id}, ${category.name}, ${category.slug}, ${category.color || null})
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        slug = EXCLUDED.slug,
        color = EXCLUDED.color
    `
  } catch (error) {
    console.error('Error saving category to database:', error)
    throw error
  }
}

export async function deleteCategory(id: string): Promise<void> {
  try {
    await sql`DELETE FROM categories WHERE id = ${id}`
  } catch (error) {
    console.error('Error deleting category from database:', error)
    throw error
  }
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  try {
    const result = await sql`
      SELECT id, name, slug, color
      FROM categories 
      WHERE slug = ${slug}
      LIMIT 1
    `
    return result[0] as Category || null
  } catch (error) {
    console.error('Error getting category by slug:', error)
    return null
  }
}

// Helper functions (same as before)
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

export function getDefaultCategories(): Category[] {
  return [
    { id: 'cile', name: 'Cíle', slug: 'cile', color: '#3B82F6' },
    { id: 'planovani', name: 'Plánování', slug: 'planovani', color: '#10B981' },
    { id: 'aktualni-stav', name: 'Aktuální stav', slug: 'aktualni-stav', color: '#F59E0B' },
    { id: 'revize', name: 'Revize', slug: 'revize', color: '#EF4444' },
    { id: 'jine', name: 'Jiné', slug: 'jine', color: '#6B7280' }
  ]
}

import { getPool } from './db'

export interface Article {
  id: string
  title: string
  slug: string
  content: string
  excerpt: string
  published: boolean
  createdAt: string
  updatedAt: string
  inspirationIds?: string[] // IDs of inspirations linked to this article
  image?: string // URL to article image
}

export interface ArticlesData {
  articles: Article[]
}

// Get all articles from database
export async function getArticles(): Promise<ArticlesData> {
  try {
    const pool = getPool()
    const result = await pool.query(
      'SELECT * FROM articles ORDER BY "createdAt" DESC'
    )
    return { articles: result.rows }
  } catch (error) {
    console.error('Error fetching articles from database:', error)
    // Fallback to empty array if DB is not available
    return { articles: [] }
  }
}

// Save articles to database
export async function saveArticles(data: ArticlesData): Promise<void> {
  const pool = getPool()
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    
    for (const article of data.articles) {
      await client.query(
        `INSERT INTO articles (id, title, slug, content, excerpt, published, "inspirationIds", image, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (id) DO UPDATE SET
           title = EXCLUDED.title,
           slug = EXCLUDED.slug,
           content = EXCLUDED.content,
           excerpt = EXCLUDED.excerpt,
           published = EXCLUDED.published,
           "inspirationIds" = EXCLUDED."inspirationIds",
           image = EXCLUDED.image,
           "updatedAt" = EXCLUDED."updatedAt"`,
        [
          article.id,
          article.title,
          article.slug,
          article.content,
          article.excerpt,
          article.published,
          article.inspirationIds || [],
          article.image || null,
          article.createdAt,
          article.updatedAt,
        ]
      )
    }
    
    await client.query('COMMIT')
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Error saving articles to database:', error)
    throw new Error('Failed to save articles data')
  } finally {
    client.release()
  }
}

// Get article by slug
export async function getArticleBySlug(slug: string): Promise<Article | null> {
  try {
    const pool = getPool()
    const result = await pool.query(
      'SELECT * FROM articles WHERE slug = $1',
      [slug]
    )
    return result.rows[0] || null
  } catch (error) {
    console.error('Error fetching article by slug:', error)
    return null
  }
}

// Get article by ID
export async function getArticleById(id: string): Promise<Article | null> {
  try {
    const pool = getPool()
    const result = await pool.query(
      'SELECT * FROM articles WHERE id = $1',
      [id]
    )
    return result.rows[0] || null
  } catch (error) {
    console.error('Error fetching article by id:', error)
    return null
  }
}

// Generate slug from title
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Create new article
export async function createArticle(article: Omit<Article, 'id' | 'createdAt' | 'updatedAt'>): Promise<Article> {
  const pool = getPool()
  const client = await pool.connect()
  try {
    const id = Date.now().toString()
    const now = new Date().toISOString()
    
    const result = await client.query(
      `INSERT INTO articles (id, title, slug, content, excerpt, published, "inspirationIds", image, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        id,
        article.title,
        article.slug,
        article.content,
        article.excerpt,
        article.published,
        article.inspirationIds || [],
        article.image || null,
        now,
        now,
      ]
    )
    
    return result.rows[0]
  } finally {
    client.release()
  }
}

// Update article
export async function updateArticle(id: string, updates: Partial<Article>): Promise<Article | null> {
  const pool = getPool()
  const client = await pool.connect()
  try {
    const setClauses: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (updates.title !== undefined) {
      setClauses.push(`title = $${paramIndex++}`)
      values.push(updates.title)
    }
    if (updates.slug !== undefined) {
      setClauses.push(`slug = $${paramIndex++}`)
      values.push(updates.slug)
    }
    if (updates.content !== undefined) {
      setClauses.push(`content = $${paramIndex++}`)
      values.push(updates.content)
    }
    if (updates.excerpt !== undefined) {
      setClauses.push(`excerpt = $${paramIndex++}`)
      values.push(updates.excerpt)
    }
    if (updates.published !== undefined) {
      setClauses.push(`published = $${paramIndex++}`)
      values.push(updates.published)
    }
    if (updates.inspirationIds !== undefined) {
      setClauses.push(`"inspirationIds" = $${paramIndex++}`)
      values.push(updates.inspirationIds)
    }
    if (updates.image !== undefined) {
      setClauses.push(`image = $${paramIndex++}`)
      values.push(updates.image)
    }
    
    setClauses.push(`"updatedAt" = $${paramIndex++}`)
    values.push(new Date().toISOString())
    
    values.push(id)

    const result = await client.query(
      `UPDATE articles SET ${setClauses.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    )

    return result.rows[0] || null
  } finally {
    client.release()
  }
}

// Delete article
export async function deleteArticle(id: string): Promise<boolean> {
  const pool = getPool()
  const client = await pool.connect()
  try {
    const result = await client.query(
      'DELETE FROM articles WHERE id = $1 RETURNING id',
      [id]
    )
    return result.rows.length > 0
  } finally {
    client.release()
  }
}

import { getPool } from './db'

export interface InspirationItem {
  id: string
  title: string
  description: string
  link: string
  type: 'article' | 'video' | 'book'
  author?: string
}

export interface InspirationData {
  articles: InspirationItem[]
  videos: InspirationItem[]
  books: InspirationItem[]
}

// Get all inspiration data from database
export async function getInspirationData(): Promise<InspirationData> {
  try {
    const pool = getPool()
    const result = await pool.query(
      'SELECT * FROM inspiration ORDER BY "createdAt" DESC'
    )
    
    const articles = result.rows.filter(item => item.category === 'articles')
    const videos = result.rows.filter(item => item.category === 'videos')
    const books = result.rows.filter(item => item.category === 'books')
    
    return { articles, videos, books }
  } catch (error) {
    console.error('Error fetching inspiration data from database:', error)
    // Fallback to empty arrays if DB is not available
    return { articles: [], videos: [], books: [] }
  }
}

// Save inspiration data to database
export async function saveInspirationData(data: InspirationData): Promise<void> {
  const pool = getPool()
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    
    // Save articles
    for (const item of data.articles) {
      await client.query(
        `INSERT INTO inspiration (id, title, description, link, type, author, category, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (id) DO UPDATE SET
           title = EXCLUDED.title,
           description = EXCLUDED.description,
           link = EXCLUDED.link,
           type = EXCLUDED.type,
           author = EXCLUDED.author,
           category = EXCLUDED.category,
           "updatedAt" = EXCLUDED."updatedAt"`,
        [
          item.id,
          item.title,
          item.description,
          item.link,
          item.type,
          item.author || null,
          'articles',
          new Date().toISOString(),
          new Date().toISOString(),
        ]
      )
    }
    
    // Save videos
    for (const item of data.videos) {
      await client.query(
        `INSERT INTO inspiration (id, title, description, link, type, author, category, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (id) DO UPDATE SET
           title = EXCLUDED.title,
           description = EXCLUDED.description,
           link = EXCLUDED.link,
           type = EXCLUDED.type,
           author = EXCLUDED.author,
           category = EXCLUDED.category,
           "updatedAt" = EXCLUDED."updatedAt"`,
        [
          item.id,
          item.title,
          item.description,
          item.link,
          item.type,
          item.author || null,
          'videos',
          new Date().toISOString(),
          new Date().toISOString(),
        ]
      )
    }
    
    // Save books
    for (const item of data.books) {
      await client.query(
        `INSERT INTO inspiration (id, title, description, link, type, author, category, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (id) DO UPDATE SET
           title = EXCLUDED.title,
           description = EXCLUDED.description,
           link = EXCLUDED.link,
           type = EXCLUDED.type,
           author = EXCLUDED.author,
           category = EXCLUDED.category,
           "updatedAt" = EXCLUDED."updatedAt"`,
        [
          item.id,
          item.title,
          item.description,
          item.link,
          item.type,
          item.author || null,
          'books',
          new Date().toISOString(),
          new Date().toISOString(),
        ]
      )
    }
    
    await client.query('COMMIT')
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Error saving inspiration data to database:', error)
    throw new Error('Failed to save inspiration data')
  } finally {
    client.release()
  }
}

// Add inspiration item
export async function addInspirationItem(
  category: 'articles' | 'videos' | 'books',
  item: Omit<InspirationItem, 'id'>
): Promise<InspirationItem> {
  const pool = getPool()
  const client = await pool.connect()
  try {
    const id = Date.now().toString()
    const now = new Date().toISOString()
    
    const result = await client.query(
      `INSERT INTO inspiration (id, title, description, link, type, author, category, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        id,
        item.title,
        item.description,
        item.link,
        item.type,
        item.author || null,
        category,
        now,
        now,
      ]
    )
    
    return result.rows[0]
  } finally {
    client.release()
  }
}

// Update inspiration item
export async function updateInspirationItem(
  category: 'articles' | 'videos' | 'books',
  id: string,
  updates: Partial<Omit<InspirationItem, 'id' | 'type'>>
): Promise<InspirationItem | null> {
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
    if (updates.description !== undefined) {
      setClauses.push(`description = $${paramIndex++}`)
      values.push(updates.description)
    }
    if (updates.link !== undefined) {
      setClauses.push(`link = $${paramIndex++}`)
      values.push(updates.link)
    }
    if (updates.author !== undefined) {
      setClauses.push(`author = $${paramIndex++}`)
      values.push(updates.author)
    }
    
    setClauses.push(`"updatedAt" = $${paramIndex++}`)
    values.push(new Date().toISOString())
    
    values.push(id)
    values.push(category)

    const result = await client.query(
      `UPDATE inspiration SET ${setClauses.join(', ')} WHERE id = $${paramIndex} AND category = $${paramIndex + 1} RETURNING *`,
      values
    )

    return result.rows[0] || null
  } finally {
    client.release()
  }
}

// Delete inspiration item
export async function deleteInspirationItem(
  category: 'articles' | 'videos' | 'books',
  id: string
): Promise<boolean> {
  const pool = getPool()
  const client = await pool.connect()
  try {
    const result = await client.query(
      'DELETE FROM inspiration WHERE id = $1 AND category = $2 RETURNING id',
      [id, category]
    )
    return result.rows.length > 0
  } finally {
    client.release()
  }
}

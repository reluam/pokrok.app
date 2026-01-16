import { getPool } from './db'

export interface Category {
  id: string
  name: string
  displayOrder: number
  createdAt: string
  updatedAt: string
}

// Get all categories
export async function getCategories(): Promise<Category[]> {
  try {
    const pool = getPool()
    const result = await pool.query(
      'SELECT * FROM small_things_categories ORDER BY "displayOrder" ASC, name ASC'
    )
    return result.rows
  } catch (error) {
    console.error('Error fetching categories:', error)
    return []
  }
}

// Get category by ID
export async function getCategoryById(id: string): Promise<Category | null> {
  try {
    const pool = getPool()
    const result = await pool.query(
      'SELECT * FROM small_things_categories WHERE id = $1',
      [id]
    )
    return result.rows[0] || null
  } catch (error) {
    console.error('Error fetching category by id:', error)
    return null
  }
}

// Create new category
export async function createCategory(category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Promise<Category> {
  const pool = getPool()
  const client = await pool.connect()
  try {
    // Generate ID from name (slug)
    const id = category.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
    
    const now = new Date().toISOString()
    
    // Get max displayOrder if not provided
    let displayOrder = category.displayOrder
    if (displayOrder === undefined || displayOrder === null) {
      const maxResult = await client.query(
        'SELECT MAX("displayOrder") as max_order FROM small_things_categories'
      )
      displayOrder = (maxResult.rows[0]?.max_order || 0) + 1
    }
    
    const result = await client.query(
      `INSERT INTO small_things_categories (id, name, "displayOrder", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [id, category.name, displayOrder, now, now]
    )
    
    return result.rows[0]
  } finally {
    client.release()
  }
}

// Update category
export async function updateCategory(id: string, updates: Partial<Category>): Promise<Category | null> {
  const pool = getPool()
  const client = await pool.connect()
  try {
    const setClauses: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (updates.name !== undefined) {
      setClauses.push(`name = $${paramIndex++}`)
      values.push(updates.name)
    }
    if (updates.displayOrder !== undefined) {
      setClauses.push(`"displayOrder" = $${paramIndex++}`)
      values.push(updates.displayOrder)
    }
    
    setClauses.push(`"updatedAt" = $${paramIndex++}`)
    values.push(new Date().toISOString())
    
    values.push(id)

    const result = await client.query(
      `UPDATE small_things_categories SET ${setClauses.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    )

    return result.rows[0] || null
  } finally {
    client.release()
  }
}

// Delete category and move items to default category
export async function deleteCategory(id: string): Promise<boolean> {
  const pool = getPool()
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    
    // Check if this is the default "bez-kategorie" category
    if (id === 'bez-kategorie') {
      throw new Error('Nelze smazat výchozí kategorii "Bez kategorie"')
    }
    
    // Move all items from this category to "bez-kategorie"
    await client.query(
      `UPDATE small_things SET category = 'bez-kategorie' WHERE category = $1`,
      [id]
    )
    
    // Delete the category
    const result = await client.query(
      'DELETE FROM small_things_categories WHERE id = $1 RETURNING id',
      [id]
    )
    
    await client.query('COMMIT')
    return result.rows.length > 0
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

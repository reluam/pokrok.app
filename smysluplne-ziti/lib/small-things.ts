import { getPool } from './db'

export interface SmallThing {
  id: string
  title: string
  description: string
  why?: string
  how?: string
  sourceUrl?: string // Deprecated, kept for backward compatibility
  inspirationId?: string
  category: string
  displayOrder: number
  createdAt: string
  updatedAt: string
}

export interface SmallThingsPage {
  id: string
  introText: string
  image?: string
  createdAt: string
  updatedAt: string
}

// Get all small things
export async function getSmallThings(): Promise<SmallThing[]> {
  try {
    const pool = getPool()
    const result = await pool.query(
      'SELECT * FROM small_things ORDER BY category ASC, "displayOrder" ASC, "createdAt" DESC'
    )
    return result.rows
  } catch (error) {
    console.error('Error fetching small things:', error)
    return []
  }
}

// Get small things grouped by category
export async function getSmallThingsByCategory(): Promise<Record<string, SmallThing[]>> {
  try {
    const things = await getSmallThings()
    const grouped: Record<string, SmallThing[]> = {}
    
    for (const thing of things) {
      const category = thing.category || 'bez-kategorie'
      if (!grouped[category]) {
        grouped[category] = []
      }
      grouped[category].push(thing)
    }
    
    return grouped
  } catch (error) {
    console.error('Error fetching small things by category:', error)
    return {}
  }
}

// Get small thing by ID
export async function getSmallThingById(id: string): Promise<SmallThing | null> {
  try {
    const pool = getPool()
    const result = await pool.query(
      'SELECT * FROM small_things WHERE id = $1',
      [id]
    )
    return result.rows[0] || null
  } catch (error) {
    console.error('Error fetching small thing by id:', error)
    return null
  }
}

// Create new small thing
export async function createSmallThing(thing: Omit<SmallThing, 'id' | 'createdAt' | 'updatedAt'>): Promise<SmallThing> {
  const pool = getPool()
  const client = await pool.connect()
  try {
    const id = Date.now().toString()
    const now = new Date().toISOString()
    
    // Get max displayOrder if not provided
    let displayOrder = thing.displayOrder
    if (displayOrder === undefined || displayOrder === null) {
      const maxResult = await client.query(
        'SELECT MAX("displayOrder") as max_order FROM small_things'
      )
      displayOrder = (maxResult.rows[0]?.max_order || 0) + 1
    }
    
    const result = await client.query(
      `INSERT INTO small_things (id, title, description, why, how, source_url, inspiration_id, category, "displayOrder", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        id,
        thing.title,
        thing.description,
        thing.why || null,
        thing.how || null,
        thing.sourceUrl || null,
        thing.inspirationId || null,
        thing.category || 'bez-kategorie',
        displayOrder,
        now,
        now,
      ]
    )
    
    return result.rows[0]
  } finally {
    client.release()
  }
}

// Update small thing
export async function updateSmallThing(id: string, updates: Partial<SmallThing>): Promise<SmallThing | null> {
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
    if (updates.why !== undefined) {
      setClauses.push(`why = $${paramIndex++}`)
      values.push(updates.why || null)
    }
    if (updates.how !== undefined) {
      setClauses.push(`how = $${paramIndex++}`)
      values.push(updates.how || null)
    }
    if (updates.sourceUrl !== undefined) {
      setClauses.push(`source_url = $${paramIndex++}`)
      values.push(updates.sourceUrl || null)
    }
    if (updates.inspirationId !== undefined) {
      setClauses.push(`inspiration_id = $${paramIndex++}`)
      values.push(updates.inspirationId || null)
    }
    if (updates.displayOrder !== undefined) {
      setClauses.push(`"displayOrder" = $${paramIndex++}`)
      values.push(updates.displayOrder)
    }
    if (updates.category !== undefined) {
      setClauses.push(`category = $${paramIndex++}`)
      values.push(updates.category)
    }
    
    setClauses.push(`"updatedAt" = $${paramIndex++}`)
    values.push(new Date().toISOString())
    
    values.push(id)

    const result = await client.query(
      `UPDATE small_things SET ${setClauses.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    )

    return result.rows[0] || null
  } finally {
    client.release()
  }
}

// Delete small thing
export async function deleteSmallThing(id: string): Promise<boolean> {
  const pool = getPool()
  const client = await pool.connect()
  try {
    const result = await client.query(
      'DELETE FROM small_things WHERE id = $1 RETURNING id',
      [id]
    )
    return result.rows.length > 0
  } finally {
    client.release()
  }
}

// Get small things page content
export async function getSmallThingsPage(): Promise<SmallThingsPage | null> {
  try {
    const pool = getPool()
    const result = await pool.query(
      "SELECT * FROM small_things_page WHERE id = 'main'"
    )
    if (result.rows[0]) {
      const row = result.rows[0]
      // Map database column names to interface properties
      return {
        id: row.id,
        introText: row.intro_text || '',
        image: row.image || undefined,
        createdAt: row.createdAt || row.created_at || '',
        updatedAt: row.updatedAt || row.updated_at || '',
      }
    }
    return null
  } catch (error) {
    console.error('Error fetching small things page:', error)
    return null
  }
}

// Update small things page content
export async function updateSmallThingsPage(introText: string, image?: string): Promise<SmallThingsPage> {
  const pool = getPool()
  const client = await pool.connect()
  try {
    const now = new Date().toISOString()
    
    const result = await client.query(
      `INSERT INTO small_things_page (id, intro_text, image, "createdAt", "updatedAt")
       VALUES ('main', $1, $2, $3, $4)
       ON CONFLICT (id) DO UPDATE SET
         intro_text = EXCLUDED.intro_text,
         image = EXCLUDED.image,
         "updatedAt" = EXCLUDED."updatedAt"
       RETURNING *`,
      [introText, image || null, now, now]
    )
    
    const row = result.rows[0]
    // Map database column names to interface properties
    return {
      id: row.id,
      introText: row.intro_text || '',
      image: row.image || undefined,
      createdAt: row.createdAt || row.created_at || '',
      updatedAt: row.updatedAt || row.updated_at || '',
    }
  } finally {
    client.release()
  }
}

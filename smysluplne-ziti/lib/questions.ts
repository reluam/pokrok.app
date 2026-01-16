import { getPool } from './db'

export interface Question {
  id: string
  question: string
  description?: string
  category: string
  displayOrder: number
  createdAt: string
  updatedAt: string
}

export interface QuestionsPage {
  id: string
  introText: string
  image?: string
  createdAt: string
  updatedAt: string
}

// Get all questions
export async function getQuestions(): Promise<Question[]> {
  try {
    const pool = getPool()
    const result = await pool.query(
      'SELECT * FROM questions ORDER BY category ASC, "displayOrder" ASC, "createdAt" DESC'
    )
    return result.rows
  } catch (error) {
    console.error('Error fetching questions:', error)
    return []
  }
}

// Get questions by category
export async function getQuestionsByCategory(): Promise<Record<string, Question[]>> {
  try {
    const things = await getQuestions()
    const grouped: Record<string, Question[]> = {}
    
    for (const thing of things) {
      const category = thing.category || 'obecne'
      if (!grouped[category]) {
        grouped[category] = []
      }
      grouped[category].push(thing)
    }
    
    return grouped
  } catch (error) {
    console.error('Error fetching questions by category:', error)
    return {}
  }
}

// Get question by ID
export async function getQuestionById(id: string): Promise<Question | null> {
  try {
    const pool = getPool()
    const result = await pool.query(
      'SELECT * FROM questions WHERE id = $1',
      [id]
    )
    return result.rows[0] || null
  } catch (error) {
    console.error('Error fetching question by id:', error)
    return null
  }
}

// Create new question
export async function createQuestion(question: Omit<Question, 'id' | 'createdAt' | 'updatedAt'>): Promise<Question> {
  const pool = getPool()
  const client = await pool.connect()
  try {
    const id = Date.now().toString()
    const now = new Date().toISOString()
    
    // Get max displayOrder if not provided
    let displayOrder = question.displayOrder
    if (displayOrder === undefined || displayOrder === null) {
      const maxResult = await client.query(
        'SELECT MAX("displayOrder") as max_order FROM questions'
      )
      displayOrder = (maxResult.rows[0]?.max_order || 0) + 1
    }
    
    const result = await client.query(
      `INSERT INTO questions (id, question, description, category, "displayOrder", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        id,
        question.question,
        question.description || null,
        question.category || 'obecne',
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

// Update question
export async function updateQuestion(
  id: string,
  updates: Partial<Omit<Question, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<Question | null> {
  const pool = getPool()
  const client = await pool.connect()
  try {
    const setClauses: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (updates.question !== undefined) {
      setClauses.push(`question = $${paramIndex++}`)
      values.push(updates.question)
    }
    if (updates.description !== undefined) {
      setClauses.push(`description = $${paramIndex++}`)
      values.push(updates.description || null)
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
      `UPDATE questions SET ${setClauses.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    )

    return result.rows[0] || null
  } finally {
    client.release()
  }
}

// Delete question
export async function deleteQuestion(id: string): Promise<boolean> {
  const pool = getPool()
  const client = await pool.connect()
  try {
    const result = await client.query(
      'DELETE FROM questions WHERE id = $1 RETURNING id',
      [id]
    )
    return result.rows.length > 0
  } finally {
    client.release()
  }
}

// Get questions page content
export async function getQuestionsPage(): Promise<QuestionsPage | null> {
  try {
    const pool = getPool()
    const result = await pool.query(
      "SELECT * FROM questions_page WHERE id = 'main'"
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
    console.error('Error fetching questions page:', error)
    return null
  }
}

// Update questions page content
export async function updateQuestionsPage(introText: string, image?: string): Promise<QuestionsPage> {
  const pool = getPool()
  const client = await pool.connect()
  try {
    const now = new Date().toISOString()
    
    const result = await client.query(
      `INSERT INTO questions_page (id, intro_text, image, "createdAt", "updatedAt")
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

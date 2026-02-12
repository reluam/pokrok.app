import { sql } from './database'
import type { InspirationItem, InspirationType, InspirationData } from './inspiration'

// Re-export types for use in API routes
export type { InspirationItem, InspirationType, InspirationData }

export async function getInspirationData(includeInactive: boolean = true): Promise<InspirationData> {
  try {
    const items = includeInactive
      ? await sql`
          SELECT * FROM inspirations
          ORDER BY created_at DESC
        `
      : await sql`
          SELECT * FROM inspirations
          WHERE is_active = true
          ORDER BY created_at DESC
        `

    const result: InspirationData = {
      blogs: [],
      videos: [],
      books: [],
      articles: [],
      other: [],
    }

    for (const item of items) {
      const inspirationItem: InspirationItem = {
        id: item.id,
        type: item.type as InspirationType,
        title: item.title,
        description: item.description,
        url: item.url,
        author: item.author || undefined,
        content: item.content || undefined,
        thumbnail: item.thumbnail || undefined,
        imageUrl: item.image_url || undefined,
        isActive: item.is_active ?? true,
        createdAt: item.created_at.toISOString(),
        updatedAt: item.updated_at.toISOString(),
      }

      switch (item.type) {
        case 'blog':
          result.blogs.push(inspirationItem)
          break
        case 'video':
          result.videos.push(inspirationItem)
          break
        case 'book':
          result.books.push(inspirationItem)
          break
        case 'article':
          result.articles.push(inspirationItem)
          break
        case 'other':
          result.other.push(inspirationItem)
          break
      }
    }

    return result
  } catch (error) {
    console.error('Error fetching inspiration data from database:', error)
    return {
      blogs: [],
      videos: [],
      books: [],
      articles: [],
      other: [],
    }
  }
}

export async function addInspirationItem(
  type: InspirationType,
  item: Omit<InspirationItem, 'id' | 'type' | 'createdAt' | 'updatedAt'>
): Promise<InspirationItem> {
  const id = Date.now().toString()
  const now = new Date()

  await sql`
    INSERT INTO inspirations (
      id, type, title, description, url, author, content, thumbnail, image_url, is_active, created_at, updated_at
    ) VALUES (
      ${id},
      ${type},
      ${item.title},
      ${item.description},
      ${item.url || null},
      ${item.author || null},
      ${item.content || null},
      ${item.thumbnail || null},
      ${item.imageUrl || null},
      ${item.isActive ?? true},
      ${now},
      ${now}
    )
  `

  return {
    ...item,
    id,
    type,
    isActive: item.isActive ?? true,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  }
}

export async function updateInspirationItem(
  type: InspirationType,
  id: string,
  updates: Partial<Omit<InspirationItem, 'id' | 'type' | 'createdAt'>>
): Promise<InspirationItem | null> {
  const now = new Date()

  // First, get the current item
  const current = await sql`
    SELECT * FROM inspirations
    WHERE id = ${id} AND type = ${type}
  `

  if (current.length === 0) {
    return null
  }

  const currentItem = current[0]

  // Update with provided values or keep current
  const result = await sql`
    UPDATE inspirations
    SET 
      title = ${updates.title ?? currentItem.title},
      description = ${updates.description ?? currentItem.description},
      url = ${updates.url ?? currentItem.url},
      author = ${updates.author ?? currentItem.author},
      content = ${updates.content ?? currentItem.content},
      thumbnail = ${updates.thumbnail ?? currentItem.thumbnail},
      image_url = ${(updates as Partial<InspirationItem>).imageUrl ?? currentItem.image_url ?? null},
      is_active = ${updates.isActive !== undefined ? updates.isActive : (currentItem.is_active ?? true)},
      updated_at = ${now}
    WHERE id = ${id} AND type = ${type}
    RETURNING *
  `

  if (result.length === 0) {
    return null
  }

  const item = result[0]
  return {
    id: item.id,
    type: item.type as InspirationType,
    title: item.title,
    description: item.description,
    url: item.url,
    author: item.author || undefined,
    content: item.content || undefined,
    thumbnail: item.thumbnail || undefined,
    imageUrl: item.image_url || undefined,
    isActive: item.is_active ?? true,
    createdAt: item.created_at.toISOString(),
    updatedAt: item.updated_at.toISOString(),
  }
}

export async function deleteInspirationItem(
  type: InspirationType,
  id: string
): Promise<boolean> {
  const result = await sql`
    DELETE FROM inspirations
    WHERE id = ${id} AND type = ${type}
    RETURNING id
  `

  return result.length > 0
}

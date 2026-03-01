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
      music: [],
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
        bookCoverFit: (item.book_cover_fit === 'contain' || item.book_cover_fit === 'cover') ? item.book_cover_fit : undefined,
        bookCoverPosition: item.book_cover_position && /^(center|top|bottom|left|right|top left|top right|bottom left|bottom right)$/.test(item.book_cover_position) ? item.book_cover_position : undefined,
        bookCoverPositionX: item.book_cover_position_x != null ? Number(item.book_cover_position_x) : undefined,
        bookCoverPositionY: item.book_cover_position_y != null ? Number(item.book_cover_position_y) : undefined,
        isActive: item.is_active ?? true,
        isCurrentListening: item.is_current_listening ?? false,
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
        case 'music':
          result.music.push(inspirationItem)
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
      music: [],
    }
  }
}

export async function addInspirationItem(
  type: InspirationType,
  item: Omit<InspirationItem, 'id' | 'type' | 'createdAt' | 'updatedAt'>
): Promise<InspirationItem> {
  const id = Date.now().toString()
  const now = new Date()

  // When adding music with isCurrentListening=true, unset others
  if (type === 'music' && item.isCurrentListening === true) {
    await sql`UPDATE inspirations SET is_current_listening = false WHERE type = 'music'`
  }

  await sql`
    INSERT INTO inspirations (
      id, type, title, description, url, author, content, thumbnail, image_url, book_cover_fit, book_cover_position, book_cover_position_x, book_cover_position_y, is_active, is_current_listening, created_at, updated_at
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
      ${item.bookCoverFit || null},
      ${item.bookCoverPosition || null},
      ${item.bookCoverPositionX ?? null},
      ${item.bookCoverPositionY ?? null},
      ${item.isActive ?? true},
      ${item.isCurrentListening ?? false},
      ${now},
      ${now}
    )
  `

  return {
    ...item,
    id,
    type,
    isActive: item.isActive ?? true,
    isCurrentListening: item.isCurrentListening ?? false,
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
  const itemUpdates = updates as Partial<InspirationItem>

  // When setting isCurrentListening=true for music, unset others (only one can be "právě poslouchám")
  if (type === 'music' && itemUpdates.isCurrentListening === true) {
    await sql`
      UPDATE inspirations SET is_current_listening = false
      WHERE type = 'music' AND id != ${id}
    `
  }

  const result = await sql`
    UPDATE inspirations
    SET 
      title = ${updates.title ?? currentItem.title},
      description = ${updates.description ?? currentItem.description},
      url = ${updates.url ?? currentItem.url},
      author = ${updates.author ?? currentItem.author},
      content = ${updates.content ?? currentItem.content},
      thumbnail = ${updates.thumbnail ?? currentItem.thumbnail},
      image_url = ${itemUpdates.imageUrl ?? currentItem.image_url ?? null},
      book_cover_fit = ${itemUpdates.bookCoverFit !== undefined ? itemUpdates.bookCoverFit : (currentItem.book_cover_fit ?? null)},
      book_cover_position = ${itemUpdates.bookCoverPosition !== undefined ? itemUpdates.bookCoverPosition : (currentItem.book_cover_position ?? null)},
      book_cover_position_x = ${itemUpdates.bookCoverPositionX !== undefined ? itemUpdates.bookCoverPositionX : (currentItem.book_cover_position_x ?? null)},
      book_cover_position_y = ${itemUpdates.bookCoverPositionY !== undefined ? itemUpdates.bookCoverPositionY : (currentItem.book_cover_position_y ?? null)},
      is_active = ${updates.isActive !== undefined ? updates.isActive : (currentItem.is_active ?? true)},
      is_current_listening = ${itemUpdates.isCurrentListening !== undefined ? itemUpdates.isCurrentListening : (currentItem.is_current_listening ?? false)},
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
    bookCoverFit: (item.book_cover_fit === 'contain' || item.book_cover_fit === 'cover') ? item.book_cover_fit : undefined,
    bookCoverPosition: item.book_cover_position && /^(center|top|bottom|left|right|top left|top right|bottom left|bottom right)$/.test(item.book_cover_position) ? item.book_cover_position : undefined,
    bookCoverPositionX: item.book_cover_position_x != null ? Number(item.book_cover_position_x) : undefined,
    bookCoverPositionY: item.book_cover_position_y != null ? Number(item.book_cover_position_y) : undefined,
    isActive: item.is_active ?? true,
    isCurrentListening: item.is_current_listening ?? false,
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

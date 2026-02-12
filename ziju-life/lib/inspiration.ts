import { readFile, writeFile } from 'fs/promises'
import { join } from 'path'

export type InspirationType = 'blog' | 'video' | 'book' | 'article' | 'other'

export interface InspirationItem {
  id: string
  type: InspirationType
  title: string
  description: string
  url: string
  author?: string
  content?: string // For blog posts
  thumbnail?: string // For videos
  imageUrl?: string // For books – obálka knihy (klik vede na url)
  isActive?: boolean // Whether the inspiration is visible on the website
  createdAt: string
  updatedAt: string
}

export interface InspirationData {
  blogs: InspirationItem[]
  videos: InspirationItem[]
  books: InspirationItem[]
  articles: InspirationItem[]
  other: InspirationItem[]
}

const DATA_FILE = join(process.cwd(), 'data', 'inspiration.json')

export async function getInspirationData(): Promise<InspirationData> {
  try {
    const fileContents = await readFile(DATA_FILE, 'utf8')
    return JSON.parse(fileContents)
  } catch (error) {
    console.error('Error reading inspiration data:', error)
    return {
      blogs: [],
      videos: [],
      books: [],
      articles: [],
      other: [],
    }
  }
}

export async function saveInspirationData(data: InspirationData): Promise<void> {
  try {
    await writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf8')
  } catch (error) {
    console.error('Error saving inspiration data:', error)
    throw new Error('Failed to save inspiration data')
  }
}

export async function addInspirationItem(
  type: InspirationType,
  item: Omit<InspirationItem, 'id' | 'type' | 'createdAt' | 'updatedAt'>
): Promise<InspirationItem> {
  const data = await getInspirationData()
  const newItem: InspirationItem = {
    ...item,
    id: Date.now().toString(),
    type,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  const category = type === 'blog' ? 'blogs' : 
                   type === 'video' ? 'videos' : 
                   type === 'book' ? 'books' : 
                   type === 'article' ? 'articles' : 'other'

  data[category].push(newItem)
  await saveInspirationData(data)
  return newItem
}

export async function updateInspirationItem(
  type: InspirationType,
  id: string,
  updates: Partial<Omit<InspirationItem, 'id' | 'type' | 'createdAt'>>
): Promise<InspirationItem | null> {
  const data = await getInspirationData()
  const category = type === 'blog' ? 'blogs' : 
                   type === 'video' ? 'videos' : 
                   type === 'book' ? 'books' : 
                   type === 'article' ? 'articles' : 'other'

  const index = data[category].findIndex(item => item.id === id)
  if (index === -1) return null

  data[category][index] = {
    ...data[category][index],
    ...updates,
    updatedAt: new Date().toISOString(),
  }

  await saveInspirationData(data)
  return data[category][index]
}

export async function deleteInspirationItem(
  type: InspirationType,
  id: string
): Promise<boolean> {
  const data = await getInspirationData()
  const category = type === 'blog' ? 'blogs' : 
                   type === 'video' ? 'videos' : 
                   type === 'book' ? 'books' : 
                   type === 'article' ? 'articles' : 'other'

  const index = data[category].findIndex(item => item.id === id)
  if (index === -1) return false

  data[category].splice(index, 1)
  await saveInspirationData(data)
  return true
}

import fs from 'fs'
import path from 'path'

const dataFilePath = path.join(process.cwd(), 'data', 'inspiration.json')

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

export function getInspirationData(): InspirationData {
  try {
    const fileContents = fs.readFileSync(dataFilePath, 'utf8')
    return JSON.parse(fileContents)
  } catch (error) {
    console.error('Error reading inspiration data:', error)
    return { articles: [], videos: [], books: [] }
  }
}

export function saveInspirationData(data: InspirationData): void {
  try {
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), 'utf8')
  } catch (error) {
    console.error('Error saving inspiration data:', error)
    throw new Error('Failed to save inspiration data')
  }
}

export function addInspirationItem(
  category: 'articles' | 'videos' | 'books',
  item: Omit<InspirationItem, 'id'>
): InspirationItem {
  const data = getInspirationData()
  const newId = Date.now().toString()
  const newItem: InspirationItem = {
    ...item,
    id: newId,
  }
  
  data[category].push(newItem)
  saveInspirationData(data)
  
  return newItem
}

export function updateInspirationItem(
  category: 'articles' | 'videos' | 'books',
  id: string,
  updates: Partial<Omit<InspirationItem, 'id' | 'type'>>
): InspirationItem | null {
  const data = getInspirationData()
  const index = data[category].findIndex(item => item.id === id)
  
  if (index === -1) {
    return null
  }
  
  data[category][index] = {
    ...data[category][index],
    ...updates,
  }
  
  saveInspirationData(data)
  
  return data[category][index]
}

export function deleteInspirationItem(
  category: 'articles' | 'videos' | 'books',
  id: string
): boolean {
  const data = getInspirationData()
  const index = data[category].findIndex(item => item.id === id)
  
  if (index === -1) {
    return false
  }
  
  data[category].splice(index, 1)
  saveInspirationData(data)
  
  return true
}

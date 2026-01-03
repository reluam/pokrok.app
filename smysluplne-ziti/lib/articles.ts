import fs from 'fs'
import path from 'path'

export interface Article {
  id: string
  title: string
  slug: string
  content: string
  excerpt: string
  published: boolean
  createdAt: string
  updatedAt: string
}

export interface ArticlesData {
  articles: Article[]
}

const dataFilePath = path.join(process.cwd(), 'data', 'articles.json')

export function getArticles(): ArticlesData {
  try {
    const fileContents = fs.readFileSync(dataFilePath, 'utf8')
    return JSON.parse(fileContents)
  } catch (error) {
    return { articles: [] }
  }
}

export function saveArticles(data: ArticlesData): void {
  fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), 'utf8')
}

export function getArticleBySlug(slug: string): Article | null {
  const data = getArticles()
  return data.articles.find(article => article.slug === slug) || null
}

export function getArticleById(id: string): Article | null {
  const data = getArticles()
  return data.articles.find(article => article.id === id) || null
}

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}


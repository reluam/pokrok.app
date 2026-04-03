import { sql } from './database'

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8)
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .substring(0, 80)
}

export async function createCuratedPost(data: {
  type: 'tip' | 'digest'
  title: string
  subtitle?: string
  body_markdown: string
  body_html?: string
  video_script?: string
  cover_image_url?: string
  pipeline_brief_ids?: number[]
  curator_note?: string
  categories?: string[]
  tags?: string[]
  status?: string
  is_premium?: boolean
  week_number?: number
  week_year?: number
}) {
  const id = generateId()
  const baseSlug = slugify(data.title)
  const slug = `${baseSlug}-${id.substring(0, 5)}`

  const result = await sql`
    INSERT INTO curated_posts (
      id, slug, type, title, subtitle, body_markdown, body_html, video_script,
      cover_image_url, pipeline_brief_ids, curator_note, categories, tags,
      status, is_premium, published_at, week_number, week_year
    ) VALUES (
      ${id}, ${slug}, ${data.type}, ${data.title}, ${data.subtitle || null},
      ${data.body_markdown}, ${data.body_html || null}, ${data.video_script || null},
      ${data.cover_image_url || null}, ${data.pipeline_brief_ids || []},
      ${data.curator_note || null}, ${data.categories || []}, ${data.tags || []},
      ${data.status || 'draft'}, ${data.is_premium || false},
      ${data.status === 'published' ? new Date().toISOString() : null},
      ${data.week_number || null}, ${data.week_year || null}
    ) RETURNING *
  `
  return result[0]
}

export async function updateCuratedPost(id: string, data: Partial<{
  title: string
  subtitle: string
  body_markdown: string
  body_html: string
  video_script: string
  cover_image_url: string
  pipeline_brief_ids: number[]
  curator_note: string
  categories: string[]
  tags: string[]
  status: string
  is_premium: boolean
}>) {
  // Handle publish transition
  const publishClause = data.status === 'published' ? sql`, published_at = COALESCE(published_at, NOW())` : sql``

  await sql`
    UPDATE curated_posts SET
      title = COALESCE(${data.title || null}, title),
      subtitle = COALESCE(${data.subtitle ?? null}, subtitle),
      body_markdown = COALESCE(${data.body_markdown || null}, body_markdown),
      body_html = COALESCE(${data.body_html || null}, body_html),
      video_script = COALESCE(${data.video_script ?? null}, video_script),
      cover_image_url = COALESCE(${data.cover_image_url ?? null}, cover_image_url),
      pipeline_brief_ids = COALESCE(${data.pipeline_brief_ids || null}, pipeline_brief_ids),
      curator_note = COALESCE(${data.curator_note ?? null}, curator_note),
      categories = COALESCE(${data.categories || null}, categories),
      tags = COALESCE(${data.tags || null}, tags),
      status = COALESCE(${data.status || null}, status),
      is_premium = COALESCE(${data.is_premium ?? null}, is_premium),
      updated_at = NOW()
      ${publishClause}
    WHERE id = ${id}
  `
}

export async function getCuratedPost(slug: string) {
  const result = await sql`
    SELECT * FROM curated_posts WHERE slug = ${slug}
  `
  return result[0] || null
}

export async function getCuratedPostById(id: string) {
  const result = await sql`
    SELECT * FROM curated_posts WHERE id = ${id}
  `
  return result[0] || null
}

export async function listCuratedPosts(options: {
  type?: string
  tag?: string
  status?: string
  page?: number
  limit?: number
} = {}) {
  const { type, tag, status = 'published', page = 1, limit = 20 } = options
  const offset = (page - 1) * limit

  // "ostatní" = everything NOT kniha, video, článek
  const isOstatni = tag === 'ostatní'
  const excludedTags = ['kniha', 'video', 'článek']

  const posts = await sql`
    SELECT * FROM curated_posts
    WHERE status = ${status}
      AND (${type}::text IS NULL OR type = ${type})
      AND (
        ${tag}::text IS NULL
        OR (${isOstatni} AND NOT (tags && ${excludedTags}::text[]))
        OR (NOT ${isOstatni} AND ${tag}::text = ANY(tags))
      )
    ORDER BY published_at DESC NULLS LAST, created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `

  const countResult = await sql`
    SELECT COUNT(*)::int as total FROM curated_posts
    WHERE status = ${status}
      AND (${type}::text IS NULL OR type = ${type})
      AND (
        ${tag}::text IS NULL
        OR (${isOstatni} AND NOT (tags && ${excludedTags}::text[]))
        OR (NOT ${isOstatni} AND ${tag}::text = ANY(tags))
      )
  `

  return {
    posts,
    total: countResult[0]?.total || 0,
    page,
    limit,
    totalPages: Math.ceil((countResult[0]?.total || 0) / limit),
  }
}

export async function getAllPublishedPostsFull() {
  const posts = await sql`
    SELECT id, slug, type, title, subtitle, body_markdown, categories, tags
    FROM curated_posts
    WHERE status = 'published'
    ORDER BY published_at DESC NULLS LAST
  `
  return posts as {
    id: string
    slug: string
    type: string
    title: string
    subtitle: string | null
    body_markdown: string
    categories: string[]
    tags: string[]
  }[]
}

export async function deleteCuratedPost(id: string) {
  await sql`DELETE FROM curated_posts WHERE id = ${id}`
}

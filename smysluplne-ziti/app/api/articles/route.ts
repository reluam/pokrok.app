import { NextRequest, NextResponse } from 'next/server'
import { getArticles, saveArticles, getArticleById, generateSlug } from '@/lib/articles'
import { cookies } from 'next/headers'

async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies()
  const authCookie = cookieStore.get('admin-auth')
  return authCookie?.value === 'authenticated'
}

// GET - získat všechny články nebo jeden článek
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const id = searchParams.get('id')
  const slug = searchParams.get('slug')
  const published = searchParams.get('published')

  const data = getArticles()

  if (id) {
    const article = getArticleById(id)
    if (!article) {
      return NextResponse.json({ error: 'Článek nenalezen' }, { status: 404 })
    }
    return NextResponse.json(article)
  }

  if (slug) {
    const article = data.articles.find(a => a.slug === slug)
    if (!article) {
      return NextResponse.json({ error: 'Článek nenalezen' }, { status: 404 })
    }
    // Pro veřejné zobrazení vracíme pouze publikované články
    if (published === 'true' && !article.published) {
      return NextResponse.json({ error: 'Článek nenalezen' }, { status: 404 })
    }
    return NextResponse.json(article)
  }

  // Pokud je požadavek na publikované články (veřejné API)
  if (published === 'true') {
    const publishedArticles = data.articles
      .filter(a => a.published)
      .map(({ content, ...rest }) => rest) // Odstraníme content pro seznam
    return NextResponse.json({ articles: publishedArticles })
  }

  // Pro admin vracíme všechny články
  const authenticated = await isAuthenticated()
  if (!authenticated) {
    return NextResponse.json({ error: 'Neautorizováno' }, { status: 401 })
  }

  return NextResponse.json(data)
}

// POST - vytvořit nový článek
export async function POST(request: NextRequest) {
  const authenticated = await isAuthenticated()
  if (!authenticated) {
    return NextResponse.json({ error: 'Neautorizováno' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { title, content, excerpt, published, inspirationIds, image } = body

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Název a obsah jsou povinné' },
        { status: 400 }
      )
    }

    const data = getArticles()
    const slug = generateSlug(title)
    
    // Kontrola unikátnosti slug
    let finalSlug = slug
    let counter = 1
    while (data.articles.some(a => a.slug === finalSlug)) {
      finalSlug = `${slug}-${counter}`
      counter++
    }

    const newArticle = {
      id: Date.now().toString(),
      title,
      slug: finalSlug,
      content,
      excerpt: excerpt || (content && content.length > 200 ? content.substring(0, 200) + '...' : content),
      published: published || false,
      inspirationIds: Array.isArray(inspirationIds) ? inspirationIds : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    data.articles.push(newArticle)
    saveArticles(data)

    return NextResponse.json(newArticle, { status: 201 })
  } catch (error) {
    console.error('Error creating article:', error)
    return NextResponse.json(
      { error: 'Chyba při vytváření článku' },
      { status: 500 }
    )
  }
}

// PUT - aktualizovat článek
export async function PUT(request: NextRequest) {
  const authenticated = await isAuthenticated()
  if (!authenticated) {
    return NextResponse.json({ error: 'Neautorizováno' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { id, title, content, excerpt, published, slug, inspirationIds, image } = body

    if (!id) {
      return NextResponse.json(
        { error: 'ID článku je povinné' },
        { status: 400 }
      )
    }

    const data = getArticles()
    const articleIndex = data.articles.findIndex(a => a.id === id)

    if (articleIndex === -1) {
      return NextResponse.json(
        { error: 'Článek nenalezen' },
        { status: 404 }
      )
    }

    const existingArticle = data.articles[articleIndex]
    let finalSlug = slug || existingArticle.slug

    // Pokud se změnil název, vygeneruj nový slug
    if (title && title !== existingArticle.title) {
      finalSlug = generateSlug(title)
      // Kontrola unikátnosti
      let counter = 1
      while (data.articles.some((a, idx) => a.slug === finalSlug && idx !== articleIndex)) {
        finalSlug = `${generateSlug(title)}-${counter}`
        counter++
      }
    }

    const finalContent = content || existingArticle.content
    const finalExcerpt = excerpt || existingArticle.excerpt || (finalContent && finalContent.length > 200 ? finalContent.substring(0, 200) + '...' : finalContent)
    
    data.articles[articleIndex] = {
      ...existingArticle,
      title: title || existingArticle.title,
      slug: finalSlug,
      content: finalContent,
      excerpt: finalExcerpt,
      published: published !== undefined ? published : existingArticle.published,
      inspirationIds: Array.isArray(inspirationIds) ? inspirationIds : (existingArticle.inspirationIds || []),
      image: image !== undefined ? image : existingArticle.image,
      updatedAt: new Date().toISOString(),
    }

    saveArticles(data)

    return NextResponse.json(data.articles[articleIndex])
  } catch (error) {
    console.error('Error updating article:', error)
    return NextResponse.json(
      { error: 'Chyba při aktualizaci článku' },
      { status: 500 }
    )
  }
}

// DELETE - smazat článek
export async function DELETE(request: NextRequest) {
  const authenticated = await isAuthenticated()
  if (!authenticated) {
    return NextResponse.json({ error: 'Neautorizováno' }, { status: 401 })
  }

  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json(
      { error: 'ID článku je povinné' },
      { status: 400 }
    )
  }

  const data = getArticles()
  const articleIndex = data.articles.findIndex(a => a.id === id)

  if (articleIndex === -1) {
    return NextResponse.json(
      { error: 'Článek nenalezen' },
      { status: 404 }
    )
  }

  data.articles.splice(articleIndex, 1)
  saveArticles(data)

  return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting article:', error)
    return NextResponse.json(
      { error: 'Chyba při mazání článku' },
      { status: 500 }
    )
  }
}


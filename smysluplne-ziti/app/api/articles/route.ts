import { NextRequest, NextResponse } from 'next/server'
import { getArticles, saveArticles, getArticleById, getArticleBySlug, generateSlug, createArticle, updateArticle, deleteArticle } from '@/lib/articles'
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

  if (id) {
    const article = await getArticleById(id)
    if (!article) {
      return NextResponse.json({ error: 'Článek nenalezen' }, { status: 404 })
    }
    return NextResponse.json(article)
  }

  if (slug) {
    const article = await getArticleBySlug(slug)
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
    const data = await getArticles()
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

  const data = await getArticles()
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
    const { title, content, excerpt, published, featured, featuredOrder, inspirationIds, image } = body

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Název a obsah jsou povinné' },
        { status: 400 }
      )
    }

    const data = await getArticles()
    const slug = generateSlug(title)
    
    // Kontrola unikátnosti slug
    let finalSlug = slug
    let counter = 1
    while (data.articles.some(a => a.slug === finalSlug)) {
      finalSlug = `${slug}-${counter}`
      counter++
    }

    const newArticle = await createArticle({
      title,
      slug: finalSlug,
      content,
      excerpt: excerpt || (content && content.length > 200 ? content.substring(0, 200) + '...' : content),
      published: published || false,
      inspirationIds: Array.isArray(inspirationIds) ? inspirationIds : [],
      image: image || '',
    })

    return NextResponse.json(newArticle, { status: 201 })
  } catch (error: any) {
    console.error('Error creating article:', error)
    return NextResponse.json(
      { error: error.message || 'Chyba při vytváření článku' },
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
    const { id, title, content, excerpt, published, featured, featuredOrder, slug, inspirationIds, image } = body

    if (!id) {
      return NextResponse.json(
        { error: 'ID článku je povinné' },
        { status: 400 }
      )
    }

    const existingArticle = await getArticleById(id)
    if (!existingArticle) {
      return NextResponse.json(
        { error: 'Článek nenalezen' },
        { status: 404 }
      )
    }

    let finalSlug = slug || existingArticle.slug

    // Pokud se změnil název, vygeneruj nový slug
    if (title && title !== existingArticle.title) {
      finalSlug = generateSlug(title)
      // Kontrola unikátnosti
      const data = await getArticles()
      let counter = 1
      while (data.articles.some(a => a.slug === finalSlug && a.id !== id)) {
        finalSlug = `${generateSlug(title)}-${counter}`
        counter++
      }
    }

    const finalContent = content || existingArticle.content
    const finalExcerpt = excerpt || existingArticle.excerpt || (finalContent && finalContent.length > 200 ? finalContent.substring(0, 200) + '...' : finalContent)
    
    const updatedArticle = await updateArticle(id, {
      title: title || existingArticle.title,
      slug: finalSlug,
      content: finalContent,
      excerpt: finalExcerpt,
      published: published !== undefined ? published : existingArticle.published,
      featured: featured !== undefined ? featured : (existingArticle.featured || false),
      featuredOrder: featuredOrder !== undefined ? featuredOrder : (existingArticle.featuredOrder || 0),
      inspirationIds: Array.isArray(inspirationIds) ? inspirationIds : (existingArticle.inspirationIds || []),
      image: image !== undefined ? image : existingArticle.image,
    })

    if (!updatedArticle) {
      return NextResponse.json(
        { error: 'Chyba při aktualizaci článku' },
        { status: 500 }
      )
    }

    return NextResponse.json(updatedArticle)
  } catch (error: any) {
    console.error('Error updating article:', error)
    return NextResponse.json(
      { error: error.message || 'Chyba při aktualizaci článku' },
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

    const deleted = await deleteArticle(id)

    if (!deleted) {
      return NextResponse.json(
        { error: 'Článek nenalezen' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting article:', error)
    return NextResponse.json(
      { error: error.message || 'Chyba při mazání článku' },
      { status: 500 }
    )
  }
}


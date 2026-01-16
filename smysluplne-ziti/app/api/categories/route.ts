import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '@/lib/categories'

async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies()
  const authCookie = cookieStore.get('admin-auth')
  return authCookie?.value === 'authenticated'
}

// GET - get all categories
export async function GET(request: NextRequest) {
  try {
    const categories = await getCategories()
    return NextResponse.json({ categories })
  } catch (error: any) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { error: error.message || 'Chyba při načítání kategorií' },
      { status: 500 }
    )
  }
}

// POST - create new category
export async function POST(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Neautorizováno' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { name, displayOrder } = body

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Název kategorie je povinný' },
        { status: 400 }
      )
    }

    const category = await createCategory({
      name: name.trim(),
      displayOrder: displayOrder || 0,
    })

    return NextResponse.json({ success: true, category })
  } catch (error: any) {
    console.error('Error creating category:', error)
    return NextResponse.json(
      { error: error.message || 'Chyba při vytváření kategorie' },
      { status: 500 }
    )
  }
}

// PUT - update category
export async function PUT(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Neautorizováno' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json(
        { error: 'ID kategorie je povinné' },
        { status: 400 }
      )
    }

    const category = await updateCategory(id, updates)
    if (!category) {
      return NextResponse.json(
        { error: 'Kategorie nenalezena' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, category })
  } catch (error: any) {
    console.error('Error updating category:', error)
    return NextResponse.json(
      { error: error.message || 'Chyba při aktualizaci kategorie' },
      { status: 500 }
    )
  }
}

// DELETE - delete category
export async function DELETE(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Neautorizováno' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'ID kategorie je povinné' },
        { status: 400 }
      )
    }

    const deleted = await deleteCategory(id)
    if (!deleted) {
      return NextResponse.json(
        { error: 'Kategorie nenalezena' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting category:', error)
    return NextResponse.json(
      { error: error.message || 'Chyba při mazání kategorie' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import {
  getSmallThings,
  createSmallThing,
  updateSmallThing,
  deleteSmallThing,
  getSmallThingsPage,
  updateSmallThingsPage,
} from '@/lib/small-things'

async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies()
  const authCookie = cookieStore.get('admin-auth')
  return authCookie?.value === 'authenticated'
}

// GET - get all small things or page content
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    if (type === 'page') {
      const page = await getSmallThingsPage()
      return NextResponse.json(page || { id: 'main', introText: '', image: undefined, createdAt: '', updatedAt: '' })
    }

    const things = await getSmallThings()
    return NextResponse.json({ things })
  } catch (error: any) {
    console.error('Error fetching small things:', error)
    return NextResponse.json(
      { error: error.message || 'Chyba při načítání malých věcí' },
      { status: 500 }
    )
  }
}

// POST - create new small thing or update page
export async function POST(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Neautorizováno' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { type, ...data } = body

    if (type === 'page') {
      const page = await updateSmallThingsPage(data.introText || '', data.image)
      return NextResponse.json({ success: true, page })
    }

    const thing = await createSmallThing({
      title: data.title,
      description: data.description,
      why: data.why,
      how: data.how,
      inspirationId: data.inspirationId,
      category: data.category,
      displayOrder: data.displayOrder,
    })

    return NextResponse.json({ success: true, thing })
  } catch (error: any) {
    console.error('Error creating small thing:', error)
    return NextResponse.json(
      { error: error.message || 'Chyba při vytváření malé věci' },
      { status: 500 }
    )
  }
}

// PUT - update small thing
export async function PUT(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Neautorizováno' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { id, ...updates } = body

    const thing = await updateSmallThing(id, updates)
    if (!thing) {
      return NextResponse.json({ error: 'Malá věc nenalezena' }, { status: 404 })
    }

    return NextResponse.json({ success: true, thing })
  } catch (error: any) {
    console.error('Error updating small thing:', error)
    return NextResponse.json(
      { error: error.message || 'Chyba při aktualizaci malé věci' },
      { status: 500 }
    )
  }
}

// DELETE - delete small thing
export async function DELETE(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Neautorizováno' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID není zadáno' }, { status: 400 })
    }

    const deleted = await deleteSmallThing(id)
    if (!deleted) {
      return NextResponse.json({ error: 'Malá věc nenalezena' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting small thing:', error)
    return NextResponse.json(
      { error: error.message || 'Chyba při mazání malé věci' },
      { status: 500 }
    )
  }
}

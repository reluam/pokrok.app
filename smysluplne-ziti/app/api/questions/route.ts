import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import {
  getQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  getQuestionsPage,
  updateQuestionsPage,
} from '@/lib/questions'

async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies()
  const authCookie = cookieStore.get('admin-auth')
  return authCookie?.value === 'authenticated'
}

// GET - get all questions or page content
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    if (type === 'page') {
      const page = await getQuestionsPage()
      return NextResponse.json(page || { id: 'main', introText: '', image: undefined, createdAt: '', updatedAt: '' })
    }

    const questions = await getQuestions()
    return NextResponse.json({ questions })
  } catch (error: any) {
    console.error('Error fetching questions:', error)
    return NextResponse.json(
      { error: error.message || 'Chyba při načítání otázek' },
      { status: 500 }
    )
  }
}

// POST - create new question or update page
export async function POST(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Neautorizováno' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { type, ...data } = body

    if (type === 'page') {
      const page = await updateQuestionsPage(data.introText || '', data.image)
      return NextResponse.json({ success: true, page })
    }

    const question = await createQuestion({
      question: data.question,
      description: data.description,
      whenText: data.whenText,
      answer: data.answer,
      displayOrder: data.displayOrder,
      category: data.category || 'obecne',
    })

    return NextResponse.json({ success: true, question })
  } catch (error: any) {
    console.error('Error creating question:', error)
    return NextResponse.json(
      { error: error.message || 'Chyba při vytváření otázky' },
      { status: 500 }
    )
  }
}

// PUT - update question
export async function PUT(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Neautorizováno' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { id, ...updates } = body

    const question = await updateQuestion(id, updates)
    if (!question) {
      return NextResponse.json({ error: 'Otázka nenalezena' }, { status: 404 })
    }

    return NextResponse.json({ success: true, question })
  } catch (error: any) {
    console.error('Error updating question:', error)
    return NextResponse.json(
      { error: error.message || 'Chyba při aktualizaci otázky' },
      { status: 500 }
    )
  }
}

// DELETE - delete question
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

    const deleted = await deleteQuestion(id)
    if (!deleted) {
      return NextResponse.json({ error: 'Otázka nenalezena' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting question:', error)
    return NextResponse.json(
      { error: error.message || 'Chyba při mazání otázky' },
      { status: 500 }
    )
  }
}

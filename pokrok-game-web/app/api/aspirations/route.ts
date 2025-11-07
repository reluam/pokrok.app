import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { 
  createAspiration, 
  getAspirationsByUserId, 
  updateAspiration, 
  deleteAspiration,
  getUserByClerkId 
} from '@/lib/cesta-db'

export async function GET(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth()
    
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user from database
    const dbUser = await getUserByClerkId(clerkUserId)
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const aspirations = await getAspirationsByUserId(dbUser.id)
    return NextResponse.json(aspirations)
  } catch (error) {
    console.error('Error fetching aspirations:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth()
    
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user from database
    const dbUser = await getUserByClerkId(clerkUserId)
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await request.json()
    const { title, description, color, icon } = body
    
    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const aspirationData = {
      user_id: dbUser.id,
      title,
      description: description || null,
      color: color || '#3B82F6',
      icon: icon || null
    }

    console.log('Creating aspiration with data:', aspirationData)
    
    try {
      const aspiration = await createAspiration(aspirationData)
      
      if (!aspiration) {
        console.error('createAspiration returned null')
        return NextResponse.json({ error: 'Failed to create aspiration' }, { status: 500 })
      }
      
      console.log('Aspiration created successfully:', aspiration.id)
      return NextResponse.json(aspiration)
    } catch (dbError: any) {
      console.error('Database error creating aspiration:', dbError)
      console.error('Error details:', {
        message: dbError?.message,
        code: dbError?.code,
        detail: dbError?.detail,
        stack: dbError?.stack
      })
      return NextResponse.json({ 
        error: 'Failed to create aspiration', 
        details: dbError?.message || 'Unknown database error' 
      }, { status: 500 })
    }
  } catch (error: any) {
    console.error('Error creating aspiration:', error)
    console.error('Error details:', {
      message: error?.message,
      stack: error?.stack
    })
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error?.message || 'Unknown error'
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth()
    
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user from database
    const dbUser = await getUserByClerkId(clerkUserId)
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await request.json()
    const { aspirationId, title, description, color, icon } = body
    
    if (!aspirationId) {
      return NextResponse.json({ error: 'Aspiration ID is required' }, { status: 400 })
    }

    const updates: any = {}
    if (title !== undefined) updates.title = title
    if (description !== undefined) updates.description = description
    if (color !== undefined) updates.color = color
    if (icon !== undefined) updates.icon = icon

    const aspiration = await updateAspiration(aspirationId, updates)
    if (!aspiration) {
      return NextResponse.json({ error: 'Aspiration not found' }, { status: 404 })
    }
    
    return NextResponse.json(aspiration)
  } catch (error) {
    console.error('Error updating aspiration:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth()
    
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user from database
    const dbUser = await getUserByClerkId(clerkUserId)
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const aspirationId = searchParams.get('aspirationId')
    
    if (!aspirationId) {
      return NextResponse.json({ error: 'Aspiration ID is required' }, { status: 400 })
    }

    const deleted = await deleteAspiration(aspirationId)
    if (!deleted) {
      return NextResponse.json({ error: 'Aspiration not found' }, { status: 404 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting aspiration:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


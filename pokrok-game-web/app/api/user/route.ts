import { NextRequest, NextResponse } from 'next/server'
import { getUserByClerkId, createUser, createArea } from '@/lib/cesta-db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clerkId = searchParams.get('clerkId')
    
    if (!clerkId) {
      return NextResponse.json({ error: 'Clerk ID is required' }, { status: 400 })
    }

    const user = await getUserByClerkId(clerkId)
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { clerkId, email, firstName, lastName } = body
    
    if (!clerkId) {
      return NextResponse.json({ error: 'Clerk ID is required' }, { status: 400 })
    }

    // Use email or construct from other fields
    const userEmail = email || `${clerkId}@example.com`
    // Construct name from firstName and lastName, or use email username as fallback
    const name = [firstName, lastName].filter(Boolean).join(' ') || userEmail.split('@')[0] || 'User'

    const user = await createUser(clerkId, userEmail, name)
    
    // Create default areas for new user
    const defaultAreas = [
      { name: 'Osobní', description: 'Osobní rozvoj a růst', color: '#3B82F6', icon: '👤', order: 0 },
      { name: 'Kariéra', description: 'Profesní rozvoj a kariéra', color: '#10B981', icon: '💼', order: 1 },
      { name: 'Zdraví', description: 'Fyzické a duševní zdraví', color: '#F59E0B', icon: '💪', order: 2 },
      { name: 'Vztahy', description: 'Vztahy s rodinou a přáteli', color: '#EF4444', icon: '❤️', order: 3 },
      { name: 'Vzdělání', description: 'Učení a vzdělávání', color: '#8B5CF6', icon: '📚', order: 4 },
      { name: 'Koníčky', description: 'Zájmy a koníčky', color: '#EC4899', icon: '🎨', order: 5 },
      { name: 'Finance', description: 'Finanční plánování', color: '#06B6D4', icon: '💰', order: 6 }
    ]
    
    try {
      for (const area of defaultAreas) {
        await createArea(user.id, area.name, area.description, area.color, area.icon, area.order)
      }
    } catch (error) {
      console.error('Error creating default areas:', error)
      // Don't fail user creation if areas fail
    }
    
    return NextResponse.json(user)
  } catch (error) {
    console.error('Error creating user:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error details:', errorMessage)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: errorMessage 
    }, { status: 500 })
  }
}

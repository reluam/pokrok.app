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

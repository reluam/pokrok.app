import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getAspirationBalance, getUserByClerkId } from '@/lib/cesta-db'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

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

    const { searchParams } = new URL(request.url)
    const aspirationId = searchParams.get('aspirationId')
    
    if (!aspirationId) {
      return NextResponse.json({ error: 'Aspiration ID is required' }, { status: 400 })
    }

    console.log('Fetching aspiration balance for:', { userId: dbUser.id, aspirationId })
    
    try {
      const balance = await getAspirationBalance(dbUser.id, aspirationId)
      console.log('✅ Aspiration balance fetched successfully:', JSON.stringify(balance, null, 2))
      console.log('Balance values:', {
        total_planned_steps: balance.total_planned_steps,
        total_planned_habits: balance.total_planned_habits,
        total_completed_steps: balance.total_completed_steps,
        total_completed_habits: balance.total_completed_habits
      })
      return NextResponse.json(balance)
    } catch (dbError: any) {
      console.error('Database error fetching aspiration balance:', dbError)
      console.error('Error details:', {
        message: dbError?.message,
        code: dbError?.code,
        detail: dbError?.detail,
        stack: dbError?.stack
      })
      return NextResponse.json({ 
        error: 'Failed to fetch aspiration balance', 
        details: dbError?.message || 'Unknown database error' 
      }, { status: 500 })
    }
  } catch (error: any) {
    console.error('Error fetching aspiration balance:', error)
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


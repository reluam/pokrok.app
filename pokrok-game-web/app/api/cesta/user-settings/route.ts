import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getUserByClerkId, getUserSettings, createOrUpdateUserSettings } from '@/lib/cesta-db'

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

    // Get user settings
    let settings = await getUserSettings(dbUser.id)
    
    // If settings don't exist, create default settings
    if (!settings) {
      settings = await createOrUpdateUserSettings(dbUser.id)
    }

    return NextResponse.json({ settings })
  } catch (error) {
    console.error('Error fetching user settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
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
    const { daily_steps_count, workflow, filters, default_view, date_format, primary_color } = body

    // Update user settings
    const updatedSettings = await createOrUpdateUserSettings(
      dbUser.id,
      daily_steps_count,
      workflow,
      undefined, // dailyResetHour - not used in iOS app
      filters,
      default_view,
      date_format,
      primary_color
    )

    return NextResponse.json({ settings: updatedSettings })
  } catch (error) {
    console.error('Error updating user settings:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ 
      error: 'Internal server error',
      details: errorMessage 
    }, { status: 500 })
  }
}


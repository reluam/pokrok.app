import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { getUserSettings, createOrUpdateUserSettings } from '@/lib/cesta-db'

export async function GET(request: NextRequest) {
  try {
    // ✅ SECURITY: Ověření autentizace
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) return authResult
    const { dbUser } = authResult

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
    // ✅ SECURITY: Ověření autentizace
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) return authResult
    const { dbUser } = authResult

    const body = await request.json()
    const { daily_steps_count, workflow, filters, default_view, date_format, primary_color, default_currency, weight_unit_preference, assistant_enabled } = body

    // Update user settings
    const updatedSettings = await createOrUpdateUserSettings(
      dbUser.id,
      daily_steps_count,
      workflow,
      undefined, // dailyResetHour - not used in iOS app
      filters,
      default_view,
      date_format,
      primary_color,
      default_currency,
      weight_unit_preference,
      assistant_enabled
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


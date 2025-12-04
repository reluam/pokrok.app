import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getUserByClerkId } from '@/lib/cesta-db'
import { 
  getAutomations,
  createAutomation, 
  updateAutomation, 
  deleteAutomation
} from '@/lib/cesta-db'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// GET - Fetch automations
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dbUser = await getUserByClerkId(userId)
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const automations = await getAutomations(dbUser.id)
    return NextResponse.json({ automations })
  } catch (error) {
    console.error('Error fetching automations:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create automation
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dbUser = await getUserByClerkId(userId)
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { 
      name, 
      description, 
      type, 
      target_id, 
      frequency_type, 
      frequency_time,
      scheduled_date,
      is_active,
      target_value,
      current_value,
      update_value,
      update_frequency,
      update_day_of_week,
      update_day_of_month
    } = await request.json()

    if (!type || !target_id) {
      return NextResponse.json({ error: 'Type and target_id are required' }, { status: 400 })
    }

    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    // Check if trigger_type column exists and handle it
    const automationData: any = {
      user_id: dbUser.id,
      name: name.trim(),
      description: description || null,
      type,
      target_id,
      frequency_type: frequency_type || 'recurring',
      frequency_time: frequency_time || null,
      scheduled_date: scheduled_date || null,
      is_active: is_active !== undefined ? is_active : true,
      target_value: target_value || null,
      current_value: current_value || 0,
      update_value: update_value || null,
      update_frequency: update_frequency || null,
      update_day_of_week: update_day_of_week || null,
      update_day_of_month: update_day_of_month || null
    }

    const automation = await createAutomation(automationData)

    return NextResponse.json({ automation })
  } catch (error: any) {
    console.error('Error creating automation:', error)
    const errorMessage = error?.message || 'Internal server error'
    return NextResponse.json({ error: errorMessage, details: error }, { status: 500 })
  }
}

// PUT - Update automation
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dbUser = await getUserByClerkId(userId)
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { automationId, ...updates } = await request.json()

    if (!automationId) {
      return NextResponse.json({ error: 'Automation ID is required' }, { status: 400 })
    }

    // ✅ SECURITY: Ověření vlastnictví automation
    const { verifyEntityOwnership } = await import('@/lib/auth-helpers')
    const automationOwned = await verifyEntityOwnership(automationId, 'automations', dbUser)
    if (!automationOwned) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const automation = await updateAutomation(automationId, updates)

    return NextResponse.json({ automation })
  } catch (error) {
    console.error('Error updating automation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete automation
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dbUser = await getUserByClerkId(userId)
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const automationId = searchParams.get('automationId')

    if (!automationId) {
      return NextResponse.json({ error: 'Automation ID is required' }, { status: 400 })
    }

    // ✅ SECURITY: Ověření vlastnictví automation
    const { verifyEntityOwnership } = await import('@/lib/auth-helpers')
    const automationOwned = await verifyEntityOwnership(automationId, 'automations', dbUser)
    if (!automationOwned) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await deleteAutomation(automationId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting automation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


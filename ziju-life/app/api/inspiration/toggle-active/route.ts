import { NextRequest, NextResponse } from 'next/server'
import { updateInspirationItem, type InspirationType } from '@/lib/inspiration-db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, id, isActive } = body

    if (!type || !id || typeof isActive !== 'boolean') {
      return NextResponse.json(
        { error: 'Type, id, and isActive (boolean) are required' },
        { status: 400 }
      )
    }

    const updatedItem = await updateInspirationItem(type as InspirationType, id, { isActive })
    if (!updatedItem) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(updatedItem)
  } catch (error) {
    console.error('Error toggling inspiration active status:', error)
    return NextResponse.json(
      { error: 'Failed to toggle active status' },
      { status: 500 }
    )
  }
}

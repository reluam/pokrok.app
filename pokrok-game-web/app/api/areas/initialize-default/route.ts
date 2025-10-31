import { NextRequest, NextResponse } from 'next/server'
import { createArea, getAreas } from '@/lib/cesta-db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId } = body
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Check if user already has areas
    const existingAreas = await getAreas(userId)
    if (existingAreas.length > 0) {
      return NextResponse.json({ 
        message: 'User already has areas',
        areas: existingAreas 
      })
    }

    // Create default areas for user
    const defaultAreas = [
      { name: 'Osobní', description: 'Osobní rozvoj a růst', color: '#3B82F6', icon: '👤', order: 0 },
      { name: 'Kariéra', description: 'Profesní rozvoj a kariéra', color: '#10B981', icon: '💼', order: 1 },
      { name: 'Zdraví', description: 'Fyzické a duševní zdraví', color: '#F59E0B', icon: '💪', order: 2 },
      { name: 'Vztahy', description: 'Vztahy s rodinou a přáteli', color: '#EF4444', icon: '❤️', order: 3 },
      { name: 'Vzdělání', description: 'Učení a vzdělávání', color: '#8B5CF6', icon: '📚', order: 4 },
      { name: 'Koníčky', description: 'Zájmy a koníčky', color: '#EC4899', icon: '🎨', order: 5 },
      { name: 'Finance', description: 'Finanční plánování', color: '#06B6D4', icon: '💰', order: 6 }
    ]
    
    const createdAreas = []
    for (const area of defaultAreas) {
      const createdArea = await createArea(userId, area.name, area.description, area.color, area.icon, area.order)
      createdAreas.push(createdArea)
    }
    
    return NextResponse.json({ 
      message: 'Default areas created successfully',
      areas: createdAreas 
    })
  } catch (error) {
    console.error('Error initializing default areas:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


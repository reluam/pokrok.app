import { NextRequest, NextResponse } from 'next/server'
import { createPlayer, getPlayerByUserId } from '@/lib/cesta-db'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL || 'postgresql://dummy:dummy@dummy/dummy')

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const player = await getPlayerByUserId(userId)
    
    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 })
    }

    return NextResponse.json(player)
  } catch (error) {
    console.error('Error fetching player:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, name, gender, avatar, appearance, level, experience, energy, currentDay, currentTime } = body
    
    if (!userId || !name) {
      return NextResponse.json({ error: 'User ID and name are required' }, { status: 400 })
    }

    const playerData = {
      user_id: userId,
      name,
      gender: gender || 'male',
      avatar: avatar || 'default',
      appearance: appearance || {},
      level: level || 1,
      experience: experience || 0,
      energy: energy || 100,
      current_day: currentDay || 1,
      current_time: currentTime || 6
    }

    const player = await createPlayer(playerData)
    return NextResponse.json(player)
  } catch (error) {
    console.error('Error creating player:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, name, appearance } = body
    
    if (!id || !name) {
      return NextResponse.json({ error: 'Player ID and name are required' }, { status: 400 })
    }

    const result = await sql`
      UPDATE players 
      SET 
        name = ${name},
        appearance = ${JSON.stringify(appearance)},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 })
    }

    return NextResponse.json(result[0])
  } catch (error) {
    console.error('Error updating player:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

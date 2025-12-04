import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, verifyOwnership } from '@/lib/auth-helpers'
import { createPlayer, getPlayerByUserId } from '@/lib/cesta-db'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL || 'postgresql://dummy:dummy@dummy/dummy')

export async function GET(request: NextRequest) {
  try {
    // ✅ SECURITY: Ověření autentizace
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) return authResult
    const { dbUser } = authResult

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    // ✅ SECURITY: Ověření vlastnictví userId, pokud je poskytnut
    const targetUserId = userId || dbUser.id
    if (userId && !verifyOwnership(userId, dbUser)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const player = await getPlayerByUserId(targetUserId)
    
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
    // ✅ SECURITY: Ověření autentizace
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) return authResult
    const { dbUser } = authResult

    const body = await request.json()
    const { userId, name, gender, avatar, appearance, level, experience, energy, currentDay, currentTime } = body
    
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    // ✅ SECURITY: Ověření vlastnictví userId, pokud je poskytnut
    const targetUserId = userId || dbUser.id
    if (userId && !verifyOwnership(userId, dbUser)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const playerData = {
      user_id: targetUserId,
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
    // ✅ SECURITY: Ověření autentizace
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) return authResult
    const { dbUser } = authResult

    const body = await request.json()
    const { id, name, appearance } = body
    
    if (!id || !name) {
      return NextResponse.json({ error: 'Player ID and name are required' }, { status: 400 })
    }

    // ✅ SECURITY: Ověření vlastnictví player
    const existingPlayer = await sql`
      SELECT user_id FROM players WHERE id = ${id}
    `
    
    if (existingPlayer.length === 0) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 })
    }
    
    if (existingPlayer[0].user_id !== dbUser.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // ✅ SECURITY: Přidat user_id do WHERE pro dodatečnou ochranu
    const result = await sql`
      UPDATE players 
      SET 
        name = ${name},
        appearance = ${JSON.stringify(appearance)},
        updated_at = NOW()
      WHERE id = ${id} AND user_id = ${dbUser.id}
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

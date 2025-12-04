import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { getUserByClerkId, User } from '@/lib/cesta-db'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL || 'postgresql://dummy:dummy@dummy/dummy')

export interface AuthContext {
  clerkUserId: string
  dbUser: User
}

/**
 * Ověří autentizaci a vrátí kontext uživatele
 * Vrátí NextResponse s chybou, pokud autentizace selže
 */
export async function requireAuth(request: NextRequest): Promise<AuthContext | NextResponse> {
  const { userId: clerkUserId } = await auth()
  
  if (!clerkUserId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const dbUser = await getUserByClerkId(clerkUserId)
  if (!dbUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  return { clerkUserId, dbUser }
}

/**
 * Ověří, že userId patří autentizovanému uživateli
 */
export function verifyOwnership(userId: string, dbUser: User): boolean {
  return userId === dbUser.id
}

/**
 * Ověří vlastnictví entity podle user_id v databázi
 * @param entityId ID entity k ověření
 * @param tableName Název tabulky (bez SQL injection - použít pouze hardcoded hodnoty)
 * @param dbUser Autentizovaný uživatel
 * @returns true pokud entita patří uživateli, false jinak
 */
export async function verifyEntityOwnership(
  entityId: string,
  tableName: 'habits' | 'goals' | 'daily_steps' | 'areas' | 'player' | 'workflows' | 'automations',
  dbUser: User
): Promise<boolean> {
  try {
    // Použít switch pro bezpečné mapování názvu tabulky
    let result
    switch (tableName) {
      case 'habits':
        result = await sql`SELECT user_id FROM habits WHERE id = ${entityId} LIMIT 1`
        break
      case 'goals':
        result = await sql`SELECT user_id FROM goals WHERE id = ${entityId} LIMIT 1`
        break
      case 'daily_steps':
        result = await sql`SELECT user_id FROM daily_steps WHERE id = ${entityId} LIMIT 1`
        break
      case 'areas':
        result = await sql`SELECT user_id FROM areas WHERE id = ${entityId} LIMIT 1`
        break
      case 'player':
        result = await sql`SELECT user_id FROM players WHERE id = ${entityId} LIMIT 1`
        break
      case 'workflows':
        result = await sql`SELECT user_id FROM workflows WHERE id = ${entityId} LIMIT 1`
        break
      case 'automations':
        result = await sql`SELECT user_id FROM automations WHERE id = ${entityId} LIMIT 1`
        break
      default:
        return false
    }
    
    return result.length > 0 && result[0].user_id === dbUser.id
  } catch (error) {
    console.error(`Error verifying ownership for ${tableName}:`, error)
    return false
  }
}

/**
 * Helper pro rychlé ověření a získání uživatele v API route
 * Použití:
 * const authResult = await requireAuth(request)
 * if (authResult instanceof NextResponse) return authResult
 * const { dbUser } = authResult
 */
export type AuthResult = AuthContext | NextResponse


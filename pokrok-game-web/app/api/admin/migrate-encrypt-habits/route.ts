import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getUserByClerkId } from '@/lib/cesta-db'
import { neon } from '@neondatabase/serverless'
import * as crypto from 'crypto'

const sql = neon(process.env.DATABASE_URL || '')

// Check if user is admin
async function isUserAdmin(userId: string): Promise<boolean> {
  try {
    const user = await sql`
      SELECT is_admin FROM users WHERE id = ${userId}
    `
    return user[0]?.is_admin === true
  } catch {
    return false
  }
}

// Check if string is encrypted (has format: iv:tag:encrypted)
function isEncrypted(text: string): boolean {
  if (!text) return false
  const parts = text.split(':')
  if (parts.length !== 3) return false
  
  try {
    return parts.every(part => {
      try {
        Buffer.from(part, 'base64')
        return true
      } catch {
        return false
      }
    })
  } catch {
    return false
  }
}

// Encryption function (inline for API route)
function encryptText(text: string, userId: string): string {
  const ALGORITHM = 'aes-256-gcm'
  const IV_LENGTH = 16
  const KEY_LENGTH = 32
  const PBKDF2_ITERATIONS = 100000
  
  const masterKey = process.env.ENCRYPTION_MASTER_KEY
  if (!masterKey || masterKey.length < 32) {
    throw new Error('ENCRYPTION_MASTER_KEY is not set or too short')
  }
  
  // Derive key
  const key = crypto.pbkdf2Sync(
    masterKey,
    userId,
    PBKDF2_ITERATIONS,
    KEY_LENGTH,
    'sha256'
  )
  
  // Encrypt
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  
  let encrypted = cipher.update(text, 'utf8', 'base64')
  encrypted += cipher.final('base64')
  
  const tag = cipher.getAuthTag()
  
  // Format: iv:tag:encrypted (all Base64)
  return `${iv.toString('base64')}:${tag.toString('base64')}:${encrypted}`
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { userId: clerkUserId } = await auth()
    
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dbUser = await getUserByClerkId(clerkUserId)
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user is admin
    const isAdmin = await isUserAdmin(dbUser.id)
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    // Check if ENCRYPTION_MASTER_KEY is set
    if (!process.env.ENCRYPTION_MASTER_KEY) {
      return NextResponse.json({ 
        error: 'ENCRYPTION_MASTER_KEY environment variable is not set' 
      }, { status: 500 })
    }

    if (process.env.ENCRYPTION_MASTER_KEY.length < 32) {
      return NextResponse.json({ 
        error: 'ENCRYPTION_MASTER_KEY must be at least 32 characters long' 
      }, { status: 500 })
    }

    // Get all habits
    const habits = await sql`
      SELECT id, user_id, name, description 
      FROM habits 
      WHERE name IS NOT NULL OR description IS NOT NULL
    `
    
    let successCount = 0
    let skippedCount = 0
    let errorCount = 0
    const errors: string[] = []
    
    for (const habit of habits) {
      try {
        // Skip if name or description is the corrupted "{}" value
        if (habit.name === '{}' || habit.description === '{}') {
          skippedCount++
          continue
        }
        
        // Check if habit needs encryption
        const nameNeedsEncryption = habit.name && !isEncrypted(habit.name)
        const descriptionNeedsEncryption = habit.description && !isEncrypted(habit.description)
        
        // If both are already encrypted or null, skip
        if (!nameNeedsEncryption && !descriptionNeedsEncryption) {
          skippedCount++
          continue
        }
        
        // Encrypt fields that need encryption
        let encryptedName = null
        let encryptedDescription = null
        
        if (nameNeedsEncryption) {
          encryptedName = encryptText(habit.name, habit.user_id)
        }
        
        if (descriptionNeedsEncryption) {
          encryptedDescription = encryptText(habit.description, habit.user_id)
        }
        
        // Update only fields that need encryption
        if (encryptedName !== null && encryptedDescription !== null) {
          await sql`
            UPDATE habits 
            SET name = ${encryptedName}, description = ${encryptedDescription}, updated_at = NOW()
            WHERE id = ${habit.id}
          `
        } else if (encryptedName !== null) {
          await sql`
            UPDATE habits 
            SET name = ${encryptedName}, updated_at = NOW()
            WHERE id = ${habit.id}
          `
        } else if (encryptedDescription !== null) {
          await sql`
            UPDATE habits 
            SET description = ${encryptedDescription}, updated_at = NOW()
            WHERE id = ${habit.id}
          `
        }
        
        successCount++
      } catch (error: any) {
        errorCount++
        errors.push(`Habit ${habit.id}: ${error.message || error}`)
      }
    }
    
    return NextResponse.json({
      success: true,
      summary: {
        total: habits.length,
        encrypted: successCount,
        skipped: skippedCount,
        errors: errorCount
      },
      errors: errors.length > 0 ? errors : undefined
    })
  } catch (error: any) {
    console.error('Error running migration:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 })
  }
}


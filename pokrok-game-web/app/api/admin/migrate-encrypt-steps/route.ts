import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getUserByClerkId } from '@/lib/cesta-db'
import { neon } from '@neondatabase/serverless'
import * as crypto from 'crypto'
import { encryptChecklist } from '@/lib/encryption'

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

    // Get all steps
    const steps = await sql`
      SELECT id, user_id, title, description, checklist 
      FROM daily_steps 
      WHERE title IS NOT NULL OR description IS NOT NULL OR checklist IS NOT NULL
    `
    
    let successCount = 0
    let skippedCount = 0
    let errorCount = 0
    const errors: string[] = []
    
    for (const step of steps) {
      try {
        // Skip if title or description is the corrupted "{}" value
        if (step.title === '{}' || step.description === '{}') {
          skippedCount++
          continue
        }
        
        // Check if step needs encryption
        const titleNeedsEncryption = step.title && !isEncrypted(step.title)
        const descriptionNeedsEncryption = step.description && !isEncrypted(step.description)
        
        // Handle checklist
        let checklistNeedsEncryption = false
        let checklistData: any[] | null = null
        
        if (step.checklist) {
          try {
            // Parse checklist (it's JSONB in database)
            if (typeof step.checklist === 'string') {
              checklistData = JSON.parse(step.checklist)
            } else {
              checklistData = step.checklist
            }
            
            if (checklistData && Array.isArray(checklistData) && checklistData.length > 0) {
              // Check if any item needs encryption (has text field that's not encrypted)
              checklistNeedsEncryption = checklistData.some((item: any) => 
                item && typeof item === 'object' && 'text' in item && item.text && !isEncrypted(item.text)
              )
            }
          } catch (checklistError) {
            console.error(`Error parsing checklist for step ${step.id}:`, checklistError)
            // Continue without encrypting checklist if parsing fails
          }
        }
        
        // If nothing needs encryption, skip
        if (!titleNeedsEncryption && !descriptionNeedsEncryption && !checklistNeedsEncryption) {
          skippedCount++
          continue
        }
        
        // Encrypt fields that need encryption
        let encryptedTitle = null
        let encryptedDescription = null
        let encryptedChecklist = null
        
        if (titleNeedsEncryption) {
          encryptedTitle = encryptText(step.title, step.user_id)
        }
        
        if (descriptionNeedsEncryption) {
          encryptedDescription = encryptText(step.description, step.user_id)
        }
        
        if (checklistNeedsEncryption && checklistData) {
          // Encrypt checklist using the helper function
          encryptedChecklist = encryptChecklist(checklistData, step.user_id)
        }
        
        // Update only fields that need encryption
        if (encryptedTitle !== null && encryptedDescription !== null && encryptedChecklist !== null) {
          await sql`
            UPDATE daily_steps 
            SET title = ${encryptedTitle}, 
                description = ${encryptedDescription}, 
                checklist = ${JSON.stringify(encryptedChecklist)}::jsonb,
                updated_at = NOW()
            WHERE id = ${step.id}
          `
        } else if (encryptedTitle !== null && encryptedDescription !== null) {
          await sql`
            UPDATE daily_steps 
            SET title = ${encryptedTitle}, 
                description = ${encryptedDescription}, 
                updated_at = NOW()
            WHERE id = ${step.id}
          `
        } else if (encryptedTitle !== null && encryptedChecklist !== null) {
          await sql`
            UPDATE daily_steps 
            SET title = ${encryptedTitle}, 
                checklist = ${JSON.stringify(encryptedChecklist)}::jsonb,
                updated_at = NOW()
            WHERE id = ${step.id}
          `
        } else if (encryptedDescription !== null && encryptedChecklist !== null) {
          await sql`
            UPDATE daily_steps 
            SET description = ${encryptedDescription}, 
                checklist = ${JSON.stringify(encryptedChecklist)}::jsonb,
                updated_at = NOW()
            WHERE id = ${step.id}
          `
        } else if (encryptedTitle !== null) {
          await sql`
            UPDATE daily_steps 
            SET title = ${encryptedTitle}, 
                updated_at = NOW()
            WHERE id = ${step.id}
          `
        } else if (encryptedDescription !== null) {
          await sql`
            UPDATE daily_steps 
            SET description = ${encryptedDescription}, 
                updated_at = NOW()
            WHERE id = ${step.id}
          `
        } else if (encryptedChecklist !== null) {
          await sql`
            UPDATE daily_steps 
            SET checklist = ${JSON.stringify(encryptedChecklist)}::jsonb,
                updated_at = NOW()
            WHERE id = ${step.id}
          `
        }
        
        successCount++
      } catch (error: any) {
        errorCount++
        errors.push(`Step ${step.id}: ${error.message || error}`)
      }
    }
    
    return NextResponse.json({
      success: true,
      summary: {
        total: steps.length,
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

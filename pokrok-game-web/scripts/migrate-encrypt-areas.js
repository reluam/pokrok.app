/**
 * Migration script to encrypt existing areas data
 * Run with: node scripts/migrate-encrypt-areas.js
 * 
 * This script:
 * 1. Loads all areas from the database
 * 2. Encrypts name and description fields that are not already encrypted
 * 3. Updates the database with encrypted values
 */

require('dotenv').config({ path: '.env.local' })
const { neon } = require('@neondatabase/serverless')

const sql = neon(process.env.DATABASE_URL)

// Check if string is encrypted (has format: iv:tag:encrypted)
function isEncrypted(text) {
  if (!text) return false
  const parts = text.split(':')
  if (parts.length !== 3) return false
  
  try {
    // All parts should be valid Base64
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

// Simple encryption function (inline for this script)
// In production, this uses the encryption module
// For migration, we'll import it dynamically
async function encryptText(text, userId) {
  // Try to use the encryption module
  try {
    // Use dynamic import for ESM module
    const crypto = require('crypto')
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
  } catch (error) {
    console.error('Encryption error:', error)
    throw error
  }
}

async function migrateAreas() {
  console.log('🔄 Starting areas encryption migration...')
  
  // Check if ENCRYPTION_MASTER_KEY is set
  if (!process.env.ENCRYPTION_MASTER_KEY) {
    console.error('❌ ERROR: ENCRYPTION_MASTER_KEY environment variable is not set')
    console.error('   Please set it in .env.local file')
    process.exit(1)
  }
  
  if (process.env.ENCRYPTION_MASTER_KEY.length < 32) {
    console.error('❌ ERROR: ENCRYPTION_MASTER_KEY must be at least 32 characters long')
    process.exit(1)
  }
  
  try {
    // Get all areas
    const areas = await sql`
      SELECT id, user_id, name, description 
      FROM areas 
      WHERE name IS NOT NULL OR description IS NOT NULL
    `
    
    console.log(`📊 Found ${areas.length} areas to process`)
    
    if (areas.length === 0) {
      console.log('✅ No areas to migrate')
      return
    }
    
    let successCount = 0
    let skippedCount = 0
    let errorCount = 0
    
    for (const area of areas) {
      try {
        // Skip if name or description is the corrupted "{}" value
        if (area.name === '{}' || area.description === '{}') {
          console.warn(`⚠️  Skipping area ${area.id} - contains corrupted "{}" value (needs manual fix)`)
          skippedCount++
          continue
        }
        
        // Check if area needs encryption
        const nameNeedsEncryption = area.name && !isEncrypted(area.name)
        const descriptionNeedsEncryption = area.description && !isEncrypted(area.description)
        
        // If both are already encrypted or null, skip
        if (!nameNeedsEncryption && !descriptionNeedsEncryption) {
          skippedCount++
          continue
        }
        
        // Encrypt fields that need encryption
        let encryptedName = null
        let encryptedDescription = null
        
        if (nameNeedsEncryption) {
          encryptedName = await encryptText(area.name, area.user_id)
          if (!encryptedName) {
            throw new Error(`Failed to encrypt name for area ${area.id}`)
          }
        }
        
        if (descriptionNeedsEncryption) {
          encryptedDescription = await encryptText(area.description, area.user_id)
          if (!encryptedDescription) {
            throw new Error(`Failed to encrypt description for area ${area.id}`)
          }
        }
        
        // Update only fields that need encryption (like updateArea function)
        // Use conditional updates to avoid overwriting fields that don't need encryption
        if (encryptedName !== null && encryptedDescription !== null) {
          // Both fields need encryption
          await sql`
            UPDATE areas 
            SET name = ${encryptedName}, description = ${encryptedDescription}, updated_at = NOW()
            WHERE id = ${area.id}
          `
        } else if (encryptedName !== null) {
          // Only name needs encryption
          await sql`
            UPDATE areas 
            SET name = ${encryptedName}, updated_at = NOW()
            WHERE id = ${area.id}
          `
        } else if (encryptedDescription !== null) {
          // Only description needs encryption
          await sql`
            UPDATE areas 
            SET description = ${encryptedDescription}, updated_at = NOW()
            WHERE id = ${area.id}
          `
        }
        
        successCount++
        
        // Log progress every 10 areas
        if (successCount % 10 === 0) {
          console.log(`✅ Encrypted ${successCount} areas...`)
        }
      } catch (error) {
        console.error(`❌ Error encrypting area ${area.id}:`, error.message || error)
        errorCount++
      }
    }
    
    console.log('\n📈 Migration Summary:')
    console.log(`   ✅ Successfully encrypted: ${successCount} areas`)
    console.log(`   ⏭️  Already encrypted/skipped: ${skippedCount} areas`)
    console.log(`   ❌ Errors: ${errorCount} areas`)
    console.log(`   📊 Total processed: ${areas.length} areas`)
    
    if (errorCount > 0) {
      console.log('\n⚠️  Warning: Some areas failed to encrypt. Please review the errors above.')
      process.exit(1)
    } else {
      console.log('\n✅ Migration completed successfully!')
    }
  } catch (error) {
    console.error('❌ Fatal error during migration:', error)
    process.exit(1)
  }
}

// Run migration
migrateAreas()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Unhandled error:', error)
    process.exit(1)
  })

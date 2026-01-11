/**
 * Script to check encryption status of areas in database
 * Run with: node scripts/check-areas-encryption-status.js
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

async function checkAreasStatus() {
  console.log('🔍 Checking areas encryption status...')
  console.log('')
  
  try {
    const areas = await sql`
      SELECT id, user_id, name, description 
      FROM areas 
      WHERE name IS NOT NULL OR description IS NOT NULL
      LIMIT 10
    `
    
    if (areas.length === 0) {
      console.log('❌ No areas found')
      return
    }
    
    let encryptedCount = 0
    let plainTextCount = 0
    let corruptedCount = 0
    
    console.log('📊 Sample areas (first 10):')
    console.log('')
    
    areas.forEach((area, index) => {
      const nameEncrypted = area.name ? isEncrypted(area.name) : false
      const descEncrypted = area.description ? isEncrypted(area.description) : false
      const nameCorrupted = area.name === '{}'
      const descCorrupted = area.description === '{}'
      
      if (nameEncrypted || descEncrypted) encryptedCount++
      if (!nameEncrypted && !descEncrypted && area.name && !nameCorrupted && !descCorrupted) plainTextCount++
      if (nameCorrupted || descCorrupted) corruptedCount++
      
      console.log(`Area ${index + 1}:`)
      console.log(`  ID: ${area.id}`)
      console.log(`  User ID: ${area.user_id}`)
      console.log(`  Name: ${area.name ? (area.name.length < 60 ? area.name : area.name.substring(0, 60) + '...') : 'NULL'}`)
      console.log(`  Name encrypted: ${nameEncrypted ? '✅ YES' : '❌ NO'}`)
      console.log(`  Description: ${area.description ? (area.description.length < 60 ? area.description : area.description.substring(0, 60) + '...') : 'NULL'}`)
      console.log(`  Description encrypted: ${descEncrypted ? '✅ YES' : '❌ NO'}`)
      console.log(`  Corrupted ({}): ${nameCorrupted || descCorrupted ? '⚠️  YES' : 'NO'}`)
      console.log('')
    })
    
    // Get full statistics
    const allAreas = await sql`
      SELECT name, description FROM areas 
      WHERE name IS NOT NULL OR description IS NOT NULL
    `
    
    let totalEncrypted = 0
    let totalPlainText = 0
    let totalCorrupted = 0
    
    allAreas.forEach(area => {
      const nameEncrypted = area.name ? isEncrypted(area.name) : false
      const descEncrypted = area.description ? isEncrypted(area.description) : false
      const nameCorrupted = area.name === '{}'
      const descCorrupted = area.description === '{}'
      
      if (nameEncrypted || descEncrypted) totalEncrypted++
      if (!nameEncrypted && !descEncrypted && area.name && !nameCorrupted && !descCorrupted) totalPlainText++
      if (nameCorrupted || descCorrupted) totalCorrupted++
    })
    
    console.log('📈 Summary:')
    console.log(`  Total areas: ${allAreas.length}`)
    console.log(`  Encrypted: ${totalEncrypted}`)
    console.log(`  Plain text: ${totalPlainText}`)
    console.log(`  Corrupted ({}): ${totalCorrupted}`)
    console.log('')
    
    if (totalPlainText > 0 && totalEncrypted === 0) {
      console.log('✅ Status: Data are PLAIN TEXT - ready for encryption')
    } else if (totalEncrypted > 0 && totalPlainText === 0) {
      console.log('✅ Status: Data are ENCRYPTED')
    } else if (totalEncrypted > 0 && totalPlainText > 0) {
      console.log('⚠️  Status: Mixed state - some encrypted, some plain text')
    } else if (totalCorrupted > 0) {
      console.log('❌ Status: Data are CORRUPTED ({} values) - need to restore from snapshot')
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

checkAreasStatus()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Unhandled error:', error)
    process.exit(1)
  })


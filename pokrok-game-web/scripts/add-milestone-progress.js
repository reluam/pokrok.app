const { neon } = require('@neondatabase/serverless')
require('dotenv').config({ path: '.env.local' })

const sql = neon(process.env.DATABASE_URL)

async function addProgressColumn() {
  try {
    console.log('Adding progress column to milestones table...')
    
    // Add progress column if it doesn't exist
    await sql`
      ALTER TABLE milestones 
      ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0
    `
    
    // Update existing milestones to have 0 progress if null
    await sql`
      UPDATE milestones 
      SET progress = 0 
      WHERE progress IS NULL
    `
    
    console.log('✅ Successfully added progress column to milestones table')
    process.exit(0)
  } catch (error) {
    console.error('❌ Error adding progress column:', error)
    process.exit(1)
  }
}

addProgressColumn()

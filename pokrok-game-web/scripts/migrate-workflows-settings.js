// Migration script to add settings column to workflows table
const { neon } = require('@neondatabase/serverless')
require('dotenv').config({ path: '.env.local' })

const sql = neon(process.env.DATABASE_URL)

async function migrateWorkflowsSettings() {
  try {
    console.log('🔄 Starting workflows settings migration...')
    
    // Check if column exists
    const columnExists = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'workflows' AND column_name = 'settings'
    `
    
    if (columnExists.length > 0) {
      console.log('✅ Settings column already exists')
      return
    }
    
    // Add settings column
    await sql`
      ALTER TABLE workflows ADD COLUMN settings JSONB
    `
    
    console.log('✅ Settings column added successfully')
  } catch (error) {
    console.error('❌ Error migrating workflows settings:', error)
    throw error
  }
}

migrateWorkflowsSettings()
  .then(() => {
    console.log('✅ Migration completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  })


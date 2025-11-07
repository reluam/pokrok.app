require('dotenv').config({ path: '.env.local' })
const { neon } = require('@neondatabase/serverless')

async function main() {
  const sql = neon(process.env.DATABASE_URL)

  console.log('Adding aspiration_id column to daily_steps table...')

  try {
    // Add aspiration_id to daily_steps table
    await sql`
      ALTER TABLE daily_steps 
      ADD COLUMN IF NOT EXISTS aspiration_id VARCHAR(255) REFERENCES aspirations(id) ON DELETE SET NULL;
    `
    console.log('✅ Added aspiration_id column to daily_steps table.')

    console.log('Migration completed successfully.')
  } catch (error) {
    console.error('❌ Error during migration:', error)
    process.exit(1)
  }
}

main()


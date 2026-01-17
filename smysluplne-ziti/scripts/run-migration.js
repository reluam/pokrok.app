/**
 * Script to run database migrations
 * Usage: node scripts/run-migration.js
 */

const { neon } = require('@neondatabase/serverless')
const fs = require('fs')
const path = require('path')

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set')
  process.exit(1)
}

const sql = neon(process.env.DATABASE_URL)

async function runMigrations() {
  console.log('🚀 Starting database migrations...')
  
  try {
    // Ensure migrations table exists
    await sql`
      CREATE TABLE IF NOT EXISTS migrations (
        id VARCHAR(255) PRIMARY KEY,
        "runAt" TIMESTAMP DEFAULT NOW()
      )
    `
    console.log('✅ Migrations table ready')
    
    // List of migrations in order
    const migrations = [
      '001_create_tables',
      '002_add_featured_and_small_things',
      '003_add_category_to_small_things',
      '004_create_categories',
      '005_add_image_to_small_things',
      '006_move_image_to_small_things_page',
      '007_create_questions',
      '008_add_why_and_how_to_small_things',
    ]
    
    for (const migrationId of migrations) {
      // Check if migration has been run
      const checkResult = await sql`
        SELECT EXISTS (SELECT 1 FROM migrations WHERE id = ${migrationId})
      `
      const hasRun = checkResult[0]?.exists
      
      if (hasRun) {
        console.log(`⏭️  Migration ${migrationId} already run, skipping`)
        continue
      }
      
      console.log(`📝 Running migration ${migrationId}...`)
      const migrationPath = path.join(process.cwd(), 'migrations', `${migrationId}.sql`)
      
      if (!fs.existsSync(migrationPath)) {
        console.error(`❌ Migration file not found: ${migrationPath}`)
        continue
      }
      
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
      await sql.unsafe(migrationSQL)
      
      // Mark migration as run
      await sql`
        INSERT INTO migrations (id) VALUES (${migrationId})
        ON CONFLICT (id) DO NOTHING
      `
      
      console.log(`✅ Migration ${migrationId} completed successfully`)
    }
    
    console.log('✅ All migrations completed successfully')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

runMigrations()

import { getPool } from './db'
import fs from 'fs'
import path from 'path'

// Create migrations table to track which migrations have been run
async function ensureMigrationsTable(client: any) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id VARCHAR(255) PRIMARY KEY,
      "runAt" TIMESTAMP DEFAULT NOW()
    )
  `)
}

// Check if migration has been run
async function hasMigrationRun(client: any, migrationId: string): Promise<boolean> {
  const result = await client.query(
    'SELECT EXISTS (SELECT 1 FROM migrations WHERE id = $1)',
    [migrationId]
  )
  return result.rows[0].exists
}

// Mark migration as run
async function markMigrationRun(client: any, migrationId: string) {
  await client.query(
    'INSERT INTO migrations (id) VALUES ($1) ON CONFLICT (id) DO NOTHING',
    [migrationId]
  )
}

// Run all migrations
export async function runMigrations() {
  const pool = getPool()
  const client = await pool.connect()
  try {
    await ensureMigrationsTable(client)
    
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
      '009_change_source_url_to_inspiration_id',
      '010_add_inspiration_id_to_questions',
    ]
    
    for (const migrationId of migrations) {
      const hasRun = await hasMigrationRun(client, migrationId)
      
      if (hasRun) {
        console.log(`Migration ${migrationId} already run, skipping`)
        continue
      }
      
      console.log(`Running migration ${migrationId}...`)
      const migrationSQL = fs.readFileSync(
        path.join(process.cwd(), 'migrations', `${migrationId}.sql`),
        'utf8'
      )
      
      await client.query(migrationSQL)
      await markMigrationRun(client, migrationId)
      console.log(`Migration ${migrationId} completed successfully`)
    }
    
    console.log('All migrations completed successfully')
  } catch (error) {
    console.error('Migration failed:', error)
    throw error
  } finally {
    client.release()
  }
}

// Run migration SQL file (legacy function for backward compatibility)
export async function runMigration() {
  return runMigrations()
}

// Migrate data from JSON files to database
export async function migrateDataFromFiles() {
  const pool = getPool()
  const client = await pool.connect()
  try {
    // Check if tables are empty
    const articlesResult = await client.query('SELECT COUNT(*) FROM articles')
    const inspirationResult = await client.query('SELECT COUNT(*) FROM inspiration')
    
    if (articlesResult.rows[0].count > 0 || inspirationResult.rows[0].count > 0) {
      console.log('Database already has data, skipping migration')
      return
    }

    // Migrate articles
    try {
      const articlesPath = path.join(process.cwd(), 'data', 'articles.json')
      if (fs.existsSync(articlesPath)) {
        const articlesData = JSON.parse(fs.readFileSync(articlesPath, 'utf8'))
        for (const article of articlesData.articles || []) {
          await client.query(
            `INSERT INTO articles (id, title, slug, content, excerpt, published, "inspirationIds", image, "createdAt", "updatedAt")
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             ON CONFLICT (id) DO NOTHING`,
            [
              article.id,
              article.title,
              article.slug,
              article.content,
              article.excerpt,
              article.published,
              article.inspirationIds || [],
              article.image || null,
              article.createdAt,
              article.updatedAt,
            ]
          )
        }
        console.log(`Migrated ${articlesData.articles?.length || 0} articles`)
      }
    } catch (error) {
      console.error('Error migrating articles:', error)
    }

    // Migrate inspiration
    try {
      const inspirationPath = path.join(process.cwd(), 'data', 'inspiration.json')
      if (fs.existsSync(inspirationPath)) {
        const inspirationData = JSON.parse(fs.readFileSync(inspirationPath, 'utf8'))
        
        const categories = ['articles', 'videos', 'books'] as const
        for (const category of categories) {
          for (const item of inspirationData[category] || []) {
            await client.query(
              `INSERT INTO inspiration (id, title, description, link, type, author, category, "createdAt", "updatedAt")
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
               ON CONFLICT (id) DO NOTHING`,
              [
                item.id,
                item.title,
                item.description,
                item.link,
                item.type,
                item.author || null,
                category,
                new Date().toISOString(),
                new Date().toISOString(),
              ]
            )
          }
        }
        console.log('Migrated inspiration data')
      }
    } catch (error) {
      console.error('Error migrating inspiration:', error)
    }
  } finally {
    client.release()
  }
}

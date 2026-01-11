import { getPool } from './db'
import fs from 'fs'
import path from 'path'

// Run migration SQL file
export async function runMigration() {
  const pool = getPool()
  const client = await pool.connect()
  try {
    // Check if tables already exist
    const checkResult = await client.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'articles')"
    )
    
    if (checkResult.rows[0].exists) {
      console.log('Tables already exist, skipping migration')
      return
    }
    
    const migrationSQL = fs.readFileSync(
      path.join(process.cwd(), 'migrations', '001_create_tables.sql'),
      'utf8'
    )
    await client.query(migrationSQL)
    console.log('Migration completed successfully')
  } catch (error) {
    console.error('Migration failed:', error)
    throw error
  } finally {
    client.release()
  }
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

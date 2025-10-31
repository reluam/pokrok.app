import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL || 'postgresql://dummy:dummy@dummy/dummy')

export async function initializeDatabase() {
  try {
    // Create articles table
    await sql`
      CREATE TABLE IF NOT EXISTS articles (
        id VARCHAR(255) PRIMARY KEY,
        title TEXT NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        content TEXT,
        image TEXT,
        categories JSONB DEFAULT '[]',
        published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        featured BOOLEAN DEFAULT FALSE,
        icon VARCHAR(50) NOT NULL,
        detail TEXT NOT NULL,
        resource TEXT,
        resource_title TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `

    // Create categories table
    await sql`
      CREATE TABLE IF NOT EXISTS categories (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        color VARCHAR(7),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `

    // Insert default categories if they don't exist
    const existingCategories = await sql`SELECT COUNT(*) FROM categories`
    if (existingCategories[0].count === '0') {
      await sql`
        INSERT INTO categories (id, name, slug, color) VALUES
        ('cile', 'Cíle', 'cile', '#3B82F6'),
        ('planovani', 'Plánování', 'planovani', '#10B981'),
        ('aktualni-stav', 'Aktuální stav', 'aktualni-stav', '#F59E0B'),
        ('revize', 'Revize', 'revize', '#EF4444'),
        ('jine', 'Jiné', 'jine', '#6B7280')
      `
    }

    console.log('Database initialized successfully')
  } catch (error) {
    console.error('Error initializing database:', error)
    throw error
  }
}

export async function migrateFromFiles() {
  try {
    // This function will migrate existing file-based articles to the database
    // We'll implement this after setting up the basic structure
    console.log('Migration from files not implemented yet')
  } catch (error) {
    console.error('Error migrating from files:', error)
    throw error
  }
}

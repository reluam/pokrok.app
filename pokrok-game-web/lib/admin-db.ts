import { neon } from '@neondatabase/serverless'
import { CoachingPackage, OfferSection, VideoContent, AdminSettings, Workshop } from './admin-types'
import Database from 'better-sqlite3'
import path from 'path'

const sql = neon(process.env.DATABASE_URL || 'postgresql://dummy:dummy@dummy/dummy')

// Local SQLite database for development
let db: Database.Database | null = null

export async function getAdminDb() {
  if (!db) {
    const dbPath = path.join(process.cwd(), 'admin.db')
    db = new Database(dbPath)
    
    // Initialize tables
    await initializeLocalTables()
  }
  return db
}

async function initializeLocalTables() {
  if (!db) return
  
  // Create workshops table
  db.exec(`
    CREATE TABLE IF NOT EXISTS workshops (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      subtitle TEXT NOT NULL,
      description TEXT NOT NULL,
      price TEXT NOT NULL,
      duration TEXT NOT NULL,
      features TEXT NOT NULL,
      color TEXT NOT NULL,
      textColor TEXT NOT NULL,
      borderColor TEXT NOT NULL,
      headerTextColor TEXT DEFAULT '',
      enabled INTEGER DEFAULT 1,
      "order" INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)
  
  // Create coaching_packages table
  db.exec(`
    CREATE TABLE IF NOT EXISTS coaching_packages (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      subtitle TEXT NOT NULL,
      description TEXT NOT NULL,
      price TEXT NOT NULL,
      duration TEXT NOT NULL,
      features TEXT NOT NULL,
      color TEXT NOT NULL,
      textColor TEXT NOT NULL,
      borderColor TEXT NOT NULL,
      headerTextColor TEXT DEFAULT '',
      enabled INTEGER DEFAULT 1,
      "order" INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)
  
  // Create admin_settings table
  db.exec(`
    CREATE TABLE IF NOT EXISTS admin_settings (
      id TEXT PRIMARY KEY,
      key TEXT UNIQUE NOT NULL,
      value TEXT NOT NULL,
      type TEXT NOT NULL,
      description TEXT NOT NULL,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)
  
  // Insert default settings if they don't exist
  const existingSettings = db.prepare('SELECT COUNT(*) as count FROM admin_settings').get() as { count: number }
  if (existingSettings.count === 0) {
    const insertSetting = db.prepare(`
      INSERT INTO admin_settings (id, key, value, type, description, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `)
    
    const now = new Date().toISOString()
    insertSetting.run('coaching_enabled', 'coaching_enabled', 'false', 'boolean', 'Enable/disable coaching section in navigation', now)
    insertSetting.run('workshops_enabled', 'workshops_enabled', 'false', 'boolean', 'Enable/disable workshops section in navigation', now)
  }
}

// Coaching Packages
export async function getCoachingPackages(): Promise<CoachingPackage[]> {
  try {
    const db = await getAdminDb()
    const packages = db.prepare('SELECT * FROM coaching_packages ORDER BY "order" ASC').all() as any[]
    return packages.map(pkg => ({
      ...pkg,
      features: JSON.parse(pkg.features || '[]'),
      enabled: Boolean(pkg.enabled)
    })) as CoachingPackage[]
  } catch (error) {
    console.error('Error fetching coaching packages:', error)
    return []
  }
}

export async function getCoachingPackage(id: string): Promise<CoachingPackage | null> {
  try {
    const db = await getAdminDb()
    const pkg = db.prepare('SELECT * FROM coaching_packages WHERE id = ?').get(id) as any
    if (!pkg) return null
    return {
      ...pkg,
      features: JSON.parse(pkg.features || '[]'),
      enabled: Boolean(pkg.enabled)
    } as CoachingPackage
  } catch (error) {
    console.error('Error fetching coaching package:', error)
    return null
  }
}

export async function createCoachingPackage(packageData: Omit<CoachingPackage, 'id' | 'createdAt' | 'updatedAt'>): Promise<CoachingPackage> {
  const id = Date.now().toString()
  const now = new Date().toISOString()
  
  try {
    const db = await getAdminDb()
    const insert = db.prepare(`
      INSERT INTO coaching_packages (
        id, title, subtitle, description, price, duration, features, 
        color, textColor, borderColor, headerTextColor, enabled, "order", createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    
    insert.run(
      id, packageData.title, packageData.subtitle, packageData.description,
      packageData.price, packageData.duration, JSON.stringify(packageData.features),
      packageData.color, packageData.textColor, packageData.borderColor, 
      packageData.headerTextColor || '', packageData.enabled ? 1 : 0, packageData.order, now, now
    )
    
    const created = db.prepare('SELECT * FROM coaching_packages WHERE id = ?').get(id) as any
    return {
      ...created,
      features: JSON.parse(created.features || '[]'),
      enabled: Boolean(created.enabled)
    } as CoachingPackage
  } catch (error) {
    console.error('Error creating coaching package:', error)
    throw error
  }
}

export async function updateCoachingPackage(id: string, packageData: Partial<CoachingPackage>): Promise<CoachingPackage> {
  const now = new Date().toISOString()
  
  try {
    const db = await getAdminDb()
    
    // Build dynamic update query
    const updates = []
    const values = []
    
    if (packageData.title !== undefined) { updates.push('title = ?'); values.push(packageData.title) }
    if (packageData.subtitle !== undefined) { updates.push('subtitle = ?'); values.push(packageData.subtitle) }
    if (packageData.description !== undefined) { updates.push('description = ?'); values.push(packageData.description) }
    if (packageData.price !== undefined) { updates.push('price = ?'); values.push(packageData.price) }
    if (packageData.duration !== undefined) { updates.push('duration = ?'); values.push(packageData.duration) }
    if (packageData.features !== undefined) { updates.push('features = ?'); values.push(JSON.stringify(packageData.features)) }
    if (packageData.color !== undefined) { updates.push('color = ?'); values.push(packageData.color) }
    if (packageData.textColor !== undefined) { updates.push('textColor = ?'); values.push(packageData.textColor) }
    if (packageData.borderColor !== undefined) { updates.push('borderColor = ?'); values.push(packageData.borderColor) }
    if (packageData.headerTextColor !== undefined) { updates.push('headerTextColor = ?'); values.push(packageData.headerTextColor) }
    if (packageData.enabled !== undefined) { updates.push('enabled = ?'); values.push(packageData.enabled ? 1 : 0) }
    if (packageData.order !== undefined) { updates.push('"order" = ?'); values.push(packageData.order) }
    
    updates.push('updatedAt = ?')
    values.push(now)
    values.push(id)
    
    const updateQuery = `UPDATE coaching_packages SET ${updates.join(', ')} WHERE id = ?`
    const update = db.prepare(updateQuery)
    update.run(...values)
    
    const updated = db.prepare('SELECT * FROM coaching_packages WHERE id = ?').get(id) as any
    return {
      ...updated,
      features: JSON.parse(updated.features || '[]'),
      enabled: Boolean(updated.enabled)
    } as CoachingPackage
  } catch (error) {
    console.error('Error updating coaching package:', error)
    throw error
  }
}

export async function deleteCoachingPackage(id: string): Promise<boolean> {
  try {
    const db = await getAdminDb()
    const deleteStmt = db.prepare('DELETE FROM coaching_packages WHERE id = ?')
    deleteStmt.run(id)
    return true
  } catch (error) {
    console.error('Error deleting coaching package:', error)
    return false
  }
}

// Offer Sections
export async function getOfferSections(): Promise<OfferSection[]> {
  try {
    const rows = await sql`
      SELECT * FROM offer_sections 
      ORDER BY "order" ASC, created_at ASC
    `
    return rows as OfferSection[]
  } catch (error) {
    console.error('Error fetching offer sections:', error)
    return []
  }
}

export async function getOfferSection(id: string): Promise<OfferSection | null> {
  try {
    const rows = await sql`
      SELECT * FROM offer_sections WHERE id = ${id}
    `
    return rows[0] as OfferSection || null
  } catch (error) {
    console.error('Error fetching offer section:', error)
    return null
  }
}

export async function createOfferSection(sectionData: Omit<OfferSection, 'id' | 'createdAt' | 'updatedAt'>): Promise<OfferSection> {
  const id = Date.now().toString()
  const now = new Date().toISOString()
  
  const rows = await sql`
    INSERT INTO offer_sections (
      id, title, description, icon, href, enabled, "order", created_at, updated_at
    ) VALUES (
      ${id}, ${sectionData.title}, ${sectionData.description}, ${sectionData.icon},
      ${sectionData.href}, ${sectionData.enabled}, ${sectionData.order}, ${now}, ${now}
    ) RETURNING *
  `
  
  return rows[0] as OfferSection
}

export async function updateOfferSection(id: string, sectionData: Partial<OfferSection>): Promise<OfferSection> {
  const now = new Date().toISOString()
  
  const rows = await sql`
    UPDATE offer_sections SET
      title = COALESCE(${sectionData.title}, title),
      description = COALESCE(${sectionData.description}, description),
      icon = COALESCE(${sectionData.icon}, icon),
      href = COALESCE(${sectionData.href}, href),
      enabled = COALESCE(${sectionData.enabled}, enabled),
      "order" = COALESCE(${sectionData.order}, "order"),
      updated_at = ${now}
    WHERE id = ${id}
    RETURNING *
  `
  
  return rows[0] as OfferSection
}

export async function deleteOfferSection(id: string): Promise<boolean> {
  try {
    await sql`DELETE FROM offer_sections WHERE id = ${id}`
    return true
  } catch (error) {
    console.error('Error deleting offer section:', error)
    return false
  }
}

// Video Content
export async function getVideoContent(): Promise<VideoContent[]> {
  try {
    const rows = await sql`
      SELECT * FROM video_content 
      ORDER BY created_at DESC
    `
    return rows as VideoContent[]
  } catch (error) {
    console.error('Error fetching video content:', error)
    return []
  }
}

export async function getActiveVideoContent(): Promise<VideoContent | null> {
  try {
    const rows = await sql`
      SELECT * FROM video_content 
      WHERE enabled = true
      ORDER BY created_at DESC
      LIMIT 1
    `
    return rows[0] as VideoContent || null
  } catch (error) {
    console.error('Error fetching active video content:', error)
    return null
  }
}

export async function getVideoContentById(id: string): Promise<VideoContent | null> {
  try {
    const rows = await sql`
      SELECT * FROM video_content WHERE id = ${id}
    `
    return rows[0] as VideoContent || null
  } catch (error) {
    console.error('Error fetching video content:', error)
    return null
  }
}

export async function createVideoContent(videoData: Omit<VideoContent, 'id' | 'createdAt' | 'updatedAt'>): Promise<VideoContent> {
  const id = Date.now().toString()
  const now = new Date().toISOString()
  
  const rows = await sql`
    INSERT INTO video_content (
      id, title, description, video_url, thumbnail_url, embed_code, enabled, created_at, updated_at
    ) VALUES (
      ${id}, ${videoData.title}, ${videoData.description}, ${videoData.videoUrl},
      ${videoData.thumbnailUrl || ''}, ${videoData.embedCode || ''}, ${videoData.enabled}, ${now}, ${now}
    ) RETURNING *
  `
  
  return rows[0] as VideoContent
}

export async function updateVideoContent(id: string, videoData: Partial<VideoContent>): Promise<VideoContent> {
  const now = new Date().toISOString()
  
  const rows = await sql`
    UPDATE video_content SET
      title = COALESCE(${videoData.title}, title),
      description = COALESCE(${videoData.description}, description),
      video_url = COALESCE(${videoData.videoUrl}, video_url),
      thumbnail_url = COALESCE(${videoData.thumbnailUrl}, thumbnail_url),
      embed_code = COALESCE(${videoData.embedCode}, embed_code),
      enabled = COALESCE(${videoData.enabled}, enabled),
      updated_at = ${now}
    WHERE id = ${id}
    RETURNING *
  `
  
  return rows[0] as VideoContent
}

export async function deleteVideoContent(id: string): Promise<boolean> {
  try {
    await sql`DELETE FROM video_content WHERE id = ${id}`
    return true
  } catch (error) {
    console.error('Error deleting video content:', error)
    return false
  }
}

// Workshops
export async function getWorkshops(): Promise<Workshop[]> {
  try {
    const db = await getAdminDb()
    const workshops = db.prepare('SELECT * FROM workshops ORDER BY "order" ASC').all() as any[]
    return workshops.map(workshop => ({
      ...workshop,
      features: JSON.parse(workshop.features || '[]'),
      enabled: Boolean(workshop.enabled)
    })) as Workshop[]
  } catch (error) {
    console.error('Error fetching workshops:', error)
    return []
  }
}

export async function getWorkshop(id: string): Promise<Workshop | null> {
  try {
    const db = await getAdminDb()
    const workshop = db.prepare('SELECT * FROM workshops WHERE id = ?').get(id) as any
    if (!workshop) return null
    
    return {
      ...workshop,
      features: JSON.parse(workshop.features || '[]'),
      enabled: Boolean(workshop.enabled)
    } as Workshop
  } catch (error) {
    console.error('Error fetching workshop:', error)
    return null
  }
}

export async function createWorkshop(workshopData: Omit<Workshop, 'id' | 'createdAt' | 'updatedAt'>): Promise<Workshop> {
  const db = await getAdminDb()
  const id = `ws_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const now = new Date().toISOString()
  
  const stmt = db.prepare(`
    INSERT INTO workshops (
      id, title, subtitle, description, price, duration, features, 
      color, textColor, borderColor, headerTextColor, enabled, "order", createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  
  stmt.run(
    id,
    workshopData.title,
    workshopData.subtitle,
    workshopData.description,
    workshopData.price,
    workshopData.duration,
    JSON.stringify(workshopData.features),
    workshopData.color,
    workshopData.textColor,
    workshopData.borderColor,
    workshopData.headerTextColor || '',
    workshopData.enabled ? 1 : 0,
    workshopData.order,
    now,
    now
  )
  
  return await getWorkshop(id) as Workshop
}

export async function updateWorkshop(id: string, workshopData: Partial<Workshop>): Promise<Workshop> {
  const db = await getAdminDb()
  const now = new Date().toISOString()
  
  const stmt = db.prepare(`
    UPDATE workshops SET
      title = COALESCE(?, title),
      subtitle = COALESCE(?, subtitle),
      description = COALESCE(?, description),
      price = COALESCE(?, price),
      duration = COALESCE(?, duration),
      features = COALESCE(?, features),
      color = COALESCE(?, color),
      textColor = COALESCE(?, textColor),
      borderColor = COALESCE(?, borderColor),
      headerTextColor = COALESCE(?, headerTextColor),
      enabled = COALESCE(?, enabled),
      "order" = COALESCE(?, "order"),
      updatedAt = ?
    WHERE id = ?
  `)
  
  stmt.run(
    workshopData.title,
    workshopData.subtitle,
    workshopData.description,
    workshopData.price,
    workshopData.duration,
    workshopData.features ? JSON.stringify(workshopData.features) : null,
    workshopData.color,
    workshopData.textColor,
    workshopData.borderColor,
    workshopData.headerTextColor,
    workshopData.enabled !== undefined ? (workshopData.enabled ? 1 : 0) : null,
    workshopData.order,
    now,
    id
  )
  
  return await getWorkshop(id) as Workshop
}

export async function deleteWorkshop(id: string): Promise<boolean> {
  try {
    const db = await getAdminDb()
    const stmt = db.prepare('DELETE FROM workshops WHERE id = ?')
    stmt.run(id)
    return true
  } catch (error) {
    console.error('Error deleting workshop:', error)
    return false
  }
}

// Admin Settings
export async function getAdminSettings(): Promise<AdminSettings[]> {
  try {
    const db = await getAdminDb()
    const settings = db.prepare('SELECT * FROM admin_settings ORDER BY key ASC').all()
    return settings as AdminSettings[]
  } catch (error) {
    console.error('Error fetching admin settings:', error)
    return []
  }
}

export async function getAdminSetting(key: string): Promise<AdminSettings | null> {
  try {
    const db = await getAdminDb()
    const setting = db.prepare('SELECT * FROM admin_settings WHERE key = ?').get(key)
    return setting as AdminSettings || null
  } catch (error) {
    console.error('Error fetching admin setting:', error)
    return null
  }
}

export async function updateAdminSetting(key: string, value: string): Promise<AdminSettings | null> {
  try {
    const db = await getAdminDb()
    const now = new Date().toISOString()
    
    const stmt = db.prepare(`
      UPDATE admin_settings SET
        value = ?,
        updatedAt = ?
      WHERE key = ?
    `)
    
    stmt.run(value, now, key)
    return await getAdminSetting(key)
  } catch (error) {
    console.error('Error updating admin setting:', error)
    return null
  }
}

// Initialize admin tables
export async function initializeAdminTables() {
  try {
    // Create coaching_packages table
    await sql`
      CREATE TABLE IF NOT EXISTS coaching_packages (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        subtitle TEXT NOT NULL,
        description TEXT NOT NULL,
        price TEXT NOT NULL,
        duration TEXT NOT NULL,
        features JSONB NOT NULL,
        color TEXT NOT NULL,
        text_color TEXT NOT NULL,
        border_color TEXT NOT NULL,
        header_text_color TEXT DEFAULT '',
        enabled BOOLEAN DEFAULT true,
        "order" INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `

    // Create offer_sections table
    await sql`
      CREATE TABLE IF NOT EXISTS offer_sections (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        icon TEXT NOT NULL,
        href TEXT NOT NULL,
        enabled BOOLEAN DEFAULT true,
        "order" INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `

    // Create video_content table
    await sql`
      CREATE TABLE IF NOT EXISTS video_content (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        video_url TEXT NOT NULL,
        thumbnail_url TEXT DEFAULT '',
        embed_code TEXT DEFAULT '',
        enabled BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `

    console.log('Admin tables initialized successfully')
  } catch (error) {
    console.error('Error initializing admin tables:', error)
    throw error
  }
}
import { neon } from '@neondatabase/serverless'

// Use a placeholder connection string during build if DATABASE_URL is not set
const connectionString = process.env.DATABASE_URL || 'postgresql://placeholder@localhost/dummy'
const sql = neon(connectionString)

/**
 * Lightweight table check — ensures daily_todos and ritual_completions exist.
 * Memoized per serverless invocation (runs once, then no-ops).
 */
let _tablesEnsured = false;
export async function ensureCoreTables() {
  if (_tablesEnsured) return;
  try {
    await Promise.all([
      sql`CREATE TABLE IF NOT EXISTS daily_todos (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        date DATE NOT NULL,
        todos JSONB NOT NULL DEFAULT '[]'::jsonb,
        nice_todos JSONB NOT NULL DEFAULT '[]'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, date)
      )`,
      sql`CREATE TABLE IF NOT EXISTS ritual_completions (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        ritual_id VARCHAR(255) NOT NULL,
        date DATE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, ritual_id, date)
      )`,
      sql`CREATE TABLE IF NOT EXISTS laborator_access (
        email VARCHAR(255) PRIMARY KEY,
        has_access BOOLEAN NOT NULL DEFAULT false,
        stripe_customer_id VARCHAR(255),
        stripe_subscription_id VARCHAR(255),
        subscription_status VARCHAR(50),
        source VARCHAR(50),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,
    ]);
    _tablesEnsured = true;
  } catch (e) {
    console.warn("[ensureCoreTables]", e);
  }
}

export async function initializeDatabase() {
  try {
    // Create inspirations table
    await sql`
      CREATE TABLE IF NOT EXISTS inspirations (
        id VARCHAR(255) PRIMARY KEY,
        type VARCHAR(50) NOT NULL CHECK (type IN ('blog', 'video', 'book', 'article', 'other')),
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        url TEXT,
        author TEXT,
        content TEXT,
        thumbnail TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `

    // Create index on type for faster queries
    await sql`
      CREATE INDEX IF NOT EXISTS idx_inspirations_type ON inspirations(type)
    `

    // Create index on created_at for sorting
    await sql`
      CREATE INDEX IF NOT EXISTS idx_inspirations_created_at ON inspirations(created_at DESC)
    `

    // Add image_url for book covers (optional)
    await sql`
      ALTER TABLE inspirations 
      ADD COLUMN IF NOT EXISTS image_url TEXT
    `

    // Add book_cover_fit for books: 'cover' | 'contain' (how cover image fits in the box)
    await sql`
      ALTER TABLE inspirations 
      ADD COLUMN IF NOT EXISTS book_cover_fit VARCHAR(20)
    `

    // Add book_cover_position for books: which part of image is visible when fit=cover
    await sql`
      ALTER TABLE inspirations 
      ADD COLUMN IF NOT EXISTS book_cover_position VARCHAR(20)
    `

    // Custom crop position 0-100 for book covers (from graphical modal)
    await sql`
      ALTER TABLE inspirations 
      ADD COLUMN IF NOT EXISTS book_cover_position_x INTEGER
    `
    await sql`
      ALTER TABLE inspirations 
      ADD COLUMN IF NOT EXISTS book_cover_position_y INTEGER
    `

    // Booking payments metadata
    await sql`
      ALTER TABLE bookings
      ADD COLUMN IF NOT EXISTS payment_status TEXT
    `
    await sql`
      ALTER TABLE bookings
      ADD COLUMN IF NOT EXISTS payment_due_at TIMESTAMP
    `
    await sql`
      ALTER TABLE bookings
      ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP
    `

    // Create principles table
    await sql`
      CREATE TABLE IF NOT EXISTS principles (
        id VARCHAR(255) PRIMARY KEY,
        slug VARCHAR(255) NOT NULL UNIQUE,
        title TEXT NOT NULL,
        short_description TEXT NOT NULL,
        content_markdown TEXT NOT NULL DEFAULT '',
        order_index INTEGER NOT NULL DEFAULT 0,
        video_url TEXT,
        related_inspiration_ids TEXT[] DEFAULT ARRAY[]::TEXT[],
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `

    // Index for ordering principles
    await sql`
      CREATE INDEX IF NOT EXISTS idx_principles_order_index ON principles(order_index, created_at DESC)
    `

    // Index for fast lookup by slug
    await sql`
      CREATE INDEX IF NOT EXISTS idx_principles_slug ON principles(slug)
    `

    // Create newsletter_subscribers table
    await sql`
      CREATE TABLE IF NOT EXISTS newsletter_subscribers (
        id VARCHAR(255) PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `

    // Create index on email for faster lookups
    await sql`
      CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscribers(email)
    `

    // Create index on created_at for sorting
    await sql`
      CREATE INDEX IF NOT EXISTS idx_newsletter_created_at ON newsletter_subscribers(created_at DESC)
    `

    // Create newsletter_pending_subscriptions table for double opt-in
    await sql`
      CREATE TABLE IF NOT EXISTS newsletter_pending_subscriptions (
        id VARCHAR(255) PRIMARY KEY,
        email TEXT NOT NULL,
        token TEXT NOT NULL UNIQUE,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `

    // Create index on token for faster lookups
    await sql`
      CREATE INDEX IF NOT EXISTS idx_pending_token ON newsletter_pending_subscriptions(token)
    `

    // Create index on email for faster lookups
    await sql`
      CREATE INDEX IF NOT EXISTS idx_pending_email ON newsletter_pending_subscriptions(email)
    `

    // Create index on expires_at for cleanup
    await sql`
      CREATE INDEX IF NOT EXISTS idx_pending_expires_at ON newsletter_pending_subscriptions(expires_at)
    `

    // Create newsletter_campaigns table for managing newsletter campaigns
    await sql`
      CREATE TABLE IF NOT EXISTS newsletter_campaigns (
        id VARCHAR(255) PRIMARY KEY,
        subject TEXT NOT NULL,
        description TEXT DEFAULT '',
        sections JSONB NOT NULL DEFAULT '[]'::jsonb,
        content TEXT DEFAULT '',
        scheduled_at TIMESTAMP WITH TIME ZONE,
        sent_at TIMESTAMP WITH TIME ZONE,
        status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sent')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `
    
    // Migrate old content column if it exists with NOT NULL constraint
    try {
      await sql`
        ALTER TABLE newsletter_campaigns 
        ALTER COLUMN content DROP NOT NULL
      `
    } catch (e) {
      // Constraint might not exist, ignore
    }
    
    try {
      await sql`
        ALTER TABLE newsletter_campaigns 
        ALTER COLUMN content SET DEFAULT ''
      `
    } catch (e) {
      // Column might not exist, ignore
    }
    
    // Add new columns if they don't exist
    await sql`
      ALTER TABLE newsletter_campaigns 
      ADD COLUMN IF NOT EXISTS description TEXT DEFAULT ''
    `
    
    await sql`
      ALTER TABLE newsletter_campaigns 
      ADD COLUMN IF NOT EXISTS sections JSONB DEFAULT '[]'::jsonb
    `

    // Create index on status for filtering
    await sql`
      CREATE INDEX IF NOT EXISTS idx_campaigns_status ON newsletter_campaigns(status)
    `

    // Create index on scheduled_at for finding campaigns to send
    await sql`
      CREATE INDEX IF NOT EXISTS idx_campaigns_scheduled_at ON newsletter_campaigns(scheduled_at)
    `

    // Create index on created_at for sorting
    await sql`
      CREATE INDEX IF NOT EXISTS idx_campaigns_created_at ON newsletter_campaigns(created_at DESC)
    `

    // ── User accounts ─────────────────────────────────────────────────────────

    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `

    await sql`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)
    `

    await sql`
      CREATE TABLE IF NOT EXISTS magic_link_tokens (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token TEXT NOT NULL UNIQUE,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        used_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `

    await sql`
      CREATE INDEX IF NOT EXISTS idx_magic_link_token ON magic_link_tokens(token)
    `

    await sql`
      CREATE INDEX IF NOT EXISTS idx_magic_link_expires ON magic_link_tokens(expires_at)
    `

    await sql`
      CREATE TABLE IF NOT EXISTS purchases (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        product_slug VARCHAR(255) NOT NULL,
        stripe_payment_id TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `

    await sql`
      CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON purchases(user_id)
    `

    // Audit života product price IDs
    try { await sql`ALTER TABLE admin_settings ADD COLUMN IF NOT EXISTS audit_zivota_price_id TEXT`; } catch { /* already exists */ }
    try { await sql`ALTER TABLE admin_settings ADD COLUMN IF NOT EXISTS audit_zivota_discount_price_id TEXT`; } catch { /* already exists */ }

    // Audit života journey persistence
    try { await sql`ALTER TABLE purchases ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE`; } catch { /* already exists */ }
    try { await sql`ALTER TABLE purchases ADD COLUMN IF NOT EXISTS journey_data JSONB`; } catch { /* already exists */ }

    // Update type check constraint to include 'reel' (drop old, add new)
    try {
      await sql`ALTER TABLE inspirations DROP CONSTRAINT IF EXISTS inspirations_type_check`
    } catch { /* ignore */ }
    try {
      await sql`ALTER TABLE inspirations ADD CONSTRAINT inspirations_type_check CHECK (type IN ('blog', 'video', 'book', 'article', 'other', 'music', 'reel', 'princip'))`
    } catch { /* already up to date */ }

    // Secondary categories (array of category IDs for filtering)
    try {
      await sql`ALTER TABLE inspirations ADD COLUMN IF NOT EXISTS secondary_category_ids TEXT[] DEFAULT ARRAY[]::TEXT[]`
    } catch { /* ignore */ }

    // Inspiration categories
    await sql`
      CREATE TABLE IF NOT EXISTS inspiration_categories (
        id VARCHAR(255) PRIMARY KEY,
        name TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `

    await sql`
      ALTER TABLE inspirations
      ADD COLUMN IF NOT EXISTS category_id VARCHAR(255) REFERENCES inspiration_categories(id) ON DELETE SET NULL
    `

    // Laboratoř free-access grants (admin-granted, no Stripe subscription required)
    await sql`
      CREATE TABLE IF NOT EXISTS laborator_grants (
        id VARCHAR(255) PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        expires_at TIMESTAMP WITH TIME ZONE,
        note TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `

    await sql`
      CREATE INDEX IF NOT EXISTS idx_laborator_grants_email ON laborator_grants(email)
    `

    // ── Laboratoř: týdenní check-in ────────────────────────────────────────────

    await sql`
      CREATE TABLE IF NOT EXISTS weekly_checkins (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        score SMALLINT NOT NULL CHECK (score BETWEEN 1 AND 10),
        week_start_date DATE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE (user_id, week_start_date)
      )
    `

    await sql`
      CREATE INDEX IF NOT EXISTS idx_weekly_checkins_user ON weekly_checkins(user_id, week_start_date DESC)
    `

    // Extend weekly_checkins with per-value and per-area JSONB scores
    try { await sql`ALTER TABLE weekly_checkins DROP CONSTRAINT IF EXISTS weekly_checkins_score_check` } catch {}
    try { await sql`ALTER TABLE weekly_checkins ALTER COLUMN score DROP NOT NULL` } catch {}
    await sql`ALTER TABLE weekly_checkins ADD COLUMN IF NOT EXISTS value_scores JSONB DEFAULT '{}'::jsonb`
    await sql`ALTER TABLE weekly_checkins ADD COLUMN IF NOT EXISTS area_scores  JSONB DEFAULT '{}'::jsonb`

    // ── Laboratoř: focus area history ──────────────────────────────────────────

    await sql`
      CREATE TABLE IF NOT EXISTS user_focus_areas (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        area_key VARCHAR(50) NOT NULL,
        started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        completed_at TIMESTAMP WITH TIME ZONE
      )
    `

    await sql`
      CREATE INDEX IF NOT EXISTS idx_user_focus_areas_user ON user_focus_areas(user_id, started_at DESC)
    `

    // ── Nástrojárna (Toolbox) ──────────────────────────────────────────────────

    await sql`
      CREATE TABLE IF NOT EXISTS toolbox_tools (
        id VARCHAR(255) PRIMARY KEY,
        slug VARCHAR(255) NOT NULL UNIQUE,
        title TEXT NOT NULL,
        short_description TEXT NOT NULL,
        description_markdown TEXT NOT NULL DEFAULT '',
        application_markdown TEXT NOT NULL DEFAULT '',
        sources JSONB NOT NULL DEFAULT '[]'::jsonb,
        tags TEXT[] DEFAULT ARRAY[]::TEXT[],
        category VARCHAR(100),
        difficulty SMALLINT CHECK (difficulty BETWEEN 1 AND 3),
        duration_estimate VARCHAR(50),
        icon VARCHAR(10),
        order_index INTEGER NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT true,
        is_featured BOOLEAN NOT NULL DEFAULT false,
        related_tool_ids TEXT[] DEFAULT ARRAY[]::TEXT[],
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `

    // Add tool_type and component_id for interactive tools
    await sql`
      ALTER TABLE toolbox_tools
      ADD COLUMN IF NOT EXISTS tool_type VARCHAR(20) NOT NULL DEFAULT 'knowledge'
    `

    await sql`
      ALTER TABLE toolbox_tools
      ADD COLUMN IF NOT EXISTS component_id VARCHAR(100)
    `

    await sql`
      CREATE INDEX IF NOT EXISTS idx_toolbox_slug ON toolbox_tools(slug)
    `

    await sql`
      CREATE INDEX IF NOT EXISTS idx_toolbox_category ON toolbox_tools(category)
    `

    await sql`
      CREATE INDEX IF NOT EXISTS idx_toolbox_order ON toolbox_tools(order_index, created_at DESC)
    `

    await sql`
      CREATE INDEX IF NOT EXISTS idx_toolbox_tags ON toolbox_tools USING GIN(tags)
    `

    // ── AI interakce + kreditové balíčky ─────────────────────────────────────

    await sql`
      CREATE TABLE IF NOT EXISTS ai_interactions (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        user_message TEXT NOT NULL,
        ai_response TEXT NOT NULL,
        recommended_slugs TEXT[] DEFAULT ARRAY[]::TEXT[],
        input_tokens INTEGER,
        output_tokens INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `

    await sql`
      CREATE INDEX IF NOT EXISTS idx_ai_interactions_user ON ai_interactions(user_id, created_at DESC)
    `

    await sql`
      CREATE TABLE IF NOT EXISTS ai_credit_packs (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        credits INTEGER NOT NULL DEFAULT 50,
        stripe_payment_id TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `

    await sql`
      CREATE INDEX IF NOT EXISTS idx_ai_credit_packs_user ON ai_credit_packs(user_id)
    `

    // ── Knowledge Pipeline ──────────────────────────────────────────────────

    await sql`
      CREATE TABLE IF NOT EXISTS pipeline_sources (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        url TEXT NOT NULL UNIQUE,
        type VARCHAR(50) NOT NULL,
        category VARCHAR(50) NOT NULL,
        priority VARCHAR(20) DEFAULT 'medium',
        is_active BOOLEAN DEFAULT true,
        last_fetched_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `

    await sql`
      CREATE TABLE IF NOT EXISTS pipeline_articles (
        id SERIAL PRIMARY KEY,
        source_id INTEGER REFERENCES pipeline_sources(id),
        title TEXT NOT NULL,
        url TEXT NOT NULL UNIQUE,
        author VARCHAR(255),
        published_at TIMESTAMPTZ,
        raw_content TEXT,
        content_type VARCHAR(50),
        fetched_at TIMESTAMPTZ DEFAULT NOW()
      )
    `

    await sql`
      CREATE INDEX IF NOT EXISTS idx_pipeline_articles_published ON pipeline_articles(published_at DESC)
    `

    await sql`
      CREATE INDEX IF NOT EXISTS idx_pipeline_articles_url ON pipeline_articles(url)
    `

    await sql`
      CREATE TABLE IF NOT EXISTS pipeline_briefs (
        id SERIAL PRIMARY KEY,
        article_id INTEGER REFERENCES pipeline_articles(id) UNIQUE,
        summary_cs TEXT NOT NULL,
        summary_en TEXT,
        relevance_score INTEGER NOT NULL CHECK (relevance_score BETWEEN 1 AND 10),
        categories TEXT[] NOT NULL,
        primary_category VARCHAR(50) NOT NULL,
        content_angle TEXT,
        key_insight TEXT,
        tags TEXT[],
        is_used BOOLEAN DEFAULT false,
        processed_at TIMESTAMPTZ DEFAULT NOW()
      )
    `

    await sql`
      CREATE INDEX IF NOT EXISTS idx_pipeline_briefs_relevance ON pipeline_briefs(relevance_score DESC)
    `

    await sql`
      CREATE INDEX IF NOT EXISTS idx_pipeline_briefs_category ON pipeline_briefs(primary_category)
    `

    await sql`
      CREATE INDEX IF NOT EXISTS idx_pipeline_briefs_used ON pipeline_briefs(is_used)
    `

    // Pipeline briefs — content pipeline columns
    await sql`ALTER TABLE pipeline_briefs ADD COLUMN IF NOT EXISTS pipeline_status VARCHAR(30) DEFAULT 'inbox'`
    await sql`ALTER TABLE pipeline_briefs ADD COLUMN IF NOT EXISTS pipeline_notes TEXT`
    await sql`ALTER TABLE pipeline_briefs ADD COLUMN IF NOT EXISTS saved_at TIMESTAMPTZ`
    await sql`ALTER TABLE pipeline_briefs ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ`
    await sql`ALTER TABLE pipeline_briefs ADD COLUMN IF NOT EXISTS published_url TEXT`

    await sql`CREATE INDEX IF NOT EXISTS idx_pipeline_briefs_status ON pipeline_briefs(pipeline_status)`
    await sql`CREATE INDEX IF NOT EXISTS idx_pipeline_briefs_saved ON pipeline_briefs(saved_at DESC)`

    // Trend clusters
    await sql`
      CREATE TABLE IF NOT EXISTS pipeline_trend_clusters (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        article_ids INTEGER[] NOT NULL,
        first_seen DATE NOT NULL,
        last_seen DATE NOT NULL,
        article_count INTEGER DEFAULT 1,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `

    await sql`
      CREATE TABLE IF NOT EXISTS pipeline_daily_briefs (
        id SERIAL PRIMARY KEY,
        brief_date DATE NOT NULL UNIQUE,
        top_articles INTEGER[] NOT NULL,
        other_articles INTEGER[],
        slack_message_ts VARCHAR(50),
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `

    // ── Curated Posts (Feed) ────────────────────────────────────────────────

    await sql`
      CREATE TABLE IF NOT EXISTS curated_posts (
        id VARCHAR(255) PRIMARY KEY,
        slug VARCHAR(255) NOT NULL UNIQUE,
        type VARCHAR(20) NOT NULL CHECK (type IN ('tip', 'digest')),
        title TEXT NOT NULL,
        subtitle TEXT,
        body_markdown TEXT NOT NULL DEFAULT '',
        body_html TEXT,
        video_script TEXT,
        cover_image_url TEXT,
        pipeline_brief_ids INTEGER[] DEFAULT ARRAY[]::INTEGER[],
        curator_note TEXT,
        categories TEXT[] DEFAULT ARRAY[]::TEXT[],
        tags TEXT[] DEFAULT ARRAY[]::TEXT[],
        status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
        is_premium BOOLEAN DEFAULT false,
        published_at TIMESTAMPTZ,
        week_number INTEGER,
        week_year INTEGER,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `

    await sql`CREATE INDEX IF NOT EXISTS idx_curated_posts_slug ON curated_posts(slug)`
    await sql`CREATE INDEX IF NOT EXISTS idx_curated_posts_status ON curated_posts(status)`
    await sql`CREATE INDEX IF NOT EXISTS idx_curated_posts_type ON curated_posts(type)`
    await sql`CREATE INDEX IF NOT EXISTS idx_curated_posts_published ON curated_posts(published_at DESC)`

    // ── Uživatelský kontext Laboratoře (sync kompas/hodnoty/rituály) ────────

    await sql`
      CREATE TABLE IF NOT EXISTS user_lab_context (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        context_type VARCHAR(50) NOT NULL,
        data JSONB NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, context_type)
      )
    `

    await sql`
      CREATE INDEX IF NOT EXISTS idx_user_lab_context_user ON user_lab_context(user_id)
    `

    // ── Daily Todos ─────────────────────────────────────────────────────────

    await sql`
      CREATE TABLE IF NOT EXISTS daily_todos (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        todos JSONB NOT NULL DEFAULT '[]'::jsonb,
        nice_todos JSONB NOT NULL DEFAULT '[]'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, date)
      )
    `

    await sql`
      CREATE INDEX IF NOT EXISTS idx_daily_todos_user_date ON daily_todos(user_id, date DESC)
    `

    // ── Ritual Completions ──────────────────────────────────────────────────

    await sql`
      CREATE TABLE IF NOT EXISTS ritual_completions (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        ritual_id VARCHAR(255) NOT NULL,
        date DATE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, ritual_id, date)
      )
    `

    await sql`
      CREATE INDEX IF NOT EXISTS idx_ritual_completions_user_date ON ritual_completions(user_id, date DESC)
    `

    console.log('Database initialized successfully')
  } catch (error) {
    console.error('Error initializing database:', error)
    throw error
  }
}

export { sql }

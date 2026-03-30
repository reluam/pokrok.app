/**
 * Seed pipeline sources into Neon DB.
 * Run once: npx tsx scripts/seed-pipeline-sources.ts
 *
 * Requires DATABASE_URL in .env.local or environment.
 */

import { neon } from '@neondatabase/serverless'

const SOURCES = [
  { name: "PsyPost", url: "https://www.psypost.org/feed", type: "rss", category: "psychology", priority: "high" },
  { name: "BPS Research Digest", url: "https://www.bps.org.uk/research-digest/rss", type: "rss", category: "psychology", priority: "high" },
  { name: "Greater Good Science Center", url: "https://greatergood.berkeley.edu/rss/all", type: "rss", category: "psychology", priority: "high" },
  { name: "Behavioral Scientist", url: "https://behavioralscientist.org/feed/", type: "rss", category: "psychology", priority: "medium" },
  { name: "Neuroscience News", url: "https://neurosciencenews.com/feed/", type: "rss", category: "neuroscience", priority: "high" },
  { name: "PubMed - Attention & Motivation", url: "https://pubmed.ncbi.nlm.nih.gov/rss/search/1/?query=attention+motivation+neuroplasticity&sort=date", type: "rss", category: "neuroscience", priority: "medium" },
  { name: "ScienceDaily - Living Well", url: "https://www.sciencedaily.com/rss/living_well.xml", type: "rss", category: "health", priority: "high" },
  { name: "Examine.com Research Feed", url: "https://examine.com/feed/", type: "rss", category: "health", priority: "high" },
  { name: "Huberman Lab Podcast", url: "https://feeds.megaphone.fm/hubermanlab", type: "podcast_rss", category: "health", priority: "high" },
  { name: "Found My Fitness (Rhonda Patrick)", url: "https://feeds.megaphone.fm/foundmyfitness", type: "podcast_rss", category: "health", priority: "medium" },
  { name: "Peter Attia - The Drive", url: "https://peterattia.com/feed/", type: "rss", category: "health", priority: "medium" },
  { name: "Cal Newport Blog", url: "https://calnewport.com/feed/", type: "rss", category: "productivity", priority: "high" },
  { name: "Ness Labs", url: "https://nesslabs.com/feed", type: "rss", category: "productivity", priority: "medium" },
  { name: "Farnam Street", url: "https://fs.blog/feed/", type: "rss", category: "productivity", priority: "high" },
  { name: "Mindful.org", url: "https://www.mindful.org/feed/", type: "rss", category: "mindfulness", priority: "high" },
  { name: "Tricycle", url: "https://tricycle.org/feed/", type: "rss", category: "mindfulness", priority: "medium" },
  { name: "PubMed - Mindfulness Research", url: "https://pubmed.ncbi.nlm.nih.gov/rss/search/1/?query=mindfulness+meditation+well-being&sort=date", type: "rss", category: "mindfulness", priority: "medium" },
  { name: "The Gottman Institute Blog", url: "https://www.gottman.com/blog/feed/", type: "rss", category: "relationships", priority: "medium" },
  { name: "The Conversation - Health", url: "https://theconversation.com/us/health/articles.atom", type: "rss", category: "health", priority: "medium" },
  { name: "Aeon Essays", url: "https://aeon.co/feed.rss", type: "rss", category: "psychology", priority: "medium" },
]

async function seedSources() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    console.error('DATABASE_URL is not set. Add it to .env.local or export it.')
    process.exit(1)
  }

  const sql = neon(connectionString)

  // Ensure all pipeline tables exist
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

  await sql`CREATE INDEX IF NOT EXISTS idx_pipeline_articles_published ON pipeline_articles(published_at DESC)`
  await sql`CREATE INDEX IF NOT EXISTS idx_pipeline_articles_url ON pipeline_articles(url)`

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

  await sql`CREATE INDEX IF NOT EXISTS idx_pipeline_briefs_relevance ON pipeline_briefs(relevance_score DESC)`
  await sql`CREATE INDEX IF NOT EXISTS idx_pipeline_briefs_category ON pipeline_briefs(primary_category)`
  await sql`CREATE INDEX IF NOT EXISTS idx_pipeline_briefs_used ON pipeline_briefs(is_used)`

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

  console.log('✓ All pipeline tables created')

  for (const source of SOURCES) {
    await sql`
      INSERT INTO pipeline_sources (name, url, type, category, priority)
      VALUES (${source.name}, ${source.url}, ${source.type}, ${source.category}, ${source.priority})
      ON CONFLICT (url) DO UPDATE SET
        name = ${source.name},
        category = ${source.category},
        priority = ${source.priority}
    `
    console.log(`✓ ${source.name}`)
  }

  console.log(`\nDone! Seeded ${SOURCES.length} sources.`)
  process.exit(0)
}

seedSources().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})

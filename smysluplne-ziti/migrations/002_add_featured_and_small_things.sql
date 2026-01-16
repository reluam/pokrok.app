-- Add featured column to articles table
ALTER TABLE articles ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS "featuredOrder" INTEGER;

-- Create index on featured for faster lookups
CREATE INDEX IF NOT EXISTS idx_articles_featured ON articles(featured);

-- Create small_things table
CREATE TABLE IF NOT EXISTS small_things (
  id VARCHAR(255) PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  source_url TEXT,
  "displayOrder" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Create index on displayOrder for sorting
CREATE INDEX IF NOT EXISTS idx_small_things_order ON small_things("displayOrder");

-- Create small_things_page table for page content (intro text, etc.)
CREATE TABLE IF NOT EXISTS small_things_page (
  id VARCHAR(255) PRIMARY KEY DEFAULT 'main',
  intro_text TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Insert default page entry
INSERT INTO small_things_page (id, intro_text)
VALUES ('main', '')
ON CONFLICT (id) DO NOTHING;

-- Create articles table
CREATE TABLE IF NOT EXISTS articles (
  id VARCHAR(255) PRIMARY KEY,
  title TEXT NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  published BOOLEAN DEFAULT false,
  "inspirationIds" TEXT[], -- Array of inspiration IDs
  image TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Create index on slug for faster lookups
CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_published ON articles(published);

-- Create inspiration table
CREATE TABLE IF NOT EXISTS inspiration (
  id VARCHAR(255) PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  link TEXT NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('article', 'video', 'book')),
  author TEXT,
  category VARCHAR(50) NOT NULL CHECK (category IN ('articles', 'videos', 'books')),
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Create index on category and type for faster lookups
CREATE INDEX IF NOT EXISTS idx_inspiration_category ON inspiration(category);
CREATE INDEX IF NOT EXISTS idx_inspiration_type ON inspiration(type);

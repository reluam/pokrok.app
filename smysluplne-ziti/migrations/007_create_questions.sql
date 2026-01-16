-- Create questions table (similar to small_things)
CREATE TABLE IF NOT EXISTS questions (
  id VARCHAR(255) PRIMARY KEY,
  question TEXT NOT NULL,
  description TEXT,
  category VARCHAR(100) DEFAULT 'obecne',
  "displayOrder" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create questions_page table for intro text and image
CREATE TABLE IF NOT EXISTS questions_page (
  id VARCHAR(255) PRIMARY KEY DEFAULT 'main',
  intro_text TEXT,
  image TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default page entry
INSERT INTO questions_page (id, intro_text) 
VALUES ('main', '')
ON CONFLICT (id) DO NOTHING;

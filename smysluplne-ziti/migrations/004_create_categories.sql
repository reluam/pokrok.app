-- Create categories table for small things
CREATE TABLE IF NOT EXISTS small_things_categories (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  "displayOrder" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Create index on displayOrder for sorting
CREATE INDEX IF NOT EXISTS idx_small_things_categories_order ON small_things_categories("displayOrder");

-- Insert default categories
INSERT INTO small_things_categories (id, name, "displayOrder") VALUES
  ('obecne', 'Obecné', 1),
  ('zdravi', 'Zdraví', 2),
  ('produktivita', 'Produktivita', 3),
  ('vztahy', 'Vztahy', 4),
  ('finance', 'Finance', 5),
  ('seberozvoj', 'Seberozvoj', 6)
ON CONFLICT (id) DO NOTHING;

-- Insert default "Bez kategorie" category
INSERT INTO small_things_categories (id, name, "displayOrder") VALUES
  ('bez-kategorie', 'Bez kategorie', 999)
ON CONFLICT (id) DO NOTHING;

-- Update existing small_things to use category IDs that match the new categories
-- This ensures existing data is preserved

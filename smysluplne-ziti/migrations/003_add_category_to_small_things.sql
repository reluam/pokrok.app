-- Add category column to small_things table
ALTER TABLE small_things ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'obecne';

-- Create index on category for faster lookups
CREATE INDEX IF NOT EXISTS idx_small_things_category ON small_things(category);

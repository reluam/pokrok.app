-- Add when and answer columns to questions table
ALTER TABLE questions ADD COLUMN IF NOT EXISTS when_text TEXT;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS answer TEXT;

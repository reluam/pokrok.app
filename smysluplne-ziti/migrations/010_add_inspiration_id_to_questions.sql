-- Add inspiration_id column to questions table
ALTER TABLE questions ADD COLUMN IF NOT EXISTS inspiration_id VARCHAR(255);

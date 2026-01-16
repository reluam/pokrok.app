-- Add image column to small_things table
ALTER TABLE small_things ADD COLUMN IF NOT EXISTS image TEXT;

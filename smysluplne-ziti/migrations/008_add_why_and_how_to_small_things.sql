-- Add why and how columns to small_things table
ALTER TABLE small_things ADD COLUMN IF NOT EXISTS why TEXT;
ALTER TABLE small_things ADD COLUMN IF NOT EXISTS how TEXT;

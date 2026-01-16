-- Move image from small_things to small_things_page
-- First, add image column to small_things_page
ALTER TABLE small_things_page ADD COLUMN IF NOT EXISTS image TEXT;

-- Remove image column from small_things (we don't need individual images anymore)
ALTER TABLE small_things DROP COLUMN IF EXISTS image;

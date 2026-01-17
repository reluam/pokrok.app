-- Change source_url to inspiration_id in small_things table
-- First, add the new column
ALTER TABLE small_things ADD COLUMN IF NOT EXISTS inspiration_id VARCHAR(255);

-- Note: We're not migrating existing source_url values automatically
-- as they would need manual mapping to inspiration items
-- The old source_url column will remain for backward compatibility but won't be used

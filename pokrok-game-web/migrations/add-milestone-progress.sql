-- Add progress column to milestones table
ALTER TABLE milestones 
ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0;

-- Update existing milestones to have 0 progress if null
UPDATE milestones 
SET progress = 0 
WHERE progress IS NULL;

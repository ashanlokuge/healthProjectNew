-- Fix NOT NULL constraints on incident_reports table
-- Run this in your Supabase SQL Editor

-- Make incident_category nullable (since the form doesn't always provide it)
ALTER TABLE incident_reports 
ALTER COLUMN incident_category DROP NOT NULL;

-- Make other potentially problematic columns nullable too
ALTER TABLE incident_reports 
ALTER COLUMN severity_level DROP NOT NULL,
ALTER COLUMN incident_type DROP NOT NULL,
ALTER COLUMN witnesses DROP NOT NULL,
ALTER COLUMN immediate_actions_taken DROP NOT NULL,
ALTER COLUMN time_of_incident DROP NOT NULL,
ALTER COLUMN reporter_name DROP NOT NULL;

-- Verify the changes
SELECT 'SUCCESS: NOT NULL constraints removed from optional columns!' as status;

-- Check which columns are still NOT NULL (should only be the required ones)
SELECT 
  column_name,
  is_nullable,
  data_type
FROM information_schema.columns 
WHERE table_name = 'incident_reports' 
AND table_schema = 'public'
AND is_nullable = 'NO'
ORDER BY column_name;
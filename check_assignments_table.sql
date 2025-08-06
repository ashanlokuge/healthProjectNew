-- Check assignments table structure
-- Run this in your Supabase SQL Editor

-- Show all columns in assignments table
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'assignments' 
ORDER BY ordinal_position;

-- Show recent assignments to see the data
SELECT id, hazard_report_id, reviewer_id, assignee_id, action, 
       target_completion_date, completed_at, created_at
FROM assignments 
ORDER BY created_at DESC 
LIMIT 5; 
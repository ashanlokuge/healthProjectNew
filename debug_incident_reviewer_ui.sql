-- Simple test to check if incident_reports table is accessible
-- Run this in your Supabase SQL Editor

-- Test 1: Check if table exists
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_name = 'incident_reports' AND table_schema = 'public'
    ) 
    THEN '✅ incident_reports table exists'
    ELSE '❌ incident_reports table does not exist'
  END as table_status;

-- Test 2: Try to select from the table (will fail if table doesn't exist)
SELECT 
  COUNT(*) as total_count,
  'incident_reports table is accessible' as access_status
FROM incident_reports;

-- Test 3: Check what data is in the table
SELECT 
  incident_title,
  status,
  created_at,
  user_id
FROM incident_reports 
ORDER BY created_at DESC 
LIMIT 5;

-- Test 4: Check if there are any submitted reports specifically
SELECT 
  COUNT(*) as submitted_count,
  'submitted reports found' as status
FROM incident_reports 
WHERE status = 'submitted';

-- Test 5: Show all statuses in the table
SELECT 
  status,
  COUNT(*) as count
FROM incident_reports 
GROUP BY status
ORDER BY count DESC;
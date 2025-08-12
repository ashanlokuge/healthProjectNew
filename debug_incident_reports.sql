-- Debug script to check incident reports data
-- Run this in your Supabase SQL Editor to see what's in the database

-- Check if incident_reports table exists and has data
SELECT 'Checking incident_reports table...' as step;

SELECT 
  COUNT(*) as total_reports,
  COUNT(CASE WHEN status = 'submitted' THEN 1 END) as submitted_reports,
  COUNT(CASE WHEN status = 'assigned' THEN 1 END) as assigned_reports
FROM incident_reports;

-- Show all incident reports with details
SELECT 
  id,
  incident_title,
  status,
  user_id,
  reporter_name,
  created_at,
  site,
  department
FROM incident_reports 
ORDER BY created_at DESC
LIMIT 10;

-- Check if incident_assignments table exists
SELECT 'Checking incident_assignments table...' as step;

SELECT COUNT(*) as total_assignments
FROM incident_assignments;

-- Check table structure
SELECT 'Checking table structure...' as step;

SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'incident_reports' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check foreign key constraints
SELECT 'Checking foreign keys...' as step;

SELECT 
  tc.table_name, 
  tc.constraint_name, 
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name = 'incident_reports';

-- Check RLS status
SELECT 'Checking RLS status...' as step;

SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('incident_reports', 'incident_assignments');
-- Test script to check if sot_reports table exists and verify structure
-- Run this in your Supabase SQL editor to diagnose the issue

-- Check if table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'sot_reports'
) as table_exists;

-- If table exists, show its structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'sot_reports'
ORDER BY ordinal_position;

-- Check RLS status
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'sot_reports';

-- Check RLS policies
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'sot_reports';

-- Test insert (this should work if everything is set up correctly)
-- INSERT INTO sot_reports (
--   user_id,
--   site,
--   department,
--   location,
--   personal_category,
--   date,
--   date_of_reporting,
--   type_of_work
-- ) VALUES (
--   auth.uid(),
--   'test',
--   'test',
--   'test',
--   'test',
--   '2025-01-01',
--   '2025-01-01',
--   'test'
-- );

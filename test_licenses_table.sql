-- Test script for licenses table setup
-- Run this in your Supabase SQL editor to verify everything is working

-- 1. Check if the licenses table exists
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_name = 'licenses';

-- 2. Check table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'licenses'
ORDER BY ordinal_position;

-- 3. Check if RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'licenses';

-- 4. Check RLS policies
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'licenses';

-- 5. Check if triggers exist
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'licenses';

-- 6. Check if functions exist
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines 
WHERE routine_name IN ('calculate_next_renewal', 'update_updated_at_column');

-- 7. Test insert (this will fail if RLS is working properly without auth)
-- INSERT INTO licenses (license_name, responsible_person, authority, validity_days, apply_before_days, date_of_renewal) 
-- VALUES ('Test License', 'Test Person', 'Test Authority', 365, 30, '2024-01-01');

-- 8. Check indexes
SELECT 
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'licenses';

-- 9. Check table size and row count (if any data exists)
SELECT 
  schemaname,
  tablename,
  n_tup_ins as rows_inserted,
  n_tup_upd as rows_updated,
  n_tup_del as rows_deleted
FROM pg_stat_user_tables 
WHERE tablename = 'licenses';

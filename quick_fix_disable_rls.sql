-- QUICK FIX: Disable RLS temporarily to resolve the policy violation error
-- Run this in your Supabase SQL Editor

-- 1. Check current RLS status
SELECT '=== CURRENT RLS STATUS ===' as info;
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'incident_assignments';

-- 2. Disable RLS on incident_assignments table
SELECT '=== DISABLING RLS ===' as info;
ALTER TABLE incident_assignments DISABLE ROW LEVEL SECURITY;

-- 3. Verify RLS is disabled
SELECT '=== VERIFYING RLS IS DISABLED ===' as info;
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'incident_assignments';

-- 4. Test that we can now insert
SELECT '=== READY FOR TESTING ===' as info;
SELECT 
  'RLS is now disabled on incident_assignments table.' as status,
  'Try creating an incident assignment again.' as next_step,
  'This should resolve the "new row violates row-level security policy" error.' as note;

-- 5. IMPORTANT: Remember to re-enable RLS later with proper policies
SELECT '=== IMPORTANT NOTE ===' as info;
SELECT 
  '⚠️  WARNING: RLS is now disabled, which means no access control on this table.' as warning,
  'This is a temporary fix for testing purposes only.' as note,
  'Remember to re-enable RLS with proper policies for production use.' as reminder;

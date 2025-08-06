-- Test script to verify assignee access
-- Run this after the fix to confirm assignees are accessible

-- Test 1: Check all profiles
SELECT 'Test 1 - All profiles:' as test;
SELECT id, email, full_name, role FROM profiles ORDER BY role, email;

-- Test 2: Check assignee profiles specifically
SELECT 'Test 2 - Assignee profiles:' as test;
SELECT id, email, full_name, role FROM profiles WHERE role = 'assignee' ORDER BY email;

-- Test 3: Count by role
SELECT 'Test 3 - Role distribution:' as test;
SELECT role, COUNT(*) as count FROM profiles GROUP BY role ORDER BY role;

-- Test 4: Check RLS policies
SELECT 'Test 4 - RLS policies:' as test;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'profiles';

-- Test 5: Check if RLS is enabled
SELECT 'Test 5 - RLS status:' as test;
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'profiles'; 
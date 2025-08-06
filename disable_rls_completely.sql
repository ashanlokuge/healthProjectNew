-- Completely disable RLS on profiles table
-- This will allow all access to profiles data

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can create own profile" ON profiles;
DROP POLICY IF EXISTS "reviewers_can_read_assignees" ON profiles;
DROP POLICY IF EXISTS "authenticated_users_read_profiles" ON profiles;
DROP POLICY IF EXISTS "read_all_profiles" ON profiles;
DROP POLICY IF EXISTS "update_own_profile" ON profiles;
DROP POLICY IF EXISTS "insert_own_profile" ON profiles;

-- Completely disable RLS
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Test query to verify access
SELECT id, email, full_name, role, created_at FROM profiles ORDER BY role, email; 
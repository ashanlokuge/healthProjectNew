-- Fix assignee roles and RLS policies
-- This will update existing accounts to have assignee role and fix access issues

-- First, let's see what profiles exist
SELECT 'Current profiles:' as info;
SELECT id, email, full_name, role, created_at FROM profiles ORDER BY role, email;

-- Drop all existing policies on profiles
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can create own profile" ON profiles;
DROP POLICY IF EXISTS "reviewers_can_read_assignees" ON profiles;
DROP POLICY IF EXISTS "authenticated_users_read_profiles" ON profiles;
DROP POLICY IF EXISTS "read_all_profiles" ON profiles;
DROP POLICY IF EXISTS "update_own_profile" ON profiles;
DROP POLICY IF EXISTS "insert_own_profile" ON profiles;

-- Completely disable RLS temporarily
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Update existing accounts to have assignee role
-- Update all profiles except the current user to be assignees
UPDATE profiles 
SET role = 'assignee', updated_at = NOW()
WHERE role != 'reviewer' AND role != 'assignee';

-- Also update specific emails if they exist
UPDATE profiles 
SET role = 'assignee', updated_at = NOW()
WHERE email IN (
  'testassignee@gmail.com',
  'test22@gmail.com', 
  'test101@gmail.com',
  'test11@gmail.com',
  'test44@gmail.com'
);

-- Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create a simple policy that allows all authenticated users to read all profiles
CREATE POLICY "read_all_profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

-- Allow users to update their own profile
CREATE POLICY "update_own_profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow users to insert their own profile
CREATE POLICY "insert_own_profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Show the results
SELECT 'After update:' as info;
SELECT id, email, full_name, role, created_at FROM profiles ORDER BY role, email;

-- Show role distribution
SELECT 'Role distribution:' as info;
SELECT role, COUNT(*) as count FROM profiles GROUP BY role ORDER BY role; 
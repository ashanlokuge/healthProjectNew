-- Temporarily disable RLS on profiles table to allow assignee loading
-- This is a temporary fix to ensure the assignee dropdown works

-- Drop all existing policies
DROP POLICY IF EXISTS "profiles_read_own" ON profiles;
DROP POLICY IF EXISTS "profiles_read_assignees_by_reviewer" ON profiles;
DROP POLICY IF EXISTS "reviewers_can_read_assignees" ON profiles;
DROP POLICY IF EXISTS "authenticated_users_read_profiles" ON profiles;

-- Disable RLS temporarily
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Create a simple policy that allows all authenticated users to read profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_authenticated_read_profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

-- Allow users to update their own profiles
CREATE POLICY "allow_users_update_own_profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow users to insert their own profiles
CREATE POLICY "allow_users_insert_own_profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
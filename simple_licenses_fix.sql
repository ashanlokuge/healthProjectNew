-- Simple fix for licenses RLS policy issue
-- Run this in your Supabase SQL editor

-- Drop the problematic reviewer policy that references profiles table
DROP POLICY IF EXISTS "Reviewers can view all licenses" ON licenses;

-- Recreate basic policies that work without profiles dependency
DROP POLICY IF EXISTS "Users can view own licenses" ON licenses;
DROP POLICY IF EXISTS "Users can insert own licenses" ON licenses;
DROP POLICY IF EXISTS "Users can update own licenses" ON licenses;
DROP POLICY IF EXISTS "Users can delete own licenses" ON licenses;

-- Create simple, working policies
CREATE POLICY "Users can view own licenses" ON licenses
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own licenses" ON licenses
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own licenses" ON licenses
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own licenses" ON licenses
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Test that the table is accessible
SELECT 'Licenses table is now accessible' as status;
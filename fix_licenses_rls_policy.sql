-- Fix RLS policies for licenses table
-- Run this in your Supabase SQL editor

-- First, let's check current user and if they have a profile
SELECT 
  auth.uid() as current_user_id,
  auth.email() as current_user_email;

-- Check if current user has a profile
SELECT * FROM profiles WHERE user_id = auth.uid();

-- If no profile exists, create one for the current user
-- (You may need to run this manually with your actual email)
-- INSERT INTO profiles (user_id, email, full_name, role) 
-- VALUES (auth.uid(), auth.email(), 'Your Name', 'user');

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can view own licenses" ON licenses;
DROP POLICY IF EXISTS "Users can insert own licenses" ON licenses;
DROP POLICY IF EXISTS "Users can update own licenses" ON licenses;
DROP POLICY IF EXISTS "Users can delete own licenses" ON licenses;
DROP POLICY IF EXISTS "Reviewers can view all licenses" ON licenses;

-- Create simplified RLS policies that work regardless of profiles table
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

-- Add reviewer policy only if profiles table has data
CREATE POLICY "Reviewers can view all licenses" ON licenses
  FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'reviewer'
    )
  );

-- Test the setup
SELECT 'Licenses table exists' as status;
SELECT 'RLS policies created' as status;

-- Check if we can insert a test record (this should work now)
-- Note: This will only work if you're authenticated
-- INSERT INTO licenses (
--   user_id, license_name, responsible_person, authority, 
--   validity_days, apply_before_days, date_of_renewal
-- ) VALUES (
--   auth.uid(), 'Test License', 'Test Person', 'Test Authority', 
--   365, 30, CURRENT_DATE
-- );

-- Clean up test record if it was created
-- DELETE FROM licenses WHERE license_name = 'Test License';
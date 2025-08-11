-- Fix RLS policies for sot_reports table
-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view own SOT reports" ON sot_reports;
DROP POLICY IF EXISTS "Users can insert own SOT reports" ON sot_reports;
DROP POLICY IF EXISTS "Users can update own SOT reports" ON sot_reports;
DROP POLICY IF EXISTS "Reviewers can view all SOT reports" ON sot_reports;
DROP POLICY IF EXISTS "Reviewers can update SOT report status" ON sot_reports;

-- Create simpler, more permissive policies
-- Allow authenticated users to insert their own reports
CREATE POLICY "Allow authenticated users to insert SOT reports" ON sot_reports
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow users to view their own reports
CREATE POLICY "Allow users to view own SOT reports" ON sot_reports
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Allow users to update their own reports
CREATE POLICY "Allow users to update own SOT reports" ON sot_reports
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- Allow reviewers to view all reports
CREATE POLICY "Allow reviewers to view all SOT reports" ON sot_reports
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'reviewer'
    )
  );

-- Allow reviewers to update all reports
CREATE POLICY "Allow reviewers to update all SOT reports" ON sot_reports
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'reviewer'
    )
  );

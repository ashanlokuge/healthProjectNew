-- Fix RLS policies for reviewers
-- This will ensure reviewers can see all reports and assignments

-- 1. Drop existing restrictive policies
DROP POLICY IF EXISTS "Reviewers can read all reports" ON hazard_reports;
DROP POLICY IF EXISTS "Reviewers can read assignments they created" ON assignments;

-- 2. Create more permissive policies for reviewers
CREATE POLICY "Reviewers can read all reports"
  ON hazard_reports FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND role = 'reviewer'
    )
  );

CREATE POLICY "Reviewers can read all assignments"
  ON assignments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND role = 'reviewer'
    )
  );

-- 3. Create policy for reviewers to update reports
CREATE POLICY "Reviewers can update reports"
  ON hazard_reports FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND role = 'reviewer'
    )
  );

-- 4. Create policy for reviewers to update assignments
CREATE POLICY "Reviewers can update assignments"
  ON assignments FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND role = 'reviewer'
    )
  );

-- 5. Create policy for reviewers to insert assignments
CREATE POLICY "Reviewers can insert assignments"
  ON assignments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND role = 'reviewer'
    )
  );

-- 6. Verify the policies were created
SELECT 
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename IN ('hazard_reports', 'assignments')
AND policyname LIKE '%reviewer%'
ORDER BY tablename, policyname; 
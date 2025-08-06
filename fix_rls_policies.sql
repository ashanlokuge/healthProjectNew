-- Fix RLS policies for reviewers
-- This will ensure reviewers can see all reports and assignments

-- 1. Drop existing restrictive policies
DROP POLICY IF EXISTS "Reviewers can read all reports" ON hazard_reports;
DROP POLICY IF EXISTS "Reviewers can read assignments they created" ON assignments;
DROP POLICY IF EXISTS "Reviewers can read all assignments" ON assignments;

-- 2. Create permissive policies for reviewers
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

-- 3. Create policy for reviewers to read all profiles
CREATE POLICY "Reviewers can read all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND role = 'reviewer'
    )
  );

-- 4. Test the queries that the reviewer dashboard uses
SELECT '=== TESTING REVIEWER ACCESS ===' as info;

-- Test submitted reports query
SELECT COUNT(*) as submitted_reports_count
FROM hazard_reports
WHERE status = 'submitted';

-- Test assignments query
SELECT COUNT(*) as pending_assignments_count
FROM assignments a
JOIN profiles p ON a.reviewer_id = p.id
WHERE p.user_id = auth.uid()
  AND (a.review_status IS NULL OR a.review_status = 'pending');

-- 5. Show current user info
SELECT 
  auth.uid() as current_user_id,
  (SELECT role FROM profiles WHERE user_id = auth.uid()) as user_role; 
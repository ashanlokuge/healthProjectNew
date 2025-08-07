-- Fix Incident Reports Visibility for Reviewers
-- This will ensure reviewers can see all incident reports in the dashboard

-- 1. Check current data state
SELECT '=== CURRENT DATA STATE ===' as info;
SELECT 
  'Total incident reports: ' || (SELECT COUNT(*) FROM incident_reports) as reports_count,
  'Submitted incident reports: ' || (SELECT COUNT(*) FROM incident_reports WHERE status = 'submitted') as submitted_count;

-- 2. Check current user
SELECT '=== CURRENT USER ===' as info;
SELECT 
  auth.uid() as current_user_id,
  (SELECT role FROM profiles WHERE user_id = auth.uid()) as user_role;

-- 3. Fix incident reports that don't have 'submitted' status
SELECT '=== FIXING INCIDENT REPORT STATUS ===' as info;
UPDATE incident_reports 
SET status = 'submitted' 
WHERE status IS NULL OR status = '' OR status NOT IN ('submitted', 'assigned', 'in_progress', 'completed', 'approved', 'rejected');

-- 4. Fix RLS policies for incident_reports to allow reviewers to see all reports
SELECT '=== FIXING INCIDENT_REPORTS RLS ===' as info;
DROP POLICY IF EXISTS "Users can create incident reports" ON incident_reports;
DROP POLICY IF EXISTS "Users can read their incident reports" ON incident_reports;
DROP POLICY IF EXISTS "Reviewers can read all incident reports" ON incident_reports;
DROP POLICY IF EXISTS "Reviewers can update incident reports" ON incident_reports;

-- Create comprehensive policies for incident_reports
CREATE POLICY "Users can create incident reports"
  ON incident_reports FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can read their incident reports"
  ON incident_reports FOR SELECT
  TO authenticated
  USING (
    user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Reviewers can read all incident reports"
  ON incident_reports FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'reviewer'
    )
  );

CREATE POLICY "Reviewers can update incident reports"
  ON incident_reports FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'reviewer'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'reviewer'
    )
  );

-- 5. Test the exact query that the reviewer dashboard uses
SELECT '=== TESTING REVIEWER DASHBOARD QUERY ===' as info;

-- Test: Load unassigned incident reports (what the dashboard queries for)
SELECT 'Unassigned incident reports count:' as query_type, COUNT(*) as count
FROM incident_reports
WHERE status = 'submitted';

-- Test: Show the actual reports that should appear
SELECT 'Reports that should appear in dashboard:' as query_type, 
  id,
  incident_title,
  status,
  created_at
FROM incident_reports
WHERE status = 'submitted'
ORDER BY created_at DESC;

-- 6. Show final data state
SELECT '=== FINAL DATA STATE ===' as info;
SELECT 
  'Total incident reports: ' || (SELECT COUNT(*) FROM incident_reports) as reports_count,
  'Submitted incident reports: ' || (SELECT COUNT(*) FROM incident_reports WHERE status = 'submitted') as submitted_count;

-- 7. Test RLS policies by checking what the current user can see
SELECT '=== RLS POLICY TEST ===' as info;
SELECT 
  'Current user can read incident reports: ' || 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM incident_reports 
      WHERE user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
      OR EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'reviewer')
    ) THEN 'YES'
    ELSE 'NO'
  END as read_reports_permission;

-- 8. Show sample data for verification
SELECT '=== SAMPLE INCIDENT REPORTS ===' as info;
SELECT 
  id,
  incident_title,
  status,
  created_at
FROM incident_reports
ORDER BY created_at DESC
LIMIT 5; 
-- Fix Incident Reviewer UI Issues
-- This will ensure the incident reviewer dashboard shows data properly

-- 1. Check current data state
SELECT '=== CURRENT DATA STATE ===' as info;
SELECT 
  'Total incident reports: ' || (SELECT COUNT(*) FROM incident_reports) as reports_count,
  'Submitted incident reports: ' || (SELECT COUNT(*) FROM incident_reports WHERE status = 'submitted') as submitted_count,
  'Total incident assignments: ' || (SELECT COUNT(*) FROM incident_assignments) as assignments_count,
  'Pending review assignments: ' || (SELECT COUNT(*) FROM incident_assignments WHERE completed_at IS NOT NULL AND (review_status IS NULL OR review_status = 'pending')) as pending_review_count,
  'Reviewed assignments: ' || (SELECT COUNT(*) FROM incident_assignments WHERE review_status IN ('approved', 'rejected')) as reviewed_count;

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

-- 4. Create test incident assignment if none exist
SELECT '=== CREATING TEST INCIDENT ASSIGNMENT ===' as info;
INSERT INTO incident_assignments (
  incident_report_id,
  reviewer_id,
  assignee_id,
  action,
  target_completion_date,
  remark,
  review_status
)
SELECT 
  ir.id,
  p_reviewer.id,
  p_assignee.id,
  'Investigate and resolve the incident',
  (CURRENT_DATE + INTERVAL '7 days')::date,
  'Test assignment created automatically',
  'pending'
FROM incident_reports ir
CROSS JOIN profiles p_reviewer
CROSS JOIN profiles p_assignee
WHERE ir.status = 'submitted'
  AND p_reviewer.role = 'reviewer'
  AND p_assignee.role = 'assignee'
  AND NOT EXISTS (
    SELECT 1 FROM incident_assignments ia WHERE ia.incident_report_id = ir.id
  )
LIMIT 1;

-- 5. Fix RLS policies for incident_reports
SELECT '=== FIXING INCIDENT_REPORTS RLS ===' as info;
DROP POLICY IF EXISTS "Users can create incident reports" ON incident_reports;
DROP POLICY IF EXISTS "Users can read their incident reports" ON incident_reports;
DROP POLICY IF EXISTS "Reviewers can read all incident reports" ON incident_reports;
DROP POLICY IF EXISTS "Reviewers can update incident reports" ON incident_reports;

-- Create permissive policies for incident_reports
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

-- 6. Fix RLS policies for incident_assignments
SELECT '=== FIXING INCIDENT_ASSIGNMENTS RLS ===' as info;
DROP POLICY IF EXISTS "Reviewers can create incident assignments" ON incident_assignments;
DROP POLICY IF EXISTS "Reviewers can read incident assignments" ON incident_assignments;
DROP POLICY IF EXISTS "Reviewers can update incident assignments" ON incident_assignments;
DROP POLICY IF EXISTS "Assignees can read their incident assignments" ON incident_assignments;
DROP POLICY IF EXISTS "Assignees can update their incident assignments" ON incident_assignments;

-- Create comprehensive policies for incident_assignments
CREATE POLICY "Reviewers can create incident assignments"
  ON incident_assignments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'reviewer'
    )
  );

CREATE POLICY "Reviewers can read incident assignments"
  ON incident_assignments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'reviewer'
    )
  );

CREATE POLICY "Reviewers can update incident assignments"
  ON incident_assignments FOR UPDATE
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

CREATE POLICY "Assignees can read their incident assignments"
  ON incident_assignments FOR SELECT
  TO authenticated
  USING (
    assignee_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Assignees can update their incident assignments"
  ON incident_assignments FOR UPDATE
  TO authenticated
  USING (
    assignee_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    assignee_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- 7. Test the queries that the incident reviewer dashboard uses
SELECT '=== TESTING INCIDENT REVIEWER DASHBOARD QUERIES ===' as info;

-- Test: Load unassigned incident reports
SELECT 'Unassigned incident reports count:' as query_type, COUNT(*) as count
FROM incident_reports
WHERE status = 'submitted';

-- Test: Load incident assignments (exclude approved/rejected tasks)
SELECT 'Active incident assignments count:' as query_type, COUNT(*) as count
FROM incident_assignments
WHERE review_status NOT IN ('approved', 'rejected') OR review_status IS NULL;

-- Test: Load tasks pending review
SELECT 'Pending review incident tasks count:' as query_type, COUNT(*) as count
FROM incident_assignments
WHERE completed_at IS NOT NULL AND (review_status IS NULL OR review_status = 'pending');

-- Test: Load reviewed tasks
SELECT 'Reviewed incident tasks count:' as query_type, COUNT(*) as count
FROM incident_assignments
WHERE review_status IN ('approved', 'rejected');

-- 8. Show final data state
SELECT '=== FINAL DATA STATE ===' as info;
SELECT 
  'Total incident reports: ' || (SELECT COUNT(*) FROM incident_reports) as reports_count,
  'Submitted incident reports: ' || (SELECT COUNT(*) FROM incident_reports WHERE status = 'submitted') as submitted_count,
  'Total incident assignments: ' || (SELECT COUNT(*) FROM incident_assignments) as assignments_count,
  'Pending review assignments: ' || (SELECT COUNT(*) FROM incident_assignments WHERE completed_at IS NOT NULL AND (review_status IS NULL OR review_status = 'pending')) as pending_review_count,
  'Reviewed assignments: ' || (SELECT COUNT(*) FROM incident_assignments WHERE review_status IN ('approved', 'rejected')) as reviewed_count;

-- 9. Show sample data for verification
SELECT '=== SAMPLE INCIDENT REPORTS ===' as info;
SELECT 
  id,
  incident_title,
  status,
  created_at
FROM incident_reports
ORDER BY created_at DESC
LIMIT 5;

SELECT '=== SAMPLE INCIDENT ASSIGNMENTS ===' as info;
SELECT 
  a.id,
  a.incident_report_id,
  a.reviewer_id,
  a.assignee_id,
  a.completed_at,
  a.review_status,
  ir.incident_title
FROM incident_assignments a
LEFT JOIN incident_reports ir ON a.incident_report_id = ir.id
ORDER BY a.created_at DESC
LIMIT 5; 
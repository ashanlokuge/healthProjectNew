-- Fix Missing reviewer_id in Incident Assignments
-- This will fix the specific issue where some assignments have NULL reviewer_id

-- 1. Check current state of assignments with NULL reviewer_id
SELECT '=== ASSIGNMENTS WITH NULL REVIEWER_ID ===' as info;
SELECT 
  id,
  incident_report_id,
  reviewer_id,
  assignee_id,
  review_status,
  created_at
FROM incident_assignments 
WHERE reviewer_id IS NULL;

-- 2. Get current user's profile ID (assuming you're logged in as a reviewer)
SELECT '=== CURRENT USER PROFILE ===' as info;
SELECT 
  id,
  full_name,
  email,
  role,
  user_id
FROM profiles 
WHERE user_id = auth.uid();

-- 3. Fix assignments with NULL reviewer_id by setting them to current user
SELECT '=== FIXING NULL REVIEWER_ID ===' as info;
UPDATE incident_assignments 
SET reviewer_id = (
  SELECT id FROM profiles 
  WHERE user_id = auth.uid() 
  AND role = 'reviewer'
  LIMIT 1
)
WHERE reviewer_id IS NULL;

-- 4. Also fix any assignments with incorrect review_status
SELECT '=== FIXING REVIEW_STATUS ===' as info;
UPDATE incident_assignments 
SET review_status = 'pending'
WHERE review_status = 'submitted' OR review_status IS NULL;

-- 5. Verify the fix
SELECT '=== VERIFICATION - ALL ASSIGNMENTS ===' as info;
SELECT 
  id,
  incident_report_id,
  reviewer_id,
  assignee_id,
  review_status,
  created_at
FROM incident_assignments 
ORDER BY created_at DESC;

-- 6. Test the queries that the reviewer dashboard uses
SELECT '=== TESTING REVIEWER DASHBOARD QUERIES ===' as info;

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

-- 7. Show final summary
SELECT '=== FINAL SUMMARY ===' as info;
SELECT 
  'Total incident reports: ' || (SELECT COUNT(*) FROM incident_reports) as reports_count,
  'Submitted incident reports: ' || (SELECT COUNT(*) FROM incident_reports WHERE status = 'submitted') as submitted_count,
  'Total incident assignments: ' || (SELECT COUNT(*) FROM incident_assignments) as assignments_count,
  'Assignments with reviewer_id: ' || (SELECT COUNT(*) FROM incident_assignments WHERE reviewer_id IS NOT NULL) as assignments_with_reviewer_count,
  'Pending review assignments: ' || (SELECT COUNT(*) FROM incident_assignments WHERE completed_at IS NOT NULL AND (review_status IS NULL OR review_status = 'pending')) as pending_review_count,
  'Reviewed assignments: ' || (SELECT COUNT(*) FROM incident_assignments WHERE review_status IN ('approved', 'rejected')) as reviewed_count; 
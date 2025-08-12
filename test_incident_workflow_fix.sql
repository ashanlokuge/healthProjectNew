-- Test Incident Assignment Workflow Fix
-- This script will verify that the workflow is now working correctly

-- 1. Check current incident assignments and their review status
SELECT '=== CURRENT INCIDENT ASSIGNMENTS STATUS ===' as info;
SELECT 
  ia.id,
  ia.incident_report_id,
  ia.reviewer_id,
  ia.assignee_id,
  ia.action,
  ia.completed_at,
  ia.review_status,
  ia.reviewed_at,
  ia.created_at,
  ir.incident_title,
  ir.status as report_status
FROM incident_assignments ia
LEFT JOIN incident_reports ir ON ia.incident_report_id = ir.id
ORDER BY ia.created_at DESC;

-- 2. Check incident reports and their status
SELECT '=== INCIDENT REPORTS STATUS ===' as info;
SELECT 
  id,
  incident_title,
  status,
  created_at
FROM incident_reports
ORDER BY created_at DESC;

-- 3. Check for assignments that should be pending review
SELECT '=== ASSIGNMENTS READY FOR REVIEW ===' as info;
SELECT 
  ia.id,
  ia.incident_report_id,
  ia.action,
  ia.completed_at,
  ia.review_status,
  ir.incident_title,
  ir.status as report_status
FROM incident_assignments ia
LEFT JOIN incident_reports ir ON ia.incident_report_id = ir.id
WHERE ia.completed_at IS NOT NULL 
  AND ia.review_status = 'pending'
ORDER BY ia.completed_at DESC;

-- 4. Check for assignments that need review status update
SELECT '=== ASSIGNMENTS NEEDING REVIEW STATUS UPDATE ===' as info;
SELECT 
  ia.id,
  ia.incident_report_id,
  ia.action,
  ia.completed_at,
  ia.review_status,
  ir.incident_title,
  ir.status as report_status
FROM incident_assignments ia
LEFT JOIN incident_reports ir ON ia.incident_report_id = ir.id
WHERE ia.completed_at IS NOT NULL 
  AND (ia.review_status IS NULL OR ia.review_status = '')
ORDER BY ia.completed_at DESC;

-- 5. Fix any assignments that don't have proper review status
SELECT '=== FIXING MISSING REVIEW STATUS ===' as info;
UPDATE incident_assignments 
SET review_status = 'pending'
WHERE completed_at IS NOT NULL 
  AND (review_status IS NULL OR review_status = '');

-- 6. Fix any incident reports that should be in_review
SELECT '=== FIXING INCIDENT REPORT STATUS ===' as info;
UPDATE incident_reports 
SET status = 'in_review'
WHERE id IN (
  SELECT DISTINCT incident_report_id 
  FROM incident_assignments 
  WHERE completed_at IS NOT NULL 
    AND review_status = 'pending'
);

-- 7. Verify the fixes
SELECT '=== VERIFICATION AFTER FIXES ===' as info;
SELECT 
  'Total assignments: ' || COUNT(*) as total_assignments,
  'Completed assignments: ' || COUNT(CASE WHEN completed_at IS NOT NULL THEN 1 END) as completed_count,
  'Pending review: ' || COUNT(CASE WHEN review_status = 'pending' THEN 1 END) as pending_review_count,
  'Approved: ' || COUNT(CASE WHEN review_status = 'approved' THEN 1 END) as approved_count,
  'Rejected: ' || COUNT(CASE WHEN review_status = 'rejected' THEN 1 END) as rejected_count
FROM incident_assignments;

-- 8. Check incident report status distribution
SELECT '=== INCIDENT REPORT STATUS DISTRIBUTION ===' as info;
SELECT 
  status,
  COUNT(*) as count
FROM incident_reports
GROUP BY status
ORDER BY count DESC;

-- 9. Ready for testing
SELECT '=== READY FOR TESTING ===' as info;
SELECT 
  'The incident assignment workflow should now work correctly.' as status,
  '1. Assignees can submit completed tasks (sets review_status = pending)' as step1,
  '2. Reviewers will see tasks in "Tasks to Review" tab' as step2,
  '3. Reviewers can approve/reject tasks' as step3,
  '4. Status flow: submitted → assigned → in_review → approved/rejected' as workflow;

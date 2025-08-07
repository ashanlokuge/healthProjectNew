-- Debug Incident Reviewer UI Issues
-- This will help us understand why the incident reviewer dashboard shows no data

-- 1. Check current user context
SELECT '=== CURRENT USER ===' as info;
SELECT 
  auth.uid() as current_user_id,
  auth.role() as current_role;

-- 2. Check current user's profile
SELECT '=== CURRENT USER PROFILE ===' as info;
SELECT 
  id,
  full_name,
  email,
  role,
  user_id,
  created_at
FROM profiles 
WHERE user_id = auth.uid();

-- 3. Check ALL incident reports (without any filters)
SELECT '=== ALL INCIDENT REPORTS ===' as info;
SELECT 
  id,
  incident_title,
  status,
  user_id,
  created_at
FROM incident_reports
ORDER BY created_at DESC;

-- 4. Check incident reports with 'submitted' status (what the reviewer query looks for)
SELECT '=== SUBMITTED INCIDENT REPORTS ===' as info;
SELECT 
  id,
  incident_title,
  status,
  user_id,
  created_at
FROM incident_reports
WHERE status = 'submitted'
ORDER BY created_at DESC;

-- 5. Check all possible status values in incident_reports
SELECT '=== ALL INCIDENT REPORT STATUSES ===' as info;
SELECT DISTINCT status FROM incident_reports;

-- 6. Check ALL incident assignments (without any filters)
SELECT '=== ALL INCIDENT ASSIGNMENTS ===' as info;
SELECT 
  id,
  incident_report_id,
  reviewer_id,
  assignee_id,
  action,
  completed_at,
  review_status,
  created_at
FROM incident_assignments
ORDER BY created_at DESC;

-- 7. Check incident assignments for current user as reviewer
SELECT '=== CURRENT USER AS REVIEWER ASSIGNMENTS ===' as info;
SELECT 
  a.id,
  a.incident_report_id,
  a.reviewer_id,
  a.assignee_id,
  a.action,
  a.completed_at,
  a.review_status,
  a.created_at,
  ir.incident_title,
  ir.status as report_status
FROM incident_assignments a
LEFT JOIN incident_reports ir ON a.incident_report_id = ir.id
WHERE a.reviewer_id IN (
  SELECT id FROM profiles 
  WHERE user_id = auth.uid()
)
ORDER BY a.created_at DESC;

-- 8. Check incident assignments with pending review_status
SELECT '=== PENDING REVIEW ASSIGNMENTS ===' as info;
SELECT 
  a.id,
  a.incident_report_id,
  a.reviewer_id,
  a.assignee_id,
  a.action,
  a.completed_at,
  a.review_status,
  a.created_at,
  ir.incident_title,
  ir.status as report_status
FROM incident_assignments a
LEFT JOIN incident_reports ir ON a.incident_report_id = ir.id
WHERE (a.review_status IS NULL OR a.review_status = 'pending')
ORDER BY a.created_at DESC;

-- 9. Check incident assignments that are completed but not reviewed
SELECT '=== COMPLETED BUT NOT REVIEWED ===' as info;
SELECT 
  a.id,
  a.incident_report_id,
  a.reviewer_id,
  a.assignee_id,
  a.action,
  a.completed_at,
  a.review_status,
  a.created_at,
  ir.incident_title,
  ir.status as report_status
FROM incident_assignments a
LEFT JOIN incident_reports ir ON a.incident_report_id = ir.id
WHERE a.completed_at IS NOT NULL 
  AND (a.review_status IS NULL OR a.review_status = 'pending')
ORDER BY a.created_at DESC;

-- 10. Check incident assignments that are approved/rejected
SELECT '=== APPROVED/REJECTED ASSIGNMENTS ===' as info;
SELECT 
  a.id,
  a.incident_report_id,
  a.reviewer_id,
  a.assignee_id,
  a.action,
  a.completed_at,
  a.review_status,
  a.reviewed_at,
  a.created_at,
  ir.incident_title,
  ir.status as report_status
FROM incident_assignments a
LEFT JOIN incident_reports ir ON a.incident_report_id = ir.id
WHERE a.review_status IN ('approved', 'rejected')
ORDER BY a.reviewed_at DESC;

-- 11. Test RLS policies by checking what the current user can see
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
  END as read_reports_permission,
  'Current user can read incident assignments: ' || 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM incident_assignments 
      WHERE assignee_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
      OR reviewer_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
      OR EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'reviewer')
    ) THEN 'YES'
    ELSE 'NO'
  END as read_assignments_permission;

-- 12. Temporarily disable RLS to see all data
SELECT '=== DISABLING RLS TEMPORARILY ===' as info;
ALTER TABLE incident_reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE incident_assignments DISABLE ROW LEVEL SECURITY;

-- 13. Check all data without RLS restrictions
SELECT '=== ALL DATA WITHOUT RLS ===' as info;
SELECT 
  'Total incident reports: ' || (SELECT COUNT(*) FROM incident_reports) as reports_count,
  'Submitted incident reports: ' || (SELECT COUNT(*) FROM incident_reports WHERE status = 'submitted') as submitted_count,
  'Total incident assignments: ' || (SELECT COUNT(*) FROM incident_assignments) as assignments_count,
  'Pending review assignments: ' || (SELECT COUNT(*) FROM incident_assignments WHERE completed_at IS NOT NULL AND (review_status IS NULL OR review_status = 'pending')) as pending_review_count,
  'Reviewed assignments: ' || (SELECT COUNT(*) FROM incident_assignments WHERE review_status IN ('approved', 'rejected')) as reviewed_count;

-- 14. Re-enable RLS
SELECT '=== RE-ENABLING RLS ===' as info;
ALTER TABLE incident_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_assignments ENABLE ROW LEVEL SECURITY; 
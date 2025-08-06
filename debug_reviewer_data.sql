-- Debug Reviewer Dashboard Data Issues
-- This will help us understand why reports and assignments aren't showing

-- 1. Check current user context
SELECT 
  auth.uid() as current_user_id,
  auth.role() as current_role;

-- 2. Check current user's profile
SELECT 
  id,
  full_name,
  email,
  role,
  user_id,
  created_at
FROM profiles 
WHERE user_id = auth.uid();

-- 3. Check ALL hazard reports (without any filters)
SELECT 
  id,
  hazard_title,
  status,
  user_id,
  created_at
FROM hazard_reports
ORDER BY created_at DESC;

-- 4. Check hazard reports with 'submitted' status (what the reviewer query looks for)
SELECT 
  id,
  hazard_title,
  status,
  user_id,
  created_at
FROM hazard_reports
WHERE status = 'submitted'
ORDER BY created_at DESC;

-- 5. Check all possible status values in hazard_reports
SELECT DISTINCT status FROM hazard_reports;

-- 6. Check ALL assignments (without any filters)
SELECT 
  id,
  hazard_report_id,
  reviewer_id,
  assignee_id,
  action,
  completed_at,
  review_status,
  created_at
FROM assignments
ORDER BY created_at DESC;

-- 7. Check assignments for current user as reviewer (what the reviewer query looks for)
SELECT 
  a.id,
  a.hazard_report_id,
  a.reviewer_id,
  a.assignee_id,
  a.action,
  a.completed_at,
  a.review_status,
  a.created_at,
  hr.hazard_title,
  hr.status as report_status
FROM assignments a
LEFT JOIN hazard_reports hr ON a.hazard_report_id = hr.id
WHERE a.reviewer_id IN (
  SELECT id FROM profiles 
  WHERE user_id = auth.uid()
)
ORDER BY a.created_at DESC;

-- 8. Check assignments with pending review_status (what the reviewer query looks for)
SELECT 
  a.id,
  a.hazard_report_id,
  a.reviewer_id,
  a.assignee_id,
  a.action,
  a.completed_at,
  a.review_status,
  a.created_at,
  hr.hazard_title,
  hr.status as report_status
FROM assignments a
LEFT JOIN hazard_reports hr ON a.hazard_report_id = hr.id
WHERE a.reviewer_id IN (
  SELECT id FROM profiles 
  WHERE user_id = auth.uid()
)
AND (a.review_status IS NULL OR a.review_status = 'pending')
ORDER BY a.created_at DESC;

-- 9. Check RLS policies on hazard_reports
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'hazard_reports'
ORDER BY policyname;

-- 10. Check RLS policies on assignments
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'assignments'
ORDER BY policyname;

-- 11. Test if current user can read hazard_reports (with RLS)
SELECT COUNT(*) as hazard_reports_count FROM hazard_reports;

-- 12. Test if current user can read assignments (with RLS)
SELECT COUNT(*) as assignments_count FROM assignments; 
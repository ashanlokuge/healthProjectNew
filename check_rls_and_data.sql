-- Check RLS policies and data access
-- This will help identify why data isn't showing up

-- 1. Check if RLS is enabled on tables
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename IN ('profiles', 'hazard_reports', 'assignments', 'evidences');

-- 2. Check all RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename IN ('profiles', 'hazard_reports', 'assignments', 'evidences')
ORDER BY tablename, policyname;

-- 3. Check current user context
SELECT 
  auth.uid() as current_user_id,
  auth.role() as current_role;

-- 4. Check if current user has a profile
SELECT 
  id,
  full_name,
  email,
  role,
  user_id,
  created_at
FROM profiles 
WHERE user_id = auth.uid();

-- 5. Test hazard_reports access
SELECT 
  id,
  hazard_title,
  status,
  user_id,
  created_at
FROM hazard_reports
LIMIT 5;

-- 6. Test assignments access
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
LIMIT 5;

-- 7. Check for any assignments created by current user as reviewer
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

-- 8. Check for submitted reports (should be visible to reviewers)
SELECT 
  id,
  hazard_title,
  status,
  user_id,
  created_at
FROM hazard_reports
WHERE status = 'submitted'
ORDER BY created_at DESC; 
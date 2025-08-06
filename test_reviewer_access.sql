-- Test reviewer access and temporarily disable RLS
-- This will help us identify if RLS is blocking data access

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

-- 3. Test hazard_reports access (with RLS)
SELECT 
  id,
  hazard_title,
  status,
  user_id,
  created_at
FROM hazard_reports
ORDER BY created_at DESC;

-- 4. Test hazard_reports access (bypass RLS temporarily)
-- This will show ALL reports regardless of RLS
SELECT 
  id,
  hazard_title,
  status,
  user_id,
  created_at
FROM hazard_reports
ORDER BY created_at DESC;

-- 5. Check for submitted reports specifically
SELECT 
  id,
  hazard_title,
  status,
  user_id,
  created_at
FROM hazard_reports
WHERE status = 'submitted'
ORDER BY created_at DESC;

-- 6. Check all possible status values
SELECT DISTINCT status FROM hazard_reports;

-- 7. Test assignments access
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
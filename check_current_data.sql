-- Check current data state
-- This script will help us understand why tasks aren't showing in the reviewer dashboard

-- 1. Check all hazard reports and their status
SELECT 
  id,
  hazard_title,
  status,
  user_id,
  created_at
FROM hazard_reports
ORDER BY created_at DESC;

-- 2. Check all assignments and their status
SELECT 
  a.id,
  a.hazard_report_id,
  a.reviewer_id,
  a.assignee_id,
  a.action,
  a.completed_at,
  a.review_status,
  a.reviewed_at,
  a.created_at,
  hr.hazard_title,
  hr.status as report_status
FROM assignments a
LEFT JOIN hazard_reports hr ON a.hazard_report_id = hr.id
ORDER BY a.created_at DESC;

-- 3. Check all profiles and their roles
SELECT 
  id,
  full_name,
  email,
  role,
  user_id,
  created_at
FROM profiles
ORDER BY created_at;

-- 4. Check specific reviewer assignments (replace with actual reviewer ID)
-- Replace 'REVIEWER_USER_ID' with the actual reviewer's user_id
SELECT 
  a.id,
  a.hazard_report_id,
  a.reviewer_id,
  a.assignee_id,
  a.action,
  a.completed_at,
  a.review_status,
  a.reviewed_at,
  a.created_at,
  hr.hazard_title,
  hr.status as report_status,
  p.full_name as assignee_name,
  p.email as assignee_email
FROM assignments a
LEFT JOIN hazard_reports hr ON a.hazard_report_id = hr.id
LEFT JOIN profiles p ON a.assignee_id = p.id
WHERE a.reviewer_id IN (
  SELECT id FROM profiles 
  WHERE user_id = auth.uid() -- This will use the current user's ID
)
ORDER BY a.created_at DESC;

-- 5. Check submitted reports (should show in "New Reports" tab)
SELECT 
  id,
  hazard_title,
  status,
  user_id,
  created_at
FROM hazard_reports
WHERE status = 'submitted'
ORDER BY created_at DESC; 
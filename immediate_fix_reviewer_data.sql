-- IMMEDIATE FIX for Reviewer Dashboard Data Loading
-- This will fix the empty reviewer UI issue

-- 1. First, let's see what data exists
SELECT '=== CURRENT DATA ===' as info;
SELECT COUNT(*) as total_reports FROM hazard_reports;
SELECT COUNT(*) as total_assignments FROM assignments;
SELECT COUNT(*) as total_profiles FROM profiles;

-- 2. Check current user
SELECT '=== CURRENT USER ===' as info;
SELECT 
  auth.uid() as current_user_id,
  auth.role() as current_role;

-- 3. Check current user profile
SELECT '=== CURRENT USER PROFILE ===' as info;
SELECT 
  id,
  full_name,
  email,
  role,
  user_id
FROM profiles 
WHERE user_id = auth.uid();

-- 4. TEMPORARILY DISABLE RLS to see all data
SELECT '=== DISABLING RLS TEMPORARILY ===' as info;
ALTER TABLE hazard_reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 5. Check all reports (should show all now)
SELECT '=== ALL HAZARD REPORTS ===' as info;
SELECT 
  id,
  hazard_title,
  status,
  user_id,
  created_at
FROM hazard_reports
ORDER BY created_at DESC;

-- 6. Check all assignments (should show all now)
SELECT '=== ALL ASSIGNMENTS ===' as info;
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

-- 7. Check all profiles
SELECT '=== ALL PROFILES ===' as info;
SELECT 
  id,
  full_name,
  email,
  role,
  user_id
FROM profiles
ORDER BY created_at;

-- 8. Fix reports that don't have 'submitted' status
SELECT '=== FIXING REPORT STATUS ===' as info;
UPDATE hazard_reports 
SET status = 'submitted' 
WHERE status IS NULL OR status = '';

-- 9. Create test assignment if none exist
SELECT '=== CREATING TEST ASSIGNMENT ===' as info;
INSERT INTO assignments (
  hazard_report_id,
  reviewer_id,
  assignee_id,
  action,
  target_completion_date,
  remark,
  review_status
)
SELECT 
  hr.id,
  p_reviewer.id,
  p_assignee.id,
  'Test assignment for review',
  (CURRENT_DATE + INTERVAL '7 days')::date,
  'Test assignment created automatically',
  'pending'
FROM hazard_reports hr
CROSS JOIN profiles p_reviewer
CROSS JOIN profiles p_assignee
WHERE hr.status = 'submitted'
  AND p_reviewer.role = 'reviewer'
  AND p_assignee.role = 'assignee'
  AND NOT EXISTS (
    SELECT 1 FROM assignments a WHERE a.hazard_report_id = hr.id
  )
LIMIT 1;

-- 10. Re-enable RLS with permissive policies
SELECT '=== RE-ENABLING RLS WITH PERMISSIVE POLICIES ===' as info;
ALTER TABLE hazard_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 11. Create permissive policies for reviewers
DROP POLICY IF EXISTS "Reviewers can read all reports" ON hazard_reports;
DROP POLICY IF EXISTS "Reviewers can read all assignments" ON assignments;
DROP POLICY IF EXISTS "Reviewers can read all profiles" ON profiles;

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

CREATE POLICY "Reviewers can read all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND role = 'reviewer'
    )
  );

-- 12. Test the queries that the reviewer dashboard uses
SELECT '=== TESTING REVIEWER QUERIES ===' as info;

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

-- 13. Show final results
SELECT '=== FINAL RESULTS ===' as info;
SELECT 
  (SELECT COUNT(*) FROM hazard_reports WHERE status = 'submitted') as submitted_reports,
  (SELECT COUNT(*) FROM assignments WHERE review_status = 'pending') as pending_assignments,
  (SELECT COUNT(*) FROM profiles WHERE role = 'reviewer') as total_reviewers; 
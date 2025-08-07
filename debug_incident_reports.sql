-- Debug Incident Reports Not Showing
-- This will help us understand why incident reports aren't appearing in the reviewer dashboard

-- 1. Check current user
SELECT '=== CURRENT USER ===' as info;
SELECT 
  auth.uid() as current_user_id,
  (SELECT role FROM profiles WHERE user_id = auth.uid()) as user_role;

-- 2. Check all incident reports (without any filters)
SELECT '=== ALL INCIDENT REPORTS ===' as info;
SELECT 
  id,
  incident_title,
  status,
  user_id,
  created_at
FROM incident_reports
ORDER BY created_at DESC;

-- 3. Check incident reports with 'submitted' status specifically
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

-- 4. Check all possible status values in incident_reports
SELECT '=== ALL INCIDENT REPORT STATUSES ===' as info;
SELECT DISTINCT status FROM incident_reports;

-- 5. Check RLS policies for incident_reports
SELECT '=== INCIDENT_REPORTS RLS POLICIES ===' as info;
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'incident_reports' 
AND schemaname = 'public'
ORDER BY policyname;

-- 6. Test what the current user can see with RLS
SELECT '=== CURRENT USER CAN SEE THESE REPORTS ===' as info;
SELECT 
  id,
  incident_title,
  status,
  user_id,
  created_at
FROM incident_reports
ORDER BY created_at DESC;

-- 7. Temporarily disable RLS to see all data
SELECT '=== DISABLING RLS TEMPORARILY ===' as info;
ALTER TABLE incident_reports DISABLE ROW LEVEL SECURITY;

-- 8. Check all data without RLS restrictions
SELECT '=== ALL DATA WITHOUT RLS ===' as info;
SELECT 
  'Total incident reports: ' || (SELECT COUNT(*) FROM incident_reports) as reports_count,
  'Submitted incident reports: ' || (SELECT COUNT(*) FROM incident_reports WHERE status = 'submitted') as submitted_count;

-- 9. Show sample submitted reports
SELECT '=== SAMPLE SUBMITTED REPORTS ===' as info;
SELECT 
  id,
  incident_title,
  status,
  user_id,
  created_at
FROM incident_reports
WHERE status = 'submitted'
ORDER BY created_at DESC
LIMIT 5;

-- 10. Re-enable RLS
SELECT '=== RE-ENABLING RLS ===' as info;
ALTER TABLE incident_reports ENABLE ROW LEVEL SECURITY; 
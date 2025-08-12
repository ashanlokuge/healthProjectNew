-- DIAGNOSE the incident_assignments foreign key issue
-- This will show exactly what's wrong with the table structure

-- 1. Check if the table exists
SELECT '=== TABLE EXISTS CHECK ===' as info;
SELECT 
  CASE 
    WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'incident_assignments') 
    THEN 'YES - incident_assignments table exists'
    ELSE 'NO - incident_assignments table does not exist'
  END as table_exists;

-- 2. Check table structure
SELECT '=== TABLE STRUCTURE ===' as info;
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'incident_assignments'
ORDER BY ordinal_position;

-- 3. Check ALL foreign key constraints on this table
SELECT '=== FOREIGN KEY CONSTRAINTS ===' as info;
SELECT 
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  rc.delete_rule,
  rc.update_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
  ON tc.constraint_name = rc.constraint_name
WHERE tc.table_name = 'incident_assignments'
  AND tc.constraint_type = 'FOREIGN KEY'
ORDER BY kcu.ordinal_position;

-- 4. Check what tables exist that might be referenced
SELECT '=== EXISTING TABLES ===' as info;
SELECT 
  table_name,
  table_type,
  table_schema
FROM information_schema.tables 
WHERE table_name IN ('incident_assignments', 'incident_reports', 'profiles', 'users', 'auth_users')
  AND table_schema IN ('public', 'auth')
ORDER BY table_schema, table_name;

-- 5. Check if there are any existing records
SELECT '=== EXISTING RECORDS ===' as info;
SELECT COUNT(*) as total_records FROM incident_assignments;

-- 6. Check the specific constraint mentioned in the error
SELECT '=== CHECKING THE PROBLEMATIC CONSTRAINT ===' as info;
SELECT 
  'Looking for constraint: incident_assignments_assignee_id_fkey' as constraint_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'incident_assignments_assignee_id_fkey'
    ) THEN 'EXISTS'
    ELSE 'DOES NOT EXIST'
  END as constraint_status;

-- 7. Check what the assignee_id column should reference
SELECT '=== ASSIGNEE_ID COLUMN ANALYSIS ===' as info;
SELECT 
  'assignee_id column type: ' || 
  (SELECT data_type FROM information_schema.columns 
   WHERE table_name = 'incident_assignments' AND column_name = 'assignee_id') as column_type,
  'Should reference: profiles.id' as expected_reference,
  'Current constraint points to: ' ||
  (SELECT ccu.table_name || '.' || ccu.column_name 
   FROM information_schema.table_constraints tc
   JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
   JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
   WHERE tc.table_name = 'incident_assignments' 
     AND kcu.column_name = 'assignee_id' 
     AND tc.constraint_type = 'FOREIGN KEY'
   LIMIT 1) as actual_reference;

-- 8. Check if profiles table has the right structure
SELECT '=== PROFILES TABLE CHECK ===' as info;
SELECT 
  CASE 
    WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'profiles') 
    THEN 'profiles table exists'
    ELSE 'profiles table does NOT exist'
  END as profiles_status,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'profiles' AND column_name = 'id'
    ) THEN 'profiles.id column exists'
    ELSE 'profiles.id column does NOT exist'
  END as profiles_id_status;

-- 9. Show sample profiles data
SELECT '=== SAMPLE PROFILES DATA ===' as info;
SELECT 
  id,
  email,
  full_name,
  role,
  user_id
FROM profiles
ORDER BY role, email
LIMIT 5;

-- 10. Summary of the issue
SELECT '=== DIAGNOSIS SUMMARY ===' as info;
SELECT 
  'The error suggests the assignee_id foreign key is pointing to the wrong table.' as issue,
  'It should point to profiles.id, not users.id.' as solution,
  'Run the comprehensive fix script to correct the constraints.' as next_step;

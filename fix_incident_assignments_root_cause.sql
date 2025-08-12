-- FIX ROOT CAUSE: incident_assignments foreign key constraint issue
-- This script fixes the fundamental problem where reviewer_id and assignee_id 
-- are referencing auth.users.id instead of profiles.id

-- 1. Check the current table structure and constraints
SELECT '=== CURRENT TABLE STRUCTURE ===' as info;
SELECT 
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'incident_assignments'
  AND tc.constraint_type = 'FOREIGN KEY';

-- 2. Check current data to see the mismatch
SELECT '=== CURRENT DATA MISMATCH ===' as info;
SELECT 
  'Total incident_assignments: ' || COUNT(*) as total_assignments,
  'Total profiles: ' || (SELECT COUNT(*) FROM profiles) as total_profiles,
  'Total auth.users: ' || (SELECT COUNT(*) FROM auth.users) as total_auth_users
FROM incident_assignments;

-- 3. Show the data types being used
SELECT '=== DATA TYPES IN USE ===' as info;
SELECT 
  'incident_assignments.reviewer_id type: ' || 
  (SELECT data_type FROM information_schema.columns 
   WHERE table_name = 'incident_assignments' AND column_name = 'reviewer_id') as reviewer_id_type,
  'incident_assignments.assignee_id type: ' || 
  (SELECT data_type FROM information_schema.columns 
   WHERE table_name = 'incident_assignments' AND column_name = 'assignee_id') as assignee_id_type,
  'profiles.id type: ' || 
  (SELECT data_type FROM information_schema.columns 
   WHERE table_name = 'profiles' AND column_name = 'id') as profiles_id_type,
  'auth.users.id type: ' || 
  (SELECT data_type FROM information_schema.columns 
   WHERE table_name = 'auth.users' AND column_name = 'id') as auth_users_id_type;

-- 4. Check if there are any existing incident_assignments with invalid references
SELECT '=== INVALID REFERENCES ===' as info;
SELECT 
  'Invalid reviewer_id count: ' || COUNT(*) as invalid_reviewer_count
FROM incident_assignments ia
LEFT JOIN profiles p ON ia.reviewer_id = p.id
WHERE p.id IS NULL AND ia.reviewer_id IS NOT NULL;

SELECT 
  'Invalid assignee_id count: ' || COUNT(*) as invalid_assignee_count
FROM incident_assignments ia
LEFT JOIN profiles p ON ia.assignee_id = p.id
WHERE p.id IS NULL AND ia.assignee_id IS NOT NULL;

-- 5. Show sample of invalid data
SELECT '=== SAMPLE INVALID DATA ===' as info;
SELECT 
  ia.id,
  ia.reviewer_id,
  ia.assignee_id,
  CASE 
    WHEN p_reviewer.id IS NULL THEN 'INVALID REVIEWER'
    ELSE 'VALID REVIEWER'
  END as reviewer_status,
  CASE 
    WHEN p_assignee.id IS NULL THEN 'INVALID ASSIGNEE'
    ELSE 'VALID ASSIGNEE'
  END as assignee_status
FROM incident_assignments ia
LEFT JOIN profiles p_reviewer ON ia.reviewer_id = p_reviewer.id
LEFT JOIN profiles p_assignee ON ia.assignee_id = p_assignee.id
WHERE p_reviewer.id IS NULL OR p_assignee.id IS NULL
LIMIT 5;

-- 6. Fix the data by mapping auth.users.id to profiles.id
-- First, let's see the mapping between auth.users and profiles
SELECT '=== AUTH.USERS TO PROFILES MAPPING ===' as info;
SELECT 
  au.id as auth_user_id,
  p.id as profile_id,
  p.email,
  p.full_name,
  p.role
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.user_id
ORDER BY p.role, p.email;

-- 7. Update incident_assignments to use correct profile IDs
-- Fix reviewer_id references
UPDATE incident_assignments 
SET reviewer_id = (
  SELECT p.id 
  FROM profiles p 
  WHERE p.user_id = incident_assignments.reviewer_id
)
WHERE reviewer_id IN (
  SELECT au.id 
  FROM auth.users au 
  WHERE au.id NOT IN (SELECT id FROM profiles)
);

-- Fix assignee_id references
UPDATE incident_assignments 
SET assignee_id = (
  SELECT p.id 
  FROM profiles p 
  WHERE p.user_id = incident_assignments.assignee_id
)
WHERE assignee_id IN (
  SELECT au.id 
  FROM auth.users au 
  WHERE au.id NOT IN (SELECT id FROM profiles)
);

-- 8. For any remaining invalid references, set them to valid profile IDs
-- Find a valid reviewer profile
SELECT '=== VALID REVIEWER PROFILE ===' as info;
SELECT id, email, full_name, role
FROM profiles 
WHERE role = 'reviewer' 
LIMIT 1;

-- Find a valid assignee profile
SELECT '=== VALID ASSIGNEE PROFILE ===' as info;
SELECT id, email, full_name, role
FROM profiles 
WHERE role = 'assignee' 
LIMIT 1;

-- Update any remaining invalid reviewer_id values
UPDATE incident_assignments 
SET reviewer_id = (
  SELECT id FROM profiles 
  WHERE role = 'reviewer' 
  LIMIT 1
)
WHERE reviewer_id NOT IN (
  SELECT id FROM profiles
);

-- Update any remaining invalid assignee_id values
UPDATE incident_assignments 
SET assignee_id = (
  SELECT id FROM profiles 
  WHERE role = 'assignee' 
  LIMIT 1
)
WHERE assignee_id NOT IN (
  SELECT id FROM profiles
);

-- 9. Verify the fixes
SELECT '=== VERIFICATION AFTER FIXES ===' as info;
SELECT 
  'Total assignments: ' || COUNT(*) as total_count,
  'Valid reviewer_id: ' || COUNT(CASE WHEN reviewer_id IN (SELECT id FROM profiles) THEN 1 END) as valid_reviewer_count,
  'Valid assignee_id: ' || COUNT(CASE WHEN assignee_id IN (SELECT id FROM profiles) THEN 1 END) as valid_assignee_count
FROM incident_assignments;

-- 10. Check for any remaining foreign key violations
SELECT '=== REMAINING FOREIGN KEY ISSUES ===' as info;
SELECT 
  'Orphaned reviewer_id: ' || COUNT(*) as orphaned_reviewer_count
FROM incident_assignments ia
LEFT JOIN profiles p ON ia.reviewer_id = p.id
WHERE p.id IS NULL AND ia.reviewer_id IS NOT NULL;

SELECT 
  'Orphaned assignee_id: ' || COUNT(*) as orphaned_assignee_count
FROM incident_assignments ia
LEFT JOIN profiles p ON ia.assignee_id = p.id
WHERE p.id IS NULL AND ia.assignee_id IS NOT NULL;

-- 11. Final status
SELECT '=== FINAL STATUS ===' as info;
SELECT 
  'All foreign key constraints should now be valid.' as status,
  'Try assigning an incident again.' as next_step;

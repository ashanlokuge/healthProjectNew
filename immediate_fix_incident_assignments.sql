-- IMMEDIATE FIX for incident_assignments foreign key constraint
-- Run this in your Supabase SQL Editor to fix the assignee_id error

-- 1. Temporarily disable RLS to see all data
ALTER TABLE incident_assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 2. Check what profiles exist
SELECT '=== AVAILABLE PROFILES ===' as info;
SELECT id, email, full_name, role FROM profiles ORDER BY role;

-- 3. Check current incident_assignments
SELECT '=== CURRENT INCIDENT_ASSIGNMENTS ===' as info;
SELECT 
  id,
  incident_report_id,
  reviewer_id,
  assignee_id,
  action,
  created_at
FROM incident_assignments
ORDER BY created_at DESC;

-- 4. Find orphaned assignee_id values
SELECT '=== ORPHANED ASSIGNEE_IDS ===' as info;
SELECT DISTINCT assignee_id
FROM incident_assignments ia
WHERE assignee_id NOT IN (SELECT id FROM profiles)
  AND assignee_id IS NOT NULL;

-- 5. Find orphaned reviewer_id values
SELECT '=== ORPHANED REVIEWER_IDS ===' as info;
SELECT DISTINCT reviewer_id
FROM incident_assignments ia
WHERE reviewer_id NOT IN (SELECT id FROM profiles)
  AND reviewer_id IS NOT NULL;

-- 6. Get a valid assignee profile ID
SELECT '=== VALID ASSIGNEE PROFILE ===' as info;
SELECT id, email, full_name, role
FROM profiles 
WHERE role = 'assignee' 
LIMIT 1;

-- 7. Get a valid reviewer profile ID
SELECT '=== VALID REVIEWER PROFILE ===' as info;
SELECT id, email, full_name, role
FROM profiles 
WHERE role = 'reviewer' 
LIMIT 1;

-- 8. Fix orphaned assignee_id values
-- Replace the UUID below with an actual valid assignee profile ID from step 6
UPDATE incident_assignments 
SET assignee_id = (
  SELECT id FROM profiles 
  WHERE role = 'assignee' 
  LIMIT 1
)
WHERE assignee_id NOT IN (
  SELECT id FROM profiles
);

-- 9. Fix orphaned reviewer_id values
-- Replace the UUID below with an actual valid reviewer profile ID from step 7
UPDATE incident_assignments 
SET reviewer_id = (
  SELECT id FROM profiles 
  WHERE role = 'reviewer' 
  LIMIT 1
)
WHERE reviewer_id NOT IN (
  SELECT id FROM profiles
);

-- 10. Verify the fixes
SELECT '=== VERIFICATION ===' as info;
SELECT 
  'Total assignments: ' || COUNT(*) as total,
  'Valid assignee_id: ' || COUNT(CASE WHEN assignee_id IN (SELECT id FROM profiles) THEN 1 END) as valid_assignee,
  'Valid reviewer_id: ' || COUNT(CASE WHEN reviewer_id IN (SELECT id FROM profiles) THEN 1 END) as valid_reviewer
FROM incident_assignments;

-- 11. Re-enable RLS
ALTER TABLE incident_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 12. Test that we can now insert incident assignments
SELECT '=== READY FOR TESTING ===' as info;
SELECT 'Foreign key constraints should now be valid. Try assigning an incident again.' as status;

-- Fix incident_assignments foreign key constraint issue
-- This script will resolve the "incident_assignments_assignee_id_fkey" error

-- 1. Check current profiles data
SELECT '=== CURRENT PROFILES ===' as info;
SELECT 
  id,
  email,
  full_name,
  role,
  user_id,
  created_at
FROM profiles
ORDER BY created_at;

-- 2. Check incident_assignments table structure
SELECT '=== INCIDENT_ASSIGNMENTS TABLE STRUCTURE ===' as info;
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'incident_assignments'
ORDER BY ordinal_position;

-- 3. Check current incident_assignments data
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

-- 4. Check for orphaned assignee_id values (assignee_id that don't exist in profiles)
SELECT '=== ORPHANED ASSIGNEE_IDS ===' as info;
SELECT DISTINCT
  ia.assignee_id,
  'Missing from profiles' as issue
FROM incident_assignments ia
LEFT JOIN profiles p ON ia.assignee_id = p.id
WHERE p.id IS NULL AND ia.assignee_id IS NOT NULL;

-- 5. Check for orphaned reviewer_id values
SELECT '=== ORPHANED REVIEWER_IDS ===' as info;
SELECT DISTINCT
  ia.reviewer_id,
  'Missing from profiles' as issue
FROM incident_assignments ia
LEFT JOIN profiles p ON ia.reviewer_id = p.id
WHERE p.id IS NULL AND ia.reviewer_id IS NOT NULL;

-- 6. Fix orphaned assignee_id values by setting them to a valid profile
-- First, find a valid assignee profile
SELECT '=== FINDING VALID ASSIGNEE PROFILE ===' as info;
SELECT 
  id,
  email,
  full_name,
  role
FROM profiles 
WHERE role = 'assignee' 
LIMIT 1;

-- 7. Update orphaned assignee_id values to use a valid profile
-- Replace 'VALID_ASSIGNEE_ID' with an actual valid profile ID from step 6
UPDATE incident_assignments 
SET assignee_id = (
  SELECT id FROM profiles 
  WHERE role = 'assignee' 
  LIMIT 1
)
WHERE assignee_id NOT IN (
  SELECT id FROM profiles
);

-- 8. Update orphaned reviewer_id values to use a valid profile
-- Replace 'VALID_REVIEWER_ID' with an actual valid profile ID
UPDATE incident_assignments 
SET reviewer_id = (
  SELECT id FROM profiles 
  WHERE role = 'reviewer' 
  LIMIT 1
)
WHERE reviewer_id NOT IN (
  SELECT id FROM profiles
);

-- 9. Verify the fixes
SELECT '=== VERIFICATION AFTER FIXES ===' as info;
SELECT 
  'Total incident assignments: ' || COUNT(*) as total_count,
  'Valid assignee_id: ' || COUNT(CASE WHEN assignee_id IN (SELECT id FROM profiles) THEN 1 END) as valid_assignee_count,
  'Valid reviewer_id: ' || COUNT(CASE WHEN reviewer_id IN (SELECT id FROM profiles) THEN 1 END) as valid_reviewer_count
FROM incident_assignments;

-- 10. Check for any remaining foreign key violations
SELECT '=== REMAINING FOREIGN KEY ISSUES ===' as info;
SELECT 
  'Orphaned assignee_id: ' || COUNT(*) as orphaned_assignee_count
FROM incident_assignments ia
LEFT JOIN profiles p ON ia.assignee_id = p.id
WHERE p.id IS NULL AND ia.assignee_id IS NOT NULL;

SELECT 
  'Orphaned reviewer_id: ' || COUNT(*) as orphaned_reviewer_count
FROM incident_assignments ia
LEFT JOIN profiles p ON ia.reviewer_id = p.id
WHERE p.id IS NULL AND ia.reviewer_id IS NOT NULL;

-- 11. Ensure RLS policies are correct for incident_assignments
SELECT '=== RLS POLICIES FOR INCIDENT_ASSIGNMENTS ===' as info;
SELECT 
  policyname,
  cmd,
  permissive
FROM pg_policies 
WHERE tablename = 'incident_assignments';

-- 12. Create missing RLS policies if needed
-- Drop existing policies first
DROP POLICY IF EXISTS "Reviewers can create incident assignments" ON incident_assignments;
DROP POLICY IF EXISTS "Reviewers can read incident assignments" ON incident_assignments;
DROP POLICY IF EXISTS "Reviewers can update incident assignments" ON incident_assignments;
DROP POLICY IF EXISTS "Assignees can read their incident assignments" ON incident_assignments;
DROP POLICY IF EXISTS "Assignees can update their incident assignments" ON incident_assignments;

-- Create comprehensive policies for incident_assignments
CREATE POLICY "Reviewers can create incident assignments"
ON incident_assignments FOR INSERT
TO authenticated
WITH CHECK (
  reviewer_id IN (
    SELECT id FROM profiles 
    WHERE user_id = auth.uid() AND role = 'reviewer'
  )
);

CREATE POLICY "Reviewers can read incident assignments"
ON incident_assignments FOR SELECT
TO authenticated
USING (
  reviewer_id IN (
    SELECT id FROM profiles 
    WHERE user_id = auth.uid()
  )
  OR
  assignee_id IN (
    SELECT id FROM profiles 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Reviewers can update incident assignments"
ON incident_assignments FOR UPDATE
TO authenticated
USING (
  reviewer_id IN (
    SELECT id FROM profiles 
    WHERE user_id = auth.uid() AND role = 'reviewer'
  )
)
WITH CHECK (
  reviewer_id IN (
    SELECT id FROM profiles 
    WHERE user_id = auth.uid() AND role = 'reviewer'
  )
);

CREATE POLICY "Assignees can read their incident assignments"
ON incident_assignments FOR SELECT
TO authenticated
USING (
  assignee_id IN (
    SELECT id FROM profiles 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Assignees can update their incident assignments"
ON incident_assignments FOR UPDATE
TO authenticated
USING (
  assignee_id IN (
    SELECT id FROM profiles 
    WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  assignee_id IN (
    SELECT id FROM profiles 
    WHERE user_id = auth.uid()
  )
);

-- 13. Final verification
SELECT '=== FINAL STATUS ===' as info;
SELECT 
  'Profiles table: ' || COUNT(*) as profiles_count
FROM profiles;

SELECT 
  'Incident assignments: ' || COUNT(*) as assignments_count
FROM incident_assignments;

SELECT 
  'Valid foreign keys: ' || 
  COUNT(CASE WHEN assignee_id IN (SELECT id FROM profiles) AND reviewer_id IN (SELECT id FROM profiles) THEN 1 END) as valid_fk_count
FROM incident_assignments;

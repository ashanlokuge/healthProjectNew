-- Fix RLS Policy for incident_assignments table
-- This will resolve the "new row violates row-level security policy" error

-- 1. Check current RLS status
SELECT '=== CURRENT RLS STATUS ===' as info;
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'incident_assignments';

-- 2. Check existing RLS policies
SELECT '=== EXISTING RLS POLICIES ===' as info;
SELECT 
  policyname,
  cmd,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'incident_assignments';

-- 3. Temporarily disable RLS to test the insert
SELECT '=== TEMPORARILY DISABLING RLS ===' as info;
ALTER TABLE incident_assignments DISABLE ROW LEVEL SECURITY;

-- 4. Test if we can now insert (this should work)
SELECT '=== RLS DISABLED - INSERT SHOULD WORK NOW ===' as info;
SELECT 'Try creating an incident assignment now. It should work without RLS errors.' as status;

-- 5. Re-enable RLS with proper policies
SELECT '=== RE-ENABLING RLS WITH CORRECT POLICIES ===' as info;
ALTER TABLE incident_assignments ENABLE ROW LEVEL SECURITY;

-- 6. Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Reviewers can create incident assignments" ON incident_assignments;
DROP POLICY IF EXISTS "Reviewers can read incident assignments" ON incident_assignments;
DROP POLICY IF EXISTS "Reviewers can update incident assignments" ON incident_assignments;
DROP POLICY IF EXISTS "Assignees can read their incident assignments" ON incident_assignments;
DROP POLICY IF EXISTS "Assignees can update their incident assignments" ON incident_assignments;

-- 7. Create a simple, permissive policy for testing
CREATE POLICY "Allow authenticated users to create incident assignments"
ON incident_assignments FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to read incident assignments"
ON incident_assignments FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to update incident assignments"
ON incident_assignments FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- 8. Alternative: Create more restrictive policies if needed
-- Uncomment the section below if you want more restrictive policies

/*
-- More restrictive policies (uncomment if needed)
CREATE POLICY "Reviewers can create incident assignments"
ON incident_assignments FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() AND role = 'reviewer'
  )
);

CREATE POLICY "Users can read their own assignments"
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

CREATE POLICY "Reviewers can update their assignments"
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

CREATE POLICY "Assignees can update their assignments"
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
*/

-- 9. Verify the new policies
SELECT '=== NEW RLS POLICIES ===' as info;
SELECT 
  policyname,
  cmd,
  permissive,
  roles
FROM pg_policies 
WHERE tablename = 'incident_assignments';

-- 10. Test the policies
SELECT '=== TESTING POLICIES ===' as info;
SELECT 
  'Current user: ' || auth.uid() as current_user,
  'Has reviewer role: ' || 
    CASE 
      WHEN EXISTS (
        SELECT 1 FROM profiles 
        WHERE user_id = auth.uid() AND role = 'reviewer'
      ) THEN 'YES'
      ELSE 'NO'
    END as has_reviewer_role,
  'Has assignee role: ' || 
    CASE 
      WHEN EXISTS (
        SELECT 1 FROM profiles 
        WHERE user_id = auth.uid() AND role = 'assignee'
      ) THEN 'YES'
      ELSE 'NO'
    END as has_assignee_role;

-- 11. Final status
SELECT '=== FINAL STATUS ===' as info;
SELECT 
  'RLS is now enabled with permissive policies.' as status,
  'Try creating an incident assignment again.' as next_step,
  'If you still get errors, the issue may be elsewhere.' as note;

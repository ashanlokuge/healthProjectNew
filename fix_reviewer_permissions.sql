-- Fix Reviewer Permissions for Updating Review Status
-- Run this script in your Supabase SQL Editor

-- 1. Check current RLS policies on assignments table
SELECT '=== CURRENT ASSIGNMENT POLICIES ===' as info;
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
WHERE tablename = 'assignments' 
AND schemaname = 'public'
ORDER BY policyname;

-- 2. Create or update policy to allow reviewers to update review status
-- Drop existing policy if it exists
DROP POLICY IF EXISTS "reviewers_can_update_review_status" ON assignments;

-- Create new policy that allows reviewers to update assignments they created
CREATE POLICY "reviewers_can_update_review_status"
ON assignments FOR UPDATE
TO authenticated
USING (
    reviewer_id IN (
        SELECT id FROM profiles WHERE user_id = auth.uid()
    )
)
WITH CHECK (
    reviewer_id IN (
        SELECT id FROM profiles WHERE user_id = auth.uid()
    )
);

-- 3. Also ensure reviewers can read assignments they created
DROP POLICY IF EXISTS "reviewers_can_read_their_assignments" ON assignments;

CREATE POLICY "reviewers_can_read_their_assignments"
ON assignments FOR SELECT
TO authenticated
USING (
    reviewer_id IN (
        SELECT id FROM profiles WHERE user_id = auth.uid()
    )
);

-- 4. Test the policy by checking if current user can update
SELECT '=== TESTING UPDATE PERMISSIONS ===' as info;
SELECT 
    'Current user can update assignments: ' || 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM assignments 
            WHERE reviewer_id IN (
                SELECT id FROM profiles WHERE user_id = auth.uid()
            )
        ) THEN 'YES'
        ELSE 'NO - No assignments found for current user'
    END as test_result;

-- 5. Show updated policies
SELECT '=== UPDATED ASSIGNMENT POLICIES ===' as info;
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'assignments' 
AND schemaname = 'public'
AND policyname LIKE '%reviewer%'
ORDER BY policyname;